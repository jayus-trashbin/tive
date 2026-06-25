# TIVE — Plano de Ajustes Mobile (Estado Atual, 2026)

> Plano **re-medido no código de hoje** (23/06/2026). Diferente dos documentos anteriores, este reflete o que já foi corrigido e foca **apenas no que falta** para um bom uso mobile.

---

## Estado atual — o que JÁ foi resolvido ✅

A auditoria foi em grande parte implementada desde as primeiras análises. Confirmado por medição:

| Item | Antes | Agora |
|---|---|---|
| Texto < 10px (`text-[8px]/[9px]`) | 134 | **0** ✅ |
| `text-[Npx]` ad-hoc total | 356 | **0** ✅ |
| `z-[N]` literais | 25 | **1** ✅ |
| `AppHeader` unificado | não existia | **6 telas** ✅ |
| `MotionConfig reducedMotion` | ausente | **aplicado** ✅ |
| Zoom (viewport `user-scalable=no`) | bloqueado | **reabilitado** ✅ |
| Voltar do Android (`useBackDismiss`) | inexistente | **hook criado + usado em `ui/Modal` e WorkoutPlayer** ✅ |
| Primitivo de modal acessível | não existia | **`ui/Modal.tsx` criado** ✅ |
| Splash screens iOS | ausente | **4 referências adicionadas** ✅ |
| Banner offline | ausente | **presente no `Layout`** ✅ |

Ou seja: tipografia, hierarquia de header, motion, z-index, zoom e navegação por "voltar" estão essencialmente **prontos**. O plano abaixo é o que resta.

---

## Pendências — plano de ajustes por fase

Legenda: 🔴 Crítico mobile · 🟠 Alto · 🟡 Médio · 🟢 Baixo.

---

### FASE 1 — Layout mobile visível (corrige o que você relatou)

#### AJ-01 🟠 Nav inferior com 6 itens (apertada)
- **Onde:** `src/components/Layout.tsx:32-38` (5 abas) + `MoreTab` = **6 itens** (Início · Rotinas · Lab · Biblioteca · Histórico · Mais).
- **Problema:** em ~360px cada item fica com ~60px; rótulos PT-BR ("Biblioteca", "Histórico") quase se tocam; botões `flex-1` sem espaçamento → toques errados. Material/HIG recomendam **máx. 5**.
- **Instrução:** remover a aba `library` da array `tabs` e adicioná-la ao sheet "Mais" (`MoreTab`), junto de Fotos e Settings. Nav final: Início · Rotinas · Lab · Histórico · Mais (5 itens). A Biblioteca continua acessível em 2 toques.
- **Esforço:** XS.

#### AJ-02 🔴 Grade semanal do Mesociclo sai da tela
- **Onde:** `src/components/mesocycle/MesocyclePlanner.tsx:634` (`grid grid-cols-7 gap-1 p-2`) + `DroppableDay` com `min-w-[40px]` (linha 87).
- **Problema:** 7×40px + gaps + padding ≈ 320px fixos, **sem** wrapper de scroll → em telas ≤ 360px o 7º dia é cortado pelo `overflow-hidden` do app.
- **Instrução (escolher uma):** (a) trocar `min-w-[40px]`→`min-w-0` nas células e reduzir `gap-1` se preciso, deixando a grade encolher; **ou** (b) envolver a grade em `div className="overflow-x-auto no-scrollbar"` com largura mínima interna. Preferir (a) para evitar scroll dentro de scroll.
- **Esforço:** XS.

#### AJ-03 🟡 Gutter de página ainda com exceções
- **Onde:** Dashboard e Settings usam `px-page` (20px) ✅; mas há ~49 `px-4` e o root de algumas telas (ex.: AnalyticsDashboard) ainda não usa `px-page`.
- **Problema:** a borda do conteúdo ainda "pula" levemente entre algumas abas.
- **Instrução:** padronizar o **inset de página** (container raiz de cada tela) para `px-page`; manter `px-3/px-4` apenas em padding interno de componentes. Verificar `AnalyticsDashboard`, `HistoryLog`, `ProgressPhotos`.
- **Esforço:** S.

#### AJ-04 🟢 Verificar `CalendarModal` em 320px
- **Onde:** `src/components/history/CalendarModal.tsx:91,97` (`grid-cols-7 gap-2`).
- **Instrução:** testar no iPhone SE (320px); se as células não encolherem, aplicar o mesmo tratamento do AJ-02.
- **Esforço:** XS.

---

### FASE 2 — Acessibilidade & robustez

#### AJ-05 🟠 Migrar overlays para o primitivo `ui/Modal`
- **Onde:** existem **28** componentes de modal/sheet/overlay, mas só **3** usam `useFocusTrap` e **2** têm `role="dialog"`. O primitivo `ui/Modal.tsx` (com foco-trap + back-dismiss) já existe — falta adotá-lo.
- **Problema:** a maioria dos modais ainda não prende o foco nem se anuncia como diálogo → ruim para teclado/leitor de tela; e só fecham no "voltar" os que passam pelo `ui/Modal`.
- **Instrução:** refatorar os modais restantes (ExercisePicker, ExerciseDetailModal, CreateExerciseModal, SessionDetailsModal, PhotoGallery lightbox, RoutineImporter, etc.) para usar `ui/Modal`. Priorizar os de uso frequente.
- **Esforço:** M.

#### AJ-06 🟡 Concluir o prompt de atualização do PWA
- **Onde:** `public/service-worker.js:44` já trata `SKIP_WAITING`, mas `src/main.tsx:26-28` apenas registra o SW — **não detecta** nova versão nem avisa o usuário.
- **Problema:** o mecanismo existe, mas nada o dispara; usuário continua em versão antiga.
- **Instrução:** em `main.tsx`, escutar `registration.updatefound`/`registration.waiting`; ao haver `waiting`, mostrar toast "Nova versão disponível — recarregar"; no clique, `waiting.postMessage('SKIP_WAITING')` e recarregar no evento `controllerchange`.
- **Esforço:** S.

#### AJ-07 🟡 Live regions para timer e PR
- **Onde:** 4 `aria-live` hoje. **Instrução:** garantir `aria-live="polite"` no timer de descanso e na conclusão de set, e `assertive` no `PRCelebration`.
- **Esforço:** S.

---

### FASE 3 — Consistência & performance visual

#### AJ-08 🟡 Consolidar botões crus
- **Onde:** **35** `<button>` crus vs 6 `<Button>`.
- **Problema:** estados de foco/hover/disabled e alvo de toque inconsistentes.
- **Instrução:** trocar `<button>` de ação por `<Button>`/`<IconButton>`; para áreas clicáveis grandes, usar a classe `.tap` (já existe no projeto). Priorizar telas de alto tráfego (WorkoutPlayer, Dashboard).
- **Esforço:** M.

#### AJ-09 🟠 Imagens sem dimensão (CLS)
- **Onde:** **14** `<img>`, **0** com `width`/`height`/`aspect-ratio` (inclui mídia de exercício, `ui/ImageWithFallback`).
- **Problema:** salto de layout ao carregar GIFs/imagens — jank perceptível no mobile.
- **Instrução:** definir `width`/`height` ou `aspect-ratio` (ex.: `aspect-square`) em todo `<img>`; manter `loading="lazy"`.
- **Esforço:** S.

---

### FASE 4 — Avançado (opcional)

#### AJ-10 🟢 Telas largas / paisagem
- **Onde:** `Layout.tsx` `max-w-lg md:max-w-2xl`; `manifest.json` `orientation: portrait`.
- **Instrução:** decidir conscientemente — em tablet/`md`, usar 2 colunas no Dashboard/Analytics para preencher o espaço; ou documentar o foco em phone-retrato. 
- **Esforço:** M.

#### AJ-11 🟢 Modo de densidade
- **Instrução:** preferência Confortável/Compacto em Settings ajustando tokens de espaçamento via classe no `<html>`; default Confortável.
- **Esforço:** M.

---

## Sequência sugerida & esforço

| Fase | Itens | Esforço |
|---|---|---|
| **1 — Layout visível** | AJ-01, AJ-02, AJ-03, AJ-04 | ~meio dia |
| **2 — A11y & robustez** | AJ-05, AJ-06, AJ-07 | ~1–2 dias |
| **3 — Consistência** | AJ-08, AJ-09 | ~1 dia |
| **4 — Avançado** | AJ-10, AJ-11 | opcional |

**Comece pela Fase 1** — resolve exatamente o que você viu (nav apertada + elementos cortados) com mudanças de minutos e baixo risco.

## Definition of Done (cada ajuste)
1. `npm run build` + `npm run test` verdes (`parity.test.ts` incluído).
2. Testado em viewport pequeno (320–360px), médio e nos 2 idiomas.
3. Sem overflow horizontal cortado; alvos de toque ≥ 44px; foco-visível presente.
4. Sem valores mágicos novos (`text-[px]`, `z-[N]`, hex).

---

## Apêndice — medições de hoje
```
text-[8px]:0  text-[9px]:0  text-[Npx]:0      z-[N]:1      px-page adotado:10
<Button>:6   <button> cru:35                  AppHeader:6 telas   MotionConfig:✅
useBackDismiss: ui/Modal + WorkoutPlayer       useFocusTrap:3 / 28 overlays
aria-live:4   <img> c/ dimensão:0/14          viewport user-scalable=no:0 (ok)
nav: 5 abas + Mais = 6 itens                   mesocycle grid-cols-7 + min-w-[40px] (sem scroll)
SW: trata SKIP_WAITING ✅ · main.tsx não dispara update ⚠️ · splash iOS:✅
```
