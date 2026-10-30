// Copia um modelo do Elementor (cabeçalho, rodapé, secção guardada) para um rascunho novo, para se trabalhar
// sem tocar no original. A cópia fica sem condições de exibição: não aparece em lado nenhum do site até uma
// pessoa a publicar e escolher onde aparece, no Theme Builder. O original só se lê.
// O estado do original fica guardado em clientes/<cliente>/copias/.
// uso: node scripts/copiar-modelo.mjs <id do modelo>
import { mkdirSync, writeFileSync } from 'node:fs';
import { wp, exigirLigacao, pasta, cliente, site } from './wp.mjs';

exigirLigacao();
const id = process.argv[2];
if (!/^\d+$/.test(id || '')) {
  console.error('uso: node scripts/copiar-modelo.mjs <id do modelo>');
  process.exit(1);
}

const original = await wp(`wp/v2/elementor_library/${id}?context=edit`);
const m = original.meta || {};
if (!m._elementor_data || m._elementor_data.length < 10) {
  console.error(`\n  O modelo ${id} não tem desenho do Elementor gravado. Parei sem escrever nada.\n`);
  process.exit(1);
}

mkdirSync(`${pasta}/copias`, { recursive: true });
const copia = `${pasta}/copias/modelo-${id}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
writeFileSync(copia, JSON.stringify({ id: original.id, titulo: original.title?.raw, estado: original.status, meta: m }, null, 2));

const hoje = new Date();
const dois = (n) => String(n).padStart(2, '0');
const titulo = `${original.title?.raw || `Modelo ${id}`} (cópia de trabalho ${dois(hoje.getDate())}/${dois(hoje.getMonth() + 1)}/${hoje.getFullYear()})`;
const corpo = {
  title: titulo,
  status: 'draft',
  meta: {
    _elementor_edit_mode: 'builder',
    _elementor_template_type: m._elementor_template_type,
    _elementor_data: m._elementor_data,
    _elementor_page_settings: m._elementor_page_settings || {},
    _elementor_conditions: [],
  },
};

let novo;
try {
  novo = await wp('wp/v2/elementor_library', { method: 'POST', body: corpo });
} catch (e) {
  // Alguns sites cortam a resposta depois de gravar: procurar a cópia antes de alguém voltar a correr.
  const achados = await wp(`wp/v2/elementor_library?search=${encodeURIComponent('cópia de trabalho')}&status=draft&context=edit&per_page=20`);
  novo = achados.find((t) => t.title?.raw === titulo);
  if (!novo) throw e;
  console.log('  O WordPress cortou a resposta, mas a cópia foi gravada.');
}

const gravado = (await wp(`wp/v2/elementor_library/${novo.id}?context=edit`));
if (gravado.status !== 'draft') {
  console.error(`\n  ATENÇÃO: a cópia ${novo.id} ficou em "${gravado.status}". Passar a rascunho no painel e avisar.\n`);
  process.exit(1);
}
if ((gravado.meta?._elementor_data || '').length < 10) {
  console.error(`\n  A cópia ${novo.id} foi criada mas o desenho não ficou gravado. O site não aceita esta escrita.\n`);
  process.exit(1);
}

console.log(`
  original        ${id} · ${original.title?.raw} · ${original.status} (não foi alterado)
  cópia           ${gravado.id} · ${gravado.title?.raw}
  estado          rascunho, sem condições de exibição
  tipo            ${gravado.meta?._elementor_template_type}
  original salvo  clientes/${cliente}/copias/${copia.split('/').pop()}
  editar          ${site}/wp-admin/post.php?post=${gravado.id}&action=elementor
`);
