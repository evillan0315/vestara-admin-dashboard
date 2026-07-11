# 🧱 1. Database Design Principles

## 1.1 Normalization Rules (3NF+)

The schema follows:

* **1NF**: Atomic fields only (no arrays for core financial data)
* **2NF**: No partial dependencies
* **3NF**: No transitive dependencies
* **Audit-first design**: immutable financial history
* **Event traceability**: every financial action produces a record

---

## 1.2 Core Design Constraints

* Wallet balance is **derived from ledger**
* Transactions are **append-only**
* Investments are **state-driven (finite state machine)**
* External integrations are **decoupled via references**
* Soft delete for non-financial entities only

---

# 🧩 2. Core Entity Overview (ERD Summary)

## 2.1 High-Level Relationships

```text id="erd_1"
User
 ├── Wallet (1:1)
 │     ├── WalletTransaction (1:N)
 │
 ├── Investment (1:N)
 │     ├── InvestmentPayout (1:N)
 │
 ├── Transaction (1:N)
 │
 ├── AuthSession (1:N)
 │
 └── Notification (1:N)
```

---

## 2.2 Financial Flow Model

```text id="flow_1"
Deposit → Transaction → Wallet Ledger → Balance Update
Investment → Funding → ROI Job → Payout → Wallet Credit
```

---

# 🧱 3. Prisma Schema (Normalized Core)

---

# 👤 3.1 User Module

```prisma
model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  phone         String   @unique
  passwordHash  String?

  role          Role     @default(USER)
  status        UserStatus @default(ACTIVE)

  wallet        Wallet?
  investments   Investment[]
  transactions  Transaction[]
  sessions      AuthSession[]
  notifications Notification[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

# 💼 3.2 Wallet Module (Ledger-Based System)

```prisma
model Wallet {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])

  balance   Decimal  @default(0)

  ledger    WalletTransaction[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 3.2.1 Wallet Ledger (Source of Truth)

```prisma
model WalletTransaction {
  id          String   @id @default(cuid())

  walletId    String
  wallet      Wallet   @relation(fields: [walletId], references: [id])

  type        WalletTxType
  amount      Decimal

  referenceId String?  // links to Transaction / Investment / Payment
  description String?

  createdAt   DateTime @default(now())
}
```

---

## 3.2.2 Wallet Transaction Types

```prisma
enum WalletTxType {
  CREDIT
  DEBIT
  INVESTMENT_LOCK
  INVESTMENT_RELEASE
  WITHDRAWAL
  DEPOSIT
  ROI_PAYOUT
}
```

---

# 💳 3.3 Transaction System (Audit Layer)

```prisma
model Transaction {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  type        TransactionType
  amount      Decimal
  status      TransactionStatus

  reference   String?  // external refs (payment gateway, etc.)

  metadata    Json?

  createdAt   DateTime @default(now())
}
```

---

## Transaction Enums

```prisma
enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  TRANSFER
  INVESTMENT
  ROI
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
}
```

---

# 📈 3.4 Investment Module

```prisma
model Investment {
  id          String   @id @default(cuid())

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  amount      Decimal
  roiRate     Float
  durationDays Int

  status      InvestmentStatus

  startDate   DateTime?
  endDate     DateTime?

  payouts     InvestmentPayout[]

  createdAt   DateTime @default(now())
}
```

---

## Investment States

```prisma
enum InvestmentStatus {
  PENDING
  ACTIVE
  COMPLETED
  CANCELLED
}
```

---

## 3.4.1 ROI Payouts (Critical Financial Table)

```prisma
model InvestmentPayout {
  id            String   @id @default(cuid())

  investmentId  String
  investment    Investment @relation(fields: [investmentId], references: [id])

  amount        Decimal
  payoutDate    DateTime

  status        PayoutStatus

  createdAt     DateTime @default(now())
}
```

---

## Payout States

```prisma
enum PayoutStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
}
```

---

# 🔐 3.5 Authentication System

```prisma
model AuthSession {
  id          String   @id @default(cuid())

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  refreshToken String
  expiresAt    DateTime

  createdAt   DateTime @default(now())
}
```

---

# 🔔 3.6 Notification System

```prisma
model Notification {
  id        String   @id @default(cuid())

  userId    String
  user      User     @relation(fields: [userId], references: [id])

  type      NotificationType
  title     String
  message   String

  read      Boolean  @default(false)

  createdAt DateTime @default(now())
}
```

---

## Notification Types

```prisma
enum NotificationType {
  SYSTEM
  TRANSACTION
  INVESTMENT
  SECURITY
}
```

---

# 💰 3.7 Payment Integration Layer

```prisma
model Payment {
  id          String   @id @default(cuid())

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  provider    String
  externalId  String?

  amount      Decimal
  status      PaymentStatus

  createdAt   DateTime @default(now())
}
```

---

## Payment Status

```prisma
enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}
```

---

# 📦 3.8 Subscriber Sync System

```prisma
model Subscriber {
  id          String   @id @default(cuid())

  email       String   @unique
  phone       String?

  source      String?  // marketing, referral, etc.

  synced      Boolean  @default(false)

  createdAt   DateTime @default(now())
}
```

---

# 🔄 4. Relationship Rules

## 4.1 Ownership Rules

| Entity       | Owner |
| ------------ | ----- |
| Wallet       | User  |
| Investment   | User  |
| Transaction  | User  |
| Notification | User  |
| Payment      | User  |

---

## 4.2 Immutable Rules

* WalletTransaction → NEVER UPDATE
* Transaction → append-only log
* InvestmentPayout → final-state only writes
* AuthSession → expire-only deletion

---

## 4.3 Derived State Rules

| Value              | Source                             |
| ------------------ | ---------------------------------- |
| Wallet balance     | WalletTransaction sum              |
| Investment profit  | ROI engine job                     |
| Transaction status | external + internal reconciliation |

---

# ⚙️ 5. Indexing Strategy (Production-Grade)

## 5.1 Critical Indexes

* `User.phone`
* `User.email`
* `Wallet.userId`
* `Transaction.userId`
* `Investment.userId`
* `WalletTransaction.walletId`
* `Payment.externalId`

---

## 5.2 Financial Query Optimization

* composite index: `(userId, createdAt)`
* time-series indexing for ledger queries
* partition-ready transaction logs (future scale)

---

# 🧠 6. Data Flow (End-to-End Financial Lifecycle)

## 6.1 Deposit Flow

```text id="flow_dep"
User → Payment → Transaction → WalletTransaction → Wallet balance update
```

---

## 6.2 Investment Flow

```text id="flow_inv"
User funds → Wallet debit → Investment ACTIVE → ROI worker → Payout → Wallet credit
```

---

## 6.3 ROI Processing Flow

```text id="flow_roi"
Scheduler → Investment scan → ROI calc → Payout creation → Wallet credit
```

---

# 🔐 7. Data Integrity Rules

## 7.1 Financial Safety Rules

* No direct wallet balance mutation
* All funds must pass through ledger
* Every payout must reference investment
* All external payments must map to Transaction

---

## 7.2 Consistency Model

* Strong consistency for wallet updates
* Eventual consistency for notifications
* Asynchronous consistency for ROI jobs

---

# 📊 8. ERD Summary (Final View)

```text id="erd_final"
User
 ├── Wallet
 │     ├── WalletTransaction
 │
 ├── Transaction
 ├── Investment
 │     ├── InvestmentPayout
 │
 ├── Payment
 ├── AuthSession
 ├── Notification
 └── Subscriber
```

---

# 🧠 9. Key Architectural Insight

This database is designed as:

> A **ledger-first financial system with event-driven enrichment layers**

Meaning:

* Ledger = truth
* Transactions = audit trail
* Investments = state machine
* Jobs = computation layer
* Integrations = external side effects
