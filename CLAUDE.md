# CLAUDE.md

Regras da agência. Valem para todos os clientes e não se alteram sem discussão com a Flowzi. Lê isto antes de qualquer coisa.

---

## 1 · Esta pasta

```
CLAUDE.md          estas regras, iguais para todos
.claude/skills/    as receitas: as do kit e as de cada cliente (<cliente>-<tarefa>)
scripts/           o que fala com o WordPress e com a Shopify. Só se altera a pedido da pessoa
treino/            o WordPress de treino
clientes/<nome>/   um cliente: CLAUDE.md, marca.json, .env (ligação), paginas/, artigos/, briefings/,
                   copias/ (estado anterior do que se alterou), notas/ (correcções), levantamento.md,
                   imagens/ (fotografias aprovadas), design.md, estilos/ e referencias/ (o desenho estudado)
```

**Uma pasta para tudo, um cliente de cada vez.** O cliente activo está em `.cliente` e aparece na barra de baixo. Todos os scripts trabalham só no cliente activo: lêem a ligação dele, a marca dele, e recusam ficheiros de outro cliente. Mudar de cliente faz-se com `/cliente`.

**Skills:** `/comecar` (primeira vez e WordPress de treino) · `/cliente` (ver, mudar ou criar cliente) · `/actualizar` (instalar a versão nova do kit, do GitHub ou do zip da Flowzi) · `/wp-ligar` (ligar o cliente ao staging) · `/wp-briefing` (levantamento) · `/wp-landing` (página nova) · `/wp-seccao` (redesenhar uma secção) · `/wp-artigo` (artigo de blogue) · `/wp-rever` (revisão antes de publicar) · `/seo` (regras de SEO da agência: palavra-chave, extensão, títulos e verificação) · `/design` (director de arte: perguntas, referência e um estilo com nome) · `/wp-design` (estudar o desenho do site do cliente) · `/wp-replicar` (página nova a partir de um site de referência) · `/shopify-ligar` (ligar o cliente à loja Shopify) · `/shopify-pagina` (página escondida na loja) · `/shopify-artigo` (artigo escondido no blogue da loja) · `/shopify-publicar` (publicar, esconder ou apagar na loja, com aviso) · `/criar-skill` (receita própria de um cliente) · `/aprender` (correcções repetidas passam a regra) · `/contribuir` (propor à Flowzi uma melhoria ao kit).

**O WordPress e a Shopify falam-se pelos `scripts/`**, nunca com pedidos à mão. Os comandos escrevem-se sempre como nas skills (`node scripts/<nome>.mjs`, com barras `/`), também no PowerShell, que as aceita. O `.env` de cada cliente tem a password de aplicação (ou, numa loja Shopify, a chave da app), e o `.env.pixabay` a chave da Pixabay: não se lêem, não se mostram, não se copiam. Fotografias gratuitas da Pixabay procuram-se com `node scripts/pixabay.mjs` (ver `/wp-landing`).

---

## 2 · O cliente activo

Antes de qualquer trabalho:

1. Ler `.cliente`. Se não existir, sugerir `/comecar` (primeira vez) ou `/cliente` e parar.
2. Ler `clientes/<cliente>/CLAUDE.md` e `clientes/<cliente>/marca.json`. A marca, o tom e as regras aprendidas vêm daí.
3. Dizer, numa linha, em que cliente se vai trabalhar.

Se a pessoa falar de outro cliente a meio, não misturar: sugerir `/cliente <nome>` e uma conversa nova (`/clear`).

---

## 3 · Português de Portugal, sempre

Esta secção existe porque é o erro que os modelos cometem por defeito, e é o que denuncia imediatamente uma página feita à pressa.

- **Números:** `1 234,56`. Espaço a separar os milhares, vírgula decimal. Nunca `1,234.56`.
- **Moeda:** `1 234,56 EUR` ou `1 234,56 €`. O símbolo vai depois do valor.
- **Datas:** `05/08/2026` ou `5 de Agosto de 2026`. Nunca o formato americano.
- **Percentagens:** `98%`, sem espaço.
- **Horas:** `16h00`.
- Construções europeias: equipa, ecrã, casa de banho, telemóvel. "A fazer", nunca "fazendo".
- **Proibido o travessão a ligar orações dentro de uma frase.** Usam-se vírgulas, dois pontos ou duas frases. O hífen ortográfico das palavras compostas mantém-se.
- Seguir a ortografia que o cliente já usa no site. Não misturar.

Antes de entregar qualquer texto, reler à procura destes pontos.

---

## 4 · Como se constrói uma página

Num WordPress sem Elementor, as páginas fazem-se em blocos do WordPress (`scripts/blocos.mjs` e `criar-pagina-blocos.mjs`, como explica o `/wp-landing`); valem as regras 1, 6, 7, 9 e 10, e a 4 passa a "blocos reais" (nunca um bloco HTML a fazer de página; os únicos são os que as peças põem sozinhas: o bloco de estilo no topo, com as letras, os ícones e o telemóvel, e a marcação das perguntas frequentes para o Google). Numa loja Shopify não há Elementor: as páginas com desenho fazem-se com as peças de `scripts/shopify-desenho.mjs` (as dos blocos, com o desenho dentro da página), e as páginas de texto e os artigos em blocos de texto dentro do modelo do tema, como explicam `/shopify-pagina` e `/shopify-artigo`. Valem as regras 1, 6, 7, 9 e 10.

1. **Nunca começar a escrever sem saber o que a página tem de fazer.** Se o pedido vier em duas linhas soltas, correr `/wp-briefing` primeiro.
2. **Containers, não secções antigas.** A estrutura moderna do Elementor, com flexbox.
3. **Um container por secção lógica.** Não aninhar containers sem necessidade. Se houver mais de três níveis de profundidade, a estrutura está errada.
4. **Widgets reais para tudo.** Um título é um widget de título, um botão é um widget de botão. Nunca despejar HTML dentro de um widget de código para poupar trabalho, porque isso destrói a edição visual e é exactamente o que o cliente não quer.
5. **Só widgets gratuitos**, salvo indicação em contrário. Não criar dependências de licenças que o cliente pode não ter.
6. **Texto alternativo em todas as imagens**, escrito para quem não vê a imagem, não para o motor de busca.
7. **Um só `h1` por página.** Hierarquia de títulos sem saltos.
8. **Sem animações de entrada.** Há sites onde a biblioteca de animações não carrega e as secções ficam invisíveis.
9. **Os títulos são um sistema.** Um estilo por nível (h1, h2, h3, etiqueta), em `titulos` no `marca.json` do cliente. Pedir para mudar um título é mudar todos os do mesmo nível: grava-se lá e volta-se a gravar a página: uma feita pelo kit, com o mesmo ficheiro e o mesmo comando; uma página Elementor que já existia, com `node scripts/titulos.mjs <página>`, que faz uma cópia em rascunho (`.claude/skills/design/titulos.md`). As outras páginas do cliente só mudam quando se voltarem a gravar: perguntar se se gravam. Nunca título a título.
10. **Cada correcção fica anotada.** Quando a pessoa corrigir algo que fizeste (cor, palavra, estrutura, tom), acrescenta uma linha a `clientes/<cliente>/notas/correcoes.md`: data, skill, o que estava e o que ficou. Se a mesma correcção já lá estiver, diz: "Já é a segunda vez que corrigimos isto. Queres que passe a regra? (`/aprender`)".

---

## 5 · Segurança, e isto não se contorna

- **No WordPress, nunca publicar.** Tudo entra em rascunho. A publicação é um acto humano.
- **No site real, só rascunhos.** O normal é trabalhar no treino ou num staging. O site real do cliente só recebe rascunhos, e só se a pessoa o confirmou como site real ao ligar (`node scripts/ligacao.mjs`, opção 2); sem isso, os scripts recusam escrever lá. A barra de baixo mostra `SITE REAL, só rascunhos` e cada gravação vem com um aviso. Antes de gravar no site real, dizer à pessoa em que site e que página nova vai aparecer no wp-admin do cliente.
- **No browser, só ler e mostrar.** Com o Claude in Chrome, tudo o que se faz no browser usa a sessão de quem lá está, sem a tranca dos scripts. Pode-se navegar, pré-visualizar e, no editor do Elementor, guardar como rascunho. Nunca carregar em Publicar ou Actualizar, nem entrar em Plugins, Aparência, Utilizadores, Definições ou Ferramentas (incluindo as do Elementor), nem correr código na página. No site real de um cliente só se lê a parte pública e se pré-visualizam os rascunhos do kit; lá, no editor do Elementor, não se guarda nada. Se a sessão do browser for de um administrador, só mostrar páginas e avisar a pessoa.
- **Nunca actualizar plugins, temas ou o núcleo** sem pedido explícito. Num site com actualizações pendentes há meses, actualizar é a forma mais rápida de o partir.
- **Na Shopify, grava-se escondido; publicar e apagar só com o sim da pessoa.** A loja do cliente é sempre a loja real: os scripts criam páginas e artigos escondidos e só alteram o que ainda está escondido. Publicar, esconder ou apagar faz-se com `node scripts/shopify-publicar.mjs`, que primeiro só mostra o que vai fazer: dizer isso à pessoa (que página, que loja, que endereço) e só correr com `--confirmo` depois de ela dizer que sim. Apagar guarda antes uma cópia em `copias/`. Nunca usar o Shopify CLI, o Shopify AI Toolkit nem outra forma de mexer na loja fora dos scripts; a guarda bloqueia publicar e apagar temas.
- **Nunca apagar conteúdo no WordPress.** Os scripts não apagam páginas nem artigos do WordPress. Apagar lá faz-se à mão, por uma pessoa. Na Shopify, ver a regra acima.
- **Nunca escrever segredos em ficheiros do projecto.** Chaves e senhas vivem em variáveis de ambiente.
- Páginas que já existem só se alteram com os scripts, que guardam antes o estado anterior em `clientes/<cliente>/copias/`.
- **Se um script do kit der erro, não o contornar.** Se a mensagem disser o que fazer (por exemplo, "escrever /comecar"), faz-se isso. Se não disser, mostrar o erro completo, dizer em que passo aconteceu e sugerir enviá-lo à Flowzi, que corrige o kit para todos. Nunca pedir à pessoa para apagar regras deste ficheiro ou de `.claude/settings.json`.
- **O kit actualiza-se só com `/actualizar`**, a partir do GitHub da equipa ou do zip que a Flowzi envia. O script só instala versões assinadas pela Flowzi; se recusar uma, não se copia nada à mão.
- **Mudar o kit (regras, scripts, skills do kit) só quando a pessoa o pede.** A guarda do kit pede confirmação antes; avisar que a próxima actualização da Flowzi substitui essas mudanças e que, se for para ficar para todos, se propõe com `/contribuir` (nunca com git, gh ou curl directamente).

---

## 6 · O que exige sempre uma pessoa

Não tentar resolver sozinho. Parar e perguntar.

- Qualquer alegação de saúde, resultado clínico, garantia ou prazo legal.
- Preços, condições comerciais e termos de contrato.
- Números de desempenho de um cliente. Se não estiverem escritos num documento do projecto, não existem.
- Testemunhos e casos reais, que exigem consentimento documentado.
- Direcção de arte. O sistema monta a página, a pessoa decide se ficou boa.

---

## 7 · Verificação antes de dar por feito

Uma tarefa só está fechada quando:

1. A página abre no editor do Elementor e os widgets aparecem no Navegador, um por elemento (títulos, textos, botões), sem widgets de código. Em blocos do WordPress: a página abre no editor normal sem avisos de bloco inválido. Na Shopify: a página ou o artigo aparece no painel, escondido, com o texto e as imagens certos.
2. `/wp-rever` passou sem apontamentos por resolver (no WordPress; numa página de SEO, com `--chave "palavra-chave"`). Na Shopify, o texto foi relido com as regras das secções 3 e 4 antes de gravar.
3. A página foi vista em telemóvel, não só em computador.
4. Os números e as datas estão em formato português.

Se algum destes falhar, dizer qual e mostrar o resultado. Não arredondar para "está feito".
