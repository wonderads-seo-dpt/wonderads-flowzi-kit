// Páginas da Shopify com o desenho dentro da própria página. As peças são as das páginas em blocos do WordPress
// (scripts/blocos.mjs), com os mesmos nomes e opções, para uma página se escrever da mesma maneira nos dois sítios.
// O kit não mexe no tema (a app só tem write_content e write_files), por isso o desenho vai no corpo da página:
// o HTML dos blocos sem os comentários do WordPress, e um <style> fechado em #wa-pagina com o que o núcleo do
// WordPress daria (colunas, capa, botões, imagens), o estilo das peças e o que desliga o .rte do tema.
// Nada de <script>: o HTML passa por uma lista fechada de etiquetas e atributos, e o css por uma de valores.
import { estiloDaPagina, marca } from './blocos.mjs';

// Todas as peças do blocos.mjs, com os mesmos nomes (seccao, linha, coluna, titulo, texto, botao, imagem, lista, cartao,
// citacao, numero, caixaIcone, perguntas e as que lá se juntarem) e a marca.
export * from './blocos.mjs';

const RAIZ = '#wa-pagina';
const C = marca.cores || {};
const CORPO = /^[\w ]+$/.test(marca.tipografia?.corpo || '') ? `'${marca.tipografia.corpo}', sans-serif` : 'inherit';

// Ligações: https, http, mailto:, tel:, caminhos da loja (/...) e âncoras (#...). Nada de javascript:, data: nem //outro-site.
export const ligacaoSegura = (u) => /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d\s()-]+|\/(?![/\\])[^\s]*|#[\w-]*)$/i.test(String(u));
// Nos endereços, das entidades só passa &amp;: outra podia esconder um javascript: ou um //. Um & solto (?a=1&b=2) serve.
const lerEndereco = (v) => {
  if (/&(?!amp;)[a-z0-9#]+;/i.test(v)) throw new Error(`Endereço recusado: ${v}. Escrever o endereço sem entidades HTML (o & sozinho serve).`);
  return v.replace(/&amp;/g, '&');
};
// O alt sobe para os Ficheiros da Shopify em texto simples, sem o &quot; do atributo.
const textoDoAtributo = (v) => String(v).replace(/&(quot|apos|lt|gt|amp|#\d+|#x[0-9a-f]+);/gi, (m, e) => {
  const nomes = { quot: '"', apos: "'", lt: '<', gt: '>', amp: '&' };
  if (e[0] !== '#') return nomes[e.toLowerCase()];
  const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1));
  return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
});

// css: só valores simples. Imagens no css só os ícones do kit (svg embutido) ou ficheiros que já estão na Shopify;
// uma fotografia de fundo vai em seccao({ imagemFundo }), que sobe para a loja.
function declaracoesSeguras(texto, onde) {
  const t = String(texto);
  if (/[<>]|expression\s*\(|javascript:|vbscript:|-moz-binding|behaviou?r\s*:|@import/i.test(t)) throw new Error(`css recusado em ${onde}: ${t.slice(0, 120)}`);
  for (const [, url] of t.matchAll(/url\(\s*([^)]*)\)/gi)) {
    const u = url.trim().replace(/^["']|["']$/g, '');
    if (!/^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/.test(u) && !/^https:\/\/cdn\.shopify\.com\/[^\s"'()\\]+$/.test(u)) {
      throw new Error(`css recusado em ${onde}: url(${u.slice(0, 80)}). Uma fotografia de fundo vai em seccao({ imagemFundo: 'imagens/...' }).`);
    }
  }
  return t;
}

// Parte o css em regras e at-rules do nível de cima, respeitando aspas e parênteses (os url() e o @import das letras têm ";").
function partirCss(css) {
  const itens = [];
  let i = 0;
  const n = css.length;
  while (i < n) {
    while (i < n && /\s/.test(css[i])) i++;
    if (css.startsWith('/*', i)) { const f = css.indexOf('*/', i + 2); i = f < 0 ? n : f + 2; continue; }
    if (i >= n) break;
    let j = i;
    let aspa = '';
    let parenteses = 0;
    for (; j < n; j++) {
      const c = css[j];
      if (aspa) { if (c === '\\') j++; else if (c === aspa) aspa = ''; continue; }
      if (c === '"' || c === "'") aspa = c;
      else if (c === '(') parenteses++;
      else if (c === ')') parenteses--;
      else if (!parenteses && (c === '{' || c === ';')) break;
      else if (c === '}') throw new Error('css inválido: chaveta a mais.');
    }
    const cabeca = css.slice(i, j).trim();
    if (j >= n) { if (cabeca) throw new Error(`css inválido perto de: ${cabeca.slice(0, 60)}`); break; }
    if (css[j] === ';') { itens.push({ cabeca, corpo: null }); i = j + 1; continue; }
    let k = j + 1;
    let fundo = 1;
    aspa = '';
    for (; k < n && fundo; k++) {
      const c = css[k];
      if (aspa) { if (c === '\\') k++; else if (c === aspa) aspa = ''; continue; }
      if (c === '"' || c === "'") aspa = c;
      else if (c === '{') fundo++;
      else if (c === '}') fundo--;
    }
    if (fundo) throw new Error(`css inválido: falta fechar ${cabeca.slice(0, 60)}`);
    itens.push({ cabeca, corpo: css.slice(j + 1, k - 1) });
    i = k;
  }
  return itens;
}

// Divide os selectores pelas vírgulas de fora (as de :is(a,b) ficam).
function partirSelectores(s) {
  const l = [];
  let p = 0;
  let ini = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') p++;
    else if (s[i] === ')') p--;
    else if (s[i] === ',' && !p) { l.push(s.slice(ini, i).trim()); ini = i + 1; }
  }
  l.push(s.slice(ini).trim());
  return l.filter(Boolean);
}

// Fecha o css dentro de #wa-pagina: cada selector passa a "#wa-pagina <selector>" (:scope e :root são o próprio
// #wa-pagina). As regras para body e html são do WordPress (o título do tema) e ficam de fora: a Shopify tem as suas.
// O id ganha às regras do tema (.rte img, .rte ul, .rte h2...), que são de classe.
function fecharCss(css, imports = []) {
  const saida = [];
  for (const { cabeca, corpo } of partirCss(css)) {
    if (corpo === null) {
      const m = cabeca.match(/^@import\s+url\(\s*(["']?)(https:\/\/fonts\.googleapis\.com\/css2?\?[^"'()\s]+)\1\s*\)\s*$/i);
      if (!m) throw new Error(`css recusado: ${cabeca.slice(0, 80)}. Só as letras do Google Fonts.`);
      imports.push(`@import url('${m[2]}');`);
      continue;
    }
    if (cabeca.startsWith('@')) {
      if (!/^@(media|supports)\s[^{};<>]+$/i.test(cabeca)) throw new Error(`css recusado: ${cabeca.slice(0, 60)}.`);
      saida.push(`${cabeca}{${fecharCss(corpo, imports)}}`);
      continue;
    }
    if (/[<>{}@\\]/.test(cabeca.replace(/>/g, ''))) throw new Error(`css recusado: ${cabeca.slice(0, 60)}`);
    const selectores = partirSelectores(cabeca)
      .filter((s) => !/^(body|html)\b/i.test(s))
      .map((s) => (/^:(scope|root)\b/.test(s) ? s.replace(/^:(scope|root)/, RAIZ) : `${RAIZ} ${s.replace(/:scope\b/g, RAIZ)}`));
    if (!selectores.length) continue;
    saida.push(`${selectores.join(',')}{${declaracoesSeguras(corpo, cabeca)}}`);
  }
  return saida.join('\n');
}

// O que o núcleo do WordPress dá às páginas em blocos (block-library e os layouts que ele calcula ao mostrar a página),
// os mesmos 24 px entre blocos do WordPress de treino, e o que desliga as regras do tema dentro da página.
const NUCLEO = [
  `:scope{display:block;position:relative;color:${C.texto || 'inherit'};font-family:${CORPO};font-size:16px;line-height:1.5;letter-spacing:normal;text-align:left;overflow-wrap:break-word}`,
  ':scope,:scope *,:scope *::before,:scope *::after{box-sizing:border-box}',
  ':where(h1,h2,h3,h4,h5,h6,p,ul,ol,li,figure,blockquote,details,summary,a){letter-spacing:normal;text-transform:none;font-style:normal}',
  ':where(h1,h2,h3,h4,h5,h6,p,ul,ol,figure,blockquote,details){margin:0}',
  ':where(blockquote){padding:0;border:0;display:block;font-weight:inherit;color:inherit}',
  ':where(img){max-width:100%;height:auto;border:0;border-radius:0;box-shadow:none;margin:0;vertical-align:bottom}',
  ':where(.wa-lay,.wp-block-column,.wp-block-quote)>*{margin-block:24px 0}',
  ':where(.wa-lay,.wp-block-column,.wp-block-quote)>:first-child{margin-block-start:0}',
  ':where(.wa-lay,.wp-block-column,.wp-block-quote)>:last-child{margin-block-end:0}',
  // As faixas: à largura do ecrã, mesmo dentro do contentor estreito do tema.
  ':scope>.alignfull{width:100vw;max-width:100vw;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw)}',
  '.wp-block-group{box-sizing:border-box}',
  '.has-text-align-left{text-align:left}',
  '.has-text-align-center{text-align:center}',
  '.has-text-align-right{text-align:right}',
  '.wp-block-columns{display:flex;flex-wrap:wrap !important;align-items:normal !important;gap:24px}',
  '.wp-block-column{flex-grow:1;min-width:0;overflow-wrap:break-word;word-break:break-word}',
  '.wp-block-column.is-vertically-aligned-top{align-self:flex-start}',
  '.wp-block-column.is-vertically-aligned-center{align-self:center}',
  '.wp-block-column.is-vertically-aligned-bottom{align-self:flex-end}',
  '@media (min-width:782px){.wp-block-columns{flex-wrap:nowrap !important}.wp-block-column{flex-basis:0;flex-grow:1}.wp-block-column[style*="flex-basis"]{flex-grow:0}}',
  '@media (max-width:781px){.wp-block-column{flex-basis:100% !important}}',
  '.wp-block-buttons{display:flex;flex-wrap:wrap;align-items:center;gap:24px}',
  '.wa-j-center{justify-content:center}',
  '.wa-j-right{justify-content:flex-end}',
  '.wa-j-space-between{justify-content:space-between}',
  '.wp-block-button{margin:0}',
  '.wp-block-button__link{display:inline-block;cursor:pointer;text-align:center;text-decoration:none;word-break:break-word;border:0;font-family:inherit}',
  '.wp-block-button.is-style-outline>.wp-block-button__link{border:2px solid}',
  '.wp-block-button.is-style-outline>.wp-block-button__link:not(.has-background){background:transparent}',
  '.wp-block-cover{position:relative;display:flex;align-items:center;justify-content:center;min-height:430px;padding:1em;overflow:hidden;overflow:clip;color:#FFFFFF;background-position:50%}',
  '.wp-block-cover__image-background{position:absolute;inset:0;width:100%;height:100%;max-width:none;max-height:none;object-fit:cover;margin:0;padding:0;border:0;border-radius:0;box-shadow:none;z-index:0}',
  '.wp-block-cover__background{position:absolute;inset:0;z-index:1;opacity:.5}',
  ...[0, 10, 20, 30, 40, 60, 70, 80, 90, 100].map((d) => `.wp-block-cover__background.has-background-dim-${d}{opacity:${d / 100}}`),
  '.wp-block-cover__inner-container{position:relative;z-index:2;width:100%;color:inherit}',
  '.wp-block-image img{height:auto;max-width:100%}',
  '.wp-block-quote{margin-left:40px;margin-right:40px;overflow-wrap:break-word}',
  '.wp-block-details summary{cursor:pointer}',
].join('\n');

// A Shopify mostra o título da página num h1 por cima do conteúdo. Se a página trouxer o seu h1 (o herói), o do tema
// esconde-se, só nesta página, e com ele o espaço por cima e por baixo, para as faixas encostarem ao cabeçalho e ao
// rodapé. Dawn e família: h1.main-page-title; Horizon: o h1 de um .text-block; os outros temas OS 2.0 têm-no dentro de <main>.
// Uma página sem h1 fica com o título do tema.
const TITULO_ESCONDIDO = [
  `body:has(${RAIZ} h1) :is(main,#MainContent) h1:not(${RAIZ} h1){display:none !important}`,
  `body:has(${RAIZ} h1) :is(main,#MainContent) :is(.page-header,.section-header,.main-page-title,.page-title,.text-block):not(:has(${RAIZ})):has(>h1){display:none !important}`,
  `body:has(${RAIZ} h1) :is(main,#MainContent):has(${RAIZ}),body:has(${RAIZ} h1) :is(main,#MainContent) :has(${RAIZ}){padding-top:0 !important;margin-top:0 !important;padding-bottom:0 !important;margin-bottom:0 !important}`,
].join('\n');
// Sem scroll de lado: as faixas medem 100vw, que no Windows inclui a barra de deslocamento.
const SEM_SCROLL_DE_LADO = `html:has(${RAIZ}>.alignfull),body:has(${RAIZ}>.alignfull){overflow-x:clip}`;

// Tira os comentários dos blocos e põe nas etiquetas as classes que o WordPress calcularia ao mostrar a página
// (a largura do conteúdo de cada secção, o alinhamento dos botões). O bloco de HTML só pode ser a marcação das perguntas
// frequentes para o Google, que é um <script> e fica de fora.
function semComentarios(html, larguras) {
  const re = /<!--\s+(\/?)wp:([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?)(?:\s+(\{[\s\S]*?\}))?\s+(\/?)-->/g;
  let saida = '';
  let i = 0;
  let pendente = null;
  let faq = false;
  const juntar = (pedaco) => {
    if (pendente) {
      const { classes, alvo } = pendente;
      pendente = null;
      if (alvo === 'interior') {
        pedaco = pedaco.replace('class="wp-block-cover__inner-container"', `class="wp-block-cover__inner-container ${classes}"`);
      } else {
        pedaco = pedaco.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/i, (tag, nome, resto) => (/\sclass="/.test(resto)
          ? `<${nome}${resto.replace(/\sclass="([^"]*)"/, (x, c) => ` class="${c} ${classes}"`)}>`
          : `<${nome} class="${classes}"${resto}>`));
      }
    }
    saida += pedaco;
  };
  let m;
  while ((m = re.exec(html))) {
    juntar(html.slice(i, m.index));
    i = re.lastIndex;
    const [, fecho, nome, json] = m;
    if (fecho) continue;
    if (nome === 'html') {
      const fim = html.indexOf('<!-- /wp:html -->', i);
      const dentro = html.slice(i, fim < 0 ? html.length : fim).trim();
      if (!/^<script type="application\/ld\+json">[^<]*<\/script>$/.test(dentro)) {
        throw new Error('Há HTML solto na página (um bloco de HTML). Na Shopify só entram as peças do kit.');
      }
      faq = true;
      i = fim < 0 ? html.length : fim + '<!-- /wp:html -->'.length;
      re.lastIndex = i;
      continue;
    }
    let a = {};
    try { a = json ? JSON.parse(json) : {}; } catch { throw new Error(`Não percebi as opções do bloco ${nome}.`); }
    const largura = Number(String(a.layout?.contentSize || '').match(/^(\d{2,4})px$/)?.[1]) || 0;
    if (largura) larguras.add(largura);
    const lay = ['wa-lay', largura && `wa-w-${largura}`].filter(Boolean).join(' ');
    if (nome === 'group' && a.layout?.type === 'constrained') pendente = { classes: lay };
    else if (nome === 'cover') pendente = { classes: lay, alvo: 'interior' };
    else if (nome === 'buttons' && ['center', 'right', 'space-between'].includes(a.layout?.justifyContent)) pendente = { classes: `wa-j-${a.layout.justifyContent}` };
  }
  juntar(html.slice(i));
  return { html: saida.replace(/\n{3,}/g, '\n\n').trim(), faq };
}

// O HTML só passa com etiquetas e atributos desta lista. Não se corrige nada às escondidas: o que não está na lista
// pára a gravação com o nome do que falhou, para se corrigir no ficheiro da página.
const ETIQUETAS = new Set(['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'small', 'sup', 'sub', 'br', 'a', 'ul', 'ol', 'li', 'figure', 'figcaption', 'img', 'blockquote', 'cite', 'details', 'summary', 'hr', 'mark']);
const ATRIBUTOS = new Set(['class', 'style', 'href', 'src', 'alt', 'loading', 'decoding', 'width', 'height', 'aria-hidden', 'aria-label', 'data-object-fit', 'target', 'rel', 'title', 'open']);
function verificarHtml(html) {
  const imagens = [];
  let h1 = 0;
  const etiqueta = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/y;
  for (let i = html.indexOf('<'); i >= 0; i = html.indexOf('<', i + 1)) {
    if (!/[a-zA-Z/!?]/.test(html[i + 1] || '')) continue;
    etiqueta.lastIndex = i;
    const m = etiqueta.exec(html);
    if (!m) throw new Error(`HTML que o kit não aceita: ${html.slice(i, i + 60)}`);
    const nome = m[2].toLowerCase();
    if (!ETIQUETAS.has(nome)) throw new Error(`<${nome}> não entra numa página da Shopify: o kit só grava texto, imagens, ligações e as peças de desenho.`);
    if (m[1]) continue;
    if (nome === 'h1') h1++;
    const atr = {};
    for (const [, n, v1, v2, v3] of m[3].matchAll(/\s+([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      const a = n.toLowerCase();
      const v = v1 ?? v2 ?? v3 ?? '';
      if (!ATRIBUTOS.has(a)) throw new Error(`O atributo ${a} não entra numa página da Shopify (em <${nome}>).`);
      if (a === 'href' && !ligacaoSegura(lerEndereco(v).trim())) throw new Error(`Ligação recusada: ${v}. Só https, /, #, mailto: ou tel:.`);
      if (a === 'style') declaracoesSeguras(v, `<${nome} style>`);
      if (a === 'class' && !/^[\w\s-]*$/.test(v)) throw new Error(`Classe inválida: ${v}`);
      atr[a] = v;
    }
    if (nome === 'img') {
      const fundo = /\bwp-block-cover__image-background\b/.test(atr.class || '');
      if (atr.src === undefined || !/\ssrc="/.test(m[3]) || /=\s*'/.test(m[3])) throw new Error('Uma imagem sem endereço (src="...") ou com atributos entre plicas.');
      if (!fundo && (!atr.alt || /^(undefined|null)$/.test(atr.alt.trim()) || !atr.alt.trim())) {
        throw new Error(`A imagem ${atr.src} precisa de texto alternativo: imagem('${atr.src}', 'o que se vê na fotografia').`);
      }
      imagens.push({ src: lerEndereco(atr.src), alt: fundo ? '' : textoDoAtributo(atr.alt), inicio: i, fim: etiqueta.lastIndex });
    }
  }
  if (h1 > 1) throw new Error(`A página tem ${h1} títulos h1: só um (o do herói), os outros passam a h2.`);
  return { imagens, h1 };
}

const escAtr = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// O corpo da página com o desenho, pronto para a Shopify. imagemNaLoja(origem, alt) devolve o endereço final de cada
// imagem (sobe as da pasta do cliente, deixa as que já estão no CDN da loja). Devolve { corpo, avisos, h1 }.
export async function paginaComDesenho(elementos, { imagemNaLoja } = {}) {
  const lista = (Array.isArray(elementos) ? elementos.flat(Infinity) : []).filter(Boolean);
  if (!lista.length || lista.some((b) => typeof b !== 'string' || !b.trimStart().startsWith('<!-- wp:'))) {
    throw new Error('Os elementos têm de ser peças de scripts/shopify-desenho.mjs (seccao, titulo, texto...), não as de elementor.mjs.');
  }
  const larguras = new Set();
  const { html, faq } = semComentarios(lista.join('\n\n'), larguras);
  if (/<!--/.test(html)) throw new Error('Há comentários HTML na página: tirar do texto.');
  const { imagens, h1 } = verificarHtml(html);

  // Cada imagem sobe uma vez, mesmo que apareça em vários sítios.
  const enderecos = new Map();
  for (const { src, alt } of imagens) {
    if (enderecos.has(src)) continue;
    const final = imagemNaLoja ? await imagemNaLoja(src, alt || `Fotografia de fundo (${src.split(/[\\/]/).pop()})`) : src;
    if (!/^https:\/\/[^\s"'<>]+$/.test(final) && imagemNaLoja) throw new Error(`A imagem ${src} não ficou com um endereço https.`);
    enderecos.set(src, final);
  }
  // Troca o src de cada <img> pelo endereço final, na etiqueta que o verificarHtml encontrou.
  let corpoHtml = '';
  let pos = 0;
  for (const im of imagens) {
    corpoHtml += html.slice(pos, im.inicio) + html.slice(im.inicio, im.fim).replace(/(\ssrc=")[^"]*(")/, (t, a, b) => `${a}${escAtr(enderecos.get(im.src))}${b}`);
    pos = im.fim;
  }
  corpoHtml += html.slice(pos);
  // O & solto de uma ligação (UTM, wa.me?...&text=) fica escrito &amp; no atributo.
  corpoHtml = corpoHtml.replace(/(\s(?:href|src)=")([^"]*)(")/g, (t, a, v, b) => `${a}${v.replace(/&(?!amp;)/g, '&amp;')}${b}`);

  const estilo = await estiloDaPagina();
  const cssPecas = (estilo.bloco.match(/<style id="wa-estilo">\n?([\s\S]*?)\n?<\/style>/) || [])[1];
  if (cssPecas === undefined) throw new Error('Não encontrei o estilo das peças (scripts/blocos.mjs mudou). Enviar este erro à Flowzi.');
  const imports = [];
  const larg = [...larguras].sort((x, y) => x - y).map((w) => `.wa-w-${w}>:not(.alignfull){max-width:${w}px;margin-left:auto !important;margin-right:auto !important}`).join('\n');
  const partes = [fecharCss(NUCLEO, imports), larg && fecharCss(larg, imports), fecharCss(cssPecas, imports)].filter(Boolean);
  const css = [...new Set(imports), ...partes, SEM_SCROLL_DE_LADO, h1 ? TITULO_ESCONDIDO : ''].filter(Boolean).join('\n');
  if (/<\/|<!--|-->/i.test(css)) throw new Error('O css da página tem caracteres que fechariam o estilo. Enviar este erro à Flowzi.');

  const avisos = [...estilo.avisos];
  if (faq) avisos.push('as perguntas frequentes entram sem a marcação FAQ para o Google (na Shopify não vai código na página): confirmar se o tema ou uma app de SEO a põe');
  return { corpo: `<div id="wa-pagina" class="wa-pagina">\n<style id="wa-estilo">\n${css}\n</style>\n${corpoHtml}\n</div>`, avisos, h1: h1 > 0 };
}
