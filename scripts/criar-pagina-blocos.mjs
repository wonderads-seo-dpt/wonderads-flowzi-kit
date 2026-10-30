// Cria uma página em blocos do WordPress (Gutenberg) em rascunho, para sites sem Elementor, a partir de um ficheiro em
// paginas/ feito com as peças de scripts/blocos.mjs. Com tipo: 'artigo' no ficheiro, cria um artigo do blogue.
// Voltar a correr o mesmo ficheiro actualiza o rascunho que ele criou nesse site (o número fica em <ficheiro>.wp.json).
// No topo vai o bloco de estilo das peças (letras da marca, ícones, telemóvel); estilo: false no ficheiro deixa só o tema.
// Depois de gravar, faz o documento para o cliente validar o texto em clientes/<cliente>/validacao/ (documento.mjs).
// uso: node scripts/criar-pagina-blocos.mjs clientes/<cliente>/paginas/<slug>.mjs
import { pathToFileURL } from 'node:url';
import { estiloDaPagina } from './blocos.mjs';
import { wp, exigirLigacao, paginaEmEdicao, guardarCopia, exigirRascunho, ligacoes, ficheiroDoCliente, registo, site, cliente } from './wp.mjs';

exigirLigacao();
const ficheiro = process.argv[2];
if (!ficheiro) {
  console.error('uso: node scripts/criar-pagina-blocos.mjs clientes/<cliente>/paginas/<slug>.mjs');
  process.exit(1);
}
const caminho = ficheiroDoCliente(ficheiro);
const p = (await import(pathToFileURL(caminho).href)).default || {};
const reg = registo(caminho);
const blocos = Array.isArray(p.elementos) ? p.elementos.flat().filter(Boolean) : [];
if (!p.titulo || !blocos.length || blocos.some((b) => typeof b !== 'string' || !b.trimStart().startsWith('<!-- wp:'))) {
  console.error('O ficheiro tem de fazer export default { titulo, slug, elementos }, com as peças de scripts/blocos.mjs (não as de elementor.mjs).');
  process.exit(1);
}

const artigo = p.tipo === 'artigo';
const rota = artigo ? 'posts' : 'pages';
// O template só vai se o ficheiro o pedir (um dos "Modelos de página" que o /wp-ligar leu), por exemplo um sem título.
const estilo = p.estilo === false ? { bloco: '', avisos: [] } : await estiloDaPagina();
const corpo = { title: p.titulo, status: 'draft', content: [estilo.bloco, ...blocos].filter(Boolean).join('\n\n') };
if (p.template) corpo.template = p.template;
if (p.slug) corpo.slug = p.slug;
if (artigo && p.resumo) corpo.excerpt = p.resumo;

let alvo = process.argv[3];
if (!alvo && reg.id) {
  try {
    const anterior = await wp(`wp/v2/${rota}/${reg.id}?context=edit`);
    if (anterior.status === 'draft') alvo = String(reg.id);
    else console.log(`  A ${artigo ? 'versão' : 'página'} ${reg.id} já não está em rascunho (foi publicada por uma pessoa). Fica um rascunho novo.`);
  } catch (e) {
    if (e.status !== 404 && e.status !== 410) throw e;
  }
}
let pagina;
if (alvo) {
  const actual = artigo ? await wp(`wp/v2/posts/${alvo}?context=edit`) : await paginaEmEdicao(alvo);
  exigirRascunho(actual);
  if (actual.meta?._elementor_edit_mode === 'builder') {
    console.error(`\n  A página ${actual.id} foi feita em Elementor. Parei para não a trocar por blocos; gravar com criar-pagina.mjs.\n`);
    process.exit(1);
  }
  if (p.slug && actual.slug && actual.slug !== p.slug && !actual.slug.startsWith(`${p.slug}-`)) {
    console.error(`\n  A página ${actual.id} é "${actual.slug}", não "${p.slug}". Parei para não gravar por cima da página errada.\n`);
    process.exit(1);
  }
  const copia = guardarCopia(actual);
  console.log(`  estado anterior guardado em ${copia.replace(/^.*[/\\]clientes[/\\]/, 'clientes/')}`);
  pagina = await wp(`wp/v2/${rota}/${actual.id}`, { method: 'POST', body: corpo });
} else {
  pagina = await wp(`wp/v2/${rota}`, { method: 'POST', body: corpo });
}
reg.guardar(pagina.id);

if (pagina.status !== 'draft') {
  console.error(`\n  ATENÇÃO: a página ${pagina.id} ficou em "${pagina.status}". Passar a rascunho no painel e avisar.\n`);
  process.exit(1);
}
const salvo = await wp(`wp/v2/${rota}/${pagina.id}?context=edit`);
const gravado = salvo.content?.raw || '';
if (!gravado.includes('<!-- wp:')) {
  console.error(`\n  A página ${pagina.id} foi criada mas o conteúdo não ficou gravado. Enviar este erro à Flowzi.\n`);
  process.exit(1);
}

// O documento para o cliente validar o texto. Se falhar, a página já está gravada: só se avisa.
let documento;
try {
  const { documentoDePagina } = await import('./validacao.mjs');
  documento = `\n  documento       ${documentoDePagina(salvo, { site, cliente, seo: p.seo }).relativo} (para o cliente validar o texto)`;
} catch (e) {
  documento = `\n  Aviso: a página ficou gravada, mas o documento para o cliente validar não se fez (${e.message}).\n  Repetir com node scripts/documento.mjs ${pagina.id}`;
}

// Quem não pode gravar HTML no site (um editor, ou um site com o HTML desligado) fica sem o bloco de estilo.
if (estilo.bloco && !gravado.includes('id="wa-estilo"')) {
  estilo.avisos.push(`o site retirou o estilo da página (o utilizador da ligação não pode gravar HTML): fica com as letras do tema, sem ícones nem ajustes de telemóvel${blocos.some((b) => b.includes('wa-h1')) ? ', e o título do tema aparece por cima do h1: passar o herói a h2' : ''}. Para ter tudo, ligar com um utilizador administrador`);
}
const contagem = (gravado.match(/<!-- wp:[a-z]/g) || []).length;
console.log(`
  ${artigo ? 'artigo ' : 'página '}         ${pagina.id} · ${p.titulo}
  estado          rascunho, em blocos do WordPress (sem Elementor)
  blocos          ${contagem}

  editar          ${site}/wp-admin/post.php?post=${pagina.id}&action=edit
  pré-visualizar  ${ligacoes(pagina.id, artigo).previsualizar}${documento}
${estilo.avisos.map((a) => `\n  Aviso: ${a}.`).join('')}${estilo.bloco ? '\n  O editor mostra a página sem as letras e os ícones; a pré-visualização mostra-a como fica.\n' : ''}`);
