# Diagrams

> VDS-106 — Repository structure and module relationship diagrams.

---

## Top-Level Structure

```text
vestara-admin-dashboard/
│
├── .github/                    GitHub Actions workflows and templates
├── apps/
│   ├── api/                    Express 5 backend (@vestara/api)
│   │   ├── prisma/             Database schema, migrations, seed
│   │   └── src/                API source code
│   │
│   └── web/                    React 19 SPA (@vestara/web)
│       └── src/                Frontend source code
│
├── docs/                       Documentation portal
│   ├── assets/                 Visual assets (diagrams, screenshots)
│   ├── decisions/              Architecture Decision Records
│   └── standards/              Engineering standards
│
├── packages/                   Shared monorepo packages
│   ├── types/                  @vestara/types
│   ├── constants/              @vestara/constants
│   ├── validation/             @vestara/validation
│   ├── utils/                  @vestara/utils
│   └── config/                 @vestara/config
│
├── screens/                    Product screenshots
├── turbo.json                  Turborepo pipeline config
├── pnpm-workspace.yaml         Workspace definition
├── package.json                Root package.json
└── README.md                   Repository overview
```

---

## Frontend Source Structure

```text
apps/web/src/
│
├── api/                        API client functions
│   ├── files.ts                File operations
│   ├── monitoring.ts           System metrics
│   └── agent.ts                Data connector operations
│
├── components/                 Shared UI components
│   ├── charts/                 ChartCard, chart wrappers
│   ├── data/                   DataTable, StatCard, ActivityFeed
│   ├── feedback/               Toast, Loading, EmptyState
│   └── ui/                     Button, Input, Card, Modal, Tabs, etc.
│
├── features/                   Domain-specific modules
│   ├── analytics/              Chart aggregation hooks, date range utils
│   ├── calendar/               DateRangeContext, CalendarDatePicker
│   ├── chat/                   AI chat page, hooks, API
│   ├── files/                  File manager hooks, API
│   ├── integrations/           Data connector hooks, API
│   ├── monitoring/             Monitoring page, hooks, API
│   ├── profile/                Profile page, tabs config
│   ├── realtime/               Live notifications, presence, dashboard
│   ├── reports/                Report hooks, API, components
│   └── settings/               Settings hooks, API
│
├── hooks/                      Shared custom hooks
├── layouts/
│   ├── DashboardLayout.tsx     Main layout (sidebar + header + outlet)
│   ├── Header.tsx              Top bar (search, notifications, user menu)
│   ├── Sidebar.tsx             Gold-themed navigation sidebar
│   └── navConfig.ts            Navigation structure and RBAC rules
│
├── pages/                      Route page components
│   ├── DashboardPage.tsx       /
│   ├── AnalyticsPage.tsx       /analytics
│   ├── UsersPage.tsx           /users
│   ├── ReportsPage.tsx         /reports
│   ├── SettingsPage.tsx        /settings
│   ├── FilesPage.tsx           /files
│   ├── ChatPage.tsx            /chat
│   ├── OrganizationsPage.tsx   /organizations
│   ├── IntegrationsPage.tsx    /integrations
│   ├── DataExplorerPage.tsx    /data-explorer
│   ├── SystemLogsPage.tsx      /system-logs
│   ├── MonitoringPage.tsx      /monitoring
│   ├── AdminPage.tsx           /admin
│   └── ProfilePage.tsx         /profile, /security, /preferences
│
├── routes/
│   └── index.tsx               React Router config with lazy loading
│
├── theme/
│   ├── ThemeContext.tsx         Theme provider (light/dark)
│   └── tokens.ts               MUI theme tokens
│
├── websocket/
│   ├── WebSocketClient.ts      Typed pub/sub with auto-reconnect
│   └── WebSocketProvider.tsx   Connection provider
│
├── types/                      Frontend-specific types
├── utils/                      Client-side utilities
├── App.tsx                     Root component
├── main.tsx                    Entry point
└── index.css                   Global styles
```

---

## Backend Source Structure

```text
apps/api/src/
│
├── config/
│   └── index.ts                Environment variable loading
│
├── generated/
│   └── prisma/                 Auto-generated Prisma Client
│
├── lib/
│   └── prisma.ts               Prisma Client singleton
│
├── middleware/
│   ├── authenticate.ts         JWT decode + req.user attachment
│   ├── authorize.ts            requireRole() RBAC middleware
│   ├── csrf.ts                 CSRF/origin verification
│   ├── errorHandler.ts         Global error handler
│   ├── rateLimiter.ts          Rate limiting (auth, API, health)
│   ├── request-logger.ts       Pino HTTP request logging
│   ├── requestId.ts            X-Request-Id UUID header
│   ├── sanitize.ts             Input sanitization (XSS defense)
│   └── validate.ts             Zod schema validation
│
├── repositories/               Data access layer
│   ├── user.repository.ts
│   ├── settings.repository.ts
│   ├── audit-log.repository.ts
│   ├── session.repository.ts
│   ├── refresh-token.repository.ts
│   ├── file.repository.ts
│   ├── report.repository.ts
│   ├── chat.repository.ts
│   └── data-source.repository.ts
│
├── routes/                     HTTP route definitions
│   ├── auth.ts                 POST /auth/register, /login, /refresh
│   ├── users.ts                GET /users, POST, PUT, DELETE, PATCH
│   ├── settings.ts             GET /settings, POST, PUT, DELETE
│   ├── audit-logs.ts           GET /audit-logs
│   ├── profile.ts              GET /profile, PUT, PUT /password
│   ├── files.ts                GET /files, POST /upload, DELETE
│   ├── reports.ts              POST /reports/generate, GET
│   ├── chat.ts                 POST /chat/send, GET /conversations
│   ├── integrations.ts         GET /integrations, POST, DELETE
│   ├── metrics.ts              GET /metrics
│   ├── health.ts               GET /health
│   └── index.ts                Mounts all routes under /api/v1
│
├── services/                   Business logic
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── settings.service.ts
│   ├── audit-log.service.ts
│   ├── profile.service.ts
│   ├── file.service.ts
│   ├── report.service.ts
│   ├── chat.service.ts
│   ├── context-builder.ts      RAG context assembly
│   └── integrations/
│       ├── agent.service.ts
│       ├── analyzer.ts
│       └── http-client.ts
│
├── utils/
│   └── metrics.ts              System health metrics
│
├── websocket/
│   └── WebSocketManager.ts     WebSocket server with auth + org rooms
│
├── types/
│   └── express.d.ts            Express Request type augmentation
│
└── index.ts                    Server entry point
```

---

## Shared Packages Structure

```text
packages/
│
├── types/
│   └── src/
│       ├── index.ts            Re-exports all types
│       ├── user.ts             UserRole, UserDTO, CreateUserDTO
│       ├── audit.ts            AuditAction, AuditLogDTO
│       ├── settings.ts         SystemSettingDTO
│       ├── reports.ts          ReportType, ReportFormat, ReportDTO
│       ├── chat.ts             ChatConversation, ChatMessage
│       ├── files.ts            FileDTO, StorageProvider
│       ├── data-source.ts      DataSource, DataSourceDTO
│       └── api.ts              Standard API response types
│
├── validation/
│   └── src/
│       ├── index.ts            Re-exports all schemas
│       ├── user.ts             createUserSchema, updateUserSchema
│       ├── auth.ts             loginSchema, registerSchema
│       ├── settings.ts         createSettingSchema
│       └── data-source.ts      createDataSourceSchema
│
├── constants/
│   └── src/
│       ├── index.ts
│       ├── pagination.ts       DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
│       └── config.ts           APP_NAME, API_VERSION
│
├── utils/
│   └── src/
│       ├── index.ts
│       ├── date.ts             formatDate, formatRelativeTime
│       ├── string.ts           capitalize, slugify, truncate
│       └── pagination.ts       buildPaginationMeta
│
└── config/
    └── src/
        ├── index.ts
        └── env.ts              Environment variable parsing
```

---

## Feature Module Structure

```text
features/feature-name/
│
├── components/                 Feature-specific UI components
│   ├── FeatureDialog.tsx
│   ├── FeatureTableColumns.tsx
│   └── FeatureStatsCards.tsx
│
├── hooks.ts                    TanStack Query hooks
│   ├── useFeatureQuery
│   ├── useFeatureCreate
│   ├── useFeatureUpdate
│   └── useFeatureDelete
│
├── api.ts                      API client functions
│   ├── list
│   ├── getById
│   ├── create
│   ├── update
│   └── delete
│
└── types.ts                    Feature-specific types (if any)
```

---

## Package Dependencies

```text
@vestara/web (Frontend)
  ├── depends on → @vestara/types
  ├── depends on → @vestara/validation
  ├── depends on → @vestara/constants
  └── depends on → @vestara/utils

@vestara/api (Backend)
  ├── depends on → @vestara/types
  ├── depends on → @vestara/validation
  ├── depends on → @vestara/constants
  └── depends on → @vestara/utils

@vestara/validation
  └── depends on → @vestara/types

@vestara/utils
  └── depends on → @vestara/constants
```
