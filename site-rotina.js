/* ============================================================
   ROTINA DO SITE (RANQUEAMENTO + CITAÇÃO POR IA)

   Três ciclos, três chaves de estado separadas:

   1. FUNDAÇÃO: configuração técnica. Marca uma vez e fica marcado.
      Só volta a zero se o site for refeito.
      Estado permanente em `site_${clienteId}`.

   2. MENSAL: o que muda sozinho e precisa ser olhado todo mês.
      Estado em `site_${clienteId}_${ano}-M${mm}`.

   3. TRIMESTRAL: o que exige análise, não só conferência.
      Estado em `site_${clienteId}_${ano}-T${n}`.

   Critério de ordem: o primeiro bloco é o que, se estiver errado,
   anula todo o resto. Um site que só monta o conteúdo por
   JavaScript não é lido pelos robôs de IA, então nenhuma outra
   otimização desta página chega a valer alguma coisa.
   ============================================================ */

const SITE_BLOCOS = [
  { id: 'robos', ciclo: 'fundacao', titulo: 'O robô consegue ler?',
    nota: 'GPTBot, ClaudeBot e PerplexityBot fazem download simples da página e não executam JavaScript. Se o conteúdo só aparece depois do JS rodar, para eles a página está em branco.' },
  { id: 'arquitetura', ciclo: 'fundacao', titulo: 'Quais páginas o site tem',
    nota: 'Vem antes da fundação técnica porque é sobre quais páginas EXISTEM, não sobre como cada uma é feita. "Uma página dedicada para cada serviço" é o fator nº 1 do ranqueamento orgânico local e o nº 2 da citação por IA, medido pela Whitespark em 2026: nada dentro de uma página compensa a página não existir.' },
  { id: 'tecnica', ciclo: 'fundacao', titulo: 'Fundação técnica',
    nota: 'Configura uma vez. Refazer só se o site for reconstruído.' },
  { id: 'estrutura', ciclo: 'fundacao', titulo: 'Estrutura da página',
    nota: 'Vale por rota, não só na home.' },
  { id: 'schema', ciclo: 'fundacao', titulo: 'Dados estruturados',
    nota: 'Campo sem dado real fica de fora. Schema com informação inventada é pior que schema ausente.' },
  { id: 'autoridade', ciclo: 'fundacao', titulo: 'Sinais de autoridade (E-E-A-T)',
    nota: 'No AI Overview do Google isso funciona como filtro: sem esses sinais a página não entra na seleção, não importa o conteúdo.' },

  { id: 'mensal', ciclo: 'mensal', titulo: 'Conferência do mês',
    nota: 'Rápido, é só olhar e comparar com o mês anterior.' },
  { id: 'citacao', ciclo: 'mensal', titulo: 'Teste de citação nas IAs',
    nota: 'Pergunte como um cliente perguntaria, não com a palavra-chave. Anote se citou, quem citou no lugar e com que link.' },

  { id: 'analise', ciclo: 'trimestral', titulo: 'Análise do trimestre',
    nota: 'Aqui é decisão, não conferência. Reserve tempo.' },
  { id: 'frescor', ciclo: 'trimestral', titulo: 'Atualização de conteúdo',
    nota: 'Perplexity e ChatGPT privilegiam material recente. Página parada há um ano perde para texto pior e mais novo.' },
];

const SITE_ITENS = [
  /* ---------- o robô consegue ler? ---------- */
  { bloco: 'robos', id: 'html_estatico', label: 'HTML pronto no servidor, em cada rota', critico: true,
    desc: 'Abra o código-fonte da página (Ctrl+U) ou rode "curl -s url | grep". Se o texto do conteúdo não estiver lá, o robô de IA não vê nada. Cada rota precisa ser uma pasta com index.html próprio.' },
  { bloco: 'robos', id: 'robots_ia', label: 'robots.txt liberando os robôs de IA', critico: true,
    desc: 'Allow explícito para GPTBot, ClaudeBot, PerplexityBot, Google-Extended e Bingbot. Linha Sitemap com URL absoluta. Um deploy pode sobrescrever esse arquivo, por isso ele volta na lista mensal.' },
  { bloco: 'robos', id: 'sitemap', label: 'sitemap.xml com uma URL por rota e lastmod',
    fator: 'o estudo classifica como mito de ranqueamento, mas serve para indexação',
    desc: 'lastmod com a data real da última alteração. Data falsa em lastmod queima a confiança no arquivo inteiro.' },
  { bloco: 'robos', id: 'gsc', label: 'Search Console verificado e sitemap enviado',
    desc: 'É a única fonte de verdade sobre o que o Google realmente indexou. Sem isso o trabalho é feito às cegas.' },
  { bloco: 'robos', id: 'sem_bloqueio', label: 'Nenhuma página útil bloqueada por noindex',
    desc: 'noindex esquecido do ambiente de teste é o erro mais comum depois de uma publicação.' },

  /* ---------- quais páginas o site tem ----------
     Este bloco inteiro não existia. São cinco dos vinte primeiros fatores
     do orgânico local, e o primeiro de todos estava fora da lista. */
  { bloco: 'arquitetura', id: 'pagina_por_servico', label: 'Uma página dedicada para cada serviço', critico: true,
    fator: 'nº 1 do orgânico local · nº 2 da busca com IA · nº 24 do mapa',
    desc: 'Uma página que fala de tudo não ganha de uma que fala só daquilo. Liste os serviços que o cliente realmente vende e confira se cada um tem endereço próprio: /clareamento-dental-uba, não uma seção dentro de /servicos. É o fator mais forte da lista inteira e o que mais demora, então começa por ele.' },
  { bloco: 'arquitetura', id: 'conteudo_servico', label: 'Conteúdo de verdade em cada página de serviço',
    fator: 'nº 17 do orgânico local · nº 14 da busca com IA',
    desc: 'Pelo menos 400 palavras respondendo o que a pessoa quer saber antes de marcar: o que é, quando é indicado, como é feito, quanto tempo leva, o que esperar depois. É desse texto que a IA tira resposta para citar. Página de serviço com três parágrafos genéricos não é citada por ninguém.' },
  { bloco: 'arquitetura', id: 'links_internos', label: 'Cada página alcançável por link de outra',
    fator: 'nº 6 do orgânico local',
    desc: 'Página que só existe no sitemap é página órfã. A de serviço tem que ser linkada da home e das irmãs, e tem que linkar de volta. É por aí que o Google entende que o site tem profundidade no assunto, e não uma página solta.' },
  { bloco: 'arquitetura', id: 'ancora_descritiva', label: 'Texto do link interno diz para onde vai',
    fator: 'nº 19 do orgânico local',
    desc: '"Saiba mais" e "clique aqui" não carregam palavra-chave nenhuma. Troque por "clareamento dental em Ubá". O texto do link é o que diz ao buscador do que trata a página de destino.' },
  { bloco: 'arquitetura', id: 'nicho', label: 'Site focado num assunto só',
    fator: 'nº 9 do orgânico local · nº 9 da busca com IA',
    desc: 'Site de dentista que também fala de estética, nutrição e coaching dilui os três. Se o cliente faz coisas distintas demais, decida qual o site defende e tire o resto, ou separe em domínios.' },

  /* ---------- fundação técnica ---------- */
  { bloco: 'tecnica', id: 'https', label: 'HTTPS forçado por redirect 301',
    fator: 'nº 18 do orgânico local',
    desc: 'Uma única versão do endereço. Com e sem www, com e sem barra final, tudo convergindo para um só.' },
  { bloco: 'tecnica', id: 'canonical', label: 'Canonical absoluto e autorreferente em cada rota',
    desc: 'Cada página aponta para si mesma com URL completa. Canonical copiado da home em todas as rotas desindexa o site inteiro.' },
  { bloco: 'tecnica', id: 'og', label: 'Open Graph completo',
    desc: 'og:title, og:description, og:url e og:image de 1200x630. É o que aparece quando alguém manda o link no WhatsApp.' },
  { bloco: 'tecnica', id: 'twitter', label: 'Twitter Card configurado',
    desc: 'summary_large_image. Pouco tráfego, mas alguns agregadores leem essa tag em vez da Open Graph.' },
  { bloco: 'tecnica', id: 'lang', label: 'lang="pt-BR" no html',
    desc: 'Diz ao buscador e ao assistente em que idioma e país a página deve ser considerada.' },
  { bloco: 'tecnica', id: 'celular', label: 'Site funcionando bem no celular',
    fator: 'nº 16 do orgânico local · nº 4 em conversão',
    desc: 'Meta viewport presente, texto legível sem dar zoom, botão de WhatsApp alcançável com o polegar. Não é a nota do PageSpeed, que é outra coisa: é a página caber e funcionar na tela pequena, que é onde a busca local acontece.' },
  { bloco: 'tecnica', id: 'cache', label: 'Cache separado: estático sim, HTML não',
    desc: 'Imagem, CSS e JS com cache longo. HTML sem cache, senão a correção de hoje aparece semana que vem.' },
  { bloco: 'tecnica', id: 'nap_site', label: 'NAP do site idêntico ao do perfil do Google',
    fator: 'nº 15 do mapa · nº 10 entre os negativos (site sem NAP legível)',
    desc: 'Nome, endereço e telefone em texto, nunca em imagem, no rodapé de todas as páginas. E iguais aos do perfil do Google caractere por caractere: "Av." e "Avenida" são endereços diferentes para o robô. Divergir é fator negativo e conta também em risco de suspensão.' },

  /* ---------- estrutura da página ---------- */
  { bloco: 'estrutura', id: 'title', label: 'Title com o essencial nos primeiros 60 caracteres',
    fator: 'nº 17 do mapa · nº 4 do orgânico. O TAMANHO do title é mito: o que pesa é a palavra-chave estar nele',
    desc: 'Padrão: palavra-chave + cidade, diferencial, empresa. Pode passar de 60, mas o que importa precisa caber antes do corte.' },
  { bloco: 'estrutura', id: 'description', label: 'Description com o essencial nos primeiros 150 caracteres',
    fator: 'palavra-chave na description é mito de ranqueamento; o que ela decide é o clique',
    desc: 'Palavra-chave, empresa, diferencial e chamada para ação. Mesma lógica do title: o corte existe, escreva para ele.' },
  { bloco: 'estrutura', id: 'h1', label: 'Um único H1, hierarquia sem pular nível',
    fator: 'nº 20 do mapa · nº 8 do orgânico',
    desc: 'H1 depois H2 depois H3. Pular de H1 para H3 confunde quem lê a página por estrutura, e é assim que a IA lê.' },
  { bloco: 'estrutura', id: 'resposta_direta', label: 'Resposta direta nos primeiros 60 caracteres de cada seção',
    desc: 'O trecho citado pela IA quase sempre é a primeira frase do bloco. Afirme antes de contextualizar.' },
  { bloco: 'estrutura', id: 'titulos_descritivos', label: 'Títulos descritivos, não criativos',
    desc: '"Quanto custa um implante dentário" é citável. "Invista no seu sorriso" não responde pergunta nenhuma.' },
  { bloco: 'estrutura', id: 'fato_concreto', label: 'Um fato concreto a cada 150 a 200 palavras',
    desc: 'Número, prazo, material, procedimento. Texto só com adjetivo não é citado porque não afirma nada verificável.' },
  { bloco: 'estrutura', id: 'faq', label: 'FAQ com 5 a 10 perguntas reais',
    fator: 'nº 10 da busca com IA (texto que se lê em diagonal)',
    desc: 'Perguntas que os clientes fazem de verdade, respostas de 2 a 4 linhas. Pergunta inventada enche a página e não traz busca.' },
  { bloco: 'estrutura', id: 'cidade_conteudo', label: 'Cidade e bairro dentro do texto, não só no rodapé',
    fator: 'nº 2 do orgânico local · nº 18 do mapa · nº 6 da busca com IA',
    desc: 'A cidade tem que estar no title, no H1 e no corpo, escrita como o cliente escreveria. Endereço no rodapé não conta: aquilo é dado de contato, não é conteúdo sobre o lugar. Cite bairro, referências da cidade e de onde vêm os pacientes.' },
  { bloco: 'estrutura', id: 'alt', label: 'alt descritivo em todas as imagens',
    desc: 'Descreva o que está na imagem. Para o robô, imagem sem alt simplesmente não existe.' },
  { bloco: 'estrutura', id: 'sem_invencao', label: 'Nenhum dado inventado na página', critico: true,
    desc: 'Telefone, horário, endereço, avaliação, depoimento e número só entram se forem reais. Campo que falta vira placeholder visível, tipo [TELEFONE], listado para preencher antes de publicar.' },

  /* ---------- dados estruturados ---------- */
  { bloco: 'schema', id: 'schema_tipo', label: '@type específico, não LocalBusiness genérico',
    desc: 'Dentist, HairSalon, LegalService, Restaurant. Quanto mais específico, melhor o buscador entende o negócio.' },
  { bloco: 'schema', id: 'schema_contexto', label: '@context em https://schema.org',
    desc: 'Com https. A versão em http ainda circula em tutorial antigo e invalida o bloco.' },
  { bloco: 'schema', id: 'schema_faq', label: 'FAQPage no schema',
    desc: 'Perdeu o rich result no Google, mas continua sendo um dos formatos que o ChatGPT cita com mais frequência.' },
  { bloco: 'schema', id: 'schema_depreciado', label: 'Sem HowTo e sem SpecialAnnouncement',
    desc: 'Os dois foram descontinuados. Se estiverem no código, remova.' },
  { bloco: 'schema', id: 'schema_validado', label: 'Schema validado no Rich Results Test',
    desc: 'search.google.com/test/rich-results. Erro de sintaxe derruba o bloco inteiro em silêncio.' },

  /* ---------- autoridade ---------- */
  { bloco: 'autoridade', id: 'autor', label: 'Autor identificado com bio',
    desc: 'Nome, formação e experiência. Conteúdo sem autor não passa no filtro de E-E-A-T.' },
  { bloco: 'autoridade', id: 'data_visivel', label: 'Data de atualização visível na página',
    desc: 'Visível para o leitor e também no dateModified do schema. As duas precisam bater.' },
  { bloco: 'autoridade', id: 'fontes', label: 'Fontes citadas com link',
    fator: 'linkar para sites de autoridade é o nº 177 de 187; mantenha pela credibilidade com a IA, não pelo ranqueamento',
    desc: 'Órgão oficial, conselho de classe, estudo. Link para fonte externa confiável aumenta a chance de citação.' },
  { bloco: 'autoridade', id: 'contato_real', label: 'Contato, endereço e CNPJ acessíveis',
    desc: 'Empresa que não diz quem é não é tratada como fonte confiável.' },
  { bloco: 'autoridade', id: 'listas_melhores', label: 'Presença nas listas de "melhores" da cidade', critico: true,
    fator: 'nº 1 da busca com IA',
    desc: 'É o fator nº 1 de citação por IA, à frente de TUDO que se faça no próprio site. Busque o termo principal do cliente e veja quais resultados da primeira página são lista ou diretório (Doctoralia, catálogos locais, "os 10 melhores de..."). Confira se o cliente está em cada um e cadastre onde não estiver. O plano por termo, na aba do cliente, já nomeia quais são.' },
  { bloco: 'autoridade', id: 'citacao_imprensa', label: 'Citação em jornal, blog ou associação do setor',
    fator: 'nº 3 e nº 4 da busca com IA',
    desc: 'Menção em site de notícia, blog do setor, site de associação ou de prefeitura. Não precisa ser link: menção sem link ao nome da marca é o nº 12 da busca com IA. Três dos cinco primeiros fatores de citação por IA são desse tipo, nenhum deles mora no site do cliente.' },

  /* ---------- mensal ---------- */
  { bloco: 'mensal', id: 'gsc_queda', label: 'Search Console: páginas que perderam clique',
    desc: 'Compare os últimos 28 dias com o período anterior. Queda de clique com impressão estável é problema de title e description.' },
  { bloco: 'mensal', id: 'gsc_cobertura', label: 'Search Console: erros de indexação novos',
    desc: 'Página nova que não entrou, página antiga que saiu. Descobrir no mês é diferente de descobrir no trimestre.' },
  { bloco: 'mensal', id: 'robots_ok', label: 'robots.txt e sitemap ainda no ar e corretos',
    desc: 'Abra as duas URLs. Publicação de site sobrescreve esses arquivos com frequência.' },
  { bloco: 'mensal', id: 'velocidade', label: 'PageSpeed no celular',
    desc: 'Teste pela versão mobile. Imagem pesada publicada no mês é a causa mais comum de queda repentina.' },
  { bloco: 'mensal', id: 'links_quebrados', label: 'Links quebrados e páginas 404',
    desc: 'Inclusive link interno antigo apontando para página que foi renomeada.' },
  { bloco: 'mensal', id: 'formulario', label: 'Formulário e WhatsApp testados de verdade',
    desc: 'Envie uma mensagem e confirme que ela chegou. Formulário mudo é prejuízo direto, não questão de SEO.' },
  /* Era "Conteúdo novo ou atualização publicada no mês", sem lugar definido
     para fazer. Virou o artigo do mês quando a fila de artigos passou a
     existir no app de avaliações, em 23/11/2026. Não foi criada uma tarefa
     nova ao lado: duas tarefas pedindo a mesma coisa é o erro que a rotina
     do GMB já cometeu uma vez com 'claude_analise' e 'concorrentes'.

     A alternativa antiga continua valendo e está escrita na descrição: num
     mês em que revisar um texto existente rende mais do que publicar um
     artigo novo, a tarefa se cumpre assim. */
  { bloco: 'mensal', id: 'conteudo_novo', label: 'Artigo do mês escrito, revisado e aprovado',
    desc: 'Escrever, ler e aprovar no app de avaliações. Nenhum artigo vai ao ar sem alguém ler: texto de máquina publicado sem revisão é o que a política de spam do Google chama de conteúdo em escala, e a penalidade cai no site do cliente. Num mês em que revisar um texto existente rende mais, vale como alternativa, com dateModified real.',
    artigos: true },
  { bloco: 'mensal', id: 'busca_marca', label: 'Buscar o nome da empresa no Google',
    desc: 'Veja o que aparece junto: perfil antigo, concorrente, reclamação. A primeira página do nome é a vitrine.' },

  /* ---------- citação nas IAs ---------- */
  { bloco: 'citacao', id: 'ia_google', label: 'Modo IA e AI Overview do Google',
    desc: 'Faça a pergunta principal do cliente e veja se o site é citado ou se aparece a fonte do concorrente.' },
  { bloco: 'citacao', id: 'ia_chatgpt', label: 'ChatGPT com busca ativada',
    desc: 'Pergunte pelo serviço na cidade. Se citar o concorrente, abra a página dele e compare a estrutura com a sua.' },
  { bloco: 'citacao', id: 'ia_perplexity', label: 'Perplexity',
    desc: 'É o mais sensível a conteúdo recente. Serve de termômetro para saber se a atualização surtiu efeito.' },
  { bloco: 'citacao', id: 'ia_registro', label: 'Resultado anotado para comparar no mês seguinte',
    desc: 'Sem registro não existe evolução, só impressão. Guarde a pergunta usada, a data e quem foi citado.' },

  /* ---------- trimestral ---------- */
  { bloco: 'analise', id: 'keyword', label: 'Palavra-chave revalidada no Ubersuggest',
    desc: 'Volume e dificuldade mudam. A palavra que fazia sentido na entrada do cliente pode não ser mais a melhor aposta.' },
  { bloco: 'analise', id: 'secundarias', label: 'Palavras secundárias e LSI revisadas',
    desc: 'De 8 a 12 termos reais, tirados de ferramenta, não de intuição.' },
  { bloco: 'analise', id: 'concorrente', label: 'Quem passou na frente e por quê',
    desc: 'Abra as três primeiras posições. O que elas têm que o site do cliente não tem.' },
  { bloco: 'analise', id: 'backlinks', label: 'Backlinks ganhos e perdidos',
    fator: 'nº 3 do orgânico local (qualidade dos links que apontam para o domínio)',
    desc: 'Link perdido explica queda sem causa aparente. Link novo mostra qual conteúdo está sendo encontrado.' },
  { bloco: 'analise', id: 'html_bot', label: 'Reler o HTML servido como um robô leria',
    desc: 'Repita a conferência do primeiro bloco. Troca de template ou de plugin volta a esconder o conteúdo sem avisar.' },
  { bloco: 'analise', id: 'nota_geo', label: 'Nota GEO do trimestre (0 a 30)',
    desc: 'Pontue resposta direta, títulos descritivos, fatos concretos, FAQ, autoria, data visível e fontes. Comparar nota é mais honesto que comparar impressão.' },

  /* ---------- frescor ---------- */
  { bloco: 'frescor', id: 'conteudo_antigo', label: 'Páginas sem revisão há mais de 12 meses',
    desc: 'Liste e priorize as que ainda recebem tráfego. Atualizar conteúdo que já ranqueia rende mais que publicar texto novo.' },
  { bloco: 'frescor', id: 'faq_real', label: 'FAQ atualizada com as perguntas reais do trimestre',
    desc: 'Puxe do WhatsApp e do atendimento. Pergunta que o cliente fez três vezes vira item da FAQ.' },
  { bloco: 'frescor', id: 'dados_desatualizados', label: 'Preço, prazo, horário e equipe conferidos',
    desc: 'Informação errada no site é pior que informação ausente, porque a IA repete com segurança.' },
  { bloco: 'frescor', id: 'datemodified', label: 'dateModified atualizado só onde houve mudança real',
    desc: 'Mexer na data sem mexer no conteúdo é truque conhecido e já é descontado.' },
];

let siteCliente = null;
let buscaSite = '';

/* ---------- estado ---------- */

function siteMesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-M${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

function siteTrimestreAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-T${Math.floor(hoje.getMonth() / 3) + 1}`;
}

function siteChave(clienteId, ciclo) {
  if (ciclo === 'mensal') return `site_${clienteId}_${siteMesAtual()}`;
  if (ciclo === 'trimestral') return `site_${clienteId}_${siteTrimestreAtual()}`;
  return `site_${clienteId}`;
}

function siteLer(clienteId, ciclo) {
  return Checklist.ler(siteChave(clienteId, ciclo));
}

function siteGravar(clienteId, ciclo, estado) {
  estado.atualizado_em = new Date().toISOString();
  Checklist.gravar(siteChave(clienteId, ciclo), estado);
}

function siteItensDoCiclo(ciclo) {
  const blocos = SITE_BLOCOS.filter(b => b.ciclo === ciclo).map(b => b.id);
  return SITE_ITENS.filter(i => blocos.includes(i.bloco));
}

function siteProgresso(clienteId, ciclo) {
  const estado = siteLer(clienteId, ciclo);
  const itens = siteItensDoCiclo(ciclo);
  return { feitas: itens.filter(i => estado[i.id] === true).length, total: itens.length };
}

/* ---------- lista ---------- */

function renderizarListaClientesSite() {
  const lista = $('listaClientesSite');
  if (!lista) return;

  lista.innerHTML = '';

  if (!clientes || clientes.length === 0) {
    lista.innerHTML = '<div class="cliente-item">Nenhum cliente cadastrado</div>';
    return;
  }

  /* Só quem contratou site. Definido na aba Workflow. */
  const contratantes = Servicos.comServico('site');

  if (siteCliente && !contratantes.some(c => c.id === siteCliente.id)) {
    siteCliente = null;
    renderizarSite();
  }

  if (contratantes.length === 0) {
    lista.innerHTML = '<div class="cliente-item lista-vazia">Nenhum cliente com site contratado. Marque o serviço na aba Workflow.</div>';
    atualizarContagem('contagemSite', 0);
    return;
  }

  const termo = semAcentos(buscaSite.trim());
  const filtrados = contratantes
    .slice()
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
    .filter(c => !termo
      || semAcentos(c.nome).includes(termo)
      || semAcentos(c.email).includes(termo));

  atualizarContagem('contagemSite', filtrados.length);

  if (filtrados.length === 0) {
    lista.innerHTML = '<div class="cliente-item lista-vazia">Nenhum cliente encontrado</div>';
    return;
  }

  filtrados.forEach(cliente => {
    const div = document.createElement('div');
    div.className = 'cliente-item';
    div.dataset.clienteId = cliente.id;
    if (siteCliente && siteCliente.id === cliente.id) div.classList.add('ativo');

    const fundacao = siteProgresso(cliente.id, 'fundacao');
    const mensal = siteProgresso(cliente.id, 'mensal');
    const trimestral = siteProgresso(cliente.id, 'trimestral');
    const completo = fundacao.feitas === fundacao.total ? ' completo' : '';

    div.innerHTML = `
      <div class="cliente-item-conteudo">
        <div class="cliente-item-nome">${escapar(cliente.nome)}</div>
        <div class="cliente-item-progresso">
          <span class="barra-progresso"><i style="width:${Math.round((fundacao.feitas / fundacao.total) * 100)}%"></i></span>
          <span class="progresso-texto${completo}">${fundacao.feitas}/${fundacao.total} base</span>
        </div>
        <div class="ciclos-resumo">
          <span class="ciclo-mini${mensal.feitas === mensal.total ? ' completo' : ''}">mês ${mensal.feitas}/${mensal.total}</span>
          <span class="ciclo-mini${trimestral.feitas === trimestral.total ? ' completo' : ''}">trim ${trimestral.feitas}/${trimestral.total}</span>
        </div>
      </div>
    `;
    lista.appendChild(div);
  });
}

/* ---------- painel ---------- */

function renderizarSite() {
  const info = $('siteClienteSelecionado');
  const container = $('siteConteudo');
  if (!container) return;

  if (!siteCliente) {
    if (info) info.innerHTML = '<div class="cliente-info-empty">Selecione um cliente para ver a rotina do site</div>';
    container.innerHTML = '';
    return;
  }

  if (info) info.innerHTML = `<h2 class="cliente-info-nome">${escapar(siteCliente.nome)}</h2>`;

  /* A verificação automática é buscada ao abrir o cliente, não ao abrir a
     aba: buscar os 30 de uma vez faria 30 consultas para mostrar uma. */
  if (typeof Auditoria === 'object') Auditoria.carregar(siteCliente.id);

  const estados = {
    fundacao: siteLer(siteCliente.id, 'fundacao'),
    mensal: siteLer(siteCliente.id, 'mensal'),
    trimestral: siteLer(siteCliente.id, 'trimestral'),
  };

  container.innerHTML = '';

  if (typeof montarBarraAuditoria === 'function') {
    container.appendChild(montarBarraAuditoria(siteCliente.id));
  }

  const periodo = {
    fundacao: 'Uma vez só. Refazer apenas se o site for reconstruído.',
    mensal: `Mês atual: ${siteMesAtual().replace('-M', ' · ')}.`,
    trimestral: `Trimestre atual: ${siteTrimestreAtual().replace('-T', ' · T')}.`,
  };

  let cicloAnterior = null;

  SITE_BLOCOS.forEach(blocoDef => {
    const itens = SITE_ITENS.filter(i => i.bloco === blocoDef.id);
    if (itens.length === 0) return;

    if (blocoDef.ciclo !== cicloAnterior) {
      cicloAnterior = blocoDef.ciclo;
      const separador = document.createElement('p');
      separador.className = 'site-ciclo-aviso';
      separador.textContent = periodo[blocoDef.ciclo];
      container.appendChild(separador);
    }

    const estado = estados[blocoDef.ciclo];
    const feitas = itens.filter(i => estado[i.id] === true).length;

    const bloco = document.createElement('div');
    bloco.className = 'gmb-bloco' + (feitas === itens.length ? ' fase-completa' : '');
    bloco.innerHTML = `
      <div class="gmb-bloco-cabecalho">
        <h3>${escapar(blocoDef.titulo)}</h3>
        <span class="gmb-contador${feitas === itens.length ? ' completo' : ''}">${feitas}/${itens.length}</span>
      </div>
      <p class="bloco-nota">${escapar(blocoDef.nota)}</p>
    `;

    itens.forEach(item => {
      bloco.appendChild(montarItemSite(item, estado[item.id] === true, blocoDef.ciclo));
    });

    container.appendChild(bloco);
  });
}

function montarItemSite(item, marcado, ciclo) {
  const div = document.createElement('div');
  div.className = 'item-check';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = `site_${item.id}`;
  input.checked = marcado;
  input.addEventListener('change', e => marcarSite(item.id, e.target.checked, ciclo));

  const label = document.createElement('label');
  label.htmlFor = input.id;

  const titulo = document.createElement('span');
  titulo.className = 'item-titulo';
  titulo.textContent = item.label;
  label.appendChild(titulo);

  if (item.critico) {
    const tag = document.createElement('span');
    tag.className = 'item-critico';
    tag.textContent = 'crítico';
    label.appendChild(tag);
  }

  /* A posição do fator, antes da descrição. Fica aqui porque é o que
     decide a ORDEM do trabalho: com 61 itens, "o nº 1 do orgânico local"
     e "o estudo classifica como mito" são a diferença entre começar pelo
     que move e começar pelo que está mais à mão. Vem do estudo da
     Whitespark 2026, não de opinião nossa. */
  if (item.fator) {
    const f = document.createElement('div');
    f.className = 'item-fator';
    f.textContent = item.fator;
    label.appendChild(f);
  }

  if (item.desc) {
    const d = document.createElement('div');
    d.className = 'descricao';
    d.textContent = item.desc;
    label.appendChild(d);
  }

  /* O que o robô mediu, embaixo da descrição. Fica dentro do label de
     propósito: clicar nele marca o item, que é o gesto natural de quem
     acabou de ler a prova e concordou. O carimbo não marca nada sozinho. */
  if (siteCliente && typeof montarVeredito === 'function') {
    const v = montarVeredito(Auditoria.itemDe(siteCliente.id, item.id));
    if (v) label.appendChild(v);
  }


  div.appendChild(input);
  div.appendChild(label);

  /* O botão fica FORA do label, ao contrário do veredito, e depois dele.
     Dentro do label, clicar para abrir os artigos marcaria a tarefa como
     feita no mesmo gesto, e a tarefa só está feita depois de o artigo ser
     aprovado, não quando a tela abre. */
  if (item.artigos && siteCliente && typeof linkArtigosSite === 'function') {
    div.appendChild(linkArtigosSite(siteCliente.id));
  }

  return div;
}

function marcarSite(itemId, marcado, ciclo) {
  if (!siteCliente) return;
  const estado = siteLer(siteCliente.id, ciclo);
  estado[itemId] = marcado;
  siteGravar(siteCliente.id, ciclo, estado);
  renderizarSite();
  renderizarListaClientesSite();
  $(`site_${itemId}`)?.focus();
}

let siteListaLigada = false;

function ligarListaSite() {
  const lista = $('listaClientesSite');
  if (!lista || siteListaLigada) return;
  siteListaLigada = true;

  lista.addEventListener('click', e => {
    const item = e.target.closest('.cliente-item');
    if (!item) return;
    const cliente = clientes.find(c => c.id === item.dataset.clienteId);
    if (!cliente) return;
    siteCliente = cliente;
    renderizarListaClientesSite();
    renderizarSite();
  });

  $('buscaClientesSite')?.addEventListener('input', e => {
    buscaSite = e.target.value;
    renderizarListaClientesSite();
  });
}

function iniciarSite() {
  ligarListaSite();
  renderizarListaClientesSite();
  renderizarSite();
}

console.log('✓ site-rotina.js carregado');
