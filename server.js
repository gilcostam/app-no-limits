/* ============================================================
   SERVIDOR LOCAL DE DESENVOLVIMENTO

   Serve os arquivos estáticos em http://localhost:8080 para testar o
   app antes de publicar. Nada além disso.

   O proxy do Asaas que morava aqui saiu: virou a Edge Function
   `asaas-clientes` no Supabase, em supabase/functions/asaas-clientes/.

   Por que a mudança: este servidor só existe na máquina. No GitHub
   Pages não há servidor, então a sincronização dava 404 no ar. E
   enquanto o proxy vivia aqui, a chave de produção do Asaas precisava
   estar em .env no disco. Agora ela fica nos secrets da função, num
   lugar só, e o app funciona igual local e publicado.
   ============================================================ */

const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

/* Sem cache. Em desenvolvimento o Chrome servia a versão anterior de
   app.js depois de uma edição, o que faz perder tempo procurando bug
   que já foi corrigido. */
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

app.use(express.static(path.join(__dirname), { etag: false, lastModified: false }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Servidor local do App No Limits                               ║
║  http://localhost:${PORT}                                          ║
║                                                                ║
║  Só arquivos estáticos. A sincronização do Asaas roda na       ║
║  Edge Function do Supabase, igual no ar.                       ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
