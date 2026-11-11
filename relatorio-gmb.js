/* ============================================================
   PONTE PARA O APP DE AVALIAÇÕES (nolimits-reviews)

   Os números de desempenho do Google não precisam ser anotados à mão.
   O app de avaliações já puxa, todo dia às 9h, as oito métricas diárias
   da Business Profile Performance API para os 30 perfis, e já monta o
   relatório mensal com comparação contra o mês anterior.

   Este arquivo existe só para ligar um app ao outro. Nada é copiado:
   a fonte dos números continua sendo um lugar só, o app de avaliações.
   Duplicar aqui significaria um segundo projeto no Google Cloud e os
   30 clientes reautorizando o acesso, para ter o mesmo número em dois
   bancos que logo discordariam entre si.

   O vínculo é manual porque os dois lados chamam o mesmo cliente de
   nomes diferentes: aqui vem a razão social do Asaas ("EVELLYN DOS
   SANTOS MARTINS ARQUITETURA LTDA"), lá vem o nome do perfil no Google
   ("MDE Arquitetura | Evellyn Martins Arquiteta"). Casar isso por texto
   erra: "Costa Martins Manipulação de Fórmulas" cola em "MDE Arquitetura"
   só porque as duas têm "Martins". Então o vínculo é escrito, conferido,
   e quem não tem vínculo aparece como não vinculado em vez de abrir o
   relatório do cliente errado.
   ============================================================ */

const RELATORIO_BASE = 'https://nolimits-reviews.vercel.app/dashboard/clients';

/* Cliente daqui (id do Asaas) -> perfil lá (id do BusinessProfile).
   Para vincular um cliente novo: abra o relatório dele no app de
   avaliações e copie o trecho de id que aparece na URL, entre
   /clients/ e /relatorio. */
const RELATORIO_PERFIS = {
  'cus_000131485807': 'cmrv1s6vk000104jm60a5pn9u', /* EVELLYN DOS SANTOS MARTINS ARQUITETURA LTDA -> MDE Arquitetura | Evellyn Martins Arquiteta */
  'cus_000146587594': 'cmrv1lu1d000104l7qq8ug807', /* Casa Nova Enxovais -> Casa Nova Enxovais e Cortinas */
  'cus_000137553074': 'cmrv1yzx4000304joqynk26vw', /* CASTILHO CORRETORA DE SEGUROS LTDA -> Genial Corretora de Seguros e Consórcios */
  'cus_000209225079': 'cmw3kair3000108l5khf50v35', /* Nivaldo Vanni Filho -> Dr Nivaldo Vanni */
  'cus_000192095492': 'cmsj8kiax000e04jllvhuakuu', /* Rafaella Angélica Purgato -> Psicóloga em Ubá - Rafaella Purgato */
  'cus_000189927718': 'cmsj0j0ls000104l1nzy46jx1', /* Michele Silva Xavier -> Advogada Previdenciária Dra. Michele Xavier */
  'cus_000183602073': 'cmrv0xjsg000104jogvsm3o56', /* PRISCILLA COUTINHO SOCIEDADE INDIVIDUAL -> Coutinho Advocacia */
  'cus_000182237268': 'cmq9i96pb000104gv18mmjn5v', /* Elton de Barros Meireles -> Urologista e Reprodução Humana | Dr. Elton Meireles */
  'cus_000180229889': 'cmuwse39k000104jpau1ix71g', /* Caroline Caputo Costa Fusaro -> Gastroenterologista Dra. Caroline Caputo */
  'cus_000177759427': 'cmsq3y50n000104l9ai3e3rff', /* Juliana de Paula Machado Henrique -> Cirurgia do Refluxo | Dra. Juliana Henrique */
  'cus_000176380451': 'cmuwxub32000104jjrivyhxk6', /* : MORETTO CASA LTDA -> Almofadas Moretto Casa */
  'cus_000174269373': 'cmql6jlfd000104iiw67pzw3h', /* Antônio Vito Marsiglia Júnior -> Dr. Antônio Vito Marsiglia Junior */
  'cus_000169022823': 'cmp13ylbp000104l15h7znlc0', /* Instituto Bello -> Instituto Bello */
  'cus_000167393772': 'cmnvwmxrr000104jrm896e67y', /* GP ODONTOLOGIA LTDA -> GP Odontologia */
  'cus_000165811995': 'cmrw64z6g000104l8hvyte0qu', /* L. H. BARBOUR FERNANDES -> Arquiteto Henrique Barbour */
  'cus_000152399312': 'cmnx3ct6d000104laxo61vw32', /* Ortoimplantes -> Ortoimplantes */
  'cus_000152397981': 'cmrv1deut000w04jxc1xetkz1', /* Adriana Dias Confeitaria -> Confeitaria Adriana Dias */
  'cus_000149870523': 'cmuwtnleo000104l2yv4n66jw', /* Aline Souza Duarte -> Aline Duarte Decorações De Casamentos */
  'lineu-biazotti': 'cmtbt0cgp000104jl8zscm889', /* Lineu Biazotti -> Lineu Biazotti - Cardiologista - Araraquara */
  'ivan-montenegro': 'cmuzs6n5g000106krf7s1dtna', /* Ivan Montenegro -> Dr. Ivan Montenegro - Ginecologista */
  'dentista-lidia-eugenio-figueiredo': 'cmsq36nvv000104lcqctjcuzk', /* Dentista Lidia Eugenio Figueiredo -> Dra. Lídia Eugênio Figueiredo */

  /* Daqui para baixo o vínculo não veio do nome, veio do e-mail: o mesmo
     endereço aparece no cadastro do Asaas e no acesso do cliente no app
     de avaliações. Por nome nenhum destes casaria, e dois casariam
     errado ("Robisson Ferreira" colaria em "Coutinho Advocacia"). */
  'cus_000136478933': 'cmrw5xrp3000104jxhqhujbgw', /* Lilian Leles -> LLM Clean (leleslilian344@gmail.com) */
  'cus_000207667937': 'cmw3kki5s000208jsdoc5bdv2', /* Clínica Face a Face -> Dr. Talvane Sobreira (talvane@talvanesobreira.com) */
  'cus_000206413590': 'cmw5ba86j000108jkzen5v4jf', /* Maria Estephania Jogaib de Onofre -> Clínica dos Olhos Maricá (estephaniaonofre@gmail.com) */
  'cus_000199661608': 'cmu2nrbpk000304kuj7lco52n', /* Larissa Camila dos Santos Gomes -> Clínica Odonto Premium (odontopremiumvalinhos@gmail.com) */
  'cus_000165812036': 'cmrt7nerp000104jr3hsczkwq', /* Robisson Ferreira Sociedade Individual de Advocacia -> Macedo Ferreira (advmacedoferreira@gmail.com) */
  'cus_000149359269': 'cmql66kp3000104jry6l696az', /* ATFP ODONTOLOGIA INTEGRADA LTDA -> Start Clínica Odontológica (startclinicaodonto@gmail.com) */

  /* Este saiu pelo CNPJ, que é prova e não semelhança. O rodapé de
     pharmoderm.com.br traz CNPJ 06.237.027/0001-89, o mesmo documento do
     cadastro deste cliente no Asaas. "Costa Martins Manipulação de
     Fórmulas Ltda" é a razão social e "Pharmoderm" é o nome da loja. */
  'cus_000173595516': 'cmn99kn2y000104jjc4fxrukf', /* Costa Martins Manipulacao De Formulas Ltda -> Pharmoderm (CNPJ 06237027000189) */

  /* Faltam dois, e aqui o dado não decide:

     'cus_000204435840': '', // Waldecir V Sachetin (sem e-mail nem endereço no Asaas)
     'cus_000148880427': '', // Lívia Paulinelli Guimarães Tamietto (liviapauli@gmail.com, Campinas SP)

     Sobrou um perfil só no app de avaliações: "Start Neuroinlcusiva |
     Capacitação para Neuroinclusão", cujo acesso é joana.costa.oliveira@
     gmail.com, no nome de "Fernanda Prates - Joana Costa". Nem o nome nem
     o e-mail batem com Waldecir ou com Lívia.

     Um perfil para dois clientes, então um dos dois não tem perfil no
     Google, e nada no cadastro diz qual. Chutar aqui abre o relatório de
     outra pessoa para o cliente, então os dois ficam sem link até alguém
     confirmar quem é a Start Neuroinclusiva.

     "No Limits Marketing Estratégico" também sobra no app de avaliações,
     mas esse é o perfil da própria agência e não tem cobrança no Asaas. */
};

/* O relatório abre no mês fechado mais recente por conta própria, que é
   o certo: o mês corrente ainda não terminou e mandar número de mês pela
   metade para o cliente só gera pergunta. Por isso o ?mes= só entra
   quando a pessoa está olhando um mês passado aqui na rotina, e aí ela
   quer aquele mês, não o default. */
function relatorioGmbUrl(clienteId, data) {
  const perfil = RELATORIO_PERFIS[clienteId];
  if (!perfil) return null;

  const base = `${RELATORIO_BASE}/${perfil}/relatorio`;
  const hoje = new Date();
  const mesmoMes = data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth();
  if (mesmoMes) return base;

  const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
  return `${base}?mes=${mes}`;
}

/* Cliente sem vínculo não ganha botão morto nem link para o relatório de
   outra pessoa: ganha o aviso, porque o problema é de cadastro e quem
   está olhando a tela é quem resolve. */
function linkRelatorioGmb(clienteId, data) {
  const url = relatorioGmbUrl(clienteId, data);

  if (!url) {
    const aviso = document.createElement('span');
    aviso.className = 'relatorio-sem-vinculo';
    aviso.textContent = 'Perfil não vinculado';
    aviso.title = 'Este cliente ainda não foi ligado a um perfil no app de avaliações. Veja a lista em relatorio-gmb.js.';
    return aviso;
  }

  const link = document.createElement('a');
  link.className = 'copiar-prompt relatorio-link';
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Abrir relatório';
  link.title = 'Abre o relatório mensal no app de avaliações, com os números já puxados da API do Google';
  return link;
}
