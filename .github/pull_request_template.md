## Description
Please describe your changes here.

## Design & UI Definition of Done (DoD)
Before submitting this PR, please check off the following to ensure it meets our design governance standards:

- [ ] **No magic values:** I am not using `text-[px]`, `z-[N]`, arbitrary hex colors, or literal border radii.
- [ ] **Components:** All text/action buttons use `<Button>` or `<IconButton>`.
- [ ] **Hit Areas:** Primary actions have a touch target of ≥ 44px (`size="lg"` or padded `md`).
- [ ] **Accessibility:** All clickable elements have a visible focus ring (`focus-visible`) and tactile feedback (`active:scale` or `.tap`).
- [ ] **Motion:** Animations respect `prefers-reduced-motion` natively (via `MotionConfig` or CSS).
- [ ] **i18n:** All UI text uses the `t()` function (no hardcoded English/Portuguese).
- [ ] **Contrast:** Text maintains WCAG AA contrast (smallest text ≥ 10px).
- [ ] **Responsive:** The UI has been tested on mobile views (`max-w-lg`).
