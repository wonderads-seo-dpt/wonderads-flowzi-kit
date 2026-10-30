// Revisão automática de uma página ou artigo: em Elementor lê o _elementor_data, em blocos lê o texto do artigo. Só leitura.
// Diz o que verificou e o que não conseguiu verificar. O telemóvel vê-se no navegador.
// Também o SEO (ver /seo): palavras do texto visível contra o mínimo do cliente, a palavra-chave (h1, início do texto,
// endereço, título para o Google, repetição), estilos dos títulos e ligações internas.
// uso: node scripts/rever.mjs <id|endereço> [--chave "palavra-chave"] [--palavras N | --tipo destino]
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { exigirLigacao, paginaEmEdicao, lerElementor, ligacoes, cliente, pasta, site } from './wp.mjs';
import { titulosElementor, variantes } from './titulos-estilo.mjs';

// O que vale no kit. Cada cliente muda só o que for diferente em clientes/<cliente>/seo.json (ver /seo).
const PADRAO = {
  minimo_palavras: 1500,
  tipos: { destino: 0, contactos: 0 },
  densidade_maxima: 2.5,
  minimo_ligacoes_internas: 2,
  titulo: [50, 60],
  descricao: [140, 160],
  paginas: {},
};

const USO = 'uso: node scripts/rever.mjs <id|endereço> [--chave "palavra-chave"] [--palavras N | --tipo destino]';
exigirLigacao();
const opcoes = {};
const posicionais = [];
const args = process.argv.slice(2);
let argsMal = false;
for (let i = 0; i < args.length; i++) {
  const m = args[i].match(/^--(chave|palavras|tipo)(?:=(.*))?$/s);
  if (m) opcoes[m[1]] = m[2] ?? args[++i];
  else if (args[i].startsWith('--')) argsMal = true;
  else posicionais.push(args[i]);
}
const id = posicionais[0];
if (!id || argsMal || Object.values(opcoes).some((v) => v === undefined) || (opcoes.palavras !== undefined && !/^\d+$/.test(opcoes.palavras))) {
  console.error(USO);
  process.exit(1);
}

let doCliente = {};
if (existsSync(`${pasta}/seo.json`)) {
  try { doCliente = JSON.parse(readFileSync(`${pasta}/seo.json`, 'utf8').replace(/^﻿/, '')); } catch (e) {
    throw new Error(`clientes/${cliente}/seo.json não é JSON válido (${e.message}). Corrigir o ficheiro e repetir.`);
  }
}
const cfg = { ...PADRAO, ...doCliente, tipos: { ...PADRAO.tipos, ...doCliente.tipos } };

const pagina = await paginaEmEdicao(id);
const elementos = lerElementor(pagina);
const bloqueia = [];
const corrigir = [];
const melhorias = [];

if (pagina.status !== 'draft') corrigir.push(`A página está em "${pagina.status}". O trabalho do kit é sempre em rascunho.`);
// Artigos feitos em blocos (criar-artigo.mjs) não têm _elementor_data: revê-se o texto do artigo.
const blocos = !elementos.length ? (pagina.content?.raw || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '') : '';
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
const textosDe = (w) => {
  const s = w.settings || {};
  return [s.title, s.editor, s.text, s.title_text, s.description_text,
    ...(s.tabs || []).flatMap((t) => [t.tab_title, t.tab_content]),
    ...(s.icon_list || []).map((i) => i.text)].filter(Boolean);
};
const textos = widgets.flatMap((w) => textosDe(w).map(limpar));

if (blocos) textos.push(limpar(blocos));
// Os títulos do Elementor: o widget de título e os títulos das caixas (h3 por defeito) e dos acordeões, se forem h1 a h6.
const nivelDe = (w) => {
  const s = w.settings || {};
  const t = w.widgetType === 'heading' ? s.header_size || 'h2'
    : ['icon-box', 'image-box'].includes(w.widgetType) ? s.title_size || 'h3'
      : ['accordion', 'toggle'].includes(w.widgetType) ? s.title_html_tag : '';
  return /^h[1-6]$/.test(t || '') ? Number(t[1]) : 0;
};
let titulos = widgets.flatMap((w) => Array(['accordion', 'toggle'].includes(w.widgetType) ? (w.settings?.tabs || []).length : 1).fill(nivelDe(w))).filter(Boolean);
if (blocos) titulos = [...blocos.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
// Num artigo, o título do WordPress aparece como h1, a não ser que o Elementor o esconda. Numa página em blocos
// (criar-pagina-blocos.mjs), o tema mostra o título como h1, salvo num modelo sem título: aí o h1 está no conteúdo.
const tituloNoTopo = (pagina.type === 'post' && (blocos || pagina.meta?._elementor_page_settings?.hide_title !== 'yes'))
  || (pagina.type === 'page' && Boolean(blocos) && !titulos.includes(1));
if (tituloNoTopo) titulos.unshift(1);
const h1 = titulos.filter((n) => n === 1).length;
if (h1 === 0) bloqueia.push('Não há nenhum h1.');
if (h1 > 1) bloqueia.push(`Há ${h1} títulos h1. Deve haver um.`);
for (let i = 1; i < titulos.length; i++) {
  if (titulos[i] > titulos[i - 1] + 1) { corrigir.push(`Salto na hierarquia de títulos: h${titulos[i - 1]} seguido de h${titulos[i]}.`); break; }
}
if (fundo > 3) corrigir.push(`Containers com ${fundo} níveis de profundidade. O máximo combinado é 3.`);

// Títulos do mesmo nível com estilos diferentes (só Elementor), com as mesmas contas do titulos.mjs: entram as caixas
// com ícone ou imagem, e um título claro sobre fundo escuro não conta como outro estilo.
const NOMES = { familia: 'família', espacamento: 'espaçamento', maiusculas: 'maiúsculas', italico: 'itálico', telemovel: 'telemóvel' };
const valor = (k, v) => (v === undefined ? 'do tema' : typeof v === 'number' ? `${v}${k === 'altura' ? 'em' : 'px'}` : String(v));
for (const { nivel, estilos } of variantes(titulosElementor(elementos))) {
  if (estilos.length < 2) continue;
  const campos = [...new Set(estilos.flatMap((v) => Object.keys(v.estilo)))];
  const diferem = campos.map((k) => [NOMES[k] || k, [...new Set(estilos.map((v) => valor(k, v.estilo[k])))]]).filter(([, v]) => v.length > 1);
  corrigir.push(`Títulos ${nivel} com ${estilos.length} estilos diferentes: uniformizar pelo marca.json → titulos (página feita pelo kit: gravar outra vez o ficheiro dela; outra página Elementor: node scripts/titulos.mjs ${pagina.id}).${diferem.length ? ` Diferem em: ${diferem.map(([nome, v]) => `${nome} (${v.join(', ')})`).join('; ')}.` : ''}`);
}

const codigo = widgets.filter((w) => ['html', 'shortcode'].includes(w.widgetType));
if (codigo.length) corrigir.push(`${codigo.length} widget(s) de código ou shortcode. Confirmar que não estão a fazer o trabalho de um widget real.`);

const contadores = widgets.filter((w) => w.widgetType === 'counter');
for (const c of contadores) {
  if (Number(c.settings?.ending_number) >= 1000 && c.settings?.thousand_separator_char !== ' ') {
    bloqueia.push(`Contador com ${c.settings.ending_number}: o Elementor escreve "${Number(c.settings.ending_number).toLocaleString('en-US')}" por defeito. Definir o separador de milhares como espaço, ou usar número fixo.`);
  }
}
const animados = widgets.filter((w) => w.settings?._animation && w.settings._animation !== 'none').length
  + contadores.length;
if (animados) corrigir.push(`${animados} elemento(s) dependem de animação para aparecer (entrada ou contador). Confirmar no navegador que aparecem depois de rolar: em alguns sites ficam invisíveis.`);

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

// --- SEO ---
// O texto visível: sem etiquetas, comentários de bloco, estilo nem script (já tirados), e com as entidades (&nbsp;) desfeitas.
// As etiquetas de linha saem sem espaço (<strong>Implan</strong>tes é uma palavra), as de bloco com espaço.
const ENTIDADES = {
  nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', sbquo: '‚', bdquo: '„', euro: '€', ordm: 'º', ordf: 'ª', deg: '°',
  middot: '·', bull: '•', copy: '©', reg: '®', trade: '™', times: '×', iexcl: '¡', iquest: '¿', shy: '', thinsp: ' ', ensp: ' ', emsp: ' ',
};
// As letras com acento: &aacute; &Ccedil; &otilde; ...
for (const [nome, sinal] of [['acute', '\u0301'], ['grave', '\u0300'], ['circ', '\u0302'], ['tilde', '\u0303'], ['uml', '\u0308'], ['cedil', '\u0327']]) {
  for (const l of 'aeiouycnAEIOUYCN') {
    const c = (l + sinal).normalize('NFC');
    if (c.length === 1) ENTIDADES[l + nome] = c;
  }
}
const LINHA = 'a|abbr|b|bdi|bdo|cite|code|data|dfn|em|i|kbd|mark|q|s|samp|small|span|strong|sub|sup|time|u|var';
const visivel = (t = '') => String(t).replace(/<!--[\s\S]*?-->/g, ' ').replace(new RegExp(`</?(?:${LINHA})(?=[\\s/>])[^>]*>`, 'gi'), '').replace(/<[^>]+>/g, ' ')
  .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] !== '#') return ENTIDADES[e] ?? ENTIDADES[e.toLowerCase()] ?? m;
    const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1));
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ' ';
  })
  .replace(/\s+/g, ' ').trim();
// Um número com espaço nos milhares (1 500, 1 234,56) é uma palavra.
const palavrasDe = (t) => t.replace(/(?<![\d.,])\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?!\d)/g, (m) => m.replace(/\s/g, ''))
  .split(/\s+/).filter((p) => /[\p{L}\p{N}]/u.test(p));
const pecas = widgets.map((w) => ({ texto: textosDe(w).map(visivel).join(' '), h1: nivelDe(w) === 1 }));
const tituloPagina = visivel(pagina.title?.raw || '');
const textoVisivel = [tituloNoTopo ? tituloPagina : '', blocos ? visivel(blocos) : pecas.map((p) => p.texto).join(' ')].join(' ');
const palavras = palavrasDe(textoVisivel).length;
// O início do texto, sem o h1: o h1 já se verifica à parte.
const inicio = palavrasDe(blocos ? visivel(blocos.replace(/<h1\b[\s\S]*?<\/h1>/gi, ' ')) : pecas.filter((p) => !p.h1).map((p) => p.texto).join(' ')).slice(0, 100).join(' ');
const textosH1 = [...(tituloNoTopo ? [tituloPagina] : []),
  ...(blocos ? [...blocos.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => visivel(m[1])) : pecas.filter((p) => p.h1).map((p) => p.texto))];

// A configuração da página, por ordem: o comando, o seo: { ... } do ficheiro que a gravou (encontrado pelo número em
// <ficheiro>.wp.json), e as paginas do seo.json do cliente. O ficheiro lê-se como texto: não corre.
const slug = pagina.slug || pagina.generated_slug || '';
const doFicheiro = (() => {
  for (const sub of ['paginas', 'artigos']) {
    const dir = `${pasta}/${sub}`;
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.wp.json'))) {
      let reg = {};
      try { reg = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); } catch { continue; }
      const nome = f.replace(/\.wp\.json$/, '.mjs');
      if (Number(reg[site]) !== pagina.id || !existsSync(`${dir}/${nome}`)) continue;
      const seo = (readFileSync(`${dir}/${nome}`, 'utf8').match(/\bseo\s*:\s*\{([^{}]*)\}/) || [])[1] || '';
      const valor = (k) => {
        const m = seo.match(new RegExp(`\\b${k}\\s*:\\s*(?:(['"])((?:\\\\.|(?!\\1)[^\\\\])*)\\1|(\\d+))`));
        return m ? m[3] ?? m[2].replace(/\\(.)/g, '$1') : undefined;
      };
      return { origem: `${sub}/${nome}`, chave: valor('chave'), tipo: valor('tipo'), palavras: valor('palavras'), titulo: valor('titulo'), descricao: valor('descricao') };
    }
  }
  return { origem: '' };
})();
const naConfig = cfg.paginas?.[slug] || {};
const fonte = (k) => (opcoes[k] !== undefined ? [opcoes[k], 'do comando']
  : doFicheiro[k] !== undefined ? [doFicheiro[k], `de ${doFicheiro.origem}`]
    : naConfig[k] !== undefined ? [naConfig[k], 'do seo.json'] : [undefined, '']);
// O Rank Math pode mostrar a palavra-chave e o título à API; com variáveis (%title%) não dá para ler.
const rm = pagina.meta || {};
const semVariaveis = (t) => (typeof t === 'string' && t.trim() && !t.includes('%') ? t : '');
let [chave, origemChave] = fonte('chave');
if (chave === undefined && semVariaveis(rm.rank_math_focus_keyword)) [chave, origemChave] = [rm.rank_math_focus_keyword.split(',')[0], 'do Rank Math'];
chave = String(chave ?? '').trim();

const [tipoPedido] = fonte('tipo');
const tipo = tipoPedido || (/^contact/.test(slug) ? 'contactos' : 'seo');
if (tipo !== 'seo' && !(tipo in cfg.tipos)) {
  throw new Error(`Tipo de página "${tipo}" desconhecido. Tipos: seo, ${Object.keys(cfg.tipos).join(', ')} (clientes/${cliente}/seo.json → tipos).`);
}
const [palavrasPedidas, origemPalavras] = fonte('palavras');
const minimo = Number(palavrasPedidas ?? (tipo === 'seo' ? cfg.minimo_palavras : cfg.tipos[tipo]));
if (!Number.isFinite(minimo)) throw new Error(`O mínimo de palavras tem de ser um número (clientes/${cliente}/seo.json).`);
const origemMinimo = palavrasPedidas !== undefined ? origemPalavras
  : (tipo === 'seo' ? doCliente.minimo_palavras : doCliente.tipos?.[tipo]) !== undefined ? 'do seo.json' : 'do kit';
const milhares = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const pct = (n) => n.toFixed(1).replace('.', ',');
if (minimo > 0 && palavras < minimo) {
  corrigir.push(`Texto com ${milhares(palavras)} palavras. O mínimo ${tipo === 'seo' ? 'de uma página de SEO' : `de uma página "${tipo}"`} é ${milhares(minimo)} (${origemMinimo}): acrescentar profundidade, exemplos e perguntas frequentes, nunca palha. Página de destino ou de contactos: --tipo destino.`);
}

const normal = (t) => visivel(t).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
// Singular e plural contam como a mesma palavra (implante, implantes; extração, extrações; dor, dores); acentos e
// maiúsculas não contam. As palavras curtas (mais, pais, dois) só perdem o s, como sempre.
const singular = (p) => (p === 'maes' ? 'mae' : p.length <= 3 ? p
  : /(oes|aes|aos)$/.test(p) ? `${p.slice(0, -3)}ao`
    : p.length > 4 && /ais$/.test(p) ? `${p.slice(0, -3)}al`
      : p.length > 4 && /eis$/.test(p) ? `${p.slice(0, -3)}el`
        : p.length > 4 && /ois$/.test(p) ? `${p.slice(0, -3)}ol`
          : /ns$/.test(p) ? `${p.slice(0, -2)}m`
            : /[aeiou][rz]es$/.test(p) ? p.slice(0, -2)
              // fácil e fáceis, útil e úteis: o -il e o -el ficam iguais.
              : p.length > 4 && /il$/.test(p) ? `${p.slice(0, -2)}el`
                : p.replace(/s$/, ''));
const termos = (t) => normal(t).split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(singular);
const LIGACAO = new Set(['a', 'o', 'as', 'os', 'ao', 'aos', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'um', 'uma']);
const termosChave = termos(chave);
const vezes = (lista) => {
  let n = 0;
  for (let i = 0; termosChave.length && i + termosChave.length <= lista.length; i++) if (termosChave.every((c, j) => lista[i + j] === c)) n++;
  return n;
};
// A frase inteira, ou todas as palavras que contam, em qualquer ordem ("implantes em Ermesinde" → "Ermesinde: implantes").
const temChave = (t) => {
  const l = termos(t);
  const essenciais = termosChave.filter((c) => !LIGACAO.has(c));
  return vezes(l) > 0 || (essenciais.length > 0 && essenciais.every((c) => l.includes(c)));
};

// O título e a descrição para o Google: do plugin de SEO, se a API os mostrar (Yoast, Rank Math), ou do ficheiro da página.
const yoast = pagina.yoast_head_json || {};
const [tituloGoogle, origemTitulo] = yoast.title ? [visivel(yoast.title), 'Yoast'] : semVariaveis(rm.rank_math_title) ? [rm.rank_math_title, 'Rank Math']
  : doFicheiro.titulo ? [doFicheiro.titulo, doFicheiro.origem] : ['', ''];
const [descricao, origemDescricao] = yoast.description ? [visivel(yoast.description), 'Yoast'] : semVariaveis(rm.rank_math_description) ? [rm.rank_math_description, 'Rank Math']
  : doFicheiro.descricao ? [doFicheiro.descricao, doFicheiro.origem] : pagina.type === 'post' && pagina.excerpt?.raw ? [visivel(pagina.excerpt.raw), 'resumo do artigo'] : ['', ''];

let densidade = 0;
if (chave) {
  if (!textosH1.some(temChave)) corrigir.push(`A palavra-chave "${chave}" não está no h1.`);
  if (!temChave(inicio)) corrigir.push(`A palavra-chave "${chave}" não está nas primeiras 100 palavras do texto (sem contar o h1). Pô-la na resposta directa do início.`);
  if (!temChave(tituloGoogle || tituloPagina)) corrigir.push(`A palavra-chave "${chave}" não está no título para o Google (${tituloGoogle ? origemTitulo : 'título da página: o plugin de SEO não se lê'}).`);
  let endereco = slug;
  try { endereco = decodeURIComponent(slug); } catch {}
  if (!slug) melhorias.push(`A página ainda não tem endereço: definir um curto, com a palavra-chave "${chave}".`);
  else if (!temChave(endereco.replace(/-/g, ' '))) melhorias.push(`O endereço "${slug}" não tem a palavra-chave "${chave}". Numa página nova, pô-la no endereço; numa que já existe, não mudar o endereço sem redireccionamento.`);
  const n = vezes(termos(textoVisivel));
  densidade = palavras ? (n / palavras) * 100 : 0;
  if (n > 2 && densidade > cfg.densidade_maxima) {
    corrigir.push(`A palavra-chave "${chave}" aparece ${n} vezes em ${milhares(palavras)} palavras (${pct(densidade)}%). Acima de ${pct(cfg.densidade_maxima)}% soa a repetição: usar sinónimos e variações.`);
  }
}

// Ligações internas: relativas (/contactos/) ou para o mesmo site. Âncoras, telefone e email não contam.
const destinos = [];
const procurar = (v) => {
  if (typeof v === 'string') { for (const m of v.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) destinos.push(m[1]); return; }
  if (Array.isArray(v)) { v.forEach(procurar); return; }
  if (v && typeof v === 'object') {
    if (typeof v.url === 'string' && 'is_external' in v) destinos.push(v.url);
    Object.values(v).forEach(procurar);
  }
};
if (blocos) procurar(blocos); else widgets.forEach((w) => procurar(w.settings));
const hostDe = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };
const interna = (u) => /^\/(?!\/)/.test(u) || (hostDe(u) !== '' && hostDe(u) === hostDe(site));
const caminho = (u) => (/^\//.test(u) ? u : new URL(u).pathname).replace(/[?#].*$/, '').replace(/\/+$/, '') || '/';
const internas = new Set(destinos.map((u) => u.trim()).filter(interna).map(caminho)).size;
if (minimo > 0 && internas < cfg.minimo_ligacoes_internas) {
  melhorias.push(`${internas} ligação(ões) interna(s). Pôr pelo menos ${cfg.minimo_ligacoes_internas}, para páginas de serviço ou artigos do site, com texto que diz o destino (node scripts/listar.mjs).`);
}

const titulo = pagina.title?.raw || '';
if (tituloGoogle) {
  if (tituloGoogle.length < cfg.titulo[0] || tituloGoogle.length > cfg.titulo[1]) melhorias.push(`Título para o Google com ${tituloGoogle.length} caracteres (${origemTitulo}). O ideal é ${cfg.titulo[0]} a ${cfg.titulo[1]}.`);
} else if (titulo.length < 30 || titulo.length > 60) melhorias.push(`Título da página com ${titulo.length} caracteres. O ideal para pesquisa é 50 a 60, definido no plugin de SEO.`);
if (descricao && (descricao.length < cfg.descricao[0] || descricao.length > cfg.descricao[1])) melhorias.push(`Descrição para o Google com ${descricao.length} caracteres (${origemDescricao}). O ideal é ${cfg.descricao[0]} a ${cfg.descricao[1]}.`);
if (pagina.slug && (pagina.slug.length > 60 || /-(de|da|do|e|em|para|com)-/.test(pagina.slug))) melhorias.push(`Endereço "${pagina.slug}" pode encurtar.`);

const mostra = (nome, lista) => {
  console.log(`\n  ${nome} (${lista.length})`);
  for (const i of lista) console.log(`  - ${i}`);
};
console.log(blocos ? `\n  ${titulo} · ${pagina.status} · em blocos do WordPress · ${(blocos.match(/<!-- wp:[a-z]/g) || []).length} blocos` : `\n  ${titulo} · ${pagina.status} · ${elementos.length} secções · ${widgets.length} widgets`);
console.log(`  SEO · ${milhares(palavras)} palavras, ${minimo > 0 ? `mínimo ${milhares(minimo)}` : `sem mínimo${tipo === 'seo' ? '' : ` (${tipo})`}`} · ${chave ? `palavra-chave "${chave}" (${origemChave}), ${pct(densidade)}%` : 'sem palavra-chave'} · ${internas} ligação(ões) interna(s)`);
mostra('Bloqueia a publicação', bloqueia);
mostra('Corrigir antes de mostrar ao cliente', corrigir);
mostra('Melhorias', melhorias);
console.log(`
  Não verificado por este script, ver à mão:
  - telemóvel: abrir ${blocos ? `${ligacoes(pagina.id, pagina.type === 'post').previsualizar} no telemóvel ou com o browser estreito` : `${ligacoes(pagina.id, pagina.type === 'post').editar} e carregar no ícone do telemóvel`}
  - contraste de cores${descricao ? ' e ' : ', meta description e '}dados estruturados (plugin de SEO)${chave ? '' : `
  - palavra-chave: voltar a correr com --chave "..." (ver /seo)`}
  - ligações internas a apontar para páginas que existem
  - testemunhos com consentimento e alegações do sector
`);
process.exit(bloqueia.length ? 2 : 0);
