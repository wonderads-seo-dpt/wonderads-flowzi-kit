// Sobe fotografias (e vídeos webm/mp4, até 20 MB) de clientes/<cliente>/imagens/ para a Biblioteca de Media do WordPress ligado, com texto
// alternativo e título, e devolve o URL para usar na página. Primeiro procura se a imagem já lá está e, se estiver,
// usa essa em vez de a subir outra vez. Sobe no máximo 3 de cada vez. Nunca apaga nem substitui imagens do site.
// uso: node scripts/subir-imagem.mjs --procurar "termo"                     lista imagens que já estão no site (só lê)
//      node scripts/subir-imagem.mjs clientes/<cliente>/imagens/<ficheiro> "texto alternativo" [<ficheiro> "texto"] ...
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, join } from 'node:path';
import { wp, exigirLigacao, ficheiroDoCliente, subirImagem, MAX_IMAGEM, MAX_VIDEO, eVideo, site, pasta, ambiente } from './wp.mjs';

exigirLigacao();
const MAXIMO = 3;
const args = process.argv.slice(2);

// O nome de um ficheiro sem extensão nem os acrescentos do WordPress (-1024x768, -scaled, -1, -2).
const raizDoNome = (n) => basename(String(n || '')).toLowerCase()
  .replace(/\.[a-z0-9]+$/, '').replace(/-\d+x\d+$/, '').replace(/-scaled$/, '').replace(/-\d+$/, '').replace(/[^a-z0-9]+/g, '-');

const mostrar = (m) => `  ${String(m.id).padStart(6)}  ${m.source_url}\n          ${m.media_type === 'image' ? `alt: ${m.alt_text || '(sem texto alternativo)'}` : m.mime_type}`;

if (args[0] === '--procurar') {
  const termo = args.slice(1).join(' ').trim();
  const lista = await wp(`wp/v2/media?per_page=30${termo ? `&search=${encodeURIComponent(termo)}` : ''}`);
  console.log(`\n  Imagens no site ${termo ? `com "${termo}"` : '(as 30 mais recentes)'}: ${lista.length}\n`);
  for (const m of lista) console.log(mostrar(m));
  console.log('');
  process.exit(0);
}

const pares = [];
for (let i = 0; i < args.length; i += 2) pares.push([args[i], args[i + 1]]);
if (!pares.length || pares.some(([f, alt]) => !f || !alt?.trim())) {
  console.error('uso: node scripts/subir-imagem.mjs clientes/<cliente>/imagens/<ficheiro> "texto alternativo" [...]');
  console.error('     cada imagem leva o seu texto alternativo, escrito para quem não vê a imagem.');
  process.exit(1);
}
if (pares.length > MAXIMO) {
  console.error(`Bloqueado: no máximo ${MAXIMO} imagens de cada vez (pediste ${pares.length}). Subir as que fazem falta agora.`);
  process.exit(1);
}

// Registo do que já se subiu, por site: o mesmo ficheiro não se sobe duas vezes.
const ficheiroRegisto = join(pasta, 'imagens', 'subidas.json');
const registo = existsSync(ficheiroRegisto) ? JSON.parse(readFileSync(ficheiroRegisto, 'utf8')) : {};
registo[site] ||= {};

if (ambiente() === 'live') {
  console.log(`\n  Aviso: ${site} é o site real. As imagens ficam com endereço público assim que sobem.`);
}
console.log('');

for (const [f, alt] of pares) {
  const caminho = ficheiroDoCliente(f);
  if (!/[\\/]imagens[\\/]/.test(caminho)) {
    console.error(`Bloqueado: ${f} não está em clientes/<cliente>/imagens/. Só se sobem as fotografias aprovadas dessa pasta.`);
    process.exit(1);
  }
  if (statSync(caminho).size > (eVideo(caminho) ? MAX_VIDEO : MAX_IMAGEM)) {
    console.error(`Bloqueado: ${f} passa do limite (8 MB numa imagem, 20 MB num vídeo). Comprimir antes de subir.`);
    process.exit(1);
  }
  const dados = readFileSync(caminho);
  const sha = createHash('sha256').update(dados).digest('hex');
  const nome = basename(caminho);

  // 1. Já subida pelo kit neste site?
  const antes = Object.values(registo[site]).find((r) => r.sha256 === sha);
  if (antes) {
    console.log(`  já estava   ${nome} → ${antes.url} (subida a ${antes.data}, id ${antes.id})`);
    continue;
  }
  // 2. Já está na Biblioteca de Media com o mesmo nome?
  const iguais = (await wp(`wp/v2/media?per_page=20&search=${encodeURIComponent(raizDoNome(nome).replace(/-/g, ' '))}`))
    .filter((m) => raizDoNome(m.source_url) === raizDoNome(nome));
  if (iguais.length) {
    const m = iguais[0];
    console.log(`  já estava   ${nome} → ${m.source_url} (id ${m.id}, alt: ${m.alt_text || 'vazio'})`);
    registo[site][nome] = { id: m.id, url: m.source_url, sha256: sha, alt: m.alt_text || '', data: 'já existia' };
    continue;
  }
  // 3. Subir.
  const titulo = nome.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ');
  const m = await subirImagem(dados, nome, { alt: alt.trim(), titulo });
  registo[site][nome] = { id: m.id, url: m.source_url, sha256: sha, alt: m.alt_text, data: new Date().toLocaleDateString('pt-PT') };
  console.log(`  subida      ${nome} → ${m.source_url} (id ${m.id})`);
  console.log(`              alt: ${m.alt_text}`);
  writeFileSync(ficheiroRegisto, JSON.stringify(registo, null, 2) + '\n');
}
writeFileSync(ficheiroRegisto, JSON.stringify(registo, null, 2) + '\n');
console.log(`\n  Registo: clientes/${basename(pasta)}/imagens/subidas.json\n`);
