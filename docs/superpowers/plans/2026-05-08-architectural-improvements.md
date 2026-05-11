# Architectural Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Propor e implementar uma refatoração arquitetural para eliminar os "God Nodes" (`useWorkoutStore` e `cn()`), migrando a base de código para um modelo modular orientado a recursos (Feature-Sliced Design) e separação de estado global.

**Architecture:** 
1. **Desacoplamento de Estado:** Dividir o `useWorkoutStore` (que atualmente centraliza 11 domínios diferentes) em 3 stores independentes (`useUIStore`, `useSessionStore`, `useDataStore`).
2. **Feature-Sliced Design (FSD):** Migrar de uma arquitetura baseada em camadas (`components/`, `hooks/`) para módulos verticais (`features/workouts`, `features/analytics`, `features/exercises`), aumentando a coesão (que o grafo mostrou ser apenas 0.05).
3. **Design System Estrito:** Isolar o utilitário `cn()` puramente dentro de `components/ui/*`. Os módulos de features não devem importar `cn()` diretamente, mas sim consumir os componentes UI padronizados.

**Tech Stack:** React, Zustand, TypeScript, Tailwind CSS

## User Review Required

> [!WARNING]
> A divisão do estado global (`useWorkoutStore`) impactará a persistência atual do IndexedDB (`adaptive-strength-pro-db`). Os dados precisarão de uma migração ou o usuário poderá perder o estado local (histórico e rotinas) se não houver um script de fallback. Devemos criar scripts de migração cuidadosos.

## Open Questions

> [!IMPORTANT]
> 1. Você deseja que a separação do Zustand preserve o mesmo banco no IndexedDB (via persistência parcial) ou prefere quebrar em múltiplos bancos (ex: `tive-ui-db`, `tive-data-db`)?
> 2. Devemos executar este plano de uma vez ou criar uma branch de longo prazo para refatoração faseada, dado que afetará praticamente 80+ arquivos que dependem do `useWorkoutStore`?

---

### Task 1: Decoupling UI State (`useUIStore`)

**Files:**
- Create: `src/store/useUIStore.ts`
- Modify: `src/store/useWorkoutStore.ts:13-25`
- Test: `src/__tests__/store/uiStore.test.ts`

- [ ] **Step 1: Write the failing test for UI Store**

```typescript
import { act, renderHook } from '@testing-library/react-hooks';
import { useUIStore } from '../../src/store/useUIStore';

describe('useUIStore', () => {
  it('should toggle profile modal', () => {
    const { result } = renderHook(() => useUIStore());
    act(() => {
      result.current.setProfileOpen(true);
    });
    expect(result.current.isProfileOpen).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/store/uiStore.test.ts`
Expected: FAIL with "Cannot find module '../../src/store/useUIStore'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/store/useUIStore.ts
import { create } from 'zustand';

interface UIState {
  isProfileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
  // ... migrate other UI states from createUISlice
}

export const useUIStore = create<UIState>((set) => ({
  isProfileOpen: false,
  setProfileOpen: (open) => set({ isProfileOpen: open }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/store/uiStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/useUIStore.ts src/__tests__/store/uiStore.test.ts
git commit -m "refactor(store): extract UI state into useUIStore"
```

### Task 2: Refactor Components to use `useUIStore`

**Files:**
- Modify: `src/components/ProfileModal.tsx:1-50`
- Modify: `src/components/Layout.tsx:1-50`

- [ ] **Step 1: Write failing tests or check build**

Run: `npx tsc --noEmit`
Expected: build succeeds but we know we have to replace the imports.

- [ ] **Step 2: Write minimal implementation for Layout.tsx**

```tsx
// src/components/Layout.tsx
// Remove useWorkoutStore import, use useUIStore
import { useUIStore } from '../store/useUIStore';

export function Layout({ children }: LayoutProps) {
  const setProfileOpen = useUIStore(state => state.setProfileOpen);
  // ...
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ProfileModal.tsx src/components/Layout.tsx
git commit -m "refactor(components): consume useUIStore instead of useWorkoutStore"
```

### Task 3: Isolate `cn()` into Design System (Button Example)

**Files:**
- Create: `src/components/ui/Button.tsx`
- Modify: `src/components/ProfileModal.tsx:50-100`

- [ ] **Step 1: Write minimal implementation**

```tsx
// src/components/ui/Button.tsx
import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors", className)}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
```

- [ ] **Step 2: Refactor feature component to stop using `cn()`**

```tsx
// src/components/ProfileModal.tsx
import { Button } from "./ui/Button"

// Replace raw <button className={cn(...)}> with <Button>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.tsx src/components/ProfileModal.tsx
git commit -m "refactor(ui): create base Button and reduce cn() coupling"
```

### Task 4: Establish Feature-Sliced Design Structure

**Files:**
- Create: `src/features/analytics/index.ts`
- Create: `src/features/workouts/index.ts`

- [ ] **Step 1: Move Analytics components**

```bash
mkdir -p src/features/analytics/components
git mv src/components/analytics/* src/features/analytics/components/
```

- [ ] **Step 2: Export from Feature boundary**

```typescript
// src/features/analytics/index.ts
export { AnalyticsDashboard } from './components/AnalyticsDashboard';
export { VolumeChart } from './components/VolumeChart';
```

- [ ] **Step 3: Commit**

```bash
git add src/features/analytics
git commit -m "refactor(arch): migrate analytics to feature slice"
```

---

*Nota: Esta é uma proposta inicial estrutural. Devido à extensão das mudanças (remoção do God Node), cada etapa precisaria ser feita de forma incremental garantindo que os testes não quebrem a aplicação base.*
