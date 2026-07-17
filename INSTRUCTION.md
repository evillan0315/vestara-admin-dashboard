# Production-Ready Full-Stack Development Roadmap

You are an expert full-stack software architect and senior engineer.

Your task is to build a **production-ready full-stack application** incrementally. Each task in this roadmap represents a complete milestone that must be fully implemented, integrated with previous work, and production-ready before moving on.

---

## General Requirements

For every task:

- Produce complete, working code only.
- Maintain strict TypeScript throughout the entire project.
- Follow modern best practices and clean architecture.
- Keep the project modular, scalable, and maintainable.
- Avoid placeholders, TODOs, mock implementations, or incomplete features unless explicitly requested.
- Reuse existing code whenever appropriate instead of duplicating logic.
- Refactor when necessary to improve architecture without breaking existing functionality.
- Ensure all newly added features integrate seamlessly with previous phases.
- Keep a consistent folder structure, coding style, naming conventions, and architecture.
- Every feature should be immediately runnable after completion.

---

# Technology Stack

### Frontend

| Technology       | Purpose                 |
| ---------------- | ----------------------- |
| React 19         | User Interface          |
| TypeScript       | Type Safety             |
| Vite             | Build Tool              |
| Material UI v7+  | Component Library       |
| Tailwind CSS v4+ | Utility Styling         |
| React Router     | Routing                 |
| Zustand          | Client State Management |
| TanStack Query   | Server State & Caching  |
| React Hook Form  | Form Handling           |
| Zod              | Validation              |
| Axios            | HTTP Client             |

### Backend

| Technology    | Purpose                                  |
| ------------- | ---------------------------------------- |
| Express 5     | API Framework                            |
| TypeScript    | Backend Logic                            |
| Prisma ORM 7  | Database ORM (Prisma Postgres)           |
| PostgreSQL 17 | Primary Database                         |
| JWT           | Authentication (Access + Refresh Tokens) |
| Redis         | Cache & Sessions                         |
| BullMQ        | Background Jobs / Queue                  |
| Pino          | Structured Logging                       |
| OpenAPI       | API Documentation & Validation           |

### Infrastructure

| Technology            | Purpose                             |
| --------------------- | ----------------------------------- |
| pnpm                  | Package Manager                     |
| Turborepo             | Monorepo Build Orchestration        |
| Docker                | Containerization                    |
| Vercel                | Frontend Hosting (+ API Serverless) |
| Railway / VPS         | Backend Hosting                     |
| Nginx                 | Reverse Proxy                       |
| S3 Compatible Storage | Object Storage                      |
| Cloudflare            | CDN & Security                      |

### Development

| Tool                       | Purpose                   |
| -------------------------- | ------------------------- |
| ESLint                     | Static Analysis / Linting |
| Prettier                   | Code Formatting           |
| TypeScript Strict Mode     | Type Safety               |
| Feature-Based Architecture | Module Organization       |
| Path Aliases               | Import Readability        |
| Environment Configuration  | Runtime Settings          |
| Vitest                     | Testing Framework         |
| Supertest                  | HTTP Integration Testing  |

---

# Phase Status Overview

| Phase | Name                     | Status         | Progress |
| ----- | ------------------------ | -------------- | -------- |
| 1     | Project Initialization   | ✅ Complete    | 100%     |
| 2     | Shared Architecture      | ✅ Complete    | 100%     |
| 3     | Database                 | ✅ Complete    | 100%     |
| 4     | Express Server           | ✅ Complete    | 100%     |
| 5     | Authentication API       | ✅ Complete    | 100%     |
| 6     | React Foundation         | ✅ Complete    | 100%     |
| 7     | Design System            | ✅ Complete    | 100%     |
| 8     | Dashboard Layout         | ✅ Complete    | 100%     |
| 9     | Dashboard Widgets        | ✅ Complete    | 100%     |
| 10    | Dashboard Features       | ✅ Complete    | 100%     |
| 11    | Authentication Pages     | ✅ Complete    | 100%     |
| 12    | User CRUD                | ✅ Complete    | 100%     |
| 13    | Roles & Permissions      | ✅ Complete    | 100%     |
| 14    | User Profile             | ✅ Complete    | 100%     |
| 15    | Reusable Forms           | ✅ Complete    | 100%     |
| 16    | Data Table               | ✅ Complete    | 100%     |
| 17    | Feedback Components      | ✅ Complete    | 100%     |
| 18    | File Manager             | ✅ Complete    | 100%     |
| 19    | Application Settings     | ✅ Complete    | 100%     |
| —     | AI Chatbot               | ✅ Complete    | 100%     |
| —     | AI Assistant RAG         | ✅ Complete    | 100%     |
| —     | Floating Chat Widget     | ✅ Complete    | 100%     |
| 20    | Reporting                | ✅ Complete    | 100%     |
| 21    | WebSocket Integration    | ✅ Complete    | 100%     |
| 22    | Live Features            | ✅ Complete    | 100%     |
| 23    | Security Hardening       | ⏳ In Progress | ~40%     |
| 24    | Monitoring               | ⏳ In Progress | ~70%     |
| 25    | Testing                  | ⏳ In Progress | ~25%     |
| 26    | Performance Optimization | ⏳ In Progress | ~60%     |
| —     | PWA Support              | ✅ Complete    | 100%     |
| 27    | Documentation            | ✅ Complete    | 100%     |
| 28    | Deployment               | ✅ Complete    | 100%     |
| 29    | CI/CD                    | ⏳ In Progress | ~60%     |
| 30    | Production Readiness     | ⏳ In Progress | ~55%     |

> **Note:** See [`ROADMAP.md`](./ROADMAP.md) for detailed implementation notes and GitHub project management strategy.

---

# Development Roadmap

## Phase 1 — Foundation

### 1. Project Initialization

**Status:** ✅ Complete
**Dependencies:** None — starting point

- Configure React, Express, and shared TypeScript workspace via pnpm monorepo + Turborepo
- Vite for frontend builds
- React Router for client-side routing
- Material UI v7+ component library integration
- Tailwind CSS v4+ utility styling
- ESLint + Prettier configuration
- Environment variables and `.env` setup
- Path aliases (`@/`, `@vestara/*`)
- Feature-based folder structure across all apps and packages
- Docker Compose for local development services (PostgreSQL, Redis)

---

### 2. Shared Architecture

**Status:** ✅ Complete
**Dependencies:** Phase 1

- **`@vestara/types`** — Shared TypeScript types, DTOs, enums (`UserRole`, `AuditAction`, etc.)
- **`@vestara/constants`** — Global constants (pagination defaults, rate limits, config keys)
- **`@vestara/validation`** — Zod validation schemas for all domains
- **`@vestara/utils`** — Shared utility functions (date formatting, string helpers, pagination helpers)
- **`@vestara/config`** — Shared configuration helpers (env parsing, defaults)

---

### 3. Database

**Status:** ✅ Complete
**Dependencies:** Phase 2

- Prisma ORM 7 with Prisma Postgres (hosted PostgreSQL via `prisma postgres link`)
- Database models: User, Session, RefreshToken, AuditLog, SystemSetting, Organization
- Multi-tenancy via Organization model with `slug`-based identification
- Org-scoped resources: users, settings, audit logs, sessions, tokens
- Compound unique constraint `[organizationId, key]` on settings
- Migrations and seed data (4 organizations, 11 users, 20 settings, 4 audit logs)
- Repository pattern base classes for data access
- `lib/prisma.ts` singleton with `PrismaPg` adapter

---

## Phase 2 — Backend

### 4. Express Server

**Status:** ✅ Complete
**Dependencies:** Phases 1–3

- Express 5 server initialization with full middleware stack:
  - CORS with allowed origins
  - Security headers (Helmet)
  - Body parser (JSON + URL-encoded)
  - Request logger (Pino)
  - Request validation (Zod middleware)
  - Global error handler (standardized error responses)
  - 404 handler
- Standard API response format (`{ success, data, error, meta }`)
- Configuration management via `@vestara/config`
- Health check endpoint (`GET /api/v1/health`)

---

### 5. Authentication API

**Status:** ✅ Complete
**Dependencies:** Phases 1–4

- User registration with email uniqueness guard (409 `USER_ALREADY_EXISTS`)
- Login with email + password (bcrypt hashing)
- JWT access tokens (short-lived) + refresh token rotation
- Logout (invalidate refresh tokens + sessions)
- Current user endpoint (`GET /auth/me`)
- OAuth 2.0: Google + GitHub with backend-initiated redirect flow
  - Find-or-create user logic by email
  - Provider linking for existing email accounts
  - Compound unique constraint on `[provider, providerId]`
- Role-based access control middleware (`requireRole`)
- `authenticate` middleware (JWT decode + `req.user` attachment)
- Audit logging for all auth events (login, register, logout, OAuth)
- Refresh-token rotation with duplicate-insert protection

**Cross-reference:** RBAC enforcement middleware is implemented here; the management UI for roles/permissions is tracked under Phase 13.

---

## Phase 3 — Frontend

### 6. React Foundation

**Status:** ✅ Complete
**Dependencies:** Phase 1

- Vite + React 19 project setup
- Material UI theme provider (light/dark)
- React Router v7 with nested route layouts
- TanStack Query provider and query client configuration
- Axios-based API client with interceptors (auth header injection, 401 refresh flow)
- Auth context (`AuthProvider`) with login/logout/register/me/oauthRedirect/handleOAuthCallback
- Route guards: `ProtectedRoute` (redirects to login) and `PublicRoute` (redirects to dashboard)
- Feature-based module structure under `src/features/`

---

### 7. Design System

**Status:** ✅ Complete
**Dependencies:** Phase 6

- MUI light/dark themes with gold luxury accents
- Tailwind CSS v4 integration alongside MUI
- **UI Components (17):** Button, Input, Select, Textarea, Checkbox (+CheckboxGroup), Radio (+RadioGroup), Switch (+SwitchGroup), Card, Modal, ConfirmDialog, Drawer, Sidebar, Badge, Avatar (+AvatarGroup), Tooltip, Tabs (+TabPanel), Breadcrumb, Typography (Heading, Subheading, Paragraph, Caption, Label)
- **Data Components:** StatCard, ActivityFeed
- **Feedback Components:** Toast, Loading, EmptyState
- **Layout Components:** Header, Footer, Sidebar
- Jakarta Sans font integration
- Glassmorphism, metallic gold accents, dark luxury theme

---

## Phase 4 — Admin Dashboard

### 8. Dashboard Layout

**Status:** ✅ Complete
**Dependencies:** Phases 6–7

- Gold-themed responsive Sidebar with grouped navigation
  - Categories: MAIN MENU, OPERATIONS, MANAGEMENT, SYSTEM
  - System status footer with API health indicator
  - Mobile drawer sidebar (full-width xs / 320px sm)
- Responsive Header with search, notifications bell, theme toggle, user menu
- DashboardLayout with `<Outlet />` for nested React Router pages
- Route pages: `/` (Dashboard), `/analytics`, `/users`, `/settings`, `/admin`

---

### 9. Dashboard Widgets

**Status:** ✅ Complete
**Dependencies:** Phase 8

- **StatCard** — KPI cards with icons, loading state, optional trend indicators
- **ActivityFeed** — Activity list with avatars, timestamps, action types/colors
- **Live data wiring** via TanStack Query:
  - 4 KPI cards from real API endpoints
  - Recent Activity feed from `AuditLogDTO`s
- **Charts & analytics** using `@mui/x-charts`:
  - Audit Activity area chart with 7/14/30-day toggle
  - User Status donut (active vs inactive)
  - Activity-by-Action horizontal bar chart
  - Activity-by-Entity horizontal bar chart
  - Loading skeletons + empty states
- Multi-tenancy: all dashboard data org-scoped via `organizationId`

---

### 10. Dashboard Features

**Status:** ✅ Complete
**Dependencies:** Phases 8–9

- Header search bar (responsive, hidden on mobile)
- Notification bell + popover (wired to audit-logs API, real-time unread count)
- Message popover component
- Date range button and refresh button
- Organization name display in header
- **Global Search Dialog** (Cmd/Ctrl+K) — keyboard navigation, search across navigation items grouped by category
- **User Preferences Dialog** — centered Modal (fullscreen mobile, max-width lg desktop):
  - Appearance tab: theme (light/dark), density, sidebar visibility
  - Notifications tab: email/push toggles
  - Localization tab: language, date/time formats
  - Preferences persisted to localStorage and synced with ThemeContext

---

## Phase 5 — Authentication UI

### 11. Authentication Pages

**Status:** ✅ Complete
**Dependencies:** Phases 6–7

- **Login page** — email + password with validation, OAuth buttons
- **Registration page** — name, email, password with PasswordStrength indicator
- **Forgot Password page** — email submission form
- **Reset Password page** — token-based password reset
- **Auth Layout** — left brand panel (geometric backgrounds, gold/purple orbs, hero text, stats, testimonial) + right form panel
- **AuthField** — custom component with icon, label, error state, password toggle
- **OAuthButtons** — Google + GitHub buttons with provider icons
- **PasswordStrength** — real-time strength indicator (weak/medium/strong)
- **OAuth callback page** — `/auth/callback` route for OAuth redirect handling
- react-hook-form + Zod validation on all forms
- Route guards: `ProtectedRoute`, `PublicRoute`

---

## Phase 6 — User Management

### 12. User CRUD

**Status:** ✅ Complete
**Dependencies:** Phases 4–5

**Backend:**

- Full CRUD routes: `GET /users` (paginated + filterable), `GET /users/:id`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id`, `PATCH /users/:id/status`
- Email uniqueness guard on create (409 `USER_ALREADY_EXISTS`)
- Self-delete protection
- Bulk operations: `POST /users/bulk-delete` (SUPER_ADMIN only, self excluded), `POST /users/bulk-status` (SUPER_ADMIN/ADMIN, activate|deactivate)
- Repository pattern with Prisma queries (sorting, filtering, pagination)
- Multi-tenancy: all queries scoped to `organizationId`; new users assigned to requester's org

**Frontend:**

- UsersPage with DataTable (sort, filter, paginate, row selection)
- UserFormDialog for create/edit
- Status toggle with ConfirmDialog
- Delete confirmation dialog
- Role badges (color-coded by role)
- Bulk-action toolbar: activate / deactivate / delete with confirmation
- Organization column display
- CSV export of all filtered users
- TanStack Query hooks for all CRUD + bulk operations

**Cross-reference:** Avatar/photo upload is URL-only; file upload tracked under Phase 18 (File Manager).

---

### 13. Roles & Permissions

**Status:** ✅ Complete
**Dependencies:** Phase 12

- `UserRole` enum in `@vestara/types` (super_admin, admin, manager, user)
- RBAC enforced via `requireRole(...)` middleware on protected routes
- `authenticate` middleware decodes JWT and attaches `req.user`
- Frontend navigation filters by role (menus hidden for unauthorized roles)
- No standalone Role DB model — roles are enum-based
- Audit logging for admin actions

**Cross-reference:** RBAC `requireRole` middleware was first introduced in Phase 5. This phase formalizes the role/permission architecture and adds frontend enforcement.

---

### 14. User Profile

**Status:** ✅ Complete (~85%)
**Dependencies:** Phase 12

**Backend:**

- `GET /profile` and `PUT /profile` — name, avatar URL, email
- `PUT /profile/password` — current password verification + bcrypt rehash
- Audit logging for all profile updates
- Multi-tenancy: profile scoped to user's organization

**Frontend:**

- ProfilePage with two tabs:
  - **General** tab: name, avatar URL, email (read-only), OAuth provider detection
  - **Security** tab: change password with current password confirmation + validation
- OAuth-linked accounts: password section disabled with explanatory message
- TanStack Query hooks for profile CRUD
- `updateUser` in AuthContext for immediate UI refresh after edits
- UserMenu navigates to `/profile` and `/security`

**Still missing:** Avatar file upload (URL-only), email change, account deletion UI.

---

## Phase 7 — Reusable UI Components

### 15. Reusable Forms

**Status:** ✅ Complete
**Dependencies:** Phases 6–7

- **FormField** — wrapper with label, error display, helper text
- **FormInput** — text/number/email/password input
- **FormTextarea** — multi-line text input
- **FormSelect** — dropdown select
- **FormCheckbox** — single checkbox + FormCheckboxGroup
- **FormRadioGroup** — radio button group
- **FormSwitch** — toggle switch + FormSwitchGroup
- **FormError** — field-level error display
- **FormHelperText** — contextual helper text
- **FormSection** — visual grouping of related fields
- **FormLayout** — grid/flex layout for form fields
- **FormActions** — action button bar (submit + cancel)
- **FormSubmit** — themed submit button with loading state
- **FormCancel** — cancel/reset button
- **`useFormWithZod`** — hook integrating react-hook-form with Zod schema validation
- **Auth components:** AuthField, OAuthButtons, PasswordStrength

---

### 16. Data Table

**Status:** ✅ Complete
**Dependencies:** Phase 7

- Reusable `DataTable` component with theme-aware styling
- Sortable column headers (toggling asc/desc/none)
- Search input + filter chips
- Pagination (page controls, page size selector)
- Row selection via checkbox column
- Server-side support (sorts, filters, pagination passed to API)
- Loading skeleton while data loads
- Empty states: NoData, NoSearchResults, ErrorState
- Customizable column definitions: `label`, `sortable`, `render`, `align`, `width`
- Used by: UsersPage, SettingsPage, SystemLogsPage

---

### 17. Feedback Components

**Status:** ✅ Complete
**Dependencies:** Phase 7

- **Toast/Snackbar** — queue management (max 5 concurrent) via `ToastProvider` + `useToast` hook
  - `showSuccess`, `showError`, `showWarning`, `showInfo`
- **Loading States:** Spinner, Skeleton, Overlay, Inline; PageLoading, ContentLoading, ButtonLoading
- **EmptyState variants:** NoData, NoSearchResults, EmptyFolder, ErrorState
- **useConfirm hook** — promise-based ConfirmDialog integration
- **Modal/Dialog System:**
  - Alert (4 variants: success/error/warning/info; 3 styles: standard/filled/outlined; dismissible)
  - Modal (fullscreen option, responsive, custom headers, scroll control)
  - Dialog (SimpleDialog, ConfirmDialog, AlertDialog)
  - Enhanced Drawer (temporary/persistent/permanent, Sidebar, SlideOver)

---

## Phase 8 — File Management

### 18. File Manager

**Status:** ✅ Complete (100%)
**Dependencies:** Phases 4–5, 15–17

**Backend:**

- Image upload endpoint: `POST /upload/image` with multer middleware (5MB limit, JPEG/PNG/WebP/SVG), uploads to Vercel Blob storage
- Storage provider abstraction (Factory pattern: Local, Cloudinary, S3, Google Drive) with factory pattern
- File model with org-scoped CRUD, folder hierarchy, metadata
- Full REST API: `GET /files` (paginated/filtered), `GET /files/folder` (folder contents), `POST /files/upload` (multi-file, 100MB), `POST /files/folder` (create), `PUT /files/:id` (rename/move), `GET /files/:id/download` (signed URL), `POST /files/move` (bulk move), `DELETE /files/:id`, `POST /files/bulk-delete` (bulk delete), `GET /files/stats`
- Org-level storage config via `SystemSetting` key `storage`
- Audit logging for all file operations

**Frontend:**

- FileManagerPage with DataTable (sortable columns, row selection, search)
- Folder cards with click-to-navigate into subdirectories
- Clickable MUI breadcrumbs for upward navigation
- Upload dialog with drag-and-drop zone and XHR progress bar (LinearProgress)
- Create folder, rename, move, delete single/bulk, download, image preview dialogs
- `filesApi` client (`apps/web/src/api/files.ts`) with XHR upload progress tracking
- TanStack Query hooks (`apps/web/src/features/files/hooks.ts`) for all operations
- `/files` route registered in SYSTEM nav group
- Upload button in Organizations page for logo (auto-sets `logoUrl`)

---

## Phase 9 — Application Settings

### 19. Application Settings

**Status:** ✅ Complete (100%)
**Dependencies:** Phases 4–5, 12

**Backend:**

- Full CRUD routes with auth middleware + repository pattern
- Validation via Zod schemas
- Multi-tenancy: settings scoped per-organization via compound unique `[organizationId, key]`
- Supported value types: string, number, boolean, JSON
- Audit logging for all CRUD operations via SettingsService
- Versioning via `previousValue` in audit metadata

**Frontend:**

- SettingsPage with DataTable (key-value editor)
- SettingFormDialog for create/edit with JSON validation
- TanStack Query hooks for all operations
- Toast notifications for success/error
- Inline editing support
- Export button (downloads versioned JSON with timestamps)
- SettingsImportDialog (drag-and-drop JSON upload, format detection, preview)
- SettingsAuditHistoryDialog (paginated change history with action icons and value previews)

**Shared:**

- `SETTINGS_IMPORT` AuditAction enum value
- `SettingsExportDTO`, `SettingsImportRequestDTO`, `SettingsImportResultDTO` types
- `importSettingsSchema` validation

---

## Phase 10 — Reporting

### 20. Reports

**Status:** ✅ Complete (100%)
**Dependencies:** Phases 4–5, 16–17

**Deliverables:**

- Dashboard reports with configurable date ranges
- **CSV export** — server-side generation with streaming
- **Excel export** — `.xlsx` generation (using exceljs)
- **PDF generation** — server-side PDF (using pdfkit) with org logo branding
- Reusable export button/hook for DataTable components
- Scheduled report generation (cron expression + email delivery)
- Report templates with saved configurations
- Column selection per report type
- Report comparison (side-by-side)
- Inline data preview (first 10 rows)
- Real-time status updates via WebSocket
- Dashboard reports widget
- Row selection + bulk actions

**Implementation Details:**

- **Backend:** Full report generation API at `/api/v1/reports` with async job processing. Supports 4 report types: audit-logs, users, activity, system-logs. Org-scoped data access with filters (date range, action, entity, user). Added search/sort to list endpoint, stats endpoint, column definitions endpoint, preview endpoint, templates CRUD, comparison endpoint. WebSocket `report:status` events broadcast on status changes. PDF generation accepts org logo URL for branding.
- **Frontend:** ReportsPage at `/reports` with DataTable showing report history, generate dialog with type/format/date filters, download button, delete action. Added to navigation sidebar under "OPERATIONS" group. TanStack Query hooks for all operations. MUI-ified generate dialog with date preset chips (Today/This Week/This Month/Last Month/Last 90 Days/Custom), column picker, schedule and email fields. Templates tab with card grid and CRUD dialog. Compare dialog with side-by-side attribute table. Dashboard widget showing stats and recent reports.
- **Dependencies:** Added exceljs, pdfkit, csv-writer packages

---

## Phase 11 — Real-Time Features

### 21. WebSocket Integration

**Status:** ✅ Complete
**Dependencies:** Phase 4

**Deliverables:**

- WebSocket server setup (`ws` alongside Express, sharing the API port at `/api/v1/ws`)
- Connection management with authentication (JWT verification on connect via query-param token)
- Room/channel support for org-scoped broadcasts (`org:<organizationId>`)
- Reconnection handling with exponential backoff + jitter (client-side)
- Health monitoring (connection count, message throughput) via `GET /api/v1/ws/status`

**Implementation Notes (2026-07-12):**

- Backend: `apps/api/src/websocket/` — `WebSocketManager` (auth, org rooms, presence, 30s heartbeat, stats, broadcasts), singleton via `getWebSocketManager()`, attached in `apps/api/src/index.ts`. Every audit-log write broadcasts an org-scoped `audit:created` event through `AuditLogRepository.create` (best-effort, no-op when the server is unattached).
- Frontend: `apps/web/src/websocket/` — `WebSocketClient` (typed pub/sub, auto-reconnect w/ backoff, app-level ping), `WebSocketProvider` (auto-connect on auth, subscribe to org room, disconnect on logout), `useConnectionStatus`/`useWebSocketEvent` hooks, and a `ConnectionStatus` indicator in the header. Vite dev proxy enables `/api` WS upgrades.
- **Vercel limitation:** Serverless functions cannot host persistent WebSocket connections, so the manager degrades gracefully (broadcasts are no-ops) on Vercel; a long-running Node host is required for live features.

**Cross-reference:** WebSocket infrastructure is a prerequisite for Phase 22 (Live Features).

---

### 22. Live Features

**Status:** ✅ Complete (100%)
**Dependencies:** Phase 21

**Deliverables:**

- **Live notifications** — `audit:created` WebSocket events are mapped to header notifications in real time via `LiveNotificationsProvider` (new `features/realtime` module). Replaces the old TanStack-Query-only / empty notification popover.
- **Dashboard live updates** — `useLiveDashboard` hook invalidates `audit-logs`, `users`, and `settings` queries (throttled) on every org-scoped audit event, so KPI cards, charts, and the Activity Feed refresh without a manual reload.
- **Presence indicators** — `PresenceIndicator` in the header subscribes to `presence:update` and shows online users (avatar stack + count + popover), color-coded by role.
- **Live events** — every user/settings/system change already broadcasts `audit:created` (Phase 21); the dashboard and notifications now react to it live.
- **LIVE badge** — `LiveBadge` on the dashboard reflects the current WebSocket connection status.

**Implementation Notes (2026-07-22):**

- New frontend module `apps/web/src/features/realtime/`: `LiveNotificationsProvider` (context + initial fetch + WebSocket subscription), `auditToNotification.ts` (audit → `Notification` mapping), `PresenceIndicator.tsx`, `LiveBadge.tsx`, `useLiveDashboard.ts`.
- `AppProvider` now wraps the app in `LiveNotificationsProvider` (inside `WebSocketProvider`), so live notifications are available app-wide and scoped to the authenticated org.
- Header is the single owner of the notification bell/popover (DashboardLayout's duplicate popover + manual fetch were removed to avoid double rendering).
- Notifications are derived client-side from `audit:created` events; the server-side `notification` WS event type remains available but unused for now.
- **Vercel limitation:** live features require a long-running Node host (persistent WebSocket) — they degrade to the periodic initial fetch on serverless.

**Cross-reference:** Real-time notification complements Phase 10's notification popover. Live dashboard updates enhance Phase 9 widgets.

---

## Phase 12 — Security & Monitoring

### 23. Security Hardening

**Status:** ✅ Complete
**Dependencies:** Phases 4–5

**Implemented:**

- Security headers (Helmet middleware)
- CORS configuration with allowed origins
- JWT authentication with refresh token rotation
- Input validation (Zod middleware on all routes)
- Audit logging for all critical actions
- **Rate limiting** — `express-rate-limit` with strict auth limiter (5 req / 15 min, counts only failures), general API limiter (100 req / min), and a permissive health limiter. Disabled under `NODE_ENV=test` so the auth test-suite can run.
- **CSRF / origin verification** — `csrfProtection` middleware rejects cross-origin `POST/PUT/PATCH/DELETE` requests whose `Origin` does not match the allow-listed SPA/origin set (incl. `.vercel.app` deployments). Read-only methods pass through.
- **Password policies** — server-side `PASSWORD_POLICY` (min 8 / max 128, requires upper+lower+number+symbol) enforced in Zod `passwordField`, plus a `COMMON_PASSWORDS` blocklist (breach check). Front-end `PasswordStrength` mirrors the rules; a server-authoritative `POST /auth/password-strength` endpoint returns a 0–4 score + feedback.
- **XSS protection** — `Content-Security-Policy` (script/src 'self', `unsafe-inline` styles for MUI/Swagger, `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests` in prod) via Helmet; HSTS (1y, preload) in prod; `Referrer-Policy: strict-origin-when-cross-origin`; `X-Content-Type-Options: nosniff`; `X-XSS-Protection`; `Permissions-Policy` disabling camera/mic/geolocation/etc. Production CSP restricts `img-src` to `self+data+blob`.
- **Input sanitization** — `sanitizeInput` middleware recursively strips control characters, `<script>` blocks, inline event-handler attributes, and `javascript:` URIs from `req.body`/`query`/`params` (defense-in-depth against stored XSS, applied after Zod validation). `isSafeQueryValue` guards against NoSQL-operator / prototype-pollution injection in query params.
- **Account lockout** — after 5 consecutive failed login attempts the account is locked for 30 minutes (`failedLoginAttempts` + `lockedUntil` fields on User schema). Counter resets on successful login. Lockout check prevents timing-based password enumeration. `ACCOUNT_LOCKED` error code returned to client.
- **X-Request-Id** — every request receives a UUID `X-Request-Id` header (or accepts a client-provided one). The ID is attached to request logs for distributed tracing and audit correlation.
- **Body size limits** — global JSON/urlencoded body parser reduced from 10 MB to 1 MB. File uploads unaffected (multer handles its own limits per route).
- **WebSocket rate limiting** — sliding window limits Socket.IO connection attempts to 10 per IP per minute. Prevents brute-force token guessing over WebSocket.

---

### 24. Monitoring

**Status:** ⏳ In Progress (~70%)
**Dependencies:** Phase 4, Phase 12

**Implemented:**

- **Audit trail service** — logs all critical actions (auth, CRUD, admin actions) with metadata
- **Request logging** — Pino-based HTTP request/response logging
- **Audit logs API** — `GET /audit-logs` (paginated + filterable by action/entity/date), `GET /audit-logs/:id`
- **Error tracking** — global error handler persists API errors as audit-log entries (`AuditAction.ERROR`, entity `'api'`)
  - Captures: status, code, message, method, path, stack (for 5xx)
- **Frontend SystemLogsPage** — DataTable with action/entity/date filters
  - Action chips with color-coded icons (error = red + ErrorIcon)
  - Formatted timestamps with relative display
- **Multi-tenancy** — audit logs scoped to organization

**Still missing:**

- Performance metrics (response time percentiles, throughput)
- Uptime monitoring / health check history
- Alert thresholds and notification routing
- Metrics visualization dashboard

---

## Phase 13 — Testing & Performance

### 25. Testing

**Status:** ⏳ In Progress (~25%)
**Dependencies:** Phases 4–5 (infrastructure), Phase 1 (tooling)

**Implemented:**

- Vitest + Supertest dev dependencies configured
- `apps/api/vitest.config.ts` (globals + node environment)
- `test` / `test:watch` scripts in API `package.json`
- **11 Auth API integration tests** (register, login, refresh-token rotation, logout, me) — all green via `turbo test`
- Web app lint/typecheck cleanup (dead code removal, unused imports)

**Still missing:**

- **Unit tests** for services (auth, user, profile, settings, audit)
- **Unit tests** for repositories
- **Unit tests** for shared packages (validation, utils, constants)
- **Component tests** for React components (RTL + vitest)
- **Integration tests** for additional API routes (users CRUD, settings CRUD, audit logs, profile)
- **E2E tests** for critical user flows (login → dashboard → user management)
- Coverage reporting and minimum threshold enforcement
- Frontend test setup (vitest + jsdom + RTL configuration)

---

### 26. Performance Optimization

**Status:** ⏳ In Progress (~60%)
**Dependencies:** Phases 6–7, 16

**Implemented (2026-07-15):**

- **Lazy loading** — route-based code splitting with `React.lazy()` + `<Suspense>` (per-page chunks, `PageLoading` fallback) in `routes/index.tsx`.
- **Code splitting** — vendor chunk splitting via `manualChunks` in `vite.config.ts` (react, mui, tanstack-query, markdown, socket.io vendors split out — initial `index` chunk dropped from ~1.7 MB to ~304 KB; pages become on-demand chunks).
- **Query optimization** — TanStack Query defaults tuned in `QueryProvider` (`staleTime` 5 min, `gcTime` 30 min, `refetchOnReconnect`).
- **Memoization** — `React.memo` applied to `StatCard` and `ActivityFeed` presentational components.
- **Image optimization** — lazy/async image loading (`loading="lazy"`, `decoding="async"`) for rendered markdown docs in `DocsPage`.

**Still pending:** list/table virtualization (react-window) for large `DataTable` datasets; formal bundle-visualizer audit; deeper `useMemo`/`useCallback` pass on expensive renders.

**Deliverables:**

- **Lazy loading** — route-based code splitting with `React.lazy()` + `Suspense` ✅
- **Code splitting** — vendor chunk splitting, dynamic imports for heavy components ✅
- **Virtualization** — virtualized lists/tables for large datasets (e.g., `react-window`)
- **Query optimization** — TanStack Query stale time / cache time tuning, prefetching ✅ (defaults tuned)
- **Bundle optimization** — analyse bundle with `vite-bundle-visualizer`, tree shaking audit
- **Image optimization** — lazy loading, responsive images, WebP format ✅ (lazy images)
- **Memoization** — `React.memo`, `useMemo`, `useCallback` audit on expensive renders (partial)

---

## Phase 14 — Production

### 27. Documentation

**Status:** ✅ Complete
**Dependencies:** None

- **README.md** — comprehensive project overview, architecture, setup, deployment
- **API Documentation** (`docs/api/README.md`) — endpoints, auth, error codes, data models
- **Developer Guide** (`docs/DEVELOPER_GUIDE.md`) — setup, commands, feature walkthroughs, troubleshooting
- **Deployment Guide** (`docs/DEPLOYMENT.md`) — Vercel deployment, env vars, OAuth config, rollback, monitoring
- **Architecture Decision Records** (`docs/decisions/`) — monorepo, React/MUI, Express/Prisma, JWT, Vercel, Zod, OAuth
- **In-app Documentation page** (`/docs`) — renders docs markdown at build time (Vite `?raw` imports)
  - Grouped table of contents, cross-link navigation
  - react-markdown + remark-gfm rendering

---

### 28. Deployment

**Status:** ✅ Complete
**Dependencies:** Phases 1–11

**Current:**

- **Frontend:** Vercel — `vestara-admin-web.vercel.app` (auto-deploys from `main`)
- **Backend API:** Vercel Serverless — `vestara-admin-api.vercel.app` (Express mounted under `/api/v1`)
- **Database:** Prisma Postgres (hosted PostgreSQL with `PrismaPg` adapter)
- **Multi-tenancy:** Organization model with org-scoped resources
- **CORS:** Configured for `.vercel.app` origins
- **Environment variables:** Configured via Vercel CLI
- **Build:** `tsc --noEmit` + `vite build` both pass

---

### 29. CI/CD

**Status:** ⏳ In Progress (~40%)
**Dependencies:** Phase 28

**Implemented:**

- Vercel auto-deploys from `main` on git push
- GitHub Actions workflow for API deployment (`deploy-api.yml`): builds + deploys API to Vercel on push to `main`

**Still missing:**

- **CI for lint/typecheck/tests** — run on every PR before merge
- **Web deployment workflow** — automated frontend deployment via GitHub Actions
- **PR quality gates** — status checks (lint, typecheck, test, build) required before merge
- **Staging environment** — preview deployments for PR branches
- **Database migration step** — automated migration execution during deploy
- **Health check verification** — smoke tests after deployment
- **Dependency scanning** — automated vulnerability audit

---

### 30. Production Readiness

**Status:** ⏳ In Progress (~55%)
**Dependencies:** Phases 27–29

**Verified:**

- Both apps deployed and serving (API health 200, Web login 200)
- CORS verified across deployments
- OAuth callbacks functional (Google + GitHub)
- GitHub Actions CI/CD configured for API
- Multi-tenancy foundation complete

**Still missing:**

- Final security audit (penetration testing, dependency audit, secret scanning)
- Performance benchmarks (response time targets, load testing)
- Monitoring setup (error tracking, uptime monitoring, alerting)
- Backup and disaster recovery procedures
- Rollback procedures documented and tested
- Load testing for target user concurrency

---

# Expected Output for Every Task

For every roadmap item:

1. Analyze the existing project structure before making changes.
2. Explain the implementation approach.
3. Implement the complete feature.
4. Update existing files only when necessary.
5. Create new files only when required.
6. Ensure the application builds successfully.
7. Ensure the new feature integrates with all previous phases.
8. Follow clean architecture, SOLID principles, and modern TypeScript best practices.
9. Keep the implementation production-ready, scalable, and maintainable.

Do **not** begin implementing any roadmap item until explicitly instructed.

When a roadmap item number or task is described, implement **only that task** while maintaining compatibility with everything previously built.
