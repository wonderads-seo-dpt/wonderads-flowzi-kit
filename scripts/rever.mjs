// Revisão automática de uma página ou artigo: em Elementor lê o _elementor_data, em blocos lê o texto do artigo. Só leitura.
// Diz o que verificou e o que não conseguiu verificar. O telemóvel vê-se no navegador.
// uso: node scripts/rever.mjs <id|endereço>
import { exigirLigacao, paginaEmEdicao, lerElementor, ligacoes } from './wp.mjs';

exigirLigacao();
const id = process.argv[2];
if (!id) {
  console.error('uso: node scripts/rever.mjs <id|endereço>');
  process.exit(1);
}

const pagina = await paginaEmEdicao(id);
const elementos = lerElementor(pagina);
const bloqueia = [];
const corrigir = [];
const melhorias = [];

if (pagina.status !== 'draft') corrigir.push(`A página está em "${pagina.status}". O trabalho do kit é sempre em rascunho.`);
// Artigos feitos em blocos (criar-artigo.mjs) não têm _elementor_data: revê-se o texto do artigo.
const blocos = !elementos.length ? (pagina.content?.raw || '').replace(/<script[\s\S]*?<\/script>/gi, '') : '';
if (!elementos.length && !blocos.trim()) bloqueia.push('A página não tem conteúdo.');

const widgets = [];
let fundo = 0;
const andar = (els, nivel) => {
  for (const e of els) {
    if (e.elType === 'container') fundo = Math.max(fundo, nivel);
    if (e.elType === 'widget') widgets.push(e);
    andar(e.elements || [], nivel + 1);
  }
};
andar(elementos, 1);

const limpar = (t = '') => t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const textos = widgets.flatMap((w) => {
  const s = w.settings || {};
  return [s.title, s.editor, s.text, s.title_text, s.description_text,
    ...(s.tabs || []).flatMap((t) => [t.tab_title, t.tab_content]),
    ...(s.icon_list || []).map((i) => i.text)].filter(Boolean).map(limpar);
});

if (blocos) textos.push(limpar(blocos));
let titulos = widgets.filter((w) => w.widgetType === 'heading' && /^h[1-6]$/.test(w.settings?.header_size || 'h2'))
  .map((w) => Number((w.settings?.header_size || 'h2').slice(1)));
if (blocos) titulos = [...blocos.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
// Num artigo, o título do WordPress aparece como h1, a não ser que o Elementor o esconda. Numa página em blocos
// (criar-pagina-blocos.mjs), o tema mostra o título como h1, salvo num modelo sem título: aí o h1 está no conteúdo.
if (pagina.type === 'post' && (blocos || pagina.meta?._elementor_page_settings?.hide_title !== 'yes')) titulos.unshift(1);
else if (pagina.type === 'page' && blocos && !titulos.includes(1)) titulos.unshift(1);
const h1 = titulos.filter((n) => n === 1).length;
if (h1 === 0) bloqueia.push('Não há nenhum h1.');
if (h1 > 1) bloqueia.push(`Há ${h1} títulos h1. Deve haver um.`);
for (let i = 1; i < titulos.length; i++) {
  if (titulos[i] > titulos[i - 1] + 1) { corrigir.push(`Salto na hierarquia de títulos: h${titulos[i - 1]} seguido de h${titulos[i]}.`); break; }
}
if (fundo > 3) corrigir.push(`Containers com ${fundo} níveis de profundidade. O máximo combinado é 3.`);

const codigo = widgets.filter((w) => ['html', 'shortcode'].includes(w.widgetType));
if (codigo.length) corrigir.push(`${codigo.length} widget(s) de código ou shortcode. Confirmar que não estão a fazer o trabalho de um widget real.`);

const contadores = widgets.filter((w) => w.widgetType === 'counter');
for (const c of contadores) {
  if (Number(c.settings?.ending_number) >= 1000 && c.settings?.thousand_separator_char !== ' ') {
    bloqueia.push(`Contador com ${c.settings.ending_number}: o Elementor escreve "${Number(c.settings.ending_number).toLocaleString('en-US')}" por defeito. Definir o separador de milhares como espaço, ou usar número fixo.`);
  }
}
// Animações de entrada são permitidas (decisão de 14/10/2026); só se lembra de as ver no navegador. Os contadores continuam a corrigir.
const animados = widgets.filter((w) => w.settings?._animation && w.settings._animation !== 'none').length;
if (animados) melhorias.push(`${animados} elemento(s) com animação de entrada. Ver no navegador, também no telemóvel, que aparecem depois de rolar.`);
if (contadores.length) corrigir.push(`${contadores.length} contador(es) dependem de animação para aparecer. Confirmar no navegador que aparecem depois de rolar: em alguns sites ficam invisíveis.`);

const imagens = widgets.filter((w) => w.widgetType === 'image');
const semAlt = imagens.filter((w) => !w.settings?.image?.alt).length + [...blocos.matchAll(/<img\b(?![^>]*\balt="[^"]+")(?![^>]*wp-block-cover__image-background)[^>]*>/gi)].length;
if (semAlt) bloqueia.push(`${semAlt} imagem(ns) sem texto alternativo.`);

const todo = textos.join('\n');
const us = todo.match(/\b\d{1,3}(,\d{3})+(\.\d+)?\b/g);
if (us) bloqueia.push(`Números em formato americano: ${[...new Set(us)].join(', ')}.`);
if (/[$€]\s?\d/.test(todo)) corrigir.push('Símbolo de moeda antes do valor. Em português vem depois: 1 234,56 €.');
if (/\b\d{1,2}\/\d{1,2}\/\d{4}\b/.test(todo) && /\b(0?[1-9]|1[0-2])\/(1[3-9]|2\d|3[01])\/\d{4}\b/.test(todo)) bloqueia.push('Data em formato americano (mês/dia).');
if (/\S\s[—–]\s\S/.test(todo)) corrigir.push('Travessão a ligar orações. Usar vírgula, dois pontos ou duas frases.');
const vagos = widgets.filter((w) => w.widgetType === 'button' && /^(clique aqui|saber mais|saiba mais|ver mais)$/i.test(limpar(w.settings?.text)));
if (vagos.length) melhorias.push('Botão com texto vago ("Saber mais", "Clique aqui"). Dizer o que acontece a seguir.');
const botoesSemLink = widgets.filter((w) => w.widgetType === 'button' && !w.settings?.link?.url);
// Em blocos: botões sem destino, de texto vago, e âncoras sem um elemento com esse id.
const botoesBlocos = [...blocos.matchAll(/<a\b([^>]*)class="[^"]*wp-block-button__link[^"]*"([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => ({ attrs: m[1] + m[2], texto: limpar(m[3]) }));
const semDestino = botoesBlocos.filter((x) => !/\bhref="[^"]+"/.test(x.attrs)).length;
if (semDestino) bloqueia.push(`${semDestino} botão(ões) sem destino.`);
if (botoesBlocos.some((x) => /^(clique aqui|saber mais|saiba mais|ver mais)$/i.test(x.texto)) && !vagos.length) melhorias.push('Botão com texto vago ("Saber mais", "Clique aqui"). Dizer o que acontece a seguir.');
const idsBlocos = new Set([...blocos.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const ancorasBlocos = botoesBlocos.map((x) => (x.attrs.match(/\bhref="(#[^"]+)"/) || [])[1]).filter((h) => h && !idsBlocos.has(h.slice(1)));
if (ancorasBlocos.length) corrigir.push(`Botão(ões) para ${[...new Set(ancorasBlocos)].join(', ')}, que não existe(m) na página. Pôr o destino certo (contactos, telefone, formulário).`);
if (botoesSemLink.length) bloqueia.push(`${botoesSemLink.length} botão(ões) sem destino.`);
// Botões que apontam para uma âncora (#marcar) só funcionam se houver um elemento com esse ID na página.
const ids = new Set();
const recolher = (els) => els.forEach((e) => { if (e.settings?._element_id) ids.add(e.settings._element_id); recolher(e.elements || []); });
recolher(elementos);
const ancorasPartidas = widgets.filter((w) => w.widgetType === 'button' && /^#./.test(w.settings?.link?.url || '') && !ids.has(w.settings.link.url.slice(1)))
  .map((w) => w.settings.link.url);
if (ancorasPartidas.length) corrigir.push(`Botão(ões) para ${[...new Set(ancorasPartidas)].join(', ')}, que não existe(m) na página. Pôr o destino certo (contactos, telefone, formulário).`);
const porConfirmar = (todo.match(/\[[^\]]*por confirmar[^\]]*\]/gi) || []);
if (porConfirmar.length) bloqueia.push(`${porConfirmar.length} ponto(s) [por confirmar] no texto: preencher com o cliente antes de mostrar.`);

const titulo = pagina.title?.raw || '';
if (titulo.length < 30 || titulo.length > 60) melhorias.push(`Título da página com ${titulo.length} caracteres. O ideal para pesquisa é 50 a 60, definido no plugin de SEO.`);
if (pagina.slug && (pagina.slug.length > 60 || /-(de|da|do|e|em|para|com)-/.test(pagina.slug))) melhorias.push(`Endereço "${pagina.slug}" pode encurtar.`);

const mostra = (nome, lista) => {
  console.log(`\n  ${nome} (${lista.length})`);
  for (const i of lista) console.log(`  - ${i}`);
};
console.log(blocos ? `\n  ${titulo} · ${pagina.status} · em blocos do WordPress · ${(blocos.match(/<!-- wp:[a-z]/g) || []).length} blocos` : `\n  ${titulo} · ${pagina.status} · ${elementos.length} secções · ${widgets.length} widgets`);
mostra('Bloqueia a publicação', bloqueia);
mostra('Corrigir antes de mostrar ao cliente', corrigir);
mostra('Melhorias', melhorias);
console.log(`
  Não verificado por este script, ver à mão:
  - telemóvel: abrir ${blocos ? `${ligacoes(pagina.id, pagina.type === 'post').previsualizar} no telemóvel ou com o browser estreito` : `${ligacoes(pagina.id, pagina.type === 'post').editar} e carregar no ícone do telemóvel`}
  - contraste de cores, meta description e dados estruturados (plugin de SEO)
  - ligações internas a apontar para páginas que existem
  - testemunhos com consentimento e alegações do sector
`);
process.exit(bloqueia.length ? 2 : 0);
