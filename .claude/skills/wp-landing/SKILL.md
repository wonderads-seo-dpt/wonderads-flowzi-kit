---
name: wp-landing
description: >
  Constrói uma página nova em Elementor nativo (containers e widgets reais), ou em blocos do
  WordPress num site sem Elementor, e grava-a em rascunho no WordPress ligado. Parte de um briefing ou de um pedido concreto, com a marca
  do marca.json. Gatilhos: "faz uma página", "constrói a página", "monta a landing",
  "/wp-landing".
---

# Construir uma página nova

## Antes de começar

1. Confirmar que há cliente activo e ligação: correr `node scripts/estado.mjs`. Se disser "Sem cliente activo", sugerir `/comecar` (treino) ou `/cliente` e parar. Se disser "sem ligação", sugerir `/wp-ligar` e parar. Se disser "loja Shopify", este cliente não é WordPress: usar `/shopify-pagina` e parar.
2. Ler `clientes/<cliente>/CLAUDE.md` e `clientes/<cliente>/marca.json`. As cores, os tipos de letra e as regras aprendidas vêm daí, nunca de escolha própria. Se houver um estilo aprovado em `clientes/<cliente>/estilos/` (feito com `/design`; com mais do que um, perguntar qual), seguir a escala, a paleta e as assinaturas dele, e dizer na entrega que estilo se usou. Os títulos são um sistema, em `titulos` no `marca.json`: ler `.claude/skills/design/titulos.md` e, se o `marca.json` ainda não os tiver, propô-los antes de construir. Se este cliente tiver uma skill própria para este tipo de página (`/<cliente>-…`), usar essa.
3. Ter o conteúdo. Pode vir de três sítios, por esta ordem:
   - um briefing em `clientes/<cliente>/briefings/` (feito com `/wp-briefing`);
   - o texto de uma página que já existe no site e que o cliente já aprovou (ler pela API, não inventar);
   - o pedido da pessoa, se tiver o essencial: para quem é, de onde vem o texto, que acção, que estrutura.

   Se faltar o essencial, fazer no máximo três perguntas. Nunca inventar preços, nomes de médicos, números ou testemunhos: o que não está escrito fica como `[por confirmar]` no texto.
4. Numa página de SEO, ler primeiro `/seo`: a palavra-chave escolhe-se com a pessoa e vai no ficheiro em `seo: { chave: '...', titulo: '...', descricao: '...' }`, com pelo menos 1 500 palavras. Numa página de destino ou de contactos: `seo: { tipo: 'destino' }`.

## Construir

Escrever um ficheiro `clientes/<cliente>/paginas/<slug>.mjs` com as peças de `scripts/elementor.mjs`. O exemplo completo está em `clientes/<cliente>/paginas/exemplo-implantes.mjs`: copiar a primeira linha (o `import`) tal como está. As peças disponíveis são:

| Peça | Para quê |
|---|---|
| `seccao([...], { fundo, topo, base, alinhar, estreita })` | Uma secção da página. Um container por secção lógica. `estreita` para largura de leitura (artigos) |
| `linha([...])` · `coluna([...], largura%)` | Colunas, que passam a uma só no telemóvel |
| `titulo(texto, 'h1'…'h3', { cor, alinhar })` | Títulos. Um só `h1`. Tamanho, peso e letra vêm de `titulos` no `marca.json`, não da chamada; `<em>` nas palavras a realçar |
| `rotulo(texto)` | Etiqueta pequena por cima de um título ("TRATAMENTOS") |
| `texto(html, { cor, tamanho })` | Parágrafos |
| `botao(etiqueta, destino)` | Botões. A etiqueta diz o que acontece ("Marcar avaliação") |
| `lista([...])` · `caixaIcone(icone, titulo, texto)` | Argumentos e serviços |
| `numero(valor, legenda)` | Números fixos, em formato português (`2 400`) |
| `perguntas([[p, r], ...])` | Perguntas frequentes em acordeão |
| `imagem(url, alt)` | Imagens, sempre com texto alternativo |
| `cartao([...], { fundo, borda, largura })` | Caixas com fundo e cantos redondos: resumo, alerta, prós e contras |
| `citacao(frase)` | Frase em destaque, com barra na cor de acento |

Fotografias: primeiro as de `clientes/<cliente>/imagens/` ou da Biblioteca de Media do site. Se faltarem e a pessoa quiser, procurar na Pixabay (gratuitas, uso comercial): `node scripts/pixabay.mjs "<pesquisa>"` lista as fotografias com o número, o tamanho e a página de cada uma; mostrar à pessoa as que servem (o endereço "ver"), e só descarregar as que ela escolher com `node scripts/pixabay.mjs descarregar <número>`. A fotografia fica em `clientes/<cliente>/imagens/`; a pessoa sobe-a para a Biblioteca de Media e cola o URL, que é o que vai na página. Se a Pixabay não estiver ligada, dizer à pessoa para correr `node scripts/pixabay.mjs --chave` num terminal à parte. Pessoas em contexto de saúde: preferir as fotografias do cliente ou do Envato, que têm autorização dos fotografados.

Estrutura por defeito, que se muda quando o pedido pede outra coisa: herói com a promessa e o botão · prova (números ou selos) · o que fazemos · porquê nós · perguntas frequentes · fecho com o botão repetido.

Regras que não se negoceiam:

- Só widgets reais e gratuitos. Nunca HTML despejado num widget de código.
- Títulos como sistema (`.claude/skills/design/titulos.md`): nunca estilizados um a um. Se a pessoa pedir para mudar o aspecto de um título, é para todos do mesmo nível: confirmar numa linha, gravar em `titulos` no `marca.json` e voltar a gravar a página.
- Máximo de três níveis de containers.
- Sem animações de entrada: há sites onde a biblioteca de animações não carrega e as secções ficam invisíveis.
- Português de Portugal, com os números e as datas da secção 3 do `CLAUDE.md`.

## Site sem Elementor (blocos do WordPress)

Se o `levantamento.md` disser `Construtor` diferente de Elementor, ou o `/wp-ligar` tiver avisado que o site não usa Elementor, a página faz-se em blocos do WordPress (o editor normal, Gutenberg):

- importar as peças de `scripts/blocos.mjs` em vez de `scripts/elementor.mjs`: `import { seccao, linha, coluna, titulo, rotulo, texto, botao, imagem, lista, cartao, citacao, numero, caixaIcone, perguntas, marca } from '../../../scripts/blocos.mjs';`. Os nomes e as opções são os mesmos, e o desenho sai igual ao do Elementor: as letras do `marca.json`, os ícones da `caixaIcone` e da `lista`, os tamanhos de telemóvel, as perguntas em caixas. O script põe isso num bloco de estilo no topo da página, feito por ele; não se escreve HTML nem CSS à mão;
- em vez do `extra`, cada peça aceita `css: { 'propriedade': 'valor' }` e `cssTelemovel: { ... }`, para o que as opções não cobrem (por exemplo `css: { 'letter-spacing': '3px', 'text-transform': 'uppercase' }`, ou um tamanho próprio no telemóvel);
- o herói leva o `h1`: o script esconde nesta página o título que o tema põe por cima. Se avisar que o site retirou o estilo (utilizador da ligação sem permissão para HTML), o título do tema volta a aparecer e o herói passa a `h2`. Em alternativa, se em `levantamento.md` houver um modelo de página sem título em "Modelos de página em uso", pôr `template: '<esse modelo>'` no ficheiro;
- o `alinhar` vai em cada título e texto (na secção só alinha os botões);
- o editor normal mostra a página sem as letras e os ícones; para ver como fica, usar a pré-visualização (também a 375 px de largura);
- gravar com `node scripts/criar-pagina-blocos.mjs clientes/<cliente>/paginas/<slug>.mjs` (sempre rascunho; voltar a correr actualiza). A página edita-se no editor normal do WordPress, não no Elementor;
- num site em Divi, Bricks, Oxygen ou Beaver Builder, a página em blocos abre no editor normal, não nesse construtor: dizer isto à pessoa antes de começar.

## Gravar

Correr `node scripts/criar-pagina.mjs clientes/<cliente>/paginas/<slug>.mjs`. O script cria sempre em rascunho e confirma que o desenho ficou gravado.

Para refazer depois de um reparo, editar o mesmo ficheiro e correr o mesmo comando: o script lembra-se do rascunho que criou nesse site (em `<slug>.wp.json`, ao lado) e actualiza-o, guardando o estado anterior em `clientes/<cliente>/copias/`. Se o site foi reposto (o treino volta limpo), cria um rascunho novo.

O script faz também o documento para o cliente validar o texto e mostra o caminho (`clientes/<cliente>/validacao/…docx`). Na entrega, dizer onde está e perguntar se é para ir para o Drive: `node scripts/documento.mjs <id> --drive`. Se o script avisar que o documento não se fez, a página está gravada na mesma: repetir com `node scripts/documento.mjs <id>`.

## Entregar

Dizer, por esta ordem:

1. O endereço de edição no Elementor e o de pré-visualização. Antes de entregar, ver a pré-visualização com a largura de um telemóvel (375 px, com o Claude in Chrome se estiver ligado) e corrigir o que sair da largura ou ficar ilegível.
2. Quantas secções e elementos foram criados.
3. Um título SEO (50 a 60 caracteres) e uma meta description (140 a 160), já contados, para a pessoa colar no plugin de SEO do site (Yoast ou Rank Math).
4. O que ficou `[por confirmar]` e precisa de olho humano.
5. Para ver a pré-visualização é preciso ter sessão iniciada no wp-admin desse site, no mesmo browser.
6. Se a página foi **alterada** (não criada) e o estilo parecer antigo: abrir no editor do Elementor e guardar como rascunho, na seta ao lado do botão verde. Nunca o botão verde "Publicar".

Depois, sugerir `/wp-rever <id>`.
