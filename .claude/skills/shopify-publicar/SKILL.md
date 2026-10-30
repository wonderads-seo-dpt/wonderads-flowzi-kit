---
name: shopify-publicar
description: >
  Publica, esconde ou apaga uma página ou um artigo na loja Shopify do cliente activo, sempre
  depois de dizer à pessoa o que vai acontecer e de ela dizer que sim. Gatilhos: "publica na
  Shopify", "põe visível", "esconde a página", "apaga o artigo", "/shopify-publicar".
---

# Publicar, esconder ou apagar na Shopify

A loja é a loja real do cliente: o que se publica fica logo à vista de quem a visita, e o que se apaga não volta (a Shopify não tem reciclagem). Por isso, avisa-se sempre antes e só se avança com o sim da pessoa.

1. `node scripts/estado.mjs` tem de mostrar `loja Shopify`. Se não, `/shopify-ligar` e parar.
2. Saber o quê: o ficheiro do kit (`clientes/<cliente>/paginas/<handle>.mjs` ou `artigos/<handle>.mjs`) ou o número que aparece em `node scripts/shopify-listar.mjs`.
3. Ver o que vai acontecer, sem mudar nada:
   ```
   node scripts/shopify-publicar.mjs <publicar|esconder|apagar> clientes/<cliente>/paginas/<handle>.mjs
   node scripts/shopify-publicar.mjs <publicar|esconder|apagar> pagina <número>     (ou artigo <número>)
   ```
4. Dizer à pessoa, por palavras simples, o que o script mostrou: que página ou artigo, em que loja, em que endereço, e o que acontece (fica visível, deixa de se ver, desaparece). Antes de publicar, se o texto ainda não foi revisto, relê-lo com a lista "Shopify" do `/seo` e as secções 3 e 4 do `CLAUDE.md` (o `/wp-rever` não lê a loja). Perguntar se avança.
5. Só com o sim: o mesmo comando com `--confirmo` no fim. O Claude Code mostra ainda um "Aviso do kit"; a pessoa confirma lá também.
6. Entregar o que o script mostrou: o estado final, o link do painel ou, ao apagar, onde ficou a cópia (`copias/`).

Para mudar uma página que já está publicada: esconder, gravar com `/shopify-pagina` (ou `/shopify-artigo`) e voltar a publicar.
