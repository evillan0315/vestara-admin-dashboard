# Architecture

> Detailed system architecture of the Vestara Command Center.

---

## Table of Contents

- [System Overview](#system-overview)
- [Monorepo Structure](#monorepo-structure)
- [Layered Architecture](#layered-architecture)
- [Data Flow](#data-flow)
- [Multi-Tenancy](#multi-tenancy)
- [Authentication Flow](#authentication-flow)
- [Real-Time Architecture](#real-time-architecture)
- [AI Integration](#ai-integration)
- [Deployment Architecture](#deployment-architecture)

---

## System Overview

The Vestara Command Center follows a **domain-driven, layered architecture** organized as a pnpm monorepo with Turborepo orchestration.

```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                      │
│  React SPA · MUI Components · TanStack Query         │
├─────────────────────────────────────────────────────┤
│                  Application Layer                   │
│  Feature Modules · Auth Context · WebSocket Client   │
├─────────────────────────────────────────────────────┤
│                    API Layer                          │
│  Express 5 Routes · Zod Validation · Middleware      │
├─────────────────────────────────────────────────────┤
│                  Service Layer                       │
│  Business Logic · Authorization · Audit Logging      │
├─────────────────────────────────────────────────────┤
│                 Repository Layer                     │
│  Prisma Queries · Data Access · Org Scoping          │
├─────────────────────────────────────────────────────┤
│                   Data Layer                         │
│  PostgreSQL 17 · Redis 8 · Object Storage            │
└─────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
vestara-admin-dashboard/
├── apps/
│   ├── api/                    # Express 5 backend (@vestara/api)
│   │   ├── prisma/             # Schema, migrations, seed
│   │   └── src/
│   │       ├── config/         # Environment configuration
│   │       ├── middleware/     # Security, CORS, validation, auth, error handler
│   │       ├── repositories/  # Data access (Prisma queries)
│   │       ├── routes/        # HTTP route definitions
│   │       ├── services/      # Business logic
│   │       ├── utils/         # Helpers (metrics, etc.)
│   │       └── websocket/     # WebSocket manager
│   │
│   └── web/                    # React 19 SPA (@vestara/web)
│       └── src/
│           ├── api/            # Axios API client functions
│           ├── components/     # Shared UI components
│           ├── features/       # Domain-specific modules
│           ├── hooks/          # Shared custom hooks
│           ├── layouts/        # Dashboard layout, sidebar, header
│           ├── pages/          # Route page components
│           ├── routes/         # React Router configuration
│           ├── styles/         # Global styles, Tailwind config
│           ├── theme/          # MUI theme tokens and config
│           ├── types/          # Frontend-specific types
│           ├── utils/          # Client-side utilities
│           └── websocket/      # WebSocket client, provider, hooks
│
├── packages/
│   ├── types/                  # @vestara/types — shared TypeScript types
│   ├── constants/              # @vestara/constants — global constants
│   ├── validation/             # @vestara/validation — Zod schemas
│   ├── utils/                  # @vestara/utils — shared utilities
│   └── config/                 # @vestara/config — shared configuration
│
├── docs/                       # Documentation portal
├── screens/                    # Product screenshots
├── turbo.json                  # Turborepo pipeline config
├── pnpm-workspace.yaml         # Workspace definition
└── package.json                # Root package.json
```

---

## Layered Architecture

### Route Layer

Express 5 route definitions. Handles HTTP concerns only: parsing request params, calling the service, and sending the response.

```
routes/
├── auth.ts          # POST /auth/register, /auth/login, /auth/refresh, etc.
├── users.ts         # GET /users, POST /users, PUT /users/:id, DELETE /users/:id
├── settings.ts      # GET /settings, POST /settings, PUT /settings/:key
├── audit-logs.ts    # GET /audit-logs, GET /audit-logs/:id
├── profile.ts       # GET /profile, PUT /profile, PUT /profile/password
├── files.ts         # GET /files, POST /files/upload, DELETE /files/:id
├── reports.ts       # POST /reports/generate, GET /reports
├── chat.ts          # POST /chat/send, GET /chat/conversations
├── health.ts        # GET /health
├── metrics.ts       # GET /metrics (system health metrics)
└── index.ts         # Mounts all routes under /api/v1
```

### Service Layer

Business logic and authorization. Services orchestrate repository calls, enforce business rules, and trigger side effects (audit logging, WebSocket broadcasts).

```
services/
├── auth.service.ts           # Registration, login, token rotation
├── user.service.ts           # User CRUD, bulk operations
├── settings.service.ts       # Settings CRUD with audit trail
├── audit-log.service.ts      # Audit log queries
├── profile.service.ts        # Profile updates, password changes
├── file.service.ts           # File operations, storage providers
├── report.service.ts         # Report generation (CSV, Excel, PDF)
├── chat.service.ts           # AI chat, conversation management
├── context-builder.ts        # RAG context assembly
├── integrations/             # Data connector services
│   ├── agent.service.ts
│   ├── analyzer.ts
│   └── http-client.ts
└── ai/                       # AI provider abstraction
    ├── provider.interface.ts
    ├── opencode.provider.ts
    └── provider.factory.ts
```

### Repository Layer

Data access layer wrapping Prisma Client. All queries are org-scoped via `organizationId`.

```
repositories/
├── user.repository.ts
├── settings.repository.ts
├── audit-log.repository.ts
├── session.repository.ts
├── refresh-token.repository.ts
├── file.repository.ts
├── report.repository.ts
├── chat.repository.ts
└── data-source.repository.ts
```

---

## Data Flow

### Typical Request Lifecycle

```
1. Client → HTTP Request (with JWT in Authorization header)
2. Middleware Pipeline:
   a. CORS check
   b. Security headers (Helmet)
   c. Body parsing (JSON)
   d. Request logging (Pino)
   e. Rate limiting
   f. CSRF/origin verification
   g. Input sanitization
   h. JWT authentication (decode + req.user attachment)
   i. Role-based access control (requireRole)
   j. Zod validation (request body/params/query)
3. Route Handler → calls Service
4. Service → business logic → calls Repository
5. Repository → Prisma query → PostgreSQL
6. Service → audit logging → WebSocket broadcast
7. Route Handler → standardized response { success, data, error, meta }
8. Response → Client
```

### Standard API Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with the given ID does not exist"
  }
}
```

---

## Multi-Tenancy

Every resource is scoped to an **Organization** via `organizationId`.

```
Organization (1)
  ├── (N) Users
  ├── (N) SystemSettings       @@unique([organizationId, key])
  ├── (N) AuditLogs
  ├── (N) Sessions
  ├── (N) RefreshTokens
  ├── (N) Files
  ├── (N) ChatConversations
  ├── (N) Reports
  ├── (N) ReportTemplates
  ├── (N) DataSources
  └── (N) UserProfiles
```

**Enforcement:** The `organizationId` is extracted from the authenticated user's JWT and injected into every repository query. Users cannot access resources from other organizations.

---

## Authentication Flow

### Email/Password

```
1. POST /auth/register → hash password → create User → log audit → return tokens
2. POST /auth/login → verify password → check lockout → create Session + RefreshToken → log audit → return tokens
3. POST /auth/refresh → verify RefreshToken → rotate (revoke old, create new) → return new tokens
4. POST /auth/logout → revoke RefreshToken → delete Session → log audit
5. GET /auth/me → decode JWT → return user profile
```

### OAuth 2.0 (Google/GitHub)

```
1. GET /auth/oauth/:provider → redirect to provider's auth URL
2. GET /auth/oauth/:provider/callback → exchange code for tokens → fetch user info
3. Find existing user by email OR create new user → link provider
4. Create Session + RefreshToken → redirect to frontend with tokens
```

### Token Strategy

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token | 15 minutes | Memory / HTTP header | API authentication |
| Refresh Token | 30 days | HttpOnly cookie | Token rotation |

---

## Real-Time Architecture

```
Client (WebSocket) ←→ WebSocket Server (ws) ←→ Org Room
                                                    ↓
                                            Audit Log Repository
                                                    ↓
                                            broadcast("audit:created")
                                                    ↓
                                            All clients in org room
```

**Features:**
- JWT authentication via query-param token on connect
- Org-scoped rooms (`org:<organizationId>`)
- Presence tracking per org
- 30s heartbeat liveness probe
- Exponential backoff reconnect with jitter (client-side)

---

## AI Integration

```
User Message → ChatService → ContextBuilder (RAG) → AIProvider → Response
                  ↓                                      ↓
          Org Data (users,                     OpenCode / OpenAI /
          audit logs, settings,                Anthropic API
          files, KPIs)
```

**Provider Chain:** OpenCode (free) → OpenAI → Anthropic → Mock (fallback)

**RAG Context:** 60s cached org data injected into system prompt before each completion.

---

## Deployment Architecture

### Vercel (Current)

```
GitHub → Vercel Build → Deploy
  ├── Web: Static SPA (CDN)
  └── API: Serverless Function (/api/v1)
        └── Prisma Postgres (hosted PostgreSQL)
```

### Self-Hosted (Alternative)

```
GitHub → SSH Deploy → Ubuntu VPS
  ├── Nginx (reverse proxy + TLS)
  ├── PM2 (Node.js process manager)
  ├── PostgreSQL 17
  └── Redis 8
```

See [Deployment Guide](../DEPLOYMENT.md) and [Self-Hosted Guide](../SELF_HOSTED_DEPLOYMENT.md) for details.
