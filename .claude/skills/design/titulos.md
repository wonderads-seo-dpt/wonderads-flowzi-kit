# Títulos: um estilo por nível

Lido pelo `/design`, `/wp-design`, `/wp-landing`, `/wp-seccao` e `/wp-replicar`. Os títulos de um cliente são um sistema: um estilo para o h1, um para o h2, um para o h3 e um para o rótulo (a etiqueta pequena por cima de um título), gravados em `clientes/<cliente>/marca.json`, em `"titulos"`. As peças aplicam-no sozinhas a todos os títulos (`titulo`, `rotulo` e o título da `caixaIcone`), no Elementor e nos blocos do WordPress. Muda-se num só sítio.

## Os campos

```json
"titulos": {
  "estilo": "clinica-luz",
  "h1": { "familia": "Playfair Display", "tamanho": 60, "telemovel": 34, "peso": 500, "altura": 1.1, "espacamento": -1, "destaque": "marcador" },
  "h2": { "tamanho": 40, "peso": 600, "cor": "#1D1D1D", "altura": 1.15, "espacamento": -0.5 },
  "h3": { "tamanho": 22, "peso": 600, "cor": "#1D1D1D", "altura": 1.3 },
  "rotulo": { "tamanho": 13, "peso": 700, "cor": "#147A78", "espacamento": 3, "maiusculas": true },
  "destaque": "sublinhado"
}
```

| Campo | O que é | Sem ele |
|---|---|---|
| `familia` | uma Google Font | `tipografia.titulos` (no rótulo, `tipografia.corpo`) |
| `tamanho` | px em computador | 38 (rótulo 14) |
| `tablet`, `telemovel` | px | 82% e 64% do tamanho, nunca menos de 20 no telemóvel nem acima do tamanho de computador; o rótulo não reduz |
| `peso` | 100 a 900 | 700 no h1 e no h2, 600 no h3 e no rótulo |
| `cor` | #hex | `cores.principal` |
| `altura` | altura da linha, em em | 1.1 no h1, 1.2 no h2 e no h3, 1.4 no rótulo |
| `espacamento` | espaço entre letras, em px | nenhum (rótulo 2) |
| `maiusculas`, `italico` | `true` ou `false` | não (o rótulo vai em maiúsculas) |
| `destaque` | como saem as palavras em `<em>` | em itálico, como sempre |

Números sem aspas e com ponto (`1.2`). `estilo` diz de que estilo do `/design` vieram. O `destaque` fora dos níveis vale para h1, h2 e h3. Cada nível é opcional: o que não estiver escrito fica com o valor do kit.

## Destaque

As palavras realçadas escrevem-se com `<em>` no texto: `titulo('Sorrisos <em>saudáveis</em>', 'h1')`.

- `"cor"`: na cor de destaque (`cores.destaque`, ou o acento).
- `"sublinhado"`: uma linha na cor de destaque.
- `"marcador"`: uma faixa por baixo das palavras, na cor de acento; num título claro (sobre fundo escuro) o fundo fica cheio, com o texto que melhor se lê.
- `"degrade"`: texto em degradê, do destaque para o acento. Só nos blocos do WordPress: no Elementor gratuito o WordPress tira esse CSS e as palavras saem na primeira cor.

Para escolher as cores: `{ "estilo": "marcador", "cor": "#FF8A8B" }` (mais `cor2` no degradê, `peso` e `italico`).

## Regras

1. **Nunca se estiliza um título um a um.** Com `titulos` no marca.json, os títulos vão sem `tamanho`, `peso`, letra nem espaçamento. Na chamada só o que depende do sítio: `cor` num título sobre fundo escuro (`'#FFFFFF'`) e `alinhar`.
2. **Sem `titulos` no marca.json**, antes da primeira página propor o de h1, h2, h3 (e rótulo, se a página o usar), a partir de um estilo do `/design`, do `design.md` ou da referência, e gravar com o sim da pessoa. Não passar tamanhos título a título para contornar.
3. **Pedido para mudar o aspecto de um título** ("põe este título maior", "faz como na referência") é para todos do mesmo nível. Confirmar numa linha: "Mudo todos os h2 deste cliente, nesta página e nas outras?". Gravar em `titulos`, correr `node scripts/titulos.mjs --ver` (valida e avisa do contraste) e voltar a gravar a página: feita pelo kit, com o comando que a gravou (`criar-pagina.mjs`, `criar-pagina-blocos.mjs` ou `shopify-pagina.mjs`); uma página Elementor que já existia, com `node scripts/titulos.mjs <página>` (ver abaixo). As outras páginas deste cliente já gravadas pelo kit (em `clientes/<cliente>/paginas/`, com `.wp.json` ou `.shopify.json` ao lado) só mudam quando se voltarem a gravar: dizer quais são e perguntar se se gravam também.
4. **Excepção** só quando a pessoa pede explicitamente um título diferente dos outros: opções nesse título, ou `extra` (Elementor) / `css` (blocos). Anotar em `notas/correcoes.md`.
5. Um erro no `titulos` pára o script com a mensagem do campo errado. Corrigir o marca.json, não contornar.

## Numa página que já existe (Elementor)

- `node scripts/titulos.mjs --ver <página>`: os títulos por nível, com os estilos diferentes ("h2: 3 estilos diferentes"), cada um nos campos do marca.json, e qual é igual ao marca.json. Mostrar isto à pessoa.
- Se ela apontar um título ("como este"), passar os campos desse estilo para `titulos`.
- `node scripts/titulos.mjs <página>`: cria uma cópia em rascunho, "[rascunho: títulos uniformizados]", com todos os títulos no estilo do marca.json e o texto igual; o original fica intacto. O que o marca.json não diz fica como cada título tinha, um título claro fica com a sua cor, e saem as sombras e os contornos. Se o resumo disser que ainda há estilos diferentes, acrescentar o campo que falta e correr com `--copia <id da cópia>`.
- Uma página feita pelo kit não precisa disto: basta voltar a gravar o ficheiro dela (`criar-pagina.mjs` ou `criar-pagina-blocos.mjs`).
- Numa página em blocos do WordPress, o `titulos.mjs` só mostra os estilos (`--ver`).
