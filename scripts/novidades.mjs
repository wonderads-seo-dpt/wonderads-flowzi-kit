// Corre ao abrir o Claude (hook SessionStart): se houver uma versão nova do kit no GitHub, diz-lho, para ele contar à
// pessoa o que traz e sugerir /actualizar. Vai à rede no máximo de 12 em 12 horas e nunca demora mais de 3 segundos.
// Calado em qualquer erro: abrir o Claude nunca pode falhar por causa disto.
// uso: node scripts/novidades.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

setTimeout(() => process.exit(0), 3000).unref();
const HORA = 3600 * 1000;
let saida = '';

try {
  const repo = await import('./repositorio.mjs');
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  let instalada = '';
  try { instalada = readFileSync(join(raiz, 'VERSAO'), 'utf8').trim(); } catch {}
  // Um /actualizar antigo instalava a versão nova sem o manifesto dela: o /contribuir recusa e a actualização
  // seguinte não sabe que scripts são da pessoa. Não depende da rede e avisa sempre.
  let manifesto = '';
  try { manifesto = JSON.parse(readFileSync(join(raiz, 'MANIFESTO.json'), 'utf8')).versao || ''; } catch {}
  if (instalada && manifesto !== instalada) {
    saida = 'O kit precisa de correr /actualizar outra vez para ficar completo (o MANIFESTO.json falta ou é de outra versão).'
      + ' Dizer à pessoa numa linha.\n';
  }
  const agora = Date.now();
  let cache = repo.lerCache() || {};
  if (typeof cache !== 'object' || Array.isArray(cache)) cache = {};
  // Sem rede tenta-se outra vez daqui a uma hora; com resposta (ou sem acesso), só daqui a 12.
  const validade = cache.falha === 'sem-rede' ? HORA : 12 * HORA;
  if (!(agora - (Number(cache.visto) || 0) < validade)) {
    const rel = await repo.release('', { tempo: 1200, tempoGh: 1500 });
    cache = rel.falha ? { ...cache, visto: agora, falha: rel.falha }
      : { ...cache, visto: agora, falha: '', versao: rel.versao };
    writeFileSync(repo.ficheiroCache(), JSON.stringify(cache));
  }
  // O aviso ao Claude também só sai uma vez em 12 horas por kit; a linha de baixo continua a mostrá-lo.
  const avisos = cache.avisos && typeof cache.avisos === 'object' ? cache.avisos : {};
  if (repo.maisRecente(cache.versao, instalada) && !(agora - (Number(avisos[raiz]) || 0) < 12 * HORA)) {
    // As notas da release não vêm para aqui: quem tem escrita no repositório pode escrevê-las, e o que sai daqui entra
    // no contexto do Claude. O que a versão traz lê-se no /actualizar, do NOVIDADES.md do zip assinado.
    saida += `Há uma versão nova do kit (${cache.versao}) no GitHub. Dizer à pessoa numa linha e sugerir /actualizar,`
      + ` que mostra o que traz. A instalada é ${instalada || 'anterior a 15/10/2026'}.\n`;
    const recentes = Object.entries(avisos).filter(([, t]) => agora - t < 12 * HORA);
    writeFileSync(repo.ficheiroCache(), JSON.stringify({ ...cache, avisos: Object.fromEntries([...recentes, [raiz, agora]]) }));
  }
} catch {}
// Sair só depois de a linha chegar ao Claude Code: num pipe, a escrita pode ser assíncrona.
if (saida) process.stdout.write(saida, () => process.exit(0));
else process.exit(0);
