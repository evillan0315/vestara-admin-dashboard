# Product Tour

> VDS-104 — Step-by-step visual walkthrough of the Vestara Command Center.

---

## 01 · Secure Authentication

![Login Page](../../screens/login-page-dark.png)

Enterprise authentication designed for secure access, future single sign-on integrations, and organization-aware identity management.

**Features:**
- Email + password authentication
- OAuth 2.0 (Google + GitHub)
- Password strength indicator
- Account lockout protection (5 failed attempts → 30 min)
- JWT access + refresh token rotation

---

## 02 · Operational Dashboard

![Dashboard Dark](../../screens/dashboard-dark.png)

A unified operational overview providing visibility into platform health, system activity, users, audit events, and operational metrics.

**Features:**
- KPI stat cards with trend indicators
- Audit Activity area chart (7/14/30-day range)
- User Status donut chart
- Activity-by-Action and Activity-by-Entity bar charts
- Recent Activity feed with avatars and timestamps
- Real-time updates via WebSocket

---

## 03 · Operational Intelligence

![Analytics Dark](../../screens/analytics-dark.png)

Interactive analytics designed for monitoring platform usage, operational trends, and enterprise insights.

**Features:**
- Range selector (7/14/30/90 days)
- KPI cards with trend vs previous period
- Audit Activity area chart
- User Status donut
- Activity breakdown bar charts
- Real-time refresh

---

## 04 · Enterprise Reporting

![Reports Dark](../../screens/reports-dark.png)

Generate, export, and manage operational reports while maintaining complete visibility across platform activities.

**Features:**
- 4 report types (audit-logs, users, activity, system-logs)
- 3 export formats (CSV, Excel, PDF)
- Report templates with saved configurations
- Report comparison (side-by-side)
- PDF branding with organization logo
- Real-time generation progress via WebSocket

---

## 05 · Knowledge & Document Management

![Files Dark](../../screens/files-dark.png)

Enterprise-grade file and document management forming the foundation for future AI knowledge services and intelligent document processing.

**Features:**
- Folder hierarchy with breadcrumbs
- Drag-and-drop upload with progress bar
- Multi-file upload (100MB limit)
- Storage provider abstraction (Local, Cloudinary, S3, Google Drive)
- Image preview, rename, move, delete, download
- List/Grid view toggle

---

## 06 · User Management

![Users Dark](../../screens/users-dark.png)

Full user lifecycle management with role-based access control, bulk operations, and comprehensive filtering.

**Features:**
- DataTable with sorting, filtering, pagination, row selection
- Create/Edit user with avatar upload
- Role badges (super_admin, admin, moderator, support)
- Status toggle with confirmation
- Bulk actions: activate, deactivate, delete
- CSV export of filtered users
- Server-side filtering by role and status

---

## 07 · Organization Management

![Organizations Dark](../../screens/organizations-dark.png)

Multi-tenant organization management with logo upload and member tracking.

**Features:**
- Organization CRUD with DataTable
- Logo upload (integrated with File Manager)
- Member count display
- Slug-based identification
- Org-scoped resources (users, settings, files, audit logs)

---

## 08 · System Settings

![Settings Dark](../../screens/settings-dark.png)

System configuration management with audit trail, import/export, and JSON validation.

**Features:**
- Key-value settings editor
- Create/Edit with JSON validation
- Export (versioned JSON with timestamps)
- Import (drag-and-drop, format detection)
- Audit history with change tracking
- Org-scoped via compound unique constraint

---

## 09 · System Monitoring

![System Logs Dark](../../screens/system-logs-dark.png)

Real-time system monitoring with audit trail, error tracking, and health metrics.

**Features:**
- Audit log DataTable with action/entity/date filters
- Color-coded action chips (error = red)
- Formatted timestamps with relative display
- Error tracking with stack traces
- Request logging (Pino)
- WebSocket connection status

---

## Supplementary Screenshots

### Light Theme Variants

| Feature | Dark | Light |
|---------|------|-------|
| Dashboard | `dashboard-dark.png` | `dashboard-light.png` |
| Analytics | `analytics-dark.png` | `analytics-light.png` |
| Reports | `reports-dark.png` | `reports-light.png` |
| Files | `files-dark.png` | `files-light.png` |
| Organizations | `organizations-dark.png` | `organizations-light.png` |
| Settings | `settings-dark.png` | `settings-light.png` |
| System Logs | `system-logs-dark.png` | `system-logs-light.png` |
| Profile | `profile-dark.png` | `profile-light.png` |
| Integrations | `integrations-dark.png` | — |

### Ecosystem Visuals

| Asset | File | Purpose |
|-------|------|---------|
| Ecosystem Architecture | `vestara-ecosystem-architecture.png` | System architecture overview |
| Ecosystem Overview | `vestara-ecosystem.png` | Platform ecosystem map |
| Command Center | `vestara-command-center.png` | Full platform view |
