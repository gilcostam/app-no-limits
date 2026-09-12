/* Google Meu Negócio: onboarding de cliente novo.
   As seis etapas são as da planilha Gestao_GMB_NoLimits, aba "Onboarding". */

const ETAPAS = [
  { campo: 'etapa_fechado', rotulo: 'Cliente fechado' },
  { campo: 'etapa_contrato', rotulo: 'Contrato e acesso ao GMB' },
  { campo: 'etapa_briefing', rotulo: 'Briefing' },
  { campo: 'etapa_whatsapp', rotulo: 'Grupo no WhatsApp' },
  { campo: 'etapa_drive', rotulo: 'Pasta no Drive' },
  { campo: 'etapa_capa', rotulo: 'Foto de capa' },
  { campo: 'etapa_produtos', rotulo: 'Produtos e serviços' },
];

/* "não se aplica" existe porque boa parte dos clientes de GMN é anterior ao app e
   nunca vai ter contrato assinado aqui dentro. Sem essa opção a etapa ficaria
   pendente para sempre e derrubaria a contagem de progresso. */
const SITUACOES = ['pendente', 'andamento', 'concluido', 'na'];

const NOME_SITUACAO = {
  pendente: 'pendente',
  andamento: 'em andamento',
  concluido: 'concluído',
  na: 'não se aplica',
};

let onboardings = [];
let equipe = [];

/* ---------- carregamento ---------- */

async function carregarGmn() {
  [equipe, onboardings] = await Promise.all([
    Store.listar('usuarios'),
    Store.listar('gmn_onboarding'),
  ]);
  equipe.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  preencherSelectsEquipe();
  preencherClientesConhecidos();
  renderOnboarding();
  renderEquipe();
}

function preencherSelectsEquipe() {
  [['gmnResponsavel', 'Sem responsável'], ['filtroResponsavel', 'Todos os responsáveis']]
    .forEach(([id, primeira]) => {
      const select = $(id);
      const atual = select.value;
      select.innerHTML = '';
      select.appendChild(new Option(primeira, ''));
      equipe.filter(u => u.ativo).forEach(u => select.appendChild(new Option(u.nome, u.id)));
      select.value = atual;
    });
}

// Só o admin carrega a tabela de clientes, então para o funcionário a lista de
// sugestões vem vazia e ele digita o nome na mão.
function preencherClientesConhecidos() {
  const lista = $('gmnClientes');
  lista.innerHTML = '';
  clientes.forEach(c => lista.appendChild(new Option(c.nome)));
}

/* ---------- progresso ---------- */

function progresso(o) {
  const valendo = ETAPAS.filter(e => o[e.campo] !== 'na');
  return { feitas: valendo.filter(e => o[e.campo] === 'concluido').length, total: valendo.length };
}

/* ---------- lista ---------- */

function filtrarOnboarding() {
  const busca = $('buscaOnboarding').value.trim().toLowerCase();
  const responsavel = $('filtroResponsavel').value;
  const situacao = $('filtroSituacao').value;

  return onboardings.filter(o => {
    if (busca && !o.cliente_nome.toLowerCase().includes(busca)) return false;
    if (responsavel && o.responsavel_id !== responsavel) return false;
    if (situacao === 'abertos' && o.concluido_em) return false;
    if (situacao === 'concluidos' && !o.concluido_em) return false;
    return true;
  });
}

function renderOnboarding() {
  const lista = $('listaOnboarding');
  const itens = filtrarOnboarding();
  lista.innerHTML = itens.length ? '' : '<p class="vazio">Nenhum cliente em onboarding com esses filtros.</p>';
  itens.forEach(o => lista.appendChild(montarCartao(o)));
}

function montarCartao(o) {
  const responsavel = equipe.find(u => u.id === o.responsavel_id);
  // Data pura do Postgres vira meia-noite UTC e volta um dia no fuso do Brasil.
  const inicio = o.data_inicio ? new Date(`${o.data_inicio}T12:00:00`).toLocaleDateString('pt-BR') : '';
  const legenda = [
    inicio && `início ${inicio}`,
    responsavel ? responsavel.nome : 'sem responsável',
  ].filter(Boolean).join('  ·  ');

  const cartao = document.createElement('div');
  cartao.className = 'cartao-onboarding';
  cartao.dataset.id = o.id;
  cartao.innerHTML = `
    <div class="topo-cartao">
      <div class="info">
        <strong>${escapar(o.cliente_nome)}</strong>
        <span>${escapar(legenda)}</span>
      </div>
      <span class="etiqueta">0 de 0</span>
    </div>
    <div class="etapas">
      ${ETAPAS.map(e => `<button type="button" class="etapa" data-etapa="${e.campo}">${escapar(e.rotulo)}</button>`).join('')}
    </div>
    <details class="extras">
      <summary>Drive e observações</summary>
      <div class="campo">
        <label>Link da pasta no Drive</label>
        <input type="url" data-campo="link_drive" placeholder="https://drive.google.com/...">
      </div>
      <div class="campo">
        <label>Observações</label>
        <input type="text" data-campo="observacoes" placeholder="O que ficou pendente, combinados com o cliente">
      </div>
    </details>`;

  cartao.querySelector('[data-campo="link_drive"]').value = o.link_drive || '';
  cartao.querySelector('[data-campo="observacoes"]').value = o.observacoes || '';
  pintarCartao(o, cartao);
  return cartao;
}

// Repinta no lugar em vez de remontar a lista: remontar fecharia o "Drive e
// observações" que estivesse aberto e tiraria o cursor de quem está digitando.
function pintarCartao(o, cartao) {
  const { feitas, total } = progresso(o);
  const etiqueta = cartao.querySelector('.etiqueta');
  etiqueta.textContent = o.concluido_em ? 'onboarding concluído' : `${feitas} de ${total}`;
  etiqueta.classList.toggle('destaque', Boolean(o.concluido_em));

  ETAPAS.forEach(e => {
    const botao = cartao.querySelector(`[data-etapa="${e.campo}"]`);
    botao.className = `etapa ${o[e.campo]}`;
    botao.title = `${NOME_SITUACAO[o[e.campo]]}, clique para mudar`;
  });
}

/* ---------- edição ---------- */

async function salvarOnboarding(registro, mudancas, cartao) {
  const anterior = { ...registro };
  Object.assign(registro, mudancas);

  const { feitas, total } = progresso(registro);
  const completo = total > 0 && feitas === total;
  registro.concluido_em = completo ? registro.concluido_em || new Date().toISOString() : null;
  pintarCartao(registro, cartao);

  try {
    await Store.salvar('gmn_onboarding', registro);
    avisarGmn('');
  } catch (e) {
    Object.assign(registro, anterior);
    pintarCartao(registro, cartao);
    avisarGmn(`Não foi possível salvar: ${e.message}`, 'erro');
  }
}

function registroDoEvento(evento) {
  const cartao = evento.target.closest('.cartao-onboarding');
  return cartao ? { cartao, registro: onboardings.find(o => o.id === cartao.dataset.id) } : {};
}

function aoClicarEtapa(evento) {
  const botao = evento.target.closest('.etapa');
  if (!botao) return;
  const { cartao, registro } = registroDoEvento(evento);
  if (!registro) return;
  const campo = botao.dataset.etapa;
  const proxima = SITUACOES[(SITUACOES.indexOf(registro[campo]) + 1) % SITUACOES.length];
  salvarOnboarding(registro, { [campo]: proxima }, cartao);
}

function aoEditarExtra(evento) {
  const campo = evento.target.dataset.campo;
  if (!campo) return;
  const { cartao, registro } = registroDoEvento(evento);
  if (!registro) return;
  salvarOnboarding(registro, { [campo]: evento.target.value.trim() }, cartao);
}

/* ---------- novo onboarding ---------- */

function apelido(nome) {
  return nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function criarOnboarding() {
  const nome = $('gmnCliente').value.trim();
  if (!nome) return avisarGmn('Informe o nome do cliente.', 'erro');

  if (onboardings.some(o => !o.concluido_em && o.cliente_nome.toLowerCase() === nome.toLowerCase())) {
    return avisarGmn(`${nome} já está em onboarding.`, 'erro');
  }

  // O vínculo com a ficha do cliente é oportunista: casa pelo nome quando o
  // cliente já veio de um contrato, e fica solto quando é cliente antigo.
  const ficha = clientes.find(c => c.nome.toLowerCase() === nome.toLowerCase());

  const registro = {
    id: `${apelido(nome)}-${Date.now()}`,
    cliente_id: ficha ? ficha.id : null,
    cliente_nome: ficha ? ficha.nome : nome,
    responsavel_id: $('gmnResponsavel').value || null,
    data_inicio: $('gmnDataInicio').value || null,
    ...Object.fromEntries(ETAPAS.map(e => [e.campo, 'pendente'])),
    link_drive: '',
    observacoes: '',
    concluido_em: null,
    criado_em: new Date().toISOString(),
  };

  $('btnNovoOnboarding').disabled = true;
  try {
    onboardings.unshift(await Store.salvar('gmn_onboarding', registro));
    $('gmnCliente').value = '';
    renderOnboarding();
    avisarGmn(`${registro.cliente_nome} entrou no onboarding.`, 'ok');
  } catch (e) {
    avisarGmn(`Não foi possível salvar: ${e.message}`, 'erro');
  }
  $('btnNovoOnboarding').disabled = false;
}

/* ---------- equipe ---------- */

function renderEquipe() {
  const lista = $('listaEquipe');
  lista.innerHTML = equipe.length ? '' : '<p class="vazio">Ninguém cadastrado ainda.</p>';

  equipe.forEach(u => {
    const item = document.createElement('div');
    item.className = 'item-lista';
    item.dataset.id = u.id;
    item.innerHTML = `
      <div class="campo grande">
        <input type="text" data-campo="nome" aria-label="Nome">
      </div>
      <div class="campo">
        <select data-campo="papel" aria-label="Nível de acesso">
          <option value="funcionario">Funcionário</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <label class="check"><input type="checkbox" data-campo="ativo"><span>Ativo</span></label>`;

    item.querySelector('[data-campo="nome"]').value = u.nome;
    item.querySelector('[data-campo="papel"]').value = u.papel;
    item.querySelector('[data-campo="ativo"]').checked = u.ativo;
    lista.appendChild(item);
  });
}

async function aoEditarEquipe(evento) {
  const campo = evento.target.dataset.campo;
  if (!campo) return;
  const item = evento.target.closest('.item-lista');
  const pessoa = equipe.find(u => u.id === item.dataset.id);
  if (!pessoa) return;

  // Rebaixar a si mesmo tiraria o acesso aos contratos na hora, e devolver o papel
  // exigiria rodar SQL no painel do Supabase.
  if (pessoa.id === perfil.id && campo !== 'nome') {
    renderEquipe();
    return avisarEquipe('Você não pode mudar o seu próprio acesso.', 'erro');
  }

  const valor = campo === 'ativo' ? evento.target.checked : evento.target.value.trim();
  if (campo === 'nome' && !valor) {
    renderEquipe();
    return avisarEquipe('O nome não pode ficar em branco.', 'erro');
  }

  const anterior = pessoa[campo];
  pessoa[campo] = valor;
  try {
    await Store.salvar('usuarios', pessoa);
    preencherSelectsEquipe();
    renderOnboarding();
    avisarEquipe(`${pessoa.nome} atualizado.`, 'ok');
  } catch (e) {
    pessoa[campo] = anterior;
    renderEquipe();
    avisarEquipe(`Não foi possível salvar: ${e.message}`, 'erro');
  }
}

/* ---------- avisos ---------- */

function avisarGmn(texto, tipo) {
  $('gmnAviso').textContent = texto;
  $('gmnAviso').className = `aviso ${tipo || ''}`;
}

function avisarEquipe(texto, tipo) {
  $('equipeAviso').textContent = texto;
  $('equipeAviso').className = `aviso ${tipo || ''}`;
}

/* ---------- início ---------- */

function iniciarGmn() {
  $('gmnDataInicio').value = new Date().toISOString().slice(0, 10);
  $('btnNovoOnboarding').addEventListener('click', criarOnboarding);
  $('buscaOnboarding').addEventListener('input', renderOnboarding);
  $('filtroResponsavel').addEventListener('change', renderOnboarding);
  $('filtroSituacao').addEventListener('change', renderOnboarding);
  $('listaOnboarding').addEventListener('click', aoClicarEtapa);
  $('listaOnboarding').addEventListener('change', aoEditarExtra);
  $('listaEquipe').addEventListener('change', aoEditarEquipe);
}
