/* ============================================================
   EDGE FUNCTION: clientes do Asaas

   Existe por um motivo só: a chave do Asaas é uma chave de produção
   de meio de pagamento e não pode ir para o front. O servidor Node
   em server.js resolvia isso em localhost, mas no GitHub Pages não
   existe servidor, então a sincronização morria no ar.

   Roda no projeto Supabase que o app já usa, no plano Free.

   Deploy:
     npx supabase functions deploy asaas-clientes --project-ref fmisqevbtyuynetakdhi
     npx supabase secrets set ASAAS_API_KEY=... --project-ref fmisqevbtyuynetakdhi

   Ou pelo painel: Edge Functions > Deploy a new function (cole este
   arquivo) e Edge Functions > Secrets para a ASAAS_API_KEY.
   ============================================================ */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ASAAS_BASE = 'https://api.asaas.com/v3';
const LIMITE_PAGINA = 100;
const MAX_PAGINAS = 50; // trava de segurança, 5000 clientes

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function responder(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

interface ClienteAsaas {
  id: string;
  dateCreated?: string;
  deleted?: boolean;
  name?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  address?: string;
  addressNumber?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

/* Mesma conversão que o front fazia, movida para cá para que exista
   em um lugar só. tipo_pessoa sai do tamanho do documento: 11 dígitos
   é CPF, acima disso é CNPJ. */
function converter(c: ClienteAsaas) {
  const digitos = (c.cpfCnpj || '').replace(/\D/g, '');
  return {
    id: c.id,
    nome: (c.name || '').trim(),
    email: c.email || '',
    telefone: c.mobilePhone || c.phone || '',
    documento: c.cpfCnpj || '',
    tipo_pessoa: digitos.length > 11 ? 'PJ' : 'PF',
    endereco: [c.address, c.addressNumber].filter(Boolean).join(', '),
    cidade: c.city || '',
    uf: c.state || '',
    cep: c.postalCode || '',
  };
}

/* ---------------------------------------------------------------------------
   Quem ainda é cliente.

   O objeto cliente do Asaas NÃO tem campo de ativo ou inativo: tem só
   `deleted`, e cliente que parou de pagar não é deletado, continua na
   lista para sempre. Era por isso que a sincronização trazia de volta
   gente que saiu há tempos.

   O que diz se alguém ainda é cliente é a ASSINATURA, cujo `status` é
   ACTIVE, EXPIRED ou INACTIVE. Ler uma por cliente seriam dezenas de
   requisições, então aqui lê a lista inteira de assinaturas paginada e
   agrupa por cliente: duas ou três chamadas para a carteira toda.

   Um cliente pode ter mais de uma assinatura (trocou de plano, ou tem
   site e tráfego separados). Vale a melhor: basta uma ACTIVE para ele
   contar como ativo.
   --------------------------------------------------------------------------- */

interface AssinaturaAsaas {
  customer?: string;
  status?: string;
  deleted?: boolean;
}

const ORDEM_STATUS: Record<string, number> = { INACTIVE: 1, EXPIRED: 2, ACTIVE: 3 };

async function lerAssinaturas(chave: string): Promise<Record<string, string> | null> {
  const porCliente: Record<string, string> = {};
  let offset = 0;

  try {
    for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
      const resposta = await fetch(
        `${ASAAS_BASE}/subscriptions?limit=${LIMITE_PAGINA}&offset=${offset}`,
        { headers: { access_token: chave, 'Content-Type': 'application/json' } },
      );

      /* Falha aqui NÃO derruba a sincronização: sem assinatura a tela
         ainda consegue filtrar por mês de cadastro, e é melhor entregar
         meia informação com o aviso do que não entregar nada. */
      if (!resposta.ok) return null;

      const dados = await resposta.json();
      for (const a of (dados.data ?? []) as AssinaturaAsaas[]) {
        if (!a.customer || a.deleted) continue;
        const novo = a.status ?? 'INACTIVE';
        const atual = porCliente[a.customer];
        if (!atual || (ORDEM_STATUS[novo] ?? 0) > (ORDEM_STATUS[atual] ?? 0)) {
          porCliente[a.customer] = novo;
        }
      }

      if (!dados.hasMore) break;
      offset += LIMITE_PAGINA;
    }
  } catch {
    return null;
  }

  return porCliente;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const chaveAsaas = Deno.env.get('ASAAS_API_KEY');
  if (!chaveAsaas) {
    return responder({ sucesso: false, erro: 'ASAAS_API_KEY não configurada nos secrets da função.' }, 500);
  }

  const autorizacao = req.headers.get('Authorization');
  if (!autorizacao) return responder({ sucesso: false, erro: 'Sem credencial.' }, 401);

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: autorizacao } } },
  );

  const { data: { user }, error: erroAuth } = await sb.auth.getUser();
  if (erroAuth || !user) return responder({ sucesso: false, erro: 'Credencial inválida.' }, 401);

  /* A sincronização grava em `clientes`, que o RLS restringe a admin.
     Conferir o papel aqui evita disparar dezenas de gravações que o
     banco vai recusar uma por uma, e devolve um erro que faz sentido. */
  const { data: perfil } = await sb
    .from('usuarios')
    .select('papel, ativo')
    .eq('id', user.id)
    .maybeSingle();

  if (!perfil?.ativo || perfil.papel !== 'admin') {
    return responder({ sucesso: false, erro: 'Só administrador pode sincronizar.' }, 403);
  }

  /* O Asaas pagina de 100 em 100. O server.js antigo pedia limit=100
     e ignorava o campo hasMore, então acima de 100 clientes a
     sincronização truncava sem avisar. */
  const brutos: ClienteAsaas[] = [];
  let offset = 0;
  let truncou = false;

  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const resposta = await fetch(
      `${ASAAS_BASE}/customers?limit=${LIMITE_PAGINA}&offset=${offset}`,
      { headers: { access_token: chaveAsaas, 'Content-Type': 'application/json' } },
    );

    if (!resposta.ok) {
      const detalhe = resposta.status === 401
        ? 'chave do Asaas recusada, confira o secret ASAAS_API_KEY'
        : `Asaas respondeu ${resposta.status}`;
      return responder({ sucesso: false, erro: detalhe }, 502);
    }

    const dados = await resposta.json();
    brutos.push(...(dados.data ?? []));

    if (!dados.hasMore) break;
    offset += LIMITE_PAGINA;
    if (pagina === MAX_PAGINAS - 1) truncou = true;
  }

  const assinaturas = await lerAssinaturas(chaveAsaas);

  /* `clientes` continua com exatamente as colunas da tabela, para o
     upsert não quebrar com coluna desconhecida. Tudo que serve só para
     a tela de escolha vai em `extras`, separado de propósito. */
  const extras: Record<string, { cadastro: string; removido: boolean; assinatura: string | null }> = {};
  for (const c of brutos) {
    extras[c.id] = {
      cadastro: c.dateCreated ?? '',
      removido: Boolean(c.deleted),
      assinatura: assinaturas ? (assinaturas[c.id] ?? null) : null,
    };
  }

  return responder({
    sucesso: true,
    total: brutos.length,
    truncou,
    clientes: brutos.map(converter),
    extras,
    assinaturasLidas: assinaturas !== null,
  });
});
