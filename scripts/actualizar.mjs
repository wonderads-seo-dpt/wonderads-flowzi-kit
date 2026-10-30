// Actualiza o kit a partir de uma versão nova (o zip da Flowzi ou a pasta já descompactada), sem tocar nos clientes.
// Substitui scripts/, treino/blueprint.json, CLAUDE.md, LEIA-ME.md, .claude/settings.json, a guarda e as skills do kit.
// Ficam como estão: clientes/, .cliente e as skills de cada cliente. Só instala versões assinadas pela Flowzi.
// uso: node scripts/actualizar.mjs                        procura o zip mais recente nas Transferências e diz o que traz
//      node scripts/actualizar.mjs --ver "<zip ou pasta>"  diz o que traz, sem mudar nada
//      node scripts/actualizar.mjs "<zip ou pasta>"        instala
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir, tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

// Calcula a pasta sozinho, sem depender de outros scripts, para funcionar mesmo a partir de uma versão antiga com erros.
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { verificar } = await import('./assinatura.mjs');
const versaoDe = (pasta) => { try { return readFileSync(join(pasta, 'VERSAO'), 'utf8').trim(); } catch { return ''; } };

// Cópia recursiva feita à mão: o fs.cpSync do Node 22 rebenta no Windows quando o caminho tem acentos (C:\\Users\\João).
// Só passam os ficheiros assinados: o que o Finder ou o Explorador deixam na pasta, ou qualquer coisa a mais, fica de fora.
let assinados = null;
function copiar(origem, destino, rel = '') {
  if (statSync(origem).isDirectory()) {
    mkdirSync(destino, { recursive: true });
    for (const nome of readdirSync(origem)) copiar(join(origem, nome), join(destino, nome), rel ? `${rel}/${nome}` : nome);
  } else if (!assinados || assinados.has(rel)) {
    copyFileSync(origem, destino);
  }
}

// Descompacta para uma pasta temporária com o tar do sistema (no Windows 10+ é o de System32, que lê zips).
let temporaria = '';
function descompactar(zip) {
  const destino = temporaria = mkdtempSync(join(tmpdir(), 'kit-novo-'));
  const tar = process.platform === 'win32' ? join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
  let r = spawnSync(tar, ['-xf', zip, '-C', destino], { encoding: 'utf8' });
  if (r.status !== 0 && process.platform !== 'win32') r = spawnSync('unzip', ['-q', zip, '-d', destino], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`Não consegui descompactar ${zip}: ${(r.stderr || r.error?.message || '').trim()}`);
  const dentro = join(destino, 'flowzi-wonderads-kit');
  return existsSync(join(dentro, 'scripts', 'clientes.mjs')) ? dentro : destino;
}
// O "Extrair tudo" do Windows deixa uma pasta dentro de outra com o mesmo nome: aceitar as duas.
const pastaDoKit = (p) => (existsSync(join(p, 'scripts', 'clientes.mjs')) || !existsSync(join(p, 'flowzi-wonderads-kit', 'scripts', 'clientes.mjs')) ? p : join(p, 'flowzi-wonderads-kit'));

// As Transferências, também quando o OneDrive as levou, e o Ambiente de trabalho.
function procurar() {
  const casa = homedir();
  // O OneDrive pessoal ou de empresa ("OneDrive - Empresa") pode ter levado o Ambiente de trabalho.
  const nuvens = [...new Set([join(casa, 'OneDrive'), process.env.OneDrive, process.env.OneDriveCommercial, process.env.OneDriveConsumer].filter(Boolean))];
  const pastas = [
    ...['Downloads', 'Transferências', 'Desktop', 'Ambiente de Trabalho'].map((p) => join(casa, p)),
    ...nuvens.flatMap((n) => ['Downloads', 'Desktop', 'Ambiente de Trabalho'].map((p) => join(n, p))),
  ].filter((p) => existsSync(p));
  const zips = pastas.flatMap((p) => readdirSync(p).filter((f) => /^flowzi-wonderads-kit.*\.zip$/i.test(f)).map((f) => join(p, f)));
  return zips.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
}

const opcoes = process.argv.slice(2).filter((a) => a.startsWith('--'));
const soVer = opcoes.includes('--ver');
const pedido = process.argv.slice(2).filter((a) => !a.startsWith('--')).join(' ').trim().replace(/^["']|["']$/g, '');
const actual = versaoDe(raiz) || 'sem número (anterior a 15/10/2026)';
let origem = pedido ? resolve(pedido) : procurar();
if (!origem || !existsSync(origem)) {
  console.error(pedido
    ? `\n  Não encontrei: ${origem}\n`
    : '\n  Não encontrei nenhum flowzi-wonderads-kit*.zip nas Transferências nem no Ambiente de trabalho.\n  Descarregar o zip que a Flowzi enviou e voltar a correr.\n');
  process.exit(1);
}

let novo;
let versao;
try {
  novo = statSync(origem).isDirectory() ? pastaDoKit(origem) : descompactar(origem);
  if (!existsSync(join(novo, 'scripts', 'clientes.mjs')) || resolve(novo) === raiz) throw new Error(`${origem} não é uma versão do kit.`);
  ({ versao, ficheiros: assinados } = verificar(novo));
} catch (e) {
  console.error(`\n  ${e.message}\n`);
  process.exit(1);
}

if ((!pedido || soVer) && versao === versaoDe(raiz)) {
  console.log(`\n  Encontrei: ${origem}\n  É a versão que já está instalada (${versao}). Nada a fazer.\n`);
  process.exit(0);
}
// O que muda desde a versão instalada, tirado do NOVIDADES.md do kit novo (uma secção "## AAAA.MM.DD" por versão).
function novidades() {
  let texto = '';
  try { texto = readFileSync(join(novo, 'NOVIDADES.md'), 'utf8'); } catch { return ''; }
  const desde = versaoDe(raiz).slice(0, 10);
  return texto.split(/^## /m).slice(1)
    // >= : duas versões no mesmo dia mostram as novidades desse dia (pode repetir alguma, nunca esconde).
    .filter((b) => /^\d{4}\.\d{2}\.\d{2}/.test(b) && (!desde || b.slice(0, 10) >= desde))
    .map((b) => b.split('\n').slice(1).filter((l) => l.trim()).map((l) => `  ${l}`).join('\n'))
    .join('\n');
}
if (!pedido || soVer) {
  const lista = novidades();
  console.log(`\n  Encontrei: ${origem}\n  Versão nova: ${versao} (assinada pela Flowzi)\n  Versão instalada: ${actual}\n${lista ? `\n  O que traz:\n${lista}\n` : ''}\n  Para instalar: node scripts/actualizar.mjs "${origem}"\n`);
  process.exit(0);
}
// Uma versão mais antiga do que a instalada só se instala de propósito.
if (versaoDe(raiz) && versao.split('-')[0] < versaoDe(raiz).split('-')[0] && !opcoes.includes('--mesmo-assim')) {
  console.error(`\n  A versão do zip (${versao}) é mais antiga do que a instalada (${actual}). Nada foi mudado.\n`);
  process.exit(1);
}

// Com o OneDrive ou o antivírus, um ficheiro pode estar preso uns segundos: tentar de novo antes de desistir.
const opc = { recursive: true, force: true, maxRetries: 10, retryDelay: 300 };
// Skills que já saíram do kit e se apagam numa instalação antiga.
for (const s of ['novo-cliente']) rmSync(`${raiz}/.claude/skills/${s}`, { recursive: true, force: true });
const skillsKit = [...new Set([...assinados].filter((f) => f.startsWith('.claude/skills/')).map((f) => f.split('/')[2]))];
// Copia por cima, sem apagar a pasta: no Windows, o Claude Code aberto vigia as skills e apagar e recriar pode falhar.
for (const s of skillsKit) {
  copiar(`${novo}/.claude/skills/${s}`, `${raiz}/.claude/skills/${s}`, `.claude/skills/${s}`);
}
// Copia primeiro e troca depois, para nunca ficar sem scripts/ se alguma coisa falhar a meio.
// No Windows, o antivírus ou o OneDrive prendem uma pasta acabada de copiar uns segundos: tentar de novo.
function mudarNome(de, para) {
  for (let i = 0; ; i++) {
    try { return renameSync(de, para); } catch (e) {
      if (i >= 20 || !['EPERM', 'EACCES', 'EBUSY'].includes(e.code)) throw e;
      spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},500)']);
    }
  }
}
try {
  rmSync(`${raiz}/scripts.novo`, opc);
  rmSync(`${raiz}/scripts.velho`, opc);
  copiar(`${novo}/scripts`, `${raiz}/scripts.novo`, 'scripts');
  mudarNome(`${raiz}/scripts`, `${raiz}/scripts.velho`);
  try {
    mudarNome(`${raiz}/scripts.novo`, `${raiz}/scripts`);
  } catch (e) {
    mudarNome(`${raiz}/scripts.velho`, `${raiz}/scripts`);
    throw e;
  }
} catch (e) {
  console.error(`\n  A actualização parou a meio (${e.code || e.message}): os scripts ficaram como estavam.\n  Fechar outros terminais abertos na pasta scripts e voltar a correr o mesmo comando.\n`);
  process.exit(1);
}
// A pasta antiga sai quando puder; se um terminal a prender, fica para a próxima actualização.
try { rmSync(`${raiz}/scripts.velho`, { ...opc, maxRetries: 3 }); } catch {}
for (const f of ['CLAUDE.md', 'LEIA-ME.md', 'NOVIDADES.md', '.claude/settings.json', '.claude/hooks', 'treino/blueprint.json', '.gitignore', 'VERSAO']) {
  if (existsSync(`${novo}/${f}`)) copiar(`${novo}/${f}`, `${raiz}/${f}`, f);
}
if (temporaria) { try { rmSync(temporaria, { ...opc, maxRetries: 2 }); } catch {} }
console.log(`\n  Kit actualizado: ${actual} → ${versao}. ${skillsKit.length} skills, scripts e regras da agência.\n  Os clientes ficaram como estavam. Sair do Claude (/exit) e voltar a entrar.\n`);
