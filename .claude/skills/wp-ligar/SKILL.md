---
name: wp-ligar
description: >
  Liga o cliente activo ao staging dele, em segurança: a pessoa grava a password sem a passar
  pelo chat, o Claude inspecciona o site só a ler (versão, builder, permissões) e prepara a
  marca. Usar antes do primeiro trabalho num cliente. Gatilhos: "liga ao site", "configurar o
  WordPress do cliente", "/wp-ligar".
---

# Ligar o cliente ao staging

Antes de escrever num site, perceber como ele está feito: versão, builder, permissões e marca.

## 1 · Que cliente, que site

Correr `node scripts/estado.mjs` e confirmar o cliente activo. Se for o cliente errado, ou nenhum, passar por `/cliente` primeiro. O treino liga-se sozinho com `/comecar`; este passo é para clientes reais.

Se a resposta já mostrar `staging · <endereço>`, o cliente já está ligado: correr só o passo 3. Não pedir password nova.

- **Staging primeiro.** Perguntar se há staging e, se houver, usar esse endereço. Se só houver o site real, pode-se ligar a ele: o kit grava lá só rascunhos, nunca publica e nunca apaga. A pessoa confirma-o ao ligar (opção 2 do script). O Claude nunca escreve no site real sem essa confirmação, e os scripts recusam-no mesmo que alguém peça.
- O recomendado é um utilizador com papel de **Editor** nesse staging. Com uma conta de administrador funciona, mas o kit avisa: sugerir pedir a quem gere o site um Editor só para isto.
- O staging pode estar num subdomínio (`staging.cliente.pt`) ou numa subpasta feita por um plugin (`cliente.pt/staging`). Na subpasta, o endereço leva a subpasta.
- Sem acesso ao alojamento, serve uma cópia do site no computador (por exemplo no Local, `http://cliente.local`): ver "Cliente sem staging" no LEIA-ME.
- O staging tem de ter `https://` (as cópias locais não). Sem isso, o WordPress não mostra as palavras-passe de aplicação.

## 2 · A password de aplicação

Explicar, passo a passo, que no wp-admin do staging deve:

1. Entrar no wp-admin do staging com o utilizador Editor e abrir **Perfil** no menu da esquerda (num administrador está em Utilizadores → Perfil).
2. No topo da página está o **nome de utilizador**, a cinzento: vai ser preciso.
3. No fundo da página, a secção **Palavras-passe de aplicação** (em sites em português do Brasil, "Senhas de aplicativo"; em inglês, "Application Passwords"). Dar o nome "Claude" e carregar em Adicionar.
4. Copiar a password, que só aparece uma vez. Se se perder antes de a gravar, revogá-la ali e criar outra.

Se a secção não existir, parar: o site não tem `https://` ou um plugin de segurança desligou-a. Pedir a quem gere o site.

Depois, gravar a ligação **sem passar pelo chat**:

```
1. Abrir um terminal novo na mesma pasta: no VS Code ou no Cursor, o botão + do painel do terminal.
   (No Terminal do Mac, Cmd+T; se não abrir na pasta do kit, escrever cd e um espaço e arrastar a pasta.)
2. Nesse terminal novo, não na caixa do Claude, escrever:  node scripts/ligacao.mjs   e carregar em Enter.
3. Responder às três perguntas: endereço, utilizador, password.
   A password não aparece enquanto se escreve. É normal.
   O endereço pode ser colado tal como está no browser, mesmo com /wp-admin no fim.
   Se o endereço não tiver "staging" no nome, o script pergunta o que é:
   1 se for uma cópia de testes, 2 se for o site real (aí só se gravam rascunhos), Enter se houver dúvida.
4. Fechar esse terminal (não o do Claude) e voltar aqui com "feito".
```

**Nunca pedir que cole a password no chat.** Se a colar, avisar que deve revogá-la no WordPress e gerar outra. O Claude não corre `ligacao.mjs`: está bloqueado, de propósito.

## 3 · Reconhecimento, só leitura

Correr `node scripts/ligar.mjs`. O script não escreve nada no WordPress. Mostrar o resultado e explicar cada alerta em linguagem simples.

| Alerta | O que dizer |
|---|---|
| Password à entrada (Basic Auth, típico do WP Engine) | Este caminho ainda não funciona aqui. Avisar a Flowzi. Não tentar contornar |
| Ligado ao site real | O kit grava aqui só rascunhos. Lembrar que cada rascunho aparece no wp-admin do cliente e que quem publica é uma pessoa |
| Parece produção (o endereço não tem staging, stg ou dev num subdomínio) | Os scripts lêem mas não escrevem aqui. A pessoa volta a correr `node scripts/ligacao.mjs` e escolhe 1 (staging com outro nome) ou 2 (site real, só rascunhos). Se for um staging, confirma o endereço quando ele perguntar. Se for o site real, pedir o endereço do staging |
| Respondido por outro WordPress | O endereço da subpasta está a ser respondido pelo site real. Nada foi escrito. Confirmar o endereço exacto do staging com quem o criou e voltar a ligar |
| Não respondeu como um WordPress, numa subpasta | O plugin de staging pode pedir login à entrada. Ver "Staging numa subpasta" no LEIA-ME; não tentar contornar |
| Site local não responde | Abrir o Local (ou o programa onde está a cópia) e ligar o site |
| Autenticação falhou | Confirmar o nome de utilizador (não o email) e a password de aplicação, e voltar a correr `ligacao.mjs`. Se estiverem certos, enviar o erro à Flowzi |
| Conta de administrador | Funciona, mas é mais arriscado: sugerir pedir um utilizador Editor e voltar a ligar quando houver |
| Não pode editar páginas | Pedir o papel de Editor a quem gere o site |
| O site não usa Elementor, ou o `_elementor_data` não está disponível | As páginas fazem-se em blocos do WordPress (`/wp-landing` explica como). Os artigos já eram em blocos |
| Construtor Divi, Bricks, Oxygen ou Beaver Builder | O kit não grava nesse construtor. As páginas novas em blocos abrem no editor normal do WordPress |
| WPBakery presente | As páginas feitas em WPBakery não se alteram com este kit. As novas saem em Elementor (ou em blocos, se o site não tiver Elementor) |

## 4 · A marca real

As cores do kit do Elementor nem sempre são as que o site usa. Abrir a página inicial publicada, ler as cores dos botões, dos títulos e do texto e os tipos de letra, e propor os valores para `clientes/<cliente>/marca.json` e para a secção Marca de `clientes/<cliente>/CLAUDE.md`. Se a cor dos botões não tiver contraste de 3:1 sobre fundo claro (comum em corais e amarelos), acrescentar `destaque` ao `marca.json`, uma cor da marca mais escura, usada nos ícones e nos números. Mostrar a proposta e só gravar depois de a pessoa confirmar.

## 5 · Registo

O levantamento fica em `clientes/<cliente>/levantamento.md`. Preencher com a pessoa a tabela "O cliente" do `CLAUDE.md` do cliente (staging, quem aprova a publicação). É o que permite a outra pessoa da equipa continuar o trabalho.

## Nunca

- Contornar uma firewall ou uma protecção.
- Actualizar plugins, temas ou o WordPress.
- Ler, mostrar ou copiar o conteúdo de um `.env`.
