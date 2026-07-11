# 🧱 1. System Overview

This backend is designed as a **modular, layered, event-driven financial platform** built on:

* Fastify (HTTP runtime)
* Prisma (database ORM)
* Redis (cache + queues)
* BullMQ (background jobs)
* TypeScript (strict typing)
* Modular domain-driven architecture

The system supports:

* Authentication & OTP flows
* Wallet & ledger-based financial operations
* Investment lifecycle management
* Transaction processing
* External integrations (payments, SMS, email)
* Background processing for ROI, sync, notifications

---

# 🧩 2. Architectural Style

## 2.1 Layered + Modular Hybrid Architecture

The system follows a **hybrid of Clean Architecture + Modular Monolith**:

```text
HTTP Layer (Fastify Routes)
        ↓
Controller Layer
        ↓
Service Layer (Business Logic)
        ↓
Repository Layer (Data Access)
        ↓
Infrastructure Layer (DB, Redis, APIs)
```

---

## 2.2 Domain Isolation (Modules)

Each module is a **bounded context**:

* auth
* users
* wallet
* investments
* payments
* transactions
* subscribers
* uploads
* sync
* admin

Each module is self-contained:

```text
module/
├── controller
├── service
├── repository
├── schema
├── routes
├── types
```

---

# ⚙️ 3. System Boot Flow

## 3.1 Entry Points

### `server.ts`

Responsible for:

* starting HTTP server
* environment validation
* error-safe boot

### `app.ts`

Responsible for:

* Fastify instance creation
* plugin + route registration

---

## 3.2 Boot Sequence

```text
server.ts
  ↓
app.ts
  ↓
register-plugins.ts
  ↓
register-hooks.ts
  ↓
register-routes.ts
  ↓
register-jobs.ts
  ↓
register-swagger.ts
```

---

## 3.3 Startup Responsibilities

| Layer   | Responsibility                   |
| ------- | -------------------------------- |
| Plugins | extend Fastify (DB, Redis, auth) |
| Hooks   | request lifecycle handling       |
| Routes  | HTTP endpoints                   |
| Jobs    | background workers               |
| Swagger | API documentation                |

---

# 🧠 4. Dependency Flow Model

## 4.1 Strict Dependency Direction

```text
Controller
  ↓
Service
  ↓
Repository
  ↓
Infrastructure (Prisma / Redis / APIs)
```

---

## 4.2 Forbidden Dependencies

❌ Service → Controller
❌ Repository → Service
❌ Domain → Infrastructure directly
❌ Module → Module direct coupling

---

# 🧱 5. Core Layer (Foundation)

## Purpose

`core/` contains **framework-independent logic**

### Includes:

* Errors
* Validators
* Utilities
* Constants
* Base types
* Logger abstraction

---

## Why It Exists

It ensures:

* no duplication across modules
* no coupling to Fastify or Prisma
* predictable reuse layer

---

# 🧬 6. Domain Modules

Each module represents a **business capability boundary**.

---

## 6.1 Example: Auth Module

Responsibilities:

* user registration
* OTP verification
* login/session issuance
* token lifecycle

---

## Internal Flow

```text
Route → Controller → Service → Repository → Prisma
```

---

## Data Ownership Rule

Only the module that owns the domain can mutate its data.

Example:

* Wallet module owns balance updates
* Investment module cannot directly modify wallet balance

---

# 💰 7. Financial Modules (Critical Design Rules)

## 7.1 Wallet System

### Responsibilities:

* balance tracking
* ledger integrity
* deposits/withdrawals
* transaction reconciliation

### Rule:

> Wallet is the **single source of truth for user funds**

---

## 7.2 Investment System

### Responsibilities:

* investment creation
* ROI computation triggers
* lifecycle state management
* profit distribution

### Rule:

> Investments never directly modify wallet — only emit events or queue jobs

---

## 7.3 Transaction System

### Responsibilities:

* audit trail
* immutable record logging
* reconciliation layer

### Rule:

> Transactions are append-only (never updated, only appended)

---

# 🔌 8. Infrastructure Layer

## 8.1 Purpose

Encapsulates all external systems:

* Redis
* BullMQ
* Storage providers
* External APIs

---

## 8.2 Redis Layer

Used for:

* caching
* session storage
* queue backend

---

## 8.3 Queue System (BullMQ)

### Architecture:

```text
Queue Producer → Redis → Worker → Domain Service
```

### Components:

* queue.registry.ts → defines queues
* worker.registry.ts → binds workers
* scheduler.ts → cron triggers

---

## 8.4 Worker Responsibilities

Workers handle:

* ROI calculation
* payment processing
* notification dispatch
* subscriber sync

---

# ⚡ 9. Event & Job Processing Model

## 9.1 Asynchronous Processing Flow

```text
HTTP Request
   ↓
Service
   ↓
Queue Job
   ↓
Worker Execution
   ↓
Database Update
```

---

## 9.2 Why This Matters

Prevents:

* blocking HTTP threads
* financial race conditions
* heavy compute in request cycle

---

# 🔐 10. Authentication Architecture

## 10.1 Flow

```text
Register → OTP Sent → Verify OTP → Issue JWT → Access System
```

---

## 10.2 Security Layers

* JWT plugin (session control)
* Rate limiting (abuse prevention)
* Middleware guards (route protection)
* Admin middleware (role-based access)

---

# 🧾 11. Database Architecture (Prisma)

## 11.1 Structure

* schema.prisma defines single source of truth
* migrations track evolution
* seed.ts initializes system state

---

## 11.2 Design Rules

* no business logic in Prisma layer
* all writes go through repositories
* soft deletion preferred for audit systems

---

# 🔌 12. Integration Layer

## Purpose

Wraps external APIs into stable internal SDK-like services.

### Examples:

* Payment Gateway → `charge(), refund()`
* Email → `sendEmail()`
* SMS → `sendOtp()`
* Storage → `uploadFile()`

---

## Design Rule

> No raw HTTP calls outside integrations/

---

# 🔄 13. Request Lifecycle (End-to-End)

## Example: Wallet Deposit

```text
Client Request
   ↓
Route Handler
   ↓
Controller
   ↓
Wallet Service
   ↓
Transaction Repository
   ↓
Prisma DB Write
   ↓
Queue Job (notify user)
   ↓
Worker sends SMS/email
```

---

# 📦 14. Plugin System Architecture

Fastify plugins extend runtime capabilities:

| Plugin               | Role                     |
| -------------------- | ------------------------ |
| auth.plugin.ts       | JWT verification         |
| prisma.plugin.ts     | DB access injection      |
| redis.plugin.ts      | cache + queue connection |
| rate-limit.plugin.ts | abuse protection         |
| swagger.plugin.ts    | API docs                 |

---

# 🧠 15. Design Principles

## 15.1 Core Principles

* Modular isolation
* Strict dependency direction
* Stateless services
* Event-driven background processing
* Immutable financial records

---

## 15.2 Anti-Patterns Avoided

❌ Fat controllers
❌ Shared mutable state
❌ Direct cross-module DB access
❌ Business logic in repositories
❌ Sync-heavy financial operations

---

# 📊 16. Scalability Strategy

## Horizontal Scaling Ready

* stateless Fastify servers
* Redis-backed queues
* worker separation
* modular domain isolation

---

## Future-ready upgrades:

* microservice extraction per module
* Kafka event bus (optional evolution)
* distributed workers per domain

---

# 🧠 17. Summary

This architecture is designed to support:

* fintech-grade reliability
* scalable investment systems
* asynchronous financial workflows
* strict modular boundaries
* long-term maintainability
