/* ============================================================
   WORKFLOW CHECKLIST: Lista de clientes + Checklist
   ============================================================ */

// As 8 fases, na ordem em que acontecem
const FASES = [
  { id: 'contrato', titulo: 'Contrato' },
  { id: 'cobranca', titulo: 'Cobrança' },
  { id: 'grupo', titulo: 'Grupo e briefing' },
  { id: 'google', titulo: 'Google Meu Negócio' },
  { id: 'materiais', titulo: 'Materiais' },
  { id: 'site', titulo: 'Site' },
  { id: 'cadastros', titulo: 'Cadastros' },
  { id: 'otimizacoes', titulo: 'Otimizações (rotina contínua)' },
];

// Itens do checklist em ordem
const CHECKLIST_ITEMS = [
  { fase: 'contrato', id: 'contrato_enviado', label: 'Contrato enviado', desc: 'Enviar contrato para o cliente assinar' },
  { fase: 'contrato', id: 'contrato_assinado', label: 'Contrato assinado', desc: 'Cliente assinou o contrato' },

  { fase: 'cobranca', id: 'cobranca_asaas', label: 'Cobrança criada no Asaas', desc: 'Registrar cobrança no sistema Asaas' },

  { fase: 'grupo', id: 'grupo_criado', label: 'Criação do grupo', desc: 'Criar grupo no WhatsApp ou Telegram' },
  { fase: 'grupo', id: 'briefing_preenchido', label: 'Briefing preenchido', desc: 'Cliente preencheu todas as informações do briefing' },

  { fase: 'google', id: 'acesso_gmb', label: 'Acesso ao perfil do Google', desc: 'Obter acesso ao Google My Business' },

  { fase: 'materiais', id: 'fotos_enviadas', label: 'Envio da foto de capa e produtos', desc: 'Fotos enviadas para aprovação' },
  { fase: 'materiais', id: 'fotos_aprovadas', label: 'Fotos aprovadas', desc: 'Cliente aprovou as fotos' },

  { fase: 'site', id: 'site_criado', label: 'Criação do site', desc: 'Site desenvolvido e em estágio' },
  { fase: 'site', id: 'site_aprovado', label: 'Aprovação do site', desc: 'Cliente aprovou o site' },
  { fase: 'site', id: 'site_publicado', label: 'Site publicado', desc: 'Site publicado e online' },

  { fase: 'cadastros', id: 'produtos_cadastrados', label: 'Cadastro de produtos e serviços', desc: 'Todos os produtos/serviços cadastrados' },

  { fase: 'otimizacoes', id: 'otimizacao_gmb', label: 'Rotina de otimização do perfil', desc: 'Posts, fotos e informações atualizadas regularmente' },
  { fase: 'otimizacoes', id: 'otimizacao_site', label: 'Rotina de otimização do site', desc: 'SEO, conteúdo e performance otimizados' },
];

let clienteSelecionado = null;
let clienteWorkflow = {};
let buscaWorkflow = '';
let situacaoWorkflow = 'todos';
let ordemWorkflow = 'nome';

/* tira acento para a busca achar "Antonio" digitando "antonio" */
function semAcentos(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/* ---------- estado salvo ----------
   Formato: { etapa_id: true, _datas: { etapa_id: '2026-11-08T...' } }
   A chave _datas começa com underscore e nenhuma etapa usa esse padrão,
   então os dados antigos (só booleanos) continuam funcionando. */

function lerEstado(clienteId) {
  return Checklist.ler(`workflow_${clienteId}`);
}

/* quantas etapas o cliente já concluiu */
function progressoCliente(clienteId, estadoPronto) {
  const estado = estadoPronto || lerEstado(clienteId);
  const feitas = CHECKLIST_ITEMS.filter(i => estado[i.id] === true).length;
  return { feitas, total: CHECKLIST_ITEMS.length };
}

function situacaoCliente(feitas, total) {
  if (feitas === 0) return 'nao-iniciado';
  return feitas === total ? 'completo' : 'andamento';
}

/* data da etapa concluída mais recente */
function ultimaAtividade(estado) {
  const datas = Object.values(estado._datas || {}).filter(Boolean).sort();
  return datas.length ? datas[datas.length - 1] : null;
}

function diasDesde(iso) {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function dataCurta(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function textoParado(dias) {
  if (dias === null) return '';
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'há 1 dia';
  return `há ${dias} dias`;
}

function renderizarListaClientes() {
  const lista = $('listaClientesWorkflow');
  if (!lista) return;

  lista.innerHTML = '';

  if (!clientes || clientes.length === 0) {
    lista.innerHTML = '<div class="cliente-item">Nenhum cliente cadastrado</div>';
    return;
  }

  const termo = semAcentos(buscaWorkflow.trim());

  // monta a ficha de cada cliente uma vez só
  const fichas = clientes.map(cliente => {
    const estado = lerEstado(cliente.id);
    const { feitas, total } = progressoCliente(cliente.id, estado);
    const atividade = ultimaAtividade(estado);
    return {
      cliente,
      feitas,
      total,
      situacao: situacaoCliente(feitas, total),
      atividade,
      dias: diasDesde(atividade),
    };
  });

  const visiveis = fichas
    .filter(f => situacaoWorkflow === 'todos' || f.situacao === situacaoWorkflow)
    .filter(f => !termo
      || semAcentos(f.cliente.nome).includes(termo)
      || semAcentos(f.cliente.email).includes(termo));

  if (ordemWorkflow === 'parado') {
    /* Em andamento primeiro, do mais parado para o mais recente.
       Depois os que nunca começaram. Os concluídos vão para o fim,
       porque eles não estão parados, estão prontos. */
    const peso = { andamento: 0, 'nao-iniciado': 1, completo: 2 };
    visiveis.sort((a, b) => {
      if (peso[a.situacao] !== peso[b.situacao]) return peso[a.situacao] - peso[b.situacao];
      if (a.atividade && b.atividade) return a.atividade.localeCompare(b.atividade);
      if (a.atividade) return -1;
      if (b.atividade) return 1;
      return (a.cliente.nome || '').localeCompare(b.cliente.nome || '');
    });
  } else {
    visiveis.sort((a, b) => (a.cliente.nome || '').localeCompare(b.cliente.nome || ''));
  }

  if (visiveis.length === 0) {
    lista.innerHTML = '<div class="cliente-item lista-vazia">Nenhum cliente encontrado</div>';
    return;
  }

  visiveis.forEach(({ cliente, feitas, total, situacao, dias }) => {
    const div = document.createElement('div');
    div.className = `cliente-item situacao-${situacao}`;
    div.dataset.clienteId = cliente.id;
    div.dataset.clienteNome = cliente.nome;

    if (clienteSelecionado && clienteSelecionado.id === cliente.id) {
      div.classList.add('ativo');
    }

    // só faz sentido falar em "parado" para quem começou e não terminou
    const parado = situacao === 'andamento' && dias !== null
      ? `<span class="progresso-parado${dias >= 14 ? ' alerta' : ''}">${textoParado(dias)}</span>`
      : '';

    div.innerHTML = `
      <div class="cliente-item-conteudo">
        <div class="cliente-item-nome">${escapar(cliente.nome)}</div>
        <div class="cliente-item-progresso">
          <span class="barra-progresso"><i style="width:${Math.round((feitas / total) * 100)}%"></i></span>
          <span class="progresso-texto">${feitas}/${total}</span>
          ${parado}
        </div>
      </div>
      ${ehAdmin() ? `<button class="cliente-item-deletar" title="Remover cliente" aria-label="Remover ${escapar(cliente.nome)}">×</button>` : ''}
    `;

    lista.appendChild(div);
  });
}

/* O listener é ligado UMA vez só. Antes ele ficava dentro de
   renderizarListaClientes(), então cada re-render empilhava mais um
   handler e o clique ia ficando cada vez mais lento. */
let listaLigada = false;

function ligarListaClientes() {
  const lista = $('listaClientesWorkflow');
  if (!lista || listaLigada) return;
  listaLigada = true;

  lista.addEventListener('click', (e) => {
    const clienteItem = e.target.closest('.cliente-item');
    if (!clienteItem) return;

    const clienteId = clienteItem.dataset.clienteId;
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;

    if (e.target.classList.contains('cliente-item-deletar')) {
      e.stopPropagation();
      deletarCliente(cliente);
    } else if (e.target.closest('.cliente-item-conteudo')) {
      selecionarCliente(cliente);
    }
  });

  $('buscaClientesWorkflow')?.addEventListener('input', e => {
    buscaWorkflow = e.target.value;
    renderizarListaClientes();
  });

  $('filtrosSituacao')?.addEventListener('click', e => {
    const botao = e.target.closest('.filtro');
    if (!botao) return;
    situacaoWorkflow = botao.dataset.situacao;
    document.querySelectorAll('#filtrosSituacao .filtro')
      .forEach(b => b.classList.toggle('ativo', b === botao));
    renderizarListaClientes();
  });

  $('ordemClientes')?.addEventListener('change', e => {
    ordemWorkflow = e.target.value;
    renderizarListaClientes();
  });
}

function selecionarCliente(cliente) {
  clienteSelecionado = cliente;
  renderizarListaClientes();
  mostrarChecklist(cliente);
  mostrarClienteSelecionado(cliente);
}

function mostrarClienteSelecionado(cliente) {
  const container = $('workflowClienteSelecionado');
  if (!container) return;

  container.innerHTML = `<h2 class="cliente-info-nome">${escapar(cliente.nome)}</h2>`;
}

function mostrarChecklist(cliente) {
  const container = $('workflowChecklist');
  if (!container) return;

  clienteWorkflow = lerEstado(cliente.id);
  const datas = clienteWorkflow._datas || {};
  container.innerHTML = '';

  FASES.forEach(fase => {
    const itens = CHECKLIST_ITEMS.filter(i => i.fase === fase.id);
    if (itens.length === 0) return;

    const feitas = itens.filter(i => clienteWorkflow[i.id] === true).length;
    const completa = feitas === itens.length;

    const bloco = document.createElement('div');
    bloco.className = `gmb-bloco fase${completa ? ' fase-completa' : ''}`;

    const cabecalho = document.createElement('div');
    cabecalho.className = 'gmb-bloco-cabecalho';
    cabecalho.innerHTML = `
      <h3>${fase.titulo}</h3>
      <span class="gmb-contador${completa ? ' completo' : ''}">${feitas}/${itens.length}</span>
    `;
    bloco.appendChild(cabecalho);

    itens.forEach(item => {
      const div = document.createElement('div');
      div.className = 'item-check';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `check_${item.id}`;
      input.checked = clienteWorkflow[item.id] === true;
      input.addEventListener('change', e => marcarItem(cliente.id, item.id, e.target.checked));

      const label = document.createElement('label');
      label.htmlFor = `check_${item.id}`;

      const titulo = document.createElement('span');
      titulo.className = 'item-titulo';
      titulo.textContent = item.label;
      label.appendChild(titulo);

      if (input.checked && datas[item.id]) {
        const carimbo = document.createElement('span');
        carimbo.className = 'item-data';
        carimbo.textContent = dataCurta(datas[item.id]);
        carimbo.title = new Date(datas[item.id]).toLocaleString('pt-BR');
        label.appendChild(carimbo);
      }

      if (item.desc) {
        const d = document.createElement('div');
        d.className = 'descricao';
        d.textContent = item.desc;
        label.appendChild(d);
      }

      div.appendChild(input);
      div.appendChild(label);
      bloco.appendChild(div);
    });

    container.appendChild(bloco);
  });
}

function marcarItem(clienteId, itemId, marcado) {
  clienteWorkflow[itemId] = marcado;

  if (!clienteWorkflow._datas) clienteWorkflow._datas = {};
  if (marcado) clienteWorkflow._datas[itemId] = new Date().toISOString();
  else delete clienteWorkflow._datas[itemId];

  Checklist.gravar(`workflow_${clienteId}`, clienteWorkflow);

  // redesenha para atualizar contador da fase, carimbo de data e barra lateral
  const cliente = clientes.find(c => c.id === clienteId);
  if (cliente) mostrarChecklist(cliente);
  renderizarListaClientes();

  // devolve o foco para a caixa que acabou de ser marcada
  $(`check_${itemId}`)?.focus();
}

function deletarCliente(cliente) {
  if (!confirm(`Remover "${cliente.nome}" da lista?\n\nO checklist dele também será apagado.`)) return;

  // Remover do array de clientes
  const index = clientes.findIndex(c => c.id === cliente.id);
  if (index >= 0) {
    clientes.splice(index, 1);
  }

  // Deletar do banco de dados
  Store.deletar('clientes', cliente.id);

  // Limpar progresso nos quatro módulos
  Checklist.apagarCliente(cliente.id);

  // Se era o selecionado
  if (clienteSelecionado && clienteSelecionado.id === cliente.id) {
    clienteSelecionado = null;
    const container = $('workflowClienteSelecionado');
    if (container) {
      container.innerHTML = '<div class="cliente-info-empty">Selecione um cliente para ver o checklist</div>';
    }
    const workflowContainer = $('workflowChecklist');
    if (workflowContainer) {
      workflowContainer.innerHTML = '';
    }
  }

  // Re-renderizar
  renderizarListaClientes();
}

function iniciarWorkflow() {
  ligarListaClientes();
  renderizarListaClientes();

  // Se houver um cliente selecionado antes, restaurá-lo
  if (clientes && clientes.length > 0) {
    const info = $('workflowClienteSelecionado');
    if (info && info.textContent === '') {
      const msg = document.createElement('div');
      msg.className = 'cliente-info-empty';
      msg.textContent = 'Selecione um cliente para ver o checklist';
      info.appendChild(msg);
    }
  }
}

console.log('✓ workflow-checklist.js carregado');
