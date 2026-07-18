# Changelog

> All notable changes to the Vestara Command Center.

---

## [Unreleased]

### Added

- Monitoring page with system health metrics (`/monitoring`)
- Metrics API endpoint (`GET /api/v1/metrics`)
- Monitoring API client and TanStack Query hooks

### Changed

- Updated README tech stack references (Fastify → Express 5, Recharts → MUI X Charts)

---

## [1.0.0-alpha] - 2026-07-18

### Added

#### Foundation (Phases 1-3)
- pnpm monorepo with Turborepo orchestration
- Shared packages: `@vestara/types`, `@vestara/constants`, `@vestara/validation`, `@vestara/utils`, `@vestara/config`
- Prisma 7 ORM with PostgreSQL 17 (Prisma Postgres)
- Database schema: User, Organization, Session, RefreshToken, AuditLog, SystemSetting
- Multi-tenancy via Organization model with `slug`-based identification
- Seed data (4 organizations, 11 users, 20 settings, 4 audit logs)

#### Backend (Phases 4-5)
- Express 5 server with full middleware stack (CORS, Helmet, body parser, request logger, validation, error handler)
- JWT authentication with access + refresh token rotation
- OAuth 2.0 (Google + GitHub) with backend-initiated redirect flow
- RBAC middleware (`requireRole`)
- User CRUD with bulk operations (bulk-delete, bulk-status)
- Settings CRUD with audit trail and versioning
- Audit logging for all critical actions
- Standard API response envelope (`{ success, data, error, meta }`)

#### Frontend (Phases 6-7)
- React 19 + Vite 6 + TypeScript (strict mode)
- Material UI v7 with custom gold/dark "Elite" theme
- Tailwind CSS v4 integration
- 17 UI components (Button, Input, Card, Modal, Tabs, etc.)
- Data components (DataTable, StatCard, ActivityFeed)
- Feedback components (Toast, Loading, EmptyState, ConfirmDialog)
- Auth context with login/logout/register/OAuth
- Route guards (ProtectedRoute, PublicRoute)

#### Dashboard (Phases 8-10)
- Gold-themed responsive sidebar with grouped navigation
- Responsive header with search, notifications, theme toggle
- KPI stat cards with real API data
- Charts: Audit Activity area, User Status donut, Activity bar charts
- Activity feed with real audit log data
- Global search dialog (Cmd/Ctrl+K)
- User preferences dialog (Appearance, Notifications, Localization tabs)
- Date range picker with presets

#### Authentication UI (Phase 11)
- Login, Register, Forgot Password, Reset Password pages
- Auth layout with brand panel + form panel
- OAuth buttons (Google + GitHub)
- Password strength indicator
- OAuth callback page (`/auth/callback`)

#### User Management (Phases 12-14)
- Full user CRUD with DataTable (sort, filter, paginate, select)
- Role badges, status toggle, bulk actions
- CSV export, server-side filtering
- Profile page with General + Security tabs
- Avatar upload, email change, account deletion

#### Reusable UI (Phases 15-17)
- Form components with react-hook-form + Zod integration
- DataTable with sort, filter, paginate, row selection
- Toast notifications (queue management, max 5)
- Loading states (Spinner, Skeleton, Overlay, Inline)
- Empty states (NoData, NoSearchResults, ErrorState)
- Modal/Dialog system (SimpleDialog, ConfirmDialog, AlertDialog)
- Enhanced Drawer (temporary/persistent/permanent)

#### File Management (Phase 18)
- Folder hierarchy with MUI breadcrumbs
- Drag-and-drop upload with XHR progress bar
- Multi-file upload (100MB limit)
- Storage provider abstraction (Local, Cloudinary, S3, Google Drive)
- Image preview, rename, move, delete, download
- Org-level storage config

#### Application Settings (Phase 19)
- Key-value settings editor with DataTable
- Export/import JSON with format detection
- Audit history with change tracking
- Org-scoped via compound unique `[organizationId, key]`

#### AI Platform (Phases 19b-19e)
- Multi-provider AI chat (OpenCode, OpenAI, Anthropic, Mock fallback)
- RAG context injection from live org data (users, audit logs, settings, files, KPIs)
- Conversation history with model selection
- Floating chat widget (Cmd+Shift+K toggle, page-aware suggestions)
- Data connectors with AI-assisted visualization
- External REST API integration with heuristic chart suggestions

#### Reporting (Phase 20)
- 4 report types (audit-logs, users, activity, system-logs)
- 3 export formats (CSV, Excel via exceljs, PDF via pdfkit)
- Report templates CRUD
- Report comparison (side-by-side)
- Dashboard widget
- WebSocket real-time progress events
- PDF branding with organization logo

#### Real-Time (Phases 21-22)
- WebSocket server (`ws`) with JWT auth via query-param
- Org-scoped rooms and presence tracking
- Live notifications from `audit:created` events
- Dashboard live refresh via `useLiveDashboard`
- Presence indicator (online users)
- LIVE connection badge
- Auto-reconnect with exponential backoff + jitter

#### Security (Phase 23)
- Rate limiting (auth: 5/15m, API: 100/min, health: permissive)
- CSRF/origin verification on state-changing requests
- Password policies (length, character classes, common password blocklist)
- Account lockout (5 failed attempts → 30 min)
- XSS protection (CSP, sanitization middleware, `javascript:` URI stripping)
- NoSQL/prototype-pollution guards
- X-Request-Id for distributed tracing
- Body size limits (1 MB global)
- WebSocket rate limiting (10 connections/min/IP)

#### Production (Phases 27-30)
- Vercel deployment (serverless API + static SPA)
- Self-hosted deployment (Nginx + PM2 + Ubuntu VPS)
- GitHub Actions CI/CD
- Comprehensive documentation portal
- Architecture Decision Records (7 ADRs)
- In-app documentation page (`/docs`)

---

## [0.1.0] - 2026-07-12

### Added

- Initial project scaffolding
- Monorepo setup with pnpm + Turborepo
- Basic Express server
- Basic React app with Vite
- Prisma schema and initial migration
- Authentication (register, login, refresh, logout)
- Basic dashboard layout

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/).

- **MAJOR** — Breaking changes to API or database schema
- **MINOR** — New features, backward-compatible
- **PATCH** — Bug fixes, security patches

Releases are tagged in Git and deployed automatically via GitHub Actions.
