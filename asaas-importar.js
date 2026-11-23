/* ============================================================================
   IMPORTAR DO ASAAS: escolher o que entra

   O botão ⟳ antes buscava a carteira inteira no Asaas e gravava todo mundo,
   sem perguntar. O Asaas nunca apaga cliente: quem parou de pagar continua na
   listagem para sempre, porque o objeto cliente não tem campo de ativo ou
   inativo. Resultado: toda sincronização ressuscitava ex-cliente.

   Agora o ⟳ abre esta tela. Nada é gravado antes de ela ser confirmada, o que
   também importa porque a tabela `clientes` guarda CPF, endereço e telefone de
   gente real.

   Duas perguntas que a tela responde antes de você marcar qualquer caixa:

   1. Quem ainda é cliente. Vem do status da ASSINATURA no Asaas (ACTIVE,
      EXPIRED, INACTIVE), não do cadastro. Por padrão só os ativos vêm
      marcados, então o caminho curto é abrir e confirmar.

   2. Quando entrou. Vem de dateCreated do Asaas, que é a data de cadastro lá,
      e não a data em que a ficha entrou neste app. A API não filtra por data
      (os únicos filtros de /customers são nome, e-mail, documento e grupo),
      então o filtro de mês é feito aqui.
   ============================================================================ */

const Importacao = {
  clientes: [],
  extras: null,
  assinaturasLidas: true,
  marcados: new Set(),
  jaNoApp: new Set(),
  filtroMes: 'todos',
  filtroStatus: 'ativos',

  /* ---------- leitura ---------- */

  mesDe(id) {
    const d = this.extras?.[id]?.cadastro || '';
    return /^\d{4}-\d{2}/.test(d) ? d.slice(0, 7) : '';
  },

  statusDe(id) {
    const e = this.extras?.[id];
    if (!e) return 'desconhecido';
    if (e.removido) return 'removido';
    if (e.assinatura === 'ACTIVE') return 'ativo';
    if (e.assinatura === 'EXPIRED' || e.assinatura === 'INACTIVE') return 'inativo';
    return 'sem-assinatura';
  },

  /* ---------- filtros ---------- */

  passaNoFiltro(c) {
    if (this.filtroMes !== 'todos' && this.mesDe(c.id) !== this.filtroMes) return false;

    const s = this.statusDe(c.id);
    if (this.filtroStatus === 'ativos') return s === 'ativo';
    if (this.filtroStatus === 'inativos') return s === 'inativo' || s === 'sem-assinatura' || s === 'removido';
    return true;
  },

  visiveis() {
    return this.clientes.filter(c => this.passaNoFiltro(c));
  },

  /* ---------- abertura ---------- */

  async abrir() {
    const btn = $('btnSincronizar');
    const aviso = $('aviso-sincronizar');

    btn?.classList.add('sincronizando');
    if (aviso) { aviso.textContent = 'Buscando no Asaas...'; aviso.className = 'aviso-sync'; }

    try {
      const r = await Asaas.buscar();
      this.clientes = r.clientes;
      this.extras = r.extras;
      this.assinaturasLidas = r.assinaturasLidas;

      /* Quem já está no app aparece como "já cadastrado": importar de novo
         só atualiza a ficha, não duplica, mas é informação que muda a
         decisão de marcar ou não. */
      const atuais = await Store.listarClientes();
      this.jaNoApp = new Set(atuais.map(c => c.id));

      /* Sem `extras` não dá para saber quem é ativo, então nada vem marcado:
         marcar por palpite é exatamente o erro que esta tela corrige. */
      this.filtroStatus = this.extras ? 'ativos' : 'todos';
      this.marcados = new Set(
        this.extras ? this.clientes.filter(c => this.statusDe(c.id) === 'ativo').map(c => c.id) : []
      );

      /* O <select> tem que mostrar o filtro que está valendo. Sem isto ele
         dizia "Só assinatura ativa" enquanto a lista mostrava todo mundo,
         que é a pior combinação: a tela mente sobre o que está filtrando. */
      const sel = $('impStatus');
      if (sel) {
        sel.value = this.filtroStatus;
        /* Sem assinatura lida não há o que filtrar por situação: todos os
           clientes caem em "desconhecido" e escolher "só ativa" devolveria
           lista vazia sem explicar por quê. */
        sel.disabled = !this.extras || !this.assinaturasLidas;
      }
      const selMes = $('impMes');
      if (selMes) {
        selMes.value = 'todos';
        selMes.disabled = !this.extras;
      }
      this.filtroMes = 'todos';

      if (aviso) aviso.textContent = '';
      this.render();
      $('impOverlay')?.classList.remove('oculto');
    } catch (e) {
      if (aviso) {
        aviso.textContent = `✗ ${e.message}`;
        aviso.className = 'aviso-sync erro';
      }
    } finally {
      btn?.classList.remove('sincronizando');
    }
  },

  fechar() {
    $('impOverlay')?.classList.add('oculto');
  },

  /* ---------- desenho ---------- */

  mesesDisponiveis() {
    const meses = new Set();
    for (const c of this.clientes) {
      const m = this.mesDe(c.id);
      if (m) meses.add(m);
    }
    return [...meses].sort().reverse();
  },

  nomeDoMes(aaaaMm) {
    const [ano, mes] = aaaaMm.split('-');
    const nomes = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `${nomes[Number(mes) - 1] ?? mes} de ${ano}`;
  },

  render() {
    const corpo = $('impCorpo');
    if (!corpo) return;

    const lista = this.visiveis();
    const semData = this.clientes.filter(c => !this.mesDe(c.id)).length;

    /* Avisos no topo: cada um é uma coisa que a tela NÃO sabe, e dizer
       isso vale mais do que mostrar a lista como se estivesse completa. */
    const avisos = [];
    if (!this.extras) {
      avisos.push('A função do Asaas ainda não foi atualizada, então não dá para ver mês de cadastro nem assinatura. Só a lista de nomes aparece, e nada vem marcado.');
    } else if (!this.assinaturasLidas) {
      avisos.push('Não consegui ler as assinaturas no Asaas agora. O filtro de mês funciona, mas não dá para saber quem ainda é cliente, então nada vem marcado.');
    }
    if (semData && this.extras) {
      avisos.push(`${semData} cliente(s) sem data de cadastro no Asaas. Só aparecem com o mês em "Todos".`);
    }

    $('impAvisos').innerHTML = avisos.length
      ? avisos.map(a => `<p class="imp-aviso">${escapar(a)}</p>`).join('')
      : '';

    /* Seletor de mês */
    const sel = $('impMes');
    const meses = this.mesesDisponiveis();
    /* Remonta só quando a lista de meses muda, para não perder a escolha
       atual a cada render (render roda a cada clique em caixinha). */
    if (sel && sel.dataset.meses !== meses.join()) {
      const escolhido = sel.value || 'todos';
      sel.innerHTML = `<option value="todos">Todos os meses</option>` +
        meses.map(m => `<option value="${m}">${escapar(this.nomeDoMes(m))}</option>`).join('');
      sel.dataset.meses = meses.join();
      sel.value = meses.includes(escolhido) ? escolhido : 'todos';
    }

    const marcadosVisiveis = lista.filter(c => this.marcados.has(c.id)).length;

    corpo.innerHTML = lista.length === 0
      ? `<p class="imp-vazio">Nenhum cliente com esse filtro.</p>`
      : lista.map(c => {
          const s = this.statusDe(c.id);
          const mes = this.mesDe(c.id);
          const rotulo = {
            ativo: '<span class="imp-tag imp-tag-ativo">assinatura ativa</span>',
            inativo: '<span class="imp-tag imp-tag-inativo">assinatura encerrada</span>',
            'sem-assinatura': '<span class="imp-tag imp-tag-inativo">sem assinatura</span>',
            removido: '<span class="imp-tag imp-tag-inativo">removido no Asaas</span>',
            desconhecido: '',
          }[s];

          return `
            <label class="imp-linha${this.marcados.has(c.id) ? ' imp-linha-marcada' : ''}">
              <input type="checkbox" class="imp-check" data-id="${escapar(c.id)}"
                     ${this.marcados.has(c.id) ? 'checked' : ''}>
              <span class="imp-nome">${escapar(c.nome || '(sem nome)')}</span>
              <span class="imp-meta">
                ${rotulo}
                ${mes ? `<span class="imp-mes">${escapar(this.nomeDoMes(mes))}</span>` : ''}
                ${this.jaNoApp.has(c.id) ? '<span class="imp-tag imp-tag-ja">já cadastrado</span>' : ''}
              </span>
            </label>`;
        }).join('');

    /* Dois números, de propósito. Marcar quatro, filtrar para "encerradas" e
       ver "0 marcados" ao lado de um botão escrito "Importar 4" parece bug e,
       pior, deixa importar gente que não está na tela. Então a contagem diz as
       duas coisas sempre que elas diferem. */
    const fora = this.marcados.size - marcadosVisiveis;
    $('impContagem').textContent = fora > 0
      ? `${marcadosVisiveis} marcado(s) nesta tela, mais ${fora} fora do filtro`
      : `${marcadosVisiveis} de ${lista.length} marcado(s)`;

    const btn = $('impConfirmar');
    btn.disabled = this.marcados.size === 0;
    btn.textContent = this.marcados.size === 0
      ? 'Importar'
      : `Importar ${this.marcados.size} cliente(s)`;
  },

  /* ---------- ações ---------- */

  alternar(id, ligado) {
    if (ligado) this.marcados.add(id);
    else this.marcados.delete(id);
    this.render();
  },

  /* Marca ou desmarca só o que está na tela. Mexer no que está escondido
     por um filtro é o tipo de coisa que ninguém confere depois. */
  todosVisiveis(ligado) {
    for (const c of this.visiveis()) {
      if (ligado) this.marcados.add(c.id);
      else this.marcados.delete(c.id);
    }
    this.render();
  },

  async confirmar() {
    const fichas = this.clientes.filter(c => this.marcados.has(c.id));
    if (!fichas.length) return;

    const btn = $('impConfirmar');
    btn.disabled = true;
    btn.textContent = 'Importando...';

    const r = await Asaas.gravar(fichas);
    const aviso = $('aviso-sincronizar');

    if (r.sucesso) {
      this.fechar();
      await carregarDados();
      if (aviso) {
        aviso.textContent = `✓ ${r.total} cliente(s) importado(s)`;
        aviso.className = 'aviso-sync ok';
        setTimeout(() => { aviso.textContent = ''; }, 3000);
      }
    } else {
      $('impAvisos').innerHTML = `<p class="imp-aviso imp-aviso-erro">${escapar(r.erro)}</p>`;
      this.render();
    }
  },
};

/* ---------- ligações ---------- */

document.addEventListener('click', (e) => {
  if (e.target.id === 'impFechar' || e.target.id === 'impCancelar') Importacao.fechar();
  if (e.target.id === 'impConfirmar') Importacao.confirmar();
  if (e.target.id === 'impMarcarTodos') Importacao.todosVisiveis(true);
  if (e.target.id === 'impDesmarcarTodos') Importacao.todosVisiveis(false);
  /* Clique no fundo escuro fecha; clique dentro da caixa não. */
  if (e.target.id === 'impOverlay') Importacao.fechar();
});

document.addEventListener('change', (e) => {
  if (e.target.classList?.contains('imp-check')) {
    Importacao.alternar(e.target.dataset.id, e.target.checked);
  }
  if (e.target.id === 'impMes') {
    Importacao.filtroMes = e.target.value;
    Importacao.render();
  }
  if (e.target.id === 'impStatus') {
    Importacao.filtroStatus = e.target.value;
    Importacao.render();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('impOverlay')?.classList.contains('oculto')) {
    Importacao.fechar();
  }
});

console.log('✓ asaas-importar.js carregado');
