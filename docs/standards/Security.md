# Security Standards

> Security practices and requirements for the Vestara ecosystem.

---

## Principles

### 1. Defense in Depth

Multiple layers of security controls. No single point of failure.

### 2. Least Privilege

Users and services get only the minimum permissions needed.

### 3. Secure by Default

Secure configurations are the default. Users must opt-in to less secure options.

### 4. Zero Trust

Never trust, always verify. Every request is authenticated and authorized.

---

## Authentication

### JWT Tokens

| Requirement | Standard |
|------------|---------|
| Algorithm | HS256 (symmetric) |
| Access token lifetime | 15 minutes |
| Refresh token lifetime | 30 days |
| Secret strength | 64+ hex characters (`openssl rand -hex 64`) |
| Token rotation | Required on every refresh |
| Secret storage | Environment variables, never in code |

### Passwords

| Requirement | Standard |
|------------|---------|
| Minimum length | 8 characters |
| Maximum length | 128 characters |
| Character classes | Upper + lower + number + symbol |
| Hashing | bcrypt, 12 rounds |
| Common password blocklist | Yes (breach check) |
| Password history | Not enforced (yet) |

### OAuth

- Use Authorization Code flow (never Implicit)
- Validate state parameter
- Verify token with provider
- Link existing accounts by email
- Store provider-specific IDs securely

---

## Authorization

### RBAC

| Role | Access Level |
|------|-------------|
| `super_admin` | Full system access |
| `admin` | Organization admin |
| `moderator` | Limited admin |
| `support` | Basic access |

### Enforcement

- Backend: `requireRole()` middleware on every protected route
- Frontend: `allowedRoles` on navigation items (UI only — backend is authoritative)
- Repository: `organizationId` scoping on every query

---

## Input Validation

### Zod Schemas

- Validate **all** request inputs (body, params, query)
- Use strict validation (no implicit coercion)
- Return field-level error messages
- Share schemas between frontend and backend

### Sanitization

After Zod validation, sanitize:
- Control characters (except newline/tab)
- `<script>` blocks
- Inline event handlers (`onclick=`, etc.)
- `javascript:` URIs
- SQL/NoSQL injection patterns

---

## Rate Limiting

| Endpoint | Limit | Window | Behavior |
|----------|-------|--------|----------|
| Auth (login/register) | 5 requests | 15 min | Count failures only |
| General API | 100 requests | 1 min | Per user |
| Health check | 10 requests | 1 min | Permissive |
| WebSocket | 10 connections | 1 min | Per IP |

### Implementation

- Use `express-rate-limit` with memory store
- Trust proxy for reverse proxy deployments
- Disable in test environment

---

## CSRF Protection

- Apply to state-changing methods: POST, PUT, PATCH, DELETE
- Check `Origin` header against allowlist
- Allow configured SPA origins
- Read-only methods pass through

---

## XSS Prevention

### Content Security Policy

```
script-src 'self'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob:
frame-src 'none'
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
upgrade-insecure-requests (production)
```

### Additional Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (disable camera, mic, geolocation)

---

## Account Lockout

| Setting | Value |
|---------|-------|
| Failed attempts threshold | 5 |
| Lockout duration | 30 minutes |
| Reset condition | Successful login |
| Counter field | `failedLoginAttempts` |
| Lockout field | `lockedUntil` |
| Error code | `ACCOUNT_LOCKED` |

---

## Data Protection

### Secrets Management

- JWT secrets: environment variables only
- OAuth secrets: environment variables only
- Database URL: environment variables only
- API keys: environment variables only
- Never commit secrets to version control
- Use `.env.example` (without values) for documentation

### Sensitive Data

- Passwords: bcrypt hashed, never logged
- Tokens: HttpOnly secure cookies for refresh tokens
- API keys: masked in DTOs (`****`)
- PII: org-scoped, access-controlled

### Database

- PostgreSQL with SSL mode required
- Regular backups (Prisma Postgres managed)
- Org-scoped queries prevent cross-tenant access
- Cascade deletes for related data

---

## File Upload Security

| Rule | Value |
|------|-------|
| Image size limit | 5 MB |
| General file limit | 100 MB |
| Allowed image types | JPEG, PNG, WebP, SVG |
| Storage | Server-side (LOCAL, Cloudinary, S3, Google Drive) |
| Download | Signed URLs |
| Validation | MIME type + file extension check |

---

## WebSocket Security

- JWT authentication on connect (query-param token)
- Org-scoped rooms prevent cross-tenant data
- Rate limiting: 10 connections/min/IP
- Heartbeat liveness: 30s interval
- Graceful degradation when unavailable

---

## Audit Trail

Every critical action logged with:

| Field | Required |
|-------|----------|
| `action` | Yes |
| `entity` | Yes |
| `entityId` | Yes |
| `userId` | Yes |
| `organizationId` | Yes |
| `metadata` | Optional (JSON) |
| `ipAddress` | Yes |
| `userAgent` | Yes |
| `createdAt` | Yes (auto) |

### What to Audit

- Authentication events (login, logout, register, OAuth)
- User CRUD (create, update, delete, status change)
- Settings changes (create, update, delete, import)
- File operations (upload, delete, move)
- Report generation and download
- Data source operations
- AI chat interactions
- API errors (5xx)

---

## Dependency Security

### Requirements

- Run `pnpm audit` before deployment
- Address critical/high vulnerabilities immediately
- Review Dependabot alerts weekly
- Pin dependency versions in lockfile

### CI/CD Integration

- Automated vulnerability scanning on PR
- Block merges on critical vulnerabilities
- Regular dependency updates (monthly)

---

## Incident Response

### When a Security Issue Is Found

1. **Assess** — Determine severity and impact
2. **Contain** — Limit the damage (revoke tokens, block IPs)
3. **Eradicate** — Fix the vulnerability
4. **Recover** — Restore normal operations
5. **Document** — Write incident report
6. **Improve** — Add controls to prevent recurrence

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Data breach, authentication bypass | Immediate |
| High | Privilege escalation, XSS | 24 hours |
| Medium | Rate limiting bypass, info disclosure | 1 week |
| Low | Minor issues, hardening opportunities | 1 month |
