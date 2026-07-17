# Architecture Decision Records (ADRs)

This directory captures the significant architecture and technology decisions made for the Vestara Admin Dashboard. Each decision is recorded as a short, immutable document so future contributors understand _why_ the system is shaped the way it is.

## Status Conventions

- **Accepted** — decided and implemented.
- **Proposed** — under consideration.
- **Superseded** — replaced by a newer ADR (link provided).

## Index

| ID                                          | Title                                           | Status   |
| ------------------------------------------- | ----------------------------------------------- | -------- |
| [0001](./0001-monorepo-pnpm-turbo.md)       | Monorepo with pnpm workspaces + Turborepo       | Accepted |
| [0002](./0002-react-mui-frontend.md)        | React 19 + Material UI v7 frontend              | Accepted |
| [0003](./0003-express-prisma-backend.md)    | Express 5 + Prisma 7 backend                    | Accepted |
| [0004](./0004-jwt-auth-refresh-rotation.md) | JWT auth with refresh-token rotation            | Accepted |
| [0005](./0005-vercel-deployment.md)         | Vercel deployment (API serverless + static web) | Accepted |
| [0006](./0006-zod-validation.md)            | Zod for shared validation schemas               | Accepted |
| [0007](./0007-oauth-providers.md)           | Google + GitHub OAuth login                     | Accepted |

## How to add a new ADR

1. Copy the format below into a new file `NNNN-short-title.md` (next sequential number).
2. Add a row to the index table above.
3. Keep it factual: context, decision, consequences. Do not revise history — if a decision changes, mark the old one **Superseded** and write a new ADR.

```md
# ADR NNNN — Title

- Status: Accepted | Proposed | Superseded by [NNNN](./NNNN-...md)
- Date: YYYY-MM-DD

## Context

What problem are we solving, and what constraints exist?

## Decision

What we decided to do.

## Consequences

Positive and negative trade-offs, and any follow-up work.
```
