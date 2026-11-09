# Checklist WonderAds · artigo de blogue (ou página de conteúdo)

Da checklist interna "blog post v3" da WonderAds. Valem também as regras comuns do `SKILL.md` (secção "Regras da WonderAds"). Percorre-se antes de escrever (1, 2) e no fim, antes de entregar (tudo).

## 1 · Estrutura e conteúdo

- [ ] **Regras do cliente confirmadas** antes de escrever: ortografia (pré ou pós-acordo, a que o site usa), tamanho mínimo (no `seo.json`; há clientes que, por exemplo, só aceitam artigos pilar com mais de 800 palavras) e termos a evitar (`clientes/<cliente>/CLAUDE.md`).
- [ ] **Um só h1**, com a palavra-chave. No artigo é o título do WordPress: o texto começa em h2 (em Elementor, ver `/wp-artigo`).
- [ ] **Títulos sem saltos**: h2, depois h3.
- [ ] **Intenção de pesquisa**: ver o que o Google mostra na primeira página para a palavra-chave (artigo, lista, página de serviço) e escrever nesse formato. Se não se puder ver, perguntar à pessoa.
- [ ] **Abertura com a palavra-chave** nas primeiras frases, a resumir o tema.
- [ ] **Resposta directa no início**: a pergunta do título responde-se nas primeiras linhas ou numa caixa "Em resumo" (`cartao`). Serve o leitor, os destaques do Google e os motores de IA.
- [ ] **Uma palavra-chave principal**, com as secundárias nos h2. Confirmar com `node scripts/listar.mjs` que nenhuma outra página ou artigo do site disputa a mesma pesquisa (canibalização); se disputar, dizer à pessoa antes de escrever.
- [ ] **Vocabulário do leitor**: o termo que as pessoas pesquisam ("dor lombar"), e o técnico ("lombalgia") explicado uma só vez.
- [ ] **Extensão**: artigos técnicos e pilar precisam de profundidade para competir. O mínimo do kit é 1 500 palavras, salvo outro valor no `seo.json` do cliente.
- [ ] **Information Gain**: algo que os primeiros resultados não têm (experiência da clínica, dados próprios, fotografias reais). Sem esses factos num documento, pedir à pessoa; nunca inventar.
- [ ] **Parágrafos curtos**: até cerca de 4 linhas, e um subtítulo pelo menos a cada 300 palavras.
- [ ] **Palavras-chave a negrito** com moderação, para o leitor.
- [ ] **Listas** (`lista`) sempre que o conteúdo for enumerável.
- [ ] **Tabelas nas comparações** (opções, tratamentos, prazos): uma tabela a sério, nunca texto corrido nem imagem. Ver "Tabelas" no `SKILL.md`.
- [ ] **Índice com âncoras** em artigos com mais de 1 500 palavras.

## 2 · Ligações

- [ ] **Ligações internas** para páginas reais do site (`node scripts/listar.mjs`), nunca endereços inventados.
- [ ] **Ligação à página de serviço do tema** (ou de patologia), e proposta à pessoa para essa página ligar de volta ao artigo.
- [ ] **Sem artigos órfãos**: propor pelo menos duas páginas existentes (categoria, serviço, outro artigo) que liguem para este. O kit não as altera: entrega a lista.
- [ ] **Texto das ligações descritivo**: diz para onde leva. Nunca "clique aqui", e não repetir sempre a mesma âncora.
- [ ] **Botão de conversão com id**, por exemplo `marcar-consulta-blog`, para medir no Analytics e no Tag Manager.
- [ ] **Telefones com * ou ****, e a nota de custo (regra comum).
- [ ] **Uma ligação externa de autoridade**, quando fizer sentido.
- [ ] **Ligações verificadas**: todas abrem, nenhuma dá erro nem é redireccionada.

## 3 · Dados estruturados (schema)

- [ ] **FAQPage** só com perguntas visíveis na página: as `perguntas` do kit já a levam. Desde 2023 o Google só mostra o destaque de FAQ a sites públicos e de saúde de referência: não prometer o destaque, fica pelo valor semântico.
- [ ] **Article ou MedicalWebPage**: autor, data de publicação e de actualização, editora. Em conteúdo clínico, `reviewedBy` (quem reviu).
- [ ] **Physician / Person** ligado à assinatura do autor.
- [ ] **BreadcrumbList**: Início > Blog > Categoria.
- [ ] **Nunca duplicar** o que o Yoast ou o Rank Math já geram. O que faltar vai na página com a peça `schema(...)` (ver "Dados estruturados" no `SKILL.md`); a linha `Schema ·` do rever mostra o que já existe.
- [ ] **Validar** no Rich Results Test ou no Schema Markup Validator antes de publicar.

## 4 · E-E-A-T

- [ ] **Assinatura do autor** com credenciais, cargo e ligação para o perfil (só com dados de um documento; senão `[por confirmar]`).
- [ ] **Revisão clínica identificada**: nome e cargo de quem reviu.
- [ ] **Datas visíveis**: publicação e última actualização. A de actualização bate certo com o `dateModified` do schema.
- [ ] **Referências verificáveis** numa caixa separada no fim.
- [ ] **Cada número ou afirmação de eficácia com fonte.** Sem fonte, sai ou passa a opinião da equipa.
- [ ] **Experiência real**: fotografias da equipa e do espaço, e a forma como a clínica trata o caso, em vez de texto genérico.
- [ ] **Sem promessas de resultado** em temas clínicos.

## 5 · Destaques visuais

- [ ] **Caixa de números** para dados que merecem destaque (só verificáveis).
- [ ] **Caixas de destaque** (`cartao`, `citacao`) para os pontos-chave ("Porquê escolher...").
- [ ] **Texto alternativo descritivo**, com a palavra-chave só quando descreve a imagem.
- [ ] **Imagens leves**: WebP, largura e altura declaradas, carregamento diferido abaixo da dobra, nome de ficheiro descritivo.

## 6 · Meta e técnico

- [ ] **Título para o Google** até cerca de 60 caracteres e **descrição** até cerca de 155.
- [ ] **Endereço curto e amigável**, com a palavra-chave, sem datas nem acentos.
- [ ] **Uma só categoria e sem etiquetas soltas** (as etiquetas fazem páginas fracas).
- [ ] **Visto no telemóvel** antes de entregar.
- [ ] **hreflang**: se houver versão noutra língua, as duas ligadas nos dois sentidos (no plugin de SEO ou de tradução, pela pessoa).
