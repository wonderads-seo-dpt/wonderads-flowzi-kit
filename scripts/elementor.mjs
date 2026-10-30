// Peças de Elementor nativo: containers flexbox e widgets gratuitos, na marca de marca.json.
// Cada peça já traz o valor de telemóvel. Uma página é uma lista de seccao(...).
// Todas aceitam { extra: {...} }: definições do Elementor que se juntam às da peça, para seguir o desenho de uma
// referência (/wp-replicar) sem sair dos widgets reais. Ex.: titulo('Olá', 'h2', { extra: { typography_letter_spacing: px(-1) } }).
// Os títulos (titulo, rotulo e o título das caixas com ícone) seguem o estilo de cada nível em "titulos" no marca.json
// (ver titulos-estilo.mjs); o extra num título é só para uma excepção que a pessoa pediu.
import { readFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { raiz, pasta } from './wp.mjs';
import { titulosDaMarca } from './titulos-estilo.mjs';

const ficheiroMarca = pasta && existsSync(`${pasta}/marca.json`) ? `${pasta}/marca.json` : `${raiz}/scripts/modelo/marca.json`;
// replace: o Bloco de Notas pode gravar o ficheiro com BOM, que o JSON.parse não aceita.
export const marca = JSON.parse(readFileSync(ficheiroMarca, 'utf8').replace(/^\uFEFF/, ''));
const T = titulosDaMarca(marca, ficheiroMarca.replace(/^.*[/\\](clientes|scripts)[/\\]/, '$1/'));
const C = marca.cores;
// Ícones e números precisam de 3:1 sobre fundo claro; o acento dos botões nem sempre chega lá.
const DESTAQUE = C.destaque || C.acento;
const F = marca.tipografia;

const id = () => randomBytes(4).toString('hex').slice(0, 7);
export const px = (v) => ({ unit: 'px', size: v, sizes: [] });
export const caixa = (t, r, b, l) => ({ unit: 'px', top: String(t), right: String(r), bottom: String(b), left: String(l), isLinked: false });
const raio_ = (v) => raio(v);
const raio = (v) => ({ unit: 'px', top: String(v), right: String(v), bottom: String(v), left: String(v), isLinked: true });
const espaco = (v) => ({ unit: 'px', size: v, column: String(v), row: String(v) });

export const container = (settings, elements) => ({ id: id(), elType: 'container', isInner: false, elements, settings });
export const widget = (widgetType, settings) => ({ id: id(), elType: 'widget', widgetType, settings, elements: [] });

// Opções de estilo (todas opcionais, por cima do marca.json): cor, tamanho, tablet, telemovel, peso, familia, altura,
// espacamento, maiusculas, italico e destaque (como saem as palavras em <em>: 'cor', 'sublinhado', 'marcador', 'degrade').
export const titulo = (t, nivel, { alinhar = 'left', extra = {}, ...o } = {}) => {
  const e = T.estilo(nivel, o);
  return widget('heading', { title: T.destacar(t, e), header_size: nivel, align: alinhar, title_color: e.cor, ...T.elementor(e), ...extra });
};

// Rótulo: a etiqueta pequena por cima de um título ("TRATAMENTOS"). Não é um título para o Google (vai em p).
export const rotulo = (t, { alinhar = 'left', extra = {}, ...o } = {}) => {
  const e = T.estilo('rotulo', o);
  return widget('heading', { title: t, header_size: 'p', align: alinhar, title_color: e.cor, ...T.elementor(e), _css_classes: 'wa-rotulo', ...extra });
};

export const texto = (html, { cor = C.texto, tamanho = 17, alinhar = 'left', extra = {} } = {}) =>
  widget('text-editor', {
    editor: html.startsWith('<') ? html : `<p>${html}</p>`, align: alinhar, text_color: cor,
    typography_typography: 'custom', typography_font_family: F.corpo,
    typography_font_size: px(tamanho),
    typography_font_size_mobile: px(Math.max(15, tamanho - 2)),
    typography_line_height: { unit: 'em', size: 1.65, sizes: [] },
    ...extra,
  });

// contorno: botão só com a borda (o segundo botão de um herói). raio: 8 por defeito, 100 para os redondos.
export const botao = (etiqueta, destino, { alinhar = 'left', invertido = false, contorno = false, raio: r = 8, fundo, cor, extra = {} } = {}) =>
  widget('button', {
    text: etiqueta, align: alinhar, align_mobile: 'justify',
    link: { url: destino, is_external: '', nofollow: '' },
    background_color: contorno ? 'rgba(0,0,0,0)' : fundo || (invertido ? '#FFFFFF' : C.acento),
    button_text_color: cor || (contorno ? (invertido ? '#FFFFFF' : C.principal) : invertido ? C.principal : C.texto_sobre_acento),
    ...(contorno ? { border_border: 'solid', border_width: caixa(2, 2, 2, 2), border_color: cor || (invertido ? '#FFFFFF' : C.principal) } : {}),
    border_radius: raio(r),
    text_padding: caixa(18, 36, 18, 36),
    typography_typography: 'custom', typography_font_family: F.corpo,
    typography_font_size: px(16), typography_font_weight: '600',
    ...extra,
  });

// altura: fixa a altura em px e recorta a imagem (cartões lado a lado ficam alinhados).
export const imagem = (url, alt, { largura = 100, raio: r = 12, altura, extra = {} } = {}) =>
  widget('image', {
    image: { url, id: '', alt, source: 'url' },
    image_size: 'full', width: { unit: '%', size: largura, sizes: [] },
    ...(altura ? { height: px(altura), height_mobile: px(Math.round(altura * 0.8)), 'object-fit': 'cover' } : {}),
    image_border_radius: raio(r),
    ...extra,
  });

export const lista = (itens, { cor = C.texto, extra = {} } = {}) =>
  widget('icon-list', {
    icon_list: itens.map((t) => ({ _id: id(), text: t, selected_icon: { value: 'fas fa-check', library: 'fa-solid' } })),
    icon_color: DESTAQUE, text_color: cor, space_between: px(14), text_indent: px(12),
    icon_typography_typography: 'custom',
    text_typography_typography: 'custom', text_typography_font_family: F.corpo, text_typography_font_size: px(17),
    ...extra,
  });

// O título da caixa é um h3: com um h3 no marca.json fica igual aos outros h3; sem ele, 21 px como sempre.
export const caixaIcone = (icone, t, desc, { posicao = 'top', alinhar, extra = {} } = {}) => {
  const e = T.estilo('h3', {}, { tamanho: 21, peso: 700 });
  return widget('icon-box', {
    selected_icon: { value: icone, library: 'fa-solid' },
    title_text: T.destacar(t, e), description_text: desc, position: posicao, ...(alinhar ? { text_align: alinhar } : {}), title_size: 'h3',
    primary_color: DESTAQUE, title_color: e.cor, description_color: C.texto,
    icon_size: px(32),
    ...T.elementor(e, 'title_typography_', { completo: e.daMarca }),
    description_typography_typography: 'custom', description_typography_font_family: F.corpo,
    description_typography_font_size: px(16),
    ...extra,
  });
};

// Número fixo em vez do widget de contador: o contador depende de JavaScript de animação
// que alguns sites não carregam, e fica a zero.
export const numero = (valor, legenda, { cor = DESTAQUE, corLegenda = C.texto } = {}) =>
  container({ content_width: 'full', flex_direction: 'column', flex_gap: espaco(4), width: { unit: '%', size: 22, sizes: [] }, width_mobile: { unit: '%', size: 46, sizes: [] } }, [
    titulo(valor, 'p', { cor, tamanho: 44 }),
    texto(legenda, { cor: corLegenda, tamanho: 14 }),
  ]);

export const perguntas = (lista) =>
  widget('accordion', {
    tabs: lista.map(([p, r]) => ({ _id: id(), tab_title: p, tab_content: `<p>${r}</p>` })),
    // Marcação FAQPage para o Google, gerada pelo próprio Elementor.
    faq_schema: 'yes',
    title_color: C.principal, tab_active_color: C.principal, content_color: C.texto,
    title_typography_typography: 'custom', title_typography_font_family: F.titulos,
    title_typography_font_size: px(18), title_typography_font_weight: '600',
    content_typography_typography: 'custom', content_typography_font_family: F.corpo,
    content_typography_font_size: px(16),
  });

// imagemFundo: fotografia a cobrir a secção (um herói), com sobreposicao ('rgba(0,0,0,0.45)') para o texto se ler.
// largura: a largura do conteúdo em px (a da referência, por exemplo 1140). alturaMinima em px.
export const seccao = (filhos, { fundo = '#FFFFFF', topo = 96, base = 96, alinhar, estreita = false, largura, imagemFundo, sobreposicao, alturaMinima, extra = {} } = {}) =>
  container({
    content_width: 'boxed', flex_direction: 'column', flex_gap: espaco(24),
    ...(estreita ? { boxed_width: px(760) } : largura ? { boxed_width: px(largura) } : {}),
    padding: caixa(topo, 24, base, 24),
    padding_mobile: caixa(Math.round(topo * 0.6), 20, Math.round(base * 0.6), 20),
    background_background: 'classic', background_color: fundo,
    ...(imagemFundo ? { background_image: { url: imagemFundo, id: '', source: 'url' }, background_position: 'center center', background_size: 'cover', background_repeat: 'no-repeat' } : {}),
    // A opacidade da sobreposição vai na própria cor (rgba); a do Elementor fica a 1, senão multiplicava pelos 0,5 dele.
    ...(sobreposicao ? { background_overlay_background: 'classic', background_overlay_color: sobreposicao, background_overlay_opacity: { unit: 'px', size: 1, sizes: [] } } : {}),
    ...(alturaMinima ? { min_height: px(alturaMinima), min_height_mobile: px(Math.round(alturaMinima * 0.75)), flex_justify_content: 'center' } : {}),
    ...(alinhar ? { flex_align_items: alinhar } : {}),
    ...extra,
  }, filhos);

// As colunas encolhem em vez de passarem para baixo: com os 10 px de margem que o Elementor dá à linha, duas de 50%
// ou três de 32% mais o espaço entre elas não cabiam, e a última caía para a linha seguinte.
export const linha = (filhos, { espacamento = 28, alinhar = 'stretch', extra = {} } = {}) =>
  container({
    content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'column',
    flex_gap: espaco(espacamento), flex_align_items: alinhar, flex_wrap: 'nowrap',
    ...extra,
  }, filhos);

export const coluna = (filhos, largura = 48, { extra = {} } = {}) =>
  container({
    content_width: 'full', flex_direction: 'column', flex_gap: espaco(14),
    width: { unit: '%', size: largura, sizes: [] }, width_mobile: { unit: '%', size: 100, sizes: [] },
    ...extra,
  }, filhos);

// Cartão: um bloco com fundo, borda e cantos redondos (caixa "Em resumo", alertas, prós e contras).
export const cartao = (filhos, { fundo = C.claro, borda, raio = 16, largura, sombra = false, extra = {} } = {}) =>
  container({
    content_width: 'full', flex_direction: 'column', flex_gap: espaco(12),
    padding: caixa(28, 28, 28, 28), padding_mobile: caixa(20, 20, 20, 20),
    background_background: 'classic', background_color: fundo,
    border_radius: raio_(raio),
    ...(borda ? { border_border: 'solid', border_width: caixa(1, 1, 1, 1), border_color: borda } : {}),
    ...(largura ? { width: { unit: '%', size: largura, sizes: [] }, width_mobile: { unit: '%', size: 100, sizes: [] } } : {}),
    ...(sombra ? { box_shadow_box_shadow_type: 'yes', box_shadow_box_shadow: { horizontal: 0, vertical: 12, blur: 32, spread: 0, color: 'rgba(16,24,40,0.10)' } } : {}),
    ...extra,
  }, filhos);

// Citação em destaque, com uma barra na cor de acento à esquerda.
export const citacao = (frase, { cor = C.principal } = {}) =>
  container({
    content_width: 'full', flex_direction: 'column',
    padding: caixa(4, 0, 4, 24),
    border_border: 'solid', border_width: caixa(0, 0, 0, 4), border_color: DESTAQUE,
  }, [texto(frase, { cor, tamanho: 20 })]);
