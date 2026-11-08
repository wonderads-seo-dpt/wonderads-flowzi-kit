// Assina uma versão nova do kit e faz o zip para a release do GitHub. Só serve a quem tem a chave privada
// (a da WonderAds vive em ~/.wonderads-kit/chave-assinatura-privada.pem, fora do kit e fora do repositório).
// Corre-se num clone do repositório da equipa, nunca na pasta de trabalho com clientes.
// uso: node scripts/assinar.mjs [--chave "<ficheiro .pem>"] [--saida "<pasta>"]
//   1. escreve VERSAO (AAAA.MM.DD.HHMM-<commit>), MANIFESTO.json e ASSINATURA a partir dos ficheiros do git;
//   2. confirma a assinatura com o verificar() do próprio kit;
//   3. faz flowzi-wonderads-kit-<versão>.zip (pasta flowzi-wonderads-kit/ lá dentro) na pasta de saída.
import { createPrivateKey, sign } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { hash, lixo, soDoRepositorio, verificar, MANIFESTO, ASSINATURA } from './assinatura.mjs';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sair = (t) => { console.error(`\n  ${t}\n`); process.exit(1); };
const opcao = (nome, defeito) => { const i = process.argv.indexOf(nome); return i > -1 && process.argv[i + 1] ? resolve(process.argv[i + 1]) : defeito; };
const chave = opcao('--chave', join(homedir(), '.wonderads-kit', 'chave-assinatura-privada.pem'));
const saida = opcao('--saida', join(homedir(), 'Downloads'));

const git = (...a) => spawnSync('git', ['-C', raiz, ...a], { encoding: 'utf8' });
if (git('rev-parse', '--is-inside-work-tree').stdout.trim() !== 'true') sair('Isto corre-se num clone do repositório do kit (git clone), não na pasta de trabalho.');
if (existsSync(join(raiz, 'clientes')) || existsSync(join(raiz, '.cliente'))) sair('Esta pasta tem clientes. Assinar só num clone limpo do repositório.');
if (!existsSync(chave)) sair(`Não encontrei a chave privada em ${chave}.`);
if (git('status', '--porcelain').stdout.trim()) sair('Há alterações por gravar no git. Fazer o commit primeiro: a versão leva o número do commit.');

const assinaveis = (f) => f !== MANIFESTO && f !== ASSINATURA && f !== 'VERSAO' && !soDoRepositorio(f) && !lixo(f) && !f.startsWith('.github/');
const quando = new Date();
const dd = (n) => String(n).padStart(2, '0');
const versao = `${quando.getFullYear()}.${dd(quando.getMonth() + 1)}.${dd(quando.getDate())}.${dd(quando.getHours())}${dd(quando.getMinutes())}-${git('rev-parse', '--short=7', 'HEAD').stdout.trim()}`;
writeFileSync(join(raiz, 'VERSAO'), `${versao}\n`);

const ficheiros = {};
for (const f of [...git('ls-files').stdout.trim().split('\n').filter(assinaveis), 'VERSAO'].sort()) ficheiros[f] = hash(join(raiz, f));
const bruto = Buffer.from(`${JSON.stringify({ kit: 'flowzi-wonderads-kit', versao, ficheiros }, null, 2)}\n`, 'utf8');
writeFileSync(join(raiz, MANIFESTO), bruto);
writeFileSync(join(raiz, ASSINATURA), `${sign(null, bruto, createPrivateKey(readFileSync(chave))).toString('base64')}\n`);

// O zip leva só os ficheiros assinados e o manifesto, dentro de flowzi-wonderads-kit/.
const temp = mkdtempSync(join(tmpdir(), 'kit-assinar-'));
const pasta = join(temp, 'flowzi-wonderads-kit');
try {
  for (const f of [...Object.keys(ficheiros), MANIFESTO, ASSINATURA]) {
    mkdirSync(dirname(join(pasta, f)), { recursive: true });
    copyFileSync(join(raiz, f), join(pasta, f));
  }
  verificar(pasta);
  mkdirSync(saida, { recursive: true });
  const zip = join(saida, `flowzi-wonderads-kit-${versao}.zip`);
  rmSync(zip, { force: true });
  const tar = process.platform === 'win32' ? join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'zip';
  const r = process.platform === 'win32'
    ? spawnSync(tar, ['-a', '-c', '-f', zip, '-C', temp, 'flowzi-wonderads-kit'], { encoding: 'utf8' })
    : spawnSync('zip', ['-qr', zip, 'flowzi-wonderads-kit'], { cwd: temp, encoding: 'utf8' });
  if (r.status !== 0) sair(`Não consegui fazer o zip: ${(r.stderr || r.error?.message || '').trim()}`);
  console.log(`\n  Versão ${versao} assinada (${Object.keys(ficheiros).length} ficheiros).\n  Zip: ${zip}\n  Falta: commit de VERSAO, MANIFESTO.json e ASSINATURA, tag v${versao} e release com o zip.\n`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
