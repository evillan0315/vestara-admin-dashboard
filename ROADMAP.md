# GitHub Roadmap - Vestara Admin Dashboard

## 📋 Overview

This roadmap defines the GitHub-based project structure, milestone organization, and workflow for implementing the Vestara Admin Dashboard using the Phase-based development approach from the INSTRUCTION.md.

## 🎯 Primary Goals

1. **Feature-Based Organization**: Group work into logical phases and features
2. **Git Flow Integration**: Support the Git workflow shown in README.md with feature branches
3. **Comprehensive Tracking**: Use GitHub issues, pull requests, and project management
4. **Production Readiness**: Ensure every completed milestone meets quality standards

## 🏗️ Project Structure

### Phase Organization

| Phase | Focus | Items | Status |
|-------|-------|-------|--------|
| **1–5** | Foundation & Backend | Project Init, Shared Architecture, Database, Express Server, Auth API | ✅ Complete |
| **6–7** | Frontend Foundation | React Foundation, Design System, Auth Components | ✅ Complete |
| **8–10** | Admin Dashboard | Dashboard Layout, Widgets, Dashboard Features | ✅ Complete |
| **11** | Authentication UI | Login, Register, Forgot/Reset Password, OAuth (Google + GitHub), Protected Routes | ✅ Complete |
| **12–14** | User Management | User CRUD, Roles & Permissions, User Profile | ✅ Complete (100%) |
| **15–17** | Reusable UI | Forms, Data Table, Feedback Components | ✅ Complete |
| **18** | File Management | File Manager | ✅ Complete (100%) |
| **19** | Settings | Application Settings | ✅ Complete (100%) |
| **19b** | AI Chatbot | AI Chatbot (OpenCode + multi-provider) | ✅ Complete (100%) |
| **19c** | AI Assistant RAG | Data-aware AI with context injection (Priority 1) | ✅ Complete (100%) |
| **19d** | Floating Chat Widget | Floating AI Assistant accessible from every screen | ✅ Complete (100%) |
| **19e** | AI Data Connector | External REST API → auto visualization with AI-assisted charts | ✅ Complete (100%) |
| **20** | Reporting | Dashboard Reports, CSV/Excel/PDF Export | ✅ Complete (100%) |
| **21–22** | Real-Time | WebSocket Integration, Live Features | ✅ Complete (21 ✅ / 22 ✅) |
| **23–24** | Security & Monitoring | Security Hardening, Monitoring | ⏳ Partial (~55%) |
| **25–26** | Testing & Performance | Testing, Performance Optimization | ⏳ In Progress (~35% testing / ~60% perf) |
| **27–30** | Production | Documentation, Deployment, CI/CD, Production Readiness | ⏳ Partial (~70%) |
| **—** | Marketing Assets | `apps/marketing-video` Remotion ad + HappyHorse-1.1-T2V cinematic prompt | ✅ Complete (100%) |

### GitHub Label Strategy

#### 📊 **Status Labels**
- `Phase:1-5` - Foundation & Backend (Complete)
- `Phase:6-7` - Frontend Foundation
- `Phase:8-10` - Admin Dashboard
- `Phase:11` - Authentication UI
- `Phase:12-14` - User Management
- `Phase:15-17` - Reusable UI
- `Phase:18` - File Management
- `Phase:19` - Settings
- `Phase:19b` - AI Chatbot (Complete)
- `Phase:19c` - AI Assistant RAG (Complete)
- `Phase:19d` - Floating Chat Widget (Complete)
- `Phase:19e` - AI Data Connector (Complete)
- `Phase:20` - Reporting
- `Phase:21-22` - Real-Time
- `Phase:23-24` - Security & Monitoring
- `Phase:25-26` - Testing & Performance
- `Phase:27-30` - Production

#### 🏷️ **Type Labels**
- `work:item:[#]` - Roadmap item tracking
- `status:todo` - Planned but not started
- `status:in-progress` - Currently being worked on
- `status:review` - Ready for code review
- `status:done` - Complete and integrated

#### 🚦 **Priority Labels**
- `priority:high` - Critical path items
- `priority:medium` - Important for release
- `priority:low` - Nice-to-have features

## 📁 GitHub Repository Structure

### Issue Templates

#### 🔧 Issue Template: Feature Request

```yaml
title: "Feature: [Short Description]"
labels: "Phase:[Phase-Number], status:todo, priority:medium"
body: |
  ## Overview
  
  Provide a detailed description of the requested feature, its purpose, and business value.
  
  ## Requirements
  - [ ] Technical requirements
  - [ ] User experience requirements
  - [ ] Acceptance criteria
  - [ ] Dependencies
  - [ ] Edge cases
  
  ## Design Considerations
  - Architecture decisions
  - Integration approach
  - Technical specifications
  
  ## Testing Strategy
  - Test cases needed
  - Integration points
  - Regression test areas
  
  ## Implementation Plan
  ### Phase X: Week Y
    - [ ] Task item 1
    - [ ] Task item 2
    - [ ] Risk assessment
```

#### 🐛 Issue Template: Bug Report

```yaml
title: "Bug: [Short Description]"
labels: "Phase:[Phase-Number], status:todo, priority:high, type:bug"
body: |
  ## Bug Description
  
  Clear, concise description of the issue.
  
  ## Steps to Reproduce
  1. [ ] Step 1
   2. [ ] Step 2
   3. [ ] Step 3
  
  ## Expected Behavior
  [ ] Describe what should happen
  
  ## Actual Behavior
  [ ] Describe what actually happens
  
  ## Technical Details
  - Environment: [ ]
  - Browser: [ ]
  - Version: [ ]
  - Component: [ ]
  
  ## Impact
  - Affected users: [ ]
  - Business impact: [ ]
  ```

#### 📋 Issue Template: Task

```yaml
title: "Task: [Specific Work Item]"
labels: "Phase:[Phase-Number], status:todo, priority:[priority], type:task"
body: |
  ## Task Description
  
  ### Background
  [ ] Context and business value
  
  ### Technical Details
  - Dependencies: [ ]
  - Integration points: [ ]
  - Risk factors: [ ]
  
  ### Acceptance Criteria
  - [ ] Criterion 1
  - [ ] Criterion 2
  - [ ] Criterion 3
  
  ### Definition of Done
  - [ ] Code implemented
  - [ ] Tests written and passing
  - [ ] Documentation updated
  - [ ] Review completed
  - [ ] Merged into develop
  ```

### Pull Request Template

#### 📝 Standard Pull Request Template

```md
## Summary

Brief description of the changes including purpose, business impact, and implementation details.

## Changes Made

### Code Changes
- [ ] Describe new functionality
- [ ] Describe bug fixes
- [ ] Describe improvements

### Files Changed
1. `path/to/file.ts` - Added [description]
2. `path/to/another.ts` - Modified [description]

### Configuration Changes
- `path/to/config` - Updated [description]

## Technical Details

### Implementation Approach
- Design decisions
- Patterns used
- Architecture considerations

### Integration Points
- APIs affected
- Dependencies added
- Breaking changes

### Testing Strategy
- Coverage areas
- Edge cases covered
- Performance considerations

## Review Checklist

### Before Review
- [ ] Code follows coding standards
- [ ] TypeScript passes strict checking
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Linting clean

### Review Required
- [ ] Peer review complete
- [ ] Security review completed
- [ ] Performance impact assessed

## Deployment Considerations

### Migration Requirements
- [ ] Migration guide written
- [ ] Database schema updates
- [ ] Version bump required

### Rollback Plan
- [ ] Rollback steps documented
- [ ] Test rollback procedure
- [ ] Recovery procedures

## Post-Implementation

### Monitoring
- [ ] Metrics configured
- [ ] Alert rules set
- [ ] Performance baselines established

### Documentation
- [ ] Updated README
- [ ] API documentation
- [ ] Developer guides

## Quality Gates

- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] Documentation complete
```

## 🗂️ Project Board Setup

### Work Categories

#### Backlog Items
- Issues marked with `status:todo` and appropriate `Priority:high/medium/low`

#### In Progress
- Issues moved to `status:in-progress` during active development

#### Review
- Issues ready for peer review with PR created

#### Done
- Completed and integrated into `develop` branch

### Column Management

1. **To Do**: Issues from backlog
2. **In Progress**: Currently being developed
3. **Code Review**: PRs waiting for review
4. **Done**: Completed and merged

## 🌿 Branch Management

### Branch Strategy

#### Protected Branches
- `main`: Production-ready only
- `develop`: Integration branch for next release

#### Feature Branches
```text
feature/phase-[1-30]-
   |__foundation
   |__backend
   |__frontend
   |__admin-dashboard
   |__auth-ui
   |__user-management
   |__reusable-ui
   |__file-manager
   |__settings
   |__ai-chatbot
   |__reporting
   |__real-time
   |__security-monitoring
   |__testing-performance
   |__production
```

### Branch Lifecycle

1. **Create**: `git checkout -b feature/phase-6-admin-dashboard-widgets`
2. **Develop**: Implement and test changes
3. **Review**: Create PR, receive feedback
4. **Merge**: Merge into `develop` after passing CI/CD

## 📊 Progress Tracking

### Phase Status Reference

Phases correspond to items in [`INSTRUCTION.md`](./INSTRUCTION.md). See the `docs/api/README.md` for API endpoint details.

| Phase | Name | Status | Progress | Notes |
|-------|------|--------|----------|-------|
| 1 | Project Initialization | ✅ Complete | 100% | Monorepo, Vite, React 19, Express 5, TypeScript, MUI, Tailwind v4, ESLint, Prettier, env config, path aliases |
| 2 | Shared Architecture | ✅ Complete | 100% | `@vestara/types`, `@vestara/constants`, `@vestara/validation`, `@vestara/utils`, `@vestara/config` packages fully implemented |
| 3 | Database | ✅ Complete | 100% | Prisma Postgres (hosted PostgreSQL via `prisma postgres link`). Schema: User, Session, RefreshToken, AuditLog, SystemSetting, **Organization**. `prisma-client` generator v7.8.0 with `PrismaPg` adapter. Seed data (4 organizations, 11 users, 20 system settings, 4 audit logs). `lib/prisma.ts` singleton. `scripts/verify-prisma.ts` verification. **Multi-tenancy (2026-07-13):** Organization model with slug, org-scoped resources (users, settings, audit logs, sessions, tokens), compound unique constraints `[organizationId, key]` on settings. |
| 4 | Express Server | ✅ Complete | 100% | Full middleware stack (CORS, security headers, body parser, request logger, validation, error handler, 404) |
| 5 | Authentication API | ✅ Complete | 100% | Register, login, refresh, logout, me — JWT access + refresh tokens, bcrypt hashing, audit logging. **OAuth 2.0:** Google + GitHub OAuth with backend-initiated flow, find-or-create user logic, provider linking for existing email accounts. Backend routes: `/auth/oauth/google`, `/auth/oauth/github` (redirect + callback). Prisma schema updated: `passwordHash` optional, `provider`/`providerId` fields with compound unique constraint. **Maintenance (2026-07-12):** Fixed refresh-token rotation 500 error (duplicate refresh-token insert on rotation), removed 5 `any` ESLint warnings in `oauth.ts` (now 0 lint warnings), and fixed a follow-up TypeScript typecheck error in `oauth.ts` (ambient `Response` typed as `{}` under the API tsconfig — resolved by casting `fetch` results to a local `OAuthHttpResponse` interface). API typecheck + lint pass with 0 warnings. |
| 6 | React Foundation | ✅ Complete | 100% | Vite + MUI + TanStack Query + routing + API client + auth context + route guards + feature-based module structure |
| 7 | Design System | ✅ Complete | 100% | MUI light/dark themes + Tailwind integrated. **UI Components (17):** Button, Input, Select, Textarea, Checkbox (+CheckboxGroup), Radio (+RadioGroup), Switch (+SwitchGroup), Card, Modal, ConfirmDialog, Drawer, Sidebar, Badge, Avatar (+AvatarGroup), Tooltip, Tabs (+TabPanel), Breadcrumb, Typography (Heading, Subheading, Paragraph, Caption, Label). **Data:** StatCard, ActivityFeed. **Feedback:** Toast, Loading, EmptyState. **Layout:** Header, Footer, Sidebar. |
| 8 | Dashboard Layout | ✅ Complete | 100% | Gold-themed responsive Sidebar with grouped navigation organized into platform-domain categories reflecting the README Platform Highlights (navConfig: MAIN MENU, WALLET & PAYMENTS, MARKETPLACE, BOOKINGS, REWARDS, AI SERVICES, MANAGEMENT, SYSTEM, SECURITY). Implemented routes are fully navigable; documented roadmap modules (Digital Wallet, Payments, Transactions, Marketplace, Orders, Bookings, Vestara Points, Security Center) are shown with a non-clickable "Soon" badge. System status footer with API health polling. Responsive Header with search (hidden on mobile), notifications bell, theme toggle, user menu. Mobile drawer sidebar with full-width on xs / 320px on sm. DashboardLayout with `<Outlet />` for nested routing. Route pages: `/` (Dashboard), `/analytics`, `/users`, `/settings`, `/admin` |
| 9 | Dashboard Layout Enhancement | ⚡ Enhanced | 100% | Replaced user profile display with server API status widget. Added real-time API health monitoring, status indicators, and latency tracking. Enhanced sidebar with API polling every 30 seconds and improved visual feedback. |
| 10 | Dashboard Widgets | ✅ Complete | 100% | **Built:** StatCard (icons, loading state, optional trend) and ActivityFeed (avatars, timestamps, action types/colors). **Real data wiring (2026-07-12):** DashboardPage fetches live API data via TanStack Query — 4 KPI cards + Recent Activity feed mapped from real `AuditLogDTO`s. **Charts/analytics integration (2026-07-12):** Replaced the placeholder card with real `@mui/x-charts` visualizations — an Audit Activity area chart with a 7/14/30-day toggle (paginated `useAuditLogsRange` over `/audit-logs` startDate/endDate), plus User Status donut (active vs inactive from KPI queries) and Activity-by-Action / Activity-by-Entity horizontal bar charts derived from the same range data. Loading skeletons + empty states included; theme-aware via MUI palette. **Multi-tenancy (2026-07-13):** All dashboard data now organization-scoped via `organizationId` on users, audit logs, and settings; KPIs reflect org-level data. |
 | 10 | Dashboard Features | ✅ Complete | 100% | **Built:** Header search bar (responsive, hidden on mobile), notification bell + popover wired to audit-logs API, message popover component, refresh button, organization name display in header. **New (2026-07-13):** Global Search Dialog (Cmd/Ctrl+K) with keyboard navigation, search across all navigation items grouped by category. User Preferences dialog with Appearance (theme, density, sidebar), Notifications (email/push toggles), Localization (language, date/time formats) tabs — preferences persisted to localStorage and synced with ThemeContext. **Updated (2026-07-14):** User Preferences converted from right-side Drawer to centered Modal (fullscreen on mobile, max-width lg on desktop) for better UX consistency. **Updated (2026-07-15):** Dashboard now displays the organization **name** (fetched via `useOrganization`) instead of the raw `organizationId`. KPI cards gained trend deltas — the **Audit Events** card compares the current window against the previous equal-length window (via `useAuditCount`). All chart/activity logic was extracted into a reusable `features/analytics` module (constants, activity mapping, chart aggregation hooks, `useAuditActivity`/`useAuditCount`/`getPreviousRange`) shared by both the Dashboard and the Analytics page. **Maintenance (2026-07-16):** Replaced the static numeric date-range toggle with a reusable `features/calendar/` module — `DateRangeContext` + `CalendarDatePicker` + `CalendarPopover` (range preset chips + custom range) wired into `AppProvider` and the Dashboard header (`CalendarPopover`); the old `DateRangeButton` was removed. Header now shows a **dynamic, route-based title** derived from `location.pathname` via `layouts/routeTitles.ts` (sidebar nav + profile sub-routes), so every page is labelled automatically. Global Search Dialog rewritten to be **data-driven and route-scoped**: navigation results are generated live from `navConfig` (excluding roadmap "soon" placeholders), live user search queries `usersApi.list({ search })` (debounced) and deep-links to `/users?focus=<id>`, and an **All / This Page** scope toggle limits results to the active route. The header **Online Users** presence indicator (`PresenceIndicator`) was removed from `HeaderActions` (kept the real-time `ConnectionStatus` dot). Typecheck, lint, and build all pass. |
 | 10b | Analytics Page | ✅ Complete | 100% | **Live analytics page (`/analytics`) (2026-07-15):** Rebuilt from static placeholders to fully live, real API-backed data. Range selector (7/14/30/90 days) drives KPI cards (Total Users, Active Users, Audit Events with trend vs previous period, System Settings), an Audit Activity area chart, a User Status donut, Activity-by-Action / Activity-by-Entity horizontal bar charts, and a Recent Activity feed. Uses the shared `features/analytics` module and `useLiveDashboard()` for real-time refresh, with a `LiveBadge` in the header. **Maintenance (2026-07-16):** The range selector now uses the shared `features/calendar/` `CalendarPopover` (presets + custom range) instead of the numeric `DateRangeButton`. All data is org-scoped. Typecheck, lint, and build pass. |
| 11 | Authentication Pages | ✅ Complete | 100% | Login, Register, Forgot Password, Reset Password pages with Vestara Elite design. AuthLayout with left brand panel (geometric backgrounds, gold/purple orbs, hero text, stats, testimonial) + right form panel. Custom AuthField component with icon, label, error state, password toggle. OAuthButtons (Google + GitHub). PasswordStrength indicator. OAuth callback page (`/auth/callback`). AuthContext with `oauthRedirect` + `handleOAuthCallback`. react-hook-form + zod validation. Route guards (ProtectedRoute, PublicRoute). Plus Jakarta Sans font. |
| 12 | User CRUD | ✅ Complete | 100% | **Backend:** `authenticate` + `requireRole` JWT middleware, full CRUD routes (GET /users paginated+filterable, GET /users/:id, POST, PUT, DELETE, PATCH /users/:id/status). Email uniqueness guard on create (409 `USER_ALREADY_EXISTS`). **Bulk operations:** `POST /users/bulk-delete` (SUPER_ADMIN, self excluded) and `POST /users/bulk-status` (SUPER_ADMIN/ADMIN activate|deactivate) with repository `deleteMany`/`updateManyStatus`. Self-delete protection added to single DELETE. Repository pattern, Prisma queries with sorting/filtering/pagination. **Multi-tenancy (2026-07-13):** All user queries scoped to `organizationId`; new users assigned to requester's org. **Frontend:** UsersPage with DataTable (sort/filter/paginate/select), UserFormDialog for create/edit, status toggle with ConfirmDialog, delete confirmation, role badges, bulk-action toolbar (activate/deactivate/delete with confirmation), **organization column**, and CSV export of all filtered users. TanStack Query hooks for all operations (incl. bulk). **Maintenance (2026-07-12):** Fixed user-delete `500` — the `AuditLog → User` relation was missing `onDelete: Cascade` (while `RefreshToken`/`Session` had it), so deleting any user with audit logs violated the FK constraint. Added `onDelete: Cascade` to the schema and applied via `prisma db push`. |
| 13 | Roles & Permissions | ✅ Complete | 100% | UserRole enum in `@vestara/types`. RBAC enforced via `requireRole(...)` middleware (e.g., `requireRole('super_admin')`) on protected routes. `authenticate` middleware decodes JWT, attaches `req.user`. Frontend nav filters by role. No standalone Role DB model — roles are enum-based. |
| 14 | User Profile | ✅ Complete | 100% | **Backend:** GET/PUT /profile (name, avatar), PUT /profile/password (current pw verification + bcrypt rehash), audit logging for updates. **Multi-tenancy (2026-07-13):** Profile scoped to user's organization. **Frontend:** ProfilePage with General tab (name, avatar URL, email) + Security tab (change password with current pw confirmation, validation), OAuth detection (disables password section), TanStack Query hooks, `updateUser` in AuthContext for immediate UI refresh. UserMenu navigates to `/profile` and `/security`. **New (2026-07-16):** Email change dialog (`PUT /profile/email` with password verification + uniqueness check + audit), self-service account deletion (`POST /profile/delete-account` with password verification, session/token cleanup, redirect to login), avatar file upload via camera icon (triggers file picker → uploads to Vercel Blob → auto-saves profile). AuditAction enum extended with `EMAIL_CHANGE` and `ACCOUNT_DELETION`. **Header & Profile Nav refresh (2026-07-16):** Extracted a shared `features/profile/tabs.tsx` config (`profileTabs` + `getProfileTabFromPath`) as the single source of truth for the 6 profile tabs (Overview, Security, Permissions, Activity, Preferences, Sessions) and their routes. `ProfilePage` now consumes this config for its tab bar + initial-tab derivation. The header `UserMenu` was refactored to render profile-tab shortcuts (Security/Permissions/Activity/Preferences/Sessions) wired to dedicated routes, with gold accents (`theme.palette.primary`) and full `theme.palette` usage (removed all hardcoded `colors` tokens). The entire header chrome — `Header`, `HeaderActions`, `HeaderIconButton`, `DateRangeButton`, `RefreshButton`, `ConnectionStatus`, `NotificationPopover`/`NotificationList`/`NotificationItem`, `MessagePopover`/`MessageList` — was migrated to `theme.palette` for consistent dark-luxury styling matching the Sidebar; the unused `HeaderSearch` component was removed. Routes for `/permissions`, `/activity`, `/preferences`, `/sessions` now mount `ProfilePage`. **Maintenance (2026-07-16):** Fixed profile tab routing — `ProfilePage` now syncs its active tab to `location.pathname` via a `useEffect` (previously the tab was locked to the first-render path), so navigating from the header `UserMenu` shortcuts to `/security`, `/activity`, etc. correctly switches the displayed tab. Typecheck, lint, and build all pass. |
| 15 | Reusable Forms | ✅ Complete | 100% | **Built:** FormField, FormInput, FormTextarea, FormSelect, FormCheckbox, FormRadioGroup, FormSwitch, FormError, FormHelperText, FormSection, FormLayout, FormActions, FormSubmit, FormCancel — all integrated with react-hook-form + Zod via `useFormWithZod` hook. **Auth components:** AuthField, OAuthButtons, PasswordStrength. |
| 16 | Data Table | ✅ Complete | 100% | **Built:** Reusable DataTable component with theme-aware styling. Features: sortable column headers (toggling asc/desc/none), search + filter chips, pagination (page controls, page size selector), row selection (checkbox column), server-side support, loading skeleton, empty state (NoData/NoSearchResults/ErrorState), customizable column definitions (label, sortable, render, align, width). Used by UsersPage, SettingsPage, SystemLogsPage, and OrganizationsPage. **OrganizationsPage rewrite (2026-07-12):** Replaced raw MUI Table with DataTable component — client-side search/sort, Avatar + name column, slug, member count, created date, edit action. Matches UsersPage layout pattern. |
| 17 | Feedback Components | ✅ Complete | 100% | **Built:** Toast/Snackbar with queue management (max 5 concurrent) via ToastProvider + useToast hook — showSuccess/showError/showWarning/showInfo. Loading (spinner/skeleton/overlay/inline + PageLoading, ContentLoading, ButtonLoading). EmptyState (NoData, NoSearchResults, EmptyFolder, ErrorState). **Added:** useConfirm hook for promise-based ConfirmDialog integration. **Modal/Dialog System:** Alert (4 variants: success/error/warning/info, 3 styles: standard/filled/outlined, dismissible), Modal (fullscreen, responsive, custom headers, scroll control), Dialog (SimpleDialog, ConfirmDialog, AlertDialog), enhanced Drawer (temporary/persistent/permanent, Sidebar, SlideOver). |
| 18 | File Manager | ✅ Complete | 100% | **Backend:** Storage provider abstraction (Local, Cloudinary, S3, Google Drive) with factory pattern. File model with org-scoped CRUD, folder hierarchy, metadata. **API:** `/api/v1/files` — list (paginated/filtered), folder contents, upload (multi-file, 100MB), create folder, rename/move, signed download URLs, bulk move/delete. **Storage:** Org-level config via SystemSetting `storage` key — supports LOCAL (default), CLOUDINARY (with provided credentials: API 914425692112145), S3, GOOGLE_DRIVE. **Audit:** All operations logged. **Frontend (2026-07-12):** FileManagerPage with DataTable (sortable columns, row selection, search), folder cards with click-to-navigate, clickable MUI breadcrumbs, upload dialog with drag-and-drop zone and XHR progress bar (LinearProgress), create folder dialog, rename dialog, move dialog (select target folder), delete + bulk delete with ConfirmDialog, image preview dialog, download via URL, list/grid view toggle. **API client:** `apps/web/src/api/files.ts` with XHR upload progress. **Hooks:** `apps/web/src/features/files/hooks.ts` — TanStack Query hooks for folder contents, upload, create folder, rename, move, delete, bulk delete, stats. **Route:** `/files` in SYSTEM nav group. Build + typecheck + lint all pass. |
| 19 | Application Settings | ✅ Complete | 100% | **Backend:** Full CRUD routes with auth middleware, repository pattern, validation. **Multi-tenancy (2026-07-13):** Settings now scoped per-organization via compound unique `[organizationId, key]`. **Frontend:** SettingsPage with DataTable (key-value editor), SettingFormDialog for create/edit with JSON validation, TanStack Query hooks, toast notifications for success/error. **New (2026-07-12):** Audit logging wired through SettingsService (was bypassing it). Versioning via `previousValue` in audit metadata. Export endpoint (`GET /settings/export`) downloads versioned JSON. Import endpoint (`POST /settings/import`) validates & upserts from JSON. Audit history endpoint (`GET /settings/audit-history`) with paginated, filtered change log. Frontend: Export button, SettingsImportDialog (drag-and-drop JSON upload), SettingsAuditHistoryDialog (paginated history with action icons). Shared: `SETTINGS_IMPORT` AuditAction, 3 new DTOs, import validation schema. All build, typecheck, lint, and tests pass. |
| 19b | AI Chatbot | ✅ Complete | 100% | **Backend:** AI service abstraction with pluggable provider architecture (`AIProvider` interface). **OpenCode provider** (`opencode.provider.ts`) — free-tier models (`mimo-v2.5-free`, `deepseek-v4-flash-free`, `nemotron-3-ultra-free`, `north-mini-code-free`), OpenAI-compatible API (`/chat/completions`), reasoning model support (extracts from `reasoning`, `reasoning_content`, `reasoning_details` fields when `content` is null). Provider priority: OpenCode → OpenAI → Anthropic → Mock (fallback). **Database:** `ChatConversation` and `ChatMessage` models with Prisma, `ChatRole` enum, org-scoped conversations. **API:** 9 REST endpoints (`/chat/conversations`, `/chat/send`, `/chat/stream`, etc.). **Frontend:** Full ChatPage UI with responsive layout, conversation list in right-side drawer (toggle via `HistoryIcon`), suggestion chips, typing indicator, OpenCode branding. TanStack Query hooks for all operations. Route at `/chat` in nav. **Tests:** 19 integration tests passing against live OpenCode API. **Seed:** Idempotent `pnpm prisma:seed` with `deleteMany()` cleanup. **Maintenance:** Fixed `findDefaultOrCreate()` race condition (now uses `upsert`), corrected OpenCode base URL from `/zen/go/v1` to `/zen/v1` for free models. |
| 19c | AI Assistant RAG | ✅ Complete | 100% | **Data-Aware AI (Priority 1 RAG):** Added `data-access.ts` with read-only query functions for org-scoped data (users, audit logs, settings, files, org info, dashboard KPIs, user activity, chat stats, user search). Added `context-builder.ts` service that fetches live org data in parallel and formats as structured text context with 60s caching and token budget management. Updated `ChatService.sendMessage()` to inject real-time organization context into system prompt before each AI completion. The AI can now answer questions about actual organization data: user counts/roles, recent audit activity, system settings, file storage stats, dashboard KPIs, and current user's activity. **Seed:** Updated to 2 organizations × 3 users each (admin, moderator, support). |
| 19d | Floating Chat Widget | ✅ Complete | 100% | **Floating AI Chat Widget (2026-07-12):** Added `FloatingChatWidget` component — a floating action button (FAB) in the bottom-right corner with a glow-shadowed chat icon that toggles a chat panel overlay on every page. **Panel:** 400px wide / 620px max-height on desktop, full-screen on mobile, with `Fade` animation. Reuses existing chat hooks/API — auto-resumes the most recent active conversation, supports sending messages, markdown rendering, copy button, suggestion chips, and typing indicator. **Integration:** Rendered inside `DashboardLayout` so it appears across all routes. **Enhanced (2026-07-22):** Added 4 P1 enhancements — **keyboard shortcut** (`Cmd+Shift+K` / `Ctrl+Shift+K`) to toggle the widget from anywhere; **page-aware context suggestions** that show 3 primary + 3 secondary suggestion chips based on the current route (10 routes mapped); **minimized bar mode** with 3-way state (FAB closed → minimized bar showing last assistant message → full panel); **open-in-full-page button** that navigates to `/chat` and closes the widget. All changes build, typecheck, and lint pass with 0 errors. |
| 19e | AI Data Connector | ✅ Complete | 100% | **External REST API → auto visualization with AI-assisted charts (2026-07-15):** Admins configure external REST APIs through a UI; the backend fetches/analyzes the JSON and the frontend auto-visualizes it with AI-assisted charts. **Backend:** New `DataSource` Prisma model (org-scoped, `onDelete: Cascade`); `services/integrations/` with `http-client.ts` (timeout-guarded fetch), `analyzer.ts` (JSON normalization + field-type inference + heuristic viz spec + AI enhancement when `OPENCODE_API_KEY` set), `agent.service.ts` (fetch/auth/analyze/audit). `routes/agent.ts` mounted at `/api/v1/integrations` (`GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `POST /:id/fetch`). Write endpoints gated to `SUPER_ADMIN`/`ADMIN`/`MODERATOR`; fetch/read open to authenticated users. Auth secrets stored server-side, never returned in DTOs (masked with `••••`). New `AuditAction` values `DATA_SOURCE_CREATE/UPDATE/DELETE/FETCH`. **Shared:** `DataSource*` DTOs + `DataSourceAnalysisDTO` + `DataSourceAuthType` in `@vestara/types`; `createDataSourceSchema`/`updateDataSourceSchema`/`dataSourceIdParamSchema` in `@vestara/validation`. **Frontend:** `api/agent.ts`, `features/integrations/hooks.ts`, `DataSourceFormDialog.tsx`, `IntegrationsPage.tsx` (`/integrations`), `DataExplorerPage.tsx` (`/data-explorer`); nav item (Plug icon) in `navConfig.ts` + `routes/index.tsx`. Charts render via heuristic even without an AI key. **Verification:** `pnpm typecheck` 12/12 pass; `pnpm --filter web lint` clean; `pnpm --filter web build` succeeds. Committed on `self-hosted-development`. |
| 20 | Reports | ✅ Complete | 100% | **Backend:** Full report generation API with async job processing (`/api/v1/reports`). Supports 4 report types: audit-logs, users, activity, system-logs. 3 export formats: CSV, Excel (xlsx), PDF. Uses `exceljs` for Excel, `pdfkit` for PDF. Org-scoped data access with filters (date range, action, entity, user). Files stored as base64 data URLs (production would use S3/Blob). **Frontend:** ReportsPage at `/reports` with DataTable showing report history, generate dialog with type/format/date filters, download button, delete action. Export hook for DataTable components. Added to navigation sidebar under "OPERATIONS" group. TanStack Query hooks for all operations. |
| 21 | WebSocket Integration | ✅ Complete | 100% | **Backend:** `ws`-based WebSocket server attached to the Express HTTP server (`apps/api/src/websocket/`), sharing the API port (`/api/v1/ws`). JWT auth via query-param token (validated through `JwtService`), org-scoped rooms (`org:<organizationId>`), presence tracking per org, 30s heartbeat liveness probe, exponential-backoff-ready client, and runtime stats (`GET /api/v1/ws/status`, admin-only). Every audit-log write broadcasts an org-scoped `audit:created` event via `AuditLogRepository.create` (best-effort, no-op when unattached). **Frontend:** `WebSocketClient` (typed pub/sub, auto-reconnect with exponential backoff + jitter, app-level ping heartbeat), `WebSocketProvider` (auto-connects when authenticated, subscribes to org room, disconnects on logout), `useConnectionStatus`/`useWebSocketEvent` hooks, and a `ConnectionStatus` indicator in the header. Vite dev proxy enabled for `/api` WS upgrades. End-to-end smoke test verified `connection:established` + `presence:update` + live `audit:created`. **Note:** Vercel serverless cannot host persistent WebSocket connections — the manager degrades gracefully (broadcasts are no-ops) in that environment; a long-running Node host is required for live features. |
 | 22 | Live Features | ✅ Complete | 100% | Live notifications (via `LiveNotificationsProvider`), dashboard live refresh (`useLiveDashboard`), presence indicator (`PresenceIndicator`), LIVE connection badge (`LiveBadge`). Notifications derived client-side from `audit:created` WebSocket events. **Maintenance (2026-07-16):** Added a `/socket.io` dev proxy (`ws: true`) to `apps/web/vite.config.ts` so the local Vite dev server forwards Socket.IO handshakes to the Express API on `:5000`. Previously the WS client connected to `window.location.origin` and 404'd at Vite, causing a perpetual `connect_error` loop that made `LiveBadge` flicker to ERROR/OFFLINE in local dev; the proxy restores a real `connected` (LIVE) state. Production (Vercel) is unaffected and still degrades gracefully via `getWsCapability()`. |
| 23 | Security | ⏳ Partial | ~45% | Security headers, CORS, JWT auth, validation, audit trail exist. **BigInt serialization (2026-07-21):** Added `BigInt.prototype.toJSON` polyfill to prevent `JSON.stringify` from throwing on Prisma `BigInt` fields (e.g., `File.size`). **Missing:** rate limiting, CSRF, password policies, XSS protection |
| 24 | Monitoring | ⏳ Partial | ~70% | Audit trail service + request logging exist. Audit logs API routes implemented (GET /audit-logs paginated+filterable, GET /audit-logs/:id). **Frontend:** SystemLogsPage built with DataTable, action/entity/date filters, action chips with color-coded icons, formatted timestamps. **Error tracking (2026-07-12):** Global error handler now persists API request errors as audit-log entries (`AuditAction.ERROR`, `entity: 'api'`) for authenticated requests — metadata captures status, code, message, method, path, and stack for 5xx. System Logs page styles the `error` action (red chip + Error icon); dashboard action label added. **Multi-tenancy (2026-07-13):** Audit logs scoped to organization. **Still missing:** performance metrics |
| 25 | Testing | ⏳ In Progress | ~35% | **Test infrastructure set up (2026-07-12):** Added `vitest` + `supertest` dev dependencies, `apps/api/vitest.config.ts` (globals + node env), `test` / `test:watch` scripts in API `package.json`. Auth API integration tests run green via `turbo test` — **11/11 passing** (register, login, refresh-token rotation, logout, me). Fixed broken test expectations (error codes, salted-password comparison, self-comparison assertion) and generated-Prisma import path. **Maintenance (2026-07-21):** Fixed auth test FK constraint violation by adding `file` and `systemSetting` deletion to `beforeEach` cleanup. Increased `testTimeout` from 5s to 30s in `vitest.config.ts` to accommodate Prisma Postgres cold-start latency. Web-app lint/typecheck cleanup pass (removed dead `maintenanceStyles` var and unused `Avatar` import). **Still missing:** unit tests for services/repositories, frontend component/integration/e2e tests, coverage reporting. |
| 26 | Performance | ⏳ In Progress | ~60% | **Implemented:** Route-based lazy loading with `React.lazy()` + `<Suspense>` (per-page chunks, `PageLoading` fallback) in `routes/index.tsx`; vendor chunk splitting via `manualChunks` in `vite.config.ts` (react, mui, tanstack-query, markdown, socket.io vendors split out — initial `index` chunk dropped from 1.7 MB to ~304 KB, pages become on-demand chunks); TanStack Query defaults tuned (`gcTime` 30 min, `refetchOnReconnect`); `React.memo` applied to `StatCard` and `ActivityFeed` presentational components; lazy/async image loading (`loading="lazy"`, `decoding="async"`) for rendered markdown docs. **Still pending:** list/table virtualization (react-window) for large `DataTable` datasets; formal bundle-visualizer audit; deeper `useMemo`/`useCallback` pass on expensive renders. |
| — | PWA Support | ✅ Complete | 100% | **Progressive Web App (2026-07-12):** `vite-plugin-pwa` with Workbox service worker (autoUpdate). Manifest with Vestara branding, dark theme (`#1a1a2e`), standalone display. Icons generated from SVG favicon (192x192, 512x512, maskable). Apple-touch-icon, theme-color, viewport-fit meta tags. Runtime caching for API health (NetworkFirst) and Google Fonts (StaleWhileRevalidate/CacheFirst). Service worker precaches 44 entries (2.4 MB) for offline support. Installable on Android, iOS, and desktop Chrome. |
| 27 | Documentation | ✅ Complete | 100% | Comprehensive README, API docs (`docs/api/README.md`), **Developer Guide** (`docs/DEVELOPER_GUIDE.md`), **Deployment Guide** (`docs/DEPLOYMENT.md`), and **ADRs** (`docs/decisions/` — monorepo, React/MUI, Express/Prisma, JWT, Vercel, Zod, OAuth). **In-app Documentation page** added (`/docs`) — sidebar "Documentation" link renders the `docs/` markdown at build time (via Vite `?raw` imports) with a grouped table of contents and cross-link navigation (react-markdown + remark-gfm). This ROADMAP tracks phase status. |
| 28 | Deployment | ✅ Complete | 100% | **Deployed on Vercel** — API at `vestara-admin-api.vercel.app`, Web at `vestara-admin-web.vercel.app`. Vercel serverless entry at `api/index.ts` with Express routes mounted under `/api/v1`. CORS configured for `.vercel.app` origins. Environment variables configured via Vercel CLI. Build passes `tsc --noEmit` and `vite build`. **Self-hosted alternative (2026-07-16):** full VPS path added — Nginx site config (`infrastructure/nginx/vestara.meetlily.org.conf`: SPA + `/api/v1` proxy, WebSocket upgrade, 100MB uploads, TLS hardening + security headers, HTTP→HTTPS redirect), PM2 ecosystem config (`infrastructure/pm2/ecosystem.config.cjs` auto-loading `.env.deploy`), and `scripts/deploy.sh` (SSH + atomic symlink swap, copies `.env.deploy` to the server, restarts API via ecosystem config). Production env template `.env.deploy.example` and SSH target `deploy.env` (git-ignored) added. **NPM script:** `pnpm deploy:api` (`vercel deploy --prod --project=vestara-admin-api`). Root `prisma:seed` path fixed to `apps/api/prisma/seed.ts`. |
| 29 | CI/CD | ⏳ Partial | ~60% | Vercel auto-deploys from `main` on git push. GitHub Actions workflow for API deployment (`deploy-api.yml`) — builds + deploys API to Vercel on push to `main`. `pnpm deploy:api` one-command CLI deploy. **Self-hosted deploy automation:** `scripts/deploy.sh` deploys the web build to a remote server over SSH with public-key auth (`rsync` + atomic release symlink swap, optional `--api` remote redeploy, health check), plus `.github/workflows/deploy-selfhosted.yml` that builds the web app and runs the script on push to `main`. Documented in `docs/SELF_HOSTED_DEPLOYMENT.md`. **Missing:** CI for lint/typecheck/tests, staging/preview env |
| 30 | Production Readiness | ⏳ Partial | ~55% | Both apps deployed and serving (API health 200, Web login 200). CORS verified. OAuth callbacks functional. GitHub Actions CI/CD configured for API. **Multi-tenancy foundation complete** — Organization model, org-scoped resources, org-level RBAC. **Local dev (2026-07-16):** `docker-compose.yml` (Postgres 17 + Redis 8), Vite dev proxy `/api` → `:5000`, git-ignored localhost `.env`, and `pnpm dev:local` one-command bootstrap (`scripts/dev-local.sh`). **Config fix (2026-07-16):** standardized S3 credential env vars to AWS-conventional `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` (removed dead `config.s3.accessKey`/`secretKey` and the legacy duplicate names). **Missing:** final security audit, performance benchmarks |
| — | Marketing Assets | ✅ Complete | 100% | **`apps/marketing-video/` (2026-07-16):** self-contained Remotion (React/TS) project rendering a 30-second ecosystem overview ad in the dark-luxury + metallic-gold brand style (1920×1080, 30fps, 5 crossfaded beats: Hook, Module grid, AI Assistant spotlight, Admin Analytics spotlight, CTA). Builds a static `build/` bundle for embedding; `pnpm dev` previews in Remotion Studio, `pnpm render` exports `out/vestara-ad.mp4`. **Cinematic T2V prompt:** `apps/marketing-video/prompts/vestara-cinematic-t2v.md` — a ready-to-use prompt optimized for the **HappyHorse-1.1-T2V** text-to-video model (visual/camera/animation/lighting specs + negative prompt) for a premium "command center" cut of the Vestara Elite Companions dashboard. Documented in `apps/marketing-video/README.md` and the root README "Marketing & Promotional" section. **Maintenance (2026-07-16):** pinned `@types/react` to `19.0.10` via a root `pnpm.overrides` entry — Remotion 4.0.285 is incompatible with `@types/react` 19.2.x (stricter `ReactNode` definition caused `'AbsoluteFill' cannot be used as a JSX component` errors). Both `apps/marketing-video` and `apps/web` now typecheck cleanly; the fix is committed and pushed to `main`. |

### Metrics to Track

#### Code Quality Metrics
- **Test Coverage**: Target >90% for all modules
- **Code Duplication**: Keep <5% across the codebase
- **Complexity**: Average cyclomatic complexity < 10
- **Technical Debt**: Track and reduce over time

#### Project Metrics
- **Velocity**: Story points per sprint
- **Time to Merge**: PR cycle time
- **Bug Rate**: Bugs found in production vs. pre-release
- **Uptime**: System availability percentage

## 🔐 Security & Access Control

### Repository Permissions

#### Admin Access
- Ability to create issues and PRs
- Ability to approve and merge PRs
- Access to `develop` and `main` branches

#### Developer Access
- Create and manage feature branches
- Submit PR for review
- Access to documentation and code

#### Read-Only Access
- View issues, PRs, and code
- Access to released documentation

### Branch Protection Rules

- **`main` Branch**: Require:
  - Two approvers minimum
  - Status checks passing
  - No force pushes
  - Protected from deletion

- **`develop` Branch**: Require:
  - CI/CD pipeline passing
  - All PRs resolved
  - Recent commit activity

### Code Review Requirements

#### Minimum Review Standards
1. **Code Quality**: Follows coding standards
2. **Type Safety**: TypeScript strict checks passing
3. **Testing**: 90%+ test coverage
4. **Security**: No critical vulnerabilities
5. **Performance**: Meets performance benchmarks

#### Review Checklist
- [ ] Understand the problem
- [ ] Code reads well
- [ ] Tests cover the changes
- [ ] No performance regressions
- [ ] Secure implementation
- [ ] Documentation adequate

## 🚀 CI/CD Integration

### GitHub Actions

#### Workflow Files

1. **`/.github/workflows/ci.yml`**: Continuous Integration
2. **`/.github/workflows/cd.yml`**: Continuous Deployment
3. **`/.github/workflows/release.yml`**: Release Management

#### Pipeline Stages

1. **Test Stage**
   - Linting (ESLint)
   - Type Checking (TypeScript)
   - Unit Tests
   - Integration Tests

2. **Build Stage**
   - Package builds
   - Docker image creation
   - Security scanning

3. **Deploy Stage**
   - Staging deployment
   - Smoke tests
   - Production promotion

### Automated Workflows

#### Issue to Branch Automation
1. **Label**: `ready for development`
2. **Trigger**: On issue label change
3. **Action**: Create feature branch and Slack notification

#### PR to Merge Automation
1. **Trigger**: PR ready for review and approved
2. **Action**: Add to project board, deploy to staging
3. **Validation**: Smoke tests run

## 📝 Documentation & Communication

### Communication Channels

#### GitHub Discussions
- Feature requests and product decisions
- Technical architecture discussions
- Roadmap adjustments

#### Issue Templates
- Consistent reporting and tracking
- Automated categorization
- Quality assurance

### Documentation Structure

#### API Documentation
- Auto-generated from OpenAPI specs
- Accessible via GitHub Pages
- Regular updates on changes

#### Development Documentation
- Architecture decision records (ADRs)
- Code contributions guidelines
- Development setup instructions

## 🔧 Reporting & Analytics

### GitHub Reports

#### Bug Tracking Report
- Bug frequency by phase
- Resolution time by priority
- Post-release bug rate

#### Feature Progress Report
- Phase completion status
- Feature delivery timeline
- Dependency tracking

#### Developer Productivity Report
- PR creation and merge times
- Code review turnaround times
- Issue resolution rates

## 📈 Success Metrics

### Project Health Metrics
- **Build Success Rate**: % of builds passing
- **Coverage Metrics**: Test coverage by module
- **Security Score**: Vulnerability scan results
- **Performance Metrics**: Response times and error rates

### Delivery Metrics
- **On-Time Delivery**: % of items delivered on time
- **Bug-Free Release Rate**: % of releases without critical bugs
- **Customer Satisfaction**: Internal team feedback scores

## 🔄 Continuous Improvement

### Feedback Loops

1. **Code Review Feedback**: Incorporate into development practices
2. **Test Failure Analysis**: Improve test coverage and quality
3. **Bug Analysis**: Enhance prevention strategies
4. **Performance Monitoring**: Optimize continuously

### Adaptation Procedures

#### When Requirements Change
1. **Update Roadmap**: Adjust timeline and dependencies
2. **Reprioritize**: Reassess priority based on impact
3. **Communicate**: Inform stakeholders of changes

#### When Processes Inefficient
1. **Analyze**: Identify bottlenecks
2. **Adjust**: Modify workflows
3. **Measure**: Track improvements

## 📋 Implementation Checklist

### Repository Setup
- [x] Create GitHub repository with .gitignore
- [ ] Set up branch protection rules
- [ ] Configure issue templates
- [ ] Create project boards
- [ ] Set up CI/CD pipelines
- [ ] Establish communication channels

### Documentation
- [x] Populate GitHub roadmap
- [x] Set up project documentation
- [ ] Create contribution guidelines
- [x] Establish coding standards

### Access & Permissions
- [ ] Configure team access levels
- [x] Set up repository maintainers
- [ ] Configure notification settings
- [ ] Establish code review process

### Quality Assurance
- [x] Implement automated testing (turborepo builds, typecheck, lint)
- [x] Set up linting and type checking
- [ ] Configure security scanning
- [x] Establish deployment procedures (Vercel auto-deploy from main; self-hosted path via `scripts/deploy.sh` + Nginx + PM2 documented in `docs/SELF_HOSTED_DEPLOYMENT.md`; local `docker-compose.yml` + `pnpm dev:local`)

## 📊 Monitoring & Alerts

### GitHub Insights
- **Issue Tracking**: Real-time progress visualization
- **Pull Request Flow**: Cycle time tracking
- **Code Coverage**: Changes in test coverage
- **Security Scans**: New vulnerability detection

### Project Health Alerts
- **Build Failures**: Immediate notification
- **Coverage Drops**: Threshold-based alerts
- **Security Vulnerabilities**: Critical issue notifications
- **Performance Degradation**: Performance threshold alerts

---

*This roadmap provides a comprehensive GitHub-based project management framework that aligns with the Phase-based development approach, ensuring transparency, accountability, and continuous delivery of production-ready software.*

