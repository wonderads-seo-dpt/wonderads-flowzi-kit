---
name: wp-rever
description: >
  Revê uma página ou artigo antes de publicar: formato português, hierarquia de títulos,
  texto alternativo, ligações, contraste, meta tags e comportamento em telemóvel. É a
  última porta antes do site do cliente. Gatilhos: "revê a página", "está pronto para
  publicar", "/wp-rever".
---

# Revisão antes de publicar

Correr isto sempre, mesmo quando a página parece bem: muitos problemas não se vêem a olho.

## Primeiro, o script

Correr `node scripts/rever.mjs <id|endereço>`; numa página de SEO, com `--chave "palavra-chave"` (a que se escolheu com a pessoa, nunca uma inventada; se não houver, perguntar). Verifica sozinho o h1, a hierarquia de títulos, a profundidade dos containers, os widgets de código, os contadores, as animações, o texto alternativo, os números e as datas em formato americano, os travessões, os botões sem destino e o título da página. Só lê, não escreve nada.

Verifica também o SEO, como explica o `/seo`: as palavras do texto visível contra o mínimo do cliente (1 500 por defeito, no `seo.json` do cliente), a palavra-chave no h1, nas primeiras 100 palavras, no endereço e no título para o Google, e se se repete demais, os títulos do mesmo nível com estilos diferentes (Elementor) e as ligações internas. Sem `--chave`, usa a do ficheiro da página (`seo: { chave }`) ou a do `seo.json`; sem nenhuma, diz que não a verificou. Página de destino ou de contactos: `--tipo destino`. A linha `SEO ·` no topo resume as contas.

Depois, percorrer à mão o que o script diz que não verificou, com a lista abaixo. Para o telemóvel, abrir a página no editor e carregar no ícone do telemóvel, ou pedir à pessoa um print.

## Lista de verificação

### Português
- [ ] Números com espaço de milhares e vírgula decimal. **Verificar em especial os contadores**, que escrevem à americana por defeito
- [ ] Moeda com o símbolo depois do valor
- [ ] Datas em `DD/MM/AAAA` ou por extenso em português
- [ ] Nenhum travessão a ligar orações dentro de uma frase
- [ ] Ortografia coerente com a do resto do site
- [ ] Nenhuma construção de oralidade nem frase sem verbo principal

### Estrutura
- [ ] Um só `h1`
- [ ] Hierarquia de títulos sem saltos
- [ ] Nenhum container com mais de três níveis de profundidade
- [ ] Nenhum widget de código a fazer o trabalho de um widget real

### Acessibilidade
- [ ] Todas as imagens com texto alternativo que descreve a imagem
- [ ] Contraste suficiente entre texto e fundo, sobretudo em secções escuras
- [ ] Botões e ligações com texto que se percebe fora de contexto. Nunca "clique aqui"

### Pesquisa
- [ ] Palavra-chave no h1, no início do texto, no endereço e no título, sem repetir demais
- [ ] Página de SEO com o mínimo de palavras do cliente, sem palha
- [ ] Títulos do mesmo nível com o mesmo estilo
- [ ] Título da página entre 50 e 60 caracteres
- [ ] Meta description entre 140 e 160 caracteres
- [ ] Endereço curto, em minúsculas, sem palavras de ligação
- [ ] Dados estruturados coerentes com o que está visível na página

### Ligações
- [ ] Todas as ligações internas apontam para páginas que existem
- [ ] Ligações externas abrem em separador novo
- [ ] O botão principal faz mesmo o que diz

### Telemóvel
- [ ] Ver a página com largura de telemóvel
- [ ] Nenhum texto cortado nem a transbordar
- [ ] Botões com área de toque suficiente
- [ ] Ordem das secções faz sentido em coluna

### Conteúdo
- [ ] Nenhum número sem fonte documentada
- [ ] Nenhum testemunho sem consentimento
- [ ] Nenhuma alegação proibida no sector

## Entrega

Apresentar os apontamentos em três grupos: **bloqueia a publicação**, **corrigir antes de mostrar ao cliente**, **melhorias**.

Não dizer "está pronto" enquanto o primeiro grupo não estiver vazio. Se algum ponto não pôde ser verificado, dizer qual e porquê, em vez de o dar por passado.
