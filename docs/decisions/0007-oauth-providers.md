# ADR 0007 — Google + GitHub OAuth login

- Status: Accepted
- Date: 2026-07-12

## Context

Administrators may prefer to sign in with an existing Google or GitHub account instead of a local password, and the platform roadmap includes broader social/SSO login. We needed a backend-initiated OAuth flow that integrates with the existing JWT auth and RBAC.

## Decision

Implement **OAuth 2.0 Authorization Code** flow for Google and GitHub, initiated by the backend:

- Routes: `GET /auth/oauth/google` and `GET /auth/oauth/github` (redirect to provider) plus `/.../callback` (exchange `code` for profile).
- On callback: `find-or-create` the user by email; if an existing local account shares the email, link the provider (`provider` / `providerId` columns with a compound unique constraint; `passwordHash` is optional).
- Successful OAuth login issues the standard JWT access + refresh pair and redirects to the SPA with tokens (or sets them via the auth context).
- Provider credentials come from `GOOGLE_*` / `GITHUB_*` env vars; callback URLs derive from `API_URL` when not explicitly set.

### TypeScript note

The API `tsconfig` does not include the DOM lib, so the ambient global `Response` collapses to `{}` (lacking `ok`/`json`). `oauth.ts` therefore casts `fetch` results to a local `OAuthHttpResponse` interface to satisfy the type checker.

## Consequences

- **Positive:** Familiar login options; reuses JWT/RBAC; safe account linking by verified email.
- **Negative:** Depends on third-party provider availability and correct redirect-URI configuration; email-verification trust assumes the provider verified the address.
- **Follow-up:** Add MFA/passkeys and enterprise OIDC/SAML as future auth options.
