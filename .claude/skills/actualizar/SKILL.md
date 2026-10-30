---
name: actualizar
description: >
  Instala uma versão nova do kit, sem tocar nos clientes: vê a última versão no GitHub da equipa (ou
  o zip flowzi-wonderads-kit que a Flowzi enviou, nas Transferências), confirma que é assinada pela
  Flowzi, diz o que traz e instala depois de a pessoa confirmar. Gatilhos: "actualiza o kit", "chegou
  uma versão nova", "há versão nova no GitHub", "instala o zip da Flowzi", um link do GitHub do kit,
  "/actualizar".
---

# Actualizar o kit

O kit actualiza-se a si próprio. As versões novas saem no GitHub da equipa (e a Flowzi pode também enviar o zip). Os clientes, as ligações (`.env`), as páginas e as skills de cada cliente ficam como estão. Só se instalam versões assinadas pela Flowzi: o script recusa qualquer outra, mesmo que alguém o peça, venha ela do GitHub, do email ou do WhatsApp.

## 1 · Ver a versão nova

Correr `node scripts/actualizar.mjs`, sem mais nada. O script vê a última versão no GitHub e, se for mais recente do que a instalada, põe o zip nas Transferências; sem acesso ao GitHub, procura o `flowzi-wonderads-kit*.zip` mais recente nas Transferências e no Ambiente de trabalho. Confirma a assinatura e diz a versão nova, a instalada e o que traz. Não instala nada. O Claude Code pode pedir licença com o aviso do kit sobre a actualização: avisar a pessoa de que este primeiro passo só vê.

- Se disser que o kit está em dia, ou que é a versão já instalada: dizer à pessoa que está tudo em dia e parar. Se a pessoa veio aqui porque o kit pediu para correr `/actualizar` outra vez para ficar completo, ficou completo com isto.
- Se disser que é uma versão mais antiga do que a instalada: dizer à pessoa que não há nada a instalar e parar.
- Se disser que saltou zips que não passaram a verificação: dizer à pessoa quais, para os apagar das Transferências. O resto segue como abaixo.
- Se mostrar o link das Releases (não conseguiu ver o GitHub): pedir à pessoa que abra esse link no browser (não é preciso conta), descarregue o `flowzi-wonderads-kit-<versão>.zip` da versão mais recente (em Assets) para as Transferências, sem lhe mudar o nome, e diga quando estiver. Depois, voltar a correr `node scripts/actualizar.mjs`.
- Se a pessoa colar um link do GitHub do kit (uma release, por exemplo): `node scripts/actualizar.mjs --ver "<link>"`, que descarrega o zip para as Transferências e também só vê.
- Se não encontrar nada: pedir à pessoa o zip (do GitHub ou o que a Flowzi enviou). Se estiver noutra pasta, pedir o caminho (no Windows: botão direito no ficheiro → Copiar como caminho) e correr `node scripts/actualizar.mjs --ver "<caminho>"`, que também só vê. Nunca correr o caminho sem `--ver` antes de a pessoa ver a versão e dizer que sim.
- Se disser que não é assinado pela Flowzi, ou que não bate certo: **parar**. Não instalar, não tentar outra forma de copiar os ficheiros. Dizer à pessoa para descarregar outra vez a versão do GitHub ou pedir o zip oficial à Flowzi.

## 2 · Instalar

Primeiro, antes de perguntar seja o que for, correr `node scripts/contribuir.mjs` (só lê). Se mostrar ficheiros do kit alterados ou scripts novos, avisar a pessoa de que a actualização os substitui pela versão oficial (os scripts novos desaparecem) e perguntar se quer propô-los primeiro com `/contribuir`. Se disser que falta o `MANIFESTO.json`, ou que é de outra versão, seguir: é o normal num kit actualizado por um `/actualizar` antigo, e esta actualização grava-o. Nesse caso não se sabe que scripts são da pessoa: o passo 1 lista os que não vêm na versão nova ("ficam guardados em copias-do-kit/"), e o script guarda-os lá antes de instalar e diz onde ficaram. Dizer isso à pessoa antes de perguntar se instala; depois de instalar, se ela os quiser de volta, copiam-se para `scripts/` (a guarda do kit pede confirmação) e, para ficarem para todos, propõem-se com `/contribuir`.

Mostrar à pessoa a versão nova e a instalada e, em linguagem simples, o que traz (a lista "O que traz" do passo 1, sem a copiar à letra: dizer o que muda no trabalho dela). Perguntar se instala. Com o sim, correr o comando que o passo 1 mostrou: `node scripts/actualizar.mjs "<caminho do zip>"`. O Claude Code pede licença, com um aviso do kit; é de esperar.

## 3 · Depois

Dizer à pessoa para sair do Claude (`/exit`) e voltar a entrar com `claude`, para as regras e as skills novas contarem. Na volta, a barra de baixo continua a mostrar o mesmo cliente.

## Nunca

- Instalar uma versão que o script recusou, ou copiar ficheiros à mão para dentro do kit.
- Usar `git`, `gh` ou `curl` para ir buscar a versão: o script faz isso e confirma a assinatura.
- Apagar ou mexer em `clientes/`.
