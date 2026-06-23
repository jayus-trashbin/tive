# TIVE — Plano de Execução: Produto & UX (2026)

> Documento operacional. Transforma o `IMPROVEMENTS-PRODUCT-UX-2026.md` em **tickets executáveis**: objetivo, arquivos, passos, critérios de aceite e dependências por item.
> Cada ticket foi escrito contra o código atual — os símbolos citados (`useTranslation`, `TabId`, `calculateHybrid1RM`, `saveRoutine`, `service-worker.js`) existem e foram verificados.

**Como usar:** execute na ordem das fases. Cada ticket é fechável de forma independente, com seu próprio PR. Não inicie um ticket sem checar a seção *Dependências*.

---

## Padrões globais (válidos para todos os tickets)

**Branch & PR**
- Uma branch por ticket: `feat/<id>-slug` (ex.: `feat/a01-onboarding-i18n`).
- PR pequeno e focado; descrição linka o ticket e os critérios de aceite.

**Definition of Done (DoD) — todo ticket precisa passar:**
1. `npm run build` (roda `tsc && vite build`) sem erros.
2. `npm run test` verde — em especial `src/i18n/__tests__/parity.test.ts` quando houver mudança de i18n.
3. Sem strings novas hardcoded em telas tocadas (tudo via `t()`).
4. Testado manualmente em viewport mobile (`max-w-lg`) **e** com idioma trocado entre `en` e `pt-BR` no Settings.
5. Sem novos `any`/`@ts-ignore` introduzidos.

**Convenções de prioridade/esforço:** iguais ao roadmap (`P0–P3`, `XS/S/M/L/XL`).

**Padrões de código já existentes que os tickets reaproveitam:**
- i18n: `const { t } = useTranslation();` → `t('secao.chave', { var })`. Chaves novas vão em `src/i18n/en.ts` (fonte dos tipos) **e** `src/i18n/pt-BR.ts`.
- Navegação: abas em `src/components/Layout.tsx` (array `tabs`), tipo `TabId` em `src/types/index.ts`, ordem/render em `src/App.tsx` (`TAB_ORDER` + bloco de views).
- Store: rotinas via `saveRoutine(routine)` em `src/store/slices/createRoutineSlice.ts`. IDs com `crypto.randomUUID()`.
- Feedback: `useUIStore.addNotification(msg, type)`, `useHaptic`, `audio`.

---

## SPRINT 0 — Fundações compartilhadas (fazer antes da Fase 1)

> Pequenos investimentos que vários tickets reutilizam. ~1 dia no total.

### S0-1 `[XS]` — Decisão de IA de navegação (destrava B-01/B-02/B-03/B-04)
Antes de mexer na navegação item a item, decidir o modelo final para evitar retrabalho. **Recomendação:** abas `Home · Rotinas · Lab · Histórico` + um hub **"Mais"** (acessível pelo `DashboardHeader`) contendo Fotos, Mesociclo, Social, Biblioteca e Settings.
- **Entregável:** um diagrama/descrição curta aprovada (pode ser um comentário no PR ou seção neste doc).
- **Critério de aceite:** time alinhado sobre onde cada superfície mora antes de codar B-*.

### S0-2 `[S]` — Util de telemetria de UX (opcional, recomendado)
Criar `src/utils/track.ts` com `track(event, props?)` — por ora só `logger.info` (sem backend), para marcar pontos-chave (onboarding concluído, treino iniciado/finalizado, template aplicado, permissão de notificação). Permite medir o impacto das próximas mudanças.
- **Arquivos:** novo `src/utils/track.ts`.
- **Critério de aceite:** função tipada disponível; chamada em ao menos 1 ponto (fim do onboarding).

### S0-3 `[XS]` — Seção `onboarding` no i18n (pré-requisito de A-01)
Criar a sub-árvore `onboarding` vazia/estruturada em `en.ts` e `pt-BR.ts` para A-01 preencher. (Detalhe no A-01.)

---

## FASE 1 — Corrigir o primeiro contato e expor o que já existe

### A-01 `[P0][S]` — Traduzir o onboarding via i18n
**Objetivo:** o `WelcomeModal` deixa de ter texto fixo em inglês e passa a respeitar o idioma do app (que já é `pt-BR` por padrão para usuários BR via `detectDefaultLanguage()`).

**Arquivos:** `src/components/WelcomeModal.tsx`, `src/i18n/en.ts`, `src/i18n/pt-BR.ts`.

**Strings a migrar (já levantadas no código):**
- Passo 1: "Who are you", "Let's set up your core identity.", placeholder "Your Name", label/aria "Bodyweight…".
- Passo 2: "Experience Level", "This calibrates your optimal training volume.", níveis Beginner/Intermediate/Advanced + descrições ("0-1 years lifting…") + "Low/Moderate/High Volume".
- Passo 3: "Main Goal", "What are we optimizing for?", "Strength", "Hypertrophy", "Units", "Theme".
- Tela final: "Analyzing Profile…", "Building your optimal starting routine.", "Ready to Lift", "We created a starter routine tailored to your level.".
- Nomes de rotina gerada ("Foundation Strength" etc.) — mover para chaves também.

**Passos:**
1. Adicionar bloco `onboarding: { … }` em `en.ts` com todas as chaves acima (usar subgrupos: `onboarding.step1`, `onboarding.levels.beginner`, `onboarding.generating`, `onboarding.ready`).
2. Replicar a mesma árvore em `pt-BR.ts` com as traduções.
3. Em `WelcomeModal.tsx`: `const { t } = useTranslation();` e trocar cada literal por `t('onboarding.…')`. Interpolar onde houver variável (ex.: nível).
4. Conferir o passo de geração de rotina: os nomes vêm de chaves, não de literais concatenados.

**Critérios de aceite:**
- Com `pt-BR`, nenhum texto em inglês aparece no fluxo de boas-vindas (4 passos + tela final).
- `parity.test.ts` continua verde (chaves iguais em en/pt-BR).
- Trocar para `en` no Settings reverte tudo para inglês.

**Dependências:** S0-3. **Risco:** baixo.

---

### B-02 `[P1][S]` — Ligar a Biblioteca de Exercícios à navegação
**Objetivo:** dar uma superfície navegável para `ExerciseLibrary` (hoje órfã) — explorar catálogo, ver mídia/anatomia/histórico por exercício.

**Arquivos:** `src/components/exercise/ExerciseLibrary.tsx` (já existe; props `{ onSelect }`), ponto de montagem (hub "Mais" do S0-1 ou entrada no Dashboard), `src/i18n/*`.

**Passos:**
1. Definir o ponto de entrada conforme S0-1 (recomendado: item "Biblioteca" no hub "Mais"; alternativa rápida: card no Dashboard).
2. Montar `ExerciseLibrary` em modo "navegação" — quando aberta fora do fluxo de seleção, o toque num card abre `ExerciseDetailModal` (já usado por `TopExercises`/`RoutinePreviewScreen`) em vez de selecionar.
3. Garantir busca/filtragem por grupo muscular (já presente no componente) e estado vazio com `EmptyState`.
4. Rótulos via i18n.

**Critérios de aceite:**
- Existe um caminho de ≤ 2 toques a partir da home até "explorar exercícios".
- Abrir um exercício mostra detalhe (guia/anatomia/histórico) sem entrar em modo de montagem de rotina.

**Dependências:** S0-1. **Risco:** baixo (componente pronto).

---

### C-01 `[P1][S]` — e1RM ao vivo no logging
**Objetivo:** mostrar o 1RM estimado por set durante a digitação, não só no `PRCelebration`.

**Arquivos:** `src/components/active-session/SetRow.tsx`, usa `calculateHybrid1RM(weight, reps, rpe)` de `src/utils/formulas.ts`.

**Passos:**
1. Em `SetRow`, calcular `const e1rm = useMemo(() => (set.weight > 0 && set.reps > 0) ? calculateHybrid1RM(set.weight, set.reps, set.rpe || 10) : null, [set.weight, set.reps, set.rpe])`.
2. Renderizar discretamente (fonte mono, `text-zinc-500`, próximo ao set) — só quando `e1rm` e não for warm-up.
3. Atualiza ao vivo conforme peso/reps/RPE mudam.

**Critérios de aceite:**
- Digitar peso e reps mostra o e1RM imediatamente; limpar campos esconde.
- Sets de warm-up não exibem e1RM.
- Sem layout shift perceptível.

**Dependências:** nenhuma. **Risco:** baixo.

---

### B-01 `[P1][M]` — Promover o Analytics ("Lab") a destino próprio
**Objetivo:** tirar o `AnalyticsDashboard` de dentro do toggle de `HistoryLog` e dar uma entrada de primeira classe.

**Arquivos:** `src/types/index.ts` (`TabId`), `src/components/Layout.tsx` (`tabs`), `src/App.tsx` (`TAB_ORDER` + render de views), `src/components/HistoryLog.tsx` (manter toggle como atalho), `src/i18n/*`.

**Passos:**
1. Decidido em S0-1: adicionar `'analytics'` ao `TabId` e à array `tabs` (ícone Lucide, ex.: `BarChart3`/`Activity`, label `t('tabs.lab')`).
2. Em `App.tsx`: incluir em `TAB_ORDER` e renderizar `<AnalyticsDashboard />` (já lazy-loaded) no bloco de views; ajustar o índice das demais abas para a transição direcional.
3. Manter o `viewMode` em `HistoryLog` como atalho secundário (não remover) ou substituí-lo por um link "ver no Lab" — decisão de S0-1.
4. Se a barra ficar com 5 itens, validar espaçamento mobile; se preferir 4 + hub, colocar Fotos no hub "Mais".

**Critérios de aceite:**
- Analytics acessível em 1 toque pela barra.
- Transições de aba continuam suaves (direção correta).
- Nada de regressão no toggle do Histórico.

**Dependências:** S0-1. **Risco:** médio (mexe na IA central).

---

### A-02 `[P1][S]` — Auditar strings hardcoded fora do i18n
**Objetivo:** garantir cobertura total de i18n nas telas voltadas ao usuário.

**Arquivos:** varredura em `src/components/**`, dicionários em `src/i18n/*`.

**Passos:**
1. Rodar varredura por literais em JSX (`>Texto<`, `placeholder=`, `aria-label=` com texto humano) priorizando telas recentes (onboarding já coberto por A-01, mesociclo, social, pré-treino).
2. Mover achados para `en.ts`/`pt-BR.ts`; substituir por `t()`.
3. (Opcional) adicionar teste/lint simples que falhe ao encontrar literais suspeitos em arquivos-alvo.

**Critérios de aceite:**
- Trocando o idioma, telas auditadas não exibem texto no idioma anterior.
- `parity.test.ts` verde.

**Dependências:** idealmente após A-01. **Risco:** baixo.

---

## FASE 2 — Retenção, ativação e descoberta

### E-01 `[P1][M]` — Lembretes de treino (notificações locais)
**Objetivo:** primeiro gancho de retorno. Como o app é local-first (sem backend dedicado), o MVP usa **notificações locais** via Notifications API + service worker, não web push com servidor.

**Arquivos:** `public/service-worker.js`, `src/main.tsx` (registro do SW), `src/components/Settings.tsx` (config de horário/dias), novo `src/utils/reminders.ts`, `src/i18n/*`.

**Passos:**
1. **Permissão no momento certo:** pedir `Notification.requestPermission()` **após a 1ª sessão concluída** (não no onboarding). Guardar estado.
2. **Config:** em Settings, seção "Lembretes" — toggle + dias da semana + horário. Persistir no store (`userStats`).
3. **Disparo (MVP pragmático):**
   - Caminho A (suportado amplamente): agendar verificação enquanto app/SW ativo e usar `registration.showNotification(...)`.
   - Caminho B (onde houver suporte): `Periodic Background Sync` para checar e notificar com app fechado; tratar como *progressive enhancement*.
4. **SW:** adicionar handlers `notificationclick` (focar/abrir o app, deep-link `/?action=start-workout` que o `App.tsx` já trata) e `push` (preparado para futuro).
5. Textos via i18n.

**Critérios de aceite:**
- Usuário ativa lembrete em Settings, escolhe dia/horário e recebe notificação local; clicar abre o app pronto para treinar.
- Sem permissão, a feature degrada graciosamente (sem erros).
- Permissão nunca é pedida no onboarding.

**Dependências:** nenhuma técnica; alinhar com E-02. **Risco:** médio (variação de suporte por navegador — documentar limitações).

---

### F-01 `[P1][M]` — Biblioteca de programas/templates prontos
**Objetivo:** derrubar o time-to-first-workout com programas curados aplicáveis em 1 toque.

**Arquivos:** novo `src/data/routineTemplates.ts`, nova UI (ex.: `src/components/plan-manager/TemplateGallery.tsx`), store `saveRoutine` em `createRoutineSlice.ts`, `src/i18n/*`.

**Passos:**
1. Definir 4–6 templates como dados tipados (`Routine` sem id): Full-Body 3x, Upper/Lower 4x, PPL 6x, 5/3/1, Starting Strength. Referenciar exercícios por id do catálogo (fallback para `custom-placeholder`, padrão já usado pelo `AIService`).
2. UI de galeria no `PlanManager` (entrada clara, ver B-04): card por template com resumo (dias, foco, volume).
3. "Usar template" → **deep clone** + `crypto.randomUUID()` em ids da rotina/blocos/sets → `saveRoutine(clone)` → abrir no editor (`RoutineEditor`) para ajuste.
4. Textos via i18n; templates podem ter nome/descrição localizados.

**Critérios de aceite:**
- A partir de "sem rotinas", o usuário cria uma rotina utilizável em ≤ 2 toques.
- A rotina aplicada é independente (editar não afeta o template).
- Funciona sem chave de IA.

**Dependências:** alimenta A-03 e D-02. **Risco:** baixo-médio (curadoria dos dados).

---

### B-03 `[P2][M]` — Revisar a hierarquia de navegação (implementar o hub "Mais")
**Objetivo:** materializar a IA decidida em S0-1.

**Arquivos:** `src/components/Layout.tsx`, `src/components/dashboard/DashboardHeader.tsx` (ou onde morar a entrada do hub), novo `src/components/ui/MoreHub.tsx`, `src/App.tsx`, `src/store/useUIStore.ts` (estado de abertura), `src/i18n/*`.

**Passos:**
1. Criar `MoreHub` (overlay no padrão do Settings, que já usa `isSettingsOpen`/slide-up) listando Fotos, Mesociclo, Social, Biblioteca, Settings.
2. Adicionar gatilho (ícone) e estado no `useUIStore`.
3. Reordenar a barra para o conjunto final (Home · Rotinas · Lab · Histórico).
4. Garantir que deep-links/`?view=` do `App.tsx` continuem válidos.

**Critérios de aceite:**
- Todas as superfícies acessíveis em ≤ 2 toques.
- Nenhuma feature existente fica inacessível.

**Dependências:** S0-1, idealmente após B-01/B-02. **Risco:** médio.

---

### A-03 `[P2][M]` — Onboarding que gera rotina realista
**Objetivo:** coletar dias/semana e equipamento e produzir um primeiro plano que reflita a realidade.

**Arquivos:** `src/components/WelcomeModal.tsx`, `src/data/routineTemplates.ts` (de F-01), opcional `src/services/AIService.ts`, `src/i18n/*`.

**Passos:**
1. Adicionar passo "Disponibilidade" (dias/semana: 3/4/5/6) e "Equipamento" (academia / halteres / casa).
2. Mapear (dias × objetivo × equipamento) → template do F-01 (preferir mapa local; IA como reforço se houver chave).
3. Gerar via clone do template (mesmo caminho do F-01) em vez do nome genérico atual.
4. Textos via i18n (continuação de A-01).

**Critérios de aceite:**
- A rotina inicial reflete os dias/equipamento escolhidos.
- Sem chave de IA, o onboarding ainda entrega rotina utilizável.

**Dependências:** F-01, A-01. **Risco:** médio.

---

### D-01 `[P2][M]` — Insights acionáveis
**Objetivo:** cada insight leva a uma ação direta.

**Arquivos:** `src/components/dashboard/CoachCard.tsx`, `src/components/analytics/InsightsPanel.tsx`, `src/components/analytics/ACWRCard.tsx`, `src/hooks/useCoachInsight.ts`.

**Passos:**
1. Estender o modelo de insight com um campo opcional de ação (`{ label, onAction }` ou um enum de ação resolvido na UI).
2. Mapear ações: "volume de pull baixo" → abrir rotina/exercício sugerido; "ACWR alto" → sugerir deload (engine `periodization.ts` já existe).
3. Renderizar botão de ação nos cards; haptic ao acionar.

**Critérios de aceite:**
- Ao menos 3 tipos de insight têm CTA funcional que muda o estado do app (abre tela/aplica sugestão).

**Dependências:** B-01/B-02 (alvos das ações). **Risco:** médio.

---

## FASE 3 — Profundidade e polimento

### C-02 `[P2][S]` — Delta por set vs. sessão anterior
**Arquivos:** `src/components/active-session/SetRow.tsx` (tem `previousSet`).
**Passos:** ao completar set, comparar com `previousSet` e mostrar micro-badge (`+2.5kg` / `=`); reaproveitar `useHaptic`.
**Aceite:** badge correto para superou/igualou/abaixo; some quando não há set anterior.

### C-03 `[P2][M]` — Modo de logging "academia" (toque grande)
**Arquivos:** `SetRow.tsx`, `WorkoutPlayer.tsx`, Settings (toggle), i18n.
**Passos:** variante de input com steppers +/- grandes, `inputmode="decimal"`, avanço automático de foco; ativável em Settings.
**Aceite:** alvos ≥ 44px; logar um set sem teclado externo em poucos toques.

### C-04 `[P3][M]` — Aquecimento assistido
**Arquivos:** `WorkoutPlayer.tsx`/`ExerciseGroup.tsx`, `PlateCalculator`, `formulas.ts`.
**Passos:** botão "gerar aquecimento" cria sets `warmup` em rampas (% do peso-alvo) usando o tipo de set já existente.
**Aceite:** rampas plausíveis inseridas como warm-up, editáveis.

### D-02 `[P2][S]` — IA atualizada + fallback
**Arquivos:** `src/services/AIService.ts` (model `gemini-1.5-flash`), integra F-01.
**Passos:** atualizar para modelo Gemini atual; sem chave, oferecer templates (F-01) em vez de mensagem de erro.
**Aceite:** sem chave, o builder ainda entrega caminho útil; com chave, geração funciona no modelo novo.

### D-03 `[P3][M]` — Explicabilidade dos scores
**Arquivos:** `MuscleReadiness`, `ACWRCard`, i18n.
**Passos:** tooltips/"saiba mais" curtos (MEV/MAV/MRV, ACWR).
**Aceite:** cada score tem explicação acessível por toque.

### E-02 `[P2][S]` — Recap semanal
**Arquivos:** novo card/tela usando `utils/analytics.ts` + `ConsistencyCard`; opcional push (E-01).
**Aceite:** recap mostra volume, PRs e consistência da semana.

### E-03 `[P2][M]` — Metas e marcos
**Arquivos:** store (`userStats`/novo slice), `PRCelebration` (reaproveitar visual), Dashboard.
**Aceite:** usuário define meta; marcos disparam celebração.

### E-04 `[P3][M]` — Social fora do dispositivo
**Arquivos:** `social/PRShareCard.tsx`, Web Share API.
**Aceite:** exportar PR/treino como imagem e compartilhar via share sheet.

### B-04 `[P2][S]` — Descoberta de Mesociclo e Social
**Arquivos:** `PlanManager.tsx`, `Dashboard.tsx`, hub de B-03.
**Aceite:** entradas rotuladas e visíveis para ambos.

### G-01 `[P2][M]` — Auditoria de acessibilidade (WCAG AA)
**Arquivos:** `tailwind.config.js`, componentes com `text-zinc-500/600`.
**Passos:** checar contraste, alvos ≥ 44px, foco visível; corrigir tokens. (Pode usar o skill de accessibility-review.)
**Aceite:** contrastes de texto passam AA; foco visível em navegação por teclado.

### G-02 `[P2][S]` — Respeitar `prefers-reduced-motion`
**Arquivos:** `src/main.tsx` (envolver com `<MotionConfig reducedMotion="user">`) e/ou `useReducedMotion` nos componentes com animação pesada; `src/index.css`.
**Aceite:** com "reduzir movimento" no SO, transições de aba/splash/overlays são atenuadas/desligadas.

### G-03 `[P3][S]` — Estados vazios e de erro
**Arquivos:** `ui/EmptyState.tsx`, telas sem rotina/histórico/fotos, i18n.
**Aceite:** cada estado vazio tem CTA claro e localizado.

### F-02 `[P2][L]` — Importar Apple Health / Google Fit
**Arquivos:** novo serviço de import; Settings.
**Aceite:** importar peso corporal (mín.) de uma fonte; tratado como progressive enhancement.

### F-03 `[P3][M]` — Compartilhar/exportar rotina
**Arquivos:** `utils/exportImport.ts` (base existente), `PlanManager`.
**Aceite:** exportar rotina como arquivo/deep link e reimportar.

---

## Sequenciamento e dependências (resumo)

```
SPRINT 0:  S0-1 (IA nav) ── S0-2 (track) ── S0-3 (i18n onboarding)
                │
FASE 1:   A-01 ─ B-02 ─ C-01 ─ B-01 ─ A-02      (S0-1 destrava B-01/B-02; S0-3 destrava A-01)
                │
FASE 2:   E-01 ─ F-01 ─ B-03 ─ A-03 ─ D-01      (F-01 → A-03 e D-02; B-01/B-02 → D-01)
                │
FASE 3:   C-02/03/04 · D-02/03 · E-02/03/04 · B-04 · G-01/02/03 · F-02/03
```

**Caminho crítico de valor:** A-01 (primeiro contato) → B-01/B-02 (descoberta) → E-01 + F-01 (retenção + ativação). Entregar esses cinco já muda a curva de ativação/retenção.

---

## Marcos de validação (gates entre fases)

- **Fim da Fase 1:** novo usuário BR faz onboarding 100% em pt-BR, acha Analytics e a Biblioteca pela navegação, e vê e1RM ao logar. — *Critério de avanço para a Fase 2.*
- **Fim da Fase 2:** novo usuário sai do zero a um treino com template em ≤ 2 toques e pode ativar lembrete após o 1º treino. — *Critério de avanço para a Fase 3.*
- **Fim da Fase 3:** auditoria de acessibilidade AA passando e nenhuma string hardcoded em telas-alvo.

---

*Estimativa agregada (ordem de grandeza): Sprint 0 ~1 dia · Fase 1 ~1–1,5 semana · Fase 2 ~2–3 semanas · Fase 3 contínua. Esforços por ticket no cabeçalho de cada item.*
