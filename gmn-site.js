/* Rotina semanal do site: SEO, GEO e AEO.

   Diferente das outras abas do GMN, esta não veio da planilha Gestao_GMB_NoLimits.
   A planilha tem "SEO & Site", mas lá é um estado do cliente (tem site? está em
   diretórios? publica com frequência?), não uma rotina: nenhuma linha dela diz o
   que fazer numa terça-feira. A rotina abaixo é nova e mora só aqui.

   Ela não se divide em SEO, GEO e AEO. Os três consomem o mesmo artefato: uma
   resposta direta, curta e marcada, no topo de uma página que responde a uma
   pergunta real. O buscador usa para o trecho em destaque, a IA generativa usa
   para citar, o assistente de voz usa para ler em voz alta. Dividir a semana por
   sigla criaria três tarefas para o mesmo trabalho feito uma vez só, então a
   semana se divide por artefato produzido:

     segunda   colher o termo mais buscado e três perguntas reais
     terça     publicar a resposta direta no site, com o termo no título e na meta
     quarta    marcar com schema e mandar indexar no Search Console
     quinta    olhar quem está na frente e se o cliente aparece na resposta da IA
     sexta     medir as posições, comparar com a semana passada e com o concorrente

   Uma vez por mês a sexta também fecha o artigo do blog, juntando as quatro
   perguntas colhidas no mês. */

const ACOES_SITE = [
  { campo: 'perguntas', rotulo: 'Perguntas do site', nome: 'Termo da semana e três perguntas reais levantados' },
  { campo: 'resposta', rotulo: 'Resposta no site', nome: 'Resposta direta publicada, com título e meta no termo' },
  { campo: 'indexacao', rotulo: 'Schema e indexação', nome: 'Schema aplicado e URL enviada para indexação' },
  { campo: 'concorrencia', rotulo: 'Concorrência', nome: 'Concorrente analisado e presença na resposta da IA conferida' },
  { campo: 'placar', rotulo: 'Placar e benchmark', nome: 'Posições medidas e comparadas com a semana anterior' },
  { campo: 'artigo', rotulo: 'Artigo do blog', nome: 'Artigo do mês publicado e enviado para indexação' },
];

/* Mesma fila do conteúdo, e pelo mesmo motivo: publicar ou não publicar, sem meio
   termo. O "em andamento" cobraria um clique a mais na ação mais comum da tela. */
const SITUACOES_SITE = SITUACOES_CONTEUDO;

let sites = [];

/* ---------- carregamento ---------- */

// Sem renderização própria: esta rotina não tem aba, ela vive dentro do plano da
// semana. Quem desenha é o renderPlano(), chamado logo depois lá no gmn.js.
async function carregarSite() {
  sites = await Store.listar('gmn_site');
}

/* ---------- linhas ---------- */

// O mês tem valor padrão em vez de sair de um filtro na tela porque não existe
// filtro: a rotina do site é sempre a da semana corrente.
function linhaSite(onboardingId, semana, mes = mesDe(new Date())) {
  const id = `${onboardingId}__${mes}-s${semana}`;
  return sites.find(s => s.id === id) || {
    id,
    onboarding_id: onboardingId,
    mes,
    semana,
    ...Object.fromEntries(ACOES_SITE.map(a => [a.campo, 'pendente'])),
    termo: '',
    criado_em: new Date().toISOString(),
  };
}

// A linha só passa a existir quando alguém marca a primeira tarefa ou escreve o
// termo: semana sem trabalho nenhum não precisa ocupar espaço no banco.
function linhaSiteGravavel(onboardingId, semana, mes) {
  const linha = linhaSite(onboardingId, semana, mes);
  if (!sites.includes(linha)) sites.push(linha);
  return linha;
}

/* ---------- quem entra na rotina ---------- */

/* Cliente sem site não tem o que fazer aqui. A resposta já existe na aba de SEO,
   no campo "site", e não vale a pena perguntar de novo em outro lugar: duas
   respostas para a mesma pergunta acabam se contradizendo, que é exatamente o
   problema que a planilha tinha com "Site Institucional" e "Status do Site".

   O padrão daquele campo é "sim", então cliente novo já entra na rotina do site
   até alguém marcar "Não se aplica" na aba de SEO. É o lado certo para errar:
   aparecer demais é uma tarefa marcada como N/A, sumir demais é trabalho que
   ninguém percebe que deixou de ser feito. */
function temSite(onboardingId) {
  return linhaSeo(onboardingId).site === 'sim';
}
