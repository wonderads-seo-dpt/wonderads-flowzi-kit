---
name: wp-briefing
description: >
  Conduz o levantamento de uma página de WordPress antes de a construir. Faz perguntas
  pela ordem certa e devolve um briefing estruturado. Usar sempre que houver uma página
  para fazer e ainda não existir texto, ou quando o pedido chegar em duas linhas soltas.
  Gatilhos: "briefing", "nova landing page", "preciso de uma página para", "/wp-briefing".
---

# Levantamento de página

Uma página má quase nunca nasce de má escrita. Nasce de não se saber o que a página tinha de fazer.

## Princípio

Não escrever nada enquanto houver perguntas por responder. Se o consultor não souber uma resposta, isso é informação: significa que é preciso perguntar ao cliente, e é melhor descobrir agora do que depois de a página estar montada.

Fazer as perguntas **em blocos de três**, nunca todas de uma vez. Esperar pela resposta antes de avançar.

## As perguntas, por ordem

**Bloco 1, o essencial**
1. Que acção queremos que a pessoa faça nesta página? Uma só.
2. Quem chega aqui, e de onde? Anúncio, pesquisa, email, ligação a partir de outra página?
3. O que é que essa pessoa já sabe quando chega, e o que ainda não sabe?

**Bloco 2, a oferta**
4. O que estamos a oferecer, em uma frase que o cliente diria?
5. Porque é que alguém escolheria este cliente e não o concorrente do lado?
6. Há preço, intervalo de preço ou condição a mostrar? Se não houver, porquê?

**Bloco 3, a prova**
7. Que provas existem, e estão documentadas? Números, casos, certificações, anos de actividade.
8. Há testemunhos com consentimento escrito para publicar?
9. Alguma coisa neste sector que seja proibido afirmar?

**Bloco 4, as objecções**
10. Quais são as três dúvidas que fazem a pessoa não avançar?
11. O que costuma perguntar ao telefone antes de marcar?

**Bloco 5, o fecho**
12. O que acontece depois de carregar no botão? Formulário, telefone, marcação, WhatsApp?
13. Quanto tempo demora a resposta, na realidade?

## O que fazer com respostas vagas

"Queremos que conheçam a marca" não é um objectivo, é uma ausência de objectivo. Devolver a pergunta com opções concretas: marcar, ligar, pedir orçamento, subscrever, comprar. Escolher uma.

Se a resposta a uma pergunta de prova for um número que não está escrito em lado nenhum, marcar como **por confirmar** e não o usar na página até alguém o confirmar por escrito.

## Entrega

Um ficheiro `clientes/<cliente>/briefings/<slug>.md` com esta estrutura:

```
# <título de trabalho>
slug: <slug-do-url>
objectivo: <a acção única>
publico: <quem chega e de onde>
promessa: <a frase da oferta>
diferenciacao: <porque este e não outro>
prova:
  - <facto> · fonte: <onde está escrito>
objeccoes:
  - <dúvida> → <resposta>
faq:
  - pergunta: <…>
    resposta: <…>
cta: <texto do botão> → <o que acontece>
por_confirmar:
  - <tudo o que ficou por validar>
```

Terminar sempre a mostrar a lista `por_confirmar` ao consultor, em voz alta. É o que impede uma página de sair com números inventados.

Depois disto, `/wp-landing` já tem tudo o que precisa.
