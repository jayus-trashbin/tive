# TIVE — Redesign Visual Mobile: Análise Sênior & Plano Executável (2026)

> Auditoria de design de nível sênior com foco em **excelência mobile em todas as telas**. Aplica os workflows `/design-taste-frontend`, `/frontend-design`, `/impeccable`, `/ui-ux-pro-max` + frameworks `/design-critique` e `/design-system`.
> Todos os números abaixo foram **medidos no código** (`tailwind.config.js`, `src/index.css`, telas em `src/components/**`).

**Produto:** Tive — strength-training PWA (mobile-first, `max-w-lg`) · **Data:** 23/06/2026 · **Régua de qualidade:** Linear, Stripe, Apple, Vercel, Notion, Arc, Figma, Bloomberg.

---

## 1. Diagnóstico executivo

O Tive tem ossatura de produto premium — tokens semânticos, dark mode coeso (lime sobre quase-preto), componentes-modelo (`Button`, `EmptyState`), acessibilidade de base. **Mas a execução visual está sendo sabotada por três falhas sistêmicas que, juntas, derrubam a percepção de qualidade no mobile:**

1. **Tipografia minúscula em escala industrial.** 134 ocorrências de texto **abaixo de 10px** (32× `text-[8px]`, 102× `text-[9px]`) — incluindo o `SetRow` durante o treino e todo o painel de analytics. Nenhum produto de referência (Linear, Stripe, Bloomberg) usa 8px. É o maior assassino de percepção premium e de legibilidade na academia.
2. **Sem grade nem gutter único.** O inset horizontal de página varia por tela (`px-4` em Analytics/Settings, `px-5` em Dashboard/History/Plans, `px-6` em Photos). O token `px-page` existe e é usado **0 vezes**. Resultado: ao trocar de aba, a borda do conteúdo "pula" — quebra de alinhamento perceptível.
3. **Chrome de app inconsistente.** O `DashboardHeader` é um header simples, não-fixo, sem borda nem blur; `HistoryHeader`/`PlanHeader` são barras foscas fixas com borda. A tela mais usada parece de outro app.

Somam-se a isso: hierarquia tipográfica achatada (356 `text-[Npx]` ad-hoc vs escala semântica ignorada), botões não padronizados (5 `<Button>` vs 36 `<button>` crus), ritmo vertical irregular (`space-y-8/6/4` misturados), movimento que ignora `prefers-reduced-motion` (3 de 64 arquivos) e z-index improvisado (25 `z-[N]`).

**A boa notícia:** quase tudo é problema de *adoção*, não de *fundação*. Existe um sistema bom — ele só não está sendo seguido. Corrigir isso é, em grande parte, substituição disciplinada, não reinvenção. O contraste, inclusive, já passa WCAG AA (medido: `zinc-500` 6.91:1, `zinc-600` 5.33:1).

---

## 2. Análise profunda por dimensão

> Cada problema: **impacto** · por que prejudica · solução · referência de mercado.

### 2.1 Escala tipográfica & legibilidade — `[CRÍTICA]`
**Problema:** 134 textos < 10px e 356 `text-[Npx]` ad-hoc, apesar de existir escala semântica (`caption-xs→h1`). **Por que prejudica:** 8–9px é ilegível no mobile (e na academia, com suor/pressa/brilho); achata a hierarquia (legenda ≈ corpo ≈ rótulo); sinaliza "amador". **Solução:** piso de 11px (`caption`) para qualquer rótulo, 12px (`label`) para controles, 13–14px (`body`) para conteúdo; migrar 100% para a escala. **Referência:** Linear e Stripe usam ~12–14px como base, 11px só para metadados.

### 2.2 Grid system, gutter & alinhamento — `[CRÍTICA]`
**Problema:** sem gutter único (`px-4/5/6`), `px-page` (20px) usado 0×; sem grade base compartilhada. **Por que prejudica:** a borda do conteúdo muda a cada aba; o olho percebe desalinhamento mesmo sem nomear. **Solução:** gutter único de página = `px-page` (20px) em **todas** as telas; grade base de 4pt; um container de página padrão. **Referência:** Apple HIG e Linear mantêm margem lateral fixa entre telas — estabilidade = sofisticação.

### 2.3 Chrome de app / sistema de header — `[CRÍTICA]`
**Problema:** Dashboard tem header não-fixo e sem moldura; History/Plans têm barra fosca fixa com borda; Analytics/Settings usam `pt-safe`, Dashboard não. **Por que prejudica:** quebra a sensação de produto único; comportamento de scroll diferente por aba; risco de colisão com o notch no Dashboard. **Solução:** um primitivo `AppHeader` consistente (frosted `bg-zinc-950/80 backdrop-blur`, borda inferior, `pt-safe`, z-`sticky`) com slot de título grande + ações; aplicar a todas as telas. **Referência:** o header fosco fixo do iOS/Linear/Arc.

### 2.4 Hierarquia visual & escaneabilidade — `[ALTA]`
**Problema:** com tudo no mesmo tamanho pequeno, falta degrau entre título de seção, métrica e rótulo. **Por que prejudica:** aumenta a carga cognitiva; o olho não encontra âncoras. **Solução:** três níveis claros — `h2/h1` para títulos de tela/seção, números grandes em mono para a métrica-herói, `caption` para rótulos; uma ênfase de acento (lime) por bloco. **Referência:** dashboards da Vercel/Bloomberg — número-herói dominante, rótulo discreto.

### 2.5 Espaçamento & ritmo vertical — `[ALTA]`
**Problema:** `space-y-8` (Dashboard) vs `space-y-6`/`space-y-4` em outras; `gap-2` (174×) sem sistema. **Por que prejudica:** ritmo irregular = sensação de "montado às pressas". **Solução:** escala de espaçamento de 4pt aplicada por papel — 24px entre seções (`section`), 16px dentro de grupos, 8–12px entre itens próximos; padronizar `space-y` de seção. **Referência:** ritmo vertical constante do Notion.

### 2.6 Componentização & estados de interação — `[ALTA]`
**Problema:** 5 `<Button>` vs 36 `<button>` crus + `.btn-primary`; muitos sem foco-visível; alvos < 44px (`Button sm`=32, `md`=40; toggle de Analytics `py-1.5 text-[9px]`). **Por que prejudica:** estados inconsistentes, foco ausente (a11y), toques que erram. **Solução:** tudo via `<Button>`/`IconButton`; alvo mínimo 44px nas ações primárias; classe `.tap` (foco+scale) para áreas clicáveis especiais. **Referência:** sistema de botões do Stripe/Figma — um componente, estados completos.

### 2.7 Movimento & performance visual — `[ALTA]`
**Problema:** 64 arquivos animam, 3 respeitam `prefers-reduced-motion`; CSS de reduced-motion não detém Framer Motion. **Por que prejudica:** acessibilidade e sensação de "inquieto"; risco de jank. **Solução:** `<MotionConfig reducedMotion="user">` global; durações padronizadas (120–200ms micro, 200–300ms tela); só `transform/opacity`. **Referência:** motion contido e proposital do Linear.

### 2.8 Consistência de empilhamento (z-index) — `[MÉDIA]`
**Problema:** 25 `z-[N]` literais furam a escala. **Por que prejudica:** risco de modal atrás de conteúdo/toast errado. **Solução:** usar `z-modal/z-overlay/z-toast`; primitivo de modal único.

### 2.9 Densidade & ruído visual — `[MÉDIA]`
**Problema:** telas densas (Analytics, Mesocycle) empilham muitos blocos pequenos. **Por que prejudica:** excesso de informação simultânea reduz foco. **Solução:** agrupamento por Gestalt (proximidade + um divisor sutil), revelar detalhe sob demanda (acordeão/drill-down), 1 ação primária por tela. **Referência:** progressive disclosure do Airtable.

### 2.10 Cor & foco — `[MÉDIA]`
**Problema:** o acento lime é forte; usado em excesso, dilui o foco. **Por que prejudica:** se tudo brilha, nada brilha. **Solução:** lime reservado à ação/dado primário; estados neutros em zinc; semânticos (success/warning/danger) só para status. **Referência:** uso cirúrgico de cor do Linear.

### 2.11 Seleção de texto & detalhes mobile — `[MÉDIA/BAIXA]`
**Problema:** `user-select: none` global bloqueia copiar pesos/notas; `pt-safe` ausente no Dashboard. **Solução:** liberar seleção em dados/notas; `pt-safe` consistente.

### 2.12 Governança de marca — `[MÉDIA]`
**Problema:** `README`/`PRODUCT.md` (4px, Outfit, acento branco) ≠ implementação (raio 8–24px, Inter, lime). **Solução:** documentar o sistema real (recomendado) ou abrir épico de redesign explícito.

---

## 3. Melhorias adicionais (não previstas no projeto)

1. **Numerais tabulares** (`font-variant-numeric: tabular-nums`) em toda métrica/timer — números param de "tremer" ao atualizar. Impacto premium altíssimo, custo baixo.
2. **Primitivos de layout**: `<Page>` (gutter+scroll+safe-area padrão), `<AppHeader>`, `<Section>` (título + ritmo), `<Card>` (já há base) — eliminam improviso por tela.
3. **Modo de densidade** (Confortável/Compacto) nas preferências — em vez de tudo universalmente apertado, o usuário escolhe; o default vira confortável.
4. **Sistema de elevação** consistente usando os `boxShadow` tokens (`card/card-hover/nav`) por nível semântico (base→raised→overlay).
5. **Data-viz premium**: estilo unificado de gráfico (grid sutil, eixos discretos, lime para a série principal, mono nos eixos), anotações de PR/marcos — padrão Bloomberg/Linear.
6. **Estados vazios e de carregamento coesos** (já há skeletons): padronizar com `EmptyState` e skeletons por tela.
7. **Toque & feedback**: haptics (`useHaptic`) já existe — aplicar consistentemente em ações de confirmação/erro.
8. **Header com título grande colapsável** (large-title → inline ao rolar), padrão iOS/Arc — eleva o "feel" nativo.

---

## 4. Visão premium / enterprise

Onde isto leva o Tive: de "logger competente e denso" para "**instrumento de precisão**". A direção é a do Bloomberg Terminal encontrando o Linear — **dado denso, mas calmo**: um chrome de app estável e fosco em todas as telas, uma única margem de página, um número-herói dominante em mono tabular por contexto, lime usado como bisturi (uma ênfase por tela), ritmo vertical matemático (4pt), e movimento contido que respeita o usuário. O resultado percebido: sofisticação, clareza, confiabilidade e modernidade — sem reescrever o produto, apenas **fazendo o sistema existente ser obedecido**.

---

# PLANO DE IMPLEMENTAÇÃO EXECUTÁVEL

> Cada item é autossuficiente: outra IA executa sem interpretação. IDs `VR-xx`. Caminhos relativos à raiz do repo.

### VR-01 — Eliminar texto < 10px
**Problema identificado:** 134 usos de `text-[8px]`/`text-[9px]` em 34 arquivos (inclui `active-session/SetRow.tsx`, `analytics/*`, `dashboard/*`).
**Objetivo da alteração:** piso de legibilidade de 11px; nenhum texto abaixo de `text-caption` (11px).
**Instrução de implementação:** substituir em todo `src/**/*.tsx`: `text-[8px]`→`text-caption-xs` (10px) apenas em selos/badges não essenciais; `text-[9px]`→`text-caption` (11px). Para rótulos de controles interativos (ex.: toggles de período em `analytics/AnalyticsDashboard.tsx`), usar `text-label` (12px). Revisar visualmente cada tela após a troca.
**Justificativa:** 8–9px é ilegível no mobile e destrói a percepção premium; 11–12px restaura leitura e hierarquia.
**Prioridade:** Crítica.

### VR-02 — Adotar a escala tipográfica (zerar `text-[Npx]`)
**Problema identificado:** 356 `text-[Npx]` ad-hoc vs escala semântica ignorada.
**Objetivo:** hierarquia tipográfica consistente em todo o app.
**Instrução:** migrar por mapa — `[10px]→caption-xs`, `[11px]→caption`, `[12px]→label`, `[13px]→body-sm`, `[14px]→body`, `[16px]→body-lg`, títulos→`h3/h2/h1`. Começar pelos arquivos de maior concentração: `Settings.tsx` (33), `mesocycle/MesocyclePlanner.tsx` (25), `progress/PhotoGallery.tsx` (19), `analytics/AnalyticsDashboard.tsx` (17), `history/SessionDetailsModal.tsx` (16). Meta: `grep -rEo "text-\[[0-9]+px\]" src` = 0.
**Justificativa:** valores mágicos achatam a hierarquia; a escala recria os degraus título<corpo<rótulo.
**Prioridade:** Crítica.

### VR-03 — Gutter de página único
**Problema identificado:** inset horizontal varia (`px-4/5/6`); `px-page` (20px) usado 0×.
**Objetivo:** borda de conteúdo estável em todas as telas.
**Instrução:** no container raiz de cada tela (`Dashboard`, `analytics/AnalyticsDashboard`, `HistoryLog`, `PlanManager`, `progress/ProgressPhotos`, `Settings`, `mesocycle/MesocyclePlanner`, e headers), trocar o padding horizontal de página por `px-page`. Não alterar padding interno de cards (mantém tokens de card).
**Justificativa:** margem lateral constante entre telas = alinhamento e sofisticação percebidos.
**Prioridade:** Crítica.

### VR-04 — Primitivo `AppHeader` consistente
**Problema identificado:** `DashboardHeader` (não-fixo, sem moldura) diverge de `HistoryHeader`/`PlanHeader` (frosted fixo + borda); `pt-safe` inconsistente.
**Objetivo:** chrome de app único em todas as telas.
**Instrução:** criar `src/components/ui/AppHeader.tsx` com: `shrink-0 px-page pt-safe pb-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-sticky`, slot de título (`text-h1`) e slot de ações à direita. Refatorar `DashboardHeader`, `HistoryHeader`, `PlanHeader` (e headers de Analytics/Settings/Photos) para usá-lo. Garantir `pt-safe` em todos.
**Justificativa:** unifica scroll, safe-area e identidade; remove a sensação de "telas de apps diferentes".
**Prioridade:** Crítica.

### VR-05 — Consolidar botões e estados
**Problema identificado:** 5 `<Button>` vs 36 `<button>` crus + `.btn-primary`; foco/hit-area inconsistentes.
**Objetivo:** um sistema de botão; foco-visível e toque ≥ 44px.
**Instrução:** substituir `<button>` de ação por `<Button variant size>`; ícone puro por `<IconButton>`. Para áreas clicáveis grandes (cards/linhas), criar utilitário `.tap` em `index.css` (`focus-visible:ring-2 ring-brand-primary active:scale-[0.98]`) e aplicar. Remover `.btn-primary` de `src/index.css` e migrar usos. Ações primárias com `size="lg"` (48px) ou `min-h-[44px]`.
**Justificativa:** consistência de interação + acessibilidade de foco e alvo.
**Prioridade:** Alta.

### VR-06 — Ritmo vertical de 4pt
**Problema identificado:** `space-y-8/6/4` misturados entre telas; `gap` sem sistema.
**Objetivo:** ritmo vertical previsível.
**Instrução:** padronizar espaçamento entre seções para `space-y-6` (24px, token `section`) nas telas de conteúdo (Dashboard passa de `space-y-8`→`space-y-6`); dentro de grupos `gap-4` (16px); itens próximos `gap-2`/`gap-3`. Não usar valores fora da escala 4pt (4/8/12/16/24/32).
**Justificativa:** ritmo constante transmite ordem e qualidade.
**Prioridade:** Alta.

### VR-07 — Motion acessível e contido
**Problema identificado:** 3/64 arquivos respeitam `prefers-reduced-motion`.
**Objetivo:** movimento proposital que respeita o usuário.
**Instrução:** em `src/main.tsx`, envolver `<App/>` com `<MotionConfig reducedMotion="user">` (import de `framer-motion`). Padronizar durações: micro 0.15s, tela 0.25s. Manter loops manuais gateados por `useMotion`.
**Justificativa:** acessibilidade + sensação calma/premium; menos jank.
**Prioridade:** Alta.

### VR-08 — Numerais tabulares em métricas
**Problema identificado:** números (métricas, timers, e1RM) "tremem" ao atualizar por usarem largura proporcional.
**Objetivo:** estabilidade tipográfica de dados.
**Instrução:** adicionar utilitário `.tabular` (`font-variant-numeric: tabular-nums`) em `index.css` e aplicar em todo número de métrica/timer/contagem (MetricStrip, timers de sessão, analytics, e1RM do `SetRow`). Opcional: aplicar globalmente à `font-mono` via `@layer base`.
**Justificativa:** números que não saltam = percepção imediata de produto de precisão.
**Prioridade:** Alta.

### VR-09 — Z-index pela escala semântica
**Problema identificado:** 25 `z-[N]` literais.
**Objetivo:** empilhamento previsível.
**Instrução:** remapear preservando ordem: `z-[60..100]`→`z-modal`, camada acima de modal (ex.: lightbox em `PhotoGallery`)→`z-overlay`, splash `z-[200]`→`z-toast`. Conferir componentes com 2 níveis (`PhotoGallery`, `WorkoutSummary`, `ExerciseDetailModal`, `ExercisePicker`).
**Justificativa:** evita modal/toast/lightbox em camada errada.
**Prioridade:** Média.

### VR-10 — Alvos de toque ≥ 44px
**Problema identificado:** `Button sm`=32px, `md`=40px; toggle de período em Analytics `py-1.5 text-[9px]`.
**Objetivo:** toque confiável no mobile.
**Instrução:** garantir `min-h-[44px]` e área tocável adequada em controles primários; o toggle de período de `AnalyticsDashboard.tsx` passa a `min-h-[44px] px-3 text-label`. `sm` reservado a ações densas secundárias.
**Justificativa:** WCAG 2.5.5 / HIG — alvos pequenos geram erro e frustração.
**Prioridade:** Alta.

### VR-11 — Liberar seleção de dados
**Problema identificado:** `user-select: none` global bloqueia copiar pesos/notas.
**Objetivo:** permitir copiar dados úteis.
**Instrução:** em `index.css`, manter `none` no chrome, adicionar utilitário `.select-text` e aplicar em texto de pesos, e1RM, notas e resultados.
**Justificativa:** num app de dados, copiar valores é tarefa real.
**Prioridade:** Média.

### VR-12 — Agrupamento por Gestalt & disclosure
**Problema identificado:** telas densas (Analytics, Mesocycle) com muitos blocos pequenos simultâneos.
**Objetivo:** reduzir carga cognitiva, aumentar foco.
**Instrução:** agrupar cards relacionados por proximidade + divisor sutil (`border-zinc-900`); mover detalhe secundário para drill-down/acordeão; garantir 1 ação primária por tela.
**Justificativa:** proximidade e disclosure progressivo reduzem ruído.
**Prioridade:** Média.

### VR-13 — Uso cirúrgico do acento
**Problema identificado:** lime usado em excesso dilui o foco.
**Objetivo:** uma ênfase por contexto.
**Instrução:** reservar `brand-primary` à ação/dado primário; estados neutros em `zinc`; `success/warning/danger` apenas para status. Auditar telas de alto tráfego.
**Justificativa:** hierarquia de cor cria foco.
**Prioridade:** Média.

### VR-14 — Primitivos de layout `<Page>`/`<Section>`
**Problema identificado:** cada tela reimplementa container/scroll/safe-area/ritmo.
**Objetivo:** consistência estrutural por construção.
**Instrução:** criar `src/components/ui/Page.tsx` (`flex flex-col h-full overflow-y-auto px-page pb-32 no-scrollbar scroll-smooth` + `pt-safe`) e `src/components/ui/Section.tsx` (título `text-h2` + `space-y-6`). Migrar as telas para usá-los.
**Justificativa:** elimina a origem das inconsistências de VR-03/04/06.
**Prioridade:** Alta.

### VR-15 — Governança anti-regressão
**Problema identificado:** nada impede reintroduzir valores mágicos.
**Objetivo:** travar o sistema.
**Instrução:** adicionar checagem de CI (`scripts/check-design.sh`) que falha em `text-\[[0-9]+px\]`, `z-\[[0-9]`, `(text|bg|border)-\[#`, e `<button ` fora de `src/components/ui/`. Adicionar checklist "DoD de design" ao template de PR. Atualizar `README`/`PRODUCT.md` para refletir tokens reais.
**Justificativa:** sem trava, as correções regridem.
**Prioridade:** Média.

### VR-16 — Modo de densidade (adicional)
**Problema identificado:** densidade universalmente apertada sem escolha.
**Objetivo:** conforto por padrão, compacto opcional.
**Instrução:** preferência em Settings (Confortável/Compacto) que ajusta tokens de espaçamento/altura via classe no `<html>`; default = Confortável.
**Justificativa:** respeita contexto (consulta vs registro rápido).
**Prioridade:** Baixa.

---

# ROTEIRO DE EXECUÇÃO

## FASE 1 — Correções Estruturais
> Arquitetura, grid, hierarquia e chrome. Maior impacto na experiência geral.
- **VR-03** Gutter único (`px-page`)
- **VR-04** Primitivo `AppHeader` + `pt-safe` consistente
- **VR-14** Primitivos `<Page>`/`<Section>`
- **VR-01** Eliminar texto < 10px
- **VR-07** `MotionConfig` global

## FASE 2 — Refinamento Visual
> Tipografia, espaçamento, cores, componentes, consistência.
- **VR-02** Adotar escala tipográfica (zerar `text-[px]`)
- **VR-06** Ritmo vertical 4pt
- **VR-05** Consolidar botões + estados
- **VR-09** Z-index semântico
- **VR-10** Alvos de toque ≥ 44px

## FASE 3 — Polimento Premium
> Eleva a percepção a padrão enterprise.
- **VR-08** Numerais tabulares
- **VR-13** Acento cirúrgico
- **VR-12** Gestalt & disclosure
- **VR-11** Seleção de dados
- Data-viz unificada (estilo de gráfico, eixos, mono)

## FASE 4 — Otimizações Avançadas
> Não obrigatórias, alto ganho percebido.
- **VR-16** Modo de densidade
- Header large-title colapsável (iOS/Arc)
- Sistema de elevação por shadow tokens
- **VR-15** Governança anti-regressão (rodar em "warning" cedo, "error" ao fim da Fase 2)

---

# PROMPT DE EXECUÇÃO

> Copie o bloco abaixo para a IA implementadora. Ele é autossuficiente.

```
CONTEXTO DO PROJETO
Você vai aprimorar o front-end do "Tive", um PWA mobile-first de treino de força (React 18 + TypeScript + Vite + Tailwind + Zustand + Framer Motion). Container de app: max-w-lg, dark mode, navegação por abas inferior. Já existe um design system de tokens em tailwind.config.js (cores zinc + brand lime #bef264; fontSize semântico caption-xs/caption/label/body/h1-h3; spacing card/section/page; borderRadius control/card/sheet; zIndex base→debug; boxShadow card/card-hover/nav) e componentes ui/Button, ui/IconButton, ui/EmptyState, hook useMotion, useFocusTrap. O problema NÃO é falta de sistema — é adoção inconsistente.

OBJETIVO
Elevar a qualidade visual e a usabilidade mobile a padrão premium (referências: Linear, Stripe, Apple, Vercel, Bloomberg) SEM reescrever features, apenas fazendo o design system existente ser obedecido em todas as telas.

MUDANÇAS A EXECUTAR (em ordem de fase)
FASE 1 (estrutural):
1. Padronizar o inset horizontal de TODAS as telas para o token px-page (20px); remover px-4/px-5/px-6 de nível de página. Não tocar no padding interno de cards.
2. Criar ui/AppHeader.tsx (frosted fixo: shrink-0 px-page pt-safe pb-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-sticky, slot de título text-h1 + slot de ações) e refatorar DashboardHeader, HistoryHeader, PlanHeader e headers de Analytics/Settings/Photos para usá-lo, garantindo pt-safe em todas.
3. Criar ui/Page.tsx (flex flex-col h-full overflow-y-auto px-page pt-safe pb-32 no-scrollbar scroll-smooth) e ui/Section.tsx (título text-h2 + space-y-6); migrar as telas.
4. Substituir TODO text-[8px]→text-caption-xs e text-[9px]→text-caption (controles interativos→text-label). Zero texto abaixo de 11px em conteúdo.
5. Em main.tsx, envolver <App/> com <MotionConfig reducedMotion="user"> (de framer-motion).

FASE 2 (refino):
6. Zerar text-[Npx]: migrar para a escala (10→caption-xs, 11→caption, 12→label, 13→body-sm, 14→body, 16→body-lg, títulos→h3/h2/h1). Alvo: grep "text-\[[0-9]+px\]" = 0.
7. Padronizar ritmo vertical na escala 4pt: seções space-y-6, grupos gap-4, itens gap-2/3; Dashboard space-y-8→space-y-6.
8. Substituir <button> crus por <Button>/<IconButton>; criar utilitário .tap (focus-visible:ring-2 ring-brand-primary active:scale-[0.98]) para áreas clicáveis grandes; remover .btn-primary; ações primárias min-h-[44px].
9. Remapear z-[N] para z-modal/z-overlay/z-toast preservando a ordem local.
10. Garantir alvos de toque ≥ 44px (ex.: toggle de período do AnalyticsDashboard → min-h-[44px] px-3 text-label).

FASE 3 (premium):
11. Adicionar utilitário .tabular (font-variant-numeric: tabular-nums) e aplicar em métricas/timers/e1RM.
12. Reservar brand-primary à ação/dado primário (uma ênfase por tela); neutros em zinc; semânticos só para status.
13. Agrupar cards por proximidade + divisor sutil; mover detalhe secundário para drill-down; 1 ação primária por tela.
14. Liberar seleção (.select-text) em pesos/e1RM/notas.

REGRAS OBRIGATÓRIAS
- Use SEMPRE tokens; nunca valores literais (sem text-[px], z-[N], hex arbitrário, raio literal).
- Toda ação via <Button>/<IconButton> com foco-visível; alvo ≥ 44px em ações primárias.
- Toda animação respeita prefers-reduced-motion.
- Todo texto via i18n t() (en + pt-BR); manter parity.test.ts verde.
- Não introduzir dependências novas. Não alterar lógica de negócio/stores.

RESTRIÇÕES
- Não redesenhar features nem mudar fluxos; mudança é puramente visual/estrutural.
- Não alterar a paleta (lime/zinc) nem trocar fontes.
- Mudanças pequenas e revisáveis, uma fase por vez.

CRITÉRIOS DE QUALIDADE (Definition of Done)
- npm run build e npm run test verdes; parity.test.ts verde.
- grep -rEo "text-\[[0-9]+px\]" src = 0; grep -rEo "z-\[[0-9]+\]" src = 0.
- Nenhum texto < 11px em conteúdo; contraste mantém WCAG AA.
- Gutter de página idêntico em todas as telas; headers consistentes com pt-safe.
- Testado em viewport mobile (max-w-lg) e nos dois idiomas; reduced-motion respeitado.

RESULTADO ESPERADO
Um app que transmite sofisticação, clareza, profissionalismo e confiabilidade no mobile: chrome de app único e estável, hierarquia tipográfica legível, ritmo de 4pt, números em mono tabular, acento usado com parcimônia e movimento contido — sem qualquer regressão funcional.
```

---

## Apêndice — métricas (medidas, base desta análise)
```
text-[8px]:  32      text-[9px]: 102     text-[Npx] total: 356
<Button>: 5          <button> cru: 36    framer-motion: 64 arq · useMotion: 3
z-[N] literais: 25   px-page usado: 0    gutter: px-4(50) px-5(28) px-6(25)
Contraste AA: zinc-500 6.91:1 · zinc-600 5.33:1 (passam)
```
