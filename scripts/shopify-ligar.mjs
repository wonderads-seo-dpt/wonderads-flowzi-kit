// Reconhecimento da loja Shopify do cliente activo, só leitura: nome, plano, permissões da app e blogues.
// uso: node scripts/shopify-ligar.mjs
import { writeFileSync } from 'node:fs';
import { exigirLoja, ler, loja, pasta, cliente } from './shopify.mjs';

exigirLoja();
const d = await ler('loja');
const blogs = (await ler('blogs')).blogs.nodes;
const escondidas = (await ler('paginas', { q: 'published_status:unpublished' })).pages.nodes.length;
const scopes = d.currentAppInstallation.accessScopes.map((s) => s.handle);
const alertas = [];
if (!scopes.some((s) => s === 'write_content' || s === 'write_online_store_pages')) alertas.push('A app não tem write_content: não consegue gravar páginas nem artigos. O dono da loja junta-a no Dev Dashboard e liberta uma versão nova.');
if (!scopes.some((s) => ['write_files', 'write_images', 'write_themes'].includes(s))) alertas.push('A app não tem write_files: os textos gravam-se, mas as imagens não sobem.');
// Permissões a mais: o kit não as usa, e numa chave que vive num computador da agência são risco sem proveito.
const aMais = scopes.filter((s) => /^write_/.test(s) && !['write_content', 'write_online_store_pages', 'write_files', 'write_images'].includes(s));
if (aMais.length) alertas.push(`A app tem permissões que o kit não usa (${aMais.join(', ')}). Pedir ao dono da loja para as tirar.`);
if (!blogs.length) alertas.push('A loja não tem blogue: os artigos só entram depois de uma pessoa o criar.');

const linhas = [
  ['Loja', `${d.shop.name} (${d.shop.myshopifyDomain})`],
  ['Domínio', d.shop.primaryDomain?.url || '—'],
  ['Plano', `${d.shop.plan?.publicDisplayName || '—'}${d.shop.plan?.partnerDevelopment ? ' · loja de desenvolvimento' : ''}`],
  ['Permissões da app', scopes.join(', ') || 'nenhuma'],
  ['Blogues', blogs.map((b) => `${b.title} (${b.handle})`).join(', ') || 'nenhum'],
  ['Páginas escondidas', String(escondidas)],
];
console.log(`\n  cliente ${cliente} · loja ${loja}\n`);
for (const [k, v] of linhas) console.log(`  ${k.padEnd(20)} ${v}`);
console.log(alertas.length ? `\n  Alertas:\n${alertas.map((a) => `  - ${a}`).join('\n')}\n` : '\n  Sem alertas.\n');
writeFileSync(`${pasta}/levantamento.md`, `# Levantamento da loja Shopify\n\n${new Date().toLocaleDateString('pt-PT')} · só leitura\n\n| | |\n|---|---|\n${linhas.map(([k, v]) => `| ${k} | ${v} |`).join('\n')}\n${alertas.length ? `\n## Alertas\n\n${alertas.map((a) => `- ${a}`).join('\n')}\n` : ''}`);
