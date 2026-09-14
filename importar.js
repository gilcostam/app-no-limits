/* ============================================================================
   IMPORTAR CLIENTES DE UMA PLANILHA

   Cadastrar cliente por cliente na mão é o trabalho que ninguém faz, então a
   carteira antiga da agência nunca entra no app e o plano da semana nasce
   incompleto. Esta tela resolve isso de uma vez: lê a planilha que já existe em
   outro sistema e traz todo mundo.

   Três cuidados moldaram o código:

   1. Nada é gravado antes da prévia. A tabela "clientes" guarda CPF, RG e
      endereço, e uma importação errada suja dado pessoal de gente real. Primeiro
      o app mostra o que entendeu, depois o Gilmar confirma.

   2. Importar duas vezes não pode duplicar. A ficha do cliente usa o documento
      como id, então repetir só atualiza. O onboarding não tem id estável, então
      aqui a checagem é pelo nome, do mesmo jeito que criarOnboarding() faz.

   3. Cabeçalho de planilha nunca é o que a gente espera. "Nome", "NOME",
      "Razão Social" e "cliente" querem dizer a mesma coisa, então a detecção é
      por palpite e o Gilmar corrige na mão o que o palpite errar.
   ============================================================================ */

/* Cada campo do app com os nomes de coluna que costumam aparecer na planilha.
   A comparação é sem acento e sem maiúscula, via semAcento(), então "Endereço" e
   "endereco" caem no mesmo lugar.

   "coluna" é o nome oficial, o que sai no modelo para baixar e o que a tabela de
   referência mostra na tela. Ele é sempre um dos palpites, de propósito: assim a
   planilha feita a partir do modelo cai com as oito colunas já reconhecidas, sem
   ninguém precisar corrigir nada. */
const CAMPOS_IMPORTAR = [
  { campo: 'nome', rotulo: 'Nome do cliente', obrigatorio: true,
    coluna: 'Nome', exemplo: 'Clínica Vida Ltda',
    palpites: ['nome', 'cliente', 'razao social', 'nome fantasia', 'empresa', 'nome completo'] },
  { campo: 'documento', rotulo: 'CPF ou CNPJ',
    coluna: 'CPF/CNPJ', exemplo: '12.345.678/0001-90',
    palpites: ['documento', 'cpf', 'cnpj', 'cpf/cnpj', 'cpf cnpj', 'doc'] },
  { campo: 'email', rotulo: 'E-mail',
    coluna: 'E-mail', exemplo: 'contato@clinicavida.com.br',
    palpites: ['email', 'e-mail', 'mail', 'correio'] },
  { campo: 'telefone', rotulo: 'Telefone',
    coluna: 'Telefone', exemplo: '(32) 99999-0000',
    palpites: ['telefone', 'celular', 'whatsapp', 'zap', 'fone', 'contato'] },
  { campo: 'endereco', rotulo: 'Endereço',
    coluna: 'Endereço', exemplo: 'Rua das Flores, 120, Centro',
    palpites: ['endereco', 'logradouro', 'rua', 'endereco completo'] },
  { campo: 'cidade', rotulo: 'Cidade',
    coluna: 'Cidade', exemplo: 'Ubá',
    palpites: ['cidade', 'municipio', 'localidade'] },
  { campo: 'uf', rotulo: 'Estado (UF)',
    coluna: 'UF', exemplo: 'MG',
    palpites: ['uf', 'estado', 'sigla'] },
  { campo: 'cep', rotulo: 'CEP',
    coluna: 'CEP', exemplo: '36500-000',
    palpites: ['cep', 'codigo postal'] },
];

/* Uma linha de empresa e uma de pessoa física, porque a dúvida de quem preenche é
   sempre a mesma: "e quando o cliente é pessoa física?". O app decide PF ou PJ
   pela quantidade de dígitos do documento, não por uma coluna a mais. */
const EXEMPLOS_MODELO = [
  ['Clínica Vida Ltda', '12.345.678/0001-90', 'contato@clinicavida.com.br',
   '(32) 99999-0000', 'Rua das Flores, 120, Centro', 'Ubá', 'MG', '36500-000'],
  ['Maria Aparecida Silva', '123.456.789-01', 'maria@email.com',
   '(32) 98888-1111', 'Avenida Brasil, 45, Bela Vista', 'Ubá', 'MG', '36503-000'],
];

let cabecalhoPlanilha = [];
let linhasPlanilha = [];
let mapaColunas = {};

/* ---------- modelo de planilha ---------- */

/* A tabela de referência é montada a partir de CAMPOS_IMPORTAR, não escrita à mão
   no HTML. Se um campo novo entrar na importação amanhã, a explicação na tela
   acompanha sozinha, em vez de virar documentação velha dizendo uma coisa enquanto
   o app faz outra. */
function renderModeloColunas() {
  const corpo = $('corpoModelo');
  corpo.innerHTML = '';

  CAMPOS_IMPORTAR.forEach(({ coluna, obrigatorio, exemplo }) => {
    const tr = document.createElement('tr');

    const tdColuna = document.createElement('td');
    tdColuna.textContent = coluna;

    const tdPrecisa = document.createElement('td');
    tdPrecisa.textContent = obrigatorio ? 'obrigatória' : 'opcional';
    tdPrecisa.className = obrigatorio ? 'previa-novo' : 'previa-repetido';

    const tdExemplo = document.createElement('td');
    tdExemplo.textContent = exemplo;

    tr.append(tdColuna, tdPrecisa, tdExemplo);
    corpo.appendChild(tr);
  });
}

function baixarModelo() {
  const cabecalho = CAMPOS_IMPORTAR.map(c => c.coluna);
  const larguras = CAMPOS_IMPORTAR.map(c => ({ wch: Math.max(c.coluna.length, c.exemplo.length) + 2 }));
  const pasta = XLSX.utils.book_new();

  /* A primeira aba é a única que o app lê, e ela sai só com o cabeçalho. Se o
     modelo já viesse com a linha de exemplo preenchida, bastaria alguém esquecer
     de apagar para a "Clínica Vida Ltda" virar cliente de verdade no plano da
     semana. O exemplo fica na segunda aba, onde dá para copiar mas não para
     importar sem querer. */
  const folha = XLSX.utils.aoa_to_sheet([cabecalho]);
  folha['!cols'] = larguras;
  XLSX.utils.book_append_sheet(pasta, folha, 'Clientes');

  const exemplo = XLSX.utils.aoa_to_sheet([cabecalho, ...EXEMPLOS_MODELO]);
  exemplo['!cols'] = larguras;
  XLSX.utils.book_append_sheet(pasta, exemplo, 'Exemplo preenchido');

  XLSX.writeFile(pasta, 'modelo-importacao-no-limits.xlsx');
  avisarImportar('Modelo baixado. Preencha a aba "Clientes" e escolha o arquivo aqui em cima.', 'ok');
}

/* ---------- leitura do arquivo ---------- */

async function aoEscolherArquivo(evento) {
  const arquivo = evento.target.files[0];
  if (!arquivo) return;

  esconderImportacao();
  avisarImportar('Lendo a planilha...');

  try {
    const buffer = await arquivo.arrayBuffer();
    // cellDates para o Excel não devolver data como número de série, e defval para
    // célula vazia virar string em vez de sumir e desalinhar a linha.
    const pasta = XLSX.read(buffer, { type: 'array', cellDates: true });
    const primeiraAba = pasta.Sheets[pasta.SheetNames[0]];
    if (!primeiraAba) throw new Error('a planilha está vazia');

    const matriz = XLSX.utils.sheet_to_json(primeiraAba, { header: 1, defval: '', blankrows: false });
    if (matriz.length < 2) throw new Error('a planilha precisa do cabeçalho e de pelo menos uma linha');

    cabecalhoPlanilha = matriz[0].map(c => String(c).trim());
    linhasPlanilha = matriz.slice(1).filter(l => l.some(c => String(c).trim() !== ''));

    if (!cabecalhoPlanilha.some(c => c !== '')) throw new Error('a primeira linha precisa ser o cabeçalho');

    adivinharColunas();
    renderMapa();
    renderPrevia();
    avisarImportar('');
  } catch (e) {
    esconderImportacao();
    avisarImportar(`Não foi possível ler o arquivo: ${e.message}`, 'erro');
  }
}

/* Palpite por igualdade primeiro e só depois por "contém": senão uma coluna
   "Nome do contato" roubaria o lugar da coluna "Nome". */
function adivinharColunas() {
  const limpos = cabecalhoPlanilha.map(semAcento);
  const usados = new Set();
  mapaColunas = {};

  CAMPOS_IMPORTAR.forEach(({ campo, palpites }) => {
    let achou = limpos.findIndex((c, i) => !usados.has(i) && palpites.includes(c));
    if (achou === -1) {
      achou = limpos.findIndex((c, i) => !usados.has(i) && c !== '' && palpites.some(p => c.includes(p)));
    }
    if (achou !== -1) {
      mapaColunas[campo] = achou;
      usados.add(achou);
    }
  });
}

/* ---------- correspondência de colunas ---------- */

function renderMapa() {
  const grade = $('camposImportar');
  grade.innerHTML = '';

  CAMPOS_IMPORTAR.forEach(({ campo, rotulo, obrigatorio }) => {
    const linha = document.createElement('label');
    linha.className = 'campo';

    const titulo = document.createElement('span');
    titulo.textContent = obrigatorio ? `${rotulo} (obrigatório)` : rotulo;

    const select = document.createElement('select');
    select.dataset.campo = campo;
    // new Option() em vez de montar HTML: o cabeçalho vem de arquivo de fora e
    // pode ter aspas, que quebrariam o atributo se fosse interpolado em texto.
    select.appendChild(new Option('não tem na planilha', ''));
    cabecalhoPlanilha.forEach((nome, i) => {
      select.appendChild(new Option(nome || `coluna ${i + 1}`, String(i)));
    });
    select.value = mapaColunas[campo] === undefined ? '' : String(mapaColunas[campo]);
    select.addEventListener('change', aoTrocarColuna);

    linha.append(titulo, select);
    grade.appendChild(linha);
  });

  $('mapaImportar').classList.remove('oculto');
}

function aoTrocarColuna(evento) {
  const { campo } = evento.target.dataset;
  const valor = evento.target.value;
  if (valor === '') delete mapaColunas[campo];
  else mapaColunas[campo] = Number(valor);
  renderPrevia();
}

/* ---------- prévia ---------- */

function valorDaLinha(linha, campo) {
  const coluna = mapaColunas[campo];
  if (coluna === undefined) return '';
  const bruto = linha[coluna];
  if (bruto === undefined || bruto === null) return '';
  return String(bruto).trim();
}

/* Um cliente sem nome não tem como virar ficha nem onboarding, então sai da conta
   e a prévia diz quantos saíram, em vez de sumir em silêncio. */
function lerPlanilha() {
  return linhasPlanilha.map(linha => {
    const registro = {};
    CAMPOS_IMPORTAR.forEach(({ campo }) => { registro[campo] = valorDaLinha(linha, campo); });
    registro.uf = registro.uf.toUpperCase().slice(0, 2);
    return registro;
  });
}

/* Reaproveita a ficha que já existe, achada por documento ou por nome, em vez de
   sempre cunhar id novo. É o que faz o contrato e a planilha gravarem o mesmo
   cliente na mesma linha mesmo quando um dos dois veio sem CPF: o id fica de pé
   e só o campo do documento é preenchido. */
function idDoCliente(registro) {
  const existente = acharCliente(registro.nome, registro.documento);
  if (existente) return existente.id;
  return registro.documento.replace(/\D/g, '') || apelido(registro.nome);
}

function jaTemOnboarding(nome, documento) {
  const ficha = acharCliente(nome, documento);
  return !!onboardingDoCliente(nome, ficha ? ficha.id : null);
}

/* Planilha exportada de sistema de cobrança costuma ter uma linha por cobrança, não
   por cliente, então o mesmo nome aparece várias vezes. Sem isto o cliente entraria
   repetido no plano da semana. Fica a primeira aparição, que é a que tem os dados. */
function semRepetidosNoArquivo(registros) {
  const vistos = new Set();
  return registros.filter(r => {
    const chave = semAcento(r.nome);
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

function paraImportar() {
  const registros = lerPlanilha();
  const validos = semRepetidosNoArquivo(registros.filter(r => r.nome !== ''));
  return {
    registros,
    validos,
    semNome: registros.filter(r => r.nome === '').length,
    duplicados: registros.filter(r => r.nome !== '').length - validos.length,
    novos: validos.filter(r => !jaTemOnboarding(r.nome, r.documento)),
  };
}

function renderPrevia() {
  const { validos, semNome, duplicados, novos } = paraImportar();
  const repetidos = validos.length - novos.length;

  const partes = [`${validos.length} ${validos.length === 1 ? 'cliente' : 'clientes'} na planilha`];
  if (repetidos) partes.push(`${repetidos} já ${repetidos === 1 ? 'está' : 'estão'} no Google Meu Negócio e não ${repetidos === 1 ? 'entra' : 'entram'} de novo`);
  if (duplicados) partes.push(`${duplicados} ${duplicados === 1 ? 'linha repetida do mesmo cliente foi juntada' : 'linhas repetidas do mesmo cliente foram juntadas'}`);
  if (semNome) partes.push(`${semNome} sem nome ${semNome === 1 ? 'foi ignorada' : 'foram ignoradas'}`);
  $('tituloPrevia').textContent = `${partes.join(', ')}.`;

  const colunas = CAMPOS_IMPORTAR.filter(c => mapaColunas[c.campo] !== undefined);
  const cabeca = $('cabecaPrevia');
  cabeca.innerHTML = '';
  const linhaCabeca = document.createElement('tr');
  colunas.forEach(c => {
    const th = document.createElement('th');
    th.textContent = c.rotulo;
    linhaCabeca.appendChild(th);
  });
  const thSituacao = document.createElement('th');
  thSituacao.textContent = 'Situação';
  linhaCabeca.appendChild(thSituacao);
  cabeca.appendChild(linhaCabeca);

  // Dez linhas bastam para conferir se as colunas estão no lugar certo, e a
  // planilha inteira na tela só atrapalharia a leitura.
  const corpo = $('corpoPrevia');
  corpo.innerHTML = '';
  validos.slice(0, 10).forEach(r => {
    const tr = document.createElement('tr');
    colunas.forEach(c => {
      const td = document.createElement('td');
      td.textContent = r[c.campo];
      tr.appendChild(td);
    });
    const td = document.createElement('td');
    const repetido = jaTemOnboarding(r.nome, r.documento);
    td.textContent = repetido ? 'já existe' : 'novo';
    td.className = repetido ? 'previa-repetido' : 'previa-novo';
    tr.appendChild(td);
    corpo.appendChild(tr);
  });

  $('btnImportar').disabled = novos.length === 0;
  $('btnImportar').textContent = novos.length
    ? `Importar ${novos.length} ${novos.length === 1 ? 'cliente' : 'clientes'}`
    : 'Nada novo para importar';
  $('previaImportar').classList.remove('oculto');
}

/* ---------- gravação ---------- */

async function importarClientes() {
  const { novos } = paraImportar();
  if (!novos.length) return;

  $('btnImportar').disabled = true;
  avisarImportar(`Importando ${novos.length}...`);

  let gravados = 0;
  const falhas = [];

  // Um de cada vez, de propósito: são poucas dezenas de clientes uma vez na vida,
  // e assim uma linha com problema não derruba as outras nem deixa a metade
  // gravada sem ninguém saber quais.
  for (const registro of novos) {
    try {
      const id = idDoCliente(registro);
      await Store.salvar('clientes', {
        id,
        tipo_pessoa: registro.documento.replace(/\D/g, '').length > 11 ? 'PJ' : 'PF',
        nome: registro.nome,
        documento: registro.documento,
        endereco: registro.endereco,
        cidade: registro.cidade,
        uf: registro.uf,
        cep: registro.cep,
        email: registro.email,
        telefone: registro.telefone,
        criado_em: new Date().toISOString(),
      });

      await Store.salvar('gmn_onboarding', novoOnboarding({
        nome: registro.nome,
        clienteId: id,
        dataInicio: hojeISO(),
      }));

      gravados += 1;
    } catch (e) {
      falhas.push(`${registro.nome}: ${e.message}`);
    }
  }

  await carregarDados();
  renderPrevia();

  if (falhas.length) {
    avisarImportar(`${gravados} importados. ${falhas.length} não entraram, ${falhas[0]}`, 'erro');
  } else {
    avisarImportar(`${gravados} ${gravados === 1 ? 'cliente entrou' : 'clientes entraram'} no cadastro e no plano da semana. Falta dizer quem cuida de cada um: clique no cliente na aba Clientes.`, 'ok');
  }
}

/* ---------- apoio ---------- */

function esconderImportacao() {
  $('mapaImportar').classList.add('oculto');
  $('previaImportar').classList.add('oculto');
  cabecalhoPlanilha = [];
  linhasPlanilha = [];
  mapaColunas = {};
}

function avisarImportar(texto, tipo = '') {
  const aviso = $('importarAviso');
  aviso.textContent = texto;
  aviso.className = `aviso ${tipo}`;
}

function iniciarImportacao() {
  renderModeloColunas();
  $('btnModelo').addEventListener('click', baixarModelo);
  $('arquivoImportar').addEventListener('change', aoEscolherArquivo);
  $('btnImportar').addEventListener('click', importarClientes);
}
