# Flowzi × WonderAds · Kit WordPress

A pasta de trabalho da WonderAds com o Claude Code. Fica no vosso computador para sempre e todos os clientes vivem aqui dentro. As páginas saem sempre em rascunho, num WordPress de treino, num staging ou no site real do cliente, e quem publica é sempre uma pessoa.

---

## Instalar no Windows, uma vez por computador

Fazer por esta ordem. Os comandos copiam-se dos blocos cinzentos tal como estão.

**1. Git para Windows (recomendado).** Não é o GitHub nem precisa de conta: é um programa pequeno que o Claude Code usa no Windows para correr comandos. Sem ele, o Claude Code usa o PowerShell e funciona na mesma.

1. Abrir https://git-scm.com/download/win. O instalador de 64 bits começa a descarregar sozinho.
2. Abrir o ficheiro descarregado (`Git-...-64-bit.exe`) e carregar em **Sim** quando o Windows perguntar.
3. Carregar em **Next** em todos os ecrãs, sem mudar nada. Não mudar a pasta de instalação: o Claude Code procura o Git em `C:\Program Files\Git`. No ecrã "Adjusting your PATH environment" fica a opção do meio, que já vem escolhida.
4. **Install** e depois **Finish**.

Quem já tem o Git instalado noutra pasta não precisa de o reinstalar: ver o erro 5 em "Windows: quando o `claude` não funciona".

**2. VS Code.** Em https://code.visualstudio.com, descarregar e instalar com as opções por defeito. É onde se abre a pasta e onde se fala com o Claude.

**3. Abrir o PowerShell.** Tecla Windows, escrever `PowerShell`, Enter. É o PowerShell, não a Linha de comandos (CMD). Aparece uma linha a acabar em `>`.

**4. Instalar o Claude Code.** Colar no PowerShell e carregar em Enter. Esperar até voltar o `>`:

```
irm https://claude.ai/install.ps1 | iex
```

**5. Deixar o `claude` disponível para sempre.** No mesmo PowerShell, colar estas duas linhas e carregar em Enter. Se já estiver feito, não acrescentam nada:

```
$caminho = [Environment]::GetEnvironmentVariable('PATH', 'User')
if ($caminho -notlike '*\.local\bin*') { [Environment]::SetEnvironmentVariable('PATH', "$caminho;$env:USERPROFILE\.local\bin", 'User') }
```

Fechar o PowerShell. Abrir outro e escrever `claude --version`: tem de aparecer um número.

**6. Node.js.** Em https://nodejs.org, botão da versão LTS, abrir o instalador do Windows (.msi) e seguir até ao fim. Depois fechar todos os terminais e o VS Code. Num PowerShell novo, `node -v` tem de mostrar `v22` ou mais.

**7. Entrar na conta.** No PowerShell, escrever `claude` e Enter. Escolher a conta Claude (a subscrição, não a "Console"). Abre o browser para entrar e autorizar. Se abrir o browser errado ou a conta errada, carregar em `c` no terminal para copiar o link e colá-lo no browser certo. Quando aparecer a caixa de escrita do Claude, está feito: sair com `/exit`.

**8. Ver tudo no browser (opcional).** Instalar a extensão Claude da Chrome Web Store (procurar "Claude" e confirmar que é da Anthropic) e entrar com a mesma conta. Depois, dentro do Claude, escrever `/chrome`.

**9. Confirmar que está tudo.** Fechar todos os PowerShell e o VS Code, abrir um PowerShell novo, colar isto e carregar em Enter:

```
$c = Get-Command claude -ErrorAction SilentlyContinue
if ($c) { "Claude Code: $(claude --version)"; if ($c.Source -like '*npm*') { '  instalado pelo npm: ver o erro 4 mais abaixo' } } else { 'Claude Code: FALTA (passos 4 e 5)' }
if (Get-Command node -ErrorAction SilentlyContinue) { $v = node -v; if ([int]($v -replace '^v(\d+).*', '$1') -ge 22) { "Node.js: $v" } else { "Node.js: $v, antigo (passo 6)" } } else { 'Node.js: FALTA (passo 6)' }
if (Get-Command git -ErrorAction SilentlyContinue) { "Git: $(git --version)" } else { 'Git: não instalado (recomendado, passo 1)' }
```

Tem de aparecer uma linha por programa, sem FALTA. Dentro do Claude, o `/comecar` confirma o resto do computador (pasta, disco, Git, internet) e explica o que fazer em cada problema. A mesma verificação corre-se a qualquer momento com `node scripts/verificar.mjs`.

**A pasta no Windows**

1. No zip, botão direito → Extrair tudo. No destino, escolher a pasta do utilizador: Procurar → Este PC → Disco local (C:) → Utilizadores → a vossa pasta. Fica `C:\Users\<o vosso nome>\flowzi-wonderads-kit`, com o `CLAUDE.md` lá dentro.
   Evitar `Documentos` e o Ambiente de trabalho, que no Windows costumam estar no OneDrive: a sincronização pode bloquear ficheiros do treino e levaria as ligações dos clientes para a nuvem.
2. No VS Code: File → Open Folder → essa pasta. Se perguntar "Do you trust the authors of the files in this folder?", escolher "Yes, I trust the authors". Se aparecer uma pasta com o mesmo nome dentro de outra, abrir a de dentro, a que tem o `CLAUDE.md`.
3. Terminal → New Terminal, escrever `claude` e Enter. O Claude pergunta, em inglês, se confia na pasta: escolher "Yes, I trust this folder".
4. Escrever `/comecar`.

## Windows: quando o `claude` não funciona

São os erros que apareceram na primeira sessão. Cada um com a mensagem que se vê e o que fazer.

**1. Escreve-se `claude` e aparece "não é reconhecido"**

No PowerShell aparece algo como:

```
claude : The term 'claude' is not recognized as the name of a cmdlet, function, script file, or operable program.
```

ou, num Windows em português, "O termo 'claude' não é reconhecido como nome de cmdlet...". Na Linha de comandos (CMD): "'claude' is not recognized as an internal or external command" ("não é reconhecido como um comando interno ou externo").

O Claude Code está instalado, mas o Windows não sabe onde. Resolve-se assim:

1. Abrir o PowerShell (tecla Windows, escrever `PowerShell`, Enter).
2. Colar estas duas linhas e carregar em Enter:

```
$caminho = [Environment]::GetEnvironmentVariable('PATH', 'User')
if ($caminho -notlike '*\.local\bin*') { [Environment]::SetEnvironmentVariable('PATH', "$caminho;$env:USERPROFILE\.local\bin", 'User') }
```

3. **Fechar o VS Code por completo** (todas as janelas) e todos os PowerShell. Abrir outra vez. Um terminal novo dentro do mesmo VS Code não chega, porque o VS Code só lê o caminho quando abre.
4. Escrever `claude --version`. Tem de aparecer um número.

Para desenrascar só naquela janela, sem fechar nada, este comando também funciona, mas perde-se ao fechar:

```
$env:Path += ";$env:USERPROFILE\.local\bin"
```

Se continuar a falhar, o Claude Code não chegou a instalar: repetir o passo 4 da instalação.

**2. Colou-se o comando de instalação do Mac**

`curl -fsSL https://claude.ai/install.sh | bash` é o comando do Mac e não serve no Windows: dá um erro (em PowerShell, por exemplo sobre parâmetros do `Invoke-WebRequest`; em CMD, "'bash' não é reconhecido") ou instala uma versão que não fica a funcionar. No Windows o comando é este, no PowerShell:

```
irm https://claude.ai/install.ps1 | iex
```

**3. `irm` não é reconhecido**

Está na Linha de comandos (CMD), não no PowerShell. Fechar e abrir o PowerShell (tecla Windows, `PowerShell`). No VS Code: no painel do terminal, na seta ao lado do `+`, escolher PowerShell.

**4. Erro com o código 193, ou "bash" recusado**

O Claude Code foi instalado pelo npm, ou não encontra o Git. Desinstalar a versão do npm e instalar com o comando do PowerShell:

```
npm uninstall -g @anthropic-ai/claude-code
irm https://claude.ai/install.ps1 | iex
```

Se mesmo assim continuar, instalar o Git para Windows (passo 1) e fechar e abrir o VS Code. Se ainda assim falhar, ver o erro 5.

**5. O Claude abre, mas não consegue correr comandos (o Git está noutra pasta)**

O Claude Code procura o Git em `C:\Program Files\Git`. Se foi instalado noutra pasta, ou noutro disco, os comandos falham. Colar isto no PowerShell e carregar em Enter: procura o Git e diz ao Claude Code onde está.

```
$bash = (@("$env:ProgramFiles\Git\bin\bash.exe", "$env:LOCALAPPDATA\Programs\Git\bin\bash.exe", "$env:USERPROFILE\scoop\apps\git\current\bin\bash.exe", 'D:\Git\bin\bash.exe', 'D:\Program Files\Git\bin\bash.exe') + @(Get-Command git -All -ErrorAction SilentlyContinue | ForEach-Object { Join-Path (Split-Path (Split-Path $_.Source)) 'bin\bash.exe' })) | Where-Object { Test-Path $_ } | Select-Object -First 1
$f = "$env:USERPROFILE\.claude\settings.json"; $s = $null; $ok = $true
if (Test-Path $f) { $raw = Get-Content $f -Raw -Encoding UTF8; if ($raw -and $raw.Trim()) { try { $s = $raw | ConvertFrom-Json -ErrorAction Stop } catch { $ok = $false } } }
if (-not $bash) { 'Não encontrei o Git. Instalar o Git para Windows (passo 1) e repetir.' } elseif (-not $ok) { 'O ficheiro de definições do Claude tem um erro. Não mexi em nada: enviar este print à Flowzi.' } else { if (-not $s) { $s = New-Object PSObject }; if (-not $s.env) { $s | Add-Member -NotePropertyName env -NotePropertyValue (New-Object PSObject) -Force }; $s.env | Add-Member -NotePropertyName CLAUDE_CODE_GIT_BASH_PATH -NotePropertyValue $bash -Force; New-Item -ItemType Directory -Force -Path (Split-Path $f) | Out-Null; [IO.File]::WriteAllText($f, ($s | ConvertTo-Json -Depth 20)); "Feito. O Claude Code passa a usar $bash" }
```

Fechar o VS Code por completo, abrir outra vez e escrever `claude`. Se aparecer "Não encontrei o Git", procurar no menu Iniciar "Git Bash", botão direito → Abrir localização do ficheiro, e enviar o print dessa pasta à Flowzi.

**6. O login abre o browser errado ou a conta errada**

Voltar ao terminal e carregar em `c`: copia o link de entrada. Colá-lo no browser onde está a conta Claude certa, entrar, e se o browser mostrar um código, colá-lo no terminal.

**7. Outras situações**

| O que aparece | O que fazer |
|---|---|
| `node` não é reconhecido | Instalar o Node.js (passo 6) e fechar e abrir o VS Code por completo |
| O `/comecar` não aparece | A pasta aberta no VS Code não é a certa. File → Open Folder e abrir a que tem o `CLAUDE.md` |
| `/comecar` escrito e o terminal diz "não é reconhecido" | Está a escrever no PowerShell, não no Claude. Escrever primeiro `claude` e Enter, e só depois `/comecar` |
| Aviso da Firewall do Windows sobre o Node.js | Pode-se carregar em Cancelar. O WordPress de treino só é usado neste computador |
| Um script do kit dá erro | Se a mensagem disser o que fazer, fazer isso. Se não, enviar o erro completo à Flowzi |

---

## Instalar no Mac, uma vez por computador

**1. Abrir o Terminal.** `Cmd+Espaço`, escrever `Terminal`, Enter. Aparece uma linha a acabar em `%`.

**2. Instalar o Claude Code.** Colar e carregar em Enter. Esperar até voltar o `%`:

```
curl -fsSL https://claude.ai/install.sh | bash
```

Fechar o Terminal (`Cmd+Q`), abrir outro e escrever `claude --version`: tem de aparecer um número.

**3. Node.js.** Em https://nodejs.org, botão da versão LTS, abrir o ficheiro descarregado e seguir o instalador. Num Terminal novo, `node -v` tem de mostrar `v22` ou mais.

**4. Entrar na conta.** `claude`, Enter, escolher a conta Claude, entrar no browser e autorizar. Sair com `/exit`.

**5. Ver tudo no browser (opcional).** Extensão Claude da Chrome Web Store, a mesma conta, e no Claude `/chrome`.

**A pasta no Mac**

1. Descompactar o zip (duplo clique) e mover a pasta `flowzi-wonderads-kit` para `Documentos`.
2. Terminal, `cd ` (com espaço), arrastar a pasta para a janela, Enter. Depois `claude`, Enter, e escolher "Yes, I trust this folder".
3. Escrever `/comecar`.

Também dá no Cursor ou no VS Code: abrir a pasta e usar o terminal de lá. Para sair do Claude: `/exit` ou `Ctrl+D` duas vezes.

## O que há aqui dentro

```
flowzi-wonderads-kit/
  LEIA-ME.md          este ficheiro
  CLAUDE.md           as regras da agência, que o Claude lê sempre. Iguais para todos os clientes
  .claude/            no Mac está escondida no Finder (Cmd+Shift+. mostra-a)
    settings.json     o que o Claude pode fazer, o que tem de perguntar e o que nunca faz
    skills/           as receitas: as do kit e as que cada cliente for ganhando
  clientes/
    treino/           o primeiro cliente, criado pelo /comecar
    <cliente>/        um por cliente real
      CLAUDE.md       a ficha dele: marca, tom, o que nunca dizer, regras aprendidas
      marca.json      as cores e os tipos de letra
      .env            a ligação ao staging. Secreta: só a pessoa a grava
      paginas/        cada página feita, para se poder refazer
      artigos/        cada artigo feito
      copias/         o estado anterior de tudo o que se alterou
      notas/          as correcções, para o /aprender
      briefings/      os levantamentos feitos com /wp-briefing
      imagens/        as fotografias aprovadas para as páginas e os artigos
      design.md       o desenho do site do cliente, feito pelo /wp-design
      referencias/    os prints e as medidas dos sites estudados
      levantamento.md o que o /wp-ligar encontrou no site
  scripts/            o que fala com o WordPress. Não se mexe
  treino/             o WordPress de treino
```

**Um cliente de cada vez.** A barra de baixo do Claude diz sempre em que cliente se está e se é treino, staging, `SITE REAL, só rascunhos` ou `loja Shopify, só escondido`. Mudar de cliente: `/cliente`.

## As skills

| Comando | O que faz |
|---|---|
| `/comecar` | Primeira vez: confirma a máquina, explica a pasta, levanta o WordPress de treino |
| `/cliente` | Mostra o cliente activo, muda de cliente ou cria um novo |
| `/actualizar` | Instala a versão nova do kit que a Flowzi enviou, sem tocar nos clientes |
| `/wp-ligar` | Liga o cliente ao staging dele e lê a versão, o builder e a marca |
| `/wp-briefing` | Faz as perguntas certas antes de uma página, quando o pedido vem vago |
| `/wp-landing` | Faz uma página nova em Elementor e grava em rascunho |
| `/wp-seccao` | Redesenha uma secção de uma página existente, sem tocar no original |
| `/wp-design` | Estuda o desenho do site do cliente (prints e medidas) e grava-o em `design.md`, para as páginas novas saírem iguais ao resto do site |
| `/design` | Faz de director de arte: quatro perguntas curtas, vê uma referência de que se gosta e cria um estilo com nome (letras, cores, espaços, imagens) que o `/wp-landing` e o `/wp-replicar` seguem |
| `/wp-replicar` | Dá-se o endereço de uma página de que se gosta; o Claude vê-a, mede-a e faz uma página do cliente com aquele desenho, com o texto e as fotografias do cliente |
| `/wp-artigo` | Escreve um artigo de blogue e grava-o em rascunho, com resumo e perguntas frequentes |
| `/wp-rever` | Revê a página antes de alguém a publicar |
| `/shopify-ligar` | Liga o cliente à loja Shopify dele e lê o plano, as permissões e os blogues |
| `/shopify-pagina` | Escreve uma página e grava-a escondida na loja |
| `/shopify-artigo` | Escreve um artigo e grava-o escondido no blogue da loja, com resumo e perguntas frequentes |
| `/shopify-publicar` | Publica, esconde ou apaga uma página ou um artigo da loja. Diz antes o que vai fazer e só avança com o vosso sim |
| `/criar-skill` | Cria uma receita própria de um cliente para uma tarefa que se repete |
| `/aprender` | Junta as correcções repetidas e passa-as a regra do cliente |

## Cábula

| Tecla ou comando | Para quê |
|---|---|
| `Esc` | Parar o que ele está a fazer |
| `Shift+Tab` | Muda o modo: carregar até aparecer "plan mode", em que só lê e propõe, ou "auto mode", em que avança sem pedir licença a cada passo. |
| `@ficheiro` | Apontar um ficheiro |
| Colar ou arrastar uma imagem | Mostrar um print ("esta secção está desalinhada no telemóvel") |
| `/clear` | Conversa nova. Uma página, uma conversa. Sempre ao mudar de cliente |
| `/help` | Lista de comandos |
| `claude -c` | Voltar à última conversa nesta pasta |
| `/exit` ou `Ctrl+D` duas vezes | Sair |
| `Ctrl` + clique num link | Abrir no browser um endereço que o Claude mostrou |

## O WordPress de treino

O `/comecar` deixa um WordPress com Elementor a correr só neste computador, em http://127.0.0.1:9400/wp-admin/ (se pedir login: `admin` / `password`). Continua a correr depois de fechar o Claude. Para o parar: `node scripts/treino.mjs --parar`.

É descartável: quando o computador se desliga, pára, e da vez seguinte volta limpo. Perde-se o que só existia no WordPress de treino (rascunhos, mudanças feitas à mão no editor do Elementor, imagens carregadas). Ficam os ficheiros em `clientes/treino/paginas/` e `artigos/`, que voltam a gravar-se com um pedido ao Claude. O trabalho feito no staging de um cliente não se perde.

## Voltar a trabalhar no dia seguinte

1. Abrir o VS Code (ou o Terminal), Terminal → New Terminal.
2. Escrever `claude` e Enter, ou `claude -c` para continuar a conversa da véspera. Só se está a falar com o Claude quando aparece a caixa de escrita dele.
3. Se for para treinar: `/comecar` e escolher 1. O Claude levanta o treino outra vez e propõe voltar a gravar as páginas da véspera.
4. Se for um cliente: `/cliente` para escolher qual. Já está ligado, não é preciso fazer nada.

## Quando o Claude pede licença

O Claude pergunta, em inglês, antes de escrever ficheiros ou de gravar no WordPress ("Do you want to proceed?"). Ler o que ele vai fazer e escolher "1. Yes". Se a acção for publicar, apagar ou mexer noutra coisa que não a página pedida, escolher "No" e avisar a Flowzi. Num cliente ligado ao site real, cada gravação vem com um "Aviso do kit" que diz o endereço: confirmar que é mesmo esse site. Evitar "Yes, and don't ask again" nas primeiras semanas.

Algumas acções vêm com um "Aviso do kit" antes da pergunta: mudar as regras, os scripts ou as skills do kit, correr outros programas, apagar pastas. Lê-se o aviso e confirma-se só se for mesmo isso que se quer. A única coisa que o kit não deixa fazer é ler as passwords dos clientes (os `.env`).

## Depois de alterar uma página

Quando o Claude altera uma página que já existia, o Elementor pode continuar a mostrar o estilo antigo na pré-visualização. Abre-se a página no editor do Elementor e guarda-se como rascunho: na seta ao lado do botão verde, "Guardar rascunho". Nunca o botão verde "Publicar".

## Sites com palavra-passe à entrada

Alguns stagings (é comum no WP Engine) pedem uma password antes de mostrar o site. O kit ainda não liga a estes sites: o `/wp-ligar` pára e avisa. Nesse caso, falar com a Flowzi.

## Staging numa subpasta

Quando o alojamento não deixa criar subdomínios, o staging pode ser feito por um plugin, numa subpasta do site: `cliente.pt/staging`. O kit liga a estes stagings como aos outros: no `/wp-ligar`, dar o endereço com a subpasta. Se a subpasta não se chamar `staging`, `stg`, `dev`, `teste` ou `qa`, o kit pergunta se é mesmo uma cópia de testes, e a confirmação só vale para aquela subpasta, nunca para o site real.

Em cada gravação, o kit confirma que quem responde é o WordPress da subpasta e não o site real ao lado; se for o site real, pára sem escrever.

Alguns plugins de staging (o WP Staging, por exemplo) pedem login à entrada do staging, e o kit não passa essa porta: o `/wp-ligar` diz que "o site não respondeu como um WordPress". Nesse caso, quem gere o site desliga essa protecção nas definições do plugin, ou fala-se com a Flowzi.

## Cliente sem staging: no site real, só rascunhos

Se o cliente não tem staging, o kit pode ligar ao site real. Ao correr `node scripts/ligacao.mjs`, o script pergunta o que é aquele endereço: escolhe-se 2 (site real) e escreve-se o endereço outra vez para confirmar. A partir daí:

- o kit cria páginas e artigos novos em rascunho, e altera só os rascunhos;
- nunca publica, nunca apaga e nunca mexe numa página publicada (para mudar uma secção, o `/wp-seccao` faz uma cópia em rascunho);
- a barra de baixo mostra `SITE REAL, só rascunhos`, e cada gravação vem com um aviso com o endereço do site.

Os rascunhos não aparecem aos visitantes, mas aparecem no wp-admin do cliente. Quem publica é sempre uma pessoa, no WordPress. Usar um utilizador com papel de Editor, nunca administrador.

## Sites sem Elementor

O `/wp-ligar` diz que construtor o site usa. Num site sem Elementor, o Claude faz as páginas em blocos do WordPress (o editor normal, Gutenberg), com as mesmas peças e sempre em rascunho; os artigos já eram assim. As letras são as do tema do site, e a página edita-se no editor normal do WordPress. Em sites feitos em Divi, Bricks, Oxygen ou Beaver Builder, as páginas novas em blocos abrem no editor normal, não nesse construtor.

## Fotografias da Pixabay

O Claude pode procurar fotografias gratuitas na Pixabay e propô-las para a página. Liga-se uma vez por computador:

1. Entrar em pixabay.com com a conta da agência e abrir pixabay.com/api/docs. A chave aparece na secção "Parameters", no campo "key".
2. Num terminal à parte (no VS Code, botão +), correr `node scripts/pixabay.mjs --chave` e colar a chave. Não se escreve no chat do Claude.
3. Pedir ao Claude, por exemplo: "procura fotografias na Pixabay de uma clínica dentária moderna".

O Claude mostra as opções; as escolhidas ficam em `clientes/<cliente>/imagens/`. Sobem-se para a Biblioteca de Media do site e cola-se o URL ao Claude. O Envato Elements não se liga ao Claude: descarregar à mão e fazer o mesmo.

## Clientes em Shopify

Numa loja Shopify não há staging para páginas e artigos: o kit grava na loja real, sempre **escondido**. Ninguém de fora vê o que está escondido, (o painel chama "Oculto" ao que o kit chama escondido). Para publicar, esconder ou apagar, `/shopify-publicar`: o Claude diz antes que página, em que loja e o que vai acontecer, e só avança depois do vosso sim, com um "Aviso do kit". Apagar guarda primeiro uma cópia em `copias/`, porque a Shopify não tem reciclagem. Também se pode publicar à mão, no painel: Visibilidade → Visível.

1. O dono da loja cria uma app no Dev Dashboard da Shopify (dev.shopify.com), com as permissões `write_content` e `write_files` e mais nenhuma, instala-a na loja e envia o Client ID e o Client secret por um canal seguro. O `/shopify-ligar` tem o texto pronto a enviar-lhe.
2. `/cliente` (criar o cliente) e `/shopify-ligar`. A chave grava-se num terminal à parte, com `node scripts/ligacao.mjs` e o endereço `xxx.myshopify.com` da loja.
3. Trabalhar: `/shopify-pagina` e `/shopify-artigo`.

O que o kit faz na Shopify é texto, imagens e botões dentro do modelo do tema da loja. Landing pages com secções desenhadas fazem-se, por agora, no editor de temas da Shopify.

## Cliente sem staging: uma cópia no computador

Se o cliente não dá acesso ao alojamento, pode-se trabalhar numa cópia do site no próprio computador, por exemplo com o programa Local (localwp.com). Quem gere o site exporta-o com um plugin de migração, importa-se no Local e cria-se lá um utilizador Editor. No `/wp-ligar`, o endereço é o que o Local mostra (`http://cliente.local`). A barra de baixo mostra `local`.

Se no Perfil desse WordPress não aparecer a secção das palavras-passe de aplicação, acrescentar esta linha ao `wp-config.php` da cópia (no Local: botão direito no site → Go to site folder → `app\public`), antes da linha que diz "That's all, stop editing":

```
define( 'WP_ENVIRONMENT_TYPE', 'local' );
```

As páginas feitas na cópia não passam sozinhas para o site do cliente: quem gere o site exporta-as e importa-as no Elementor (modelos), ou refazem-se no staging quando houver.

## Um cliente novo

Antes, pedir a quem gere o site do cliente: o endereço do staging (a cópia de testes, num subdomínio como `staging.cliente.pt` ou numa subpasta como `cliente.pt/staging`) e um utilizador com papel de Editor nesse staging. Sem staging, ver "Cliente sem staging" acima: liga-se ao site real, só com rascunhos, ou a uma cópia no computador.

1. `/cliente` e dizer o nome. Cria `clientes/<nome>/` a partir do modelo e passa a ser o cliente activo.
2. `/wp-ligar`. Explica como criar a password de aplicação no staging e como a gravar num terminal à parte, sem passar pelo chat.
3. Trabalhar: `/wp-design` (uma vez por cliente), `/wp-landing`, `/wp-replicar`, `/wp-seccao`, `/wp-artigo`, `/wp-rever`.
4. O que se corrige duas vezes passa a regra com `/aprender`. O que se repete vira receita do cliente com `/criar-skill`.

## O que impede o site real de mudar

| Barreira | O que trava |
|---|---|
| Não há password de produção | A password de aplicação só se cria no staging. Sem ela, nenhum pedido chega ao site real |
| Os scripts recusam produção não confirmada | Um endereço sem `staging`, `stg` ou `dev` num subdomínio ou numa subpasta não recebe escrita. Um staging com outro nome, ou o site real em modo só rascunhos, só o confirma a pessoa, ao ligar. Antes de gravar, o kit confirma que responde o WordPress do staging e não o site real |
| Os scripts só gravam rascunhos | Em qualquer site, também no real: publicar, apagar, mexer em plugins ou em páginas publicadas pára no script. Na Shopify, tudo entra escondido; publicar, esconder e apagar só com `/shopify-publicar`, depois do vosso sim |
| O kit só se actualiza com zips da Flowzi | O `/actualizar` confirma a assinatura da Flowzi e recusa qualquer outro zip, mesmo que alguém o peça ao Claude |
| O Claude pede licença e há uma guarda | Gravar no WordPress pergunta sempre antes. A guarda do kit avisa e pede confirmação, mesmo em modo automático, antes de mudar o kit ou de falar com o WordPress por fora dos scripts, e não deixa ler as passwords |
| O utilizador é Editor | O kit avisa se a ligação for de um administrador. Um Editor não instala plugins nem muda temas, e a password revoga-se num clique |
| Uma pessoa publica | O rascunho só fica público quando alguém carrega em Publicar no WordPress |

No browser (Claude in Chrome), o Claude usa a sessão de quem lá está. Por isso só navega, mostra e guarda rascunhos no Elementor, e num staging entra-se com o utilizador Editor, nunca com administrador.

O `.env` de cada cliente guarda a ligação ao site. Não se partilha, nem no chat do Claude, nem no WhatsApp.

## Actualizar o kit

Quando a Flowzi enviar uma versão nova, guarda-se o zip nas Transferências sem lhe mudar o nome (no WhatsApp: botão direito no ficheiro → Guardar como → Transferências) e, no Claude, escreve-se `/actualizar`. O Claude encontra o zip, mostra a versão nova e a instalada e, com a confirmação, instala: actualiza as regras, as skills, os scripts e a guarda. Os clientes, as ligações e as páginas ficam como estão. No fim, sair do Claude (`/exit`) e voltar a entrar.

O kit só instala zips assinados pela Flowzi. Se disser que o zip não é assinado, ou que não bate certo, não se instala: pede-se o zip oficial à Flowzi.

**Só da primeira vez**, num kit anterior a 15/10/2026 (que ainda não tem o `/actualizar`):

1. Descompactar o zip nas Transferências (botão direito → Extrair tudo). O Windows cria uma pasta `flowzi-wonderads-kit` dentro de outra com o mesmo nome: a que conta é a de dentro, a que tem o `CLAUDE.md`.
2. Botão direito nessa pasta de dentro → Copiar como caminho.
3. No VS Code, com a pasta do kit aberta: Terminal → New Terminal (o terminal de baixo, não a caixa do Claude). Escrever `node scripts/actualizar.mjs ` (com um espaço no fim), colar o caminho e carregar em `Enter`.
4. Sair do Claude (`/exit`) e voltar a entrar.

Daí em diante, é sempre `/actualizar`.

---

Dúvidas: Diogo Coutinho · diogo.coutinho@flowzi.pt · Flowzi
