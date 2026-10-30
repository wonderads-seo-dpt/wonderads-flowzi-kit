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

Ditas pelo André Pavlenco na reunião de 23/10/2026. Mandam sobre o resto desta skill.

1. **Uma página de SEO tem pelo menos 1 500 palavras.**
2. **Os títulos não saltam níveis:** h1, depois h2, depois h3. Nunca de h1 para h3.
3. **Usar sempre a palavra-chave:** no h1, no início do texto, no endereço e no título para o Google.

A lista completa entra na sessão de 30/10/2026, a partir do documento de boas práticas da WonderAds.

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

- **Título**: 50 a 60 caracteres, com a palavra-chave perto do início. **Descrição**: 140 a 160, diz o que a pessoa ganha em clicar. Contar os caracteres antes de entregar.
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

`clientes/<cliente>/seo.json` só leva o que for diferente do kit. Valores do kit: `minimo_palavras` 1500, `tipos` `{ "destino": 0, "contactos": 0 }` (mínimo por tipo de página), `densidade_maxima` 2.5 (vezes que a palavra-chave aparece por cada 100 palavras), `minimo_ligacoes_internas` 2, `titulo` [50, 60], `descricao` [140, 160]. Em `paginas`, a palavra-chave de cada página pelo endereço: `"ortodontia": { "chave": "ortodontia em Ermesinde" }`.

## Entregar

Junto com a entrega da skill que fez a página: a palavra-chave e de onde veio, o número de palavras, o título e a descrição para o Google já contados, as ligações internas feitas e as propostas, e o resultado do rever com o que ficou por resolver.
