// Grava uma página ESCONDIDA na loja Shopify do cliente activo, a partir de um ficheiro de clientes/<cliente>/paginas/.
// Voltar a gravar o mesmo ficheiro actualiza a página, enquanto continuar escondida.
// uso: node scripts/shopify-pagina.mjs clientes/<cliente>/paginas/<pagina>.mjs
import { pathToFileURL } from 'node:url';
import { exigirLoja, gravar, ler, registo, ficheiroDoCliente, guardarCopia, painel, numero, loja, metafieldsSeo } from './shopify.mjs';
import { html } from './shopify-html.mjs';

exigirLoja();
if (!process.argv[2]) {
  console.error('\n  uso: node scripts/shopify-pagina.mjs clientes/<cliente>/paginas/<pagina>.mjs\n');
  process.exit(1);
}
const f = ficheiroDoCliente(process.argv[2]);
const p = (await import(`${pathToFileURL(f).href}?v=${Date.now()}`)).default;
if (!p?.titulo) throw new Error('O ficheiro tem de fazer export default { titulo, handle, seo, blocos, perguntas }.');

const corpo = await html(p.blocos, p.perguntas);
const reg = registo(f);
let actual = null;
if (reg.id) {
  try { actual = (await ler('pagina', { id: reg.id })).page; } catch {}
  if (actual && actual.isPublished !== false) {
    throw new Error(`A página "${actual.title}" já foi publicada na loja (por uma pessoa). O kit não lhe toca. Para a mudar, gravar uma versão nova com outro handle, ou mudar à mão no painel.`);
  }
}
const pagina = {
  title: p.titulo,
  body: corpo,
  ...(p.handle ? { handle: p.handle } : {}),
  ...(p.modelo ? { templateSuffix: p.modelo } : {}),
  metafields: metafieldsSeo(p.seo, actual || {}),
  isPublished: false,
};
let res;
if (actual) {
  const copia = guardarCopia('pagina', actual);
  res = await gravar('pageUpdate', { id: actual.id, page: pagina });
  console.log(`\n  Estado anterior guardado em ${copia.replace(/^.*clientes/, 'clientes')}`);
} else {
  res = await gravar('pageCreate', { page: pagina });
}
reg.guardar(res.page.id);
console.log(`
  página          ${numero(res.page.id)} · ${res.page.title}
  estado          ${res.page.isPublished === false ? 'escondida (só se vê no painel)' : res.page.isPublished}
  endereço        /pages/${res.page.handle} (só funciona depois de uma pessoa a publicar)
  loja            ${loja}
  editar          ${painel(`pages/${numero(res.page.id)}`)}
`);
