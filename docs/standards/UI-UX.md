# UI/UX Standards

> Design principles and component conventions for the Vestara Command Center.

---

## Design Philosophy

> Complexity should exist inside the platform, not in the user experience.

Every interface decision is evaluated against:
1. Does it reduce operational complexity?
2. Can it scale across organizations?
3. Can AI enhance this workflow?
4. Will it remain maintainable five years from now?

---

## Visual Identity

### Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Gold (Primary) | `#D4AF37` | Primary actions, accents, highlights |
| Gold Light | `#F0D060` | Hover states, secondary accents |
| Gold Dark | `#B8960F` | Active states, emphasis |
| Dark Navy | `#0A0A1A` | Dark mode background |
| Dark Surface | `#12122A` | Dark mode cards/surfaces |
| Light White | `#FAFAFA` | Light mode background |
| Light Surface | `#FFFFFF` | Light mode cards/surfaces |

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Headings | Plus Jakarta Sans | Bold (700) | 24-32px |
| Subheadings | Plus Jakarta Sans | Semibold (600) | 18-20px |
| Body | Inter | Normal (400) | 14-16px |
| Captions | Inter | Normal (400) | 12px |
| Labels | Inter | Medium (500) | 12-14px |

### Spacing

Use Tailwind's spacing scale or MUI's `theme.spacing()`:

| Level | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing (icon gaps) |
| sm | 8px | Compact spacing (inline elements) |
| md | 16px | Standard spacing (card padding) |
| lg | 24px | Section spacing |
| xl | 32px | Page margins |

---

## Component Patterns

### Cards

- Use glassmorphism effect in dark mode (backdrop blur + transparency)
- Consistent padding: `16px` or `24px`
- Border radius: `12px` (default) or `16px` (featured)
- Subtle border: `1px solid rgba(255, 255, 255, 0.08)`

### Buttons

| Variant | Usage | Style |
|---------|-------|-------|
| Primary | Main actions (Submit, Create, Save) | Gold background, dark text |
| Secondary | Alternative actions (Cancel, Close) | Transparent with gold border |
| Ghost | Low-emphasis actions (Icons, toggles) | Transparent, gold hover |
| Danger | Destructive actions (Delete, Remove) | Red background |

### Forms

- Labels above inputs, not placeholders
- Error messages below inputs in red
- Helper text below inputs in muted color
- Required fields marked with asterisk (*)
- Consistent input height: `40px`

### Tables

- Sortable headers with clear indicator (▲/▼)
- Row hover with subtle background change
- Row selection via checkbox column
- Pagination at bottom with page size selector
- Empty states for no data, no search results

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| xs | 0-599px | Mobile: full-width, stacked layout, hamburger menu |
| sm | 600-899px | Tablet: sidebar collapsed, 2-column layouts |
| md | 900-1199px | Small desktop: sidebar expanded, standard layouts |
| lg | 1200px+ | Desktop: full layout, multi-column |

### Mobile First

- Design for mobile first, enhance for larger screens
- Touch targets minimum 44x44px
- No hover-dependent interactions on mobile
- Bottom navigation for key actions on mobile

### Sidebar

- **Mobile:** Full-width drawer (temporary)
- **Tablelet:** Collapsed (icons only, 64px)
- **Desktop:** Expanded (labels + icons, 280px)

---

## Accessibility

### Requirements

- All interactive elements must be keyboard accessible
- Focus visible indicators on all focusable elements
- Color contrast ratio ≥ 4.5:1 for text
- Color contrast ratio ≥ 3:1 for large text
- Alt text on all images
- ARIA labels on icon buttons
- Screen reader tested for key workflows

### MUI Compliance

Material UI components provide built-in accessibility. Ensure:
- Proper `aria-label` on icon-only buttons
- `role` attributes where needed
- `tabIndex` management for custom components
- Focus trap in modals and drawers

---

## Animation & Transitions

### Guidelines

- Use subtle transitions (200-300ms ease)
- Never animate for decoration — only for feedback
- Respect `prefers-reduced-motion`
- Use MUI's `Fade`, `Slide`, `Grow` for enter/exit

### Common Transitions

| Element | Property | Duration |
|---------|----------|----------|
| Buttons | background-color, transform | 150ms |
| Cards | box-shadow, transform | 200ms |
| Modals | opacity, transform | 250ms |
| Sidebar | width, transform | 300ms |
| Page transitions | opacity | 200ms |

---

## Dark Mode

### Implementation

- Toggle via `ThemeContext` (light/dark)
- Persisted to `localStorage`
- Synced with user profile preferences
- System preference detection (`prefers-color-scheme`)

### Dark Mode Specifics

- Background: `#0A0A1A` (deep navy)
- Surface: `#12122A` (slightly lighter)
- Cards: glassmorphism with backdrop blur
- Borders: `rgba(255, 255, 255, 0.08)`
- Text: `#E8E8F0` (primary), `#A0A0B8` (secondary)
- Gold accents remain consistent across modes

---

## Icons

- Use `lucide-react` for all icons
- Consistent size: 20px (default), 16px (compact), 24px (prominent)
- Consistent stroke width: 1.5px (default)
- Icon + label combinations preferred over icon-only
- Color follows text color unless emphasizing state

---

## Loading States

| State | Component | Usage |
|-------|-----------|-------|
| Page load | `PageLoading` (skeleton) | Full page skeleton |
| Content load | `ContentLoading` (skeleton) | Card/table skeleton |
| Button action | `ButtonLoading` (spinner) | Inside button |
| Inline | `Inline` (spinner) | Next to text |
| Overlay | `Overlay` (spinner + backdrop) | Blocking operations |

---

## Empty States

| Variant | When to Use |
|---------|------------|
| `NoData` | No data exists yet (first use) |
| `NoSearchResults` | Search/filter returned nothing |
| `EmptyFolder` | Folder has no files |
| `ErrorState` | Failed to load data |

All empty states should include:
- Icon or illustration
- Clear message explaining the state
- Call-to-action when applicable (e.g., "Create your first user")
