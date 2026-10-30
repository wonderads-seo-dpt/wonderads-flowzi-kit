// Formato de um artigo. Os blocos são ['h2', texto], ['h3', texto], ['p', texto] ou ['lista', [itens]].
// O texto pode levar <strong>, <em> e <a href="...">. Gravar com: node scripts/criar-artigo.mjs clientes/<cliente>/artigos/<slug>.mjs
export default {
  titulo: 'Quanto tempo dura um tratamento de ortodontia?',
  slug: 'quanto-tempo-dura-ortodontia',
  resumo: 'A duração depende do caso e do tipo de aparelho. Veja o que influencia o tempo de tratamento e como é definido na consulta de diagnóstico.',
  categoria: 'Ortodontia',
  blocos: [
    ['p', 'A duração de um tratamento de ortodontia depende da complexidade do caso e do tipo de aparelho. O tempo estimado é indicado no plano de tratamento, depois da consulta de diagnóstico.'],
    ['h2', 'O que influencia a duração'],
    ['lista', ['A posição inicial dos dentes e da mordida', 'O tipo de aparelho: fixo ou alinhadores', 'A regularidade das consultas de acompanhamento']],
    ['h2', 'E depois do aparelho?'],
    ['p', 'No final há uma fase de contenção, essencial para manter os dentes na nova posição.'],
  ],
  perguntas: [
    ['Os alinhadores são mais rápidos do que o aparelho fixo?', 'Depende do caso. A indicação é confirmada na consulta de diagnóstico.'],
  ],
};
