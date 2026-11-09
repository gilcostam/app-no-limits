/* ============================================================
   ASAAS: cliente da Edge Function

   Antes isto chamava /api/asaas/customers, endpoint do servidor Node
   em server.js. Funcionava em localhost e dava 404 no ar, porque o
   GitHub Pages serve arquivo estático e não tem servidor.

   Agora chama a Edge Function `asaas-clientes`, que roda no mesmo
   projeto Supabase. Um caminho só, igual local e publicado, e a chave
   do Asaas fica nos secrets da função, nunca no navegador.

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

  async buscarClientes() {
    if (!sb) {
      throw new Error('Sincronização exige o Supabase conectado.');
    }

    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error('Entre com seu acesso para sincronizar.');

    const { data, error } = await sb.functions.invoke('asaas-clientes');
    if (error) throw new Error(await this.detalharErro(error));
    if (!data?.sucesso) throw new Error(data?.erro || 'Erro desconhecido ao buscar clientes.');

    if (data.truncou) {
      console.warn('Atenção: a paginação atingiu o limite da função e pode ter sobrado cliente.');
    }

    return data.clientes || [];
  },

  async sincronizar() {
    try {
      const recebidos = await this.buscarClientes();

      if (recebidos.length === 0) {
        return { sucesso: true, total: 0, clientes: [] };
      }

      /* Uma gravação em lote, não uma por cliente. O laço anterior
         fazia 62 idas ao banco, uma requisição por upsert.

         `criado_em` fica de fora de propósito: a coluna tem default
         now() no banco, então na inserção ela se preenche sozinha e
         no conflito não é tocada. Mandar a data aqui faria toda
         sincronização reescrever a data de entrada de todo cliente. */
      if (sb) {
        const { error } = await sb.from('clientes').upsert(recebidos);
        if (error) throw error;
      } else {
        const agora = new Date().toISOString();
        for (const cliente of recebidos) {
          await Store.salvar('clientes', { ...cliente, criado_em: agora });
        }
      }

      return { sucesso: true, total: recebidos.length, clientes: recebidos };
    } catch (e) {
      console.error('Erro na sincronização:', e.message);
      return { sucesso: false, erro: e.message };
    }
  },
};

console.log('✓ asaas-proxy.js carregado (Edge Function do Supabase)');
