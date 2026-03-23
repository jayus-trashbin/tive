# TIVE — Master Improvement Plan

> Análise completa do código-fonte. Plano granular de correções, melhorias e novas funcionalidades para tornar o TIVE tão funcional quanto o Heavy.

**Referência de código analisado:** `src/` completo — store (5 slices), hooks, utils/engine, utils/formulas, utils/analytics, services, components (70+ arquivos).

---

## Índice
1. [Convenções deste documento](#convenções)
2. [BLOCO 0 — Bugs Críticos Confirmados no Código](#bloco-0--bugs-críticos-confirmados-no-código)
3. [BLOCO 1 — Sessão Ativa (Workout Player)](#bloco-1--sessão-ativa-workout-player)
4. [BLOCO 2 — Engine de Progressão Inteligente](#bloco-2--engine-de-progressão-inteligente)
5. [BLOCO 3 — Analytics & Histórico](#bloco-3--analytics--histórico)
6. [BLOCO 4 — Gestão de Rotinas & Exercícios](#bloco-4--gestão-de-rotinas--exercícios)
7. [BLOCO 5 — UX, Feedback & Polish](#bloco-5--ux-feedback--polish)
8. [BLOCO 6 — Infraestrutura & Dados](#bloco-6--infraestrutura--dados)
9. [Mapa de Dependências entre Tasks](#mapa-de-dependências-entre-tasks)

---

## Convenções

| Símbolo | Significado |
|---|---|
| `[P0]` | Bugfix crítico — o app funciona de forma incorreta agora |
| `[P1]` | Alta prioridade — impacto direto no uso diário |
| `[P2]` | Média prioridade — melhoria significativa |
| `[P3]` | Baixa prioridade — polish ou feature avançada |
| `[XS]` | < 1 hora de trabalho |
| `[S]` | 1–3 horas |
| `[M]` | 3–8 horas |
| `[L]` | 1–2 dias |
| `[XL]` | 3–5 dias |
| `→ depende de` | Deve ser implementado após a task referenciada |

---

## BLOCO 0 — Bugs Críticos Confirmados no Código

> Estas tasks não são melhorias — são falhas verificadas diretamente no código-fonte que causam comportamento incorreto ou silenciosamente errado.

---

### B-01 `[P0][XS]` — ACWR nunca é calculado nem salvo na sessão finalizada

### B-02 `[P0][S]` — `MAX_MUSCLE_CAPACITY = 10000` mal calibrado torna o sistema de readiness decorativo

### B-03 `[P0][XS]` — `nextRoutine` no Dashboard usa nome como chave — quebra ao renomear

### B-04 `[P0][S]` — `calculateSymmetry` usa heurística de nome — falha para exercícios em português

### B-05 `[P1][XS]` — `NextMission` usa `exerciseIds.length * 4` para duração — ignora `estimateRoutineDuration`

### B-06 `[P1][XS]` — `PlateCalculator` usa classes `slate-*` fora do sistema de design

### B-07 `[P1][S]` — `useStopwatch` é inadequado para timer de sessão após rehydration

### B-08 `[P1][S]` — Schema do store na versão 8 sem função `migrate` — risco de dados corrompidos

---

## BLOCO 1 — Sessão Ativa (Workout Player)

### W-01 `[P0][M]` — Sugestão inteligente de peso baseada em progressão histórica
### W-02 `[P0][S]` — Exibição proeminente do desempenho anterior por set
### W-03 `[P1][S]` — Timer de duração da sessão visível e persistente
### W-04 `[P1][M]` — Notas por exercício durante a sessão
### W-05 `[P1][S]` — Autocompletar peso/reps ao iniciar sessão com dados históricos inteligentes
### W-06 `[P1][XS]` — e1RM calculado em tempo real e exibido por set
### W-07 `[P1][S]` — Config de áudio e vibração para o rest timer
### W-08 `[P2][L]` — Supersets: execução encadeada com UX diferenciada
### W-09 `[P2][M]` — Substituição de exercício mid-session
### W-10 `[P2][S]` — Reordenar exercícios durante a sessão (drag-and-drop)
### W-11 `[P2][XS]` — Botão de adicionar set com feedback de "copiando último"
### W-12 `[P3][M]` — Modo de aquecimento assistido antes do set principal

---

## BLOCO 2 — Engine de Progressão Inteligente

### E-01 `[P0][L]` — Engine de status de progressão por exercício
### E-02 `[P1][M]` — Detecção de plateau e geração de sugestões contextuais
### E-03 `[P1][M]` — Volume semanal por músculo com comparação à semana anterior
### E-04 `[P2][XL]` — Sistema de Mesociclo com periodização automática
### E-05 `[P2][S]` — Cálculo de Wilks Score funcional e exibido

---

## BLOCO 3 — Analytics & Histórico

### A-01 `[P0][M]` — Gráfico de e1RM por exercício no `ExerciseDetailModal`
### A-02 `[P0][S]` — ACWR visível no Dashboard e no WorkoutSummary
### A-03 `[P1][M]` — Comparação lado-a-lado de sessões no `SessionDetailsModal`
### A-04 `[P1][S]` — Top exercícios por uso com acesso à tela de detalhe
### A-05 `[P1][M]` — Heatmap de frequência com drill-down por dia
### A-06 `[P2][S]` — Exportação de dados em CSV além de JSON
### A-07 `[P2][S]` — Adicionar importação de backup JSON
### A-08 `[P2][M]` — PR Timeline expandida com filtro por exercício

---

## BLOCO 4 — Gestão de Rotinas & Exercícios

### R-01 `[P1][XS]` — Duplicar rotina com deep clone
### R-02 `[P1][M]` — Notas de bloco visíveis durante a sessão
### R-03 `[P1][M]` — Exercício customizado: UI completa de criação e edição
### R-04 `[P1][S]` — Preview de rotina com readiness e distribuição muscular
### R-05 `[P2][S]` — RPE target por set no editor
### R-06 `[P2][S]` — Rest timer por exercício no editor

---

## BLOCO 5 — UX, Feedback & Polish

### U-01 `[P1][M]` — WorkoutSummary: comparação granular
### U-02 `[P1][S]` — MiniPlayer expandido
### U-03 `[P2][M]` — Busca global
### U-04 `[P2][S]` — Tema OLED implementado e aplicável
### U-05 `[P3][S]` — Onboarding inteligente
### U-06 `[P3][S]` — Animação de conquista ao bater PR

---

## BLOCO 6 — Infraestrutura & Dados

### D-01 `[P1][M]` — Migração de versão do store
### D-02 `[P2][S]` — Stale-while-revalidate no exerciseService
### D-03 `[P2][M]` — Cobertura de testes unitários para funções críticas
### D-04 `[P2][S]` — Rate limit e retry robusto no exerciseService
### D-05 `[P3][M]` — Service Worker offline

---

*Nota: As instruções detalhadas para implementação de cada task estão documentadas na solicitação inicial do usuário.*
