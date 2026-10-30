// Os clientes vivem em clientes/<nome>/, e só um está activo de cada vez (o nome fica em .cliente).
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Cópia recursiva feita à mão: o fs.cpSync do Node 22 rebenta no Windows quando o caminho tem acentos (C:\\Users\\João).
export function copiar(origem, destino) {
  if (statSync(origem).isDirectory()) {
    mkdirSync(destino, { recursive: true });
    for (const nome of readdirSync(origem)) copiar(join(origem, nome), join(destino, nome));
  } else {
    copyFileSync(origem, destino);
  }
}

export const pastaDe = (nome) => `${raiz}/clientes/${nome}`;
export const nomeValido = (nome) => /^[a-z0-9][a-z0-9-]*$/.test(nome || '');

export function activo() {
  const f = `${raiz}/.cliente`;
  const nome = existsSync(f) ? readFileSync(f, 'utf8').trim() : '';
  return nomeValido(nome) && existsSync(pastaDe(nome)) ? nome : '';
}

export function activar(nome) {
  if (!existsSync(pastaDe(nome))) throw new Error(`Não há nenhum cliente "${nome}". Ver a lista com node scripts/cliente.mjs`);
  writeFileSync(`${raiz}/.cliente`, `${nome}\n`);
}

export function lista() {
  if (!existsSync(`${raiz}/clientes`)) return [];
  return readdirSync(`${raiz}/clientes`, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(`${pastaDe(d.name)}/CLAUDE.md`))
    .map((d) => d.name);
}

export function nomeComercial(nome) {
  try { return JSON.parse(readFileSync(`${pastaDe(nome)}/marca.json`, 'utf8').replace(/^\uFEFF/, '')).cliente || nome; } catch { return nome; }
}

export function criar(nome, comercial) {
  if (!nomeValido(nome)) throw new Error('O nome do cliente vai em minúsculas, sem espaços nem acentos: clinica-sorriso, loja-norte.');
  const pasta = pastaDe(nome);
  if (existsSync(pasta)) throw new Error(`O cliente "${nome}" já existe.`);
  copiar(`${raiz}/scripts/modelo`, pasta);
  mkdirSync(`${pasta}/imagens`, { recursive: true });
  if (comercial) {
    const claude = `${pasta}/CLAUDE.md`;
    writeFileSync(claude, readFileSync(claude, 'utf8')
      .replace('# [nome comercial]', `# ${comercial}`)
      .replace('| Nome | `[nome comercial]` |', `| Nome | ${comercial} |`));
    const m = JSON.parse(readFileSync(`${pasta}/marca.json`, 'utf8').replace(/^\uFEFF/, ''));
    m.cliente = comercial;
    writeFileSync(`${pasta}/marca.json`, JSON.stringify(m, null, 2) + '\n');
  }
  return pasta;
}
