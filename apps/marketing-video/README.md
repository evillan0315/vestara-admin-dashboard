# Vestara Marketing Video

A **Remotion** (React/TypeScript) project that renders a **30-second ecosystem
overview ad** for Vestara, using the product's _dark luxury + metallic gold_
design language.

The ad sequences five beats with crossfades and a persistent brand bar:

| # | Beat | Frames | ~Time |
|---|------|--------|-------|
| 1 | Hook — "One platform. Every transaction." | 0–90 | 0–3s |
| 2 | Module grid — Wallet · Marketplace · Rewards · Bookings | 90–270 | 3–9s |
| 3 | AI Assistant spotlight (RAG + floating widget + connectors) | 270–450 | 9–15s |
| 4 | Admin Analytics spotlight (live dashboards, multi-tenant, exports) | 450–630 | 15–21s |
| 5 | Transition recap → CTA "Build. Trade. Earn. Grow." + early access | 630–900 | 21–30s |

Resolution: **1920×1080**, 30fps, 900 frames.

## Prerequisites

- Node.js >= 22
- pnpm >= 10

## Install

From the repo root (this app is a workspace member):

```bash
pnpm install
```

Or just for this app:

```bash
cd apps/marketing-video
pnpm install
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Open the Remotion Studio to preview/scrub the ad in the browser |
| `pnpm render` | Render the ad to `out/vestara-ad.mp4` (requires Chrome/Chromium) |
| `pnpm render:still` | Export a single PNG thumbnail (frame 120) to `out/vestara-thumbnail.png` |
| `pnpm typecheck` | TypeScript strict type-check (no emit) |

> Rendering needs a Chromium binary. Remotion downloads one automatically on
> first `render`; if you prefer a system browser, set `chromiumBinary` in
> `remotion.config.ts`.

## Customizing

- **Brand palette / fonts** → `src/theme.ts`
- **Animated primitives** (background, glass cards, gold text, logo) → `src/components/`
- **Scenes** → `src/scenes/` (Hook, Modules, FeatureSpotlight, CTA)
- **Sequencing / timing** → `src/VestaraEcosystemAd.tsx` (scene `from` frames + crossfade length)

## Project layout

```
apps/marketing-video/
├── package.json
├── tsconfig.json
├── build/                    # static bundle (index.html, bundle.js) for embedding
├── prompts/                  # external text-to-video prompts
│   └── vestara-cinematic-t2v.md   # HappyHorse-1.1-T2V cinematic command-center prompt
└── src/
    ├── index.tsx              # registers the Composition
    ├── theme.ts               # brand palette + fonts
    ├── VestaraEcosystemAd.tsx # main composition (scene sequencing)
    ├── components/
    │   ├── Background.tsx     # dark-luxury animated background
    │   ├── Glass.tsx          # GlassCard, GoldText, GoldDivider
    │   └── Logo.tsx           # VestaraLogo, ModuleBadge
    └── scenes/
        ├── SceneHook.tsx
        ├── SceneModules.tsx
        ├── FeatureSpotlight.tsx
        └── SceneCTA.tsx
```

This is a self-contained marketing deliverable and does not depend on the main
`apps/web` or `apps/api` runtimes.

## Cinematic T2V Prompt (external generation)

The in-repo Remotion project renders the 30s ecosystem overview locally. For a
fully cinematic "command center" cut, `prompts/vestara-cinematic-t2v.md`
contains a ready-to-use prompt optimized for the **HappyHorse-1.1-T2V**
text-to-video model. It mirrors the dark-luxury + metallic gold branding and
covers KPI counters, graph drawing, orbit shots, the Vestara "V" logo reveal,
and a full visual/camera/animation/lighting spec plus a negative prompt. Run it
through your T2V provider to produce the high-end commercial variant.
