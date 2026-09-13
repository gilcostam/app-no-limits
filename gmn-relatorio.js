/* Google Meu Negócio: relatório mensal e cobrança.
   As colunas são as da planilha Gestao_GMB_NoLimits, aba "Relatório". É o que
   sustenta a quinta e a sexta da rotina da agência: quinta monta o relatório,
   sexta termina, envia e cobra. Como no conteúdo semanal, o mês aqui é coluna e
   não aba duplicada, então o histórico se acumula sozinho. */

const ETAPAS_RELATORIO = [
  { campo: 'gbpcheck', rotulo: 'GBPCheck', nome: 'GBPCheck realizado' },
  { campo: 'contateme', rotulo: 'Contate.me', nome: 'Contate.me verificado' },
  { campo: 'insights', rotulo: 'Insights', nome: 'Insights extraídos do perfil' },
  { campo: 'enviado', rotulo: 'Enviar ao cliente', nome: 'Relatório enviado ao cliente' },
  { campo: 'cobranca', rotulo: 'Cobrança no Asaas', nome: 'Cobrança gerada no Asaas' },
];

/* Montar relatório leva as duas pontas da semana, então o "em andamento" da quinta
   para a sexta é o estado mais usado da tela, não uma exceção. */
const SITUACOES_RELATORIO = SITUACOES;

const RETORNO_CLIENTE = [
  { valor: 'aguardando', rotulo: 'Aguardando retorno' },
  { valor: 'respondeu', rotulo: 'Cliente respondeu' },
  { valor: 'sem_retorno', rotulo: 'Sem retorno' },
];

/* Exatamente as cinco opções da coluna "Status Pagamento" da planilha. */
const STATUS_PAGAMENTO = [
  { valor: 'pendente', rotulo: 'Pendente' },
  { valor: 'pago', rotulo: 'Pago' },
  { valor: 'atrasado', rotulo: 'Atrasado' },
  { valor: 'isento', rotulo: 'Isento' },
  { valor: 'cancelado', rotulo: 'Cancelado' },
];

let relatorios = [];

/* ---------- carregamento ---------- */

async function carregarRelatorio() {
  relatorios = await Store.listar('gmn_relatorio');
  renderRelatorio();
}

/* ---------- linhas ---------- */

// Mesmo motivo do conteúdo semanal: o plano da semana precisa pedir o mês de hoje
// sem depender de onde o filtro desta aba ficou parado.
function linhaRelatorio(onboardingId, mes = $('relatorioMes').value) {
  const id = `${onboardingId}__${mes}`;
  return relatorios.find(r => r.id === id) || {
    id,
    onboarding_id: onboardingId,
    mes,
    ...Object.fromEntries(ETAPAS_RELATORIO.map(e => [e.campo, 'pendente'])),
    enviado_em: null,
    retorno: 'aguardando',
    pagamento: 'pendente',
    observacoes: '',
    criado_em: new Date().toISOString(),
  };
}

function linhaRelatorioGravavel(onboardingId, mes) {
  const linha = linhaRelatorio(onboardingId, mes);
  if (!relatorios.includes(linha)) relatorios.push(linha);
  return linha;
}

function progressoRelatorio(onboardingId) {
  return contar(linhaRelatorio(onboardingId), ETAPAS_RELATORIO);
}

/* ---------- lista ---------- */

function filtrarRelatorio() {
  const busca = semAcento($('buscaRelatorio').value.trim());
  const responsavel = $('filtroResponsavelRelatorio').value;

  return onboardings.filter(o => {
    if (o.ativo === false) return false;
    if (busca && !semAcento(o.cliente_nome).includes(busca)) return false;
    if (responsavel && o.responsavel_id !== responsavel) return false;
    return true;
  });
}

function renderRelatorio() {
  const lista = $('listaRelatorio');
  const itens = filtrarRelatorio();
  lista.innerHTML = itens.length ? '' : '<p class="vazio">Nenhum cliente ativo no Google Meu Negócio com esses filtros.</p>';
  itens.forEach(o => lista.appendChild(montarCartaoRelatorio(o)));
}

function montarCartaoRelatorio(o) {
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
      ${ETAPAS_RELATORIO.map(e => `<button type="button" class="etapa" data-acao="${e.campo}">${escapar(e.rotulo)}</button>`).join('')}
    </div>
    <div class="linha-site">
      <div class="campo pequeno-data">
        <label>Data do envio</label>
        <input type="date" data-campo="enviado_em">
      </div>
      <div class="campo">
        <label>Retorno do cliente</label>
        <select data-campo="retorno"></select>
      </div>
      <div class="campo">
        <label>Pagamento</label>
        <select data-campo="pagamento"></select>
      </div>
    </div>
    <details class="extras">
      <summary>Observações do mês</summary>
      <div class="campo">
        <input type="text" data-campo="observacoes" placeholder="O que o cliente comentou, o que entrou no próximo mês">
      </div>
    </details>`;

  // Pelo DOM e não por template: escapar() não protege aspas dentro de atributo.
  const preencher = (campo, opcoes) => {
    const select = cartao.querySelector(`[data-campo="${campo}"]`);
    opcoes.forEach(op => select.appendChild(new Option(op.rotulo, op.valor)));
  };
  preencher('retorno', RETORNO_CLIENTE);
  preencher('pagamento', STATUS_PAGAMENTO);

  pintarCartaoRelatorio(o, cartao);
  return cartao;
}

function pintarCartaoRelatorio(o, cartao) {
  const linha = linhaRelatorio(o.id);
  pintarEtiqueta(cartao.querySelector('.etiqueta'), progressoRelatorio(o.id));

  ETAPAS_RELATORIO.forEach(e => {
    const botao = cartao.querySelector(`[data-acao="${e.campo}"]`);
    botao.className = `etapa ${linha[e.campo]}`;
    botao.title = `${e.nome}: ${NOME_SITUACAO[linha[e.campo]]}, clique para mudar`;
  });

  ['enviado_em', 'retorno', 'pagamento', 'observacoes'].forEach(campo => {
    const alvo = cartao.querySelector(`[data-campo="${campo}"]`);
    // Não sobrescrevo o que a pessoa está digitando: o repintar acontece a cada
    // clique em pastilha e o cursor ficaria pulando para o fim do campo.
    if (document.activeElement !== alvo) alvo.value = linha[campo] || '';
  });
}

/* ---------- edição ---------- */

async function salvarRelatorio(o, linha, mudancas, cartao) {
  const anterior = { ...linha };
  Object.assign(linha, mudancas);
  pintarCartaoRelatorio(o, cartao);

  try {
    await Store.salvar('gmn_relatorio', linha);
    renderPlano();
    avisarRelatorio('');
  } catch (e) {
    Object.assign(linha, anterior);
    pintarCartaoRelatorio(o, cartao);
    avisarRelatorio(`Não foi possível salvar: ${e.message}`, 'erro');
  }
}

function clienteDoEventoRelatorio(evento) {
  const cartao = evento.target.closest('.cartao-onboarding');
  if (!cartao) return {};
  const cliente = onboardings.find(o => o.id === cartao.dataset.id);
  return cliente ? { cartao, cliente } : {};
}

function aoClicarEtapaRelatorio(evento) {
  const botao = evento.target.closest('.etapa');
  if (!botao) return;
  const { cartao, cliente } = clienteDoEventoRelatorio(evento);
  if (!cliente) return;

  const linha = linhaRelatorioGravavel(cliente.id);
  const campo = botao.dataset.acao;
  const proxima = SITUACOES_RELATORIO[(SITUACOES_RELATORIO.indexOf(linha[campo]) + 1) % SITUACOES_RELATORIO.length];

  const mudancas = { [campo]: proxima };
  // Marcar "enviado" já anota a data: é sexta-feira, o relatório acabou de sair, e
  // ninguém vai parar para preencher um campo de data que o app já sabe responder.
  if (campo === 'enviado') {
    mudancas.enviado_em = proxima === 'concluido' ? hojeISO() : null;
  }
  salvarRelatorio(cliente, linha, mudancas, cartao);
}

function aoEditarRelatorio(evento) {
  const campo = evento.target.dataset.campo;
  if (!campo) return;
  const { cartao, cliente } = clienteDoEventoRelatorio(evento);
  if (!cliente) return;

  const linha = linhaRelatorioGravavel(cliente.id);
  const valor = evento.target.value.trim();
  salvarRelatorio(cliente, linha, { [campo]: valor || null }, cartao);
}

function avisarRelatorio(texto, tipo) {
  $('relatorioAviso').textContent = texto;
  $('relatorioAviso').className = `aviso ${tipo || ''}`;
}

/* ---------- início ---------- */

function iniciarRelatorio() {
  $('relatorioMes').value = mesDe(new Date());
  $('relatorioMes').addEventListener('change', renderRelatorio);
  $('buscaRelatorio').addEventListener('input', renderRelatorio);
  $('filtroResponsavelRelatorio').addEventListener('change', renderRelatorio);
  $('listaRelatorio').addEventListener('click', aoClicarEtapaRelatorio);
  $('listaRelatorio').addEventListener('change', aoEditarRelatorio);
}
