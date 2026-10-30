// Os títulos de uma página que já existe: ver que estilos têm em cada nível, e uniformizá-los pelo marca.json.
// Uniformizar cria sempre uma cópia em rascunho, como o seccao.mjs; a página original fica como estava.
// uso: node scripts/titulos.mjs --ver                     o estilo dos títulos do cliente (marca.json), com os avisos de contraste
//      node scripts/titulos.mjs --ver <id|endereço>       os títulos da página por nível, com os estilos que têm (só lê)
//      node scripts/titulos.mjs <id|endereço>             cópia em rascunho com todos os títulos no estilo do marca.json
//      ... --copia <id>   volta a gravar uma cópia feita antes, em vez de criar outra (só se continuar em rascunho)
import { readFileSync, existsSync } from 'node:fs';
import { wp, exigirLigacao, paginaEmEdicao, lerElementor, guardarCopia, ligacoes, raiz, pasta, cliente } from './wp.mjs';
import { titulosDaMarca, titulosElementor, titulosBlocos, variantes, descrever, assinatura, lerEstiloElementor, clara, NIVEIS } from './titulos-estilo.mjs';

const args = process.argv.slice(2);
const ver = args.some((a) => /^--ver/.test(a));
const iCopia = args.indexOf('--copia');
const copiaAnterior = iCopia >= 0 ? args[iCopia + 1] : '';
const ref = args.find((a, i) => !a.startsWith('--') && (iCopia < 0 || i !== iCopia + 1));
if ((!ver && !ref) || (iCopia >= 0 && !/^\d+$/.test(copiaAnterior || ''))) {
  console.error('uso: node scripts/titulos.mjs --ver [<id|endereço>]  |  node scripts/titulos.mjs <id|endereço> [--copia <id>]');
  process.exit(1);
}

const ficheiroMarca = pasta && existsSync(`${pasta}/marca.json`) ? `${pasta}/marca.json` : `${raiz}/scripts/modelo/marca.json`;
const marca = JSON.parse(readFileSync(ficheiroMarca, 'utf8').replace(/^\uFEFF/, ''));
const T = titulosDaMarca(marca, `clientes/${cliente || '?'}/marca.json`);
const NOMES = { rotulo: 'rótulo' };
const nome = (n) => (NOMES[n] || n).padEnd(7);
const SUFIXO = '[rascunho: títulos uniformizados]';

// O estilo que o marca.json dá a cada nível, lido como se fosse um widget (para comparar com os da página).
const alvo = (n) => {
  const e = T.estilo(n);
  return lerEstiloElementor({ ...T.elementor(e), title_color: e.cor }, 'typography_', e.destaque ? `<em style="${T.cssDestaque(e)}">` : '');
};

if (ver) {
  console.log(`\n  Títulos de ${cliente || 'o modelo'} (marca.json${T.titulos?.estilo ? `, estilo ${T.titulos.estilo}` : ''})`);
  if (!T.titulos) console.log('  Sem "titulos" no marca.json: cada título sai com os valores do kit e o que vier na chamada.');
  for (const n of NIVEIS.filter((x) => T.definidos.includes(x) || (T.titulos?.destaque && x !== 'rotulo'))) {
    const a = alvo(n);
    const d = T.estilo(n).destaque;
    if (d?.estilo === 'degrade') a.destaque = `degradê ${d.cor} → ${d.cor2} (no Elementor, ${a.destaque})`;
    console.log(`  ${nome(n)} ${descrever(a)}`);
  }
  const avisos = T.avisos();
  if (avisos.length) console.log(`\n  Avisos\n${avisos.map((a) => `  - ${a}`).join('\n')}`);
  if (!ref) { console.log(''); process.exit(0); }
}

exigirLigacao();
const original = await paginaEmEdicao(ref);
const elementos = lerElementor(original);
const emBlocos = !elementos.length && /<!-- wp:/.test(original.content?.raw || '');
const titulos = emBlocos ? titulosBlocos(original.content.raw) : titulosElementor(elementos);

const plural = (n, um, varios) => (n === 1 ? `1 ${um}` : `${n} ${varios}`);
const mostrar = (lista, comMarca) => {
  for (const { nivel, estilos, destaques } of variantes(lista)) {
    const total = estilos.reduce((a, v) => a + v.titulos.length, 0);
    console.log(`\n  ${nome(nivel)} ${plural(total, 'título', 'títulos')}, ${estilos.length === 1 ? '1 estilo' : `${estilos.length} estilos diferentes`}`);
    // Um estilo só com títulos claros compara-se sem a cor (estão sobre fundo escuro).
    const certo = comMarca && T.definidos.includes(nivel) ? [assinatura(alvo(nivel)), assinatura({ ...alvo(nivel), cor: '#FFFFFF' })] : [];
    estilos.forEach((v, i) => {
      const exemplos = v.titulos.slice(0, 3).map((x) => `"${x.texto.slice(0, 40)}" (secção ${x.seccao})`).join(', ') + (v.titulos.length > 3 ? ', ...' : '');
      console.log(`    ${String.fromCharCode(65 + i)} (${v.titulos.length}${v.claros ? `, ${v.claros} sobre fundo escuro` : ''}${v.globais ? `, ${v.globais} com cor global` : ''})${v.assinatura === certo[0] || (v.claros + v.globais === v.titulos.length && v.assinatura === certo[1]) ? ' = marca.json' : ''}  ${descrever(v.estilo)}\n          ${exemplos}`);
    });
    if (destaques.length) {
      const daMarca = comMarca && alvo(nivel).destaque;
      console.log(`    palavras em <em>: ${destaques.join(' · ')}${destaques.length > 1 ? ' (diferentes)' : ''}${daMarca ? ` · marca.json: ${daMarca}` : ''}`);
    }
  }
};

if (ver) {
  console.log(`\n  ${original.title.raw} · ${original.status} · ${emBlocos ? 'blocos do WordPress' : 'Elementor'} · ${titulos.length} títulos`);
  if (!titulos.length) console.log('\n  Não encontrei títulos nesta página.');
  mostrar(titulos, !emBlocos);
  console.log('');
  process.exit(0);
}

if (emBlocos) {
  console.error(`\n  A página ${original.id} é em blocos do WordPress: o titulos.mjs ainda só uniformiza páginas Elementor.
  Se foi feita pelo kit, gravar outra vez o ficheiro dela com node scripts/criar-pagina-blocos.mjs: as peças já seguem o marca.json.\n`);
  process.exit(1);
}
if (!elementos.length) {
  console.error(`\n  A página ${ref} não tem conteúdo Elementor. Pode ser feita noutro construtor (WPBakery, Divi).\n`);
  process.exit(1);
}
if (!T.definidos.length && !T.titulos?.destaque) {
  console.error('\n  O marca.json não tem "titulos": não há estilo para aplicar. Gravar primeiro o estilo de cada nível em "titulos" (ver /design) e correr outra vez.\n');
  process.exit(1);
}

// Cada título passa ao estilo do seu nível. O que o marca.json não diz vem do estilo mais usado nesse nível na página,
// para todos ficarem iguais mesmo com um "titulos" incompleto; um título de cor clara (sobre fundo escuro) fica com a
// sua cor. Saem os efeitos que o estilo não tem (sombra, contorno, mistura).
// A cor global e a tipografia global de um título ficam, se o marca.json não disser a cor ou a letra desse nível.
// Um nível que o marca.json não tem só recebe o destaque geral nas palavras em <em>.
const TIPO = ['familia', 'tamanho', 'tablet', 'telemovel', 'peso', 'altura', 'espacamento', 'maiusculas', 'italico'];
const maisUsado = Object.fromEntries(variantes(titulos).map((v) => [v.nivel, v.estilos[0].estilo]));
const tirar = (k, prefixo, { cor, tipo }) => (tipo && k.startsWith(prefixo)) || (cor && k === 'title_color')
  || (prefixo === 'typography_' && /^(text_stroke_|text_shadow_|blend_mode$)/.test(k));
const novos = JSON.parse(JSON.stringify(elementos));
const mudados = [];
for (const x of titulosElementor(novos)) {
  const n = x.nivel;
  const s = x.widget.settings;
  const tinha = x.estilo;
  const doNivel = T.titulos?.[n];
  if (!doNivel) {
    if (!(T.titulos?.destaque && /^h[1-3]$/.test(n))) continue;
    const destacado = T.destacar(s[x.campo], T.estilo(n, /^#/.test(tinha.cor || '') ? { cor: tinha.cor } : {}));
    if (destacado !== s[x.campo]) { s[x.campo] = destacado; mudados.push(x); }
    continue;
  }
  const g = s.__globals__ || {};
  const muda = {
    cor: doNivel.cor !== undefined || !g.title_color,
    tipo: TIPO.some((c) => doNivel[c] !== undefined) || !g[`${x.prefixo}typography`],
  };
  const base = maisUsado[n] || tinha;
  const proprio = Object.fromEntries(TIPO
    .filter((c) => typeof base[c] === (c === 'familia' || c === 'peso' ? 'string' : c === 'maiusculas' || c === 'italico' ? 'boolean' : 'number')).map((c) => [c, base[c]]));
  const cor = /^#/.test(base.cor || '') && !clara(base.cor) ? base.cor : tinha.cor;
  if (/^#/.test(cor || '')) proprio.cor = cor;
  const e = T.estilo(n, clara(tinha.cor) ? { cor: tinha.cor } : {}, proprio);
  for (const k of Object.keys(s)) if (tirar(k, x.prefixo, muda)) delete s[k];
  if (s.__globals__) {
    s.__globals__ = Object.fromEntries(Object.entries(s.__globals__).filter(([k]) => !tirar(k, x.prefixo, muda)));
  }
  Object.assign(s, { ...(muda.cor ? { title_color: e.cor } : {}), ...(muda.tipo ? T.elementor(e, x.prefixo) : {}), [x.campo]: T.destacar(s[x.campo], e) });
  mudados.push(x);
}

// O texto fica igual: só muda o estilo (e o das palavras em <em>).
const palavras = (els) => titulosElementor(els).map((x) => x.texto).join('\n');
if (palavras(novos) !== palavras(elementos)) {
  console.error('\n  O texto de algum título mudaria ao aplicar o estilo. Parei sem escrever nada: enviar este erro à Flowzi.\n');
  process.exit(1);
}

const rota = original.type === 'post' ? 'posts' : 'pages';
if (copiaAnterior) {
  const anterior = await wp(`wp/v2/${rota}/${copiaAnterior}?context=edit`);
  if (anterior.status !== 'draft' || !(anterior.title?.raw || '').includes(SUFIXO)) {
    console.error(`\n  ${copiaAnterior} não é uma cópia em rascunho feita pelo titulos.mjs. Parei sem escrever.\n`);
    process.exit(1);
  }
}
const copia = guardarCopia(original);
const pagina = await wp(copiaAnterior ? `wp/v2/${rota}/${copiaAnterior}` : `wp/v2/${rota}`, {
  method: 'POST',
  body: {
    title: `${original.title.raw.replace(` ${SUFIXO}`, '')} ${SUFIXO}`,
    status: 'draft',
    template: original.template || 'elementor_header_footer',
    parent: original.parent || 0,
    meta: {
      _elementor_edit_mode: 'builder',
      _elementor_template_type: original.meta?._elementor_template_type || (rota === 'posts' ? 'wp-post' : 'wp-page'),
      _elementor_data: JSON.stringify(novos),
      _elementor_page_settings: original.meta?._elementor_page_settings || {},
    },
  },
});

const depois = lerElementor(await paginaEmEdicao(original.id));
const intacta = JSON.stringify(depois) === JSON.stringify(elementos);
const gravados = lerElementor(await wp(`wp/v2/${rota}/${pagina.id}?context=edit`));
const antes = new Map(variantes(titulos).map((v) => [v.nivel, v.estilos.length]));
const l = ligacoes(pagina.id, rota === 'posts');
console.log(`
  original        ${original.id} · ${original.status} · ${intacta ? 'intacta' : 'ALTERADA, verificar'}
  cópia           ${pagina.id} · ${pagina.status} · ${mudados.length} títulos no estilo do marca.json, texto igual
  estado anterior ${copia.replace(/^.*[/\\]clientes[/\\]/, 'clientes/')}
`);
const finais = variantes(titulosElementor(gravados));
for (const { nivel, estilos, destaques } of finais) {
  const em = destaques.length > 1 ? ` · palavras em <em> com ${destaques.length} estilos` : '';
  const ficou = `(${plural(estilos.length, 'estilo', 'estilos')})`;
  console.log(`  ${nome(nivel)} ${T.definidos.includes(nivel) ? `${antes.get(nivel)} → ${plural(estilos.length, 'estilo', 'estilos')}${em}`
    : T.titulos?.destaque && /^h[1-3]$/.test(nivel) ? `sem estilo no marca.json: só as palavras em <em> com o destaque geral ${ficou}`
      : `sem estilo no marca.json, ficou como estava ${ficou}`}`);
}
const restam = finais.filter((v) => T.definidos.includes(v.nivel) && v.estilos.length > 1);
if (restam.length) console.log(`\n  Ainda há estilos diferentes em ${restam.map((v) => v.nivel).join(', ')}: o marca.json não diz tudo (ver com --ver o que muda entre eles,
  acrescentar esse campo em "titulos" e correr outra vez com --copia ${pagina.id}).`);
console.log(`
  editar          ${l.editar}
  pré-visualizar  ${l.previsualizar}
  comparar com    ${original.link}
  ver os estilos  node scripts/titulos.mjs --ver ${pagina.id}
`);
if (copiaAnterior) {
  console.log(`  Cópia alterada: se a pré-visualização mostrar o estilo antigo, abrir o editor do Elementor
  e guardar como rascunho (seta ao lado do botão verde → Guardar rascunho). Nunca o botão verde "Publicar".
`);
}
