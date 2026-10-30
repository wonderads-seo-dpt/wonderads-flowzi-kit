---
name: cliente
description: >
  Mostra em que cliente se está a trabalhar, muda de cliente ou cria um cliente novo. Cada
  cliente tem a sua pasta em clientes/, com a marca, as regras e a ligação dele, e só um está
  activo de cada vez. Gatilhos: "muda para o cliente", "cliente novo", "em que cliente estou",
  "trabalhar na MIMUS", "/cliente".
---

# Cliente

Tudo o que o Claude faz, faz no cliente activo: a marca dele, as regras dele, o site ou a loja dele. O nome aparece na barra de baixo do Claude.

## Ver

Correr `node scripts/cliente.mjs`. Mostrar a lista e qual está activo.

## Mudar

1. Confirmar com a pessoa para que cliente vai.
2. Correr `node scripts/cliente.mjs <nome>`.
3. Pedir à pessoa que escreva `/clear` antes do próximo pedido. Uma conversa por cliente: o que se disse sobre um não pode passar para o outro.

## Criar

1. Perguntar o nome comercial. Propor o nome curto em minúsculas, sem espaços nem acentos ("Clínicas Dentárias FA" fica `clinica-fa`) e confirmar.
2. Correr `node scripts/cliente.mjs --novo <nome> "<Nome comercial>"`. Cria `clientes/<nome>/` a partir do modelo e passa a ser o cliente activo.
3. Explicar o que ficou na pasta, em quatro linhas:
   - `CLAUDE.md`: a ficha do cliente, a marca, o tom e as regras aprendidas;
   - `marca.json`: as cores e os tipos de letra que as páginas usam;
   - `paginas/` e `artigos/`: cada página e artigo feito, para se poder refazer;
   - `.env`: a ligação ao site ou à loja, que só a pessoa grava.
4. Próximo passo: perguntar se o site é WordPress ou Shopify. WordPress: `/wp-ligar`. Shopify: `/shopify-ligar`.

## Nunca

- Trabalhar em dois clientes na mesma conversa.
- Copiar o `.env`, as páginas ou as regras de um cliente para outro.
- Apagar a pasta de um cliente. Um cliente que sai fica como está.
