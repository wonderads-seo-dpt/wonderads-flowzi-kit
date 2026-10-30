// Grava uma página ESCONDIDA na loja Shopify do cliente activo, a partir de um ficheiro de clientes/<cliente>/paginas/.
// Duas formas: texto (blocos: [['h2', ...], ...], dentro do modelo de página do tema) ou com desenho (elementos: [...]
// feitos com as peças de scripts/shopify-desenho.mjs, com o desenho dentro da própria página).
// Voltar a gravar o mesmo ficheiro actualiza a página, enquanto continuar escondida.
// uso: node scripts/shopify-pagina.mjs clientes/<cliente>/paginas/<pagina>.mjs
import { pathToFileURL } from 'node:url';
import { exigirLoja, gravar, ler, registo, ficheiroDoCliente, guardarCopia, painel, numero, loja, metafieldsSeo, imagemNaLoja, cliente } from './shopify.mjs';
import { html } from './shopify-html.mjs';

exigirLoja();
if (!process.argv[2]) {
  console.error('\n  uso: node scripts/shopify-pagina.mjs clientes/<cliente>/paginas/<pagina>.mjs\n');
  process.exit(1);
}
const f = ficheiroDoCliente(process.argv[2]);
const p = (await import(`${pathToFileURL(f).href}?v=${Date.now()}`)).default;
if (!p?.titulo) throw new Error('O ficheiro tem de fazer export default { titulo, handle, seo, blocos, perguntas } (texto) ou { titulo, handle, seo, elementos } (com desenho).');

const desenho = p.elementos !== undefined;
if (desenho && p.blocos) throw new Error('O ficheiro tem blocos e elementos: uma página é texto (blocos) ou com desenho (elementos), não as duas.');
let corpo;
let avisos = [];
let temH1 = false;
if (desenho) {
  const { paginaComDesenho } = await import('./shopify-desenho.mjs');
  ({ corpo, avisos, h1: temH1 } = await paginaComDesenho(p.elementos, { imagemNaLoja }));
} else {
  corpo = await html(p.blocos, p.perguntas);
}
const reg = registo(f);
let actual = null;
if (reg.id) {
  try { actual = (await ler('pagina', { id: reg.id })).page; } catch {}
  if (actual && actual.isPublished !== false) {
    throw new Error(`A página "${actual.title}" já foi publicada na loja (por uma pessoa). O kit não lhe toca enquanto estiver visível. Para a mudar: esconder com /shopify-publicar (só com o sim da pessoa; fica fora do ar até voltar a ser publicada), gravar outra vez e voltar a publicar.${desenho ? ' Não a mudar no editor do painel: estraga o desenho.' : ''}`);
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

// Confirma que a Shopify guardou o desenho: sem o bloco de estilo, a página fica só com o texto, com o aspecto do tema.
if (desenho) {
  let gravado = '';
  try { gravado = (await ler('pagina', { id: res.page.id })).page?.body || ''; } catch {}
  if (!gravado.includes('id="wa-estilo"')) avisos.push('a Shopify não devolveu o estilo da página: abrir no painel e ver se o desenho ficou. Se não ficou, enviar este aviso à Flowzi');
}
// O documento para o cliente validar o texto nunca faz falhar a gravação.
let documento = '';
try {
  const { documentoDeHtml } = await import('./validacao.mjs');
  documento = `\n  documento       ${documentoDeHtml({ titulo: p.titulo, seo: p.seo, html: corpo, cliente, slug: res.page.handle, endereco: `https://${loja}/pages/${res.page.handle}` }).relativo} (para o cliente validar o texto)`;
} catch (e) {
  avisos.push(`a página ficou gravada, mas o documento para o cliente validar não se fez (${e.message})`);
}
console.log(`
  página          ${numero(res.page.id)} · ${res.page.title}
  estado          ${res.page.isPublished === false ? 'escondida (só se vê no painel)' : res.page.isPublished}
  forma           ${desenho ? `com desenho dentro da página${temH1 ? ' (o h1 é o do herói: o título do tema esconde-se nesta página)' : ' (sem h1: o título do tema fica por cima)'}` : 'texto, dentro do modelo de página do tema'}
  endereço        /pages/${res.page.handle} (só funciona depois de uma pessoa a publicar)
  loja            ${loja}
  editar          ${painel(`pages/${numero(res.page.id)}`)}${documento}
${avisos.map((a) => `\n  Aviso: ${a}.`).join('')}${desenho ? '\n  Não editar esta página no editor de texto do painel: ao guardar, o editor pode estragar o desenho. Mudanças fazem-se no ficheiro e voltando a gravar.\n' : ''}`);
