// Lista as páginas e os artigos publicados do site, com o endereço. Só leitura. Serve para a ligação interna.
// Com --modelos, lista os modelos do Elementor (cabeçalho, rodapé, secções guardadas, popups), com o tipo e o número
// que o seccao.mjs aceita.
// uso: node scripts/listar.mjs
//      node scripts/listar.mjs --modelos
import { wp, exigirLigacao, nomeDoModelo, semAcessoModelos } from './wp.mjs';

exigirLigacao();
const limpo = (t) => String(t || '').replace(/<[^>]+>/g, '');

if (process.argv[2] === '--modelos') {
  let itens;
  try {
    itens = await wp('wp/v2/elementor_library?context=edit&status=publish,draft,pending,private,future&per_page=100&orderby=title&order=asc&_fields=id,title,status,meta._elementor_template_type,meta._elementor_conditions');
  } catch (e) {
    if (e.status !== 401 && e.status !== 403 && e.status !== 404) throw e;
    console.error(e.status === 404 ? '\n  Este site não tem modelos do Elementor (o Elementor está instalado?).\n' : `\n  ${semAcessoModelos}\n`);
    process.exit(1);
  }
  // O Kit do Elementor (cores e letras de todo o site) também vive aqui, mas não é um modelo que se copie.
  const modelos = itens.filter((m) => m.meta?._elementor_template_type !== 'kit');
  const estados = { publish: 'publicado', draft: 'rascunho', pending: 'pendente', private: 'privado', future: 'agendado' };
  console.log(`\n  Modelos do Elementor (${modelos.length})`);
  for (const m of modelos) {
    const c = m.meta?._elementor_conditions;
    const onde = Array.isArray(c) ? ` · em uso: ${c.length ? c.map((x) => (x === 'include/general' ? 'todo o site' : x)).join(', ') : 'nenhuma condição'}` : '';
    console.log(`  ${String(m.id).padStart(5)}  ${nomeDoModelo(m.meta?._elementor_template_type).padEnd(18)} ${(estados[m.status] || m.status).padEnd(10)} ${limpo(m.title?.raw ?? m.title?.rendered)}${onde}`);
  }
  console.log(modelos.length ? '\n  Ver as secções de um: node scripts/seccao.mjs --listar <número>\n' : '');
  process.exit(0);
}

for (const [tipo, nome] of [['pages', 'Páginas publicadas'], ['posts', 'Artigos publicados']]) {
  const itens = await wp(`wp/v2/${tipo}?status=publish&per_page=100&_fields=id,title,link`);
  console.log(`\n  ${nome} (${itens.length})`);
  for (const i of itens) console.log(`  ${String(i.id).padStart(5)}  ${limpo(i.title.rendered)}  ${i.link}`);
}
console.log('');
