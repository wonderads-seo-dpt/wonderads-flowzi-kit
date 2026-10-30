// O documento para o cliente validar o texto: só o conteúdo de uma página ou artigo, pela ordem da página, num .docx
// em clientes/<cliente>/validacao/<slug>-<número>-<AAAA-MM-DD>.docx. Não fala com o WordPress nem com a Shopify: recebe a
// página já lida. Usado por documento.mjs, pelos criar-*.mjs depois de gravar e pelos scripts da Shopify.
import { constants, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { pastaDe } from './clientes.mjs';
import { docx, blocosDeHtml, desentidades } from './docx.mjs';

const escA = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escT = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const tituloHtml = (tag, html, omissao) => {
  const t = /^h[1-6]$/.test(tag || omissao) ? tag || omissao : 'p';
  return html ? `<${t}>${html}</${t}>` : '';
};
const altDe = (imagem) => imagem?.alt?.trim() || (imagem?.id ? 'texto alternativo na biblioteca de media' : '');
const imagemHtml = (imagem) => (imagem?.url || imagem?.id ? `<img alt="${escA(altDe(imagem))}">` : '');
const botaoHtml = (texto, url) => (texto ? `<a class="button" href="${escA(url || '')}">${texto}</a>` : '');
// Os símbolos que o widget de tabela de preços do Elementor guarda pelo nome.
const MOEDAS = { '': '', dollar: '$', euro: '€', pound: '£', yen: '¥', real: 'R$', franc: '₣', krona: 'kr', lira: '₤', peseta: '₧', peso: '₱', ruble: '₽', rupee: '₨', indian_rupee: '₹', shekel: '₪', won: '₩', baht: '฿', guilder: 'ƒ' };
const marcado = (rotulo, texto) => `<p><strong>${rotulo}</strong> ${escT(texto)}</p>`;
// O editor clássico (e às vezes o texto do Elementor) guarda os parágrafos como linhas em branco: o WordPress só os põe
// em <p> ao mostrar a página.
const autop = (html = '') => (/<p[\s>]|<!-- wp:/i.test(html) || !/\n\s*\n/.test(html) ? html
  : html.split(/\n\s*\n/).map((b) => (/^\s*<(h[1-6]|ul|ol|div|blockquote|figure|table|details)\b/i.test(b) ? b : `<p>${b.trim().replace(/\n/g, '<br>')}</p>`)).join('\n'));

// O Elementor em HTML simples, pela ordem da página, e depois em blocos do Word como o resto.
function htmlDeElementor(elementos = []) {
  let h = '';
  for (const e of elementos) {
    if (!e || typeof e !== 'object') continue;
    if (e.elType !== 'widget') { h += `<div>${htmlDeElementor(e.elements)}</div>`; continue; }
    const s = e.settings || {};
    switch (e.widgetType) {
      case 'heading': h += tituloHtml(s.header_size, s.title, 'h2'); break;
      case 'text-editor': h += `<div>${autop(s.editor)}</div>`; break;
      case 'button': h += botaoHtml(s.text, s.link?.url); break;
      case 'image': h += imagemHtml(s.image) + (s.caption ? `<figcaption>${s.caption}</figcaption>` : ''); break;
      case 'icon-list':
        h += `<ul>${(s.icon_list || []).map((i) => `<li>${i.link?.url ? `<a href="${escA(i.link.url)}">${i.text || ''}</a>` : i.text || ''}</li>`).join('')}</ul>`;
        break;
      case 'icon-box':
      case 'image-box':
        if (e.widgetType === 'image-box') h += imagemHtml(s.image);
        h += tituloHtml(s.title_size, s.title_text, 'h3') + (s.description_text ? `<p>${s.description_text}</p>` : '');
        break;
      case 'accordion':
      case 'toggle':
        h += (s.tabs || []).map((t) => `<details><summary>${t.tab_title || ''}</summary><div>${autop(t.tab_content)}</div></details>`).join('');
        break;
      case 'tabs':
        h += (s.tabs || []).map((t) => `<p><strong>${t.tab_title || ''}</strong></p><div>${autop(t.tab_content)}</div>`).join('');
        break;
      case 'alert':
        h += (s.alert_title ? `<p><strong>${s.alert_title}</strong></p>` : '') + (s.alert_description ? `<div>${autop(s.alert_description)}</div>` : '');
        break;
      case 'flip-box':
        for (const lado of ['a', 'b']) h += tituloHtml(s.title_tag, s[`title_text_${lado}`], 'h3') + (s[`description_text_${lado}`] ? `<p>${s[`description_text_${lado}`]}</p>` : '');
        h += botaoHtml(s.button_text, s.link?.url);
        break;
      case 'price-table': {
        const moeda = s.currency_symbol === 'custom' ? s.currency_symbol_custom || '' : MOEDAS[s.currency_symbol ?? 'dollar'] ?? '';
        const preco = String(s.price ?? '').trim();
        const valor = preco ? (s.currency_position === 'after' ? `${preco} ${moeda}` : `${moeda}${preco}`).trim() : '';
        h += tituloHtml(s.heading_tag, s.heading, 'h3') + (s.sub_heading ? `<p>${s.sub_heading}</p>` : '')
          + (s.show_ribbon === 'yes' && s.ribbon_title ? `<p>${s.ribbon_title}</p>` : '')
          + (valor ? `<p><strong>${escT(valor)}</strong>${s.period ? ` ${s.period}` : ''}</p>` : '')
          + ((s.features_list || []).some((f) => f.item_text) ? `<ul>${s.features_list.filter((f) => f.item_text).map((f) => `<li>${f.item_text}</li>`).join('')}</ul>` : '')
          + botaoHtml(s.button_text, s.link?.url) + (s.footer_additional_info ? `<p>${s.footer_additional_info}</p>` : '');
        break;
      }
      case 'price-list':
        h += (s.price_list || []).map((i) => `<p><strong>${i.title || ''}</strong>${i.price ? ` · ${i.price}` : ''}</p>${i.item_description ? `<p>${i.item_description}</p>` : ''}`).join('');
        break;
      // Os acordeões e separadores novos do Elementor guardam o conteúdo de cada item num container filho.
      case 'nested-accordion':
        h += (s.items || []).map((t, i) => `<details><summary>${t.item_title || ''}</summary><div>${htmlDeElementor([e.elements?.[i]])}</div></details>`).join('');
        break;
      case 'nested-tabs':
        h += (s.tabs || []).map((t, i) => `<p><strong>${t.tab_title || ''}</strong></p><div>${htmlDeElementor([e.elements?.[i]])}</div>`).join('');
        break;
      case 'testimonial':
        h += `<blockquote><p>${s.testimonial_content || ''}</p></blockquote><p>${[s.testimonial_name, s.testimonial_job].filter(Boolean).join(', ')}</p>`;
        break;
      case 'counter':
        h += `<p>${[s.title, `${s.prefix || ''}${s.ending_number ?? ''}${s.suffix || ''}`].filter((x) => String(x ?? '').trim()).join(': ')}</p>`;
        break;
      case 'call-to-action':
        h += imagemHtml(s.bg_image) + tituloHtml(s.title_tag, s.title, 'h2') + (s.description ? `<p>${s.description}</p>` : '') + botaoHtml(s.button, s.link?.url);
        break;
      case 'form':
        h += marcado('[Formulário]', `campos: ${(s.form_fields || []).map((f) => f.field_label || f.placeholder || f.field_type).filter(Boolean).join(', ') || 'sem nome'}`)
          + botaoHtml(s.button_text || 'Enviar', '(envia o formulário)');
        break;
      case 'video': h += marcado('[Vídeo]', s.youtube_url || s.vimeo_url || s.dailymotion_url || s.external_url?.url || s.hosted_url?.url || ''); break;
      case 'google_maps': h += marcado('[Mapa]', s.address || ''); break;
      case 'html': h += marcado('[Código HTML]', 'não incluído neste documento'); break;
      case 'shortcode': h += marcado('[Shortcode]', s.shortcode || ''); break;
      case 'global': h += marcado('[Widget global]', 'o texto está num modelo à parte'); break;
      case 'spacer': case 'divider': case 'menu-anchor': case 'social-icons': case 'icon': case 'nav-menu': case 'site-logo': break;
      default:
        // Um widget que o kit não conhece: em vez de adivinhar campos, avisa-se, para o texto não faltar sem ninguém ver.
        h += marcado(`[Widget ${escT(e.widgetType || 'sem tipo')}]`, 'texto não incluído: ver na página');
    }
  }
  return h;
}

const ascii = (t) => {
  let s = String(t || '');
  try { s = decodeURIComponent(s); } catch {}
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
};
const hoje = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const semVariaveis = (t) => (typeof t === 'string' && t.trim() && !/%%?[a-z_]+%?%/i.test(t) ? t.trim() : '');
const limpo = (t) => desentidades(String(t || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// O seo: { titulo, descricao } do ficheiro que gravou a página (encontrado pelo número em <ficheiro>.wp.json).
// Lê-se como texto, como no rever.mjs: o ficheiro não corre.
export function seoDoFicheiro(cliente, site, id) {
  const pasta = pastaDe(cliente);
  for (const sub of ['paginas', 'artigos']) {
    const dir = join(pasta, sub);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.wp.json'))) {
      let reg = {};
      try { reg = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { continue; }
      const mjs = join(dir, f.replace(/\.wp\.json$/, '.mjs'));
      if (Number(reg[site]) !== Number(id) || !existsSync(mjs)) continue;
      const seo = (readFileSync(mjs, 'utf8').match(/\bseo\s*:\s*\{([^{}]*)\}/) || [])[1] || '';
      const valor = (k) => {
        const m = seo.match(new RegExp(`\\b${k}\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1)[^\\\\])*)\\1`));
        return m ? m[2].replace(/\\(.)/g, '$1') : '';
      };
      return { titulo: valor('titulo'), descricao: valor('descricao') };
    }
  }
  return {};
}

// Grava o .docx. blocos já em formato do Word (docx.mjs). Devolve o caminho e um resumo do que leva.
// O número no nome separa o que tem o mesmo slug no mesmo dia (página e artigo, subpáginas, slugs só com emoji).
export function gravarDocumento({ cliente, titulo, slug, id, endereco, seo = {}, resumo, artigo = false, blocos }) {
  if (!cliente) throw new Error('Nenhum cliente activo.');
  const conteudo = [...blocos];
  // Sem h1 no conteúdo, o h1 da página é o título (o tema mostra-o): entra no topo, como Título 1.
  if (!conteudo.some((b) => b.tipo === 'titulo' && b.nivel === 1)) conteudo.unshift({ tipo: 'titulo', nivel: 1, partes: [{ texto: titulo }] });
  const linha = (rotulo, valor, ligacao) => (valor ? [{ tipo: 'paragrafo', partes: [{ texto: `${rotulo}: `, negrito: true }, { texto: valor, ligacao: /^https?:\/\//.test(ligacao || '') ? ligacao : '' }] }] : []);
  const tituloGoogle = seo.titulo || seo.title || '';
  const descricaoGoogle = seo.descricao || seo.description || '';
  const cabeca = [
    { tipo: 'nota', partes: [{ texto: 'Para validar: comentar ou sugerir alterações neste documento.' }] },
    ...linha(artigo ? 'Artigo' : 'Página', titulo),
    ...linha('Endereço previsto', endereco, endereco),
    ...linha('Título para o Google', tituloGoogle),
    ...linha('Descrição para o Google', descricaoGoogle),
    ...linha('Resumo do artigo', resumo),
    { tipo: 'linha', partes: [] },
  ];
  const dir = join(pastaDe(cliente), 'validacao');
  const numero = ascii(String(id ?? '').split('/').pop()) || createHash('sha256').update(`${endereco || ''}|${slug || ''}|${titulo || ''}`).digest('hex').slice(0, 6);
  const ficheiro = join(dir, `${ascii(slug) || ascii(titulo) || 'pagina'}-${numero}-${hoje()}.docx`);
  mkdirSync(dir, { recursive: true });
  try {
    writeFileSync(ficheiro, docx({ titulo, blocos: [...cabeca, ...conteudo] }));
  } catch (e) {
    if (['EBUSY', 'EPERM', 'EACCES'].includes(e.code)) throw new Error(`não consegui gravar ${ficheiro}: está aberto no Word? Fechá-lo e repetir`);
    throw e;
  }
  const conta = (f) => conteudo.filter(f).length;
  const partes = [
    [conta((b) => b.tipo === 'titulo'), 'título', 'títulos'],
    [conta((b) => b.tipo === 'paragrafo' && !b.marca), 'parágrafo', 'parágrafos'],
    [conta((b) => b.tipo === 'item'), 'item de lista', 'itens de lista'],
    [conta((b) => b.marca === 'botao'), 'botão', 'botões'],
    [conta((b) => b.marca === 'imagem'), 'imagem', 'imagens'],
    [conta((b) => b.marca === 'pergunta'), 'pergunta frequente', 'perguntas frequentes'],
  ].filter(([n]) => n).map(([n, um, varios]) => `${n} ${n === 1 ? um : varios}`);
  return { ficheiro, relativo: `clientes/${cliente}/validacao/${ficheiro.split(/[/\\]/).pop()}`, resumo: partes.join(' · ') };
}

// Uma página ou artigo do WordPress, como vem da REST com context=edit: Elementor pelo _elementor_data, blocos pelo
// content.raw. O seo do ficheiro da página completa o que o plugin de SEO não mostra à API.
export function documentoDePagina(pagina, { site = '', cliente, seo } = {}) {
  let elementos = pagina.meta?._elementor_data;
  if (typeof elementos === 'string') { try { elementos = elementos ? JSON.parse(elementos) : []; } catch { elementos = []; } }
  const html = Array.isArray(elementos) && elementos.length && pagina.meta?._elementor_edit_mode === 'builder'
    ? htmlDeElementor(elementos)
    : autop(pagina.content?.raw ?? pagina.content?.rendered ?? '');
  const slug = pagina.slug || pagina.generated_slug || '';
  const modelo = pagina.permalink_template || '';
  const endereco = slug && /%(pagename|postname)%/.test(modelo) ? modelo.replace(/%(pagename|postname)%/, slug) : pagina.link || '';
  // Primeiro o seo: { } do ficheiro da página, que é o texto escrito para o cliente; o Yoast inventa sempre um título
  // pelo modelo dele, e por isso só serve quando o ficheiro não diz nada.
  const daPagina = seo || seoDoFicheiro(cliente, site, pagina.id);
  const yoast = pagina.yoast_head_json || {};
  const rm = pagina.meta || {};
  const artigo = pagina.type === 'post';
  return gravarDocumento({
    cliente,
    titulo: limpo(pagina.title?.raw ?? pagina.title?.rendered ?? ''),
    slug: slug || pagina.title?.raw,
    id: pagina.id,
    endereco,
    artigo,
    resumo: artigo ? limpo(pagina.excerpt?.raw) : '',
    seo: {
      titulo: daPagina.titulo || limpo(yoast.title) || semVariaveis(rm.rank_math_title) || '',
      descricao: daPagina.descricao || limpo(yoast.description) || semVariaveis(rm.rank_math_description) || '',
    },
    blocos: blocosDeHtml(html, { base: site }),
  });
}

// Para a Shopify (e qualquer outro HTML): o corpo da página ou do artigo, como sai do shopify-html.mjs.
// endereco: o endereço previsto, completo (https://<loja>/pages/sobre-nos), para as ligações relativas ficarem clicáveis.
// Sem id, o nome do ficheiro leva um código tirado do endereço, para a página e o artigo com o mesmo slug não se pisarem.
export function documentoDeHtml({ titulo, seo = {}, html, cliente, endereco = '', slug = '', id, artigo = false, resumo = '' }) {
  return gravarDocumento({ cliente, titulo: limpo(titulo), slug: slug || titulo, id, endereco, artigo, resumo: limpo(resumo), seo, blocos: blocosDeHtml(html, { base: endereco }) });
}

// --- Google Drive ----------------------------------------------------------------------------------------------
// O Google Drive para computador mostra o Drive como uma pasta. Sem API da Google e sem credenciais: copia-se para lá.
const NOMES_DRIVE = ['My Drive', 'O meu disco', 'Meu Drive', 'A minha unidade'];
const ePasta = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };

export function pastaDoDrive(casa = homedir()) {
  const candidatas = [];
  if (process.platform === 'win32') {
    // O Drive para computador usa o G: por defeito, e outra letra se o G: estiver ocupado.
    for (const letra of 'GDEFHIJKLMNOPQRSTUVWXYZ') for (const n of NOMES_DRIVE) candidatas.push(`${letra}:\\${n}`);
  } else {
    const nuvem = join(casa, 'Library', 'CloudStorage');
    let contas = [];
    try { contas = readdirSync(nuvem).filter((d) => d.startsWith('GoogleDrive-')).sort(); } catch {}
    for (const c of contas) for (const n of NOMES_DRIVE) candidatas.push(join(nuvem, c, n));
    for (const n of NOMES_DRIVE) candidatas.push(join('/Volumes', 'GoogleDrive', n));
  }
  // O modo "espelhar ficheiros" e o Backup and Sync antigo põem o Drive dentro da pasta do utilizador.
  for (const n of [...NOMES_DRIVE, 'Google Drive']) candidatas.push(join(casa, n));
  return candidatas.find(ePasta) || '';
}

// Copia o documento para "Validação de textos/<cliente>/" no Drive. Devolve o destino, ou '' se não houver Drive.
// Nunca por cima: a cópia que lá está pode já ter os comentários do cliente. Uma segunda vai com -2, -3...
export function paraDrive(ficheiro, cliente, drive = pastaDoDrive()) {
  if (!drive) return '';
  if (!ePasta(drive)) throw new Error(`A pasta ${drive} não existe.`);
  const dir = join(drive, 'Validação de textos', cliente);
  mkdirSync(dir, { recursive: true });
  const nome = ficheiro.split(/[/\\]/).pop();
  for (let n = 1; ; n++) {
    const destino = join(dir, n === 1 ? nome : nome.replace(/(\.docx)?$/i, `-${n}$1`));
    try {
      copyFileSync(ficheiro, destino, constants.COPYFILE_EXCL);
      return destino;
    } catch (e) {
      if (e.code !== 'EEXIST' || n >= 999) throw e;
    }
  }
}

export const semDrive = (ficheiro, cliente) => `Não encontrei o Google Drive para computador. Para o enviar à mão:
                  1. abrir drive.google.com e entrar (ou criar) a pasta "Validação de textos/${cliente}";
                  2. arrastar para lá o ficheiro ${ficheiro};
                  3. abri-lo com o Google Docs e, para o converter num documento Google, Ficheiro → Guardar como
                     Documentos Google (ou ligar uma vez Definições → Converter carregamentos).
                  Depois partilhar com o cliente, com permissão de comentar.`;
