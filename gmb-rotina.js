/* ============================================================
   ROTINA GOOGLE MEU NEGÓCIO
   Checklist recorrente por cliente, com três ciclos:
   semanal, mensal e trimestral.
   ============================================================ */

const GMB_ACOES = [
  /* ---------- toda semana ---------- */
  { ciclo: 'semanal', id: 'post_semana', label: 'Postagem da semana',
    desc: '1 a 2 posts do tipo Novidade, sempre com chamada para ação e link rastreado.' },
  { ciclo: 'semanal', id: 'fotos_semana', label: 'Envio de fotos para o perfil',
    desc: '3 a 5 fotos reais do cliente: ambiente, equipe, produto, bastidor. Nunca banco de imagens.' },
  { ciclo: 'semanal', id: 'avaliacoes', label: 'Resposta às avaliações novas',
    desc: 'Responder todas, positivas e negativas. Meta: em até 48h.' },
  { ciclo: 'semanal', id: 'edicoes_sugeridas', label: 'Conferir edições sugeridas',
    desc: 'Usuários e o próprio Google alteram horário, telefone e endereço sem avisar. Reverter o que estiver errado.' },
  { ciclo: 'semanal', id: 'saude_perfil', label: 'Conferir saúde do perfil',
    desc: 'Ver se não há aviso de suspensão, pendência de verificação ou post reprovado.' },

  /* Três tarefas saíram da lista semanal em 11/11/2026. O motivo fica
     escrito aqui porque tarefa que desaparece sem explicação volta: alguém
     nota a falta, acha que foi apagada por engano e recadastra.

     'mensagens' ("limpar a caixa de mensagens") era impossível de cumprir.
     O Google parou de abrir novas conversas no perfil em 15/07/2024 e
     removeu mensagens, chat e histórico de chamadas em 31/07/2024. Os
     dados confirmam sem margem: BUSINESS_CONVERSATIONS soma zero em 4.240
     linhas de PerformanceMetric, nos 30 perfis, em todos os meses.

     'perguntas' (Q&A) saiu pelo mesmo motivo, conferido pela Gilmara no
     perfil real em 11/11/2026: o recurso não está mais disponível.

     'claude_analise' não morreu, virou mensal dentro de 'concorrentes'.
     Eram duas tarefas pedindo a mesma coisa (comparar com concorrente),
     uma toda semana e outra todo mês. Semana é frequência maior que a
     velocidade com que concorrente muda categoria, foto ou descrição.

     A marcação antiga destes três ids continua gravada e não incomoda: o
     contador conta só o que está em GMB_ACOES, então o progresso
     recalcula sozinho (a semana era 8/8 e virou 5/5). */

  /* ---------- todo mês ---------- */
  { ciclo: 'mensal', id: 'categorias', label: 'Categoria principal e secundárias',
    desc: 'A categoria principal é o que mais pesa no ranqueamento local. Revisar se ainda é a melhor.' },
  { ciclo: 'mensal', id: 'produtos_servicos', label: 'Produtos e serviços',
    desc: 'Cadastrar os novos e revisar descrição e preço dos antigos. Serviço sem descrição não aparece em busca.' },
  { ciclo: 'mensal', id: 'descricao', label: 'Descrição do negócio',
    desc: 'Revisar os 750 caracteres com os termos que o cliente quer aparecer e a cidade de atendimento.' },
  { ciclo: 'mensal', id: 'atributos', label: 'Atributos do perfil',
    desc: 'Formas de pagamento, acessibilidade, estacionamento, atendimento. Cada atributo é um filtro de busca.' },
  { ciclo: 'mensal', id: 'horario_especial', label: 'Horários especiais e feriados',
    desc: 'Preencher antes do feriado. Horário errado gera avaliação ruim e some do mapa.' },
  { ciclo: 'mensal', id: 'desempenho', label: 'Números de desempenho',
    desc: 'Visualizações por origem, ligações, pedidos de rota e cliques no site já estão no app de avaliações, puxados da API do Google. Abrir, ler o mês e escrever a interpretação. Se as visualizações caíram mais de 20% contra dois meses atrás, isto deixa de ser leitura e passa a ser diagnóstico: veja a tarefa de perfis em queda.',
    relatorio: true },

  /* Esta tarefa já pedia para conferir os botões, mas conferir que o botão
     existe não é o mesmo que conferir que ele funciona, e a diferença
     aparece no relatório. Almofadas Moretto Casa, em seis meses: 246
     pedidos de rota e 1 ligação. Em outubro, 168 visualizações e 1 clique
     no site. Perfil visto 168 vezes com 1 clique não tem problema de
     ranqueamento, tem botão faltando ou levando a lugar nenhum. Nenhuma
     outra tarefa da rotina pega isso, porque todas olham o perfil por
     dentro, do lado de quem administra. */
  { ciclo: 'mensal', id: 'links_utm', label: 'Botões de ação e rastreamento',
    desc: 'Abrir o perfil como cliente e clicar em cada botão: site, WhatsApp, ligar, rota, agendamento, pedido. Confirmar que cada um abre o destino certo e que o link do site tem UTM. Comparar com os cliques do relatório: muita visualização com pouco clique é botão quebrado, não falta de alcance.' },

  { ciclo: 'mensal', id: 'concorrentes', label: 'Análise do perfil e da concorrência com o Claude',
    desc: 'Abrir o perfil do cliente numa aba, chamar o Claude pela extensão do navegador e pedir a comparação com os concorrentes. O botão ao lado copia o pedido pronto.',
    prompt: `Analise o perfil do Google Meu Negócio de {cliente}, que está aberto nesta aba, e compare com os 3 primeiros concorrentes que aparecem na busca local da mesma categoria e cidade.

Me responda em lista curta:
1. Categoria principal e secundárias: a dele está certa? Quais os concorrentes usam?
2. Avaliações: quantidade e nota dele contra a deles, e quantas entraram nos últimos 30 dias.
3. Fotos: quantidade e data da última. Que tipo de foto está faltando.
4. Posts: com que frequência ele publica contra a frequência deles.
5. Descrição, produtos, serviços e atributos: o que está vazio, curto ou genérico.
6. O que os concorrentes têm no perfil que ele não tem.

No fim, me entregue as 3 mudanças que mais mudam posição, em ordem de impacto, já com o texto pronto para colar.

Não altere nada no perfil por conta própria. Nome, endereço, telefone e categoria eu mesma altero, porque edição errada nesses campos derruba ou suspende o perfil.` },

  /* A justificativa antiga desta tarefa era ranqueamento ("volume constante
     vale mais que pico"), e os dados dos 29 perfis com histórico completo
     não sustentam isso. Correlação entre avaliações novas nos últimos três
     meses e crescimento das visualizações: 0,009, que é ruído. Entre total
     de avaliações e crescimento das visualizações: -0,169. Advogada Michele
     tem 70 avaliações e caiu 5%; Lineu Biazotti tem 1.071 e caiu 16%; Dr.
     Talvane tem 2 e subiu 42%.

     A tarefa fica, a promessa muda. Avaliação decide quem já te achou, não
     quem ainda vai te achar. Isso importa porque justificativa errada faz
     a pessoa esperar subida de posição, não ver, e concluir que pedir
     avaliação não serve para nada. Serve, só não para isso. */
  { ciclo: 'mensal', id: 'campanha_avaliacoes', label: 'Campanha de avaliações',
    desc: 'Mandar o link curto de avaliação para os clientes atendidos no mês. Isso move conversão e confiança (quem achou o perfil decide ligar), não posição na busca: nos nossos 30 perfis, volume de avaliação não tem relação com crescimento de visualizações.' },

  /* A rotina trata igual quem subiu 88% e quem caiu 60%, e queda forte não
     se resolve fazendo a mesma volta de tarefas com mais empenho: tem
     causa própria (suspensão parcial, categoria alterada, edição sugerida
     aceita pelo Google, concorrente novo). A lista de quem caiu mora no app
     de avaliações, que é onde os números estão, e se refaz todo dia. */
  { ciclo: 'mensal', id: 'perfis_em_queda', label: 'Fora da rotina: perfis em queda',
    desc: 'Abrir a lista de perfis que perderam visualização e conferir se este cliente está nela. Quem está precisa de diagnóstico individual no mês, não de mais uma volta do checklist.',
    link: { url: 'https://nolimits-reviews.vercel.app/dashboard', texto: 'Ver perfis em queda',
      titulo: 'Abre o painel do app de avaliações, que lista os perfis com queda de visualização contra dois meses atrás' } },

  /* ---------- todo trimestre ---------- */
  { ciclo: 'trimestral', id: 'nap', label: 'Conferência de NAP',
    desc: 'Nome, endereço e telefone idênticos no perfil, no site e nas redes. Divergência confunde o Google.' },
  { ciclo: 'trimestral', id: 'duplicados', label: 'Procurar perfil duplicado',
    desc: 'Perfil repetido divide as avaliações e o ranqueamento. Pedir remoção quando achar.' },
  { ciclo: 'trimestral', id: 'biblioteca_fotos', label: 'Limpeza da biblioteca de fotos',
    desc: 'Tirar foto velha ou fora do padrão, confirmar logo e capa atuais.' },
  { ciclo: 'trimestral', id: 'area_atendimento', label: 'Área de atendimento e mapa',
    desc: 'Revisar as cidades e o pino no mapa. Pino deslocado derruba a busca por proximidade.' },
  { ciclo: 'trimestral', id: 'leitura_avaliacoes', label: 'Leitura do conjunto de avaliações',
    desc: 'Ver o que se repete nas reclamações. Isso é informação de operação para devolver ao cliente.' },
];

const GMB_CICLOS = [
  { id: 'semanal', titulo: 'Toda semana', nota: 'Reinicia a cada semana.' },
  { id: 'mensal', titulo: 'Todo mês', nota: 'Reinicia a cada mês.' },
  { id: 'trimestral', titulo: 'Todo trimestre', nota: 'Reinicia a cada trimestre.' },
];

let gmbCliente = null;
let gmbData = new Date();
let buscaGmb = '';

/* ---------- datas ---------- */

function gmbSegundaDaSemana(data) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const dia = d.getDay();
  d.setDate(d.getDate() - (dia === 0 ? 6 : dia - 1));
  return d;
}

function gmbNumeroSemana(data) {
  const d = gmbSegundaDaSemana(data);
  const quinta = new Date(d);
  quinta.setDate(d.getDate() + 3);
  const primeira = new Date(quinta.getFullYear(), 0, 4);
  const diff = (quinta - gmbSegundaDaSemana(primeira)) / 604800000;
  return { ano: quinta.getFullYear(), semana: Math.round(diff) + 1 };
}

function gmbChave(ciclo) {
  if (!gmbCliente) return null;
  const base = `gmb_${gmbCliente.id}`;
  if (ciclo === 'semanal') {
    const { ano, semana } = gmbNumeroSemana(gmbData);
    return `${base}_${ano}-S${String(semana).padStart(2, '0')}`;
  }
  if (ciclo === 'mensal') {
    return `${base}_${gmbData.getFullYear()}-M${String(gmbData.getMonth() + 1).padStart(2, '0')}`;
  }
  return `${base}_${gmbData.getFullYear()}-T${Math.floor(gmbData.getMonth() / 3) + 1}`;
}

function gmbLerCiclo(ciclo) {
  const chave = gmbChave(ciclo);
  return chave ? Checklist.ler(chave) : {};
}

function gmbLabelSemana() {
  const inicio = gmbSegundaDaSemana(gmbData);
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  const fmt = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const { semana } = gmbNumeroSemana(gmbData);
  return `Semana ${semana} · ${fmt(inicio)} a ${fmt(fim)}`;
}

/* chave de qualquer cliente, não só o selecionado */
function gmbChaveDe(clienteId, ciclo) {
  const base = `gmb_${clienteId}`;
  if (ciclo === 'semanal') {
    const { ano, semana } = gmbNumeroSemana(gmbData);
    return `${base}_${ano}-S${String(semana).padStart(2, '0')}`;
  }
  if (ciclo === 'mensal') {
    return `${base}_${gmbData.getFullYear()}-M${String(gmbData.getMonth() + 1).padStart(2, '0')}`;
  }
  return `${base}_${gmbData.getFullYear()}-T${Math.floor(gmbData.getMonth() / 3) + 1}`;
}

/* progresso de um ciclo para qualquer cliente */
function gmbProgressoCiclo(clienteId, ciclo) {
  const estado = Checklist.ler(gmbChaveDe(clienteId, ciclo));
  const acoes = GMB_ACOES.filter(a => a.ciclo === ciclo);
  return { feitas: acoes.filter(a => estado[a.id] === true).length, total: acoes.length };
}

/* ---------- lista de clientes ---------- */

function renderizarListaClientesGmb() {
  const lista = $('listaClientesGmb');
  if (!lista) return;

  lista.innerHTML = '';

  if (!clientes || clientes.length === 0) {
    lista.innerHTML = '<div class="cliente-item">Nenhum cliente cadastrado</div>';
    return;
  }

  /* Só quem contratou Google Meu Negócio. Definido na aba Workflow. */
  const contratantes = Servicos.comServico('gmb');

  /* O cliente aberto pode ter acabado de perder o serviço no Workflow.
     Sem isto a rotina dele continuaria na tela, editável. */
  if (gmbCliente && !contratantes.some(c => c.id === gmbCliente.id)) {
    gmbCliente = null;
    renderizarRotinaGmb();
  }

  if (contratantes.length === 0) {
    lista.innerHTML = '<div class="cliente-item lista-vazia">Nenhum cliente com Google Meu Negócio contratado. Marque o serviço na aba Workflow.</div>';
    atualizarContagem('contagemGmb', 0);
    return;
  }

  const termo = semAcentos(buscaGmb.trim());
  const filtrados = contratantes
    .slice()
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
    .filter(c => !termo
      || semAcentos(c.nome).includes(termo)
      || semAcentos(c.email).includes(termo));

  atualizarContagem('contagemGmb', filtrados.length);

  if (filtrados.length === 0) {
    lista.innerHTML = '<div class="cliente-item lista-vazia">Nenhum cliente encontrado</div>';
    return;
  }

  filtrados.forEach(cliente => {
      const div = document.createElement('div');
      div.className = 'cliente-item';
      div.dataset.clienteId = cliente.id;
      if (gmbCliente && gmbCliente.id === cliente.id) div.classList.add('ativo');

      const sem = gmbProgressoCiclo(cliente.id, 'semanal');
      const mes = gmbProgressoCiclo(cliente.id, 'mensal');
      const tri = gmbProgressoCiclo(cliente.id, 'trimestral');
      const ok = p => p.feitas === p.total ? ' completo' : '';

      div.innerHTML = `
        <div class="cliente-item-conteudo">
          <div class="cliente-item-nome">${escapar(cliente.nome)}</div>
          <div class="cliente-item-progresso">
            <span class="barra-progresso"><i style="width:${Math.round((sem.feitas / sem.total) * 100)}%"></i></span>
            <span class="progresso-texto${ok(sem)}">${sem.feitas}/${sem.total} semana</span>
          </div>
          <div class="ciclos-resumo">
            <span class="ciclo-mini${ok(mes)}">mês ${mes.feitas}/${mes.total}</span>
            <span class="ciclo-mini${ok(tri)}">trim ${tri.feitas}/${tri.total}</span>
          </div>
        </div>
      `;
      lista.appendChild(div);
    });
}

let gmbListaLigada = false;

function ligarListaGmb() {
  const lista = $('listaClientesGmb');
  if (!lista || gmbListaLigada) return;
  gmbListaLigada = true;

  lista.addEventListener('click', e => {
    const item = e.target.closest('.cliente-item');
    if (!item) return;
    const cliente = clientes.find(c => c.id === item.dataset.clienteId);
    if (!cliente) return;
    gmbCliente = cliente;
    renderizarListaClientesGmb();
    renderizarRotinaGmb();
  });

  $('gmbSemanaAnterior')?.addEventListener('click', () => moverSemanaGmb(-7));
  $('gmbSemanaProxima')?.addEventListener('click', () => moverSemanaGmb(7));

  $('buscaClientesGmb')?.addEventListener('input', e => {
    buscaGmb = e.target.value;
    renderizarListaClientesGmb();
  });
}

/* ---------- rotina ---------- */

function renderizarRotinaGmb() {
  const info = $('gmbClienteSelecionado');
  const container = $('gmbRotina');
  const label = $('gmbSemanaLabel');
  if (!container) return;

  if (label) label.textContent = gmbLabelSemana();

  if (!gmbCliente) {
    if (info) info.innerHTML = '<div class="cliente-info-empty">Selecione um cliente para ver a rotina</div>';
    container.innerHTML = '';
    return;
  }

  if (info) info.innerHTML = `<h2 class="cliente-info-nome">${escapar(gmbCliente.nome)}</h2>`;
  container.innerHTML = '';

  GMB_CICLOS.forEach(ciclo => {
    const acoes = GMB_ACOES.filter(a => a.ciclo === ciclo.id);
    const estado = gmbLerCiclo(ciclo.id);
    const feitas = acoes.filter(a => estado[a.id] === true).length;

    const bloco = document.createElement('div');
    bloco.className = 'gmb-bloco';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'gmb-bloco-cabecalho';
    cabecalho.innerHTML = `
      <h3>${ciclo.titulo}</h3>
      <span class="gmb-contador${feitas === acoes.length ? ' completo' : ''}">${feitas}/${acoes.length}</span>
    `;
    bloco.appendChild(cabecalho);

    acoes.forEach(acao => {
      const div = document.createElement('div');
      div.className = 'item-check';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `gmb_${ciclo.id}_${acao.id}`;
      input.checked = estado[acao.id] === true;
      input.addEventListener('change', e => marcarAcaoGmb(ciclo.id, acao.id, e.target.checked));

      const lab = document.createElement('label');
      lab.htmlFor = input.id;
      lab.textContent = acao.label;
      if (acao.desc) {
        const d = document.createElement('div');
        d.className = 'descricao';
        d.textContent = acao.desc;
        lab.appendChild(d);
      }

      div.appendChild(input);
      div.appendChild(lab);

      /* Ação que depende de um texto longo ganha botão de copiar. Decorar
         o pedido não funciona: cada um pede de um jeito e a resposta do
         Claude vem diferente, aí não dá para comparar semana com semana. */
      if (acao.prompt) div.appendChild(botaoCopiarPrompt(acao.prompt));

      /* Ação cujos números já existem no app de avaliações ganha o link
         direto, no mês que está sendo olhado aqui. Sem isso a pessoa
         abre o outro app, procura o cliente na lista de 30 e escolhe o
         mês de novo, três passos para chegar onde o app já sabia. */
      if (acao.relatorio && typeof linkRelatorioGmb === 'function') {
        div.appendChild(linkRelatorioGmb(gmbCliente.id, gmbData));
      }

      /* Link fixo, igual para todos os clientes. Separado do caso acima
         porque aquele depende do vínculo do cliente com um perfil e pode
         virar aviso de "não vinculado"; este é sempre a mesma página. */
      if (acao.link) {
        const a = document.createElement('a');
        a.className = 'copiar-prompt relatorio-link';
        a.href = acao.link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = acao.link.texto;
        a.title = acao.link.titulo || '';
        div.appendChild(a);
      }

      bloco.appendChild(div);
    });

    container.appendChild(bloco);
  });
}

/* O nome do cliente entra no texto para o pedido já sair pronto, sem
   ninguém precisar editar antes de colar no Claude. */
function botaoCopiarPrompt(modelo) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'copiar-prompt';
  botao.textContent = 'Copiar pedido';
  botao.title = 'Copia o texto para colar no Claude';

  botao.addEventListener('click', async () => {
    const texto = modelo.replace('{cliente}', gmbCliente ? gmbCliente.nome : 'o cliente');
    try {
      await navigator.clipboard.writeText(texto);
      botao.textContent = 'Copiado';
    } catch {
      /* Navegador antigo ou permissão negada: em vez de falhar calado,
         deixa o texto selecionado para o Ctrl+C manual. */
      const area = document.createElement('textarea');
      area.value = texto;
      area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(area);
      area.select();
      botao.textContent = document.execCommand('copy') ? 'Copiado' : 'Copie com Ctrl+C';
      area.remove();
    }
    setTimeout(() => { botao.textContent = 'Copiar pedido'; }, 2000);
  });

  return botao;
}

function marcarAcaoGmb(ciclo, acaoId, marcado) {
  const chave = gmbChave(ciclo);
  if (!chave) return;
  const estado = gmbLerCiclo(ciclo);
  estado[acaoId] = marcado;
  estado.atualizado_em = new Date().toISOString();
  Checklist.gravar(chave, estado);
  renderizarRotinaGmb();
  renderizarListaClientesGmb();
}

function moverSemanaGmb(dias) {
  gmbData = new Date(gmbData.getFullYear(), gmbData.getMonth(), gmbData.getDate() + dias);
  renderizarRotinaGmb();
  renderizarListaClientesGmb();
}

function iniciarGmb() {
  ligarListaGmb();
  renderizarListaClientesGmb();
  renderizarRotinaGmb();
}

console.log('✓ gmb-rotina.js carregado');
