---
name: shopify-ligar
description: >
  Liga o cliente activo à loja Shopify dele, em segurança: o dono da loja cria uma app com
  permissões só de conteúdo, a pessoa grava a chave sem a passar pelo chat, e o Claude lê a loja
  sem mexer em nada (plano, permissões, blogues). Usar antes do primeiro trabalho num cliente
  Shopify. Gatilhos: "liga à loja", "cliente Shopify", "configurar a Shopify", "/shopify-ligar".
---

# Ligar o cliente à loja Shopify

## Antes

Correr `node scripts/estado.mjs`. Se já mostrar `loja Shopify, só escondido · <loja>`, o cliente já está ligado: correr só o passo 3.

Na Shopify não há staging para páginas e artigos: o kit grava na loja real, **sempre escondido**. Ninguém de fora vê o que está escondido. Para publicar, esconder ou apagar há o `/shopify-publicar`: diz antes o que vai fazer e só avança com o sim da pessoa.

## 1 · A app, feita pelo dono da loja

Desde 2026, a ligação faz-se com uma app que o **dono da loja** (ou alguém da equipa dele com a permissão "App development → Develop") cria na conta dele. Uma app criada pela agência não chega à loja de um cliente. Passar à pessoa este texto para enviar ao cliente:

```
1. Entrar em dev.shopify.com com a conta da loja.
2. Apps → Create app → "Start from Dev Dashboard". Nome: Kit WonderAds.
3. Em Versions: App URL https://shopify.dev/apps/default-app-home
   Scopes: write_content e write_files (só estes dois). Carregar em Release.
4. Installs → Install app → escolher a loja.
5. Em Settings da app, copiar o Client ID e o Client secret e enviá-los à WonderAds
   por um canal seguro (nunca por email aberto), com o endereço xxx.myshopify.com da
   loja (no painel: Definições → Domínios; não serve o domínio público, como loja.pt).
```

## 2 · Gravar a ligação, num terminal à parte

A pessoa grava a chave sem a passar pelo chat. Explicar, passo a passo:

```
1. Abrir um terminal novo na mesma pasta (no VS Code, o botão + do painel do terminal).
2. Nesse terminal, não na caixa do Claude:  node scripts/ligacao.mjs
3. Endereço: o xxx.myshopify.com da loja. Também serve colar o endereço do painel
   (admin.shopify.com/store/xxx/...), que o script converte.
4. Client ID, e depois o Client secret (não aparece enquanto se cola; é normal).
5. Voltar aqui com "feito".
```

**Nunca pedir que cole o secret no chat.** Se o colar, o dono da loja deve gerar outro na app (Settings → Rotate) e voltar-se a gravar.

## 3 · Reconhecimento, só leitura

Correr `node scripts/shopify-ligar.mjs`. Não escreve nada na loja; grava o resumo em `clientes/<cliente>/levantamento.md`. Explicar cada alerta:

| Alerta | O que dizer |
|---|---|
| A Shopify recusou a chave da app | A app não está instalada nesta loja, ou o ID/secret estão errados. Confirmar com o dono e voltar ao passo 2 |
| Sem write_content | O dono junta a permissão no Dev Dashboard, carrega em Release e reinstala |
| Sem write_files | Os textos gravam-se, mas as imagens não. Pedir ao dono |
| Permissões que o kit não usa | Pedir ao dono para as tirar: o kit só precisa de write_content e write_files |
| Sem blogue | Os artigos só entram depois de uma pessoa criar o blogue no painel |

## 4 · A marca

Abrir a loja pública e ler as cores dos botões, títulos e texto e os tipos de letra; propor os valores para `clientes/<cliente>/marca.json` e para a ficha `clientes/<cliente>/CLAUDE.md` (Plataforma: Shopify). Gravar só depois de a pessoa confirmar.

## Nunca

- Instalar ou usar o Shopify CLI, o Shopify AI Toolkit ou outra forma de mexer na loja fora dos scripts.
- Pedir ao dono permissões de temas, produtos, encomendas ou clientes.
