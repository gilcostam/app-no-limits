/* ============================================================
   VERIFICAÇÃO AUTOMÁTICA DOS POSTS QUE ESTÃO NO AR

   A postagem não é um buraco: ela já roda toda semana, em lote, um post
   por cliente, 100% com foto. Medido em 1.258 posts. O que falta não é
   produzir, é CONFERIR o que saiu.

   O caso que motivou isto: num lote saiu publicado, no perfil de uma
   advogada previdenciária, um texto que nomeava OUTRA advogada, falava
   de Direito Civil e trazia o literal "OAB/MG [inserir número]". Ficou
   no ar sem ninguém ver. Advogado com número de OAB errado em
   publicidade é Provimento 205/2021, não erro de digitação.

   Quem lê os perfis é o app de avaliações, de madrugada, e grava. Aqui
   só se mostra a leitura, porque ler 32 perfis leva perto de um minuto
   e abrir uma aba não pode custar isso.

   O robô não apaga nem reescreve post nenhum. Post publicado no Google
   não se edita: se apaga e se publica outro, em público, no perfil de um
   cliente. Ele mostra o problema com o trecho na mão e para aí.

   Ver src/lib/auditoria-posts.ts no nolimits-reviews.
   ============================================================ */

const POSTS_API = 'https://nolimits-reviews.vercel.app/api/auditoria-posts';

const PostsAuditoria = {
  estado: 'nao_carregado',
  perfis: [],
  totalPerfis: 0,
  quando: null,
  erro: '',

  /* agora=true fura a leitura salva e lê os 32 perfis de novo. O cron
     vigia de madrugada, este botão confere depois de arrumar alguma
     coisa: quem acabou de apagar e republicar um post errado quer ver
     o resultado agora, não amanhã. */
  async carregar(agora = false) {
    if (!agora && (this.estado === 'carregando' || this.estado === 'rodando' || this.estado === 'ok')) return;

    if (!sb) {
      this.erro = 'Exige o Supabase conectado.';
      /* Mesma regra do catch lá embaixo: resultado que já estava na tela
         não é jogado fora por causa de uma falha de releitura. */
      this.estado = this.perfis.length ? 'ok' : 'erro';
      this.render();
      return;
    }

    this.estado = agora ? 'rodando' : 'carregando';
    this.render();

    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) throw new Error('Entre com seu acesso para ver a conferência dos posts.');

      const resposta = await fetch(agora ? `${POSTS_API}?agora=1` : POSTS_API, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!resposta.ok) {
        if (resposta.status === 401) throw new Error('Sessão expirada. Saia e entre de novo.');
        const corpo = await resposta.json().catch(() => ({}));
        throw new Error(corpo.erro || `Falha ao buscar (${resposta.status}).`);
      }

      const corpo = await resposta.json();
      this.perfis = Array.isArray(corpo.perfis) ? corpo.perfis : [];
      this.totalPerfis = corpo.totalPerfis || 0;
      this.quando = corpo.quando || null;
      this.erro = '';
      this.estado = corpo.aindaNaoVerificado ? 'nunca' : 'ok';
    } catch (e) {
      this.erro = e.message || 'Falha ao conferir os posts.';
      /* Se ja havia resultado na tela, ele FICA, e o erro aparece como
         faixa em cima. Trocar trinta e dois perfis conferidos por uma
         linha de erro faz a pessoa perder o trabalho por causa de uma
         piscada de rede, e ainda some com a notícia que ela estava lendo. */
      this.estado = this.perfis.length ? 'ok' : 'erro';
    }

    this.render();
  },

  /* Botão de conferir agora. Separado do render do corpo porque ele
     aparece em todos os estados, inclusive no de erro: é justamente
     quando deu erro que a pessoa quer tentar de novo. */
  botao() {
    const rodando = this.estado === 'rodando';
    const carregando = this.estado === 'carregando';
    return `
      <button type="button" class="posts-botao" id="postsVerificar" ${rodando || carregando ? 'disabled' : ''}>
        ${rodando ? 'Lendo os perfis...' : 'Verificar agora'}
      </button>`;
  },

  render() {
    const caixa = $('gmbPosts');
    if (!caixa) return;

    if (this.estado === 'carregando') {
      caixa.innerHTML = '<div class="queda-aviso">Buscando a conferência dos posts...</div>';
      return;
    }
    if (this.estado === 'rodando') {
      caixa.innerHTML = `
        <div class="queda-aviso">
          Lendo os posts dos ${this.totalPerfis || 32} perfis no Google. Leva uns 15 segundos.
        </div>`;
      return;
    }
    if (this.estado === 'erro') {
      caixa.innerHTML = `
        <div class="queda-aviso queda-aviso-erro">
          ${escapar(this.erro)}
          ${this.botao()}
        </div>`;
      this.ligarBotao();
      return;
    }
    if (this.estado === 'nunca') {
      caixa.innerHTML = `
        <div class="queda-aviso">
          Os posts ainda não foram conferidos. ${this.botao()}
        </div>`;
      this.ligarBotao();
      return;
    }
    if (this.estado !== 'ok') { caixa.innerHTML = ''; return; }

    const comAchado = this.perfis.filter(p => p.achados.length || p.erro);
    const limpos = this.perfis.filter(p => !p.achados.length && !p.erro);
    const graves = comAchado.reduce((s, p) => s + p.achados.filter(a => a.gravidade === 'grave').length, 0);

    const titulo = comAchado.length === 0
      ? `Posts no ar: nada a corrigir nos ${this.totalPerfis} perfis`
      : `Posts no ar: ${comAchado.length} ${comAchado.length === 1 ? 'perfil com problema' : 'perfis com problema'}${graves ? `, ${graves} grave${graves > 1 ? 's' : ''}` : ''}`;

    caixa.innerHTML = `
      <div class="queda-bloco">
        <div class="posts-cabecalho">
          <h3 class="queda-titulo">${escapar(titulo)}</h3>
          ${this.botao()}
        </div>
        ${this.erro ? `<p class="posts-erro">Não consegui reler agora: ${escapar(this.erro)} O que está abaixo é a leitura anterior.</p>` : ''}
        <p class="queda-nota">
          Posts publicados nos últimos 90 dias, nos ${this.totalPerfis} perfis.
          Lido ${escapar(auditoriaQuando(this.quando))}.
          ${comAchado.length ? 'O que está marcado como grave já está visível para quem procura o cliente agora.' : ''}
        </p>
        <div class="queda-lista">${comAchado.map(p => this.linhaProblema(p)).join('')}</div>
        ${limpos.length ? this.blocoLimpos(limpos) : ''}
      </div>`;

    this.ligarBotao();
  },

  linhaProblema(p) {
    const clienteId = quedaClientePorPerfil(p.businessId);
    const cliente = clienteId && clientes ? clientes.find(c => c.id === clienteId) : null;
    const nome = cliente ? cliente.nome : p.nome;
    const classe = cliente ? 'queda-linha queda-linha-abre' : 'queda-linha';
    const attr = cliente ? ` data-cliente-id="${escapar(cliente.id)}"` : '';
    const g = p.achados.filter(a => a.gravidade === 'grave').length;

    const itens = p.achados.map(a => `
      <li>
        <strong>${escapar(a.problema)}</strong>
        ${a.quando ? `<span class="posts-data">post de ${escapar(a.quando.split('-').reverse().join('/'))}</span>` : ''}
        <span class="posts-acao">${escapar(a.acao)}</span>
        ${a.trecho ? `<span class="posts-trecho">\u201C${escapar(a.trecho)}\u201D</span>` : ''}
      </li>`).join('');

    return `
      <div class="queda-item">
        <div class="${classe}"${attr} title="${escapar(p.nome)}">
          <span class="queda-nome">${escapar(nome)}</span>
          <span class="queda-numeros">${p.postsLidos} ${p.postsLidos === 1 ? 'post lido' : 'posts lidos'}</span>
          <span class="queda-perda">${g ? `${g} grave${g > 1 ? 's' : ''}` : ''}</span>
          <span class="queda-pct">${p.achados.length}</span>
        </div>
        <div class="queda-acoes queda-acoes-${g > 0 ? 'grave' : 'atencao'}">
          ${p.erro ? `<p class="queda-veredito">Não consegui ler este perfil: ${escapar(p.erro)}</p>` : ''}
          <ul class="posts-achados">${itens}</ul>
        </div>
      </div>`;
  },

  /* Os perfis sem problema, em lista curta. Eles existem na tela por dois
     motivos: provam que a conferência rodou na carteira inteira, e não só
     nos três que apareceram, e mostram quem está chegando perto dos 21
     dias sem postar antes de virar alerta. Por isso vêm ordenados por
     tempo sem postar, e não por nome. */
  blocoLimpos(limpos) {
    const ordenados = [...limpos].sort((a, b) => (b.diasSemPostar ?? -1) - (a.diasSemPostar ?? -1));
    const linhas = ordenados.map(p => {
      const d = p.diasSemPostar;
      const alerta = d !== null && d >= 14 ? ' posts-limpo-atrasado' : '';
      const quando = d === null ? 'sem post' : d === 0 ? 'postou hoje' : d === 1 ? 'há 1 dia' : `há ${d} dias`;
      return `
        <div class="posts-limpo${alerta}" title="${escapar(p.nome)}">
          <span class="posts-limpo-nome">${escapar(p.nome)}</span>
          <span class="posts-limpo-quando">${escapar(quando)}</span>
        </div>`;
    }).join('');

    return `
      <details class="posts-limpos">
        <summary>${limpos.length} ${limpos.length === 1 ? 'perfil conferido e sem problema' : 'perfis conferidos e sem problema'}</summary>
        <div class="posts-limpos-lista">${linhas}</div>
      </details>`;
  },

  ligarBotao() {
    const b = $('postsVerificar');
    if (b) b.addEventListener('click', () => this.carregar(true));
  },

  /* Mesmo clique da lista de quedas: abre o cliente. Delegado no
     container porque o conteúdo é refeito a cada render. */
  ligar() {
    const caixa = $('gmbPosts');
    if (!caixa || caixa.dataset.ligado) return;
    caixa.dataset.ligado = '1';
    caixa.addEventListener('click', e => {
      const linha = e.target.closest('.queda-linha-abre');
      if (!linha) return;
      const cliente = clientes?.find(c => c.id === linha.dataset.clienteId);
      if (!cliente) return;
      gmbCliente = cliente;
      renderizarListaClientesGmb();
      renderizarRotinaGmb();
    });
  },
};

console.log('✓ posts-auditoria.js carregado');
