// Reconhecimento do site, só leitura. Não escreve nada no WordPress.
// uso: node scripts/ligar.mjs
import { writeFileSync } from 'node:fs';
import { raiz, pasta, cliente, site, wp, indice as indiceDoSite, exigirLigacao, ambiente } from './wp.mjs';

exigirLigacao();
const linhas = [];
const alertas = [];
const regista = (k, v) => { linhas.push(`| ${k} | ${v} |`); console.log(`  ${k.padEnd(28)} ${v}`); };

console.log(`\n  cliente ${cliente}\n  site ${site}`);
const onde = ambiente();
console.log(`  ambiente ${onde}\n`);
if (onde === 'produção') {
  alertas.push('Este endereço parece o site real. O kit lê, mas não escreve aqui. Para gravar rascunhos no site real, a pessoa volta a correr node scripts/ligacao.mjs e confirma que é o site real.');
}
if (onde === 'live') {
  alertas.push('Ligado ao site real do cliente. O kit grava aqui só rascunhos: nunca publica, nunca apaga e nunca mexe em páginas publicadas.');
}

let indice;
try {
  indice = await indiceDoSite();
} catch (e) {
  console.error(`  ${e.status ? `A autenticação falhou: ${e.message} Voltar a correr node scripts/ligacao.mjs num terminal à parte, com o nome de utilizador (não o email) e a password de aplicação.` : e.message}\n`);
  process.exit(1);
}
regista('Nome', indice.name);
regista('Application Passwords', indice.authentication?.['application-passwords'] ? 'anunciadas' : 'NÃO anunciadas');
const ns = indice.namespaces || [];
regista('Elementor na API', ns.some((n) => n.startsWith('elementor/v1')) ? 'sim' : 'não');

let eu;
try {
  eu = await wp('wp/v2/users/me?context=edit');
} catch (e) {
  console.error(`\n  A autenticação falhou: ${e.message}`);
  console.error('  Voltar a correr node scripts/ligacao.mjs num terminal à parte, com o nome de utilizador (não o email) e a password de aplicação.');
  console.error('  Se estiverem certos e continuar a falhar, o servidor pode estar a cortar a autenticação: enviar este erro à Flowzi.\n');
  process.exit(1);
}
const caps = eu.capabilities || {};
regista('Utilizador', `${eu.username} (${(eu.roles || []).join(', ')})`);
regista('Pode editar páginas', caps.edit_pages ? 'sim' : 'NÃO');
if (!caps.edit_pages) alertas.push('Este utilizador não pode editar páginas. Pedir o papel de Editor.');
if ((eu.roles || []).includes('administrator')) {
  // Funciona, mas um administrador também instala plugins, apaga e publica: se algo correr mal, o estrago é maior.
  alertas.push('Esta ligação é de um administrador. Funciona, mas o recomendado é um utilizador Editor só para isto: pedir a quem gere o site e voltar a ligar quando houver.');
}

const esquema = await wp('wp/v2/pages', { method: 'OPTIONS' });
const metaRest = Object.keys(esquema.schema?.properties?.meta?.properties || {});
const escreveElementor = metaRest.includes('_elementor_data');
regista('Escrita de _elementor_data', escreveElementor ? 'disponível na REST' : 'NÃO disponível');
// Os modelos de página que o site já usa (a lista completa só a vê um administrador). Servem às páginas em blocos:
// um modelo sem título evita o título do tema por cima do herói.
let modelos = [];
try {
  const paginas = await wp('wp/v2/pages?context=edit&per_page=100&status=publish,draft&_fields=template');
  modelos = [...new Set(paginas.map((p) => p.template).filter(Boolean))];
} catch {}
regista('Modelos de página em uso', modelos.length ? modelos.join(', ') : 'só o do tema');

const html = await (await fetch(site + '/', { redirect: 'manual' })).text();
const gerador = [...html.matchAll(/<meta name="generator" content="([^"]+)"/g)].map((m) => m[1]);
const wpVer = gerador.find((g) => g.startsWith('WordPress'));
const elVer = gerador.find((g) => g.startsWith('Elementor'));
regista('WordPress', wpVer?.replace('WordPress ', '') || 'escondido');
regista('Elementor', elVer?.split(';')[0].replace('Elementor ', '') || 'não detectado na página inicial');
if (/css_print_method-internal/.test(elVer || '')) regista('CSS do Elementor', 'interno (escrito na página)');
// O construtor, pela página inicial: o wp-block- sozinho não conta, porque aparece em quase todos os sites.
const construtor = /elementor-|content="Elementor/.test(html) ? 'Elementor'
  : /et_pb_|et-db/.test(html) ? 'Divi' : /brxe-|bricks-/.test(html) ? 'Bricks'
  : /ct-section|oxy-/.test(html) ? 'Oxygen' : /fl-builder|fl-row/.test(html) ? 'Beaver Builder'
  : /vc_row|wpb_/.test(html) ? 'WPBakery' : /wp-block-/.test(html) ? 'blocos do WordPress (Gutenberg)' : 'não detectado';
regista('Construtor', construtor);
if (!escreveElementor) {
  alertas.push(construtor === 'Elementor'
    ? 'O Elementor deste site não expõe _elementor_data na REST: as páginas em Elementor não se gravam aqui. Dá para fazer páginas em blocos do WordPress (criar-pagina-blocos.mjs), que abrem no editor normal.'
    : 'O site não usa Elementor: as páginas fazem-se em blocos do WordPress (peças de scripts/blocos.mjs, gravadas com criar-pagina-blocos.mjs) e os artigos com criar-artigo.mjs.');
}
if (['Divi', 'Bricks', 'Oxygen', 'Beaver Builder'].includes(construtor)) {
  alertas.push(`O site parece usar ${construtor}. O kit não grava páginas nesse construtor; as páginas novas em blocos abrem no editor normal do WordPress, não no ${construtor}.`);
}
if (/js_composer|vc_row|wpb_/.test(html)) {
  regista('WPBakery', 'presente na página inicial');
  alertas.push('O site também usa WPBakery. Páginas feitas em WPBakery não se alteram com este kit.');
}
try {
  const plugins = await wp('wp/v2/plugins');
  const activos = plugins.filter((p) => p.status === 'active');
  regista('Plugins activos', activos.length);
  for (const p of activos) linhas.push(`| plugin | ${p.name} ${p.version} |`);
} catch (e) {
  regista('Plugins', e.status === 403 ? 'sem permissão para listar (normal num Editor)' : e.message);
}

try {
  const g = await wp('elementor/v1/globals');
  const cores = Object.values(g.colors || {}).map((c) => `${c.title} ${c.value}`).join(' · ');
  const letras = Object.values(g.typography || {}).map((t) => `${t.title} ${t.value?.typography_font_family}`).join(' · ');
  regista('Kit do Elementor, cores', cores || 'vazio');
  regista('Kit do Elementor, letras', letras || 'vazio');
  alertas.push('As cores do kit do Elementor nem sempre são as que o site usa. Confirmar no site real antes de preencher o marca.json.');
} catch (e) {
  regista('Kit do Elementor', `não lido (${e.status || e.message})`);
}

const ficheiro = `${pasta || raiz}/levantamento.md`;
writeFileSync(ficheiro, `# ${indice.name} · ${site}

Levantamento de ${new Date().toLocaleDateString('pt-PT')}, feito por scripts/ligar.mjs (só leitura).

| Campo | Valor |
|---|---|
${linhas.join('\n')}

## Alertas

${alertas.length ? alertas.map((a) => `- ${a}`).join('\n') : '- Nenhum.'}
`);

console.log(alertas.length ? `\n  Alertas:\n${alertas.map((a) => `  - ${a}`).join('\n')}` : '\n  Sem alertas.');
console.log(`\n  levantamento guardado em clientes/${cliente}/levantamento.md\n`);
