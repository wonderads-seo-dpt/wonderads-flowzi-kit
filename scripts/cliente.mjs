// Ver, mudar ou criar o cliente activo.
// uso: node scripts/cliente.mjs                          lista os clientes e diz qual está activo
//      node scripts/cliente.mjs <nome>                   passa a trabalhar nesse cliente
//      node scripts/cliente.mjs --novo <nome> "Nome"     cria o cliente e passa a trabalhar nele
import { activo, activar, lista, criar, nomeComercial } from './clientes.mjs';

const [a, b, c] = process.argv.slice(2);
try {
  if (a === '--novo') {
    criar(b, c);
    activar(b);
    console.log(`\n  Cliente criado em clientes/${b}/ e activo.\n  Próximo passo: /wp-ligar (site WordPress) ou /shopify-ligar (loja Shopify).\n`);
  } else if (a) {
    activar(a);
    console.log(`\n  A trabalhar em: ${nomeComercial(a)} (clientes/${a}/).\n  Começar uma conversa nova com /clear, para não misturar com o cliente anterior.\n`);
  } else {
    const agora = activo();
    const todos = lista();
    console.log(todos.length ? `\n  Clientes:\n${todos.map((n) => `  ${n === agora ? '>' : ' '} ${n.padEnd(20)} ${nomeComercial(n)}`).join('\n')}` : '\n  Ainda não há clientes.');
    console.log(agora ? `\n  Activo: ${agora}\n` : '\n  Nenhum activo. Para criar: node scripts/cliente.mjs --novo <nome> "Nome comercial"\n');
  }
} catch (e) {
  console.error(`\n  ${e.message}\n`);
  process.exit(1);
}
