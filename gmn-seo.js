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

/* O site era uma lista de status digitada na mão. O problema é que "em construção"
   não responde o que falta para publicar, e quem pegava o cliente no meio não sabia
   por onde continuar. Virou checklist, na ordem em que o trabalho acontece. */
const ETAPAS_SITE = [
  { campo: 'site_briefing', rotulo: 'Briefing e domínio', nome: 'Briefing preenchido e domínio definido' },
  { campo: 'site_estrutura', rotulo: 'Estrutura', nome: 'Estrutura das páginas definida' },
  { campo: 'site_textos', rotulo: 'Textos e fotos', nome: 'Textos escritos e fotos separadas' },
  { campo: 'site_layout', rotulo: 'Layout', nome: 'Layout montado no construtor' },
  { campo: 'site_onpage', rotulo: 'SEO on-page', nome: 'Títulos, descrições e imagens otimizados' },
  { campo: 'site_revisao', rotulo: 'Revisão do cliente', nome: 'Cliente revisou e aprovou' },
  { campo: 'site_publicacao', rotulo: 'Publicação', nome: 'Site no ar no domínio definitivo' },
];

/* Sobrou para a lista só a pergunta que o checklist não responde: este cliente vai
   ter site ou não? O andamento agora sai das etapas, em statusSite(). */
const SITUACAO_SITE = [
  { valor: 'sim', rotulo: 'Vai ter site' },
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
    ...Object.fromEntries(ETAPAS_SITE.map(e => [e.campo, 'pendente'])),
    site: 'sim',
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

// SEO e site passaram a ter contador próprio. Somar os dois num número só escondia
// justamente o que o Gilmar quis ver: o cliente pode estar ótimo no perfil e parado
// no site, e um "8 de 14" não conta essa história.
function progressoSeo(onboardingId) {
  return contar(linhaSeo(onboardingId), ACOES_SEO);
}

function progressoSite(onboardingId) {
  const linha = linhaSeo(onboardingId);
  if (linha.site === 'na') return { feitas: 0, total: 0 };
  return contar(linha, ETAPAS_SITE);
}

// O status do site deixou de ser digitado: agora é lido do checklist. Publicação
// feita é "publicado", revisão feita é "em revisão", qualquer etapa mexida é
// "em construção". Assim o status nunca contradiz as etapas, que era o defeito da
// planilha, onde a Policlínica aparecia de dois jeitos ao mesmo tempo.
function statusSite(linha) {
  if (linha.site === 'na') return 'Não se aplica';
  if (linha.site_publicacao === 'concluido') return 'Publicado';
  if (linha.site_revisao === 'concluido') return 'Em revisão';
  const mexeu = ETAPAS_SITE.some(e => linha[e.campo] !== 'pendente');
  return mexeu ? 'Em construção' : 'Não iniciado';
}

// O "plano de ação" que o Gilmar pediu, na sua forma mais curta: a primeira etapa
// que ainda não foi concluída. Quem abre o cartão não precisa ler as sete pastilhas
// para saber por onde continuar.
function proximoPassoSite(linha) {
  if (linha.site === 'na') return '';
  const proxima = ETAPAS_SITE.find(e => linha[e.campo] !== 'concluido' && linha[e.campo] !== 'na');
  return proxima ? proxima.nome : 'site concluído';
}

/* ---------- lista ---------- */

function filtrarSeo() {
  const busca = semAcento($('buscaSeo').value.trim());
  const responsavel = $('filtroResponsavelSeo').value;

  return onboardings.filter(o => {
    if (o.ativo === false) return false;
    if (busca && !semAcento(o.cliente_nome).includes(busca)) return false;
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
      <span class="etiqueta etiqueta-seo">0 de 0</span>
    </div>
    <div class="etapas">
      ${ACOES_SEO.map(a => `<button type="button" class="etapa" data-acao="${a.campo}">${escapar(a.rotulo)}</button>`).join('')}
    </div>
    <div class="bloco-site">
      <div class="titulo-bloco">
        <span>Site institucional</span>
        <span class="status-site"></span>
        <span class="etiqueta etiqueta-site">0 de 0</span>
      </div>
      <div class="etapas">
        ${ETAPAS_SITE.map(e => `<button type="button" class="etapa" data-acao="${e.campo}">${escapar(e.rotulo)}</button>`).join('')}
      </div>
      <p class="proximo-passo"></p>
      <div class="linha-site">
        <div class="campo pequeno-site">
          <label>Este cliente tem site?</label>
          <select data-campo="site"></select>
        </div>
        <div class="campo grande">
          <label>Link do site</label>
          <input type="url" data-campo="link_site" placeholder="https://exemplo.com.br">
        </div>
        <a class="abrir-site" target="_blank" rel="noopener noreferrer">abrir</a>
      </div>
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
  const temSite = linha.site !== 'na';

  pintarEtiqueta(cartao.querySelector('.etiqueta-seo'), progressoSeo(o.id));
  const etiquetaSite = cartao.querySelector('.etiqueta-site');
  pintarEtiqueta(etiquetaSite, progressoSite(o.id));
  etiquetaSite.classList.toggle('oculto', !temSite);

  ACOES_SEO.concat(ETAPAS_SITE).forEach(a => {
    const botao = cartao.querySelector(`[data-acao="${a.campo}"]`);
    botao.className = `etapa ${linha[a.campo]}`;
    botao.title = `${a.nome}: ${NOME_SITUACAO[linha[a.campo]]}, clique para mudar`;
  });

  cartao.querySelector('.status-site').textContent = statusSite(linha);

  // Sem site não há etapa nenhuma para mostrar, mas a lista e o status ficam: é por
  // ali que a pessoa desfaz o "não se aplica" se tiver marcado errado.
  cartao.querySelector('.bloco-site .etapas').classList.toggle('oculto', !temSite);
  const passo = cartao.querySelector('.proximo-passo');
  passo.textContent = temSite ? `Próximo: ${proximoPassoSite(linha)}` : '';
  passo.classList.toggle('oculto', !temSite);

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
    renderPlano();
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
