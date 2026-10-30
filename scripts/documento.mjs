// Faz um documento do Word só com o texto de uma página ou artigo já gravado, para o cliente validar: comentar ou
// sugerir alterações. Fica em clientes/<cliente>/validacao/<slug>-<número>-<AAAA-MM-DD>.docx. Só lê o WordPress.
// Com --drive, copia-o para o Google Drive para computador, em "Validação de textos/<cliente>/", sem escrever por
// cima de uma cópia que já lá esteja (essa pode ter os comentários do cliente).
// Com um .docx em vez da página (por exemplo, o de uma página da Shopify), só o copia para o Drive.
// uso: node scripts/documento.mjs <id|endereço> [--drive ["pasta do Google Drive"]]
//      node scripts/documento.mjs clientes/<cliente>/validacao/<ficheiro>.docx --drive
import { exigirCliente, exigirLigacao, paginaEmEdicao, ficheiroDoCliente, site, cliente } from './wp.mjs';
import { documentoDePagina, paraDrive, pastaDoDrive, semDrive } from './validacao.mjs';

// No PowerShell 5.1, "G:\O meu disco\" chega como G:\O meu disco" e cola-lhe os argumentos seguintes: um caminho do
// Windows nunca tem aspas, por isso o que vem depois de uma aspa são outros argumentos.
const args = process.argv.slice(2).flatMap((a) => (a.includes('"') && !a.startsWith('--') ? a.split('"').flatMap((p, i) => (i ? p.split(/\s+/) : [p])).filter(Boolean) : [a]));
const pasta = (p) => {
  const s = p.trim().replace(/^['"]+|['"]+$/g, '').trim().replace(/[\\/]+$/, '');
  return /^[a-z]:$/i.test(s) ? `${s}\\` : s || p;
};
let ref = '';
let comDrive = false;
let pastaPedida = '';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--drive') {
    comDrive = true;
    // Uma pasta logo a seguir escolhe o Drive (por exemplo, com duas contas Google no mesmo computador).
    if (args[i + 1] && !args[i + 1].startsWith('--') && (ref || args.length > i + 2)) pastaPedida = pasta(args[++i]);
  } else if (!args[i].startsWith('--') && !ref) ref = args[i];
}
if (!ref) {
  console.error('uso: node scripts/documento.mjs <id|endereço> [--drive]  |  node scripts/documento.mjs clientes/<cliente>/validacao/<ficheiro>.docx --drive');
  process.exit(1);
}

let doc;
if (/\.docx$/i.test(ref)) {
  exigirCliente();
  const ficheiro = ficheiroDoCliente(ref);
  doc = { ficheiro, relativo: ref.replace(/\\/g, '/') };
  console.log(`\n  documento       ${doc.relativo}`);
} else {
  exigirLigacao();
  const pagina = await paginaEmEdicao(ref);
  doc = documentoDePagina(pagina, { site, cliente });
  const estado = { draft: 'rascunho', publish: 'publicada', pending: 'pendente', private: 'privada', future: 'agendada' }[pagina.status] || pagina.status;
  console.log(`
  ${pagina.type === 'post' ? 'artigo' : 'página'}          ${pagina.id} · ${pagina.title?.raw || ''} · ${estado}
  documento       ${doc.relativo}
  conteúdo        ${doc.resumo || 'sem texto'}`);
}

if (comDrive) {
  const destino = paraDrive(doc.ficheiro, cliente, pastaPedida || pastaDoDrive());
  console.log(destino
    ? `  Google Drive    copiado para ${destino}
                  O Drive guarda-o como .docx: o Google Docs abre-o e deixa comentar e sugerir. Para o converter num
                  documento Google, abri-lo e Ficheiro → Guardar como Documentos Google. Partilhar com o cliente
                  com permissão de comentar.`
    : `  Google Drive    ${semDrive(doc.relativo, cliente)}`);
}
console.log('');
