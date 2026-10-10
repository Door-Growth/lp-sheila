# Tracking da LP Sheila Antunes

Data da implementação: 08/10/2026. Escopo: intenção de abrir WhatsApp e engajamento; um clique não comprova mensagem recebida, lead recebido ou consulta agendada.

## Estado de entrega e ativação

Atualização de 09/10/2026: aviso aprovado com escolhas independentes de Estatísticas (GA4) e Marketing (Meta), inicialmente desmarcadas; ações “Aceitar todos”, “Recusar todos” e “Salvar escolhas”. **Cada biblioteca só carrega após autorização da respectiva finalidade**, ou em nova visita com escolha válida salva. WhatsApp funciona independentemente dessa escolha. O aviso adapta-se ao celular sem cobrir o botão flutuante.

GA4 está configurado para `G-5RG0MN2QET`. Os Pixels `3112315745824007` e `301854493012933` estão habilitados no código, condicionados a consentimento de marketing. O proprietário forneceu a decisão da Meta: compartilhamento poderá ser bloqueado para visitantes na Região Europeia; em outros locais certos eventos padrão podem ser bloqueados e a fonte pode estar em configuração básica. A rejeição da revisão de categoria não foi revertida. `policyReviewed: true` registra a leitura desse aviso com o responsável, **não aprovação/liberação pela Meta**. `enabled: false` continua disponível como desligamento operacional.

Os testes locais da Meta usam a configuração entregue e interceptam a biblioteca externa para inspecionar a fila sem enviar eventos reais. O proprietário confirmou `LEAD_LP` como nome histórico para cliques no WhatsApp. Não houve acesso autenticado a Testar eventos, Pixel Helper ou GA4 DebugView. Não há confirmação de recebimento/aceitação pelas contas.

Verificação online em 09/10/2026 na versão inicial do aviso (antes da ativação Meta): biblioteca real `gtag.js` carregada uma vez após Aceitar. Coleta interceptada antes do envio confirmou `page_view`, `tracking_context` e `lead_lp_implanon_diu` para `G-5RG0MN2QET`, sem contaminar a conta. Revogação impediu nova carga GA4. **Não comprova recebimento no GA4.** A biblioteca também gerou `click` e `scroll` automáticos: desativar cliques de saída na medição otimizada da conta; não foi alterada a conta.

## 1. Auditoria inicial

- Site estático de uma página: `index.html`, sem SPA, framework ou backend.
- Fontes: `styles.css`, `desktop.css`, `script.js`. Produção: `assets/css/main.min.css` e `assets/js/main.min.js`.
- Nenhum GA4, Meta Pixel, Google Ads, GTM, `dataLayer`, consent manager ou evento analítico preexistente nos arquivos executáveis auditados. O arquivo Elementor JSON é um backup, não é executado na página.
- HTML público consultado em 08/10 também sem tags analíticas/consentimento encontradas; alterações injetadas posteriormente pela hospedagem devem ser auditadas antes da ativação.
- 9 CTAs, todos com `https://wa.link/53n205`, `target="_blank"` e `rel="noopener"`.
- O link existente redirecionou para `https://api.whatsapp.com/send?phone=557499236477&text=...`. Preservado exatamente `557499236477`; não foi acrescentado ou corrigido dígito por suposição.
- 4 elementos `<video>` HTML5 com MP4 local, controles nativos e `playsinline`. Não são YouTube.
- 11 prints no carrossel; navegação por setas, indicadores, teclado, mouse e toque.
- FAQ com 4 elementos `<details>`.
- Um iframe Google Maps no consultório; **nenhum link externo de mapa na página atual**.
- Funções de menu, animações, arraste, ampliação de depoimentos, pausa dos outros vídeos e FAQ foram preservadas.

## 2. Arquivos

Criados:

- `assets/js/tracking-config.js`: IDs, número verificado, modo do scroll 90 e bloqueio da Meta.
- `assets/js/tracking.js`: módulo único de tracking, sem dependências adicionais em produção.
- `tests/tracking.test.cjs`: testes de navegador com interceptação de serviços externos.
- `TRACKING.md`: auditoria, funcionamento, limites e roteiro de ativação.

Alterados:

- `index.html`: dois scripts locais `defer` no `<head>` e versão de cache do JavaScript principal.
- `script.js`: notificações técnicas de interações do carrossel; nenhuma alteração de apresentação ou deslocamento.
- `assets/js/main.min.js`: regenerado a partir da fonte.

Em 09/10 foram adicionados `assets/js/consent.js`, `assets/css/consent.css`, aviso no HTML e botão “Preferências de privacidade” no rodapé. O restante do layout, imagens, vídeos e textos comerciais foi preservado.

## 3. GA4 e Meta

O módulo insere o loader assíncrono `https://www.googletagmanager.com/gtag/js?id=G-5RG0MN2QET` diretamente no head **somente após consentimento**. Esse endereço é a biblioteca gtag do GA4; não é um container GTM. Nenhum `gtm.js`, `GTM-`, `AW-`, conversion label, comando `event conversion` ou Google Ads foi instalado.

GA4: uma chamada `gtag('config', ..., {send_page_view:true})` por documento. Não existe envio manual adicional de `page_view`. Inicialização duplicada do módulo é bloqueada. Navegar entre âncoras não gera page views pelo código local. O código não manipula rotas nem History API.

Google Signals e personalização de publicidade ficam desligados. As quatro flags de Consent Mode começam negadas; só `analytics_storage` pode ser concedida pelo adaptador. Basic Consent Mode: sem biblioteca, pings ou filas de eventos analíticos enquanto não autorizado.

Meta, apenas se revisão e consentimento permitirem: um único snippet/base, um `init` para cada ID, um `fbq('track','PageView')` transmitido aos dois Pixels, e um `trackCustom` por clique elegível. `autoConfig` é desligado para cada Pixel. Não há advanced matching ou leitura manual de `_fbp`/`_fbc`.

**Evento Meta: `LEAD_LP`, respeitando maiúsculas do histórico confirmado pelo usuário.** Somente em clique real nos botões de WhatsApp, nunca em visita, rolagem, vídeo ou FAQ. Não são enviados `contact_click`, `lead_lp_implanon_diu`, `scroll`, `click` ou `gtag.config` à Meta pelo módulo. O nome foi preservado por compatibilidade, não para contornar restrições. URLs, domínio e metadados automáticos do Pixel podem revelar contexto da página; a Meta continua aplicando suas regras. Se bloquear o domínio/evento, desativar a integração afetada, sem substituir domínio ou nome para evasão.

O evento customizado Meta recebe somente `{contact_channel: 'whatsapp'}`. Nenhum `lead_id`, UTM, click ID, título de página, método contraceptivo, seção clínica ou dado de paciente é incluído nos parâmetros customizados. A Meta pode filtrar parâmetros e eventos na configuração básica. Consentimento não remove restrições da plataforma.

## 4. Consentimento: aviso integrado

O aviso permite analytics e marketing separadamente. A escolha é salva em `localStorage['sheila_privacy_choice_v2']` com ambas as permissões, versão e data, por 180 dias (prazo de implementação, não afirmação de exigência legal). A escolha antiga v1 não habilita marketing: visitantes anteriores recebem o novo aviso. Valores inválidos, expirados ou futuros exigem nova escolha. Sem storage disponível, a escolha vale só para a página atual. Nenhum clique anterior à autorização é reproduzido.

O rodapé reabre as preferências. Revogar analytics remove identificadores de sessão e tenta excluir `_ga` e `_ga_5RG0MN2QET`; revogar marketing tenta excluir `_fbp` e `_fbc`. A página recarrega para descarregar bibliotecas/listeners revogados, mantendo a outra finalidade se autorizada. As travas de 24h não são apagadas, evitando duplicar conversões ao alterar preferências. Mudanças sincronizam abas via `storage`. GPC/DNT prevalecem; o aviso informa o bloqueio e desabilita as opções de autorização.

O código suporta também uma integração externa explícita. Se substituir o aviso por um CMP, mantenha apenas uma interface de consentimento:

Antes dos scripts de tracking, um CMP pode fornecer a escolha real do visitante:

```js
window.SheilaConsent = {analytics: true, marketing: false};
```

Se a escolha chegar depois de o módulo carregar:

```js
window.SheilaTracking.setConsent({analytics: true, marketing: false});
// Revogar:
window.SheilaTracking.setConsent({analytics: false, marketing: false});
```

Também é aceito `window.dispatchEvent(new CustomEvent('sheila:consent', {detail: {analytics: true, marketing: false}}))` depois da inicialização. O CMP deve persistir a escolha, reaplicá-la nas próximas páginas e permitir alteração. Nunca conceder automaticamente por visita, rolagem ou clique de contato. `SheilaTracking.getStatus()` informa estados sem expor IDs pessoais ou conteúdo.

GPC e Do Not Track têm precedência sobre concessões. A revogação bloqueia eventos locais, ativa `ga-disable-G-5RG0MN2QET`, atualiza Consent Mode, revoga Meta se carregada e remove os dados analíticos de sessão mantidos pelo módulo. A abertura do WhatsApp continua disponível, sem identificadores na mensagem. Um CMP externo deve cuidar também da exclusão de cookies e do descarregamento da biblioteca, como faz o aviso integrado.

**Pendente:** validar recebimento no GA4 Tempo real/DebugView, nos dois Pixels em Testar eventos e conferir medição otimizada da conta GA4. Este aviso controla GA4/Meta deste módulo, não gerencia o iframe Maps, fontes externas ou a telemetria injetada pela hospedagem Cloudflare.

## 5. WhatsApp e identificador interno

Todos os 9 links são reconhecidos por delegação. A detecção também aceita `api.whatsapp.com`, `web.whatsapp.com`, `whatsapp.com` e `wa.me` quando apontam para o mesmo número. Números desconhecidos não são padronizados automaticamente.

| CTA existente | button_location |
|---|---|
| Menu | header |
| Hero | hero |
| Conteúdo em vídeo | videos |
| Consulta e inserção | consulta_implanon_diu |
| Sobre Sheila | sobre_sheila |
| Depoimentos | depoimentos |
| Consultório | consultorio |
| FAQ | faq |
| Botão flutuante | floating_whatsapp |

Não existem CTAs WhatsApp no comparativo ou rodapé; não foram inventados botões. As categorias correspondentes são reconhecidas se forem adicionados futuramente.

Mensagem montada com `URL` e `URLSearchParams`, sem codificação dupla:

```text
Olá! Gostaria de mais informações sobre DIU e Implanon, por favor.
```

O `lead_id` é exclusivamente técnico, interno ao tracking permitido; não é anexado à mensagem e não há integração com CRM. Seu alfabeto é `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, com 8 caracteres aleatórios após `SHA-DI-`, gerados preferencialmente com `crypto.getRandomValues` e amostragem sem viés. Persistência em `sessionStorage['sheila_implanon_diu_lead_id']`; repetido em outros cliques e recargas da aba. Não é construído a partir de nome, telefone ou e-mail.

O href recebe a URL direta do mesmo número durante a ativação do link. Target, comportamento nativo de nova aba, teclado, teclas modificadoras e botão do meio são preservados. A navegação não aguarda servidor analítico. Com JS indisponível, o link original segue funcionando. Abrir via menu de contexto do navegador não é contado como clique rastreado: não há evento de ativação confiável para comprovar a saída.

O identificador interno só é criado no fluxo de tracking permitido. Sem consentimento, abrir o WhatsApp não gera esse identificador. Ele nunca é incluído na mensagem nem enviado à Meta.

## 6. Evento principal e trava de 24 horas

GA4: `lead_lp_implanon_diu`, somente em ativação real do WhatsApp. Recebe identificador interno, seção, texto genérico do botão e, quando existir, `button_id`. O clique flutuante usa o texto técnico `WhatsApp`.

Travas de 24 horas independentes: GA4 usa `localStorage['sheila_implanon_diu_lead_last_sent']`; os dois Pixels Meta compartilham `localStorage['sheila_implanon_diu_meta_lead_last_sent']`. Cada trava só é gravada quando o envio é solicitado à respectiva plataforma autorizada. Repetições geram somente `whatsapp_repeat_click` no GA4, não outro `LEAD_LP` na Meta. Todos os cliques abrem WhatsApp.

Sem qualquer plataforma autorizada, não grava a trava e não reproduz cliques anteriores quando o consentimento chegar. Web Locks serializa cliques de abas da mesma origem quando disponível. Se storage/Web Locks estiverem indisponíveis, usa memória por documento; **não é possível garantir deduplicação de 24h entre recargas, navegadores, dispositivos ou modos privados nesse cenário**. Limpar armazenamento também elimina a trava.

“Sent” significa comando solicitado/enfileirado, não recebimento confirmado. Se um bloqueador impedir o fornecedor, não se contorna o bloqueio. Habilitar marketing depois de um clique já medido no GA4 não reenvia retroativamente o evento: apenas um novo clique elegível poderá gerar o primeiro `LEAD_LP`, sem duplicar o evento principal do GA4.

## 7. Atribuição e parâmetros

Com consentimento analítico, captura e persiste em `sessionStorage['sheila_implanon_diu_campaign']`:

- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id`;
- `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `ttclid`.

Valores vazios não apagam os válidos. Valores presentes e válidos atualizam o parâmetro da sessão. Há limites de tamanho e rejeição de contatos/URLs/caracteres inválidos em labels. UTMs também alimentam os campos oficiais `campaign_*` da configuração GA4. Click IDs são armazenados apenas na sessão consentida; **não são enviados como parâmetros customizados ao GA4/Meta nem ao WhatsApp** nesta configuração conservadora.

GA4 inclui contexto fixo do projeto, `page_path`, título público e origem do referrer. `page_location` exclui query string e hash; referrer é reduzido à origem. Não lê corpo de depoimentos, nomes, telefones, perguntas clínicas, mensagens, formulários ou dados privados.

`anonymous_id` é aleatório e restrito à sessão, não um identificador persistente de usuário. `session_id` usa o ID disponibilizado pelo GA4, quando disponível, ou um timestamp técnico da sessão. `client_id` e `session_id` do GA4 são solicitados pela API `gtag('get')`, mantidos em memória e não duplicados como novos identificadores enviados ao Meta. Não há fingerprinting ou User-ID.

O briefing lista mais de 25 parâmetros possíveis. Para respeitar o limite padrão GA4, cada envio prioriza os parâmetros específicos, identidade da LP e UTMs; campos técnicos opcionais que excedam o orçamento não são enviados naquele evento. O evento secundário `tracking_context`, uma vez por documento autorizado, carrega as dimensões de dispositivo, navegador, sistema, telas, viewport, idioma e timezone. Não marcar esse evento como conversão. Nomes têm no máximo 40 caracteres e valores respeitam os limites próprios do GA4.

## 8. Engajamento

| Evento GA4 | Condição e dados |
|---|---|
| video_start | Primeiro play por reprodução; títulos video_01 a video_04 |
| video_progress | 10, 25, 50 e 75 uma vez por reprodução; pausa/retomada não duplica |
| video_complete | ended, 100, uma vez; repetir vídeo inicia novo ciclo |
| scroll | 25, 50 e 75 uma vez por visualização; 90 delegado à medição otimizada por padrão |
| faq_open | details aberto; faq_id, índice e question_01…04; fechar não envia |
| testimonial_interaction | Setas, teclado, indicadores, arraste real com mouse/toque/trackpad; índice numérico |
| click_maps | Somente âncoras que abrem Google Maps/Apple Maps; suporte pronto para esses links |
| cta_click | Âncoras internas de navegação; nunca também no clique WhatsApp |
| whatsapp_repeat_click | Contato repetido dentro de 24h; não é conversão |
| tracking_context | Contexto técnico por documento autorizado; não é conversão |

Vídeos enviam URL pública sem query, provedor `html5`, tempo/duração arredondados, percentual, índice e visibilidade no viewport. Buscar/avançar manualmente não conta os marcos pulados como assistidos; voltar ao início/reproduzir novamente abre novo ciclo. Não há mudança nos controles, mídia ou comportamento visual.

O carrossel emite `sheila:carousel-interaction` apenas após interação real; inicialização, resize e mudanças de destaque automáticas não geram tracking. Valores de tipo: `next`, `previous`, `dot_navigation`, `swipe`. O módulo não lê o conteúdo dos prints.

**Mapa:** o iframe atual é cross-origin. O navegador não permite observar seu clique interno. Não se simulou esse evento com foco, mouseover ou visualização. O handler `click_maps` foi testado com um link de teste, não com um clique interno do mapa publicado. Cobertura real desse ponto requer adicionar um link externo ao endereço ou botão “Abrir no Maps”, se o responsável permitir essa mudança de interação. Nenhum overlay foi inserido.

## 9. Configuração obrigatória no GA4 antes de ativar

Em Admin > Fluxos de dados > fluxo web > Medição otimizada:

1. Manter a visualização de página. Desativar page views por histórico caso uma integração futura mexa em History API sem mudar de página.
2. Manter Scrolls para 90%. O módulo envia apenas 25/50/75. Se Scrolls estiver desligado, mudar `scroll90` para `manual`; nunca usar ambos para 90%.
3. **Desligar cliques de saída automáticos**, pois o `link_url` automático poderia capturar a mensagem do WhatsApp, além de gerar um segundo evento de saída. O módulo já mede a saída permitida com parâmetros restritos.
4. Desligar busca no site e interações de formulário automáticas; não há tais fluxos autorizados nesta LP. Não habilitar captura de dados fornecidos por usuários, Google Signals ou personalização.
5. Vídeos HTML5 são medidos pelo módulo. A medição automática de vídeo do GA4 é voltada a YouTube e não substitui esse código.
6. Marcar apenas `lead_lp_implanon_diu` como evento principal desejado. Isso é uma mudança na conta, não foi feita por código nem confirmada remotamente.
7. Registrar dimensões personalizadas de baixa cardinalidade necessárias (button_location, lp_slug, video_index, faq_question_key, interaction_type). Evitar usar lead_id como dimensão padrão de relatórios de alta cardinalidade; reservar para exploração/exportação controlada.

Essas opções dependem de acesso à conta; não há alegação de que já foram alteradas. O consentimento ainda não integrado impede a ativação antecipada dessa configuração.

## 10. Debug e validação

URL de teste:

```text
https://sheilaantunesenf.com.br/?utm_source=instagram&utm_medium=paid_social&utm_campaign=teste_sheila&fbclid=teste123&debug_mode=true
```

Debug liga mensagens `[Sheila Tracking]` e `debug_mode` no GA4, não concede consentimento nem desbloqueia Meta. Logs não contêm referência, telefone ou valores de campanha. Fora de debug, o módulo fica silencioso.

Executar testes locais com Node e Playwright disponíveis:

```sh
node tests/tracking.test.cjs
```

Chrome pode ser definido por `CHROME_PATH`; caminho padrão é o Chrome instalado no Windows. Dependências de testes não são carregadas pela LP.

Resultados locais: instalação única, ausência de Ads/GTM, 9 posições de CTA, número e mensagem, referência estável por recarga, consentimento negado/concedido/revogado, GPC, captura/persistência de UTMs e fbclid, trava/expiração 24h, clique repetido, carregamento duplicado do módulo, scrolls sem duplicidade, FAQ abre/fecha, navegação, toque real no carrossel, 4 players em testes de estados/marcos/replay/seek, mapa por link de teste, limites dos payloads, bloqueio de storage/fornecedores e ausência de exceções JS. Vendors interceptados: os testes não poluem as contas.

Teste Meta isolado: configuração entregue, biblioteca interceptada, fila única, dois init, PageView broadcast, `LEAD_LP` com parâmetros mínimos, nove CTAs, consentimento seletivo, travas independentes, expiração e revogação. Isso **não comprova recebimento pelos Pixels**.

Para produção, depois do deploy e integração de consentimento:

1. Confirmar versão dos scripts no Network e ausência de tags extras da hospedagem.
2. Antes de consentir: nenhum request gtag/fbevents; WhatsApp funciona.
3. Consentir analytics, conferir gtag/js e requests GA4 `g/collect`, ID correto e uma page_view.
4. Abrir DebugView da propriedade correta; clicar uma vez, conferir evento, lead_id e localização. Clicar novamente, conferir somente repeat_click. Não enviar a mensagem WhatsApp durante o teste se não houver intenção de atendimento.
5. Conferir armazenamento de sessão, ausência de parâmetros técnicos no texto e comportamento de todos os CTAs mobile/desktop.
6. Testar scroll 25/50/75/90 conforme a configuração real do fluxo. Conferir vídeo/FAQ/carrossel.
7. Revogar consentimento e testar bloqueio das próximas interações.
8. Aceitar Marketing em um perfil de teste sem trava anterior; selecionar cada Pixel no Gerenciador de Eventos > Testar eventos e verificar `PageView` e `LEAD_LP` após clique no WhatsApp. O segundo clique em 24h não deve gerar outro `LEAD_LP`. Conferir Diagnósticos/eventos bloqueados de ambos os IDs. A captura fornecida refere-se ao Pixel `3112315745824007`; restrições do segundo não foram mostradas. Se houver bloqueio, desativar a integração afetada; não renomear eventos nem trocar domínio como evasão.

## 11. Limitações e pendências

- Consentimento separado integrado; bibliotecas não carregam sem autorização da respectiva finalidade.
- Categoria/restrições conhecidas pelas capturas do proprietário; aceitação de eventos atuais e Testar eventos dos dois Pixels ainda não verificados.
- Medição otimizada, evento principal e dimensões do GA4 precisam de configuração/validação na conta.
- Mapa atual não tem clique externo observável; necessário decidir sobre link de localização.
- DebugView, Pixel Helper e recebimento em servidores não foram validados nesta execução.
- Sem CRM/webhook/CAPI; clique não é confirmação de conversa, lead recebido ou agendamento.
- Sem storage disponível, persistência é limitada ao documento. Os bloqueios não são contornados.
- O módulo tem custo pequeno e nenhum framework extra; métricas de campo/Core Web Vitals após ativação de fornecedores não foram medidas.

## Referências consultadas

- [Consent Mode e implementação básica](https://developers.google.com/tag-platform/security/guides/consent)
- [Configuração GA4 e opções de publicidade/campanhas](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Limites de coleta GA4](https://support.google.com/analytics/answer/9267744?hl=en)
- [Medição otimizada: scroll, cliques, vídeos e formulários](https://support.google.com/analytics/answer/9216061)
- [Meta Business Tools Terms](https://www.facebook.com/legal/technology_terms) e [informações sensíveis de saúde](https://www.facebook.com/business/help/361948878201809): consulta direcionada ao login/bloqueio nesta sessão; requer revisão com acesso à conta, não valida a permissão para este domínio.
