/* ============================================================
   ASAAS: cliente da Edge Function

   A chave do Asaas é chave de produção de meio de pagamento e não pode
   ir para o front. A Edge Function `asaas-clientes` roda no mesmo
   projeto Supabase e guarda a chave nos secrets, então o navegador
   nunca a vê. Um caminho só, igual em localhost e publicado.

   Ver supabase/functions/asaas-clientes/index.ts
   ============================================================ */

const Asaas = {
  /* Mensagem de erro da Edge Function: o supabase-js embrulha o corpo
     da resposta em error.context, e sem abrir isso toda falha vira
     "Edge Function returned a non-2xx status code", que não ajuda. */
  async detalharErro(erro) {
    try {
      const corpo = await erro.context?.json();
      if (corpo?.erro) return corpo.erro;
    } catch { /* resposta sem JSON, usa a mensagem crua */ }
    return erro.message || 'Falha ao chamar a função de sincronização.';
  },

  /**
   * Busca a carteira no Asaas. NÃO grava nada.
   *
   * Separado da gravação de propósito: antes era uma função só, que
   * buscava e gravava todo mundo de uma vez, e por isso trazia de volta
   * cliente que saiu há dois anos. Agora quem decide o que entra é a
   * tela de escolha, não esta função.
   *
   * Devolve { clientes, extras, assinaturasLidas, truncou }.
   * `clientes` tem exatamente as colunas da tabela. `extras` é indexado
   * por id e traz cadastro, removido e assinatura, que servem só para
   * filtrar na tela.
   */
  async buscar() {
    if (!sb) throw new Error('Sincronização exige o Supabase conectado.');

    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error('Entre com seu acesso para sincronizar.');

    const { data, error } = await sb.functions.invoke('asaas-clientes');
    if (error) throw new Error(await this.detalharErro(error));
    if (!data?.sucesso) throw new Error(data?.erro || 'Erro desconhecido ao buscar clientes.');

    return {
      clientes: data.clientes || [],
      /* Função antiga, ainda não atualizada, não manda `extras`. A tela
         trata isso como "não sei o mês nem a assinatura" e avisa, em vez
         de quebrar. */
      extras: data.extras || null,
      assinaturasLidas: data.assinaturasLidas !== false,
      truncou: Boolean(data.truncou),
    };
  },

  /**
   * Grava as fichas escolhidas. Uma gravação em lote, não uma por
   * cliente: o laço antigo fazia uma ida ao banco por upsert.
   *
   * `criado_em` fica de fora de propósito: a coluna tem default now(),
   * então na inserção se preenche sozinha e no conflito não é tocada.
   * Mandar a data aqui faria toda sincronização reescrever a data de
   * entrada de todo cliente.
   */
  async gravar(fichas) {
    if (!fichas?.length) return { sucesso: true, total: 0 };

    try {
      if (sb) {
        const { error } = await sb.from('clientes').upsert(fichas);
        if (error) throw error;
      } else {
        const agora = new Date().toISOString();
        for (const ficha of fichas) {
          await Store.salvar('clientes', { ...ficha, criado_em: agora });
        }
      }
      return { sucesso: true, total: fichas.length };
    } catch (e) {
      console.error('Erro ao gravar clientes:', e.message);
      return { sucesso: false, erro: e.message };
    }
  },
};

console.log('✓ asaas-proxy.js carregado (Edge Function do Supabase)');
