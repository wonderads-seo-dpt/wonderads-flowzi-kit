# Novidades do kit

O que muda em cada versão, para quem actualiza. O `/actualizar` mostra as que ainda não estão instaladas.

## 2026.10.30

- O kit muda de casa: o repositório oficial passa a ser o da WonderAds, `wonderads-seo-dpt/wonderads-flowzi-kit`. O aviso e o `/actualizar` funcionam como antes, sem conta.
- `/contribuir`: as propostas vão para o técnico da equipa, que as experimenta e abre o Pull Request. A Flowzi testa, assina e publica.

## 2026.10.29

- Actualizar sem conta: o kit vê as versões novas no GitHub sem conta e sem instalar nada. O aviso ao abrir o Claude e o `/actualizar` funcionam em todos os computadores.
- `/contribuir` sem conta: a proposta fica num zip nas Transferências, que se manda à Flowzi por WhatsApp ou por email. Quem tiver conta no GitHub pode abrir uma Issue ou um Pull Request.

## 2026.10.27

- O kit tem casa no GitHub da equipa. O `/actualizar` traz de lá a versão nova, e o Claude avisa ao abrir quando há uma e diz o que traz. O `/contribuir` envia à Flowzi um script, uma skill ou uma regra vossa, para ficar para todos (sem passwords nem nada dos clientes).
- Shopify com desenho: o `/shopify-pagina` faz landing pages com as mesmas peças das páginas em blocos (herói com fotografia, faixas, colunas, cartões, ícones, perguntas em caixa). O desenho vai dentro da própria página, sem mexer no tema. As imagens que já estão na loja usam-se sem subir; para subir as da pasta `imagens/`, a app precisa de `write_files`, e o kit diz o que pedir ao dono da loja.
- Títulos com um estilo por nível: o h1, o h2, o h3 e a etiqueta por cima dos títulos ficam em `titulos` no `marca.json` do cliente e aplicam-se sozinhos a todos os títulos, também às palavras realçadas. Pedir para mudar um título muda todos os do mesmo nível. Numa página que já existe, `node scripts/titulos.mjs --ver <página>` mostra os estilos diferentes, e o Claude faz uma cópia em rascunho com os títulos iguais.
- Documento para o cliente validar: depois de gravar uma página ou um artigo, o kit faz um documento do Word só com o texto, em `clientes/<cliente>/validacao/`. Com `node scripts/documento.mjs <página> --drive` vai para o Google Drive, na pasta "Validação de textos/<cliente>", pronto a partilhar com o cliente para comentar.
- Cabeçalho, rodapé e modelos do Elementor: `node scripts/listar.mjs --modelos` mostra-os, e o `/wp-seccao` faz uma cópia em rascunho, sem condições, com a secção nova. Num staging, precisa de uma ligação de administrador (o Elementor não mostra os modelos a um Editor); no site real, nunca: aí faz-se a secção nova numa página em rascunho e quem gere o site passa-a para o modelo. O cabeçalho e o rodapé do site nunca mudam: pôr a cópia no lugar faz-se à mão, no Elementor.
- `/seo`: as regras de SEO da agência numa skill (palavra-chave escolhida convosco, pelo menos 1 500 palavras, títulos sem saltos, título e descrição para o Google, ligações internas). O `/wp-rever` passa a contar as palavras, a procurar a palavra-chave (`--chave "..."`) no h1, no início, no endereço e no título, e a avisar quando há títulos do mesmo nível com estilos diferentes. As regras completas da WonderAds entram depois da sessão de 30/10.

## 2026.10.22

- WordPress sem Elementor: as páginas em blocos saem com o desenho das do Elementor: as letras da marca, os ícones, a lista com vistos, as perguntas em caixas, os botões e os tamanhos de telemóvel. O título do tema deixa de aparecer por cima do herói. Os estilos do `/design` também se aplicam em blocos.
- Elementor: duas colunas de 50%, ou três de 32%, já ficam lado a lado (a última caía para baixo).

## 2026.10.17

- WordPress sem Elementor: as páginas fazem-se em blocos do WordPress (o editor normal), com as mesmas peças. O `/wp-ligar` diz que construtor o site usa e que modelos de página tem em uso.
- Shopify: ligar uma loja pelo domínio público (loja.pt) pára e explica que é preciso o xxx.myshopify.com, em vez de pedir os dados do WordPress.
- `/shopify-publicar`: o aviso antes de apagar diz agora "apaga" (dizia "publica").
- O `--dangerously-skip-permissions` volta a funcionar.
- Fotografias da Pixabay: o Claude procura e propõe fotografias gratuitas. Ligar uma vez com `node scripts/pixabay.mjs --chave` num terminal à parte (ver LEIA-ME).

## 2026.10.16

- `/design`: o Claude faz de director de arte. Quatro perguntas curtas, vê a referência de que se gosta e cria um estilo com nome em `estilos/`, que as páginas novas seguem.
- `/shopify-publicar`: publicar, esconder ou apagar uma página ou um artigo da loja. O Claude diz antes o que vai fazer e só avança com o sim da pessoa; apagar guarda primeiro uma cópia.
- `/wp-replicar`: dá-se o endereço de uma página de que se gosta e o Claude vê-a (prints em computador e telemóvel), mede-a e faz uma página do cliente com aquele desenho, com o texto e as fotografias do cliente. Em rascunho.
- `/wp-design`: o Claude estuda o desenho do site do cliente e grava-o em `design.md`, para as páginas novas saírem iguais ao resto do site.
- Princípios de design para as páginas não parecerem feitas por uma máquina (lidos pelo `/wp-landing`, `/wp-design` e `/wp-replicar`).

## 2026.10.15

- Lojas Shopify: `/shopify-ligar`, `/shopify-pagina` e `/shopify-artigo` gravam páginas e artigos escondidos na loja. Nunca publicam nem apagam.
- `/actualizar`: as versões seguintes do kit instalam-se assim, a partir do zip da Flowzi, só se for assinado por ela.
- Cada cliente tem uma pasta `imagens/` para as fotografias aprovadas.
