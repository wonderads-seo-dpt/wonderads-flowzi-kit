// Lista as páginas e os artigos da loja Shopify do cliente activo, escondidos e publicados. Só leitura.
// uso: node scripts/shopify-listar.mjs
import { exigirLoja, ler, numero } from './shopify.mjs';

exigirLoja();
const estado = (c) => (c.isPublished ? 'publicada' : 'escondida');
const paginas = (await ler('paginas')).pages.nodes;
const artigos = (await ler('artigos')).articles.nodes;
console.log(`\n  Páginas (${paginas.length})`);
for (const p of paginas) console.log(`  ${numero(p.id).padEnd(14)} ${estado(p).padEnd(10)} ${p.title}  /pages/${p.handle}`);
console.log(`\n  Artigos (${artigos.length})`);
for (const a of artigos) console.log(`  ${numero(a.id).padEnd(14)} ${(a.isPublished ? 'publicado' : 'escondido').padEnd(10)} ${a.title}  · ${a.blog?.title || ''}`);
console.log('');
