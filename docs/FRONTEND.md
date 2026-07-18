# Frontend Guide

> React 19, Material UI v7, Tailwind CSS v4, and the Vestara design system.

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Theming & Design System](#theming--design-system)
- [Component Library](#component-library)
- [Feature Modules](#feature-modules)
- [State Management](#state-management)
- [Routing](#routing)
- [Forms & Validation](#forms--validation)
- [Data Tables](#data-tables)
- [Performance](#performance)
- [PWA Support](#pwa-support)

---

## Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI library |
| TypeScript | strict | Type safety |
| Vite | 6 | Build tool & dev server |
| Material UI | v7+ | Component library |
| Tailwind CSS | v4+ | Utility styling |
| React Router | v7 | Client-side routing |
| TanStack Query | v5 | Server state management |
| React Hook Form | latest | Form handling |
| Zod | latest | Schema validation |
| Axios | latest | HTTP client |
| Zustand | latest | Client state (optional) |
| lucide-react | latest | Icons |

---

## Project Structure

```
apps/web/src/
├── api/                    # API client functions (files.ts, etc.)
├── components/
│   ├── charts/             # ChartCard, chart wrappers
│   ├── data/               # DataTable, StatCard, ActivityFeed
│   ├── feedback/           # Toast, Loading, EmptyState
│   └── ui/                 # Button, Input, Card, Modal, Tabs, etc.
├── features/
│   ├── analytics/          # Chart aggregation hooks, date range utils
│   ├── calendar/           # DateRangeContext, CalendarDatePicker
│   ├── chat/               # Chat page, hooks, API
│   ├── files/              # File manager hooks, API
│   ├── integrations/       # Data connector hooks, API
│   ├── monitoring/         # Monitoring page, hooks, API
│   ├── profile/            # Profile page, tabs config
│   ├── realtime/           # Live notifications, presence, dashboard
│   ├── reports/            # Report hooks, API, components
│   └── settings/           # Settings hooks, API
├── hooks/                  # Shared custom hooks
├── layouts/
│   ├── DashboardLayout.tsx # Main layout with sidebar + header
│   ├── Header.tsx          # Top bar with search, notifications, user menu
│   ├── Sidebar.tsx         # Gold-themed navigation sidebar
│   └── navConfig.ts        # Navigation structure and RBAC rules
├── pages/                  # Route page components
├── routes/
│   └── index.tsx           # React Router configuration with lazy loading
├── styles/                 # Global styles, Tailwind integration
├── theme/
│   ├── ThemeContext.tsx     # Theme provider (light/dark toggle)
│   └── tokens.ts           # MUI theme tokens (colors, typography, spacing)
├── types/                  # Frontend-specific TypeScript types
├── utils/                  # Client-side utilities
└── websocket/
    ├── WebSocketClient.ts  # Typed pub/sub with auto-reconnect
    └── WebSocketProvider.tsx # Connection provider
```

---

## Theming & Design System

### Theme Tokens

The Vestara theme uses a dark-luxury aesthetic with metallic gold accents:

```typescript
// apps/web/src/theme/tokens.ts
const tokens = {
  palette: {
    primary: { main: '#D4AF37', light: '#F0D060', dark: '#B8960F' },  // Gold
    background: { default: '#0A0A1A', paper: '#12122A' },             // Dark
    text: { primary: '#E8E8F0', secondary: '#A0A0B8' },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
  },
};
```

### Theme Modes

- **Light:** Clean white backgrounds with gold accents
- **Dark:** Deep navy backgrounds with gold accents (default)

Toggle via `ThemeContext` — persisted to `localStorage` and synced with user profile preferences.

### Tailwind Integration

Tailwind CSS v4 is layered on top of MUI via `@tailwindcss/vite`. Use Tailwind for utility styling and MUI for component structure.

---

## Component Library

### Core UI Components (17)

| Component | Description |
|-----------|-------------|
| `Button` | Themed button with variants (primary, secondary, ghost, danger) |
| `Input` | Text input with label, error state, icon support |
| `Select` | Dropdown select with search |
| `Textarea` | Multi-line text input |
| `Checkbox` + `CheckboxGroup` | Checkbox with group |
| `Radio` + `RadioGroup` | Radio button with group |
| `Switch` + `SwitchGroup` | Toggle switch with group |
| `Card` | Content container with glassmorphism |
| `Modal` | Dialog overlay (fullscreen on mobile) |
| `ConfirmDialog` | Confirmation with promise-based API |
| `Drawer` | Slide-in panel (temporary/persistent) |
| `Sidebar` | Navigation sidebar (gold-themed) |
| `Badge` | Status/label badge |
| `Avatar` + `AvatarGroup` | User avatar with group |
| `Tooltip` | Hover tooltip |
| `Tabs` + `TabPanel` | Tab navigation |
| `Breadcrumb` | Navigation breadcrumb |
| `Typography` | Heading, Subheading, Paragraph, Caption, Label |

### Data Components

| Component | Description |
|-----------|-------------|
| `DataTable` | Full-featured table (sort, filter, paginate, select) |
| `StatCard` | KPI card with icon, value, trend |
| `ActivityFeed` | Activity list with avatars and timestamps |

### Feedback Components

| Component | Description |
|-----------|-------------|
| `Toast/Snackbar` | Queue-managed notifications (max 5) |
| `Loading` | Spinner, Skeleton, Overlay, Inline variants |
| `EmptyState` | NoData, NoSearchResults, ErrorState variants |
| `useConfirm` | Promise-based ConfirmDialog hook |

### Form Components

| Component | Description |
|-----------|-------------|
| `FormField` | Wrapper with label, error, helper text |
| `FormInput` | Integrated with react-hook-form + Zod |
| `FormSelect` | Dropdown with validation |
| `FormCheckbox` / `FormRadioGroup` / `FormSwitch` | Boolean/group inputs |
| `FormSection` / `FormLayout` / `FormActions` | Layout helpers |
| `useFormWithZod` | Hook integrating react-hook-form with Zod schemas |

---

## Feature Modules

Feature modules encapsulate domain-specific logic under `src/features/`:

| Module | Purpose |
|--------|---------|
| `analytics/` | Chart aggregation hooks, date range utilities, shared between Dashboard and Analytics pages |
| `calendar/` | `DateRangeContext`, `CalendarDatePicker`, `CalendarPopover` — global date range selection |
| `chat/` | AI chat page, conversation hooks, API client |
| `files/` | File manager hooks and API (upload with XHR progress) |
| `integrations/` | Data connector hooks and API |
| `monitoring/` | System health metrics page and API |
| `profile/` | Profile page tabs configuration, shared between page and header UserMenu |
| `realtime/` | `LiveNotificationsProvider`, `PresenceIndicator`, `LiveBadge`, `useLiveDashboard` |
| `reports/` | Report hooks, API, generate dialog, table columns |
| `settings/` | Settings hooks and API |

---

## State Management

### Server State (TanStack Query)

All API data is managed via TanStack Query hooks:

```typescript
// Example: useUsers hook
export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.list(params),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
  });
}
```

### Client State

- **Auth:** `AuthContext` (login, logout, register, user, OAuth)
- **Theme:** `ThemeContext` (light/dark, preferences)
- **WebSocket:** `WebSocketProvider` (connection, events)
- **Live Notifications:** `LiveNotificationsProvider` (real-time audit events)
- **Date Range:** `DateRangeContext` (global date range selection)

---

## Routing

Route-based code splitting with `React.lazy()`:

```typescript
// apps/web/src/routes/index.tsx
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const UsersPage = lazy(() => import('../pages/UsersPage'));
// ... all pages lazy-loaded
```

**Route Guards:**
- `ProtectedRoute` — redirects to `/login` if unauthenticated
- `PublicRoute` — redirects to `/` if already authenticated

---

## Forms & Validation

Shared Zod schemas between frontend and backend:

```typescript
// packages/validation/src/schemas/user.ts
export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['super_admin', 'admin', 'moderator', 'support']),
});
```

```typescript
// Frontend usage
const form = useFormWithZod({
  schema: createUserSchema,
  onSubmit: (data) => createUserMutation.mutate(data),
});
```

---

## Data Tables

The `DataTable` component supports:

- Sortable column headers (asc/desc/none toggle)
- Search input + filter chips
- Pagination (page controls, page size selector)
- Row selection via checkbox column
- Server-side support (sort, filter, pagination params passed to API)
- Loading skeleton while data loads
- Empty states (NoData, NoSearchResults, ErrorState)
- Customizable column definitions with `render` functions

---

## Performance

### Implemented

- **Route-based lazy loading** — `React.lazy()` + `<Suspense>` per page
- **Vendor chunk splitting** — `manualChunks` in `vite.config.ts` (react, MUI, tanstack-query)
- **Query optimization** — TanStack Query defaults (staleTime 5min, gcTime 30min)
- **Memoization** — `React.memo` on `StatCard` and `ActivityFeed`
- **Lazy images** — `loading="lazy"`, `decoding="async"`

### Pending

- List/table virtualization (`react-window`) for large datasets
- Bundle visualizer audit
- Deeper `useMemo`/`useCallback` pass

---

## PWA Support

Progressive Web App via `vite-plugin-pwa`:

- Workbox service worker (autoUpdate)
- Manifest with Vestara branding, dark theme (`#1a1a2e`)
- Icons generated from SVG favicon (192x192, 512x512, maskable)
- Runtime caching for API health (NetworkFirst) and Google Fonts (StaleWhileRevalidate)
- Installable on Android, iOS, and desktop Chrome
