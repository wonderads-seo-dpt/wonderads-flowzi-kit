// Grava a ligação do cliente activo (clientes/<cliente>/.env). Corre-o a pessoa, num separador do Terminal
// à parte, para a password ir do WordPress (ou a chave da app, numa loja Shopify) para o ficheiro sem passar pelo chat do Claude.
// uso: node scripts/ligacao.mjs
import { createInterface } from 'node:readline';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { activo, pastaDe, nomeComercial } from './clientes.mjs';
import { ambiente, identidade, eLocal, lojaShopify } from './ambiente.mjs';

const nome = activo();
if (!nome) {
  console.error('\n  Nenhum cliente activo. No Claude, usar /cliente primeiro.\n');
  process.exit(1);
}
// Na janela do Git Bash (mintty) a password apareceria no ecrã; no terminal do VS Code fica escondida.
if (!process.stdin.isTTY && process.env.MSYSTEM && !process.env.TERM_PROGRAM) {
  console.error('\n  Esta janela mostra a password enquanto se escreve. Abrir um terminal no VS Code (botão +) e correr lá.\n');
  process.exit(1);
}
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
const linhas = rl[Symbol.asyncIterator]();
// Enquanto se escreve a password, o Terminal não mostra o que se escreve.
let mudo = false;
rl._writeToOutput = (s) => { if (!mudo) rl.output.write(s); };
const pergunta = async (texto, escondido = false) => {
  process.stdout.write(texto);
  mudo = escondido;
  const { value } = await linhas.next();
  mudo = false;
  if (escondido) process.stdout.write('\n');
  return (value ?? '').trim();
};

console.log(`\n  Ligação de ${nomeComercial(nome)} (clientes/${nome}/)\n`);
const lojaAntes = existsSync(`${pastaDe(nome)}/.env`) ? (readFileSync(`${pastaDe(nome)}/.env`, 'utf8').match(/^[ \t\uFEFF]*SHOPIFY_LOJA[ \t]*=[ \t]*["']?([^\s"']+)/m) || [])[1] : '';
if (existsSync(`${pastaDe(nome)}/.env`)) console.log(`  Este cliente já tem ligação${lojaAntes ? ` (loja Shopify ${lojaAntes})` : ''}. O que se escrever agora substitui-a.\n`);
// Aceita o endereço como vier do browser: sem https, ou com /wp-admin/... no fim.
const limpar = (t) => {
  let u = t.trim().replace(/\s/g, '');
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const x = new URL(u);
    // Os sites locais (Local, .local) costumam estar em http://.
    if (!/^https?:\/\//i.test(t.trim()) && eLocal(x.hostname)) x.protocol = 'http:';
    return `${x.protocol}//${x.host}${x.pathname.replace(/\/(wp-admin|wp-login\.php|wp-json)(\/.*)?$/, '').replace(/\/+$/, '')}`;
  } catch { return ''; }
};
const endereco = await pergunta('  Endereço do site (o staging, ex.: https://staging.cliente.pt, ou o site real; numa loja Shopify, xxx.myshopify.com): ');
// Numa loja Shopify não há staging: tudo o que o kit grava fica escondido, e quem publica é uma pessoa, no painel.
const loja = lojaShopify(endereco);
if (loja) {
  console.log(`\n  Loja Shopify ${loja}. O kit grava lá páginas e artigos escondidos; publicar ou apagar só com /shopify-publicar, depois do sim da pessoa.`);
  console.log('  As duas chaves estão na app que o dono da loja criou no Dev Dashboard (Settings da app).\n');
  const id = (await pergunta('  Client ID: ')).replace(/\s/g, '');
  const segredo = (await pergunta('  Client secret (não aparece enquanto se escreve): ', true)).replace(/\s/g, '');
  rl.close();
  if (id.length < 16 || segredo.length < 16) {
    console.error('\n  Falta o Client ID ou o Client secret, ou não estão completos. Copiá-los outra vez da app, no Dev Dashboard.\n');
    process.exit(1);
  }
  writeFileSync(`${pastaDe(nome)}/.env`, `PLATAFORMA=shopify\nSHOPIFY_LOJA=${loja}\nSHOPIFY_CLIENT_ID=${id}\nSHOPIFY_CLIENT_SECRET=${segredo}\n`, { mode: 0o600 });
  console.log('\n  Ligação gravada (loja Shopify, só escondido). Voltar ao Claude e escrever "feito".\n');
  process.exit(0);
}
// Trocar uma loja Shopify por um site WordPress quase sempre é engano (o domínio público da loja em vez do xxx.myshopify.com).
if (lojaAntes) {
  console.log(`\n  Atenção: isto troca a loja Shopify ${lojaAntes} por um site WordPress. Numa loja, o endereço é o xxx.myshopify.com`);
  console.log('  (no painel da Shopify: Definições → Domínios), nunca o domínio público.\n');
  if ((await pergunta('  Escrever WORDPRESS para trocar, ou Enter para cancelar: ')).toUpperCase() !== 'WORDPRESS') {
    console.error('\n  Nada foi gravado. A ligação à loja ficou como estava.\n');
    process.exit(1);
  }
}
const url = limpar(endereco);
const tipo = url ? ambiente(url) : 'desconhecido';
if (tipo === 'desconhecido') { console.error('\n  Esse endereço não é válido. Copiar o endereço do site tal como aparece no browser.\n'); process.exit(1); }
// O domínio público de uma loja (loja.pt) não é o xxx.myshopify.com: sem isto, seguia para as perguntas do WordPress.
try {
  const r = await fetch(`${url}/`, { signal: AbortSignal.timeout(8000) });
  const html = await r.text();
  if (r.headers.get('powered-by') === 'Shopify' || r.headers.has('x-shopid') || /cdn\.shopify\.com|Shopify\.theme/.test(html)) {
    rl.close();
    console.error(`\n  ${new URL(url).host} é uma loja Shopify. Para a ligar, usar o endereço xxx.myshopify.com da loja`);
    console.error('  (no painel da Shopify: Definições → Domínios), não o domínio público. Nada foi gravado.\n');
    process.exit(1);
  }
} catch {}
let confirmado = '';
let live = '';
if (tipo === 'produção') {
  const host = identidade(url);
  console.log(`\n  ${host} não tem "staging" no nome. O que é?\n`);
  console.log('    1 · Uma cópia de testes (staging) com outro nome, que os clientes não vêem');
  console.log('    2 · O site real do cliente. O kit grava lá só rascunhos: nunca publica, nunca apaga,');
  console.log('        nunca mexe no que já está publicado');
  console.log('    Enter · cancelar\n');
  // Aceita o 1 e o 2 como vierem: com espaços, ponto, por extenso ou em largura total (２).
  const normal = (t) => t.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  let escolha = '';
  for (let tentativa = 0; tentativa < 3 && !escolha; tentativa++) {
    const r = normal(await pergunta('  Escolha (1, 2 ou Enter): '));
    if (!r) break;
    escolha = { 1: '1', um: '1', 2: '2', dois: '2' }[r] || '';
    if (!escolha) console.log('  Escrever só 1 ou 2, ou carregar em Enter para cancelar.');
  }
  if (!escolha) {
    console.error('\n  Não confirmado. Nada foi gravado.\n');
    process.exit(1);
  }
  const resposta = identidade(limpar(await pergunta(`  Escrever o endereço outra vez para confirmar (${host}): `)));
  if (resposta !== host) {
    console.error(`\n  Não confirmado: ${resposta || 'o endereço'} não é igual a ${host} (o www e as pastas contam). Nada foi gravado.\n`);
    process.exit(1);
  }
  if (escolha === '1') confirmado = host;
  else live = host;
}
// Uma linha vazia colada a mais com o endereço não pode passar a ser o utilizador.
let utilizador = '';
for (let tentativa = 0; tentativa < 3 && !utilizador; tentativa++) utilizador = await pergunta('  Nome de utilizador do WordPress (não o email): ');
const password = await pergunta('  Password de aplicação (não aparece enquanto se escreve): ', true);
rl.close();
if (!utilizador || password.replace(/\s/g, '').length < 20) {
  console.error('\n  Falta o utilizador ou a password de aplicação não está completa (são 24 letras, em grupos de 4).\n');
  process.exit(1);
}
writeFileSync(`${pastaDe(nome)}/.env`, `WP_URL=${url}\nWP_USER=${utilizador}\nWP_APP_PASSWORD=${password}\n${confirmado ? `WP_E_STAGING=${confirmado}\n` : ''}${live ? `WP_LIVE=${live}\n` : ''}`, { mode: 0o600 });
console.log(`\n  Ligação gravada (${confirmado ? 'staging confirmado por si' : live ? 'site real, só rascunhos' : tipo}). Voltar ao Claude e escrever "feito".\n`);
