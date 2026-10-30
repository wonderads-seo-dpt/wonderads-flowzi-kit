// Ligação ao WordPress pela REST nativa, com Application Password, sempre do cliente activo.
import { existsSync, readFileSync, mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { raiz, activo, pastaDe } from './clientes.mjs';
import { ambiente as ambienteDe, identidade } from './ambiente.mjs';

export { raiz };
export const cliente = activo();
export const pasta = cliente ? pastaDe(cliente) : '';

// A ligação vem sempre do .env do cliente activo, mesmo que o comando traga variáveis com outro valor:
// assim ninguém aponta um script para outro site escrevendo WP_URL=... à frente do comando.
const doFicheiro = {};
if (pasta && existsSync(`${pasta}/.env`)) {
  for (const linha of readFileSync(`${pasta}/.env`, 'utf8').split('\n')) {
    const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m) doFicheiro[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  for (const k of ['WP_URL', 'WP_USER', 'WP_APP_PASSWORD']) if (doFicheiro[k]) process.env[k] = doFicheiro[k];
}

const { WP_URL, WP_USER, WP_APP_PASSWORD } = process.env;

process.on('uncaughtException', (e) => {
  console.error(`\n  Erro: ${e.message}\n`);
  process.exit(1);
});

export function exigirCliente() {
  if (!cliente) {
    console.error('\n  Nenhum cliente activo. Usar /cliente para escolher ou criar um, ou /comecar para o treino.\n');
    process.exit(1);
  }
}

export function exigirLigacao() {
  exigirCliente();
  if (doFicheiro.SHOPIFY_LOJA) {
    console.error(`\n  O cliente ${cliente} é uma loja Shopify (${doFicheiro.SHOPIFY_LOJA}). Os scripts do WordPress não servem aqui: usar /shopify-pagina ou /shopify-artigo.\n`);
    process.exit(1);
  }
  const falta = ['WP_URL', 'WP_USER', 'WP_APP_PASSWORD'].filter((k) => !process.env[k]);
  if (falta.length) {
    console.error(`\n  O cliente ${cliente} ainda não está ligado a nenhum site (falta ${falta.join(', ')}). Usar /wp-ligar.\n`);
    process.exit(1);
  }
}

// Páginas e artigos só se gravam a partir da pasta do cliente activo, para a marca e o site nunca trocarem.
export function ficheiroDoCliente(caminho) {
  const f = resolve(caminho);
  if (!existsSync(f)) throw new Error(`Não encontrei o ficheiro ${caminho}.`);
  if (pasta) {
    // Compara caminhos reais com relative: no Windows o mesmo sítio pode vir curto (RUNNER~1) ou longo,
    // com C: ou c:, e com barras / ou \ misturadas.
    const real = (p) => { try { return realpathSync.native(p); } catch { return resolve(p); } };
    const rel = relative(real(pasta), real(f));
    if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error(`${caminho} não é do cliente activo (${cliente}). Os ficheiros dele estão em clientes/${cliente}/.`);
    }
  }
  return f;
}

export const site = (WP_URL || '').replace(/\/+$/, '');

// WP_E_STAGING e WP_LIVE só contam se estiverem escritos no .env do cliente (gravados pela pessoa ao ligar), nunca vindos do comando.
export const ambiente = (url = site) => ambienteDe(url, doFicheiro.WP_E_STAGING, doFicheiro.WP_LIVE);

// A tranca do kit: só escreve páginas em rascunho, também no site real. Publicar, apagar ou mexer noutra coisa
// pára aqui, seja qual for o pedido que chegou ao Claude.
async function tranca(caminho, method, body) {
  if (['GET', 'OPTIONS'].includes(method)) return;
  if (ambiente() === 'produção') {
    throw new Error(`Bloqueado: ${identidade(site)} parece o site real (produção). Para escrever lá rascunhos, a pessoa volta a ligar o cliente (node scripts/ligacao.mjs) e confirma que é o site real.`);
  }
  const limpo = caminho.replace(/^\//, '').replace(/\?.*$/, '');
  // No WordPress, um ?_method= ou um ?rest_route= no endereço muda o pedido que chega (um POST passa a DELETE, ou vai
  // para outra rota). Nenhuma gravação do kit leva parâmetros no endereço.
  const comParametros = caminho.includes('?');
  if (method === 'DELETE' && limpo === 'elementor/v1/cache' && !comParametros) return;
  if (method === 'DELETE') throw new Error('Bloqueado: o kit não apaga páginas nem artigos. Apagar faz-se à mão, no WordPress.');
  if (comParametros) throw new Error(`Bloqueado: o kit não grava em endereços com parâmetros (${caminho}).`);
  const pagina = limpo.match(/^wp\/v2\/(pages|posts|elementor_library)(?:\/(\d+))?$/);
  if (method !== 'POST' || !pagina) {
    throw new Error(`Bloqueado: o kit não faz ${method} em ${limpo}. Só cria e altera páginas, artigos e modelos do Elementor em rascunho.`);
  }
  if (body?.status !== 'draft') {
    throw new Error(`Bloqueado: tentativa de gravar a página com estado "${body?.status ?? 'sem estado'}". O kit só grava em rascunho.`);
  }
  // Modelos do Elementor (cabeçalho, rodapé, secções guardadas): só cópias com o conteúdo. Onde aparecem no site
  // (as condições) e o Kit do Elementor (cores e letras de todo o site) decide-os uma pessoa, no Elementor.
  const modelo = pagina[1] === 'elementor_library';
  if (modelo) {
    const permitidas = ['_elementor_edit_mode', '_elementor_template_type', '_elementor_data', '_elementor_page_settings'];
    const outras = Object.keys(body.meta || {}).filter((k) => !permitidas.includes(k));
    const campos = Object.keys(body).filter((k) => !['title', 'status', 'meta'].includes(k));
    if (outras.length || campos.length) {
      throw new Error(`Bloqueado: num modelo do Elementor o kit só grava o título e o conteúdo, nunca ${[...outras, ...campos].join(', ')}. As condições de apresentação (onde aparece) decide-as uma pessoa, no Elementor.`);
    }
    if (body.meta?._elementor_template_type === 'kit') throw new Error('Bloqueado: o Kit do Elementor (cores e letras de todo o site) não se altera pelo kit.');
  }
  if (pagina[2]) {
    const actual = await wp(`wp/v2/${pagina[1]}/${pagina[2]}?context=edit`);
    if (actual.status !== 'draft') {
      throw new Error(`Bloqueado: o conteúdo ${pagina[2]} está em "${actual.status}". O kit não altera nada que não esteja em rascunho.`);
    }
    if (modelo && actual.meta?._elementor_template_type === 'kit') throw new Error('Bloqueado: o Kit do Elementor (cores e letras de todo o site) não se altera pelo kit.');
  }
}

const cabecalhos = (auth, body) => {
  const h = { Accept: 'application/json' };
  if (auth && WP_USER) h.Authorization = 'Basic ' + Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64');
  if (body) h['Content-Type'] = 'application/json';
  return h;
};

// Sem endereços bonitos (comum nos stagings feitos por plugins numa subpasta), /wp-json/ não existe: usa-se ?rest_route=.
let formaRest = null;
let dadosIndice = null;
const enderecoRest = (caminho, forma = formaRest) => {
  const c = caminho.replace(/^\//, '');
  if (forma === 'wp-json') return `${site}/wp-json/${c}`;
  const q = c.indexOf('?');
  return `${site}/?rest_route=/${q < 0 ? c : `${c.slice(0, q)}&${c.slice(q + 1)}`}`;
};

// Um pedido ao site, com os erros de rede e de redireccionamento explicados.
async function chamar(url, opcoes, repetir) {
  // redirect: 'manual' para um pedido nunca seguir para outro endereço (por exemplo, do staging para o site real).
  const pedido = () => fetch(url, { ...opcoes, redirect: 'manual' });
  let r;
  try {
    try {
      r = await pedido();
    } catch (e) {
      // Uma ligação que o servidor fechou entretanto; só leituras se repetem, para nunca gravar duas vezes.
      if (!repetir) throw e;
      r = await pedido();
    }
  } catch (e) {
    const host = new URL(site).host;
    const codigo = `${e.cause?.code || ''} ${e.cause?.message || ''}`;
    const onde = ambiente();
    if (/CERT|SSL|TLS|SELF_SIGNED/i.test(codigo)) {
      throw new Error(onde === 'local'
        ? `O certificado https do site local ${host} não é aceite. Voltar a ligar o cliente (node scripts/ligacao.mjs) com o endereço começado por http:// em vez de https://.`
        : `O certificado https de ${host} não é válido. Avisar quem gere o site e enviar este erro à Flowzi.`);
    }
    throw new Error(onde === 'treino'
      ? `O WordPress de treino não está a correr (o computador foi desligado ou reiniciado?). Escrever /comecar e escolher 1: volta limpo em poucos minutos, e as páginas regravam-se a partir de clientes/${cliente}/paginas/.`
      : onde === 'local'
        ? `O site local ${host} não está a responder. Abrir o programa onde ele está (por exemplo, o Local) e ligar o site.`
        : `Não consegui chegar a ${host}. Confirmar a internet e o endereço do staging; se estiverem certos, enviar este erro à Flowzi.`);
  }
  if (r.status >= 300 && r.status < 400) {
    throw Object.assign(new Error(`O site respondeu com um redireccionamento para ${r.headers.get('location') || 'outro endereço'}. O endereço gravado não é o certo: voltar a ligar o cliente (/wp-ligar) com o endereço para onde o browser vai parar.`), { redireccao: true });
  }
  return r;
}

// Com o CSS do Elementor "dentro da página" (comum em sites de clientes), o Elementor escreve <style> antes da resposta da API.
const lerJson = async (r) => {
  const t = await r.text();
  try { return JSON.parse(t); } catch {}
  try { return JSON.parse(t.replace(/^\s*(<style\b[^>]*>[\s\S]*?<\/style>\s*)+/i, '')); } catch { return t; }
};
const semEsquema = (u) => String(u || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');

// Primeiro pedido de cada script: encontra a API e confirma que o WordPress que responde é mesmo o do endereço ligado.
// Num staging numa subpasta (cliente.pt/staging), o site real está ao lado; se for ele a responder, pára aqui.
export async function indice() {
  if (dadosIndice) return dadosIndice;
  let ultimo = 0;
  let redireccao = null;
  let outro = '';
  // Numa subpasta sem endereços bonitos, /staging/wp-json/ pode cair no site real de cima: aí tenta-se ?rest_route
  // antes de concluir alguma coisa.
  for (const forma of ['wp-json', 'rest_route']) {
    let r;
    try {
      r = await chamar(enderecoRest('', forma), { headers: cabecalhos(false) }, true);
    } catch (e) {
      if (!e.redireccao) throw e;
      redireccao = e;
      continue;
    }
    if (r.status === 401 && /basic/i.test(r.headers.get('www-authenticate') || '')) {
      throw new Error('O site tem uma palavra-passe à entrada (típico do staging do WP Engine). O kit ainda não liga a estes sites: ver "Sites com palavra-passe à entrada" no LEIA-ME.');
    }
    let dados = await lerJson(r);
    // Alguns plugins de segurança fecham a API a quem não se identifica: tenta-se outra vez com a ligação.
    if ((r.status === 401 || r.status === 403) && typeof dados === 'object' && WP_USER) {
      r = await chamar(enderecoRest('', forma), { headers: cabecalhos(true) }, true);
      dados = await lerJson(r);
      if (!r.ok && typeof dados === 'object') {
        const erro = new Error(`O WordPress recusou a ligação (${r.status}: ${dados?.message || dados?.code}).`);
        erro.status = r.status;
        throw erro;
      }
    }
    ultimo = r.status;
    if (!r.ok || !Array.isArray(dados?.namespaces)) continue;
    const respondeu = [dados.home, dados.url].filter(Boolean);
    if (respondeu.length && !respondeu.map(semEsquema).includes(semEsquema(site))) { outro = respondeu[0]; continue; }
    formaRest = forma;
    dadosIndice = dados;
    return dadosIndice;
  }
  if (outro) {
    throw new Error(`O endereço ligado (${identidade(site)}) está a ser respondido por outro WordPress (${identidade(outro)}). Pode ser o site real ao lado do staging. Nada foi escrito. Confirmar com quem criou o staging o endereço exacto, e voltar a ligar o cliente (/wp-ligar).`);
  }
  if (redireccao) throw redireccao;
  const subpasta = new URL(site).pathname.replace(/\/+$/, '');
  throw new Error(`O site não respondeu como um WordPress (código ${ultimo}). Confirmar o endereço.${subpasta
    ? ' Num staging feito por um plugin numa subpasta, o plugin pode estar a pedir login à entrada: ver "Staging numa subpasta" no LEIA-ME.'
    : ' Se estiver certo, pode ser uma protecção do alojamento: enviar à Flowzi.'}`);
}

export async function wp(caminho, { method = 'GET', body, auth = true } = {}) {
  await tranca(caminho, method, body);
  await indice();
  const r = await chamar(enderecoRest(caminho), {
    method, headers: cabecalhos(auth, body), body: body ? JSON.stringify(body) : undefined,
  }, method === 'GET');
  const dados = await lerJson(r);
  if (r.ok && typeof dados !== 'object') {
    throw new Error(`${method} ${caminho} → o WordPress respondeu sem dados (${String(dados).slice(0, 80)}). Esperar uns segundos e tentar outra vez.`);
  }
  if (!r.ok && typeof dados === 'string' && /^\s*</.test(dados)) {
    throw new Error(`O site não respondeu como um WordPress (código ${r.status}). Pode ser o endereço errado ou uma protecção do alojamento: confirmar o endereço e, se estiver certo, enviar à Flowzi.`);
  }
  if (!r.ok) {
    const msg = dados?.message || String(dados).slice(0, 200);
    const erro = new Error(`${method} ${caminho} → ${r.status}: ${msg}`);
    erro.status = r.status;
    erro.dados = dados;
    throw erro;
  }
  return dados;
}

// Aceita o id, o slug ou o endereço completo da página.
// Procura primeiro nas páginas e depois nos artigos, pelo id, pelo slug ou pelo endereço.
export async function paginaEmEdicao(ref) {
  const texto = String(ref).trim();
  const slug = texto.replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop();
  for (const tipo of ['pages', 'posts']) {
    if (/^\d+$/.test(texto)) {
      try { return await wp(`wp/v2/${tipo}/${texto}?context=edit`); } catch (e) { if (e.status !== 404) throw e; }
    } else {
      const achadas = await wp(`wp/v2/${tipo}?slug=${encodeURIComponent(slug)}&status=publish,draft,pending,private&context=edit`);
      if (achadas.length) return achadas[0];
    }
  }
  throw new Error(`Não encontrei nenhuma página nem artigo com "${texto}".`);
}

// Os modelos do Elementor (cabeçalho, rodapé, secções guardadas, popups) são do tipo elementor_library, e só se
// encontram pelo número (node scripts/listar.mjs --modelos). O Elementor só os mostra pela API a administradores.
export const semAcessoModelos = `O Elementor deste site só mostra os modelos (cabeçalho, rodapé, secções guardadas) pela API a administradores,
  e esta ligação é de um Editor, como o kit recomenda. Não é um erro do kit e não se contorna.
  - Num staging (nunca no site real), quem gere o site pode criar uma password de aplicação de um administrador e
    voltar-se a ligar o cliente com ela (/wp-ligar). O kit continua a gravar só rascunhos e nunca mexe no modelo original.
  - Sem isso, faz-se a secção nova numa página em rascunho para o cliente aprovar, e quem gere o site passa-a para o
    modelo, no Elementor.`;
export async function modeloEmEdicao(id) {
  if (!/^\d+$/.test(String(id).trim())) throw new Error(`Um modelo do Elementor procura-se pelo número (node scripts/listar.mjs --modelos), não por "${id}".`);
  try {
    return await wp(`wp/v2/elementor_library/${String(id).trim()}?context=edit`);
  } catch (e) {
    if (e.status === 401 || e.status === 403) throw Object.assign(new Error(`Não encontrei nenhuma página nem artigo com o número ${id}. Se for um modelo do Elementor:\n  ${semAcessoModelos}`), { status: e.status });
    if (e.status === 404) throw new Error(`Não encontrei nenhuma página, artigo nem modelo do Elementor com o número ${id}.`);
    throw e;
  }
}
const TIPOS_MODELO = {
  header: 'cabeçalho', footer: 'rodapé', section: 'secção', container: 'contentor', page: 'página', popup: 'popup',
  single: 'página individual', 'single-post': 'artigo individual', 'single-page': 'página individual', archive: 'arquivo',
  'search-results': 'resultados de pesquisa', 'error-404': 'página 404', 'loop-item': 'item de loop', kit: 'Kit do Elementor',
  product: 'produto', 'product-archive': 'arquivo de produtos', 'landing-page': 'landing page',
};
export const nomeDoModelo = (tipo) => TIPOS_MODELO[tipo] || tipo || 'sem tipo';

// Cada ficheiro de página ou artigo guarda ao lado (<ficheiro>.wp.json) o número com que ficou em cada site.
// Assim, voltar a gravar o mesmo ficheiro actualiza o rascunho em vez de criar outro.
export function registo(ficheiro) {
  const f = ficheiro.replace(/\.mjs$/, '') + '.wp.json';
  let r = {};
  try { r = JSON.parse(readFileSync(f, 'utf8')); } catch {}
  return {
    id: r[site],
    guardar(id) { r[site] = id; writeFileSync(f, JSON.stringify(r, null, 2) + '\n'); },
  };
}

export function lerElementor(pagina) {
  const bruto = pagina.meta?._elementor_data;
  if (!bruto) return [];
  return typeof bruto === 'string' ? JSON.parse(bruto) : bruto;
}

export function guardarCopia(pagina) {
  const base = pasta || raiz;
  mkdirSync(`${base}/copias`, { recursive: true });
  const ficheiro = `${base}/copias/${pagina.type === 'post' ? 'artigo' : pagina.type === 'elementor_library' ? 'modelo' : 'pagina'}-${pagina.id}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  writeFileSync(ficheiro, JSON.stringify({
    id: pagina.id, titulo: pagina.title?.raw, estado: pagina.status, template: pagina.template,
    meta: pagina.meta, conteudo: pagina.content?.raw,
  }, null, 2));
  return ficheiro;
}

export function exigirRascunho(pagina) {
  if (pagina.status !== 'draft') {
    console.error(`\n  A página ${pagina.id} está em "${pagina.status}", não em rascunho. Parei sem escrever nada.\n`);
    process.exit(1);
  }
}

export const contar = (els) => els.reduce((a, e) => a + 1 + contar(e.elements || []), 0);

export const ligacoes = (id, artigo = false) => ({
  editar: `${site}/wp-admin/post.php?post=${id}&action=elementor`,
  previsualizar: `${site}/?${artigo ? 'p' : 'page_id'}=${id}&preview=true`,
});
