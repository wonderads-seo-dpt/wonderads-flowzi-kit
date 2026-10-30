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
2. Ler `clientes/<cliente>/CLAUDE.md` e `clientes/<cliente>/marca.json`. As cores, os tipos de letra e as regras aprendidas vêm daí, nunca de escolha própria. Se houver um estilo aprovado em `clientes/<cliente>/estilos/` (feito com `/design`; com mais do que um, perguntar qual), seguir a escala, a paleta e as assinaturas dele, e dizer na entrega que estilo se usou. Se este cliente tiver uma skill própria para este tipo de página (`/<cliente>-…`), usar essa.
3. Ter o conteúdo. Pode vir de três sítios, por esta ordem:
   - um briefing em `clientes/<cliente>/briefings/` (feito com `/wp-briefing`);
   - o texto de uma página que já existe no site e que o cliente já aprovou (ler pela API, não inventar);
   - o pedido da pessoa, se tiver o essencial: para quem é, de onde vem o texto, que acção, que estrutura.

   Se faltar o essencial, fazer no máximo três perguntas. Nunca inventar preços, nomes de médicos, números ou testemunhos: o que não está escrito fica como `[por confirmar]` no texto.

## Construir

Escrever um ficheiro `clientes/<cliente>/paginas/<slug>.mjs` com as peças de `scripts/elementor.mjs`. O exemplo completo está em `clientes/<cliente>/paginas/exemplo-implantes.mjs`: copiar a primeira linha (o `import`) tal como está. As peças disponíveis são:

| Peça | Para quê |
|---|---|
| `seccao([...], { fundo, topo, base, alinhar, estreita })` | Uma secção da página. Um container por secção lógica. `estreita` para largura de leitura (artigos) |
| `linha([...])` · `coluna([...], largura%)` | Colunas, que passam a uma só no telemóvel |
| `titulo(texto, 'h1'…'h3', { cor, tamanho, alinhar })` | Títulos. Um só `h1` |
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
- Máximo de três níveis de containers.
- Animações de entrada só nos widgets, nunca nas secções (containers). Ver na pré-visualização, também em telemóvel, que tudo aparece ao rolar.
- Português de Portugal, com os números e as datas da secção 3 do `CLAUDE.md`.

## Site sem Elementor (blocos do WordPress)

Se o `levantamento.md` disser `Construtor` diferente de Elementor, ou o `/wp-ligar` tiver avisado que o site não usa Elementor, a página faz-se em blocos do WordPress (o editor normal, Gutenberg):

- importar as peças de `scripts/blocos.mjs` em vez de `scripts/elementor.mjs`: `import { seccao, linha, coluna, titulo, texto, botao, imagem, lista, cartao, citacao, numero, caixaIcone, perguntas, marca } from '../../../scripts/blocos.mjs';`. Os nomes e as opções são os mesmos; o `extra` não existe;
- as letras são as do tema do site; não há tamanhos só de telemóvel (os títulos descem sozinhos e as colunas empilham); a `caixaIcone` sai sem ícone; o `alinhar` vai em cada título e texto (na secção só alinha os botões);
- o tema mostra o título da página como `h1` por cima do conteúdo: o herói começa em `h2`. Se em `levantamento.md` houver um modelo de página sem título em "Modelos de página em uso", pôr `template: '<esse modelo>'` no ficheiro e aí sim o herói leva o `h1`;
- gravar com `node scripts/criar-pagina-blocos.mjs clientes/<cliente>/paginas/<slug>.mjs` (sempre rascunho; voltar a correr actualiza). A página edita-se no editor normal do WordPress, não no Elementor;
- num site em Divi, Bricks, Oxygen ou Beaver Builder, a página em blocos abre no editor normal, não nesse construtor: dizer isto à pessoa antes de começar.

## Gravar

Correr `node scripts/criar-pagina.mjs clientes/<cliente>/paginas/<slug>.mjs`. O script cria sempre em rascunho e confirma que o desenho ficou gravado.

Para refazer depois de um reparo, editar o mesmo ficheiro e correr o mesmo comando: o script lembra-se do rascunho que criou nesse site (em `<slug>.wp.json`, ao lado) e actualiza-o, guardando o estado anterior em `clientes/<cliente>/copias/`. Se o site foi reposto (o treino volta limpo), cria um rascunho novo.

## Documento para o cliente validar

Sempre que a página for gravada (criada ou refeita), correr logo a seguir `node scripts/exportar-docx.mjs clientes/<cliente>/paginas/<slug>.mjs`. Gera um .docx só com o conteúdo (títulos, textos, botões, listas, perguntas e texto alternativo das imagens), separado por secções e com o que está `[por confirmar]` a amarelo. Fica em `clientes/<cliente>/validacao/<slug>-DD-MM-AAAA.docx`. Se o Word tiver o ficheiro aberto, o script avisa: pedir à pessoa para o fechar e voltar a correr.

Se existir `clientes/<cliente>/drive.json` (`{ "pasta": "G:/Meu Drive/<pasta do cliente>" }`), o documento é também copiado para essa pasta do Google Drive para computador, que o sincroniza. Se o cliente ainda não tiver `drive.json`, perguntar à pessoa qual é a pasta dele no Drive e criá-lo.

## Entregar

Dizer, por esta ordem:

1. O endereço de edição no Elementor e o de pré-visualização. Antes de entregar, ver a pré-visualização com a largura de um telemóvel (375 px, com o Claude in Chrome se estiver ligado) e corrigir o que sair da largura ou ficar ilegível.
2. Quantas secções e elementos foram criados.
3. Um título SEO (50 a 60 caracteres) e uma meta description (140 a 160), já contados, para a pessoa colar no plugin de SEO do site (Yoast ou Rank Math).
4. O que ficou `[por confirmar]` e precisa de olho humano.
5. O caminho do .docx de validação, para enviar ao cliente.
6. Para ver a pré-visualização é preciso ter sessão iniciada no wp-admin desse site, no mesmo browser.
7. Se a página foi **alterada** (não criada) e o estilo parecer antigo: abrir no editor do Elementor e guardar como rascunho, na seta ao lado do botão verde. Nunca o botão verde "Publicar".

Depois, sugerir `/wp-rever <id>`.
