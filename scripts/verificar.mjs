// Confirma que este computador está pronto para o kit e diz, para cada problema, o que fazer.
// Não muda nada, excepto com --corrigir: aí só aponta o Claude Code para o Git Bash (Windows).
// uso: node scripts/verificar.mjs
//      node scripts/verificar.mjs --corrigir
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, statfsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { connect } from 'node:net';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const windows = process.platform === 'win32';
const corrigir = process.argv.includes('--corrigir');
const problemas = [];
const linha = (estado, nome, texto) => console.log(`  ${estado.padEnd(9)} ${nome.padEnd(14)} ${texto}`);
const ok = (nome, texto) => linha('ok', nome, texto);
const aviso = (nome, texto) => linha('aviso', nome, texto);
const problema = (nome, texto) => { linha('PROBLEMA', nome, texto); problemas.push(nome); };

console.log('\n  Verificação do computador\n');

// Node
const [maior] = process.versions.node.split('.').map(Number);
if (maior >= 22) ok('Node.js', `v${process.versions.node}`);
else problema('Node.js', `v${process.versions.node} é antigo. Instalar a versão LTS em https://nodejs.org e fechar o VS Code por completo antes de voltar a abrir.`);

const npx = spawnSync(windows ? 'npx.cmd --version' : 'npx --version', { shell: true, encoding: 'utf8', timeout: 60000 });
if (npx.status === 0) ok('npx', npx.stdout.trim());
else problema('npx', 'não arranca. Reinstalar o Node.js (https://nodejs.org, versão LTS) e fechar o VS Code por completo.');

// A pasta
if (/onedrive/i.test(raiz)) problema('Pasta', `está no OneDrive (${raiz}). Fechar o VS Code, mover a pasta para C:\\Users\\<nome> e abri-la de lá.`);
else if (/[\\/]Temp\d*_[^\\/]*\.zip[\\/]|\.zip[\\/]/i.test(raiz)) problema('Pasta', 'parece aberta de dentro do zip, sem extrair. Botão direito no zip → Extrair tudo → pasta do utilizador, e abrir a pasta extraída.');
else ok('Pasta', raiz);
try {
  const teste = join(raiz, 'treino', '.escrita');
  writeFileSync(teste, 'x');
  rmSync(teste);
  ok('Escrita', 'a pasta aceita ficheiros novos');
} catch (e) {
  problema('Escrita', `não consigo escrever na pasta (${e.code}). Mover a pasta para C:\\Users\\<nome>; se um antivírus a estiver a bloquear, pedir a quem gere os computadores.`);
}
try {
  const d = statfsSync(raiz);
  const livres = (d.bavail * d.bsize) / 1e9;
  if (livres < 2) problema('Disco', `só ${livres.toFixed(1)} GB livres. O treino precisa de uns 2 GB.`);
  else ok('Disco', `${livres.toFixed(0)} GB livres`);
} catch {}

// O terminal do Claude no Windows: Git Bash, ou PowerShell quando não há Git.
if (windows) {
  const ficheiro = join(homedir(), '.claude', 'settings.json');
  let definicoes = {};
  let definicoesOk = true;
  if (existsSync(ficheiro)) {
    const texto = readFileSync(ficheiro, 'utf8').replace(/^\uFEFF/, '');
    if (texto.trim()) { try { definicoes = JSON.parse(texto); } catch { definicoesOk = false; } }
  }
  const configurado = definicoes.env?.CLAUDE_CODE_GIT_BASH_PATH;
  const pf = process.env.ProgramFiles || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const habituais = [join(pf, 'Git', 'bin', 'bash.exe'), join(pf86, 'Git', 'bin', 'bash.exe')];
  // O Claude Code também deduz o bash a partir do git que está no PATH (…\Git\cmd\git.exe → …\Git\bin\bash.exe).
  const gits = (spawnSync('where', ['git'], { encoding: 'utf8' }).stdout || '').split(/\r?\n/).filter(Boolean);
  const doPath = gits.map((g) => join(dirname(dirname(g)), 'bin', 'bash.exe'));
  const outros = [
    join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'bin', 'bash.exe'),
    join(homedir(), 'scoop', 'apps', 'git', 'current', 'bin', 'bash.exe'),
    'D:\\Git\\bin\\bash.exe', 'D:\\Program Files\\Git\\bin\\bash.exe',
  ];
  const achaClaude = [...habituais, ...doPath].find((b) => existsSync(b));
  const bash = [...habituais, ...doPath, ...outros].find((b) => existsSync(b));
  if (configurado && existsSync(configurado)) ok('Git Bash', `configurado: ${configurado}`);
  else if (configurado) problema('Git Bash', `o Claude Code está apontado para ${configurado}, que já não existe.${bash ? ' Correr: node scripts/verificar.mjs --corrigir' : ' Instalar o Git (LEIA-ME, passo 1).'}`);
  else if (achaClaude) ok('Git Bash', achaClaude);
  else if (bash) problema('Git Bash', `o Git está em ${dirname(dirname(bash))}, onde o Claude Code não o procura. Correr: node scripts/verificar.mjs --corrigir`);
  else aviso('Git', 'não instalado. O Claude usa o PowerShell e funciona; o recomendado é instalar o Git (LEIA-ME, passo 1).');

  if (corrigir) {
    if (!bash) console.log('\n  Não encontrei o Git neste computador. Instalar o Git para Windows (LEIA-ME, passo 1).');
    else if (!definicoesOk) console.log(`\n  O ficheiro ${ficheiro} tem um erro e não lhe mexi. Enviar este texto à Flowzi.`);
    else {
      definicoes.env = { ...(definicoes.env || {}), CLAUDE_CODE_GIT_BASH_PATH: bash };
      mkdirSync(dirname(ficheiro), { recursive: true });
      writeFileSync(ficheiro, JSON.stringify(definicoes, null, 2) + '\n');
      console.log(`\n  Feito: o Claude Code passa a usar ${bash}. Fechar o VS Code por completo, voltar a abrir esta pasta, escrever claude e depois /comecar.`);
    }
  }

  const claudes = (spawnSync('where', ['claude'], { encoding: 'utf8' }).stdout || '').split(/\r?\n/).filter(Boolean);
  if (claudes.some((c) => /npm/i.test(c))) problema('Claude Code', 'instalado pelo npm, o que dá o erro 193. Ver o erro 4 no LEIA-ME (desinstalar o do npm e instalar com o comando do PowerShell).');
} else if (corrigir) {
  console.log('\n  --corrigir só serve no Windows. Neste computador não há nada a corrigir por aqui.');
}

// A porta do treino
const ocupada = await new Promise((r) => {
  const c = connect(9400, '127.0.0.1');
  c.on('connect', () => { c.destroy(); r(true); });
  c.on('error', () => r(false));
});
if (!ocupada) ok('Porta 9400', 'livre para o treino');
else {
  const nosso = await fetch('http://127.0.0.1:9400/wp-json/flowzi-treino/v1/credenciais', { signal: AbortSignal.timeout(5000) }).then((r) => r.ok).catch(() => false);
  if (nosso) ok('Porta 9400', 'o WordPress de treino já está a correr');
  else if (existsSync(join(raiz, 'treino', '.pid'))) aviso('Porta 9400', 'o WordPress de treino está a arrancar ou ficou preso. Se o /comecar não avançar, correr node scripts/treino.mjs --parar e tentar outra vez.');
  else problema('Porta 9400', 'ocupada por outro programa. Reiniciar o computador; se continuar, enviar à Flowzi.');
}

// A internet: a primeira vez, o treino descarrega o WordPress e o Elementor.
const internet = async (url) => {
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
    return r.status < 500 ? '' : `respondeu ${r.status}`;
  } catch (e) {
    const c = `${e.cause?.code || ''} ${e.cause?.message || e.message || ''}`;
    if (/CERT|SSL|TLS|SELF_SIGNED|ISSUER/i.test(c)) return 'certificado';
    return c.trim() || 'sem resposta';
  }
};
const falhas = [];
for (const url of ['https://registry.npmjs.org/@wp-playground%2fcli', 'https://downloads.wordpress.org/plugin/elementor.latest-stable.zip']) {
  const f = await internet(url);
  if (f) falhas.push(f);
}
if (!falhas.length) ok('Internet', 'chega ao npm e ao wordpress.org');
else if (falhas.includes('certificado')) {
  // Se os certificados do Windows resolverem (antivírus que inspecciona o https), basta o Node passar a usá-los.
  const comSistema = spawnSync(process.execPath, ['--use-system-ca', '-e', "fetch('https://registry.npmjs.org/',{method:'HEAD'}).then(()=>process.exit(0),()=>process.exit(1))"], { timeout: 20000 });
  if (comSistema.status === 0) problema('Internet', 'um antivírus ou a rede está a inspeccionar o https. Num PowerShell, correr setx NODE_OPTIONS --use-system-ca, fechar o VS Code por completo, voltar a abrir e correr esta verificação outra vez.');
  else problema('Internet', 'a ligação segura está a ser interceptada (antivírus ou rede da empresa). Testar no hotspot do telemóvel; se aí funcionar, pedir a quem gere a rede para deixar passar registry.npmjs.org e wordpress.org.');
}
else problema('Internet', `não chego ao npm ou ao wordpress.org (${falhas[0]}). Confirmar a internet; numa rede da empresa, testar no hotspot do telemóvel.`);

console.log(problemas.length
  ? `\n  ${problemas.length === 1 ? '1 problema' : `${problemas.length} problemas`} a resolver: ${problemas.join(', ')}. Resolver pela ordem e voltar a correr node scripts/verificar.mjs.\n`
  : '\n  Tudo pronto.\n');
process.exit(0);
