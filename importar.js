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
   "endereco" caem no mesmo lugar. */
const CAMPOS_IMPORTAR = [
  { campo: 'nome', rotulo: 'Nome do cliente', obrigatorio: true,
    palpites: ['nome', 'cliente', 'razao social', 'nome fantasia', 'empresa', 'nome completo'] },
  { campo: 'documento', rotulo: 'CPF ou CNPJ',
    palpites: ['documento', 'cpf', 'cnpj', 'cpf/cnpj', 'cpf cnpj', 'doc'] },
  { campo: 'email', rotulo: 'E-mail',
    palpites: ['email', 'e-mail', 'mail', 'correio'] },
  { campo: 'telefone', rotulo: 'Telefone',
    palpites: ['telefone', 'celular', 'whatsapp', 'zap', 'fone', 'contato'] },
  { campo: 'endereco', rotulo: 'Endereço',
    palpites: ['endereco', 'logradouro', 'rua', 'endereco completo'] },
  { campo: 'cidade', rotulo: 'Cidade',
    palpites: ['cidade', 'municipio', 'localidade'] },
  { campo: 'uf', rotulo: 'Estado (UF)',
    palpites: ['uf', 'estado', 'sigla'] },
  { campo: 'cep', rotulo: 'CEP',
    palpites: ['cep', 'codigo postal'] },
];

let cabecalhoPlanilha = [];
let linhasPlanilha = [];
let mapaColunas = {};

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

// Mesma regra do contrato: o id do cliente são os dígitos do documento, e o nome
// vira id só quando não há documento. Assim a planilha e o contrato gravam o
// mesmo cliente na mesma linha, em vez de criarem dois.
function idDoCliente(registro) {
  const digitos = registro.documento.replace(/\D/g, '');
  return digitos || apelido(registro.nome);
}

function jaTemOnboarding(nome) {
  return onboardings.some(o => semAcento(o.cliente_nome) === semAcento(nome));
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
    novos: validos.filter(r => !jaTemOnboarding(r.nome)),
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
    const repetido = jaTemOnboarding(r.nome);
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

      await Store.salvar('gmn_onboarding', {
        id: `${apelido(registro.nome)}-${Date.now()}`,
        cliente_id: id,
        cliente_nome: registro.nome,
        responsavel_id: null,
        data_inicio: hojeISO(),
        ...Object.fromEntries(ETAPAS.map(e => [e.campo, 'pendente'])),
        link_drive: '',
        observacoes: '',
        ativo: true,
        concluido_em: null,
        criado_em: new Date().toISOString(),
      });

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
    avisarImportar(`${gravados} ${gravados === 1 ? 'cliente entrou' : 'clientes entraram'} no cadastro e no plano da semana. Falta definir o responsável de cada um na aba Google Meu Negócio.`, 'ok');
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
  $('arquivoImportar').addEventListener('change', aoEscolherArquivo);
  $('btnImportar').addEventListener('click', importarClientes);
}
