// Fotografias gratuitas da Pixabay para as páginas: procurar, ver e descarregar para clientes/<cliente>/imagens/.
// A chave é da agência e fica em .env.pixabay, na raiz do kit; grava-a a pessoa, num terminal à parte.
// uso: node scripts/pixabay.mjs --chave                  grava a chave (corre-o a pessoa, não o Claude)
//      node scripts/pixabay.mjs "<pesquisa>" [quantas]   lista fotografias (em português)
//      node scripts/pixabay.mjs descarregar <id>         guarda a fotografia em clientes/<activo>/imagens/
import { createInterface } from 'node:readline';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { raiz, activo, pastaDe } from './clientes.mjs';

const API = process.env.PIXABAY_API || 'https://pixabay.com/api/';
const FICHEIRO = join(raiz, '.env.pixabay');
const [a, b] = process.argv.slice(2);
const sair = (texto) => { console.error(`\n  ${texto}\n`); process.exit(1); };

if (a === '--chave') {
  if (!process.stdin.isTTY) sair('Isto corre-o a pessoa, num terminal à parte (no VS Code, botão + do terminal): node scripts/pixabay.mjs --chave');
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let mudo = false;
  rl._writeToOutput = (s) => { if (!mudo) rl.output.write(s); };
  // Colar sem ver nada leva a carregar Enter antes do tempo: pergunta-se de novo, três vezes.
  let chave = '';
  for (let i = 0; i < 3 && !chave; i++) {
    process.stdout.write(i ? '  Não chegou nenhuma chave. Colar outra vez (não aparece nada enquanto se cola) e carregar Enter: ' : '\n  Chave da API da Pixabay (em pixabay.com/api/docs, com a conta aberta, no campo "key").\n  Colar aqui (não aparece nada enquanto se cola) e carregar Enter: ');
    mudo = true;
    const linha = await new Promise((r) => rl.once('line', r));
    mudo = false;
    process.stdout.write('\n');
    chave = (linha.match(/\d+-[0-9a-f]{16,}/i) || [])[0] || '';
  }
  rl.close();
  if (!chave) sair('Isto não parece uma chave da Pixabay. Nada foi gravado.');
  const r = await fetch(`${API}?key=${chave}&q=teste&per_page=3`);
  if (!r.ok) sair(`A Pixabay recusou a chave (${r.status}). Nada foi gravado.`);
  writeFileSync(FICHEIRO, `PIXABAY_KEY=${chave}\n`, { mode: 0o600 });
  console.log('  Chave gravada e testada. Já se pode pedir ao Claude fotografias da Pixabay.\n');
  process.exit(0);
}

const chave = existsSync(FICHEIRO) ? (readFileSync(FICHEIRO, 'utf8').match(/^[ \t﻿]*PIXABAY_KEY[ \t]*=[ \t]*["']?([^\s"']+)/m) || [])[1] : '';
if (!chave) sair('A Pixabay ainda não está ligada. A pessoa corre, num terminal à parte: node scripts/pixabay.mjs --chave');

// A Pixabay pede que as pesquisas fiquem guardadas 24 horas.
async function pedir(params) {
  const url = `${API}?key=${chave}&${new URLSearchParams(params)}`;
  const cache = join(tmpdir(), `pixabay-${createHash('sha1').update(url).digest('hex')}.json`);
  try {
    const c = JSON.parse(readFileSync(cache, 'utf8'));
    if (Date.now() - c.quando < 864e5) return c.dados;
  } catch {}
  const r = await fetch(url);
  if (r.status === 429) sair('Demasiados pedidos à Pixabay. Esperar um minuto.');
  if (!r.ok) sair(`A Pixabay respondeu ${r.status}${r.status === 400 ? ' (a chave pode ter sido revogada: correr de novo --chave)' : ''}.`);
  const dados = await r.json();
  try { writeFileSync(cache, JSON.stringify({ quando: Date.now(), dados })); } catch {}
  return dados;
}

if (a === 'descarregar') {
  if (!/^\d+$/.test(b || '')) sair('uso: node scripts/pixabay.mjs descarregar <id>');
  const nome = activo();
  if (!nome) sair('Nenhum cliente activo. Usar /cliente primeiro.');
  const f = (await pedir({ id: b })).hits?.[0];
  if (!f) sair(`Não há nenhuma fotografia ${b} na Pixabay.`);
  const r = await fetch(f.largeImageURL);
  if (!r.ok) sair(`Não deu para descarregar (${r.status}).`);
  const pasta = join(pastaDe(nome), 'imagens');
  mkdirSync(pasta, { recursive: true });
  const destino = join(pasta, `pixabay-${f.id}.jpg`);
  writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
  console.log(`\n  Guardada em clientes/${nome}/imagens/pixabay-${f.id}.jpg (fotografia de ${f.user}, ${f.pageURL}).`);
  console.log('  Próximo passo: subir para a Biblioteca de Media do site (Media → Adicionar novo) e colar ao Claude o URL dela.\n');
  process.exit(0);
}

if (!a) sair('uso: node scripts/pixabay.mjs "<pesquisa>" [quantas]');
const quantas = Math.min(Math.max(Number(b) || 8, 3), 30);
const { totalHits, hits = [] } = await pedir({ q: a, lang: 'pt', image_type: 'photo', safesearch: 'true', per_page: quantas });
if (!hits.length) sair(`Nada para "${a}". Experimentar outras palavras (em português ou em inglês).`);
console.log(`\n  ${totalHits} fotografias para "${a}" na Pixabay. As primeiras ${hits.length}:\n`);
for (const f of hits) {
  console.log(`  ${f.id}  ${f.imageWidth}×${f.imageHeight}  ${[...new Set(f.tags.split(/,\s*/))].join(', ')}`);
  console.log(`      ver: ${f.pageURL}   (de ${f.user})`);
}
console.log('\n  Para usar uma: node scripts/pixabay.mjs descarregar <id>. As ligações de pré-visualização da Pixabay não servem para o site.\n');
