# Vestara Command Center — Architecture

> The canonical technical reference for how the Vestara Command Center is engineered.

---

## Table of Contents

- [1. Architectural Vision](#1-architectural-vision)
- [2. Design Principles](#2-design-principles)
- [3. Technology Stack](#3-technology-stack)
- [4. Monorepo Structure](#4-monorepo-structure)
- [5. Domain-Driven Organization](#5-domain-driven-organization)
- [6. Backend Architecture](#6-backend-architecture)
- [7. Frontend Architecture](#7-frontend-architecture)
- [8. Shared Packages](#8-shared-packages)
- [9. State Management](#9-state-management)
- [10. Authentication and Authorization](#10-authentication-and-authorization)
- [11. Multi-Tenancy](#11-multi-tenancy)
- [12. AI Integration Strategy](#12-ai-integration-strategy)
- [13. Event-Driven Communication](#13-event-driven-communication)
- [14. Data Layer](#14-data-layer)
- [15. Security Architecture](#15-security-architecture)
- [16. Observability](#16-observability)
- [17. Deployment Topology](#17-deployment-topology)
- [18. Scalability Considerations](#18-scalability-considerations)
- [19. Performance Engineering](#19-performance-engineering)
- [20. Future Evolution](#20-future-evolution)

---

## 1. Architectural Vision

The Vestara Command Center is the operational interface of the Vestara AI Platform. It is not a traditional administration dashboard — it is an enterprise operating platform where every capability contributes to a unified operational experience. The architecture must support this ambition: a system that serves human administrators today and autonomous AI agents tomorrow.

The architectural vision is defined by three commitments:

**One platform, not many tools.** Enterprise operations are typically fragmented across dozens of disconnected systems. Vestara consolidates these into a single coherent platform where user management, analytics, reporting, file management, AI assistance, and real-time monitoring share the same data model, the same authentication layer, and the same organizational boundaries.

**AI-native from day one.** Intelligence is not bolted on as a feature — it is woven into the foundation. The AI system has direct access to organizational data through RAG (Retrieval-Augmented Generation), can answer questions about users, audit logs, settings, and operational metrics in real time, and is designed to evolve toward autonomous operation.

**Standards-driven ecosystem.** This repository is the reference implementation of the Vestara Blueprint. Every architectural decision documented here establishes a pattern that future repositories — API services, mobile applications, SDKs, CLI tools, marketplace services — will follow. The architecture is deliberately conventional so that it can be replicated consistently across the ecosystem.

---

## 2. Design Principles

### 2.1 Convention Over Configuration

The system favors well-established patterns over custom solutions. Express for HTTP, Prisma for ORM, React for UI, Zod for validation, TanStack Query for server state — these are chosen not because they are the only options, but because they reduce cognitive load for developers joining the project. Every convention is documented, every pattern is consistent, and every module follows the same internal structure.

### 2.2 Layered Separation of Concerns

The backend follows a strict four-layer architecture: Route → Service → Repository → Data. Each layer has a single responsibility. Routes handle HTTP concerns. Services orchestrate business logic. Repositories wrap data access. The data layer stores and retrieves records. No layer bypasses another — a route never queries the database directly, and a repository never sends an HTTP response.

### 2.3 Feature-Based Module Organization

The frontend is organized by domain feature, not by technical type. Instead of grouping all components together, all hooks together, and all types together, each feature module (analytics, chat, files, reports, users) contains its own components, hooks, API calls, and domain logic. This makes features self-contained and discoverable.

### 2.4 Defense in Depth

Security is applied in layers, not as a single gate. A request passes through CORS verification, security headers, body parsing, request logging, rate limiting, CSRF/origin verification, input sanitization, JWT authentication, role-based access control, and Zod validation before reaching business logic. If any single layer fails, the others still protect the system.

### 2.5 Multi-Tenancy by Default

Every resource is scoped to an organization from the moment it is created. The `organizationId` is extracted from the authenticated user's JWT and injected into every repository query. There is no "tenant switching" mechanism — users simply cannot see data from other organizations. This is not an add-on; it is the fundamental data access pattern.

### 2.6 Graceful Degradation

Features degrade gracefully when infrastructure is unavailable. The WebSocket manager operates as a no-op on Vercel's serverless runtime. The AI system falls back through a priority chain of providers. The file storage system abstracts behind an interface so the implementation can be swapped. Nothing fails hard — the system always provides the best experience the current environment supports.

---

## 3. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | TypeScript (strict mode) | End-to-end type safety across frontend, backend, and shared packages |
| Frontend | React 19 + Vite 6 | Component model, fast builds, ESM-native |
| UI Components | Material UI v7+ | Enterprise-grade component library with theming |
| Styling | Tailwind CSS v4+ | Utility-first CSS alongside MUI |
| Routing | React Router v7 | Nested route layouts, lazy loading |
| Server State | TanStack Query v5 | Caching, background refetching, optimistic updates |
| Form Handling | React Hook Form + Zod | Performant forms with shared validation schemas |
| Icons | lucide-react | Consistent icon system |
| Backend | Express 5 | Mature, well-understood HTTP framework |
| ORM | Prisma 7 (PrismaPg adapter) | Type-safe database access, migration management |
| Database | PostgreSQL 17 | Relational data with JSON support, full-text search |
| Cache | Redis 8 | Session storage, rate limiting, WebSocket adapter |
| Authentication | JWT (access + refresh tokens) | Stateless auth with refresh rotation |
| OAuth | Google + GitHub | Social authentication providers |
| Validation | Zod | Shared schemas between frontend and backend |
| Logging | Pino | Structured JSON logging |
| Security | Helmet | HTTP security headers |
| File Upload | Multer | Multipart form handling |
| Password Hashing | bcrypt | Industry-standard password hashing |
| Real-Time | Socket.IO | WebSocket abstraction with fallback |
| Package Manager | pnpm | Fast, disk-efficient monorepo package manager |
| Build Orchestration | Turborepo | Parallel builds with dependency ordering |
| Testing | Vitest + Supertest | Unit and integration testing |
| E2E Testing | Playwright | Browser automation |
| CI/CD | GitHub Actions | Automated quality gates and deployment |
| Deployment (Cloud) | Vercel | Serverless API + static SPA hosting |
| Deployment (Self-Hosted) | Nginx + PM2 + Ubuntu VPS | Full control over infrastructure |

---

## 4. Monorepo Structure

The project uses a pnpm workspace monorepo with Turborepo orchestration. This structure ensures that shared packages are built before the applications that depend on them, and that type checking, linting, and testing run in parallel across workspaces.

```
vestara-admin-dashboard/
├── apps/
│   ├── api/                        # Express 5 backend
│   │   ├── prisma/                 # Schema, migrations, seed
│   │   └── src/
│   │       ├── config/             # Environment configuration
│   │       ├── middleware/         # Security, validation, auth, error handling
│   │       ├── repositories/       # Data access (Prisma queries)
│   │       ├── routes/             # HTTP route definitions
│   │       ├── services/           # Business logic
│   │       ├── storage/            # File storage providers
│   │       ├── utils/              # Helpers (metrics, JWT, prisma)
│   │       └── websocket/          # Socket.IO manager
│   │
│   └── web/                        # React 19 SPA
│       └── src/
│           ├── api/                # API client modules
│           ├── components/         # Shared UI, data, feedback, layout components
│           ├── features/           # Domain-specific feature modules
│           ├── layouts/            # Dashboard layout, auth layout, nav config
│           ├── pages/              # Route page components
│           ├── routes/             # React Router configuration
│           ├── styles/             # Global styles, Tailwind integration
│           ├── theme/              # MUI theme tokens, ThemeContext
│           └── websocket/          # Socket.IO client, provider, hooks
│
├── packages/
│   ├── types/                      # @vestara/types — shared DTOs, enums, API types
│   ├── constants/                  # @vestara/constants — global constants
│   ├── validation/                 # @vestara/validation — Zod schemas
│   ├── utils/                      # @vestara/utils — shared utility functions
│   └── config/                     # @vestara/config — shared configuration
│
├── docs/                           # Documentation
├── infrastructure/                 # Docker, Nginx, PM2 configs
├── scripts/                        # Deployment, dev, and utility scripts
├── turbo.json                      # Turborepo pipeline configuration
├── pnpm-workspace.yaml             # Workspace definition
└── package.json                    # Root package.json
```

### 4.1 Turborepo Pipeline

Turborepo manages the build dependency graph. Shared packages are built first (`^build` dependency), then applications build in parallel. The pipeline defines six tasks:

| Task | Dependencies | Outputs | Purpose |
|------|-------------|---------|---------|
| `dev` | None | None | Persistent dev servers (no cache) |
| `build` | `^build` | `dist/**` | Production builds |
| `typecheck` | `^build` | None | TypeScript type checking |
| `lint` | `^build` | None | ESLint static analysis |
| `test` | `build` | None | Vitest test suites |
| `clean` | None | None | Remove build artifacts |

The `^build` dependency ensures that when `@vestara/api` builds, all five shared packages are built first. This guarantees that type definitions and compiled JavaScript are available before application compilation begins.

### 4.2 Path Aliases

Two alias systems provide clean imports throughout the codebase:

- `@/` maps to `./src/` within each application — used for intra-app imports
- `@vestara/*` maps to `../../packages/*/src` — used for cross-package imports

These aliases are configured in both `tsconfig.json` (for TypeScript) and `vite.config.ts` / build configs (for bundling), ensuring consistent resolution at development time and build time.

---

## 5. Domain-Driven Organization

The Command Center is organized around business domains, not technical layers. Each domain represents a bounded context with its own data model, business rules, and user interface.

### 5.1 Implemented Domains

| Domain | Backend Route | Frontend Feature | Data Model |
|--------|--------------|-----------------|------------|
| Authentication | `/auth/*` | `features/auth/` | User, Session, RefreshToken |
| User Management | `/users` | `features/users/` | User, UserProfile |
| Organizations | `/organizations` | `features/organizations/` | Organization |
| Settings | `/settings` | `features/settings/` | SystemSetting |
| Audit Logs | `/audit-logs` | `features/audit-logs/` | AuditLog |
| File Management | `/files` | `features/files/` | File |
| AI Chat | `/chat` | `features/chat/` | ChatConversation, ChatMessage |
| Reports | `/reports` | `features/reports/` | Report, ReportTemplate |
| Analytics | `/metrics` | `features/analytics/` | Derived from AuditLog, User |
| Data Connectors | `/integrations` | `features/integrations/` | DataSource |
| Monitoring | `/health`, `/metrics` | `features/monitoring/` | Derived from system state |

### 5.2 Planned Domains

| Domain | Purpose | Status |
|--------|---------|--------|
| Digital Wallet | Financial transactions, balances | Planned |
| Marketplace | Products, services, commerce | Planned |
| Bookings | Appointments, scheduling | Planned |
| Rewards | Loyalty, incentive programs | Planned |
| Workflow Automation | Orchestration, scheduled jobs | Planned |

Planned domains appear in the navigation sidebar with a "Soon" badge. They are structurally present to communicate the platform's trajectory but are not functional. When implementation begins, each will follow the same pattern: Prisma model → repository → service → route → frontend feature module.

### 5.3 Cross-Domain Concerns

Certain capabilities cut across all domains:

- **Audit Logging** — Every domain writes to the `AuditLog` table via `AuditLogService`. The audit trail is domain-agnostic: it records who did what, when, to which entity.
- **Multi-Tenancy** — Every domain's repository queries are scoped to `organizationId`. This is not implemented per-domain; it is a repository-layer convention.
- **Real-Time Events** — Audit log writes trigger WebSocket broadcasts that are consumed by the dashboard, notifications, and presence indicators regardless of which domain initiated the change.

---

## 6. Backend Architecture

### 6.1 Layered Architecture

The backend follows a strict four-layer architecture:

```
┌──────────────────────────────────────────────┐
│                  Route Layer                  │
│  HTTP concerns: params, response, status code │
├──────────────────────────────────────────────┤
│                 Service Layer                 │
│  Business logic: orchestration, rules, side   │
│  effects (audit, WebSocket, email)            │
├──────────────────────────────────────────────┤
│                Repository Layer               │
│  Data access: Prisma queries, org scoping,    │
│  pagination, search, sorting                  │
├──────────────────────────────────────────────┤
│                  Data Layer                   │
│  PostgreSQL 17 via Prisma Client v7           │
└──────────────────────────────────────────────┘
```

**Routes** are thin. They parse request parameters, call the appropriate service method, and send a standardized response. No business logic lives in routes.

**Services** are the core of the system. They orchestrate multiple repository calls, enforce business rules (email uniqueness, account lockout, self-delete protection), trigger side effects (audit logging, WebSocket broadcasts), and manage transactions.

**Repositories** are the data access layer. Every repository extends `BaseRepository`, which provides a shared Prisma client instance and an `assertFound` helper. Repositories handle pagination (`skip`/`take`), search (Prisma `contains` with case-insensitive mode), sorting (dynamic `orderBy`), and organization scoping.

**Data Layer** is PostgreSQL 17 accessed through Prisma Client v7 with the `PrismaPg` adapter. The generated client is committed to the repository to avoid build-time database connectivity requirements.

### 6.2 Request Lifecycle

A typical authenticated request passes through 13 processing stages:

1. **CORS** — Origin header checked against allow-list (`.vercel.app`, configured origins, localhost)
2. **Security Headers** — Helmet applies CSP, HSTS, Referrer-Policy, X-Content-Type-Options, frame-ancestors
3. **Permissions Policy** — Disables camera, microphone, geolocation, payment APIs
4. **Request ID** — UUID generated or accepted from `X-Request-Id` header for distributed tracing
5. **Body Parsing** — JSON (1MB limit) and URL-encoded body parsing
6. **Request Logging** — Pino logs method, URL, status, duration; records metrics for Prometheus
7. **CSRF Protection** — Origin verification on POST/PUT/PATCH/DELETE (SPA Bearer-token pattern)
8. **Rate Limiting** — Global 100 req/min per IP; auth endpoints 5 req/15min
9. **Input Sanitization** — Strips `<script>` blocks, event handlers, `javascript:` URIs from body/query/params
10. **JWT Authentication** — Validates Bearer token, decodes payload, attaches `req.user`
11. **Role-Based Access Control** — `requireRole(...roles)` checks `req.user.role` against allowed roles
12. **Zod Validation** — Validates request body, query, or params against typed schema; replaces `req` properties with parsed values
13. **Route Handler** → Service → Repository → Database

### 6.3 Middleware Stack

| Middleware | File | Purpose |
|-----------|------|---------|
| `authenticate` | `middleware/authenticate.ts` | JWT validation, user lookup, `req.user` attachment |
| `requireRole(...roles)` | `middleware/authenticate.ts` | RBAC factory — rejects if user role not in allowed list |
| `validate(schema, target)` | `middleware/validate.ts` | Zod schema validation with Express 5 `req.query` workaround |
| `errorHandler` | `middleware/error-handler.ts` | Catches ZodError, AppError, unknown; standardized error response; persists 5xx as audit entries |
| `notFoundHandler` | `middleware/not-found.ts` | 404 catch-all with standardized response |
| `authRateLimiter` | `middleware/rate-limit.ts` | 5 requests/15min (counts failures only); disabled in test |
| `apiRateLimiter` | `middleware/rate-limit.ts` | 100 requests/min per IP; disabled in test |
| `healthRateLimiter` | `middleware/rate-limit.ts` | 60 requests/30sec for health/metrics |
| `csrfProtection` | `middleware/csrf.ts` | Origin header verification on state-changing methods |
| `sanitizeInput` | `middleware/sanitize.middleware.ts` | Recursive XSS sanitization of body, query, params |
| `securityHeaders` | `middleware/security-headers.ts` | Helmet with CSP, HSTS, Referrer-Policy |
| `permissionsPolicy` | `middleware/security-headers.ts` | Permissions-Policy header |
| `requestId` | `middleware/request-id.ts` | UUID X-Request-Id header generation |
| `requestLogger` | `middleware/request-logger.ts` | Pino HTTP logging + Prometheus metrics |
| `uploadSingle` / `uploadArray` | `middleware/upload.ts` | Multer memory storage (5MB limit, image filter) |

### 6.4 Error Handling

The system defines a hierarchy of application errors:

```
AppError (base — statusCode + code)
├── BadRequestError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── ValidationError (422)
├── RateLimitError (429)
└── InternalError (500)
```

Every error carries a machine-readable `code` (e.g., `USER_NOT_FOUND`, `ACCOUNT_LOCKED`, `VALIDATION_ERROR`) and a human-readable `message`. The global error handler catches these and returns a standardized response:

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

For authenticated 5xx errors, the error handler also persists the error as an audit log entry (`AuditAction.ERROR`, entity `'api'`), capturing the request method, path, status, and stack trace. This creates an automatic error trail in the audit system.

### 6.5 Service Layer Design

Services are exported as singleton instances. They are not instantiated per-request — they are module-level singletons that share state (e.g., the RAG context cache, the AI provider registry).

Key services and their responsibilities:

| Service | Responsibilities |
|---------|-----------------|
| `AuthService` | Registration, login (bcrypt), OAuth find-or-create, refresh-token rotation, account lockout (5 attempts / 30 min), audit logging |
| `UserService` | User CRUD, bulk operations (delete, status toggle), stats, email uniqueness enforcement |
| `SettingsService` | Settings CRUD with versioning, export/import, audit history tracking |
| `AuditLogService` | Audit trail creation and paginated queries with filtering |
| `FileService` | File upload/download with storage provider abstraction, folder hierarchy, metadata |
| `ChatService` | AI conversation management, RAG context injection, message creation |
| `ReportsService` | Async report generation (CSV/Excel/PDF), template CRUD, WebSocket status broadcasts |
| `AgentService` | External REST data source management, auth injection, fetch and analysis |
| `AIService` | Provider registry — routes completions to the correct AI backend |

### 6.6 Repository Layer Design

Every repository extends `BaseRepository` and follows the same patterns:

- **Multi-tenancy**: All queries accept `organizationId` and filter by it
- **Pagination**: `skip`/`take` with `Prisma.findMany` + `Prisma.count` in `Promise.all`
- **Search**: Prisma `contains` with `mode: 'insensitive'` across multiple fields via `OR`
- **Sorting**: Dynamic `orderBy` from query parameters
- **Password exclusion**: Public-facing queries use `select` to exclude `passwordHash`
- **WebSocket integration**: `AuditLogRepository.create()` calls `broadcastAuditCreated()` — best-effort, catches failures silently

---

## 7. Frontend Architecture

### 7.1 Application Shell

The React application is structured as a provider tree that wraps the entire component hierarchy:

```
BrowserRouter
  └─ QueryProvider (TanStack Query)
       └─ AuthProvider (JWT auth state)
            └─ ThemeProvider (MUI + ThemeContext)
                 └─ ToastProvider (notification toasts)
                      └─ WebSocketProvider (Socket.IO)
                           └─ LiveNotificationsProvider
                                └─ DateRangeProvider
                                     └─ {children}
```

This nesting is deliberate. Auth is near the top so downstream providers (WebSocket, notifications) can access `isAuthenticated` and `user`. WebSocket is below Auth so it can read auth state for connection lifecycle. Live notifications is inside WebSocket so it can subscribe to events.

The root `App.tsx` is a clean two-line component — all provider composition is centralized in `AppProvider.tsx`.

### 7.2 Routing and Code Splitting

Every page is lazy-loaded using a custom `lazyPage()` helper that wraps `React.lazy()`. This creates per-page chunks that load on demand, keeping the initial bundle small.

| Route | Layout | Guard | Page |
|-------|--------|-------|------|
| `/auth/callback` | None | None | OAuthCallbackPage |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | AuthLayout | PublicRoute | Auth pages |
| `/`, `/analytics`, `/users`, `/settings`, etc. | DashboardLayout | ProtectedRoute | Dashboard pages |
| `*` (catch-all) | None | None | Redirect to `/` |

**Route guards** enforce authentication at the router level:
- `ProtectedRoute` — shows loading spinner while checking auth, redirects to `/login` if unauthenticated, renders `<Outlet />` otherwise
- `PublicRoute` — shows loading spinner while checking auth, redirects to `/` if authenticated, renders `<Outlet />` otherwise

### 7.3 Feature-Based Module Architecture

The frontend is organized into 17 feature modules, each self-contained:

```
features/
├── analytics/          # Chart aggregation, audit activity mapping, date-range hooks
├── audit-logs/         # Audit log display and filtering
├── auth/               # AuthContext, login/register/logout/OAuth
├── calendar/           # DateRangeContext, CalendarDatePicker, CalendarPopover
├── chat/               # FloatingChatWidget, chat hooks
├── docs/               # In-app documentation content
├── files/              # File manager UI, upload hooks, folder navigation
├── integrations/       # DataSourceFormDialog, external API hooks
├── monitoring/         # System monitoring queries
├── organizations/      # Organization CRUD, dialogs
├── profile/            # User profile page with tabs, preferences
├── realtime/           # Live notifications, presence, dashboard refresh
├── reports/            # Report generation, templates, comparison
├── settings/           # Settings CRUD, import/export, audit history
├── sidebar/            # Sidebar theme config resolver
└── users/              # User management, bulk operations, CSV export
```

Each feature module typically contains:
- **hooks.ts** — TanStack Query hooks with query key factories
- **components/** — Feature-specific UI components
- **Page-level hooks** (e.g., `useUsersPage.ts`) — orchestrate all feature hooks for a specific page

This structure makes features discoverable (find everything about "files" in one directory), testable (mock at the feature boundary), and removable (delete a feature directory to remove it).

### 7.4 Component Library

The component library is organized into four categories:

**UI Primitives** (19 components) — Button, Input, Select, Textarea, Checkbox, Radio, Switch, Card, Modal, ConfirmDialog, Drawer, Badge, Avatar, Tooltip, Tabs, Breadcrumb, Typography. These are the atomic building blocks.

**Data Components** — DataTable (576 lines, with sortable columns, search, filter chips, pagination, row selection, loading skeletons, empty states, server-side support), StatCard (KPI card with trend indicators), ActivityFeed (activity list with avatars and timestamps).

**Feedback Components** — Toast/Snackbar (queue management, max 5 concurrent), Loading (spinner, skeleton, overlay, inline), EmptyState (NoData, NoSearchResults, EmptyFolder, ErrorState), ConfirmDialog (promise-based via `useConfirm` hook).

**Layout Components** — Sidebar (gold-themed, grouped navigation, system status footer), Header (dynamic title, search, notifications, theme toggle, user menu), Footer.

### 7.5 Design System

The design system operates across four layers:

**Layer 1 — Design Tokens** (`theme/tokens.ts`): Immutable color palette (near-black backgrounds, gold primary `#D4A843`), 7 primary color options, 3 density presets, 4 font family options, box shadow presets, transition presets, chart palette.

**Layer 2 — Theme Context** (`theme/ThemeContext.tsx`): 16+ user-configurable settings (mode, primaryColor, density, fontFamily, fontSizeScale, borderRadiusScale, contrastLevel, sidebarVariant, maintenanceMode). All persisted to `localStorage` under `vestara-theme-config`. System color scheme detection when mode is "system".

**Layer 3 — MUI Theme Factory** (`styles/theme.ts`): `createAppTheme(config)` generates a complete MUI `Theme` from the user's `ThemeConfig`. Overrides 25+ MUI component styles. Scales all font sizes by `fontSizeScale`. Adapts all spacing/border-radius by density preset. Dark mode uses near-black backgrounds (`#0D0F12`, `#151923`). Light mode uses slate backgrounds (`#F8FAFC`, `#FFFFFF`).

**Layer 4 — CSS/Tailwind** (`styles/globals.css`): CSS custom properties mirroring design tokens (`--vestara-*`), global reset, scrollbar styling, selection color (gold tint), animation keyframes (fadeIn, slideInRight, pulse, glow), utility classes (`.glass`, `.gold-text`, `.card-hover`, `.status-dot`), reduced-motion support, print styles.

---

## 8. Shared Packages

Five shared packages ensure consistency across the monorepo. They are leaf packages with minimal dependencies — only `@vestara/validation` depends on `@vestara/constants`.

### 8.1 @vestara/types

The single source of truth for all TypeScript types shared between frontend and backend. Contains:

- **7 enums**: `UserRole`, `Permission`, `ThemeMode`, `AuditAction`, `EntityType`, `SortOrder`, `ChatRole`
- **API envelope types**: `ApiResponse<T>`, `ApiErrorPayload`, `PaginationMeta`, `PaginationParams`
- **DTOs**: 40+ data transfer objects covering authentication, user management, profiles, settings, organizations, chat, reports, data sources, and WebSocket events
- **WebSocket protocol**: `WS_EVENT` const object, typed message unions (`ServerToClientMessage`, `ClientToServerMessage`), room helpers

### 8.2 @vestara/constants

Global constants consumed by both applications and the validation package:

- **API**: `API_VERSION` ("v1"), `API_PREFIX` ("/api/v1")
- **Error codes**: 17 machine-readable codes (auth, validation, resource, security)
- **Password policy**: min 8, max 128, require upper/lower/number/symbol, common password blocklist (28 breached passwords)
- **Rate limits**: auth (5/15min), API (100/min)
- **Account lockout**: 5 attempts, 30 min lockout
- **Pagination**: default 20, max 100

### 8.3 @vestara/validation

Zod schemas that validate data on both frontend and backend. This is a critical architectural choice — the same schema validates a user creation request whether it arrives from the React form or from a cURL command.

Contains 25+ schemas: `loginSchema`, `registerSchema`, `createUserSchema`, `updateProfileSchema`, `updateSettingSchema`, `createOrganizationSchema`, `auditLogQuerySchema`, `paginationSchema`, `createDataSourceSchema`, and more.

Utility functions include `scorePasswordStrength()` (returns 0-4 score) and `formatValidationError()` (ZodError to structured response).

### 8.4 @vestara/utils

30 pure utility functions organized by category: date/time formatting, string manipulation (truncate, capitalize, kebab-case), number formatting (currency, percent), collection operations (groupBy, chunk, unique, pick, omit), JSON safety, async helpers (debounce, throttle), URL/query building, and type guards.

### 8.5 @vestara/config

Minimal configuration package with three const objects: `appConfig` (name, version, description), `paginationDefaults` (page: 1, perPage: 20, maxPerPage: 100), `apiDefaults` (timeout: 30000ms, retryCount: 1).

---

## 9. State Management

The frontend uses a deliberate two-tier state management strategy: React Context for client state, TanStack Query for server state. There are zero Zustand stores in the codebase — all state is managed through these two mechanisms.

### 9.1 Client State (React Context)

Six React Context providers manage client-side state:

| Context | State | Methods |
|---------|-------|---------|
| `AuthContext` | user, isAuthenticated, isLoading | login, register, logout, updateUser, deleteAccount, oauthRedirect, handleOAuthCallback |
| `ThemeContext` | mode, primaryColor, density, fontFamily, fontSize, borderRadius, contrast, sidebarVariant, + 8 more | setMode, setPrimaryColor, setDensity, + 12 more setters |
| `DateRangeContext` | startDate, endDate, preset | setDateRange, setPreset |
| `LiveNotificationsContext` | notifications, unreadCount | markAsRead, markAllAsRead, clearAll |
| `WebSocketContext` | status, isConnected | on, send, subscribe, unsubscribe |
| `ToastContext` | toasts (queue, max 5) | showSuccess, showError, showWarning, showInfo |

All client state is persisted to `localStorage` where appropriate (theme config, auth tokens). Component-local `useState` handles transient UI state (dialogs, mobile drawer, search input).

### 9.2 Server State (TanStack Query)

TanStack Query manages all server-state interactions. Every feature module defines a **query key factory** pattern:

```typescript
export const userKeys = {
  all: ['users'] as const,
  list: (params?) => ['users', 'list', params] as const,
  detail: (id) => ['users', id] as const,
  stats: ['users', 'stats'] as const,
};
```

This ensures cache invalidation is precise — invalidating `userKeys.list(params)` only invalidates list queries with those specific params, not detail queries.

**Configured defaults:**
- `staleTime`: 5 minutes — data is considered fresh for 5 minutes
- `gcTime`: 30 minutes — garbage collection after 30 minutes of inactivity
- `retry`: 1 — single retry on failure
- `refetchOnWindowFocus`: false — avoids unnecessary refetches
- `refetchOnReconnect`: true — refetches when network recovers

**Mutation patterns:**

- **Optimistic updates** (users) — `onMutate` cancels queries and snapshots previous data, `onError` rolls back, `onSettled` invalidates. Provides instant UI feedback.
- **Invalidation-only** (chat, settings, reports) — `onSuccess` invalidates related queries. Simpler but slightly delayed.
- **Combined** (audit-logs, organizations) — Hybrid depending on the feature.

### 9.3 API Client Architecture

The API client (`api/client.ts`) is a custom `ApiClient` class wrapping native `fetch` (not Axios). Key features:

- **Base URL**: `VITE_API_URL` env var or `/api/v1` fallback
- **Auth interceptors**: `setAuthInterceptors()` registers refresh + unauthorized handlers (injected by `AuthContext`)
- **Single-flight token refresh**: Deduplicates concurrent refresh attempts via a shared `refreshPromise`
- **Auto-refresh**: 401 responses trigger automatic token refresh + retry (except for `/auth/login`, `/auth/register`, `/auth/refresh`)
- **Session expiry**: Persistent 401 after refresh triggers `unauthorizedHandler` → clears tokens + redirects to login
- **Standard API response shape**: `{ success, data, meta, error }` with `ApiError` class
- **Blob support**: `getBlob()` for file downloads

File uploads (`api/files.ts`) use raw `XMLHttpRequest` for progress tracking, bypassing the `ApiClient` class.

---

## 10. Authentication and Authorization

### 10.1 JWT Token System

The system uses a dual-token architecture:

| Token | Algorithm | Lifetime | Storage | Purpose |
|-------|-----------|----------|---------|---------|
| Access Token | HS256 | 15 minutes | Memory (React state) | API authentication |
| Refresh Token | HS256 | 30 days | localStorage | Token rotation |

Access and refresh tokens use **separate secrets** (`JWT_SECRET` and `JWT_REFRESH_SECRET`). This is a defense-in-depth measure — compromising the access token secret does not compromise refresh tokens.

Access token payload:
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "type": "access",
  "jti": "uuid"
}
```

### 10.2 Token Lifecycle

1. **Register/Login** → `generateTokens()` creates both tokens, persists refresh token record (30-day expiry), creates session record (7-day expiry with IP + User-Agent)
2. **Refresh** → validates refresh token, generates new pair, revokes old refresh token (rotation)
3. **Logout** → revokes specific refresh token + all user refresh tokens + all sessions
4. **Me** → decodes access token, returns user profile from database

### 10.3 Account Lockout

After **5 consecutive failed login attempts**, the account is locked for **30 minutes**. The lockout check happens **before** password comparison — this prevents timing-based password enumeration (an attacker cannot determine whether the password was wrong or the account was locked).

The counter resets on successful login. Admins can manually unlock accounts via `POST /auth/unlock` (SUPER_ADMIN/ADMIN only).

### 10.4 OAuth 2.0

The system supports Google and GitHub OAuth with a backend-initiated redirect flow:

1. Frontend calls `oauthRedirect(provider)` → browser redirects to `GET /auth/oauth/google`
2. Backend constructs OAuth consent URL with client ID, redirect URI, scopes
3. User authenticates with provider → provider redirects to `GET /auth/oauth/:provider/callback`
4. Backend exchanges authorization code for tokens → fetches user profile from provider API
5. **Find-or-create logic**:
   - Check `provider + providerId` (compound unique) → link if found
   - Check `email` match → link to existing account
   - Create new user in default organization
6. Create session + refresh token → redirect to frontend `/auth/callback` with tokens in URL params

### 10.5 Role-Based Access Control

Four roles exist in the `UserRole` enum: `super_admin`, `admin`, `moderator`, `support`.

RBAC is enforced at two levels:

**Backend**: `requireRole(...roles)` middleware checks `req.user.role` against allowed roles. Applied per-route. For example, user deletion requires `super_admin`, while user listing requires any authenticated user.

**Frontend**: Navigation items have `allowedRoles` arrays. The sidebar renders only items the current user's role permits. This is a UX convenience, not a security measure — the backend is the authority.

There is no standalone Role database model. Roles are enum values on the User model. This simplifies the system (no role-permission join tables) while still providing meaningful access differentiation across the four-tier hierarchy.

---

## 11. Multi-Tenancy

### 11.1 Organization Model

The `Organization` model is the root tenant entity. Every other model has an `organizationId` foreign key pointing to it. The Organization contains `name`, `slug` (unique), and `logoUrl`.

### 11.2 Org-Scoped Resources

```
Organization (1)
  ├── (N) Users
  ├── (N) UserProfiles
  ├── (N) SystemSettings       @@unique([organizationId, key])
  ├── (N) AuditLogs
  ├── (N) Sessions
  ├── (N) RefreshTokens
  ├── (N) Files
  ├── (N) ChatConversations
  ├── (N) ChatMessages (via Conversation)
  ├── (N) Reports
  ├── (N) ReportTemplates
  └── (N) DataSources
```

### 11.3 Enforcement Model

Multi-tenancy is enforced at the **repository layer**, not middleware. Every repository method accepts `organizationId` as a parameter and includes it in Prisma `where` clauses:

```typescript
async findAll(params: { organizationId: string; page?: number; perPage?: number }) {
  const where = { organizationId: params.organizationId };
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take }),
    prisma.user.count({ where }),
  ]);
  return { items, total };
}
```

The `organizationId` is extracted from the JWT payload (`req.user.organizationId`) and passed through the service layer to repositories. Users cannot access resources from other organizations — there is no cross-tenant query path for normal users.

**Super Admin exception**: `SUPER_ADMIN` users can optionally query across organizations by passing `undefined` for `organizationId`. This is restricted to specific administrative operations (e.g., organization management) and gated by `requireRole('super_admin')`.

### 11.4 Compound Unique Constraints

- **SystemSetting**: `[organizationId, key]` — ensures setting keys are unique within an organization but can repeat across organizations
- **User**: `[provider, providerId]` — ensures OAuth provider accounts are unique globally (not per-org)

### 11.5 Onboarding

The `OnboardingService` creates the first organization and admin user. It uses `findDefaultOrCreate()` (an upsert pattern) to ensure idempotency — running the onboarding flow twice returns the existing organization rather than creating duplicates.

---

## 12. AI Integration Strategy

### 12.1 Provider Architecture

The AI system uses a **Strategy pattern** with a pluggable provider interface:

```
AIProvider (interface)
  ├── OpenCodeProvider    — Free-tier models (mimo-v2.5-free, deepseek-v4-flash-free, nemotron-3-ultra-free)
  ├── OpenAIProvider      — GPT-4, GPT-4o-mini
  ├── AnthropicProvider   — Claude Sonnet 4, Claude Haiku 3.5
  └── MockAIProvider      — Built-in fallback (always available)
```

**Priority chain**: OpenCode → OpenAI → Anthropic → Mock (fallback)

Provider availability is determined by environment variables (`OPENCODE_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`). If no API key is configured, the system falls back through the chain until it reaches the Mock provider, which always returns a helpful response.

### 12.2 Retrieval-Augmented Generation (RAG)

The RAG system makes the AI data-aware by injecting real-time organizational context into every completion:

```
User Message
  → ChatService.sendMessage()
    → ContextBuilder.buildContext(orgId, userId)
      → data-access.ts: parallel fetch of org data
        ├── User summaries (count, roles, recent)
        ├── Recent audit logs (last 20 events)
        ├── System settings (sensitive keys filtered)
        ├── File storage stats
        ├── Dashboard KPIs
        ├── User activity
        └── Chat statistics
      → Format as structured text (~2000 token budget)
      → Cache for 60 seconds per org+user key
    → Inject context into system prompt
    → AIProvider.complete(messages)
    → Return response with citations
```

The `data-access.ts` module provides **read-only** query functions scoped to the user's organization. It never writes data — it only reads for context purposes. Sensitive settings (API keys, secrets) are filtered out before injection.

The `context-builder.ts` manages cache TTL (60 seconds) and token budget (~2000 tokens). If context exceeds the budget, it truncates oldest/least-relevant data first.

### 12.3 Data Connector (AI Agent)

The Data Connector extends AI capabilities to external REST APIs:

1. Admin configures an external API (base URL, auth type, headers)
2. Backend fetches the API response via `http-client.ts` (timeout-guarded)
3. `analyzer.ts` normalizes the JSON, infers field types, generates a heuristic visualization spec
4. When an AI key is configured, the analyzer sends the data structure to the AI for chart recommendation
5. Frontend renders the auto-generated charts in the Data Explorer page

Auth secrets (bearer tokens, API keys, basic auth credentials) are stored server-side in the `DataSource` model and **never returned in API responses** (masked with `••••`).

### 12.4 OpenCode Provider Implementation

The OpenCode provider connects to OpenCode's free-tier API using an OpenAI-compatible interface:

- **Base URL**: `https://opencode.ai/zen/v1`
- **Free models**: `mimo-v2.5-free`, `deepseek-v4-flash-free`, `nemotron-3-ultra-free`, `north-mini-code-free`
- **Reasoning model support**: When `content` is null, extracts reasoning from `reasoning`, `reasoning_content`, or `reasoning_details` fields
- **Streaming**: Supports SSE streaming via the `/chat/completions` endpoint

---

## 13. Event-Driven Communication

### 13.1 WebSocket Architecture

The real-time system is built on Socket.IO, sharing the same HTTP server as the Express API:

```
Express HTTP Server (port 5000)
  ├── /api/v1/*    → Express routes
  └── /socket.io/  → Socket.IO handshake
```

### 13.2 Connection Lifecycle

1. Client connects with JWT token (via `handshake.auth.token` or `handshake.query.token`)
2. Server validates token, extracts `userId` and `organizationId`
3. Server creates `SocketConnection` record and adds socket to `org:<organizationId>` room
4. Server broadcasts `presence:update` to the org room
5. Server sends `connection:established` to the client
6. Client subscribes to additional rooms as needed

### 13.3 Event Protocol

| Event | Direction | Payload | Source |
|-------|-----------|---------|--------|
| `connection:established` | Server → Client | `{ clientId, userId, organizationId }` | On connect |
| `presence:update` | Server → Client | `{ organizationId, onlineCount, users[] }` | On connect/disconnect |
| `audit:created` | Server → Client | `AuditLogDTO` | `AuditLogRepository.create()` |
| `report:status` | Server → Client | `{ reportId, status, progress }` | `ReportsService` |
| `notification` | Server → Client | `WsNotificationPayload` | Server push |
| `subscribe` / `unsubscribe` | Client → Server | `{ room }` | Client request |
| `ping` / `pong` | Bidirectional | `{ timestamp }` | Heartbeat |

### 13.4 Integration with Repository Layer

WebSocket broadcasts are woven into repository writes, not service methods. When `AuditLogRepository.create()` is called, it triggers a best-effort broadcast:

```typescript
async create(data: CreateAuditLogData) {
  const log = await prisma.auditLog.create({ data });
  broadcastAuditCreated(log); // best-effort, catches silently
  return log;
}
```

This makes real-time events transparent to business logic — services don't need to know about WebSocket infrastructure.

### 13.5 Presence System

The Socket.IO manager maintains an in-memory presence map:

```
Map<orgId, Map<userId, { userId, firstName, lastName, role, avatarUrl, connectedAt }>>
```

On connect/disconnect, the manager broadcasts `presence:update` to the org room, which the frontend's `PresenceIndicator` consumes to show online users.

### 13.6 Graceful Degradation

On Vercel's serverless runtime, WebSocket connections cannot persist. The system degrades gracefully:

1. Client probes `GET /api/v1/ws/status` before connecting
2. If WebSocket is unavailable, the client operates in REST-only mode
3. `broadcastAuditCreated()` becomes a no-op (catches failures silently)
4. Live notifications fall back to periodic REST polling
5. Presence indicators are hidden

### 13.7 Rate Limiting

WebSocket connections are rate-limited: max 10 connection attempts per IP per minute using a sliding window algorithm. This prevents brute-force token guessing over the WebSocket transport.

---

## 14. Data Layer

### 14.1 Database Schema

The Prisma schema defines 14 models organized around multi-tenancy:

| Model | Purpose | Key Features |
|-------|---------|-------------|
| `Organization` | Root tenant entity | `slug` (unique), `logoUrl` |
| `User` | Authentication entity | email, passwordHash (optional for OAuth), role, provider/providerId, failedLoginAttempts, lockedUntil |
| `UserProfile` | Extended user data | 16+ preference fields, address, KYC status, notification prefs |
| `KycDocument` | KYC verification docs | Links to File model, verification status |
| `RefreshToken` | JWT refresh tokens | token (unique), userId, expiresAt, revokedAt |
| `Session` | Login sessions | token, ipAddress, userAgent, lastActivity |
| `AuditLog` | Audit trail | action, entity, entityId, metadata (JSON), 8 indexes |
| `SystemSetting` | Org-scoped key-value | compound unique `[organizationId, key]` |
| `Report` | Generated reports | type, format, status (async), params, fileUrl (data URL) |
| `ReportTemplate` | Saved report configs | type, format, config (JSON) |
| `File` | File storage | Self-referential folder hierarchy, StorageProvider enum |
| `ChatConversation` | AI conversations | title, model, systemPrompt, isArchived |
| `ChatMessage` | AI messages | role (ChatRole), content, tokenCount, metadata (JSON) |
| `DataSource` | External REST APIs | method, baseUrl, authType/authConfig, lastResult (cached) |

### 14.2 Indexes

The `AuditLog` model has 8 indexes for query performance:
- `[organizationId, createdAt]` — most common query pattern
- `[organizationId, action]` — filtered by action type
- `[organizationId, entity]` — filtered by entity type
- `[userId]` — user-specific audit history
- `[createdAt]` — time-range queries
- `[action]` — action-type analytics
- `[entity, entityId]` — entity-specific history
- `[organizationId, userId, createdAt]` — composite user+org+time

### 14.3 Cascade Rules

- **User deletion** → cascades to RefreshToken, Session, AuditLog, UserProfile
- **Organization deletion** → cascades to most child models (Users, Settings, Files, etc.)
- **File/Report deletion** → uses Restrict on some foreign keys to prevent orphaned references

### 14.4 Prisma Client

- **Generated client**: `apps/api/src/generated/prisma/` (committed to repo)
- **Singleton**: `apps/api/src/utils/prisma.ts` caches the PrismaClient instance across dev hot reloads
- **Adapter**: `PrismaPg` for hosted PostgreSQL via `prisma postgres link`
- **BigInt polyfill**: Global `JSON.stringify` override prevents crashes on Prisma `BigInt` fields (File.size)

---

## 15. Security Architecture

### 15.1 Security Layers

The system applies defense-in-depth across 10 distinct layers:

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| 1 | Helmet CSP | Restricts script sources, prevents XSS, blocks framing |
| 2 | CORS | Origin allow-listing for cross-origin requests |
| 3 | CSRF/Origin Check | Rejects state-changing requests from unauthorized origins |
| 4 | Rate Limiting | Prevents brute-force and DDoS (auth: 5/15min, API: 100/min) |
| 5 | Input Sanitization | Strips `<script>`, event handlers, `javascript:` URIs |
| 6 | Zod Validation | Enforces strict request schemas |
| 7 | JWT Authentication | Stateless token verification with refresh rotation |
| 8 | RBAC | Role-based route protection |
| 9 | Account Lockout | 5 failed attempts → 30 min lockout |
| 10 | Audit Trail | Records all critical actions for forensics |

### 15.2 Content Security Policy

The CSP is configured via Helmet with the following directives:

- `script-src 'self'` — only self-hosted scripts
- `style-src 'self' 'unsafe-inline'` — allows MUI's runtime style injection
- `img-src 'self' data: blob:` — images from self, data URIs, blobs (production restricts further)
- `frame-src 'none'` — no iframes
- `object-src 'none'` — no plugins
- `base-uri 'self'` — no base tag injection
- `form-action 'self'` — no form hijacking
- `frame-ancestors 'none'` — no embedding
- `upgrade-insecure-requests` — HTTPS enforcement (production only)

### 15.3 Password Policy

Enforced in `@vestara/constants` and validated by `@vestara/validation`:

- Minimum 8 characters, maximum 128
- Requires uppercase, lowercase, number, and symbol
- Common password blocklist (28 breached passwords from HaveIBeenPwned)
- Server-authoritative strength scoring via `POST /auth/password-strength`

### 15.4 Request Tracing

Every request receives a UUID `X-Request-Id` header (or accepts a client-provided one). The ID is attached to request logs for distributed tracing and audit correlation. This enables tracing a single user action across frontend → API → database → WebSocket.

---

## 16. Observability

### 16.1 Structured Logging

All backend logging uses Pino, producing structured JSON output:

```json
{
  "level": 30,
  "time": 1689123456789,
  "reqId": "uuid",
  "method": "POST",
  "url": "/api/v1/auth/login",
  "status": 200,
  "duration": 45
}
```

Request logs include method, URL, status code, and duration. Error logs include stack traces for 5xx errors.

### 16.2 Audit Trail

The `AuditLog` table is the system's comprehensive audit trail. Every critical action generates an entry:

- **Authentication**: register, login, logout, OAuth, password changes, account lockout
- **User management**: create, update, delete, status toggle, bulk operations
- **Settings**: create, update, import, export
- **Data sources**: create, update, delete, fetch
- **File operations**: upload, delete, move, folder creation
- **Errors**: 5xx API errors (method, path, status, stack trace)

Each entry records: `action`, `entity`, `entityId`, `userId`, `organizationId`, `metadata` (JSON), `ipAddress`, `userAgent`, `createdAt`.

### 16.3 Health Endpoints

| Endpoint | Auth | Data |
|----------|------|------|
| `GET /health` | None | Status, uptime, environment |
| `GET /health/deep` | None | DB connectivity, memory, uptime, p50/p95/p99 latency, error rate, RPS, WS connections |
| `GET /metrics` | ADMIN+ | Prometheus text format: request counters, duration percentiles, error rates, route breakdown, memory, uptime |
| `GET /metrics/json` | ADMIN+ | Same data in JSON format for dashboard consumption |

### 16.4 Request Metrics

The `requestLogger` middleware records per-request metrics:

- Total request count
- Request duration (p50, p95, p99 percentiles)
- Error rate (4xx and 5xx)
- Requests per second
- Route-level breakdown

These are exposed via the `/metrics` endpoint and consumed by the Monitoring page in the frontend.

### 16.5 Error Tracking

The global error handler persists API errors as audit-log entries:

```typescript
if (req.user && statusCode >= 500) {
  await auditLogService.create({
    action: AuditAction.ERROR,
    entity: 'api',
    entityId: `${req.method} ${req.path}`,
    userId: req.user.id,
    organizationId: req.user.organizationId,
    metadata: { status: statusCode, code, message, stack: err.stack },
  });
}
```

This creates an automatic error trail visible in the System Logs page, with red error chips and Error icons for quick identification.

---

## 17. Deployment Topology

### 17.1 Vercel (Cloud — Current)

```
GitHub (main branch)
  → GitHub Actions CI (typecheck, lint, test, build)
    → Vercel Auto-Deploy
      ├── Web: Static SPA (CDN, edge caching)
      └── API: Serverless Function (/api/v1)
            └── Prisma Postgres (hosted PostgreSQL)
```

**Web**: Vite-built static SPA deployed to Vercel's CDN. Immutable assets cached for 1 year. SPA rewrite rules handle client-side routing.

**API**: Express server mounted as a Vercel serverless function under `/api/v1`. Handles all API routes, authentication, and business logic.

**Limitations**: Serverless functions cannot maintain persistent WebSocket connections. The system degrades gracefully (broadcasts become no-ops, live features fall back to REST polling).

### 17.2 Self-Hosted (Alternative — Production)

```
GitHub (main branch)
  → GitHub Actions CI
    → SSH Deploy (scripts/deploy.sh)
      ├── Ubuntu 22.04 VPS
      │   ├── Nginx (reverse proxy + TLS + Let's Encrypt)
      │   ├── PM2 (Node.js process manager, forked mode)
      │   ├── PostgreSQL 17
      │   └── Redis 8
      └── Atomic release swap (symlink-based)
```

**Nginx** serves the SPA, proxies `/api/v1/` to the Node.js backend, handles WebSocket upgrades for `/socket.io/`, and manages TLS termination. Security headers (CSP, HSTS, X-Content-Type-Options) are applied at the Nginx level.

**PM2** runs the Express server in forked mode (required for WebSocket and BullMQ in-process state). It loads secrets from `.env.deploy` and provides systemd auto-start on boot.

**Deploy script** (`scripts/deploy.sh`): Builds the web app locally, rsyncs to a timestamped release directory on the server, performs an atomic symlink swap, prunes old releases (keeps 5), and reloads Nginx. The optional `--api` flag triggers a remote API rebuild with Prisma migration.

### 17.3 Local Development

```
Docker Compose
  ├── PostgreSQL 17 (port 5432)
  └── Redis 8 (port 6379)

pnpm dev:local
  ├── docker compose up (background)
  ├── prisma generate + migrate + seed
  ├── Vite dev server (port 5173)
  └── Express API (port 5000)
```

Vite proxies `/api` requests to `:5000` for seamless development. The `dev-local.sh` script handles the full bootstrap sequence with optional `--skip-db`, `--no-seed`, and `--no-dev` flags.

### 17.4 Docker Production Stack

A full Docker Compose stack exists in `infrastructure/docker/` for containerized deployments:

- **postgres**: PostgreSQL 17 with health checks
- **redis**: Redis 8 with AOF persistence
- **api**: Multi-stage build (deps → build → runtime), runs `prisma db push` + seed on startup
- **web**: Multi-stage build, nginx:1.27-alpine serving static SPA

---

## 18. Scalability Considerations

### 18.1 Horizontal Scaling

The current architecture supports horizontal scaling through:

- **Stateless API**: JWT authentication means no server-side session state. Multiple API instances can run behind a load balancer.
- **Database**: PostgreSQL supports read replicas for query-heavy workloads.
- **Redis**: Can be clustered for cache/session scaling.
- **Static assets**: Vercel's CDN handles frontend scaling automatically.

### 18.2 Vertical Scaling

For single-server deployments (self-hosted):

- **PM2 cluster mode**: Can be enabled to utilize multiple CPU cores (currently forked mode for WebSocket compatibility).
- **PostgreSQL tuning**: Connection pooling, index optimization, query plan analysis.
- **Redis**: Memory scaling for session/cache storage.

### 18.3 Current Limitations

- **WebSocket**: Single-server only (no Redis adapter configured by default). Cross-instance broadcasting requires `@socket.io/redis-adapter`.
- **File storage**: Local filesystem in dev; Vercel Blob in cloud. S3 and Google Drive providers are stubbed but not implemented.
- **Report generation**: In-process async processing. Heavy report loads could benefit from a dedicated job queue (BullMQ + Redis).
- **AI completions**: Synchronous. Large prompts or slow providers can block the request thread.

### 18.4 Scaling Recommendations

For production workloads beyond single-server capacity:

1. Enable Redis adapter for WebSocket cross-instance broadcasting
2. Implement S3 storage provider for production file storage
3. Extract report generation to BullMQ workers
4. Add connection pooling via PgBouncer
5. Implement API response caching via Redis for frequently-accessed endpoints
6. Consider GraphQL Federation if the API surface grows beyond REST manageability

---

## 19. Performance Engineering

### 19.1 Frontend Performance

**Code splitting**: All 20 pages are lazy-loaded via `React.lazy()`. Vendor chunks are manually split (react, MUI, tanstack-query, markdown, socket.io). The initial `index` chunk was reduced from ~1.7 MB to ~304 KB.

**Query optimization**: TanStack Query defaults are tuned — `staleTime: 5min`, `gcTime: 30min`, `refetchOnWindowFocus: false`. This reduces unnecessary network requests.

**Memoization**: `React.memo` is applied to `StatCard` and `ActivityFeed` presentational components to prevent unnecessary re-renders.

**Image optimization**: All rendered images use `loading="lazy"` and `decoding="async"` for deferred loading.

**PWA**: `vite-plugin-pwa` with Workbox service worker (autoUpdate). Runtime caching for API health (NetworkFirst) and Google Fonts (StaleWhileRevalidate). 44 entries precached (2.4 MB) for offline support.

### 19.2 Backend Performance

**Database indexes**: The AuditLog model has 8 indexes optimized for the most common query patterns. All foreign keys are indexed by Prisma.

**Connection management**: Prisma Client maintains a connection pool. The singleton pattern ensures connections are reused across requests.

**Parallel execution**: Repository queries use `Promise.all` for independent reads (e.g., `findMany` + `count` for pagination, or parallel data access for RAG context building).

**Input size limits**: JSON body parser limited to 1MB. File uploads handled separately by Multer with per-route limits (5MB for images, 100MB for general files).

**Audit log cleanup**: A scheduled job purges audit logs older than 24 hours (configurable) to prevent table bloat.

### 19.3 Bundle Analysis

The Vite build uses `manualChunks` for vendor splitting:

```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'mui-vendor': ['@mui/material', '@mui/icons-material'],
  'tanstack-query': ['@tanstack/react-query'],
  'markdown': ['react-markdown', 'remark-gfm'],
  'socket.io': ['socket.io-client'],
}
```

This ensures that vendor libraries are cached independently and shared across page chunks.

---

## 20. Future Evolution

### 20.1 Platform Expansion

The architecture is designed to accommodate the planned Vestara domains:

| Domain | Architectural Impact | Preparation |
|--------|---------------------|-------------|
| Digital Wallet | New Prisma models, transaction services, payment provider integration | Org-scoped financial data follows existing multi-tenancy pattern |
| Marketplace | Product/service CRUD, order management, payment processing | File Manager and CRUD patterns are directly reusable |
| Bookings | Calendar system, scheduling logic, notification integration | Real-time WebSocket and notification infrastructure exists |
| Rewards | Points system, incentive rules, gamification | Settings and Audit Log patterns provide the governance layer |
| Workflow Automation | Job scheduling, orchestration, event-driven triggers | BullMQ integration is planned; Redis infrastructure exists |

### 20.2 AI Evolution

The AI system is designed to evolve from assistant to autonomous agent:

1. **Current**: Conversational assistant with RAG context (answers questions about data)
2. **Near-term**: Action-capable agent (can execute CRUD operations through tool definitions)
3. **Mid-term**: Multi-agent coordination (specialized agents for different domains)
4. **Long-term**: Autonomous operation (self-monitoring, self-healing, proactive alerts)

The Strategy pattern in the AI provider architecture makes it straightforward to add new providers (local LLMs, specialized models) without modifying existing code.

### 20.3 Multi-Repository Ecosystem

The Command Center establishes patterns that future repositories will follow:

```
Vestara Blueprint (strategy)
        ↓
Engineering Standards (rules)
        ↓
Command Center (reference implementation)
        ↓
Future Repositories (API, Mobile, SDK, CLI, Marketplace)
```

Each new repository will use the same `@vestara/*` shared packages, the same Zod validation schemas, the same TypeScript configuration, and the same architectural patterns. This consistency is the foundation of the Vestara ecosystem.

### 20.4 Infrastructure Evolution

| Phase | Current | Future |
|-------|---------|--------|
| Database | Single PostgreSQL | Read replicas + connection pooling |
| Cache | Redis (optional) | Redis Cluster |
| File Storage | Local / Vercel Blob | S3-compatible object storage |
| WebSocket | Single-server | Redis adapter for multi-instance |
| Job Queue | In-process async | BullMQ with Redis |
| Monitoring | Audit logs + health endpoints | OpenTelemetry + Prometheus + Grafana |
| CI/CD | GitHub Actions | Preview environments + canary deploys |

### 20.5 Technology Refresh

The technology stack is pinned to current stable versions. The upgrade path:

- **React 19** → leverage Server Components when Vite adds support
- **Express 5** → evaluate Hono or Fastify for performance-critical paths
- **Prisma 7** → track Prisma's evolution toward edge runtimes
- **MUI v7** → evaluate Radix or shadcn/ui if design requirements shift
- **TypeScript** → stay on latest stable; leverage new type-level features

The shared packages (`@vestara/*`) insulate application code from framework changes. Swapping a UI library or ORM affects only the consuming application, not the shared type definitions, validation schemas, or utility functions.

---

*This document is the canonical technical reference for the Vestara Command Center. It should be updated when architectural decisions change, new domains are added, or infrastructure evolves. Every future Vestara repository should reference this document as the baseline for architectural consistency.*
