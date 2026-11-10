/* Projeto app-no-limits, exclusivo deste app. As tabelas exigem usuário
   autenticado, porque guardam dados pessoais dos clientes.
   Deixar as duas constantes em branco faz o app voltar a salvar no navegador. */
// Deixar em branco para usar localStorage local
const SUPABASE_URL = 'https://fmisqevbtyuynetakdhi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Pc8f7CpNzYfpMH-GG8UnFQ_LykP1rpD';

const sb = SUPABASE_URL && SUPABASE_ANON_KEY
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const $ = id => document.getElementById(id);

/* ---------- armazenamento ---------- */

const Store = {
  async listar(tabela) {
    if (sb) {
      const { data, error } = await sb.from(tabela).select('*').order('criado_em', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return JSON.parse(localStorage.getItem(`nolimits_${tabela}`) || '[]');
  },

  async salvar(tabela, registro) {
    if (sb) {
      const { data, error } = await sb.from(tabela).upsert(registro).select().single();
      if (error) throw error;
      return data;
    }
    const chave = `nolimits_${tabela}`;
    const atuais = JSON.parse(localStorage.getItem(chave) || '[]');
    const i = atuais.findIndex(r => r.id === registro.id);
    if (i >= 0) atuais[i] = registro;
    else atuais.unshift(registro);
    localStorage.setItem(chave, JSON.stringify(atuais));
    return registro;
  },

  /* Clientes têm duas portas conforme o papel:
     admin lê a tabela inteira, funcionário lê a view clientes_equipe,
     que expõe só id e nome. Ver supabase_schema_clientes_equipe.sql. */
  async listarClientes() {
    if (!sb) return JSON.parse(localStorage.getItem('nolimits_clientes') || '[]');

    if (ehAdmin()) {
      const { data, error } = await sb.from('clientes').select('*').order('criado_em', { ascending: false });
      if (error) throw error;
      return data || [];
    }

    const { data, error } = await sb.from('clientes_equipe').select('id, nome').order('nome');
    if (error) throw error;
    return data || [];
  },

  async deletar(tabela, id) {
    if (sb) {
      const { error } = await sb.from(tabela).delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const chave = `nolimits_${tabela}`;
    const atuais = JSON.parse(localStorage.getItem(chave) || '[]');
    const i = atuais.findIndex(r => r.id === id);
    if (i >= 0) atuais.splice(i, 1);
    localStorage.setItem(chave, JSON.stringify(atuais));
    return true;
  },
};

/* ---------- estado dos checklists ----------

   Os quatro módulos (workflow, GMB, diretórios, site) leem progresso
   de forma síncrona e em volume: a lateral calcula o progresso dos 62
   clientes a cada render. Consulta ao Supabase por cliente seria
   inviável, então o estado inteiro é carregado numa única consulta,
   fica em memória e a gravação é write-through.

   `localStorage` continua sendo escrito como espelho. Serve para não
   perder o clique se o banco falhar no meio do trabalho.            */

const Checklist = {
  cache: {},

  prefixos: /^(workflow|gmb|dir|site|servicos)_/,

  async carregar() {
    this.cache = {};

    if (!sb) {
      this.lerDoNavegador(k => { this.cache[k] = this.jsonLocal(k); });
      return;
    }

    const { data, error } = await sb.from('checklist_estado').select('chave, dados');
    if (error) throw error;
    (data || []).forEach(r => { this.cache[r.chave] = r.dados || {}; });
    await this.subirPendentesLocais();
  },

  lerDoNavegador(fn) {
    Object.keys(localStorage).filter(k => this.prefixos.test(k)).forEach(fn);
  },

  jsonLocal(chave) {
    try { return JSON.parse(localStorage.getItem(chave)) || {}; } catch { return {}; }
  },

  /* Progresso que ficou só neste navegador antes do Supabase entrar.
     Sobe uma vez. O que já está no banco tem prioridade e não é tocado. */
  async subirPendentesLocais() {
    const pendentes = [];
    this.lerDoNavegador(k => {
      if (!(k in this.cache)) pendentes.push({ chave: k, dados: this.jsonLocal(k) });
    });
    if (pendentes.length === 0) return;

    const { error } = await sb.from('checklist_estado').upsert(pendentes);
    if (error) return console.warn('Progresso local não subiu:', error.message);

    pendentes.forEach(p => { this.cache[p.chave] = p.dados; });
    console.log(`↑ ${pendentes.length} registro(s) de checklist migrado(s) do navegador para o Supabase`);
  },

  ler(chave) {
    return this.cache[chave] || {};
  },

  /* Apaga o progresso do cliente nos quatro módulos de uma vez.
     Antes só o workflow era limpo e as rotinas de GMB, diretórios
     e site ficavam órfãs no armazenamento. */
  apagarCliente(clienteId) {
    const chaves = Object.keys(this.cache).filter(k => k.includes(clienteId));
    chaves.forEach(k => {
      delete this.cache[k];
      localStorage.removeItem(k);
    });
    if (!sb || chaves.length === 0) return;

    sb.from('checklist_estado').delete().in('chave', chaves)
      .then(({ error }) => { if (error) avisarFalhaGravacao(error.message); });
  },

  gravar(chave, dados) {
    this.cache[chave] = dados;
    localStorage.setItem(chave, JSON.stringify(dados));

    /* Ponto único por onde passa toda marcação, nos quatro módulos.
       Avisar o painel aqui evita ter que lembrar de chamá-lo em cada
       função de marcar, e esquecer numa delas é como o número do
       painel passaria a divergir do checklist. */
    if (typeof atualizarPainel === 'function') atualizarPainel();

    if (!sb) return;

    sb.from('checklist_estado')
      .upsert({
        chave,
        dados,
        atualizado_em: new Date().toISOString(),
        atualizado_por: perfil?.id || null,
      })
      .then(({ error }) => { if (error) avisarFalhaGravacao(error.message); });
  },
};

/* ---------- serviços contratados ----------

   Nem todo cliente compra tudo. Um contrata só o Google Meu Negócio,
   outro só o site. Sem isto as três abas de rotina listam os 66
   clientes iguais, e a equipe perde tempo abrindo ficha de quem não
   tem aquele serviço, ou pior, executa rotina que ninguém pagou.

   Mora no mesmo `checklist_estado`, com a chave `servicos_<id>`.
   Não precisou de coluna nova em `clientes`, e isso resolve de
   quebra um problema de permissão: funcionário lê `clientes` pela
   view `clientes_equipe`, que só entrega id e nome. Uma coluna de
   serviço lá dentro ficaria invisível para a equipe.             */

const SERVICOS = [
  { id: 'gmb', titulo: 'Google Meu Negócio' },
  { id: 'dir', titulo: 'Diretórios locais' },
  { id: 'site', titulo: 'Site' },
];

const Servicos = {
  /* Ausência de registro significa tudo ativo, e não tudo desativado.
     Os clientes que já existiam não têm essa chave gravada: com o
     padrão invertido, as três abas apareceriam vazias no primeiro
     acesso depois desta mudança e pareceria que o app quebrou.
     Assim o comportamento só muda onde alguém desmarcou de propósito. */
  ler(clienteId) {
    const salvo = Checklist.ler(`servicos_${clienteId}`);
    const ativos = {};
    SERVICOS.forEach(s => { ativos[s.id] = salvo[s.id] !== false; });
    return ativos;
  },

  tem(clienteId, servico) {
    return this.ler(clienteId)[servico];
  },

  definir(clienteId, servico, ativo) {
    const atual = this.ler(clienteId);
    atual[servico] = ativo;
    atual.atualizado_em = new Date().toISOString();
    Checklist.gravar(`servicos_${clienteId}`, atual);
  },

  comServico(servico) {
    return (clientes || []).filter(c => this.tem(c.id, servico));
  },
};

/* Redesenha as três laterais depois que um serviço é ligado ou
   desligado, para o cliente aparecer ou sumir na hora. */
function atualizarListasServicos() {
  if (typeof renderizarListaClientesGmb === 'function') renderizarListaClientesGmb();
  if (typeof renderizarListaClientesDir === 'function') renderizarListaClientesDir();
  if (typeof renderizarListaClientesSite === 'function') renderizarListaClientesSite();
}

/* ---------- contagem de clientes ----------

   A lateral rola sem fim e ninguém sabe se são 30 ou 60 clientes, nem
   quantos sobraram depois de filtrar. O número fica ao lado do título.

   O denominador é sempre a base inteira, nas quatro abas. Na aba do
   Google Meu Negócio, "40 de 66" responde de passagem quantos clientes
   têm o serviço contratado, que é informação de venda. */

function atualizarContagem(elementoId, mostrados) {
  const alvo = document.getElementById(elementoId);
  if (!alvo) return;

  const total = (clientes || []).length;
  if (total === 0) { alvo.textContent = ''; return; }

  /* Sem filtro sai só o número: o título ao lado já diz "Clientes", e
     "Clientes 30 clientes" repete a palavra. */
  alvo.textContent = mostrados === total ? `${total}` : `${mostrados} de ${total}`;
}

let timerFalhaSync = null;

function avisarFalhaGravacao(mensagem) {
  console.error('Falha ao salvar no Supabase:', mensagem);
  const el = $('statusConexao');
  if (!el) return;
  if (!el.dataset.original) el.dataset.original = el.textContent;
  el.textContent = '⚠ não salvou no servidor';
  el.classList.add('erro-sync');
  clearTimeout(timerFalhaSync);
  timerFalhaSync = setTimeout(() => {
    el.textContent = el.dataset.original || '';
    el.classList.remove('erro-sync');
  }, 6000);
}

/* ---------- estado ---------- */

let clientes = [];
let perfil = null;

const ehAdmin = () => perfil?.papel === 'admin';

/* ---------- abas ---------- */

document.querySelectorAll('.aba').forEach(botao => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));
    document.querySelectorAll('.painel').forEach(p => p.classList.remove('ativo'));
    botao.classList.add('ativa');
    $(`painel-${botao.dataset.aba}`).classList.add('ativo');
    /* Volta para o painel depois de marcar tarefas numa rotina: é aqui
       que ele recupera o que deixou de desenhar enquanto estava atrás. */
    if (botao.dataset.aba === 'visao') atualizarPainel();
  });
});

/* ---------- permissões ---------- */

function aplicarPermissoes() {
  document.querySelectorAll('.so-admin').forEach(e => e.classList.toggle('oculto', !ehAdmin()));
  const ativa = document.querySelector('.aba.ativa');
  if (!ativa || ativa.classList.contains('oculto')) document.querySelector('.aba:not(.oculto)')?.click();
}

/* ---------- carregamento ---------- */

async function carregarDados() {
  clientes = await Store.listarClientes();

  await Checklist.carregar();

  if (typeof iniciarWorkflow === 'function') iniciarWorkflow();
  if (typeof iniciarGmb === 'function') iniciarGmb();
  if (typeof iniciarDiretorios === 'function') iniciarDiretorios();
  if (typeof iniciarSite === 'function') iniciarSite();
  if (typeof iniciarPainel === 'function') iniciarPainel();
}

/* O painel soma o progresso dos quatro módulos. Sem isto ele mostraria
   o número de quando a aba foi aberta, e a pessoa marcaria dez tarefas
   numa rotina para voltar ao painel e encontrar o total velho.

   Só redesenha se a aba estiver na frente. Redesenhar escondido
   custaria o relatório inteiro dos 30 clientes a cada caixa marcada,
   para ninguém ver. Quando a aba volta, ela se redesenha. */
function atualizarPainel() {
  if (typeof renderizarPainel !== 'function') return;
  if (!$('painel-visao')?.classList.contains('ativo')) return;
  renderizarPainel();
}

function escapar(t) {
  const d = document.createElement('div');
  d.textContent = t == null ? '' : String(t);
  return d.innerHTML;
}

/* ---------- sincronização Asaas ---------- */

async function sincronizarAsaas() {
  const btn = $('btnSincronizar');
  const aviso = $('aviso-sincronizar');

  btn.classList.add('sincronizando');
  aviso.textContent = 'Sincronizando...';
  aviso.className = 'aviso-sync';

  try {
    const resultado = await Asaas.sincronizar();

    if (resultado.sucesso) {
      await carregarDados();
      aviso.textContent = `✓ ${resultado.total} cliente(s) sincronizado(s)`;
      aviso.className = 'aviso-sync ok';
      setTimeout(() => { aviso.textContent = ''; }, 3000);
    } else {
      aviso.textContent = `✗ Erro: ${resultado.erro}`;
      aviso.className = 'aviso-sync erro';
    }
  } catch (e) {
    aviso.textContent = `✗ Erro: ${e.message}`;
    aviso.className = 'aviso-sync erro';
  } finally {
    btn.classList.remove('sincronizando');
  }
}

/* ---------- acesso ---------- */

const PERFIL_LOCAL = { nome: 'Local', papel: 'admin', ativo: true };

async function buscarPerfil(id) {
  const { data, error } = await sb.from('usuarios').select('id, nome, papel, ativo').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

function recusarAcesso(texto) {
  const aviso = $('loginAviso');
  aviso.className = 'aviso erro';
  aviso.textContent = texto;
  $('login').classList.remove('oculto');
  document.body.classList.remove('liberado');
}

async function liberarApp(usuario) {
  if (usuario) {
    const cadastro = await buscarPerfil(usuario.id);
    if (!cadastro || !cadastro.ativo) {
      await sb.auth.signOut();
      return recusarAcesso(cadastro
        ? 'Seu acesso foi desativado. Fale com o administrador.'
        : 'Seu acesso ainda não foi liberado. Peça ao administrador para cadastrar você na equipe.');
    }
    perfil = cadastro;
  } else {
    perfil = PERFIL_LOCAL;
  }

  $('login').classList.add('oculto');
  $('btnSair').classList.toggle('oculto', !usuario);
  $('statusConexao').textContent = usuario
    ? `${perfil.nome} · ${ehAdmin() ? 'admin' : 'funcionário'}`
    : 'Dados salvos neste navegador';
  document.body.classList.add('liberado');
  aplicarPermissoes();
  await carregarDados();
}

function mensagemLogin(erro) {
  if (/Invalid login credentials/i.test(erro.message)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(erro.message)) return 'Confirme o e-mail antes de entrar.';
  return erro.message;
}

$('formLogin').addEventListener('submit', async e => {
  e.preventDefault();
  const aviso = $('loginAviso');
  aviso.className = 'aviso';
  aviso.textContent = 'Entrando...';
  $('btnEntrar').disabled = true;
  const { data, error } = await sb.auth.signInWithPassword({
    email: $('loginEmail').value.trim(),
    password: $('loginSenha').value,
  });
  $('btnEntrar').disabled = false;
  if (error) {
    aviso.className = 'aviso erro';
    aviso.textContent = mensagemLogin(error);
    return;
  }
  aviso.textContent = '';
  $('loginSenha').value = '';
  try {
    await liberarApp(data.session.user);
  } catch (erro) {
    aviso.className = 'aviso erro';
    aviso.textContent = `Não foi possível carregar seus dados: ${erro.message}`;
  }
});

$('btnSair').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

$('btnSincronizar')?.addEventListener('click', sincronizarAsaas);

/* ---------- início ---------- */

/* Os módulos não são iniciados aqui de propósito: quem inicia é
   carregarDados(), depois que o Checklist já tem o estado em memória.
   Iniciar antes renderizaria tudo zerado e piscaria na tela. */
(async function iniciar() {
  if (!sb) return liberarApp(null);

  const { data } = await sb.auth.getSession();
  if (!data.session) return $('login').classList.remove('oculto');

  try {
    await liberarApp(data.session.user);
  } catch (erro) {
    recusarAcesso(`Não foi possível carregar seus dados: ${erro.message}`);
  }
})();
