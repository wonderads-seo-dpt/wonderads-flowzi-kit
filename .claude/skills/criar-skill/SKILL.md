---
name: criar-skill
description: >
  Cria uma skill própria deste cliente para uma tarefa que se repete (por exemplo "página de
  tratamento da clínica X" ou "artigo do blogue da loja Y"), com a estrutura, o tom e as regras
  dele já escritos, para que saia sempre igual. Gatilhos: "cria uma skill", "faz disto uma
  receita", "isto repete-se sempre", "/criar-skill".
---

# Criar uma skill deste cliente

As skills do kit (`/wp-landing`, `/wp-artigo`, `/wp-seccao`) servem qualquer cliente. Uma skill de cliente fixa o que é dele: as secções que as páginas dele têm sempre, os botões, o tom, o que nunca se diz. O nome começa pelo do cliente, e a skill recusa trabalhar se o cliente activo for outro.

## 1 · A tarefa

Perguntar, uma de cada vez:

1. Que tarefa se repete? Uma frase: "página de cada tratamento", "artigo mensal do blogue".
2. Há uma página ou artigo do site que seja o modelo? Se houver, ler pela API (`node scripts/listar.mjs`, depois `node scripts/seccao.mjs --listar <página>`) e descrever a estrutura dele à pessoa.
3. O que tem de sair sempre igual: ordem das secções, botão e destino, bloco de contactos, frases fixas.
4. O que já foi corrigido mais de uma vez. Ver `clientes/<cliente>/notas/correcoes.md`, se existir.

## 2 · Escrever

Nome: `<cliente>-<tarefa>`, em minúsculas e sem acentos (`clinica-sorriso-tratamento`). Criar `.claude/skills/<nome>/SKILL.md` com esta forma:

```
---
name: <nome>
description: >
  <o que faz, numa frase>. Gatilhos: "<como a equipa pede isto>", "/<nome>".
---

# <Título>

Só para o cliente <cliente>. Se `node scripts/cliente.mjs` mostrar outro cliente activo, parar e sugerir `/cliente <cliente>`.

Parte de /<skill do kit em que assenta>. Ler primeiro clientes/<cliente>/CLAUDE.md e clientes/<cliente>/marca.json.

## O que perguntar
<só o que muda de vez para vez: o tratamento, a palavra-chave, a localidade>

## Estrutura, sempre esta
<secções por ordem, com o que vai em cada uma e as peças de scripts/elementor.mjs>

## Texto
<tom, frases fixas, palavras que este cliente usa e as que não usa>

## Gravar
<o mesmo comando da skill do kit, com o ficheiro em clientes/<cliente>/paginas/ ou artigos/>

## Nunca
- Publicar, apagar, ou gravar no site real sem ser em rascunho (secção 5 do CLAUDE.md).
- <o que este cliente não quer>
```

Mostrar a skill inteira à pessoa antes de gravar e só gravar depois do sim.

## 3 · Experimentar

Pedir à pessoa que a use já, num caso real, no treino ou no staging. Se ela não aparecer na lista do `/`, sair do Claude e voltar a entrar.

## Regras de uma skill de cliente

- Assenta sempre numa skill do kit e grava com os mesmos scripts. Uma skill nunca chama o WordPress de outra forma.
- Não contradiz o `CLAUDE.md` da raiz. Se a pessoa pedir algo que choque com as secções 3 a 7, dizer qual regra e não escrever.
- Não leva endereços, utilizadores nem passwords.
- Não fixa tamanhos nem estilos de títulos: esses vivem em `titulos` no `marca.json` do cliente (`.claude/skills/design/titulos.md`).
- Não altera as skills do kit, os `scripts/` nem `.claude/settings.json`. O que é deste cliente vive na skill dele.
