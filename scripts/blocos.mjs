// Peças em blocos nativos do WordPress (Gutenberg), para sites sem Elementor. Os mesmos nomes e opções das peças
// de scripts/elementor.mjs, para a página se escrever da mesma maneira; grava-se com criar-pagina-blocos.mjs.
// Cada peça devolve o código do bloco, igual ao que o editor do WordPress grava, para abrir sem avisos de bloco inválido.
// Alinhamentos no formato antigo (textAlign, align), que as versões novas do WordPress convertem sozinhas e as antigas exigem.
// O desenho que os blocos não têm (letras da marca, ícones, tamanhos de telemóvel, perguntas em caixa, o css de cada peça)
// vai num só bloco de estilo no topo da página, gerado por estiloDaPagina(), com classes wa-* em cada bloco.
// O editor mostra a página sem esse estilo; a pré-visualização mostra-a como fica.
// Os títulos seguem o estilo de cada nível em "titulos" no marca.json (ver titulos-estilo.mjs), como no Elementor.
import { readFileSync, existsSync } from 'node:fs';
import { raiz, pasta } from './wp.mjs';
import { titulosDaMarca, validarChamada } from './titulos-estilo.mjs';

const ficheiroMarca = pasta && existsSync(`${pasta}/marca.json`) ? `${pasta}/marca.json` : `${raiz}/scripts/modelo/marca.json`;
export const marca = JSON.parse(readFileSync(ficheiroMarca, 'utf8').replace(/^\uFEFF/, ''));
const T = titulosDaMarca(marca, ficheiroMarca.replace(/^.*[/\\](clientes|scripts)[/\\]/, '$1/'));
const C = marca.cores;
const DESTAQUE = C.destaque || C.acento;
const BORDA = '#E3E8E8';

// Como o WordPress escreve os atributos no comentário do bloco.
const atributos = (a) => JSON.stringify(a)
  .replace(/--/g, '\\u002d\\u002d').replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\\"/g, '\\u0022');
const bloco = (nome, a, html) => `<!-- wp:${nome}${a && Object.keys(a).length ? ` ${atributos(a)}` : ''} -->\n${html}\n<!-- /wp:${nome} -->`;
const css = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${k}:${v}`).join(';');
const classes = (...l) => l.filter(Boolean).join(' ');
const attrHtml = (nome, v) => (v ? ` ${nome}="${v}"` : '');
const esc = (t) => String(t).replace(/"/g, '&quot;');
// No telemóvel, como no Elementor: os títulos descem até 64% (nunca abaixo de 20 px), o texto perde 2 px (nunca abaixo de 15).
const fluido = (t, minimo = 20) => (t > minimo + 4 ? `clamp(${Math.max(minimo, Math.round(t * 0.64))}px, ${(t / 14.4).toFixed(2)}vw, ${t}px)` : `${t}px`);
const fluidoTexto = (t) => (t > 15 ? `clamp(${Math.max(15, t - 2)}px, ${(t / 14.4).toFixed(2)}vw, ${t}px)` : `${t}px`);
// Com o tamanho de telemóvel ou de tablet escritos no marca.json: o mínimo é o do telemóvel, e a letra chega ao de
// tablet aos 1024 px de largura.
const fluidoTitulo = (e) => {
  if (e.tablet === undefined && e.telemovel === undefined) return e.nivel === 'rotulo' ? `${e.tamanho}px` : fluido(e.tamanho);
  const minimo = e.telemovel ?? (e.nivel === 'rotulo' ? e.tamanho : Math.max(20, Math.round(e.tamanho * 0.64)));
  if (minimo >= e.tamanho) return `${e.tamanho}px`;
  return `clamp(${minimo}px, ${(e.tablet ? e.tablet / 10.24 : e.tamanho / 14.4).toFixed(2)}vw, ${e.tamanho}px)`;
};
const sobreAlinhar = { left: 'left', center: 'center', right: 'right' };

// O estilo da página: regras por classe, para computador e para telemóvel, e os ícones a desenhar.
// No globalThis: no Windows, o ficheiro da página e o criar-pagina-blocos.mjs podem chegar a este módulo por caminhos
// escritos de maneira diferente (c:\ e C:\) e ter cada um a sua cópia; assim partilham o mesmo estilo.
const E = (globalThis.__estiloBlocos ??= { regras: new Map(), icones: new Map(), conta: 0, avisouExtra: false });
E.familias ??= new Set();
const { regras, icones } = E;
const regra = (seletor, comp = '', tel = '') => { if (comp || tel) regras.set(seletor, { comp, tel }); };
// css e cssTelemovel: o equivalente ao extra do Elementor, em propriedades de CSS ({ 'letter-spacing': '-1px' }).
const declaracoes = (o) => Object.entries(o || {}).map(([k, v]) => {
  if (!/^-?[a-z][a-z-]*$/.test(k) || /[{}<>;\\]/.test(String(v))) throw new Error(`css inválido: ${k}: ${v}`);
  return `${k}:${v} !important`;
}).join(';');
const proprio = (o = {}) => {
  if (o.extra && !E.avisouExtra) { E.avisouExtra = true; console.warn('  Aviso: o extra é do Elementor e nos blocos não faz nada. Usar css: { propriedade: valor } (e cssTelemovel).'); }
  if (!o.css && !o.cssTelemovel) return '';
  const c = `wa-${++E.conta}`;
  regra(`.${c}`, declaracoes(o.css), declaracoes(o.cssTelemovel));
  return c;
};
const icone = (nome) => {
  const m = String(nome || '').match(/^(fas|far|fab|fa-solid|fa-regular|fa-brands)\s+fa-([a-z0-9-]+)$/);
  if (!m) return '';
  const lib = { fas: 'solid', 'fa-solid': 'solid', far: 'regular', 'fa-regular': 'regular', fab: 'brands', 'fa-brands': 'brands' }[m[1]];
  const c = `wa-ic-${lib[0]}-${m[2]}`;
  icones.set(c, [lib, m[2]]);
  return c;
};

// O que o estilo de um título acrescenta aos blocos: a letra (se não for a da marca), o espaço entre letras, as
// maiúsculas e o itálico, nos atributos do bloco e no style, como o editor os grava.
const familiaDe = (e, base) => {
  if (!e.familia || e.familia === base || !/^[\w ]+$/.test(e.familia)) return '';
  const c = `wa-f-${e.familia.toLowerCase().replace(/ +/g, '-')}`;
  E.familias.add(e.familia);
  regra(`.${c}`, `font-family:'${e.familia}', sans-serif`);
  return c;
};
const tipografiaDe = (e) => ({
  ...(e.espacamento !== undefined ? { letterSpacing: `${e.espacamento}px` } : {}),
  ...(e.maiusculas !== undefined ? { textTransform: e.maiusculas ? 'uppercase' : 'none' } : {}),
  ...(e.italico !== undefined ? { fontStyle: e.italico ? 'italic' : 'normal' } : {}),
});
const cssDe = (tp) => ({ 'letter-spacing': tp.letterSpacing, 'text-transform': tp.textTransform, 'font-style': tp.fontStyle });
// As palavras em <em>: o estilo vai no próprio <em>; o degradê, que precisa de CSS que o WordPress não deixa num
// atributo, vai no bloco de estilo, e sem ele fica a primeira cor.
const destacar = (t, e) => {
  if (e.destaque?.estilo !== 'degrade') return T.destacar(t, e);
  const c = `wa-dg-${e.destaque.cor.slice(1)}-${e.destaque.cor2.slice(1)}`.toLowerCase();
  regra(`.${c}`, `background:linear-gradient(90deg,${e.destaque.cor},${e.destaque.cor2});-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent`);
  return T.destacar(t, e, c);
};

// daPeca: os valores próprios de uma peça (o título das caixas com ícone), por baixo do marca.json.
const cabecalho = (t, nivel, { alinhar = 'left', ...o } = {}, daPeca = {}) => {
  validarChamada(o, `titulo(..., '${nivel}')`);
  // Um "título" p (os números grandes) é um parágrafo.
  if (!/^h[1-6]$/.test(nivel)) {
    const { cor = C.principal, tamanho = 38, peso, ...resto } = o;
    return texto(t, { cor, tamanho, alinhar, peso: peso || 700, letra: 'titulos', ...resto });
  }
  const e = T.estilo(nivel, o, daPeca);
  const fonte = fluidoTitulo(e);
  const tp = tipografiaDe(e);
  const extra = classes('wa-t', nivel === 'h1' && 'wa-h1', familiaDe(e, marca.tipografia?.titulos), o.icone, proprio(o));
  const a = {
    ...(alinhar !== 'left' ? { textAlign: alinhar } : {}),
    ...(nivel !== 'h2' ? { level: Number(nivel[1]) } : {}),
    className: extra,
    style: { typography: { fontSize: fonte, fontWeight: e.peso, lineHeight: String(e.altura), ...tp }, color: { text: e.cor } },
  };
  return bloco('heading', a, `<${nivel} class="${classes('wp-block-heading', alinhar !== 'left' && `has-text-align-${alinhar}`, extra, 'has-text-color')}" style="${css({ color: e.cor, 'font-size': fonte, 'font-weight': e.peso, 'line-height': a.style.typography.lineHeight, ...cssDe(tp) })}">${destacar(t, e)}</${nivel}>`);
};

// Opções de estilo (todas opcionais, por cima do marca.json): cor, tamanho, tablet, telemovel, peso, familia, altura,
// espacamento, maiusculas, italico e destaque (como saem as palavras em <em>: 'cor', 'sublinhado', 'marcador', 'degrade').
export const titulo = (t, nivel, o = {}) => cabecalho(t, nivel, o);

// Rótulo: a etiqueta pequena por cima de um título ("TRATAMENTOS"), num parágrafo, como no Elementor.
export const rotulo = (t, { alinhar = 'left', ...o } = {}) => {
  validarChamada(o, 'rotulo(...)');
  const e = T.estilo('rotulo', o);
  const fonte = fluidoTitulo(e);
  const tp = { fontSize: fonte, lineHeight: String(e.altura), fontWeight: e.peso, ...tipografiaDe(e) };
  const extra = classes(familiaDe(e, marca.tipografia?.corpo) || 'wa-c', 'wa-rotulo', proprio(o));
  const a = { ...(alinhar !== 'left' ? { align: alinhar } : {}), className: extra, style: { typography: tp, color: { text: e.cor } } };
  return bloco('paragraph', a, `<p class="${classes(alinhar !== 'left' && `has-text-align-${alinhar}`, extra, 'has-text-color')}" style="${css({ color: e.cor, 'font-size': fonte, 'font-weight': e.peso, 'line-height': tp.lineHeight, ...cssDe(tp) })}">${t}</p>`);
};

// Um ou mais parágrafos: '<p>um</p><p>dois</p>' dá dois blocos.
export const texto = (html, { cor = C.texto, tamanho = 17, alinhar = 'left', peso, letra = 'corpo', ...o } = {}) => {
  const partes = String(html).trim().startsWith('<p') ? [...String(html).matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1]) : [html];
  const fonte = letra === 'titulos' ? fluido(tamanho) : fluidoTexto(tamanho);
  const extra = classes(letra === 'titulos' ? 'wa-t' : 'wa-c', proprio(o));
  return partes.map((conteudo) => {
    const tipografia = { fontSize: fonte, lineHeight: '1.65', ...(peso ? { fontWeight: String(peso) } : {}) };
    const a = { ...(alinhar !== 'left' ? { align: alinhar } : {}), className: extra, style: { typography: tipografia, color: { text: cor } } };
    return bloco('paragraph', a, `<p class="${classes(alinhar !== 'left' && `has-text-align-${alinhar}`, extra, 'has-text-color')}" style="${css({ color: cor, 'font-size': fonte, 'font-weight': tipografia.fontWeight, 'line-height': '1.65' })}">${conteudo}</p>`);
  }).join('\n\n');
};

// Os botões juntam-se sozinhos num grupo de botões (core/buttons) quando ficam lado a lado. No telemóvel ocupam a largura toda.
export const botao = (etiqueta, destino, { invertido = false, contorno = false, raio = 8, fundo, cor, ...o } = {}) => {
  const bg = contorno ? undefined : fundo || (invertido ? '#FFFFFF' : C.acento);
  const tx = cor || (contorno ? (invertido ? '#FFFFFF' : C.principal) : invertido ? C.principal : C.texto_sobre_acento);
  const extra = classes(contorno && 'is-style-outline', 'wa-b', proprio(o));
  const a = {
    className: extra,
    style: { color: { ...(bg ? { background: bg } : {}), text: tx }, border: { radius: `${raio}px` }, typography: { textDecoration: 'none' } },
  };
  const link = `<a class="${classes('wp-block-button__link', 'has-text-color', bg && 'has-background', 'wp-element-button')}"${attrHtml('href', esc(destino))} style="${css({ 'border-radius': `${raio}px`, color: tx, 'background-color': bg, 'text-decoration': 'none' })}">${etiqueta}</a>`;
  return bloco('button', a, `<div class="${classes('wp-block-button', extra)}">${link}</div>`);
};
const eBotao = (h) => h.startsWith('<!-- wp:button ');
const botoes = (lista, alinhar = 'left') => bloco('buttons', { layout: { type: 'flex', ...(alinhar !== 'left' ? { justifyContent: alinhar } : {}) } }, `<div class="wp-block-buttons">${lista.join('\n\n')}</div>`);
// Botões soltos numa secção ou coluna passam a um grupo de botões.
const juntar = (filhos, alinhar) => {
  const fora = [];
  for (const f of filhos.flat().filter(Boolean)) {
    if (eBotao(f) && Array.isArray(fora.at(-1))) fora.at(-1).push(f);
    else fora.push(eBotao(f) ? [f] : f);
  }
  return fora.map((f) => (Array.isArray(f) ? botoes(f, alinhar) : f)).join('\n\n');
};

// altura: fixa a altura em px e recorta a imagem (cartões lado a lado ficam alinhados); largura em %.
export const imagem = (url, alt, { raio = 12, altura, largura, ...o } = {}) => {
  let medida = '';
  if (altura || largura) {
    medida = `wa-im-${altura || 0}-${largura || 100}`;
    regra(`.${medida} img`, css({ height: altura && `${altura}px !important`, 'object-fit': altura && 'cover', width: largura && `${largura}% !important` }), altura ? `height:${Math.round(altura * 0.8)}px !important` : '');
  }
  const extra = classes('wa-img', medida, proprio(o));
  const a = { className: extra, ...(raio ? { style: { border: { radius: `${raio}px` } } } : {}) };
  return bloco('image', a, `<figure class="${classes('wp-block-image', extra, raio && 'has-custom-border')}"><img src="${esc(url)}" alt="${esc(alt)}"${raio ? ` style="border-radius:${raio}px"` : ''}/></figure>`);
};

// Com um visto na cor de destaque, como a lista de ícones do Elementor.
export const lista = (itens, { cor = C.texto, ...o } = {}) => {
  icone('fas fa-check');
  const extra = classes('wa-lista', proprio(o));
  const li = itens.map((i) => bloco('list-item', {}, `<li>${i}</li>`)).join('\n');
  return bloco('list', { className: extra, style: { color: { text: cor } } }, `<ul class="${classes('wp-block-list', extra, 'has-text-color')}" style="color:${cor}">${li}</ul>`);
};

const grupo = (filhos, { fundo, raio, borda, padding, sombra, align, largura, alinhar, alturaMinima, classe } = {}) => {
  const estilo = {
    ...(fundo ? { color: { background: fundo } } : {}),
    ...(padding ? { spacing: { padding: { top: `${padding[0]}px`, right: `${padding[1]}px`, bottom: `${padding[2]}px`, left: `${padding[3]}px` } } } : {}),
    ...(raio || borda ? { border: { ...(raio ? { radius: `${raio}px` } : {}), ...(borda ? { width: '1px', color: borda } : {}) } } : {}),
    ...(sombra ? { shadow: '0 12px 32px rgba(16,24,40,0.10)' } : {}),
    ...(alturaMinima ? { dimensions: { minHeight: `${alturaMinima}px` } } : {}),
  };
  const a = {
    ...(align ? { align } : {}),
    ...(classe ? { className: classe } : {}),
    ...(Object.keys(estilo).length ? { style: estilo } : {}),
    layout: { type: 'constrained', ...(largura ? { contentSize: `${largura}px` } : {}) },
  };
  const s = css({
    'border-color': borda, 'border-width': borda ? '1px' : undefined, 'border-radius': raio ? `${raio}px` : undefined,
    'min-height': alturaMinima ? `${alturaMinima}px` : undefined,
    'background-color': fundo,
    ...(padding ? { 'padding-top': `${padding[0]}px`, 'padding-right': `${padding[1]}px`, 'padding-bottom': `${padding[2]}px`, 'padding-left': `${padding[3]}px` } : {}),
    'box-shadow': estilo.shadow,
  });
  return bloco('group', a, `<div class="${classes('wp-block-group', align && `align${align}`, classe, borda && 'has-border-color', fundo && 'has-background')}"${s ? ` style="${s}"` : ''}>${juntar(filhos, alinhar)}</div>`);
};

// No telemóvel, o espaço em cima e em baixo desce para 60% e os lados para 20 px, como no Elementor.
const espacoTelemovel = (topo, base) => {
  const c = `wa-s-${topo}-${base}`;
  regra(`.${c}`, '', `padding:${Math.round(topo * 0.6)}px 20px ${Math.round(base * 0.6)}px !important`);
  return c;
};

// imagemFundo: uma fotografia a cobrir a secção (core/cover), com a sobreposicao ('rgba(0,0,0,0.45)') por cima.
export const seccao = (filhos, { fundo = '#FFFFFF', topo = 96, base = 96, alinhar, estreita = false, largura, imagemFundo, sobreposicao, alturaMinima, ...o } = {}) => {
  const conteudo = estreita ? 760 : largura || 1140;
  const al = sobreAlinhar[alinhar === 'center' ? 'center' : 'left'];
  let classe = classes('wa-s', espacoTelemovel(topo, base), proprio(o));
  if (!imagemFundo) return grupo(filhos, { fundo, padding: [topo, 24, base, 24], align: 'full', largura: conteudo, alinhar: al, alturaMinima, classe });
  if (alturaMinima) {
    regra(`.wa-ah-${alturaMinima}`, '', `min-height:${Math.round(alturaMinima * 0.75)}px !important`);
    classe = classes(classe, `wa-ah-${alturaMinima}`);
  }
  const m = String(sobreposicao || 'rgba(0,0,0,0.5)').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  const hex = m ? `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}` : '#000000';
  const dim = Math.round((m && m[4] !== undefined ? Number(m[4]) : 0.5) * 10) * 10;
  const a = {
    url: imagemFundo, dimRatio: dim, customOverlayColor: hex, isUserOverlayColor: true,
    ...(alturaMinima ? { minHeight: alturaMinima, minHeightUnit: 'px' } : {}),
    align: 'full',
    className: classe,
    style: { spacing: { padding: { top: `${topo}px`, right: '24px', bottom: `${base}px`, left: '24px' } } },
    layout: { type: 'constrained', contentSize: `${conteudo}px` },
  };
  const s = css({ 'padding-top': `${topo}px`, 'padding-right': '24px', 'padding-bottom': `${base}px`, 'padding-left': '24px', 'min-height': alturaMinima ? `${alturaMinima}px` : undefined });
  const fundoImg = `<img class="wp-block-cover__image-background" alt="" src="${esc(imagemFundo)}" data-object-fit="cover"/>`;
  const veu = `<span aria-hidden="true" class="${classes('wp-block-cover__background', dim !== 50 && dim !== 0 && `has-background-dim-${dim}`, dim !== 0 && 'has-background-dim')}" style="background-color:${hex}"></span>`;
  return bloco('cover', a, `<div class="${classes('wp-block-cover', 'alignfull', classe)}" style="${s}">${fundoImg}${veu}<div class="wp-block-cover__inner-container">${juntar(filhos, al)}</div></div>`);
};

// Uma linha de colunas. Botões lado a lado ficam num grupo de botões; o resto, cada um na sua coluna.
export const linha = (filhos, { alinhar, espacamento, ...o } = {}) => {
  const l = filhos.flat().filter(Boolean);
  if (l.every(eBotao)) return botoes(l);
  const largura = `${Math.floor(10000 / l.length) / 100}%`;
  // O núcleo do WordPress força align-items:normal nas colunas: o alinhamento ao centro vai também em cada coluna,
  // como o editor faz.
  const centrar = (c) => (alinhar === 'center' ? c.replace(/^<!-- wp:column \{([^}]*)\} -->\n<div class="wp-block-column"/, '<!-- wp:column {"verticalAlignment":"center",$1} -->\n<div class="wp-block-column is-vertically-aligned-center"') : c);
  const colunas = l.map((f) => centrar(f.startsWith('<!-- wp:column ') || f.startsWith('<!-- wp:column\n') ? f : coluna([f], parseFloat(largura))));
  let extra = proprio(o);
  if (espacamento !== undefined) {
    regra(`.wa-g-${espacamento}`, `gap:${espacamento}px !important`);
    extra = classes(`wa-g-${espacamento}`, extra);
  }
  const a = { ...(alinhar === 'center' ? { verticalAlignment: 'center' } : {}), ...(extra ? { className: extra } : {}) };
  return bloco('columns', a, `<div class="${classes('wp-block-columns', alinhar === 'center' && 'are-vertically-aligned-center', extra)}">${colunas.join('\n\n')}</div>`);
};

export const coluna = (filhos, largura = 48) => {
  const w = `${largura}%`;
  return bloco('column', { width: w }, `<div class="wp-block-column" style="flex-basis:${w}">${juntar(filhos)}</div>`);
};

export const cartao = (filhos, { fundo = C.claro, borda, raio = 16, sombra = false, ...o } = {}) =>
  grupo(filhos, { fundo, borda, raio, padding: [28, 28, 28, 28], sombra, classe: classes('wa-cartao', proprio(o)) });

export const citacao = (frase, { cor = C.principal, ...o } = {}) => {
  const extra = classes('wa-citacao', proprio(o));
  return bloco('quote', { className: extra }, `<blockquote class="${classes('wp-block-quote', extra)}">${texto(frase, { cor, tamanho: 20 })}</blockquote>`);
};

export const numero = (valor, legenda, { cor = DESTAQUE, corLegenda = C.texto } = {}) =>
  grupo([texto(valor, { cor, tamanho: 44, peso: 700, letra: 'titulos' }), texto(legenda, { cor: corLegenda, tamanho: 14 })], { classe: 'wa-numero' });

// O ícone (os nomes do Font Awesome, como no Elementor: 'fas fa-check') vai por cima do título, na cor de destaque.
// O título da caixa é um h3: com um h3 no marca.json fica igual aos outros h3; sem ele, 21 px como sempre.
export const caixaIcone = (nome, t, desc, { alinhar, ...o } = {}) =>
  grupo([cabecalho(t, 'h3', { alinhar: alinhar || 'left', icone: icone(nome) }, { tamanho: 21, peso: 700 }), texto(desc, { tamanho: 16, alinhar: alinhar || 'left' })], { classe: classes('wa-caixa', proprio(o)) });

// Perguntas que abrem e fecham (core/details), em caixas, com a marcação FAQPage para o Google.
export const perguntas = (lista) => {
  const itens = lista.map(([p, r]) => bloco('details', { className: 'wa-faq' }, `<details class="wp-block-details wa-faq"><summary>${p}</summary>${texto(r, { tamanho: 16 })}</details>`));
  const ld = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: lista.map(([q, r]) => ({ '@type': 'Question', name: q.replace(/<[^>]+>/g, ''), acceptedAnswer: { '@type': 'Answer', text: r.replace(/<[^>]+>/g, '') } })),
  };
  return [...itens, bloco('html', {}, `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`)].join('\n\n');
};

// Os ícones vêm do Font Awesome gratuito (os nomes do Elementor são da versão 5) e entram no estilo como imagem,
// para o site do cliente não ficar a depender de outro servidor.
const FA = ['https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/svgs', 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/svgs'];
async function desenho(lib, nome) {
  for (const base of FA) {
    try {
      const r = await fetch(`${base}/${lib}/${nome}.svg`, { signal: AbortSignal.timeout(8000) });
      const svg = r.ok ? await r.text() : '';
      if (svg.includes('<svg')) return `url("data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}")`;
    } catch {}
  }
  return '';
}
const familia = (f) => (f && /^[\w ]+$/.test(f) ? `'${f}', sans-serif` : '');

// O bloco de estilo da página, com o que as peças usaram. Devolve { bloco, avisos }.
export async function estiloDaPagina() {
  const avisos = [];
  const F = marca.tipografia || {};
  const T = familia(F.titulos);
  const Cp = familia(F.corpo);
  const nomes = [...new Set([F.titulos, F.corpo, ...E.familias].filter((f) => f && /^[\w ]+$/.test(f)))];
  // Os pesos de sempre, mais os que os títulos do marca.json pedirem (800, por exemplo).
  const pesos = [...new Set([300, 400, 500, 600, 700, ...Object.values(marca.titulos || {}).flatMap((n) => [n?.peso, n?.destaque?.peso]).filter(Boolean).map(Number)])].sort((a, b) => a - b).join(';');
  const letras = nomes.length ? `@import url('https://fonts.googleapis.com/css2?${nomes.map((f) => `family=${f.replace(/ /g, '+')}:wght@${pesos}`).join('&')}&display=swap');` : '';
  const mascara = (url) => `-webkit-mask:${url} center/contain no-repeat;mask:${url} center/contain no-repeat`;
  const desenhos = {};
  for (const [c, [lib, nome]] of icones) {
    desenhos[c] = await desenho(lib, nome);
    if (!desenhos[c]) avisos.push(`o ícone ${nome} não foi encontrado no Font Awesome gratuito: sai sem ícone`);
  }
  const base = [
    T && `.wa-t{font-family:${T}}`,
    Cp && `.wa-c,.wa-lista,.wa-faq,.wa-b .wp-block-button__link{font-family:${Cp}}`,
    '.wa-b .wp-block-button__link{padding:18px 36px;font-size:16px;font-weight:600;line-height:1.2;transition:filter .15s}',
    '.wa-b .wp-block-button__link:hover{filter:brightness(.94)}',
    '.wa-b.is-style-outline .wp-block-button__link{border:2px solid currentColor;padding:16px 34px}',
    '.wa-img img{width:100%;height:auto;display:block}',
    '.wa-lista{list-style:none;padding-left:0}',
    '.wa-lista li{position:relative;padding-left:30px;margin:0 0 14px;font-size:17px;line-height:1.5}',
    desenhos['wa-ic-s-check'] && `.wa-lista li::before{content:"";position:absolute;left:0;top:.3em;width:16px;height:16px;background:${DESTAQUE};${mascara(desenhos['wa-ic-s-check'])}}`,
    `.wa-citacao{border-left:4px solid ${DESTAQUE};padding:4px 0 4px 24px;font-style:normal;quotes:none}`,
    '.wa-citacao::before,.wa-citacao::after{content:none}',
    '.wa-numero{display:flex;flex-direction:column;gap:4px}',
    '.wa-numero>*{margin:0 !important}',
    '.wa-numero>p:first-child{line-height:1.1 !important}',
    '.wa-caixa .wa-t{margin-top:0}',
    ...Object.entries(desenhos).filter(([, u]) => u).map(([c, u]) => `.${c}::before{content:"";display:block;width:32px;height:32px;margin:0 0 14px;background:${DESTAQUE};${mascara(u)}}`),
    '.wa-t.has-text-align-center::before{margin-left:auto;margin-right:auto}',
    `.wa-faq{border:1px solid ${BORDA};border-radius:8px;padding:0;margin-top:0 !important;margin-bottom:12px !important;background:#FFFFFF}`,
    `.wa-faq>summary{cursor:pointer;list-style:none;padding:16px 20px;font-weight:600;font-size:18px;color:${C.principal};display:flex;justify-content:space-between;align-items:center;gap:16px${T ? `;font-family:${T}` : ''}}`,
    '.wa-faq>summary::-webkit-details-marker{display:none}',
    `.wa-faq>summary::after{content:"+";font-weight:400;font-size:24px;line-height:1;color:${DESTAQUE}}`,
    '.wa-faq[open]>summary::after{content:"\\2212"}',
    '.wa-faq>:not(summary){padding:0 20px 16px;margin:0}',
    // Com um h1 no conteúdo, o título que o tema põe por cima esconde-se (só nesta página), e com ele o espaço que o
    // tema lhe dava, para a primeira secção encostar ao cabeçalho como numa página do Elementor.
    'body:has(.wa-h1) :is(h1.entry-title,.page-header .entry-title,h1.page-title,h1.wp-block-post-title){display:none !important}',
    'body:has(.wa-h1) main:has(.wa-h1),body:has(.wa-h1) .wp-block-group:has(>h1.wp-block-post-title){margin-top:0 !important;padding-top:0 !important}',
    'body:has(.wa-h1) :is(.entry-content,.page-content,.wp-block-post-content)>.wa-s:first-of-type{margin-top:0 !important}',
    // Secções seguidas encostam umas às outras, sem a faixa branca que alguns temas põem entre blocos.
    '.wa-s+.wa-s{margin-top:0 !important}',
  ].filter(Boolean);
  const comp = [...regras].filter(([, r]) => r.comp).map(([s, r]) => `${s}{${r.comp}}`);
  const tel = [
    '.wa-cartao{padding:20px !important}',
    '.wp-block-buttons>.wa-b{flex:1 1 100%}',
    '.wa-b .wp-block-button__link{width:100%;box-sizing:border-box}',
    ...[...regras].filter(([, r]) => r.tel).map(([s, r]) => `${s}{${r.tel}}`),
  ];
  const estilo = [letras, ...base, ...comp, `@media (max-width:767px){${tel.join('')}}`].filter(Boolean).join('\n');
  return { bloco: bloco('html', {}, `<style id="wa-estilo">\n${estilo}\n</style>`), avisos };
}
