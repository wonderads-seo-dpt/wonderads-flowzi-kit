---
name: wp-seccao
description: >
  Redesenha uma secção de uma página Elementor que já existe, sem tocar no original: cria
  uma cópia em rascunho com a secção nova e as outras iguais. Gatilhos: "muda a secção",
  "redesenha a secção 3", "troca esta parte da página", "/wp-seccao".
---

# Redesenhar uma secção

É o pedido mais frequente: o cliente já tem o site e quer uma parte diferente.

## 1 · Ver a página

Perguntar que página (endereço, slug ou id). Correr:

```
node scripts/seccao.mjs --listar <página>
```

Mostrar a lista numerada de secções, com o primeiro título de cada uma, e confirmar qual é a secção a mudar. Se o script disser que a página não tem conteúdo Elementor, explicar que deve ser WPBakery ou blocos do WordPress e que esta skill só troca secções de páginas Elementor. Numa página feita pelo kit em blocos, refaz-se o ficheiro e grava-se de novo com `criar-pagina-blocos.mjs`.

## 2 · Perceber o pedido

Ler o conteúdo da secção actual. Por defeito, **o texto mantém-se**, porque o cliente já o aprovou. Muda o desenho. Se a pessoa pedir texto novo, aplicar as regras do `clientes/<cliente>/CLAUDE.md`.

Perguntar só o que faltar: que tipo de desenho (colunas, cartões, lista com ícones, fundo escuro) e se há referência de outro site.

## 3 · Construir

Escrever `clientes/<cliente>/paginas/<slug>-seccao-<n>.mjs` com `export default seccao([...])`, com as peças de `scripts/elementor.mjs` (ver a tabela em `/wp-landing`), com a mesma primeira linha (`import`) de `clientes/<cliente>/paginas/exemplo-implantes.mjs` e as cores do `clientes/<cliente>/marca.json`.

## 4 · Gravar

```
node scripts/seccao.mjs <página> <n> clientes/<cliente>/paginas/<slug>-seccao-<n>.mjs
```

Se a pessoa pedir correcções à secção nova, editar o mesmo ficheiro e acrescentar `--copia <id da cópia>` ao comando: actualiza a cópia que já existe em vez de criar outra.

```
```

O script:

- guarda o estado anterior em `clientes/<cliente>/copias/`;
- cria uma **página nova em rascunho**, com a secção trocada e as outras iguais;
- confirma no fim que o original ficou intacto.

## 5 · Entregar

Mostrar o resumo do script: original intacto, secção antes e depois, e as ligações para editar, pré-visualizar e comparar com o original.

Dizer que, se a nova versão for aprovada, quem gere o site decide como a pôr no lugar da original. O Claude não substitui páginas publicadas.
