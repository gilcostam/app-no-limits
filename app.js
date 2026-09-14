/* Projeto app-no-limits, exclusivo deste app. As tabelas exigem usuário
   autenticado, porque guardam dados pessoais dos clientes.
   Deixar as duas constantes em branco faz o app voltar a salvar no navegador. */
const SUPABASE_URL = 'https://fmisqevbtyuynetakdhi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Pc8f7CpNzYfpMH-GG8UnFQ_LykP1rpD';

const sb = SUPABASE_URL && SUPABASE_ANON_KEY
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const $ = id => document.getElementById(id);

/* ---------- armazenamento ---------- */

const Store = {
  async listar(tabela) {
    if (sb) {
      const { data, error } = await sb.from(tabela).select('*').order('criado_em', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return JSON.parse(localStorage.getItem(`nolimits_${tabela}`) || '[]');
  },

  async salvar(tabela, registro) {
    if (sb) {
      const { data, error } = await sb.from(tabela).upsert(registro).select().single();
      if (error) throw error;
      return data;
    }
    const chave = `nolimits_${tabela}`;
    const atuais = JSON.parse(localStorage.getItem(chave) || '[]');
    const i = atuais.findIndex(r => r.id === registro.id);
    if (i >= 0) atuais[i] = registro;
    else atuais.unshift(registro);
    localStorage.setItem(chave, JSON.stringify(atuais));
    return registro;
  },
};

/* ---------- estado ---------- */

let clientes = [];
let contratos = [];
let perfil = null;

const ehAdmin = () => perfil?.papel === 'admin';

/* ---------- abas ---------- */

document.querySelectorAll('.aba').forEach(botao => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));
    document.querySelectorAll('.painel').forEach(p => p.classList.remove('ativo'));
    botao.classList.add('ativa');
    $(`painel-${botao.dataset.aba}`).classList.add('ativo');
  });
});

/* ---------- permissões ---------- */

// Esconder as abas é conveniência, não segurança: quem não é admin também é
// barrado pelas políticas do banco, que é onde estão o CPF e o RG.
function aplicarPermissoes() {
  document.querySelectorAll('.so-admin').forEach(e => e.classList.toggle('oculto', !ehAdmin()));
  const ativa = document.querySelector('.aba.ativa');
  if (!ativa || ativa.classList.contains('oculto')) document.querySelector('.aba:not(.oculto)')?.click();
}

/* ---------- visibilidade condicional ---------- */

function alternarVisibilidade() {
  const pj = $('tipoPessoa').value === 'PJ';
  const hospedagem = $('modelo').value === 'hospedagem';

  document.querySelectorAll('.so-pf').forEach(e => e.classList.toggle('oculto', pj));
  document.querySelectorAll('.so-pj').forEach(e => e.classList.toggle('oculto', !pj));
  document.querySelectorAll('.rotulo-pf').forEach(e => e.classList.toggle('oculto', pj));
  document.querySelectorAll('.rotulo-pj').forEach(e => e.classList.toggle('oculto', !pj));

  document.querySelectorAll('.so-seo').forEach(e => e.classList.toggle('oculto', hospedagem));
  document.querySelectorAll('.rotulo-seo').forEach(e => e.classList.toggle('oculto', hospedagem));
  document.querySelectorAll('.rotulo-hosp').forEach(e => e.classList.toggle('oculto', !hospedagem));

  $('valorTrafego').disabled = !$('addonTrafego').checked;
  $('valorRedes').disabled = !$('addonRedes').checked;
}

/* ---------- valores ---------- */

function aplicarValorPadrao() {
  if ($('modelo').value === 'hospedagem') $('valorBase').value = 150;
  else $('valorBase').value = PLANOS[$('planoBase').value].valor;
  atualizarTotal();
}

function atualizarTotal() {
  const hospedagem = $('modelo').value === 'hospedagem';
  let total = Number($('valorBase').value) || 0;
  if (!hospedagem) {
    if ($('addonTrafego').checked) total += Number($('valorTrafego').value) || 0;
    if ($('addonRedes').checked) total += Number($('valorRedes').value) || 0;
  }
  $('totalMensal').textContent = moeda(total);
  $('totalExtenso').textContent = total ? moedaExtenso(total) : '';
}

/* ---------- leitura do formulário ---------- */

function lerFormulario() {
  // Os add-ons só existem no modelo SEO. Sem este corte, trocar o modelo depois de
  // marcar um add-on deixaria a marcação ativa e inflaria o total gravado.
  const comAddons = $('modelo').value === 'seo';
  return {
    tipoPessoa: $('tipoPessoa').value,
    sexo: $('sexo').value,
    nome: $('nome').value.trim(),
    documento: $('documento').value.trim(),
    rg: $('rg').value.trim(),
    responsavelLegal: $('responsavelLegal').value.trim(),
    endereco: $('endereco').value.trim(),
    cidade: $('cidade').value.trim(),
    uf: $('uf').value.trim().toUpperCase(),
    cep: $('cep').value.trim(),
    email: $('email').value.trim(),
    telefone: $('telefone').value.trim(),
    modelo: $('modelo').value,
    planoBase: $('planoBase').value,
    valorBase: Number($('valorBase').value) || 0,
    addonTrafego: comAddons && $('addonTrafego').checked,
    valorTrafego: Number($('valorTrafego').value) || 0,
    addonRedes: comAddons && $('addonRedes').checked,
    valorRedes: Number($('valorRedes').value) || 0,
    diaVencimento: Number($('diaVencimento').value) || 10,
    primeiroPagamento: $('primeiroPagamento').value,
    dataAssinatura: $('dataAssinatura').value,
  };
}

function validar(d) {
  const faltando = [];
  if (!d.nome) faltando.push(d.tipoPessoa === 'PJ' ? 'razão social' : 'nome completo');
  if (!d.documento) faltando.push(d.tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF');
  if (d.tipoPessoa === 'PJ' && !d.responsavelLegal) faltando.push('representante legal');
  if (!d.endereco) faltando.push('endereço');
  if (!d.cidade) faltando.push('cidade');
  if (!d.uf) faltando.push('UF');
  if (!d.primeiroPagamento) faltando.push('data do primeiro pagamento');
  if (!d.dataAssinatura) faltando.push('data da assinatura');
  if (!d.valorBase) faltando.push('mensalidade');
  return faltando;
}

function avisar(texto, tipo) {
  const el = $('aviso');
  el.textContent = texto;
  el.className = `aviso ${tipo || ''}`;
}

/* ---------- geração ---------- */

async function gerar(acao) {
  const dados = lerFormulario();
  const faltando = validar(dados);
  if (faltando.length) {
    avisar(`Preencha antes: ${faltando.join(', ')}.`, 'erro');
    return;
  }

  try {
    gerarPdf(dados, acao);
  } catch (e) {
    avisar(`Não foi possível gerar o PDF: ${e.message}`, 'erro');
    return;
  }

  if (acao === 'baixar') {
    await registrar(dados);
    avisar(`Contrato gerado. Faça o upload de ${nomeArquivo(dados)} no Autentique.`, 'ok');
  } else {
    avisar('');
  }
}

/* O mesmo cliente chega por três portas: contrato, planilha e cadastro manual.
   Achar a ficha que já existe antes de criar outra é o que impede a mesma clínica
   de virar duas linhas, cada uma com metade do histórico.

   Documento primeiro, porque é o único dado que de fato identifica; nome depois,
   porque é o que sobra quando a planilha veio sem CPF. Reaproveitar o id da ficha
   encontrada também é o que permite corrigir o documento depois sem quebrar nada:
   o id nunca muda, só o campo. */
function acharCliente(nome, documento) {
  const digitos = (documento || '').replace(/\D/g, '');
  if (digitos) {
    const porDocumento = clientes.find(c => (c.documento || '').replace(/\D/g, '') === digitos);
    if (porDocumento) return porDocumento;
  }
  const limpo = semAcento(nome || '');
  return clientes.find(c => semAcento(c.nome) === limpo) || null;
}

async function registrar(d) {
  const fichaExistente = acharCliente(d.nome, d.documento);
  const idCliente = fichaExistente
    ? fichaExistente.id
    : (d.documento.replace(/\D/g, '') || apelido(d.nome));
  const cliente = {
    id: idCliente,
    tipo_pessoa: d.tipoPessoa,
    sexo: d.sexo,
    nome: d.nome,
    documento: d.documento,
    rg: d.rg,
    responsavel_legal: d.responsavelLegal,
    endereco: d.endereco,
    cidade: d.cidade,
    uf: d.uf,
    cep: d.cep,
    email: d.email,
    telefone: d.telefone,
    criado_em: new Date().toISOString(),
  };

  const total = d.valorBase
    + (d.addonTrafego ? d.valorTrafego : 0)
    + (d.addonRedes ? d.valorRedes : 0);

  const contrato = {
    id: `${idCliente}-${Date.now()}`,
    cliente_id: idCliente,
    cliente_nome: d.nome,
    modelo: d.modelo,
    plano_base: d.modelo === 'hospedagem' ? null : d.planoBase,
    valor_base: d.valorBase,
    addon_trafego: d.addonTrafego,
    valor_trafego: d.addonTrafego ? d.valorTrafego : null,
    addon_redes: d.addonRedes,
    valor_redes: d.addonRedes ? d.valorRedes : null,
    valor_total: total,
    dia_vencimento: d.diaVencimento,
    primeiro_pagamento: d.primeiroPagamento,
    data_assinatura: d.dataAssinatura,
    arquivo: nomeArquivo(d),
    status: 'gerado',
    criado_em: new Date().toISOString(),
  };

  try {
    await Store.salvar('clientes', cliente);
    await Store.salvar('contratos', contrato);

    /* Fechou contrato, entrou na rotina. Antes o cliente virava ficha e parava
       aí: na segunda-feira seguinte ele não aparecia na lista de avaliações para
       responder, porque só a importação criava onboarding. Quem assinou é
       exatamente quem precisa de manutenção, então o contrato não podia ser a
       única porta que não abria. */
    if (!onboardingDoCliente(d.nome, idCliente)) {
      await Store.salvar('gmn_onboarding', novoOnboarding({
        nome: d.nome,
        clienteId: idCliente,
        dataInicio: hojeISO(),
      }));
    }

    await carregarDados();
  } catch (e) {
    avisar(`PDF gerado, mas não foi possível salvar o registro: ${e.message}`, 'erro');
  }
}

/* ---------- carregamento e listas ---------- */

async function carregarDados() {
  // Para quem não é admin estas duas consultas voltariam vazias de qualquer jeito,
  // porque as políticas do banco restringem as tabelas com dado pessoal.
  if (ehAdmin()) {
    clientes = await Store.listar('clientes');
    contratos = await Store.listar('contratos');
    preencherSelectClientes();
    renderContratos();
  }
  await carregarGmn();

  /* A lista de clientes fica para depois do GMN porque a legenda de cada linha diz
     quem cuida do cliente, e isso não mora na ficha, mora no cartão do onboarding.
     Pintada antes, a lista abria com todo mundo marcado como "fora da rotina" e só
     se corrigia na primeira gravação, que é quando a tela era repintada. */
  if (ehAdmin()) renderClientes();
}

function preencherSelectClientes() {
  const select = $('clienteExistente');
  const atual = select.value;
  select.innerHTML = '<option value="">Novo cliente</option>';
  clientes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.nome}${c.documento ? ` (${c.documento})` : ''}`;
    select.appendChild(opt);
  });
  select.value = atual;
}

function carregarCliente(id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  $('tipoPessoa').value = c.tipo_pessoa || 'PF';
  $('sexo').value = c.sexo || 'F';
  $('nome').value = c.nome || '';
  $('documento').value = c.documento || '';
  $('rg').value = c.rg || '';
  $('responsavelLegal').value = c.responsavel_legal || '';
  $('endereco').value = c.endereco || '';
  $('cidade').value = c.cidade || '';
  $('uf').value = c.uf || '';
  $('cep').value = c.cep || '';
  $('email').value = c.email || '';
  $('telefone').value = c.telefone || '';
  alternarVisibilidade();
}

function renderClientes() {
  const busca = semAcento($('buscaCliente').value);
  const filtrados = clientes.filter(c =>
    !busca || semAcento(c.nome).includes(busca) || (c.documento || '').includes(busca));

  const lista = $('listaClientes');
  lista.innerHTML = '';
  if (!filtrados.length) {
    lista.innerHTML = '<p class="vazio">Nenhum cliente cadastrado ainda.</p>';
    return;
  }

  filtrados.forEach(c => {
    const onboarding = onboardingDoCliente(c.nome, c.id);
    const responsavel = onboarding && equipe.find(u => u.id === onboarding.responsavel_id);
    // Quem cuida do cliente é a informação que o Gilmar procura na lista, mais
    // que a cidade: sem ela a pergunta "de quem é esse?" só se responde abrindo.
    const legenda = [
      c.documento,
      [c.cidade, c.uf].filter(Boolean).join(' - '),
      responsavel ? responsavel.nome : (onboarding ? 'sem responsável' : 'fora da rotina'),
    ].filter(Boolean).join('  ·  ');

    const item = document.createElement('div');
    item.className = 'item-lista clicavel';
    item.dataset.id = c.id;
    item.tabIndex = 0;
    item.innerHTML = `
      <div class="info">
        <strong>${escapar(c.nome)}</strong>
        <span>${escapar(legenda)}</span>
      </div>
      <span class="etiqueta">${c.tipo_pessoa === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'}</span>`;
    lista.appendChild(item);
  });
}

/* ---------- editar cliente ---------- */

let clienteEmEdicao = null;

/* Classes próprias, .ed-pf e .ed-pj, em vez das .so-pf do formulário de contrato:
   aquelas são varridas com querySelectorAll no documento inteiro, então reusá-las
   aqui faria mexer no tipo de pessoa de uma tela esconder campo da outra. */
function alternarVisibilidadeEdicao() {
  const pj = $('edTipoPessoa').value === 'PJ';
  document.querySelectorAll('#edicaoCliente .ed-pf').forEach(e => e.classList.toggle('oculto', pj));
  document.querySelectorAll('#edicaoCliente .ed-pj').forEach(e => e.classList.toggle('oculto', !pj));
}

function abrirEdicaoCliente(id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  clienteEmEdicao = c;

  const onboarding = onboardingDoCliente(c.nome, c.id);

  $('tituloEdicao').textContent = c.nome;
  $('edTipoPessoa').value = c.tipo_pessoa || 'PF';
  $('edSexo').value = c.sexo || 'F';
  $('edNome').value = c.nome || '';
  $('edDocumento').value = c.documento || '';
  $('edRg').value = c.rg || '';
  $('edResponsavelLegal').value = c.responsavel_legal || '';
  $('edEndereco').value = c.endereco || '';
  $('edCidade').value = c.cidade || '';
  $('edUf').value = c.uf || '';
  $('edCep').value = c.cep || '';
  $('edEmail').value = c.email || '';
  $('edTelefone').value = c.telefone || '';

  const select = $('edResponsavel');
  select.innerHTML = '';
  select.appendChild(new Option('sem responsável', ''));
  equipe.filter(u => u.ativo).forEach(u => select.appendChild(new Option(u.nome, u.id)));
  select.value = onboarding?.responsavel_id || '';

  /* Cliente fora da rotina não tem onde guardar responsável, então o campo fica
     desligado e no lugar aparece a caixa de incluir. Mostrar um select que não
     salva nada seria pior que não mostrar. */
  $('edNaRotina').checked = !!onboarding;
  $('edNaRotina').disabled = !!onboarding;
  $('edRotinaNota').textContent = onboarding
    ? 'Já está na rotina da semana.'
    : 'Este cliente está fora da rotina. Marque para incluir.';
  select.disabled = !onboarding && !$('edNaRotina').checked;

  alternarVisibilidadeEdicao();
  $('edicaoCliente').classList.remove('oculto');
  avisarCliente('');
  $('edNome').focus();
}

function fecharEdicaoCliente() {
  clienteEmEdicao = null;
  $('edicaoCliente').classList.add('oculto');
  avisarCliente('');
}

async function salvarCliente() {
  if (!clienteEmEdicao) return;

  const nome = $('edNome').value.trim();
  if (!nome) return avisarCliente('O nome não pode ficar em branco.', 'erro');

  const documento = $('edDocumento').value.trim();
  const digitos = documento.replace(/\D/g, '');

  /* Dois clientes com o mesmo CPF são sempre erro de digitação, e deixar passar
     quebraria a busca por documento, que é o que liga a ficha ao contrato. */
  const conflito = digitos && clientes.find(c =>
    c.id !== clienteEmEdicao.id && (c.documento || '').replace(/\D/g, '') === digitos);
  if (conflito) return avisarCliente(`Esse documento já é de ${conflito.nome}.`, 'erro');

  const atualizado = {
    ...clienteEmEdicao,
    tipo_pessoa: $('edTipoPessoa').value,
    sexo: $('edSexo').value,
    nome,
    documento,
    rg: $('edRg').value.trim(),
    responsavel_legal: $('edResponsavelLegal').value.trim(),
    endereco: $('edEndereco').value.trim(),
    cidade: $('edCidade').value.trim(),
    uf: $('edUf').value.trim().toUpperCase().slice(0, 2),
    cep: $('edCep').value.trim(),
    email: $('edEmail').value.trim(),
    telefone: $('edTelefone').value.trim(),
  };

  $('btnSalvarCliente').disabled = true;
  avisarCliente('Salvando...');

  try {
    await Store.salvar('clientes', atualizado);

    const onboarding = onboardingDoCliente(clienteEmEdicao.nome, clienteEmEdicao.id);
    if (onboarding) {
      /* O nome viaja junto. Sem isto, corrigir "Clinica Vida" para "Clínica Vida"
         na ficha deixaria o cartão do plano da semana com o nome velho, e os dois
         pareceriam clientes diferentes. */
      await Store.salvar('gmn_onboarding', {
        ...onboarding,
        cliente_id: atualizado.id,
        cliente_nome: nome,
        responsavel_id: $('edResponsavel').value || null,
      });
    } else if ($('edNaRotina').checked) {
      await Store.salvar('gmn_onboarding', novoOnboarding({
        nome,
        clienteId: atualizado.id,
        responsavelId: $('edResponsavel').value,
        dataInicio: hojeISO(),
      }));
    }

    await carregarDados();
    // Reabrir relê a ficha recarregada, então o "fora da rotina" vira "já está na
    // rotina" na hora, sem o Gilmar precisar fechar e clicar de novo. O aviso vem
    // depois porque reabrir limpa a área de aviso.
    if (clientes.some(c => c.id === atualizado.id)) abrirEdicaoCliente(atualizado.id);
    avisarCliente(`${nome} foi atualizado.`, 'ok');
  } catch (e) {
    avisarCliente(`Não foi possível salvar: ${e.message}`, 'erro');
  }
  $('btnSalvarCliente').disabled = false;
}

function avisarCliente(texto, tipo = '') {
  const aviso = $('clienteAviso');
  aviso.textContent = texto;
  aviso.className = `aviso ${tipo}`;
}

function renderContratos() {
  const busca = semAcento($('buscaContrato').value);
  const filtrados = contratos.filter(c => !busca || semAcento(c.cliente_nome).includes(busca));

  $('listaContratos').innerHTML = filtrados.length
    ? filtrados.map(c => {
        const servicos = [];
        if (c.modelo === 'hospedagem') servicos.push('Hospedagem + blog');
        else servicos.push(c.plano_base === 'mensal' ? 'SEO/GEO mensal' : `SEO/GEO ${c.plano_base} meses`);
        if (c.addon_trafego) servicos.push('Tráfego pago');
        if (c.addon_redes) servicos.push('Redes sociais');
        const data = new Date(c.criado_em).toLocaleDateString('pt-BR');
        return `
          <div class="item-lista">
            <div class="info">
              <strong>${escapar(c.cliente_nome)}</strong>
              <span>${escapar(servicos.join('  ·  '))}  ·  gerado em ${data}</span>
            </div>
            <span class="etiqueta destaque">${moeda(c.valor_total)}/mês</span>
          </div>`;
      }).join('')
    : '<p class="vazio">Nenhum contrato gerado ainda.</p>';
}

function escapar(t) {
  const d = document.createElement('div');
  d.textContent = t == null ? '' : String(t);
  return d.innerHTML;
}

/* ---------- eventos ---------- */

$('tipoPessoa').addEventListener('change', alternarVisibilidade);
$('modelo').addEventListener('change', () => { alternarVisibilidade(); aplicarValorPadrao(); });
$('planoBase').addEventListener('change', aplicarValorPadrao);
$('addonTrafego').addEventListener('change', () => { alternarVisibilidade(); atualizarTotal(); });
$('addonRedes').addEventListener('change', () => { alternarVisibilidade(); atualizarTotal(); });
['valorBase', 'valorTrafego', 'valorRedes'].forEach(id => $(id).addEventListener('input', atualizarTotal));
$('clienteExistente').addEventListener('change', e => carregarCliente(e.target.value));
$('buscaCliente').addEventListener('input', renderClientes);
$('buscaContrato').addEventListener('input', renderContratos);

// Delegação: a lista é repintada a cada busca e a cada gravação, e religar
// escutador em cada linha a cada repintura é como escutador vaza.
$('listaClientes').addEventListener('click', e => {
  const item = e.target.closest('.item-lista');
  if (item) abrirEdicaoCliente(item.dataset.id);
});
$('listaClientes').addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const item = e.target.closest('.item-lista');
  if (!item) return;
  e.preventDefault();
  abrirEdicaoCliente(item.dataset.id);
});
$('btnSalvarCliente').addEventListener('click', salvarCliente);
$('btnFecharEdicao').addEventListener('click', fecharEdicaoCliente);
// Sem onboarding o select de responsável fica travado, porque não teria onde
// gravar. Marcar "incluir na rotina" é o que destrava.
$('edNaRotina').addEventListener('change', e => { $('edResponsavel').disabled = !e.target.checked; });
$('edTipoPessoa').addEventListener('change', alternarVisibilidadeEdicao);
$('btnVisualizar').addEventListener('click', () => gerar('abrir'));
$('btnBaixar').addEventListener('click', () => gerar('baixar'));

/* ---------- acesso ---------- */

// Sem Supabase o app guarda tudo no próprio navegador, onde não existe equipe:
// quem abriu é dono dos dados e enxerga o app inteiro.
const PERFIL_LOCAL = { nome: 'Local', papel: 'admin', ativo: true };

async function buscarPerfil(id) {
  const { data, error } = await sb.from('usuarios').select('id, nome, papel, ativo').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

function recusarAcesso(texto) {
  const aviso = $('loginAviso');
  aviso.className = 'aviso erro';
  aviso.textContent = texto;
  $('login').classList.remove('oculto');
  document.body.classList.remove('liberado');
}

async function liberarApp(usuario) {
  if (usuario) {
    const cadastro = await buscarPerfil(usuario.id);
    // Sessão válida sem linha na equipe: deslogar evita ficar num limbo em que o
    // app recarrega, acha a sessão e trava de novo na mesma tela.
    if (!cadastro || !cadastro.ativo) {
      await sb.auth.signOut();
      return recusarAcesso(cadastro
        ? 'Seu acesso foi desativado. Fale com o administrador.'
        : 'Seu acesso ainda não foi liberado. Peça ao administrador para cadastrar você na equipe.');
    }
    perfil = cadastro;
  } else {
    perfil = PERFIL_LOCAL;
  }

  $('login').classList.add('oculto');
  $('btnSair').classList.toggle('oculto', !usuario);
  $('statusConexao').textContent = usuario
    ? `${perfil.nome} · ${ehAdmin() ? 'admin' : 'funcionário'}`
    : 'Dados salvos neste navegador';
  document.body.classList.add('liberado');
  aplicarPermissoes();
  await carregarDados();
}

function mensagemLogin(erro) {
  if (/Invalid login credentials/i.test(erro.message)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(erro.message)) return 'Confirme o e-mail antes de entrar.';
  return erro.message;
}

$('formLogin').addEventListener('submit', async e => {
  e.preventDefault();
  const aviso = $('loginAviso');
  aviso.className = 'aviso';
  aviso.textContent = 'Entrando...';
  $('btnEntrar').disabled = true;
  const { data, error } = await sb.auth.signInWithPassword({
    email: $('loginEmail').value.trim(),
    password: $('loginSenha').value,
  });
  $('btnEntrar').disabled = false;
  if (error) {
    aviso.className = 'aviso erro';
    aviso.textContent = mensagemLogin(error);
    return;
  }
  aviso.textContent = '';
  $('loginSenha').value = '';
  try {
    await liberarApp(data.session.user);
  } catch (erro) {
    aviso.className = 'aviso erro';
    aviso.textContent = `Não foi possível carregar seus dados: ${erro.message}`;
  }
});

$('btnSair').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

/* ---------- início ---------- */

(async function iniciar() {
  const hoje = new Date().toISOString().slice(0, 10);
  $('dataAssinatura').value = hoje;
  $('primeiroPagamento').value = hoje;
  $('valorTrafego').value = ADDONS.trafego.valor;
  $('valorRedes').value = ADDONS.redes.valor;
  alternarVisibilidade();
  aplicarValorPadrao();
  iniciarGmn();
  iniciarConteudo();
  iniciarSeo();
  iniciarRelatorio();
  iniciarPlano();
  iniciarImportacao();

  if (!sb) return liberarApp(null);

  const { data } = await sb.auth.getSession();
  if (!data.session) return $('login').classList.remove('oculto');

  try {
    await liberarApp(data.session.user);
  } catch (erro) {
    recusarAcesso(`Não foi possível carregar seus dados: ${erro.message}`);
  }
})();
