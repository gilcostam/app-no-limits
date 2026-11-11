/* ============================================================
   PERFIS EM QUEDA

   Lista de quem perdeu visualização no Google, direto na aba Google Meu
   Negócio. A lista existia só no app de avaliações, e um link para outro
   app é um lugar onde ninguém passa: a rotina é feita aqui.

   Os números não são copiados para cá. Esta tela chama a rota /api/queda
   do app de avaliações, que calcula na hora a partir das mesmas linhas
   que o relatório mensal usa. Guardar uma cópia aqui pareceria mais
   simples e seria pior: cópia que envelhece em silêncio mostra o perfil
   de dois meses atrás como se fosse o de hoje.

   A autenticação é o login que já existe aqui. O painel manda o access
   token do Supabase e o outro lado confere a assinatura contra as chaves
   públicas deste mesmo projeto. Por isso não há segredo nenhum neste
   arquivo, o que é bom, porque ele é servido aberto no GitHub Pages.

   Ver src/app/api/queda/route.ts no nolimits-reviews.
   ============================================================ */

const QUEDA_API = 'https://nolimits-reviews.vercel.app/api/queda';

/* Perfil lá -> cliente daqui, invertendo o vínculo que já está escrito e
   conferido em relatorio-gmb.js. Sem isto a lista mostraria o nome do
   Google ("Almofadas Moretto Casa") e pararia ali, sem levar à rotina do
   cliente, que é a razão de ela estar nesta aba. */
function quedaClientePorPerfil(perfilId) {
  if (typeof RELATORIO_PERFIS !== 'object') return null;
  for (const [clienteId, perfil] of Object.entries(RELATORIO_PERFIS)) {
    if (perfil === perfilId) return clienteId;
  }
  return null;
}

const Queda = {
  /* 'nao_carregado' | 'carregando' | 'ok' | 'erro' */
  estado: 'nao_carregado',
  perfis: [],
  erro: '',

  /* Uma busca por carregamento de página. O número vem da sincronização
     das 9h, então não muda entre duas idas à aba: refazer a chamada a
     cada troca de aba seria rede gasta para receber a mesma resposta. */
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
      if (!session) throw new Error('Entre com seu acesso para ver os perfis em queda.');

      const resposta = await fetch(QUEDA_API, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!resposta.ok) {
        /* 401 aqui quase sempre é sessão velha, e "erro 401" não diz isso
           para quem está olhando a tela. */
        if (resposta.status === 401) throw new Error('Sessão expirada. Saia e entre de novo.');
        const corpo = await resposta.json().catch(() => ({}));
        throw new Error(corpo.erro || `Falha ao buscar (${resposta.status}).`);
      }

      const corpo = await resposta.json();
      this.perfis = Array.isArray(corpo.perfis) ? corpo.perfis : [];
      this.estado = 'ok';
    } catch (e) {
      this.estado = 'erro';
      this.erro = e.message || 'Falha ao buscar os perfis em queda.';
    }

    this.render();
  },

  render() {
    const caixa = $('gmbQueda');
    if (!caixa) return;

    if (this.estado === 'nao_carregado') { caixa.innerHTML = ''; return; }

    if (this.estado === 'carregando') {
      caixa.innerHTML = '<div class="queda-aviso">Buscando perfis em queda...</div>';
      return;
    }

    if (this.estado === 'erro') {
      /* Falha fica visível em vez de a caixa sumir: caixa vazia é
         indistinguível de "ninguém caiu", que é a melhor notícia
         possível, e a pior coisa a mostrar quando a verdade é que a
         busca falhou. */
      caixa.innerHTML = `
        <div class="queda-aviso queda-aviso-erro">
          Não foi possível buscar os perfis em queda. ${escapar(this.erro)}
          <button type="button" class="queda-tentar">Tentar de novo</button>
        </div>`;
      caixa.querySelector('.queda-tentar')?.addEventListener('click', () => {
        this.estado = 'nao_carregado';
        this.carregar();
      });
      return;
    }

    if (this.perfis.length === 0) {
      caixa.innerHTML = '<div class="queda-aviso queda-aviso-ok">Nenhum perfil em queda neste período.</div>';
      return;
    }

    const linhas = this.perfis.map(p => {
      const clienteId = quedaClientePorPerfil(p.id);
      const cliente = clienteId && clientes ? clientes.find(c => c.id === clienteId) : null;
      /* Nome do cadastro daqui quando existe, porque é o nome pelo qual
         ela procura o cliente na lista ao lado. Sem vínculo, fica o nome
         do Google, que é melhor que id nenhum. */
      const nome = cliente ? cliente.nome : p.name;
      /* Linha clicável só quando há cliente para abrir. Clicável que não
         faz nada ensina a não clicar. */
      const classe = cliente ? 'queda-linha queda-linha-abre' : 'queda-linha';
      const attr = cliente ? ` data-cliente-id="${escapar(cliente.id)}"` : '';
      return `
        <div class="${classe}"${attr} title="${escapar(p.name)}">
          <span class="queda-nome">${escapar(nome)}</span>
          <span class="queda-numeros">${p.antes.toLocaleString('pt-BR')} → ${p.agora.toLocaleString('pt-BR')}</span>
          <span class="queda-perda">−${p.perda.toLocaleString('pt-BR')}/mês</span>
          <span class="queda-pct">${p.variacao}%</span>
        </div>`;
    }).join('');

    const { mesAntes, mesAgora } = this.perfis[0];
    caixa.innerHTML = `
      <div class="queda-bloco">
        <h3 class="queda-titulo">Fora da rotina: ${this.perfis.length} ${this.perfis.length === 1 ? 'perfil em queda' : 'perfis em queda'}</h3>
        <p class="queda-nota">
          Perderam mais de 20% das visualizações de ${escapar(mesAntes)} para ${escapar(mesAgora)}.
          Queda assim tem causa própria (suspensão parcial, categoria alterada, edição aceita
          pelo Google, concorrente novo) e pede diagnóstico individual, não mais uma volta
          do checklist.
        </p>
        <div class="queda-lista">${linhas}</div>
      </div>`;
  },

  /* Clique na linha seleciona o cliente e desenha a rotina dele, do mesmo
     jeito que clicar na lista ao lado. Delegado no container porque o
     conteúdo é refeito a cada render. */
  ligar() {
    const caixa = $('gmbQueda');
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

console.log('✓ queda-gmb.js carregado');
