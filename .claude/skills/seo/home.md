# Checklist WonderAds · página inicial

Da checklist interna "home page v2" da WonderAds. A página inicial define a proposta de valor, distribui autoridade pelas páginas principais e junta os sinais de confiança e de localização. Valem também as regras comuns do `SKILL.md`. No rever: `--tipo home` (ou `seo: { tipo: 'home' }`), que não exige mínimo de palavras.

## 1 · Estrutura e conteúdo

- [ ] **Regras do cliente confirmadas** antes de escrever: ortografia, tamanhos e termos a evitar.
- [ ] **Um só h1** com o serviço principal e a localidade (por exemplo "Fisioterapia e reabilitação em Vila do Conde"), nunca só o nome da marca.
- [ ] **Títulos sem saltos**: h2, depois h3.
- [ ] **Proposta de valor acima da dobra**: o que a clínica faz, para quem e onde, em uma ou duas frases.
- [ ] **O essencial em texto**, nunca dentro de imagens nem de sliders, para o Google e os motores de IA o lerem.
- [ ] **Mapa dos serviços e patologias**: uma secção por área principal, com um resumo curto e ligação para a página dela.
- [ ] **Diferenciais verificáveis** (tecnologia, equipa, anos de actividade), nunca superlativos como "os melhores".
- [ ] **Equipa em resumo**, com ligação para a página da equipa.
- [ ] **Últimos artigos do blogue**: dois ou três, com ligação.
- [ ] **Perguntas frequentes (opcional)**: as quatro ou cinco dúvidas que mais travam a marcação, com resposta curta.
- [ ] **Sem texto de enchimento**: a página inicial não é um artigo. Texto curto e fácil de ler na diagonal, com cada bloco a levar a uma página.

## 2 · Ligações

- [ ] **Ligações para as páginas pilar** (serviços e patologias principais), com texto que diz o destino.
- [ ] **As páginas que mais convertem a um clique** da página inicial.
- [ ] **Botão principal repetido** (marcar avaliação, telefone, WhatsApp) no topo, a meio e no rodapé, **cada um com o seu id**.
- [ ] **Telefone e WhatsApp medidos**: ligações `tel:` e botão de WhatsApp com evento no Tag Manager.
- [ ] **Perfil de Empresa Google e redes sociais**: os mesmos perfis que estão no schema (`sameAs`).
- [ ] **Sem ligações partidas**, também no rodapé e nos botões.

## 3 · Dados estruturados (schema)

- [ ] **Organization / MedicalClinic**: nome, morada, telefone, horário, coordenadas, logótipo e `sameAs`, com um `@id` que as outras páginas reutilizam.
- [ ] **Várias unidades**: uma entrada por unidade, cada uma com `@id`, morada e horário.
- [ ] **Dados iguais aos do Perfil de Empresa Google** (nome, morada, telefone, horário) e aos dos directórios.
- [ ] **WebSite** com o nome e o endereço do site.
- [ ] **Nunca duplicar** o que o Yoast ou o Rank Math já geram. O que faltar vai na página com a peça `schema(...)` (ver "Dados estruturados" no `SKILL.md`); a linha `Schema ·` do rever mostra o que já existe.

## 4 · Confiança e conformidade

- [ ] **Avaliações reais do Google**: nota e número visíveis, com ligação para o perfil e iguais às do perfil. Nunca inventar números (secção 6 do `CLAUDE.md`).
- [ ] **Equipa e credenciais**: nomes, funções e formação de quem trata.
- [ ] **Registo ERS e cédulas profissionais**, se o cliente os quiser mostrar, num sítio visível (rodapé ou página da equipa).
- [ ] **Livro de Reclamações Electrónico**: botão no rodapé, obrigatório em Portugal.
- [ ] **RGPD**: política de privacidade e de cookies, e um aviso de consentimento que não tapa a leitura, ligado ao Consent Mode v2 (secção 6).
- [ ] **Sem promessas de resultado nem garantias** (código deontológico e regras da ERS).
- [ ] **Contactos e morada visíveis**: telefone, morada e horário de cada unidade, iguais aos do Perfil de Empresa Google.
- [ ] **Telefones com * ou ****, e a nota de custo (regra comum).

## 5 · Visual e conversão

- [ ] **Imagem principal optimizada**: WebP, dimensões declaradas, **sem** carregamento diferido (é o LCP), sem slider pesado.
- [ ] **Prova social acima da dobra**: nota e número de avaliações logo à entrada.
- [ ] **Mapa de cada unidade**, com ligações para o Google Maps, o Waze e o Apple Maps.
- [ ] **Fotografias reais** da equipa, do espaço e dos equipamentos, com texto alternativo descritivo.
- [ ] **Botão de WhatsApp visível no telemóvel**, com evento de clique.
- [ ] **Caixa de números** (anos, avaliações), só com dados verificáveis.

## 6 · Meta e técnico

O kit não mexe nestes pontos: verifica o que consegue ler e entrega a lista à pessoa.

- [ ] **Título para o Google**: marca, serviço principal e localidade, até cerca de 60 caracteres.
- [ ] **Descrição** até cerca de 155 caracteres, com chamada para a acção.
- [ ] **Uma só versão do endereço**: http e https, com e sem www, redireccionam para a mesma.
- [ ] **Um só endereço para a página inicial**: a página de Definições > Leitura responde na raiz (/). Uma página antiga com o mesmo conteúdo leva um 301 ou sai de publicação (decide a pessoa).
- [ ] **Canonical** para o próprio endereço da raiz, sem caminho nem parâmetros.
- [ ] **Indexável, no sitemap e sem bloqueio** no robots.txt.
- [ ] **Core Web Vitals no telemóvel**: LCP abaixo de 2,5 s e CLS abaixo de 0,1 (PageSpeed Insights).
- [ ] **Vista no telemóvel** antes de entregar.
- [ ] **Medição activa**: GA4, Tag Manager e Search Console a registar telefone, WhatsApp e formulário.
- [ ] **Consent Mode v2**: o Tag Manager e o GA4 só medem o que a pessoa autorizou no aviso de cookies.
- [ ] **hreflang**, se houver versão noutra língua.
