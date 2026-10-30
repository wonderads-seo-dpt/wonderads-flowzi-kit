// O estilo dos títulos de um cliente, um por nível, em "titulos" no marca.json (o /design grava lá o estilo aprovado).
// As peças de elementor.mjs e de blocos.mjs aplicam-no sozinhas a todos os títulos, e o titulos.mjs a uma página que
// já existe. Ganha o que vem na chamada da peça, depois o marca.json, depois os valores de sempre do kit: sem "titulos",
// as peças saem exactamente como antes.
//
//   "titulos": {
//     "estilo": "clinica-luz",                          de onde veio (opcional, só para se saber)
//     "h1": { "familia": "Playfair Display", "tamanho": 64, "tablet": 52, "telemovel": 36, "peso": 400, "cor": "#1D1D1D",
//             "altura": 1.1, "espacamento": -1, "maiusculas": false, "italico": false, "destaque": "marcador" },
//     "h2": { ... }, "h3": { ... },
//     "rotulo": { ... },                                a etiqueta pequena por cima dos títulos (peça rotulo)
//     "destaque": { "estilo": "sublinhado", "cor": "#1CA5A3" }      para h1, h2 e h3, se o nível não disser outro
//   }
// As palavras realçadas vão em <em> no texto do título: titulo('Sorrisos <em>saudáveis</em>', 'h1').

export const NIVEIS = ['h1', 'h2', 'h3', 'rotulo'];
const CAMPOS = ['familia', 'tamanho', 'tablet', 'telemovel', 'peso', 'cor', 'altura', 'espacamento', 'maiusculas', 'italico', 'destaque'];
const ESTILOS = ['cor', 'sublinhado', 'marcador', 'degrade'];
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const objecto = (x) => Boolean(x) && typeof x === 'object' && !Array.isArray(x);

// Cores e contraste, pela fórmula da WCAG.
function rgb(cor) {
  const s = String(cor ?? '').trim();
  const h = (s.match(/^#([0-9a-f]{3,8})$/i) || [])[1];
  if (h) {
    const seis = h.length < 6 ? [...h.slice(0, 3)].map((c) => c + c).join('') : h;
    return [0, 2, 4].map((i) => parseInt(seis.slice(i, i + 2), 16));
  }
  const m = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  return m ? m.slice(1, 4).map(Number) : null;
}
const luz = (c) => c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
export function contraste(a, b) {
  const x = rgb(a);
  const y = rgb(b);
  if (!x || !y) return null;
  const [l1, l2] = [luz(x), luz(y)].sort((m, n) => n - m);
  return (l1 + 0.05) / (l2 + 0.05);
}
// Um título de cor clara está sobre um fundo escuro (um herói com fotografia, uma secção escura).
export const clara = (cor) => { const c = contraste(cor, '#FFFFFF'); return c !== null && c < 2; };
const razao = (x) => `${x.toFixed(2).replace('.', ',')}:1`;

function validar(t, onde) {
  const erro = (campo, msg) => { throw new Error(`${onde}, em "titulos" → ${campo}: ${msg}`); };
  if (t === undefined) return;
  if (!objecto(t)) erro('titulos', 'tem de ser um objecto, por exemplo { "h2": { "tamanho": 40, "peso": 700 } }.');
  for (const [k, v] of Object.entries(t)) {
    if (k === 'estilo') { if (typeof v !== 'string') erro(k, 'é o nome do estilo de onde veio, em texto (por exemplo "clinica-luz").'); }
    else if (k === 'destaque') validarDestaque(v, k, erro);
    else if (!NIVEIS.includes(k)) erro(k, 'não conheço este nível. Os níveis são h1, h2, h3 e rotulo (e ainda destaque e estilo).');
    else if (!objecto(v)) erro(k, 'tem de ser um objecto, por exemplo { "tamanho": 40, "peso": 700 }.');
    else for (const [c, x] of Object.entries(v)) validarCampo(`${k}.${c}`, c, x, erro);
  }
}
const numero = (x, min, max) => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
const peso = (x) => /^[1-9]00$/.test(String(x)) && ['number', 'string'].includes(typeof x);
function validarCampo(onde, c, x, erro) {
  const v = JSON.stringify(x);
  if (c === 'familia') { if (typeof x !== 'string' || !/^[A-Za-z0-9 ]{2,60}$/.test(x)) erro(onde, `${v} não serve: o nome de uma Google Font, só com letras sem acentos, números e espaços (por exemplo "Playfair Display").`); }
  else if (['tamanho', 'tablet', 'telemovel'].includes(c)) { if (!numero(x, 8, 200)) erro(onde, `${v} não serve: um número de píxeis entre 8 e 200, sem "px" nem aspas (por exemplo 40).`); }
  else if (c === 'peso') { if (!peso(x)) erro(onde, `${v} não serve: 100, 200, 300 e assim até 900 (por exemplo 700).`); }
  else if (c === 'cor') { if (typeof x !== 'string' || !HEX.test(x)) erro(onde, `${v} não é uma cor em #hex (por exemplo "#1D1D1D").`); }
  else if (c === 'altura') { if (!numero(x, 0.8, 3)) erro(onde, `${v} não serve: a altura da linha em em, um número entre 0.8 e 3, com ponto e sem aspas (por exemplo 1.2).`); }
  else if (c === 'espacamento') { if (!numero(x, -10, 40)) erro(onde, `${v} não serve: o espaço entre letras em px, um número entre -10 e 40 (por exemplo -1 ou 2).`); }
  else if (c === 'maiusculas' || c === 'italico') { if (typeof x !== 'boolean') erro(onde, `${v} não serve: true ou false, sem aspas.`); }
  else if (c === 'destaque') validarDestaque(x, onde, erro);
  else erro(onde, `não conheço este campo. Os campos de cada nível são: ${CAMPOS.join(', ')}.`);
}
// A cor e o destaque de uma chamada (titulo, rotulo) vão parar ao estilo da página: validam-se como os do marca.json.
export function validarChamada(o = {}, onde = 'a chamada') {
  const erro = (campo, msg) => { throw new Error(`${onde}, opção ${campo}: ${msg}`); };
  for (const c of ['cor', 'destaque']) if (o[c] !== undefined && o[c] !== null) validarCampo(c, c, o[c], erro);
}
function validarDestaque(x, onde, erro) {
  if (x === false) return;
  const d = typeof x === 'string' ? { estilo: x } : x;
  if (!objecto(d)) erro(onde, `tem de ser ${ESTILOS.map((e) => `"${e}"`).join(', ')} ou false, ou por exemplo { "estilo": "marcador", "cor": "#FF8A8B" }.`);
  for (const [k, v] of Object.entries(d)) {
    if (k === 'estilo') { if (!ESTILOS.includes(v)) erro(`${onde}.estilo`, `${JSON.stringify(v)} não existe. Os estilos de destaque são ${ESTILOS.join(', ')}.`); }
    else if (k === 'cor' || k === 'cor2') { if (typeof v !== 'string' || !HEX.test(v)) erro(`${onde}.${k}`, `${JSON.stringify(v)} não é uma cor em #hex (por exemplo "#1CA5A3").`); }
    else if (k === 'peso') { if (!peso(v)) erro(`${onde}.peso`, `${JSON.stringify(v)} não serve: 100, 200, 300 e assim até 900.`); }
    else if (k === 'italico') { if (typeof v !== 'boolean') erro(`${onde}.italico`, `${JSON.stringify(v)} não serve: true ou false, sem aspas.`); }
    else erro(`${onde}.${k}`, 'não conheço este campo. O destaque leva estilo, cor, cor2 (a segunda cor do degradê), peso e italico.');
  }
}

// O sistema de títulos de uma marca. onde: o ficheiro, para as mensagens de erro (clientes/<cliente>/marca.json).
export function titulosDaMarca(marca = {}, onde = 'marca.json') {
  const t = marca.titulos;
  validar(t, onde);
  const C = marca.cores || {};
  const F = marca.tipografia || {};
  const DESTAQUE = C.destaque || C.acento;
  // Os valores de sempre do kit. O rótulo não tinha valores antes: letra pequena, espaçada, em maiúsculas.
  const doKit = (nivel) => (nivel === 'rotulo'
    ? { familia: F.corpo, tamanho: 14, peso: 600, cor: C.principal, altura: 1.4, espacamento: 2, maiusculas: true }
    : { familia: F.titulos, tamanho: 38, peso: ['h1', 'h2'].includes(nivel) ? 700 : 600, cor: C.principal, altura: nivel === 'h1' ? 1.1 : 1.2 });

  const destaque = (x) => {
    if (x === undefined || x === null || x === false) return null;
    const d = typeof x === 'string' ? { estilo: x } : { estilo: 'cor', ...x };
    if (!ESTILOS.includes(d.estilo)) throw new Error(`O destaque "${d.estilo}" não existe. Os estilos de destaque são ${ESTILOS.join(', ')}.`);
    const cor = d.cor || (d.estilo === 'marcador' ? C.acento : DESTAQUE);
    return { ...d, cor, cor2: d.cor2 || (C.acento && C.acento !== cor ? C.acento : C.principal) };
  };

  // O estilo de um nível (h1, h2, h3, rotulo; os outros ficam com os valores do kit).
  // opcoes: o que veio na chamada da peça. daPeca: os valores próprios da peça (por exemplo, o título das caixas com ícone).
  function estilo(nivel, opcoes = {}, daPeca = {}) {
    const chamada = {};
    for (const c of CAMPOS) if (opcoes[c] !== undefined && !(c === 'peso' && !opcoes[c])) chamada[c] = opcoes[c];
    const camadas = [doKit(nivel), daPeca, (t && t[nivel]) || {}, chamada];
    const e = Object.assign({}, ...camadas);
    // Os tamanhos de tablet e de telemóvel só ficam se vierem de onde veio o tamanho, ou de cima.
    const de = (c) => camadas.findLastIndex((x) => x[c] !== undefined);
    for (const c of ['tablet', 'telemovel']) if (de(c) < de('tamanho')) delete e[c];
    if (e.destaque === undefined && /^h[1-3]$/.test(nivel)) e.destaque = t?.destaque;
    e.destaque = destaque(e.destaque);
    e.peso = String(e.peso);
    e.nivel = nivel;
    e.daMarca = Boolean(t && t[nivel]);
    return e;
  }

  // Definições de tipografia do Elementor (heading: typography_, caixas com ícone: title_typography_).
  // completo: false dá só as que as caixas com ícone sempre tiveram.
  function elementor(e, prefixo = 'typography_', { completo = true } = {}) {
    const px = (v) => ({ unit: 'px', size: v, sizes: [] });
    const reduz = e.nivel !== 'rotulo';
    // Com "titulos", o tablet e o telemóvel nunca passam o computador; sem ele, sai como sempre saiu.
    const teto = (v) => (t && v !== undefined ? Math.min(v, e.tamanho) : v);
    const tablet = teto(e.tablet ?? (reduz ? Math.round(e.tamanho * 0.82) : undefined));
    const telemovel = teto(e.telemovel ?? (reduz ? Math.max(20, Math.round(e.tamanho * 0.64)) : undefined));
    return {
      [`${prefixo}typography`]: 'custom',
      [`${prefixo}font_family`]: e.familia,
      [`${prefixo}font_size`]: px(e.tamanho),
      ...(completo && tablet !== undefined ? { [`${prefixo}font_size_tablet`]: px(tablet) } : {}),
      ...(completo && telemovel !== undefined ? { [`${prefixo}font_size_mobile`]: px(telemovel) } : {}),
      [`${prefixo}font_weight`]: e.peso,
      ...(completo ? { [`${prefixo}line_height`]: { unit: 'em', size: e.altura, sizes: [] } } : {}),
      ...(e.espacamento !== undefined ? { [`${prefixo}letter_spacing`]: px(e.espacamento) } : {}),
      ...(e.maiusculas !== undefined ? { [`${prefixo}text_transform`]: e.maiusculas ? 'uppercase' : 'none' } : {}),
      ...(e.italico !== undefined ? { [`${prefixo}font_style`]: e.italico ? 'italic' : 'normal' } : {}),
    };
  }

  // O texto que melhor se lê sobre uma cor (o marcador por baixo de um título claro).
  const sobre = (fundo) => [C.texto_sobre_acento, C.principal, '#FFFFFF'].filter((c) => rgb(c))
    .sort((a, b) => contraste(b, fundo) - contraste(a, fundo))[0];

  // O estilo das palavras em <em>, só com o CSS que o WordPress deixa passar dentro de um título do Elementor
  // (o resto, como o degradê, é tirado ao mostrar a página). O degradê sai aqui na primeira cor.
  function cssDestaque(e) {
    const d = e.destaque;
    if (!d) return '';
    const s = [`font-style:${d.italico ? 'italic' : 'normal'}`, d.peso && `font-weight:${d.peso}`];
    if (d.estilo === 'sublinhado') s.push(`text-decoration:underline 0.08em ${d.cor}`);
    else if (d.estilo === 'marcador' && clara(e.cor)) s.push(`background:${d.cor}`, `color:${sobre(d.cor)}`, 'padding:0 0.12em');
    else if (d.estilo === 'marcador') s.push(`background:linear-gradient(180deg,rgba(0,0,0,0) 60%,${d.cor} 60%)`, 'padding:0 0.06em');
    else s.push(`color:${d.cor}`);
    return s.filter(Boolean).join(';');
  }
  // Dá o estilo do destaque a cada <em> do título. Sem destaque no estilo, o texto fica como veio.
  function destacar(html, e, classe = '') {
    if (!e.destaque || !/<em\b/i.test(String(html))) return html;
    return String(html).replace(/<em\b[^>]*>/gi, `<em class="${['wa-destaque', classe].filter(Boolean).join(' ')}" style="${cssDestaque(e)}">`);
  }

  // Avisos de contraste (sobre branco, onde ficam quase todos os títulos) e do degradê no Elementor.
  function avisos() {
    const l = [];
    if (!t) return l;
    for (const n of NIVEIS.filter((x) => t[x] || (t.destaque && x !== 'rotulo'))) {
      const e = estilo(n);
      const minimo = n === 'rotulo' ? 4.5 : 3;
      const c = contraste(e.cor, '#FFFFFF');
      if (c !== null && !clara(e.cor) && c < minimo) l.push(`${n}: a cor ${e.cor} tem ${razao(c)} sobre branco; ${n === 'rotulo' ? 'texto pequeno pede 4,5:1' : 'um título pede 3:1'}.`);
      const d = e.destaque;
      if (!d) continue;
      for (const k of { cor: ['cor'], degrade: ['cor', 'cor2'] }[d.estilo] || []) {
        const x = contraste(d[k], '#FFFFFF');
        if (x !== null && x < 3) l.push(`${n}: o destaque em ${d[k]} tem ${razao(x)} sobre branco; um título pede 3:1.`);
      }
      if (d.estilo === 'marcador' && !clara(e.cor) && (contraste(e.cor, d.cor) ?? 21) < 3) l.push(`${n}: o texto ${e.cor} sobre o marcador ${d.cor} tem ${razao(contraste(e.cor, d.cor))}; pede 3:1.`);
      if (d.estilo === 'degrade' && !l.some((a) => a.startsWith('degradê'))) l.push(`degradê: no Elementor gratuito o WordPress tira o CSS que o faz, e as palavras realçadas saem na primeira cor (${d.cor}). Nos blocos do WordPress sai em degradê.`);
    }
    return l;
  }

  return { estilo, elementor, destacar, cssDestaque, avisos, definidos: t ? NIVEIS.filter((n) => t[n]) : [], titulos: t };
}

// Ler os títulos de uma página que já existe, para ver quantos estilos há em cada nível (titulos.mjs e rever.mjs).
const medida = (v, base = 'px') => {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v !== 'object') return Number.isFinite(Number(v)) ? Number(v) : String(v);
  if (v.size === '' || v.size === undefined || v.size === null) return undefined;
  const n = Number(v.size);
  return !v.unit || v.unit === base ? n : `${n} ${v.unit}`;
};
const corDe = (c) => (c ? String(c).toUpperCase() : undefined);
// Como saem as palavras em <em> de um título, nos nomes do marca.json (marcador #FF8A8B, sublinhado #1CA5A3, ...).
const estiloEm = (html) => {
  const m = String(html || '').match(/<em\b([^>]*)>/i);
  if (!m) return undefined;
  const s = (m[1].match(/\bstyle="([^"]*)"/i) || [])[1] || '';
  const dg = m[1].match(/\bwa-dg-([0-9a-f]+)-([0-9a-f]+)/i);
  const cor = (re) => ((s.match(re) || [])[1] || '').toUpperCase();
  const nome = dg ? `degradê #${dg[1].toUpperCase()} → #${dg[2].toUpperCase()}`
    : /text-decoration:\s*underline/i.test(s) ? `sublinhado ${cor(/underline[^;]*?(#[0-9a-f]{3,8})/i)}`
      : /linear-gradient/i.test(s) ? `marcador ${cor(/(#[0-9a-f]{3,8})\s+\d+%\)/i)}`
        : /background(-color)?:\s*#/i.test(s) ? `marcador cheio ${cor(/background(?:-color)?:\s*(#[0-9a-f]{3,8})/i)}`
          : /(^|;)\s*color:/i.test(s) ? `cor ${cor(/(?:^|;)\s*color:\s*(#[0-9a-f]{3,8})/i)}`
            : s ? `outro (${s})` : 'itálico';
  const extra = [/font-style:\s*italic/i.test(s) && !/^itálico$/.test(nome) && 'itálico', (s.match(/font-weight:\s*(\d+)/i) || [])[1] && `peso ${s.match(/font-weight:\s*(\d+)/i)[1]}`].filter(Boolean);
  return [nome.trim(), ...extra].join(', ');
};
const limpo = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ''));

// O estilo de um widget do Elementor, nos nomes do marca.json.
export function lerEstiloElementor(s = {}, prefixo = 'typography_', html = '') {
  const g = s.__globals__ || {};
  const p = (k) => s[`${prefixo}${k}`];
  const e = {};
  const tipoGlobal = g[`${prefixo}typography`];
  if (tipoGlobal) e.global = `tipografia global ${String(tipoGlobal).replace(/^.*id=/, '')}`;
  else if (p('typography') === 'custom') {
    Object.assign(e, {
      familia: p('font_family'),
      tamanho: medida(p('font_size')), tablet: medida(p('font_size_tablet')), telemovel: medida(p('font_size_mobile')),
      peso: p('font_weight') ? String(p('font_weight')) : undefined,
      altura: medida(p('line_height'), 'em'),
      espacamento: medida(p('letter_spacing')),
      maiusculas: p('text_transform') === 'uppercase' ? true : ['', 'none', undefined].includes(p('text_transform')) ? undefined : p('text_transform'),
      italico: p('font_style') === 'italic' ? true : undefined,
    });
  }
  e.cor = g.title_color ? `cor global ${String(g.title_color).replace(/^.*id=/, '')}` : corDe(s.title_color);
  const efeitos = [s.text_shadow_text_shadow_type === 'yes' && 'sombra', s.text_stroke_text_stroke_type === 'yes' && 'contorno', s.blend_mode && 'mistura'].filter(Boolean);
  if (efeitos.length) e.efeitos = efeitos.join(', ');
  e.destaque = estiloEm(html);
  return limpo(e);
}

// Os títulos de uma página Elementor: headings h1 a h6, rótulos do kit e os títulos das caixas com ícone ou imagem.
export function titulosElementor(elementos = []) {
  const lista = [];
  const andar = (els, seccao) => els.forEach((el, i) => {
    const s = seccao ?? i + 1;
    if (el.elType === 'widget') {
      const st = el.settings || {};
      let nivel = '';
      let prefixo = 'typography_';
      let campo = 'title';
      if (el.widgetType === 'heading') nivel = /(^|\s)wa-rotulo(\s|$)/.test(st._css_classes || '') ? 'rotulo' : st.header_size || 'h2';
      else if (['icon-box', 'image-box'].includes(el.widgetType)) { nivel = st.title_size || 'h3'; prefixo = 'title_typography_'; campo = 'title_text'; }
      if ((nivel === 'rotulo' || /^h[1-6]$/.test(nivel)) && st[campo]) {
        lista.push({ nivel, texto: String(st[campo]).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), seccao: s, widget: el, prefixo, campo, estilo: lerEstiloElementor(st, prefixo, st[campo]) });
      }
    }
    andar(el.elements || [], s);
  });
  andar(elementos);
  return lista;
}

// Os títulos de uma página em blocos do WordPress (o conteúdo em bruto).
export function titulosBlocos(conteudo = '') {
  const lista = [];
  let seccao = 0;
  for (const m of String(conteudo).matchAll(/<!-- wp:(heading|paragraph|group|cover)(?:\s+(\{[\s\S]*?\}))?\s+(\/)?-->([\s\S]*?)(?=<!-- \/?wp:)/g)) {
    let a = {};
    try { a = m[2] ? JSON.parse(m[2]) : {}; } catch {}
    if (/(^|\s)wa-s(\s|$)/.test(a.className || '') || (a.align === 'full' && ['group', 'cover'].includes(m[1]))) seccao++;
    const rotulo = m[1] === 'paragraph' && /(^|\s)wa-rotulo(\s|$)/.test(a.className || '');
    if (m[1] !== 'heading' && !rotulo) continue;
    const tp = a.style?.typography || {};
    const familia = (String(a.className || '').match(/\bwa-f-[\w-]+/) || [])[0] || (a.fontFamily ? `letra do tema ${a.fontFamily}` : undefined);
    lista.push({
      nivel: rotulo ? 'rotulo' : `h${a.level || 2}`,
      texto: m[4].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
      seccao: Math.max(seccao, 1),
      estilo: limpo({
        familia, tamanho: tp.fontSize || (a.fontSize ? `tamanho do tema ${a.fontSize}` : undefined), peso: tp.fontWeight, altura: tp.lineHeight,
        espacamento: tp.letterSpacing, maiusculas: tp.textTransform === 'uppercase' ? true : undefined, italico: tp.fontStyle === 'italic' ? true : undefined,
        cor: a.style?.color?.text ? corDe(a.style.color.text) : a.textColor ? `cor do tema ${a.textColor}` : undefined,
        destaque: estiloEm(m[4]),
      }),
    });
  }
  return lista;
}

// Uma cor global do Elementor (ou do tema, nos blocos) não se sabe qual é: pode ser o branco de um título sobre fundo
// escuro. Compara-se sem ela, como a de um título claro.
export const corGlobal = (cor) => /^cor (global|do tema) /.test(String(cor ?? ''));
const semCor = (cor) => clara(cor) || corGlobal(cor);
// A assinatura de um estilo: dois títulos com a mesma assinatura vêem-se iguais. Fora dela ficam a cor de um título
// claro (está sobre fundo escuro e fica com a sua cor), uma cor global e o destaque, que se compara à parte (nem todos têm <em>).
export const assinatura = (e) => {
  const { destaque, cor, ...resto } = e;
  return JSON.stringify(semCor(cor) ? resto : { ...resto, cor });
};
const destaqueBase = (d) => d.replace(/^marcador cheio/, 'marcador');

// Os estilos de cada nível, na ordem h1, h2, ..., rotulo:
// [{ nivel, estilos: [{ assinatura, estilo, titulos, claros, globais }], destaques: ['marcador #FF8A8B', ...] }]
export function variantes(titulos) {
  const niveis = new Map();
  // Primeiro os títulos com cor conhecida; um título claro ou de cor global junta-se ao estilo que só difere dele na cor.
  const ordenados = [...titulos].sort((a, b) => semCor(a.estilo.cor) - semCor(b.estilo.cor));
  for (const x of ordenados) {
    if (!niveis.has(x.nivel)) niveis.set(x.nivel, { estilos: new Map(), destaques: new Set() });
    const n = niveis.get(x.nivel);
    let a = assinatura(x.estilo);
    if (semCor(x.estilo.cor)) a = [...n.estilos.keys()].find((k) => assinatura({ ...JSON.parse(k), cor: '#FFFFFF' }) === a) || a;
    if (!n.estilos.has(a)) n.estilos.set(a, { assinatura: a, estilo: undefined, titulos: [], claros: 0, globais: 0 });
    const v = n.estilos.get(a);
    v.titulos.push(x);
    if (clara(x.estilo.cor)) v.claros++;
    else if (corGlobal(x.estilo.cor)) v.globais++;
    else if (!v.estilo) v.estilo = { ...x.estilo };
    if (x.estilo.destaque) n.destaques.add(destaqueBase(x.estilo.destaque));
  }
  const ordem = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'rotulo'];
  return [...niveis].sort(([a], [b]) => ordem.indexOf(a) - ordem.indexOf(b)).map(([nivel, n]) => ({
    nivel,
    estilos: [...n.estilos.values()].map((v) => ({ ...v, titulos: v.titulos.sort((a, b) => titulos.indexOf(a) - titulos.indexOf(b)), estilo: v.estilo || { ...v.titulos[0].estilo } }))
      .map((v) => { delete v.estilo.destaque; return v; }).sort((a, b) => b.titulos.length - a.titulos.length),
    destaques: [...n.destaques],
  }));
}

// Uma linha legível com o estilo, nos nomes do marca.json.
export function descrever(e) {
  const un = (v, u) => (typeof v === 'number' ? `${v} ${u}` : v);
  const p = [];
  if (e.global) p.push(e.global);
  if (e.familia) p.push(e.familia);
  if (e.tamanho !== undefined) {
    const r = [e.tablet !== undefined && `tablet ${un(e.tablet, 'px')}`, e.telemovel !== undefined && `telemóvel ${un(e.telemovel, 'px')}`].filter(Boolean);
    p.push(`${un(e.tamanho, 'px')}${r.length ? ` (${r.join(', ')})` : ''}`);
  }
  if (e.peso) p.push(`peso ${e.peso}`);
  if (e.cor) p.push(clara(e.cor) ? `${e.cor} (clara, sobre fundo escuro)` : e.cor);
  if (e.altura !== undefined) p.push(`altura ${un(e.altura, 'em')}`);
  if (e.espacamento !== undefined) p.push(`entre letras ${un(e.espacamento, 'px')}`);
  if (e.maiusculas) p.push(e.maiusculas === true ? 'maiúsculas' : String(e.maiusculas));
  if (e.italico) p.push('itálico');
  if (e.efeitos) p.push(`efeitos: ${e.efeitos}`);
  if (e.destaque) p.push(`destaque: ${e.destaque}`);
  return p.join(' · ') || 'sem estilo próprio (o do tema)';
}
