# Checklist WonderAds · página de serviço ou de patologia

Da checklist interna "página de serviço / patologia v2" da WonderAds. São as páginas que convertem: **serviço** (o que a clínica trata e como) e **patologia** (o que é e como se trata). Os pontos marcados (serviço) ou (patologia) são só desse tipo. Valem também as regras comuns do `SKILL.md`.

## 1 · Estrutura e conteúdo

- [ ] **Regras do cliente confirmadas** antes de escrever: ortografia, tamanho mínimo e termos a evitar.
- [ ] **Um só h1** com a palavra-chave e, num serviço local, a localidade.
- [ ] **Títulos sem saltos**: h2, depois h3.
- [ ] **Uma página, uma intenção**: o serviço responde a "quero marcar", a patologia a "quero perceber". A explicação longa vai para o blogue.
- [ ] **Uma palavra-chave por endereço**: confirmar com `node scripts/listar.mjs` (e o `seo.json`) que nenhuma outra página ou artigo disputa a mesma pesquisa.
- [ ] **Resumo no topo**: o que é, para quem é e como a clínica trata, em 3 ou 4 linhas, antes de qualquer secção longa.
- [ ] **Secções de base (serviço)**: o que é, para quem faz sentido, como decorre (passo a passo), o que esperar, contra-indicações, como marcar, perguntas frequentes.
- [ ] **Secções de base (patologia)**: o que é, sintomas, causas, como se diagnostica, como tratamos (com ligação ao serviço), quando procurar o médico, prevenção, perguntas frequentes.
- [ ] **Texto único em cada página**: nunca o mesmo modelo com só o nome trocado. Páginas quase iguais contam como duplicadas.
- [ ] **(patologia) Página própria só quando a procura justifica**: as de procura baixa juntam-se numa página de grupo. Sem dados de volume num documento, perguntar à pessoa.
- [ ] **Vocabulário do paciente**: o termo que se pesquisa, e o técnico explicado uma só vez.
- [ ] **Extensão**: o texto cobre as perguntas reais do tema. O mínimo do kit é 1 500 palavras (a checklist pede pelo menos 1 200, mas manda o que os resultados do Google mostram), salvo outro valor no `seo.json`.
- [ ] **Information Gain**: experiência da clínica, dados próprios, fotografias reais.
- [ ] **Parágrafos curtos** (até cerca de 4 linhas) e **listas** sempre que o conteúdo for enumerável.
- [ ] **Tabelas nas comparações** (opções, tratamentos, prazos), nunca texto corrido nem imagem.

## 2 · Ligações

- [ ] **Patologia e serviço ligados**: a patologia liga ao serviço que a trata, o serviço às patologias que trata.
- [ ] **Dois ou três artigos do blogue relacionados**, e proposta para esses artigos ligarem de volta.
- [ ] **Texto das ligações descritivo**, nunca "clique aqui".
- [ ] **Ligações verificadas**: nenhuma partida nem redireccionada.
- [ ] **Lugar certo na arquitectura**: ligada a partir do menu ou de uma página-mãe (Patologias > grupo > patologia), a no máximo 3 cliques da página inicial.
- [ ] **Botão com id** (por exemplo `marcar-avaliacao-servico`) no topo, a meio e no fim.
- [ ] **Telefone e WhatsApp medidos**: ligações `tel:` e botão de WhatsApp com evento no Tag Manager, para contar os contactos por página.

## 3 · Dados estruturados (schema)

- [ ] **(patologia) MedicalCondition** com `possibleTreatment`, ligado à clínica pelo mesmo `@id`.
- [ ] **(serviço) MedicalTherapy ou Service**: nome, descrição e área servida, ligado à clínica pelo mesmo `@id`.
- [ ] **MedicalWebPage** com `reviewedBy` e `lastReviewed` nas páginas clínicas.
- [ ] **Physician / Person** do profissional responsável, ligado à assinatura da página.
- [ ] **FAQPage** só com perguntas visíveis (as `perguntas` do kit). Não contar com o destaque no Google.
- [ ] **BreadcrumbList**: Início > Patologias > Grupo > Página.
- [ ] **Nunca duplicar** o que o Yoast ou o Rank Math já geram. O que faltar vai na página com a peça `schema(...)` (ver "Dados estruturados" no `SKILL.md`); a linha `Schema ·` do rever mostra o que já existe.

## 4 · E-E-A-T e conformidade

- [ ] **Profissional responsável** pela área, com credenciais, cédula profissional (se o cliente a quiser mostrar) e ligação para o perfil.
- [ ] **Revisão clínica e data**: "actualizado em" visível, com a data da última revisão.
- [ ] **Cada número ou afirmação de eficácia com fonte verificável.**
- [ ] **Sem promessas de cura nem garantias**, com "os resultados variam" onde couber (código deontológico e ERS).
- [ ] **(patologia) Sinais de alarme**: quando procurar o médico com urgência, claro e visível.
- [ ] **(serviço) Quando não está indicado**: em que casos o tratamento não se aplica.
- [ ] **Avaliações reais**, com o texto original e a fonte, sem edições que mudem o sentido (com consentimento, secção 6 do `CLAUDE.md`).
- [ ] **Contactos coerentes**: morada, telefone e horário iguais aos do Perfil de Empresa Google.
- [ ] **Telefones com * ou ****, e a nota de custo (regra comum).

## 5 · Conversão e visual

- [ ] **Botão acima da dobra no telemóvel**: marcar ou contactar sem rolar.
- [ ] **Informação prática**: como é a primeira consulta, duração, preço ou "a partir de" (só se o cliente o definir: secção 6 do `CLAUDE.md`), localização e estacionamento.
- [ ] **(serviço) Como decorre, em passos**: do primeiro contacto à alta.
- [ ] **Prova social**: nota e número de avaliações Google visíveis.
- [ ] **Fotografias reais** da equipa, do espaço e dos equipamentos, em vez de banco de imagens.
- [ ] **Imagens** com texto alternativo descritivo, em WebP, com largura e altura declaradas.
- [ ] **Caixas de destaque e caixa de números** para os pontos-chave e os dados que merecem destaque.

## 6 · Meta e técnico

- [ ] **Título para o Google** com a palavra-chave e a localidade, até cerca de 60 caracteres; **descrição** até cerca de 155.
- [ ] **Endereço curto e estável** dentro da hierarquia (por exemplo `/patologias/grupo/patologia/`), sem datas. Se mudar, 301 (decide a pessoa).
- [ ] **Indexável e no sitemap.**
- [ ] **Core Web Vitals no telemóvel**: LCP abaixo de 2,5 s e CLS abaixo de 0,1, primeiro nas páginas que mais convertem.
- [ ] **Vista no telemóvel** antes de entregar.
- [ ] **hreflang**, se houver versão noutra língua.
