# TIVE — Plano de Execução de Design & UX/UI por Fases (2026)

> Companheiro operacional do `DESIGN-UX-UI-GUIDELINES-2026.md`. Transforma as fases D1–D4 em **tickets executáveis** (objetivo, arquivos, passos, antes/depois, critérios de aceite, dependências).
> Aplica os princípios dos workflows `/design-taste-frontend`, `/frontend-design`, `/impeccable`, `/ui-ux-pro-max` e os frameworks `/design-critique` + `/design-system`.

**Data:** 23/06/2026 · **Escopo:** adoção e governança do design system (não cria features de produto — isso está em `EXECUTION-PLAN-PRODUCT-UX-2026.md`).

---

## Snapshot de auditoria (formato /design-system)

**Score do sistema: 72/100** — fundação excelente, adoção irregular.

### Cobertura de tokens
| Categoria | Definidos | Valores hardcoded encontrados |
|---|---|---|
| Cores | ✅ escala `zinc` + `brand` | **0** hex arbitrário · **0** `slate-*` |
| Tipografia | ✅ `caption-xs → h1` | 🔴 **356** `text-[Npx]` |
| Espaçamento | ✅ `card/section/page` | poucos ad-hoc (não bloqueante) |
| Raio | ✅ `control/card/sheet` | **1** `rounded-[Npx]` |
| Z-index | ✅ `base → debug` | 🟡 **25** `z-[N]` literais |
| Motion | ✅ `useMotion` + CSS | 🔴 **3/64** arquivos respeitam reduced-motion |

### Completude de componentes
| Componente | Estados | Variantes | Adoção | Score |
|---|---|---|---|---|
| `Button` | ✅ | ✅ | 🔴 5× vs 36 `<button>` crus | 7/10 |
| `EmptyState` | ✅ | ✅ | 🟡 parcial | 8/10 |
| `IconButton` | ✅ | ✅ | 🟡 parcial | 7/10 |
| Inputs (CSS base) | ✅ | ⚠️ sem componente | global via `index.css` | 6/10 |
| Modais/Sheets | ⚠️ ad-hoc por tela | ❌ sem primitivo | z-index improvisado | 5/10 |

### Ações prioritárias (viram as fases abaixo)
1. Adotar escala tipográfica (D2-1).
2. Consolidar botão + primitivo de modal (D2-2 / D4).
3. Governar motion e z-index (D1-2 / D1-3) e travar regressão (D3).

---

## Padrões globais

**Branch/PR:** uma branch por ticket — `design/<id>-slug` (ex.: `design/d1-2-motionconfig`). PRs pequenos e revisáveis.

**Definition of Done de design (todo PR de UI precisa passar):**
1. Sem valor mágico: nada de `text-[px]`, `z-[N]`, hex arbitrário, raio literal.
2. Ações via `<Button>`/`IconButton`; foco-visível presente; alvo ≥ 44px (ações primárias).
3. Animações respeitam `prefers-reduced-motion`.
4. Texto via `t()` (en + pt-BR; `parity.test.ts` verde).
5. Contraste AA mantido; menor texto ≥ 11px.
6. `npm run build` + `npm run test` verdes; testado em mobile (`max-w-lg`) e nos 2 idiomas.

**Princípio-guia:** *tokens antes de valores; um jeito de fazer cada coisa; acessível por padrão.*

---

## FASE D1 — Fundação invisível
> Mudanças de baixo risco e alto alcance, sem alterar layout. Meta: ~1 dia.

### D1-1 `[XS]` — Corrigir comentários de contraste no config
**Problema:** `tailwind.config.js` anota `zinc-500` como "4.6:1" e `zinc-600` como "~4.0:1"; a medição WCAG real é **6.91:1** e **5.33:1** (ambos passam AA). O comentário enganoso pode induzir um "conserto" desnecessário.
**Arquivos:** `tailwind.config.js`.
**Passos:** atualizar os comentários para os valores reais e a referência de fundo (`zinc-900 #18181b`).
**Aceite:** comentários refletem ratios medidos; nenhum valor de cor alterado.
**Risco:** nulo.

### D1-2 `[S]` — `MotionConfig reducedMotion="user"` global (a maior alavanca de motion)
**Problema:** 64 arquivos animam via Framer Motion; só 3 consultam `useMotion`. O CSS de `prefers-reduced-motion` **não** detém animações JS. Resultado: transições de aba, splash, modais e listas rodam mesmo para quem pediu menos movimento.
**Arquivos:** `src/main.tsx` (estrutura confirmada: `StrictMode > ErrorBoundary > App`).
**Passos (antes/depois):**
```tsx
// ❌ antes
<ErrorBoundary><App /></ErrorBoundary>
// ✅ depois
import { MotionConfig } from 'framer-motion';
<ErrorBoundary>
  <MotionConfig reducedMotion="user">
    <App />
  </MotionConfig>
</ErrorBoundary>
```
Com isso, todo componente Framer passa a respeitar a preferência do SO automaticamente (anima só `transform`/`opacity` quando reduzido). Loops manuais (ex.: ícone flutuante do `EmptyState`) continuam usando `useMotion`.
**Aceite:** com "reduzir movimento" ativo no SO, transições de tela/splash/modais ficam atenuadas/instantâneas; sem o flag, nada muda.
**Risco:** baixo (mudança aditiva). Testar visual com o flag ligado/desligado.

### D1-3 `[S]` — Migrar `z-[N]` literais para a escala semântica
**Problema:** 25 usos de `z-[N]` literais furam a escala (`dropdown/modal/overlay/toast`). Os valores codificam uma ordem local que **precisa ser preservada** (ex.: `PhotoGallery` usa `z-[100]` e `z-[120]` — lightbox acima da galeria).
**Arquivos:** ver tabela. **Mapa de remapeamento (preservando ordem):**
| Valor literal | Papel típico | Token alvo |
|---|---|---|
| `z-[60]`–`z-[95]` | modal/sheet/picker/editor de tela cheia | `z-modal` (100) |
| `z-[100]` | modal/overlay principal | `z-modal` (100) |
| `z-[120]` | camada acima de um modal (lightbox) | `z-overlay` (150) |
| `z-[200]` (splash em `App.tsx`) | camada de boot acima de tudo | `z-toast` (200) ou token `z-splash` novo |
**Passos:** remapear arquivo a arquivo (não usar `sed` cego); onde houver 2 camadas no mesmo componente, garantir que o token superior > inferior. Casos: `PhotoGallery`, `WorkoutSummary`, `ExerciseDetailModal`, `ExercisePicker` têm 2 níveis — revisar com cuidado.
**Aceite:** nenhum `z-[` em `src/**/*.tsx`; empilhamento visual idêntico ao atual (modais sobre conteúdo, toasts sobre modais, lightbox sobre galeria).
**Risco:** médio (empilhamento). Testar abrindo modais sobre modais.

### D1-4 `[XS]` — Liberar seleção de texto em dados
**Problema:** `index.css` aplica `user-select: none` global em `html,body`, bloqueando copiar pesos, notas e métricas — custo real num app de dados.
**Arquivos:** `src/index.css` + pontos de dados/notas.
**Passos:** manter `none` no chrome de navegação, mas adicionar utilitário `.select-text` (ou `select-text` do Tailwind) em texto de dados, notas de exercício e resultados.
**Aceite:** usuário consegue selecionar/copiar peso, e1RM e notas; gestos de UI seguem sem realce/seleção acidental.
**Risco:** baixo.

---

## FASE D2 — Consistência estrutural
> O grosso do trabalho de adoção. Meta: ~1 semana.

### D2-1 `[M]` — Adotar a escala tipográfica (eliminar 356 `text-[Npx]`)
**Problema:** a escala `fontSize` semântica existe para acabar com `text-[10px]/[11px]`, mas é quase ignorada (356 ocorrências), achatando a hierarquia.
**Mapa de migração:**
`[9–10px]→text-caption-xs` · `[11px]→text-caption` · `[12px]→text-label` · `[13px]→text-body-sm` · `[14px]→text-body` · `[16px]→text-body-lg`. Tamanhos de título → `text-h3/h2/h1`.
**Sequência por concentração (cobre ~50% nos 11 primeiros arquivos):**
| # | Arquivo | Ocorrências |
|---|---|---:|
| 1 | `components/Settings.tsx` | 33 |
| 2 | `components/mesocycle/MesocyclePlanner.tsx` | 25 |
| 3 | `components/progress/PhotoGallery.tsx` | 19 |
| 4 | `components/analytics/AnalyticsDashboard.tsx` | 17 |
| 5 | `components/history/SessionDetailsModal.tsx` | 16 |
| 6 | `components/plan-editor/DraggableExerciseCard.tsx` | 15 |
| 7 | `components/ai/RoutineTableBuilder.tsx` | 13 |
| 8 | `components/post-workout/WorkoutSummary.tsx` | 12 |
| 9–11 | `WilksLeaderboard` · `CreateExerciseModal` · `PRTimeline` | 10 cada |
**Passos:** por arquivo — substituir via busca/codemod e **revisar visualmente** (a equivalência px→token não é sempre 1:1; ajustar onde a hierarquia pedir outro degrau). Aplicar regra: nada abaixo de `caption-xs` (10px); promover rótulos importantes para `label` (12px).
**Aceite:** `grep -rEo "text-\[[0-9]+px\]" src` retorna 0; hierarquia legível (rótulo < corpo < título) em cada tela tocada.
**Risco:** baixo-médio (volume). Fazer em PRs por grupo de arquivos.

### D2-2 `[M]` — Consolidar botões em `<Button>`/`IconButton`
**Problema:** 5 `<Button>` vs 36 `<button>` crus + a classe `.btn-primary` (3 caminhos) → foco/hover/disabled/hit-area inconsistentes.
**Arquivos:** todos os `.tsx` com `<button>` cru; remover `.btn-primary` de `src/index.css` ao final.
**Passos:**
1. Trocar `<button>` de texto/ação por `<Button variant=… size=…>`; ícone puro por `<IconButton>`.
2. Casos especiais (toda a área clicável é um card/linha) podem manter `<button>` cru, **mas** precisam de `focus-visible:ring` e `active:scale` — padronizar via uma classe utilitária `.tap` no `index.css` para esses casos.
3. Garantir alvo ≥ 44px nas ações primárias (ver D2-3).
4. Remover `.btn-primary` e migrar seus usos.
**Aceite:** ações textuais usam `<Button>`; nenhum botão sem foco-visível; `.btn-primary` removido; sem regressão visual.
**Risco:** médio. Priorizar telas de alto tráfego (Dashboard, WorkoutPlayer, Settings).

### D2-3 `[S]` — Alvos de toque ≥ 44px nas ações primárias
**Problema:** `Button sm`=32px e `md`=40px ficam abaixo de 44px; vários botões crus também.
**Arquivos:** `ui/Button.tsx` (revisar paddings/altura mínima por contexto), telas com ações primárias densas.
**Passos:** garantir que ações primárias usem `size="lg"` (48px) ou que `md` tenha área de toque efetiva ≥ 44px (padding/`min-h`); reservar `sm` a ações densas/secundárias de baixo risco.
**Aceite:** ações primárias mensuráveis ≥ 44px; densas continuam compactas sem prejudicar o toque.
**Risco:** baixo.

---

## FASE D3 — Governança (trava a regressão)
> Sem isto, as Fases D1–D2 regridem. Meta: ~1 dia.

### D3-1 `[S]` — Lint/CI contra valores mágicos
**Problema:** nada impede reintroduzir `text-[px]`, `z-[N]`, hex ou `<button>` cru.
**Arquivos:** novo `eslint.config` (não há ESLint hoje) ou script de CI `scripts/check-design.sh`.
**Passos:** regra/`grep` que **falha o build** ao encontrar: `text-\[[0-9]+px\]`, `z-\[[0-9]`, `(text|bg|border)-\[#`, e `<button ` fora de `src/components/ui/`. Rodar no CI (o projeto já builda no Netlify).
**Aceite:** PR que introduz qualquer padrão proibido falha automaticamente.
**Risco:** baixo (ajustar exceções legítimas via allowlist).

### D3-2 `[S]` — Reconciliar marca documentada × construída
**Problema:** `README`/`PRODUCT.md` prometem "cantos 4px", "Outfit", "acento branco"; o real é raio 8–24px, Inter, acento lime `#bef264`.
**Arquivos:** `README.md`, `PRODUCT.md` (e, se a decisão for redesign, `tailwind.config.js`).
**Passos:** **decidir** — recomendo documentar o sistema real (coerente e moderno) em vez de perseguir uma identidade que nunca foi construída. Atualizar a seção "Design Philosophy"/"Design Constraints" para lime/Inter/raio arredondado. Se a marca exigir Outfit/4px, abrir um épico de redesign explícito.
**Aceite:** docs descrevem exatamente os tokens do `tailwind.config.js`; sem contradição.
**Risco:** nulo (decisão + texto).

### D3-3 `[S]` — Definition of Done de design no template de PR
**Arquivos:** `.github/pull_request_template.md` (ou equivalente).
**Passos:** adicionar o checklist da seção "Padrões globais" como itens marcáveis.
**Aceite:** novos PRs trazem o checklist de design.
**Risco:** nulo.

---

## FASE D4 — Polimento perceptível (contínuo)
> Trabalho de "taste" tela a tela, depois que a base está consistente.

### D4-1 `[M]` — Primitivo de Modal/Sheet
**Problema:** cada modal reimplementa overlay, foco-trap, z-index e animação. Origem do problema de z-index (D1-3).
**Proposta:** componente `ui/Sheet`/`ui/Modal` com `z-modal`, `useFocusTrap` (já existe), fechar no `Esc`/backdrop, animação ciente de motion. Migrar modais existentes gradualmente.
**Aceite:** novos modais usam o primitivo; comportamento e empilhamento uniformes.

### D4-2 `[M]` — Auditoria de hierarquia tela a tela (/impeccable + /design-critique)
**Passos:** por tela de alto tráfego (Dashboard, WorkoutPlayer, AnalyticsDashboard, Settings): uma ação primária por tela, ênfase única do acento lime, densidade com `spacing` tokens, números sempre em mono. Registrar achados e corrigir.
**Aceite:** cada tela tem foco visual claro; acento usado com parcimônia.

### D4-3 `[S]` — Micro-interações com propósito
**Passos:** padronizar durações (120–200ms micro, 200–300ms tela), garantir `transform/opacity` (GPU) e revisar loops decorativos. Reaproveitar `gpu-accelerated`/`will-change`.
**Aceite:** animações orientam (origem→destino/foco), não decoram; sem jank.

### D4-4 `[S]` — Copy dos estados (/ux-copy)
**Passos:** revisar estados vazios/erro com 1 CTA claro, verbos curtos, via `t()`. 
**Aceite:** todo estado vazio tem título + descrição + CTA localizados.

### D4-5 `[M]` — Modo "academia" (densidade de toque)
**Passos:** variante de logging com steppers grandes, `inputmode="decimal"`, foco automático (cross-ref produto C-03).
**Aceite:** logar um set sem teclado externo, alvos ≥ 44px.

---

## Sequenciamento e gates

```
D1 (fundação)  → D2 (consistência) → D3 (governança) → D4 (polimento)
 D1-1 contraste     D2-1 tipografia     D3-1 lint/CI       D4-1 Modal
 D1-2 MotionConfig  D2-2 botões         D3-2 docs          D4-2 hierarquia
 D1-3 z-index       D2-3 toque 44px     D3-3 PR template   D4-3 motion
 D1-4 user-select                                          D4-4 copy / D4-5 academia
```

**Regra de ouro:** **D3-1 (lint) entra logo após D2** — fechar a torneira antes que novos valores mágicos voltem. Idealmente D3-1 pode até preceder D2 em modo "warning" e virar "error" ao fim de D2.

### Gates entre fases
- **Fim de D1:** reduced-motion respeitado de verdade; `z-[` zerado; contraste documentado corretamente; dados selecionáveis.
- **Fim de D2:** `text-[px]` = 0; ações via componentes; alvos primários ≥ 44px.
- **Fim de D3:** CI barra regressão; docs e código contam a mesma história.
- **D4:** contínuo, por tela, guiado por crítica.

---

## Esforço agregado (ordem de grandeza)
- **D1** ~1 dia · **D2** ~1 semana · **D3** ~1 dia · **D4** contínuo.
- Maior ROI imediato: **D1-2 (MotionConfig)** e **D2-1 (tipografia)** — uma linha conserta o motion; a escala restaura a hierarquia em todo o app.

---

## Apêndice — verificação contínua
```bash
grep -rEo "text-\[[0-9]+px\]" src --include="*.tsx" | wc -l   # alvo: 0
grep -rEo "z-\[[0-9]+\]" src --include="*.tsx" | wc -l        # alvo: 0
grep -rEc "<button[ >]" src --include="*.tsx" | awk -F: '{s+=$2}END{print s}'  # alvo: ~0 fora de ui/
grep -rl "from 'framer-motion'" src --include="*.tsx" | wc -l # informativo
```
