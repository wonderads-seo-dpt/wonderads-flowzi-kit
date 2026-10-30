---
name: contribuir
description: >
  Propõe à Flowzi uma melhoria ao kit para ficar para toda a equipa: um script, uma skill, uma regra
  ou uma boa prática. Vê o que mudou no kit, escreve com a pessoa o que é, porquê e como testar, faz o
  zip da proposta sem passwords nem nada de clientes e, com o sim da pessoa, diz como a mandar ao técnico
  da equipa (por WhatsApp ou email), que a abre como Pull Request no GitHub. Gatilhos: "propor isto à Flowzi",
  "partilhar com a equipa", "enviar este script à Flowzi", "isto devia ficar no kit", "/contribuir".
---

# Propor uma melhoria ao kit

O kit é de todos: o que uma pessoa melhora pode ficar para a equipa inteira. A Flowzi revê a proposta, testa-a em Windows e em Mac, assina e publica uma versão nova; todos a recebem com `/actualizar`, e o Claude conta a cada pessoa o que há de novo.

## 1 · Ver o que mudou

Correr `node scripts/contribuir.mjs`. Só lê. Compara o kit com a versão instalada e lista:

- `alterado`: ficheiros do kit que mudaram (scripts, skills, regras, guarda);
- `novo`: scripts e skills que não vêm no kit;
- `apagado`: ficheiros do kit que já não existem.

Ao lado de cada um vem o que impede de o propor, se houver alguma coisa. Se o script disser que falta o `MANIFESTO.json`, fazer o que ele diz (`/actualizar`) e voltar aqui.

Se nada mudou, a pessoa pode ter só uma ideia: aí não há zip; escreve-a ao técnico da equipa por WhatsApp ou email.

## 2 · Escolher e escrever, com a pessoa

1. Que ficheiros vão: só os da melhoria. Uma proposta, um assunto. Se a lista misturar coisas diferentes, perguntar e fazer propostas separadas.
2. Uma skill de cliente (`<cliente>-<tarefa>`) não vai assim, porque tem a marca e o texto dele. Se a ideia servir a todos, fazer com a pessoa uma versão geral, com outro nome e sem nada do cliente (nome, marca, textos, regras dele), e propor essa.
3. Ler os ficheiros que vão e confirmar que não têm passwords, chaves, endereços de sites de clientes nem textos de clientes. Uma password ou chave nunca fica num script: o script lê-a do `.env`, como os do kit.
4. Escrever com a pessoa o `PROPOSTA.md`, na raiz do kit, nesta forma:

```
# <Assunto numa linha>

## O quê
<o que faz, em duas ou três frases>

## Porquê
<que problema resolve, e em que trabalho apareceu>

## Como testar
<passos curtos, de preferência no WordPress de treino>

## Quem
<nome de quem propõe>
```

## 3 · Fazer o zip

Correr `node scripts/contribuir.mjs --zip "<assunto>" <ficheiros ou pastas>`, com os caminhos como aparecem na lista (uma skill nova pode ir pela pasta, por exemplo `.claude/skills/<nome>`). O zip `proposta-kit-<data>-<assunto>.zip` fica nas Transferências, com o `PROPOSTA.md` lá dentro.

Se o script recusar (um `.env`, ficheiros de `clientes/`, ficheiros grandes ou que não são texto, o que parece uma password ou uma chave), dizer à pessoa o motivo, corrigir com ela e voltar a correr. Nunca contornar: não copiar ficheiros à mão para um zip, não tirar a password só para o zip e voltar a pô-la.

## 4 · Enviar

O script diz como:

- **Pull Request** (quando o computador tem o gh com sessão de alguém que pode escrever no repositório): perguntar "Abro a proposta no GitHub, como Pull Request, com a tua conta <conta>?". Só com o sim, correr o comando que o script mostrou: `node scripts/contribuir.mjs --pr "<caminho do zip>"`. O Claude Code pede licença com um aviso do kit, porque envia ficheiros para fora do computador; é de esperar. Mostrar à pessoa o link do Pull Request.
- **Nos outros casos** (quase sempre): dizer à pessoa onde ficou o zip, nas Transferências, e que o mande ao técnico da equipa por WhatsApp ou por email, como qualquer ficheiro. Não é preciso conta no GitHub. Se a pessoa tiver conta e preferir, o link que o script deu abre uma Issue: entrar no GitHub, confirmar o título, arrastar o zip para a caixa de texto e carregar em "Submit new issue".

## 5 · Depois

Dizer à pessoa o que acontece: a Flowzi revê, testa e, se a proposta entrar, publica uma versão nova; quando abrir o Claude, ele avisa que há versão nova, e `/actualizar` instala-a. Até lá, a mudança fica só no kit dela.

Avisar que a actualização seguinte substitui a pasta `scripts/` e as skills do kit pela versão oficial: um script novo que ainda não entrou desaparece do kit nessa altura, mas continua no zip da proposta, nas Transferências.

## Nunca

- Propor `.env`, passwords, chaves, ficheiros de `clientes/` ou textos de clientes.
- Enviar com `git`, `gh` ou `curl` directamente: só pelo script, que confirma o que sai.
- Abrir o Pull Request sem a pessoa ter dito que sim.
