// Trocar uma secção de uma página que já existe, sem lhe tocar.
// Cria sempre uma cópia em rascunho com a secção nova. A página original fica como estava.
// Também com os modelos do Elementor (cabeçalho, rodapé, secções guardadas, popups), pelo número que o
// node scripts/listar.mjs --modelos mostra: a cópia é um modelo novo em rascunho, do mesmo tipo e sem condições de
// apresentação, por isso não muda nada no site. Pô-la no lugar do original faz-se à mão, no Elementor.
// uso: node scripts/seccao.mjs --listar <id|endereço>      (só lê; com --listar à frente nunca escreve)
//      node scripts/seccao.mjs <id|endereço> <n> clientes/<cliente>/paginas/<ficheiro>.mjs   (o ficheiro faz export default seccao(...))
//      ... --copia <id>   volta a gravar uma cópia feita antes, em vez de criar outra (só se continuar em rascunho)
import { pathToFileURL } from 'node:url';
import { wp, exigirLigacao, paginaEmEdicao, modeloEmEdicao, nomeDoModelo, lerElementor, guardarCopia, contar, ligacoes, ficheiroDoCliente, site } from './wp.mjs';

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

// Uma página ou um artigo; se o número não for de nenhum, um modelo do Elementor.
async function abrir(ref) {
  try {
    return await paginaEmEdicao(ref);
  } catch (e) {
    if (!/^\d+$/.test(String(ref).trim()) || !/^Não encontrei/.test(e.message)) throw e;
  }
  return modeloEmEdicao(ref);
}

const original = await abrir(id);
const modelo = original.type === 'elementor_library';
const tipoModelo = original.meta?._elementor_template_type || '';
if (modelo && tipoModelo === 'kit') {
  console.error(`\n  O ${id} é o Kit do Elementor (as cores e as letras de todo o site), não um modelo com secções. O kit não lhe mexe.\n`);
  process.exit(1);
}
const elementos = lerElementor(original);
if (!elementos.length) {
  console.error(modelo
    ? `\n  O modelo ${id} (${nomeDoModelo(tipoModelo)}) não tem conteúdo Elementor.\n`
    : `\n  A página ${id} não tem conteúdo Elementor. Pode ser feita noutro construtor (WPBakery, Gutenberg).\n`);
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
// Pro: as condições dizem onde o modelo aparece (include/general é o site todo). Sem o Pro, a API não as mostra.
const condicoes = (p) => {
  const c = p.meta?._elementor_conditions;
  if (!Array.isArray(c)) return '';
  return c.length ? c.map((x) => (x === 'include/general' ? 'todo o site' : x)).join(', ') : 'nenhuma (não aparece no site)';
};

if (n === '--listar') {
  const onde = modelo && condicoes(original) ? ` · em uso: ${condicoes(original)}` : '';
  console.log(`\n  ${original.title.raw} · ${modelo ? `modelo ${nomeDoModelo(tipoModelo)} · ` : ''}${original.status} · ${elementos.length} secções${onde}\n`);
  elementos.forEach((el, i) => console.log(`  ${String(i + 1).padStart(2)}  ${resumo(el)}`));
  console.log('');
  process.exit(0);
}

const indice = Number(n) - 1;
if (!(indice >= 0 && indice < elementos.length)) {
  console.error(`${modelo ? 'O modelo' : 'A página'} tem ${elementos.length} secções. Escolher um número entre 1 e ${elementos.length}.`);
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
const definicoes = original.meta?._elementor_page_settings;

// A cópia fica do mesmo tipo do original: página com página, artigo com artigo, cabeçalho com cabeçalho.
const rota = modelo ? 'elementor_library' : original.type === 'post' ? 'posts' : 'pages';
if (copiaAnterior) {
  const anterior = await wp(`wp/v2/${rota}/${copiaAnterior}?context=edit`);
  if (anterior.status !== 'draft' || !/\[rascunho: secção/.test(anterior.title?.raw || '')) {
    console.error(`\n  ${copiaAnterior} não é uma cópia em rascunho feita pelo kit. Parei sem escrever.\n`);
    process.exit(1);
  }
}
const corpo = {
  title: modelo ? `[rascunho: secção ${n} nova] ${original.title.raw}` : `${original.title.raw} [rascunho: secção ${n} nova]`,
  status: 'draft',
  meta: {
    _elementor_edit_mode: 'builder',
    _elementor_template_type: tipoModelo || 'wp-page',
    _elementor_data: JSON.stringify(novos),
    // Um modelo sem definições vem como [] (o PHP não distingue lista vazia de objecto vazio), e a API só aceita objecto.
    _elementor_page_settings: definicoes && typeof definicoes === 'object' && !Array.isArray(definicoes) ? definicoes : {},
  },
};
// Num modelo vai só isto: as condições (onde aparece no site) nunca se copiam, e a tranca recusa-as.
if (!modelo) Object.assign(corpo, { template: original.template || 'elementor_header_footer', parent: original.parent || 0 });
const pagina = await wp(copiaAnterior ? `wp/v2/${rota}/${copiaAnterior}` : `wp/v2/${rota}`, { method: 'POST', body: corpo });

const depois = modelo ? await modeloEmEdicao(original.id) : await paginaEmEdicao(original.id);
const intacta = JSON.stringify(lerElementor(depois)) === JSON.stringify(elementos) && depois.status === original.status
  && JSON.stringify(depois.meta?._elementor_conditions ?? null) === JSON.stringify(original.meta?._elementor_conditions ?? null);
const l = ligacoes(pagina.id, rota === 'posts');
console.log(`
  original        ${original.id} · ${modelo ? `modelo ${nomeDoModelo(tipoModelo)} · ` : ''}${original.status} · ${intacta ? (modelo ? 'intacto' : 'intacta') : (modelo ? 'ALTERADO, verificar' : 'ALTERADA, verificar')}
  cópia           ${pagina.id} · ${pagina.status}${modelo ? ` · ${nomeDoModelo(pagina.meta?._elementor_template_type || tipoModelo)} · sem condições, não aparece no site` : ''}
  secção ${n}        antes: ${resumo(elementos[indice])}
                  depois: ${resumo(nova)}
  outras secções  iguais ao original (${elementos.length - 1})
  estado anterior ${copia.replace(/^.*[/\\]clientes[/\\]/, 'clientes/')}

  editar          ${l.editar}
${modelo ? `  modelos         ${site}/wp-admin/edit.php?post_type=elementor_library&tabs_group=library

  A cópia é um modelo novo, em rascunho e sem condições: o ${nomeDoModelo(tipoModelo)} do site continua o mesmo.
  Para a pôr no lugar dele, uma pessoa abre-a no Elementor (Modelos, ou Theme Builder no Elementor Pro), carrega em
  Publicar e escolhe as condições (por exemplo, todo o site), e tira as condições ao ${nomeDoModelo(tipoModelo)} antigo.
  O kit nunca faz este passo.
` : `  pré-visualizar  ${l.previsualizar}
  comparar com    ${original.link}
`}`);
