# JobMatch AI — Brand Assets & Icon System

This document outlines the official brand identity, logo system, and asset architecture for **JobMatch AI**, built in accordance with [`BRAND_IDENTITY.md`](./BRAND_IDENTITY.md).

---

## 1. Brand Tokens & Identity Palette

| Token | Light Theme | Dark Theme | Purpose / Usage |
|---|---|---|---|
| `--brand` | `#0F5C4D` (Deep Pine Jade) | `#3FB596` (Radiant Jade) | Primary actions, ATS pass badge, logo strokes, key emphasis |
| `--brand-soft` | `#E3EFEA` (Pale Mint Wash) | `#16302A` (Muted Pine Dark) | AI pill badge background, resume sheet background wash |
| `--brand-subtle` | `#D1E7DF` | `#1B3D35` | Folded document flap fill |
| `--highlight` | `#C8892B` (Warm Amber) | `#E0A84A` (Luminous Amber) | AI spark/quill-tip dot at top fold corner |
| `--bg` / `--paper` | `#FAF8F4` (Paper) | `#0C100E` (Obsidian) | Canvas background, knockout badge ring |
| `--text-primary` | `#14181F` (Charcoal Ink) | `#EDEBE5` (Warm Alabaster) | Wordmark "JobMatch" text paths |
| `--on-brand` | `#FFFFFF` | `#08110E` / `#FFFFFF` | ATS pass checkmark inside badge |

---

## 2. Logo Concept & Vector Geometry

### Icon Mark Concept
- **Geometry**: Built on an integer **32×32 grid** with consistent stroke width (**1.75px** at 32px) and rounded joins.
- **Document Sheet**: Portrait orientation with rounded corners (`rx=2.5`) and a folded top-right corner.
- **Content Lines**: 3 horizontal text lines (`y=14`, `y=18`, `y=22`) suggesting candidate credentials.
- **ATS Pass Badge**: Circular emblem (`cx=22`, `cy=22`, `r=5.5`) overlapping the lower-right corner with a knockout border ring and bold checkmark.
- **Smart AI Spark**: A 4-pointed amber star accent at `(24.5, 3.5)` indicating AI writing intelligence.
- **Monochrome Support**: Full single-color mode leveraging `currentColor` with precise opacity levels (`0.12` sheet, `0.22` flap).

### Wordmark & AI Pill
- **Font**: Inter SemiBold for "JobMatch", Inter Bold small caps for "AI".
- **Zero-Shift Vector Outlines**: All characters in the vector SVGs are pre-compiled into `<path>` data using `opentype.js`. This guarantees identical rendering across every device, operating system, PDF export, and browser without font-loading latency or Cumulative Layout Shift (CLS).
- **RTL Integrity**: In Arabic and other RTL pages, the logo preserves left-to-right orientation (`dir="ltr"`) because brand marks do not flip; only layout alignment flips.

---

## 3. Complete Inventory of Generated Assets

All assets are generated deterministically via `npm run icons` (`scripts/generate-icons.mjs`):

| File Path | Dimensions | Size | Format | Usage / Target Location |
|---|---|---|---|---|
| `public/brand/logo-full-light.svg` | 172×36 (Vector) | 6.7 KB | SVG | Horizontal full logo on light backgrounds (Navbar, Marketing) |
| `public/brand/logo-full-dark.svg` | 172×36 (Vector) | 6.7 KB | SVG | Horizontal full logo on dark backgrounds (Dark mode, Hero) |
| `public/brand/logo-mark.svg` | 32×32 (Vector) | 1.3 KB | SVG | Standalone icon mark (Avatars, Favicon, Badges) |
| `public/brand/logo-mono.svg` | 172×36 (Vector) | 6.6 KB | SVG | Monochrome version using `currentColor` (Print, Invoices, PDFs) |
| `public/brand/logo-stacked.svg` | 140×84 (Vector) | 6.5 KB | SVG | Centered mark above wordmark (Splash screens, Auth modals) |
| `app/icon.svg` | 32×32 (Vector) | 1.8 KB | SVG | Next.js browser tab icon with `@media (prefers-color-scheme: dark)` |
| `app/icon.png` | 32×32 | 839 B | PNG | High-DPI browser tab icon fallback |
| `app/favicon.ico` | 16, 32, 48 | 14.7 KB | ICO | Multi-resolution legacy Windows/browser favicon |
| `public/favicon.ico` | 16, 32, 48 | 14.7 KB | ICO | Direct public root favicon fallback |
| `public/favicon-32x32.png` | 32×32 | 839 B | PNG | 32px tab favicon |
| `public/favicon-16x16.png` | 16×16 | 473 B | PNG | 16px bookmark & crisp tab icon |
| `app/apple-icon.png` | 180×180 | 3.3 KB | PNG | Apple Touch Icon (solid `#0F5C4D` background, no transparency) |
| `public/icons/icon-192.png` | 192×192 | 3.6 KB | PNG | PWA Android home screen launcher icon |
| `public/icons/icon-512.png` | 512×512 | 13.7 KB | PNG | PWA splash screen & high-resolution app icon |
| `public/icons/icon-512-maskable.png` | 512×512 | 13.7 KB | PNG | PWA maskable icon with 15% safe padding |
| `public/icons/logo.svg` | 32×32 (Vector) | 1.3 KB | SVG | Legacy icon path mirror |
| `public/og-image.png` | 1200×630 | 91.7 KB | PNG | Open Graph & Twitter Social Card (Editorial resume layout) |
| `components/brand/Logo.tsx` | Component | 22.8 KB | TSX | Core responsive Logo component |
| `components/brand/LogoMark.tsx` | Component | 4.7 KB | TSX | Standalone 32×32 vector mark component |
| `app/manifest.ts` | Config | 755 B | TS | Web App Manifest configuration for PWA |

---

## 4. React Components Guide

### `LogoMark`
```tsx
import LogoMark from '@/components/brand/LogoMark';

// Standard adaptive brand mark
<LogoMark size={32} />

// Predefined sizes: 'sm' (20px), 'md' (28px), 'lg' (36px), 'xl' (48px)
<LogoMark size="md" />

// Monochrome context (inherits text color)
<div className="text-white">
  <LogoMark size={24} monochrome />
</div>
```

### `Logo`
```tsx
import Logo from '@/components/brand/Logo';

// Full horizontal logo with root link (default)
<Logo size="md" />

// Mark-only variant
<Logo variant="mark" size="sm" />

// Stacked variant for splash or auth card headers
<Logo variant="stacked" size="lg" />

// Monochrome in white or dark headers
<Logo variant="full" monochrome className="text-white" />

// Custom navigation link or button trigger
<Logo withLink={false} onClick={() => console.log('Clicked')} />
```

---

## 5. Regeneration Workflow

To regenerate all brand SVGs, multi-resolution ICOs, Apple touch icons, PWA icons, and the 1200×630 OpenGraph card at any time, run:

```bash
npm run icons
```

Script source: [`scripts/generate-icons.mjs`](../scripts/generate-icons.mjs).
