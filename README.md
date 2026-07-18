<div align="center">

# Vestara Command Center

### Enterprise Operating Platform for the Vestara AI Ecosystem

**One Platform • Every Operation • AI Native**

<br>

<img src="./screens/vestara-command-center-hero-image.png" width="100%" alt="Vestara Command Center"/>

<br>

The official enterprise command center for managing organizations, intelligence, automation, analytics, infrastructure, and AI services across the Vestara ecosystem.

<br>

![Status](https://img.shields.io/badge/Status-Active%20Development-2563EB?style=for-the-badge)
![Version](https://img.shields.io/badge/Release-Alpha-F59E0B?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-AI%20Native-10B981?style=for-the-badge)
![Frontend](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge)
![Backend](https://img.shields.io/badge/Fastify-TypeScript-000000?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-7C3AED?style=for-the-badge)

</div>

---

# Enterprise Command Center

The **Vestara Command Center** is the operational interface of the Vestara AI Platform.

Designed for modern organizations, it unifies enterprise administration, artificial intelligence, operational analytics, reporting, workflow automation, infrastructure management, and platform governance into a single AI-native workspace.

Rather than acting as a traditional administration dashboard, the Command Center serves as the operational heart of the Vestara ecosystem, providing a consistent experience for administrators, developers, operators, and future AI agents.

As the platform evolves, every Vestara service—from AI assistants and marketplace services to payment infrastructure, knowledge management, automation, and developer tooling—will integrate through this unified operational environment.

# Platform at a Glance

| | |
|:---|:---|
| **Platform** | Vestara AI Platform |
| **Application** | Vestara Command Center |
| **Repository** | `vestara-admin-dashboard` |
| **Architecture** | AI-Native Enterprise Platform |
| **Frontend** | React 19 + TypeScript |
| **Backend** | Fastify + TypeScript |
| **UI Framework** | Material UI |
| **Styling** | Tailwind CSS v4 |
| **Authentication** | JWT · OAuth · Enterprise Ready |
| **Deployment** | Cloud Native |
| **Current Status** | Active Development |

# Product Tour

The following previews demonstrate the current state of development running within the live Vestara development environment.

---

## 01 · Secure Authentication

![](./screens/login.png)

Enterprise authentication designed for secure access, future single sign-on integrations, and organization-aware identity management.

---

## 02 · Operational Dashboard

![](./screens/dashboard.png)

A unified operational overview providing visibility into platform health, system activity, users, audit events, and operational metrics.

---

## 03 · Operational Intelligence

![](./screens/analytics.png)

Interactive analytics designed for monitoring platform usage, operational trends, and enterprise insights.

---

## 04 · Enterprise Reporting

![](./screens/reports.png)

Generate, export, and manage operational reports while maintaining complete visibility across platform activities.

---

## 05 · Knowledge & Document Management

![](./screens/file-manager.png)

Enterprise-grade file and document management forming the foundation for future AI knowledge services and intelligent document processing.

# Designed as a Unified Enterprise Platform

<p align="center">

<img src="./screens/vestara-ecosystem-architecture.png" width="100%" />

</p>

Unlike traditional enterprise systems composed of disconnected administrative applications, the Vestara ecosystem is designed around a unified architectural model.

Every platform service—including AI operations, enterprise administration, analytics, developer tooling, marketplace services, infrastructure, automation, and future intelligent agents—shares a common architectural foundation defined by the Vestara Blueprint.

The Command Center provides the operational interface through which these services are managed, monitored, secured, and continuously evolved.

# One Platform. Infinite Possibilities.

Modern organizations operate dozens of disconnected enterprise systems.

Identity management, infrastructure, artificial intelligence, reporting, monitoring, security, automation, collaboration, and operational analytics are frequently distributed across separate platforms with different interfaces and inconsistent operational models.

Vestara challenges that approach.

Instead of introducing another dashboard, Vestara is being built as an AI-native enterprise operating platform where every capability contributes to a unified operational experience.

The goal is simple:

> Build one intelligent platform capable of managing every aspect of modern digital operations.

# Platform Capabilities

| Capability | Description |
|------------|-------------|
| Enterprise Administration | Organization, user, role, and permission management |
| Identity & Security | Authentication, authorization, audit, compliance |
| Operational Intelligence | Dashboards, analytics, reporting, insights |
| AI Operations | AI providers, agents, prompts, knowledge |
| Marketplace Services | Commerce, subscriptions, digital services |
| Financial Infrastructure | Wallets, payments, transactions |
| Automation | Workflows, scheduled jobs, orchestration |
| Knowledge Management | Documents, storage, AI-ready content |
| Developer Platform | REST APIs, SDKs, integrations |
| Platform Operations | Monitoring, health checks, observability |

# Platform Principles

| Principle | Philosophy |
|-----------|------------|
| 🤖 AI Native | Intelligence is part of the platform, not an add-on. |
| 🏢 Enterprise Ready | Built for organizations from day one. |
| 🧩 Modular Architecture | Independent services connected through shared standards. |
| ⚡ Developer First | Modern tooling, APIs, documentation, and automation. |
| 🔒 Secure by Design | Governance, compliance, and operational security by default. |
| 🚀 Future Ready | Designed to evolve alongside autonomous AI systems. |

---

# Technology Stack

The Vestara Command Center is built using a modern, enterprise-ready technology stack designed for scalability, maintainability, and long-term evolution.

## Frontend

| Technology | Purpose |
|------------|---------|
| React 19 | User Interface |
| TypeScript | Strongly Typed Development |
| Vite | Build Tool |
| Material UI | Enterprise Component Library |
| Tailwind CSS v4 | Utility-First Styling |
| React Router | Client Routing |
| TanStack Query | Server State Management |
| Recharts | Data Visualization |

---

## Backend

| Technology | Purpose |
|------------|---------|
| Fastify | High Performance REST API |
| TypeScript | Backend Development |
| Prisma ORM | Database Access |
| PostgreSQL | Primary Database |
| Redis | Cache & Sessions |
| JWT | Authentication |
| Zod | Validation |

---

## Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local Development |
| GitHub Actions | CI/CD |
| Nginx | Reverse Proxy |
| Cloudflare | DNS & CDN |
| AWS | Cloud Infrastructure |

---

## AI & Automation

The platform has been designed to support multiple AI providers and autonomous workflows.

Current and planned integrations include:

- OpenAI
- Anthropic Claude
- Google Gemini
- Ollama
- Local LLMs
- Retrieval-Augmented Generation (RAG)
- AI Agents
- Workflow Automation

---

# Project Architecture

The Vestara Command Center follows a domain-driven architecture where functionality is organized into independent feature modules while sharing common platform services and UI components.

```text
vestara-admin-dashboard
│
├── src
│   ├── app/                 # Application bootstrap
│   ├── assets/              # Static assets
│   ├── components/          # Shared UI components
│   ├── config/              # Application configuration
│   ├── constants/           # Global constants
│   ├── contexts/            # React Context providers
│   ├── features/            # Business domains
│   │
│   │   ├── authentication/
│   │   ├── dashboard/
│   │   ├── organizations/
│   │   ├── memberships/
│   │   ├── marketplace/
│   │   ├── wallet/
│   │   ├── bookings/
│   │   ├── rewards/
│   │   ├── ai/
│   │   ├── reports/
│   │   ├── analytics/
│   │   ├── administration/
│   │   └── system/
│   │
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── store/
│   ├── theme/
│   ├── types/
│   └── utils/
│
└── public/
```

Each feature domain encapsulates its own components, pages, services, hooks, and business logic, allowing the platform to scale while maintaining clear architectural boundaries.

Each feature is designed to evolve independently while remaining consistent with the Vestara Blueprint and shared engineering standards.

---

# Repository Structure

The repository is organized into logical areas that separate source code, documentation, assets, automation, and project configuration.

```text
vestara-admin-dashboard
│
├── .github/             GitHub workflows and templates
├── docs/                Project documentation
├── public/              Static public assets
├── screens/             Product screenshots
├── src/                 Application source code
│
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── README.md
└── LICENSE
```

---

# Platform Modules

The Vestara Command Center is composed of independent platform modules that collectively provide a unified enterprise operating experience.

| Domain | Purpose |
|---------|---------|
| Dashboard | Operational overview and platform insights |
| Organizations | Multi-tenant organization management |
| Memberships | Member lifecycle and subscription management |
| Marketplace | Products, services, and digital commerce |
| Wallet & Payments | Financial transactions and digital wallets |
| Bookings | Appointment and scheduling services |
| Rewards | Loyalty and incentive programs |
| AI Services | AI assistants, providers, and automation |
| Reports | Business intelligence and reporting |
| Analytics | Platform metrics and operational intelligence |
| Administration | Configuration and governance |
| Security | Authentication, authorization, and auditing |
| System | Monitoring, health, logs, and diagnostics |

                        React Application

                              │

                      React Router v7

                              │

        ┌─────────────────────┼─────────────────────┐

        ▼                     ▼                     ▼

     Layouts              Feature Modules       Shared Components

        │                     │                     │

        └───────────────┬─────┴─────────────────────┘
                        │

                   API Services

                        │

                 Vestara API Platform

                        │

                Database / AI Services

# Installation

Clone the repository.

```bash
git clone https://github.com/evillan0315/vestara-admin-dashboard.git
```

Enter the project.

```bash
cd vestara-admin-dashboard
```

Install dependencies.

```bash
pnpm install
```

---

# Development Environment

The project uses modern development tooling.

Requirements

- Node.js 22+
- pnpm
- Git
- Docker (optional)
- PostgreSQL
- Redis

---

# Running the Project

Start the development server.

```bash
pnpm dev
```

Build the project.

```bash
pnpm build
```

Preview production.

```bash
pnpm preview
```

Lint the project.

```bash
pnpm lint
```

Run tests.

```bash
pnpm test
```

---

# API Integration

The dashboard communicates with the Vestara API through REST endpoints.

Major service domains include:

- Authentication
- Organizations
- Users
- Analytics
- Reports
- Files
- Marketplace
- Wallet
- AI Services
- Notifications
- Audit Logs
- Platform Settings

Future releases will introduce GraphQL, WebSocket support, and AI-native event streaming.

---

# Configuration

Application configuration is centralized and environment-driven.

Configuration areas include:

- Authentication
- Branding
- Feature Flags
- Storage Providers
- AI Providers
- Logging
- Monitoring
- API Endpoints

The goal is to minimize hard-coded values and enable flexible deployments across development, staging, and production environments.

---

# Environment Variables

Example configuration.

```env
VITE_API_URL=http://localhost:5000

VITE_APP_NAME=Vestara

VITE_ENABLE_AI=true

VITE_ENABLE_ANALYTICS=true

VITE_ENABLE_MARKETPLACE=true

VITE_GOOGLE_CLIENT_ID=

VITE_GITHUB_CLIENT_ID=
```

---

# Development Roadmap

The Command Center is being developed incrementally following the Vestara Blueprint.

| Phase | Status |
|---------|:------:|
| Authentication | ✅ |
| Dashboard | ✅ |
| Analytics | ✅ |
| Reports | ✅ |
| File Management | ✅ |
| Organizations | 🚧 |
| Marketplace | 🚧 |
| Wallet | 🚧 |
| Payments | 🚧 |
| AI Services | 🚧 |
| Knowledge Platform | 🚧 |
| Mobile Integration | 📅 |
| AI Agents | 📅 |
| Workflow Automation | 📅 |
| Multi-Tenancy | 📅 |
| Enterprise Monitoring | 📅 |

Long-term development is guided by the Vestara Blueprint and focuses on transforming the Command Center into a comprehensive enterprise operating platform.

---

# Contributing

Contributions are welcome.

Before submitting changes, please:

- Read the Vestara Blueprint.
- Follow the Vestara Documentation Standard (VDS).
- Follow the Vestara Engineering Standards.
- Use Conventional Commits.
- Maintain TypeScript strict mode.
- Keep components modular and reusable.
- Write clear documentation for new functionality.

Every contribution should improve the consistency, maintainability, and long-term vision of the platform.

---

# License

This project is licensed under the MIT License.

See the `LICENSE` file for additional information.

---

<div align="center">

## Building the Future of AI-Native Enterprise Platforms

The Vestara Command Center is more than an administration dashboard.

It is the operational interface of a growing ecosystem designed to unify enterprise operations, artificial intelligence, automation, and digital services into one intelligent platform.

**One Vision • One Architecture • One Platform**

---

**Part of the Vestara Ecosystem**

Vestara Blueprint • Command Center • API • AI Platform • Mobile • Marketplace • SDK • CLI

</div>
