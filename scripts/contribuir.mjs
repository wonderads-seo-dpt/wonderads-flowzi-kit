// Propor uma melhoria ao kit: o que a pessoa mudou ou criou (um script, uma skill, uma regra) vai para a Flowzi, que
// revê, testa em Windows e em Mac, assina e publica para todos. Nunca leva .env, passwords nem nada de clientes/.
// uso: node scripts/contribuir.mjs                                       o que mudou desde a versão instalada (só lê)
//      node scripts/contribuir.mjs --zip "<assunto>" <ficheiros ou pastas>  faz o zip da proposta nas Transferências,
//                                                                         com o PROPOSTA.md da raiz do kit
//      node scripts/contribuir.mjs --pr "<zip da proposta>"              abre um Pull Request no GitHub da equipa
//                                                                         (só depois de a pessoa dizer que sim)
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { hash } from './assinatura.mjs';
import * as repo from './repositorio.mjs';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const sair = (texto, codigo = 1) => { (codigo ? console.error : console.log)(`\n  ${texto}\n`); process.exit(codigo); };
const valor = (flag) => { const i = args.indexOf(flag); return i < 0 ? null : (args[i + 1] || ''); };
const temporarias = [];
process.on('exit', () => { for (const t of temporarias) { try { rmSync(t, { recursive: true, force: true, maxRetries: 3 }); } catch {} } });
const temporaria = (prefixo) => { const t = mkdtempSync(join(tmpdir(), prefixo)); temporarias.push(t); return t; };

const dd = (n) => String(n).padStart(2, '0');
const agora = new Date();
const hoje = `${agora.getFullYear()}-${dd(agora.getMonth() + 1)}-${dd(agora.getDate())}`;
const curto = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+/, '').slice(0, 40).replace(/-+$/, '') || 'proposta';
const ENVIAR = 'por WhatsApp ou por email';
const linkIssue = (assunto) => `${repo.PAGINA}/issues/new?template=proposta.md&title=${encodeURIComponent(`Proposta: ${assunto}`.trim())}`;

function manifesto() {
  let m;
  try { m = JSON.parse(readFileSync(join(raiz, 'MANIFESTO.json'), 'utf8')); } catch {
    sair('Falta o MANIFESTO.json, que diz de que versão parte este kit (os kits actualizados antes de 27/10/2026 não o têm).\n'
      + '  Correr /actualizar: traz a versão nova ou, se o kit já estiver em dia, grava o manifesto da versão instalada. Depois, /contribuir outra vez.');
  }
  let versao = '';
  try { versao = readFileSync(join(raiz, 'VERSAO'), 'utf8').trim(); } catch {}
  if (m.versao !== versao) sair(`O MANIFESTO.json é da versão ${m.versao} e o kit está na ${versao || 'sem número'}. Correr /actualizar para os acertar e depois /contribuir outra vez.`);
  return m;
}

// Uma skill de cliente chama-se <cliente>-<tarefa> (ver /criar-skill) e tem a marca e o texto dele.
const clientes = (() => { try { return readdirSync(join(raiz, 'clientes')).filter((n) => statSync(join(raiz, 'clientes', n)).isDirectory()); } catch { return []; } })();
const skillDeCliente = (f) => {
  const s = (f.match(/^\.claude\/skills\/([^/]+)\//) || [])[1];
  return (s && clientes.find((c) => s.startsWith(`${c}-`))) || '';
};
const motivo = (f, caminho) => {
  const c = skillDeCliente(f);
  return c ? `é uma skill do cliente ${c}: para a propor, fazer com o Claude uma versão geral, com outro nome e sem nada do cliente` : repo.recusa(f, caminho);
};

// Com o gh e sessão de alguém que pode escrever no repositório, a proposta vai como Pull Request; senão, por uma Issue.
function podePR() {
  if (spawnSync('git', ['--version'], { windowsHide: true }).status !== 0) return { nao: 'este computador não tem o Git' };
  const s = repo.sessao();
  if (s.nao === 'sem-gh') return { nao: 'este computador não tem o gh (GitHub CLI)' };
  if (s.nao === 'sem-resposta') return { nao: 'o gh não respondeu a tempo' };
  if (s.nao) return { nao: 'o gh não tem sessão iniciada' };
  if (repo.gh(['api', `repos/${repo.REPOSITORIO}`, '--jq', '.permissions.push'], { timeout: 8000 }).saida !== 'true') {
    return { nao: `a conta ${s.login} do GitHub não pode propor alterações no repositório` };
  }
  return { login: s.login };
}

const zipPedido = valor('--zip');
const prPedido = valor('--pr');

if (zipPedido === null && prPedido === null) {
  const m = manifesto();
  const doKit = Object.keys(m.ficheiros || {});
  const alterados = doKit.filter((f) => existsSync(join(raiz, f)) && hash(join(raiz, f)) !== m.ficheiros[f]);
  const apagados = doKit.filter((f) => !existsSync(join(raiz, f)));
  const novos = ['scripts', '.claude/skills'].flatMap((p) => (existsSync(join(raiz, p)) ? repo.ficheirosEm(raiz, p) : []))
    .filter((f) => !Object.hasOwn(m.ficheiros, f));
  if (!alterados.length && !apagados.length && !novos.length) {
    sair(`Nada mudou no kit desde a versão instalada (${m.versao}).\n  Uma ideia sem ficheiros também se propõe: escrevê-la ao técnico da equipa (${ENVIAR}) ou, com conta no GitHub, numa Issue: ${linkIssue('')}`, 0);
  }
  const linha = (tipo, f, nota) => `    ${tipo.padEnd(9)} ${f}${nota ? `   (${nota})` : ''}`;
  console.log(`\n  Kit na versão ${m.versao}. O que mudou desde então:\n`);
  for (const f of alterados) console.log(linha('alterado', f, motivo(f, join(raiz, f))));
  for (const f of novos) console.log(linha('novo', f, motivo(f, join(raiz, f))));
  for (const f of apagados) console.log(linha('apagado', f, 'não vai no zip: se for para apagar, dizer na PROPOSTA.md'));
  console.log('\n  Para propor: escrever com a pessoa o PROPOSTA.md na raiz do kit (o quê, porquê, como testar) e correr'
    + '\n  node scripts/contribuir.mjs --zip "<assunto>" <ficheiros ou pastas>\n');
  process.exit(0);
}

if (zipPedido !== null) {
  if (!zipPedido.trim() || zipPedido.startsWith('--')) sair('uso: node scripts/contribuir.mjs --zip "<assunto>" <ficheiros ou pastas>');
  const assunto = zipPedido.trim();
  const m = manifesto();
  const ficha = resolve(raiz, (valor('--proposta') || 'PROPOSTA.md').replace(/\\/g, '/'));
  const pedidos = args.filter((a, i) => !a.startsWith('--') && !['--zip', '--proposta'].includes(args[i - 1]));
  if (!pedidos.length) sair('Faltam os ficheiros a propor: node scripts/contribuir.mjs --zip "<assunto>" <ficheiros ou pastas>');

  const ficheiros = new Set();
  const recusados = [];
  for (const p of pedidos) {
    const caminho = resolve(raiz, p.replace(/\\/g, '/'));
    const rel = relative(raiz, caminho).split(sep).join('/');
    if (!rel || rel.startsWith('..') || isAbsolute(rel)) recusados.push([p, 'fica fora do kit']);
    else if (existsSync(caminho) && statSync(caminho).isDirectory()) for (const f of repo.ficheirosEm(raiz, rel)) ficheiros.add(f);
    else ficheiros.add(rel);
  }
  const iguais = [];
  for (const f of ficheiros) {
    const r = motivo(f, join(raiz, f));
    if (r) recusados.push([f, r]);
    else if (m.ficheiros[f] && hash(join(raiz, f)) === m.ficheiros[f]) iguais.push(f);
  }
  let texto = '';
  if (!existsSync(ficha)) recusados.push(['PROPOSTA.md', 'não existe: escrever primeiro, com a pessoa, o quê, porquê e como testar']);
  else {
    texto = readFileSync(ficha, 'utf8').replace(/^\uFEFF/, '');
    const s = repo.segredo(texto);
    if (s) recusados.push(['PROPOSTA.md', `tem o que parece ${s}`]);
    else if (texto.trim().length < 40) recusados.push(['PROPOSTA.md', 'está quase vazio: dizer o quê, porquê e como testar']);
  }
  if (recusados.length) {
    const segredos = recusados.some(([, r]) => r.startsWith('tem o que parece'));
    sair(`Não fiz a proposta. Nada foi enviado:\n${recusados.map(([f, r]) => `    ${f}: ${r}`).join('\n')}`
      + (segredos ? '\n\n  Uma password ou chave sai do ficheiro (o script lê-a do .env, como os do kit) e só depois se propõe.' : ''));
  }
  const vao = [...ficheiros].filter((f) => !iguais.includes(f)).sort();
  if (!vao.length) sair('Os ficheiros indicados estão iguais aos da versão instalada: não há nada para propor.');

  const nome = `proposta-kit-${hoje}-${curto(assunto)}`;
  const base = temporaria('proposta-');
  const pasta = join(base, nome);
  for (const f of vao) {
    mkdirSync(dirname(join(pasta, f)), { recursive: true });
    copyFileSync(join(raiz, f), join(pasta, f));
  }
  const lista = vao.map((f) => `- \`${f}\` (${m.ficheiros[f] ? 'alterado' : 'novo'})`).join('\n');
  writeFileSync(join(pasta, 'PROPOSTA.md'), `${texto.trimEnd()}\n\n---\nAssunto: ${assunto}\nVersão do kit de onde parte: \`${m.versao}\`\nFicheiros:\n${lista}\n`);
  const zip = join(repo.transferencias(), `${nome}.zip`);
  try { repo.zipar(base, nome, zip); } catch (e) { sair(e.message); }
  // O PROPOSTA.md foi para dentro do zip; na raiz do kit só ficava a baralhar a proposta seguinte.
  if (ficha === join(raiz, 'PROPOSTA.md')) rmSync(ficha, { force: true });

  console.log(`\n  Proposta pronta: ${zip}\n  Leva o PROPOSTA.md e ${vao.length} ficheiro${vao.length > 1 ? 's' : ''}:\n${vao.map((f) => `    ${f}`).join('\n')}`);
  if (iguais.length) console.log(`  Ficaram de fora, por estarem iguais aos da versão instalada: ${iguais.join(', ')}`);
  const pode = podePR();
  if (pode.nao) {
    console.log(`\n  Para enviar (${pode.nao}, por isso não vai como Pull Request):\n  mandar o zip ao técnico da equipa (${ENVIAR}).\n  Quem tiver conta no GitHub também pode abrir ${linkIssue(assunto)}\n  com a sessão iniciada, arrastar o zip para a caixa de texto e carregar em "Submit new issue".\n`);
  } else {
    console.log(`\n  Pode ir como Pull Request no GitHub, com a conta ${pode.login}. Perguntar à pessoa e, só com o sim:\n  node scripts/contribuir.mjs --pr "${zip}"\n`);
  }
  process.exit(0);
}

// --pr: o mesmo zip, aberto como Pull Request. Volta a ver tudo o que leva, porque é isto que sai do computador.
const zip = resolve(raiz, prPedido.replace(/\\/g, '/'));
if (!prPedido || !existsSync(zip) || !statSync(zip).isFile()) sair(`Não encontrei o zip da proposta: ${prPedido ? zip : '(nenhum)'}`);
const extraida = join(temporaria('proposta-pr-'), 'zip');
try { repo.deszipar(zip, extraida); } catch (e) { sair(e.message); }
const pasta = repo.pastaDaProposta(extraida);
if (!pasta) sair('Este zip não é uma proposta do /contribuir (falta o PROPOSTA.md).');
const texto = readFileSync(join(pasta, 'PROPOSTA.md'), 'utf8');
const ficheiros = repo.ficheirosEm(pasta).filter((f) => f !== 'PROPOSTA.md');
const recusados = ficheiros.map((f) => [f, motivo(f, join(pasta, f))]).filter(([, r]) => r);
if (repo.segredo(texto)) recusados.push(['PROPOSTA.md', `tem o que parece ${repo.segredo(texto)}`]);
if (!ficheiros.length) recusados.push([basename(zip), 'não leva nenhum ficheiro do kit']);
if (recusados.length) sair(`Este zip não se envia:\n${recusados.map(([f, r]) => `    ${f}: ${r}`).join('\n')}`);
const assunto = (texto.match(/^Assunto: (.+)$/m) || [])[1]?.trim() || basename(zip, '.zip');
const versaoBase = (texto.match(/^Versão do kit de onde parte: `([^`]+)`/m) || [])[1] || '';
const titulo = (texto.match(/^#\s+(.+)$/m) || [])[1]?.trim() || `Proposta: ${assunto}`;
const pode = podePR();
if (pode.nao) sair(`Não dá para abrir um Pull Request: ${pode.nao}.\n  Mandar o zip ${zip} ao técnico da equipa (${ENVIAR}), ou abrir ${linkIssue(assunto)} e arrastá-lo para lá.`);

// O git usa a sessão do gh e nunca fica à espera de uma password no terminal.
const credencial = ['-c', 'credential.helper=', '-c', `credential.helper=${repo.ajudanteGit()}`];
const ambiente = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
const dir = join(dirname(extraida), 'repositorio');
const git = (a, cwd = dir) => {
  const r = spawnSync('git', a, { cwd, encoding: 'utf8', windowsHide: true, env: ambiente, timeout: 120000 });
  if (r.status !== 0) throw new Error(`git ${a.find((x) => !x.startsWith('-') && !x.includes('='))}: ${`${r.stderr}${r.stdout}`.trim().split('\n').pop() || r.error?.message}`);
  return r.stdout.trim();
};
try {
  git([...credencial, 'clone', '-q', process.env.KIT_GIT_URL || `${repo.PAGINA}.git`, dir], dirname(dir));
  // Parte da versão de onde a pessoa partiu: o Pull Request mostra só o que ela mudou, mesmo que o main já vá à frente.
  const tag = versaoBase ? `v${versaoBase}` : '';
  const temTag = tag && git(['tag', '-l', tag]) === tag;
  let ramo = `proposta/${hoje}-${curto(assunto)}`;
  if (git(['branch', '-r', '--list', `origin/${ramo}`])) ramo += `-${dd(agora.getHours())}${dd(agora.getMinutes())}`;
  git(['checkout', '-q', '-b', ramo, ...(temTag ? [tag] : [])]);
  for (const f of ficheiros) {
    mkdirSync(dirname(join(dir, f)), { recursive: true });
    copyFileSync(join(pasta, f), join(dir, f));
  }
  git(['add', '--', ...ficheiros]);
  const identidade = spawnSync('git', ['config', 'user.email'], { cwd: dir, encoding: 'utf8' }).stdout.trim()
    ? [] : ['-c', `user.name=${pode.login}`, '-c', `user.email=${pode.login}@users.noreply.github.com`];
  git([...identidade, 'commit', '-q', '-m', titulo, '-m', `Proposta feita com o /contribuir, a partir da versão ${versaoBase || 'desconhecida'}.`]);
  git([...credencial, 'push', '-q', '-u', 'origin', ramo]);
  const pr = repo.gh(['pr', 'create', '-R', repo.REPOSITORIO, '--base', 'main', '--head', ramo, '--title', titulo, '--body-file', join(pasta, 'PROPOSTA.md')], { cwd: dir, timeout: 60000 });
  if (!pr.ok) sair(`O ramo ${ramo} foi enviado, mas o Pull Request não abriu (${pr.erro.split('\n')[0]}).\n  Abrir à mão: ${repo.PAGINA}/compare/main...${ramo}`);
  console.log(`\n  Pull Request aberto: ${pr.saida.split('\n').pop()}\n  ${temTag ? `Parte da versão ${versaoBase}` : 'Parte do main (a versão de partida não está no repositório)'}.`
    + ' A Flowzi revê, testa em Windows e em Mac e, se entrar, chega a todos com o /actualizar.\n');
} catch (e) {
  sair(`O Pull Request não ficou feito (${e.message}). Nada mudou no kit.\n  Mandar o zip ${zip} ao técnico da equipa (${ENVIAR}), ou abrir ${linkIssue(assunto)} e arrastá-lo para lá.`);
}
