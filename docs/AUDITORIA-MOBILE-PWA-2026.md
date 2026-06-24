# TIVE — Auditoria Mobile & PWA (2026)

> Auditoria crítica de funcionamento mobile e PWA, baseada em **evidência medida no código** (não em suposição). Cobre as 10 áreas obrigatórias.
> Complementa (sem repetir) os achados visuais já documentados em `VISUAL-REDESIGN-MOBILE-2026.md` e o sistema de design em `DESIGN-UX-UI-GUIDELINES-2026.md`.

**Produto:** Tive — PWA de treino de força, mobile-first (`max-w-lg`, dark, nav inferior) · **Data:** 23/06/2026 · **Régua:** produtos top de mercado (Linear, Stripe, Apple, Bloomberg).

**Legenda de severidade:** 🔴 Crítico · 🟠 Alto · 🟡 Médio · 🟢 Baixo.

---

## Diagnóstico em uma linha
A base PWA é sólida (manifest completo, service worker com estratégias de cache por tipo, listas virtualizadas, teclado numérico no logging). Mas há **quatro falhas mobile estruturais** que, em escala de milhares de usuários, geram suporte e abandono: o **botão Voltar do Android não fecha overlays**, o **zoom está desabilitado** (barreira de acessibilidade), o **PWA não avisa atualização nem mostra splash no iOS**, e a **tipografia desce a 8–9px**. Nenhuma é reescrita; todas são corrigíveis.

---

# 1. RELATÓRIO DE PROBLEMAS

## Área 1 — Responsividade

### P-01 🔴 Orientação travada + sem suporte a paisagem/tablet
- **Tela/Componente:** global · `public/manifest.json`, `index.html`
- **Descrição:** `"orientation": "portrait"` trava o app em retrato; nenhuma tela tem layout de paisagem/tablet (tudo `max-w-lg`). Em tablet, o app fica numa coluna estreita centralizada com grandes áreas vazias laterais.
- **Impacto:** experiência ruim em tablets e para quem usa o celular deitado (ex.: apoiado num banco da academia).
- **Severidade:** 🔴 Crítico (para tablets) / 🟠 Alto (paisagem no phone)
- **Evidência:** `manifest.json` → `orientation: portrait`; `Layout.tsx` → `max-w-lg md:max-w-2xl` sem grid de tablet.
- **Recomendação:** decidir conscientemente — se foco é phone retrato, documentar e melhorar o vazio em telas largas (max-w-2xl + colunas); se tablet importa, criar layout de 2 colunas para Dashboard/Analytics e liberar paisagem.

### P-02 🟠 Safe-area inconsistente (colisão com notch/status bar)
- **Tela/Componente:** `Dashboard.tsx` (e telas sem `pt-safe`)
- **Descrição:** `index.html` usa `apple-mobile-web-app-status-bar-style: black-translucent` (conteúdo sob a status bar) + `viewport-fit=cover`, mas o `Dashboard` não aplica `pt-safe` (Analytics/Settings aplicam). O topo do Dashboard pode encostar no relógio/notch.
- **Impacto:** conteúdo cortado/sob a status bar em iPhones com notch.
- **Severidade:** 🟠 Alto
- **Evidência:** `Dashboard.tsx` raiz = `px-5 pb-32 space-y-8` (sem `pt-safe`); `AnalyticsDashboard`/`Settings` usam `pt-safe`.
- **Recomendação:** `pt-safe` consistente via primitivo `AppHeader`/`Page` (ver VISUAL VR-04/VR-14).

### P-03 🟡 Gutter de página variável → "pulo" de alinhamento entre abas
- **Componente:** todas as telas · **Evidência:** `px-4` (Analytics/Settings), `px-5` (Dashboard/History/Plans), `px-6` (Photos); token `px-page` usado 0×.
- **Impacto/Severidade:** quebra de alinhamento percebida ao trocar de aba · 🟡 Médio.
- **Recomendação:** gutter único `px-page` (cross-ref VR-03).

## Área 2 — Usabilidade Mobile

### P-04 🟠 Funcionalidades-chave escondidas (descoberta)
- **Tela/Componente:** nav · `Layout.tsx`
- **Descrição:** Analytics fica como toggle dentro de History; `ExerciseLibrary` é órfã (sem entrada). Só 4 abas; recursos centrais ficam a 2+ toques ou invisíveis.
- **Impacto:** baixa descoberta do diferencial (analytics) e de features prontas.
- **Severidade:** 🟠 Alto · **Evidência:** `HistoryLog.tsx` `viewMode`; `ExerciseLibrary` sem referência de montagem.
- **Recomendação:** promover Analytics e Biblioteca (cross-ref `IMPROVEMENTS-PRODUCT-UX` B-01/B-02).

### P-05 🟡 Profundidade de fluxo no registro
- **Tela:** WorkoutPlayer · **Descrição:** logar exige abrir sessão → exercício → set; bom, mas o alcance do polegar para "completar set" e a sobreposição do teclado precisam de validação em dispositivo.
- **Severidade:** 🟡 Médio · **Recomendação:** modo "academia" com alvos grandes e foco automático (cross-ref VR-10/C-03); testar teclado-sobre-input.

## Área 3 — Touch Experience

### P-06 🔴 Alvos de toque abaixo de 44px em controles primários
- **Componente:** `ui/Button.tsx` (`sm`=32px, `md`=40px), toggle de período em `AnalyticsDashboard.tsx` (`py-1.5 text-[9px]`)
- **Descrição:** vários controles ficam abaixo do mínimo de 44×44px (WCAG 2.5.5 / HIG).
- **Impacto:** toques errados, frustração, principalmente em movimento.
- **Severidade:** 🔴 Crítico (controles primários) · **Evidência:** classes de tamanho do `Button`; toggle `px-2 py-1.5`.
- **Recomendação:** mínimo 44px em ações primárias; `sm` só para densas secundárias (cross-ref VR-10).

### P-07 🟠 Feedback de toque ausente onde só há `hover`
- **Componente:** global · **Evidência:** 269 utilitários `hover:` vs 60 `active:` (~4:1).
- **Descrição:** muitos elementos dão feedback só em hover (que no touch não dispara ou "gruda" após o tap), sem estado `active`/`:active`.
- **Impacto:** ações parecem "não responder" ao toque.
- **Severidade:** 🟠 Alto · **Recomendação:** todo elemento interativo com `active:` (scale/opacity) e `focus-visible`; classe `.tap` padrão.

## Área 4 — Navegação

### P-08 🔴 Botão Voltar do Android não fecha overlays
- **Tela/Componente:** global · WorkoutPlayer, Settings, 27 modais/sheets
- **Descrição:** não há integração com `history`/`popstate`. Em PWA standalone no Android, o gesto/botão Voltar com um modal ou o player aberto **não fecha o overlay** — fecha o app ou não faz nada.
- **Impacto:** perda de contexto e até saída acidental do app durante o treino; quebra a expectativa nº1 de navegação no Android.
- **Severidade:** 🔴 Crítico
- **Evidência:** `grep popstate|pushState|hashchange` em `src/` = **0 ocorrências**.
- **Recomendação:** ao abrir overlay, `history.pushState`; ouvir `popstate` para fechar o topo da pilha. Centralizar num hook `useBackDismiss` aplicado em modais e no player.

### P-09 🟡 Sem confirmação de saída durante sessão ativa
- **Tela:** WorkoutPlayer · **Descrição:** combinado com P-08, sair/voltar pode descartar uma sessão em andamento sem aviso.
- **Severidade:** 🟡 Médio · **Recomendação:** guarda de navegação + confirmação ("Descartar treino em andamento?").

## Área 5 — Formulários

### P-10 🟢 Teclado numérico correto no core (ponto positivo)
- **Componente:** `active-session/SetRow.tsx` · **Evidência:** `type="number" inputMode="decimal"` (peso) e `inputMode="numeric"` (reps).
- **Status:** ✅ correto. Manter.

### P-11 🟡 `type="number"` com efeitos colaterais + checar todos os campos numéricos
- **Descrição:** `type="number"` permite `e`, roda no scroll e ignora `maxlength`; e nem todo campo numérico foi auditado (ex.: peso corporal no onboarding deve usar `inputMode="decimal"`).
- **Severidade:** 🟡 Médio · **Evidência:** 9× `type="number"`; `WelcomeModal`/`CreateExerciseModal` usam `type="text"` em alguns campos.
- **Recomendação:** padrão `type="text" inputMode="decimal" pattern="[0-9.,]*"` para números; auditar todos os inputs.

### P-12 🟡 Validação e mensagens de erro inline pouco evidentes
- **Descrição:** falta verificar estados de erro por campo (formato, limites) com mensagem próxima ao campo; hoje o feedback é via toast global (3s).
- **Severidade:** 🟡 Médio · **Recomendação:** validação inline com `aria-describedby` e foco no primeiro erro.

## Área 6 — Performance Mobile

### P-13 🟠 Imagens sem `width`/`height` → CLS (layout shift)
- **Componente:** `ui/ImageWithFallback.tsx`, mídia de exercício · **Evidência:** 12 `<img>`, **0** com `width`/`height` declarados; `loading="lazy"` em 7.
- **Impacto:** salto de layout ao carregar GIFs/imagens — jank e Cumulative Layout Shift ruim.
- **Severidade:** 🟠 Alto · **Recomendação:** definir `width`/`height` ou `aspect-ratio` em todo `<img>`; manter `loading="lazy"`.

### P-14 🟡 Motion pesado não-gated em dispositivos antigos
- **Evidência:** 64 arquivos usam Framer Motion; 3 respeitam `prefers-reduced-motion`.
- **Impacto:** jank e consumo em aparelhos antigos; ignora preferência de acessibilidade.
- **Severidade:** 🟡 Médio (perf) / 🟠 Alto (a11y) · **Recomendação:** `<MotionConfig reducedMotion="user">` global (cross-ref VR-07).

### P-15 🟡 Bundle de gráficos pesado
- **Evidência:** chunk `charts` ≈ 428KB no `dist`. · **Impacto:** carregamento mais lento da área de analytics em rede móvel.
- **Severidade:** 🟡 Médio · **Recomendação:** já há code-splitting; garantir que Recharts só carregue na rota de analytics; avaliar lib mais leve para gráficos simples.
- **Positivo:** ✅ listas longas já são virtualizadas (`react-window` em `HistoryLog` e `ExerciseLibrary`); memoização presente (`useMemo` 109, `React.memo` 5, `useShallow`).

## Área 7 — PWA

### P-16 🔴 Sem prompt de atualização (usuário preso em versão velha)
- **Componente:** `public/service-worker.js`, `src/main.tsx`
- **Descrição:** o SW faz `skipWaiting()` mas não há detecção de nova versão nem aviso "Atualização disponível — recarregar". A aba aberta segue com assets antigos até um reload manual.
- **Impacto:** usuários rodando versões desatualizadas por dias; bugs já corrigidos persistem.
- **Severidade:** 🔴 Crítico (em produção com milhares de usuários) · **Evidência:** SW só com `skipWaiting`; `main.tsx` registra sem `updatefound`/`controllerchange`.
- **Recomendação:** detectar `registration.waiting`/`updatefound`, exibir toast de update, recarregar no `controllerchange`.

### P-17 🟠 Sem splash screens no iOS
- **Componente:** `index.html` · **Descrição:** não há `apple-touch-startup-image`; no iOS standalone o launch mostra tela em branco.
- **Impacto:** percepção de lentidão/baixa qualidade no boot em iPhone.
- **Severidade:** 🟠 Alto · **Recomendação:** gerar splash screens por tamanho de tela e referenciá-las.

### P-18 🟡 `manifest.lang = "en"` fixo
- **Evidência:** `manifest.json` → `"lang": "en"`. · **Impacto:** metadados de instalação em inglês mesmo para usuário pt-BR.
- **Severidade:** 🟡 Médio · **Recomendação:** localizar metadados ou alinhar ao idioma detectado.

### P-19 🟢 Estratégia de cache do SW (ponto positivo)
- **Evidência:** network-first p/ API, cache-first p/ imagens, stale-while-revalidate p/ JS/CSS, app shell pré-cacheado. ✅ Manter. Adicionar fallback offline explícito para navegação a recurso não cacheado.

## Área 8 — Design Visual Mobile

### P-20 🔴 Tipografia abaixo de 10px em massa
- **Evidência:** 32× `text-[8px]` + 102× `text-[9px]` (134 no total), inclusive `SetRow` e analytics. · **Severidade:** 🔴 Crítico (legibilidade/premium). · **Recomendação:** piso 11px (cross-ref VR-01).

### P-21 🟠 Chrome de app inconsistente
- **Evidência:** `DashboardHeader` simples não-fixo vs `HistoryHeader`/`PlanHeader` foscos fixos. · **Severidade:** 🟠 Alto. · **Recomendação:** `AppHeader` único (cross-ref VR-04).

### P-22 🟡 Hierarquia/ritmo irregulares
- **Evidência:** 356 `text-[Npx]`; `space-y-8/6/4` misturados. · **Severidade:** 🟡 Médio. · **Recomendação:** escala tipográfica + ritmo 4pt (cross-ref VR-02/VR-06).

## Área 9 — Acessibilidade

### P-23 🔴 Zoom desabilitado (barreira WCAG)
- **Componente:** `index.html` · **Evidência:** `viewport ... maximum-scale=1.0, user-scalable=no`.
- **Descrição:** impede pinça-zoom; viola WCAG 2.2 §1.4.4 (Resize Text) / §1.4.10.
- **Impacto:** usuários com baixa visão não conseguem ampliar — exclusão real.
- **Severidade:** 🔴 Crítico · **Recomendação:** remover `maximum-scale`/`user-scalable=no` (manter `viewport-fit=cover`). O CSS já evita zoom acidental em inputs (16px) e `touch-action: manipulation`.

### P-24 🔴 Modais sem focus-trap nem semântica de diálogo
- **Evidência:** 27 componentes de modal/sheet/overlay; só **2** usam `useFocusTrap`, só **1** tem `role="dialog"`/`aria-modal`.
- **Impacto:** teclado/leitor de tela "vazam" para trás do modal; navegação confusa para quem usa AT.
- **Severidade:** 🔴 Crítico (a11y) · **Recomendação:** primitivo `Modal` com `role="dialog" aria-modal="true"`, `useFocusTrap`, `Esc`/backdrop, retorno de foco.

### P-25 🟠 Eventos dinâmicos não anunciados (sem live regions)
- **Evidência:** apenas 2 `aria-live`. · **Descrição:** timer de descanso, conclusão de set e PR não são anunciados a leitores de tela.
- **Severidade:** 🟠 Alto · **Recomendação:** `aria-live="polite"` para timer/feedback e `assertive` para PR.

### P-26 🟠 Fonte fixa em px ignora Dynamic Type
- **Evidência:** 356 textos em `px`; sem estratégia `rem`/escala do SO. · **Impacto:** usuários que aumentam a fonte do sistema não veem efeito.
- **Severidade:** 🟠 Alto · **Recomendação:** migrar para a escala (tokens em `rem`) e respeitar `font-size` do root.
- **Positivo:** ✅ contraste de texto passa WCAG AA (medido: `zinc-500` 6.91:1, `zinc-600` 5.33:1).

## Área 10 — Cenários Reais

### P-27 🟡 Offline de primeira carga / recuperação de rede
- **Descrição:** após carregado, o app funciona offline (shell pré-cacheado, dados locais). Mas a primeira carga offline não tem fallback, e não há indicador claro de "sem conexão / reconectando" além do `SyncStatus`.
- **Severidade:** 🟡 Médio · **Recomendação:** banner de estado de conexão + fallback offline explícito.

### P-28 🟡 Sob luz solar / em movimento
- **Descrição:** contraste passa AA (bom), mas os textos de 8–9px ficam ilegíveis sob sol/brilho e em movimento; alvos pequenos erram em movimento.
- **Severidade:** 🟡 Médio · **Recomendação:** P-06 + P-20 resolvem.

### P-29 🟢 Sem `undo` para ações destrutivas
- **Evidência:** `ConfirmModal` em 2 lugares; **0** padrão de `undo`. · **Descrição:** apagar rotina/sessão depende de confirmação (ou nem isso); UX mobile moderna prefere `undo`.
- **Severidade:** 🟢 Baixo · **Recomendação:** toast com "Desfazer" em exclusões reversíveis.

---

# 2. MELHORIAS RECOMENDADAS

| # | Problema atual | Melhoria | Ganho para o usuário |
|---|---|---|---|
| M1 | Voltar do Android fecha o app | Integração com `history`/`popstate` | Navegação previsível; não perde o treino |
| M2 | Zoom bloqueado | Reabilitar zoom | Inclusão de baixa visão (WCAG) |
| M3 | Sem aviso de update | Toast "nova versão" | Sempre na versão corrigida |
| M4 | Splash branca no iOS | Splash screens iOS | Boot premium, percepção de velocidade |
| M5 | Texto 8–9px | Piso 11px + escala | Legibilidade na academia |
| M6 | Modais sem foco-trap | Primitivo `Modal` acessível | Uso por teclado/leitor de tela |
| M7 | Imagens sem dimensão | `aspect-ratio`/`width`/`height` | Sem salto de layout (CLS) |
| M8 | Hover sem touch | `active:`/`.tap` padrão | Feedback tátil em todo toque |
| M9 | Header inconsistente | `AppHeader`/`Page` | Sensação de produto único |
| M10 | Motion não-gated | `MotionConfig` global | Fluidez em aparelho antigo + a11y |
| M11 | Sem undo | Toast "Desfazer" | Recuperação rápida de erro |
| M12 | Sem estado de conexão | Banner offline/reconectando | Confiança em rede instável |

---

# 3. PLANO DE CORREÇÃO

## FASE 1 — Correções Críticas (funcionamento/usabilidade)
- **P-08** Voltar do Android fecha overlays (`useBackDismiss` + `popstate`).
- **P-23** Reabilitar zoom (remover `user-scalable=no`/`maximum-scale`).
- **P-16** Prompt de atualização do PWA.
- **P-24** Primitivo `Modal` acessível (foco-trap + `role=dialog`) e migração dos modais.
- **P-06** Alvos de toque ≥ 44px nos controles primários.
- **P-20** Eliminar texto < 10px.
- **P-02** `pt-safe` consistente (anti-colisão com notch).

## FASE 2 — Melhorias de UX (atrito)
- **P-07** `active:`/`.tap` em todo interativo.
- **P-09** Guarda de saída em sessão ativa.
- **P-11/P-12** Inputs numéricos robustos + validação inline.
- **P-25** Live regions para timer/PR/set.
- **P-04** Promover descoberta de Analytics/Biblioteca.
- **P-27** Banner de estado de conexão + fallback offline.

## FASE 3 — Refinamento Visual (layout/design/consistência)
- **P-03** Gutter único `px-page`.
- **P-21/P-22** `AppHeader`/`Page`/`Section` + escala tipográfica + ritmo 4pt.
- **P-13** Dimensões/`aspect-ratio` nas imagens (CLS).
- **P-26** Migrar tipografia para tokens `rem` (Dynamic Type).

## FASE 4 — Polimento Premium (nível enterprise)
- **P-17** Splash screens iOS.
- **P-01** Decisão de paisagem/tablet (layout largo ou documentar).
- **P-14/P-15** Motion gated + budget de performance (charts).
- **P-18** Localizar metadados do manifest.
- **P-29** Padrão de `undo`; numerais tabulares; header large-title colapsável.

---

# 4. PROMPT DE EXECUÇÃO

> Bloco autossuficiente para a IA implementadora.

```
CONTEXTO
Você vai corrigir o funcionamento mobile e PWA do "Tive", um PWA de treino de força (React 18 + TypeScript + Vite + Tailwind + Zustand + Framer Motion; mobile-first max-w-lg, dark, nav inferior; service worker em public/service-worker.js; manifest em public/manifest.json; tokens semânticos em tailwind.config.js). Já existem ui/Button, ui/IconButton, ui/EmptyState, hooks useMotion e useFocusTrap, e listas virtualizadas com react-window. NÃO assuma que está tudo certo; siga a lista.

OBJETIVO
Levar a experiência mobile/PWA a padrão premium sem reescrever features nem mudar regras de negócio.

ALTERAÇÕES (em ordem de fase)
FASE 1 — CRÍTICO:
1. Navegação Voltar (Android): criar hook useBackDismiss que, ao abrir um overlay (modais, sheets, WorkoutPlayer), faz history.pushState e fecha o overlay no evento popstate. Aplicar a TODOS os overlays (há ~27) e ao player. Em sessão ativa, pedir confirmação antes de descartar.
2. Acessibilidade de zoom: em index.html, remover "maximum-scale=1.0, user-scalable=no" do viewport (manter width=device-width, initial-scale=1, viewport-fit=cover).
3. Atualização PWA: em main.tsx, detectar registration.updatefound / registration.waiting; exibir toast "Nova versão disponível — recarregar"; ao confirmar, postMessage SKIP_WAITING e recarregar no controllerchange. Ajustar o SW para tratar a mensagem.
4. Modal acessível: criar ui/Modal.tsx com role="dialog" aria-modal="true", useFocusTrap, fechar em Esc e backdrop, retorno de foco ao gatilho, z-modal. Migrar os modais existentes.
5. Alvos de toque: garantir min-h-[44px] e área tocável ≥ 44px em todas as ações primárias (inclui o toggle de período do AnalyticsDashboard → min-h-[44px] px-3 text-label).
6. Tipografia mínima: substituir text-[8px]→text-caption-xs e text-[9px]→text-caption (controles→text-label). Zero texto < 11px em conteúdo.
7. Safe-area: aplicar pt-safe em todas as telas (idealmente via um primitivo Page/AppHeader).

FASE 2 — UX:
8. Feedback de toque: adicionar estado active: (scale/opacity) e focus-visible a todo elemento interativo; criar utilitário .tap.
9. Inputs numéricos: padronizar campos numéricos como type="text" inputMode="decimal" pattern="[0-9.,]*" (peso/medidas) e inputMode="numeric" (reps); validação inline com aria-describedby e foco no primeiro erro.
10. Live regions: aria-live="polite" para timer de descanso e conclusão de set; aria-live="assertive" para PR.
11. Estado de conexão: banner "sem conexão/reconectando" + fallback offline no SW para navegação não cacheada.

FASE 3 — VISUAL:
12. Gutter único px-page em todas as telas; criar primitivos ui/Page e ui/Section; unificar headers em ui/AppHeader (frosted fixo + pt-safe).
13. Escala tipográfica: zerar text-[Npx] migrando para tokens (10→caption-xs … 16→body-lg, títulos→h*); ritmo vertical 4pt (seções space-y-6).
14. Imagens: definir width/height ou aspect-ratio em todo <img> (eliminar CLS); manter loading="lazy".

FASE 4 — PREMIUM:
15. Splash screens iOS (apple-touch-startup-image por tamanho).
16. MotionConfig reducedMotion="user" global em main.tsx; padronizar durações (0.15s micro / 0.25s tela).
17. Localizar manifest (lang conforme idioma); decisão de paisagem/tablet; numerais tabulares (.tabular) em métricas; undo em exclusões reversíveis.

REGRAS OBRIGATÓRIAS
- Sempre tokens; nunca valores literais (sem text-[px], z-[N], hex arbitrário).
- Toda ação via <Button>/<IconButton> com focus-visible e alvo ≥ 44px.
- Toda animação respeita prefers-reduced-motion.
- Todo texto via i18n t() (en + pt-BR); parity.test.ts verde.
- Não adicionar dependências novas; não alterar lógica de negócio/stores.

RESTRIÇÕES
- Mudanças incrementais e revisáveis, uma fase por vez.
- Não mudar paleta (lime/zinc) nem fontes; não redesenhar features.

CRITÉRIOS DE QUALIDADE (Definition of Done)
- npm run build e npm run test verdes; parity.test.ts verde.
- Back do Android fecha o overlay topo (testado em PWA Android).
- Zoom funciona; modais com foco-trap e role=dialog; aria-live anuncia timer/PR.
- grep text-\[[0-9]+px\] = 0; nenhuma imagem sem dimensão; alvos primários ≥ 44px.
- Prompt de atualização aparece ao publicar nova versão; sem regressão funcional.
- Testado em iPhone pequeno (SE), phone grande e Android, retrato; reduced-motion respeitado.

RESULTADO ESPERADO
Um PWA mobile que navega como app nativo (Voltar correto, foco acessível, update suave), legível e estável (sem CLS, sem texto < 11px), com toque confiável e movimento contido — pronto para milhares de usuários sem regressão funcional.
```

---

## Apêndice — evidências medidas
```
popstate/pushState em src/: 0          viewport: user-scalable=no, maximum-scale=1.0
modais c/ useFocusTrap: 2 / ~27        aria-live: 2
hover: 269  vs  active: 60             <img> sem width/height: 12/12
text-[8px]: 32  ·  text-[9px]: 102     SW: skipWaiting sem prompt de update
react-window: HistoryLog + ExerciseLibrary (✅)   inputMode no SetRow: decimal/numeric (✅)
SW cache: API network-first · imagens cache-first · JS/CSS SWR (✅)
manifest: standalone, maskable, shortcuts (✅) · lang="en", orientation portrait, sem splash iOS
Contraste AA: zinc-500 6.91:1 · zinc-600 5.33:1 (✅)
```
