# Vestara Documentation Standard (VDS)

> The documentation standard that ensures consistency across every Vestara repository.

---

## Purpose

The VDS defines how documentation is structured, written, and maintained across the entire Vestara ecosystem. Every repository — from the Command Center to the SDK — follows this standard.

---

## Documentation Structure

Every Vestara repository should contain:

```
docs/
├── OVERVIEW.md          # What this repository does
├── QUICK_START.md       # Get running in 5 minutes
├── ARCHITECTURE.md      # System design and data flow
├── API.md               # API reference (if applicable)
├── SECURITY.md          # Security architecture
├── DEPLOYMENT.md        # How to deploy
├── CHANGELOG.md         # Version history
└── standards/           # Engineering standards (if applicable)
```

### Optional Files

| File | When to Include |
|------|----------------|
| `PLATFORM_DOMAINS.md` | Platform modules with multiple domains |
| `FRONTEND.md` | Frontend applications |
| `BACKEND.md` | Backend services |
| `AI_PLATFORM.md` | AI-integrated repositories |
| `ROADMAP.md` | Long-term development plans |

---

## Writing Rules

### Language

- Write in **clear, concise English**
- Use **active voice** ("The API returns..." not "The API is returned...")
- Avoid jargon unless it's a defined term
- Define acronyms on first use

### Structure

- Every document starts with a **title** and **one-line description** (blockquote)
- Include a **Table of Contents** for documents longer than 100 lines
- Use **headings** (H2, H3) to organize content logically
- Use **tables** for structured data (compare options, list properties)
- Use **code blocks** for commands, configs, and code examples
- Use **blockquotes** for callouts, tips, and important notes

### Code Examples

- Always include language identifiers in fenced code blocks
- Show **complete, runnable examples** when possible
- Include comments explaining non-obvious logic
- Show both the command and its expected output

### Links

- Use **relative links** between docs files
- Cross-reference related documents
- Link to external docs (React, Prisma, etc.) for concepts already well-documented elsewhere

---

## Document Templates

### Overview Template

```markdown
# [Repository Name]

> One-line description.

## What Is [Name]?

Paragraph explaining the purpose.

## Vision

> Long-term vision statement.

## Core Principles

| Principle | Philosophy |
|-----------|------------|
| ... | ... |

## Technology Stack

| Layer | Technology |
|-------|-----------|
| ... | ... |
```

### API Reference Template

```markdown
# API Reference

> Base URL: `/api/v1`

## Authentication

Description of auth mechanism.

## Endpoints

### GET /resource

Description.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|

**Response:**
```json
{ ... }
```
```

### Architecture Decision Record (ADR) Template

```markdown
# ADR [Number] — [Title]

- Status: Accepted | Deprecated | Superseded
- Date: YYYY-MM-DD

## Context

What is the issue?

## Decision

What was decided?

## Consequences

- **Positive:** ...
- **Negative:** ...
- **Follow-up:** ...
```

---

## Maintenance

### When to Update

- **Every PR** that changes architecture, APIs, or developer workflow
- **Every release** should update CHANGELOG.md
- **Quarterly review** of all documentation for accuracy

### Ownership

| Document | Owner |
|----------|-------|
| README.md | Repository maintainer |
| API docs | Backend team |
| Architecture | Tech lead |
| Standards | Engineering team |
| Changelog | Release manager |

---

## Mandatory Visual Assets

Every Vestara repository must include these 6 visual assets. They create a recognizable documentation language across the ecosystem.

| ID | Asset | Location | Purpose |
|----|-------|----------|---------|
| VDS-101 | Hero Banner | `screens/` | Primary visual identity |
| VDS-102 | Architecture Diagram | `docs/assets/architecture/` | System design visualization |
| VDS-103 | Platform Domains | `screens/` | Module overview |
| VDS-104 | Product Tour | `docs/assets/screenshots/` | Feature walkthrough |
| VDS-105 | Technology Stack | `docs/assets/technology/` | Tech choices and roles |
| VDS-106 | Repository Structure | `docs/assets/diagrams/` | Codebase organization |

See [`docs/assets/README.md`](../assets/README.md) for full specifications, naming conventions, and compliance checklist.

### Image Standards

| Property | Standard |
|----------|---------|
| Format | PNG (preferred), SVG, WebP |
| Resolution | 2x for Retina displays |
| Max file size | 2MB for screenshots, 5MB for hero |
| Naming | `{feature}-theme.png` (e.g., `dashboard-dark.png`) |
| Directory | `screens/` for images |

### Theme Variants

Provide both light and dark variants for all dashboard and feature pages.

---

## Compliance

Every contribution should be evaluated against the VDS during code review:

- [ ] New features have corresponding documentation updates
- [ ] API changes are reflected in API reference
- [ ] Breaking changes are noted in CHANGELOG.md
- [ ] Architecture changes update ARCHITECTURE.md
- [ ] Code examples are complete and runnable
- [ ] Visual assets included for new features (VDS-101 through VDS-106)
