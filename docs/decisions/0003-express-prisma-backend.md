# ADR 0003 — Express 5 + Prisma 7 backend

- Status: Accepted
- Date: 2026-07-12

## Context

The backend exposes a REST API for the admin dashboard backed by PostgreSQL. We wanted a lightweight, well-understood framework with a type-safe ORM and a clean layered architecture that keeps business logic out of route handlers.

## Decision

- **Express 5** REST API, mounted under `/api/v1`.
- **Prisma 7** ORM with the `prisma-client` generator and the **`PrismaPg`** driver adapter against **Prisma Postgres** (hosted PostgreSQL).
- Layered architecture: `routes` → `services` (business logic) → `repositories` (Prisma queries). Services and repositories are exported as singletons (one Prisma client).
- Centralized middleware: security headers, CORS, JSON body parsing, request logging, Zod validation, 404, and a single error handler returning a consistent envelope (`{ success, data, error }`).
- `AppError` subclasses map to HTTP status + machine-readable error codes.

## Consequences

- **Positive:** Predictable request flow; type-safe DB access; single error envelope simplifies the frontend client; testable layers.
- **Negative:** More boilerplate per resource (route/service/repository); Prisma Client must be regenerated on schema change (`prisma generate` is wired into `prebuild`/`pretypecheck`).
- **Follow-up:** Add unit tests for services/repositories (currently only integration tests exist).
