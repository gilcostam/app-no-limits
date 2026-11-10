/* ============================================================
   PAINEL — o que já foi feito e o que falta

   As quatro abas de trabalho mostram um cliente por vez. Nenhuma
   responde as três perguntas de gestão: quanto falta no total,
   quem está mais atrasado, e o que exatamente falta em cada um.

   COMO O REINÍCIO POR CICLO FUNCIONA

   Nenhuma tarefa é apagada por rotina. O estado é gravado numa
   chave que carrega o período dentro do próprio nome:

     gmb_<cliente>_2026-S46   semana 46
     gmb_<cliente>_2026-M11   novembro de 2026
     gmb_<cliente>_2026-T4    4º trimestre de 2026

   Quando o período vira, o nome da chave muda, a leitura não
   encontra nada e o ciclo nasce vazio. Zerar de propósito seria
   pior: apagaria o histórico. Assim novembro continua consultável
   em dezembro, e é disso que este painel vive.

   O que NÃO reinicia, de propósito: a entrada do cliente
   (Workflow), a fundação do site e os cadastros em diretórios.
   São tarefas de uma vez só.

   DUAS REGRAS PARA O NÚMERO NÃO MENTIR

   1. Período que ainda não começou não entra como pendência.
      Sem isso, olhar dezembro em novembro pintaria tudo de
      vermelho por tarefa que ninguém devia ter feito ainda.

   2. Só conta tarefa que o cliente pagou. Um cliente que não
      contratou site não tem pendência de site. E em diretórios,
      só os essenciais são cobrados: os de segmento são "marque
      se fizer sentido", então contá-los deixaria todo mundo
      permanentemente incompleto.
   ============================================================ */

const PAINEL_VERDE = '#1B7F3B';
const PAINEL_AMBAR = '#C9870A';

/* Primeiro dia do mês em análise. Guardado como data, e não como
   "2026-11", porque a navegação entre meses usa aritmética de data. */
let painelMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let painelSoPendentes = true;

/* ---------- datas ----------

   A numeração de semana vem de gmbNumeroSemana(), do gmb-rotina.js,
   de propósito: se o painel calculasse a semana por conta própria e
   divergisse num ano virado, ele leria chaves que não existem e
   mostraria tudo pendente sem motivo. */

const painelHoje = () => new Date();

function painelDia(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function painelChaveMes(ano, mes) {
  return `${ano}-M${String(mes).padStart(2, '0')}`;
}

function painelChaveTri(ano, trimestre) {
  return `${ano}-T${trimestre}`;
}

/* As semanas de um mês. Uma semana pertence ao mês em que cai a sua
   segunda-feira, senão a semana que atravessa a virada apareceria
   duas vezes e o total do ano não fecharia. */
function painelSemanasDoMes() {
  const ano = painelMes.getFullYear();
  const mes = painelMes.getMonth();
  const semanas = [];

  const primeira = gmbSegundaDaSemana(new Date(ano, mes, 1));
  if (primeira.getMonth() !== mes) primeira.setDate(primeira.getDate() + 7);

  for (const s = new Date(primeira); s.getMonth() === mes; s.setDate(s.getDate() + 7)) {
    const inicio = new Date(s);
    const fim = new Date(s);
    fim.setDate(fim.getDate() + 6);
    const { ano: a, semana } = gmbNumeroSemana(inicio);
    semanas.push({
      numero: semana,
      inicio,
      fim,
      chave: `${a}-S${String(semana).padStart(2, '0')}`,
      comecou: inicio <= painelHoje(),
    });
  }
  return semanas;
}

function painelPeriodo() {
  const ano = painelMes.getFullYear();
  const mes = painelMes.getMonth() + 1;
  const trimestre = Math.floor(painelMes.getMonth() / 3) + 1;
  const rotulo = painelMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return {
    ano,
    mes,
    trimestre,
    chaveMes: painelChaveMes(ano, mes),
    chaveTri: painelChaveTri(ano, trimestre),
    rotulo: rotulo.charAt(0).toUpperCase() + rotulo.slice(1),
    semanas: painelSemanasDoMes(),
    mesComecou: painelMes <= painelHoje(),
    triComecou: new Date(ano, (trimestre - 1) * 3, 1) <= painelHoje(),
  };
}

/* ---------- blocos de tarefa ----------

   Um "bloco" é um conjunto de itens que compartilham uma chave de
   estado: as 8 tarefas semanais do GMB da semana 46, por exemplo.
   Toda a contagem do painel sai daqui, para não existirem duas
   formas de calcular a mesma pendência. */

const PAINEL_AREAS = [
  { id: 'workflow', titulo: 'Entrada do cliente' },
  { id: 'gmb', titulo: 'Google Meu Negócio' },
  { id: 'dir', titulo: 'Diretórios locais' },
  { id: 'site', titulo: 'Site' },
];

const PAINEL_CICLOS = [
  { id: 'semanal', titulo: 'Toda semana', nota: 'Reinicia na segunda-feira.' },
  { id: 'mensal', titulo: 'Todo mês', nota: 'Reinicia no dia 1º.' },
  { id: 'trimestral', titulo: 'Todo trimestre', nota: 'Reinicia a cada três meses.' },
  { id: 'permanente', titulo: 'Base, uma vez só', nota: 'Não reinicia. Marcou, ficou marcado.' },
];

function painelBlocosDoCliente(cliente, p) {
  const id = cliente.id;
  const blocos = [];

  const add = o => {
    if (!o.itens || o.itens.length === 0) return;
    const estado = Checklist.ler(o.chave);
    const faltantes = o.itens.filter(i => estado[i.id] !== true);
    blocos.push({
      ...o,
      total: o.itens.length,
      feitas: o.itens.length - faltantes.length,
      faltantes,
    });
  };

  /* ----- não reinicia ----- */
  add({
    area: 'workflow', ciclo: 'permanente', periodo: 'Uma vez só',
    chave: `workflow_${id}`, itens: CHECKLIST_ITEMS,
  });

  /* ----- Google Meu Negócio ----- */
  if (Servicos.tem(id, 'gmb')) {
    p.semanas.filter(s => s.comecou).forEach(s => {
      add({
        area: 'gmb', ciclo: 'semanal',
        periodo: `Semana ${s.numero} · ${painelDia(s.inicio)} a ${painelDia(s.fim)}`,
        semana: s.numero,
        chave: `gmb_${id}_${s.chave}`,
        itens: GMB_ACOES.filter(a => a.ciclo === 'semanal'),
      });
    });
    if (p.mesComecou) add({
      area: 'gmb', ciclo: 'mensal', periodo: p.rotulo,
      chave: `gmb_${id}_${p.chaveMes}`,
      itens: GMB_ACOES.filter(a => a.ciclo === 'mensal'),
    });
    if (p.triComecou) add({
      area: 'gmb', ciclo: 'trimestral', periodo: `${p.trimestre}º trimestre de ${p.ano}`,
      chave: `gmb_${id}_${p.chaveTri}`,
      itens: GMB_ACOES.filter(a => a.ciclo === 'trimestral'),
    });
  }

  /* ----- diretórios locais ----- */
  if (Servicos.tem(id, 'dir')) {
    add({
      area: 'dir', ciclo: 'permanente', periodo: 'Uma vez só · só os essenciais',
      chave: `dir_${id}`,
      itens: DIRETORIOS.filter(d => d.grupo === 'essenciais'),
    });
    if (p.triComecou) add({
      area: 'dir', ciclo: 'trimestral', periodo: `${p.trimestre}º trimestre de ${p.ano}`,
      chave: `dir_${id}_${p.chaveTri}`,
      itens: DIR_AUDITORIA,
    });
  }

  /* ----- site ----- */
  if (Servicos.tem(id, 'site')) {
    add({
      area: 'site', ciclo: 'permanente', periodo: 'Uma vez só',
      chave: `site_${id}`, itens: siteItensDoCiclo('fundacao'),
    });
    if (p.mesComecou) add({
      area: 'site', ciclo: 'mensal', periodo: p.rotulo,
      chave: `site_${id}_${p.chaveMes}`, itens: siteItensDoCiclo('mensal'),
    });
    if (p.triComecou) add({
      area: 'site', ciclo: 'trimestral', periodo: `${p.trimestre}º trimestre de ${p.ano}`,
      chave: `site_${id}_${p.chaveTri}`, itens: siteItensDoCiclo('trimestral'),
    });
  }

  return blocos;
}

function painelRelatorio() {
  const p = painelPeriodo();
  const base = (clientes || []).slice().sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

  const fichas = base.map(cliente => {
    const blocos = painelBlocosDoCliente(cliente, p);
    const total = blocos.reduce((s, b) => s + b.total, 0);
    const feitas = blocos.reduce((s, b) => s + b.feitas, 0);
    const criticos = blocos.reduce(
      (s, b) => s + b.faltantes.filter(i => i.critico).length, 0);
    return { cliente, blocos, total, feitas, pendentes: total - feitas, criticos };
  });

  const soma = (lista, campo) => lista.reduce((s, x) => s + x[campo], 0);

  return {
    periodo: p,
    fichas,
    total: soma(fichas, 'total'),
    feitas: soma(fichas, 'feitas'),
    pendentes: soma(fichas, 'pendentes'),
    criticos: soma(fichas, 'criticos'),

    porArea: PAINEL_AREAS.map(a => {
      const bl = fichas.flatMap(f => f.blocos.filter(b => b.area === a.id));
      return {
        ...a,
        total: soma(bl, 'total'),
        feitas: soma(bl, 'feitas'),
        clientes: fichas.filter(f => f.blocos.some(b => b.area === a.id)).length,
      };
    }),

    porCiclo: PAINEL_CICLOS.map(c => {
      const bl = fichas.flatMap(f => f.blocos.filter(b => b.ciclo === c.id));
      return { ...c, total: soma(bl, 'total'), feitas: soma(bl, 'feitas') };
    }),
  };
}

/* ---------- gráficos ----------

   Feitos à mão em SVG. Uma biblioteca de gráfico seria mais código
   baixado da internet para desenhar quatro anéis e umas barras, e
   ainda viraria mais uma dependência externa para o app quebrar
   junto quando a CDN cair. */

function painelCor(pct, temItem) {
  if (!temItem) return 'var(--cinza-claro)';
  if (pct >= 100) return PAINEL_VERDE;
  if (pct > 0) return PAINEL_AMBAR;
  return 'var(--vermelho)';
}

function painelPct(feitas, total) {
  return total === 0 ? 0 : Math.round((feitas / total) * 100);
}

function painelAnelSvg(feitas, total, tamanho = 92) {
  const pct = painelPct(feitas, total);
  const traco = 9;
  const r = (tamanho - traco) / 2;
  const circ = 2 * Math.PI * r;
  const cor = painelCor(pct, total > 0);

  return `
    <svg class="painel-anel" viewBox="0 0 ${tamanho} ${tamanho}" width="${tamanho}" height="${tamanho}" role="img"
         aria-label="${pct}% concluído">
      <circle cx="${tamanho / 2}" cy="${tamanho / 2}" r="${r}"
              fill="none" stroke="var(--cinza-claro)" stroke-width="${traco}"></circle>
      ${pct === 0 ? '' : `<circle cx="${tamanho / 2}" cy="${tamanho / 2}" r="${r}"
              fill="none" stroke="${cor}" stroke-width="${traco}" stroke-linecap="round"
              stroke-dasharray="${(circ * pct) / 100} ${circ}"
              transform="rotate(-90 ${tamanho / 2} ${tamanho / 2})"></circle>`}
      <text x="50%" y="50%" class="painel-anel-texto" dominant-baseline="central"
            text-anchor="middle" fill="${total > 0 ? 'var(--preto)' : 'var(--cinza)'}">${pct}%</text>
    </svg>`;
}

function painelBarraSvg(feitas, total) {
  const pct = painelPct(feitas, total);
  return `
    <span class="painel-barra" title="${feitas} de ${total}">
      <i style="width:${pct}%;background:${painelCor(pct, total > 0)}"></i>
    </span>`;
}

/* ---------- render ---------- */

function renderizarPainel() {
  const alvo = $('painelConteudo');
  if (!alvo) return;

  const r = painelRelatorio();
  const rotuloMes = $('painelMesLabel');
  if (rotuloMes) rotuloMes.textContent = r.periodo.rotulo;

  if ((clientes || []).length === 0) {
    alvo.innerHTML = '<p class="painel-vazio">Nenhum cliente cadastrado ainda.</p>';
    return;
  }

  alvo.innerHTML = [
    painelResumoHtml(r),
    painelCiclosHtml(r),
    painelSemanasHtml(r),
    painelClientesHtml(r),
    painelLegendaHtml(),
  ].join('');
}

function painelResumoHtml(r) {
  const naoComecou = !r.periodo.mesComecou;

  const cartoes = r.porArea.map(a => `
    <div class="painel-cartao">
      ${painelAnelSvg(a.feitas, a.total)}
      <strong>${escapar(a.titulo)}</strong>
      <span class="painel-cartao-nota">${a.total === 0
        ? 'ninguém contratou'
        : `${a.feitas} de ${a.total} tarefas<br>${a.clientes} cliente(s)`}</span>
    </div>`).join('');

  return `
    ${naoComecou ? `<p class="painel-aviso">${escapar(r.periodo.rotulo)} ainda não começou.
      As tarefas aparecem conforme cada período entra.</p>` : ''}

    <div class="painel-faixa">
      <div class="painel-faixa-numero">
        <strong>${r.pendentes}</strong>
        <span>tarefa(s) faltando em ${escapar(r.periodo.rotulo)}</span>
      </div>
      <div class="painel-faixa-barra">
        ${painelBarraSvg(r.feitas, r.total)}
        <span class="painel-faixa-legenda">${r.feitas} feitas de ${r.total}
          · ${painelPct(r.feitas, r.total)}%</span>
      </div>
      ${r.criticos > 0
        ? `<span class="painel-selo-critico">${r.criticos} crítica(s)</span>`
        : ''}
    </div>

    <div class="painel-cartoes">${cartoes}</div>`;
}

function painelCiclosHtml(r) {
  const linhas = r.porCiclo.map(c => `
    <div class="painel-ciclo${c.total === 0 ? ' vazio' : ''}">
      <div class="painel-ciclo-nome">
        <strong>${escapar(c.titulo)}</strong>
        <span>${escapar(c.nota)}</span>
      </div>
      ${painelBarraSvg(c.feitas, c.total)}
      <span class="painel-ciclo-num">${c.total === 0 ? '—' : `${c.feitas}/${c.total}`}</span>
    </div>`).join('');

  return `
    <section class="painel-secao">
      <h3>Por ciclo</h3>
      <p class="painel-secao-nota">Cada faixa zera sozinha quando o período vira,
        porque o período faz parte do nome do registro. O histórico dos meses
        anteriores continua guardado.</p>
      <div class="painel-ciclos">${linhas}</div>
    </section>`;
}

function painelSemanasHtml(r) {
  const semanas = r.periodo.semanas;
  const comGmb = r.fichas.filter(f => f.blocos.some(b => b.ciclo === 'semanal'));
  if (semanas.length === 0 || comGmb.length === 0) return '';

  const cabecalho = semanas.map(s => `
    <th class="${s.comecou ? '' : 'futuro'}" title="${painelDia(s.inicio)} a ${painelDia(s.fim)}">
      S${s.numero}<span>${painelDia(s.inicio)}</span>
    </th>`).join('');

  const linhas = comGmb.map(f => {
    const celulas = semanas.map(s => {
      if (!s.comecou) return '<td class="painel-celula futuro" title="Semana ainda não começou">·</td>';
      const bloco = f.blocos.find(b => b.ciclo === 'semanal' && b.semana === s.numero);
      if (!bloco) return '<td class="painel-celula futuro">·</td>';
      const pct = painelPct(bloco.feitas, bloco.total);
      /* Cor sólida em vez de opacidade variável: fundo claro demais
         apagava o número dentro da célula, que é justamente o dado. */
      const classe = pct >= 100 ? 'cheia' : pct > 0 ? 'parcial' : 'zerada';
      return `<td class="painel-celula ${classe}"
                  title="Semana ${s.numero}: ${bloco.feitas} de ${bloco.total} feitas">${bloco.feitas}</td>`;
    }).join('');

    return `<tr><th class="painel-celula-nome">${escapar(f.cliente.nome)}</th>${celulas}</tr>`;
  }).join('');

  return `
    <section class="painel-secao">
      <h3>Semana a semana</h3>
      <p class="painel-secao-nota">Cada quadrado é uma semana de ${escapar(r.periodo.rotulo)}
        e mostra quantas das ${GMB_ACOES.filter(a => a.ciclo === 'semanal').length} tarefas
        semanais do Google Meu Negócio foram feitas. Quanto mais forte a cor, mais completo.
        Uma semana pertence ao mês em que cai a segunda-feira dela.</p>
      <div class="painel-mapa-wrap">
        <table class="painel-mapa">
          <thead><tr><th class="painel-celula-nome"></th>${cabecalho}</tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    </section>`;
}

function painelClientesHtml(r) {
  /* Quem tem mais pendência aparece primeiro: a lista existe para
     decidir por onde começar o dia, não para consultar alfabeticamente. */
  const ordenadas = r.fichas.slice().sort((a, b) =>
    b.criticos - a.criticos || b.pendentes - a.pendentes ||
    (a.cliente.nome || '').localeCompare(b.cliente.nome || ''));

  const visiveis = painelSoPendentes ? ordenadas.filter(f => f.pendentes > 0) : ordenadas;

  if (visiveis.length === 0) {
    return `
      <section class="painel-secao">
        <h3>Por cliente</h3>
        <p class="painel-tudo-feito">Nada pendente em ${escapar(r.periodo.rotulo)}.</p>
      </section>`;
  }

  return `
    <section class="painel-secao">
      <div class="painel-secao-cabecalho">
        <h3>Por cliente <span class="contagem-clientes">${visiveis.length}${
          painelSoPendentes && visiveis.length !== r.fichas.length ? ` de ${r.fichas.length}` : ''}</span></h3>
        <label class="painel-filtro">
          <input type="checkbox" id="painelFiltroPendentes" ${painelSoPendentes ? 'checked' : ''}>
          Só quem tem pendência
        </label>
      </div>
      <p class="painel-secao-nota">Clique no cliente para ver, item por item, o que falta.
        Quem tem pendência crítica vem primeiro.</p>
      ${visiveis.map(painelFichaHtml).join('')}
    </section>`;
}

function painelFichaHtml(f) {
  const pct = painelPct(f.feitas, f.total);

  const grupos = PAINEL_CICLOS.map(c => {
    const blocos = f.blocos.filter(b => b.ciclo === c.id && b.faltantes.length > 0);
    if (blocos.length === 0) return '';

    const corpo = blocos.map(b => {
      const area = PAINEL_AREAS.find(a => a.id === b.area);
      /* Item crítico primeiro: no site, conteúdo que o robô não lê
         anula todo o resto da lista. */
      const itens = b.faltantes.slice().sort((x, y) => (y.critico ? 1 : 0) - (x.critico ? 1 : 0));
      return `
        <div class="painel-bloco">
          <div class="painel-bloco-titulo">
            <strong>${escapar(area ? area.titulo : b.area)}</strong>
            <span>${escapar(b.periodo)}</span>
            <em>${b.faltantes.length} de ${b.total} faltando</em>
          </div>
          <ul class="painel-faltantes">
            ${itens.map(i => `<li${i.critico ? ' class="critico"' : ''}>${escapar(i.label)}${
              i.critico ? '<span class="item-critico">crítico</span>' : ''}</li>`).join('')}
          </ul>
        </div>`;
    }).join('');

    return `<div class="painel-grupo-ciclo"><h4>${escapar(c.titulo)}</h4>${corpo}</div>`;
  }).join('');

  return `
    <details class="painel-ficha">
      <summary>
        <span class="painel-ficha-nome">${escapar(f.cliente.nome)}</span>
        ${f.criticos > 0 ? `<span class="painel-selo-critico pequeno">${f.criticos} crítica(s)</span>` : ''}
        ${painelBarraSvg(f.feitas, f.total)}
        <span class="painel-ficha-num${f.pendentes === 0 ? ' completo' : ''}">${
          f.pendentes === 0 ? 'tudo feito' : `${f.pendentes} faltando`}</span>
        <span class="painel-ficha-pct">${pct}%</span>
      </summary>
      <div class="painel-ficha-corpo">${grupos || '<p class="painel-tudo-feito">Nada pendente.</p>'}</div>
    </details>`;
}

function painelLegendaHtml() {
  return `
    <div class="painel-legenda">
      <span><i style="background:${PAINEL_VERDE}"></i> tudo feito</span>
      <span><i style="background:${PAINEL_AMBAR}"></i> começou, falta terminar</span>
      <span><i style="background:var(--vermelho)"></i> nada feito</span>
      <span><i style="background:var(--cinza-claro)"></i> não começou ou não contratado</span>
    </div>`;
}

/* ---------- eventos ---------- */

function painelMoverMes(passo) {
  painelMes = new Date(painelMes.getFullYear(), painelMes.getMonth() + passo, 1);
  renderizarPainel();
}

let painelLigado = false;

function ligarPainel() {
  if (painelLigado) return;
  painelLigado = true;

  $('painelMesAnterior')?.addEventListener('click', () => painelMoverMes(-1));
  $('painelMesProximo')?.addEventListener('click', () => painelMoverMes(1));
  $('painelHoje')?.addEventListener('click', () => {
    const h = painelHoje();
    painelMes = new Date(h.getFullYear(), h.getMonth(), 1);
    renderizarPainel();
  });

  /* O conteúdo é refeito a cada render, então o filtro é ouvido no
     container e não na caixa, que deixa de existir a cada desenho. */
  $('painelConteudo')?.addEventListener('change', e => {
    if (e.target.id !== 'painelFiltroPendentes') return;
    painelSoPendentes = e.target.checked;
    renderizarPainel();
  });
}

function iniciarPainel() {
  ligarPainel();
  renderizarPainel();
}

console.log('✓ painel.js carregado');
