# Exemplo trabalhado: porsche, simplificado

Lido pelo `/design` no passo 5. Mostra o tamanho certo de um estilo e como cada decisão vira peças do kit. É um exemplo: num cliente, as cores e as letras da marca entram nos papéis da paleta (ver o fim).

Da referência (porsche.com) fica o **sistema**: alternância de fundos escuros e claros, letra grotesca larga, muito espaço, fotografia grande a toda a largura, botões finos. Fica de fora o **efeito**: vídeo no herói, configuradores, menus animados, a letra própria da marca.

---

```
# Estilo pista-nocturna
Estado: proposto · Referência: https://www.porsche.com/ · Cliente: <cliente>
```

## A ideia

Para quem decide pela qualidade e pela precisão: a página sente-se técnica, calma e cara, e leva a uma só acção por secção.

## Letras

Títulos em Lexend Exa 500 (grotesca larga, já espaçada de origem: espaçamento entre letras 0). Corpo em Inter 400. Botões em Inter 500, espaçamento 0,5 px. Sem maiúsculas.

## Escala

| Peça | Computador | Telemóvel |
|---|---|---|
| h1 | 88 px | 36 px (escrito à mão: a letra larga não cabe a 56) |
| h2 | 44 px | 28 px (automático) |
| h3 | 24 px | 20 px (automático) |
| texto | 17 px | 15 px (automático) |
| texto pequeno | 14 px | 15 px (automático: o mínimo do kit) |
| botão | 15 px | 15 px |

## Paleta

| Papel | Hex | Sobre | Contraste |
|---|---|---|---|
| Escuro: fundos escuros e texto principal | #0E0E12 | #FFFFFF | 19,26:1 |
| Claro: fundo principal e texto sobre escuro | #FFFFFF | #0E0E12 | 19,26:1 |
| Cinzento claro: fundo alternado | #F5F5F7 | texto #0E0E12 | 17,69:1 |
| Texto secundário em fundo claro | #5E6068 | #FFFFFF · #F5F5F7 | 6,27:1 · 5,76:1 |
| Texto secundário em fundo escuro | #A1A3AB | #0E0E12 | 7,65:1 |
| Linha fina, só em fundo escuro (decorativa, nunca texto) | #3A3B41 | #0E0E12 | 1,73:1 |

Sem acento: o botão principal é claro sobre escuro e escuro sobre claro. Não é o sinal 2 do `principios.md` (quase preto com néon) porque não há néon e metade da página é clara.

## Espaço

Conteúdo a 1280 px. Secções com 140 px em cima e em baixo (84 no telemóvel, automático). 32 px entre elementos, 40 entre colunas.

## Forma

Raio 4 px nos botões, 0 nas fotografias e nos cartões. Sem sombras. Bordas de 1 px só nos botões de contorno.

## Imagens

Fotografias reais do cliente, grandes, a toda a largura ou a toda a altura do herói. Proporção 16:9 nas largas, recorte apertado no assunto, luz controlada (estúdio, fim de tarde). Sobreposição `rgba(0,0,0,0.5)` quando há texto por cima. Sem fotografia boa, o herói passa a fundo escuro só com tipografia.

## Ritmo

1. Escuro: herói com fotografia a toda a altura, título em baixo à esquerda, dois botões.
2. Claro: uma frase grande e três colunas curtas.
3. Fotografia a toda a largura, sem texto.
4. Escuro: três dados técnicos reais em linha, separados por linhas finas.
5. Cinzento claro: perguntas frequentes, numa coluna estreita.
6. Escuro: fecho com uma frase e um botão.

## Assinaturas

1. **Herói à porsche:** fotografia a toda a altura, título enorme em baixo à esquerda.
2. **Botão fino:** contorno de 1 px, raio 4, que enche ao passar o rato.
3. **Alternância seca:** escuro, claro, escuro, sem degradês entre secções.
4. **Fotografia a toda a largura** como pausa entre secções de texto.
5. **Ficha técnica:** números reais grandes com linha fina por cima. Só com números escritos num documento do cliente; sem eles, esta assinatura sai.

## Botões

Principal: cheio, claro sobre escuro (ou escuro sobre claro), raio 4, ao passar o rato fica cinzento claro. Secundário: contorno de 1 px na cor do texto, ao passar o rato enche. Etiquetas que dizem o que acontece ("Marcar avaliação", "Ver os tratamentos").

## O que fica de fora

Vídeo no herói (pesa e o Elementor gratuito não o garante no telemóvel), animações de entrada nas secções (regra do kit: só nos widgets), a letra Porsche Next (exclusiva), menus e configuradores animados, mais de um botão principal por secção.

---

## As receitas no kit

No topo do ficheiro da página (`clientes/<cliente>/paginas/<slug>.mjs`), depois do `import`:

```js
import { seccao, linha, coluna, titulo, texto, botao, imagem, perguntas, widget, px, caixa, marca } from '../../../scripts/elementor.mjs';

const E = { escuro: '#0E0E12', claro: '#FFFFFF', cinza: '#F5F5F7', sec: '#5E6068', secEscuro: '#A1A3AB', linha: '#3A3B41' };
const LETRA = { typography_font_family: 'Lexend Exa', typography_letter_spacing: px(0) };
const SECCAO = { topo: 140, base: 140, largura: 1280 };

const t = (txt, nivel, o = {}) => titulo(txt, nivel, { peso: 500, ...o, extra: { ...LETRA, ...o.extra } });
// Botão fino: 1 px de contorno, raio 4, enche ao passar o rato (estado de hover, gratuito).
const fino = (etq, url, sobreEscuro = true) => botao(etq, url, {
  contorno: true, raio: 4, cor: sobreEscuro ? E.claro : E.escuro,
  extra: {
    border_width: caixa(1, 1, 1, 1), text_padding: caixa(14, 28, 14, 28),
    typography_font_size: px(15), typography_font_weight: '500', typography_letter_spacing: px(0.5),
    button_background_hover_color: sobreEscuro ? E.claro : E.escuro, hover_color: sobreEscuro ? E.escuro : E.claro,
  },
});
const cheio = (etq, url, sobreEscuro = true) => botao(etq, url, {
  raio: 4, fundo: sobreEscuro ? E.claro : E.escuro, cor: sobreEscuro ? E.escuro : E.claro,
  extra: { text_padding: caixa(14, 28, 14, 28), typography_font_size: px(15), typography_font_weight: '500', button_background_hover_color: E.cinza, hover_color: E.escuro },
});
const filete = () => widget('divider', { style: 'solid', weight: px(1), color: E.linha, gap: px(0) });
```

As secções:

```js
// 1 · Herói à porsche: título em baixo à esquerda (flex_justify_content sobrepõe o centro de alturaMinima).
seccao([
  t('<promessa da página>', 'h1', { tamanho: 88, cor: E.claro, extra: { typography_font_size_mobile: px(36) } }),
  texto('<uma frase de apoio>', { cor: E.claro, tamanho: 19 }),
  linha([cheio('<acção principal>', '<destino>'), fino('<acção secundária>', '<destino>')], { espacamento: 12, extra: { flex_direction_mobile: 'column' } }),
], { ...SECCAO, imagemFundo: '<fotografia do cliente>', sobreposicao: 'rgba(0,0,0,0.5)', alturaMinima: 760, fundo: E.escuro, extra: { flex_justify_content: 'flex-end' } }),

// 3 · Fotografia a toda a largura, sem margens nem raio.
seccao([imagem('<fotografia do cliente>', '<texto alternativo>', { raio: 0, altura: 640 })],
  { topo: 0, base: 0, extra: { content_width: 'full', padding: caixa(0, 0, 0, 0), padding_mobile: caixa(0, 0, 0, 0) } }),

// 4 · Ficha técnica: só com números reais do cliente.
seccao([
  linha([
    coluna([filete(), t('<valor>', 'p', { tamanho: 56, cor: E.claro }), texto('<legenda>', { tamanho: 15, cor: E.secEscuro })], 30),
    coluna([filete(), t('<valor>', 'p', { tamanho: 56, cor: E.claro }), texto('<legenda>', { tamanho: 15, cor: E.secEscuro })], 30),
    coluna([filete(), t('<valor>', 'p', { tamanho: 56, cor: E.claro }), texto('<legenda>', { tamanho: 15, cor: E.secEscuro })], 30),
  ], { espacamento: 40 }),
], { ...SECCAO, fundo: E.escuro }),
```

Os textos entre `< >` vêm do briefing ou do texto aprovado do cliente; o que faltar fica `[por confirmar]`. As fotografias só do cliente.

## O mesmo estilo num cliente

Com a marca da MIMUS (`principal` #1D1D1D, `acento` #FF8A8B, Montserrat):

- **Escuro** passa a #1D1D1D (branco por cima: 16,86:1; #A1A3AB por cima: 6,70:1).
- **Botão principal em fundo escuro:** o acento #FF8A8B com texto #1D1D1D (7,43:1); o botão contra o fundo escuro também dá 7,43:1, acima dos 3:1 pedidos. Em fundo claro o acento não chega (2,27:1 sobre branco): lá o botão principal é escuro.
- **Letras:** fica a Montserrat da marca, em 500 nos títulos, e o estilo decide só a escala, o espaço e as assinaturas. Trocar para Lexend Exa só com o sim da pessoa, como no passo 4 da skill.

## Na Shopify

O mesmo estilo numa loja guia só o texto e as imagens: títulos curtos e directos, uma acção por página, fotografias grandes de produto em 16:9 com luz de estúdio, texto alternativo a descrever o produto. Letras, cores, raios e botões vivem no tema.
