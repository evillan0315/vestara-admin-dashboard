# VDS Visual Assets

> Mandatory visual assets that create a recognizable documentation language across Vestara repositories.

---

## Mandatory Assets

Every Vestara repository must include these 6 visual assets. They establish a consistent visual identity across the ecosystem.

| ID | Asset | Location | Status |
|----|-------|----------|--------|
| VDS-101 | Hero Banner | `screens/vds/vestara-command-center-hero-image.png` | Complete |
| VDS-102 | Architecture Diagram | `docs/assets/architecture/ARCHITECTURE.md` | Complete |
| VDS-103 | Platform Domains | `screens/vds/vestara-command-center.png` | Complete |
| VDS-104 | Product Tour | `docs/assets/screenshots/SCREENSHOTS.md` | Complete |
| VDS-105 | Technology Stack | `docs/assets/technology/TECHNOLOGY.md` | Complete |
| VDS-106 | Repository Structure | `docs/assets/diagrams/DIAGRAMS.md` | Complete |

---

## VDS-101 — Hero Banner

**Purpose:** Primary visual identity for the repository. Used in README headers, documentation landing pages, and promotional materials.

**File:** `screens/vds/vestara-command-center-hero-image.png`

**Specifications:**
- Width: 1920px (recommended)
- Aspect ratio: 16:9 or wider
- Dark background with gold accents (brand palette)
- Shows the application in context (dashboard view)

**Usage:**
```markdown
<img src="./screens/vds/vestara-command-center-hero-image.png" width="100%" alt="Vestara Command Center"/>
```

**Current asset:** Full-width hero showing the Command Center dashboard with dark theme and gold accents.

---

## VDS-102 — Architecture Diagram

**Purpose:** Visual representation of the system architecture, data flow, and component relationships.

**File:** `docs/assets/architecture/ARCHITECTURE.md`

**Specifications:**
- ASCII/text-based diagrams (renderable in markdown)
- Shows all architectural layers
- Includes data flow arrows
- Covers: client → API → service → repository → database

**Required sections:**
1. System overview (layered diagram)
2. Monorepo structure
3. Request lifecycle
4. Data flow
5. Multi-tenancy model
6. Authentication flow
7. Real-time architecture
8. Deployment architecture

**Current asset:** Complete 328-line architecture document with 8 diagrams.

---

## VDS-103 — Platform Domains

**Purpose:** Visual representation of all platform modules, their status, and relationships.

**File:** `screens/vds/vestara-command-center.png`

**Specifications:**
- Shows all platform domains as a unified interface
- Indicates module status (complete, in-progress, planned)
- Demonstrates the modular architecture

**Usage:**
```markdown
<img src="./screens/vds/vestara-command-center.png" width="100%" alt="Vestara Command Center"/>
```

**Current asset:** Full platform overview showing all domain modules.

---

## VDS-104 — Product Tour

**Purpose:** Step-by-step visual walkthrough of key features for new users and stakeholders.

**File:** `docs/assets/screenshots/SCREENSHOTS.md`

**Specifications:**
- Numbered sections (01, 02, 03, ...)
- Each section: screenshot + title + description
- Covers core user workflows
- Shows both light and dark themes where applicable

**Required screenshots:**

| # | Feature | Screenshot Files |
|---|---------|-----------------|
| 01 | Secure Authentication | `login-page-dark.png` |
| 02 | Operational Dashboard | `dashboard-dark.png`, `dashboard-light.png` |
| 03 | Operational Intelligence | `analytics-dark.png`, `analytics-light.png` |
| 04 | Enterprise Reporting | `reports-dark.png`, `reports-light.png` |
| 05 | Knowledge & Document Management | `files-dark.png`, `files-light.png` |
| 06 | User Management | `users-dark.png` |
| 07 | Organization Management | `organizations-dark.png`, `organizations-light.png` |
| 08 | System Settings | `settings-dark.png`, `settings-light.png` |
| 09 | System Monitoring | `system-logs-dark.png`, `system-logs-light.png` |

**Current asset:** Complete product tour with 9 sections referencing 25 screenshot files.

---

## VDS-105 — Technology Stack

**Purpose:** Visual and tabular representation of the technology choices and their roles.

**File:** `docs/assets/technology/TECHNOLOGY.md`

**Specifications:**
- Categorized tables (Frontend, Backend, Infrastructure, AI)
- Visual stack diagram
- Version requirements
- Alternative technologies considered

**Required sections:**
1. Technology overview table
2. Frontend stack details
3. Backend stack details
4. Infrastructure stack
5. AI & automation stack
6. Development tools
7. Version requirements

**Current asset:** Complete 283-line technology stack document.

---

## VDS-106 — Repository Structure

**Purpose:** Visual representation of the codebase organization and module relationships.

**File:** `docs/assets/diagrams/DIAGRAMS.md`

**Specifications:**
- ASCII tree diagrams
- Shows directory structure with annotations
- Highlights key files and their purposes
- Shows package relationships in monorepos

**Required diagrams:**
1. Top-level repository structure
2. Frontend source structure
3. Backend source structure
4. Shared packages structure
5. Feature module structure

**Current asset:** Complete repository structure diagrams with annotations.

---

## Asset Guidelines

### Image Requirements

| Property | Standard |
|----------|---------|
| Format | PNG (preferred), SVG, WebP |
| Resolution | 2x for Retina displays |
| Max file size | 2MB for screenshots, 5MB for hero |
| Naming | `feature-name-theme.png` (e.g., `dashboard-dark.png`) |
| Directory | `screens/product/` for app screenshots, `screens/vds/` for VDS assets, `assets/brand/` for brand assets, `assets/marketing/` for promotional content |

### Theme Variants

Provide both light and dark variants for:
- Dashboard views
- Feature pages
- Settings pages
- Analytics pages

### Naming Convention

```
screens/
├── product/
│   ├── {feature}-dark.png
│   └── {feature}-light.png
├── vds/
│   ├── vestara-command-center-hero-image.png    (VDS-101)
│   ├── vestara-command-center.png               (VDS-103)
│   └── vestara-ecosystem-architecture.png       (supplementary)
└── elite-companions/
    └── ...

assets/
├── brand/
│   ├── favicon.svg
│   └── logo.svg
├── marketing/
│   └── ... (promotional images)
└── media/
    └── ... (videos)
```

---

## Compliance Checklist

Every new Vestara repository must include:

- [ ] VDS-101: Hero banner image
- [ ] VDS-102: Architecture diagram in docs
- [ ] VDS-103: Platform domains visual
- [ ] VDS-104: Product tour with screenshots
- [ ] VDS-105: Technology stack documentation
- [ ] VDS-106: Repository structure diagram

### Review Process

1. New repositories must include all 6 assets before merge to `main`
2. Asset updates follow the same PR process as code changes
3. Screenshots must be updated when UI changes significantly
4. Architecture diagrams must be updated when system design changes
