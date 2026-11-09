// Dados estruturados (schema) que o plugin de SEO do site não gera, como JSON-LD dentro da página (ver /seo).
// É o único código que o kit põe numa página além da marcação das perguntas: um <script type="application/ld+json">
// sem mais nada, que o Elementor e o editor de blocos guardam num widget ou bloco HTML e que não se vê na página.
// A Shopify deita-o fora (shopify-desenho.mjs): lá o schema vem do tema ou de uma app.

// O FAQPage vem das perguntas(), com as perguntas que estão à vista: não se escreve à mão.
const PROIBIDOS = new Set(['FAQPage']);
const tiposDe = (n) => [].concat(n?.['@type'] || []).map(String);

export function validarSchema(dados) {
  const lista = [].concat(dados || []);
  if (!lista.length) throw new Error('schema(): sem dados. Passar um objecto com "@type", ou uma lista deles.');
  for (const n of lista) {
    if (!n || typeof n !== 'object' || Array.isArray(n)) throw new Error('schema(): cada entrada é um objecto com "@type".');
    const tipos = tiposDe(n);
    if (!tipos.length) throw new Error('schema(): falta o "@type" (por exemplo "MedicalWebPage", "MedicalCondition", "BreadcrumbList").');
    const mau = tipos.find((t) => PROIBIDOS.has(t));
    if (mau) throw new Error(`schema(): o ${mau} vem das perguntas(), com as perguntas à vista na página. Não se escreve à mão.`);
  }
  return lista;
}

// Uma entrada sai como objecto; várias, num @graph. O < escapa-se para o texto nunca fechar o <script>.
export function scriptSchema(dados) {
  const lista = validarSchema(dados).map(({ '@context': _c, ...resto }) => resto);
  const ld = lista.length === 1 ? { '@context': 'https://schema.org', ...lista[0] } : { '@context': 'https://schema.org', '@graph': lista };
  const json = JSON.stringify(ld).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  return `<script type="application/ld+json">${json}</script>`;
}

// Para o rever: os blocos de JSON-LD de um HTML, já lidos. Devolve { tipos, invalidos }.
export function lerSchemas(html = '') {
  const tipos = [];
  let invalidos = 0;
  for (const m of String(html).matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1]);
      for (const n of [].concat(j?.['@graph'] || j)) tipos.push(...tiposDe(n));
    } catch { invalidos++; }
  }
  return { tipos, invalidos };
}

// Um widget ou bloco HTML que só tem JSON-LD não é "código a fazer de página".
export const soSchema = (html = '') => /^\s*(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*)+$/i.test(String(html));
