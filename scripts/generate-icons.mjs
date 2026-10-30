/**
 * scripts/generate-icons.mjs
 * 
 * JobMatch AI — Complete Logo System & Icon Asset Generator
 * Generates:
 *  - Vector Brand SVGs:
 *      public/brand/logo-mark.svg
 *      public/brand/logo-full-light.svg
 *      public/brand/logo-full-dark.svg
 *      public/brand/logo-mono.svg
 *      public/brand/logo-stacked.svg
 *  - App Router Icons:
 *      app/icon.svg (dynamic light/dark media query)
 *      app/favicon.ico (16, 32, 48 multi-resolution ICO)
 *      app/icon.png (32x32 fallback)
 *      app/apple-icon.png (180x180 solid brand background)
 *  - PWA Web App Manifest Icons:
 *      public/icons/icon-192.png
 *      public/icons/icon-512.png
 *      public/icons/icon-512-maskable.png
 *  - Social Sharing OpenGraph Image:
 *      public/og-image.png (1200x630)
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import opentype from 'opentype.js';

const ROOT_DIR = process.cwd();
const PUBLIC_BRAND_DIR = path.join(ROOT_DIR, 'public', 'brand');
const PUBLIC_ICONS_DIR = path.join(ROOT_DIR, 'public', 'icons');
const APP_DIR = path.join(ROOT_DIR, 'app');

[PUBLIC_BRAND_DIR, PUBLIC_ICONS_DIR, APP_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Load font to outline "JobMatch" and "AI" vector paths
const fontFile = path.join(ROOT_DIR, 'scripts', 'Inter-SemiBold.woff2');
if (!fs.existsSync(fontFile)) {
  throw new Error(`Font file not found at ${fontFile}. Run font download first.`);
}

const fontBuf = fs.readFileSync(fontFile);
const arrayBuf = fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength);
const font = opentype.parse(arrayBuf);

function extractTextPath(text, xStart, yBaseline, fontSize) {
  const scale = (1 / font.unitsPerEm) * fontSize;
  let x = xStart;
  let pathData = '';
  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    const p = glyph.getPath(x, yBaseline, fontSize);
    pathData += p.toPathData(2) + ' ';
    let kerning = 0;
    if (i < text.length - 1) {
      const nextGlyph = font.charToGlyph(text[i + 1]);
      kerning = font.getKerningValue(glyph, nextGlyph) * scale;
    }
    x += (glyph.advanceWidth * scale) + kerning;
  }
  return { pathData: pathData.trim(), totalWidth: x - xStart };
}

// 1. Core Outlined Vectors
const wordmark = extractTextPath('JobMatch', 42, 23.5, 20);
const aiPillText = extractTextPath('AI', 152.1, 22.0, 10.5);

// Stacked wordmark & AI vectors
const stackedWordmark = extractTextPath('JobMatch', 12.8, 68, 18);
const stackedAiText = extractTextPath('AI', 111.4, 66.8, 9.5);

console.log('✓ Vector outlines calculated for JobMatch & AI');

// 2. Icon Mark SVGs
// Light theme mark
const svgMarkLight = `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Document Sheet -->
  <path d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z" fill="#E3EFEA" stroke="#0F5C4D" stroke-width="1.75" stroke-linejoin="round"/>
  <!-- Folded Corner Flap -->
  <path d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z" fill="#D1E7DF" stroke="#0F5C4D" stroke-width="1.75" stroke-linejoin="round"/>
  <!-- Resume text lines -->
  <line x1="9" y1="14" x2="17" y2="14" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
  <line x1="9" y1="18" x2="14.5" y2="18" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
  <line x1="9" y1="22" x2="12" y2="22" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
  <!-- Amber AI Spark Accent -->
  <path d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z" fill="#C8892B"/>
  <!-- ATS Pass Badge (Knockout Ring + Fill) -->
  <circle cx="22" cy="22" r="5.5" fill="#0F5C4D" stroke="#FAF8F4" stroke-width="2"/>
  <!-- Checkmark -->
  <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="#FFFFFF" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Dark theme mark
const svgMarkDark = `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Document Sheet -->
  <path d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z" fill="#16302A" stroke="#3FB596" stroke-width="1.75" stroke-linejoin="round"/>
  <!-- Folded Corner Flap -->
  <path d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z" fill="#1B3D35" stroke="#3FB596" stroke-width="1.75" stroke-linejoin="round"/>
  <!-- Resume text lines -->
  <line x1="9" y1="14" x2="17" y2="14" stroke="#3FB596" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
  <line x1="9" y1="18" x2="14.5" y2="18" stroke="#3FB596" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
  <line x1="9" y1="22" x2="12" y2="22" stroke="#3FB596" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
  <!-- Amber AI Spark Accent -->
  <path d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z" fill="#E0A84A"/>
  <!-- ATS Pass Badge (Knockout Ring + Fill) -->
  <circle cx="22" cy="22" r="5.5" fill="#3FB596" stroke="#0C100E" stroke-width="2"/>
  <!-- Checkmark -->
  <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="#0C100E" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Dynamic browser tab icon (prefers-color-scheme)
const svgAppIcon = `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    :root {
      --sheet-bg: #E3EFEA;
      --sheet-stroke: #0F5C4D;
      --flap-bg: #D1E7DF;
      --line-stroke: #0F5C4D;
      --badge-bg: #0F5C4D;
      --badge-ring: #FAF8F4;
      --check-stroke: #FFFFFF;
      --spark-fill: #C8892B;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --sheet-bg: #16302A;
        --sheet-stroke: #3FB596;
        --flap-bg: #1B3D35;
        --line-stroke: #3FB596;
        --badge-bg: #3FB596;
        --badge-ring: #0C100E;
        --check-stroke: #0C100E;
        --spark-fill: #E0A84A;
      }
    }
  </style>
  <path d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z" fill="var(--sheet-bg)" stroke="var(--sheet-stroke)" stroke-width="1.75" stroke-linejoin="round"/>
  <path d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z" fill="var(--flap-bg)" stroke="var(--sheet-stroke)" stroke-width="1.75" stroke-linejoin="round"/>
  <line x1="9" y1="14" x2="17" y2="14" stroke="var(--line-stroke)" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
  <line x1="9" y1="18" x2="14.5" y2="18" stroke="var(--line-stroke)" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
  <line x1="9" y1="22" x2="12" y2="22" stroke="var(--line-stroke)" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
  <path d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z" fill="var(--spark-fill)"/>
  <circle cx="22" cy="22" r="5.5" fill="var(--badge-bg)" stroke="var(--badge-ring)" stroke-width="2"/>
  <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="var(--check-stroke)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Monochrome mark
const svgMarkMono = `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
  <path d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
  <line x1="9" y1="14" x2="17" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
  <line x1="9" y1="18" x2="14.5" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
  <line x1="9" y1="22" x2="12" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
  <path d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z" fill="currentColor"/>
  <circle cx="22" cy="22" r="5.5" fill="currentColor" stroke="var(--bg, #FAF8F4)" stroke-width="2"/>
  <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="var(--bg, #FAF8F4)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// 3. Full Horizontal Logo (Light)
const svgFullLight = `<svg viewBox="0 0 172 36" width="172" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Mark translated to (2, 2) -->
  <g transform="translate(2, 2)">
    <path d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z" fill="#E3EFEA" stroke="#0F5C4D" stroke-width="1.75" stroke-linejoin="round"/>
    <path d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z" fill="#D1E7DF" stroke="#0F5C4D" stroke-width="1.75" stroke-linejoin="round"/>
    <line x1="9" y1="14" x2="17" y2="14" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
    <line x1="9" y1="18" x2="14.5" y2="18" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
    <line x1="9" y1="22" x2="12" y2="22" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
    <path d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z" fill="#C8892B"/>
    <circle cx="22" cy="22" r="5.5" fill="#0F5C4D" stroke="#FAF8F4" stroke-width="2"/>
    <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="#FFFFFF" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Wordmark 'JobMatch' in Inter SemiBold -->
  <path d="${wordmark.pathData}" fill="#14181F"/>

  <!-- AI Pill Badge -->
  <rect x="145.5" y="9.5" width="23.5" height="17" rx="8.5" fill="#E3EFEA" stroke="#0F5C4D" stroke-opacity="0.25" stroke-width="1"/>
  <!-- Outlined 'AI' in Inter Bold -->
  <path d="${aiPillText.pathData}" fill="#0F5C4D"/>
</svg>`;

// 4. Full Horizontal Logo (Dark)
const svgFullDark = `<svg viewBox="0 0 172 36" width="172" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Mark translated to (2, 2) -->
  <g transform="translate(2, 2)">
    <path d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z" fill="#16302A" stroke="#3FB596" stroke-width="1.75" stroke-linejoin="round"/>
    <path d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z" fill="#1B3D35" stroke="#3FB596" stroke-width="1.75" stroke-linejoin="round"/>
    <line x1="9" y1="14" x2="17" y2="14" stroke="#3FB596" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
    <line x1="9" y1="18" x2="14.5" y2="18" stroke="#3FB596" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
    <line x1="9" y1="22" x2="12" y2="22" stroke="#3FB596" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
    <path d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z" fill="#E0A84A"/>
    <circle cx="22" cy="22" r="5.5" fill="#3FB596" stroke="#0C100E" stroke-width="2"/>
    <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="#0C100E" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Wordmark 'JobMatch' in Inter SemiBold (Cream) -->
  <path d="${wordmark.pathData}" fill="#EDEBE5"/>

  <!-- AI Pill Badge -->
  <rect x="145.5" y="9.5" width="23.5" height="17" rx="8.5" fill="#16302A" stroke="#3FB596" stroke-opacity="0.3" stroke-width="1"/>
  <!-- Outlined 'AI' in Radiant Jade -->
  <path d="${aiPillText.pathData}" fill="#3FB596"/>
</svg>`;

// 5. Full Monochrome Logo
const svgFullMono = `<svg viewBox="0 0 172 36" width="172" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(2, 2)">
    <path d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
    <path d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
    <line x1="9" y1="14" x2="17" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
    <line x1="9" y1="18" x2="14.5" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
    <line x1="9" y1="22" x2="12" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
    <path d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z" fill="currentColor"/>
    <circle cx="22" cy="22" r="5.5" fill="currentColor" stroke="var(--bg, #FAF8F4)" stroke-width="2"/>
    <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="var(--bg, #FAF8F4)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <path d="${wordmark.pathData}" fill="currentColor"/>
  <rect x="145.5" y="9.5" width="23.5" height="17" rx="8.5" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-opacity="0.25" stroke-width="1"/>
  <path d="${aiPillText.pathData}" fill="currentColor"/>
</svg>`;

// 6. Stacked Logo
const svgStacked = `<svg viewBox="0 0 140 84" width="140" height="84" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Centered Mark 36x36 (scale 1.125, translate to center x=52, y=6) -->
  <g transform="translate(52, 6) scale(1.125)">
    <path d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z" fill="#E3EFEA" stroke="#0F5C4D" stroke-width="1.75" stroke-linejoin="round"/>
    <path d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z" fill="#D1E7DF" stroke="#0F5C4D" stroke-width="1.75" stroke-linejoin="round"/>
    <line x1="9" y1="14" x2="17" y2="14" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
    <line x1="9" y1="18" x2="14.5" y2="18" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
    <line x1="9" y1="22" x2="12" y2="22" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
    <path d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z" fill="#C8892B"/>
    <circle cx="22" cy="22" r="5.5" fill="#0F5C4D" stroke="#FAF8F4" stroke-width="2"/>
    <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="#FFFFFF" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- Stacked Wordmark -->
  <path d="${stackedWordmark.pathData}" fill="#14181F"/>
  <rect x="105.5" y="55.5" width="21" height="15.5" rx="7.75" fill="#E3EFEA" stroke="#0F5C4D" stroke-opacity="0.25" stroke-width="1"/>
  <path d="${stackedAiText.pathData}" fill="#0F5C4D"/>
</svg>`;

// Write all SVG files
fs.writeFileSync(path.join(PUBLIC_BRAND_DIR, 'logo-mark.svg'), svgMarkLight);
fs.writeFileSync(path.join(PUBLIC_BRAND_DIR, 'logo-full-light.svg'), svgFullLight);
fs.writeFileSync(path.join(PUBLIC_BRAND_DIR, 'logo-full-dark.svg'), svgFullDark);
fs.writeFileSync(path.join(PUBLIC_BRAND_DIR, 'logo-mono.svg'), svgFullMono);
fs.writeFileSync(path.join(PUBLIC_BRAND_DIR, 'logo-stacked.svg'), svgStacked);
fs.writeFileSync(path.join(APP_DIR, 'icon.svg'), svgAppIcon);
fs.writeFileSync(path.join(PUBLIC_ICONS_DIR, 'logo.svg'), svgMarkLight);

console.log('✓ All 6 SVG vector master files generated.');

// 7. Generate Rasters using Sharp
async function generateRasters() {
  const markSvgBuf = Buffer.from(svgMarkLight);
  const markDarkBuf = Buffer.from(svgMarkDark);

  // app/icon.png (32x32)
  await sharp(markSvgBuf).resize(32, 32).png().toFile(path.join(APP_DIR, 'icon.png'));
  console.log('✓ app/icon.png (32x32)');

  // app/apple-icon.png (180x180, solid brand #0F5C4D background)
  const appleSvg = `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
    <rect width="180" height="180" fill="#0F5C4D"/>
    <g transform="translate(36, 36) scale(3.375)">
      <!-- Document Sheet with crisp contrasting stroke & white fill -->
      <path d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z" fill="#FFFFFF" stroke="#FAF8F4" stroke-width="1.75" stroke-linejoin="round"/>
      <path d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z" fill="#E3EFEA" stroke="#FAF8F4" stroke-width="1.75" stroke-linejoin="round"/>
      <line x1="9" y1="14" x2="17" y2="14" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
      <line x1="9" y1="18" x2="14.5" y2="18" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
      <line x1="9" y1="22" x2="12" y2="22" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
      <path d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z" fill="#E0A84A"/>
      <circle cx="22" cy="22" r="5.5" fill="#3FB596" stroke="#0F5C4D" stroke-width="2"/>
      <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="#0F5C4D" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`;
  await sharp(Buffer.from(appleSvg)).resize(180, 180).png().toFile(path.join(APP_DIR, 'apple-icon.png'));
  console.log('✓ app/apple-icon.png (180x180)');

  // PWA manifest icons
  // 192x192
  await sharp(Buffer.from(appleSvg)).resize(192, 192).png().toFile(path.join(PUBLIC_ICONS_DIR, 'icon-192.png'));
  console.log('✓ public/icons/icon-192.png (192x192)');

  // 512x512
  await sharp(Buffer.from(appleSvg)).resize(512, 512).png().toFile(path.join(PUBLIC_ICONS_DIR, 'icon-512.png'));
  console.log('✓ public/icons/icon-512.png (512x512)');

  // 512x512 maskable (with 15% safe zone margin padding for round/squircle launcher cuts)
  const maskableSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#0F5C4D"/>
    <!-- Centered mark with safe padding (scale ~9.6, translated to center) -->
    <g transform="translate(102.4, 102.4) scale(9.6)">
      <path d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z" fill="#FFFFFF" stroke="#FAF8F4" stroke-width="1.75" stroke-linejoin="round"/>
      <path d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z" fill="#E3EFEA" stroke="#FAF8F4" stroke-width="1.75" stroke-linejoin="round"/>
      <line x1="9" y1="14" x2="17" y2="14" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
      <line x1="9" y1="18" x2="14.5" y2="18" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
      <line x1="9" y1="22" x2="12" y2="22" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
      <path d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z" fill="#E0A84A"/>
      <circle cx="22" cy="22" r="5.5" fill="#3FB596" stroke="#0F5C4D" stroke-width="2"/>
      <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="#0F5C4D" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`;
  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(PUBLIC_ICONS_DIR, 'icon-512-maskable.png'));
  console.log('✓ public/icons/icon-512-maskable.png (512x512 maskable)');

  // 8. Generate multi-resolution favicon.ico (16, 32, 48)
  const p16 = await sharp(markSvgBuf).resize(16, 16).png().toBuffer();
  const p32 = await sharp(markSvgBuf).resize(32, 32).png().toBuffer();
  const p48 = await sharp(markSvgBuf).resize(48, 48).png().toBuffer();

  const icoBuf = await pngToIco([p16, p32, p48]);
  fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), icoBuf);
  fs.writeFileSync(path.join(ROOT_DIR, 'public', 'favicon.ico'), icoBuf);
  await sharp(p32).toFile(path.join(ROOT_DIR, 'public', 'favicon-32x32.png'));
  await sharp(p16).toFile(path.join(ROOT_DIR, 'public', 'favicon-16x16.png'));
  console.log('✓ app/favicon.ico & public/favicon.ico (16x16, 32x32, 48x48 multi-res)');

  // 9. Generate OpenGraph Image (1200x630)
  const ogSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FAF8F4"/>
        <stop offset="100%" stop-color="#F3EFE8"/>
      </linearGradient>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="100%" stop-color="#FAF8F5"/>
      </linearGradient>
      <filter id="cardShadow" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#14181F" flood-opacity="0.08"/>
      </filter>
    </defs>

    <!-- Canvas Background -->
    <rect width="1200" height="630" fill="url(#bgGrad)"/>

    <!-- Subtle Decorative Background Grid Lines -->
    <line x1="80" y1="0" x2="80" y2="630" stroke="#E4DFD5" stroke-width="1" stroke-dasharray="4 8" stroke-opacity="0.7"/>
    <line x1="1120" y1="0" x2="1120" y2="630" stroke="#E4DFD5" stroke-width="1" stroke-dasharray="4 8" stroke-opacity="0.7"/>
    <line x1="0" y1="80" x2="1200" y2="80" stroke="#E4DFD5" stroke-width="1" stroke-dasharray="4 8" stroke-opacity="0.7"/>
    <line x1="0" y1="550" x2="1200" y2="550" stroke="#E4DFD5" stroke-width="1" stroke-dasharray="4 8" stroke-opacity="0.7"/>

    <!-- Left Brand Column: Logo, Tagline, Value Props -->
    <g transform="translate(100, 110)">
      <!-- Scaled Full Logo (scale: 2.2) -->
      <g transform="scale(2.2)">
        <g transform="translate(2, 2)">
          <path d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z" fill="#E3EFEA" stroke="#0F5C4D" stroke-width="1.75" stroke-linejoin="round"/>
          <path d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z" fill="#D1E7DF" stroke="#0F5C4D" stroke-width="1.75" stroke-linejoin="round"/>
          <line x1="9" y1="14" x2="17" y2="14" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
          <line x1="9" y1="18" x2="14.5" y2="18" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
          <line x1="9" y1="22" x2="12" y2="22" stroke="#0F5C4D" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>
          <path d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z" fill="#C8892B"/>
          <circle cx="22" cy="22" r="5.5" fill="#0F5C4D" stroke="#FAF8F4" stroke-width="2"/>
          <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="#FFFFFF" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <path d="${wordmark.pathData}" fill="#14181F"/>
        <rect x="145.5" y="9.5" width="23.5" height="17" rx="8.5" fill="#E3EFEA" stroke="#0F5C4D" stroke-opacity="0.25" stroke-width="1"/>
        <path d="${aiPillText.pathData}" fill="#0F5C4D"/>
      </g>

      <!-- Headline -->
      <text x="0" y="145" font-family="'Newsreader', Georgia, serif" font-size="38" font-weight="600" fill="#14181F" letter-spacing="-0.02em">
        A Resume That Gets Read.
      </text>
      <text x="0" y="195" font-family="'Newsreader', Georgia, serif" font-size="38" font-weight="600" fill="#0F5C4D" letter-spacing="-0.02em">
        Built for ATS Pass Rates.
      </text>

      <!-- Subtitle -->
      <text x="0" y="248" font-family="'Inter', sans-serif" font-size="18" font-weight="400" fill="#4A5160">
        In-browser ATS diagnostic scanner, editorial CV builder,
      </text>
      <text x="0" y="276" font-family="'Inter', sans-serif" font-size="18" font-weight="400" fill="#4A5160">
        and tailored cover letters in 6 languages.
      </text>

      <!-- Feature Pill Badges -->
      <g transform="translate(0, 325)">
        <!-- Pill 1 -->
        <rect x="0" y="0" width="145" height="34" rx="17" fill="#E3EFEA" stroke="#0F5C4D" stroke-opacity="0.3"/>
        <text x="72.5" y="22" font-family="'Inter', sans-serif" font-size="13" font-weight="600" fill="#0F5C4D" text-anchor="middle">✓ 98% ATS Pass</text>

        <!-- Pill 2 -->
        <rect x="160" y="0" width="165" height="34" rx="17" fill="#FAF8F4" stroke="#8E887C" stroke-opacity="0.4"/>
        <text x="242.5" y="22" font-family="'Inter', sans-serif" font-size="13" font-weight="500" fill="#14181F" text-anchor="middle">Arabic RTL Native</text>

        <!-- Pill 3 -->
        <rect x="340" y="0" width="155" height="34" rx="17" fill="#FEF3C7" stroke="#C8892B" stroke-opacity="0.4"/>
        <text x="417.5" y="22" font-family="'Inter', sans-serif" font-size="13" font-weight="600" fill="#C8892B" text-anchor="middle">★ Instant Match</text>
      </g>
    </g>

    <!-- Right Column: Subtle Editorial Resume Card Illustration -->
    <g transform="translate(760, 95)" filter="url(#cardShadow)">
      <!-- Main Resume Sheet Card -->
      <rect width="360" height="460" rx="12" fill="url(#cardGrad)" stroke="#E4DFD5" stroke-width="1.5"/>

      <!-- Header Accent Stripe -->
      <rect x="0" y="0" width="360" height="8" rx="4" fill="#0F5C4D"/>

      <!-- Score Ring Indicator -->
      <g transform="translate(280, 45)">
        <circle cx="28" cy="28" r="24" fill="#E3EFEA"/>
        <circle cx="28" cy="28" r="22" fill="none" stroke="#0F5C4D" stroke-width="4" stroke-dasharray="125 15"/>
        <text x="28" y="34" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="700" fill="#0F5C4D" text-anchor="middle">98</text>
      </g>

      <!-- Resume Header -->
      <rect x="30" y="38" width="130" height="14" rx="3" fill="#14181F"/>
      <rect x="30" y="58" width="90" height="8" rx="2" fill="#4A5160" fill-opacity="0.6"/>
      <rect x="30" y="74" width="180" height="6" rx="2" fill="#8E887C" fill-opacity="0.5"/>

      <!-- Section Divider -->
      <line x1="30" y1="96" x2="330" y2="96" stroke="#E4DFD5" stroke-width="1"/>

      <!-- Experience Block 1 -->
      <rect x="30" y="112" width="80" height="10" rx="2" fill="#0F5C4D"/>
      <rect x="30" y="130" width="160" height="8" rx="2" fill="#14181F" fill-opacity="0.8"/>
      <rect x="30" y="146" width="300" height="6" rx="2" fill="#8E887C" fill-opacity="0.5"/>
      <rect x="30" y="158" width="270" height="6" rx="2" fill="#8E887C" fill-opacity="0.5"/>
      <rect x="30" y="170" width="220" height="6" rx="2" fill="#8E887C" fill-opacity="0.5"/>

      <!-- Experience Block 2 -->
      <rect x="30" y="196" width="140" height="8" rx="2" fill="#14181F" fill-opacity="0.8"/>
      <rect x="30" y="212" width="300" height="6" rx="2" fill="#8E887C" fill-opacity="0.5"/>
      <rect x="30" y="224" width="280" height="6" rx="2" fill="#8E887C" fill-opacity="0.5"/>

      <!-- Skills Section -->
      <line x1="30" y1="246" x2="330" y2="246" stroke="#E4DFD5" stroke-width="1"/>
      <rect x="30" y="260" width="60" height="10" rx="2" fill="#0F5C4D"/>
      <g transform="translate(30, 282)">
        <rect x="0" y="0" width="68" height="20" rx="4" fill="#E3EFEA"/>
        <text x="34" y="14" font-family="'Inter', sans-serif" font-size="9" font-weight="600" fill="#0F5C4D" text-anchor="middle">TypeScript</text>

        <rect x="76" y="0" width="56" height="20" rx="4" fill="#E3EFEA"/>
        <text x="104" y="14" font-family="'Inter', sans-serif" font-size="9" font-weight="600" fill="#0F5C4D" text-anchor="middle">Next.js</text>

        <rect x="140" y="0" width="56" height="20" rx="4" fill="#E3EFEA"/>
        <text x="168" y="14" font-family="'Inter', sans-serif" font-size="9" font-weight="600" fill="#0F5C4D" text-anchor="middle">Node.js</text>

        <rect x="204" y="0" width="62" height="20" rx="4" fill="#E3EFEA"/>
        <text x="235" y="14" font-family="'Inter', sans-serif" font-size="9" font-weight="600" fill="#0F5C4D" text-anchor="middle">Python</text>
      </g>

      <!-- Verified ATS Badge floating at bottom of card -->
      <g transform="translate(18, 355)">
        <rect width="324" height="75" rx="8" fill="#FAF8F4" stroke="#0F5C4D" stroke-width="1.5"/>
        <circle cx="32" cy="38" r="15" fill="#0F5C4D"/>
        <path d="M 26 38 L 30 42 L 38 34" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <text x="56" y="32" font-family="'Inter', sans-serif" font-size="13" font-weight="700" fill="#0F5C4D">100% Parser Compatible</text>
        <text x="56" y="52" font-family="'Inter', sans-serif" font-size="10" font-weight="400" fill="#4A5160">Semantic single-column format</text>
      </g>
    </g>
  </svg>`;

  await sharp(Buffer.from(ogSvg)).resize(1200, 630).png().toFile(path.join(ROOT_DIR, 'public', 'og-image.png'));
  console.log('✓ public/og-image.png (1200x630)');

  console.log('\n======================================================');
  console.log('🎉 ALL BRAND ASSETS & ICONS GENERATED SUCCESSFULLY!');
  console.log('======================================================\n');
}

generateRasters().catch((err) => {
  console.error('Fatal error generating icons:', err);
  process.exit(1);
});
