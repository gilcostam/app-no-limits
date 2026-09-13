/* Google Meu Negócio: SEO e site institucional.
   As ações são as da planilha Gestao_GMB_NoLimits, aba "SEO & Site". Diferente do
   conteúdo semanal, aqui não existe mês: é um estado por cliente que vai evoluindo,
   então uma linha resolve e o id dela é o próprio id do onboarding. */

const ACOES_SEO = [
  { campo: 'palavras_chave', rotulo: 'Palavras-chave', nome: 'Palavras-chave configuradas no perfil' },
  { campo: 'diretorios', rotulo: 'Diretórios', nome: 'Cadastro em diretórios online' },
  { campo: 'avaliacoes', rotulo: 'Captar avaliações', nome: 'Estratégia de captação de avaliações ativa' },
  { campo: 'conteudo_site', rotulo: 'Conteúdo no site', nome: 'Conteúdo publicado no site com frequência' },
  { campo: 'redes', rotulo: 'Redes sociais', nome: 'Conteúdo publicado no Facebook e no Instagram' },
  { campo: 'youtube', rotulo: 'YouTube', nome: 'Conteúdo publicado no YouTube' },
  { campo: 'posicionamento', rotulo: 'Posicionamento', nome: 'Análise de posicionamento realizada' },
];

/* Aqui o "em andamento" vale a pena, ao contrário do conteúdo semanal: cadastrar
   diretórios e analisar posicionamento levam dias, não acabam no mesmo clique. */
const SITUACOES_SEO = SITUACOES;

/* A planilha tinha "Site Institucional" em pastilha e "Status do Site" em lista,
   contando a mesma coisa duas vezes. Ficou só a lista. */
const SITUACAO_SITE = [
  { valor: 'nao_iniciado', rotulo: 'Não iniciado' },
  { valor: 'construcao', rotulo: 'Em construção' },
  { valor: 'revisao', rotulo: 'Em revisão' },
  { valor: 'publicado', rotulo: 'Publicado' },
  { valor: 'na', rotulo: 'Não se aplica' },
];

let seos = [];

/* ---------- carregamento ---------- */

async function carregarSeo() {
  seos = await Store.listar('gmn_seo');
  renderSeo();
}

/* ---------- linhas ---------- */

function linhaSeo(onboardingId) {
  return seos.find(s => s.id === onboardingId) || {
    id: onboardingId,
    ...Object.fromEntries(ACOES_SEO.map(a => [a.campo, 'pendente'])),
    site: 'nao_iniciado',
    link_site: '',
    criado_em: new Date().toISOString(),
  };
}

// Igual ao conteúdo semanal: a linha só passa a existir quando alguém mexe nela.
function linhaSeoGravavel(onboardingId) {
  const linha = linhaSeo(onboardingId);
  if (!seos.includes(linha)) seos.push(linha);
  return linha;
}

// O site entra na conta junto com as pastilhas: publicar o site é uma ação de SEO
// concluída como qualquer outra, e deixar de fora faria o contador mentir.
function progressoSeo(onboardingId) {
  const linha = linhaSeo(onboardingId);
  let feitas = 0;
  let total = 0;

  ACOES_SEO.forEach(a => {
    if (linha[a.campo] === 'na') return;
    total += 1;
    if (linha[a.campo] === 'concluido') feitas += 1;
  });

  if (linha.site !== 'na') {
    total += 1;
    if (linha.site === 'publicado') feitas += 1;
  }

  return { feitas, total };
}

/* ---------- lista ---------- */

function filtrarSeo() {
  const busca = $('buscaSeo').value.trim().toLowerCase();
  const responsavel = $('filtroResponsavelSeo').value;

  return onboardings.filter(o => {
    if (o.ativo === false) return false;
    if (busca && !o.cliente_nome.toLowerCase().includes(busca)) return false;
    if (responsavel && o.responsavel_id !== responsavel) return false;
    return true;
  });
}

function renderSeo() {
  const lista = $('listaSeo');
  const itens = filtrarSeo();
  lista.innerHTML = itens.length ? '' : '<p class="vazio">Nenhum cliente ativo no Google Meu Negócio com esses filtros.</p>';
  itens.forEach(o => lista.appendChild(montarCartaoSeo(o)));
}

function montarCartaoSeo(o) {
  const responsavel = equipe.find(u => u.id === o.responsavel_id);

  const cartao = document.createElement('div');
  cartao.className = 'cartao-onboarding';
  cartao.dataset.id = o.id;
  cartao.innerHTML = `
    <div class="topo-cartao">
      <div class="info">
        <strong>${escapar(o.cliente_nome)}</strong>
        <span>${escapar(responsavel ? responsavel.nome : 'sem responsável')}</span>
      </div>
      <span class="etiqueta">0 de 0</span>
    </div>
    <div class="etapas">
      ${ACOES_SEO.map(a => `<button type="button" class="etapa" data-acao="${a.campo}">${escapar(a.rotulo)}</button>`).join('')}
    </div>
    <div class="linha-site">
      <div class="campo pequeno-site">
        <label>Site institucional</label>
        <select data-campo="site"></select>
      </div>
      <div class="campo grande">
        <label>Link do site</label>
        <input type="url" data-campo="link_site" placeholder="https://exemplo.com.br">
      </div>
      <a class="abrir-site" target="_blank" rel="noopener noreferrer">abrir</a>
    </div>`;

  // O texto das opções vem de constante nossa, mas monto pelo DOM por hábito: o
  // escapar() não protege aspas dentro de atributo.
  const select = cartao.querySelector('[data-campo="site"]');
  SITUACAO_SITE.forEach(s => select.appendChild(new Option(s.rotulo, s.valor)));

  pintarCartaoSeo(o, cartao);
  return cartao;
}

function pintarCartaoSeo(o, cartao) {
  const linha = linhaSeo(o.id);
  const { feitas, total } = progressoSeo(o.id);

  const etiqueta = cartao.querySelector('.etiqueta');
  etiqueta.textContent = `${feitas} de ${total}`;
  etiqueta.classList.toggle('destaque', total > 0 && feitas === total);

  ACOES_SEO.forEach(a => {
    const botao = cartao.querySelector(`[data-acao="${a.campo}"]`);
    botao.className = `etapa ${linha[a.campo]}`;
    botao.title = `${a.nome}: ${NOME_SITUACAO[linha[a.campo]]}, clique para mudar`;
  });

  cartao.querySelector('[data-campo="site"]').value = linha.site;
  const campoLink = cartao.querySelector('[data-campo="link_site"]');
  // Não sobrescrevo o que a pessoa está digitando: o repintar acontece a cada
  // clique em pastilha e o cursor ficaria pulando para o fim do campo.
  if (document.activeElement !== campoLink) campoLink.value = linha.link_site || '';

  const abrir = cartao.querySelector('.abrir-site');
  abrir.href = linha.link_site || '#';
  // Some de vista mas continua ocupando o lugar: com "display: none" o campo de
  // link esticava e os cartões ficavam com a borda direita desalinhada.
  abrir.classList.toggle('sem-link', !linha.link_site);
}

/* ---------- edição ---------- */

async function salvarSeo(o, linha, mudancas, cartao) {
  const anterior = { ...linha };
  Object.assign(linha, mudancas);
  pintarCartaoSeo(o, cartao);

  try {
    await Store.salvar('gmn_seo', linha);
    avisarSeo('');
  } catch (e) {
    Object.assign(linha, anterior);
    pintarCartaoSeo(o, cartao);
    avisarSeo(`Não foi possível salvar: ${e.message}`, 'erro');
  }
}

function clienteDoEventoSeo(evento) {
  const cartao = evento.target.closest('.cartao-onboarding');
  if (!cartao) return {};
  const cliente = onboardings.find(o => o.id === cartao.dataset.id);
  return cliente ? { cartao, cliente } : {};
}

function aoClicarAcaoSeo(evento) {
  const botao = evento.target.closest('.etapa');
  if (!botao) return;
  const { cartao, cliente } = clienteDoEventoSeo(evento);
  if (!cliente) return;

  const linha = linhaSeoGravavel(cliente.id);
  const campo = botao.dataset.acao;
  const proxima = SITUACOES_SEO[(SITUACOES_SEO.indexOf(linha[campo]) + 1) % SITUACOES_SEO.length];
  salvarSeo(cliente, linha, { [campo]: proxima }, cartao);
}

function aoEditarSeo(evento) {
  const campo = evento.target.dataset.campo;
  if (!campo) return;
  const { cartao, cliente } = clienteDoEventoSeo(evento);
  if (!cliente) return;

  const linha = linhaSeoGravavel(cliente.id);
  salvarSeo(cliente, linha, { [campo]: evento.target.value.trim() }, cartao);
}

function avisarSeo(texto, tipo) {
  $('seoAviso').textContent = texto;
  $('seoAviso').className = `aviso ${tipo || ''}`;
}

/* ---------- início ---------- */

function iniciarSeo() {
  $('buscaSeo').addEventListener('input', renderSeo);
  $('filtroResponsavelSeo').addEventListener('change', renderSeo);
  $('listaSeo').addEventListener('click', aoClicarAcaoSeo);
  $('listaSeo').addEventListener('change', aoEditarSeo);
}
