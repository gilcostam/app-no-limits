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

/* ---------- abas ---------- */

document.querySelectorAll('.aba').forEach(botao => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));
    document.querySelectorAll('.painel').forEach(p => p.classList.remove('ativo'));
    botao.classList.add('ativa');
    $(`painel-${botao.dataset.aba}`).classList.add('ativo');
  });
});

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

async function registrar(d) {
  const idCliente = `${d.documento.replace(/\D/g, '') || d.nome.toLowerCase().replace(/\s+/g, '-')}`;
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
    await carregarDados();
  } catch (e) {
    avisar(`PDF gerado, mas não foi possível salvar o registro: ${e.message}`, 'erro');
  }
}

/* ---------- carregamento e listas ---------- */

async function carregarDados() {
  clientes = await Store.listar('clientes');
  contratos = await Store.listar('contratos');
  preencherSelectClientes();
  renderClientes();
  renderContratos();
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
  const busca = $('buscaCliente').value.toLowerCase();
  const filtrados = clientes.filter(c =>
    !busca || c.nome.toLowerCase().includes(busca) || (c.documento || '').includes(busca));

  $('listaClientes').innerHTML = filtrados.length
    ? filtrados.map(c => `
      <div class="item-lista">
        <div class="info">
          <strong>${escapar(c.nome)}</strong>
          <span>${escapar([c.documento, [c.cidade, c.uf].filter(Boolean).join(' - '), c.email].filter(Boolean).join('  ·  '))}</span>
        </div>
        <span class="etiqueta">${c.tipo_pessoa === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'}</span>
      </div>`).join('')
    : '<p class="vazio">Nenhum cliente cadastrado ainda.</p>';
}

function renderContratos() {
  const busca = $('buscaContrato').value.toLowerCase();
  const filtrados = contratos.filter(c => !busca || (c.cliente_nome || '').toLowerCase().includes(busca));

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
$('btnVisualizar').addEventListener('click', () => gerar('abrir'));
$('btnBaixar').addEventListener('click', () => gerar('baixar'));

/* ---------- acesso ---------- */

function liberarApp(email) {
  $('login').classList.add('oculto');
  $('btnSair').classList.toggle('oculto', !email);
  $('statusConexao').textContent = email ? `Conectado como ${email}` : 'Dados salvos neste navegador';
  document.body.classList.add('liberado');
  carregarDados().catch(e => avisar(`Falha ao carregar dados: ${e.message}`, 'erro'));
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
  liberarApp(data.session.user.email);
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

  if (!sb) return liberarApp(null);

  const { data } = await sb.auth.getSession();
  if (data.session) liberarApp(data.session.user.email);
  else $('login').classList.remove('oculto');
})();
