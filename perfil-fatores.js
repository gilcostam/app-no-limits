/* ============================================================
   PERFIS CONFERIDOS CONTRA OS FATORES DE RANQUEAMENTO

   Fonte: "Local Search Ranking Factors 2026", Darren Shaw, Whitespark,
   06/11/2025. 47 especialistas pontuam 187 fatores em quatro eixos:
   mapa, orgânico local, conversão e, novo nesta edição, busca com IA.

   Duas coisas que precisam ficar escritas, porque são fáceis de
   distorcer depois:

   1. Os pesos POR GRUPO (quanto vale "GBP signals" contra "link
      signals") só existem num gráfico em imagem na página do estudo,
      nunca no texto. Porcentagem por grupo que apareça por aí é
      invenção de quem escreveu.
   2. É opinião agregada de especialistas, não o algoritmo do Google.
      Serve para ordenar o esforço, não para prometer resultado.

   ── Por que agrupado por fator, e não por cliente ──────────────────
   O achado típico aqui não é a exceção de um cliente, é um buraco da
   carteira: 25 dos 32 perfis estão sem nenhum serviço predefinido
   marcado, que é o fator que mais subiu de posição nesta edição, de
   #81 para #22. Listado cliente a cliente, isso são 25 cartões iguais
   que viram um muro e ninguém lê. Agrupado por fator, é uma linha com
   a posição e a lista de quem falta.

   Sem rotina automática, ao contrário da conferência de posts: o que
   se lê aqui (categoria, horário, serviços, área de atendimento) muda
   quando alguém mexe, não sozinho. Rodar todo dia gravaria trinta
   linhas iguais por dia para responder uma pergunta mensal.

   Ver src/lib/fatores-whitespark.ts e src/lib/auditoria-perfil.ts.
   ============================================================ */

const PERFIL_API = 'https://nolimits-reviews.vercel.app/api/auditoria-perfil';

const PerfilFatores = {
  estado: 'nao_carregado',
  fatores: [],
  totalPerfis: 0,
  limpos: 0,
  quando: null,
  fonte: null,
  erro: '',

  async carregar(agora = false) {
    if (!agora && (this.estado === 'carregando' || this.estado === 'rodando' || this.estado === 'ok')) return;

    if (!sb) {
      this.erro = 'Exige o Supabase conectado.';
      this.estado = this.fatores.length ? 'ok' : 'erro';
      this.render();
      return;
    }

    this.estado = agora ? 'rodando' : 'carregando';
    this.render();

    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) throw new Error('Entre com seu acesso para ver a conferência dos perfis.');

      const resposta = await fetch(agora ? `${PERFIL_API}?agora=1` : PERFIL_API, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!resposta.ok) {
        if (resposta.status === 401) throw new Error('Sessão expirada. Saia e entre de novo.');
        const corpo = await resposta.json().catch(() => ({}));
        throw new Error(corpo.erro || `Falha ao buscar (${resposta.status}).`);
      }

      const corpo = await resposta.json();
      this.fatores = Array.isArray(corpo.fatores) ? corpo.fatores : [];
      this.totalPerfis = corpo.totalPerfis || 0;
      this.limpos = corpo.limpos || 0;
      this.quando = corpo.quando || null;
      this.fonte = corpo.fonte || null;
      this.erro = '';
      this.estado = corpo.aindaNaoVerificado ? 'nunca' : 'ok';
    } catch (e) {
      this.erro = e.message || 'Falha ao conferir os perfis.';
      /* Resultado que já estava na tela não é jogado fora por causa de
         uma falha de releitura. Mesma regra da conferência de posts. */
      this.estado = this.fatores.length ? 'ok' : 'erro';
    }

    this.render();
  },

  botao() {
    const ocupado = this.estado === 'rodando' || this.estado === 'carregando';
    return `<button type="button" class="posts-botao" id="perfilVerificar" ${ocupado ? 'disabled' : ''}>
        ${this.estado === 'rodando' ? 'Conferindo os perfis...' : 'Conferir perfis'}
      </button>`;
  },

  render() {
    const caixa = $('gmbFatores');
    if (!caixa) return;

    if (this.estado === 'carregando') {
      caixa.innerHTML = '<div class="queda-aviso">Buscando a conferência dos perfis...</div>';
      return;
    }
    if (this.estado === 'rodando') {
      caixa.innerHTML = '<div class="queda-aviso">Lendo a ficha dos perfis no Google. Leva uns 12 segundos.</div>';
      return;
    }
    if (this.estado === 'erro') {
      caixa.innerHTML = `<div class="queda-aviso queda-aviso-erro">${escapar(this.erro)} ${this.botao()}</div>`;
      this.ligarBotao();
      return;
    }
    if (this.estado === 'nunca') {
      caixa.innerHTML = `<div class="queda-aviso">Os perfis ainda não foram conferidos contra os fatores de ranqueamento. ${this.botao()}</div>`;
      this.ligarBotao();
      return;
    }
    if (this.estado !== 'ok') { caixa.innerHTML = ''; return; }

    if (this.fatores.length === 0) {
      caixa.innerHTML = `<div class="queda-aviso queda-aviso-ok">
          Nenhum ajuste a fazer nos ${this.totalPerfis} perfis. Conferido ${escapar(auditoriaQuando(this.quando))}. ${this.botao()}
        </div>`;
      this.ligarBotao();
      return;
    }

    const blocos = this.fatores.map(f => {
      const nomes = f.perfis.map(p => {
        const clienteId = quedaClientePorPerfil(p.businessId);
        const cliente = clienteId && clientes ? clientes.find(c => c.id === clienteId) : null;
        const nome = cliente ? cliente.nome : p.nome;
        const attr = cliente ? ` data-cliente-id="${escapar(cliente.id)}"` : '';
        const classe = cliente ? 'posts-limpo fator-perfil fator-perfil-abre' : 'posts-limpo fator-perfil';
        /* A prova fica VISÍVEL, não só no title. Dentro de um mesmo fator
           ela muda de perfil para perfil ("inclui Brasil" contra "inclui
           Espírito Santo"), e é ela que diz o que mexer em cada um. Prova
           escondida em tooltip não se lê numa lista de 25. */
        return `<div class="${classe}"${attr} title="${escapar(p.nome)}">
            <span class="posts-limpo-nome">${escapar(nome)}</span>
            ${p.prova ? `<span class="posts-limpo-quando">${escapar(p.prova)}</span>` : ''}
          </div>`;
      }).join('');

      return `
        <div class="queda-item">
          <div class="queda-linha">
            <span class="queda-nome">${escapar(f.problema)}</span>
            <span class="queda-perda">${f.perfis.length} de ${this.totalPerfis}</span>
          </div>
          <div class="queda-acoes queda-acoes-${escapar(f.gravidade)}">
            <p class="queda-veredito">${escapar(f.posicao || 'sem posição no estudo')}</p>
            <ul class="posts-achados"><li><span class="posts-acao">${escapar(f.acao)}</span></li></ul>
            <div class="posts-limpos-lista fator-lista">${nomes}</div>
          </div>
        </div>`;
    }).join('');

    const fonte = this.fonte
      ? `${escapar(this.fonte.estudo)}, ${escapar(this.fonte.autor)}, ${escapar(this.fonte.especialistas)} especialistas, ${escapar(this.fonte.fatores)} fatores`
      : 'Whitespark Local Search Ranking Factors';

    caixa.innerHTML = `
      <div class="queda-bloco">
        <div class="posts-cabecalho">
          <h3 class="queda-titulo">Perfis: ${this.fatores.length} ${this.fatores.length === 1 ? 'ajuste' : 'ajustes'} a fazer na carteira</h3>
          ${this.botao()}
        </div>
        ${this.erro ? `<p class="posts-erro">Não consegui reler agora: ${escapar(this.erro)} O que está abaixo é a leitura anterior.</p>` : ''}
        <p class="queda-nota">
          Agrupado por fator, não por cliente, porque aqui o buraco costuma ser da carteira inteira.
          ${this.limpos} de ${this.totalPerfis} perfis sem nenhum ajuste.
          Conferido ${escapar(auditoriaQuando(this.quando))}.
          <span class="fator-fonte">Posições de ${fonte}. São opinião agregada de especialistas, não o algoritmo do Google: servem para ordenar o esforço.</span>
        </p>
        <div class="queda-lista">${blocos}</div>
      </div>`;

    this.ligarBotao();
  },

  ligarBotao() {
    const b = $('perfilVerificar');
    if (b) b.addEventListener('click', () => this.carregar(true));
  },

  ligar() {
    const caixa = $('gmbFatores');
    if (!caixa || caixa.dataset.ligado) return;
    caixa.dataset.ligado = '1';
    caixa.addEventListener('click', e => {
      const alvo = e.target.closest('.fator-perfil-abre');
      if (!alvo) return;
      const cliente = clientes?.find(c => c.id === alvo.dataset.clienteId);
      if (!cliente) return;
      gmbCliente = cliente;
      renderizarListaClientesGmb();
      renderizarRotinaGmb();
    });
  },
};

console.log('✓ perfil-fatores.js carregado');
