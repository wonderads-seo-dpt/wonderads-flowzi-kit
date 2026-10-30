// Ligação à loja Shopify do cliente activo, pela Admin GraphQL API, com a app que o dono da loja criou no Dev Dashboard.
// A tranca: só operações desta lista, tudo gravado escondido (isPublished: false), e só se altera o que
// ainda está escondido. Publicar, esconder e apagar fazem-se à parte, com aviso (mudarEstado). A Shopify não tem permissões "só rascunho", por isso a regra vive aqui.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative, isAbsolute, basename, join } from 'node:path';
import { realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { activo, pastaDe, raiz } from './clientes.mjs';

export const VERSAO_API = '2026-10';
export { raiz };
export const cliente = activo();
export const pasta = cliente ? pastaDe(cliente) : '';

// A ligação vem só do .env do cliente activo, nunca de variáveis no comando: assim ninguém manda a chave
// da app para outro sítio escrevendo SHOPIFY_LOJA=... à frente do comando.
const env = {};
let envRepetido = '';
if (pasta && existsSync(`${pasta}/.env`)) {
  for (const linha of readFileSync(`${pasta}/.env`, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    // Uma chave repetida é sinal de que alguém acrescentou linhas à mão: não se adivinha qual vale.
    if (Object.hasOwn(env, m[1])) envRepetido = m[1];
    env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
// Só lojas .myshopify.com, por https: a chave da app nunca segue para outro endereço.
const lojaValida = (l) => /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(l);
export const loja = String(env.SHOPIFY_LOJA || '').toLowerCase();
const base = `https://${loja}`;

process.on('uncaughtException', (e) => {
  console.error(`\n  Erro: ${e.message}\n`);
  process.exit(1);
});

export function exigirLoja() {
  if (!cliente) {
    console.error('\n  Nenhum cliente activo. Usar /cliente para escolher ou criar um.\n');
    process.exit(1);
  }
  if (!loja) {
    console.error(`\n  O cliente ${cliente} não está ligado a uma loja Shopify. Usar /shopify-ligar.\n`);
    process.exit(1);
  }
  if (!lojaValida(loja) || !env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET || envRepetido) {
    console.error(`\n  A ligação de ${cliente} à Shopify está incompleta. Voltar a correr node scripts/ligacao.mjs num terminal à parte (/shopify-ligar).\n`);
    process.exit(1);
  }
}

export const painel = (caminho = '') => `https://admin.shopify.com/store/${loja.replace(/\.myshopify\.com$/, '')}/${caminho}`;

// redirect: 'manual' para um pedido nunca seguir para outro endereço.
async function pedir(url, opcoes) {
  // Também aqui, e não só no exigirLoja: um script que se esqueça dele não manda a chave para lado nenhum.
  if (!lojaValida(loja) || envRepetido || !url.startsWith(`${base}/`)) throw new Error('Ligação à Shopify inválida. Voltar a ligar com /shopify-ligar.');
  let r;
  try {
    r = await fetch(url, { ...opcoes, redirect: 'manual' });
  } catch (e) {
    throw new Error(`Não consegui chegar a ${loja} (${e.cause?.code || e.message}). Confirmar a internet; se estiver bem, enviar este erro à Flowzi.`);
  }
  if (r.status >= 300 && r.status < 400) throw new Error(`A loja respondeu com um redireccionamento. O endereço gravado (${loja}) não é o certo: voltar a ligar com o xxx.myshopify.com da loja.`);
  return r;
}

// O token dura 24 horas: pede-se um em cada execução, com a chave da app, e não se guarda em lado nenhum.
let token = '';
async function obterToken() {
  if (token) return token;
  const r = await pedir(`${base}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET }),
  });
  const t = await r.text();
  let d = {};
  try { d = JSON.parse(t); } catch {}
  if (!r.ok || !d.access_token) {
    throw new Error(r.status === 400 || r.status === 401
      ? `A Shopify recusou a chave da app (${r.status}: ${d.error_description || d.error || 'sem detalhe'}). Confirmar que a app está instalada nesta loja e que o Client ID e o secret foram copiados certos; depois voltar a ligar (/shopify-ligar).`
      : `A Shopify não deu acesso (${r.status}). Enviar este erro à Flowzi.`);
  }
  token = d.access_token;
  return token;
}

async function graphql(documento, variaveis = {}, repetir = true) {
  const r = await pedir(`${base}/admin/api/${VERSAO_API}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Shopify-Access-Token': await obterToken() },
    body: JSON.stringify({ query: documento, variables: variaveis }),
  });
  const t = await r.text();
  let d;
  try { d = JSON.parse(t); } catch { throw new Error(`A Shopify respondeu sem dados (${r.status}). Esperar uns segundos e tentar outra vez.`); }
  const limitado = r.status === 429 || (d.errors || []).some((e) => e.extensions?.code === 'THROTTLED');
  // Só as leituras se repetem: uma gravação repetida podia criar a página duas vezes.
  if (limitado && repetir) {
    await new Promise((ok) => setTimeout(ok, 2000));
    return graphql(documento, variaveis, false);
  }
  if ((d.errors || []).some((e) => e.extensions?.code === 'ACCESS_DENIED')) {
    throw new Error('A app não tem permissão para isto. O dono da loja confirma no Dev Dashboard que a app tem write_content e write_files, liberta uma versão nova (Release) e volta a instalá-la.');
  }
  if (r.status === 401 || r.status === 403) {
    throw new Error(`A Shopify recusou o pedido (${r.status}). A app pode não ter as permissões write_content e write_files: o dono da loja confirma-as no Dev Dashboard e liberta uma versão nova da app.`);
  }
  if (!r.ok || d.errors?.length) throw new Error(`Shopify: ${(d.errors || []).map((e) => e.message).join('; ') || `código ${r.status}`}`);
  return d.data;
}

const ERROS = 'userErrors { code field message }';
const SEO = 'seoTitulo: metafield(namespace: "global", key: "title_tag") { id value } seoDescricao: metafield(namespace: "global", key: "description_tag") { id value }';
const PAGINA = 'id title handle isPublished publishedAt templateSuffix updatedAt';
const ARTIGO = 'id title handle isPublished publishedAt templateSuffix updatedAt blog { id title handle }';

// As únicas leituras e gravações que o kit faz. Nenhum script manda GraphQL seu.
const LEITURAS = {
  loja: `query { shop { name myshopifyDomain primaryDomain { url } plan { publicDisplayName partnerDevelopment shopifyPlus } }
    currentAppInstallation { accessScopes { handle } } }`,
  blogs: `query { blogs(first: 50) { nodes { id title handle } } }`,
  pagina: `query ($id: ID!) { page(id: $id) { ${PAGINA} body ${SEO} } }`,
  paginas: `query ($q: String) { pages(first: 100, query: $q, sortKey: UPDATED_AT, reverse: true) { nodes { ${PAGINA} } } }`,
  artigo: `query ($id: ID!) { article(id: $id) { ${ARTIGO} body summary tags image { url altText } ${SEO} } }`,
  artigos: `query ($q: String) { articles(first: 100, query: $q, sortKey: UPDATED_AT, reverse: true) { nodes { ${ARTIGO} } } }`,
  ficheiro: `query ($id: ID!) { node(id: $id) { ... on MediaImage { id fileStatus image { url } } } }`,
};
const GRAVACOES = {
  pageCreate: `mutation ($page: PageCreateInput!) { pageCreate(page: $page) { page { ${PAGINA} } ${ERROS} } }`,
  pageUpdate: `mutation ($id: ID!, $page: PageUpdateInput!) { pageUpdate(id: $id, page: $page) { page { ${PAGINA} } ${ERROS} } }`,
  articleCreate: `mutation ($article: ArticleCreateInput!) { articleCreate(article: $article) { article { ${ARTIGO} } ${ERROS} } }`,
  articleUpdate: `mutation ($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { article { ${ARTIGO} } ${ERROS} } }`,
  stagedUploadsCreate: `mutation ($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } } }`,
  fileCreate: `mutation ($files: [FileCreateInput!]!) { fileCreate(files: $files) { files { id fileStatus ... on MediaImage { image { url } } } ${ERROS} } }`,
};

export async function ler(nome, variaveis = {}) {
  if (!Object.hasOwn(LEITURAS, nome)) throw new Error(`Leitura desconhecida: ${nome}.`);
  return graphql(LEITURAS[nome], variaveis);
}

// O que está publicado não se toca; o que se grava fica sempre escondido.
async function exigirEscondido(tipo, id) {
  const d = await ler(tipo, { id });
  const actual = d?.[tipo === 'pagina' ? 'page' : 'article'];
  if (!actual) throw new Error(`Não encontrei ${tipo === 'pagina' ? 'a página' : 'o artigo'} ${id} na loja.`);
  if (actual.isPublished !== false || actual.publishedAt) throw new Error(`Bloqueado: ${tipo === 'pagina' ? 'a página' : 'o artigo'} "${actual.title}" está publicado na loja. O kit só altera o que está escondido.`);
  return actual;
}

// Só estes campos passam, e só como dados simples: um objecto com truques (toJSON, Proxy) não chega à Shopify.
const CAMPOS = {
  page: ['title', 'body', 'handle', 'templateSuffix', 'metafields', 'isPublished'],
  article: ['title', 'body', 'handle', 'templateSuffix', 'metafields', 'isPublished', 'blogId', 'author', 'summary', 'tags', 'image'],
};
const dados = (v) => JSON.parse(JSON.stringify(v ?? {}));
function esconder(entrada, tipo) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) throw new Error('Bloqueado: gravação sem conteúdo.');
  const fora = Object.keys(entrada).filter((k) => !CAMPOS[tipo].includes(k));
  if (fora.length) throw new Error(`Bloqueado: o kit não grava ${fora.join(', ')}. Datas de publicação e o resto ficam com uma pessoa, no painel da Shopify.`);
  if ('isPublished' in entrada && entrada.isPublished !== false) throw new Error('Bloqueado: o kit só grava escondido (isPublished: false).');
  if (entrada.metafields !== undefined && !Array.isArray(entrada.metafields)) throw new Error('Bloqueado: metafields inválidos.');
  for (const m of entrada.metafields || []) {
    const seo = m.namespace === 'global' && ['title_tag', 'description_tag'].includes(m.key) && m.type === 'single_line_text_field';
    const existente = typeof m.id === 'string' && Object.keys(m).every((k) => ['id', 'value'].includes(k));
    if (!seo && !existente) throw new Error('Bloqueado: o kit só grava o título e a descrição para o Google.');
  }
  return { ...entrada, isPublished: false };
}
function soImagens(lista, campos) {
  if (!Array.isArray(lista) || lista.length !== 1) throw new Error('Bloqueado: uma imagem de cada vez.');
  const [x] = lista;
  const imagem = (x.mimeType === undefined || Object.values(TIPOS).includes(x.mimeType)) && (x.filename === undefined || /\.(jpe?g|png|webp|gif)$/i.test(x.filename));
  if (Object.keys(x).some((k) => !campos.includes(k)) || (x.contentType ?? 'IMAGE') !== 'IMAGE' || (x.resource ?? 'IMAGE') !== 'IMAGE' || !imagem) {
    throw new Error('Bloqueado: o kit só envia imagens novas, sem substituir ficheiros da loja.');
  }
  return lista;
}

export async function gravar(nome, variaveis = {}) {
  if (!Object.hasOwn(GRAVACOES, nome)) throw new Error(`Bloqueado: o kit não faz "${nome}" na Shopify. Só cria e altera páginas e artigos escondidos e envia imagens.`);
  const v = dados(variaveis);
  if (nome === 'pageCreate' || nome === 'pageUpdate') v.page = esconder(v.page, 'page');
  if (nome === 'articleCreate' || nome === 'articleUpdate') v.article = esconder(v.article, 'article');
  if (nome === 'fileCreate') v.files = soImagens(v.files, ['originalSource', 'contentType', 'alt']);
  if (nome === 'stagedUploadsCreate') v.input = soImagens(v.input, ['resource', 'filename', 'mimeType', 'httpMethod']);
  if (nome === 'pageUpdate') await exigirEscondido('pagina', v.id);
  if (nome === 'articleUpdate') await exigirEscondido('artigo', v.id);
  const d = await graphql(GRAVACOES[nome], v, false);
  const res = d?.[nome];
  if (res?.userErrors?.length) throw new Error(`A Shopify recusou: ${res.userErrors.map((e) => `${(e.field || []).join('.')} ${e.message}`.trim()).join('; ')}`);
  const coisa = res?.page || res?.article;
  if (coisa && coisa.isPublished !== false) {
    throw new Error(`ATENÇÃO: ${coisa.title} ficou visível na loja (${coisa.id}). Escondê-la já no painel (${painel()}) e avisar a Flowzi.`);
  }
  return res;
}

// Publicar, esconder e apagar: só por scripts/shopify-publicar.mjs, que mostra antes o que vai fazer e só avança
// com --confirmo, depois de a pessoa dizer que sim. Apagar guarda primeiro uma cópia completa em copias/.
const ESTADO = {
  pagina: {
    mudar: `mutation ($id: ID!, $page: PageUpdateInput!) { pageUpdate(id: $id, page: $page) { page { ${PAGINA} } ${ERROS} } }`,
    apagar: `mutation ($id: ID!) { pageDelete(id: $id) { deletedPageId ${ERROS} } }`,
    campo: 'page', resultado: 'pageUpdate', apagado: 'pageDelete',
  },
  artigo: {
    mudar: `mutation ($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { article { ${ARTIGO} } ${ERROS} } }`,
    apagar: `mutation ($id: ID!) { articleDelete(id: $id) { deletedArticleId ${ERROS} } }`,
    campo: 'article', resultado: 'articleUpdate', apagado: 'articleDelete',
  },
};
export async function mudarEstado(tipo, id, accao) {
  const e = ESTADO[tipo];
  if (!e || !['publicar', 'esconder', 'apagar'].includes(accao)) throw new Error(`Acção desconhecida: ${accao} ${tipo}.`);
  const nome = accao === 'apagar' ? e.apagado : e.resultado;
  const d = accao === 'apagar'
    ? await graphql(e.apagar, { id }, false)
    : await graphql(e.mudar, { id, [e.campo]: { isPublished: accao === 'publicar' } }, false);
  const res = d?.[nome];
  if (res?.userErrors?.length) throw new Error(`A Shopify recusou: ${res.userErrors.map((x) => `${(x.field || []).join('.')} ${x.message}`.trim()).join('; ')}`);
  return res;
}

// Imagens: um ficheiro do cliente sobe para a Shopify (Ficheiros); um endereço público vai directo.
// Devolve o endereço no CDN da loja, que é o que entra nas páginas e nos artigos.
const TIPOS = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
// Subir imagens precisa de write_files (ou write_images, ou write_themes, que também o permitem). Confirma-se antes do
// primeiro envio, para a página não ficar a meio e o erro dizer o que fazer.
let dadosLoja = null;
const daLoja = async () => (dadosLoja ??= await ler('loja'));
async function exigirFicheiros() {
  const scopes = (await daLoja()).currentAppInstallation?.accessScopes?.map((s) => s.handle) || [];
  if (!scopes.some((s) => ['write_files', 'write_images', 'write_themes'].includes(s))) {
    throw new Error('A app da loja não tem a permissão write_files, e sem ela as imagens não sobem para a loja. O dono da loja abre a app no Dev Dashboard da Shopify, junta write_files às permissões (Access scopes), carrega em Release para libertar a versão nova e volta a instalar a app na loja. As imagens que já estão na loja (cdn.shopify.com) usam-se sem esta permissão.');
  }
}
// O CDN da Shopify (cdn.shopify.com) ou o da própria loja (/cdn/shop/ no domínio dela): a imagem já lá está.
async function jaNaLoja(url) {
  if (url.hostname === 'cdn.shopify.com') return true;
  if (!url.pathname.startsWith('/cdn/shop/')) return false;
  const d = (await daLoja()).shop || {};
  const sem = (h) => String(h || '').toLowerCase().replace(/^www\./, '');
  let principal = '';
  try { principal = new URL(d.primaryDomain?.url || '').hostname; } catch {}
  return [loja, d.myshopifyDomain, principal].filter(Boolean).map(sem).includes(sem(url.hostname));
}

// O endereço com que uma imagem entra na loja. imagens/foto.jpg (na pasta do cliente) sobe; uma imagem que já está no CDN
// da loja usa-se como está; outro endereço https sobe para os Ficheiros da loja. A Pixabay nunca se liga de fora:
// o ficheiro descarrega-se para imagens/ e sobe.
export async function imagemNaLoja(origem, alt) {
  // //cdn.shopify.com/... (sem https:) é como a Shopify escreve os endereços no código das páginas.
  const o = String(origem || '').trim().replace(/^\/\//, 'https://');
  if (/^[a-z][a-z0-9+.-]*:/i.test(o)) {
    let url;
    try { url = new URL(o); } catch { throw new Error(`Endereço de imagem inválido: ${o}`); }
    if (/(^|\.)pixabay\.com$/i.test(url.hostname)) {
      throw new Error(`As fotografias da Pixabay não se ligam ao site da Pixabay (${o}). Descarregar a escolhida com node scripts/pixabay.mjs descarregar <número>, que a põe em imagens/, e usar esse ficheiro: sobe para a loja ao gravar.`);
    }
    if (url.protocol !== 'https:') throw new Error(`Imagem recusada: ${o}. Só ficheiros da pasta do cliente (imagens/...) ou endereços https.`);
    if (await jaNaLoja(url)) return url.href;
    return enviarImagem(url.href, alt);
  }
  return enviarImagem(join(pasta, o), alt);
}

// O que já subiu para cada loja: o sha256 de cada ficheiro (ou o endereço de fora) e o ficheiro com que ficou na Shopify,
// em imagens/.shopify-<loja>.json. Voltar a gravar uma página não sobe outra vez as mesmas imagens.
function imagensSubidas() {
  const f = join(pasta, 'imagens', `.shopify-${loja.replace(/[^a-z0-9.-]/gi, '-')}.json`);
  let c = {};
  try { c = JSON.parse(readFileSync(f, 'utf8')); } catch {}
  return {
    c,
    guardar(chave, v) {
      c[chave] = v;
      mkdirSync(join(pasta, 'imagens'), { recursive: true });
      writeFileSync(f, JSON.stringify(c, null, 2) + '\n');
    },
  };
}

export async function enviarImagem(origem, alt) {
  if (!alt) throw new Error(`${origem}: falta o texto alternativo.`);
  if (/^https?:\/\/([^/]*\.)?pixabay\.com[/:]/i.test(origem)) throw new Error(`As fotografias da Pixabay não se ligam ao site da Pixabay (${origem}): descarregar com node scripts/pixabay.mjs descarregar <número> e usar o ficheiro de imagens/.`);
  await exigirFicheiros();
  const local = !/^https:\/\//.test(origem);
  const f = local ? ficheiroDoCliente(origem) : '';
  const ext = f.toLowerCase().match(/\.[a-z]+$/)?.[0] || '';
  if (local && !TIPOS[ext]) throw new Error(`${basename(f)}: só se enviam imagens jpg, png, webp ou gif.`);
  const conteudo = local ? readFileSync(f) : null;
  const chave = local ? `sha256:${createHash('sha256').update(conteudo).digest('hex')}` : origem;
  const subidas = imagensSubidas();
  // Se o ficheiro ainda estiver na loja, usa-se; se alguém o apagou nos Ficheiros, sobe outra vez.
  if (subidas.c[chave]?.id) {
    const n = (await ler('ficheiro', { id: subidas.c[chave].id })).node;
    if (n?.fileStatus === 'READY' && n.image?.url) return n.image.url;
  }
  let fonte = origem;
  if (local) {
    const alvo = (await gravar('stagedUploadsCreate', {
      input: [{ resource: 'IMAGE', filename: basename(f), mimeType: TIPOS[ext], httpMethod: 'PUT' }],
    })).stagedTargets[0];
    // Nas imagens, os parâmetros do envio vão como cabeçalhos de um PUT (guia de media da Shopify).
    const cabecalhos = Object.fromEntries(alvo.parameters.map((p) => [p.name, p.value]));
    const r = await fetch(alvo.url, { method: 'PUT', headers: cabecalhos, body: conteudo, redirect: 'manual' });
    if (!r.ok) throw new Error(`O envio de ${basename(f)} para a Shopify falhou (${r.status}).`);
    fonte = alvo.resourceUrl;
  }
  const criado = (await gravar('fileCreate', { files: [{ originalSource: fonte, contentType: 'IMAGE', alt }] })).files[0];
  // A Shopify processa a imagem uns segundos antes de dar o endereço final.
  for (let i = 0; i < 20; i++) {
    const n = (await ler('ficheiro', { id: criado.id })).node;
    if (n?.fileStatus === 'READY' && n.image?.url) {
      subidas.guardar(chave, { id: criado.id, url: n.image.url });
      return n.image.url;
    }
    if (n?.fileStatus === 'FAILED') throw new Error(`A Shopify não aceitou a imagem ${basename(origem)}.`);
    await new Promise((ok) => setTimeout(ok, 1500));
  }
  throw new Error(`A imagem ${basename(origem)} ainda está a ser processada pela Shopify. Tentar outra vez daqui a um minuto.`);
}

// Os ficheiros de página e de artigo só se gravam a partir da pasta do cliente activo.
export function ficheiroDoCliente(caminho) {
  const f = resolve(caminho);
  if (!existsSync(f)) throw new Error(`Não encontrei o ficheiro ${caminho}.`);
  const real = (p) => { try { return realpathSync.native(p); } catch { return resolve(p); } };
  const rel = relative(real(pasta), real(f));
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error(`${caminho} não é do cliente activo (${cliente}). Os ficheiros dele estão em clientes/${cliente}/.`);
  return f;
}

// Ao lado de cada ficheiro (<ficheiro>.shopify.json) fica o id com que ficou em cada loja: voltar a gravar actualiza.
export function registo(ficheiro) {
  const f = ficheiro.replace(/\.mjs$/, '') + '.shopify.json';
  let r = {};
  try { r = JSON.parse(readFileSync(f, 'utf8')); } catch {}
  return { id: r[loja], guardar(id) { r[loja] = id; writeFileSync(f, JSON.stringify(r, null, 2) + '\n'); } };
}

export function guardarCopia(tipo, coisa) {
  mkdirSync(`${pasta}/copias`, { recursive: true });
  const f = `${pasta}/copias/shopify-${tipo}-${String(coisa.id).split('/').pop()}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  writeFileSync(f, JSON.stringify(coisa, null, 2));
  return f;
}

export const numero = (gid) => String(gid).split('/').pop();

// O título e a descrição para o Google vivem em metafields "global" (title_tag e description_tag, texto de uma linha).
// Numa alteração vai o id do que já existe, para não criar um segundo.
export function metafieldsSeo(seo = {}, actual = {}) {
  const lista = [];
  for (const [chave, valor, campo] of [['title_tag', seo.titulo, 'seoTitulo'], ['description_tag', seo.descricao, 'seoDescricao']]) {
    if (!valor) continue;
    const existente = actual[campo]?.id;
    lista.push(existente ? { id: existente, value: String(valor) } : { namespace: 'global', key: chave, type: 'single_line_text_field', value: String(valor) });
  }
  return lista;
}
