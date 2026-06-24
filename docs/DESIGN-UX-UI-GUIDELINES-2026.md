# TIVE — Design System & UX/UI: Boas Práticas e Plano de Melhoria (2026)

> Auditoria de design e guia de boas práticas, com achados medidos no código (`tailwind.config.js`, `src/index.css`, `src/components/ui/*`).
> Aplica os princípios dos workflows `/design-taste-frontend`, `/frontend-design`, `/impeccable` e `/ui-ux-pro-max` (cujos corpos vivem em `~/.agents/skills/…`, fora deste repositório) somados ao framework `/design-critique`.

**Data:** 23/06/2026 · **Produto:** Tive — strength-training PWA · **Público:** lifters orientados a dados · **Estágio:** produção (`1.0.0-rc1`).

---

## 1. Sumário executivo

**Veredito:** o Tive tem um *design system* bem **projetado** mas mal **adotado**. Os tokens existem, são semânticos e foram pensados com acessibilidade — mas grande parte das telas ignora esses tokens e improvisa. O risco não é falta de fundação; é **inconsistência de aplicação** e **divergência entre a marca documentada e a construída**.

O que está forte (preservar):
- Tokens semânticos completos: cor (`zinc` + `brand`), `z-index` nomeado, `borderRadius` (`control/card/sheet`), `fontSize` (`caption→h1`), `spacing` (`card/section/page`), `boxShadow`. 
- Acessibilidade de base: `useFocusTrap`, `focus-visible:ring` no `Button`, inputs a 16px (sem zoom no iOS), `prefers-reduced-motion` no CSS, hook `useMotion`.
- Contraste de texto **passa WCAG AA** (medido): secundário `zinc-500` = 6.91:1, `zinc-600` = 5.33:1 sobre `zinc-900`.
- Componentes-modelo: `Button.tsx` (variantes, estados, foco, `aria-busy`) e `EmptyState.tsx` (sem card, ciente de motion).

As 5 correções de maior impacto (detalhadas adiante):
1. **Tipografia ad-hoc** — 356 usos de `text-[Npx]` apesar de existir escala semântica. → adotar `text-caption/label/body/h*`.
2. **Botão não padronizado** — 5 usos de `<Button>` contra 36 `<button>` crus (+ classe `.btn-primary`). → consolidar num componente.
3. **Movimento ignora preferência** — 64 arquivos usam Framer Motion, só 3 consultam `useMotion`. O CSS de reduced-motion **não** detém animações JS. → governar motion.
4. **`z-index` improvisado** — 25 usos de `z-[N]` literais furam a escala semântica. → usar `z-modal/z-toast/...`.
5. **Marca documentada ≠ construída** — README/`PRODUCT.md` prometem "cantos 4px", "Outfit", "acento branco"; o real é raio 8–24px, Inter e acento lime `#bef264`. → reconciliar a documentação com o sistema (bom) que de fato existe.

---

## 2. Princípios de design (a "régua" que guia as decisões)

Estes princípios traduzem a intenção dos workflows citados e servem de critério para qualquer tela nova.

1. **Tokens antes de valores.** Nenhum pixel, hex ou z-index literal quando existe token. Valores mágicos são dívida de design.
2. **Hierarquia por intenção, não por enfeite.** Tamanho/peso/cor servem ao olhar do usuário (o que ele precisa ver primeiro), não à decoração.
3. **Densidade com respiro.** App de dados pode ser denso — mas espaçamento (`spacing` tokens) e alinhamento em grade evitam o "amontoado".
4. **Um jeito de fazer cada coisa.** Um componente de botão, um de card, um de modal. Variação vem de *props*, não de cópias.
5. **Movimento com propósito e opcional.** Anima para orientar (origem→destino, foco), nunca como ruído; sempre respeitando `prefers-reduced-motion`.
6. **Acessível por padrão.** Foco visível, alvo ≥ 44px, contraste AA, texto legível, rótulos i18n — não é "fase final", é requisito de cada PR.
7. **Anti-genérico.** Fugir do "AI default" (gradientes roxos, sombras genéricas, espaçamento frouxo). A identidade lime-sobre-preto + mono nos números já é distinta — explorá-la com consistência.
8. **Documentação é fonte única de verdade.** O que está no `PRODUCT.md` precisa ser o que está no `tailwind.config.js`.

---

## 3. Auditoria do design system atual

### 3.1 Cor
Escala `zinc` redefinida (mais escura que o default) + paleta `brand` (acento **lime `#bef264`**, `success/warning/danger/accent`). Disciplina alta: **0** hex arbitrário, **0** uso de `slate-*` fora do sistema (o bug histórico do `PlateCalculator` foi resolvido). 
- ⚠️ **Comentários de contraste imprecisos:** o config anota `zinc-500` como "4.6:1" e `zinc-600` como "~4.0:1"; a medição real é 6.91:1 e 5.33:1. Os valores reais são melhores e passam AA — mas o comentário enganoso deve ser corrigido para não induzir alguém a "consertar" o que não está quebrado.

### 3.2 Tipografia
`Inter` (sans/heading) + `JetBrains Mono` (dados). Escala semântica `fontSize` existe e foi criada **explicitamente** para eliminar `text-[10px]/[11px]` ad-hoc.
- 🔴 **Adoção falhou:** 356 ocorrências de `text-[Npx]`. A escala existe e quase não é usada.
- ⚠️ **`heading` aponta para Inter**, embora a marca documente "Outfit". Decisão pendente (§9).

### 3.3 Espaçamento, raio, sombra, z-index
- `spacing` (`card/section/page`), `borderRadius` (`control/card/sheet`), `boxShadow` (`card/card-hover/nav`) — bem definidos. Raio real 8–24px (moderno, arredondado), **não** os "4px brutalistas" do README.
- 🟡 `z-index` semântico existe, mas **25** usos de `z-[N]` literais o contornam (inclusive no `App.tsx`: `z-[200]`, `z-50`). Risco de conflito de empilhamento.

### 3.4 Motion
`useMotion` (wrapper de `useReducedMotion`) + bloco CSS `@media (prefers-reduced-motion)`.
- 🔴 **Cobertura mínima:** 64 arquivos animam com Framer Motion; só **3** consultam `useMotion`. Como Framer anima via JS/WAAPI, o CSS de reduced-motion **não** os silencia. Transições de aba, splash, modais e listas continuam rodando para quem pediu menos movimento.

### 3.5 Componentes atômicos (`src/components/ui/`)
- ✅ `Button.tsx`: 4 variantes, 3 tamanhos, `focus-visible:ring-2 ring-offset`, `active:scale`, `disabled`, `aria-busy`, tokens (`text-label`, `rounded-control`). **Referência de qualidade.**
- ✅ `EmptyState.tsx`: segue a "lei impeccable" (não embrulhar em card), caixa tracejada, ciente de motion.
- 🔴 **Subutilizados:** apenas 5 `<Button>` vs 36 `<button>` crus + a classe CSS `.btn-primary`. Três caminhos para a mesma coisa = estados de foco/hover/disabled inconsistentes e alvos de toque variáveis.

---

## 4. Crítica por dimensão (framework /design-critique)

### Primeira impressão (2 segundos)
Identidade clara e diferenciada: lime sobre quase-preto, números em mono — comunica "ferramenta de precisão". O risco é a densidade e a tipografia minúscula reduzirem a legibilidade no primeiro olhar, sobretudo na academia (tela com brilho, suor, pressa).

### Usabilidade
| Achado | Severidade | Recomendação |
|---|---|---|
| Botões crus sem foco/área consistentes (36×) | 🔴 Crítico | Padronizar via `<Button>`; garante foco-visível e hit area |
| Alvos de toque pequenos (`Button sm`=32px, `md`=40px) < 44px | 🟡 Moderado | Subir mínimos de toque para 44px ou reservar `sm` a contextos de baixo risco |
| `user-select: none` global bloqueia copiar dados (pesos, notas) | 🟡 Moderado | Permitir seleção em texto de dados/notas |
| Analytics/Biblioteca escondidos (ver roadmap de produto) | 🟡 Moderado | Promover descoberta (cross-ref `IMPROVEMENTS-PRODUCT-UX`) |

### Hierarquia visual
- **O que puxa o olhar:** o acento lime — usá-lo com parcimônia (1 ação primária por tela) para não diluir.
- **Tipografia minúscula** (`text-[10px]` em massa) achata a hierarquia: legenda e corpo viram quase o mesmo tamanho. Adotar a escala (`caption` vs `body` vs `h*`) recria os degraus.
- **Mono para números** está correto — reforça a leitura de dados; manter consistente em toda métrica.

### Consistência
| Elemento | Inconsistência | Recomendação |
|---|---|---|
| Tipografia | 356 `text-[Npx]` vs escala semântica | Migrar para `text-caption/label/body/h*` |
| Botões | `<Button>` × `<button>` × `.btn-primary` | Um componente único |
| Z-index | 25 `z-[N]` literais | `z-modal/z-toast/z-overlay/...` |
| Motion | 3/64 arquivos respeitam reduced-motion | Helper de variants central |

### Acessibilidade
- **Contraste:** ✅ passa AA (medido em §1/§3.1). 
- **Foco:** ✅ no `Button`; 🔴 ausente nos botões crus.
- **Alvos de toque:** 🟡 abaixo de 44px em `sm/md` e em vários botões crus.
- **Legibilidade:** 🟡 proliferação de 10px; mínimo prático recomendado 11–12px para rótulos e 13–14px para corpo.
- **Movimento:** 🔴 não respeitado em JS (ver §3.4).

### O que funciona bem
- Sistema de tokens semântico e abrangente; disciplina de cor (0 hex/slate fora do sistema).
- `Button`/`EmptyState` como referências; `useFocusTrap`; inputs 16px; tema OLED; safe-areas.

### Recomendações prioritárias
1. **Adotar a escala tipográfica** (elimina 356 valores mágicos e restaura hierarquia).
2. **Consolidar o botão** (consistência + acessibilidade num golpe).
3. **Governar o movimento** (respeitar `prefers-reduced-motion` de verdade).

---

## 5. Lacunas de adoção (o trabalho concreto, medido)

| Métrica | Hoje | Meta |
|---|---:|---:|
| `text-[Npx]` ad-hoc | 356 | → 0 (escala semântica) |
| `<Button>` vs `<button>` cru | 5 / 36 | → ~todos via `<Button>` |
| Arquivos motion que respeitam reduced-motion | 3 / 64 | → 100% das animações relevantes |
| `z-[N]` literais | 25 | → 0 (escala `z-*`) |
| Hex arbitrário / `slate-*` | 0 / 0 | manter 0 |

---

## 6. Recomendações de sistema (tokens & governança)

### 6.1 Tipografia — antes/depois
```tsx
// ❌ antes
<span className="text-[10px] font-bold uppercase text-zinc-500">Volume</span>
<div className="text-[13px] text-zinc-300">{nota}</div>
// ✅ depois
<span className="text-caption-xs font-bold uppercase text-zinc-500">Volume</span>
<div className="text-body-sm text-zinc-300">{nota}</div>
```
Mapa de migração: `[9–10px]→caption-xs` · `[11px]→caption` · `[12px]→label` · `[13px]→body-sm` · `[14px]→body` · `[16px]→body-lg`. Pode ser semi-automatizado com `sed`/codemod e revisão.

### 6.2 Botão — consolidar
Substituir `<button>` crus e `.btn-primary` pelo `<Button>`. Para casos especiais (ícone puro) usar o `IconButton` já existente. Remover a classe `.btn-primary` do `index.css` após a migração para não haver um 2º caminho.

### 6.3 Movimento — governar
Centralizar variants e gatear por `useMotion`:
```tsx
// hook já existe: const { shouldReduceMotion } = useMotion();
// envolver a árvore em <MotionConfig reducedMotion="user"> no main.tsx
```
Adotar `<MotionConfig reducedMotion="user">` em `src/main.tsx` resolve a maioria dos casos de uma vez (Framer passa a respeitar a preferência globalmente), e usar `useMotion` nos efeitos manuais (loops, autoplay).

### 6.4 Z-index — usar a escala
`z-[200]→z-toast` · `z-50→z-dropdown/z-modal` conforme o papel. Lint simples pode barrar `z-[`.

### 6.5 Governança (impede regressão)
- Adicionar ESLint + regra/`grep` de CI que falhe em `text-[\d+px]`, `z-[\d`, hex arbitrário e `<button ` fora de `ui/`.
- "Definition of Done de design" (ver §10) no template de PR.

---

## 7. Diretrizes de componentes

- **Estados completos** sempre: default, hover, active, focus-visible, disabled, loading, empty, error. O `Button` já é o modelo.
- **Alvo de toque ≥ 44×44px** para qualquer ação primária; `sm` só para ações densas/secundárias.
- **Densidade:** usar `spacing` tokens; mínimo de 8px entre elementos toques; 16–24px entre seções.
- **Cards:** usar `.card`/`rounded-card`; não aninhar card em card (regra impeccable). EmptyState nunca dentro de card.
- **Inputs:** manter 16px base; foco com `ring-brand-primary` (já no CSS). No modo "academia" (roadmap C-03), steppers grandes.
- **Seleção de texto:** liberar `user-select` em dados/notas que o usuário pode querer copiar.

---

## 8. Motion & micro-interações

- **Propósito:** entrada de tela (orientação direcional — já feito no `App.tsx`), feedback de toque (`active:scale`), celebração de PR (`PRCelebration`). Evitar animação puramente decorativa em loop.
- **Performance:** manter `transform/opacity` (GPU) — a classe `.gpu-accelerated` e `will-change` já existem; não animar `width/height/top/left`.
- **Reduced-motion:** §6.3. Loops (ex.: ícone flutuante do `EmptyState`) já checam `shouldReduceMotion` — replicar esse padrão.
- **Duração:** micro-interações 120–200ms; transições de tela 200–300ms (consistente com o que já há).

---

## 9. UX copy, i18n e marca

- **i18n primeiro:** nenhuma string nova hardcoded (o onboarding em inglês é o caso aberto — ver `EXECUTION-PLAN` A-01). Copy via `t()`.
- **Tom:** "preciso e encorajador" — verbos de ação curtos ("Iniciar", "Registrar", "Finalizar"), números sem floreio. Estados vazios com 1 CTA claro.
- **Reconciliar a marca (decisão necessária):** o sistema real (lime `#bef264`, raio 8–24px, Inter) é coerente e moderno. Recomendo **atualizar `PRODUCT.md`/`README`** para descrever o que existe — em vez de perseguir "4px brutalista + Outfit + acento branco" que nunca foi construído. Se a intenção de marca for mesmo Outfit/4px, então é decisão de redesign explícita, não um ajuste de copy. Escolher um dos dois e alinhar tudo.

---

## 10. Plano de adoção (faseado, sem big-bang)

> Ordenado por impacto/risco. Cada fase é um conjunto de PRs pequenos com a "Definition of Done de design".

**Fase D1 — Fundação invisível (rápida, baixo risco)**
- D1-1 `[S]` Corrigir comentários de contraste no `tailwind.config.js`.
- D1-2 `[S]` `<MotionConfig reducedMotion="user">` no `main.tsx` (resolve a maior parte do §3.4).
- D1-3 `[S]` Substituir `z-[N]` literais pela escala (25 ocorrências).
- D1-4 `[XS]` Liberar `user-select` em dados/notas.

**Fase D2 — Consistência estrutural (médio)**
- D2-1 `[M]` Migrar `text-[Npx]` → escala semântica (codemod + revisão).
- D2-2 `[M]` Consolidar botões em `<Button>`/`IconButton`; remover `.btn-primary`.
- D2-3 `[S]` Auditar alvos de toque < 44px nas ações primárias.

**Fase D3 — Governança (trava a regressão)**
- D3-1 `[S]` ESLint + checagem de CI (text-[px], z-[, hex, `<button>` fora de `ui/`).
- D3-2 `[S]` Atualizar `PRODUCT.md`/`README` para refletir o sistema real (§9).
- D3-3 `[S]` Adicionar a "Definition of Done de design" ao template de PR.

**Fase D4 — Polimento perceptível (contínuo)**
- Auditoria fina de hierarquia tela a tela (densidade, ênfase única por tela), micro-interações com propósito, modo "academia" (toque grande), revisão de copy dos estados vazios.

### Definition of Done de design (todo PR de UI)
1. Sem valor mágico: nada de `text-[px]`, `z-[N]`, hex arbitrário, raio literal.
2. Ações via `<Button>`/`IconButton`; foco-visível presente; alvo ≥ 44px (primárias).
3. Animações respeitam `prefers-reduced-motion`.
4. Texto via `t()` (en + pt-BR, `parity.test.ts` verde).
5. Contraste AA mantido; menor texto ≥ 11px.
6. Testado em mobile (`max-w-lg`) e nos dois idiomas.

---

## Apêndice — comandos de verificação (medições deste documento)

```bash
grep -rEo "text-\[[0-9]+px\]" src --include="*.tsx" | wc -l          # 356
grep -rEc "<Button[ />]" src --include="*.tsx" | awk -F: '{s+=$2}END{print s}'  # 5
grep -rEc "<button[ >]"  src --include="*.tsx" | awk -F: '{s+=$2}END{print s}'  # 36
grep -rl "from 'framer-motion'" src --include="*.tsx" | wc -l        # 64
grep -rl "useMotion\|shouldReduceMotion" src --include="*.tsx" | wc -l # 3
grep -rEo "z-\[[0-9]+\]" src --include="*.tsx" | wc -l               # 25
grep -rEo "(text|bg|border)-\[#[0-9a-fA-F]{3,6}\]" src --include="*.tsx" | wc -l # 0
```

*Contraste medido pela fórmula WCAG 2.1 (luminância relativa). Os pares-chave passam AA; ver §3.1.*
