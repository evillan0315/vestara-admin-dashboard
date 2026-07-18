# Security

> Defense-in-depth security architecture for the Vestara Command Center.

---

## Table of Contents

- [Security Architecture](#security-architecture)
- [Authentication](#authentication)
- [Authorization (RBAC)](#authorization-rbac)
- [Token Management](#token-management)
- [Password Security](#password-security)
- [Rate Limiting](#rate-limiting)
- [Input Validation & Sanitization](#input-validation--sanitization)
- [Cross-Site Request Forgery (CSRF)](#cross-site-request-forgery-csrf)
- [Cross-Site Scripting (XSS)](#cross-site-scripting-xss)
- [Security Headers](#security-headers)
- [Account Lockout](#account-lockout)
- [Audit Trail](#audit-trail)
- [WebSocket Security](#websocket-security)
- [Data Protection](#data-protection)
- [Dependency Security](#dependency-security)

---

## Security Architecture

Vestara employs a **defense-in-depth** strategy with multiple layers of security controls:

```
┌─────────────────────────────────────┐
│         Network Layer               │
│  CORS · TLS (Let's Encrypt)         │
├─────────────────────────────────────┤
│         Transport Layer             │
│  Security Headers (Helmet)          │
├─────────────────────────────────────┤
│         Application Layer           │
│  Rate Limiting · CSRF Protection    │
├─────────────────────────────────────┤
│         Authentication Layer        │
│  JWT · OAuth 2.0 · Account Lockout  │
├─────────────────────────────────────┤
│         Authorization Layer         │
│  RBAC · Org Scoping                │
├─────────────────────────────────────┤
│         Input Layer                 │
│  Zod Validation · Sanitization      │
├─────────────────────────────────────┤
│         Data Layer                  │
│  Bcrypt Hashing · Secret Management │
└─────────────────────────────────────┘
```

---

## Authentication

### JWT Tokens

| Token Type | Lifetime | Storage | Algorithm |
|-----------|----------|---------|-----------|
| Access Token | 15 minutes | Memory / Authorization header | HS256 |
| Refresh Token | 30 days | HttpOnly secure cookie | HS256 |

### Token Rotation

On every `/auth/refresh` call:
1. Verify the refresh token
2. Revoke the old refresh token
3. Create a new refresh token
4. Issue a new access token
5. Return both new tokens

This ensures stolen refresh tokens are single-use.

### OAuth 2.0

Supported providers: **Google** and **GitHub**

**Flow:**
1. Frontend redirects to `/auth/oauth/:provider`
2. Backend redirects to provider's authorization URL
3. User authenticates with provider
4. Provider redirects back to `/auth/oauth/:provider/callback`
5. Backend exchanges code for tokens
6. Backend fetches user info from provider
7. Find-or-create user by email
8. Link provider for existing email accounts
9. Issue JWT tokens
10. Redirect to frontend with tokens

**Compound unique constraint:** `[provider, providerId]` prevents duplicate OAuth accounts.

---

## Authorization (RBAC)

### Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `super_admin` | Full system access | All operations, org management, user management |
| `admin` | Organization admin | User management, settings, reports, system logs |
| `moderator` | Content moderator | Data connectors, reports (read) |
| `support` | Support staff | Dashboard, own profile, chat |

### Enforcement

```typescript
// Middleware
router.get('/users', authenticate, requireRole('super_admin', 'admin'), listUsers);

// Frontend navigation filtering
{ label: 'Users', path: '/users', allowedRoles: ['super_admin', 'admin'] }
```

### Multi-Tenancy

Every resource is scoped to an `organizationId` extracted from the JWT. Users cannot access resources from other organizations, regardless of role.

---

## Token Management

### Access Token Payload

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "admin",
  "organizationId": "org-id",
  "iat": 1700000000,
  "exp": 1700000900
}
```

### Refresh Token Storage

- Stored in `refresh_tokens` table with `userId`, `organizationId`, `expiresAt`
- Revoked on logout or rotation
- Cascading delete on user deletion

### Session Tracking

- Stored in `sessions` table with `ipAddress`, `userAgent`, `lastActivity`
- Used for session management and audit trail

---

## Password Security

### Hashing

- **Algorithm:** bcrypt with 12 rounds
- **Storage:** `passwordHash` field on User model
- **Optional:** OAuth users have `null` passwordHash

### Password Policy

| Rule | Requirement |
|------|-------------|
| Minimum length | 8 characters |
| Maximum length | 128 characters |
| Uppercase letter | Required |
| Lowercase letter | Required |
| Number | Required |
| Symbol | Required |
| Common passwords | Blocked (breach check) |

### Password Strength API

```
POST /auth/password-strength
Body: { "password": "..." }
Response: { "score": 0-4, "feedback": ["..."] }
```

Score: 0 = very weak, 1 = weak, 2 = fair, 3 = strong, 4 = very strong.

---

## Rate Limiting

| Endpoint | Window | Limit | Behavior |
|----------|--------|-------|----------|
| Auth (login/register) | 15 min | 5 requests | Counts only failures; resets on success |
| General API | 1 min | 100 requests | Per authenticated user |
| Health check | 1 min | 10 requests | Permissive |
| WebSocket | 1 min | 10 connections | Per IP |

### Implementation

- `express-rate-limit` with memory store
- Disabled under `NODE_ENV=test` for test suites
- Trust proxy enabled for Nginx reverse proxy (`app.set('trust proxy', 1)`)

---

## Input Validation & Sanitization

### Zod Validation

All request bodies, params, and queries are validated against Zod schemas:

```typescript
const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['super_admin', 'admin', 'moderator', 'support']),
});
```

### Input Sanitization

The `sanitizeInput` middleware recursively strips:
- Control characters (ASCII 0-31, except newlines/tabs)
- `<script>...</script>` blocks
- Inline event-handler attributes (`onclick=`, `onerror=`, `onload=`, etc.)
- `javascript:` URIs

Applied to `req.body`, `req.query`, and `req.params` after Zod validation.

### NoSQL/Prototype Pollution Guards

`isSafeQueryValue` blocks:
- MongoDB operators (`$where`, `$gt`, `$regex`, etc.)
- Prototype pollution keys (`__proto__`, `constructor`, `prototype`)

---

## Cross-Site Request Forgery (CSRF)

The `csrfProtection` middleware:

- Applies to state-changing methods: `POST`, `PUT`, `PATCH`, `DELETE`
- Checks `Origin` header against allowed origins list
- Allows: configured SPA origins, `.vercel.app` deployments
- Read-only methods (`GET`, `HEAD`, `OPTIONS`) pass through

---

## Cross-Site Scripting (XSS)

### Content Security Policy (CSP)

```
script-src 'self'
style-src 'self' 'unsafe-inline'  (required for MUI/Swagger)
img-src 'self' data: blob:  (production: restricted)
frame-src 'none'
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
upgrade-insecure-requests  (production only)
```

### Additional XSS Protections

- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, microphone, geolocation, etc.

---

## Security Headers

Applied via Helmet middleware:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | See above | Prevents XSS, code injection |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS (production) |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer info |
| `Permissions-Policy` | `camera=(), microphone=(), ...` | Disables features |

---

## Account Lockout

After **5 consecutive failed login attempts**:
- Account is locked for **30 minutes**
- `failedLoginAttempts` counter incremented on each failure
- `lockedUntil` timestamp set on lockout
- Counter resets on successful login
- Lockout check prevents timing-based password enumeration
- Returns `ACCOUNT_LOCKED` error code to client

---

## Audit Trail

Every critical action is logged to the `AuditLog` table:

| Field | Purpose |
|-------|---------|
| `action` | What happened (e.g., `USER_CREATED`, `LOGIN`, `SETTINGS_UPDATED`) |
| `entity` | What was affected (e.g., `user`, `settings`, `api`) |
| `entityId` | ID of the affected resource |
| `userId` | Who performed the action |
| `organizationId` | Which organization |
| `metadata` | Additional context (JSON) |
| `ipAddress` | Client IP address |
| `userAgent` | Client user agent |
| `createdAt` | When it happened |

### Audit Events

Auth: `LOGIN`, `LOGOUT`, `REGISTER`, `OAUTH_LOGIN`
Users: `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `USER_STATUS_CHANGED`, `BULK_USER_DELETE`, `BULK_STATUS_CHANGE`
Settings: `SETTINGS_UPDATED`, `SETTINGS_CREATED`, `SETTINGS_DELETED`, `SETTINGS_IMPORT`
Files: `FILE_UPLOADED`, `FILE_DELETED`, `FILE_RENAMED`, `FILE_MOVED`
Reports: `REPORT_GENERATED`, `REPORT_DOWNLOADED`, `REPORT_DELETED`
AI: `CHAT_CONVERSATION_CREATED`, `CHAT_MESSAGE_SENT`
Integrations: `DATA_SOURCE_CREATE`, `DATA_SOURCE_UPDATE`, `DATA_SOURCE_DELETE`, `DATA_SOURCE_FETCH`
System: `ERROR` (API errors with status, code, method, path, stack for 5xx)

---

## WebSocket Security

- JWT authentication via query-param token on connect
- Token verified through `JwtService`
- Org-scoped rooms prevent cross-tenant data leakage
- Rate limiting: 10 connection attempts per IP per minute
- Heartbeat liveness probe (30s interval)
- Graceful degradation on Vercel (broadcasts become no-ops)

---

## Data Protection

### Secrets

- JWT secrets: strong random values (`openssl rand -hex 64`)
- OAuth secrets: stored in environment variables, never committed
- Data source auth configs: stored server-side, masked in DTOs (`****`)

### Database

- PostgreSQL with SSL mode required
- Prisma Postgres (hosted, managed backups)
- Org-scoped queries prevent cross-tenant data access

### File Uploads

- Multer middleware with file type validation
- 5MB limit for images, 100MB for general files
- Signed download URLs for secure file access

---

## Dependency Security

### Current Measures

- `pnpm audit` for vulnerability scanning
- GitHub Dependabot alerts
- Regular dependency updates

### Recommended

- Automated CI/CD dependency scanning
- Snyk or Socket.dev integration
- License compliance checking
