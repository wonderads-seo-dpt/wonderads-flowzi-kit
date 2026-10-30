// Só se instala uma versão do kit assinada pela Flowzi: um zip que chegue por email ou por uma página web
// não consegue trocar a guarda nem a tranca. A chave privada vive só no computador da Flowzi.
import { createHash, createPublicKey, verify } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const CHAVE_FLOWZI = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA0uc53WMDBQrmfKtVUutXkLiWWfMOVWsO2fe0vI9WwZM=
-----END PUBLIC KEY-----`;

export const MANIFESTO = 'MANIFESTO.json';
export const ASSINATURA = 'ASSINATURA';

export function ficheirosDe(pasta) {
  const lista = [];
  const andar = (p) => {
    for (const nome of readdirSync(p)) {
      const f = join(p, nome);
      if (statSync(f).isDirectory()) andar(f);
      else lista.push(relative(pasta, f).split(sep).join('/'));
    }
  };
  andar(pasta);
  return lista.sort();
}

export const hash = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
// O Finder e o Explorador deixam ficheiros seus nas pastas que se abrem; não contam.
export const lixo = (f) => /(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini|\._[^/]*)$/i.test(f) || f.startsWith('__MACOSX/');
// Só existem no repositório da equipa (a página do GitHub, os modelos, os fins de linha): numa pasta clonada não
// contam como a mais, e o /actualizar nunca os copia, porque só copia o que está assinado.
export const soDoRepositorio = (f) => f === '.git' || /^\.git(hub)?\//.test(f) || f === 'README.md' || f === '.gitattributes';

// Devolve a versão e a lista de ficheiros assinados do kit novo, ou lança um erro a dizer porque não se pode instalar.
export function verificar(pasta, chave = CHAVE_FLOWZI) {
  if (!existsSync(join(pasta, MANIFESTO)) || !existsSync(join(pasta, ASSINATURA))) {
    throw new Error('Esta versão não vem assinada pela Flowzi. Não se instala: pedir à Flowzi o zip oficial.');
  }
  const bruto = readFileSync(join(pasta, MANIFESTO));
  const assinatura = Buffer.from(readFileSync(join(pasta, ASSINATURA), 'utf8').trim(), 'base64');
  if (!verify(null, bruto, createPublicKey(chave), assinatura)) {
    throw new Error('A assinatura não é da Flowzi (ou o zip foi alterado). Não se instala: pedir à Flowzi o zip oficial.');
  }
  const m = JSON.parse(bruto.toString('utf8'));
  const presentes = ficheirosDe(pasta).filter((f) => f !== MANIFESTO && f !== ASSINATURA && !lixo(f));
  const esperados = Object.keys(m.ficheiros || {}).sort();
  const aMais = presentes.filter((f) => !Object.hasOwn(m.ficheiros, f) && !soDoRepositorio(f));
  const emFalta = esperados.filter((f) => !presentes.includes(f));
  const alterados = esperados.filter((f) => presentes.includes(f) && hash(join(pasta, f)) !== m.ficheiros[f]);
  if (aMais.length || emFalta.length || alterados.length) {
    const lista = [...aMais.map((f) => `a mais: ${f}`), ...emFalta.map((f) => `em falta: ${f}`), ...alterados.map((f) => `alterado: ${f}`)];
    throw new Error(`O zip não bate certo com a assinatura da Flowzi (${lista.slice(0, 5).join('; ')}). Não se instala.`);
  }
  return { versao: m.versao || '', ficheiros: new Set(esperados) };
}
