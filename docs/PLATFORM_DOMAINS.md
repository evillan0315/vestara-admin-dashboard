# Platform Domains

> Deep-dive into each Vestara Command Center module — its purpose, current status, and architectural role.

---

## Table of Contents

- [Completed Modules](#completed-modules)
  - [Dashboard](#dashboard)
  - [Organizations](#organizations)
  - [Users & Roles](#users--roles)
  - [Analytics](#analytics)
  - [Reports](#reports)
  - [File Management](#file-management)
  - [Application Settings](#application-settings)
  - [AI Chat](#ai-chat)
  - [Data Connectors](#data-connectors)
  - [Real-Time Features](#real-time-features)
  - [Security](#security)
- [Planned Modules](#planned-modules)
  - [Digital Wallet](#digital-wallet)
  - [Marketplace](#marketplace)
  - [Bookings](#bookings)
  - [Rewards](#rewards)
  - [Workflow Automation](#workflow-automation)
  - [Security Center](#security-center)

---

## Completed Modules

### Dashboard

**Route:** `/` | **Status:** Complete

The operational overview providing visibility into platform health, system activity, users, audit events, and operational metrics.

**Features:**
- 4 KPI stat cards (Total Users, Active Users, Audit Events, System Settings) with trend indicators
- Audit Activity area chart with 7/14/30-day range selector
- User Status donut chart (active vs inactive)
- Activity-by-Action and Activity-by-Entity horizontal bar charts
- Recent Activity feed with avatars, timestamps, and action types
- Organization name display
- Real-time updates via WebSocket (`useLiveDashboard`)
- Date range picker with presets (Today, This Week, This Month, etc.)

**Data Sources:** TanStack Query hooks fetching from `/users`, `/audit-logs`, `/settings` endpoints, all org-scoped.

---

### Organizations

**Route:** `/organizations` | **Status:** Complete | **Access:** Super Admin

Multi-tenant organization management with full CRUD operations.

**Features:**
- DataTable with sortable columns (name, slug, members, created date)
- Create/Edit organization dialog with logo upload (integrated with File Manager)
- Member count display
- Client-side search and sort

**Backend:** Organization model with `slug` uniqueness, org-scoped resources cascade.

---

### Users & Roles

**Route:** `/users` | **Status:** Complete | **Access:** Super Admin, Admin

Full user lifecycle management with role-based access control.

**Features:**
- DataTable with server-side sorting, filtering, pagination, and row selection
- Create/Edit user dialog with avatar upload
- Role badges (color-coded: super_admin, admin, moderator, support)
- Status toggle with confirmation dialog
- Bulk actions: activate, deactivate, delete (with confirmation)
- CSV export of filtered users
- Optimistic updates for all mutations

**Roles:** `super_admin`, `admin`, `moderator`, `support` — enum-based, enforced via `requireRole()` middleware.

**Backend:** Full CRUD + bulk endpoints, email uniqueness guard, self-delete protection, account lockout (5 failed attempts → 30 min lockout).

---

### Analytics

**Route:** `/analytics` | **Status:** Complete

Interactive analytics for monitoring platform usage, operational trends, and enterprise insights.

**Features:**
- Range selector (7/14/30/90 days) driving all visualizations
- KPI cards with trend vs previous period
- Audit Activity area chart
- User Status donut
- Activity-by-Action / Activity-by-Entity bar charts
- Recent Activity feed
- Real-time refresh via `useLiveDashboard`
- Shared `features/analytics` module with Dashboard

---

### Reports

**Route:** `/reports` | **Status:** Complete

Enterprise reporting with multiple export formats and async generation.

**Features:**
- Report history DataTable with search, sort, and row selection
- Generate dialog with type (audit-logs, users, activity, system-logs), format (CSV, Excel, PDF), date range, and column selection
- Date preset chips (Today, This Week, This Month, Last Month, Last 90 Days, Custom)
- Report Templates CRUD (saved configurations)
- Report Comparison (side-by-side attribute table)
- Dashboard widget showing stats and recent reports
- WebSocket real-time progress events
- PDF branding with organization logo

**Export Formats:** CSV (streaming), Excel (exceljs), PDF (pdfkit).

---

### File Management

**Route:** `/files` | **Status:** Complete

Enterprise-grade file and document management with folder hierarchy.

**Features:**
- DataTable with sortable columns, row selection, search
- Folder cards with click-to-navigate
- MUI breadcrumbs for upward navigation
- Upload dialog with drag-and-drop zone and XHR progress bar
- Create folder, rename, move, delete (single/bulk), download
- Image preview dialog
- List/Grid view toggle
- Storage provider abstraction (Local, Cloudinary, S3, Google Drive)
- Org-level storage config via SystemSetting

**Backend:** Multer middleware (5MB image limit, 100MB file limit), Vercel Blob storage, signed download URLs.

---

### Application Settings

**Route:** `/settings` | **Status:** Complete

System configuration management with audit trail.

**Features:**
- DataTable with key-value editor
- Create/Edit setting dialog with JSON validation
- Export button (downloads versioned JSON with timestamps)
- Import dialog (drag-and-drop JSON upload, format detection, preview)
- Audit History dialog (paginated change history with action icons)
- Inline editing support
- Value types: string, number, boolean, JSON

**Backend:** Org-scoped via compound unique `[organizationId, key]`, versioning via `previousValue` in audit metadata.

---

### AI Chat

**Route:** `/chat` | **Status:** Complete

Multi-provider AI assistant with conversation history and RAG context.

**Features:**
- Full chat UI with responsive layout
- Conversation list in right-side drawer
- Suggestion chips
- Typing indicator
- Markdown rendering with copy button
- Multiple AI model support (OpenCode free-tier models)
- RAG: real-time org data injected into system prompt (users, audit logs, settings, files, KPIs)
- Conversation history (create, list, archive)
- OpenCode branding

**Backend:** Pluggable `AIProvider` interface, OpenCode provider (`mimo-v2.5-free`, `deepseek-v4-flash-free`, `nemotron-3-ultra-free`), context builder with 60s caching.

---

### Data Connectors

**Routes:** `/integrations`, `/data-explorer` | **Status:** Complete | **Access:** Super Admin, Admin, Moderator

External REST API integration with AI-assisted visualization.

**Features:**
- Configure external REST APIs (URL, auth, headers, body)
- Backend fetches and analyzes JSON response
- AI-assisted chart type and field inference
- Heuristic visualization specs (works without AI key)
- Data Explorer for browsing connected data
- Org-scoped, secrets masked in DTOs

**Backend:** `DataSource` model, `http-client.ts` (timeout-guarded fetch), `analyzer.ts` (JSON normalization + field-type inference), `agent.service.ts` (fetch/auth/analyze/audit).

---

### Real-Time Features

**Status:** Complete

WebSocket-powered live updates across the application.

**Features:**
- `audit:created` events broadcast to org-scoped rooms
- Live notifications (header bell) derived from audit events
- Dashboard live refresh (KPI cards, charts, activity feed)
- Presence indicator (online users with avatars)
- LIVE connection badge
- Floating Chat Widget with keyboard shortcut (`Cmd+Shift+K`)

**Backend:** `ws`-based WebSocket server at `/api/v1/ws`, JWT auth via query-param, org rooms, 30s heartbeat, exponential backoff reconnect.

**Note:** Requires long-running Node host (not Vercel serverless). Degrades gracefully on Vercel.

---

### Security

**Status:** Complete

Defense-in-depth security across authentication, authorization, and data protection.

**Features:**
- JWT access + refresh token rotation
- OAuth 2.0 (Google + GitHub)
- Rate limiting (auth: 5/15m, API: 100/min)
- CSRF/origin verification on state-changing requests
- Password policies (min 8, max 128, requires upper+lower+number+symbol, common password blocklist)
- Account lockout (5 failed attempts → 30 min)
- XSS protection (CSP, sanitize middleware, `javascript:` URI stripping)
- Input sanitization (control chars, `<script>` blocks, event handlers)
- NoSQL/prototype-pollution guards on query params
- X-Request-Id for distributed tracing
- Body size limits (1 MB global)
- WebSocket rate limiting (10 connections/min/IP)

See [Security](./SECURITY.md) for full details.

---

## Planned Modules

### Digital Wallet

**Route:** `/wallet` | **Status:** Planned

Digital wallet management for financial transactions within the Vestara ecosystem.

**Planned Features:**
- Wallet creation and management
- Balance tracking
- Transaction history
- Multi-currency support
- Integration with payment providers

---

### Marketplace

**Routes:** `/marketplace`, `/orders` | **Status:** Planned

Commerce, subscriptions, and digital services marketplace.

**Planned Features:**
- Product/service listings
- Order management
- Subscription management
- Digital product delivery
- Revenue analytics

---

### Bookings

**Route:** `/bookings` | **Status:** Planned

Appointment and scheduling services.

**Planned Features:**
- Calendar management
- Appointment scheduling
- Availability tracking
- Reminder notifications
- Integration with external calendars

---

### Rewards

**Route:** `/rewards` | **Status:** Planned

Loyalty and incentive programs (Vestara Points).

**Planned Features:**
- Points earning and redemption
- Reward catalog
- Tier-based loyalty programs
- Referral tracking
- Analytics dashboard

---

### Workflow Automation

**Status:** Planned

Orchestration and scheduled job management.

**Planned Features:**
- Visual workflow builder
- Scheduled job management
- Event-driven triggers
- Action library (email, API calls, database operations)
- Execution history and logging

---

### Security Center

**Route:** `/security-center` | **Status:** Planned | **Access:** Super Admin, Admin

Centralized security management and compliance dashboard.

**Planned Features:**
- Security event dashboard
- Compliance reporting
- Access review and certification
- Vulnerability scanning integration
- Audit trail visualization
