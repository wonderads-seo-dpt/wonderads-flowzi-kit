// Publica, esconde ou apaga uma página ou um artigo na loja Shopify do cliente activo.
// Sem --confirmo só mostra o que vai fazer; o Claude diz isso à pessoa e só repete com --confirmo depois do sim dela.
// Apagar guarda antes uma cópia completa em clientes/<cliente>/copias/.
// uso: node scripts/shopify-publicar.mjs <publicar|esconder|apagar> clientes/<cliente>/paginas/<pagina>.mjs [--confirmo]
//      node scripts/shopify-publicar.mjs <publicar|esconder|apagar> pagina <número>   (ou artigo <número>)
import { exigirLoja, ler, mudarEstado, registo, ficheiroDoCliente, guardarCopia, painel, numero, loja } from './shopify.mjs';

exigirLoja();
const args = process.argv.slice(2).filter((a) => a !== '--confirmo');
const confirmado = process.argv.includes('--confirmo');
const [accao, alvo, num] = args;
const USO = '\n  uso: node scripts/shopify-publicar.mjs <publicar|esconder|apagar> clientes/<cliente>/paginas/<pagina>.mjs\n       node scripts/shopify-publicar.mjs <publicar|esconder|apagar> pagina <número>   (ou artigo <número>)\n';
if (!['publicar', 'esconder', 'apagar'].includes(accao) || !alvo) {
  console.error(USO);
  process.exit(1);
}

let tipo;
let id;
if (/^(pagina|artigo)$/.test(alvo)) {
  if (!/^\d+$/.test(num || '')) { console.error(USO); process.exit(1); }
  tipo = alvo;
  id = `gid://shopify/${tipo === 'pagina' ? 'Page' : 'Article'}/${num}`;
} else {
  id = registo(ficheiroDoCliente(alvo)).id;
  if (!id) throw new Error(`${alvo} ainda não foi gravado nesta loja (${loja}). Gravar primeiro com /shopify-pagina ou /shopify-artigo.`);
  tipo = /\/Article\//.test(id) ? 'artigo' : 'pagina';
}

const actual = (await ler(tipo, { id }))?.[tipo === 'pagina' ? 'page' : 'article'];
if (!actual) throw new Error(`Não encontrei ${tipo === 'pagina' ? 'a página' : 'o artigo'} ${numero(id)} na loja ${loja}.`);
const nomeTipo = tipo === 'pagina' ? 'a página' : 'o artigo';
const endereco = tipo === 'pagina' ? `/pages/${actual.handle}` : `/blogs/${actual.blog?.handle || '...'}/${actual.handle}`;
const visivel = actual.isPublished !== false;

if ((accao === 'publicar' && visivel) || (accao === 'esconder' && !visivel)) {
  console.log(`\n  ${nomeTipo[0].toUpperCase()}${nomeTipo.slice(1)} "${actual.title}" já está ${visivel ? 'publicada' : 'escondida'}. Nada a fazer.\n`);
  process.exit(0);
}

const AVISO = {
  publicar: `PUBLICAR ${nomeTipo} "${actual.title}" na loja ${loja}.\n  Passa a ser visível para quem visita a loja, em ${endereco}.`,
  esconder: `ESCONDER ${nomeTipo} "${actual.title}" na loja ${loja}.\n  Deixa de se ver em ${endereco}; quem tiver a ligação recebe uma página de erro.`,
  apagar: `APAGAR ${nomeTipo} "${actual.title}" da loja ${loja}${visivel ? ', que está PUBLICADA' : ''}.\n  A Shopify não tem reciclagem: guarda-se antes uma cópia em copias/, mas o endereço ${endereco} deixa de existir.`,
};
if (!confirmado) {
  console.log(`\n  Vai ${AVISO[accao]}\n\n  Nada foi feito. Dizer isto à pessoa e, só se ela disser que sim, correr o mesmo comando com --confirmo no fim.\n`);
  process.exit(0);
}

let copia = '';
if (accao === 'apagar') copia = guardarCopia(tipo, actual);
const res = await mudarEstado(tipo, id, accao);
const final = res?.page || res?.article;
console.log(`
  ${tipo === 'pagina' ? 'página' : 'artigo'}          ${numero(id)} · ${actual.title}
  feito           ${accao === 'apagar' ? 'apagado da loja' : final?.isPublished ? 'publicado, visível na loja' : 'escondido (só se vê no painel)'}
  loja            ${loja}${accao === 'apagar' ? `\n  cópia           ${copia.replace(/^.*clientes/, 'clientes')}` : `\n  editar          ${painel(`${tipo === 'pagina' ? 'pages' : 'articles'}/${numero(id)}`)}`}
`);
