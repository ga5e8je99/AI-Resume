# Screenshots & Visual Asset Guidance

This directory contains the product showcase screenshots and visual artifacts for **JobMatch AI**.

## 📸 Required Screenshot Manifest

Capture all screenshots in **Dark Mode** (`class="dark"` on `<html>`, default system theme) using a Chromium-based browser at device scale factor `1x` or `2x`.

| Filename | Page Route | Viewport | Language | Key Elements to Showcase |
|---|---|:---:|:---:|---|
| `01-landing.png` | `/` | 1440 × 900 | English (`en`) | Hero section with gradient typography, primary CTA ("Try Demo Instantly"), live client-side PDF dropzone, and 3-step feature cards. |
| `02-dashboard.png` | `/dashboard` | 1440 × 900 | English (`en`) | Pre-seeded user dashboard, ATS score summary card (88 / Strong Match), document management cards, and "Create New Resume" action. |
| `03-ats-result.png` | `/review` | 1440 × 900 | English (`en`) | Diagnostic audit report with animated score gauge, sub-scores (Keywords, Formatting, Structure, Content), and missing keyword tags. |
| `04-builder.png` | `/builder` | 1440 × 900 | English (`en`) | Split-view workspace: 13-section form editor on left, real-time live preview on right, theme customizer bar (colors, typography), and export toolbar. |
| `05-cover-letter.png` | `/cover-letter` | 1440 × 900 | English (`en`) | AI Cover Letter studio: job description input, tone selector (Formal / Technical / Leadership / Enthusiastic), streaming skeleton state, and editable rich text output. |
| `06-arabic-version.png` | `/dashboard` or `/builder` | 1440 × 900 | Arabic (`ar`) | Highlighting native RTL layout (`dir="rtl"`), IBM Plex Sans Arabic typography, mirrored icons, and localized terminology. |
| `07-mobile-experience.png` | `/builder` or `/` | 390 × 844 | English (`en`) | Responsive mobile experience showing single-column layout, bottom sticky export bar, touch-friendly buttons, and zero horizontal scroll. |

---

## 🛠️ Capture Instructions

1. **Start the local server:**
   ```bash
   npm run dev
   ```

2. **Authenticate with Demo Data:**
   - Navigate to `http://localhost:3000/login`
   - Click **"⚡ Try Demo Instantly"** (`⚡ جرّب النظام فوراً`) to populate sample resumes and ATS reports.

3. **Capture Viewports:**
   - **Desktop Screenshots (01 to 06):** Set browser viewport to `1440px × 900px` (or `1920px × 1080px`).
   - **Mobile Screenshot (07):** Open Chrome DevTools (`F12`), toggle Device Toolbar (`Ctrl+Shift+M`), select **iPhone 14 / Pixel 7** (`390px × 844px` or `360px × 800px`).

4. **File Optimization:**
   - Save directly as PNG or WebP in this directory (`docs/screenshots/`).
   - Keep individual image sizes under 500 KB (using tools like `pngquant` or TinyPNG if needed).
