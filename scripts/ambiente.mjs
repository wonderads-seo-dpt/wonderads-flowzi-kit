// Treino, local, staging ou produção, só pelo endereço. Um endereço sem marca de staging é tratado como produção.
// Um staging com outro nome confirma-o a pessoa ao ligar (ligacao.mjs), e fica no .env do cliente: WP_E_STAGING=<endereço>.
// O site real só recebe rascunhos se a pessoa o confirmar como tal ao ligar: WP_LIVE=<endereço>. Sem isso, é 'produção' e não se escreve.
const MARCA = /^(staging|stg|dev|teste|test|preprod|qa)\d*$|^(staging|stg|dev|teste)-|-(staging|stg|dev)$/;
export const TREINO = '127.0.0.1:9400';

// O endereço sem https e sem barra no fim: cliente.pt, ou cliente.pt/staging num staging feito numa subpasta.
export function identidade(url) {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`.toLowerCase().replace(/\/+$/, '');
  } catch { return ''; }
}

export const eLocal = (host) => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(host) || /\.(localhost|local|test)$/.test(host);

export function ambiente(url, confirmado = '', live = '') {
  let u;
  try { u = new URL(url); } catch { return 'desconhecido'; }
  const host = u.hostname.toLowerCase();
  if (eLocal(host)) return u.host === TREINO || u.host === 'localhost:9400' ? 'treino' : 'local';
  // A marca só conta nos subdomínios, nunca no nome do site nem na terminação: marca.dev, clinicadev.pt e qa.pt são sites reais.
  const partes = host.split('.');
  if (partes.slice(0, -2).some((p) => MARCA.test(p))) return 'staging';
  // Staging numa subpasta, como o fazem os plugins de staging: cliente.pt/staging. O site real é outro (cliente.pt).
  if (u.pathname.toLowerCase().split('/').filter(Boolean).some((p) => MARCA.test(p))) return 'staging';
  // Nos alojamentos que dão um endereço por ambiente, o staging vem colado ao nome: clientestg.wpengine.com.
  if (/\.(wpengine\.com|wpenginepowered\.com|kinsta\.cloud)$/.test(host) && /(stg|dev|staging)$/.test(partes[0])) return 'staging';
  // A confirmação só vale para o endereço exacto que a pessoa confirmou, com a subpasta, se tiver.
  const limpo = (x) => String(x || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (limpo(confirmado) && limpo(confirmado) === identidade(url)) return 'staging';
  if (limpo(live) && limpo(live) === identidade(url)) return 'live';
  return 'produção';
}

// Uma loja Shopify, como vier: xxx.myshopify.com ou o endereço do painel (admin.shopify.com/store/xxx/...).
// Devolve xxx.myshopify.com, ou '' se não for uma loja Shopify.
export function lojaShopify(texto) {
  const t = String(texto || '').trim().replace(/\s/g, '').toLowerCase();
  const painel = t.match(/admin\.shopify\.com\/store\/([a-z0-9][a-z0-9-]*)/);
  if (painel) return `${painel[1]}.myshopify.com`;
  const dominio = t.match(/^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*)\.myshopify\.com(?:[/:?#]|$)/);
  return dominio ? `${dominio[1]}.myshopify.com` : '';
}
