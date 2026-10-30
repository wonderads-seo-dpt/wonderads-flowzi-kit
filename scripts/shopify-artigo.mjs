// Grava um artigo ESCONDIDO no blogue da loja Shopify do cliente activo, a partir de um ficheiro de clientes/<cliente>/artigos/.
// O ficheiro é igual ao dos artigos do WordPress (titulo, resumo, blocos, perguntas), mais blog, autor, etiquetas e imagem.
// Voltar a gravar o mesmo ficheiro actualiza o artigo, enquanto continuar escondido.
// uso: node scripts/shopify-artigo.mjs clientes/<cliente>/artigos/<artigo>.mjs
import { pathToFileURL } from 'node:url';
import { exigirLoja, gravar, ler, registo, ficheiroDoCliente, guardarCopia, painel, numero, loja, metafieldsSeo, cliente } from './shopify.mjs';
import { html, imagem } from './shopify-html.mjs';
import { nomeComercial, activo } from './clientes.mjs';

exigirLoja();
if (!process.argv[2]) {
  console.error('\n  uso: node scripts/shopify-artigo.mjs clientes/<cliente>/artigos/<artigo>.mjs\n');
  process.exit(1);
}
const f = ficheiroDoCliente(process.argv[2]);
const a = (await import(`${pathToFileURL(f).href}?v=${Date.now()}`)).default;
if (!a?.titulo) throw new Error('O ficheiro tem de fazer export default { titulo, resumo, blocos, perguntas, blog, autor, etiquetas, imagem, seo }.');

// O blogue: o que o ficheiro indicar (handle ou título); se a loja só tiver um, esse.
const blogs = (await ler('blogs')).blogs.nodes;
if (!blogs.length) throw new Error('A loja não tem nenhum blogue. Uma pessoa cria-o no painel (Conteúdo → Publicações do blogue → Gerir blogues).');
const blog = a.blog
  ? blogs.find((b) => b.handle === a.blog || b.title.toLowerCase() === String(a.blog).toLowerCase())
  : blogs.length === 1 ? blogs[0] : null;
if (!blog) throw new Error(`Diz no ficheiro em que blogue entra (blog: '<handle>'). Blogues da loja: ${blogs.map((b) => `${b.handle} (${b.title})`).join(', ')}.`);

const reg = registo(f);
let actual = null;
if (reg.id) {
  try { actual = (await ler('artigo', { id: reg.id })).article; } catch {}
  if (actual && actual.isPublished !== false) {
    throw new Error(`O artigo "${actual.title}" já foi publicado na loja (por uma pessoa). O kit não lhe toca enquanto estiver visível. Para o mudar: esconder com /shopify-publicar (só com o sim da pessoa; fica fora do ar até voltar a ser publicado), gravar outra vez e voltar a publicar.`);
  }
}
const artigo = {
  title: a.titulo,
  body: await html(a.blocos, a.perguntas),
  ...(a.resumo ? { summary: `<p>${String(a.resumo).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>` } : {}),
  ...(a.handle ? { handle: a.handle } : {}),
  ...(a.etiquetas?.length ? { tags: a.etiquetas.map(String) } : {}),
  ...(a.imagem ? { image: { url: await imagem(a.imagem), altText: a.imagem.alt } } : {}),
  metafields: metafieldsSeo({ titulo: a.seo?.titulo, descricao: a.seo?.descricao || a.resumo }, actual || {}),
  isPublished: false,
};
let res;
if (actual) {
  const copia = guardarCopia('artigo', actual);
  res = await gravar('articleUpdate', { id: actual.id, article: artigo });
  console.log(`\n  Estado anterior guardado em ${copia.replace(/^.*clientes/, 'clientes')}`);
} else {
  res = await gravar('articleCreate', { article: { ...artigo, blogId: blog.id, author: { name: a.autor || nomeComercial(activo()) } } });
}
reg.guardar(res.article.id);
let documento = '';
try {
  const { documentoDeHtml } = await import('./validacao.mjs');
  documento = `\n  documento       ${documentoDeHtml({ titulo: a.titulo, seo: a.seo, html: artigo.body, cliente, artigo: true, resumo: a.resumo, slug: res.article.handle, endereco: `https://${loja}/blogs/${res.article.blog?.handle || blog.handle}/${res.article.handle}` }).relativo} (para o cliente validar o texto)`;
} catch (e) {
  documento = `\n\n  Aviso: o artigo ficou gravado, mas o documento para o cliente validar não se fez (${e.message}).`;
}
console.log(`
  artigo          ${numero(res.article.id)} · ${res.article.title}
  blogue          ${res.article.blog?.title || blog.title}
  estado          ${res.article.isPublished === false ? 'escondido (só se vê no painel)' : res.article.isPublished}
  loja            ${loja}
  editar          ${painel(`articles/${numero(res.article.id)}`)}${documento}
`);
