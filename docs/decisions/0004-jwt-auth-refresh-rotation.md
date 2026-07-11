# ADR 0004 — JWT auth with refresh-token rotation

- Status: Accepted
- Date: 2026-07-12

## Context

The admin dashboard needs secure, stateless authentication with a good UX (users stay logged in) without long-lived access tokens that are risky if leaked. We also need role-based access control for admin functions.

## Decision

- **JWT access tokens** (short-lived, default `15m`) sent in the `Authorization: Bearer` header.
- **JWT refresh tokens** (long-lived, default `30d`) used to obtain new token pairs via `POST /auth/refresh`.
- **Refresh-token rotation**: each refresh issues a new refresh token and revokes the previous one, mitigating replay of a leaked refresh token. The `RefreshToken` table stores issued tokens; rotation must insert the new token without colliding with the old one (a duplicate-insert bug was fixed in `auth.service.ts`).
- **RBAC** via `authenticate` (decodes JWT, attaches `req.user`) and `requireRole(...)` middleware (e.g. `requireRole('super_admin')`).
- Passwords hashed with **bcryptjs**. Critical actions are written to the `AuditLog` table.

## Consequences

- **Positive:** Stateless, scalable auth; limited blast radius for leaked access tokens; rotation limits refresh-token theft; clear role enforcement.
- **Negative:** No built-in revocation list beyond the refresh-token table; clock-skew/secret-rotation requires care; MFA/SSO deferred to future phases.
- **Follow-up:** Consider short-lived refresh tokens or a server-side denylist for immediate revocation.
