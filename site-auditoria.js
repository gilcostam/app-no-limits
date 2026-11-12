/* ============================================================
   VERIFICAÇÃO AUTOMÁTICA DO SITE

   A aba Site tem 52 itens. Boa parte deles não é julgamento, é leitura:
   se existe canonical, se o robots.txt cita os robôs de IA, se o og:image
   tem 1200x630, se alguma imagem ficou sem alt. Isso um programa lê da
   URL, e ler 31 itens de graça é tirar 31 linhas da lista de quem precisa
   pensar nos outros 21.

   O veredito NÃO marca o checkbox, e isso é escolha, não preguiça. Se o
   robô marcasse sozinho e errasse, o item ficaria resolvido para sempre
   sem ninguém ter olhado, que é pior do que não ter robô nenhum. Então
   ele mostra o que mediu, ao lado do item, com o número na mão, e quem
   marca continua sendo a pessoa.

   Quem lê o site é o app de avaliações, não este arquivo. Navegador não
   busca HTML de outro domínio, e este painel é estático no GitHub Pages,
   sem servidor. A autenticação é a mesma do queda-gmb.js: o access token
   do Supabase que o login daqui já tem, conferido do outro lado contra as
   chaves públicas deste mesmo projeto. Por isso não há segredo nenhum
   neste arquivo, o que é bom, porque ele é servido aberto.

   Ver src/lib/auditoria-site.ts e src/app/api/auditoria-site/route.ts no
   nolimits-reviews.
   ============================================================ */

const AUDITORIA_API = 'https://nolimits-reviews.vercel.app/api/auditoria-site';

const AUDITORIA_ROTULO = {
  ok: 'ok',
  falha: 'falha',
  atencao: 'atenção',
  nao_verificado: 'não li',
  humano: 'pessoa',
};

const Auditoria = {
  /* clienteId -> { estado, dados, erro }
     estado: 'nao_carregado' | 'carregando' | 'rodando' | 'ok' | 'sem_perfil' | 'nunca' | 'erro' */
  porCliente: {},

  estadoDe(clienteId) {
    return this.porCliente[clienteId] || { estado: 'nao_carregado' };
  },

  /* O cliente daqui tem id do Asaas, o perfil lá tem id do BusinessProfile.
     O vínculo já está escrito e conferido em relatorio-gmb.js, então é de
     lá que ele vem: uma segunda tabela de vínculo discordaria da primeira
     na primeira vez que alguém atualizasse só uma. */
  perfilDe(clienteId) {
    if (typeof RELATORIO_PERFIS !== 'object') return null;
    return RELATORIO_PERFIS[clienteId] || null;
  },

  /* item -> { veredito, prova }, para montarItemSite consultar. */
  itemDe(clienteId, itemId) {
    const e = this.estadoDe(clienteId);
    if (e.estado !== 'ok' || !e.dados || !Array.isArray(e.dados.itens)) return null;
    return e.dados.itens.find(i => i.id === itemId) || null;
  },

  async carregar(clienteId, agora = false) {
    const atual = this.estadoDe(clienteId);
    /* Uma leitura por cliente por visita à aba. O cron grava uma vez por
       dia, então refazer a chamada a cada troca de cliente seria rede
       gasta para receber a mesma resposta. O botão passa agora=true e
       fura o cache de propósito. */
    if (!agora && (atual.estado === 'carregando' || atual.estado === 'rodando' || atual.estado === 'ok')) return;

    const perfil = this.perfilDe(clienteId);
    if (!perfil) {
      this.porCliente[clienteId] = {
        estado: 'sem_perfil',
        erro: 'Este cliente não está vinculado a um perfil no app de avaliações. O vínculo fica em relatorio-gmb.js.',
      };
      renderizarSite();
      return;
    }

    if (!sb) {
      this.porCliente[clienteId] = { estado: 'erro', erro: 'Exige o Supabase conectado.' };
      renderizarSite();
      return;
    }

    this.porCliente[clienteId] = { estado: agora ? 'rodando' : 'carregando' };
    renderizarSite();

    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) throw new Error('Entre com seu acesso para ver a verificação.');

      const url = `${AUDITORIA_API}?businessId=${encodeURIComponent(perfil)}${agora ? '&agora=1' : ''}`;
      const resposta = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!resposta.ok) {
        if (resposta.status === 401) throw new Error('Sessão expirada. Saia e entre de novo.');
        const corpo = await resposta.json().catch(() => ({}));
        throw new Error(corpo.erro || `Falha ao buscar (${resposta.status}).`);
      }

      const corpo = await resposta.json();

      if (corpo.aindaNaoVerificado) {
        this.porCliente[clienteId] = { estado: 'nunca', dados: null };
      } else {
        this.porCliente[clienteId] = { estado: 'ok', dados: corpo };
      }
    } catch (e) {
      this.porCliente[clienteId] = { estado: 'erro', erro: e.message || 'Falha ao verificar o site.' };
    }

    renderizarSite();
  },
};

/* "há 3 horas" em vez de um ISO. A pergunta que a pessoa faz olhando a
   barra é "isso é de hoje?", e data crua não responde sem conta mental. */
function auditoriaQuando(iso) {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return 'em data desconhecida';
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 2) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

/* Barra no topo do painel do cliente: o que a última leitura achou e o
   botão para ler de novo. */
function montarBarraAuditoria(clienteId) {
  const e = Auditoria.estadoDe(clienteId);

  const div = document.createElement('div');
  div.className = 'auditoria-barra';

  const texto = document.createElement('div');
  texto.className = 'auditoria-texto';

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'auditoria-botao';
  botao.textContent = 'Verificar agora';
  botao.addEventListener('click', () => Auditoria.carregar(clienteId, true));

  if (e.estado === 'carregando') {
    texto.textContent = 'Buscando a última verificação...';
    botao.disabled = true;
  } else if (e.estado === 'rodando') {
    texto.textContent = 'Lendo o site agora. Leva uns 5 segundos.';
    botao.disabled = true;
  } else if (e.estado === 'sem_perfil' || e.estado === 'erro') {
    div.classList.add('auditoria-barra-erro');
    texto.textContent = e.erro;
    if (e.estado === 'sem_perfil') botao.disabled = true;
    else botao.textContent = 'Tentar de novo';
  } else if (e.estado === 'nunca') {
    texto.textContent = 'Este site ainda não foi verificado automaticamente.';
  } else if (e.estado === 'ok' && e.dados) {
    const r = e.dados.resumo || {};
    const decididos = (r.ok || 0) + (r.falha || 0) + (r.atencao || 0);

    /* Zero item decidido quase nunca é "o robô não achou nada": é o site
       que não abriu. Nesse caso a manchete é o motivo, não a contagem,
       senão a barra diz "0 de 52 itens decididos" e fica igualzinha a
       "ainda não rodou" justamente quando tem mais a dizer. */
    const naoAbriu = decididos === 0 && !!e.dados.aviso;

    if (naoAbriu) {
      div.classList.add('auditoria-barra-erro');
      texto.innerHTML = `
        <strong>Não foi possível ler este site</strong>
        <span class="auditoria-aviso">${escapar(e.dados.aviso)}</span>
        <span class="auditoria-fonte">${escapar(e.dados.url || '')} · tentado ${escapar(auditoriaQuando(e.dados.quando))}</span>
      `;
    } else {
      const partes = [`${decididos} de 52 itens decididos pelo robô`];
      if (r.falha) partes.push(`${r.falha} falha${r.falha > 1 ? 's' : ''}`);
      if (r.atencao) partes.push(`${r.atencao} em atenção`);
      if (r.ok) partes.push(`${r.ok} ok`);
      texto.innerHTML = `
        <strong>${escapar(partes.join(' · '))}</strong>
        ${e.dados.aviso ? `<span class="auditoria-aviso">${escapar(e.dados.aviso)}</span>` : ''}
        <span class="auditoria-fonte">${escapar(e.dados.url || '')} · lido ${escapar(auditoriaQuando(e.dados.quando))}</span>
      `;
    }
  } else {
    texto.textContent = 'Verificação automática disponível.';
  }

  div.appendChild(texto);
  div.appendChild(botao);
  return div;
}

/* Carimbo ao lado do item, com a prova embaixo. A prova é o ponto: um
   selo "falha" sozinho só transfere a dúvida, "18 de 169 imagens sem alt"
   diz o que fazer. */
function montarVeredito(item) {
  if (!item) return null;

  const caixa = document.createElement('div');
  caixa.className = `auditoria-item auditoria-${item.veredito}`;

  const selo = document.createElement('span');
  selo.className = 'auditoria-selo';
  selo.textContent = AUDITORIA_ROTULO[item.veredito] || item.veredito;
  caixa.appendChild(selo);

  const prova = document.createElement('span');
  prova.className = 'auditoria-prova';
  prova.textContent = item.prova;
  caixa.appendChild(prova);

  return caixa;
}

console.log('✓ site-auditoria.js carregado');
