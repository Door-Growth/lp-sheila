# Auditoria técnica e otimização final

Data: 24/09/2026

## Resultado de peso

- Projeto antes: 60.481.338 bytes (60,48 MB em base decimal).
- Projeto depois: 55.267.050 bytes (55,27 MB em base decimal), incluindo este relatório.
- Economia total: 5.214.288 bytes, ou 8,62%.
- Imagens antes: 6.373.533 bytes.
- Imagens depois: 1.117.606 bytes.
- Economia em imagens: aproximadamente 82,46%.
- Vídeos locais mantidos: 53.998.410 bytes. Eles representam aproximadamente 97,7% do projeto final.

## Conversões e maiores reduções

| Original | Produção | Antes | Depois | Redução aproximada |
|---|---|---:|---:|---:|
| Hero PNG | `sheila-antunes-hero-768.webp` | 1.399.100 B | 106.466 B | 92,39% |
| DIU PNG | `diu-cobre-comparacao-640.webp` | 1.559.844 B | 19.328 B | 98,76% |
| Implanon PNG | `implanon-bastao-comparacao-640.webp` | 2.132.020 B | 31.442 B | 98,53% |
| Logo PNG | `logo-sheila-antunes-dourado-800.webp` | 430.736 B | 98.272 B | 77,19% |

Também foram criados favicon PNG 64×64 e Apple Touch Icon PNG 180×180.

## Otimizações aplicadas

- Hero convertida para WebP, redimensionada para a necessidade real, pré-carregada e marcada com `fetchpriority="high"`, `loading="eager"`, `decoding="async"`, `width` e `height`.
- Dependência de JavaScript removida da visibilidade inicial da Hero, corrigindo uma tela vazia observada no teste mobile.
- Imagens abaixo da dobra receberam `loading="lazy"` e `decoding="async"` quando aplicável.
- Imagens locais receberam dimensões intrínsecas para reduzir CLS.
- PNGs grandes dos métodos e da marca foram substituídos por WebP com validação visual.
- CSS de produção consolidado em `assets/css/main.min.css` e carregado em uma única requisição.
- JavaScript de produção consolidado em `assets/js/main.min.js` com cache busting.
- Arquivos CSS/JS originais mantidos como fontes de desenvolvimento, mas não carregados em produção.
- JavaScript recebeu proteções contra elementos ausentes, fallback sem `IntersectionObserver`, encerramento do menu por Escape, `aria-expanded` sincronizado e pausa dos outros vídeos ao iniciar uma reprodução.
- Elementos revelados deixam de ser observados após aparecerem, reduzindo trabalho contínuo.
- Tratamento de `prefers-reduced-motion` ampliado para marquee e halo do WhatsApp.
- Foco visível adicionado a links, botões, FAQ e imagens interativas.
- Google Fonts manteve `display=swap`, preconnect e apenas os pesos realmente usados: 400, 600, 700 e 800.
- Canonical, robots meta, Open Graph, Twitter Card, favicon, Apple Touch Icon, `robots.txt` e `sitemap.xml` adicionados.
- Nenhuma copy, CTA, link, mensagem ou composição visual foi alterada pela otimização técnica.

## Validação funcional e responsiva

Testes automatizados em Chrome nas larguras 390, 430, 768, 1024, 1366 e 1920 px confirmaram:

- um único H1;
- zero overflow horizontal;
- zero imagem local quebrada;
- zero resposta local 404/403/500;
- zero exceção JavaScript;
- Hero e imagem LCP carregadas;
- menu mobile abre, fecha e responde a Escape;
- um único cartão ativo no carrossel;
- FAQ abre normalmente;
- quatro vídeos reconhecidos pelo navegador;
- nove links de WhatsApp apontando de forma consistente para `https://wa.link/53n205`;
- CSS e JavaScript de produção com sintaxe válida.

Os erros de rede registrados no teste isolado foram provocados deliberadamente pelo bloqueio de recursos externos (Google Fonts, Google Maps e imagens remotas) para separar falhas locais de dependências externas. Não houve falha local.

## Tracking

Não foram encontrados GA4, Google Ads, Meta Pixel, GTM, `dataLayer` ou eventos de conversão no projeto recebido. Nenhum ID foi inventado ou removido. A instalação e a validação de tracking continuam pendentes caso esses códigos existam apenas no ambiente de publicação.

## Arquivos criados

- `assets/css/main.min.css`
- `assets/js/main.min.js`
- `assets/sheila-antunes-hero-768.webp`
- `assets/diu-cobre-comparacao-640.webp`
- `assets/implanon-bastao-comparacao-640.webp`
- `assets/logo-sheila-antunes-dourado-800.webp`
- `assets/favicon-64.png`
- `assets/apple-touch-icon-180.png`
- `robots.txt`
- `sitemap.xml`

## Arquivos alterados

- `index.html`
- `desktop.css`
- `script.js`

## Arquivos removidos

- `assets/ChatGPT Image 24_09_2026, 09_52_17.png`
- `assets/diu-cobre-comparacao.png`
- `assets/implanon-bastao-comparacao.png`
- `assets/logo-sheila-antunes-dourado.png`

As remoções só ocorreram depois da substituição, busca integral de referências e validação visual.

## Arquivos mantidos propositalmente

- Quatro vídeos MP4, por serem conteúdo aprovado e utilizado.
- Fotografias JPEG que já apresentavam peso adequado e não teriam ganho material seguro.
- `styles.css`, `desktop.css` e `script.js`, como fontes editáveis de desenvolvimento.
- `assets/elementor-1261-2026-09-24.json`, por ser um backup/fonte do Elementor e não haver certeza suficiente para removê-lo.

## Pontos que ainda exigem validação no ambiente publicado

- Confirmar externamente o redirecionamento final do encurtador `wa.link` e o número de destino.
- Confirmar Google Maps, Google Fonts e as dez imagens remotas de depoimentos no domínio publicado.
- Inserir/validar tracking, caso GA4, Ads, Pixel ou GTM sejam adicionados no CMS/servidor.
- Validar a URL canônica e os caminhos de Open Graph depois da publicação no domínio definitivo.
- Os vídeos totalizam aproximadamente 54 MB. Permanecem o maior gargalo físico; uma segunda etapa com os arquivos-fonte e transcodificação H.264/WebM pode reduzir muito o pacote, mas não foi feita sem um encoder disponível para evitar perda visual ou incompatibilidade.
- Não existe página de política de privacidade no projeto recebido; o conteúdo jurídico deve ser fornecido antes da criação.
