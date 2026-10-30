// Levanta um WordPress de treino com Elementor nesta máquina e liga-o ao kit.
// Fica a correr à parte, mesmo depois de fechar o Claude Code, até se parar ou desligar o computador.
// É descartável: parar apaga o site.
// uso: node scripts/treino.mjs          levanta (ou reaproveita o que já está a correr)
//      node scripts/treino.mjs --parar  pára
//      node scripts/treino.mjs --limpar-cache   apaga a cópia do Playground que o npm guardou, e levanta de novo
//      node scripts/treino.mjs --cliente <nome>   liga também esse cliente ao treino (para treinar com uma réplica do site dele)
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, openSync, rmSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { activo, activar, criar, pastaDe } from './clientes.mjs';
import { explicar } from './falhas.mjs';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const windows = process.platform === 'win32';
const PORTA = 9400;
const URL_TREINO = `http://127.0.0.1:${PORTA}`;
const PID = `${raiz}/treino/.pid`;

// Depois de reiniciar o computador o .pid fica velho e o número pode já ser de outro programa: só conta se for o treino.
function treinoVivo() {
  if (!existsSync(PID)) return 0;
  const pid = Number(readFileSync(PID, 'utf8'));
  const comando = windows
    ? spawnSync('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8' }).stdout || ''
    : spawnSync('ps', ['-o', 'command=', '-p', String(pid)], { encoding: 'utf8' }).stdout || '';
  return (windows ? /"(cmd|node)\.exe"/i.test(comando) : /npx|playground|npm exec/.test(comando)) ? pid : 0;
}
function parar() {
  const pid = treinoVivo();
  if (pid) {
    try {
      // No Windows não há grupos de processos: o taskkill /T pára o servidor e os filhos.
      if (windows) spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
      else process.kill(-pid);
    } catch {}
  }
  rmSync(PID, { force: true });
}

if (process.argv[2] === '--parar') {
  if (!existsSync(PID)) {
    console.log('\n  Não há nenhum WordPress de treino lançado a partir desta pasta.\n');
    process.exit(0);
  }
  parar();
  console.log('\n  WordPress de treino parado.\n');
  process.exit(0);
}

const [maior] = process.versions.node.split('.').map(Number);
if (maior < 22) {
  console.error(`\n  O Node instalado é o ${process.versions.node}. O WordPress de treino precisa do 22 ou mais recente.`);
  console.error('  Instalar a versão LTS em https://nodejs.org e fechar o VS Code (ou o Terminal) por completo antes de voltar a abrir.\n');
  process.exit(1);
}

async function credenciais() {
  try {
    const r = await fetch(`${URL_TREINO}/wp-json/flowzi-treino/v1/credenciais`);
    if (!r.ok) return null;
    const c = JSON.parse((await r.text()).replace(/^\s*(<style\b[^>]*>[\s\S]*?<\/style>\s*)+/i, ''));
    return c.password ? c : null;
  } catch {
    return null;
  }
}

// O treino é um cliente como os outros, em clientes/treino/, para se aprender exactamente o que se faz num cliente real.
function gravarLigacao(c) {
  if (!existsSync(pastaDe('treino'))) criar('treino', 'WordPress de treino');
  const ligacao = `WP_URL=${URL_TREINO}\nWP_USER=${c.utilizador}\nWP_APP_PASSWORD=${c.password}\n`;
  writeFileSync(`${pastaDe('treino')}/.env`, ligacao);
  const outro = process.argv[2] === '--cliente' ? process.argv[3] : '';
  if (outro && existsSync(pastaDe(outro))) {
    // Nunca por cima da ligação a um staging real: perdia-se a password de aplicação.
    const envOutro = `${pastaDe(outro)}/.env`;
    const actual = existsSync(envOutro) ? readFileSync(envOutro, 'utf8') : '';
    if (actual && !actual.includes(URL_TREINO)) {
      console.log(`  ${outro} já está ligado a um staging e ficou como estava. Para treinar com ele, usar um cliente à parte.`);
    } else {
      writeFileSync(envOutro, ligacao);
      console.log(`  ${outro} também ficou ligado ao treino.`);
    }
  }
  const agora = activo();
  if (!agora || agora === 'treino') {
    activar('treino');
    console.log('  Ligação gravada em clientes/treino/. Cliente activo: treino.');
  } else {
    console.log(`  Ligação gravada em clientes/treino/. O cliente activo continua a ser ${agora}; para treinar: /cliente treino.`);
  }
}

function pronto(c) {
  gravarLigacao(c);
  console.log(`
  WordPress de treino pronto.

  painel          ${URL_TREINO}/wp-admin/   (se pedir login: admin / password)
  página de teste ${URL_TREINO}/ortodontia/

  Fica a correr até desligar o computador. Para parar: node scripts/treino.mjs --parar
`);
}

const jaExiste = await credenciais();
if (jaExiste) {
  console.log(`\n  Já há um WordPress de treino a correr em ${URL_TREINO}.`);
  pronto(jaExiste);
  process.exit(0);
}

if (process.argv[2] === '--limpar-cache') {
  parar();
  // O npx guarda o Playground em <cache do npm>/_npx; se ficou a meio, os arranques seguintes falham sempre.
  const cache = (spawnSync(windows ? 'npm.cmd config get cache' : 'npm config get cache', { shell: true, encoding: 'utf8' }).stdout || '').trim();
  if (cache) rmSync(join(cache, '_npx'), { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  console.log('\n  Cópia do Playground apagada. Vai ser descarregada outra vez.');
}

const lerRegisto = () => { try { return readFileSync(`${raiz}/treino/servidor.log`, 'utf8'); } catch { return ''; } };
let parou = null;
if (treinoVivo()) {
  // Um treino lançado antes ainda está a arrancar: espera-se por ele em vez de lançar outro por cima.
  console.log('\n  O WordPress de treino já está a arrancar. A esperar por ele.\n');
} else {
console.log('\n  A levantar o WordPress de treino. A primeira vez demora 2 a 5 minutos (descarrega o WordPress e o Elementor).\n');
const registo = openSync(`${raiz}/treino/servidor.log`, 'w');
const uploads = `${raiz}/treino/uploads`;
try {
  rmSync(uploads, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
} catch {
  console.error('\n  Um ficheiro do treino está bloqueado (OneDrive, antivírus ou um treino antigo). Correr node scripts/treino.mjs --parar e tentar outra vez; se continuar, reiniciar o computador.\n');
  process.exit(1);
}
mkdirSync(uploads, { recursive: true });
const argumentos = [
  // Versão fixa: o treino só muda quando a Flowzi actualiza o kit e volta a testar.
  '-y', '@wp-playground/cli@3.1.57', 'server',
  `--blueprint=${resolve(raiz, 'treino', 'blueprint.json')}`, `--port=${PORTA}`, '--login',
  // Os ficheiros gerados (o CSS de cada página) ficam no disco, à vista de todos os processos do Playground.
  // --mount-dir recebe os dois caminhos à parte, porque a letra do disco no Windows (C:) partia o formato "origem:destino".
  '--mount-dir', uploads, '/wordpress/wp-content/uploads',
];
// No Windows o npx é um .cmd e só arranca pela shell, que parte caminhos com espaços (C:\Users\Nome Apelido) se não levarem aspas.
const aspas = (a) => (windows && /\s/.test(a) ? `"${a}"` : a);
// No Windows vai uma só linha de comando, porque o Node 24 avisa (DEP0190) quando a shell recebe argumentos à parte.
// Com um antivírus ou uma rede que inspecciona o https, o Node só confia nos certificados se usar os do sistema.
const [, menor] = process.versions.node.split('.').map(Number);
const ambienteServidor = { ...process.env };
if (maior > 22 || menor >= 15) ambienteServidor.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --use-system-ca`.trim();
const servidor = windows
  ? spawn(`npx ${argumentos.map(aspas).join(' ')}`, { shell: true, detached: true, windowsHide: true, stdio: ['ignore', registo, registo], env: ambienteServidor })
  : spawn('npx', argumentos, { detached: true, stdio: ['ignore', registo, registo], env: ambienteServidor });
writeFileSync(PID, String(servidor.pid));
servidor.on('exit', (codigo) => { parou = codigo; });
servidor.unref();
}

const limite = Date.now() + 8 * 60 * 1000;
let voltas = 0;
while (Date.now() < limite) {
  await new Promise((r) => setTimeout(r, 3000));
  if (parou !== null) {
    rmSync(PID, { force: true });
    console.error(`\n  O WordPress de treino não arrancou (código ${parou}).\n  ${explicar(lerRegisto())}\n`);
    process.exit(1);
  }
  const c = await credenciais();
  if (c) {
    // O Playground arranca vários processos; esperar que todos respondam antes de dizer que está pronto.
    let seguidas = 0;
    while (seguidas < 8 && Date.now() < limite) {
      seguidas = (await credenciais()) ? seguidas + 1 : 0;
      await new Promise((r) => setTimeout(r, 500));
    }
    pronto(c);
    process.exit(0);
  }
  if (++voltas % 10 === 0) console.log('  ainda a preparar...');
}
parar();
const registoFinal = lerRegisto();
console.error(`\n  Passaram 8 minutos sem resposta e o treino foi parado.\n  ${/ENOTFOUND|ETIMEDOUT|ECONNRESET|CERT|EPERM|EBUSY|ENOSPC/i.test(registoFinal) ? explicar(registoFinal) : 'A internet pode estar muito lenta: tentar outra vez numa rede melhor. Se voltar a acontecer, enviar as últimas linhas de treino/servidor.log à Flowzi.'}\n`);
process.exit(1);
