# Project Structure

> Complete structural map of the Vestara Command Center monorepo — every folder, every file.

---

## Top Level

```text
vestara-admin-dashboard/
│
├── .env                         # Local environment variables (git-ignored)
├── .env.deploy                  # Deployment environment (git-ignored)
├── .env.deploy.example          # Deployment env template
├── .env.example                 # Local env template
├── .gitignore                   # Git ignore rules
├── .npmrc                       # npm/pnpm configuration
├── .prettierrc                  # Prettier formatting config
├── .vercelignore                # Vercel deploy ignore rules
├── AGENTS.md                    # AI agent instructions
├── INSTRUCTION.md               # Development roadmap
├── README.md                    # Repository overview
├── ROADMAP.md                   # GitHub project management
├── deploy.env                   # Deploy environment
├── deploy.env.example           # Deploy env template
├── docker-compose.yml           # Local dev services (Postgres + Redis)
├── ecosystem.config.cjs         # PM2 process config (root)
├── eslint.config.js             # ESLint configuration
├── opencode.json                # OpenCode AI configuration
├── package.json                 # Root package.json
├── pnpm-lock.yaml               # Dependency lockfile
├── pnpm-workspace.yaml          # Workspace definition
├── prisma.config.ts             # Prisma configuration
├── setup-production-server.sh   # Server setup script
├── tsconfig.base.json           # Shared TypeScript config
├── tsconfig.json                # Root TypeScript config
├── tui.json                     # Terminal UI config
└── turbo.json                   # Turborepo pipeline config
```

---

## apps/api/ — Express 5 Backend

```text
apps/api/
├── .env.local                   # Local API environment
├── .gitignore
├── package.json                 # @vestara/api
├── tsconfig.build.json          # Build TypeScript config
├── tsconfig.json                # Development TypeScript config
├── vercel.json                  # Vercel serverless config
├── vitest.config.ts             # Test configuration
│
├── prisma/
│   ├── schema.prisma            # Database schema (14 models, 8 enums)
│   └── seed.ts                  # Database seed script
│
├── generated/
│   └── prisma/                  # Auto-generated Prisma Client
│
├── tests/
│   └── auth.test.ts             # Auth API integration tests (11 tests)
│
├── uploads/                     # Local file uploads (git-ignored)
│
└── src/
    ├── app.ts                   # Express app setup (middleware stack)
    ├── index.ts                 # Server entry point (HTTP + WebSocket)
    │
    ├── config/
    │   └── index.ts             # Environment variable loading
    │
    ├── docs/
    │   └── openapi.ts           # OpenAPI/Swagger documentation
    │
    ├── generated/
    │   └── prisma/              # Generated Prisma Client (dev path)
    │
    ├── middleware/
    │   ├── authenticate.ts      # JWT decode + req.user attachment
    │   ├── csrf.ts              # CSRF/origin verification
    │   ├── error-handler.ts     # Global error handler
    │   ├── not-found.ts         # 404 handler
    │   ├── rate-limit.ts        # Rate limiting (auth, API, health)
    │   ├── request-id.ts        # X-Request-Id UUID header
    │   ├── request-logger.ts    # Pino HTTP request logging
    │   ├── sanitize.middleware.ts # Input sanitization (XSS defense)
    │   ├── security-headers.ts  # Helmet security headers
    │   ├── upload.ts            # Multer file upload config
    │   └── validate.ts          # Zod schema validation
    │
    ├── repositories/
    │   ├── index.ts             # Repository barrel export
    │   ├── base.repository.ts   # Base repository with common patterns
    │   ├── audit-log.repository.ts
    │   ├── chat.repository.ts
    │   ├── file.repository.ts
    │   ├── organization.repository.ts
    │   ├── refresh-token.repository.ts
    │   ├── reports.repository.ts
    │   ├── session.repository.ts
    │   ├── settings.repository.ts
    │   ├── user-profile.repository.ts
    │   └── user.repository.ts
    │
    ├── routes/
    │   ├── index.ts             # Mounts all routes under /api/v1
    │   ├── agent.ts             # Data connector routes (/integrations)
    │   ├── audit-logs.ts        # Audit log routes
    │   ├── auth.ts              # Auth routes (register, login, refresh)
    │   ├── chat.ts              # AI chat routes
    │   ├── docs.ts              # API documentation routes
    │   ├── files.ts             # File management routes
    │   ├── health.ts            # Health check endpoint
    │   ├── metrics.ts           # System metrics endpoint
    │   ├── oauth.ts             # OAuth routes (Google, GitHub)
    │   ├── organizations.ts     # Organization CRUD routes
    │   ├── profile.ts           # User profile routes
    │   ├── reports.ts           # Report generation routes
    │   ├── settings.ts          # System settings routes
    │   ├── upload.ts            # File upload routes
    │   ├── users.ts             # User CRUD routes
    │   └── websocket.ts         # WebSocket endpoint
    │
    ├── services/
    │   ├── index.ts             # Service barrel export
    │   ├── audit-log.service.ts
    │   ├── auth.service.ts
    │   ├── chat.service.ts
    │   ├── file.service.ts
    │   ├── onboarding.service.ts
    │   ├── reports.service.ts
    │   ├── settings.service.ts
    │   │
    │   ├── ai/
    │   │   ├── index.ts         # AI barrel export
    │   │   ├── ai.service.ts    # AI service orchestrator
    │   │   ├── anthropic.provider.ts
    │   │   ├── context-builder.ts  # RAG context assembly
    │   │   ├── data-access.ts   # Read-only org data queries
    │   │   ├── mock.provider.ts # Fallback mock provider
    │   │   ├── openai.provider.ts
    │   │   ├── opencode.provider.ts  # Free-tier OpenCode
    │   │   └── types.ts         # AI type definitions
    │   │
    │   └── integrations/
    │       ├── agent.service.ts # Data connector orchestration
    │       ├── analyzer.ts      # JSON analysis + viz spec
    │       └── http-client.ts   # Timeout-guarded HTTP fetch
    │
    ├── storage/
    │   ├── index.ts             # Storage barrel export
    │   ├── base.provider.ts     # Base storage provider
    │   ├── cloudinary.provider.ts
    │   ├── factory.ts           # Storage provider factory
    │   ├── google-drive.provider.ts
    │   ├── local.provider.ts    # Local filesystem
    │   ├── s3.provider.ts       # AWS S3 compatible
    │   └── types.ts             # Storage type definitions
    │
    ├── types/
    │   └── express.d.ts         # Express Request type augmentation
    │
    ├── utils/
    │   ├── async-handler.ts     # Async error wrapper
    │   ├── errors.ts            # AppError classes
    │   ├── jwt.ts               # JWT sign/verify utilities
    │   ├── logger.ts            # Pino logger instance
    │   ├── metrics.ts           # System health metrics
    │   ├── pagination.ts        # Pagination helpers
    │   ├── prisma.ts            # Prisma Client singleton
    │   ├── profile-dto.ts       # Profile DTO transformations
    │   ├── response.ts          # Standard API response builder
    │   └── sanitize.ts          # Input sanitization helpers
    │
    └── websocket/
        ├── index.ts             # WebSocket barrel export
        ├── socketio-manager.ts  # WebSocket server with auth + org rooms
        └── types.ts             # WebSocket type definitions
```

---

## apps/web/ — React 19 SPA

```text
apps/web/
├── .gitignore
├── index.html                   # HTML entry point
├── package.json                 # @vestara/web
├── tsconfig.json                # TypeScript config
├── vercel.json                  # Vercel static config
├── vite.config.ts               # Vite build config
│
├── public/
│   ├── favicon.svg              # SVG favicon
│   ├── icon-192x192.png         # PWA icon (192x192)
│   ├── icon-512x512.png         # PWA icon (512x512)
│   ├── icon-maskable-512x512.png # PWA maskable icon
│   └── logo.svg                 # App logo
│
└── src/
    ├── App.tsx                  # Root component
    ├── main.tsx                 # Entry point
    ├── vite-env.d.ts            # Vite type declarations
    │
    ├── api/                     # API client functions
    │   ├── admin.ts             # Admin operations
    │   ├── agent.ts             # Data connector operations
    │   ├── audit-logs.ts        # Audit log queries
    │   ├── chat.ts              # AI chat operations
    │   ├── client.ts            # Axios instance + interceptors
    │   ├── files.ts             # File operations (XHR upload)
    │   ├── monitoring.ts        # System metrics
    │   ├── organizations.ts     # Organization CRUD
    │   ├── profile.ts           # Profile operations
    │   ├── reports.ts           # Report operations
    │   ├── settings.ts          # Settings CRUD
    │   ├── upload.ts            # File upload
    │   ├── users.ts             # User CRUD
    │   └── websocket.ts         # WebSocket connection
    │
    ├── components/
    │   ├── ProtectedRoute.tsx   # Auth route guard
    │   ├── PublicRoute.tsx      # Public route guard
    │   │
    │   ├── auth/
    │   │   ├── AuthField.tsx    # Auth input with icon/label/error
    │   │   ├── OAuthButtons.tsx # Google + GitHub OAuth buttons
    │   │   └── PasswordStrength.tsx # Password strength indicator
    │   │
    │   ├── charts/
    │   │   ├── ChartCard.tsx    # Chart wrapper card
    │   │   └── index.ts
    │   │
    │   ├── common/
    │   │   ├── AvatarUpload.tsx # Avatar upload with preview
    │   │   └── Logo.tsx         # App logo component
    │   │
    │   ├── data/
    │   │   ├── ActivityFeed.tsx # Activity list with avatars
    │   │   ├── DataTable.tsx    # Full-featured data table
    │   │   ├── GridView.tsx     # Grid layout view
    │   │   ├── index.ts
    │   │   └── StatCard.tsx     # KPI stat card
    │   │
    │   ├── feedback/
    │   │   ├── EmptyState.tsx   # No data / no results states
    │   │   ├── index.ts
    │   │   ├── Loading.tsx      # Spinner / skeleton / overlay
    │   │   └── Toast.tsx        # Snackbar notification system
    │   │
    │   ├── header/
    │   │   ├── ConnectionStatus.tsx  # WebSocket status indicator
    │   │   ├── Header.tsx            # Top bar
    │   │   ├── HeaderActions.tsx     # Right-side actions
    │   │   ├── HeaderIconButton.tsx  # Icon button wrapper
    │   │   ├── index.ts
    │   │   ├── MessageList.tsx       # Message list
    │   │   ├── MessagePopover.tsx    # Message popover
    │   │   ├── NotificationItem.tsx  # Single notification
    │   │   ├── NotificationList.tsx  # Notification list
    │   │   ├── NotificationPopover.tsx # Notification popover
    │   │   ├── types.ts
    │   │   ├── UserMenu.tsx          # User menu dropdown
    │   │   ├── UserMenuDropdown.tsx   # Menu dropdown content
    │   │   └── UserMenuTrigger.tsx    # Menu trigger button
    │   │
    │   ├── layout/
    │   │   ├── ApiStatusWidget.tsx    # API health widget
    │   │   ├── Footer.tsx            # App footer
    │   │   ├── GlobalSearchDialog.tsx # Cmd+K search dialog
    │   │   ├── Header.tsx            # Layout header
    │   │   ├── index.ts
    │   │   ├── Sidebar.tsx           # Gold-themed sidebar
    │   │   └── UserPreferencesDialog.tsx # User preferences modal
    │   │
    │   └── ui/
    │       ├── Alert.tsx         # Alert component
    │       ├── Avatar.tsx        # User avatar
    │       ├── Badge.tsx         # Status badge
    │       ├── Breadcrumb.tsx    # Navigation breadcrumb
    │       ├── Button.tsx        # Themed button
    │       ├── Card.tsx          # Content card
    │       ├── Checkbox.tsx      # Checkbox input
    │       ├── Dialog.tsx        # Dialog component
    │       ├── Drawer.tsx        # Slide-in drawer
    │       ├── index.ts
    │       ├── Input.tsx         # Text input
    │       ├── Modal.tsx         # Modal overlay
    │       ├── Radio.tsx         # Radio button
    │       ├── Select.tsx        # Dropdown select
    │       ├── Switch.tsx        # Toggle switch
    │       ├── Tabs.tsx          # Tab navigation
    │       ├── Textarea.tsx      # Multi-line input
    │       ├── Tooltip.tsx       # Hover tooltip
    │       ├── Typography.tsx    # Text components
    │       └── forms/
    │           ├── FormActions.tsx
    │           ├── FormCheckbox.tsx
    │           ├── FormError.tsx
    │           ├── FormField.tsx
    │           ├── FormHelperText.tsx
    │           ├── FormInput.tsx
    │           ├── FormLayout.tsx
    │           ├── FormRadio.tsx
    │           ├── FormRadioGroup.tsx
    │           ├── FormSection.tsx
    │           ├── FormSelect.tsx
    │           ├── FormSwitch.tsx
    │           ├── FormTextarea.tsx
    │           └── index.ts
    │
    ├── features/                # Domain-specific modules
    │   ├── admin/
    │   │   └── hooks.ts
    │   │
    │   ├── analytics/
    │   │   ├── activity.tsx     # Activity feed component
    │   │   ├── charts.ts        # Chart aggregation hooks
    │   │   ├── constants.ts     # Analytics constants
    │   │   ├── hooks.ts         # Analytics query hooks
    │   │   └── index.ts
    │   │
    │   ├── audit-logs/
    │   │   ├── hooks.ts
    │   │   ├── components/
    │   │   │   └── SystemLogsColumns.tsx
    │   │   └── hooks/
    │   │       └── useSystemLogsPage.ts
    │   │
    │   ├── auth/
    │   │   └── AuthContext.tsx  # Auth provider + context
    │   │
    │   ├── calendar/
    │   │   ├── CalendarDatePicker.tsx
    │   │   ├── CalendarPopover.tsx
    │   │   ├── DateRangeContext.tsx
    │   │   ├── DateRangePicker.tsx
    │   │   └── index.ts
    │   │
    │   ├── chat/
    │   │   ├── FloatingChatWidget.tsx  # Floating FAB chat widget
    │   │   └── hooks.ts
    │   │
    │   ├── docs/
    │   │   └── docsContent.ts  # Documentation content loader
    │   │
    │   ├── files/
    │   │   ├── hooks.ts
    │   │   ├── components/
    │   │   │   ├── FileManagerBreadcrumbs.tsx
    │   │   │   ├── FileManagerDialogs.tsx
    │   │   │   ├── FileManagerFolderGrid.tsx
    │   │   │   ├── FileManagerTableColumns.tsx
    │   │   │   └── FileManagerToolbar.tsx
    │   │   └── hooks/
    │   │       └── useFileManagerPage.ts
    │   │
    │   ├── integrations/
    │   │   ├── DataSourceFormDialog.tsx
    │   │   └── hooks.ts
    │   │
    │   ├── monitoring/
    │   │   └── hooks.ts
    │   │
    │   ├── organizations/
    │   │   ├── hooks.ts
    │   │   ├── components/
    │   │   │   ├── OrganizationsDialog.tsx
    │   │   │   └── OrganizationsTableColumns.tsx
    │   │   └── hooks/
    │   │       └── useOrganizationsPage.ts
    │   │
    │   ├── profile/
    │   │   ├── hooks.ts
    │   │   ├── tabs.tsx         # Profile tab config
    │   │   ├── components/
    │   │   │   ├── AddressTab.tsx
    │   │   │   ├── IdentityTab.tsx
    │   │   │   ├── PersonalInfoTab.tsx
    │   │   │   ├── PreferencesTab.tsx
    │   │   │   ├── PrivacyTab.tsx
    │   │   │   ├── ProfileSectionCard.tsx
    │   │   │   ├── ThemePreviewCard.tsx
    │   │   │   └── VerificationStatusBadge.tsx
    │   │   └── hooks/
    │   │       └── useDebounce.ts
    │   │
    │   ├── realtime/
    │   │   ├── auditToNotification.ts  # Audit → notification mapping
    │   │   ├── LiveBadge.tsx           # LIVE connection badge
    │   │   ├── LiveNotificationsProvider.tsx  # Real-time notifications
    │   │   ├── PresenceIndicator.tsx   # Online users indicator
    │   │   └── useLiveDashboard.ts     # Dashboard live refresh
    │   │
    │   ├── reports/
    │   │   ├── hooks.ts
    │   │   ├── components/
    │   │   │   ├── GenerateReportDialog.tsx
    │   │   │   ├── ReportsCompareDialog.tsx
    │   │   │   ├── ReportsDashboardWidget.tsx
    │   │   │   ├── ReportsStatsCards.tsx
    │   │   │   ├── ReportsTableColumns.tsx
    │   │   │   └── ReportsTemplatesPanel.tsx
    │   │   └── hooks/
    │   │       └── useReportsPage.ts
    │   │
    │   ├── settings/
    │   │   ├── hooks.ts
    │   │   ├── SettingFormDialog.tsx
    │   │   ├── SettingsAuditHistoryDialog.tsx
    │   │   ├── SettingsImportDialog.tsx
    │   │   └── useAppLogo.ts    # Sidebar logo customization
    │   │
    │   ├── sidebar/
    │   │   └── useSidebarConfig.ts  # Sidebar navigation config
    │   │
    │   └── users/
    │       ├── exportUsers.ts   # CSV export utility
    │       ├── hooks.ts
    │       ├── UserFormDialog.tsx
    │       ├── components/
    │       │   ├── UsersBulkBar.tsx
    │       │   ├── UsersDialogs.tsx
    │       │   ├── UsersFilterBar.tsx
    │       │   ├── UsersStats.tsx
    │       │   └── UsersTableColumns.tsx
    │       └── hooks/
    │           └── useUsersPage.ts
    │
    ├── hooks/
    │   ├── index.ts
    │   ├── useConfirm.tsx       # Promise-based ConfirmDialog
    │   ├── useFormWithZod.ts    # react-hook-form + Zod integration
    │   └── useResponsive.ts     # Responsive breakpoint detection
    │
    ├── layouts/
    │   ├── AuthLayout.tsx       # Auth pages layout (brand + form)
    │   ├── DashboardLayout.tsx  # Main layout (sidebar + header + outlet)
    │   ├── navConfig.ts         # Navigation structure + RBAC rules
    │   └── routeTitles.ts       # Route → page title mapping
    │
    ├── pages/
    │   ├── AdminPage.tsx        # /admin
    │   ├── AnalyticsPage.tsx    # /analytics
    │   ├── ChatPage.tsx         # /chat
    │   ├── DashboardPage.tsx    # /
    │   ├── DataExplorerPage.tsx # /data-explorer
    │   ├── DocsPage.tsx         # /docs
    │   ├── FileManagerPage.tsx  # /files
    │   ├── ForgotPasswordPage.tsx # /forgot-password
    │   ├── IntegrationsPage.tsx # /integrations
    │   ├── LoginPage.tsx        # /login
    │   ├── MonitoringPage.tsx   # /monitoring
    │   ├── OAuthCallbackPage.tsx # /auth/callback
    │   ├── OrganizationsPage.tsx # /organizations
    │   ├── ProfilePage.tsx      # /profile, /security, /preferences
    │   ├── RegisterPage.tsx     # /register
    │   ├── ReportsPage.tsx      # /reports
    │   ├── ResetPasswordPage.tsx # /reset-password
    │   ├── SettingsPage.tsx     # /settings
    │   ├── SystemLogsPage.tsx   # /system-logs
    │   └── UsersPage.tsx        # /users
    │
    ├── providers/
    │   ├── AppProvider.tsx      # Root provider (queries, theme, auth, WS)
    │   ├── QueryProvider.tsx    # TanStack Query provider
    │   └── ThemeProvider.tsx    # MUI theme provider
    │
    ├── routes/
    │   └── index.tsx            # React Router config (lazy-loaded)
    │
    ├── styles/
    │   ├── globals.css          # Global CSS
    │   ├── markdown.css         # Markdown rendering styles
    │   └── theme.ts             # Legacy theme file
    │
    ├── theme/
    │   ├── ThemeContext.tsx      # Theme context (light/dark toggle)
    │   ├── ThemeSettings.tsx    # Theme settings component
    │   ├── tokens.ts            # MUI theme tokens (gold/dark)
    │   └── types.ts             # Theme type definitions
    │
    ├── utils/
    │   └── notifications.ts     # Notification utilities
    │
    └── websocket/
        ├── hooks.ts             # useConnectionStatus, useWebSocketEvent
        ├── WebSocketClient.ts   # Typed pub/sub with auto-reconnect
        └── WebSocketProvider.tsx # Connection provider
```

---

## apps/marketing-video/ — Remotion Ad

```text
apps/marketing-video/
├── .gitignore
├── package.json
├── README.md
├── tsconfig.json
│
├── prompts/
│   └── vestara-cinematic-t2v.md  # HappyHorse T2V prompt
│
└── src/
    ├── index.tsx               # Entry point
    ├── theme.ts                # Remotion theme
    ├── VestaraEcosystemAd.tsx  # Main composition (30s ad)
    │
    ├── components/
    │   ├── Background.tsx      # Animated background
    │   ├── Glass.tsx           # Glassmorphism effect
    │   └── Logo.tsx            # Logo component
    │
    └── scenes/
        ├── FeatureSpotlight.tsx # Feature highlight scene
        ├── SceneCTA.tsx        # Call-to-action scene
        ├── SceneHook.tsx       # Opening hook scene
        └── SceneModules.tsx    # Module grid scene
```

---

## packages/ — Shared Monorepo Packages

```text
packages/
├── config/                      # @vestara/config
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts             # Shared configuration helpers
│
├── constants/                   # @vestara/constants
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts             # Global constants (pagination, rate limits)
│
├── types/                       # @vestara/types
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts             # Shared TypeScript types, DTOs, enums
│
├── utils/                       # @vestara/utils
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts             # Shared utility functions
│
└── validation/                  # @vestara/validation
    ├── .gitignore
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts             # Shared Zod validation schemas
```

---

## docs/ — Documentation Portal

```text
docs/
├── ai_models.md                 # Available AI model IDs
├── AI_PLATFORM.md               # VDS: AI providers, chat, RAG
├── BACKEND.md                   # VDS: Express, Prisma, services
├── CHANGELOG.md                 # VDS: Version history
├── DEPLOYMENT.md                # Vercel deployment guide
├── DEVELOPER_GUIDE.md           # Day-to-day dev guide
├── FRONTEND.md                  # VDS: React, MUI, theming
├── OVERVIEW.md                  # VDS: Platform overview
├── PLATFORM_DOMAINS.md          # VDS: Module deep-dives
├── QUICK_START.md               # VDS: Get running in 5 minutes
├── ROADMAP.md                   # VDS: Development phases
├── SECURITY.md                  # VDS: Auth, hardening, policies
├── SELF_HOSTED_DEPLOYMENT.md    # Ubuntu VPS deployment guide
│
├── api/
│   └── README.md                # Full REST API reference (1833 lines)
│
├── assets/
│   ├── README.md                # VDS visual asset registry
│   ├── architecture/
│   │   └── ARCHITECTURE.md      # VDS-102: System architecture
│   ├── diagrams/
│   │   └── DIAGRAMS.md          # VDS-106: Repository structure
│   ├── screenshots/
│   │   └── SCREENSHOTS.md       # VDS-104: Product tour
│   └── technology/
│       └── TECHNOLOGY.md        # VDS-105: Tech stack
│
├── decisions/
│   ├── README.md                # ADR index
│   ├── 0001-monorepo-pnpm-turbo.md
│   ├── 0002-react-mui-frontend.md
│   ├── 0003-express-prisma-backend.md
│   ├── 0004-jwt-auth-refresh-rotation.md
│   ├── 0005-vercel-deployment.md
│   ├── 0006-zod-validation.md
│   └── 0007-oauth-providers.md
│
└── standards/
    ├── AI.md                    # AI integration guidelines
    ├── Coding.md                # TypeScript, React, CSS conventions
    ├── Engineering.md           # Core engineering principles
    ├── Security.md              # Security practices
    ├── UI-UX.md                 # Design system, responsive, a11y
    └── VDS.md                   # Vestara Documentation Standard
```

---

## infrastructure/ — DevOps & Deployment

```text
infrastructure/
├── docker/
│   ├── api-entrypoint.sh        # API container entrypoint
│   ├── docker-compose.yml       # Docker Compose config
│   ├── Dockerfile.api           # API container build
│   ├── Dockerfile.web           # Web container build
│   ├── nginx.conf               # Nginx configuration
│   └── web-entrypoint.sh        # Web container entrypoint
│
├── local/
│   └── README.md                # Local development setup guide
│
├── nginx/
│   ├── README.md                # Nginx configuration guide
│   ├── vestara.conf             # Nginx site config (dev)
│   └── vestara.meetlily.org.conf # Nginx site config (production)
│
└── pm2/
    ├── ecosystem.config.cjs     # PM2 process config
    └── README.md                # PM2 configuration guide
```

---

## screens/ — Product Screenshots (VDS-101, VDS-103, VDS-104)

```text
screens/
├── analytics-dark.png           # Analytics page (dark)
├── analytics-light.png          # Analytics page (light)
├── dashboard-dark.png           # Dashboard (dark)
├── dashboard-light.png          # Dashboard (light)
├── files-dark.png               # File manager (dark)
├── files-light.png              # File manager (light)
├── integrations-dark.png        # Integrations (dark)
├── integrations-light.png       # Integrations (light)
├── login-page-dark.png          # Login page (dark)
├── organizations-dark.png       # Organizations (dark)
├── organizations-light.png      # Organizations (light)
├── profile-dark.png             # Profile (dark)
├── profile-light.png            # Profile (light)
├── reports-dark.png             # Reports (dark)
├── reports-light.png            # Reports (light)
├── settings-dark.png            # Settings (dark)
├── settings-light.png           # Settings (light)
├── system-logs-dark.png         # System logs (dark)
├── system-logs-light.png        # System logs (light)
├── users-dark.png               # Users page (dark)
├── vestara-command-center-hero-image.png  # VDS-101: Hero banner
├── vestara-command-center.png            # VDS-103: Platform domains
├── vestara-ecosystem-architecture.png    # Architecture visual
├── vestara-ecosystem.png                 # Ecosystem overview
│
└── elite-companions/
    ├── vestara-admin-elite-dashboard-booking.png
    ├── vestara-admin-elite-dashboard-client.png
    ├── vestara-admin-elite-dashboard-companion.png
    ├── vestara-admin-elite-dashboard-membership.png
    ├── vestara-admin-elite-dashboard-overview.png
    ├── vestara-admin-elite-dashboard-payments-payout.png
    ├── vestara-admin-elite-dashboard-user-profile.png
    └── vestara-admin-elite-dashboard-user-settings.png
```

---

## scripts/ — Automation Scripts

```text
scripts/
├── deploy.sh                    # SSH deploy (atomic symlink swap)
├── dev-local.sh                 # One-command local bootstrap
├── setup-server.sh              # Server setup script
├── test-auth.sh                 # Auth endpoint smoke test
├── verify-prisma.ts             # Prisma schema verification
│
└── screenshot/
    ├── config.ts                # Screenshot config
    └── index.ts                 # Screenshot automation
```

---

## .github/ — CI/CD & Templates

```text
.github/
├── AGENTS.md                    # AI agent instructions (nested)
│
└── workflows/
    ├── ci.yml                   # CI pipeline (lint, typecheck, test)
    ├── deploy-api.yml           # API deployment to Vercel
    └── deploy-selfhosted.yml    # Self-hosted deployment via SSH
```

---

## .opencode/ — OpenCode AI Config

```text
.opencode/
├── .gitignore
├── package.json
├── package-lock.json
│
├── skills/
│   ├── git-commit-push/
│   │   └── SKILL.md             # Git commit/push workflow
│   └── testing-and-quality/
│       └── SKILL.md             # Testing & quality workflow
│
└── themes/
    ├── vestara-dark.json         # OpenCode dark theme
    ├── vestara-light.json        # OpenCode light theme
    └── vestara-midnight.json     # OpenCode midnight theme
```

---

## assets/ — Marketing & Media

```text
assets/
├── Elite Companions Hero Zoomed.png
├── Executive Business Companion.png
├── favicon.svg
├── Filipino Elite Evening Companion Female.png
├── Filipino Elite Evening Companion Marionette.png
├── Full Elite Companions Hero.png
├── Landing Page 01.png
├── Landing Page Companion Page Individual.png
├── Landing Page Companion Page.png
├── logo.svg
├── Luxury Cocktail Companion Female 01.png
├── Luxury Cocktail Dress.png
├── Luxury Evening Gown Female 03.png
├── Luxury Evening Gown Female 04.png
├── Luxury Evening Gown Female 05.png
├── Luxury Evening Gown Female.png
├── Luxury Evening Gown Male.png
├── Resort Companion.png
├── Vestara Dashboard Elite.png
├── Vestara Companion Elite FB post.png
├── Vestara Elite Companion Animated Dashboard.mp4
├── Vestara Elite Companion Animated Promotion.mp4
├── Vestara Elite Companion Dashboard 01.png
├── Vestara Elite Companion Investor Marketing.mp4
├── Vestara Elite Companion Marionette.png
├── Vestara Elite Companion Solo marionette.png
├── Vestara Full HD Dashboard Elite.png
├── Vestara Promotional Content 03.png
├── vestara-companion-02.png
├── vestara-elite-companion-page.png
├── vestara-elite-dashboard.png
├── vestara-elite-facebook-post.png
├── vestara-elite-investor-marketing-ads.png
├── vestara-elite-investor-promotional.png
├── vestara-elite-investor-security-marketing-ads.png
├── vestara-elite-marketing-recruitment.png
├── vestara-elite-promotional-content.png
└── vestara-elite-promotional-marketing.png
```

---

## File Count Summary

| Directory | Files | Purpose |
|-----------|-------|---------|
| Root configs | 20 | Build, lint, env, Docker |
| `.github/` | 4 | CI/CD workflows |
| `.opencode/` | 6 | AI agent config + themes |
| `apps/api/` | ~75 | Express backend |
| `apps/web/` | ~135 | React frontend |
| `apps/marketing-video/` | ~10 | Remotion ad |
| `packages/` | 15 | Shared packages |
| `docs/` | ~30 | Documentation portal |
| `infrastructure/` | 12 | Docker, Nginx, PM2 |
| `screens/` | 33 | Product screenshots |
| `scripts/` | 6 | Automation |
| `assets/` | 38 | Marketing/media |
| **Total** | **~384** | **Excluding node_modules, dist, .git** |
