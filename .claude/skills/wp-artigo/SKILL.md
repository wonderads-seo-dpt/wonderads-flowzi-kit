---
name: wp-artigo
description: >
  Escreve um artigo para o blogue de um cliente e grava-o em rascunho no WordPress ligado:
  estrutura, texto, resumo (meta description), perguntas frequentes com marcação para o
  Google e sugestões de ligação interna. Gatilhos: "escreve o artigo", "artigo de blog",
  "novo post", "/wp-artigo".
---

# Escrever um artigo

## Antes de escrever

1. Confirmar que há cliente activo e ligação: correr `node scripts/estado.mjs`. Se disser "Sem cliente activo", sugerir `/comecar` (treino) ou `/cliente` e parar. Se disser "sem ligação", sugerir `/wp-ligar` e parar. Se disser "loja Shopify", este cliente não é WordPress: usar `/shopify-artigo` e parar.
2. Ler `clientes/<cliente>/CLAUDE.md`, sobretudo o tom de voz, o que nunca dizer e as regras aprendidas.
3. Se houver conteúdo aprovado do cliente (texto do site, documentos na pasta), usar esses factos. **Nunca inventar números, preços, prazos, nomes de médicos ou resultados clínicos.** O que não estiver escrito fica `[por confirmar]` no texto e é dito à pessoa no fim.
4. Perguntar só o que faltar, no máximo três perguntas: o tema exacto, para quem é, que acção se quer no fim.
5. Ler `/seo`. A palavra-chave escolhe-se com a pessoa e vai em `seo: { chave: '...' }` no ficheiro do artigo; o artigo tem pelo menos 1 500 palavras, salvo outro valor no `seo.json` do cliente.

## Estrutura

- O título é a pergunta ou a promessa do artigo. Em blocos normais, o WordPress mostra-o como H1 e dentro do texto só há H2 e H3. Em Elementor, o título do WordPress fica escondido: a primeira peça do artigo é `titulo(..., 'h1')` e o resto H2 e H3.
- Resposta directa nos primeiros dois parágrafos. Quem chega de uma pesquisa quer a resposta, não a introdução.
- Subtítulos que são perguntas reais, quando fizer sentido. Secções curtas.
- Fecho com o passo seguinte concreto (marcar consulta, ver a página do serviço).
- Resumo entre 140 e 160 caracteres, a dizer o que a pessoa ganha em ler. Vai para o campo `resumo`.

## Ligação interna

Correr `node scripts/listar.mjs` para ver as páginas e os artigos publicados. Propor três a seis ligações para páginas de serviço, com texto que descreve o destino, e o inverso: que páginas deviam ligar para este artigo. Entregar a lista à pessoa; não alterar outras páginas.

## Igual ao blogue do cliente

Se o pedido for "parecido com os artigos do blogue", ver primeiro um ou dois artigos publicados do cliente (com o Claude in Chrome ou a ler a página pública) e anotar os componentes que se repetem: imagem de topo, linha do autor, caixa de resumo, citações, cartões, caixas de alerta, perguntas frequentes. Só ler: nunca escrever no site do cliente.

- **Se o blogue é feito em Elementor** (a página tem `elementor` no código): construir o artigo com as peças de `scripts/elementor.mjs`, num ficheiro `clientes/<cliente>/paginas/<slug>.mjs` com `tipo: 'artigo'` e `resumo`, e gravar com `node scripts/criar-pagina.mjs clientes/<cliente>/paginas/<slug>.mjs`. Reproduzir os componentes com as peças reais (`seccao`, `cartao`, `citacao`, `lista`, `perguntas`), com a mesma primeira linha (`import`) de `clientes/<cliente>/paginas/exemplo-implantes.mjs`. Nunca HTML colado num widget de código. As `perguntas` já levam a marcação FAQPage para o Google.
- **Se não é Elementor**: blocos normais, como abaixo.

As imagens de topo vêm da biblioteca do cliente ou ficam com um marcador `[imagem por escolher]`; nunca inventar fotografias.

## Gravar (blocos normais)

Escrever `clientes/<cliente>/artigos/<slug>.mjs` no formato de `clientes/<cliente>/artigos/exemplo-artigo.mjs` (blocos `h2`, `h3`, `p`, `lista`, e `perguntas` para a FAQ) e correr:

```
node scripts/criar-artigo.mjs clientes/<cliente>/artigos/<slug>.mjs
```

O artigo fica em rascunho. Para refazer depois de um reparo, editar o mesmo ficheiro e correr o mesmo comando: o script actualiza o rascunho que criou nesse site.

O script faz também o documento para o cliente validar o texto (`clientes/<cliente>/validacao/…docx`). Na entrega, dizer onde está e perguntar se é para ir para o Drive: `node scripts/documento.mjs <id> --drive`.

## Sectores regulados

Em saúde, bem-estar, finanças ou jurídico: nada de alegações de tratamento, cura ou resultado garantido. Listar no fim todas as afirmações que precisam de validação do cliente.

## Entregar

Por esta ordem: a ligação de edição e a de pré-visualização, o número de palavras, um título SEO (50 a 60 caracteres) e a meta description (o resumo) para o plugin de SEO, a lista de ligações internas propostas, e o que ficou `[por confirmar]`. Depois, sugerir `/wp-rever <id>`.
