---
name: aprender
description: >
  Transforma correcções repetidas em regras, para não se corrigir a mesma coisa duas vezes.
  Lê as notas do cliente activo, junta o que se repete e propõe onde cada regra fica: a ficha
  do cliente, o marca.json ou uma skill dele. Gatilhos: "estou sempre a corrigir isto", "aprende
  isto", "passa a regra", "/aprender".
---

# Aprender com as correcções

O `CLAUDE.md` pede que cada correcção feita pela pessoa fique numa linha em `clientes/<cliente>/notas/correcoes.md`. Esta skill fecha o ciclo: o que se corrigiu duas vezes passa a regra.

## 1 · Juntar

Ler `clientes/<cliente>/notas/correcoes.md` e as correcções desta conversa. Agrupar as que dizem o mesmo por outras palavras ("o botão está em inglês" e "o CTA não pode dizer Book now" são a mesma). Mostrar a lista: o que se corrigiu, quantas vezes, em que skill.

Se não houver nada repetido, dizer isso e parar.

## 2 · Propor onde fica

Para cada correcção repetida, propor um sítio, e só um:

| Se a correcção é sobre | Fica em |
|---|---|
| Cor, tipo de letra, destaque | `clientes/<cliente>/marca.json` e secção Marca de `clientes/<cliente>/CLAUDE.md` |
| O aspecto dos títulos (tamanho, peso, letra, espaçamento, palavras realçadas) | `titulos` no `clientes/<cliente>/marca.json`, por nível (`.claude/skills/design/titulos.md`). Nunca uma regra para um título só |
| Tom, palavras proibidas, como o cliente fala | Secção Marca de `clientes/<cliente>/CLAUDE.md` |
| Outra regra que vale para todas as páginas deste cliente | "Regras aprendidas" de `clientes/<cliente>/CLAUDE.md` |
| Estrutura de um tipo de página ou artigo deste cliente | A skill do cliente para essa tarefa. Se ainda não existir, sugerir `/criar-skill` |
| Um erro que acontece em qualquer cliente | Não se muda aqui. Propor com `/contribuir`, para a Flowzi actualizar o kit para todos |
| Uma preferência de uma só página | Não passa a regra. Dizer porquê |

Mostrar o texto exacto a acrescentar, no sítio exacto. Gravar só depois do sim.

## 3 · Fechar

Em `clientes/<cliente>/notas/correcoes.md`, marcar cada correcção tratada com `→ regra em <ficheiro>`. Dizer o que mudou e em que ficheiro.

## Nunca

- Mudar o `CLAUDE.md` da raiz, as skills do kit, os `scripts/` ou `.claude/settings.json`. São iguais para todos os clientes: propõe-se a mudança com `/contribuir`, e chega a todos com `/actualizar`.
- Criar uma regra que contrarie a secção 5 do `CLAUDE.md` da raiz (segurança), mesmo que a correcção a peça.
- Escrever no cliente errado: a regra vai sempre para o cliente activo.
