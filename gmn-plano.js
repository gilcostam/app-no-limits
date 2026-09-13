/* Plano da semana.
   As outras abas mostram um cliente por vez e o mês inteiro de uma vez. Essa
   organização serve para conferir, não para trabalhar: quem chega na segunda quer
   saber o que fazer hoje, em todos os clientes, e não abrir cliente por cliente
   para descobrir.

   Esta tela vira o assunto do avesso. O eixo é o dia da semana, e a rotina que a
   agência já pratica vira a estrutura do app:

     segunda   responder avaliações
     terça     subir fotos para os perfis
     quarta    fazer as publicações
     quinta    montar os relatórios
     sexta     cadastrar em diretórios, terminar os relatórios e enviar

   Cada dia aponta para campos que já existem nas outras abas: aqui não há tabela
   nova nem estado novo, só uma leitura diferente do mesmo banco. Marcar no plano é
   a mesma coisa que marcar na aba de origem, e o número muda nos dois lugares. */

const ROTINA = [
  {
    dia: 1, curto: 'Segunda', nome: 'Segunda-feira', titulo: 'Responder as avaliações',
    tarefas: [{ fonte: 'conteudo', campo: 'avaliacoes', rotulo: 'Avaliações respondidas' }],
  },
  {
    dia: 2, curto: 'Terça', nome: 'Terça-feira', titulo: 'Subir fotos para os perfis',
    tarefas: [{ fonte: 'conteudo', campo: 'foto', rotulo: 'Foto publicada' }],
  },
  {
    dia: 3, curto: 'Quarta', nome: 'Quarta-feira', titulo: 'Fazer as publicações',
    tarefas: [{ fonte: 'conteudo', campo: 'post', rotulo: 'Post publicado' }],
  },
  {
    dia: 4, curto: 'Quinta', nome: 'Quinta-feira', titulo: 'Montar os relatórios',
    tarefas: [
      { fonte: 'relatorio', campo: 'gbpcheck', rotulo: 'GBPCheck' },
      { fonte: 'relatorio', campo: 'contateme', rotulo: 'Contate.me' },
      { fonte: 'relatorio', campo: 'insights', rotulo: 'Insights' },
    ],
  },
  {
    dia: 5, curto: 'Sexta', nome: 'Sexta-feira', titulo: 'Diretórios, terminar e enviar os relatórios',
    tarefas: [
      { fonte: 'seo', campo: 'diretorios', rotulo: 'Cadastro em diretórios' },
      { fonte: 'relatorio', campo: 'enviado', rotulo: 'Relatório enviado' },
    ],
  },
];

/* O dia escolhido na tela. Começa no dia de hoje e a pessoa pode mudar para olhar
   adiante ou para trás, sem que isso mexa em nada no banco. */
let diaDoPlano = 1;

/* ---------- leitura do dia ---------- */

// Sábado e domingo não têm rotina. Em vez de mostrar uma tela vazia no fim de
// semana, o plano abre na segunda: é o próximo dia de trabalho de quem entrou ali.
// Mas abrir na segunda não é o mesmo que ser segunda, e a tela não pode dizer
// "hoje" num sábado, senão passa a mentir justamente para quem entrou fora de hora.
function fimDeSemana() {
  const dia = new Date().getDay();
  return dia === 0 || dia === 6;
}

function diaDeHoje() {
  const dia = new Date().getDay();
  return dia >= 1 && dia <= 5 ? dia : 1;
}

function rotinaDo(dia) {
  return ROTINA.find(r => r.dia === dia);
}

/* A ponte entre o plano e as outras abas. Cada fonte devolve a linha do banco onde
   aquele campo mora, sempre no mês de hoje: o plano nunca fala de agosto. */
function linhaDaTarefa(onboardingId, fonte, gravavel) {
  const mes = mesDe(new Date());
  if (fonte === 'conteudo') {
    const semana = semanaDoMes(new Date());
    return gravavel ? linhaGravavel(onboardingId, semana, mes) : linhaSemana(onboardingId, semana, mes);
  }
  if (fonte === 'relatorio') {
    return gravavel ? linhaRelatorioGravavel(onboardingId, mes) : linhaRelatorio(onboardingId, mes);
  }
  return gravavel ? linhaSeoGravavel(onboardingId) : linhaSeo(onboardingId);
}

const TABELA_DA_FONTE = { conteudo: 'gmn_conteudo', relatorio: 'gmn_relatorio', seo: 'gmn_seo' };

// Cada fonte gira nos mesmos estados da aba de onde veio. Conteúdo pula o "em
// andamento" de propósito, porque post ou foi publicado ou não foi, e o plano não
// pode inventar um estado que a aba de conteúdo não sabe mostrar.
const SITUACOES_DA_FONTE = {
  conteudo: SITUACOES_CONTEUDO,
  relatorio: SITUACOES_RELATORIO,
  seo: SITUACOES_SEO,
};

function situacaoDaTarefa(onboardingId, tarefa) {
  return linhaDaTarefa(onboardingId, tarefa.fonte)[tarefa.campo] || 'pendente';
}

// Um dia está resolvido num cliente quando nenhuma tarefa dele ficou pendente ou
// em andamento. "Não se aplica" conta como resolvido: é uma decisão tomada.
function diaResolvido(onboardingId, dia) {
  return rotinaDo(dia).tarefas.every(t => {
    const situacao = situacaoDaTarefa(onboardingId, t);
    return situacao === 'concluido' || situacao === 'na';
  });
}

function placarDoDia(dia) {
  const ativos = clientesDoPlano();
  return { feitas: ativos.filter(o => diaResolvido(o.id, dia)).length, total: ativos.length };
}

/* ---------- lista de clientes ---------- */

// "A agência inteira sempre": todo mundo vê a lista completa, com o nome do
// responsável do lado. Foi escolha do Gilmar contra a minha sugestão de mostrar só
// os clientes de quem está logado, e o motivo dele é bom: numa equipe pequena, o
// que ninguém pegou é mais perigoso do que o que está mal distribuído.
function clientesDoPlano() {
  return onboardings.filter(o => o.ativo !== false);
}

function filtrarPlano() {
  const busca = semAcento($('buscaPlano').value.trim());
  return clientesDoPlano().filter(o => !busca || semAcento(o.cliente_nome).includes(busca));
}

/* ---------- desenho ---------- */

function renderPlano() {
  // Chamado de dentro das outras abas quando algo é salvo, e elas carregam antes
  // do plano existir na tela na primeira vez.
  if (!$('listaPlano')) return;
  renderDiasDoPlano();
  renderTarefasDoPlano();
  renderAtrasadosDoPlano();
}

function renderDiasDoPlano() {
  const faixa = $('diasPlano');
  faixa.innerHTML = '';
  const hoje = diaDeHoje();

  ROTINA.forEach(r => {
    const { feitas, total } = placarDoDia(r.dia);
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'dia';
    botao.classList.toggle('escolhido', r.dia === diaDoPlano);
    botao.classList.toggle('hoje', !fimDeSemana() && r.dia === hoje);
    botao.classList.toggle('pronto', total > 0 && feitas === total);
    botao.dataset.dia = r.dia;
    botao.innerHTML = `
      <strong></strong>
      <span class="tarefa-do-dia"></span>
      <span class="placar"></span>`;
    botao.querySelector('strong').textContent = r.curto;
    botao.querySelector('.tarefa-do-dia').textContent = r.titulo;
    botao.querySelector('.placar').textContent = `${feitas} de ${total}`;
    faixa.appendChild(botao);
  });
}

function renderTarefasDoPlano() {
  const r = rotinaDo(diaDoPlano);
  const ehHoje = !fimDeSemana() && diaDoPlano === diaDeHoje();
  const { feitas, total } = placarDoDia(diaDoPlano);

  $('tituloPlano').textContent = ehHoje
    ? `Hoje, ${r.nome.toLowerCase()}: ${r.titulo.toLowerCase()}`
    : `${r.nome}: ${r.titulo.toLowerCase()}`;

  const placar = total === 0
    ? 'Nenhum cliente ativo no Google Meu Negócio.'
    : `${feitas} de ${total} clientes prontos, ${total - feitas} faltando.`;
  // A frase de fim de semana existe para explicar por que a tela abriu na segunda-feira
  // num sábado. Depois que alguém escolhe outro dia ela sai: o título já diz que dia
  // está aberto, e insistir em "abaixo está a segunda-feira" com a quinta na tela seria
  // o app mentindo sobre o que está mostrando.
  const abriuNoPadrao = fimDeSemana() && diaDoPlano === diaDeHoje();
  $('resumoPlano').textContent = abriuNoPadrao
    ? `Fim de semana, sem rotina hoje. Abaixo está a segunda-feira. ${placar}`
    : placar;

  const lista = $('listaPlano');
  // Pendentes primeiro: a lista existe para mostrar o que falta, e quem já está
  // pronto só precisa ficar visível para dar para desmarcar se foi engano.
  const itens = filtrarPlano()
    .slice()
    .sort((a, b) => (diaResolvido(a.id, diaDoPlano) ? 1 : 0) - (diaResolvido(b.id, diaDoPlano) ? 1 : 0)
      || a.cliente_nome.localeCompare(b.cliente_nome, 'pt-BR'));

  lista.innerHTML = itens.length ? '' : '<p class="vazio">Nenhum cliente com esse nome.</p>';
  itens.forEach(o => lista.appendChild(montarLinhaPlano(o, r)));
}

function montarLinhaPlano(o, r) {
  const responsavel = equipe.find(u => u.id === o.responsavel_id);

  const item = document.createElement('div');
  item.className = 'item-lista item-plano';
  item.classList.toggle('resolvido', diaResolvido(o.id, r.dia));
  item.dataset.id = o.id;
  item.innerHTML = `
    <div class="info">
      <strong>${escapar(o.cliente_nome)}</strong>
      <span>${escapar(responsavel ? responsavel.nome : 'sem responsável')}</span>
    </div>
    <div class="etapas">
      ${r.tarefas.map((t, i) => `<button type="button" class="etapa" data-tarefa="${i}">${escapar(t.rotulo)}</button>`).join('')}
    </div>`;

  r.tarefas.forEach((t, i) => {
    const situacao = situacaoDaTarefa(o.id, t);
    const botao = item.querySelector(`[data-tarefa="${i}"]`);
    botao.className = `etapa ${situacao}`;
    botao.title = `${t.rotulo}: ${NOME_SITUACAO[situacao]}, clique para mudar`;
  });

  return item;
}

/* O que ficou para trás nos dias anteriores da mesma semana. É a parte que a
   planilha nunca respondeu: lá o atraso só aparecia se alguém fosse procurar. */
function renderAtrasadosDoPlano() {
  // No fim de semana todos os cinco dias já passaram, e é justamente aí que a
  // pergunta "o que a semana deixou para trás" é a mais útil da tela.
  const limite = fimDeSemana() ? 6 : diaDeHoje();
  const bloco = $('atrasadosPlano');
  const lista = $('listaAtrasados');
  lista.innerHTML = '';

  const pendencias = [];
  // Fora o dia que já está na lista de cima: no fim de semana a segunda entra nas
  // duas pontas, e o mesmo cliente apareceria duas vezes na mesma tela.
  ROTINA.filter(r => r.dia < limite && r.dia !== diaDoPlano).forEach(r => {
    clientesDoPlano().forEach(o => {
      if (!diaResolvido(o.id, r.dia)) pendencias.push({ o, r });
    });
  });

  bloco.classList.toggle('oculto', pendencias.length === 0);
  if (!pendencias.length) return;

  $('tituloAtrasados').textContent = pendencias.length === 1
    ? '1 pendência de outro dia desta semana'
    : `${pendencias.length} pendências de outros dias desta semana`;

  pendencias.forEach(({ o, r }) => {
    const responsavel = equipe.find(u => u.id === o.responsavel_id);
    const item = document.createElement('div');
    item.className = 'item-lista item-plano';
    item.dataset.id = o.id;
    item.dataset.dia = r.dia;
    item.innerHTML = `
      <div class="info">
        <strong>${escapar(o.cliente_nome)}</strong>
        <span>${escapar(responsavel ? responsavel.nome : 'sem responsável')}</span>
      </div>
      <span class="etiqueta">${escapar(r.nome.toLowerCase())}</span>
      <div class="etapas">
        ${r.tarefas.map((t, i) => `<button type="button" class="etapa" data-tarefa="${i}">${escapar(t.rotulo)}</button>`).join('')}
      </div>`;

    r.tarefas.forEach((t, i) => {
      const situacao = situacaoDaTarefa(o.id, t);
      const botao = item.querySelector(`[data-tarefa="${i}"]`);
      botao.className = `etapa ${situacao}`;
      botao.title = `${t.rotulo}: ${NOME_SITUACAO[situacao]}, clique para mudar`;
    });

    lista.appendChild(item);
  });
}

/* ---------- edição ---------- */

// Marcar aqui grava exatamente na mesma linha que a aba de origem gravaria, então
// as duas telas nunca discordam. Depois do salvamento eu redesenho as outras abas
// também: elas estão escondidas, mas ficariam com o número velho se alguém trocasse
// de aba sem recarregar a página.
async function aoClicarTarefaPlano(evento) {
  const botao = evento.target.closest('.etapa');
  if (!botao) return;

  const item = botao.closest('.item-plano');
  const cliente = onboardings.find(o => o.id === item.dataset.id);
  if (!cliente) return;

  const r = rotinaDo(Number(item.dataset.dia || diaDoPlano));
  const tarefa = r.tarefas[Number(botao.dataset.tarefa)];
  const linha = linhaDaTarefa(cliente.id, tarefa.fonte, true);
  const anterior = linha[tarefa.campo];

  // Math.max protege estados que não estão nesta fila: indexOf devolveria -1 e o
  // clique não sairia do lugar.
  const fila = SITUACOES_DA_FONTE[tarefa.fonte];
  const atual = Math.max(fila.indexOf(anterior), 0);
  linha[tarefa.campo] = fila[(atual + 1) % fila.length];

  // Mesma regra da aba de relatório: quem marca "enviado" não precisa datar à mão.
  const datava = tarefa.fonte === 'relatorio' && tarefa.campo === 'enviado';
  const dataAnterior = linha.enviado_em;
  if (datava) linha.enviado_em = linha.enviado === 'concluido' ? hojeISO() : null;

  renderPlano();

  try {
    await Store.salvar(TABELA_DA_FONTE[tarefa.fonte], linha);
    renderConteudo();
    renderSeo();
    renderRelatorio();
    avisarPlano('');
  } catch (e) {
    linha[tarefa.campo] = anterior;
    if (datava) linha.enviado_em = dataAnterior;
    renderPlano();
    avisarPlano(`Não foi possível salvar: ${e.message}`, 'erro');
  }
}

function aoEscolherDia(evento) {
  const botao = evento.target.closest('.dia');
  if (!botao) return;
  diaDoPlano = Number(botao.dataset.dia);
  renderPlano();
}

function avisarPlano(texto, tipo) {
  $('planoAviso').textContent = texto;
  $('planoAviso').className = `aviso ${tipo || ''}`;
}

/* ---------- início ---------- */

function iniciarPlano() {
  diaDoPlano = diaDeHoje();
  $('diasPlano').addEventListener('click', aoEscolherDia);
  $('listaPlano').addEventListener('click', aoClicarTarefaPlano);
  $('listaAtrasados').addEventListener('click', aoClicarTarefaPlano);
  $('buscaPlano').addEventListener('input', renderTarefasDoPlano);
}
