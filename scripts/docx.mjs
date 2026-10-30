// Escreve um documento do Word (.docx) sem dependências: o XML do Word dentro de um zip feito aqui.
// Abre no Word, no Google Docs e no LibreOffice. Os títulos usam os estilos do próprio Word (Título 1, 2, 3...), para
// o Word e o Google Docs mostrarem o índice do documento e o cliente ver a hierarquia da página.
// Um documento é { titulo, blocos }, e cada bloco { tipo, partes }:
//   tipo: 'titulo' (com nivel 1 a 6) · 'paragrafo' · 'item' (de lista: nivel 0 a 2, ordenada, lista) · 'nota' · 'linha'
//   partes: [{ texto, negrito, italico, ligacao }] ou { quebra: true }
// blocosDeHtml(html) transforma HTML (Elementor, blocos do WordPress, Shopify) em blocos.
import { deflateRawSync } from 'node:zlib';

// Os nomes dos esquemas do Word. São identificadores do formato, não endereços a que se ligue.
const NS = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  tipos: 'http://schemas.openxmlformats.org/package/2006/content-types',
  rels: 'http://schemas.openxmlformats.org/package/2006/relationships',
  doc: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument',
  core: 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties',
  cp: 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties',
  dc: 'http://purl.org/dc/elements/1.1/',
  dcterms: 'http://purl.org/dc/terms/',
  xsi: 'http://www.w3.org/2001/XMLSchema-instance',
  word: 'http://schemas.microsoft.com/office/word',
};
const REL = (t) => `http://schemas.openxmlformats.org/officeDocument/2006/relationships/${t}`;
const OFFICE = 'application/vnd.openxmlformats-officedocument.wordprocessingml';

// --- zip -------------------------------------------------------------------------------------------------------
// CRC32 à mão: o zlib.crc32 só existe a partir do Node 22.2.
const TABELA = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = TABELA[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
};

export function zip(ficheiros, quando = new Date()) {
  const hora = (quando.getHours() << 11) | (quando.getMinutes() << 5) | (quando.getSeconds() >> 1);
  const dia = ((quando.getFullYear() - 1980) << 9) | ((quando.getMonth() + 1) << 5) | quando.getDate();
  const partes = [];
  const centrais = [];
  let pos = 0;
  for (const { nome, dados } of ficheiros) {
    const bruto = Buffer.isBuffer(dados) ? dados : Buffer.from(dados, 'utf8');
    const comprimido = deflateRawSync(bruto);
    const n = Buffer.from(nome, 'utf8');
    const crc = crc32(bruto);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(hora, 10);
    local.writeUInt16LE(dia, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(bruto.length, 22);
    local.writeUInt16LE(n.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(hora, 12);
    central.writeUInt16LE(dia, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comprimido.length, 20);
    central.writeUInt32LE(bruto.length, 24);
    central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE(pos, 42);
    partes.push(local, n, comprimido);
    centrais.push(central, n);
    pos += 30 + n.length + comprimido.length;
  }
  const directorio = Buffer.concat(centrais);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(ficheiros.length, 8);
  fim.writeUInt16LE(ficheiros.length, 10);
  fim.writeUInt32LE(directorio.length, 12);
  fim.writeUInt32LE(pos, 16);
  return Buffer.concat([...partes, directorio, fim]);
}

// --- Word ------------------------------------------------------------------------------------------------------
// Caracteres que o XML não aceita (controlo, metades de emoji soltas) partiam o documento no Word.
const esc = (t) => String(t ?? '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

const tamanhos = [0, 36, 30, 26, 24, 22, 22];
const estiloTitulo = (n) => `<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/>`
  + `<w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="${n < 3 ? 360 : 240}" w:after="120"/><w:outlineLvl w:val="${n - 1}"/></w:pPr>`
  + `<w:rPr><w:b/><w:bCs/>${n > 4 ? '<w:i/><w:iCs/>' : ''}<w:sz w:val="${tamanhos[n]}"/><w:szCs w:val="${tamanhos[n]}"/></w:rPr></w:style>`;

const ESTILOS = `${XML}<w:styles xmlns:w="${NS.w}">`
  + '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="pt-PT" w:eastAsia="pt-PT" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>'
  + '<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
  + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/></w:rPr></w:style>'
  + [1, 2, 3, 4, 5, 6].map(estiloTitulo).join('')
  + '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="34"/><w:qFormat/><w:pPr><w:spacing w:after="60"/><w:ind w:left="720"/><w:contextualSpacing/></w:pPr></w:style>'
  + '<w:style w:type="paragraph" w:customStyle="1" w:styleId="Nota"><w:name w:val="Nota"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="FFF4CC"/><w:spacing w:after="240"/></w:pPr><w:rPr><w:i/><w:iCs/></w:rPr></w:style>'
  + '<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/><w:unhideWhenUsed/></w:style>'
  + '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:basedOn w:val="DefaultParagraphFont"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style>'
  + '</w:styles>';

const nivelLista = (i, formato, texto) => `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${formato}"/><w:lvlText w:val="${texto}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 * (i + 1)}" w:hanging="360"/></w:pPr></w:lvl>`;
const numeracao = (ordenadas) => `${XML}<w:numbering xmlns:w="${NS.w}">`
  + `<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>${nivelLista(0, 'bullet', '•')}${nivelLista(1, 'bullet', '◦')}${nivelLista(2, 'bullet', '▪')}</w:abstractNum>`
  + `<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>${nivelLista(0, 'decimal', '%1.')}${nivelLista(1, 'decimal', '%2.')}${nivelLista(2, 'decimal', '%3.')}</w:abstractNum>`
  + '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>'
  // Cada lista numerada tem a sua numeração e recomeça no 1 em todos os níveis: uma lista dentro de um item de outra
  // fica no nível 1, e só com o nível 0 reiniciado continuava a contagem da anterior. Em algarismos, como no browser.
  + ordenadas.map((id) => `<w:num w:numId="${id}"><w:abstractNumId w:val="1"/>${[0, 1, 2].map((i) => `<w:lvlOverride w:ilvl="${i}"><w:startOverride w:val="1"/></w:lvlOverride>`).join('')}</w:num>`).join('')
  + '</w:numbering>';

export function docx({ titulo = '', blocos = [], autor = 'Flowzi WP Kit', quando = new Date() }) {
  const ligacoes = new Map();
  const ordenadas = new Map();
  const rel = (url) => {
    if (!ligacoes.has(url)) ligacoes.set(url, `rIdL${ligacoes.size + 1}`);
    return ligacoes.get(url);
  };
  const corrida = (p) => {
    if (p.quebra) return '<w:r><w:br/></w:r>';
    const rPr = `${p.ligacao ? '<w:rStyle w:val="Hyperlink"/>' : ''}${p.negrito ? '<w:b/><w:bCs/>' : ''}${p.italico ? '<w:i/><w:iCs/>' : ''}`;
    const r = `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}<w:t xml:space="preserve">${esc(p.texto)}</w:t></w:r>`;
    return p.ligacao ? `<w:hyperlink r:id="${rel(p.ligacao)}" w:history="1">${r}</w:hyperlink>` : r;
  };
  const paragrafo = (b) => {
    let pPr = '';
    if (b.tipo === 'titulo') pPr = `<w:pStyle w:val="Heading${Math.min(6, Math.max(1, b.nivel || 1))}"/>`;
    else if (b.tipo === 'nota') pPr = '<w:pStyle w:val="Nota"/>';
    else if (b.tipo === 'linha') pPr = '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="999999"/></w:pBdr>';
    else if (b.tipo === 'item') {
      let numId = 1;
      if (b.ordenada) {
        if (!ordenadas.has(b.lista)) ordenadas.set(b.lista, ordenadas.size + 2);
        numId = ordenadas.get(b.lista);
      }
      pPr = `<w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="${Math.min(2, b.nivel || 0)}"/><w:numId w:val="${numId}"/></w:numPr>`;
    }
    return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${(b.partes || []).map(corrida).join('')}</w:p>`;
  };
  const corpo = blocos.map(paragrafo).join('') || '<w:p/>';
  const documento = `${XML}<w:document xmlns:w="${NS.w}" xmlns:r="${NS.r}"><w:body>${corpo}`
    + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>'
    + '</w:body></w:document>';
  const relacoes = `${XML}<Relationships xmlns="${NS.rels}">`
    + `<Relationship Id="rId1" Type="${REL('styles')}" Target="styles.xml"/>`
    + `<Relationship Id="rId2" Type="${REL('numbering')}" Target="numbering.xml"/>`
    + `<Relationship Id="rId3" Type="${REL('settings')}" Target="settings.xml"/>`
    + [...ligacoes].map(([url, id]) => `<Relationship Id="${id}" Type="${REL('hyperlink')}" Target="${esc(url)}" TargetMode="External"/>`).join('')
    + '</Relationships>';
  const data = quando.toISOString().replace(/\.\d+Z$/, 'Z');
  return zip([
    { nome: '[Content_Types].xml', dados: `${XML}<Types xmlns="${NS.tipos}">`
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + `<Override PartName="/word/document.xml" ContentType="${OFFICE}.document.main+xml"/>`
      + `<Override PartName="/word/styles.xml" ContentType="${OFFICE}.styles+xml"/>`
      + `<Override PartName="/word/numbering.xml" ContentType="${OFFICE}.numbering+xml"/>`
      + `<Override PartName="/word/settings.xml" ContentType="${OFFICE}.settings+xml"/>`
      + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
      + '</Types>' },
    { nome: '_rels/.rels', dados: `${XML}<Relationships xmlns="${NS.rels}">`
      + `<Relationship Id="rId1" Type="${NS.doc}" Target="word/document.xml"/>`
      + `<Relationship Id="rId2" Type="${NS.core}" Target="docProps/core.xml"/>`
      + '</Relationships>' },
    { nome: 'docProps/core.xml', dados: `${XML}<cp:coreProperties xmlns:cp="${NS.cp}" xmlns:dc="${NS.dc}" xmlns:dcterms="${NS.dcterms}" xmlns:xsi="${NS.xsi}">`
      + `<dc:title>${esc(titulo)}</dc:title><dc:creator>${esc(autor)}</dc:creator><dc:language>pt-PT</dc:language>`
      + `<dcterms:created xsi:type="dcterms:W3CDTF">${data}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${data}</dcterms:modified>`
      + '</cp:coreProperties>' },
    { nome: 'word/document.xml', dados: documento },
    { nome: 'word/styles.xml', dados: ESTILOS },
    { nome: 'word/numbering.xml', dados: numeracao([...ordenadas.values()]) },
    // Sem o modo de compatibilidade 15, o Word abria o documento como "Modo de Compatibilidade".
    { nome: 'word/settings.xml', dados: `${XML}<w:settings xmlns:w="${NS.w}"><w:defaultTabStop w:val="708"/><w:characterSpacingControl w:val="doNotCompress"/>`
      + `<w:compat><w:compatSetting w:name="compatibilityMode" w:uri="${NS.word}" w:val="15"/></w:compat></w:settings>` },
    { nome: 'word/_rels/document.xml.rels', dados: relacoes },
  ], quando);
}

// --- HTML para blocos ------------------------------------------------------------------------------------------
const NOMEADAS = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', euro: '€',
  laquo: '«', raquo: '»', ordm: 'º', ordf: 'ª', copy: '©', reg: '®', trade: '™', deg: '°', middot: '·', bull: '•',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', sbquo: '‚', bdquo: '„', lsaquo: '‹', rsaquo: '›', prime: '′', Prime: '″',
  times: '×', divide: '÷', minus: '−', plusmn: '±', frac12: '½', frac14: '¼', frac34: '¾', sup1: '¹', sup2: '²', sup3: '³',
  permil: '‰', micro: 'µ', infin: '∞', le: '≤', ge: '≥', ne: '≠', asymp: '≈', not: '¬', sect: '§', para: '¶',
  cent: '¢', pound: '£', yen: '¥', curren: '¤', brvbar: '¦', iexcl: '¡', iquest: '¿', dagger: '†', Dagger: '‡',
  rarr: '→', larr: '←', uarr: '↑', darr: '↓', harr: '↔', rArr: '⇒', lArr: '⇐', hArr: '⇔', check: '✓', star: '☆',
  hearts: '♥', spades: '♠', clubs: '♣', diams: '♦', szlig: 'ß', aelig: 'æ', AElig: 'Æ', oslash: 'ø', Oslash: 'Ø',
  eth: 'ð', ETH: 'Ð', thorn: 'þ', THORN: 'Þ', oelig: 'œ', OElig: 'Œ', ensp: ' ', emsp: ' ', thinsp: ' ',
  shy: '', zwj: '', zwnj: '', lrm: '', rlm: '', macr: '¯', acute: '´', cedil: '¸', uml: '¨', circ: 'ˆ', tilde: '˜',
};
const ACENTOS = { acute: '́', grave: '̀', circ: '̂', tilde: '̃', uml: '̈', cedil: '̧', ring: '̊' };
// &#146; e companhia: o Word e editores antigos gravam pela página de código cp1252, onde 128 a 159 são aspas e travessões.
const CP1252 = { 128: '€', 130: '‚', 131: 'ƒ', 132: '„', 133: '…', 134: '†', 135: '‡', 136: 'ˆ', 137: '‰', 138: 'Š', 139: '‹',
  140: 'Œ', 142: 'Ž', 145: '‘', 146: '’', 147: '“', 148: '”', 149: '•', 150: '–', 151: '—', 152: '˜', 153: '™', 154: 'š',
  155: '›', 156: 'œ', 158: 'ž', 159: 'Ÿ' };
export const desentidades = (t) => String(t ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (todo, e) => {
  if (e[0] === '#') {
    const n = /^#x/i.test(e) ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    if (n >= 128 && n <= 159) return CP1252[n] ?? '';
    try { return String.fromCodePoint(n); } catch { return todo; }
  }
  if (Object.hasOwn(NOMEADAS, e)) return NOMEADAS[e];
  // &aacute; &ccedil; &Otilde; &aring; ... : a letra com o acento.
  const m = e.match(/^([a-zA-Z])(acute|grave|circ|tilde|uml|cedil|ring)$/);
  return m ? (m[1] + ACENTOS[m[2]]).normalize('NFC') : todo;
});

const atributos = (t) => {
  const a = {};
  for (const m of String(t || '').matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    a[m[1].toLowerCase()] = desentidades(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return a;
};

// Endereço absoluto para a ligação do Word; âncoras, javascript: e endereços estragados ficam só como texto.
// Primeiro o href sozinho: uma base relativa (/pages/x) fazia rebentar também os endereços já completos.
const absoluto = (href, base) => {
  let h = String(href || '').trim();
  if (!h || h.startsWith('#') || /^(javascript|data|vbscript):/i.test(h)) return '';
  // Um número com espaços (tel:+351 21 000 00 00) deixa de abrir no Word.
  if (/^tel:/i.test(h)) h = h.replace(/\s+|%20/gi, '');
  const url = (...a) => { try { return new URL(...a); } catch { return null; } };
  const u = url(h) || (url(base || '') ? url(h, base) : null);
  return u && /^(https?|mailto|tel):$/.test(u.protocol) ? u.href : '';
};

const GENERICOS = new Set(['p', 'div', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav', 'figure', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'dl', 'dt', 'dd', 'pre', 'address', 'form', 'center']);
const BLOCOS = new Set([...GENERICOS, 'ul', 'ol', 'li', 'summary', 'details', 'blockquote', 'figcaption']);
const eBotao = (a) => /(^|\s)(wp-block-button__link|wp-element-button|button|btn|elementor-button)(\s|$)/i.test(a.class || '');

export function blocosDeHtml(html, { base = '' } = {}) {
  // Os auto-fechados (<svg/>) saem primeiro: senão o par ia até ao fecho de outro e comia o texto do meio.
  const limpo = String(html || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|template|svg|head|title|select|textarea)\b(?:[^>"']|"[^"]*"|'[^']*')*\/>/gi, '')
    .replace(/<(script|style|noscript|template|svg|head|title|select|textarea)\b[\s\S]*?<\/\1\s*>/gi, '');
  const blocos = [];
  let actual = null;
  let negrito = 0;
  let italico = 0;
  let pergunta = 0;
  let ligacao = '';
  let botao = null;
  let explicito = 0;
  let contaListas = 0;
  const listas = [];
  // Profundidade dos blocos, para um <a> sem </a> acabar no fim do bloco onde abriu e não levar o resto da página.
  let profundidade = 0;
  let nivelLigacao = 0;

  const fechar = () => {
    if (actual) {
      // Espaços como no browser: um só entre palavras, nenhum no início e no fim de cada parágrafo.
      const partes = [];
      let antesEspaco = true;
      for (const p of actual.partes) {
        if (p.quebra) { partes.push(p); antesEspaco = true; continue; }
        let t = p.texto.replace(/[ \t\n\r\f]+/g, ' ');
        if (antesEspaco) t = t.replace(/^ /, '');
        if (!t) continue;
        antesEspaco = t.endsWith(' ');
        partes.push({ ...p, texto: t });
      }
      while (partes.length && (partes.at(-1).quebra || !partes.at(-1).texto.trim())) partes.pop();
      while (partes.length && partes[0].quebra) partes.shift();
      if (partes.length) partes.at(-1).texto = partes.at(-1).texto.replace(/ $/, '');
      if (partes.some((p) => !p.quebra && p.texto.trim())) blocos.push({ ...actual, partes });
    }
    actual = null;
    explicito = 0;
  };
  const abrir = (tipo, extra = {}) => {
    fechar();
    actual = { tipo, partes: [], ...extra };
    explicito = 1;
  };
  const marcado = (rotulo, texto, marca) => {
    fechar();
    blocos.push({ tipo: 'paragrafo', marca, partes: [{ texto: `${rotulo} `, negrito: true }, { texto }] });
  };
  const fecharBotao = () => {
    if (!botao) return;
    const { texto: t, destino } = botao;
    botao = null;
    if (t.trim()) marcado('[Botão]', `${t.replace(/\s+/g, ' ').trim()} → ${destino || '(sem destino)'}`, 'botao');
  };
  const texto = (t) => {
    if (botao) { botao.texto += t; return; }
    if (!actual) {
      if (!t.trim()) return;
      actual = listas.length ? { tipo: 'item', nivel: listas.length - 1, ordenada: listas.at(-1).ordenada, lista: listas.at(-1).id, partes: [] } : { tipo: 'paragrafo', partes: [] };
    }
    actual.partes.push({ texto: t, negrito: negrito > 0 || pergunta > 0, italico: italico > 0, ligacao });
  };

  for (const m of limpo.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)|</g)) {
    if (m[4] !== undefined || m[0] === '<') { texto(desentidades(m[4] ?? '<')); continue; }
    const fim = m[1] === '/';
    const tag = m[2].toLowerCase();
    const a = fim ? {} : atributos(m[3]);
    if (BLOCOS.has(tag) || /^h[1-6]$/.test(tag)) {
      // Um botão não leva blocos dentro: se aparece um, o <a> ficou por fechar.
      fecharBotao();
      profundidade = fim ? Math.max(0, profundidade - 1) : profundidade + 1;
      if (ligacao && profundidade < nivelLigacao) ligacao = '';
    }
    if (/^h[1-6]$/.test(tag)) {
      if (fim) fechar(); else abrir('titulo', { nivel: Number(tag[1]) });
    } else if (tag === 'ul' || tag === 'ol') {
      fechar();
      if (fim) listas.pop(); else listas.push({ ordenada: tag === 'ol', id: ++contaListas });
    } else if (tag === 'li') {
      if (fim) fechar();
      else abrir('item', { nivel: Math.max(0, listas.length - 1), ordenada: !!listas.at(-1)?.ordenada, lista: listas.at(-1)?.id || 0 });
    } else if (tag === 'summary') {
      // A pergunta de uma pergunta frequente (blocos do WordPress e acordeões): a negrito, com a resposta a seguir.
      if (fim) { pergunta = Math.max(0, pergunta - 1); fechar(); } else { abrir('paragrafo', { marca: 'pergunta' }); pergunta++; }
    } else if (tag === 'details') {
      fechar();
    } else if (tag === 'blockquote' || tag === 'figcaption' || tag === 'cite') {
      if (tag !== 'cite') fechar();
      italico += fim ? -1 : 1;
      italico = Math.max(0, italico);
    } else if (tag === 'strong' || tag === 'b') {
      negrito = Math.max(0, negrito + (fim ? -1 : 1));
    } else if (tag === 'em' || tag === 'i') {
      italico = Math.max(0, italico + (fim ? -1 : 1));
    } else if (tag === 'br') {
      if (botao) botao.texto += ' ';
      else if (actual) actual.partes.push({ quebra: true });
    } else if (tag === 'a') {
      if (fim) {
        fecharBotao();
        ligacao = '';
      } else if (eBotao(a)) {
        fechar();
        fecharBotao();
        botao = { destino: (a.href || '').trim(), texto: '' };
      } else {
        fecharBotao();
        ligacao = absoluto(a.href, base);
        nivelLigacao = profundidade;
      }
    } else if (tag === 'img' && !fim) {
      // O fundo de uma capa (wp:cover) é decoração: o texto alternativo das fotografias é que se valida.
      if (/wp-block-cover__image-background/.test(a.class || '')) continue;
      marcado('[Imagem]', a.alt?.trim() || 'sem texto alternativo', 'imagem');
    } else if ((tag === 'iframe' || tag === 'video') && !fim) {
      marcado('[Incorporado]', a.src || a.title || '', 'incorporado');
    } else if (tag === 'hr') {
      fechar();
    } else if (GENERICOS.has(tag)) {
      // Dentro de um item de lista, de um título ou de uma pergunta, um <p> é uma linha nova do mesmo parágrafo.
      if (explicito && actual && (actual.tipo !== 'paragrafo' || actual.marca === 'pergunta')) {
        if (actual.partes.some((p) => !p.quebra && p.texto.trim()) && !actual.partes.at(-1).quebra) actual.partes.push({ quebra: true });
      } else fechar();
    }
  }
  fecharBotao();
  fechar();
  return blocos;
}

export const textoDe = (partes) => partes.map((p) => (p.quebra ? '\n' : p.texto)).join('');
