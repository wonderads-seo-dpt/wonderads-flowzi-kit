// Depois de alterar por API uma página que já tinha sido vista, o Elementor continua a servir o CSS antigo.
// O caminho certo é abrir a página no editor e carregar em "Guardar rascunho": regenera só essa página.
// Este script é a alternativa sem navegador: limpa a cache de CSS do Elementor do site inteiro.
// uso: node scripts/regenerar-css.mjs --site-inteiro
import { wp, exigirLigacao, site } from './wp.mjs';

exigirLigacao();
if (process.argv[2] !== '--site-inteiro') {
  console.log(`
  Caminho recomendado: abrir a página no editor do Elementor e carregar em "Guardar rascunho".

  Este script limpa o CSS do Elementor do site inteiro (${site}). Não muda nada visível,
  mas todas as páginas voltam a gerar o CSS na visita seguinte. Usar em local ou staging.
  Num site em produção, só com autorização de quem gere o site.

  Para avançar: node scripts/regenerar-css.mjs --site-inteiro
`);
  process.exit(0);
}

try {
  await wp('elementor/v1/cache', { method: 'DELETE' });
  console.log('\n  Cache de CSS do Elementor limpa. A próxima visita a cada página gera o CSS novo.\n');
} catch (e) {
  console.error(`\n  Não foi possível limpar: ${e.message}`);
  console.error('  Provavelmente o utilizador não é administrador. Usar o editor: "Guardar rascunho".\n');
  process.exit(1);
}
