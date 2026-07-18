# Backend Guide

> Express 5, Prisma 7, layered architecture, and the Vestara API.

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Request Lifecycle](#request-lifecycle)
- [Middleware](#middleware)
- [Routes](#routes)
- [Services](#services)
- [Repositories](#repositories)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)
- [Audit Logging](#audit-logging)
- [WebSocket](#websocket)
- [Testing](#testing)

---

## Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Express | 5 | HTTP framework |
| TypeScript | strict | Type safety |
| Prisma | 7 | ORM (PrismaPostgres adapter) |
| PostgreSQL | 17 | Primary database |
| Redis | 8 | Cache & sessions (optional) |
| JWT | — | Authentication |
| Zod | — | Request validation |
| Pino | — | Structured logging |
| Helmet | — | Security headers |
| Multer | — | File upload handling |
| bcrypt | — | Password hashing |

---

## Project Structure

```
apps/api/src/
├── config/
│   └── index.ts              # Environment variable loading and validation
├── generated/
│   └── prisma/               # Auto-generated Prisma Client
├── middleware/
│   ├── authenticate.ts       # JWT decode + req.user attachment
│   ├── authorize.ts          # requireRole() RBAC middleware
│   ├── csrf.ts               # CSRF/origin verification
│   ├── errorHandler.ts       # Global error handler
│   ├── rateLimiter.ts        # Rate limiting (auth, API, health)
│   ├── request-logger.ts     # Pino HTTP request logging
│   ├── requestId.ts          # X-Request-Id UUID header
│   ├── sanitize.ts           # Input sanitization (XSS defense)
│   └── validate.ts           # Zod schema validation
├── repositories/
│   ├── user.repository.ts
│   ├── settings.repository.ts
│   ├── audit-log.repository.ts
│   ├── session.repository.ts
│   ├── refresh-token.repository.ts
│   ├── file.repository.ts
│   ├── report.repository.ts
│   ├── chat.repository.ts
│   └── data-source.repository.ts
├── routes/
│   ├── auth.ts
│   ├── users.ts
│   ├── settings.ts
│   ├── audit-logs.ts
│   ├── profile.ts
│   ├── files.ts
│   ├── reports.ts
│   ├── chat.ts
│   ├── integrations.ts
│   ├── metrics.ts
│   ├── health.ts
│   └── index.ts              # Mounts all routes under /api/v1
├── services/
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── settings.service.ts
│   ├── audit-log.service.ts
│   ├── profile.service.ts
│   ├── file.service.ts
│   ├── report.service.ts
│   ├── chat.service.ts
│   ├── context-builder.ts    # RAG context assembly
│   └── integrations/
│       ├── agent.service.ts
│       ├── analyzer.ts
│       └── http-client.ts
├── utils/
│   └── metrics.ts            # System health metrics
├── websocket/
│   └── WebSocketManager.ts   # WebSocket server with auth + org rooms
├── types/
│   └── express.d.ts          # Express Request type augmentation
├── lib/
│   └── prisma.ts             # Prisma Client singleton
└── index.ts                  # Server entry point
```

---

## Request Lifecycle

```
1. Incoming HTTP Request
2. CORS check (allowed origins)
3. Security headers (Helmet: CSP, HSTS, X-Content-Type-Options)
4. Body parsing (JSON + URL-encoded, 1MB limit)
5. Request ID (X-Request-Id UUID)
6. Request logging (Pino: method, path, status, latency)
7. Rate limiting (auth: 5/15m, API: 100/min)
8. CSRF/origin verification (POST/PUT/PATCH/DELETE)
9. Input sanitization (strip control chars, <script>, event handlers)
10. JWT authentication (decode token → attach req.user)
11. Role-based access control (requireRole)
12. Zod validation (body, params, query)
13. Route handler → Service → Repository → Prisma → PostgreSQL
14. Audit logging (critical actions)
15. WebSocket broadcast (audit:created events)
16. Standardized response { success, data, error, meta }
```

---

## Middleware

### Authentication (`authenticate.ts`)

Decodes JWT from `Authorization: Bearer <token>` header. Attaches `req.user` with `id`, `email`, `role`, `organizationId`.

### Authorization (`authorize.ts`)

```typescript
requireRole('super_admin')           // Single role
requireRole('super_admin', 'admin')  // Multiple roles (OR)
```

### Rate Limiting (`rateLimiter.ts`)

| Limiter | Window | Limit | Purpose |
|---------|--------|-------|---------|
| Auth | 15 min | 5 requests | Login/register (counts failures only) |
| API | 1 min | 100 requests | General API |
| Health | 1 min | 10 requests | Health check endpoint |
| WebSocket | 1 min | 10 connections | WS connection attempts per IP |

### Input Sanitization (`sanitize.ts`)

Recursively strips from `req.body`, `query`, `params`:
- Control characters
- `<script>` blocks
- Inline event-handler attributes (`onclick=`, `onerror=`, etc.)
- `javascript:` URIs

`isSafeQueryValue` guards against NoSQL-operator injection and prototype pollution.

### Request Validation (`validate.ts`)

Zod schemas validate request body, params, and query. Returns structured error responses with field-level details.

---

## Routes

All routes are mounted under `/api/v1`:

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/auth/register` | No | — | Register new user |
| POST | `/auth/login` | No | — | Login with email/password |
| POST | `/auth/refresh` | No | — | Rotate refresh token |
| POST | `/auth/logout` | Yes | — | Invalidate session |
| GET | `/auth/me` | Yes | — | Current user profile |
| GET | `/auth/oauth/:provider` | No | — | OAuth redirect |
| GET | `/auth/oauth/:provider/callback` | No | — | OAuth callback |
| POST | `/auth/password-strength` | No | — | Password strength check |
| GET | `/users` | Yes | admin+ | List users (paginated, filterable) |
| GET | `/users/:id` | Yes | admin+ | Get user by ID |
| POST | `/users` | Yes | admin+ | Create user |
| PUT | `/users/:id` | Yes | admin+ | Update user |
| DELETE | `/users/:id` | Yes | admin+ | Delete user (self-delete protection) |
| PATCH | `/users/:id/status` | Yes | admin+ | Toggle user status |
| POST | `/users/bulk-delete` | Yes | super_admin | Bulk delete users |
| POST | `/users/bulk-status` | Yes | admin+ | Bulk status change |
| GET | `/profile` | Yes | — | Get own profile |
| PUT | `/profile` | Yes | — | Update own profile |
| PUT | `/profile/password` | Yes | — | Change password |
| GET | `/settings` | Yes | — | List settings |
| POST | `/settings` | Yes | admin+ | Create setting |
| PUT | `/settings/:key` | Yes | admin+ | Update setting |
| DELETE | `/settings/:key` | Yes | admin+ | Delete setting |
| GET | `/settings/export` | Yes | admin+ | Export settings JSON |
| POST | `/settings/import` | Yes | admin+ | Import settings JSON |
| GET | `/audit-logs` | Yes | admin+ | List audit logs |
| GET | `/audit-logs/:id` | Yes | admin+ | Get audit log |
| GET | `/files` | Yes | — | List files |
| POST | `/files/upload` | Yes | — | Upload files |
| POST | `/files/folder` | Yes | — | Create folder |
| PUT | `/files/:id` | Yes | — | Rename/move file |
| DELETE | `/files/:id` | Yes | — | Delete file |
| POST | `/reports/generate` | Yes | — | Generate report |
| GET | `/reports` | Yes | — | List reports |
| GET | `/reports/:id` | Yes | — | Get report |
| GET | `/reports/:id/download` | Yes | — | Download report |
| POST | `/chat/conversations` | Yes | — | Create conversation |
| POST | `/chat/send` | Yes | — | Send chat message |
| GET | `/chat/conversations` | Yes | — | List conversations |
| GET | `/integrations` | Yes | — | List data sources |
| POST | `/integrations` | Yes | admin+ | Create data source |
| POST | `/integrations/:id/fetch` | Yes | — | Fetch data source |
| GET | `/health` | No | — | Health check |
| GET | `/metrics` | Yes | admin+ | System metrics |

---

## Services

Services contain business logic and orchestrate repository calls. They are responsible for:

- **Authorization checks** (beyond middleware)
- **Business rule enforcement** (email uniqueness, self-delete protection)
- **Audit logging** (all critical actions)
- **WebSocket broadcasts** (real-time events)
- **Cross-service coordination** (e.g., RAG context building)

Services are exported as singletons:

```typescript
// services/user.service.ts
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly auditLogRepo: AuditLogRepository,
  ) {}

  async create(dto: CreateUserDTO, requester: RequestUser) {
    // Check email uniqueness
    // Hash password
    // Create user
    // Log audit
    // Return DTO
  }
}
```

---

## Repositories

Repositories wrap Prisma Client and handle all database operations. Every query is org-scoped:

```typescript
// repositories/user.repository.ts
export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(organizationId: string, params: UserQueryParams) {
    return this.prisma.user.findMany({
      where: { organizationId, ...filters },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
```

---

## Database Schema

### Core Models

| Model | Purpose | Key Relationships |
|-------|---------|-------------------|
| `Organization` | Multi-tenant root | Has many Users, Settings, AuditLogs, Files, etc. |
| `User` | Authentication + identity | Belongs to Organization, has Profile, ChatMessages |
| `UserProfile` | Extended profile/preferences | 1:1 with User, KYC status, theme preferences |
| `KycDocument` | Verification documents | Links User, Profile, and File |
| `RefreshToken` | Token rotation | Belongs to User + Organization |
| `Session` | Active sessions | Belongs to User + Organization |
| `AuditLog` | Activity trail | Belongs to User + Organization |
| `SystemSetting` | Org-scoped config | Unique on [organizationId, key] |
| `File` | Uploaded files | Self-referential folder hierarchy |
| `ChatConversation` | AI chat sessions | Belongs to User + Organization |
| `ChatMessage` | Chat messages | Belongs to Conversation |
| `Report` | Generated reports | Belongs to Organization |
| `ReportTemplate` | Saved report configs | Belongs to Organization |
| `DataSource` | External API connections | Belongs to Organization |

### Enums

| Enum | Values |
|------|--------|
| `UserRole` | `super_admin`, `admin`, `moderator`, `support` |
| `VerificationStatus` | `unverified`, `pending`, `verified`, `rejected` |
| `ChatRole` | `user`, `assistant`, `system` |
| `ReportType` | `audit_logs`, `system_logs`, `users`, `activity` |
| `ReportFormat` | `csv`, `excel`, `pdf` |
| `ReportStatus` | `pending`, `generating`, `completed`, `failed` |
| `StorageProvider` | `LOCAL`, `CLOUDINARY`, `S3`, `GOOGLE_DRIVE` |

---

## Error Handling

### AppError Classes

```typescript
// Custom error classes map to HTTP status + error code
class AppError extends Error {
  statusCode: number;
  code: string;
}

// Examples
throw new NotFoundError('USER_NOT_FOUND', 'User with the given ID does not exist');
throw new ConflictError('USER_ALREADY_EXISTS', 'A user with this email already exists');
throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
throw new ForbiddenError('INSUFFICIENT_PERMISSIONS', 'You do not have permission');
throw new ValidationError('VALIDATION_ERROR', 'Invalid request data', fieldErrors);
```

### Global Error Handler

Catches all unhandled errors and returns standardized responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

5xx errors are persisted as audit log entries with stack traces for debugging.

---

## Audit Logging

Every critical action is logged to the `AuditLog` table:

```typescript
await this.auditLogRepo.create({
  action: AuditAction.USER_CREATED,
  entity: 'user',
  entityId: newUser.id,
  userId: requester.id,
  organizationId: requester.organizationId,
  metadata: { email: newUser.email, role: newUser.role },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

Audit actions include: `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `LOGIN`, `LOGOUT`, `REGISTER`, `SETTINGS_UPDATED`, `FILE_UPLOADED`, `REPORT_GENERATED`, `DATA_SOURCE_CREATED`, `ERROR`, and more.

---

## WebSocket

The WebSocket server runs alongside Express on the same HTTP server:

```typescript
// websocket/WebSocketManager.ts
- JWT authentication via query-param token
- Org-scoped rooms: org:<organizationId>
- Presence tracking per org
- 30s heartbeat liveness probe
- Stats endpoint: GET /api/v1/ws/status (admin-only)
```

Every audit log write broadcasts an `audit:created` event to the relevant org room.

---

## Testing

```bash
pnpm test              # Run all API integration tests
pnpm test:watch        # Run tests in watch mode
```

**Framework:** Vitest + Supertest

**Current coverage:** 11 auth API integration tests (register, login, refresh, logout, me).

**Config:** `apps/api/vitest.config.ts` (globals, node environment, 30s timeout).

See [Testing & Quality Skill](../../.opencode/skills/testing-and-quality/SKILL.md) for detailed testing instructions.
