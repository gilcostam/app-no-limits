/* Montagem do PDF via pdfmake, reproduzindo o layout dos contratos
   originais gerados em ReportLab: A4, margens 20mm, texto justificado,
   filete vermelho no cabeçalho e rodapé com plano e número da página. */

const MM = 2.834645669;
const LARGURA_UTIL = 595.28 - 2 * 20 * MM; // A4 menos margens laterais
const VERMELHO = '#BE1E2D';
const PRETO = '#1A1A1A';
const CINZA = '#6E6E6E';

const LETRAS = 'abcdefghijklmnopqrstuvwxyz';
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/* Converte as marcações <b> do texto das cláusulas em rich text do pdfmake. */
function rich(texto) {
  if (!texto) return '';
  const t = texto.replace(/&nbsp;/g, ' ');
  const partes = [];
  const re = /<b>([\s\S]*?)<\/b>/g;
  let ultimo = 0;
  let m;
  while ((m = re.exec(t)) !== null) {
    if (m.index > ultimo) partes.push({ text: t.slice(ultimo, m.index) });
    partes.push({ text: m[1], bold: true });
    ultimo = re.lastIndex;
  }
  if (ultimo < t.length) partes.push({ text: t.slice(ultimo) });
  return partes.length ? partes : t;
}

function linha(largura, espessura, cor, deslocamento) {
  return {
    canvas: [{
      type: 'line',
      x1: deslocamento || 0, y1: 0,
      x2: (deslocamento || 0) + largura, y2: 0,
      lineWidth: espessura,
      lineColor: cor,
    }],
  };
}

function construirDocDefinition(contrato) {
  const content = [];
  let letra = 0;

  contrato.blocos.forEach(b => {
    switch (b.t) {
      case 'cabecalho':
        content.push({ text: CONTRATADA.razao, style: 'company' });
        content.push({
          text: `CNPJ ${CONTRATADA.cnpj}  |  ${CONTRATADA.telefone}  |  ${CONTRATADA.site}`,
          style: 'companysub',
        });
        content.push({ ...linha(LARGURA_UTIL, 1.1, VERMELHO), margin: [0, 0, 0, 10] });
        content.push({ text: contrato.titulo, style: 'centerTitle' });
        content.push({ text: b.rotulo, style: 'centerSub' });
        if (b.subtitulo) content.push({ text: b.subtitulo, style: 'centerSub2' });
        break;

      case 'h1':
        letra = 0;
        content.push({ text: b.x, style: 'h1' });
        break;

      case 'section':
        content.push({ text: b.x, style: 'section' });
        break;

      case 'body':
        content.push({ text: rich(b.x), style: 'body' });
        break;

      case 'items':
        b.x.forEach(txt => {
          content.push({
            columns: [
              { width: 13, text: `${LETRAS[letra]})`, bold: true, style: 'itemText' },
              { width: '*', text: rich(txt), style: 'itemText' },
            ],
            columnGap: 0,
            margin: [0, 0, 0, 6],
          });
          letra++;
        });
        break;

      case 'subitems':
        b.x.forEach((txt, i) => {
          content.push({
            columns: [
              { width: 18, text: `${ROMANOS[i]}.`, bold: true, style: 'subitemText' },
              { width: '*', text: rich(txt), style: 'subitemText' },
            ],
            columnGap: 0,
            margin: [13, 0, 0, 5],
          });
        });
        break;

      case 'spacer':
        content.push({ text: '', margin: [0, 0, 0, 6 * MM] });
        break;

      case 'data':
        content.push({ text: b.x, style: 'data' });
        break;

      case 'assinaturas': {
        const largura = LARGURA_UTIL * 0.7;
        const desloc = (LARGURA_UTIL - largura) / 2;
        content.push({ text: '', pageBreak: 'before', margin: [0, 0, 0, 40 * MM] });
        content.push({ ...linha(largura, 0.8, PRETO, desloc), margin: [0, 0, 0, 4] });
        content.push({ text: 'CONTRATANTE', style: 'sigRole' });
        content.push({ text: b.nome, style: 'sigName' });
        content.push({ text: b.doc, style: 'sigDoc' });
        content.push({ text: '', margin: [0, 0, 0, 30 * MM] });
        content.push({ ...linha(largura, 0.8, PRETO, desloc), margin: [0, 0, 0, 4] });
        content.push({ text: CONTRATADA.razao, style: 'sigRole' });
        content.push({ text: `CNPJ ${CONTRATADA.cnpj}`, style: 'sigDoc' });
        content.push({ text: 'TESTEMUNHAS', style: 'witnessH' });
        content.push({ text: '1. Nome: _________________________________________  CPF: ______________________', style: 'witnessLine' });
        content.push({ text: '2. Nome: _________________________________________  CPF: ______________________', style: 'witnessLine' });
        break;
      }
    }
  });

  return {
    pageSize: 'A4',
    pageMargins: [20 * MM, 16 * MM, 20 * MM, 22 * MM],
    info: {
      title: `${contrato.titulo} - ${contrato.nomeCliente || ''}`.trim(),
      author: CONTRATADA.razao,
    },
    defaultStyle: { font: 'Helvetica', fontSize: 9.7, color: PRETO },
    footer: (paginaAtual) => ({
      margin: [20 * MM, 0, 20 * MM, 0],
      stack: [
        linha(LARGURA_UTIL, 0.5, '#DCDCDC'),
        {
          text: `${CONTRATADA.razao}  |  ${contrato.rodape}  |  Página ${paginaAtual}`,
          alignment: 'center',
          fontSize: 8,
          color: CINZA,
          margin: [0, 5, 0, 0],
        },
      ],
    }),
    content,
    styles: {
      company: { fontSize: 14.5, bold: true, color: VERMELHO, alignment: 'center', margin: [0, 0, 0, 2] },
      companysub: { fontSize: 9, color: CINZA, alignment: 'center', margin: [0, 0, 0, 10] },
      centerTitle: { fontSize: 12.5, bold: true, alignment: 'center', lineHeight: 1.2, margin: [0, 10, 0, 3] },
      centerSub: { fontSize: 10.5, bold: true, color: VERMELHO, alignment: 'center', margin: [0, 0, 0, 2] },
      centerSub2: { fontSize: 8.6, color: CINZA, alignment: 'center', margin: [0, 0, 0, 10] },
      h1: { fontSize: 11.3, bold: true, lineHeight: 1.24, margin: [0, 13, 0, 6] },
      section: { fontSize: 10, bold: true, margin: [0, 8, 0, 3] },
      body: { fontSize: 9.7, alignment: 'justify', lineHeight: 1.4, margin: [0, 0, 0, 7] },
      itemText: { fontSize: 9.7, alignment: 'justify', lineHeight: 1.4 },
      subitemText: { fontSize: 9.5, alignment: 'justify', lineHeight: 1.39 },
      data: { fontSize: 9.7, margin: [0, 16, 0, 0] },
      sigRole: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 4, 0, 2] },
      sigName: { fontSize: 9.3, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
      sigDoc: { fontSize: 9, color: CINZA, alignment: 'center' },
      witnessH: { fontSize: 9.7, bold: true, margin: [0, 18, 0, 8] },
      witnessLine: { fontSize: 9.5, margin: [0, 0, 0, 14] },
    },
  };
}

function nomeArquivo(d) {
  const limpo = (d.nome || 'Cliente')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '').trim().split(/\s+/).slice(0, 3).join('');
  if (d.modelo === 'hospedagem') return `Contrato_NoLimits_Hospedagem_Blog_${limpo}.pdf`;
  const partes = ['Contrato_NoLimits_SEO_GEO'];
  partes.push(d.planoBase === 'mensal' ? 'Mensal' : `${d.planoBase}Meses`);
  if (d.addonTrafego) partes.push('TrafegoPago');
  if (d.addonRedes) partes.push('RedesSociais');
  partes.push(limpo);
  return `${partes.join('_')}.pdf`;
}

function configurarFontes() {
  // Helvetica é uma das 14 fontes padrão do PDF: não precisa ser embarcada
  // e é metricamente equivalente à Arial usada nos contratos originais.
  pdfMake.fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  };
}

function gerarPdf(dados, acao) {
  configurarFontes();
  const contrato = montarContrato(dados);
  contrato.nomeCliente = dados.nome;
  const doc = pdfMake.createPdf(construirDocDefinition(contrato));
  if (acao === 'abrir') doc.open();
  else doc.download(nomeArquivo(dados));
}
