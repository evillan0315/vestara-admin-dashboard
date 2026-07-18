# Technology Stack

> VDS-105 — Visual and tabular representation of technology choices and their roles.

---

## Stack Overview

```text
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                     │
│  React 19 · Material UI v7 · Tailwind CSS v4            │
├─────────────────────────────────────────────────────────┤
│                    Application Layer                      │
│  React Router v7 · TanStack Query v5 · React Hook Form  │
├─────────────────────────────────────────────────────────┤
│                    Build Layer                             │
│  Vite 6 · Turborepo · TypeScript (strict)               │
├─────────────────────────────────────────────────────────┤
│                    API Layer                               │
│  Express 5 · Zod · JWT · WebSocket (ws)                 │
├─────────────────────────────────────────────────────────┤
│                    Data Layer                              │
│  Prisma 7 · PostgreSQL 17 · Redis 8                     │
├─────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                    │
│  Vercel · Docker · Nginx · GitHub Actions               │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend

| Technology | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| React | 19 | UI library | Concurrent features, server components ready |
| TypeScript | 5.x | Type safety | Strict mode enabled |
| Vite | 6 | Build tool | Fast HMR, optimized production builds |
| Material UI | v7+ | Component library | Enterprise components, theming, accessibility |
| Tailwind CSS | v4+ | Utility styling | Layered on top of MUI |
| React Router | v7 | Client routing | Nested layouts, lazy loading |
| TanStack Query | v5 | Server state | Caching, optimistic updates, background refetch |
| React Hook Form | latest | Form handling | Performance-first forms |
| Zod | latest | Validation | Shared schemas with backend |
| Axios | latest | HTTP client | Interceptors, auth header injection |
| lucide-react | latest | Icons | Consistent icon system |
| Recharts | latest | Charts | Data visualization (via MUI X Charts wrapper) |

### Build & Dev

| Tool | Purpose |
|------|---------|
| Vite Dev Server | Fast development with HMR |
| Tailwind CSS Vite Plugin | Tailwind integration |
| Prettier | Code formatting |
| ESLint | Static analysis |

---

## Backend

| Technology | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| Express | 5 | HTTP framework | Async error handling, middleware |
| TypeScript | 5.x | Type safety | Strict mode enabled |
| Prisma | 7 | ORM | Type-safe queries, migrations |
| PostgreSQL | 17 | Primary database | Prisma Postgres (hosted) |
| Redis | 8 | Cache & sessions | Optional locally, used for caching |
| JWT | — | Authentication | Access + refresh token rotation |
| Zod | — | Request validation | Shared schemas with frontend |
| Pino | — | Structured logging | JSON logs, request logging |
| Helmet | — | Security headers | CSP, HSTS, XSS protection |
| Multer | — | File uploads | Image/file upload handling |
| bcrypt | — | Password hashing | 12 rounds |
| exceljs | — | Excel export | Report generation |
| pdfkit | — | PDF export | Report generation with branding |
| ws | — | WebSocket | Real-time features, org-scoped rooms |

### Security

| Technology | Purpose |
|-----------|---------|
| express-rate-limit | Rate limiting |
| Helmet | Security headers |
| CORS | Cross-origin resource sharing |
| CSRF protection | Origin verification |

---

## Infrastructure

| Technology | Purpose | Notes |
|-----------|---------|-------|
| pnpm | Package manager | Workspaces, strict dependency resolution |
| Turborepo | Build orchestration | Parallel builds, caching |
| Docker | Containerization | Local dev services |
| Docker Compose | Multi-service dev | PostgreSQL + Redis |
| Vercel | Hosting | Serverless API + static SPA |
| Nginx | Reverse proxy | Self-hosted deployments |
| Let's Encrypt | TLS certificates | Self-hosted deployments |
| PM2 | Process manager | Self-hosted deployments |
| GitHub Actions | CI/CD | Automated testing, deployment |

### Deployment Targets

| Target | Environment | Stack |
|--------|-------------|-------|
| Vercel | Cloud (primary) | Serverless + CDN |
| Self-hosted | Ubuntu VPS | Nginx + PM2 + PostgreSQL |

---

## AI & Automation

| Technology | Purpose | Notes |
|-----------|---------|-------|
| OpenCode | AI provider (free-tier) | Default provider, no billing |
| OpenAI | AI provider (paid) | GPT-4o, GPT-3.5-turbo |
| Anthropic | AI provider (paid) | Claude 3.5 Sonnet |
| OpenAI-compatible API | Provider interface | Standard `/chat/completions` |

### AI Models

| Model | Provider | Type | Cost |
|-------|----------|------|------|
| nemotron-3-ultra-free | OpenCode | General | Free |
| mimo-v2.5-free | OpenCode | Reasoning | Free |
| deepseek-v4-flash-free | OpenCode | General | Free |
| north-mini-code-free | OpenCode | Code | Free |
| gpt-4o | OpenAI | General | Paid |
| claude-3-5-sonnet | Anthropic | General | Paid |

---

## Development Tools

| Tool | Purpose |
|------|---------|
| VS Code | IDE |
| TypeScript | Type checking |
| ESLint | Linting |
| Prettier | Formatting |
| Vitest | Testing framework |
| Supertest | HTTP integration testing |
| Prisma Studio | Database browser |
| Docker Desktop | Container management |

---

## Version Requirements

| Tool | Minimum Version | Recommended |
|------|----------------|-------------|
| Node.js | 22.0 | Latest 22.x LTS |
| pnpm | 10.0 | Latest 10.x |
| Docker | 24.0 | Latest |
| Docker Compose | v2.20 | Latest |
| Git | 2.40 | Latest |

---

## Environment Variables

### Frontend (VITE_*)

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_API_URL` | API base URL | Yes |
| `VITE_APP_NAME` | Application name | No |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth | No |
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth | No |

### Backend

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `JWT_SECRET` | Access token secret | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes |
| `JWT_EXPIRES_IN` | Access token lifetime | Yes |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | Yes |
| `CORS_ORIGIN` | Allowed origins | Yes |
| `API_URL` | Public API URL | Yes |
| `REDIS_URL` | Redis connection | No |
| `OPENCODE_API_KEY` | OpenCode AI | No |
| `OPENAI_API_KEY` | OpenAI | No |
| `ANTHROPIC_API_KEY` | Anthropic | No |
| `GOOGLE_CLIENT_ID` | Google OAuth | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | No |
| `GITHUB_CLIENT_ID` | GitHub OAuth | No |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth | No |
