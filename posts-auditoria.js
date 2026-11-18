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
  limpos: 0,
  quando: null,
  erro: '',

  async carregar() {
    if (this.estado === 'carregando' || this.estado === 'ok') return;

    if (!sb) {
      this.estado = 'erro';
      this.erro = 'Exige o Supabase conectado.';
      this.render();
      return;
    }

    this.estado = 'carregando';
    this.render();

    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) throw new Error('Entre com seu acesso para ver a conferência dos posts.');

      const resposta = await fetch(POSTS_API, {
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
      this.limpos = corpo.limpos || 0;
      this.quando = corpo.quando || null;
      this.estado = corpo.aindaNaoVerificado ? 'nunca' : 'ok';
    } catch (e) {
      this.estado = 'erro';
      this.erro = e.message || 'Falha ao conferir os posts.';
    }

    this.render();
  },

  render() {
    const caixa = $('gmbPosts');
    if (!caixa) return;

    if (this.estado === 'carregando') {
      caixa.innerHTML = '<div class="queda-aviso">Buscando a conferência dos posts...</div>';
      return;
    }
    if (this.estado === 'erro') {
      caixa.innerHTML = `<div class="queda-aviso queda-aviso-erro">${escapar(this.erro)}</div>`;
      return;
    }
    if (this.estado === 'nunca') {
      caixa.innerHTML = '<div class="queda-aviso">Os posts ainda não foram conferidos.</div>';
      return;
    }
    if (this.estado !== 'ok') { caixa.innerHTML = ''; return; }

    /* Nenhum achado também é notícia, e precisa dizer QUANTOS foram lidos.
       "Nenhum problema" sozinho é indistinguível de "não rodou". */
    if (this.perfis.length === 0) {
      caixa.innerHTML = `
        <div class="queda-aviso queda-aviso-ok">
          Nenhum problema nos posts dos ${this.totalPerfis} perfis. Conferido ${escapar(auditoriaQuando(this.quando))}.
        </div>`;
      return;
    }

    const graves = this.perfis.reduce((s, p) => s + p.achados.filter(a => a.gravidade === 'grave').length, 0);

    const linhas = this.perfis.map(p => {
      const clienteId = quedaClientePorPerfil(p.businessId);
      const cliente = clienteId && clientes ? clientes.find(c => c.id === clienteId) : null;
      const nome = cliente ? cliente.nome : p.nome;
      const classe = cliente ? 'queda-linha queda-linha-abre' : 'queda-linha';
      const attr = cliente ? ` data-cliente-id="${escapar(cliente.id)}"` : '';
      const g = p.achados.filter(a => a.gravidade === 'grave').length;
      const pior = g > 0 ? 'grave' : 'atencao';

      const itens = p.achados.map(a => `
        <li>
          <strong>${escapar(a.problema)}</strong>
          ${a.quando ? `<span class="posts-data">post de ${escapar(a.quando.split('-').reverse().join('/'))}</span>` : ''}
          <span class="posts-acao">${escapar(a.acao)}</span>
          ${a.trecho ? `<span class="posts-trecho">“${escapar(a.trecho)}”</span>` : ''}
        </li>`).join('');

      return `
        <div class="queda-item">
          <div class="${classe}"${attr} title="${escapar(p.nome)}">
            <span class="queda-nome">${escapar(nome)}</span>
            <span class="queda-numeros">${p.postsLidos} ${p.postsLidos === 1 ? 'post lido' : 'posts lidos'}</span>
            <span class="queda-perda">${g ? `${g} grave${g > 1 ? 's' : ''}` : ''}</span>
            <span class="queda-pct">${p.achados.length}</span>
          </div>
          <div class="queda-acoes queda-acoes-${pior}">
            ${p.erro ? `<p class="queda-veredito">Não consegui ler este perfil: ${escapar(p.erro)}</p>` : ''}
            <ul class="posts-achados">${itens}</ul>
          </div>
        </div>`;
    }).join('');

    caixa.innerHTML = `
      <div class="queda-bloco">
        <h3 class="queda-titulo">
          Posts no ar: ${this.perfis.length} ${this.perfis.length === 1 ? 'perfil com problema' : 'perfis com problema'}${graves ? `, ${graves} grave${graves > 1 ? 's' : ''}` : ''}
        </h3>
        <p class="queda-nota">
          Conferência dos posts já publicados nos ${this.totalPerfis} perfis, dos últimos 90 dias.
          ${this.limpos} perfis sem nenhum problema. O que está marcado como grave já está visível
          para quem procura o cliente agora. Lido ${escapar(auditoriaQuando(this.quando))}.
        </p>
        <div class="queda-lista">${linhas}</div>
      </div>`;
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
