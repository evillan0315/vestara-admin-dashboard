# ADR 0006 — Zod for shared validation schemas

- Status: Accepted
- Date: 2026-07-12

## Context

Validation must run in two places with identical rules: the Express API (request bodies/query) and the React forms (client-side). Duplicating rules by hand risks drift between client and server.

## Decision

Use **Zod** as the single validation source:

- Schemas live in `@vestara/validation` (shared package) where they apply to both tiers, or inline under `apps/api/src/routes` for resource-local rules.
- Backend: the `validate(schema)` middleware runs Zod and, on failure, throws `ValidationError` (HTTP 422) with per-field `details`.
- Frontend: React Hook Form uses `@hookform/resolvers/zod` to reuse the same schemas for inline form errors.

Primitive coercion (`z.coerce.number()`) is used for query params that arrive as strings.

## Consequences

- **Positive:** One schema, two consumers; type inference flows into TypeScript types; consistent error shapes.
- **Negative:** Shared schemas must avoid browser-only or node-only imports to stay isomorphic; very large schemas can be verbose.
- **Follow-up:** Keep shared schemas free of environment-specific code so they import cleanly in both Vite and Node.
