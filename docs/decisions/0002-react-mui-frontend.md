# ADR 0002 — React 19 + Material UI v7 frontend

- Status: Accepted
- Date: 2026-07-12

## Context

The admin dashboard requires a premium, responsive, themeable UI delivered quickly by a small team. We needed a component library that provides accessibility, theming, and design consistency out of the box, paired with a modern, fast build toolchain.

## Decision

- **React 19** with **Vite 6** for dev server and production bundling.
- **Material UI v7** as the primary component library, themed with a custom gold/dark "Elite" theme (`apps/web/src/styles/theme.ts` + `apps/web/src/theme/tokens.ts`).
- **Tailwind CSS v4** (via `@tailwindcss/vite`) for utility styling layered on top of MUI.
- **React Router v7** for routing, **TanStack Query v5** for server state, **React Hook Form + Zod** for forms, **lucide-react** for icons.

State is split: server state via TanStack Query; auth/session via `AuthContext`; local UI state via React hooks/context.

## Consequences

- **Positive:** Rapid development with accessible, consistent components; strong theming; fast HMR; type-safe forms.
- **Negative:** MUI + Tailwind can conflict on class specificity; bundle size is large (code-splitting/perf work tracked in Phase 26).
- **Follow-up:** Introduce route-based lazy loading and `manualChunks` to address the >500 kB bundle warning.
