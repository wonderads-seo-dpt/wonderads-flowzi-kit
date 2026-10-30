// Actualiza o kit a partir de uma versão nova (do GitHub da equipa, o zip da Flowzi ou a pasta já descompactada),
// sem tocar nos clientes. Substitui scripts/, treino/blueprint.json, CLAUDE.md, LEIA-ME.md, .claude/settings.json,
// a guarda e as skills do kit. Ficam como estão: clientes/, .cliente e as skills de cada cliente.
// Só instala versões assinadas pela Flowzi, venham de onde vierem. Para actualizar não é preciso o git.
// uso: node scripts/actualizar.mjs                        vê a última versão no GitHub (o zip vai para as Transferências);
//                                                         sem acesso, procura o zip mais recente nas Transferências. Diz o que traz
//      node scripts/actualizar.mjs --ver "<zip, pasta ou link do GitHub>"  diz o que traz, sem mudar nada
//      node scripts/actualizar.mjs "<zip ou pasta>"        instala
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir, tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

// Calcula a pasta sozinho, sem depender de outros scripts, para funcionar mesmo a partir de uma versão antiga com erros.
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { verificar, lixo } = await import('./assinatura.mjs');
// O GitHub é um extra: se este módulo falhar, a actualização pelo zip nas Transferências continua igual.
const repo = await import('./repositorio.mjs').catch(() => null);
const versaoDe = (pasta) => { try { return readFileSync(join(pasta, 'VERSAO'), 'utf8').trim(); } catch { return ''; } };
const manifestoInstalado = () => { try { return JSON.parse(readFileSync(join(raiz, 'MANIFESTO.json'), 'utf8')); } catch { return {}; } };
const versaoDoManifesto = () => manifestoInstalado().versao || '';
const maisAntiga = (v, de) => Boolean(de) && v !== de && v.split('-')[0] < de.split('-')[0];

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
  if (r.status !== 0) {
    throw Object.assign(new Error(`Não consegui descompactar ${zip}: ${(r.stderr || r.error?.message || '').trim()}`),
      { curto: `${zip}: não se consegue descompactar (o zip está estragado ou incompleto)` });
  }
  const dentro = join(destino, 'flowzi-wonderads-kit');
  if (existsSync(join(dentro, 'scripts', 'clientes.mjs'))) return dentro;
  // O "Source code (zip)" de uma release do GitHub traz uma pasta com outro nome (wonderads-kit-v...).
  const pastas = readdirSync(destino).filter((n) => existsSync(join(destino, n, 'scripts', 'clientes.mjs')));
  return pastas.length === 1 ? join(destino, pastas[0]) : destino;
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
  const zips = pastas.flatMap((p) => readdirSync(p).filter((f) => /^(flowzi-)?wonderads-kit.*\.zip$/i.test(f)).map((f) => join(p, f)));
  return zips.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
}
// Confirma uma versão (zip ou pasta) e devolve { novo, versao, ficheiros }. O erro diz sempre de que caminho é, e o
// .curto cabe numa linha, para a lista dos zips saltados.
function abrir(caminho) {
  temporaria = '';
  try {
    const pasta = statSync(caminho).isDirectory() ? pastaDoKit(caminho) : descompactar(caminho);
    if (!existsSync(join(pasta, 'scripts', 'clientes.mjs')) || resolve(pasta) === raiz) throw new Error('não é uma versão do kit.');
    return { novo: pasta, ...verificar(pasta) };
  } catch (e) {
    if (temporaria) { try { rmSync(temporaria, { recursive: true, force: true }); } catch {} temporaria = ''; }
    const texto = e.message.includes(caminho) ? e.message : `${caminho}: ${e.message}`;
    throw Object.assign(new Error(texto), { curto: e.curto || texto });
  }
}

const opcoes = process.argv.slice(2).filter((a) => a.startsWith('--'));
const pedido = process.argv.slice(2).filter((a) => !a.startsWith('--')).join(' ').trim().replace(/^["']|["']$/g, '');
const instalada = versaoDe(raiz);
const actual = instalada || 'sem número (anterior a 15/10/2026)';
// Um link do GitHub só serve para ver: instala-se depois pelo caminho do zip, como os outros.
const link = /^https?:\/\//i.test(pedido) ? pedido : '';
const soVer = opcoes.includes('--ver') || Boolean(link);
const mostrar = !pedido || soVer;
const sair = (texto, codigo = 1) => { (codigo ? console.error : console.log)(`\n  ${texto}\n`); process.exit(codigo); };
// Porque é que o gh não chegou à release: a conta activa decide, não o gh auth status (sai com 1 se outra conta falhar).
function semAcesso() {
  const s = repo.sessao();
  return s.login ? `a conta ${s.login} do gh não tem acesso ao repositório do kit`
    : s.nao === 'sem-gh' ? 'este computador não tem o gh (GitHub CLI)'
    : s.nao === 'sem-resposta' ? 'o gh não respondeu a tempo'
    : 'o gh deste computador não tem sessão iniciada';
}
const comoDescarregar = repo ? `abrir ${repo.RELEASES} no browser, descarregar o flowzi-wonderads-kit-<versão>.zip da versão mais recente (em Assets) para as Transferências e voltar a correr` : '';

// Traz do GitHub a release (a última, ou a de uma tag) para as Transferências, se for mais recente do que a instalada.
// Sem rede ou sem acesso, devolve só o estado: a procura nas Transferências continua como sempre.
let descarregado = '';
async function doGitHub(tag) {
  const rel = await repo.release(tag);
  if (rel.falha) return { estado: rel.falha };
  // Em dia, mas sem o manifesto da versão instalada: traz-se o mesmo zip só para o gravar (ver abaixo).
  const semManifesto = rel.versao === instalada && versaoDoManifesto() !== instalada;
  if (!tag && !repo.maisRecente(rel.versao, instalada) && !semManifesto) return { estado: 'em-dia', versao: rel.versao };
  if (!rel.anexo) return { estado: 'falhou', versao: rel.versao, erro: 'a release não tem o zip do kit' };
  const destino = join(repo.transferencias(), rel.anexo.nome);
  const parcial = join(tmpdir(), `kit-${process.pid}-${rel.anexo.nome}`);
  try {
    await repo.descarregar(rel, parcial);
    // Copia com outro nome e troca no fim: a procura nunca apanha um zip a meio.
    copyFileSync(parcial, `${destino}.parcial`);
    renameSync(`${destino}.parcial`, destino);
  } catch (e) {
    return { estado: 'falhou', versao: rel.versao, erro: e.message };
  } finally {
    rmSync(parcial, { force: true });
    rmSync(`${destino}.parcial`, { force: true });
  }
  descarregado = destino;
  return { estado: 'nova', versao: rel.versao, zip: destino };
}

let github = null;
if (link) {
  const m = link.match(/^https?:\/\/(?:www\.)?github\.com\/([^/?#]+\/[^/?#]+?)(?:\.git)?(?:[/?#]|$)/i);
  if (!repo || !m || m[1].toLowerCase() !== repo.REPOSITORIO.toLowerCase()) {
    sair(`Só se aceitam links do repositório do kit${repo ? ` (${repo.PAGINA})` : ''}. Nada foi mudado.`);
  }
  const tag = decodeURIComponent((link.match(/\/releases\/(?:tag|download)\/([^/?#]+)/i) || [])[1] || '');
  github = await doGitHub(tag);
  if (!github.zip) {
    sair(github.estado === 'em-dia' ? `A versão mais recente no GitHub (${github.versao}) é a que já está instalada. Nada a fazer.`
      : github.estado === 'sem-rede' ? 'Não consegui chegar ao GitHub (sem rede?). Tentar outra vez daqui a pouco.'
      : github.estado === 'falhou' ? `Não consegui descarregar a versão ${github.versao} (${github.erro}). Para a trazer à mão: ${comoDescarregar} /actualizar.`
      : `Não consegui abrir esse link (${semAcesso()}). Para o trazer à mão: ${comoDescarregar} /actualizar.`, github.estado === 'em-dia' ? 0 : 1);
  }
} else if (!pedido && repo) {
  github = await doGitHub('');
  if (github.estado === 'falhou') console.log(`\n  Há uma versão ${github.versao} no GitHub, mas não a consegui descarregar (${github.erro}). Procuro nas Transferências.`);
}

// Nada de novo: diz porquê, conforme o que o GitHub respondeu.
function semVersaoNova() {
  if (github?.estado === 'em-dia') sair(`O kit está em dia: a versão mais recente no GitHub é ${github.versao} e a instalada é ${actual}. Nada a fazer.`, 0);
  if (github?.estado === 'sem-acesso') {
    sair(`Não consegui ver as versões no GitHub (${semAcesso()}).\n  Para ver se há versão nova: ${comoDescarregar} /actualizar.`);
  }
  sair(`Não encontrei nenhum flowzi-wonderads-kit*.zip mais recente do que o instalado (${actual}) nas Transferências nem no Ambiente de trabalho.\n  Descarregar o zip que a Flowzi enviou${repo ? ` (ou a última versão em ${repo.RELEASES})` : ''} e voltar a correr.`);
}

let origem = pedido && !link ? resolve(pedido) : github?.zip || '';
let novo;
let versao;
if (origem) {
  if (!existsSync(origem)) sair(`Não encontrei: ${origem}`);
  try {
    ({ novo, versao, ficheiros: assinados } = abrir(origem));
  } catch (e) {
    // O que veio do GitHub e não passou não fica nas Transferências, para a procura seguinte não o voltar a apanhar.
    if (origem === descarregado) rmSync(descarregado, { force: true });
    sair(e.message);
  }
} else {
  // Do mais recente para o mais antigo: um zip estragado ou por assinar não esconde um bom que esteja ao lado.
  // Um zip antigo esquecido nas Transferências não é uma versão nova e passa-se à frente sem dizer nada.
  const saltados = [];
  for (const c of procurar()) {
    let v;
    try { v = abrir(c); } catch (e) { saltados.push(e.curto); continue; }
    if (maisAntiga(v.versao, instalada)) { if (temporaria) rmSync(temporaria, { recursive: true, force: true }); continue; }
    ({ novo, versao, ficheiros: assinados } = v);
    origem = c;
    break;
  }
  if (saltados.length) console.log(`\n  Saltei ${saltados.length > 1 ? 'estes zips, que não passaram' : 'este zip, que não passou'} a verificação:\n${saltados.map((m) => `    ${m}`).join('\n')}`);
  if (!origem) semVersaoNova();
}
if (temporaria && mostrar) process.on('exit', () => { try { rmSync(temporaria, { recursive: true, force: true }); } catch {} });
if (mostrar && versao === instalada) {
  // Os kits actualizados antes de 27/10/2026 não têm o manifesto da versão instalada, de que o /contribuir precisa.
  if (versaoDoManifesto() !== versao) for (const f of ['MANIFESTO.json', 'ASSINATURA']) copyFileSync(join(novo, f), join(raiz, f));
  const semGitHub = github?.estado === 'sem-acesso' ? `\n  Não consegui ver o GitHub. Para confirmar que não há outra mais recente: ${comoDescarregar} /actualizar.` : '';
  console.log(`\n  Encontrei: ${origem}\n  É a versão que já está instalada (${versao}). Nada a fazer.${semGitHub}\n`);
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
// Os scripts que se perdiam ao trocar a pasta: os que não vêm na versão nova e que o manifesto instalado não diz serem
// do kit. Sem o manifesto da versão instalada (um kit actualizado por um /actualizar antigo) não se sabe quais são
// da pessoa, e guardam-se todos os que não vêm na nova.
function aGuardar() {
  const m = manifestoInstalado();
  const doKit = m.versao && m.versao === instalada ? m.ficheiros || {} : {};
  const listar = (rel) => readdirSync(join(raiz, rel)).flatMap((n) => {
    const r = `${rel}/${n}`;
    return statSync(join(raiz, r)).isDirectory() ? listar(r) : lixo(r) ? [] : [r];
  });
  try { return listar('scripts').filter((f) => !assinados.has(f) && !Object.hasOwn(doKit, f)); } catch { return []; }
}
const dd = (n) => String(n).padStart(2, '0');
const quando = new Date();
const copias = `copias-do-kit/${quando.getFullYear()}-${dd(quando.getMonth() + 1)}-${dd(quando.getDate())}-${dd(quando.getHours())}${dd(quando.getMinutes())}`;

const antiga = maisAntiga(versao, instalada);
if ((!pedido || soVer) && antiga) {
  console.log(`\n  ${origem === descarregado ? 'Descarregado do GitHub para as Transferências' : 'Encontrei'}: ${origem}\n  É uma versão mais antiga (${versao}) do que a instalada (${actual}). Nada a fazer.\n`);
  process.exit(0);
}
if (!pedido || soVer) {
  const lista = novidades();
  const guardar = aGuardar();
  const nota = guardar.length ? `\n  Não vêm na versão nova e ficam guardados em ${copias}/ ao instalar:\n${guardar.map((f) => `    ${f}`).join('\n')}\n` : '';
  console.log(`\n  ${origem === descarregado ? 'Descarregado do GitHub para as Transferências' : 'Encontrei'}: ${origem}\n  Versão nova: ${versao} (assinada pela Flowzi)\n  Versão instalada: ${actual}\n${lista ? `\n  O que traz:\n${lista}\n` : ''}${nota}\n  Para instalar: node scripts/actualizar.mjs "${origem}"\n`);
  process.exit(0);
}
// Uma versão mais antiga do que a instalada só se instala de propósito.
if (antiga && !opcoes.includes('--mesmo-assim')) {
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
const guardados = aGuardar();
try {
  for (const f of guardados) {
    mkdirSync(dirname(join(raiz, copias, f)), { recursive: true });
    copyFileSync(join(raiz, f), join(raiz, copias, f));
  }
} catch (e) {
  console.error(`\n  Não consegui guardar os scripts que não vêm na versão nova (${e.code || e.message}). Nada foi mudado.\n`);
  process.exit(1);
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
// O manifesto diz ao kit instalado de que versão parte: o /contribuir compara com ele o que a pessoa mudou.
for (const f of ['MANIFESTO.json', 'ASSINATURA']) copyFileSync(`${novo}/${f}`, `${raiz}/${f}`);
if (temporaria) { try { rmSync(temporaria, { ...opc, maxRetries: 2 }); } catch {} }
console.log(`\n  Kit actualizado: ${actual} → ${versao}. ${skillsKit.length} skills, scripts e regras da agência.\n  Os clientes ficaram como estavam. Sair do Claude (/exit) e voltar a entrar.\n`);
if (guardados.length) console.log(`  Estes scripts não vinham na versão nova e ficaram guardados em ${join(raiz, copias)}:\n${guardados.map((f) => `    ${f}`).join('\n')}\n  Para os usar outra vez, voltam para scripts/; para ficarem para todos, /contribuir.\n`);
