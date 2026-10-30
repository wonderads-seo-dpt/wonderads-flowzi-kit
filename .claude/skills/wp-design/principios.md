# Princípios de design

Lidos pelo `/wp-design`, pelo `/wp-replicar` e pelo `/wp-landing` antes de desenhar e antes de entregar. Servem para a página não parecer feita por uma máquina.

Adaptado da skill `frontend-design` da Anthropic (github.com/anthropics/skills, licença Apache 2.0, em `LICENSE-frontend-design.txt`), traduzido para português e ajustado ao Elementor e às peças de `scripts/elementor.mjs` pela Flowzi em 15/10/2026.

## Partir do assunto

O desenho sai do mundo do cliente: o sector, o público, o que a página tem de conseguir. Uma clínica dentária para famílias não se desenha como uma loja de bicicletas. Antes de desenhar, dizer numa frase para quem é a página e o que ela tem de fazer.

O herói abre com o que é mais característico desse mundo: uma fotografia real da clínica ou do produto, uma frase forte, uma prova concreta. Um número grande com legenda pequena e um degradê é a solução por defeito; só se usa se for mesmo a melhor.

## Letras

- A letra carrega a personalidade. Uma família chega; duas, só se forem claramente diferentes.
- Usar as letras da marca (`marca.json`, `design.md`), com uma escala clara: o h1 bem maior do que o h2, o h2 bem maior do que o texto.
- Linhas de texto com menos de 80 caracteres: secções de leitura com `estreita: true` ou colunas.
- Evitar, porque denunciam uma página gerada:
  - realçar uma palavra em todos os títulos só porque se pode (o `destaque` de `titulos` usa-se onde a palavra realçada diz alguma coisa);
  - um `rotulo` em MAIÚSCULAS por cima de cada título (um ou dois na página, onde orientam);
  - etiquetas a mais por cima do conteúdo.

## Estrutura

- Cada elemento visual diz alguma coisa. Números 01 / 02 / 03 só quando o conteúdo é mesmo uma sequência (os passos de uma primeira consulta, sim; três vantagens, não).
- Nada de animações de entrada (já é regra do kit). Movimento só quando responde a uma acção da pessoa, como abrir uma pergunta frequente.

## Os sinais de uma página feita por IA

Todos são legítimos num pedido que os peça, mas são escolhas por defeito, não escolhas para este cliente:

1. fundo creme com letra serifada de alto contraste e acento terracota;
2. fundo quase preto com um só acento néon;
3. o kit de cartões: tudo cortado em cartões redondos iguais, o mesmo raio em tudo, a mesma sombra cinzenta em cada um, degradês só para enfeitar;
4. a moldura de modelo: etiqueta em maiúsculas por cima de cada título, textos ligados por pontos ("A · B · C"), setas "→" no fim dos botões.

Onde o cliente ou a referência fixam um caminho, segue-se à letra. Onde há liberdade, não a gastar num destes.

## Como trabalhar

1. **Plano curto antes de construir:** 4 a 6 cores com o hex e o papel de cada uma, as letras e os tamanhos, um esboço das secções em texto (uma linha por secção) e o alinhamento (à esquerda ou ao centro).
2. **Rever o plano:** se uma parte for a que sairia para qualquer cliente parecido, mudá-la e dizer o que mudou.
3. **Construir** com as peças do kit.
4. **Criticar com os prints:** `node scripts/inspeccionar.mjs` na pré-visualização (no treino vê os rascunhos), comparar com a referência ou com o site do cliente, em computador e em telemóvel. Antes de entregar, como dizia a Chanel: olhar ao espelho e tirar um acessório.

## Contenção

Gastar a ousadia num sítio só: um elemento memorável, o resto calmo. Cortar a decoração que não serve o pedido. Sem o anunciar, a página cumpre o mínimo: funciona no telemóvel, o texto tem contraste (4,5:1, e 3:1 nos botões e ícones) e as imagens têm texto alternativo.

## Texto

As palavras estão na página para a tornar fácil de perceber. Escrever do lado de quem lê, com palavras simples. Voz activa. Um botão diz o que acontece ("Marcar avaliação", não "Saber mais"). Sem enchimento.
