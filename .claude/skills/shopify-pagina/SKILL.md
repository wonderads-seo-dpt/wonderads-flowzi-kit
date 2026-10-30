---
name: shopify-pagina
description: >
  Escreve uma página para a loja Shopify do cliente activo (sobre nós, guia, página de serviço,
  política) e grava-a ESCONDIDA: texto em blocos, imagens com texto alternativo, título e
  descrição para o Google. Gatilhos: "página na Shopify", "página para a loja", "/shopify-pagina".
---

# Página escondida na Shopify

## Antes de escrever

1. `node scripts/estado.mjs` tem de mostrar `loja Shopify, só escondido`. Se não, `/shopify-ligar` e parar.
2. Ler `clientes/<cliente>/CLAUDE.md` e `marca.json`. Factos só do que estiver escrito; o resto fica `[por confirmar]`.
3. Se o pedido vier em duas linhas soltas, fazer primeiro as perguntas do `/wp-briefing` (servem igual).

## O que esta página é, e não é

Na Shopify, o desenho vive no tema. Uma página do kit é **texto, imagens e botões** dentro do modelo de página do tema da loja: fica com o aspecto das outras páginas de texto da loja. Landing pages com secções desenhadas (faixas, colunas, cartões) fazem-se no editor de temas, à mão, por agora. Dizer isto à pessoa se o pedido for uma landing page.

## Escrever

Criar `clientes/<cliente>/paginas/<handle>.mjs`:

```js
export default {
  titulo: 'Sobre nós',              // é o h1 da página: no texto só h2 e h3
  handle: 'sobre-nos',              // o endereço: /pages/sobre-nos
  seo: { titulo: '50 a 60 caracteres', descricao: '140 a 160 caracteres' },
  blocos: [
    ['h2', 'Quem somos'],
    ['p', 'Texto. Pode levar <strong>negrito</strong>, <em>itálico</em> e <a href="/collections/all">ligações</a>.'],
    ['lista', ['um ponto', 'outro ponto']],
    ['imagem', { ficheiro: 'imagens/equipa.jpg', alt: 'A equipa na loja de Lisboa' }],
    ['citacao', 'Uma frase do cliente, se estiver aprovada.'],
    ['botao', { texto: 'Ver a colecção', url: '/collections/all' }],
  ],
  perguntas: [{ pergunta: '...', resposta: '...' }],   // opcional
};
```

As imagens vêm da pasta do cliente (`clientes/<cliente>/imagens/`) ou de um endereço https; sobem para os Ficheiros da loja. Sempre com `alt` escrito para quem não vê a imagem. Nunca inventar fotografias: sem imagem aprovada, não pôr o bloco e dizer à pessoa.

## Gravar

```
node scripts/shopify-pagina.mjs clientes/<cliente>/paginas/<handle>.mjs
```

O Claude Code pede licença com o aviso de que vai gravar na loja real, escondido. A página fica escondida. Para refazer depois de um reparo, editar o mesmo ficheiro e correr o mesmo comando: actualiza a mesma página (guarda antes uma cópia em `copias/`). Se já estiver publicada, o script recusa: para a mudar, escondê-la primeiro com `/shopify-publicar`, gravar e voltar a publicar.

## Entregar

O link do painel que o script mostra, o endereço que a página terá quando for publicada, o título e a descrição para o Google, e o que ficou `[por confirmar]`. Para publicar: `/shopify-publicar`, que diz antes o que vai fazer e só publica com o sim da pessoa. Também se pode publicar no painel: Visibilidade → Visível.
