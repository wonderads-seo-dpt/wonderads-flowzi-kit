// Peças em blocos nativos do WordPress (Gutenberg), para sites sem Elementor. Os mesmos nomes e opções das peças
// de scripts/elementor.mjs, para a página se escrever da mesma maneira; grava-se com criar-pagina-blocos.mjs.
// Cada peça devolve o código do bloco, igual ao que o editor do WordPress grava, para abrir sem avisos de bloco inválido
// (confirmado no editor a 16/10/2026: 51 blocos de 14 tipos, todos válidos). Alinhamentos no formato antigo (textAlign, align),
// que as versões novas do WordPress convertem sozinhas e as antigas exigem.
// Diferenças: as letras são as do tema; o alinhamento vai em cada peça (alinhar na secção só alinha os botões); não há valores só para telemóvel (as colunas empilham sozinhas e os tamanhos
// usam clamp); não há ícones (caixaIcone sai com título e texto).
import { readFileSync, existsSync } from 'node:fs';
import { raiz, pasta } from './wp.mjs';

const ficheiroMarca = pasta && existsSync(`${pasta}/marca.json`) ? `${pasta}/marca.json` : `${raiz}/scripts/modelo/marca.json`;
export const marca = JSON.parse(readFileSync(ficheiroMarca, 'utf8').replace(/^\uFEFF/, ''));
const C = marca.cores;
const DESTAQUE = C.destaque || C.acento;

// Como o WordPress escreve os atributos no comentário do bloco.
const atributos = (a) => JSON.stringify(a)
  .replace(/--/g, '\\u002d\\u002d').replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\\"/g, '\\u0022');
const bloco = (nome, a, html) => `<!-- wp:${nome}${a && Object.keys(a).length ? ` ${atributos(a)}` : ''} -->\n${html}\n<!-- /wp:${nome} -->`;
const css = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${k}:${v}`).join(';');
const classes = (...l) => l.filter(Boolean).join(' ');
const attrHtml = (nome, v) => (v ? ` ${nome}="${v}"` : '');
const esc = (t) => String(t).replace(/"/g, '&quot;');
// No telemóvel, o tamanho desce até 64% (como no Elementor), sem passar dos 20 px.
const fluido = (t, minimo = 20) => (t > minimo + 4 ? `clamp(${Math.max(minimo, Math.round(t * 0.64))}px, ${(t / 14.4).toFixed(2)}vw, ${t}px)` : `${t}px`);
const sobreAlinhar = { left: 'left', center: 'center', right: 'right' };

export const titulo = (t, nivel, { cor = C.principal, tamanho = 38, alinhar = 'left', peso } = {}) => {
  // Um "título" p (os números grandes) é um parágrafo.
  if (!/^h[1-6]$/.test(nivel)) return texto(t, { cor, tamanho, alinhar, peso: peso || 700 });
  const fonte = fluido(tamanho);
  const p = String(peso || (['h1', 'h2'].includes(nivel) ? 700 : 600));
  const a = {
    ...(alinhar !== 'left' ? { textAlign: alinhar } : {}),
    ...(nivel !== 'h2' ? { level: Number(nivel[1]) } : {}),
    style: { typography: { fontSize: fonte, fontWeight: p, lineHeight: nivel === 'h1' ? '1.1' : '1.2' }, color: { text: cor } },
  };
  return bloco('heading', a, `<${nivel} class="${classes('wp-block-heading', alinhar !== 'left' && `has-text-align-${alinhar}`, 'has-text-color')}" style="${css({ color: cor, 'font-size': fonte, 'font-weight': p, 'line-height': a.style.typography.lineHeight })}">${t}</${nivel}>`);
};

// Um ou mais parágrafos: '<p>um</p><p>dois</p>' dá dois blocos.
export const texto = (html, { cor = C.texto, tamanho = 17, alinhar = 'left', peso } = {}) => {
  const partes = String(html).trim().startsWith('<p') ? [...String(html).matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1]) : [html];
  const fonte = fluido(tamanho, 15);
  return partes.map((conteudo) => {
    const tipografia = { fontSize: fonte, lineHeight: '1.65', ...(peso ? { fontWeight: String(peso) } : {}) };
    const a = { ...(alinhar !== 'left' ? { align: alinhar } : {}), style: { typography: tipografia, color: { text: cor } } };
    return bloco('paragraph', a, `<p class="${classes(alinhar !== 'left' && `has-text-align-${alinhar}`, 'has-text-color')}" style="${css({ color: cor, 'font-size': fonte, 'font-weight': tipografia.fontWeight, 'line-height': '1.65' })}">${conteudo}</p>`);
  }).join('\n\n');
};

// Os botões juntam-se sozinhos num grupo de botões (core/buttons) quando ficam lado a lado.
export const botao = (etiqueta, destino, { invertido = false, contorno = false, raio = 8, fundo, cor } = {}) => {
  const bg = contorno ? undefined : fundo || (invertido ? '#FFFFFF' : C.acento);
  const tx = cor || (contorno ? (invertido ? '#FFFFFF' : C.principal) : invertido ? C.principal : C.texto_sobre_acento);
  const a = {
    ...(contorno ? { className: 'is-style-outline' } : {}),
    style: { color: { ...(bg ? { background: bg } : {}), text: tx }, border: { radius: `${raio}px` }, typography: { textDecoration: 'none' } },
  };
  const link = `<a class="${classes('wp-block-button__link', 'has-text-color', bg && 'has-background', 'wp-element-button')}"${attrHtml('href', esc(destino))} style="${css({ 'border-radius': `${raio}px`, color: tx, 'background-color': bg, 'text-decoration': 'none' })}">${etiqueta}</a>`;
  return bloco('button', a, `<div class="${classes('wp-block-button', contorno && 'is-style-outline')}">${link}</div>`);
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

export const imagem = (url, alt, { raio = 12 } = {}) => {
  const a = raio ? { style: { border: { radius: `${raio}px` } } } : {};
  return bloco('image', a, `<figure class="${classes('wp-block-image', raio && 'has-custom-border')}"><img src="${esc(url)}" alt="${esc(alt)}"${raio ? ` style="border-radius:${raio}px"` : ''}/></figure>`);
};

export const lista = (itens, { cor = C.texto } = {}) => {
  const li = itens.map((i) => bloco('list-item', {}, `<li>${i}</li>`)).join('\n');
  return bloco('list', { style: { color: { text: cor } } }, `<ul class="wp-block-list has-text-color" style="color:${cor}">${li}</ul>`);
};

const grupo = (filhos, { fundo, raio, borda, padding, sombra, align, largura, alinhar, alturaMinima } = {}) => {
  const estilo = {
    ...(fundo ? { color: { background: fundo } } : {}),
    ...(padding ? { spacing: { padding: { top: `${padding[0]}px`, right: `${padding[1]}px`, bottom: `${padding[2]}px`, left: `${padding[3]}px` } } } : {}),
    ...(raio || borda ? { border: { ...(raio ? { radius: `${raio}px` } : {}), ...(borda ? { width: '1px', color: borda } : {}) } } : {}),
    ...(sombra ? { shadow: '0 12px 32px rgba(16,24,40,0.10)' } : {}),
    ...(alturaMinima ? { dimensions: { minHeight: `${alturaMinima}px` } } : {}),
  };
  const a = {
    ...(align ? { align } : {}),
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
  return bloco('group', a, `<div class="${classes('wp-block-group', align && `align${align}`, borda && 'has-border-color', fundo && 'has-background')}"${s ? ` style="${s}"` : ''}>${juntar(filhos, alinhar)}</div>`);
};

// imagemFundo: uma fotografia a cobrir a secção (core/cover), com a sobreposicao ('rgba(0,0,0,0.45)') por cima.
export const seccao = (filhos, { fundo = '#FFFFFF', topo = 96, base = 96, alinhar, estreita = false, largura, imagemFundo, sobreposicao, alturaMinima } = {}) => {
  const conteudo = estreita ? 760 : largura || 1140;
  const al = sobreAlinhar[alinhar === 'center' ? 'center' : 'left'];
  if (!imagemFundo) return grupo(filhos, { fundo, padding: [topo, 24, base, 24], align: 'full', largura: conteudo, alinhar: al, alturaMinima });
  const m = String(sobreposicao || 'rgba(0,0,0,0.5)').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  const hex = m ? `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}` : '#000000';
  const dim = Math.round((m && m[4] !== undefined ? Number(m[4]) : 0.5) * 10) * 10;
  const a = {
    url: imagemFundo, dimRatio: dim, customOverlayColor: hex, isUserOverlayColor: true,
    ...(alturaMinima ? { minHeight: alturaMinima, minHeightUnit: 'px' } : {}),
    align: 'full',
    style: { spacing: { padding: { top: `${topo}px`, right: '24px', bottom: `${base}px`, left: '24px' } } },
    layout: { type: 'constrained', contentSize: `${conteudo}px` },
  };
  const s = css({ 'padding-top': `${topo}px`, 'padding-right': '24px', 'padding-bottom': `${base}px`, 'padding-left': '24px', 'min-height': alturaMinima ? `${alturaMinima}px` : undefined });
  const fundoImg = `<img class="wp-block-cover__image-background" alt="" src="${esc(imagemFundo)}" data-object-fit="cover"/>`;
  const veu = `<span aria-hidden="true" class="${classes('wp-block-cover__background', dim !== 50 && dim !== 0 && `has-background-dim-${dim}`, dim !== 0 && 'has-background-dim')}" style="background-color:${hex}"></span>`;
  return bloco('cover', a, `<div class="wp-block-cover alignfull" style="${s}">${fundoImg}${veu}<div class="wp-block-cover__inner-container">${juntar(filhos, al)}</div></div>`);
};

// Uma linha de colunas. Botões lado a lado ficam num grupo de botões; o resto, cada um na sua coluna.
export const linha = (filhos, { alinhar } = {}) => {
  const l = filhos.flat().filter(Boolean);
  if (l.every(eBotao)) return botoes(l);
  const largura = `${Math.floor(10000 / l.length) / 100}%`;
  const colunas = l.map((f) => (f.startsWith('<!-- wp:column ') || f.startsWith('<!-- wp:column\n') ? f : coluna([f], parseFloat(largura))));
  const a = alinhar === 'center' ? { verticalAlignment: 'center' } : {};
  return bloco('columns', a, `<div class="${classes('wp-block-columns', alinhar === 'center' && 'are-vertically-aligned-center')}">${colunas.join('\n\n')}</div>`);
};

export const coluna = (filhos, largura = 48) => {
  const w = `${largura}%`;
  return bloco('column', { width: w }, `<div class="wp-block-column" style="flex-basis:${w}">${juntar(filhos)}</div>`);
};

export const cartao = (filhos, { fundo = C.claro, borda, raio = 16, sombra = false } = {}) =>
  grupo(filhos, { fundo, borda, raio, padding: [28, 28, 28, 28], sombra });

export const citacao = (frase, { cor = C.principal } = {}) =>
  bloco('quote', {}, `<blockquote class="wp-block-quote">${texto(frase, { cor, tamanho: 20 })}</blockquote>`);

export const numero = (valor, legenda, { cor = DESTAQUE, corLegenda = C.texto } = {}) =>
  grupo([texto(valor, { cor, tamanho: 44, peso: 700 }), texto(legenda, { cor: corLegenda, tamanho: 14 })], {});

// Sem ícones nativos nos blocos: fica o título e o texto (o ícone pedido não entra).
export const caixaIcone = (icone, t, desc, { alinhar } = {}) =>
  grupo([titulo(t, 'h3', { tamanho: 21, alinhar: alinhar || 'left' }), texto(desc, { tamanho: 16, alinhar: alinhar || 'left' })], {});

// Perguntas que abrem e fecham (core/details), com a marcação FAQPage para o Google.
export const perguntas = (lista) => {
  const itens = lista.map(([p, r]) => bloco('details', {}, `<details class="wp-block-details"><summary>${p}</summary>${texto(r, { tamanho: 16 })}</details>`));
  const ld = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: lista.map(([q, r]) => ({ '@type': 'Question', name: q.replace(/<[^>]+>/g, ''), acceptedAnswer: { '@type': 'Answer', text: r.replace(/<[^>]+>/g, '') } })),
  };
  return [...itens, bloco('html', {}, `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`)].join('\n\n');
};
