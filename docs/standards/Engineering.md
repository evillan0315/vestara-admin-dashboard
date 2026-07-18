# Engineering Standards

> Core engineering principles and practices for the Vestara ecosystem.

---

## Principles

### 1. Simplicity Over Cleverness

- Write code that is easy to understand, not impressive
- Prefer straightforward solutions over complex abstractions
- If you need to explain it, simplify it

### 2. Explicit Over Implicit

- Name things clearly — variables, functions, modules
- Don't rely on hidden behavior or side effects
- Make data flow visible and predictable

### 3. Composition Over Inheritance

- Build features by composing small, focused units
- Prefer hooks and utility functions over class hierarchies
- Keep components and services single-purpose

### 4. Standards Over Preferences

- Follow existing project conventions
- Use the project's established patterns
- Don't introduce new libraries without team consensus

### 5. Maintainability Over Performance

- Write clean code first
- Optimize only when profiling shows a bottleneck
- Document performance-critical sections

---

## Code Quality

### TypeScript

- **Strict mode** always — no `any` types unless unavoidable
- Use **interfaces** for object shapes, **types** for unions/intersections
- Export types alongside implementations
- Use **discriminated unions** for state machines

### Testing

- Write tests for **business logic** (services, utilities)
- Write **integration tests** for API endpoints
- Target **>90% coverage** for critical paths
- Tests should be **deterministic** (no flaky tests)

### Code Review

- Every PR requires at least **one approval**
- Review for: correctness, security, performance, readability
- Use the PR template checklist
- Address all review comments before merging

---

## Architecture

### Layered Architecture (Backend)

```
Routes → Services → Repositories → Database
```

- **Routes:** HTTP concerns only (parsing, response)
- **Services:** Business logic, authorization, audit
- **Repositories:** Data access, Prisma queries

### Feature-Based Architecture (Frontend)

```
features/
├── feature-name/
│   ├── components/    # Feature-specific UI
│   ├── hooks/         # Feature-specific hooks
│   ├── api.ts         # Feature-specific API calls
│   └── types.ts       # Feature-specific types
```

### Shared Packages

- `@vestara/types` — TypeScript types shared between frontend and backend
- `@vestara/validation` — Zod schemas shared for validation
- `@vestara/constants` — Global constants
- `@vestara/utils` — Shared utility functions

---

## Git Workflow

### Branch Naming

```
feature/phase-[N]-[description]
bugfix/[description]
hotfix/[description]
docs/[description]
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(chat): add streaming support
fix(auth): resolve refresh token race condition
docs(api): update endpoint documentation
chore(deps): update dependencies
```

### PR Process

1. Create feature branch from `develop`
2. Implement changes with tests
3. Update documentation if needed
4. Create PR using template
5. Address review feedback
6. Merge after approval + CI pass

---

## Error Handling

### Backend

- Use `AppError` subclasses for business errors
- Always include error code and message
- Log 5xx errors with stack traces
- Return structured error responses

### Frontend

- Handle loading, error, and empty states
- Show user-friendly error messages
- Never expose technical details to users
- Use toast notifications for transient errors

---

## Performance

### Frontend

- Lazy-load routes with `React.lazy()`
- Code-split vendor chunks
- Memoize expensive computations
- Use TanStack Query for server state caching

### Backend

- Paginate all list endpoints
- Use database indexes for filtered queries
- Cache expensive computations (e.g., RAG context: 60s TTL)
- Profile before optimizing

---

## Documentation

- Update docs with every relevant code change
- Write complete, runnable code examples
- Cross-reference related documents
- Follow the [Vestara Documentation Standard (VDS)](./VDS.md)
