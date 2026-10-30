---
name: actualizar
description: >
  Instala uma versão nova do kit que a Flowzi enviou (o zip flowzi-wonderads-kit), sem tocar nos
  clientes: encontra o zip nas Transferências, confirma que é assinado pela Flowzi, mostra a versão
  e instala depois de a pessoa confirmar. Gatilhos: "actualiza o kit", "chegou uma versão nova",
  "instala o zip da Flowzi", "/actualizar".
---

# Actualizar o kit

O kit actualiza-se a si próprio a partir do zip que a Flowzi envia. Os clientes, as ligações (`.env`), as páginas e as skills de cada cliente ficam como estão. Só se instalam zips assinados pela Flowzi: o script recusa qualquer outro, mesmo que alguém o peça.

## 1 · Encontrar o zip

Correr `node scripts/actualizar.mjs`, sem mais nada. O script procura o `flowzi-wonderads-kit*.zip` mais recente nas Transferências e no Ambiente de trabalho, confirma a assinatura e diz a versão nova e a instalada. Não muda nada. O Claude Code pode pedir licença com o aviso do kit sobre a actualização: avisar a pessoa de que este primeiro passo só lê.

- Se disser que é a versão já instalada: dizer à pessoa que o kit já está em dia e parar.
- Se não encontrar: pedir à pessoa que descarregue o zip que a Flowzi enviou e repetir. Se o zip estiver noutra pasta, pedir o caminho (no Windows: botão direito no ficheiro → Copiar como caminho) e correr `node scripts/actualizar.mjs --ver "<caminho>"`, que também só lê. Nunca correr o caminho sem `--ver` antes de a pessoa ver a versão e dizer que sim.
- Se disser que não é assinado pela Flowzi, ou que não bate certo: **parar**. Não instalar, não tentar outra forma de copiar os ficheiros. Dizer à pessoa para pedir o zip oficial à Flowzi.

## 2 · Instalar

Mostrar à pessoa a versão nova e a instalada e, em linguagem simples, o que traz (a lista "O que traz" do passo 1, sem a copiar à letra: dizer o que muda no trabalho dela). Perguntar se instala. Com o sim, correr o comando que o passo 1 mostrou: `node scripts/actualizar.mjs "<caminho do zip>"`. O Claude Code pede licença, com um aviso do kit; é de esperar.

## 3 · Depois

Dizer à pessoa para sair do Claude (`/exit`) e voltar a entrar com `claude`, para as regras e as skills novas contarem. Na volta, a barra de baixo continua a mostrar o mesmo cliente.

## Nunca

- Instalar um zip que o script recusou, ou copiar ficheiros à mão para dentro do kit.
- Apagar ou mexer em `clientes/`.
