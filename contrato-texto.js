/* Biblioteca de blocos dos contratos No Limits.
   Cada cláusula é montada conforme o plano base e os add-ons escolhidos.
   As letras das alíneas e os numerais romanos dos subitens são atribuídos
   automaticamente na renderização, por isso não devem ser escritos no texto. */

const CONTRATADA = {
  razao: 'NO LIMITS MARKETING ESTRATÉGICO',
  cnpj: '42.368.924/0001-95',
  telefone: '(32) 93300-3783',
  site: 'nolimitsmkt.com.br',
  email: 'contato@nolimitsmkt.com.br',
  endereco: 'Av. Padre Arnaldo Jansen, nº 949, loja A, bairro Santa Luzia, CEP 36506-001, Ubá/MG',
  foro: 'Ubá/MG',
};

const PLANOS = {
  '3': { meses: 3, extenso: 'três', valor: 890, rotulo: 'Plano 3 (três) meses' },
  '6': { meses: 6, extenso: 'seis', valor: 790, rotulo: 'Plano 6 (seis) meses' },
  '12': { meses: 12, extenso: 'doze', valor: 590, rotulo: 'Plano 12 (doze) meses' },
  mensal: { meses: null, extenso: null, valor: 690, rotulo: 'Plano Mensal (Sem Fidelidade Contratual)' },
};

const ADDONS = {
  trafego: {
    valor: 600,
    nome: 'gestão de tráfego pago (Meta Ads)',
    nomeSimples: 'gestão de tráfego pago',
    nomeVigencia: 'tráfego pago (Meta Ads)',
    nomeCurto: 'Tráfego Pago',
    titulo: 'Gestão de tráfego pago (Meta Ads)',
    rotulo: 'Gestão de Tráfego Pago (Meta Ads)',
    frente: 'a gestão de tráfego pago na plataforma Meta Ads (Facebook e Instagram)',
    escopo:
      'Gestão de campanhas de tráfego pago na plataforma Meta Ads, compreendendo a ' +
      'estruturação de campanhas, conjuntos de anúncios e públicos, a criação dos textos ' +
      'e a direção criativa dos anúncios, a realização de testes de público e de criativo, ' +
      'a otimização contínua da verba entre campanhas, a configuração do rastreamento e da ' +
      'mensuração de conversões, e a entrega de relatório mensal de desempenho.',
    natureza: [
      'as campanhas de tráfego pago demandam período inicial de aprendizado da plataforma, ' +
        'estimado entre 30 (trinta) e 90 (noventa) dias, para otimização de públicos, ' +
        'criativos e mensagens;',
      'a CONTRATADA não garante volume determinado de contatos, agendamentos, pacientes ou ' +
        'faturamento decorrente das campanhas, tampouco custo fixo por resultado, ' +
        'comprometendo-se a empregar as melhores práticas de segmentação, criação e otimização;',
      'o volume de resultados obtidos depende diretamente do valor de verba de mídia definido ' +
        'pela CONTRATANTE, de responsabilidade exclusiva desta;',
      'alterações de política, rejeições de criativos, suspensões de conta ou bloqueios ' +
        'impostos pela Meta Platforms Inc. constituem fator externo ao controle da CONTRATADA, ' +
        "aplicando-se, no que couber, o disposto na alínea 'c' desta cláusula.",
    ],
    acessos: 'Gerenciador de Negócios (Business Manager) e conta de anúncios do Meta Ads',
    titularidade: 'a conta de anúncios do Meta Ads',
  },
  redes: {
    valor: 890,
    nome: 'gestão de redes sociais',
    nomeSimples: 'gestão de redes sociais',
    nomeVigencia: 'gestão de redes sociais',
    nomeCurto: 'Redes Sociais',
    titulo: 'Gestão de redes sociais',
    rotulo: 'Gestão de Redes Sociais',
    frente: 'a gestão de redes sociais (Instagram e Facebook)',
    escopo:
      'Gestão de redes sociais, compreendendo o planejamento do calendário editorial mensal, ' +
      'a criação e a produção de conteúdo (artes, vídeos curtos e legendas) para Instagram e ' +
      'Facebook, a publicação e o agendamento das postagens e dos stories, a interação básica ' +
      'com comentários e mensagens diretas recebidas nos perfis, e a entrega de relatório ' +
      'mensal de desempenho, com indicadores de alcance, engajamento e crescimento de seguidores.',
    natureza: [
      'o crescimento de seguidores, o alcance e o engajamento são graduais e dependem da ' +
        'constância de publicação, da qualidade dos materiais fornecidos pela CONTRATANTE e do ' +
        'comportamento do público, não sendo possível garantir número fixo de seguidores, ' +
        'curtidas, comentários ou compartilhamentos;',
      'alterações de algoritmo, de política de distribuição de conteúdo ou de layout promovidas ' +
        'pelo Instagram, pelo Facebook ou por qualquer outra plataforma constituem fator externo ' +
        "ao controle da CONTRATADA, aplicando-se, no que couber, o disposto na alínea 'c' desta " +
        'cláusula;',
      'o cumprimento do calendário editorial depende do fornecimento tempestivo, pela ' +
        'CONTRATANTE, de fotos, vídeos, informações e aprovações de conteúdo, nos termos da ' +
        'Cláusula Sexta;',
      'eventual impulsionamento pago de publicações (tráfego pago), quando não previsto na ' +
        'proposta comercial aceita, não integra o escopo deste contrato e será objeto de ' +
        'orçamento e contratação à parte.',
    ],
    acessos: 'Gerenciador de Negócios (Meta Business Suite)',
    titularidade: 'os perfis de redes sociais',
  },
};

/* ---------- helpers de texto ---------- */

const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
  'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function trioExtenso(n) {
  if (n === 100) return 'cem';
  const partes = [];
  const c = Math.floor(n / 100);
  const resto = n % 100;
  if (c) partes.push(CENTENAS[c]);
  if (resto < 20) {
    if (resto) partes.push(UNIDADES[resto]);
  } else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    partes.push(u ? DEZENAS[d] + ' e ' + UNIDADES[u] : DEZENAS[d]);
  }
  return partes.join(' e ');
}

function numeroExtenso(n) {
  if (n === 0) return 'zero';
  const milhares = Math.floor(n / 1000);
  const resto = n % 1000;
  const partes = [];
  if (milhares === 1) partes.push('mil');
  else if (milhares > 1) partes.push(trioExtenso(milhares) + ' mil');
  if (resto) partes.push(trioExtenso(resto));
  // "mil, cento e noventa" leva vírgula; "mil e quinhentos" leva "e"
  if (partes.length === 2) return partes[0] + (resto < 100 || resto % 100 === 0 ? ' e ' : ', ') + partes[1];
  return partes[0];
}

function moedaExtenso(valor) {
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  let txt = numeroExtenso(inteiro) + (inteiro === 1 ? ' real' : ' reais');
  if (centavos) txt += ' e ' + numeroExtenso(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  return txt;
}

function moeda(valor) {
  return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function valorPorExtenso(valor) {
  return `<b>${moeda(valor)} (${moedaExtenso(valor)})</b>`;
}

const MESES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function dataExtensa(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} de ${MESES_PT[m - 1]} de ${a}`;
}

function dataCurta(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
}

/* ---------- qualificação das partes ---------- */

function blocoPartes(d) {
  const local = [d.endereco, `${d.cidade} - ${d.uf}`, d.cep].filter(Boolean).join(', ');
  const contato = [
    d.email ? `e-mail ${d.email}` : '',
    d.telefone ? `telefone ${d.telefone}` : '',
  ].filter(Boolean).join(', ');

  let contratante;
  if (d.tipoPessoa === 'PJ') {
    contratante =
      `<b>CONTRATANTE:</b> ${d.nome}, pessoa jurídica de direito privado, inscrita no CNPJ/MF ` +
      `sob o nº ${d.documento}, com sede em ${local}` +
      (contato ? `, ${contato}` : '') +
      (d.responsavelLegal ? `, neste ato representada por ${d.responsavelLegal}` : '') +
      `, doravante denominada simplesmente CONTRATANTE.`;
  } else {
    const f = d.sexo === 'F';
    contratante =
      `<b>CONTRATANTE:</b> ${d.nome}, ${f ? 'inscrita' : 'inscrito'} no CPF sob o nº ${d.documento}` +
      (d.rg ? `, RG ${d.rg}` : '') +
      `, com endereço em ${local}` +
      (contato ? `, ${contato}` : '') +
      `, doravante ${f ? 'denominada' : 'denominado'} simplesmente CONTRATANTE.`;
  }

  const contratada =
    `<b>CONTRATADA:</b> ${CONTRATADA.razao}, pessoa jurídica de direito privado, inscrita no ` +
    `CNPJ/MF sob o nº ${CONTRATADA.cnpj}, com sede na ${CONTRATADA.endereco}, e-mail ` +
    `${CONTRATADA.email}, doravante denominada simplesmente CONTRATADA.`;

  return [
    { t: 'h1', x: 'DAS PARTES' },
    { t: 'body', x: contratante },
    { t: 'body', x: contratada },
    { t: 'body', x: 'As partes acima identificadas têm entre si, justo e contratado, o presente Contrato de Prestação de Serviços de Marketing Digital, que se regerá pelas cláusulas e condições a seguir.' },
  ];
}

/* ---------- contrato SEO/GEO ---------- */

function montarContratoSeo(d) {
  const plano = PLANOS[d.planoBase];
  const comFidelidade = d.planoBase !== 'mensal';
  const addons = [];
  if (d.addonTrafego) addons.push({ ...ADDONS.trafego, valor: d.valorTrafego });
  if (d.addonRedes) addons.push({ ...ADDONS.redes, valor: d.valorRedes });
  const temAddon = addons.length > 0;
  const prazoTxt = comFidelidade ? `${plano.meses} (${plano.extenso}) meses` : null;
  const total = d.valorBase + addons.reduce((s, a) => s + a.valor, 0);

  const b = [];

  /* Cabeçalho */
  const subtitulo = temAddon
    ? (comFidelidade
        ? `SEO/GEO com prazo determinado de ${plano.meses} meses + ${addons.map(a => a.rotulo).join(' + ')}, sem fidelidade`
        : `SEO/GEO e ${addons.map(a => a.rotulo).join(' + ')}, sem fidelidade`)
    : null;
  b.push({ t: 'cabecalho', rotulo: plano.rotulo, subtitulo });

  /* Partes */
  b.push(...blocoPartes(d));

  /* Cláusula 1ª - Objeto */
  b.push({ t: 'h1', x: 'CLÁUSULA PRIMEIRA - DO OBJETO' });
  if (temAddon) {
    const frentes = ['o posicionamento orgânico da CONTRATANTE nos mecanismos de busca e nas plataformas de inteligência artificial (SEO e GEO)']
      .concat(addons.map(a => a.frente));
    const romanos = ['(i)', '(ii)', '(iii)'];
    const lista = frentes.map((f, i) => `${romanos[i]} ${f}`);
    const enumeracao = lista.slice(0, -1).join('; ') + '; e ' + lista[lista.length - 1];
    b.push({ t: 'body', x:
      `O presente contrato tem por objeto a prestação, pela CONTRATADA, de serviços de marketing ` +
      `digital à CONTRATANTE, compreendendo ${frentes.length === 2 ? 'duas frentes' : 'três frentes'}: ` +
      `${enumeracao}. As atividades compreendidas em cada frente são as seguintes:` });
    b.push({ t: 'section', x: 'Posicionamento orgânico (SEO e GEO)' });
  } else {
    b.push({ t: 'body', x:
      'O presente contrato tem por objeto a prestação, pela CONTRATADA, de serviços de marketing ' +
      'digital voltados ao posicionamento orgânico da CONTRATANTE nos mecanismos de busca e nas ' +
      'plataformas de inteligência artificial, compreendendo as seguintes atividades:' });
  }
  b.push({ t: 'items', x: [
    'Criação e otimização contínua do Perfil de Empresa no Google (Google Meu Negócio), incluindo categorias, descrição, serviços, produtos, fotos e postagens;',
    'Otimização para mecanismos de busca (SEO Local), com foco em relevância geográfica e temática;',
    'Otimização para mecanismos generativos (GEO), estruturando as informações da CONTRATANTE para que possam ser localizadas e citadas por ferramentas de inteligência artificial como ChatGPT, Gemini e Perplexity;',
    'Criação e manutenção de site institucional, quando previsto na proposta comercial aceita;',
    'Cadastro e padronização de dados em diretórios locais e plataformas do segmento da CONTRATANTE;',
    'Relatórios periódicos de acompanhamento das ações executadas.',
  ] });
  addons.forEach(a => {
    b.push({ t: 'section', x: a.titulo });
    b.push({ t: 'items', x: [a.escopo] });
  });

  let paragrafoObjeto =
    '<b>Parágrafo único.</b> O escopo detalhado dos serviços é o descrito na proposta comercial ' +
    'aceita pela CONTRATANTE, a qual passa a integrar este instrumento como Anexo I. ';
  if (d.addonTrafego) {
    paragrafoObjeto +=
      'A verba de mídia investida nas campanhas de tráfego pago é custeada diretamente pela ' +
      'CONTRATANTE junto à Meta Platforms Inc., não estando inclusa na mensalidade de gestão ' +
      'prevista na Cláusula Terceira. ';
  }
  const excecoes = [];
  if (!d.addonTrafego && !d.addonRedes) excecoes.push('tráfego pago');
  excecoes.push('produção de fotografia profissional');
  if (d.addonRedes) excecoes.push('filmagens externas');
  if (!d.addonTrafego && d.addonRedes) excecoes.push('impulsionamento pago de publicações (tráfego pago)');
  excecoes.push('licenças de software', 'taxas de terceiros');
  const listaExcecoes = excecoes.slice(0, -1).join(', ') + ' e ' + excecoes[excecoes.length - 1];
  paragrafoObjeto += `Serviços não previstos na proposta, como ${listaExcecoes}, serão objeto de orçamento à parte.`;
  b.push({ t: 'body', x: paragrafoObjeto });

  /* Cláusula 2ª - Prazo */
  b.push({ t: 'h1', x: 'CLÁUSULA SEGUNDA - DO PRAZO DE VIGÊNCIA' });
  // As alíneas de vigência dos add-ons são referenciadas nas Cláusulas Terceira e Nona.
  // A letra depende de quantos add-ons entram, então é calculada aqui e reaproveitada.
  const letrasAddon = [];
  const refAlineas = () => letrasAddon.length === 1
    ? `da alínea '${letrasAddon[0]}'`
    : `das alíneas ${letrasAddon.map(l => `'${l}'`).join(' e ')}`;
  if (comFidelidade) {
    const itens = [
      'A execução dos serviços terá início após a assinatura deste instrumento e a entrega, pela CONTRATANTE, dos acessos e materiais indicados na Cláusula Sexta.',
      `Renovação automática sem fidelidade${temAddon ? ' (SEO e GEO)' : ''}. Cumprido o prazo de vigência sem interrupção e não havendo manifestação em contrário de qualquer das partes, o contrato será automaticamente renovado por igual período de ${prazoTxt}, nas mesmas condições aqui pactuadas, de forma sucessiva e por quantas vezes ocorrer a hipótese desta alínea. A fidelidade prevista neste instrumento aplica-se exclusivamente ao período inicial de vigência. Renovado o contrato, a CONTRATANTE poderá rescindi-lo a qualquer momento, sem necessidade de justificativa e sem incidência de multa rescisória, bastando comunicação escrita com antecedência mínima de 30 (trinta) dias.`,
      'Manifestação de não renovação. A parte que não desejar a renovação deverá comunicar a outra por escrito, por e-mail com confirmação de recebimento ou por aplicativo de mensagens, com antecedência mínima de 30 (trinta) dias do término da vigência. Havendo essa comunicação no prazo, o contrato se encerra na data final do período em curso, sem incidência de multa ou ônus para qualquer das partes.',
      'Aviso prévio de renovação. A CONTRATADA comunicará a CONTRATANTE, com antecedência mínima de 30 (trinta) dias do término da vigência, sobre a proximidade do encerramento do período e a consequente renovação automática, de modo a assegurar à CONTRATANTE pleno conhecimento e tempo hábil para decidir.',
      `Condições comerciais da renovação. Os valores${temAddon ? ' do serviço de SEO e GEO' : ''} permanecerão inalterados na renovação, salvo se a CONTRATADA comunicar reajuste por escrito com a mesma antecedência mínima de 30 (trinta) dias, hipótese em que a CONTRATANTE poderá optar por não renovar, sem qualquer ônus. Em caso de renovações sucessivas, os valores poderão ser corrigidos anualmente pela variação do IPCA/IBGE ou índice que venha a substituí-lo.`,
      "Efeitos da renovação. Renovado o contrato, todas as demais cláusulas deste instrumento permanecem integralmente aplicáveis ao novo período, inclusive as relativas a obrigações das partes e prazos de resultado, ressalvada apenas a multa compensatória da Cláusula Nona, que não incide sobre períodos renovados, nos termos da alínea 'b' desta cláusula.",
    ];
    addons.forEach(a => {
      letrasAddon.push(String.fromCharCode(97 + itens.length));
      itens.push(
        `Vigência e fidelidade do serviço de ${a.nomeVigencia}. O serviço de ${a.nomeSimples} é contratado por ` +
        `prazo indeterminado, com renovação mensal automática, e <b>não possui período de ` +
        `fidelidade</b>. Qualquer das partes poderá solicitar a suspensão ou o encerramento ` +
        `exclusivo desse serviço a qualquer momento, sem multa ou ônus, mediante aviso prévio de ` +
        `30 (trinta) dias, permanecendo em vigor, nessa hipótese, o serviço de SEO e GEO pelas ` +
        `condições e pelo prazo remanescente previstos nesta cláusula.`);
    });
    b.push({ t: 'body', x:
      `O presente contrato vigorará pelo prazo determinado de <b>${prazoTxt}</b>, contados da data ` +
      `de sua assinatura` +
      (temAddon
        ? `, prazo este aplicável ao serviço de posicionamento orgânico (SEO e GEO) descrito na ` +
          `Cláusula Primeira. ${addons.length === 1 ? 'O serviço de ' + addons[0].nome + ' rege-se' : 'Os serviços de ' + addons.map(a => a.nome).join(' e ') + ' regem-se'} ` +
          `por prazo próprio, sem fidelidade, nos termos ${refAlineas()} desta cláusula.`
        : '.') });
    b.push({ t: 'items', x: itens });
  } else {
    b.push({ t: 'body', x:
      'O presente contrato vigorará por prazo indeterminado, contado da data de sua assinatura, ' +
      'sem fidelidade mínima e sem multa por rescisão antecipada.' });
    const itens = [
      'A execução dos serviços terá início após a assinatura deste instrumento e a entrega, pela CONTRATANTE, dos acessos e materiais indicados na Cláusula Sexta.',
      'Qualquer das partes poderá rescindir o presente contrato a qualquer momento, sem necessidade de justificativa e sem incidência de multa rescisória, mediante comunicação escrita com antecedência mínima de 30 (trinta) dias, nos termos da Cláusula Nona.',
      'Os valores permanecerão inalterados ao longo da vigência, podendo ser reajustados a cada 12 (doze) meses, contados da assinatura, pela variação do IPCA/IBGE ou índice que venha a substituí-lo, mediante comunicação prévia por escrito com antecedência mínima de 30 (trinta) dias.',
    ];
    if (temAddon) {
      letrasAddon.push(String.fromCharCode(97 + itens.length));
      itens.push(
        `Cada serviço contratado pode ser suspenso ou encerrado isoladamente, a qualquer tempo, ` +
        `por qualquer das partes, sem multa ou ônus, mediante aviso prévio de 30 (trinta) dias, ` +
        `permanecendo em vigor os demais serviços nas condições aqui pactuadas.`);
    }
    b.push({ t: 'items', x: itens });
  }

  /* Cláusula 3ª - Valor */
  b.push({ t: 'h1', x: 'CLÁUSULA TERCEIRA - DO VALOR E DA FORMA DE PAGAMENTO' });
  const itensValor = [];
  if (temAddon) {
    itensValor.push(
      `Pela prestação do serviço de posicionamento orgânico (SEO e GEO) descrito na Cláusula ` +
      `Primeira, a CONTRATANTE pagará à CONTRATADA o valor mensal de ${valorPorExtenso(d.valorBase)}.`);
    addons.forEach((a, i) => {
      itensValor.push(
        `Pela prestação do serviço de ${a.nome} descrito na Cláusula Primeira, a CONTRATANTE ` +
        `pagará à CONTRATADA o valor mensal de ${valorPorExtenso(a.valor)}, sem prazo de ` +
        `fidelidade, nos termos da alínea '${letrasAddon[Math.min(i, letrasAddon.length - 1)]}' da Cláusula Segunda.`);
    });
    itensValor.push(
      `Enquanto vigentes ${addons.length === 1 ? 'os dois serviços' : 'todos os serviços'}, o valor ` +
      `mensal total devido pela CONTRATANTE à CONTRATADA é de ${valorPorExtenso(total)}.`);
    itensValor.push(
      `O pagamento será realizado mensalmente, em parcela única correspondente à soma dos ` +
      `serviços contratados e vigentes no período, com vencimento todo dia ${d.diaVencimento} de ` +
      `cada mês, preferencialmente por PIX, transferência bancária ou boleto.`);
  } else {
    itensValor.push(
      `Pela prestação dos serviços descritos na Cláusula Primeira, a CONTRATANTE pagará à ` +
      `CONTRATADA o valor mensal de ${valorPorExtenso(d.valorBase)}.`);
    itensValor.push(comFidelidade
      ? `O pagamento será realizado em ${plano.meses} (${plano.extenso}) parcelas mensais e ` +
        `sucessivas, com vencimento todo dia ${d.diaVencimento} de cada mês, preferencialmente ` +
        `por PIX, transferência bancária ou boleto.`
      : `O pagamento será realizado mensalmente, com vencimento todo dia ${d.diaVencimento} de ` +
        `cada mês, preferencialmente por PIX, transferência bancária ou boleto.`);
  }
  itensValor.push(`O primeiro pagamento fica programado para o dia ${dataCurta(d.primeiroPagamento)}.`);
  itensValor.push('Em caso de atraso, incidirão multa de 2% (dois por cento) sobre o valor da parcela vencida, acrescida de juros de mora de 1% (um por cento) ao mês, calculados pro rata die.');
  itensValor.push(
    `O atraso superior a 15 (quinze) dias faculta à CONTRATADA a suspensão imediata da execução ` +
    `dos serviços, sem que isso configure descumprimento contratual de sua parte, e sem ` +
    `prorrogação do prazo de vigência${temAddon ? ' do serviço de SEO e GEO' : ''}.`);
  itensValor.push('O inadimplemento de 2 (duas) parcelas, consecutivas ou não, faculta à CONTRATADA a rescisão imediata do contrato, sem prejuízo da cobrança dos valores vencidos e vincendos.');
  if (d.addonTrafego) {
    itensValor.push(
      'A verba de mídia investida nas campanhas de tráfego pago no Meta Ads é custeada diretamente ' +
      'pela CONTRATANTE junto à plataforma, por cartão de crédito ou outro meio de pagamento por ' +
      'ela indicado, não integrando os valores previstos nesta cláusula.');
  }
  b.push({ t: 'items', x: itensValor });

  /* Cláusula 4ª - Natureza */
  b.push({ t: 'h1', x: 'CLÁUSULA QUARTA - DA NATUREZA DOS SERVIÇOS E DOS PRAZOS DE RESULTADO' });
  b.push({ t: 'body', x:
    'As partes reconhecem, de forma expressa e inequívoca, que os serviços objeto deste contrato ' +
    'constituem obrigação de meio, e não de resultado. A CONTRATADA compromete-se a empregar sua ' +
    'melhor técnica, diligência e metodologia na execução das ações contratadas, não sendo ' +
    'possível assegurar posição específica em resultados de busca, volume determinado de acessos, ' +
    'quantidade de citações por ferramentas de inteligência artificial' +
    (temAddon ? ', número garantido de clientes, contatos, agendamentos ou pacientes.' : ' ou número garantido de clientes.') });
  b.push({ t: 'items', x: [
    `Prazo mínimo para percepção de resultados${temAddon ? ' (SEO e GEO)' : ''}. O posicionamento orgânico é construído de forma gradual e cumulativa. As partes ajustam que o prazo mínimo estimado para que a CONTRATANTE comece a perceber os primeiros resultados dos trabalhos de SEO e GEO é de 3 (três) meses, contados do efetivo início da execução, com consolidação progressiva nos meses seguintes. A ausência de resultados perceptíveis antes desse período não caracteriza descumprimento contratual nem inexecução dos serviços.`,
    'Fatores externos ao controle da CONTRATADA. A CONTRATANTE declara ciência de que o resultado do trabalho depende de variáveis que não estão sob a gestão, o controle ou a responsabilidade da CONTRATADA, entre as quais:',
  ] });
  b.push({ t: 'subitems', x: [
    'o tempo que o Google e demais mecanismos de busca levam para rastrear, indexar e absorver as informações publicadas ou alteradas;',
    'atualizações de algoritmo, mudanças de política, de layout ou de critérios de exibição promovidas pelo Google, pelo ChatGPT, pelo Gemini, pelo Perplexity ou por qualquer outra plataforma de terceiros;',
    'suspensões, bloqueios, exclusões ou reprovações de perfis, publicações e conteúdos aplicadas unilateralmente pelas plataformas;',
    'o nível de concorrência do segmento e da região de atuação da CONTRATANTE, bem como as ações praticadas por seus concorrentes;',
    'o histórico, a reputação e o tempo de existência da presença digital da CONTRATANTE antes do início deste contrato;',
    'o volume, a frequência e a nota das avaliações recebidas pela CONTRATANTE, nos termos da Cláusula Sétima.',
  ] });
  b.push({ t: 'items', x: [
    'Interrupções e instabilidades de plataformas de terceiros, bem como alterações de regras que impactem os métodos utilizados, não geram para a CONTRATADA obrigação de indenizar, descontar valores ou prorrogar prazos.',
    'A CONTRATADA compromete-se a informar a CONTRATANTE, por escrito, sempre que identificar fator externo relevante que possa impactar o andamento ou o ritmo dos resultados, apresentando as medidas de adequação cabíveis.',
  ] });
  addons.forEach(a => {
    b.push({ t: 'items', x: [
      `Natureza e prazos do serviço de ${a.nomeVigencia}. Especificamente quanto à ${a.nomeSimples}, as partes ajustam que:`,
    ] });
    b.push({ t: 'subitems', x: a.natureza });
  });

  /* Cláusula 5ª - Obrigações da CONTRATADA */
  b.push({ t: 'h1', x: 'CLÁUSULA QUINTA - DAS OBRIGAÇÕES DA CONTRATADA' });
  b.push({ t: 'body', x: 'Além das demais obrigações previstas neste instrumento, a CONTRATADA se obriga a:' });
  b.push({ t: 'items', x: [
    'Executar os serviços contratados com qualidade técnica, empregando profissionais capacitados;',
    'Apresentar relatório periódico de acompanhamento das ações executadas e da evolução dos indicadores;',
    'Manter sigilo sobre todas as informações, acessos, dados e materiais da CONTRATANTE a que tiver acesso, durante e após a vigência deste contrato;',
    'Observar a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) no tratamento de dados pessoais eventualmente acessados em razão da execução dos serviços;',
    'Respeitar o Código de Defesa do Consumidor, o Código Brasileiro de Autorregulamentação Publicitária e, quando a CONTRATANTE exercer profissão regulamentada, as normas do respectivo conselho de classe, notadamente CFM, CRO e OAB;',
    'Comunicar por escrito, de imediato, qualquer anormalidade, impedimento técnico ou situação que possa comprometer a execução ou a qualidade dos serviços.',
  ] });

  /* Cláusula 6ª - Obrigações da CONTRATANTE */
  b.push({ t: 'h1', x: 'CLÁUSULA SEXTA - DAS OBRIGAÇÕES DA CONTRATANTE' });
  b.push({ t: 'body', x: 'A CONTRATANTE reconhece que a execução dos serviços depende de sua colaboração ativa e se obriga a:' });
  const redesTxt = d.addonRedes ? 'redes sociais (Instagram, Facebook e demais perfis)' : 'redes sociais';
  const acessosExtra = addons.map(a => a.acessos).filter(Boolean);
  b.push({ t: 'items', x: [
    'Efetuar os pagamentos nas datas acordadas;',
    `Fornecer, no prazo solicitado, todos os acessos necessários à execução dos serviços, incluindo Perfil de Empresa no Google, domínio, hospedagem, ${redesTxt}` +
      (acessosExtra.length ? `, ${acessosExtra.join(', ')},` : '') + ' e demais plataformas pertinentes;',
    'Disponibilizar fotos, vídeos, informações institucionais, dados de serviços, produtos e preços, bem como quaisquer materiais solicitados pela CONTRATADA;',
    'Indicar um responsável único pela interlocução com a equipe da CONTRATADA e manter canal de comunicação ativo;',
    'Analisar e aprovar os materiais submetidos pela CONTRATADA no prazo de até 5 (cinco) dias úteis, sob pena de prosseguimento com a versão apresentada;',
    'Responder às mensagens, perguntas e solicitações de orçamento recebidas por meio dos canais otimizados, uma vez que o tempo de resposta impacta diretamente o desempenho do perfil e a conversão dos contatos gerados;',
    'Manter atualizadas as informações de nome, endereço, telefone e horário de funcionamento, comunicando à CONTRATADA qualquer alteração com antecedência mínima de 5 (cinco) dias;',
    'Não realizar alterações diretas nos perfis, no site ou nos cadastros otimizados sem prévio alinhamento com a CONTRATADA, sob pena de comprometimento das ações em curso;',
    'Responsabilizar-se pela veracidade, pela legalidade e pela titularidade de todas as informações, imagens e materiais fornecidos, bem como pelo cumprimento das normas do seu conselho de classe, quando aplicável;',
    'Não contratar diretamente, durante a vigência deste contrato e por 12 (doze) meses após seu encerramento, qualquer profissional da equipe da CONTRATADA que tenha atuado em sua conta.',
  ] });
  b.push({ t: 'body', x: '<b>Parágrafo único.</b> O descumprimento das obrigações previstas nesta cláusula, especialmente o atraso na entrega de acessos, materiais e aprovações, suspende os prazos de execução da CONTRATADA pelo mesmo período do atraso, sem prorrogação da vigência contratual e sem qualquer abatimento no valor mensal.' });

  /* Cláusula 7ª - Avaliações */
  b.push({ t: 'h1', x: 'CLÁUSULA SÉTIMA - DA GESTÃO E SOLICITAÇÃO DE AVALIAÇÕES' });
  b.push({ t: 'body', x: 'As avaliações recebidas pela CONTRATANTE em seu Perfil de Empresa no Google constituem fator determinante de posicionamento, influenciando de forma direta a relevância, a exibição no Google Maps e a decisão de contratação por parte do consumidor. As partes ajustam o seguinte regime de responsabilidade:' });
  b.push({ t: 'items', x: [
    'A solicitação de avaliações aos clientes, pacientes ou consumidores é de responsabilidade exclusiva da CONTRATANTE, por se tratar de prática operacional e comercial inerente ao seu próprio atendimento, executada no momento do contato direto com o público, etapa na qual a CONTRATADA não atua e não tem como intervir ou acompanhar.',
    'Cabe à CONTRATADA fornecer o suporte estratégico para essa prática, incluindo o link direto de avaliação, modelos de mensagem, materiais de apoio como arte com QR Code, orientação sobre os canais e momentos mais eficazes de solicitação e acompanhamento da evolução do volume e da nota nos relatórios periódicos.',
    'A CONTRATANTE se compromete a solicitar avaliações de forma contínua e sistemática ao longo de toda a vigência contratual, e não de forma pontual ou concentrada, uma vez que a recência e a constância das avaliações têm peso superior ao volume acumulado.',
    'É vedada à CONTRATANTE a compra de avaliações, a criação de perfis falsos, o oferecimento de vantagem em troca de avaliação positiva ou qualquer outra prática contrária às diretrizes do Google e à legislação aplicável. A adoção de tais práticas pode acarretar a suspensão ou a exclusão do perfil, hipótese em que a CONTRATADA não responderá pelos prejuízos decorrentes.',
    'A ausência, a insuficiência ou a irregularidade na solicitação de avaliações pela CONTRATANTE limita de forma significativa o desempenho do trabalho de posicionamento e não pode ser imputada à CONTRATADA como falha na prestação dos serviços, tampouco servir de fundamento para rescisão sem ônus, abatimento de valores ou pedido de reembolso.',
    'A resposta às avaliações recebidas, positivas ou negativas, será conduzida conforme definido na proposta comercial. Quando executada pela CONTRATADA, dependerá do fornecimento prévio, pela CONTRATANTE, dos elementos necessários à resposta adequada de cada caso, especialmente em situações que envolvam sigilo profissional.',
  ] });

  /* Cláusula 8ª - Propriedade */
  b.push({ t: 'h1', x: 'CLÁUSULA OITAVA - DA PROPRIEDADE, DOS ACESSOS E DA CONFIDENCIALIDADE' });
  const titulares = ['O Perfil de Empresa no Google', 'o domínio']
    .concat(addons.map(a => a.titularidade))
    .concat(['os perfis em plataformas de terceiros']);
  b.push({ t: 'items', x: [
    `${titulares.slice(0, -1).join(', ')} e ${titulares[titulares.length - 1]} permanecem de titularidade da CONTRATANTE, que concede à CONTRATADA acesso administrativo apenas para a execução dos serviços.`,
    'Os conteúdos produzidos pela CONTRATADA e integralmente pagos pela CONTRATANTE poderão ser por ela utilizados após o término do contrato.',
    'Metodologias, processos internos, modelos, planilhas e ferramentas proprietárias da CONTRATADA permanecem de sua exclusiva titularidade, não sendo transferidos em razão deste contrato.',
    'A CONTRATANTE autoriza a CONTRATADA a citar seu nome, sua marca e os resultados obtidos em materiais institucionais e comerciais, salvo manifestação por escrito em sentido contrário.',
  ] });

  /* Cláusula 9ª - Rescisão */
  b.push({ t: 'h1', x: 'CLÁUSULA NONA - DA RESCISÃO' });
  const itensRescisao = ['O presente contrato poderá ser rescindido por qualquer das partes mediante comunicação escrita, por e-mail com confirmação de recebimento, com antecedência mínima de 30 (trinta) dias.'];
  if (comFidelidade) {
    itensRescisao.push(
      'Em caso de rescisão antecipada por iniciativa da CONTRATANTE durante o período inicial de vigência, sem motivo imputável à CONTRATADA, será devida multa compensatória de 30% (trinta por cento) sobre o valor das parcelas remanescentes até o término desse período, a ser paga em até 15 (quinze) dias contados da notificação.',
      'A multa prevista na alínea anterior não se aplica aos períodos renovados. Encerrado o período inicial de vigência e renovado o contrato, a CONTRATANTE poderá rescindi-lo a qualquer tempo, sem justificativa e sem qualquer multa ou ônus, mediante comunicação escrita com antecedência mínima de 30 (trinta) dias, permanecendo devidas apenas as parcelas correspondentes aos serviços prestados até a data do encerramento.');
    if (temAddon) {
      itensRescisao.push(
        `A multa compensatória prevista na alínea 'b' desta cláusula aplica-se <b>exclusivamente ` +
        `ao serviço de posicionamento orgânico (SEO e GEO)</b>, contratado com prazo determinado ` +
        `de ${prazoTxt}. ${addons.length === 1 ? 'O serviço de ' + addons[0].nome : 'Os serviços de ' + addons.map(a => a.nome).join(' e ')} ` +
        `<b>não ${addons.length === 1 ? 'possui' : 'possuem'} prazo de fidelidade</b> e ${addons.length === 1 ? 'pode ser rescindido' : 'podem ser rescindidos'} ` +
        `isoladamente, a qualquer tempo, por qualquer das partes, sem incidência de multa, ` +
        `mediante aviso prévio de 30 (trinta) dias, nos termos ${refAlineas()} da Cláusula Segunda, permanecendo ` +
        `devidos apenas os valores relativos aos serviços já executados até a data de encerramento.`);
    }
    itensRescisao.push("Não caracterizam motivo imputável à CONTRATADA, para os fins da alínea 'b', a ausência de resultados dentro do prazo mínimo previsto na Cláusula Quarta, a demora de indexação pelos mecanismos de busca, as alterações de algoritmo e demais fatores externos ali listados, nem o desempenho limitado decorrente do descumprimento, pela CONTRATANTE, das obrigações das Cláusulas Sexta e Sétima.");
  } else {
    itensRescisao.push("Não há fidelidade mínima nem multa compensatória por rescisão antecipada. A CONTRATANTE poderá rescindir o contrato a qualquer tempo, sem justificativa e sem qualquer ônus, mediante a comunicação prevista na alínea 'a', permanecendo devidas apenas as parcelas correspondentes aos serviços prestados até a data do encerramento.");
  }
  itensRescisao.push(
    'Os valores já pagos referentes a serviços efetivamente executados não serão restituídos.',
    'Rescindido o contrato por descumprimento imputável à CONTRATADA, não haverá incidência de multa para a CONTRATANTE e os valores pagos antecipadamente por serviços não executados serão devolvidos de forma proporcional.',
    'Encerrado o contrato, a CONTRATADA fornecerá, no prazo de até 30 (trinta) dias, as informações necessárias à continuidade dos trabalhos por outro prestador, e devolverá os acessos administrativos à CONTRATANTE.',
    'Findo o prazo acima, os dados da CONTRATANTE serão descartados pela CONTRATADA. O site institucional, quando produzido no âmbito deste contrato, ficará indisponível no mesmo prazo, salvo se a CONTRATANTE optar por mantê-lo no ar mediante pagamento de taxa mensal de hospedagem de R$ 150,00 (cento e cinquenta reais).');
  b.push({ t: 'items', x: itensRescisao });

  /* Cláusula 10ª - Disposições gerais */
  b.push({ t: 'h1', x: 'CLÁUSULA DÉCIMA - DAS DISPOSIÇÕES GERAIS' });
  b.push({ t: 'items', x: [
    'O presente instrumento, somado à proposta comercial aceita, representa a totalidade do acordo entre as partes, prevalecendo sobre quaisquer entendimentos anteriores, verbais ou escritos.',
    'Qualquer alteração somente terá validade se formalizada por escrito e assinada por ambas as partes, por meio de termo aditivo.',
    'A tolerância de qualquer das partes quanto ao descumprimento de obrigação prevista neste contrato constitui mera liberalidade, não implicando novação nem renúncia de direito.',
    'As comunicações entre as partes serão válidas quando realizadas por e-mail ou aplicativo de mensagens nos endereços e números indicados neste instrumento.',
    'Este contrato poderá ser assinado eletronicamente, reconhecendo as partes a validade jurídica da assinatura digital, nos termos da Medida Provisória nº 2.200-2/2001.',
    `As partes elegem o Foro da Comarca de ${CONTRATADA.foro} para dirimir quaisquer questões decorrentes deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.`,
  ] });

  /* Fecho e assinaturas */
  b.push({ t: 'spacer' });
  b.push({ t: 'body', x:
    'E por estarem assim justas e contratadas, as partes assinam o presente instrumento, ' +
    'declarando ter lido e compreendido integralmente todas as cláusulas, em especial as ' +
    (temAddon
      ? 'Cláusulas Segunda, Terceira, Quarta, Sexta e Sétima, que tratam da vigência e fidelidade de cada serviço, dos valores, da natureza dos serviços, dos prazos de resultado e das responsabilidades operacionais da CONTRATANTE.'
      : 'Cláusulas Quarta, Sexta e Sétima, que tratam da natureza dos serviços, dos prazos de resultado e das responsabilidades operacionais da CONTRATANTE.') });
  b.push({ t: 'data', x: `${CONTRATADA.foro}, ${dataExtensa(d.dataAssinatura)}.` });
  b.push({ t: 'assinaturas', nome: d.nome, doc: `${d.tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'} ${d.documento}` });

  const rodape = temAddon
    ? `${comFidelidade ? 'SEO/GEO ' + plano.meses + ' Meses' : 'SEO/GEO Mensal'} + ${addons.map(a => a.nomeCurto).join(' + ')}`
    : plano.rotulo;

  return { blocos: b, rodape, titulo: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL' };
}

/* ---------- contrato de hospedagem + blog ---------- */

function montarContratoHospedagem(d) {
  const b = [];
  b.push({ t: 'cabecalho', rotulo: 'Hospedagem de Site e Produção de Conteúdo para Blog', subtitulo: 'Sem fidelidade contratual' });
  b.push(...blocoPartes(d));

  b.push({ t: 'h1', x: 'CLÁUSULA PRIMEIRA - DO OBJETO' });
  b.push({ t: 'body', x: 'O presente contrato tem por objeto a prestação, pela CONTRATADA, dos seguintes serviços à CONTRATANTE:' });
  b.push({ t: 'items', x: [
    'Hospedagem do site institucional: manutenção do site institucional desenvolvido pela CONTRATADA em servidor próprio ou de terceiros gerenciado pela CONTRATADA, garantindo a disponibilidade, o funcionamento técnico e a segurança básica da hospedagem durante a vigência deste contrato.',
    'Produção e publicação de 1 (uma) postagem mensal no blog: elaboração de 1 (um) artigo por mês para o blog do site, com pauta sugerida pela CONTRATANTE e redação, revisão e publicação realizadas pela CONTRATADA, respeitando boas práticas de SEO e linguagem adequada ao público da CONTRATANTE.',
  ] });
  b.push({ t: 'body', x: '<b>Parágrafo único.</b> Os serviços descritos nesta cláusula pressupõem a existência de site institucional previamente desenvolvido pela CONTRATADA, sendo este contrato exclusivo para a etapa de hospedagem e manutenção de conteúdo, não incluindo o desenvolvimento inicial do site nem alterações estruturais de layout, que serão objeto de orçamento à parte.' });

  b.push({ t: 'h1', x: 'CLÁUSULA SEGUNDA - DO VALOR E DA FORMA DE PAGAMENTO' });
  b.push({ t: 'items', x: [
    `Fica acordado entre as partes o valor mensal de ${valorPorExtenso(d.valorBase)}, referente à hospedagem do site institucional e à produção de 1 (uma) postagem mensal no blog.`,
    `O pagamento será realizado mensalmente, todo dia ${d.diaVencimento} de cada mês, preferencialmente por PIX, transferência bancária ou boleto.`,
    `O primeiro pagamento fica programado para o dia ${dataCurta(d.primeiroPagamento)}.`,
    'Este contrato não possui prazo de fidelidade ou permanência mínima, podendo ser rescindido por qualquer das partes nos termos previstos na Cláusula Quinta.',
    'Em caso de atraso no pagamento superior a 5 (cinco) dias corridos, a CONTRATADA poderá suspender a publicação da postagem mensal até a regularização, sem prejuízo da cobrança dos valores em aberto.',
    'Em caso de atraso superior a 15 (quinze) dias corridos, a CONTRATADA poderá suspender a hospedagem do site, retirando-o do ar, até a regularização integral dos valores devidos.',
    'Os valores poderão ser reajustados a cada 12 (doze) meses, contados da assinatura, pela variação do IPCA/IBGE ou índice que venha a substituí-lo, mediante comunicação prévia por escrito com antecedência mínima de 30 (trinta) dias.',
  ] });

  b.push({ t: 'h1', x: 'CLÁUSULA TERCEIRA - DO ESCOPO DA POSTAGEM MENSAL NO BLOG' });
  b.push({ t: 'items', x: [
    'A pauta de cada postagem mensal será sugerida pela CONTRATANTE, cabendo à CONTRATADA a redação do conteúdo, observando boas práticas de SEO, clareza e adequação à linguagem do público-alvo.',
    'Caso a CONTRATANTE não apresente pauta até o dia 20 (vinte) do mês de referência, a CONTRATADA fica autorizada a definir o tema da postagem, com base no histórico de conteúdo do site e nas palavras-chave estratégicas do segmento da CONTRATANTE.',
    'A postagem mensal não é cumulativa. A ausência de publicação em determinado mês por falta de pauta, de aprovação ou de material da CONTRATANTE não gera direito a acúmulo para os meses seguintes nem a abatimento no valor mensal.',
    'Eventuais postagens adicionais, além da postagem mensal contratada, serão objeto de orçamento à parte.',
  ] });

  b.push({ t: 'h1', x: 'CLÁUSULA QUARTA - DAS OBRIGAÇÕES DAS PARTES' });
  b.push({ t: 'body', x: 'A CONTRATADA se obriga a:' });
  b.push({ t: 'items', x: [
    'Manter o site institucional no ar, adotando as medidas técnicas ao seu alcance para assegurar a disponibilidade e a segurança básica da hospedagem;',
    'Produzir e publicar a postagem mensal no blog, nos termos da Cláusula Terceira;',
    'Manter sigilo sobre todas as informações, acessos e dados da CONTRATANTE a que tiver acesso, durante e após a vigência deste contrato;',
    'Observar a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) no tratamento de dados pessoais eventualmente acessados em razão da execução dos serviços;',
    'Comunicar por escrito, de imediato, qualquer indisponibilidade relevante ou incidente técnico que afete o site.',
  ] });
  b.push({ t: 'body', x: 'A CONTRATANTE se obriga a:' });
  b.push({ t: 'items', x: [
    'Efetuar os pagamentos nas datas acordadas;',
    'Fornecer pauta, informações, fotos e demais materiais necessários à produção da postagem mensal;',
    'Analisar e aprovar o conteúdo submetido pela CONTRATADA no prazo de até 5 (cinco) dias úteis, sob pena de publicação da versão apresentada;',
    'Responsabilizar-se pela veracidade, pela legalidade e pela titularidade das informações e dos materiais fornecidos, bem como pelo cumprimento das normas do seu conselho de classe, quando aplicável;',
    'Manter a titularidade e a regularidade do domínio, arcando com os custos de registro e de renovação junto ao órgão competente.',
  ] });

  b.push({ t: 'h1', x: 'CLÁUSULA QUINTA - DA VIGÊNCIA E DA RESCISÃO' });
  b.push({ t: 'items', x: [
    'O presente contrato vigora por prazo indeterminado, contado da data de sua assinatura, com renovação mensal automática e sem período de fidelidade.',
    'Qualquer das partes poderá rescindir o contrato a qualquer tempo, sem justificativa e sem multa, mediante comunicação escrita com antecedência mínima de 30 (trinta) dias, por e-mail com confirmação de recebimento ou por aplicativo de mensagens.',
    'Os valores já pagos referentes a serviços efetivamente executados não serão restituídos.',
    'Encerrado o contrato, o site ficará indisponível a partir do término do último período pago, salvo se a CONTRATANTE optar por migrá-lo para servidor próprio ou de terceiros.',
    'Em caso de migração, a CONTRATADA fornecerá, no prazo de até 30 (trinta) dias contados da solicitação, os arquivos do site e as informações necessárias à continuidade dos trabalhos por outro prestador.',
  ] });

  b.push({ t: 'h1', x: 'CLÁUSULA SEXTA - DA PROPRIEDADE E DA CONFIDENCIALIDADE' });
  b.push({ t: 'items', x: [
    'O domínio permanece de titularidade da CONTRATANTE, que concede à CONTRATADA acesso administrativo apenas para a execução dos serviços.',
    'Os conteúdos produzidos pela CONTRATADA e integralmente pagos pela CONTRATANTE poderão ser por ela utilizados após o término do contrato.',
    'Metodologias, processos internos, modelos e ferramentas proprietárias da CONTRATADA permanecem de sua exclusiva titularidade, não sendo transferidos em razão deste contrato.',
    'A CONTRATANTE autoriza a CONTRATADA a citar seu nome, sua marca e os resultados obtidos em materiais institucionais e comerciais, salvo manifestação por escrito em sentido contrário.',
  ] });

  b.push({ t: 'h1', x: 'CLÁUSULA SÉTIMA - DAS DISPOSIÇÕES GERAIS' });
  b.push({ t: 'items', x: [
    'A CONTRATADA não responde por indisponibilidades decorrentes de falhas de terceiros, como provedores de servidor, registradores de domínio ou operadoras de telecomunicação, nem por casos fortuitos ou de força maior.',
    'Qualquer alteração somente terá validade se formalizada por escrito e assinada por ambas as partes, por meio de termo aditivo.',
    'As comunicações entre as partes serão válidas quando realizadas por e-mail ou aplicativo de mensagens nos endereços e números indicados neste instrumento.',
    'Este contrato poderá ser assinado eletronicamente, reconhecendo as partes a validade jurídica da assinatura digital, nos termos da Medida Provisória nº 2.200-2/2001.',
    `As partes elegem o Foro da Comarca de ${CONTRATADA.foro} para dirimir quaisquer questões decorrentes deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.`,
  ] });

  b.push({ t: 'spacer' });
  b.push({ t: 'body', x: 'E por estarem assim justas e contratadas, as partes assinam o presente instrumento, declarando ter lido e compreendido integralmente todas as cláusulas.' });
  b.push({ t: 'data', x: `${CONTRATADA.foro}, ${dataExtensa(d.dataAssinatura)}.` });
  b.push({ t: 'assinaturas', nome: d.nome, doc: `${d.tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'} ${d.documento}` });

  return {
    blocos: b,
    rodape: 'Hospedagem de Site + Blog',
    titulo: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE HOSPEDAGEM DE SITE E PRODUÇÃO DE CONTEÚDO PARA BLOG',
  };
}

function montarContrato(d) {
  return d.modelo === 'hospedagem' ? montarContratoHospedagem(d) : montarContratoSeo(d);
}
