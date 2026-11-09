---
name: seo
description: >
  Como se escreve e verifica uma página para SEO nesta agência, no WordPress e na Shopify: a
  palavra-chave escolhida com a pessoa, títulos sem saltos, extensão, título e descrição para o
  Google, endereço, ligações internas, E-E-A-T e o rever com a palavra-chave. Traz as regras da
  WonderAds. Gatilhos: "SEO", "palavra-chave", "página de SEO", "optimizar para o Google", "/seo".
---

# Página para SEO

Lê-se antes de escrever uma página ou um artigo de SEO (`/wp-landing`, `/wp-artigo`, `/wp-seccao`, `/shopify-pagina`, `/shopify-artigo`) e volta-se aqui no fim, para verificar. Estas regras juntam-se às do `CLAUDE.md`, não as substituem.

## Regras da WonderAds

Ditas pelo André Pavlenco na reunião de 23/10/2026 e completadas pelas checklists internas de SEO on-page da WonderAds (09/11/2026). Mandam sobre o resto desta skill.

1. **Uma página de SEO tem pelo menos 1 500 palavras**, salvo outro valor no `seo.json` do cliente. A página inicial, as páginas de destino e as de contactos não têm mínimo.
2. **Os títulos não saltam níveis:** h1, depois h2, depois h3. Nunca de h1 para h3.
3. **Usar sempre a palavra-chave:** no h1, no início do texto, no endereço e no título para o Google.

### A checklist de cada tipo de página

Antes de escrever, saber o tipo de página e ler a checklist dele, nesta pasta. Percorrê-la outra vez no fim, antes de entregar, e dizer à pessoa os pontos que ficaram por fazer e porquê.

| Tipo | Checklist | No rever |
|---|---|---|
| Artigo de blogue, página de conteúdo | `artigo.md` | (sem tipo) |
| Página de serviço ou de patologia | `servico-patologia.md` | (sem tipo) |
| Página inicial | `home.md` | `--tipo home` |
| Página de destino ou de contactos | as regras comuns abaixo | `--tipo destino` |

### Regras comuns, em todas as páginas

- **Regras do cliente primeiro:** ortografia (pré ou pós-acordo, a que o site usa), tamanho mínimo e termos a evitar, no `CLAUDE.md` e no `seo.json` do cliente.
- **Uma palavra-chave por endereço, sem canibalização:** antes de escrever, ver com `node scripts/listar.mjs` se outra página ou artigo do site disputa a mesma pesquisa e, se sim, dizer à pessoa.
- **Resposta ou resumo no topo**, antes de qualquer secção longa. Parágrafos até cerca de 4 linhas, listas no que é enumerável, tabelas nas comparações.
- **Vocabulário de quem pesquisa:** o termo comum primeiro, o técnico explicado uma só vez.
- **Telefones com marca de custo, sempre:** cada número leva `*` se for fixo (começa por 2) ou `**` se for móvel (começa por 9), logo a seguir ao número (`220 123 456*`, `912 345 678**`). A página leva a nota, junto dos contactos ou no fim: «\* Chamada para a Rede Fixa Nacional» e/ou «\*\* Chamada para a Rede Móvel Nacional», só as que se aplicam.
- **Cada botão de conversão com um id** que diga o sítio e a página, por exemplo `marcar-consulta-topo`, `whatsapp-servico-fim` ou `marcar-consulta-blog`: `botao(texto, destino, { id: '...' })`, no Elementor e nos blocos. Ligações de telefone com `tel:` e de WhatsApp com `https://wa.me/` ou `api.whatsapp.com`, para o Tag Manager as contar.
- **Ligações reais e verificadas:** só endereços que existem (`listar.mjs`), texto que diz o destino, nunca "clique aqui".
- **Sem promessas de resultado, de cura ou garantias**, com fonte em cada número ou afirmação de eficácia (código deontológico e regras da ERS; secção 6 do `CLAUDE.md`). Avaliações e números de avaliações só reais, de um documento.
- **Contactos iguais aos do Perfil de Empresa Google:** nome, morada, telefone e horário escritos da mesma forma em todo o lado.
- **Imagens:** fotografias reais do cliente antes das de banco, texto alternativo descritivo, WebP com largura e altura. A imagem do topo sem carregamento diferido (é o LCP).
- **Título para o Google até cerca de 60 caracteres e descrição até cerca de 155.**
- **Vista no telemóvel** antes de dar por feita, com o botão principal visível sem rolar.

### Tabelas

Comparações (opções, tratamentos, prazos, preços que o cliente definiu) vão numa tabela a sério, nunca em texto corrido nem numa imagem: os motores de IA e o Google lêem-nas. No Elementor, uma tabela HTML simples (`<table>` com `<thead>` e `<tbody>`) dentro do widget de texto (`texto(...)`), que continua editável. Nos blocos e na Shopify, enquanto as peças não tiverem tabela, a comparação fica em lista com o critério a negrito, e diz-se à pessoa para a passar a bloco de tabela no editor.

### Dados estruturados (schema)

**Toda a página nova leva o schema do seu tipo, e o que faltar o kit acrescenta sempre, sem esperar que lho peçam.** O mínimo por tipo:

| Tipo | Schema |
|---|---|
| Página inicial | um negócio local (MedicalClinic, Dentist ou LocalBusiness: nome, morada, telefone, horário, coordenadas, logótipo, `sameAs`, `@id`) e WebSite |
| Serviço | MedicalWebPage e MedicalTherapy (ou Service), ligados à clínica pelo `@id`, e BreadcrumbList |
| Patologia | MedicalWebPage e MedicalCondition com `possibleTreatment`, e BreadcrumbList |
| Artigo | Article ou BlogPosting (autor, datas, editora; num tema clínico MedicalWebPage com `reviewedBy`) e BreadcrumbList |
| Destino, contactos | o que a checklist pedir; o rever não exige |

Com perguntas frequentes, também o FAQPage (das `perguntas`). Com um profissional na página, Physician ou Person.

O schema que o site ainda não tem vai **na própria página**, com a peça `schema(...)`: MedicalWebPage, MedicalCondition, MedicalTherapy ou Service, Physician, Article, BreadcrumbList, MedicalClinic. É, com a marcação das perguntas, o único código que o kit põe numa página: um JSON-LD que não se vê e que o rever reconhece.

1. **Ver primeiro o que o site já gera.** Gravar o rascunho e correr `node scripts/rever.mjs <id>`: a linha `Schema ·` mostra o que está na página e o que vem do Yoast. Com o Rank Math (não se lê pela API), ver uma página publicada parecida no Rich Results Test ou perguntar à pessoa.
2. **Só o que falta, nunca em duplicado.** Se o Yoast já dá o BreadcrumbList, o Organization ou o WebSite, não se repetem; o rever acusa os repetidos. Se o Yoast dá o WebPage, o MedicalWebPage faz-se mudando o tipo de página no Yoast, ou com o mesmo `@id`.
3. **Pôr na página:** no Elementor e nos blocos, `schema({ '@type': 'MedicalCondition', name: '...', possibleTreatment: { ... } })`, ou uma lista de objectos, dentro de uma secção (de preferência a última). Num artigo do `criar-artigo.mjs`, `schema: { ... }` no ficheiro. O `@context` entra sozinho. O FAQPage não: vem das `perguntas`, com as perguntas à vista.
4. **Só com dados de documentos do cliente** (nome do médico, cédula, morada, horário), iguais aos do Perfil de Empresa Google, com o mesmo `@id` da clínica em todas as páginas (por exemplo `https://<site>/#clinica`). O que faltar fica de fora, nunca inventado.
5. **O rever confirma:** acusa em "Corrigir" o schema do tipo que não está nem na página nem no Yoast (com o Rank Math, avisa em "Melhorias").
6. **Validar** a página publicada no Rich Results Test ou no Schema Markup Validator, e dizer à pessoa que tipos se puseram.

Na Shopify não vai código na página (a peça fica de fora): o schema vem do tema ou de uma app de SEO da loja, e diz-se à pessoa o que falta.

### O que fica para a pessoa

O kit não mexe em plugins, definições nem servidores. Redireccionamentos, canonical, sitemap, robots.txt, hreflang, Core Web Vitals, GA4, Tag Manager, Consent Mode, Livro de Reclamações e aviso de cookies verificam-se pela checklist e entregam-se como lista à pessoa, com o que se viu e o que falta.

## 1 · A palavra-chave, com a pessoa

- Perguntar qual é a palavra-chave principal da página. Se a pessoa não souber, propor duas ou três a partir do serviço, da localidade e das palavras que o cliente já usa no site, e ela escolhe.
- **Nunca inventar volumes de pesquisa**, dificuldade ou posições. Esses números só vêm de documentos na pasta do cliente (exportação do Search Console, Semrush, plano do programa). Sem documento, dizer "sem dados de volume".
- Uma palavra-chave principal por página, mais duas a quatro variações e sinónimos para o texto.
- Gravá-la onde o rever a encontra: no ficheiro da página, `seo: { chave: 'implantes dentários' }`, ao lado de `titulo` e `slug`. Numa página que já existe no site (sem ficheiro do kit), em `clientes/<cliente>/seo.json`, em `paginas`, pelo endereço.

## 2 · Estrutura

- Um só h1, com a palavra-chave. Num artigo em blocos, o h1 é o título do WordPress.
- h2 para as partes, h3 dentro de um h2. Uma caixa com ícone (`caixaIcone`) é um h3: precisa de um h2 antes.
- Resposta directa nas primeiras 100 palavras, já com a palavra-chave.
- Perguntas frequentes reais no fim, com marcação para o Google: `perguntas([...])` no Elementor e nos blocos, `perguntas` nos artigos do `criar-artigo.mjs`. Na Shopify ficam em h2 e h3, sem marcação.

## 3 · Extensão

- Pelo menos 1 500 palavras numa página de SEO, salvo outro valor no `seo.json` do cliente. Páginas de destino e de contactos ficam de fora.
- **Nunca encher com palha.** As palavras vêm de profundidade (como funciona, passo a passo, quanto tempo, para quem é e para quem não é), de exemplos do cliente, de comparações e de perguntas frequentes. Se os factos do cliente não chegam para 1 500 palavras, dizer à pessoa o que falta em vez de inventar; o que não está escrito fica `[por confirmar]`.

## 4 · Para o Google

- **Título**: 50 a 60 caracteres, com a palavra-chave perto do início. **Descrição**: 140 a 155, diz o que a pessoa ganha em clicar. Contar os caracteres antes de entregar.
- No WordPress o kit não escreve no plugin de SEO: o título e a descrição ficam no ficheiro (`seo: { chave, titulo, descricao }`) e a pessoa cola-os no Yoast ou no Rank Math. Na Shopify vão no `seo` do ficheiro e o script grava-os.
- **Endereço**: curto, em minúsculas, com a palavra-chave, sem palavras de ligação. Numa página que já existe, o endereço não muda sem redireccionamento, e isso decide a pessoa.
- **Texto alternativo** em todas as imagens, escrito para quem não vê; a palavra-chave só entra se descrever a imagem.
- **Ligações internas**: pelo menos duas para outras páginas do site (`node scripts/listar.mjs`, ou `shopify-listar.mjs`), com texto que diz o destino. Propor também que páginas deviam ligar para esta, sem as alterar.

## 5 · E-E-A-T (experiência, especialização, autoridade, confiança)

- Experiência real: casos, fotografias e testemunhos só do cliente e com consentimento documentado.
- Quem escreve ou revê (o médico, o técnico) com nome e credenciais só se estiverem num documento; senão, `[por confirmar]`.
- Afirmações técnicas, de saúde ou de lei com fonte. Num artigo, a data de revisão.
- Nada de promessas de resultado (secção 6 do `CLAUDE.md`).

O português segue a secção 3 do `CLAUDE.md`: números `1 234,56`, datas `DD/MM/AAAA`, nunca travessão a ligar orações.

## 6 · Verificar

**WordPress**: depois de gravar, correr

```
node scripts/rever.mjs <id> --chave "palavra-chave"
```

Sem `--chave`, o rever usa a do ficheiro da página ou a do `seo.json`. Conta as palavras visíveis (sem código nem estilo) contra o mínimo, procura a palavra-chave no h1, nas primeiras 100 palavras, no endereço e no título para o Google, e avisa se ela se repete demais. Verifica também os saltos de títulos, os títulos do mesmo nível com estilos diferentes (Elementor), o texto alternativo e as ligações internas. Os apontamentos de SEO aparecem em "Corrigir" e "Melhorias".

- Página de destino ou de contactos: `--tipo destino` (ou `seo: { tipo: 'destino' }` no ficheiro).
- Outro mínimo só para esta página: `--palavras 800`.

**Shopify**: o rever não lê a loja. Antes de gravar, verificar no ficheiro: o h1 (o `titulo`, numa página de texto ou num artigo; o `titulo(..., 'h1')` do herói, numa página com desenho) e o `handle` com a palavra-chave; a palavra-chave no primeiro parágrafo; h2 antes de qualquer h3; `seo.titulo` e `seo.descricao` dentro dos limites; pelo menos duas ligações para `/pages/`, `/collections/`, `/products/` ou `/blogs/`. Contar as palavras secção a secção e dizer o total à pessoa como aproximado. Depois de gravar, abrir a ligação do painel e reler.

## O seo.json do cliente

`clientes/<cliente>/seo.json` só leva o que for diferente do kit. Valores do kit: `minimo_palavras` 1500, `tipos` `{ "destino": 0, "contactos": 0, "home": 0 }` (mínimo por tipo de página), `densidade_maxima` 2.5 (vezes que a palavra-chave aparece por cada 100 palavras), `minimo_ligacoes_internas` 2, `titulo` [50, 60], `descricao` [140, 155]. Em `paginas`, a palavra-chave de cada página pelo endereço: `"ortodontia": { "chave": "ortodontia em Ermesinde" }`.

## Entregar

Junto com a entrega da skill que fez a página: a palavra-chave e de onde veio, o número de palavras, o título e a descrição para o Google já contados, as ligações internas feitas e as propostas, os tipos de schema que se acrescentaram (e os que já vinham do plugin), e o resultado do rever com o que ficou por resolver.
