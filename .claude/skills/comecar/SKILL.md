---
name: comecar
description: >
  Primeiro contacto com o kit. Confirma que a máquina está pronta, explica o que há nesta
  pasta, levanta o WordPress de treino e liga o Claude a ele. Usar na primeira vez que alguém
  abre o kit, ou quando pedir "por onde começo", "começar", "/comecar".
---

# Começar

A pessoa do outro lado pode nunca ter usado um terminal. Falar em português corrente, um passo de cada vez, e dizer sempre o que vai acontecer antes de o fazer.

## Se já cá esteve

Se `clientes/treino/` já existir, a pessoa está a voltar (por exemplo, no dia seguinte). Não repetir a explicação: dizer "Bem-vinda de volta" e ir directamente ao passo 3. No fim, avisar que o treino voltou limpo, porque fica parado quando o computador se desliga, e propor voltar a gravar as páginas que estão em `clientes/treino/paginas/` (`node scripts/criar-pagina.mjs` para cada uma). As páginas de clientes em staging não se perdem.

## 0 · Onde vamos trabalhar

Antes de tudo, perguntar, com estas quatro opções e nada mais:

```
Onde querem trabalhar?

1. WordPress de treino, só nesta máquina (recomendado para aprender)
2. Um site de cliente, numa cópia de testes (staging)
3. O site real que os clientes vêem (produção)
4. Uma loja Shopify de cliente
```

- **1:** seguir para o passo 1.
- **2:** passar para `/cliente` (escolher ou criar o cliente) e depois `/wp-ligar`.
- **3:** explicar que no site real o Claude só grava rascunhos: nunca publica, nunca apaga, nunca mexe no que já está publicado, e quem publica é sempre uma pessoa, no WordPress. Se for isso que querem, passar para `/cliente` e depois `/wp-ligar`, e ao ligar escolher a opção 2 (site real). Se houver staging, é sempre preferível.
- **4:** explicar que na loja o Claude grava páginas e artigos escondidos (`/shopify-pagina`, `/shopify-artigo`), e que publicar, esconder ou apagar se faz com `/shopify-publicar`, que diz antes o que vai fazer e só avança com o sim da pessoa. Passar para `/cliente` e depois `/shopify-ligar`.

## 1 · A máquina

Correr `node -v`.

- Se `node` não for reconhecido, ou for inferior a 22: parar. Explicar passo a passo: abrir https://nodejs.org, botão da versão LTS, abrir o instalador (no Windows, o `.msi`) e seguir até ao fim; depois fechar o VS Code por completo (todas as janelas), voltar a abri-lo nesta pasta, escrever `claude` e `/comecar`. Um terminal novo dentro do mesmo VS Code não chega.
- Se existir: correr `node scripts/verificar.mjs`, que confirma o resto do computador (pasta, disco, Git no Windows, porta do treino, internet).

Para cada linha `PROBLEMA`, pela ordem em que aparecem:

1. Dizer o que está mal numa frase simples e o que a linha manda fazer, passo a passo.
2. Se a linha disser `node scripts/verificar.mjs --corrigir`: explicar que isto diz ao Claude Code onde está o Git, sem mexer em mais nada, e correr com a autorização da pessoa. Depois, dizer para fechar o VS Code por completo, voltar a abrir esta pasta, escrever `claude` e `/comecar`.
3. Se for preciso a pessoa fazer alguma coisa (mover a pasta, instalar, mudar de rede), esperar que diga "feito" e voltar a correr `node scripts/verificar.mjs`.

Linhas `aviso` não param nada: dizer o que significam numa frase e seguir. Só se passa ao passo 2 quando a verificação acabar com "Tudo pronto", ou só com avisos.

Se nenhum comando chegar a correr (erro de "bash", de shell ou de terminal antes de qualquer resposta), o problema é o Git no Windows: pedir para seguir o erro 5 de "Windows: quando o `claude` não funciona" no `LEIA-ME.md`, que se corre num PowerShell à parte.

## 2 · O que há nesta pasta

Explicar em seis linhas, sem jargão. Esta é a pasta de trabalho para sempre: todos os clientes vivem aqui dentro.

- `CLAUDE.md`: as regras da agência, que o Claude lê sempre que abre esta pasta.
- `.claude/skills/`: as receitas. Cada uma chama-se com uma barra: `/cliente`, `/wp-ligar`, `/wp-landing`, `/wp-seccao`, `/wp-artigo`, `/wp-rever`, `/wp-briefing`, `/design`, `/wp-design`, `/wp-replicar`, `/shopify-ligar`, `/shopify-pagina`, `/shopify-artigo`, `/shopify-publicar`, `/criar-skill`, `/aprender`, `/seo`, `/actualizar`, `/contribuir`.
- `clientes/`: uma pasta por cliente, com a marca, as regras e as páginas dele. O treino é o primeiro.
- `scripts/`: o que fala com o WordPress e com a Shopify. Ninguém precisa de os abrir.
- `treino/`: o WordPress de treino.
- A barra de baixo do Claude diz sempre em que cliente se está e se é treino, staging, site real ou loja Shopify.

## 3 · O WordPress de treino

Dizer: "Vou levantar um WordPress com Elementor só nesta máquina, para treinarmos sem tocar em nenhum cliente. A primeira vez demora 2 a 5 minutos."

Correr `node scripts/treino.mjs` com tempo limite de 10 minutos. O comando termina sozinho quando o WordPress está pronto e deixa-o a correr à parte, mesmo depois de fechar o Claude Code. Se já houver um a correr, reaproveita-o em segundos.

Se não arrancar, a mensagem diz porquê e o que fazer (porta ocupada, internet, antivírus, OneDrive, disco cheio, cache do npm). Explicar passo a passo, fazer o que ela diz e voltar a correr `node scripts/treino.mjs` uma vez. Se falhar outra vez com a mesma mensagem, ou se ela mandar enviar à Flowzi, mostrar as últimas 20 linhas de `treino/servidor.log` e sugerir enviá-las à Flowzi.

## 4 · Ligar

O script cria o cliente `treino` em `clientes/treino/` e liga-o. Se a resposta disser que o cliente activo continua a ser outro, perguntar se é para treinar agora e, se for, correr `node scripts/cliente.mjs treino`. Só depois correr `node scripts/ligar.mjs`. Mostrar o resumo: versão do WordPress, versão do Elementor, utilizador e se pode editar páginas.

## 5 · O que fazer a seguir

Terminar com isto, e nada mais:

```
Está pronto. O WordPress de treino abre no browser em http://127.0.0.1:9400/wp-admin/
(se pedir login: utilizador admin, password password).

Para experimentar:
  /wp-landing  e descrever uma página de um cliente vosso
  /wp-seccao   e pedir para redesenhar a secção 3 da página "Ortodontia"
  /wp-artigo   e pedir um artigo de blogue sobre um tema de um cliente vosso
```

## Regras

- Não preencher a marca do treino. Os clientes reais criam-se com `/cliente` e ligam-se com `/wp-ligar`.
- Se já houver outro cliente activo, o script não o troca: diz para usar `/cliente treino`.
- Para parar o WordPress de treino: `node scripts/treino.mjs --parar`. Desligar o computador também o pára; para voltar, corre-se `/comecar` outra vez (o site volta limpo).
