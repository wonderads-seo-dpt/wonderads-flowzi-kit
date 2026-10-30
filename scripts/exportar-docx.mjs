// Gera um .docx só com o conteúdo de uma página (títulos, textos, botões, listas, perguntas, imagens),
// para o cliente validar o texto antes de se publicar. Não fala com o WordPress: lê o ficheiro da página.
// O documento fica em clientes/<cliente>/validacao/<slug>-DD-MM-AAAA.docx. O que está entre [ ] sai a amarelo.
// Leva o logótipo e as cores da Wonder Ads (scripts/docx/), iguais para todos os clientes.
// uso: node scripts/exportar-docx.mjs clientes/<cliente>/paginas/<slug>.mjs
import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { exigirCliente, ficheiroDoCliente, pasta, cliente, raiz } from './wp.mjs';
import { nomeComercial } from './clientes.mjs';

// Cores da Wonder Ads nas entregas ao cliente.
const COR = { azul: '343ED7', roxo: '783DF5', magenta: 'C535C9', texto: '1F2230', cinza: '5C6070' };
const LOGO = `${raiz}/scripts/docx/wonderads-logo.png`;

exigirCliente();
const ficheiro = process.argv[2];
if (!ficheiro) {
  console.error('uso: node scripts/exportar-docx.mjs clientes/<cliente>/paginas/<slug>.mjs');
  process.exit(1);
}
const caminho = ficheiroDoCliente(ficheiro);
const p = (await import(pathToFileURL(caminho).href)).default || {};
if (!p.titulo || !Array.isArray(p.elementos)) {
  console.error('O ficheiro tem de fazer export default { titulo, slug, elementos }.');
  process.exit(1);
}
const slug = p.slug || basename(caminho, '.mjs');

// ---------- conteúdo ----------

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const entidades = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»', euro: '€' };
const descodificar = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  return entidades[e.toLowerCase()] ?? m;
});

// Um parágrafo é { estilo, runs: [{ t, b, i, cinza, br }] }.
const paragrafos = [];
const par = (estilo, runs) => { if (runs.some((r) => r.br || r.t.trim())) paragrafos.push({ estilo, runs }); };
const simples = (t, extra = {}) => [{ t: String(t ?? ''), ...extra }];

function deHtml(html, estiloBase = null) {
  let runs = [];
  let estilo = estiloBase;
  let b = 0, i = 0;
  const fechar = () => {
    while (runs.length && runs[runs.length - 1].br) runs.pop();
    if (runs.length) runs[0] = { ...runs[0], t: runs[0].t.replace(/^\s+/, '') };
    par(estilo, runs);
    runs = []; estilo = estiloBase;
  };
  for (const m of String(html ?? '').matchAll(/<(\/?)([a-z0-9]+)[^>]*>|[^<]+/gi)) {
    const [todo, fecho, tag = ''] = m;
    const t = tag.toLowerCase();
    if (!tag) {
      const texto = descodificar(todo).replace(/\s+/g, ' ');
      if (texto.trim() || runs.length) runs.push({ t: texto, b: b > 0, i: i > 0 });
    } else if (['p', 'div', 'blockquote'].includes(t)) fechar();
    else if (/^h[1-6]$/.test(t)) { fechar(); if (!fecho) estilo = `Titulo${Math.min(3, Number(t[1]))}`; }
    else if (t === 'li') { fechar(); if (!fecho) estilo = 'Lista'; }
    else if (t === 'ul' || t === 'ol') fechar();
    else if (t === 'br') runs.push({ t: '', br: true });
    else if (t === 'strong' || t === 'b') b += fecho ? -1 : 1;
    else if (t === 'em' || t === 'i') i += fecho ? -1 : 1;
  }
  fechar();
}

let numSeccao = 0;
function percorrer(el, nivel) {
  if (el.elType === 'container' || el.elType === 'section' || el.elType === 'column') {
    if (nivel === 0) par('Seccao', simples(`Secção ${++numSeccao}`));
    for (const f of el.elements || []) percorrer(f, nivel + 1);
    return;
  }
  const s = el.settings || {};
  switch (el.widgetType) {
    case 'heading': {
      const n = /^h([1-3])$/.exec(s.header_size || 'h2');
      if (n) par(`Titulo${n[1]}`, simples(descodificar(s.title)));
      else par(null, simples(descodificar(s.title), { b: true }));
      break;
    }
    case 'text-editor': deHtml(s.editor); break;
    case 'button': par(null, [{ t: 'Botão: ', cinza: true }, { t: descodificar(s.text), b: true }, { t: s.link?.url ? `  →  ${s.link.url}` : '', cinza: true }]); break;
    case 'icon-list': for (const it of s.icon_list || []) par('Lista', simples(descodificar(it.text))); break;
    case 'icon-box': {
      const n = /^h([1-3])$/.exec(s.title_size || 'h3');
      par(n ? `Titulo${n[1]}` : null, simples(descodificar(s.title_text), { b: !n }));
      deHtml(s.description_text);
      break;
    }
    case 'accordion':
    case 'toggle':
      for (const t of s.tabs || []) { par(null, simples(descodificar(t.tab_title), { b: true })); deHtml(t.tab_content); }
      break;
    case 'image': par(null, [{ t: 'Imagem: ', cinza: true }, { t: s.image?.alt || '[sem texto alternativo]', i: true }]); break;
    case 'divider': case 'spacer': break;
    default:
      // Widgets sem peça própria: aproveita o texto que tiverem.
      if (s.title) par(null, simples(descodificar(s.title), { b: true }));
      if (s.editor) deHtml(s.editor);
      else if (s.text) par(null, simples(descodificar(s.text)));
      if (s.description_text) deHtml(s.description_text);
  }
}

const hoje = new Date();
const dois = (n) => String(n).padStart(2, '0');
const data = `${dois(hoje.getDate())}/${dois(hoje.getMonth() + 1)}/${hoje.getFullYear()}`;
const registo = caminho.replace(/\.mjs$/, '.wp.json');
let idWp = '';
try { if (existsSync(registo)) idWp = JSON.stringify(JSON.parse(readFileSync(registo, 'utf8'))).match(/"id"\s*:\s*(\d+)/)?.[1] || ''; } catch { /* sem registo */ }

const temLogo = existsSync(LOGO);
if (temLogo) paragrafos.push({ estilo: 'Logo', runs: [{ t: '', logo: true }] });
par('Etiqueta', simples('Proposta de conteúdo · para aprovação do cliente'));
par('Titulo', simples(p.titulo));
par('Meta', simples(`${nomeComercial(cliente)} · ${p.tipo === 'artigo' ? 'Artigo de blog' : 'Página'} · endereço previsto /${slug}/${idWp ? ` · n.º ${idWp} no WordPress` : ''} · ${data}`));
par('Nota', simples('Documento para validar o conteúdo. O desenho final está no site e não aparece aqui. O que está a amarelo ainda está por confirmar.'));
p.elementos.forEach((e) => percorrer(e, 0));
if (p.resumo) { par('Seccao', simples('Resumo do artigo')); par(null, simples(p.resumo)); }

// ---------- docx ----------

function runXml(r) {
  if (r.br) return '<w:r><w:br/></w:r>';
  // Logótipo: 4,9 x 1,8 cm, como no modelo de entrega.
  if (r.logo) return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="1866900" cy="695325"/><wp:docPr id="1" name="Wonder Ads"/>'
    + '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="wonderads-logo.png"/><pic:cNvPicPr/></pic:nvPicPr>'
    + '<pic:blipFill><a:blip r:embed="rLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1866900" cy="695325"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  // O que está entre [ ] fica a amarelo, para saltar à vista na validação.
  return r.t.split(/(\[[^\]]*\])/).filter(Boolean).map((pedaco) => {
    const props = [r.b && '<w:b/>', r.i && '<w:i/>', r.cinza && `<w:color w:val="${COR.cinza}"/>`, /^\[.*\]$/.test(pedaco) && '<w:highlight w:val="yellow"/>'].filter(Boolean).join('');
    return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${xml(pedaco)}</w:t></w:r>`;
  }).join('');
}
const corpo = paragrafos.map(({ estilo, runs }) =>
  `<w:p>${estilo ? `<w:pPr><w:pStyle w:val="${estilo}"/>${estilo === 'Lista' ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : ''}</w:pPr>` : ''}${runs.map(runXml).join('')}</w:p>`).join('');

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const WD = `${W} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"`;
const estiloPar = (id, nome, ppr, rpr) => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${nome}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr>${ppr}</w:pPr><w:rPr>${rpr}</w:rPr></w:style>`;
const partes = {
  '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`,
  '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>${temLogo ? '<Relationship Id="rLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/wonderads-logo.png"/>' : ''}</Relationships>`,
  'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${WD}><w:body>${corpo}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`,
  'word/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/><w:color w:val="${COR.texto}"/><w:sz w:val="22"/><w:lang w:val="pt-PT"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="288" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>`
    + `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>`
    + estiloPar('Logo', 'Logo', '<w:spacing w:after="160"/>', '')
    + estiloPar('Etiqueta', 'Etiqueta', '<w:spacing w:after="60"/>', `<w:b/><w:caps/><w:color w:val="${COR.magenta}"/><w:sz w:val="16"/>`)
    + estiloPar('Titulo', 'Title', '<w:spacing w:after="60"/>', `<w:b/><w:color w:val="${COR.azul}"/><w:sz w:val="36"/>`)
    + estiloPar('Meta', 'Meta', '<w:spacing w:after="40"/>', `<w:color w:val="${COR.cinza}"/><w:sz w:val="19"/>`)
    + estiloPar('Nota', 'Nota', '<w:spacing w:after="200"/>', `<w:i/><w:color w:val="${COR.cinza}"/><w:sz w:val="18"/>`)
    + estiloPar('Seccao', 'Secção', '<w:keepNext/><w:spacing w:before="360" w:after="60"/>', `<w:b/><w:caps/><w:color w:val="${COR.roxo}"/><w:sz w:val="16"/>`)
    + estiloPar('Titulo1', 'heading 1', '<w:keepNext/><w:spacing w:before="260" w:after="180"/><w:outlineLvl w:val="0"/>', `<w:b/><w:color w:val="${COR.azul}"/><w:sz w:val="34"/>`)
    + estiloPar('Titulo2', 'heading 2', `<w:keepNext/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="6" w:color="${COR.magenta}"/></w:pBdr><w:spacing w:before="320" w:after="140"/><w:outlineLvl w:val="1"/>`, `<w:b/><w:color w:val="${COR.azul}"/><w:sz w:val="27"/>`)
    + estiloPar('Titulo3', 'heading 3', '<w:keepNext/><w:spacing w:before="220" w:after="100"/><w:outlineLvl w:val="2"/>', `<w:b/><w:color w:val="${COR.roxo}"/><w:sz w:val="23"/>`)
    + estiloPar('Lista', 'List Bullet', '<w:spacing w:after="90"/><w:ind w:left="720" w:hanging="360"/>', '')
    + '</w:styles>',
  'word/numbering.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ${W}><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:rPr><w:color w:val="${COR.roxo}"/></w:rPr><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`,
};
if (temLogo) partes['word/media/wonderads-logo.png'] = readFileSync(LOGO);

// Zip sem compressão: o Word aceita, e assim o kit não precisa de bibliotecas.
const tabelaCrc = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xFFFFFFFF; for (const byte of buf) c = tabelaCrc[(c ^ byte) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(ficheiros) {
  const locais = [], centrais = [];
  let desvio = 0;
  for (const [nome, conteudo] of Object.entries(ficheiros)) {
    const n = Buffer.from(nome, 'utf8'), d = Buffer.isBuffer(conteudo) ? conteudo : Buffer.from(conteudo, 'utf8'), crc = crc32(d);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(d.length, 18); local.writeUInt32LE(d.length, 22); local.writeUInt16LE(n.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(d.length, 20); central.writeUInt32LE(d.length, 24); central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE(desvio, 42);
    locais.push(local, n, d); centrais.push(central, n);
    desvio += 30 + n.length + d.length;
  }
  const dir = Buffer.concat(centrais), fim = Buffer.alloc(22);
  const total = Object.keys(ficheiros).length;
  fim.writeUInt32LE(0x06054b50, 0); fim.writeUInt16LE(total, 8); fim.writeUInt16LE(total, 10);
  fim.writeUInt32LE(dir.length, 12); fim.writeUInt32LE(desvio, 16);
  return Buffer.concat([...locais, dir, fim]);
}

const destino = `${pasta}/validacao`;
mkdirSync(destino, { recursive: true });
const saida = `${destino}/${slug}-${data.replace(/\//g, '-')}.docx`;
try {
  writeFileSync(saida, zip(partes));
} catch (e) {
  if (e.code === 'EBUSY' || e.code === 'EPERM') {
    console.error(`\n  O ficheiro ${basename(saida)} está aberto no Word. Fechar e voltar a correr.\n`);
    process.exit(1);
  }
  throw e;
}

// Cópia para o Google Drive: se o cliente tiver drive.json com a pasta sincronizada pelo Google Drive
// para computador, o documento vai também para lá. O Drive trata do envio; o kit não guarda credenciais.
let noDrive = '';
const configDrive = `${pasta}/drive.json`;
if (existsSync(configDrive)) {
  let pastaDrive = '';
  try { pastaDrive = JSON.parse(readFileSync(configDrive, 'utf8').replace(/^﻿/, '')).pasta || ''; } catch { /* lido abaixo */ }
  if (!pastaDrive) noDrive = `não copiado: drive.json sem "pasta"`;
  else if (!existsSync(pastaDrive)) noDrive = `não copiado: a pasta ${pastaDrive} não existe (o Google Drive está aberto?)`;
  else {
    try { copyFileSync(saida, join(pastaDrive, basename(saida))); noDrive = join(pastaDrive, basename(saida)); }
    catch (e) { noDrive = e.code === 'EBUSY' || e.code === 'EPERM' ? 'não copiado: o ficheiro está aberto no Word, fechar e voltar a correr' : `não copiado: ${e.message}`; }
  }
}

const porConfirmar =paragrafos.reduce((a, q) => a + q.runs.reduce((b, r) => b + (r.t?.match(/\[[^\]]*\]/g)?.length || 0), 0), 0);
console.log(`
  documento       clientes/${cliente}/validacao/${basename(saida)}
  secções         ${numSeccao}
  parágrafos      ${paragrafos.length}
  por confirmar   ${porConfirmar}${noDrive ? `\n  google drive    ${noDrive}` : ''}
`);
