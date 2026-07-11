# 🚀 Deployment

## Production Deployment Workflow (Vercel + Workers + Redis Topology)

This document defines the **production infrastructure architecture** for Vestara, including:

* API deployment (Vercel)
* Background workers (separate compute layer)
* Redis (queue + cache backbone)
* PostgreSQL (ledger source of truth)
* CI/CD pipeline flow
* Runtime communication topology

---

# 🧭 1. High-Level Production Architecture

Vestara is deployed as a **hybrid serverless + worker-based system**.

```mermaid id="prod_arch_1"
flowchart TD
A[Client Apps] --> B[Vercel API - Fastify Serverless]

B --> C[PostgreSQL - Primary Ledger DB]
B --> D[Redis - Queue + Cache Layer]

D --> E[BullMQ Queue System]

E --> F[Worker Service Cluster]
F --> G[ROI Engine Worker]
F --> H[Payment Worker]
F --> I[Notification Worker]
F --> J[Investment Worker]

F --> C

B --> K[External Services]
K --> L[Payment Gateway]
K --> M[SMS/Email Provider]
K --> N[Storage Provider]
```

---

# ⚙️ 2. Deployment Components

## 2.1 Vercel (API Layer)

### Responsibilities

* HTTP API (Fastify adapter or edge-compatible handler)
* Authentication
* Transaction orchestration
* Queue job publishing

### Constraints

* Stateless execution
* No long-running jobs
* No direct background processing

### Environment Variables

```bash
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
BULLMQ_PREFIX=vestara
PAYMENT_GATEWAY_KEY=
```

---

## 2.2 Worker Service (Dedicated Compute Layer)

Workers run independently from Vercel.

### Responsibilities

* ROI calculations
* Investment lifecycle processing
* Payment reconciliation
* Notification dispatch

---

### Deployment Options

#### Option A (Recommended)

* Docker container on:

  * AWS ECS / Fly.io / Railway / Render

#### Option B

* Node.js VM (PM2)
* Auto-restart process manager

---

### Worker Runtime Flow

```mermaid id="worker_flow_1"
flowchart TD
A[Redis Queue] --> B[Worker Process]
B --> C[Business Logic Execution]
C --> D[PostgreSQL Write]
C --> E[External API Calls]
C --> F[Event Logging]
```

---

# 🧠 3. Redis Topology (Critical Layer)

Redis acts as:

* Queue broker (BullMQ)
* Cache layer (session, rate limiting)
* Distributed lock manager

---

## 3.1 Redis Architecture

```mermaid id="redis_topology"
flowchart TD
A[Vercel API] --> B[Redis Instance]
C[Workers] --> B

B --> D[BullMQ Queues]
B --> E[Cache Layer]
B --> F[Rate Limiter Store]
B --> G[Distributed Locks]
```

---

## 3.2 Redis Usage Breakdown

| Feature       | Purpose                                |
| ------------- | -------------------------------------- |
| BullMQ Queues | Async job processing                   |
| Cache         | Fast lookup (users, configs)           |
| Rate Limiting | API protection                         |
| Locks         | Prevent double ROI / duplicate payouts |

---

## 3.3 Recommended Redis Setup

### Production Setup

* Redis Cloud / Upstash / AWS ElastiCache
* Enable persistence (AOF + snapshotting)
* Enable eviction policy: `allkeys-lru`

---

# 🏗️ 4. Worker Topology Design

## 4.1 Worker Clusters

```mermaid id="worker_cluster"
flowchart TD
A[Queue System] --> B1[ROI Worker Cluster]
A --> B2[Payment Worker Cluster]
A --> B3[Notification Worker Cluster]
A --> B4[Investment Worker Cluster]
```

---

## 4.2 Worker Isolation Principle

Each worker group:

* has isolated queue
* has retry policy
* can scale independently
* avoids shared state

---

## 4.3 Example Queue Mapping

| Queue            | Worker              |
| ---------------- | ------------------- |
| roi.queue        | ROI Engine          |
| payment.queue    | Payment Worker      |
| notify.queue     | Notification Worker |
| investment.queue | Investment Worker   |

---

# 🔄 5. CI/CD Pipeline (GitHub Actions → Vercel + Workers)

## 5.1 Deployment Flow

```mermaid id="cicd_flow"
flowchart TD
A[Git Push to Main]
A --> B[GitHub Actions]

B --> C[Run Tests]
B --> D[Build API]
B --> E[Deploy to Vercel]

B --> F[Build Worker Docker Image]
F --> G[Push to Registry]
G --> H[Deploy Worker Service]

E --> I[Production API Live]
H --> J[Worker Cluster Live]
```

---

## 5.2 GitHub Actions Breakdown

### API Deployment (Vercel)

* lint
* test
* build
* deploy via Vercel CLI

---

### Worker Deployment

* build Docker image
* push to registry
* restart worker cluster

---

# 🌐 6. Runtime Communication Flow

## 6.1 Request Lifecycle

```mermaid id="runtime_flow"
sequenceDiagram
participant U as User
participant V as Vercel API
participant R as Redis
participant W as Worker
participant DB as PostgreSQL

U->>V: API Request
V->>DB: Read/Write Transaction
V->>R: Enqueue Job (BullMQ)
R->>W: Dispatch Job
W->>DB: Process Financial Update
W->>R: Emit Completion Event
V-->>U: Response
```

---

# 💰 7. Financial Safety Architecture

## 7.1 Critical Rule

> Vercel NEVER performs financial computations.

All financial operations are delegated to workers.

---

## 7.2 Why This Matters

Prevents:

* double ROI payouts
* race conditions in wallet updates
* inconsistent ledger states
* cold-start duplication bugs

---

## 7.3 Idempotency Layer

Every job includes:

```ts id="idempotency_1"
{
  jobId: string,
  idempotencyKey: string,
  type: string
}
```

Redis enforces uniqueness:

* prevents duplicate execution
* ensures safe retries

---

# 📦 8. Database Topology

## 8.1 PostgreSQL Role

Acts as:

* ledger system (source of truth)
* transactional store
* audit history

---

## 8.2 Scaling Strategy

* read replicas for analytics
* partitioned transaction tables (future)
* indexed ledger queries

---

# ⚡ 9. Performance Strategy

## 9.1 Vercel (API Layer)

* edge caching where possible
* stateless execution
* minimal compute logic

---

## 9.2 Workers

* horizontally scalable
* queue-based load distribution
* retry + DLQ (dead-letter queue)

---

## 9.3 Redis

* in-memory speed layer
* TTL-based caching
* queue buffering under load spikes

---

# 🔐 10. Security Architecture

## 10.1 API Layer

* JWT validation
* rate limiting (Redis-backed)
* input validation (DTOs)

---

## 10.2 Worker Layer

* job signature validation
* idempotency enforcement
* restricted environment variables

---

## 10.3 Webhook Security

* HMAC signature validation
* replay protection
* timestamp validation

---

# 📊 11. Scaling Model

## Horizontal Scaling

| Component  | Scaling Method              |
| ---------- | --------------------------- |
| Vercel API | auto-scale serverless       |
| Workers    | container replicas          |
| Redis      | clustered / managed service |
| PostgreSQL | read replicas + pooling     |

---

## Bottleneck Prevention

* isolate heavy ROI processing in workers
* avoid synchronous financial writes
* queue-based load smoothing

---

# 🧠 12. System Summary

Vestara production architecture is:

> A **serverless API layer (Vercel) + distributed worker system + Redis-backed event bus + PostgreSQL ledger core**

### Core guarantees:

* API stays stateless
* Workers handle all financial logic
* Redis orchestrates async flow
* PostgreSQL remains single source of truth
* system is horizontally scalable by design
