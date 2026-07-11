# 🧭 Vestara System Workflow (End-to-End)

---

# 1. High-Level System Flow

This system is built on an **event-driven, ledger-first architecture** where:

* API layer handles commands
* Database stores immutable financial state
* Queue system processes side effects
* Workers execute long-running financial operations

```mermaid
flowchart TD
A[User App] --> B[Auth Service]
B --> C[OTP Service]
C --> D[JWT Issuance]

D --> E[Wallet Service]
D --> F[Investment Service]

E --> G[Transaction Service]
F --> G

G --> H[(PostgreSQL - Ledger Source of Truth)]

E --> H
F --> H

G --> I[Queue System - BullMQ]
I --> J[Background Workers]

J --> K[ROI Engine]
J --> L[Payment Reconciliation]
J --> M[Notification Service]
```

---

# 🔐 2. Authentication Workflow

Authentication is **OTP-gated + JWT session-based** with strict rate limiting and audit logging.

```mermaid
sequenceDiagram
participant U as User
participant A as Auth API
participant O as OTP Service
participant DB as Database
participant J as JWT Service

U->>A: Register / Login request
A->>O: Generate OTP
O->>U: Send OTP via SMS
U->>A: Submit OTP
A->>DB: Validate OTP + User
A->>J: Issue JWT Token
J-->>U: Access Token
```

---

## Key Rules

* OTP is **single-use + time-bound**
* JWT contains:

  * `userId`
  * `role`
  * `sessionId`
* Rate limiting per identifier (phone/email)
* All auth attempts are logged for audit

---

# 💰 3. Wallet Workflow (Ledger-Based System)

Wallet is a **derived state system**, not a direct mutable balance.

---

## 3.1 Deposit Flow

```mermaid
flowchart TD
A[User Initiates Deposit] --> B[Wallet API]
B --> C[Create PENDING Transaction]
C --> D[Payment Gateway]
D --> E[Webhook Callback]
E --> F[Verify Signature + Idempotency]
F --> G[Write Ledger CREDIT Entry]
G --> H[Recalculate Wallet Balance]
H --> I[Mark Transaction COMPLETED]
```

---

### State Transitions

```text
PENDING → VERIFIED → COMPLETED → LEDGER_APPLIED
```

---

## 3.2 Withdrawal Flow

```mermaid
flowchart TD
A[User Withdrawal Request] --> B[Wallet API]
B --> C[Validate Balance]
C --> D[Create WITHDRAW Transaction]
D --> E[Approval Engine]
E --> F[External Payout Provider]
F --> G[Webhook Confirmation]
G --> H[Ledger DEBIT Entry]
H --> I[Balance Recalculation]
```

---

# 📈 4. Investment Workflow

Investments follow a **state machine + pooled funding model**.

---

## 4.1 Investment Lifecycle

```mermaid
flowchart TD
A[User Invests] --> B[Validate Wallet Balance]
B --> C[Lock Funds in Ledger]
C --> D[Create Investment Record]
D --> E[Funding Pool Allocation]

E --> F{Funding Goal Reached?}
F -->|No| E
F -->|Yes| G[Activate Investment]

G --> H[ROI Scheduler Worker]
H --> I[Periodic ROI Calculation]
I --> J[Create Payout Record]
J --> K[Credit Wallet Ledger]
K --> L[Update Investment State]
```

---

## 4.2 Investment States

| State     | Meaning                   |
| --------- | ------------------------- |
| OPEN      | Available for funding     |
| FUNDING   | Collecting capital        |
| ACTIVE    | ROI cycle running         |
| PAUSED    | Temporarily halted        |
| COMPLETED | Fully settled             |
| CANCELLED | Aborted before activation |

---

# ⚙️ 5. Background Job System (BullMQ)

All financial computations are **asynchronous and worker-driven**.

```mermaid
flowchart TD
A[API Layer] --> B[Queue Producer]
B --> C[Redis Queue]

C --> D[ROI Worker]
C --> E[Payment Worker]
C --> F[Notification Worker]
C --> G[Investment Worker]
```

---

## Worker Responsibilities

### 📊 ROI Engine

* Calculates daily/hourly returns
* Generates payout records
* Triggers wallet credit events

---

### 💳 Payment Worker

* Validates webhook integrity
* Reconciles failed payments
* Ensures idempotency

---

### 🔔 Notification Worker

* Sends SMS/email updates
* Investment milestones
* Transaction alerts

---

### 📦 Investment Worker

* Handles lifecycle transitions
* Monitors funding pools
* Closes matured investments

---

# 🔁 6. Transaction System Workflow

Transactions act as the **audit backbone** of the system.

```mermaid
flowchart TD
A[Business Action] --> B[Create Transaction Record]
B --> C[Assign Type + Metadata]
C --> D[Validate Rules]
D --> E[Emit Queue Event]
E --> F[Ledger Write]
F --> G[Audit Log Finalization]
```

---

## Transaction Types

* DEPOSIT
* WITHDRAW
* INVEST
* ROI
* SYSTEM_ADJUSTMENT

---

# 🧠 7. Consistency Model

The system uses a **hybrid consistency model**:

---

## Strong Consistency

* Wallet ledger writes
* Transaction creation
* Investment state updates

---

## Eventual Consistency

* Notifications
* Email/SMS
* Analytics pipelines

---

## Ledger Rule

```text
Wallet Balance = SUM(CREDITS) - SUM(DEBITS)
```

---

# 🔐 8. Security Workflow

Security is enforced at multiple layers.

```mermaid
flowchart TD
A[Incoming Request] --> B[JWT Validation]
B --> C[Role-Based Access Control]
C --> D[Rate Limiting]
D --> E[DTO Validation]
E --> F[Business Logic Execution]
F --> G[Audit Logging]
```

---

## Security Layers

* JWT authentication
* OTP verification gate
* Role-based authorization (RBAC)
* Rate limiting per identity
* Webhook signature validation
* Fraud detection hooks (future-ready)

---

# 📊 9. Admin Workflow

Admin layer provides **financial oversight and control mechanisms**.

```mermaid
flowchart TD
A[Admin Dashboard]
A --> B[User Management]
A --> C[Financial Operations]
A --> D[Investment Controls]

B --> E[Suspend / Verify Users]
C --> F[Approve Transactions]
C --> G[Reconcile Wallets]
D --> H[Manage Investment Products]
```

---

# 🧩 10. Full End-to-End System Flow

This represents the complete lifecycle across all subsystems.

```mermaid
flowchart TD
U[User]
U --> AUTH
AUTH --> WALLET
AUTH --> INVEST

WALLET --> TX
INVEST --> TX

TX --> QUEUE
QUEUE --> WORKERS

WORKERS --> DB[(PostgreSQL Ledger)]
WORKERS --> NOTIFY

DB --> ADMIN
```

---

# 🧾 Summary

Vestara is designed as a:

> **Ledger-first, event-driven fintech platform with asynchronous financial computation and strict audit integrity**

### Core Properties:

* API layer = command interface
* Ledger = single source of truth
* Workers = financial computation engine
* Queue system = decoupling layer
* Integrations = external side effects only
