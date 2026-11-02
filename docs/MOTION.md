# Motion & Scroll Animation Guidelines (`docs/MOTION.md`)

This document defines the unified motion architecture for **JobMatch AI**, separating scroll-triggered reveals (**AOS**) from interactive micro-interactions (**CSS / `tw-animate-css`**).

---

## 1. Core Architecture: AOS + `<Reveal>`

We use **AOS (Animate On Scroll v2.3.x)** as the primary scroll-reveal engine, initialized once at the root client provider level.

### `components/motion/AosProvider.tsx`
- Mounted once inside `app/components/ClientProviders.tsx`.
- Initializes AOS in a single `useEffect`:
  ```ts
  AOS.init({
    duration: 700,
    easing: 'ease-out-cubic',
    once: true,
    offset: 80,
    disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
  ```
- Adds `html.js-aos` only when JS is active and `prefers-reduced-motion` is not enabled, ensuring progressive enhancement (content never stays hidden if JS is delayed or disabled).
- Calls `AOS.refresh()` automatically when:
  - The route changes (`usePathname()`)
  - The active language or document direction (`dir="ltr" | "rtl"`) changes after hydration.

---

## 2. RTL-Safe Wrapper: `<Reveal>` & `<Stagger>`

**Rule:** Never write `data-aos="..."` directly in pages or feature components. Always use `<Reveal>` or `<Stagger>` from `@/components/motion/Reveal`.

### `<Reveal>` Props (`components/motion/Reveal.tsx`)
- `from`: `'up' | 'down' | 'start' | 'end' | 'zoom' | 'fade'` (default: `'up'`)
  - `up` → `data-aos="fade-up"`
  - `down` → `data-aos="fade-down"`
  - `start` → logical inline-start (`fade-right` in LTR, automatically flipped to `fade-left` in RTL)
  - `end` → logical inline-end (`fade-left` in LTR, automatically flipped to `fade-right` in RTL)
  - `zoom` → `data-aos="zoom-in"`
  - `fade` → `data-aos="fade"`
- `delay`: delay in milliseconds (`0` to `400ms` max)
- `duration`: duration in milliseconds (defaults to AOS global `700ms`)
- `stagger`: optional item index (`number`, where `delay = Math.min(index * 80, 400)`) or `boolean` (`true` to wrap direct children with incremental `80ms` stagger capped at `400ms`).

### `<Stagger>` List Wrapper
For grids and lists (Pricing cards, `/jobs` results, Dashboard KPI/item cards, Template selectors, About pillars, Contact cards):
- Increments each child's delay by `index * 80ms` up to a maximum cap of `400ms` (`Math.min(baseDelay + index * 80, 400)`).

---

## 3. Layout Safety & LCP Performance Rules

1. **No `data-aos` on `position: fixed` or `backdrop-filter` parents with fixed children:**
   - AOS applies CSS `transform`, which creates a new stacking context and breaks `position: fixed` descendants (such as mobile drawers inside `Navbar`). Never wrap `Navbar`, fixed toolbars, or modals in `<Reveal>`.
2. **Above-the-Fold LCP Protection:**
   - Do **not** put AOS on critical above-the-fold LCP elements (such as the primary `<h1>` headline, subheadline, and primary CTA buttons in `HeroSection`).
   - Use lightweight CSS entrance utility `.hero-lcp-enter` (with `.hero-lcp-delay-100` / `.hero-lcp-delay-200`) so LCP paints immediately on SSR without waiting for JS hydration.
3. **Zero Horizontal Scroll (`overflow-x-clip`):**
   - All sections using horizontal or vertical reveals must include `overflow-x-clip` to prevent horizontal scrollbar flicker during `fade-left` / `fade-right` transitions.
4. **Separation of Concerns (No Double Animation):**
   - **AOS (`<Reveal>` / `<Stagger>`)**: Used **exclusively** for scroll-triggered entrance animations.
   - **CSS & `tw-animate-css` (`.btn`, `.card-interactive`, `.modal-card-enter`)**: Used for micro-interactions (`hover`, `active` press scale, focus rings, modal/drawer transitions). Never combine two entrance animations on the same node.
5. **Accessibility (`prefers-reduced-motion: reduce`) & Progressive Enhancement:**
   - When `prefers-reduced-motion: reduce` is enabled, `AOS.init({ disable: ... })` disables AOS and `app/globals.css` forces `opacity: 1 !important; transform: none !important; transition: none !important;`.
   - Before JS initializes (`html:not(.js-aos) [data-aos]`), elements remain `opacity: 1` so slow networks or bots never see blank content.

