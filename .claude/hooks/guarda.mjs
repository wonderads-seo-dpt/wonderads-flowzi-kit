// Guarda do kit: o Claude Code corre isto antes de cada comando ou ficheiro, em qualquer modo (também no automático).
// Só bloqueia uma coisa: ler as passwords dos clientes (os .env). Tudo o que é invulgar, mas pode ser preciso
// (mexer no kit, outros programas, apagar pastas), passa a uma pergunta à pessoa, com o motivo em português.
import { resolve, relative, isAbsolute, basename, sep, join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

let entrada = '';
for await (const pedaco of process.stdin) entrada += pedaco;
let pedido;
try { pedido = JSON.parse(entrada); } catch { process.exit(0); }
const ferramenta = pedido.tool_name || '';
const dados = pedido.tool_input || {};
const raiz = resolve(process.env.CLAUDE_PROJECT_DIR || pedido.cwd || process.cwd());

// A decisão vai no JSON e não no código de saída: no Windows PowerShell 5.1 o código 2 chega ao Claude Code como 1,
// que não bloqueia. O JSON chega igual em todas as shells.
// Só sai uma decisão, a primeira (os bloqueios vêm antes dos avisos): duas respostas seguidas não são JSON válido,
// e o Claude Code ignorava-as.
let decidido = false;
const decidir = (decisao, motivo) => {
  if (decidido) return;
  decidido = true;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decisao, permissionDecisionReason: motivo },
  }), () => process.exit(0));
};
const bloquear = (motivo) => decidir('deny', `Bloqueado pela guarda do kit: ${motivo}`);
// Pede confirmação à pessoa, mesmo em modo automático.
const perguntar = (motivo) => decidir('ask', `Aviso do kit: ${motivo}`);

// As skills novas do kit entram nesta lista (as de cliente, <cliente>-<tarefa>, ficam de fora).
const SKILLS_DO_KIT = [
  'comecar', 'cliente', 'actualizar', 'contribuir',
  'wp-ligar', 'wp-briefing', 'wp-landing', 'wp-seccao', 'wp-artigo', 'wp-rever', 'wp-design', 'design', 'wp-replicar',
  'shopify-ligar', 'shopify-pagina', 'shopify-artigo', 'shopify-publicar',
  'criar-skill', 'aprender', 'seo',
];
const doKit = (caminho) => {
  const rel = relative(raiz, resolve(raiz, caminho)).split(sep).join('/');
  if (rel.startsWith('..') || isAbsolute(rel)) return false;
  // O MANIFESTO.json diz de que versão parte o kit: mexer-lhe escondia mudanças ao /contribuir.
  return rel === 'CLAUDE.md' || rel === '.gitignore' || rel === 'LEIA-ME.md' || rel === 'NOVIDADES.md'
    || rel === 'MANIFESTO.json' || rel === 'ASSINATURA' || rel === 'VERSAO'
    || rel.startsWith('scripts/') || rel.startsWith('treino/blueprint')
    || rel.startsWith('.claude/hooks') || /^\.claude\/settings(\.local)?\.json$/.test(rel)
    || SKILLS_DO_KIT.some((s) => rel.startsWith(`.claude/skills/${s}/`));
};
// O site real de um cliente (WP_LIVE, ou a loja Shopify, no .env dele), para o aviso. A password não se lê.
const liveDe = (nome) => {
  try {
    return (readFileSync(join(raiz, 'clientes', nome, '.env'), 'utf8').match(/^[ \t\uFEFF]*(?:WP_LIVE|SHOPIFY_LOJA)[ \t]*=[ \t]*["']?([^\s"']+)/m) || [])[1] || '';
  } catch { return ''; }
};
const activo = () => { try { return readFileSync(join(raiz, '.cliente'), 'utf8').trim(); } catch { return ''; } };
const todosReais = () => { try { return readdirSync(join(raiz, 'clientes')).map(liveDe).filter(Boolean); } catch { return []; } };
const eEnv = (caminho) => /^\.env(\.|$)/i.test(basename(String(caminho)));
const MUDAR_KIT = 'isto altera o kit da agência (regras, scripts ou skills). Só se a pessoa o pediu. A próxima actualização da Flowzi substitui estas alterações: se for para ficar para todos, propor com /contribuir';

// Ferramentas de ficheiros
if (['Read', 'Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(ferramenta)) {
  const f = dados.file_path || dados.notebook_path || '';
  if (eEnv(f)) {
    if (ferramenta === 'Read') bloquear('o .env tem a password de aplicação do cliente e não se lê. A ligação grava-se com node scripts/ligacao.mjs, num terminal à parte.');
    perguntar('isto altera a ligação do cliente (.env). O normal é a pessoa usar node scripts/ligacao.mjs num terminal à parte.');
  }
  if (ferramenta !== 'Read' && doKit(f)) perguntar(`${MUDAR_KIT}.`);
  process.exit(0);
}

// Comandos (Bash, ou PowerShell no Windows sem Git)
if (['Bash', 'PowerShell'].includes(ferramenta)) {
  const c = String(dados.command || '');
  // Ler um .env pela shell: o nome do ficheiro, ou um padrão que o apanhe (.e*, .e?v).
  const leitura = /\b(cat|type|more|less|head|tail|Get-Content|gc|strings|od|xxd|bat|nl|awk|sed|grep|findstr|Select-String|sls|cp|copy|Copy-Item|scp)\b/i.test(c);
  if (leitura && /(^|[\s"'=/\\])\.e(nv\b|\*|\?|\[)/i.test(c)) bloquear('o .env tem a password de aplicação do cliente e não se lê.');
  // Escrever no .env pela shell é desviar a ligação (e a chave) para outro sítio: só o ligacao.mjs o grava.
  const escreveShell = />|\btee\b|\bsed\b[^|;&]*\s-i\b|\bof=|\b(cp|mv|ln|dd|install|rsync|copy|move|ni|Copy-Item|Move-Item|New-Item|Set-Content|Add-Content|Out-File|sc|ac)\b|\[(System\.)?IO\.File\]|WriteAll|AppendAll/i;
  const semAspasEnv = c.replace(/[`'"^]/g, '');
  if (/(^|[\s=/\\])\.e(nv(?![\w.])|\*|\?|\[)/i.test(semAspasEnv) && escreveShell.test(semAspasEnv)) bloquear('o .env só se grava com node scripts/ligacao.mjs, pela pessoa, num terminal à parte.');
  // No PowerShell e no cmd, o * apanha também os ficheiros que começam por ponto: clientes\x\* inclui o .env.
  const powershell = ferramenta === 'PowerShell' || /\b(Get-Content|gc|type|Select-String|sls|Copy-Item|copy)\b/i.test(c);
  if (leitura && powershell && /(^|[\s"'=/\\])clientes[/\\]([^/\\\s"';|]+[/\\])?\*(?![\w.])/i.test(c)) {
    bloquear('ler a pasta de um cliente com * apanha também o .env, que tem a password. Ler os ficheiros pelo nome (por exemplo clientes\\x\\CLAUDE.md).');
  }

  const avisos = [];
  if (/\bligacao\.mjs\b/i.test(c)) avisos.push('a ligação é feita pela pessoa, num terminal à parte, porque pede a password, que não passa pelo chat');
  else if (/\bactualizar\.mjs\b/i.test(c)) avisos.push('isto actualiza o kit (regras, scripts, skills e guarda). Só se instalam zips assinados pela Flowzi; os clientes ficam como estão');
  else if (/\bcontribuir\.mjs\b/i.test(c) && /--pr\b/i.test(c.replace(/[`'"^]/g, ''))) avisos.push('isto envia ficheiros do kit para fora do computador (um Pull Request no GitHub da equipa). Só depois de a pessoa ter dito que sim');
  else {
    // O alvo acaba no primeiro separador de comandos: "node -v; ls" é "node -v" seguido de "ls".
    for (const m of c.matchAll(/(?:^|[\s;&|(])node(?:\.exe)?\s+("[^"]+"|'[^']+'|[^\s;&|)]+)/gi)) {
      const bruto = m[1].replace(/^["']|["']$/g, '').replace(/\\/g, '/');
      // Aceita também o caminho completo (C:\Users\...\kit\scripts\treino.mjs), que o PowerShell usa muitas vezes.
      const alvo = /^-/.test(bruto) ? bruto : relative(raiz, resolve(raiz, bruto)).split(sep).join('/');
      if (!/^(scripts\/[\w-]+\.mjs|-v|--version)$/.test(alvo)) { avisos.push(`"node ${m[1]}" não é um dos scripts do kit`); break; }
    }
  }
  // O Shopify CLI não faz parte do kit: publica e apaga temas com a mesma password com que os edita.
  // Tiram-se aspas, acentos graves e barras de escape antes de procurar ("pub''lish", pub`lish, shop\ify), e as acções
  // perigosas contam mesmo sem a palavra shopify à vista (num $s, num $(...)). A palavra sozinha, num texto, passa.
  const limpo = c.replace(/[`'"^]|\\(?=[a-z])/gi, '').replace(/\(\s*([a-z]+)\s*\+\s*([a-z]+)\s*\)/gi, '$1$2');
  const accaoPerigosa = /\btheme[\s,]+(publish|delete|rename)\b|--(publish|live|allow-live|allow-mutations)\b|\bstore[\s,]+(execute|auth)\b|\bapp[\s,]+(deploy|release)\b/i;
  const cli = /(^|[\s;&|(=/\\])(@shopify[/\\]cli(@\S*)?|shopify(\.cmd|\.exe|\.ps1)?)\s+(theme|app|store|auth|hydrogen|login|logout|upgrade|plugins|config|organization|webhook|init|search|commands)\b/i;
  // Com o caminho completo (C:\npm\shopify.cmd) as barras saem do limpo: procurar também no comando só sem aspas.
  if (accaoPerigosa.test(limpo) || cli.test(limpo) || cli.test(c.replace(/[`'"^]/g, ''))) {
    bloquear('o Shopify CLI não se usa pelo Claude: publica e apaga temas. Na Shopify, o kit só grava páginas e artigos escondidos pelos scripts, e quem publica é uma pessoa, no painel.');
  }
  if (/(?:^|[\s;&|(])(npx|npm|pnpm|yarn|bun|deno|python3?|py|perl|ruby|php|wget|curl|Invoke-WebRequest|Invoke-RestMethod|iwr|irm)(?:\.exe|\.cmd)?(?=\s|$)/i.test(c)) {
    avisos.push('este programa não faz parte do trabalho normal do kit; o WordPress fala-se pelos scripts, que só gravam rascunhos');
  }
  if (/(?:^|[\s;&|(])gh(?:\.exe)?(?=\s|$)/i.test(c)) {
    avisos.push('o gh fala com o GitHub por fora do kit; as versões novas vêm pelo /actualizar e as propostas vão pelo /contribuir, que confirma o que sai');
  }
  // Pesquisa em todas as pastas: só avisa se puder chegar aos .env (fora de paginas/, artigos/, notas/, etc.).
  const pesquisaFunda = [...c.matchAll(/\b(grep\b[^|;&]*\s-[a-zA-Z]*[rR][a-zA-Z]*\b[^|;&]*|findstr\b[^|;&]*\/s\b[^|;&]*|Select-String\b[^|;&]*-Recurse[^|;&]*|(?:gci|Get-ChildItem|dir|ls)\b[^|;&]*\s-r(?:ecurse)?\b[^;&]*\|\s*(?:sls|Select-String|gc|Get-Content|cat|type)\b[^|;&]*)/gi)]
    .some((m) => !/(paginas|artigos|notas|briefings|copias|conteudo|scripts|\.claude)([/\\]|\b)/i.test(m[1]) && !/--exclude=['"]?\.env/i.test(m[1]));
  if (pesquisaFunda || /WP_APP_PASSWORD/i.test(c)) {
    avisos.push('uma pesquisa em todas as pastas pela shell pode mostrar passwords dos clientes; a pesquisa do Claude não as mostra');
  }
  // Correr um script do kit não é mudar o kit, mesmo com o resultado guardado num ficheiro.
  // Mandar erros para lado nenhum (2>/dev/null, 2>&1, >$null) também não escreve ficheiros.
  const semScripts = c.replace(/node(?:\.exe)?\s+(?:\.[/\\])?scripts[/\\][\w-]+\.mjs/gi, '').replace(/\d?>>?\s*(\/dev\/null\b|\$null\b|nul\b|&\d)/gi, '');
  const escreve = />|\btee\b|\bsed\b[^|;&]*\s-i\b|\b(mv|cp|rm|rmdir|touch|ln|chmod|truncate|unlink)\b|Set-Content|Add-Content|Out-File|Remove-Item|Copy-Item|Move-Item|New-Item|Rename-Item/i.test(semScripts);
  const kitNaShell = new RegExp(`(^|[\\s"'=/\\\\])(scripts[/\\\\]|\\.claude[/\\\\](settings|hooks|skills[/\\\\](${SKILLS_DO_KIT.join('|')})[/\\\\])|CLAUDE\\.md|LEIA-ME\\.md|NOVIDADES\\.md|MANIFESTO\\.json|ASSINATURA\\b|VERSAO\\b|treino[/\\\\]blueprint)`);
  if (escreve && kitNaShell.test(semScripts.replace(/clientes[/\\][^\s"']+/g, ''))) avisos.push(MUDAR_KIT);
  if (/\brm\s+-[a-z]*r|\bRemove-Item\b[^|;]*-Recurse|\brmdir\b/i.test(c)) avisos.push('isto apaga pastas, e o que se apaga não volta');
  if (/\bgit\s+push\b/.test(c)) avisos.push('isto envia código para fora do computador');
  // O Windows (e o Mac) não distinguem maiúsculas nos nomes; o seccao.mjs só não grava com --listar logo a seguir.
  const grava = [...c.matchAll(/(criar-pagina-blocos|criar-pagina|criar-artigo|regenerar-css|seccao|titulos|shopify-pagina|shopify-artigo)\.mjs\b["']?([^;&|\r\n]*)/gi)]
    .some(([, nome, resto]) => !({ seccao: /^\s*["']?--listar["']?(\s|$)/i, titulos: /^\s*["']?--ver["']?(\s|$)/i })[nome.toLowerCase()]?.test(resto));
  // Se o comando também muda de cliente, pode gravar noutro: conta qualquer cliente ligado ao site real.
  const troca = /cliente\.mjs|\.cliente\b/i.test(c);
  const reais = [...new Set(troca ? todosReais() : [liveDe(activo())].filter(Boolean))];
  // Publicar, esconder ou apagar na loja: o script só o faz com --confirmo, e aí pergunta-se sempre à pessoa.
  // Só a pré-visualização escrita da forma normal passa sem pergunta; qualquer outra forma pergunta.
  const semTruques = c.replace(/[`'"^]/g, '');
  const preVer = /^\s*node(?:\.exe)?\s+["']?(?:\.[/\\])?scripts[/\\]shopify-publicar\.mjs["']?\s+["']?(publicar|esconder|apagar)["']?\s+["']?(?!-)[\w./\\:-]+["']?(?:\s+\d+)?\s*$/i;
  if (/shopify-publicar/i.test(semTruques) && !preVer.test(c)) {
    const accao = (semTruques.replace(/shopify-publicar/gi, '').match(/\b(publicar|esconder|apagar)\b/i) || [])[1]?.toLowerCase();
    avisos.push(accao === 'apagar' ? 'isto APAGA uma página ou um artigo da loja Shopify real, e a Shopify não tem reciclagem (fica uma cópia em copias/)'
      : accao === 'publicar' ? 'isto PUBLICA na loja Shopify real: passa a ser visível para quem visita a loja'
      : accao === 'esconder' ? 'isto ESCONDE na loja Shopify real uma página ou um artigo que está visível'
      : 'isto pode publicar, esconder ou apagar na loja Shopify real');
  }
  if (reais.length && grava) avisos.push(`isto grava no SITE REAL do cliente (${reais.join(', ')}). Fica em rascunho (na Shopify, escondido): quem visita não o vê, mas aparece no painel do cliente`);
  else if (reais.length && avisos.length) avisos.push(`atenção: o cliente está ligado ao SITE REAL (${reais.join(', ')})`);
  // O seccao.mjs e o titulos.mjs não estão no "ask" do settings.json, que ganharia ao "allow" do --listar e do --ver:
  // a pergunta ao gravar faz-se aqui, onde se distingue ler de gravar.
  if (grava && !reais.length && /\b(seccao|titulos)\.mjs\b/i.test(c)) avisos.push('isto grava uma cópia em rascunho no WordPress do cliente');
  if (avisos.length) perguntar(`${avisos.join('; ')}. Confirmar só se for mesmo isto que se quer.`);
  process.exit(0);
}

process.exit(0);
