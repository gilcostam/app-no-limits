/* Google Meu Negócio: conteúdo semanal.
   As seis tarefas e as quatro semanas são as da planilha Gestao_GMB_NoLimits,
   aba "Conteúdo". Lá cada mês vira uma aba duplicada; aqui o mês é só uma coluna,
   então o histórico se acumula sem ninguém precisar copiar nada. */

const TAREFAS = [
  { campo: 'post', rotulo: 'Post', nome: 'Post publicado' },
  { campo: 'foto', rotulo: 'Foto', nome: 'Foto publicada' },
  { campo: 'qa', rotulo: 'Q&A', nome: 'Perguntas e respostas respondidas' },
  { campo: 'avaliacoes', rotulo: 'Avaliações', nome: 'Avaliações respondidas' },
  { campo: 'horarios', rotulo: 'Horários', nome: 'Horários atualizados' },
  { campo: 'produtos', rotulo: 'Produtos', nome: 'Produtos e cardápio atualizados' },
];

const SEMANAS = [1, 2, 3, 4];

let conteudos = [];

/* ---------- carregamento ---------- */

async function carregarConteudo() {
  conteudos = await Store.listar('gmn_conteudo');
  renderConteudo();
}

/* ---------- mês e semana ---------- */

// Montado a partir da data local: toISOString devolve UTC e viraria o mês na
// noite do último dia, quando o Brasil ainda está no mês anterior.
function mesDe(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

// A planilha trabalha com quatro semanas fixas, então os dias 29 em diante
// continuam caindo na semana 4.
function semanaAtual() {
  const hoje = new Date();
  if (mesDe(hoje) !== $('conteudoMes').value) return 0;
  return Math.min(Math.ceil(hoje.getDate() / 7), 4);
}

/* ---------- linhas ---------- */

function linhaSemana(onboardingId, semana) {
  const mes = $('conteudoMes').value;
  const id = `${onboardingId}__${mes}-s${semana}`;
  return conteudos.find(c => c.id === id) || {
    id,
    onboarding_id: onboardingId,
    mes,
    semana,
    ...Object.fromEntries(TAREFAS.map(t => [t.campo, 'pendente'])),
    criado_em: new Date().toISOString(),
  };
}

// A linha só passa a existir quando alguém marca a primeira tarefa: mês sem
// trabalho nenhum não precisa ocupar espaço no banco.
function linhaGravavel(onboardingId, semana) {
  const linha = linhaSemana(onboardingId, semana);
  if (!conteudos.includes(linha)) conteudos.push(linha);
  return linha;
}

function progressoConteudo(onboardingId) {
  let feitas = 0;
  let total = 0;
  SEMANAS.forEach(semana => {
    const linha = linhaSemana(onboardingId, semana);
    TAREFAS.forEach(t => {
      if (linha[t.campo] === 'na') return;
      total += 1;
      if (linha[t.campo] === 'concluido') feitas += 1;
    });
  });
  return { feitas, total };
}

/* ---------- lista ---------- */

function filtrarConteudo() {
  const busca = $('buscaConteudo').value.trim().toLowerCase();
  const responsavel = $('filtroResponsavelConteudo').value;

  return onboardings.filter(o => {
    if (o.ativo === false) return false;
    if (busca && !o.cliente_nome.toLowerCase().includes(busca)) return false;
    if (responsavel && o.responsavel_id !== responsavel) return false;
    return true;
  });
}

function renderConteudo() {
  const lista = $('listaConteudo');
  const itens = filtrarConteudo();
  lista.innerHTML = itens.length ? '' : '<p class="vazio">Nenhum cliente ativo no Google Meu Negócio com esses filtros.</p>';
  itens.forEach(o => lista.appendChild(montarCartaoConteudo(o)));
}

function montarCartaoConteudo(o) {
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
    ${SEMANAS.map(semana => `
      <div class="semana" data-semana="${semana}">
        <span class="rotulo-semana">Semana ${semana}</span>
        <div class="etapas">
          ${TAREFAS.map(t => `<button type="button" class="etapa" data-tarefa="${t.campo}">${escapar(t.rotulo)}</button>`).join('')}
        </div>
      </div>`).join('')}`;

  pintarCartaoConteudo(o, cartao);
  return cartao;
}

function pintarCartaoConteudo(o, cartao) {
  const atual = semanaAtual();
  const { feitas, total } = progressoConteudo(o.id);

  const etiqueta = cartao.querySelector('.etiqueta');
  etiqueta.textContent = `${feitas} de ${total}`;
  etiqueta.classList.toggle('destaque', total > 0 && feitas === total);

  SEMANAS.forEach(semana => {
    const linha = linhaSemana(o.id, semana);
    const bloco = cartao.querySelector(`.semana[data-semana="${semana}"]`);
    bloco.classList.toggle('atual', semana === atual);

    TAREFAS.forEach(t => {
      const botao = bloco.querySelector(`[data-tarefa="${t.campo}"]`);
      botao.className = `etapa ${linha[t.campo]}`;
      botao.title = `${t.nome}: ${NOME_SITUACAO[linha[t.campo]]}, clique para mudar`;
    });
  });
}

/* ---------- edição ---------- */

async function aoClicarTarefa(evento) {
  const botao = evento.target.closest('.etapa');
  if (!botao) return;

  const cartao = botao.closest('.cartao-onboarding');
  const cliente = onboardings.find(o => o.id === cartao.dataset.id);
  if (!cliente) return;

  const linha = linhaGravavel(cliente.id, Number(botao.closest('.semana').dataset.semana));
  const campo = botao.dataset.tarefa;
  const anterior = linha[campo];

  linha[campo] = SITUACOES[(SITUACOES.indexOf(anterior) + 1) % SITUACOES.length];
  pintarCartaoConteudo(cliente, cartao);

  try {
    await Store.salvar('gmn_conteudo', linha);
    avisarConteudo('');
  } catch (e) {
    linha[campo] = anterior;
    pintarCartaoConteudo(cliente, cartao);
    avisarConteudo(`Não foi possível salvar: ${e.message}`, 'erro');
  }
}

function avisarConteudo(texto, tipo) {
  $('conteudoAviso').textContent = texto;
  $('conteudoAviso').className = `aviso ${tipo || ''}`;
}

/* ---------- início ---------- */

function iniciarConteudo() {
  $('conteudoMes').value = mesDe(new Date());
  $('conteudoMes').addEventListener('change', renderConteudo);
  $('buscaConteudo').addEventListener('input', renderConteudo);
  $('filtroResponsavelConteudo').addEventListener('change', renderConteudo);
  $('listaConteudo').addEventListener('click', aoClicarTarefa);
}
