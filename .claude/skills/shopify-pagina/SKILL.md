---
name: shopify-pagina
description: >
  Escreve uma página para a loja Shopify do cliente activo e grava-a ESCONDIDA: uma landing page
  com o desenho dentro da própria página (herói, faixas, colunas, cartões, as mesmas peças das
  páginas em blocos do WordPress), ou uma página de texto no modelo do tema (sobre nós, guia,
  política). Imagens com texto alternativo, título e descrição para o Google. Gatilhos: "página
  na Shopify", "landing na Shopify", "página para a loja", "/shopify-pagina".
---

# Página escondida na Shopify

## Antes de escrever

1. `node scripts/estado.mjs` tem de mostrar `loja Shopify, só escondido`. Se não, `/shopify-ligar` e parar.
2. Ler `clientes/<cliente>/CLAUDE.md` e `marca.json`. Factos só do que estiver escrito; o resto fica `[por confirmar]`.
3. Se houver um estilo aprovado em `clientes/<cliente>/estilos/` (feito com `/design`; com mais do que um, perguntar qual), seguir a escala, a paleta e as assinaturas dele: as receitas em blocos do estilo (as opções das peças, `css` e `cssTelemovel`) servem aqui tal e qual, e os títulos seguem o `marca.json`. Dizer na entrega que estilo se usou.
4. Se o pedido vier em duas linhas soltas, fazer primeiro as perguntas do `/wp-briefing` (servem igual).

## Desenho ou texto

Há duas formas de página, e escolhe-se antes de escrever:

- **Com desenho** (`elementos`): landing pages, páginas de serviço ou de campanha, tudo o que precise de herói com fotografia, faixas de cor, colunas, cartões, ícones, números ou perguntas em caixa. O desenho vai dentro da própria página (letras da marca, cores, telemóvel), sem mexer no tema, e fica igual a uma página em blocos do WordPress. Muda-se sempre pelo ficheiro e pelo script.
- **Texto** (`blocos`): páginas de conteúdo que devem parecer as outras da loja (sobre nós, políticas, um guia longo), com o aspecto do tema. É a escolha quando o dono da loja vai querer mudar o texto no painel.

Na dúvida, perguntar à pessoa: "Esta página vai ser mudada no painel da Shopify por alguém da loja?" Se sim, texto.

**O editor do painel e as páginas com desenho.** O editor de texto da Shopify não foi feito para páginas destas: ao guardar uma página no painel, pode mexer no código do desenho, e a Shopify não garante o que fica. Dizer à pessoa, na entrega, que ninguém deve abrir esta página no editor do painel e carregar em Guardar; as mudanças fazem-se no ficheiro e voltando a gravar. Se o dono da loja precisar de mudar o texto ele próprio, a página faz-se em texto.

## Escrever com desenho

Criar `clientes/<cliente>/paginas/<handle>.mjs`, com as peças de `scripts/shopify-desenho.mjs`. São as mesmas peças e opções das páginas em blocos do WordPress (`/wp-landing`, "Site sem Elementor"); copiar a linha do `import` tal como está:

```js
import { seccao, linha, coluna, titulo, rotulo, texto, botao, imagem, lista, cartao, citacao, numero, caixaIcone, perguntas, marca } from '../../../scripts/shopify-desenho.mjs';

const C = marca.cores;

export default {
  titulo: 'Ortodontia invisível',        // o nome no painel e no separador do browser
  handle: 'ortodontia-invisivel',        // o endereço: /pages/ortodontia-invisivel
  seo: { titulo: '50 a 60 caracteres', descricao: '140 a 160 caracteres' },
  elementos: [
    seccao([
      titulo('Um sorriso alinhado, sem aparelho à vista', 'h1', { cor: '#FFFFFF' }),
      texto('Alinhadores transparentes planeados por ortodontistas.', { cor: '#FFFFFF', tamanho: 20 }),
      botao('Marcar avaliação', '/pages/contactos'),
    ], { imagemFundo: 'imagens/consultorio.jpg', sobreposicao: 'rgba(0,0,0,0.45)', alturaMinima: 640 }),
    seccao([
      titulo('Como funciona', 'h2'),
      linha([cartao([titulo('1. Avaliação', 'h3'), texto('...')]), caixaIcone('fas fa-check', '2. Plano', '...')]),
    ], { fundo: C.claro }),
    seccao([perguntas([['Quanto tempo demora?', '...']])], { estreita: true }),
  ],
};
```

| Peça | Para quê |
|---|---|
| `seccao([...], { fundo, topo, base, alinhar, estreita, imagemFundo, sobreposicao, alturaMinima })` | Uma faixa à largura do ecrã. `estreita` para largura de leitura |
| `linha([...])` · `coluna([...], largura%)` | Colunas, que passam a uma só no telemóvel |
| `titulo(texto, 'h1'…'h3', { cor, alinhar })` · `rotulo(texto)` | Títulos e a etiqueta por cima deles. Um só `h1`. Tamanho, peso e letra vêm de `titulos` no `marca.json`, não da chamada (`.claude/skills/design/titulos.md`) |
| `texto(html, { cor, tamanho, alinhar })` | Parágrafos, com `<strong>`, `<em>` e `<a href>` |
| `botao(etiqueta, destino, { contorno, invertido, raio })` | Botões. A etiqueta diz o que acontece |
| `lista([...])` · `caixaIcone(icone, titulo, texto)` | Argumentos e serviços (ícones do Font Awesome, `fas fa-...`) |
| `numero(valor, legenda)` | Números fixos, em formato português (`1 200`) |
| `perguntas([[p, r], ...])` | Perguntas frequentes em caixas que abrem |
| `imagem(origem, alt)` | Imagens, sempre com texto alternativo |
| `cartao([...], { fundo, borda, sombra })` · `citacao(frase)` | Caixas e frases em destaque |

- Para o que as opções não cobrem, cada peça aceita `css: { 'propriedade': 'valor' }` e `cssTelemovel: { ... }` (por exemplo `css: { 'letter-spacing': '3px' }`). Não se escreve HTML nem CSS à mão: o script recusa etiquetas e atributos que não são das peças (`<script>`, `<iframe>`, `onclick`...), ligações `javascript:` e imagens de fundo de outros sites no `css`.
- **O h1.** Com um `h1` no herói, o título que o tema põe por cima esconde-se nesta página, e o herói encosta ao cabeçalho da loja. Sem `h1` na página, o título do tema fica e é ele o `h1`: começar então com `h2`.
- As perguntas frequentes entram sem a marcação FAQ para o Google (na Shopify não vai código na página). Dizer à pessoa para confirmar se o tema ou uma app de SEO da loja a põe.

## Escrever em texto

Criar `clientes/<cliente>/paginas/<handle>.mjs`:

```js
export default {
  titulo: 'Sobre nós',              // é o h1 da página: no texto só h2 e h3
  handle: 'sobre-nos',
  seo: { titulo: '50 a 60 caracteres', descricao: '140 a 160 caracteres' },
  blocos: [
    ['h2', 'Quem somos'],
    ['p', 'Texto. Pode levar <strong>negrito</strong>, <em>itálico</em> e <a href="/collections/all">ligações</a>.'],
    ['lista', ['um ponto', 'outro ponto']],
    ['imagem', { ficheiro: 'imagens/equipa.jpg', alt: 'A equipa na loja de Lisboa' }],
    ['citacao', 'Uma frase do cliente, se estiver aprovada.'],
    ['botao', { texto: 'Ver a colecção', url: '/collections/all' }],
  ],
  perguntas: [{ pergunta: '...', resposta: '...' }],   // opcional
};
```

## Imagens

- **Da pasta do cliente** (`imagens/foto.jpg`): sobem para os Ficheiros da loja ao gravar. Para isso a app da loja precisa da permissão `write_files`. Sem ela, o script pára antes de gravar e diz o que fazer: o dono da loja junta `write_files` à app no Dev Dashboard da Shopify, carrega em Release e volta a instalar a app na loja. Cada imagem sobe uma só vez: voltar a gravar a página usa a que já está na loja (o registo fica em `imagens/.shopify-<loja>.json`; não se apaga).
- **Que já estão na loja** (endereços `https://cdn.shopify.com/...`, ou `/cdn/shop/` no domínio da loja, copiados de um produto ou dos Ficheiros): usam-se como estão, sem subir, e funcionam sem `write_files`.
- **Da Pixabay:** nunca o endereço da Pixabay. Procurar como explica o `/wp-landing`, descarregar a escolhida com `node scripts/pixabay.mjs descarregar <número>` (fica em `imagens/`) e usar esse ficheiro, que sobe ao gravar.
- Sempre com texto alternativo escrito para quem não vê a imagem. Nunca inventar fotografias: sem imagem aprovada, não pôr a peça e dizer à pessoa.

## SEO

Página ou artigo de SEO: seguir `/seo` e pôr a palavra-chave em `seo: { titulo, descricao, chave }`. O rever não lê a loja: antes de gravar, verificar com a lista "Shopify" do `/seo`.

## Gravar

```
node scripts/shopify-pagina.mjs clientes/<cliente>/paginas/<handle>.mjs
```

O Claude Code pede licença com o aviso de que vai gravar na loja real, escondido. A página fica escondida. Para refazer depois de um reparo, editar o mesmo ficheiro e correr o mesmo comando: actualiza a mesma página (guarda antes uma cópia em `copias/`). Se já estiver publicada, o script recusa: para a mudar, escondê-la primeiro com `/shopify-publicar`, gravar e voltar a publicar.

Depois de gravar, fica o documento para o cliente validar o texto em `clientes/<cliente>/validacao/`. Para o Drive: `node scripts/documento.mjs clientes/<cliente>/validacao/<ficheiro>.docx --drive`.

## Entregar

1. O link do painel que o script mostra, o endereço que a página terá quando for publicada, o título e a descrição para o Google, e o que ficou `[por confirmar]`.
2. **Pré-visualizar:** no painel (o link "editar"), o botão para ver a página na loja, no topo, abre-a com o tema real a quem tiver sessão iniciada no painel nesse browser; escondida, não se vê de fora. Com o Claude in Chrome ligado, ver em computador e com a janela à largura de um telemóvel (375 px), só a ler: nunca carregar em Guardar, Publicar ou Visibilidade. Se a pré-visualização der página não encontrada, dizer à pessoa e ver logo a seguir a ela publicar.
3. Numa página com desenho, o aviso: não mudar esta página no editor do painel; as mudanças fazem-se pelo kit.
4. Para publicar: `/shopify-publicar`, que diz antes o que vai fazer e só publica com o sim da pessoa. Também se pode publicar no painel: Visibilidade → Visível.
