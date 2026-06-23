# TIVE — Roadmap de Melhorias de Produto & UX (2026)

> Foco exclusivo em **produto e experiência do usuário**. Não cobre dívida técnica, tooling ou refatorações internas (isso fica para um documento separado).

**Data da análise:** 23/06/2026
**Base:** leitura do `src/` atual — navegação (`App.tsx`, `Layout.tsx`), fluxo de logging (`WorkoutPlayer`, `SetRow`, `active-session/*`), dashboard, analytics, social, mesociclo, onboarding (`WelcomeModal`), i18n e PWA.
**Relação com o plano anterior:** o `docs/PLAN-master-improvement.md` foi em boa parte entregue (engine de progressão, sugestão de peso, ACWR, mesociclo, busca global, importador CSV, migração de store v9). Este documento **não repete** o que já está no código — parte do estado atual e aponta as próximas oportunidades de produto.

---

## Convenções

| Símbolo | Significado |
|---|---|
| `[P0]` | Crítico — quebra a experiência ou afeta todo usuário no primeiro contato |
| `[P1]` | Alta prioridade — impacto direto no uso diário ou na proposta de valor |
| `[P2]` | Média — melhoria significativa, não bloqueante |
| `[P3]` | Baixa — polish ou feature avançada |
| `[XS]` | < 1h · `[S]` 1–3h · `[M]` 3–8h · `[L]` 1–2 dias · `[XL]` 3–5 dias |

---

## Resumo executivo

O TIVE já é um logger de força maduro: o fluxo de execução de sessão é forte (set anterior com cópia em 1 toque, autofill, RPE, plate calculator, rest timer com áudio/vibração configuráveis, supersets, troca e reordenação de exercício mid-session). O problema **não é falta de recursos — é descoberta e primeiro contato.** Recursos valiosos estão construídos, mas escondidos ou inconsistentes:

1. **Primeiro acesso quebra o idioma.** O app autodetecta `pt-BR` (`navigator.language`), mas o `WelcomeModal` ignora o i18n e exibe textos fixos em inglês. A primeira tela que um usuário brasileiro vê está no idioma errado.
2. **O "Performance Lab" está enterrado.** O Analytics — diferencial central segundo o `PRODUCT.md`/`README` — é apenas um toggle (`journal | analytics`) dentro da aba History, não um destino próprio.
3. **A biblioteca de exercícios é órfã.** `ExerciseLibrary.tsx` existe (191 linhas) mas não está ligada a nenhuma navegação; não há tela para "explorar exercícios".
4. **Não há gancho de retorno.** Notificações são só toasts in-app; não existe lembrete/push para trazer o usuário de volta — o maior buraco de retenção.
5. **Time-to-first-workout alto.** Para começar é preciso criar rotina (manual/IA) ou importar CSV; não há biblioteca de programas prontos (PPL, 5/3/1, Upper/Lower).

Os blocos abaixo organizam as melhorias por tema; o roadmap em fases no final dá a ordem de execução sugerida.

---

## BLOCO A — Primeiro Acesso & Internacionalização

### A-01 `[P0][S]` — Traduzir o onboarding via i18n
**Problema (confirmado):** `WelcomeModal.tsx` tem strings fixas em inglês ("Who are you", "What are your goals", "This calibrates…", "Building your…", "Ready to…", além das descrições de nível "0-1 years lifting", "Low/Moderate/High Volume"). O restante do app já roda em `pt-BR` para usuários BR (via `i18n/index.ts` → `navigator.language`), então a inconsistência é gritante: tudo em português, **menos a primeira tela**.
**Proposta:** mover todas as strings do `WelcomeModal` para `i18n/en.ts` e `i18n/pt-BR.ts` e consumir via `t()`. Cobrir os 4 passos + a tela de geração da rotina inicial.
**Impacto:** primeira impressão correta para 100% do público não-anglófono. Baixo esforço, alto retorno.

### A-02 `[P1][S]` — Auditar e migrar strings hardcoded fora do i18n
**Problema:** o `WelcomeModal` provavelmente não é o único ponto com texto fixo. O Settings já está 100% i18n, mas telas mais novas podem ter literais.
**Proposta:** varredura por literais voltados ao usuário em JSX; mover para os dicionários; adicionar regra no review para barrar novos literais. Reaproveitar o `parity.test.ts` que já garante paridade en/pt-BR.
**Impacto:** consistência total de idioma e base pronta para um 3º idioma (ES amplia o mercado LatAm).

### A-03 `[P2][M]` — Onboarding que gera uma rotina realista
**Problema:** hoje o onboarding coleta nome, peso, experiência e objetivo, e gera uma rotina genérica ("Foundation Strength" / "Base Hypertrophy"). Não pergunta **quantos dias por semana** nem **equipamento disponível**, então o primeiro plano raramente reflete a realidade do usuário.
**Proposta:** adicionar 1–2 passos (dias/semana, equipamento: academia completa / halteres / casa) e usar isso para montar o split inicial (full-body 3x, upper/lower 4x, PPL 6x). Pode reaproveitar o `AIService.generateRoutine` ou um mapa de templates (ver F-01).
**Impacto:** rotina inicial utilizável → maior chance de o usuário treinar no dia 1.

---

## BLOCO B — Arquitetura de Informação & Navegação

### B-01 `[P1][M]` — Promover o Analytics a destino de primeira classe
**Problema (confirmado):** o `AnalyticsDashboard` só aparece como `viewMode === 'analytics'` dentro de `HistoryLog.tsx`. A navegação principal (`Layout.tsx`) tem apenas 4 abas: Home, Rotinas, Fotos, Histórico. Para um produto que se vende como "Scientific PWA / Performance Lab", o conjunto mais rico (volume load, radar muscular, ACWR, e1RM, PR timeline, heatmap de frequência, strength standards) está escondido a dois cliques.
**Proposta:** dar ao Analytics uma entrada própria — seja uma 5ª aba ("Lab"), seja um card de destaque no Dashboard que leve direto para a tela cheia. Manter o toggle no History como atalho secundário.
**Impacto:** expõe o principal diferencial competitivo; aumenta o uso das análises que justificam o posicionamento premium.

### B-02 `[P1][S]` — Ligar a Biblioteca de Exercícios à navegação
**Problema (confirmado):** `exercise/ExerciseLibrary.tsx` não é referenciada em nenhum outro arquivo — está órfã. O usuário só encontra exercícios pelo `ExercisePicker` enquanto monta uma rotina; não há lugar para **explorar** o catálogo (com mídia, anatomia, histórico por exercício via `ExerciseDetailModal`, que já existe).
**Proposta:** expor a `ExerciseLibrary` como destino navegável (entrada no Dashboard, no hub "Mais", ou aba). Reaproveitar `ExerciseDetailModal`, `ExerciseAnatomy`, `ExerciseGuide` que já estão prontos.
**Impacto:** transforma um componente morto em uma superfície de valor (descoberta, educação, consulta de PRs por exercício).

### B-03 `[P2][M]` — Revisar a hierarquia de navegação (IA)
**Problema:** com só 4 slots, "Fotos" ocupa lugar nobre enquanto Analytics, Biblioteca, Mesociclo e Social ficam aninhados ou ocultos — desalinhado com o público-alvo "data-driven lifter" do `PRODUCT.md`.
**Proposta:** redesenhar a barra: por exemplo Home · Rotinas · **Lab** · Histórico, com um hub "Mais" (Fotos, Mesociclo, Social, Biblioteca, Settings) ou uma aba adaptativa. Validar com teste rápido de árvore/preferência.
**Impacto:** alinha a navegação à proposta de valor e melhora a descoberta de tudo que já existe.

### B-04 `[P2][S]` — Tornar Mesociclo e Social descobríveis
**Problema:** `MesocyclePlanner` vive dentro do `PlanManager` e o `SocialHub` dentro do `Dashboard` — sem rótulo claro de entrada.
**Proposta:** entradas explícitas (cards/atalhos rotulados) e, idealmente, posições no hub "Mais" do B-03.

---

## BLOCO C — Fluxo de Logging (Speed to Log)

> O núcleo já é forte; aqui são refinamentos de fricção, não reconstruções.

### C-01 `[P1][S]` — e1RM ao vivo durante o logging
**Problema (confirmado):** o e1RM estimado só aparece no `PRCelebration` (pós-PR). Durante a digitação do set, `SetRow.tsx` não mostra a estimativa — o usuário perde o feedback de força em tempo real.
**Proposta:** exibir o e1RM calculado inline no `SetRow` conforme peso×reps mudam (a fórmula já existe em `utils/formulas.ts`), de forma discreta (mono, secundário) para não poluir.
**Impacto:** feedback imediato de progresso a cada set, reforçando o posicionamento "data-driven".

### C-02 `[P2][S]` — Delta explícito vs. sessão anterior por set
**Problema:** hoje há a cópia "↑ 100kg × 5" do set anterior, mas não um indicador claro de **superou / igualou / abaixo** em relação à última vez.
**Proposta:** micro-badge de delta (ex.: `+2.5kg` verde, `=` neutro) ao completar o set, com haptic já existente (`useHaptic`).
**Impacto:** gamifica a sobrecarga progressiva sem adicionar telas.

### C-03 `[P2][M]` — Modo de logging "academia" (toque grande)
**Problema:** logar entre séries, suado, com o celular na mão, exige alvos de toque generosos e teclado numérico otimizado. Os inputs atuais (`h-9`, texto `sm`) são pequenos para uso real na academia.
**Proposta:** modo de input ampliado (steppers +/- grandes, `inputmode="decimal"`, foco automático no próximo campo) — opcional via Settings.
**Impacto:** reduz erros e tempo de logging, o KPI #1 do `PRODUCT.md` ("Speed to Log").

### C-04 `[P3][M]` — Aquecimento assistido (warm-up ramp)
**Problema:** o tipo de set "warmup" já existe em `SetRow`, mas não há geração automática de séries de aquecimento a partir do peso de trabalho.
**Proposta:** botão "gerar aquecimento" que calcula 2–4 rampas (ex.: 40/60/80%) com base no peso-alvo e no `PlateCalculator`.

---

## BLOCO D — Inteligência & Coaching

### D-01 `[P2][M]` — Insights acionáveis (do diagnóstico à ação)
**Problema:** `CoachCard`, `InsightsPanel` e `ACWRCard` diagnosticam bem (ex.: volume de pull baixo, ACWR alto), mas o usuário precisa descobrir sozinho o que fazer.
**Proposta:** cada insight ganha uma ação direta — "volume de pull baixo" → botão que abre uma rotina/exercício sugerido; "ACWR alto" → sugerir deload (engine de periodização já existe).
**Impacto:** fecha o loop diagnóstico→ação, aumentando a percepção de "treinador no bolso".

### D-02 `[P2][S]` — Atualizar o modelo de IA e melhorar o fallback
**Problema:** `AIService.ts` usa `gemini-1.5-flash` (datado) e exige chave do usuário; sem chave, o builder só retorna uma mensagem de erro.
**Proposta:** atualizar para um modelo Gemini atual e oferecer um caminho local (templates do F-01) quando não há chave, em vez de um beco sem saída.
**Impacto:** qualidade das rotinas geradas e funcionamento mesmo sem credencial.

### D-03 `[P3][M]` — Explicabilidade ("por que isso?")
**Problema:** scores como readiness muscular e ACWR aparecem sem explicação acessível.
**Proposta:** tooltips/"saiba mais" curtos explicando a metodologia (MEV/MAV/MRV, ACWR), reforçando autoridade científica.

---

## BLOCO E — Engajamento & Retenção

### E-01 `[P1][M]` — Lembretes de treino (Web Push / Notifications)
**Problema (confirmado):** não há uso de `Notification`/`pushManager`/service worker push. O sistema de "notificações" é só toast in-app. Sem nenhum gancho de retorno, a retenção depende do usuário lembrar sozinho.
**Proposta:** lembretes opcionais (dias/horários configuráveis em Settings) via Notifications API + service worker (já existe `public/service-worker.js`). Pedir permissão no momento certo (após a 1ª sessão, não no onboarding).
**Impacto:** maior alavanca de retenção do app; baixo custo dado o PWA já instalável.

### E-02 `[P2][S]` — Recap semanal de progresso
**Problema:** o usuário não recebe um fechamento periódico que mostre evolução.
**Proposta:** tela/cartão "sua semana" (volume, PRs, consistência — dados já calculados em `analytics.ts`/`ConsistencyCard`), opcionalmente enviado via push do E-01.
**Impacto:** reforço positivo recorrente; gancho natural de reengajamento.

### E-03 `[P2][M]` — Metas e marcos com celebração
**Problema:** `PRCelebration` celebra PRs de set, mas não há metas definidas pelo usuário nem marcos de longo prazo (ex.: "supino 100kg", "100 treinos").
**Proposta:** metas configuráveis e marcos automáticos com a mesma linguagem visual de celebração já existente.

### E-04 `[P3][M]` — Social que sai do dispositivo
**Problema:** `SocialHub` (Wilks leaderboard, weekly challenge) é local; `PRShareCard` existe mas o compartilhamento real (imagem/Share Sheet) pode ser ampliado.
**Proposta:** exportar PR/treino como imagem e usar a Web Share API; convite/comparação entre amigos (respeitando o princípio local-first/privacidade do `README`).

---

## BLOCO F — Conteúdo & Aquisição

### F-01 `[P1][M]` — Biblioteca de programas/templates prontos
**Problema (confirmado):** para começar, o usuário precisa montar rotina manualmente, usar a IA (exige chave) ou importar CSV (`RoutineImporter`). Não há programas curados prontos.
**Proposta:** catálogo de templates clássicos (Full-Body 3x, Upper/Lower, PPL, 5/3/1, Starting Strength) que viram rotina com 1 toque (deep clone, como o `R-01` do plano antigo). Alimenta também o onboarding (A-03) e o fallback de IA (D-02).
**Impacto:** derruba o time-to-first-workout — fator decisivo de ativação.

### F-02 `[P2][L]` — Importar Apple Health / Google Fit
**Problema (confirmado):** não há integração com Health/Fit/wearables; peso corporal e atividade são manuais.
**Proposta:** importar peso corporal (e opcionalmente sessões) do Apple Health / Google Fit. Maior esforço por ser fora do escopo local-first; avaliar como diferencial premium.

### F-03 `[P3][M]` — Compartilhar/exportar rotina
**Problema:** rotinas não podem ser trocadas entre usuários.
**Proposta:** exportar rotina como arquivo/deep link importável (a infra de import/export JSON em `exportImport.ts` já é uma base).

---

## BLOCO G — Acessibilidade & Polimento

### G-01 `[P2][M]` — Auditoria de acessibilidade (WCAG AA)
**Problema:** a estética "tech-brutalist" usa cinza-zinc sobre preto puro; texto secundário (`text-zinc-500/600`) corre risco de contraste insuficiente. Pontos positivos já presentes: `useFocusTrap`, `aria-label` na navegação.
**Proposta:** auditar contraste, tamanho de alvo de toque (mín. 44px) e foco visível; corrigir tokens problemáticos no `tailwind.config.js`.
**Impacto:** acessibilidade + legibilidade na academia (tela com brilho/ suor).

### G-02 `[P2][S]` — Respeitar `prefers-reduced-motion`
**Problema (confirmado):** não há tratamento de `prefers-reduced-motion`. O app é pesado em Framer Motion (transições de aba, splash, overlays), o que pode incomodar usuários sensíveis a movimento.
**Proposta:** desativar/atenuar animações via `useReducedMotion` do Framer Motion e media query no CSS.

### G-03 `[P3][S]` — Estados vazios e de erro mais orientadores
**Problema:** `EmptyState` existe, mas a cópia pode guiar melhor o próximo passo.
**Proposta:** revisar microcopy dos estados vazios (sem rotinas, sem histórico, sem fotos) com CTA claro — apoiar-se no i18n.

---

## Roadmap priorizado (sequenciamento sugerido)

### Fase 1 — Corrigir o primeiro contato e expor o que já existe (1–2 semanas)
| ID | Item | Prioridade | Esforço |
|---|---|---|---|
| A-01 | Traduzir onboarding via i18n | P0 | S |
| B-02 | Ligar Biblioteca de Exercícios à navegação | P1 | S |
| C-01 | e1RM ao vivo no logging | P1 | S |
| B-01 | Promover Analytics a destino próprio | P1 | M |
| A-02 | Auditar strings hardcoded | P1 | S |

### Fase 2 — Retenção, ativação e descoberta (2–4 semanas)
| ID | Item | Prioridade | Esforço |
|---|---|---|---|
| E-01 | Lembretes de treino (push) | P1 | M |
| F-01 | Biblioteca de templates prontos | P1 | M |
| B-03 | Revisar hierarquia de navegação | P2 | M |
| A-03 | Onboarding gera rotina realista | P2 | M |
| D-01 | Insights acionáveis | P2 | M |

### Fase 3 — Profundidade e polimento (contínuo)
| ID | Item | Prioridade | Esforço |
|---|---|---|---|
| C-02 / C-03 | Delta por set · modo logging academia | P2 | S/M |
| D-02 / D-03 | IA atualizada · explicabilidade | P2/P3 | S/M |
| E-02 / E-03 / E-04 | Recap semanal · metas · social | P2/P3 | S/M |
| G-01 / G-02 / G-03 | Acessibilidade · reduced-motion · empty states | P2/P3 | S/M |
| B-04 · C-04 · F-02 · F-03 | Descoberta · warm-up · health import · share | P2/P3 | S–L |

---

## Quick wins (alto impacto, baixo esforço — comece por aqui)

1. **A-01** — Traduzir o onboarding. A correção de maior retorno por hora investida: conserta a primeiríssima impressão.
2. **B-02** — Dar uma entrada para a `ExerciseLibrary`. Já está construída; só falta o link.
3. **C-01** — Mostrar o e1RM ao vivo. A fórmula já existe; é UI.
4. **G-02** — `prefers-reduced-motion`. Pequeno, melhora acessibilidade imediatamente.

---

## Dependências e notas

- **F-01 (templates)** destrava **A-03 (onboarding)** e **D-02 (fallback de IA)** — vale priorizar.
- **B-01/B-02/B-04** convergem para **B-03 (nova IA de navegação)**; idealmente B-03 é desenhado antes para evitar retrabalho de posicionamento.
- **E-01 (push)** depende de pedir permissão no momento certo — implementar **após** a primeira sessão concluída, nunca no onboarding.
- Vários itens reaproveitam infraestrutura existente (`exportImport.ts`, `service-worker.js`, `ExerciseDetailModal`, engine de periodização, `analytics.ts`), reduzindo o esforço real frente à estimativa.
