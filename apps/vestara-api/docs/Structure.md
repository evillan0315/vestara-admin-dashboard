# 📁 Project Structure (Production-Grade)

```text
.
├── .env
├── .env.local
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
│
├── docs/                         # 📚 System Documentation
│   ├── Architecture.md           # System design + layering
│   ├── Workflow.md               # End-to-end business flows
│   ├── Structure.md              # Project structure reference
│   ├── API.md                    # Endpoint definitions
│   ├── Database.md               # Prisma schema + ERD
│   └── Deployment.md             # Infra + CI/CD + scaling
│
├── .github/
│   └── workflows/
│       ├── deploy.yml            # API deployment (Vercel)
│       ├── test.yml              # CI tests
│       └── sync-subscribers.yml # Scheduled job pipeline
│
├── prisma/                       # 🗄️ Database Layer (Source of Truth)
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── src/
│
│   ├── server.ts                 # 🚀 Process entry point
│   ├── app.ts                   # Fastify app factory
│   ├── handler.ts               # Serverless adapter (Vercel)
│
│   ├── bootstrap/               # ⚙️ System composition root
│   │   ├── register-plugins.ts  # Plugin injection
│   │   ├── register-routes.ts   # Route mounting
│   │   ├── register-hooks.ts    # Lifecycle hooks
│   │   ├── register-jobs.ts     # Worker + queue binding
│   │   └── register-swagger.ts  # API documentation
│
│   ├── config/                  # ⚙️ Configuration Layer
│   │   ├── env.ts               # Env validation (Zod recommended)
│   │   ├── logger.ts           # Logging system
│   │   ├── prisma.ts           # Prisma client config
│   │   ├── redis.ts            # Redis client config
│   │   ├── bullmq.connection.ts# Queue connection config
│   │   ├── upload.ts           # File upload config
│   │   └── constants.ts       # App-wide constants
│
│   ├── plugins/                # 🔌 Fastify Plugin Layer
│   │   ├── auth.plugin.ts
│   │   ├── cors.plugin.ts
│   │   ├── jwt.plugin.ts
│   │   ├── prisma.plugin.ts
│   │   ├── redis.plugin.ts
│   │   ├── swagger.plugin.ts
│   │   ├── multipart.plugin.ts
│   │   └── rate-limit.plugin.ts
│
│   ├── middleware/             # 🛡️ Request Guards
│   │   ├── auth.middleware.ts
│   │   ├── admin.middleware.ts
│   │   └── error.middleware.ts
│
│   ├── hooks/                  # 🔄 Lifecycle Hooks
│   │   ├── on-request.ts
│   │   ├── pre-handler.ts
│   │   ├── on-send.ts
│   │   └── on-response.ts
│
│   ├── modules/                # 🧩 Domain Modules (Core Business Logic)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── wallet/
│   │   ├── investments/
│   │   ├── payments/
│   │   ├── transactions/
│   │   ├── subscribers/
│   │   ├── uploads/
│   │   ├── sync/
│   │   └── admin/
│
│   ├── jobs/                   # ⚙️ Background Processing Layer
│   │   ├── queue.ts            # Queue registry
│   │   ├── scheduler.ts        # Cron jobs
│   │   ├── queues/             # Queue definitions
│   │   │   └── sync-subscribers.queue.ts
│   │   └── workers/            # Worker implementations
│   │       ├── roi.worker.ts
│   │       ├── investments.worker.ts
│   │       ├── payment.worker.ts
│   │       ├── notifications.worker.ts
│   │       └── sync-subscribers.worker.ts
│
│   ├── database/               # 🗄️ Data Access Layer
│   │   ├── prisma.service.ts
│   │   ├── seed.ts
│   │   └── migrations/
│
│   ├── integrations/           # 🌐 External Service SDK Layer
│   │   ├── payment-gateway/
│   │   ├── sms/
│   │   ├── email/
│   │   ├── storage/
│   │   └── subscribers-api/
│
│   ├── shared/                 # ♻️ Shared Utilities Layer
│   │   ├── constants/
│   │   ├── dto/
│   │   ├── errors/
│   │   ├── types/
│   │   ├── validators/
│   │   └── utils/
│
│   ├── scripts/                # 🧪 CLI & Maintenance Scripts
│   │   ├── migrate.ts
│   │   ├── seed.ts
│   │   ├── sync-subscribers.ts
│   │   └── create-structure.sh
│
│   ├── tests/                  # 🧪 Testing Layer
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── fixtures/
│   │   └── mocks/
│
│   └── dist/                   # 📦 Build Output
```

---

# 🧱 Folder Architecture Model

## 1. Configuration Layer

```text
config/
plugins/
bootstrap/
```

### Responsibility

System initialization, dependency wiring, runtime setup.

---

## 2. Domain Layer (Business Core)

```text
modules/
```

### Responsibility

* Business logic
* API routes
* Services
* Repositories
* Domain rules

### Rule

> No external dependency should leak into business logic.

---

## 3. Infrastructure Layer

```text
database/
integrations/
jobs/
```

### Responsibility

* DB access
* Redis / queues
* External APIs
* Workers

---

## 4. Shared Layer

```text
shared/
```

### Responsibility

* DTOs
* types
* validators
* utilities
* constants
* errors

---

## 5. Runtime Layer

```text
app.ts
server.ts
handler.ts
```

### Responsibility

* App bootstrap
* HTTP server lifecycle
* serverless adapter (Vercel)

---

## 6. Testing Layer

```text
tests/
```

### Responsibility

* unit tests
* integration tests
* mocks
* fixtures

---

# ⚙️ Architecture Principles

## 1. Strict Layer Separation

```text
modules → shared → config → infrastructure
```

Modules NEVER import infrastructure directly.

---

## 2. Queue-Based Async Processing

All heavy operations go through:

```text
API → Queue → Worker → DB
```

---

## 3. Stateless API Design

* Vercel API is stateless
* Redis handles transient state
* Workers handle computation

---

## 4. Ledger-First Financial Model

* Transactions are immutable
* Wallet balance is derived
* Investments are state machines

---

## 5. Event-Driven Execution

* API emits events
* Workers consume events
* Side effects are isolated

---

# 🧠 Final Summary

This structure is optimized for:

* scalable fintech workloads
* asynchronous processing via workers
* clean modular boundaries
* production Vercel deployment
* Redis/BullMQ event orchestration
* audit-safe financial operations
