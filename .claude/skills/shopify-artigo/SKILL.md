---
name: shopify-artigo
description: >
  Escreve um artigo para o blogue da loja Shopify do cliente activo e grava-o ESCONDIDO: estrutura,
  texto, resumo, etiquetas, imagem de destaque, perguntas frequentes e título e descrição para o
  Google. Gatilhos: "artigo na Shopify", "post para o blogue da loja", "/shopify-artigo".
---

# Artigo escondido no blogue da Shopify

## Antes de escrever

1. `node scripts/estado.mjs` tem de mostrar `loja Shopify, só escondido`. Se não, `/shopify-ligar` e parar.
2. Ler `clientes/<cliente>/CLAUDE.md` e `marca.json`. **Nunca inventar números, preços, prazos ou resultados.** O que não estiver escrito fica `[por confirmar]`.
3. Perguntar só o que faltar, no máximo três perguntas: o tema exacto, para quem é, que acção se quer no fim.

## Estrutura

A mesma do `/wp-artigo`: título que é a pergunta ou a promessa (é o h1; no texto só h2 e h3), resposta directa nos dois primeiros parágrafos, secções curtas, fecho com o passo seguinte (ver o produto, a colecção, marcar). Resumo entre 140 e 160 caracteres.

Para ligações internas, `node scripts/shopify-listar.mjs` mostra as páginas e os artigos da loja; para produtos e colecções, ler a loja pública. Propor três a seis ligações; não alterar outras páginas.

## Escrever

Criar `clientes/<cliente>/artigos/<handle>.mjs`, no formato dos artigos do kit, com o que a Shopify acrescenta:

```js
export default {
  titulo: 'Como escolher ...',
  handle: 'como-escolher',
  blog: 'novidades',                  // o handle do blogue; se a loja só tiver um, pode ficar de fora
  autor: 'Equipa da Loja',            // o nome que aparece no artigo
  resumo: '140 a 160 caracteres',     // aparece na lista do blogue e é a descrição para o Google
  etiquetas: ['guia', 'inverno'],
  imagem: { ficheiro: 'imagens/capa.jpg', alt: 'Descrição para quem não vê' },   // ou { url: 'https://...', alt }
  seo: { titulo: '50 a 60 caracteres' },
  blocos: [['h2', '...'], ['p', '...'], ['lista', ['...']], ['imagem', { ficheiro: '...', alt: '...' }], ['botao', { texto: '...', url: '/collections/...' }]],
  perguntas: [{ pergunta: '...', resposta: '...' }],
};
```

As imagens seguem as regras do `/shopify-pagina` (secção Imagens): as de `imagens/` sobem e precisam de `write_files` na app; as que já estão na loja (`cdn.shopify.com`) usam-se como estão; da Pixabay, só o ficheiro descarregado, nunca o endereço de lá.

As perguntas frequentes entram no fim do texto, com título "Perguntas frequentes". A marcação FAQ para o Google depende do tema ou de uma app de SEO da loja: dizer à pessoa para confirmar.

## SEO

Página ou artigo de SEO: seguir `/seo` e pôr a palavra-chave em `seo: { titulo, descricao, chave }`. O rever não lê a loja: antes de gravar, verificar com a lista "Shopify" do `/seo`.

## Gravar

```
node scripts/shopify-artigo.mjs clientes/<cliente>/artigos/<handle>.mjs
```

O Claude Code pede licença com o aviso de que vai gravar na loja real, escondido. O artigo fica escondido. Para refazer depois de um reparo, editar o mesmo ficheiro e correr o mesmo comando: actualiza o mesmo artigo enquanto estiver escondido.

Depois de gravar, fica o documento para o cliente validar o texto em `clientes/<cliente>/validacao/`. Para o Drive: `node scripts/documento.mjs clientes/<cliente>/validacao/<ficheiro>.docx --drive`.

## Sectores regulados

Em saúde, bem-estar, finanças ou jurídico: nada de alegações de tratamento, cura ou resultado garantido. Listar no fim tudo o que precisa de validação do cliente.

## Entregar

O link do painel que o script mostra, o número de palavras, o título e a descrição para o Google, as ligações internas propostas e o que ficou `[por confirmar]`. Para publicar: `/shopify-publicar`, que diz antes o que vai fazer e só publica com o sim da pessoa. Também se pode publicar no painel: Visibilidade → Visível.
