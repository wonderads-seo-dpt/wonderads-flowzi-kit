// O repositório da equipa no GitHub: de onde vêm as versões novas do kit e para onde vão as propostas.
// O nome vive só aqui. KIT_GITHUB_API e KIT_GH existem para os testes (uma API e um gh a fingir): seja qual for
// a origem, o /actualizar só instala o que vier assinado pela Flowzi.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { lixo, soDoRepositorio } from './assinatura.mjs';

export { lixo, soDoRepositorio };

export const REPOSITORIO = 'wonderads-seo-dpt/wonderads-flowzi-kit';
export const PAGINA = `https://github.com/${REPOSITORIO}`;
export const RELEASES = `${PAGINA}/releases`;
const API = (process.env.KIT_GITHUB_API || 'https://api.github.com').replace(/\/+$/, '');
const GH = process.env.KIT_GH || 'gh';
export const NOME_ZIP = /^flowzi-wonderads-kit[\w.-]*\.zip$/i;
const AGENTE = { 'User-Agent': 'flowzi-wonderads-kit' };

// O gh corre sem shell. Um .mjs no KIT_GH é o gh a fingir dos testes e corre com o node.
// cru: o stdout tal como veio. Um diff aparado perde a última linha de contexto e o git apply diz "corrupt patch".
const comandoGh = () => (/\.m?js$/i.test(GH) ? [process.execPath, [GH]] : [GH, []]);
export function gh(args, { cru = false, ...opcoes } = {}) {
  const [cmd, antes] = comandoGh();
  const r = spawnSync(cmd, [...antes, ...args], { encoding: 'utf8', timeout: 15000, windowsHide: true, ...opcoes });
  return {
    ok: r.status === 0, saida: cru ? (r.stdout || '') : (r.stdout || '').trim(), erro: (r.stderr || r.error?.message || '').trim(),
    existe: r.error?.code !== 'ENOENT', esgotado: r.error?.code === 'ETIMEDOUT',
  };
}
// A conta activa do gh. O gh auth status sai com 1 se qualquer conta guardada tiver problemas, mesmo com a activa boa.
// Devolve { login } com sessão, ou { nao: 'sem-gh' | 'sem-resposta' | 'sem-sessao' }.
export function sessao({ timeout = 8000 } = {}) {
  const u = gh(['api', 'user', '--jq', '.login'], { timeout });
  if (!u.existe) return { nao: 'sem-gh' };
  if (u.esgotado) return { nao: 'sem-resposta' };
  return u.ok && u.saida ? { login: u.saida } : { nao: 'sem-sessao' };
}
// Para o git usar a sessão do gh ao enviar, sem depender do que a pessoa tem configurado.
export function ajudanteGit() {
  const [cmd, antes] = comandoGh();
  return `!${[cmd, ...antes].map((p) => (/[\s"]/.test(p) || p.includes('\\') ? `"${p.replace(/\\/g, '/')}"` : p)).join(' ')} auth git-credential`;
}

export const versaoDaTag = (t) => String(t || '').trim().replace(/^v/i, '');
// AAAA.MM.DD.HHMM-commit: a parte da data compara-se como texto. Sem versão instalada, qualquer uma é mais recente.
export const maisRecente = (nova, instalada) => /^\d{4}\.\d{2}\.\d{2}/.test(nova || '') && nova !== instalada
  && (!instalada || nova.split('-')[0] >= instalada.split('-')[0]);

const deRelease = (j, via) => {
  const tag = j.tag_name || j.tagName || '';
  const versao = versaoDaTag(tag);
  // Só o formato exacto das versões da Flowzi: a tag é escrita por quem tem acesso ao repositório e chega ao Claude.
  if (!/^\d{4}\.\d{2}\.\d{2}\.\d{4}(-[0-9a-z]{1,40})?$/.test(versao)) return { falha: 'sem-versao' };
  const a = (j.assets || []).find((x) => NOME_ZIP.test(x.name || ''));
  return { tag, versao, notas: String(j.body || ''), via, anexo: a ? { nome: a.name, url: a.browser_download_url || a.url } : null };
};

// A release (a última, ou a de uma tag): primeiro pela API sem sessão, que só responde se o repositório for público;
// depois pelo gh, se existir e tiver sessão (repositório privado). Sem rede não tenta o gh, que só ia demorar.
// Um gh que não responde a tempo também é falta de rede: sem-acesso fica 12 horas na cache, sem-rede só uma.
// Devolve { versao, tag, notas, anexo, via } ou { falha: 'sem-rede' | 'sem-acesso' | 'sem-versao' }.
const SEM_REDE = ['ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'ENETUNREACH', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT'];
// Só estes erros são falta de rede. Um erro de TLS ou de proxy pode ser só do fetch: o gh tem outro caminho e tenta-se.
const semRede = (e) => e?.name === 'TimeoutError' || e?.name === 'AbortError'
  || [e?.cause, ...(e?.cause?.errors || [])].some((c) => SEM_REDE.includes(c?.code));
export async function release(tag = '', { tempo = 4000, tempoGh = 10000 } = {}) {
  try {
    const r = await fetch(`${API}/repos/${REPOSITORIO}/releases/${tag ? `tags/${encodeURIComponent(tag)}` : 'latest'}`,
      { headers: { Accept: 'application/vnd.github+json', ...AGENTE }, signal: AbortSignal.timeout(tempo) });
    if (r.ok) return deRelease(await r.json(), 'api');
  } catch (e) { if (semRede(e)) return { falha: 'sem-rede' }; }
  const v = gh(['release', 'view', ...(tag ? [tag] : []), '-R', REPOSITORIO, '--json', 'tagName,body,assets'], { timeout: tempoGh });
  if (v.esgotado) return { falha: 'sem-rede' };
  try { return v.ok ? deRelease(JSON.parse(v.saida), 'gh') : { falha: 'sem-acesso' }; } catch { return { falha: 'sem-acesso' }; }
}

export async function descarregar(rel, destino, { tempo = 60000 } = {}) {
  if (rel.via === 'api') {
    const r = await fetch(rel.anexo.url, { headers: { Accept: 'application/octet-stream', ...AGENTE }, signal: AbortSignal.timeout(tempo) });
    if (!r.ok) throw new Error(`o GitHub respondeu ${r.status}`);
    writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
  } else {
    const g = gh(['release', 'download', rel.tag, '-R', REPOSITORIO, '-p', rel.anexo.nome, '-O', destino, '--clobber'], { timeout: tempo });
    if (!g.ok) throw new Error(g.erro.split('\n')[0] || 'o gh não conseguiu descarregar');
  }
}

// No Windows e no Mac em português, as Transferências chamam-se Downloads no disco.
export function transferencias() {
  const casa = homedir();
  for (const p of ['Downloads', 'Transferências']) if (existsSync(join(casa, p))) return join(casa, p);
  mkdirSync(join(casa, 'Downloads'), { recursive: true });
  return join(casa, 'Downloads');
}

// A última versão vista no GitHub, partilhada pelo novidades.mjs e pela linha de baixo. O nome leva a API, para os
// testes (com uma API a fingir) nunca baralharem a cache verdadeira.
export const ficheiroCache = () => process.env.KIT_CACHE_NOVIDADES
  || join(tmpdir(), `flowzi-wonderads-kit-novidades-${createHash('sha256').update(`${API} ${REPOSITORIO}`).digest('hex').slice(0, 8)}.json`);
export function lerCache() { try { return JSON.parse(readFileSync(ficheiroCache(), 'utf8')); } catch { return null; } }

// Propostas: só os ficheiros do kit (regras, skills, scripts, guarda). Nunca clientes, ligações nem a assinatura.
const AREAS = /^(scripts\/|\.claude\/skills\/|\.claude\/hooks\/|\.claude\/settings\.json$|CLAUDE\.md$|LEIA-ME\.md$|NOVIDADES\.md$|treino\/blueprint\.json$|\.gitignore$)/;
export const LIMITE = 256 * 1024;
export function proibido(f) {
  if (!f || /^([a-z]:)?\//i.test(f) || f.split('/').includes('..')) return 'fica fora do kit';
  if (/(^|\/)\.env(\.|$)/i.test(f)) return 'é um .env, com passwords';
  if (/^clientes(\/|$)/.test(f) || f === '.cliente') return 'é de um cliente';
  if (['MANIFESTO.json', 'ASSINATURA', 'VERSAO'].includes(f)) return 'é a assinatura da versão, que só a Flowzi faz';
  if (!AREAS.test(f)) return 'fica fora das partes do kit que se propõem (scripts, skills, regras, guarda)';
  return '';
}
const SEGREDOS = [
  // Seis grupos de quatro, como o WordPress as dá. Uma frase de palavras de quatro letras não tem números nem maiúsculas a meio.
  [/\b[A-Za-z0-9]{4}( [A-Za-z0-9]{4}){5}\b/g, 'uma password de aplicação do WordPress', (m) => !/^(x{4} ?){6}$/i.test(m) && (/\d/.test(m) || /[A-Za-z0-9][A-Z]/.test(m))],
  [/\bshp(at|ss|ca|pa)_[0-9a-f]{16,}/gi, 'uma chave de uma app da Shopify'],
  [/\b\d+-[0-9a-f]{16,}\b/gi, 'uma chave da Pixabay'],
  [/\b(WP_APP_PASSWORD|SHOPIFY_CLIENT_SECRET|PIXABAY_KEY)\s*[=:]\s*["'`]?(?!x{4}|\$\{|\$\(|<)[A-Za-z0-9_-]{4,}/gi, 'uma password escrita no ficheiro'],
  [/\bBearer\s+(?!\$\{)[A-Za-z0-9._~+/=-]{16,}/g, 'um token (Bearer)'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/g, 'um token do GitHub'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/g, 'uma chave privada'],
];
// Devolve o que parece um segredo no texto, com a linha, ou ''.
export function segredo(texto) {
  for (const [padrao, nome, confirma = () => true] of SEGREDOS) {
    for (const m of String(texto).matchAll(padrao)) {
      if (confirma(m[0])) return `${nome} (linha ${texto.slice(0, m.index).split('\n').length})`;
    }
  }
  return '';
}
// Só se propõe texto: um NUL ou UTF-8 inválido é um binário (imagens, zips, documentos do Word).
export function eTexto(buf) {
  if (buf.subarray(0, 8000).includes(0)) return false;
  try { new TextDecoder('utf-8', { fatal: true }).decode(buf); return true; } catch { return false; }
}
// Lê e confirma um ficheiro de uma proposta. Devolve o motivo da recusa, ou ''.
export function recusa(f, caminho) {
  const p = proibido(f);
  if (p) return p;
  if (!existsSync(caminho) || !statSync(caminho).isFile()) return 'não existe';
  if (statSync(caminho).size > LIMITE) return `é grande demais (${Math.round(statSync(caminho).size / 1024)} KB; o limite é ${LIMITE / 1024} KB)`;
  const buf = readFileSync(caminho);
  if (!eTexto(buf)) return 'não é texto (imagens, zips e documentos não vão numa proposta)';
  const s = segredo(buf.toString('utf8'));
  return s ? `tem o que parece ${s}` : '';
}

export function ficheirosEm(pasta, rel = '') {
  const lista = [];
  for (const nome of readdirSync(join(pasta, rel))) {
    const r = rel ? `${rel}/${nome}` : nome;
    if (statSync(join(pasta, r)).isDirectory()) lista.push(...ficheirosEm(pasta, r));
    else if (!lixo(r)) lista.push(r);
  }
  return lista.sort();
}

// A pasta de uma proposta descompactada: a que tem o PROPOSTA.md, por fora ou numa pasta lá dentro.
export function pastaDaProposta(d) {
  if (existsSync(join(d, 'PROPOSTA.md'))) return d;
  const dentro = readdirSync(d).filter((n) => existsSync(join(d, n, 'PROPOSTA.md')));
  return dentro.length === 1 ? join(d, dentro[0]) : '';
}

// Zips sem dependências: o tar do sistema (o bsdtar do Windows 10+ e do Mac lê e escreve zip).
const tar = () => (process.platform === 'win32' ? join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar');
export function deszipar(zip, destino) {
  mkdirSync(destino, { recursive: true });
  let r = spawnSync(tar(), ['-xf', zip, '-C', destino], { encoding: 'utf8' });
  if (r.status !== 0 && process.platform !== 'win32') r = spawnSync('unzip', ['-q', zip, '-d', destino], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`Não consegui descompactar ${zip}: ${(r.stderr || r.error?.message || '').trim()}`);
}
// Comprime a pasta <dentro> (que fica por fora no zip) de <base> em <zip>. O tar -a escolhe zip pela extensão; onde
// não o souber fazer (o GNU tar), há o zip do sistema ou o Compress-Archive do PowerShell.
export function zipar(base, dentro, zip) {
  const ezip = () => { try { return readFileSync(zip).subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])); } catch { return false; } };
  const tentativas = [
    [tar(), ['-a', '-cf', zip, '-C', base, dentro]],
    process.platform === 'win32'
      ? ['powershell', ['-NoProfile', '-NonInteractive', '-Command', `Compress-Archive -LiteralPath '${join(base, dentro).replace(/'/g, "''")}' -DestinationPath '${zip.replace(/'/g, "''")}' -Force`]]
      : ['zip', ['-qr', zip, dentro], { cwd: base }],
  ];
  for (const [cmd, args, opc = {}] of tentativas) {
    rmSync(zip, { force: true });
    spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true, ...opc });
    if (ezip()) return;
  }
  throw new Error(`Não consegui fazer o zip ${zip}.`);
}
