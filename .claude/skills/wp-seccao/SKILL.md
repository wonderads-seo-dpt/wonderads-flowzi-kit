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

Mostrar a lista numerada de secções, com o primeiro título de cada uma, e confirmar qual é a secção a mudar.

**SEO antes de mexer:** correr `node scripts/rever.mjs <página>` sobre a original (com `--chave "..."` se se souber a palavra-chave, `--tipo home` na página inicial) e guardar o resultado: é a referência para a cópia. Ver na secção a mudar o que conta para o SEO e não se pode perder: o h1 (se for o herói), a palavra-chave nas primeiras 100 palavras, os níveis dos títulos, telefones com `*`/`**` e a nota de custo, botões com `id`, ligações internas e widgets de schema (`wa-schema`). Se o script disser que a página não tem conteúdo Elementor, explicar que deve ser WPBakery ou blocos do WordPress e que esta skill só troca secções de páginas Elementor. Numa página feita pelo kit em blocos, refaz-se o ficheiro e grava-se de novo com `criar-pagina-blocos.mjs`.

## 2 · Perceber o pedido

Ler o conteúdo da secção actual. Por defeito, **o texto mantém-se**, porque o cliente já o aprovou. Muda o desenho. Se a pessoa pedir texto novo, aplicar as regras do `clientes/<cliente>/CLAUDE.md` e as regras comuns do `/seo`, com a checklist do tipo da página (`home.md`, `servico-patologia.md`, `artigo.md`) para a parte que a secção cobre.

Perguntar só o que faltar: que tipo de desenho (colunas, cartões, lista com ícones, fundo escuro) e se há referência de outro site.

Se o pedido for sobre o aspecto dos títulos ("os títulos estão sem graça", "faz os h2 como este"), não é uma secção: é o sistema de títulos da página toda. Seguir `.claude/skills/design/titulos.md`: gravar em `titulos` no `marca.json` e uniformizar com `node scripts/titulos.mjs <página>`, que cria a cópia em rascunho.

## 3 · Construir

Escrever `clientes/<cliente>/paginas/<slug>-seccao-<n>.mjs` com `export default seccao([...])`, com as peças de `scripts/elementor.mjs` (ver a tabela em `/wp-landing`), com a mesma primeira linha (`import`) de `clientes/<cliente>/paginas/exemplo-implantes.mjs` e as cores do `clientes/<cliente>/marca.json`. Os títulos vão sem tamanho nem peso: seguem `titulos` no `marca.json`. Antes de construir, correr `node scripts/titulos.mjs --ver <página>`: se o `marca.json` ainda não tiver `titulos`, ou se o estilo mais usado na página for outro, propor `titulos` a partir dos títulos da página (`.claude/skills/design/titulos.md`) e gravar só com o sim. Sem isto, a secção nova sai com títulos diferentes dos do resto da página.

A secção nova mantém o SEO da antiga: os mesmos níveis de títulos (um h1 só se a antiga o tinha), a palavra-chave onde estava, as ligações internas, os telefones com `*`/`**` (e a nota, se estava nesta secção), os botões de conversão com `botao(..., { id })` (o mesmo id da antiga, para as conversões continuarem a contar) e o schema da página: se a secção antiga tinha um widget de schema, vai também para a nova com `schema(...)`. Se a página não tiver o schema do seu tipo (o rever diz "Falta schema"), acrescentá-lo nesta secção.

## 4 · Gravar

```
node scripts/seccao.mjs <página> <n> clientes/<cliente>/paginas/<slug>-seccao-<n>.mjs
```

Se a pessoa pedir correcções à secção nova, editar o mesmo ficheiro e acrescentar `--copia <id da cópia>` ao comando: actualiza a cópia que já existe em vez de criar outra:

```
node scripts/seccao.mjs <página> <n> clientes/<cliente>/paginas/<slug>-seccao-<n>.mjs --copia <id da cópia>
```

O script:

- guarda o estado anterior em `clientes/<cliente>/copias/`;
- cria uma **página nova em rascunho**, com a secção trocada e as outras iguais;
- confirma no fim que o original ficou intacto.

## 5 · Rever a cópia

Correr `node scripts/rever.mjs <id da cópia>` com as mesmas opções da original e comparar: a cópia não pode ter apontamentos novos de SEO (h1, saltos de títulos, palavra-chave, palavras abaixo do mínimo, telefones, nota de custo, botões sem id, schema em falta ou repetido, ligações internas a menos). Se tiver, corrigir o ficheiro e gravar com `--copia`. Os que já vinham da original dizem-se à pessoa, sem os corrigir fora da secção pedida.

## 6 · Entregar

Mostrar o resumo do script: original intacto, secção antes e depois, e as ligações para editar, pré-visualizar e comparar com o original. Juntar o SEO: o que o rever disse da original e da cópia, e o que melhorou ou ficou igual.

Dizer que, se a nova versão for aprovada, quem gere o site decide como a pôr no lugar da original. O Claude não substitui páginas publicadas.

## Cabeçalho, rodapé e modelos

O cabeçalho, o rodapé, as secções guardadas e os popups do Elementor são modelos, não páginas. Vêem-se com `node scripts/listar.mjs --modelos` (número, tipo, estado e, no Elementor Pro, onde está em uso), e trabalham-se como uma página, pelo número: `node scripts/seccao.mjs --listar <número>` e depois `node scripts/seccao.mjs <número> <n> clientes/<cliente>/paginas/<modelo>-seccao-<n>.mjs`.

A cópia é um **modelo novo em rascunho**, chamado "[rascunho: secção n nova] <nome>", do mesmo tipo (cabeçalho com cabeçalho) e com a secção trocada. Não leva as condições de apresentação (onde o modelo aparece), por isso não muda nada no site. O kit nunca toca no modelo original, nem nas condições, nem no Kit do Elementor (as cores e letras de todo o site).

Pôr a cópia no lugar do original é de uma pessoa, à mão: no wp-admin, Elementor → Modelos (no Elementor Pro, Modelos → Theme Builder), abrir a cópia, carregar em Publicar e escolher as condições (por exemplo, todo o site), e tirar as condições ao modelo antigo para não ficarem dois. Dizer isto à pessoa no fim; o Claude não faz este passo, nem no browser.

Se o script disser que o Elementor só mostra os modelos a administradores, é o próprio Elementor a fechar os modelos à API a quem é Editor. Não se contorna: mostrar a mensagem e as duas saídas que ela dá.
