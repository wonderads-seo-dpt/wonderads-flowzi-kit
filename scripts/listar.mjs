// Lista as páginas e os artigos publicados do site, com o endereço. Só leitura. Serve para a ligação interna.
// uso: node scripts/listar.mjs
import { wp, exigirLigacao } from './wp.mjs';

exigirLigacao();
for (const [tipo, nome] of [['pages', 'Páginas publicadas'], ['posts', 'Artigos publicados']]) {
  const itens = await wp(`wp/v2/${tipo}?status=publish&per_page=100&_fields=id,title,link`);
  console.log(`\n  ${nome} (${itens.length})`);
  for (const i of itens) console.log(`  ${String(i.id).padStart(5)}  ${i.title.rendered.replace(/<[^>]+>/g, '')}  ${i.link}`);
}
console.log('');
