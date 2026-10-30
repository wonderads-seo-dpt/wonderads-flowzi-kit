// O corpo das páginas e dos artigos na Shopify é HTML. Escreve-se em blocos, como os artigos do WordPress do kit,
// e este módulo transforma-os: texto escapado, imagens na loja e sempre com texto alternativo.
// (As páginas com desenho escrevem-se com as peças de scripts/shopify-desenho.mjs.)
// Blocos: ['h2', texto] · ['h3', texto] · ['p', texto] · ['lista', [itens]] · ['imagem', { ficheiro | url, alt }]
//         · ['botao', { texto, url }] · ['citacao', texto]
import { join } from 'node:path';
import { enviarImagem, imagemNaLoja, pasta } from './shopify.mjs';

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// O texto pode trazer <strong>, <em> e <a href="...">; tudo o resto é escapado.
// Só ligações para páginas (https, http, /, #), email e telefone: nada de javascript: nem data:.
const ligacaoSegura = (u) => /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(String(u).trim());
const inline = (t) => esc(t).replace(/&lt;(\/?)(strong|em|a)(\s+href=&quot;((?:(?!&quot;).)*)&quot;)?&gt;/g, (todo, f, tag, href, url) => {
  if (!href) return `<${f}${tag}>`;
  const destino = url.replace(/&amp;/g, '&');
  if (!ligacaoSegura(destino)) throw new Error(`Ligação recusada: ${destino}. Só https, /, #, mailto: ou tel:.`);
  return `<${tag} href="${esc(destino)}">`;
});

export async function html(blocos = [], perguntas = []) {
  if (!Array.isArray(blocos) || !blocos.length) throw new Error('Faltam os blocos do texto (blocos: [[\'h2\', ...], [\'p\', ...]]).');
  const partes = [];
  for (const [tipo, valor] of blocos) {
    if (tipo === 'h1') throw new Error('Sem h1 no texto: o título da página ou do artigo já é o h1 da loja. Usar h2.');
    if (tipo === 'h2' || tipo === 'h3') partes.push(`<${tipo}>${inline(valor)}</${tipo}>`);
    else if (tipo === 'p') partes.push(`<p>${inline(valor)}</p>`);
    else if (tipo === 'citacao') partes.push(`<blockquote><p>${inline(valor)}</p></blockquote>`);
    else if (tipo === 'lista') partes.push(`<ul>${valor.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`);
    else if (tipo === 'imagem') partes.push(`<p><img src="${esc(await imagem(valor))}" alt="${esc(valor.alt)}" loading="lazy"></p>`);
    else if (tipo === 'botao') {
      if (!valor?.texto || !valor?.url) throw new Error('Um botão precisa de texto e de url.');
      if (!ligacaoSegura(valor.url)) throw new Error(`Ligação recusada no botão: ${valor.url}. Só https, /, #, mailto: ou tel:.`);
      partes.push(`<p><a class="button" href="${esc(valor.url)}">${esc(valor.texto)}</a></p>`);
    } else throw new Error(`Bloco desconhecido: "${tipo}". Usar h2, h3, p, lista, imagem, botao ou citacao.`);
  }
  if (perguntas?.length) {
    partes.push('<h2>Perguntas frequentes</h2>');
    for (const q of perguntas) {
      if (!q.pergunta || !q.resposta) throw new Error('Cada pergunta frequente precisa de pergunta e resposta.');
      partes.push(`<h3>${inline(q.pergunta)}</h3>`, `<p>${inline(q.resposta)}</p>`);
    }
  }
  return partes.join('\n');
}

// Um ficheiro da pasta do cliente (por exemplo imagens/sorriso.jpg) ou um endereço https. Devolve o endereço no CDN da loja;
// uma imagem que já lá está (cdn.shopify.com) usa-se sem subir.
export async function imagem(valor) {
  if (!valor?.alt) throw new Error(`A imagem ${valor?.ficheiro || valor?.url || ''} precisa de texto alternativo (alt).`);
  if (valor.url) return imagemNaLoja(valor.url, valor.alt);
  if (valor.ficheiro) return enviarImagem(join(pasta, valor.ficheiro), valor.alt);
  throw new Error('Uma imagem precisa de ficheiro (na pasta do cliente) ou de url.');
}
