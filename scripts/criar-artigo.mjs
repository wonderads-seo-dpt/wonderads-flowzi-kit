// Cria um artigo de blogue em rascunho a partir de um ficheiro em artigos/, em blocos normais do WordPress.
// Se o ficheiro trouxer perguntas frequentes, acrescenta a marcação FAQPage para o Google.
// uso: node scripts/criar-artigo.mjs clientes/<cliente>/artigos/<slug>.mjs
// Voltar a correr o mesmo ficheiro actualiza o rascunho que ele criou nesse site (o número fica em <ficheiro>.wp.json).
// Depois de gravar, faz o documento para o cliente validar o texto em clientes/<cliente>/validacao/ (documento.mjs).
import { pathToFileURL } from 'node:url';
import { wp, exigirLigacao, site, cliente, guardarCopia, ficheiroDoCliente, registo } from './wp.mjs';

exigirLigacao();
const ficheiro = process.argv[2];
let alvo = process.argv[3];
if (!ficheiro) {
  console.error('uso: node scripts/criar-artigo.mjs clientes/<cliente>/artigos/<slug>.mjs [id]');
  process.exit(1);
}
const caminho = ficheiroDoCliente(ficheiro);
const a = (await import(pathToFileURL(caminho).href)).default || {};
const reg = registo(caminho);
if (!a.titulo || !Array.isArray(a.blocos)) {
  console.error('O ficheiro tem de fazer export default { titulo, slug, resumo, categoria, blocos, perguntas }.');
  process.exit(1);
}

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// O texto pode trazer <strong>, <em> e <a>; tudo o resto é escapado.
const inline = (t) => esc(t).replace(/&lt;(\/?)(strong|em|a)(\s+href="[^"]*")?&gt;/g, (_, f, tag, href) => `<${f}${tag}${href ? href.replace(/&amp;/g, '&') : ''}>`);

const bloco = ([tipo, valor]) => {
  if (tipo === 'h2' || tipo === 'h3') {
    const nivel = tipo === 'h3' ? ' {"level":3}' : '';
    return `<!-- wp:heading${nivel} -->\n<${tipo} class="wp-block-heading">${inline(valor)}</${tipo}>\n<!-- /wp:heading -->`;
  }
  if (tipo === 'p') return `<!-- wp:paragraph -->\n<p>${inline(valor)}</p>\n<!-- /wp:paragraph -->`;
  if (tipo === 'lista') {
    const itens = valor.map((i) => `<!-- wp:list-item -->\n<li>${inline(i)}</li>\n<!-- /wp:list-item -->`).join('\n');
    return `<!-- wp:list -->\n<ul class="wp-block-list">${itens}</ul>\n<!-- /wp:list -->`;
  }
  throw new Error(`Bloco desconhecido: "${tipo}". Usar h2, h3, p ou lista.`);
};

const partes = a.blocos.map(bloco);
if (Array.isArray(a.perguntas) && a.perguntas.length) {
  partes.push(bloco(['h2', 'Perguntas frequentes']));
  for (const [pergunta, resposta] of a.perguntas) {
    partes.push(bloco(['h3', pergunta]), bloco(['p', resposta]));
  }
  const ld = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: a.perguntas.map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r.replace(/<[^>]+>/g, '') } })),
  };
  partes.push(`<!-- wp:html -->\n<script type="application/ld+json">${JSON.stringify(ld)}</script>\n<!-- /wp:html -->`);
}

const corpo = { title: a.titulo, status: 'draft', content: partes.join('\n\n') };
if (a.slug) corpo.slug = a.slug;
if (a.resumo) corpo.excerpt = a.resumo;
if (a.categoria) {
  const cats = await wp(`wp/v2/categories?search=${encodeURIComponent(a.categoria)}&per_page=20`);
  const cat = cats.find((c) => c.name.toLowerCase() === a.categoria.toLowerCase());
  if (cat) corpo.categories = [cat.id];
  else console.log(`  A categoria "${a.categoria}" não existe no site. O artigo fica sem categoria; criar a categoria é com uma pessoa, no WordPress.`);
}

let artigo;
if (!alvo && reg.id) {
  try {
    const anterior = await wp(`wp/v2/posts/${reg.id}?context=edit`);
    if (anterior.status === 'draft') alvo = String(reg.id);
    else console.log(`  O artigo ${reg.id} já não está em rascunho (foi publicado por uma pessoa). Fica um rascunho novo.`);
  } catch (e) {
    if (e.status !== 404 && e.status !== 410) throw e;
  }
}
if (alvo) {
  const actual = await wp(`wp/v2/posts/${alvo}?context=edit`);
  const copia = guardarCopia(actual);
  console.log(`  estado anterior guardado em ${copia.replace(/^.*\/clientes\//, 'clientes/')}`);
  artigo = await wp(`wp/v2/posts/${alvo}`, { method: 'POST', body: corpo });
} else {
  artigo = await wp('wp/v2/posts', { method: 'POST', body: corpo });
}
reg.guardar(artigo.id);

// O documento para o cliente validar o texto, a partir do que ficou gravado. Se falhar, o artigo já está gravado.
let documento;
try {
  const { documentoDePagina } = await import('./validacao.mjs');
  documento = `  documento       ${documentoDePagina(artigo, { site, cliente, seo: a.seo }).relativo} (para o cliente validar o texto)`;
} catch (e) {
  documento = `  Aviso: o artigo ficou gravado, mas o documento para o cliente validar não se fez (${e.message}).\n  Repetir com node scripts/documento.mjs ${artigo.id}`;
}

const palavras = partes.join(' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
console.log(`
  artigo          ${artigo.id} · ${a.titulo}
  estado          ${artigo.status === 'draft' ? 'rascunho' : artigo.status}
  blocos          ${partes.length}
  palavras        cerca de ${palavras}
  resumo          ${a.resumo ? `${a.resumo.length} caracteres` : 'em falta'}
  FAQ (Google)    ${a.perguntas?.length ? `${a.perguntas.length} perguntas` : 'não'}

  editar          ${site}/wp-admin/post.php?post=${artigo.id}&action=edit
  pré-visualizar  ${site}/?p=${artigo.id}&preview=true
${documento}
`);
