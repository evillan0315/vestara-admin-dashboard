# ADR 0001 — Monorepo with pnpm workspaces + Turborepo

- Status: Accepted
- Date: 2026-07-12

## Context

The Vestara Admin Dashboard spans a React frontend, an Express backend, and several pieces of logic (types, validation, constants, utilities, config) that must be shared identically between them. We needed a structure that avoids duplicated code and version drift while keeping independent deployable units.

## Decision

Use a **pnpm workspace monorepo** orchestrated by **Turborepo**:

- `apps/web` (`@vestara/web`) — React 19 frontend.
- `apps/api` (`@vestara/api`) — Express 5 backend.
- `packages/*` (`@vestara/types`, `@vestara/validation`, `@vestara/constants`, `@vestara/utils`, `@vestara/config`) — shared libraries linked with `workspace:*` and resolved by both `tsconfig.json` `paths` and Vite aliases.

Turborepo's task graph (`dev`, `build`, `typecheck`, `lint`, `test`) runs dependent packages first (`dependsOn: ["^build"]`).

## Consequences

- **Positive:** Single source of truth for types/validation; atomic cross-cutting changes; fast incremental builds via Turborepo caching; independent deploy targets.
- **Negative:** Slightly heavier tooling and a learning curve for contributors unfamiliar with monorepos; workspace linking must be understood to resolve "module not found" issues.
- **Follow-up:** Keep shared packages narrow and dependency-free from app code to preserve build order.
