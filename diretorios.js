/* ============================================================
   DIRETÓRIOS LOCAIS (CITAÇÕES)

   Duas partes com ciclos diferentes:

   1. CADASTRO: cada diretório é marcado uma vez e fica marcado.
      Estado permanente em `dir_${clienteId}`.

   2. AUDITORIA: a conferência de qualidade, refeita todo trimestre.
      Estado em `dir_${clienteId}_${ano}-T${n}`.

   O que faz a citação funcionar não é a quantidade de diretórios,
   é o dado ser idêntico em todos eles. Por isso a auditoria pesa
   mais que a lista de cadastros.
   ============================================================ */

const DIR_GRUPOS = [
  { id: 'essenciais', titulo: 'Essenciais', nota: 'Todo cliente precisa destes, sem exceção.' },
  { id: 'reputacao', titulo: 'Reputação', nota: 'Aparecem quando alguém busca o nome da empresa.' },
  { id: 'brasil', titulo: 'Diretórios brasileiros', nota: 'Peso menor, mas somam para consistência.' },
  { id: 'segmento', titulo: 'Conforme o segmento', nota: 'Marque só os que fazem sentido para o cliente.' },
];

const DIRETORIOS = [
  /* ---------- essenciais ---------- */
  { grupo: 'essenciais', id: 'google', label: 'Google Meu Negócio',
    desc: 'A base de tudo. Perfil reivindicado e verificado.' },
  { grupo: 'essenciais', id: 'bing', label: 'Bing Places',
    desc: 'Alimenta o Bing e o Copilot. É o mapa que a Microsoft entrega para IA.' },
  { grupo: 'essenciais', id: 'apple', label: 'Apple Business Connect',
    desc: 'Apple Maps e Siri. Metade dos celulares no Brasil é iPhone e nunca passa pelo Google.' },
  { grupo: 'essenciais', id: 'facebook', label: 'Facebook e Instagram',
    desc: 'Página com endereço, telefone e horário preenchidos, não só o perfil social.' },
  { grupo: 'essenciais', id: 'waze', label: 'Waze',
    desc: 'No Brasil muita gente traça rota pelo Waze e não pelo Google Maps.' },
  { grupo: 'essenciais', id: 'foursquare', label: 'Foursquare',
    desc: 'Poucos usam direto, mas ele abastece a base de vários apps e assistentes.' },

  /* ---------- reputação ---------- */
  { grupo: 'reputacao', id: 'reclame_aqui', label: 'Reclame Aqui',
    desc: 'Reclamação sem resposta ranqueia pelo nome da empresa. Reivindicar mesmo sem reclamação.' },
  { grupo: 'reputacao', id: 'tripadvisor', label: 'TripAdvisor',
    desc: 'Alimentação, hotelaria e turismo. Ignorar nos demais segmentos.' },

  /* ---------- diretórios brasileiros ---------- */
  { grupo: 'brasil', id: 'apontador', label: 'Apontador' },
  { grupo: 'brasil', id: 'telelistas', label: 'Telelistas' },
  { grupo: 'brasil', id: 'guiamais', label: 'GuiaMais' },
  { grupo: 'brasil', id: 'guia_local', label: 'Guia da cidade, prefeitura ou associação comercial',
    desc: 'ACE, CDL, guia do município. Link local de verdade vale mais que diretório genérico.' },

  /* ---------- por segmento ---------- */
  { grupo: 'segmento', id: 'doctoralia', label: 'Doctoralia ou BoaConsulta', desc: 'Saúde.' },
  { grupo: 'segmento', id: 'ifood', label: 'iFood', desc: 'Alimentação.' },
  { grupo: 'segmento', id: 'jusbrasil', label: 'Jusbrasil', desc: 'Advocacia.' },
  { grupo: 'segmento', id: 'booking', label: 'Booking ou Airbnb', desc: 'Hospedagem.' },
  { grupo: 'segmento', id: 'marketplace', label: 'OLX ou Mercado Livre', desc: 'Varejo com produto físico.' },
  { grupo: 'segmento', id: 'outro_setor', label: 'Portal do setor',
    desc: 'Associação ou portal específico da categoria do cliente.' },
];

/* A auditoria é o que realmente faz a citação funcionar.
   Ordem proposital: do que mais quebra para o que menos quebra. */
const DIR_AUDITORIA = [
  { id: 'nap', label: 'NAP idêntico em todos os perfis',
    desc: 'Nome, endereço e telefone iguais caractere por caractere. "Rua" e "R.", "Ltda" e "LTDA", sala e andar. Divergência é o erro nº 1.' },
  { id: 'reivindicado', label: 'Todos os perfis reivindicados',
    desc: 'Perfil gerado automaticamente, que ninguém controla, não se corrige e ainda concorre com o oficial.' },
  { id: 'duplicados', label: 'Nenhum perfil duplicado',
    desc: 'Duplicata divide avaliação e autoridade. Vale mais apagar uma duplicata que criar cinco cadastros novos.' },
  { id: 'telefone_atende', label: 'Telefone testado, alguém atende',
    desc: 'Ligar de verdade. Número antigo em diretório é o jeito mais silencioso de perder cliente.' },
  { id: 'categoria', label: 'Mesma categoria principal em todos',
    desc: 'Se o Google diz uma coisa e o Bing diz outra, os dois desconfiam.' },
  { id: 'site_utm', label: 'Link do site certo e com UTM',
    desc: 'Link quebrado ou apontando para página antiga. Com UTM você prova de onde veio a visita.' },
  { id: 'horario', label: 'Horário igual ao do Google',
    desc: 'Inclusive feriado. Horário divergente gera viagem perdida e avaliação ruim.' },
  { id: 'pino', label: 'Pino no lugar certo',
    desc: 'Conferir no mapa de cada diretório. Pino errado derruba a busca por proximidade.' },
  { id: 'logo_fotos', label: 'Logo e fotos atuais',
    desc: 'Diretório com a logo antiga passa impressão de empresa abandonada.' },
  { id: 'avaliacoes_dir', label: 'Avaliações respondidas fora do Google',
    desc: 'Reclame Aqui, Facebook e TripAdvisor também têm avaliação, e quase ninguém olha.' },
];

let dirCliente = null;
let buscaDir = '';

/* ---------- estado ---------- */

function dirTrimestreAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-T${Math.floor(hoje.getMonth() / 3) + 1}`;
}

function dirChave(clienteId, trimestral) {
  return trimestral
    ? `dir_${clienteId}_${dirTrimestreAtual()}`
    : `dir_${clienteId}`;
}

function dirLer(clienteId, trimestral) {
  return Checklist.ler(dirChave(clienteId, trimestral));
}

function dirGravar(clienteId, trimestral, estado) {
  estado.atualizado_em = new Date().toISOString();
  Checklist.gravar(dirChave(clienteId, trimestral), estado);
}

function dirProgresso(clienteId) {
  const cadastro = dirLer(clienteId, false);
  const auditoria = dirLer(clienteId, true);
  return {
    cadastrados: DIRETORIOS.filter(d => cadastro[d.id] === true).length,
    auditados: DIR_AUDITORIA.filter(a => auditoria[a.id] === true).length,
    totalAuditoria: DIR_AUDITORIA.length,
  };
}

/* ---------- lista ---------- */

function renderizarListaClientesDir() {
  const lista = $('listaClientesDir');
  if (!lista) return;

  lista.innerHTML = '';

  if (!clientes || clientes.length === 0) {
    lista.innerHTML = '<div class="cliente-item">Nenhum cliente cadastrado</div>';
    return;
  }

  /* Só quem contratou diretórios locais. Definido na aba Workflow. */
  const contratantes = Servicos.comServico('dir');

  if (dirCliente && !contratantes.some(c => c.id === dirCliente.id)) {
    dirCliente = null;
    renderizarDiretorios();
  }

  if (contratantes.length === 0) {
    lista.innerHTML = '<div class="cliente-item lista-vazia">Nenhum cliente com diretórios locais contratados. Marque o serviço na aba Workflow.</div>';
    atualizarContagem('contagemDir', 0);
    return;
  }

  const termo = semAcentos(buscaDir.trim());
  const filtrados = contratantes
    .slice()
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
    .filter(c => !termo
      || semAcentos(c.nome).includes(termo)
      || semAcentos(c.email).includes(termo));

  atualizarContagem('contagemDir', filtrados.length);

  if (filtrados.length === 0) {
    lista.innerHTML = '<div class="cliente-item lista-vazia">Nenhum cliente encontrado</div>';
    return;
  }

  filtrados.forEach(cliente => {
    const div = document.createElement('div');
    div.className = 'cliente-item';
    div.dataset.clienteId = cliente.id;
    if (dirCliente && dirCliente.id === cliente.id) div.classList.add('ativo');

    const p = dirProgresso(cliente.id);
    const completo = p.auditados === p.totalAuditoria ? ' completo' : '';

    div.innerHTML = `
      <div class="cliente-item-conteudo">
        <div class="cliente-item-nome">${escapar(cliente.nome)}</div>
        <div class="cliente-item-progresso">
          <span class="barra-progresso"><i style="width:${Math.round((p.auditados / p.totalAuditoria) * 100)}%"></i></span>
          <span class="progresso-texto${completo}">${p.auditados}/${p.totalAuditoria} auditoria</span>
        </div>
        <div class="ciclos-resumo">
          <span class="ciclo-mini">${p.cadastrados} cadastro(s)</span>
        </div>
      </div>
    `;
    lista.appendChild(div);
  });
}

/* ---------- painel ---------- */

function renderizarDiretorios() {
  const info = $('dirClienteSelecionado');
  const container = $('dirConteudo');
  if (!container) return;

  if (!dirCliente) {
    if (info) info.innerHTML = '<div class="cliente-info-empty">Selecione um cliente para ver os diretórios</div>';
    container.innerHTML = '';
    return;
  }

  if (info) info.innerHTML = `<h2 class="cliente-info-nome">${escapar(dirCliente.nome)}</h2>`;

  const cadastro = dirLer(dirCliente.id, false);
  const auditoria = dirLer(dirCliente.id, true);
  container.innerHTML = '';

  /* ----- auditoria primeiro, porque é o que importa ----- */
  const feitasAud = DIR_AUDITORIA.filter(a => auditoria[a.id] === true).length;
  const blocoAud = document.createElement('div');
  blocoAud.className = 'gmb-bloco';
  blocoAud.innerHTML = `
    <div class="gmb-bloco-cabecalho">
      <h3>Auditoria de consistência</h3>
      <span class="gmb-contador${feitasAud === DIR_AUDITORIA.length ? ' completo' : ''}">${feitasAud}/${DIR_AUDITORIA.length}</span>
    </div>
    <p class="bloco-nota">Refaça todo trimestre. Trimestre atual: ${dirTrimestreAtual().replace('-T', ' · T')}.</p>
  `;
  DIR_AUDITORIA.forEach(item => {
    blocoAud.appendChild(montarItemDir(item, auditoria[item.id] === true, true));
  });
  container.appendChild(blocoAud);

  /* ----- cadastros por grupo ----- */
  DIR_GRUPOS.forEach(grupo => {
    const itens = DIRETORIOS.filter(d => d.grupo === grupo.id);
    if (itens.length === 0) return;

    const feitas = itens.filter(d => cadastro[d.id] === true).length;
    const bloco = document.createElement('div');
    bloco.className = 'gmb-bloco';
    bloco.innerHTML = `
      <div class="gmb-bloco-cabecalho">
        <h3>${grupo.titulo}</h3>
        <span class="gmb-contador${feitas === itens.length ? ' completo' : ''}">${feitas}/${itens.length}</span>
      </div>
      <p class="bloco-nota">${grupo.nota}</p>
    `;
    itens.forEach(item => {
      bloco.appendChild(montarItemDir(item, cadastro[item.id] === true, false));
    });
    container.appendChild(bloco);
  });
}

function montarItemDir(item, marcado, trimestral) {
  const div = document.createElement('div');
  div.className = 'item-check';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = `dir_${trimestral ? 'aud' : 'cad'}_${item.id}`;
  input.checked = marcado;
  input.addEventListener('change', e => marcarDir(item.id, e.target.checked, trimestral));

  const label = document.createElement('label');
  label.htmlFor = input.id;

  const titulo = document.createElement('span');
  titulo.className = 'item-titulo';
  titulo.textContent = item.label;
  label.appendChild(titulo);

  if (item.desc) {
    const d = document.createElement('div');
    d.className = 'descricao';
    d.textContent = item.desc;
    label.appendChild(d);
  }

  div.appendChild(input);
  div.appendChild(label);
  return div;
}

function marcarDir(itemId, marcado, trimestral) {
  if (!dirCliente) return;
  const estado = dirLer(dirCliente.id, trimestral);
  estado[itemId] = marcado;
  dirGravar(dirCliente.id, trimestral, estado);
  renderizarDiretorios();
  renderizarListaClientesDir();
  $(`dir_${trimestral ? 'aud' : 'cad'}_${itemId}`)?.focus();
}

let dirListaLigada = false;

function ligarListaDir() {
  const lista = $('listaClientesDir');
  if (!lista || dirListaLigada) return;
  dirListaLigada = true;

  lista.addEventListener('click', e => {
    const item = e.target.closest('.cliente-item');
    if (!item) return;
    const cliente = clientes.find(c => c.id === item.dataset.clienteId);
    if (!cliente) return;
    dirCliente = cliente;
    renderizarListaClientesDir();
    renderizarDiretorios();
  });

  $('buscaClientesDir')?.addEventListener('input', e => {
    buscaDir = e.target.value;
    renderizarListaClientesDir();
  });
}

function iniciarDiretorios() {
  ligarListaDir();
  renderizarListaClientesDir();
  renderizarDiretorios();
}

console.log('✓ diretorios.js carregado');
