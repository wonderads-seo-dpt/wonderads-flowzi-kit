// Trocar uma secção de uma página que já existe, sem lhe tocar.
// Cria sempre uma cópia em rascunho com a secção nova. A página original fica como estava.
// uso: node scripts/seccao.mjs --listar <id|endereço>      (só lê; com --listar à frente nunca escreve)
//      node scripts/seccao.mjs <id|endereço> <n> clientes/<cliente>/paginas/<ficheiro>.mjs   (o ficheiro faz export default seccao(...))
//      ... --copia <id>   volta a gravar uma cópia feita antes, em vez de criar outra (só se continuar em rascunho)
import { pathToFileURL } from 'node:url';
import { wp, exigirLigacao, paginaEmEdicao, lerElementor, guardarCopia, contar, ligacoes, ficheiroDoCliente } from './wp.mjs';

exigirLigacao();
const args = process.argv.slice(2);
const listar = args[0] === '--listar';
const [id, n, ficheiro] = listar ? [args[1], '--listar'] : args;
const iCopia = args.indexOf('--copia');
const copiaAnterior = iCopia >= 0 ? args[iCopia + 1] : '';
if (!id || !n) {
  console.error('uso: node scripts/seccao.mjs --listar <id|endereço>  |  node scripts/seccao.mjs <id|endereço> <n> clientes/<cliente>/paginas/<ficheiro>.mjs [--copia <id>]');
  process.exit(1);
}

const original = await paginaEmEdicao(id);
const elementos = lerElementor(original);
if (!elementos.length) {
  console.error(`\n  A página ${id} não tem conteúdo Elementor. Pode ser feita noutro construtor (WPBakery, Gutenberg).\n`);
  process.exit(1);
}

const resumo = (el) => {
  const tipos = [];
  let primeiro = '';
  const andar = (e) => {
    if (e.elType === 'widget') {
      tipos.push(e.widgetType);
      if (!primeiro) primeiro = e.settings?.title || e.settings?.title_text || '';
    }
    (e.elements || []).forEach(andar);
  };
  andar(el);
  return `${contar([el])} elementos · ${[...new Set(tipos)].join(', ')}${primeiro ? ` · "${primeiro.replace(/<[^>]+>/g, '').slice(0, 50)}"` : ''}`;
};

if (n === '--listar') {
  console.log(`\n  ${original.title.raw} · ${original.status} · ${elementos.length} secções\n`);
  elementos.forEach((el, i) => console.log(`  ${String(i + 1).padStart(2)}  ${resumo(el)}`));
  console.log('');
  process.exit(0);
}

const indice = Number(n) - 1;
if (!(indice >= 0 && indice < elementos.length)) {
  console.error(`A página tem ${elementos.length} secções. Escolher um número entre 1 e ${elementos.length}.`);
  process.exit(1);
}
const mod = await import(pathToFileURL(ficheiroDoCliente(ficheiro)).href);
const nova = mod.default;
if (!nova?.elType) {
  console.error('O ficheiro tem de fazer export default seccao(...), com as peças de scripts/elementor.mjs.');
  process.exit(1);
}

const copia = guardarCopia(original);
const novos = elementos.map((el, i) => (i === indice ? nova : el));

// A cópia fica do mesmo tipo do original: página com página, artigo com artigo.
const rota = original.type === 'post' ? 'posts' : 'pages';
if (copiaAnterior) {
  const anterior = await wp(`wp/v2/${rota}/${copiaAnterior}?context=edit`);
  if (anterior.status !== 'draft' || !/\[rascunho: secção/.test(anterior.title?.raw || '')) {
    console.error(`\n  ${copiaAnterior} não é uma cópia em rascunho feita pelo kit. Parei sem escrever.\n`);
    process.exit(1);
  }
}
const pagina = await wp(copiaAnterior ? `wp/v2/${rota}/${copiaAnterior}` : `wp/v2/${rota}`, {
  method: 'POST',
  body: {
    title: `${original.title.raw} [rascunho: secção ${n} nova]`,
    status: 'draft',
    template: original.template || 'elementor_header_footer',
    parent: original.parent || 0,
    meta: {
      _elementor_edit_mode: 'builder',
      _elementor_template_type: original.meta?._elementor_template_type || 'wp-page',
      _elementor_data: JSON.stringify(novos),
      _elementor_page_settings: original.meta?._elementor_page_settings || {},
    },
  },
});

const depois = lerElementor(await paginaEmEdicao(original.id));
const intacta = JSON.stringify(depois) === JSON.stringify(elementos);
const l = ligacoes(pagina.id, rota === 'posts');
console.log(`
  original        ${original.id} · ${original.status} · ${intacta ? 'intacta' : 'ALTERADA, verificar'}
  cópia           ${pagina.id} · ${pagina.status}
  secção ${n}        antes: ${resumo(elementos[indice])}
                  depois: ${resumo(nova)}
  outras secções  iguais ao original (${elementos.length - 1})
  estado anterior ${copia.replace(/^.*\/clientes\//, 'clientes/')}

  editar          ${l.editar}
  pré-visualizar  ${l.previsualizar}
  comparar com    ${original.link}
`);
