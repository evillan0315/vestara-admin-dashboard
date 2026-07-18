# Vestara Command Center — Overview

> Enterprise Operating Platform for the Vestara AI Ecosystem.

---

## What Is Vestara?

The **Vestara Command Center** is the operational interface of the Vestara AI Platform. It unifies enterprise administration, artificial intelligence, operational analytics, reporting, workflow automation, infrastructure management, and platform governance into a single AI-native workspace.

Rather than a traditional administration dashboard, the Command Center serves as the operational heart of the Vestara ecosystem — providing a consistent experience for administrators, developers, operators, and future AI agents.

---

## Vision

> Build one intelligent platform capable of managing every aspect of modern digital operations.

Modern organizations operate dozens of disconnected enterprise systems. Vestara challenges that approach by introducing an AI-native enterprise operating platform where every capability contributes to a unified operational experience.

---

## Core Principles

| Principle | Philosophy |
|-----------|------------|
| AI Native | Intelligence is part of the platform, not an add-on. |
| Enterprise Ready | Built for organizations from day one. |
| Modular Architecture | Independent services connected through shared standards. |
| Developer First | Modern tooling, APIs, documentation, and automation. |
| Secure by Design | Governance, compliance, and operational security by default. |
| Future Ready | Designed to evolve alongside autonomous AI systems. |

---

## Platform Domains

| Domain | Purpose | Status |
|--------|---------|--------|
| Dashboard | Operational overview and platform insights | Complete |
| Organizations | Multi-tenant organization management | Complete |
| Users & Roles | User CRUD, RBAC, profile management | Complete |
| Analytics | Platform metrics and operational intelligence | Complete |
| Reports | Business intelligence, CSV/Excel/PDF export | Complete |
| File Management | Enterprise document storage and retrieval | Complete |
| Application Settings | System configuration and governance | Complete |
| AI Chat | Multi-provider AI assistant with RAG | Complete |
| Data Connectors | External REST API integration and visualization | Complete |
| Real-Time | WebSocket live updates, notifications, presence | Complete |
| Security | Hardened auth, rate limiting, CSP, audit trail | Complete |
| Monitoring | System health, metrics, observability | In Progress |
| Digital Wallet | Financial transactions and digital wallets | Planned |
| Marketplace | Products, services, and digital commerce | Planned |
| Bookings | Appointment and scheduling services | Planned |
| Rewards | Loyalty and incentive programs | Planned |
| Workflow Automation | Orchestration and scheduled jobs | Planned |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| Frontend | React 19 + Vite + Material UI v7 + Tailwind CSS v4 |
| Backend | Express 5 + Prisma 7 ORM |
| Database | PostgreSQL 17 (Prisma Postgres hosted) |
| Authentication | JWT (access + refresh tokens) + OAuth 2.0 |
| State Management | TanStack Query (server) + React Context (client) |
| Validation | Zod (shared schemas) |
| Package Manager | pnpm (monorepo workspaces) |
| Build Orchestration | Turborepo |
| Deployment | Vercel (serverless API + static SPA) |
| Alternative Deploy | Self-hosted (Nginx + PM2 + Ubuntu VPS) |

---

## Architecture at a Glance

```
Users
  ↓
Command Center (React SPA)
  ↓
Feature Modules (auth, dashboard, analytics, reports, ...)
  ↓
Shared Services (API client, auth context, query hooks)
  ↓
REST API (Express 5, /api/v1)
  ↓
Services → Repositories → Prisma ORM
  ↓
PostgreSQL Database
  ↓
AI Providers (OpenCode, OpenAI, Anthropic)
```

---

## Multi-Tenancy

Every resource in the system is scoped to an **Organization**. Users, settings, audit logs, files, chat conversations, reports, and data sources all belong to a single organization. The `organizationId` is extracted from the authenticated user's JWT and enforced at the repository layer.

---

## Deployment Options

| Option | Environment | Details |
|--------|-------------|---------|
| Vercel | Cloud | Serverless API + static SPA, auto-deploy from `main` |
| Self-Hosted | Ubuntu VPS | Nginx + PM2 + PostgreSQL + Redis + Let's Encrypt |

---

## Further Reading

- [Quick Start](./QUICK_START.md) — Get running in 5 minutes
- [Architecture](./assets/architecture/ARCHITECTURE.md) — Detailed system design
- [Platform Domains](./PLATFORM_DOMAINS.md) — Module deep-dives
- [Frontend Guide](./FRONTEND.md) — React, MUI, theming, components
- [Backend Guide](./BACKEND.md) — Express, Prisma, services, routes
- [AI Platform](./AI_PLATFORM.md) — AI providers, chat, RAG, data connectors
- [Security](./SECURITY.md) — Auth, hardening, policies
- [API Reference](./api/README.md) — Full REST API documentation
- [Deployment](./DEPLOYMENT.md) — Vercel and self-hosted guides
