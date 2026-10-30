import { seccao, linha, coluna, titulo, texto, botao, lista, caixaIcone, numero, perguntas, marca } from '../../../scripts/elementor.mjs';

const C = marca.cores;

export default {
  titulo: 'Implantes Dentários em Oeiras',
  slug: 'implantes-dentarios-oeiras',
  elementos: [
  seccao([
    titulo('Implantes dentários fixos, com plano fechado antes de começar.', 'h1', { cor: '#FFFFFF' }),
    texto('Avaliação com TAC 3D, orçamento por escrito e o mesmo médico do início ao fim.', { cor: '#C9D3E0', tamanho: 19 }),
    botao('Marcar avaliação', '[destino por confirmar]'),
    linha([
      // Números só com fonte escrita do cliente; até lá ficam por confirmar.
      numero('[por confirmar]', 'anos de actividade', { cor: C.acento, corLegenda: '#C9D3E0' }),
      numero('[por confirmar]', 'implantes colocados', { cor: C.acento, corLegenda: '#C9D3E0' }),
      numero('[por confirmar]', 'avaliação no Google', { cor: C.acento, corLegenda: '#C9D3E0' }),
    ], { espacamento: 24 }),
  ], { fundo: C.principal, topo: 110, base: 96 }),

  seccao([
    titulo('O que tratamos', 'h2', { alinhar: 'center' }),
    linha([
      coluna([caixaIcone('fas fa-tooth', 'Implante unitário', 'Substitui um dente sem mexer nos vizinhos.')], 30),
      coluna([caixaIcone('fas fa-teeth', 'Reabilitação total', 'Arcada fixa sobre quatro a seis implantes.')], 30),
      coluna([caixaIcone('fas fa-clock', 'Carga imediata', 'Dentes provisórios fixos no mesmo dia, quando o osso permite.')], 30),
    ]),
  ]),

  seccao([
    linha([
      coluna([
        titulo('Porque nos escolhem', 'h2'),
        lista(['Orçamento fechado por escrito', 'TAC 3D incluída na avaliação', 'Planos de pagamento']),
      ], 48),
      coluna([
        texto('<p>Cada plano é discutido consigo antes de qualquer intervenção. Sabe quanto vai pagar e quanto tempo demora.</p>'),
      ], 46),
    ], { espacamento: 40 }),
  ], { fundo: C.claro }),

  seccao([
    titulo('Perguntas frequentes', 'h2', { alinhar: 'center' }),
    perguntas([
      ['A colocação dói?', 'A cirurgia é feita com anestesia local. A maioria das pessoas retoma a rotina no dia seguinte.'],
      ['Quanto tempo demora?', 'A prótese definitiva entra ao fim de três a seis meses.'],
    ]),
  ]),

  seccao([
    titulo('A avaliação é o primeiro passo.', 'h2', { cor: '#FFFFFF', alinhar: 'center' }),
    botao('Marcar avaliação', '[destino por confirmar]', { alinhar: 'center' }),
  ], { fundo: C.principal, alinhar: 'center' }),
],
};
