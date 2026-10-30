// A linha de baixo do Claude Code: em que cliente e em que site se está a trabalhar.
import { existsSync, readFileSync } from 'node:fs';
import { activo, pastaDe, nomeComercial } from './clientes.mjs';

const nome = activo();
if (!nome) {
  console.log('Sem cliente activo · /comecar na primeira vez, /cliente depois');
} else {
  let onde = 'sem ligação · /wp-ligar ou /shopify-ligar';
  const env = `${pastaDe(nome)}/.env`;
  if (existsSync(env)) {
    // Um valor por linha, como no wp.mjs: uma chave vazia nunca apanha a linha de baixo, e as aspas saem.
    const texto = readFileSync(env, 'utf8');
    const valor = (k) => (texto.match(new RegExp(`^[ \\t\\uFEFF]*${k}[ \\t]*=[ \\t]*["']?([^\\s"']+)`, 'm')) || [])[1];
    const url = valor('WP_URL');
    if (valor('SHOPIFY_LOJA')) {
      onde = `loja Shopify, só escondido · ${valor('SHOPIFY_LOJA')}`;
    } else if (url) {
      const { ambiente, identidade } = await import('./ambiente.mjs');
      const amb = ambiente(url, valor('WP_E_STAGING'), valor('WP_LIVE'));
      onde = `${amb === 'live' ? 'SITE REAL, só rascunhos' : amb} · ${identidade(url)}`;
    }
  }
  console.log(`Cliente: ${nomeComercial(nome)} · ${onde}`);
}
