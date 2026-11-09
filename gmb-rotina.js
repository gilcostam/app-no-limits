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
  { ciclo: 'semanal', id: 'perguntas', label: 'Perguntas e respostas (Q&A)',
    desc: 'Responder o que chegou e publicar as dúvidas que mais aparecem no WhatsApp.' },
  { ciclo: 'semanal', id: 'mensagens', label: 'Mensagens do perfil',
    desc: 'Limpar a caixa de mensagens. Demora em responder derruba a exibição.' },
  { ciclo: 'semanal', id: 'edicoes_sugeridas', label: 'Conferir edições sugeridas',
    desc: 'Usuários e o próprio Google alteram horário, telefone e endereço sem avisar. Reverter o que estiver errado.' },
  { ciclo: 'semanal', id: 'saude_perfil', label: 'Conferir saúde do perfil',
    desc: 'Ver se não há aviso de suspensão, pendência de verificação ou post reprovado.' },

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
    desc: 'Anotar buscas, visualizações, ligações, pedidos de rota e cliques no site. É isso que vai no relatório.' },
  { ciclo: 'mensal', id: 'links_utm', label: 'Links de ação e rastreamento',
    desc: 'Conferir botão do site, WhatsApp, agendamento e pedido. Links com UTM para saber o que veio do Google.' },
  { ciclo: 'mensal', id: 'concorrentes', label: 'Olhar 2 ou 3 concorrentes',
    desc: 'Categorias que usam, frequência de post, nº de avaliações e nota. Serve para calibrar a rotina.' },
  { ciclo: 'mensal', id: 'campanha_avaliacoes', label: 'Campanha de avaliações',
    desc: 'Mandar o link curto de avaliação para os clientes atendidos no mês. Volume constante vale mais que pico.' },

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

  const termo = semAcentos(buscaGmb.trim());
  const filtrados = [...clientes]
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
    .filter(c => !termo
      || semAcentos(c.nome).includes(termo)
      || semAcentos(c.email).includes(termo));

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
      bloco.appendChild(div);
    });

    container.appendChild(bloco);
  });
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
