# Coding Standards

> Language-specific coding conventions for the Vestara codebase.

---

## TypeScript

### General

- **Strict mode** — `tsconfig.json` has `"strict": true`
- No `any` types — use `unknown` and narrow with type guards
- No `@ts-ignore` or `@ts-expect-error` without a comment explaining why
- Use **named exports** over default exports (except React components and pages)

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Variables | camelCase | `userName`, `isLoading` |
| Functions | camelCase | `getUserById`, `formatDate` |
| Classes | PascalCase | `UserService`, `PrismaClient` |
| Interfaces | PascalCase | `UserDTO`, `ChatMessage` |
| Types | PascalCase | `UserRole`, `ReportType` |
| Enums | PascalCase (enum), camelCase (values) | `UserRole.admin` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE` |
| Files | kebab-case | `user.service.ts`, `chat.repository.ts` |
| React components | PascalCase | `UserFormDialog`, `StatCard` |
| CSS classes | kebab-case (Tailwind) | `bg-primary`, `text-secondary` |

### Type Definitions

```typescript
// Prefer interfaces for object shapes
interface CreateUserDTO {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// Use types for unions and intersections
type ReportType = 'audit_logs' | 'users' | 'activity' | 'system_logs';

// Use discriminated unions for state
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
```

### Imports

```typescript
// Group imports: external → internal → relative
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography } from '@mui/material';

import { usersApi } from '@/api/users';
import { UserDTO } from '@vestara/types';

import { UserCard } from './UserCard';
import { useUsers } from './hooks';
```

---

## React

### Components

- Use **functional components** exclusively
- Use **TypeScript** for all props (interface or type)
- Destructure props in the function signature
- Keep components under **300 lines** — extract hooks and sub-components

```typescript
interface UserCardProps {
  user: UserDTO;
  onSelect: (userId: string) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <Card onClick={() => onSelect(user.id)}>
      <Typography>{user.firstName} {user.lastName}</Typography>
    </Card>
  );
}
```

### Hooks

- Custom hooks start with `use` — `useUsers`, `useAuth`, `useToast`
- One responsibility per hook
- Return consistent shapes (data, loading, error, actions)

### State Management

- **Server state:** TanStack Query — never store API data in local state
- **Auth/session:** React Context (`AuthContext`)
- **UI state:** Local `useState` or `useReducer`
- **Shared UI state:** React Context (theme, WebSocket, notifications)
- Avoid prop drilling — use context or composition

### Performance

- Use `React.memo` for pure presentational components
- Use `useMemo` for expensive computations
- Use `useCallback` for stable function references in dependencies
- Lazy-load routes with `React.lazy()` + `<Suspense>`

---

## CSS / Styling

### Tailwind CSS

- Use Tailwind utility classes for layout and spacing
- Use MUI's `sx` prop for theme-aware styling
- Avoid custom CSS files — prefer utility-first
- Use `@apply` sparingly, only for repeated patterns

### MUI

- Use MUI components as the base
- Customize via the theme (`tokens.ts`) not inline styles
- Use `sx` prop for one-off styles
- Use `styled()` for reusable component variants

### Theme Usage

```typescript
// Access theme values via sx prop
<Box sx={{ color: 'primary.main', bgcolor: 'background.paper' }}>

// Or via useTheme hook
const theme = useTheme();
<Box sx={{ color: theme.palette.primary.main }}>
```

---

## Backend (Express)

### Routes

- One route file per domain — `users.ts`, `auth.ts`, `settings.ts`
- Route handlers are thin — delegate to services
- Always validate input with Zod middleware
- Use `authenticate` middleware for protected routes
- Use `requireRole()` for RBAC

```typescript
router.get('/users',
  authenticate,
  requireRole('super_admin', 'admin'),
  async (req, res, next) => {
    try {
      const result = await userService.list(req.query, req.user);
      res.json({ success: true, data: result.data, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }
);
```

### Services

- Business logic lives here
- Inject repositories via constructor (dependency injection)
- Always check authorization beyond middleware
- Log audit events for critical actions
- Throw `AppError` subclasses for business errors

### Repositories

- One repository per model
- All queries are org-scoped
- Use Prisma's type-safe query API
- Return plain objects, not Prisma models (when possible)

---

## File Organization

### Frontend

```
src/
├── api/              # API client functions
├── components/       # Shared UI components
├── features/         # Domain-specific modules
│   └── feature-name/
│       ├── components/
│       ├── hooks/
│       ├── api.ts
│       └── types.ts
├── hooks/            # Shared custom hooks
├── layouts/          # Layout components
├── pages/            # Route page components
├── routes/           # Router configuration
├── theme/            # Theme tokens and context
└── utils/            # Utility functions
```

### Backend

```
src/
├── config/           # Environment configuration
├── middleware/        # Express middleware
├── repositories/     # Data access layer
├── routes/           # HTTP route definitions
├── services/         # Business logic
├── utils/            # Utility functions
└── websocket/        # WebSocket server
```

---

## Comments

### When to Comment

- **Always:** Public APIs, complex algorithms, business rules
- **Sometimes:** Non-obvious logic, workarounds with tracked issues
- **Never:** Obvious code, redundant explanations, commented-out code

### Comment Style

```typescript
// Good: Explains WHY, not WHAT
// Lock after 5 failed attempts to prevent brute-force attacks
if (user.failedLoginAttempts >= 5) {
  throw new AccountLockedError();
}

// Bad: Just restates the code
// Check if failedLoginAttempts is greater than or equal to 5
if (user.failedLoginAttempts >= 5) {
```

---

## Error Messages

- Be **specific** — "Email already exists" not "Error occurred"
- Be **actionable** — "Password must be at least 8 characters" not "Invalid password"
- Include **error codes** for programmatic handling
- Never expose internal details (stack traces, SQL queries) to users
