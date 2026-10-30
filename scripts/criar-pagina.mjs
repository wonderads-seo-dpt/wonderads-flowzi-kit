// Cria uma página Elementor em rascunho a partir de um ficheiro em paginas/.
// Com tipo: 'artigo' no ficheiro, cria um artigo do blogue em Elementor, como os blogues feitos em Elementor.
// Voltar a correr o mesmo ficheiro actualiza o rascunho que ele criou nesse site (o número fica em <ficheiro>.wp.json).
// Com um número no fim, actualiza essa página, mas só se continuar em rascunho e for a mesma página.
// Depois de gravar, faz o documento para o cliente validar o texto em clientes/<cliente>/validacao/ (documento.mjs).
// uso: node scripts/criar-pagina.mjs clientes/<cliente>/paginas/<slug>.mjs
import { pathToFileURL } from 'node:url';
import { wp, exigirLigacao, paginaEmEdicao, guardarCopia, exigirRascunho, contar, ligacoes, ficheiroDoCliente, registo, site, cliente } from './wp.mjs';

exigirLigacao();
const ficheiro = process.argv[2];
if (!ficheiro) {
  console.error('uso: node scripts/criar-pagina.mjs clientes/<cliente>/paginas/<slug>.mjs');
  process.exit(1);
}
const caminho = ficheiroDoCliente(ficheiro);
const p = (await import(pathToFileURL(caminho).href)).default || {};
const reg = registo(caminho);
if (!p.titulo || !Array.isArray(p.elementos)) {
  console.error('O ficheiro tem de fazer export default { titulo, slug, elementos }.');
  process.exit(1);
}

const artigo = p.tipo === 'artigo';
const rota = artigo ? 'posts' : 'pages';
const corpo = {
  title: p.titulo,
  status: 'draft',
  template: p.template || 'elementor_header_footer',
  meta: {
    _elementor_edit_mode: 'builder',
    _elementor_template_type: artigo ? 'wp-post' : 'wp-page',
    _elementor_data: JSON.stringify(p.elementos),
    _elementor_page_settings: { hide_title: 'yes' },
  },
};
if (p.slug) corpo.slug = p.slug;
if (artigo && p.resumo) corpo.excerpt = p.resumo;

let pagina;
let alvo = process.argv[3];
if (!alvo && reg.id) {
  // Já foi gravado neste site: se o rascunho ainda existir, actualiza-se; se o site foi reposto ou a página publicada, cria-se outro.
  try {
    const anterior = await wp(`wp/v2/${rota}/${reg.id}?context=edit`);
    if (anterior.status === 'draft') alvo = String(reg.id);
    else console.log(`  A ${artigo ? 'versão' : 'página'} ${reg.id} já não está em rascunho (foi publicada por uma pessoa). Fica um rascunho novo.`);
  } catch (e) {
    if (e.status !== 404 && e.status !== 410) throw e;
  }
}
if (alvo) {
  const actual = artigo ? await wp(`wp/v2/posts/${alvo}?context=edit`) : await paginaEmEdicao(alvo);
  exigirRascunho(actual);
  if (p.slug && actual.slug && actual.slug !== p.slug && !actual.slug.startsWith(`${p.slug}-`)) {
    console.error(`\n  A página ${actual.id} é "${actual.slug}", não "${p.slug}". Parei para não gravar por cima da página errada.\n`);
    process.exit(1);
  }
  const copia = guardarCopia(actual);
  console.log(`  estado anterior guardado em ${copia.replace(/^.*\/clientes\//, 'clientes/')}`);
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
const gravado = salvo.meta?._elementor_data;
if (!gravado || gravado.length < 10) {
  console.error(`\n  A página ${pagina.id} foi criada mas o _elementor_data não ficou gravado. O site não aceita esta escrita.\n`);
  process.exit(1);
}

// O documento para o cliente validar o texto. Se falhar, a página já está gravada: só se avisa.
let documento;
try {
  const { documentoDePagina } = await import('./validacao.mjs');
  documento = `  documento       ${documentoDePagina(salvo, { site, cliente, seo: p.seo }).relativo} (para o cliente validar o texto)`;
} catch (e) {
  documento = `  Aviso: a página ficou gravada, mas o documento para o cliente validar não se fez (${e.message}).\n  Repetir com node scripts/documento.mjs ${pagina.id}`;
}

const l = ligacoes(pagina.id, artigo);
console.log(`
  ${artigo ? 'artigo ' : 'página '}         ${pagina.id} · ${p.titulo}
  estado          rascunho
  secções         ${p.elementos.length}
  elementos       ${contar(p.elementos)}

  editar          ${l.editar}
  pré-visualizar  ${l.previsualizar}
${documento}
`);
if (alvo) {
  console.log(`  Página alterada: se a pré-visualização mostrar o estilo antigo, abrir o editor do Elementor
  e guardar como rascunho (seta ao lado do botão verde → Guardar rascunho). Nunca o botão verde "Publicar".
`);
}
