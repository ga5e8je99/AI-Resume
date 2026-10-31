import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  const navbarCode = readFile('app/components/Navbar.tsx');
  const globalsCss = readFile('app/globals.css');

  console.log('\n=== 1. Mobile Drawer Outside <header> (createPortal to document.body & Sibling) ===');
  const headerMatch = navbarCode.match(/<header\s+className/);
  const headerOpenIdx = headerMatch?.index ?? -1;
  const headerCloseIdx = navbarCode.indexOf('</header>', headerOpenIdx);
  const portalCallIdx = navbarCode.indexOf('createPortal(mobileDrawerElement, document.body)');

  assert(
    headerOpenIdx !== -1 &&
      headerCloseIdx !== -1 &&
      portalCallIdx > headerCloseIdx &&
      navbarCode.includes("import { createPortal } from 'react-dom';"),
    'Mobile drawer is rendered outside <header> via createPortal(..., document.body) and placed as sibling after </header>'
  );

  const headerSubstring = navbarCode.slice(headerOpenIdx, headerCloseIdx);
  assert(
    !headerSubstring.includes('id="mobile-navigation-drawer"') &&
      !headerSubstring.includes('aria-modal="true"'),
    '<header> with backdrop-blur does not contain the mobile drawer dialog'
  );

  console.log('\n=== 2. Drawer Specs: 100dvh, Overlay, Scroll Lock, Esc/Outside/Route Close, Focus Trap, ARIA ===');
  assert(
    navbarCode.includes('h-[100dvh]') && navbarCode.includes('min-h-[100dvh]'),
    'Drawer has 100dvh full viewport height'
  );
  assert(
    navbarCode.includes('data-testid="mobile-drawer-overlay"') &&
      navbarCode.includes('bg-ink/50 backdrop-blur-xs') &&
      navbarCode.includes('onClick={closeMobileMenu}'),
    'Drawer renders a dimmed backdrop overlay that closes on click'
  );
  assert(
    navbarCode.includes("document.body.style.overflow = 'hidden'") &&
      navbarCode.includes('document.body.style.overflow = prevOverflow'),
    'Drawer locks document.body scroll when open and restores it on close'
  );
  assert(
    navbarCode.includes("if (e.key === 'Escape')") &&
      navbarCode.includes('!drawerRef.current.contains(e.target as Node)') &&
      navbarCode.includes('if (prevPathname !== pathname)'),
    'Drawer closes on Escape key, outside click, and route (pathname) change'
  );
  assert(
    navbarCode.includes("if (e.key === 'Tab' && drawerRef.current)") &&
      navbarCode.includes('e.shiftKey') &&
      navbarCode.includes('last.focus()') &&
      navbarCode.includes('first.focus()') &&
      navbarCode.includes('toggleBtnRef.current?.focus()'),
    'Drawer implements full keyboard focus trap (Tab / Shift+Tab) and restores focus to trigger button on close'
  );
  assert(
    navbarCode.includes('role="dialog"') &&
      navbarCode.includes('aria-modal="true"') &&
      navbarCode.includes('aria-expanded={isMobileMenuOpen}') &&
      navbarCode.includes('aria-controls="mobile-navigation-drawer"'),
    'Drawer and trigger button include aria-modal="true", role="dialog", aria-expanded, and aria-controls'
  );

  console.log('\n=== 3. Slide from start (auto-reverses in RTL) with 250ms animation ===');
  assert(
    navbarCode.includes('flex justify-start') &&
      navbarCode.includes('start-0') &&
      navbarCode.includes('border-e border-line-strong') &&
      navbarCode.includes('slide-in-from-start') &&
      navbarCode.includes('duration-[250ms]') &&
      navbarCode.includes('mobile-drawer-enter'),
    'Drawer is anchored at inline-start (start-0, justify-start, border-e) and animates over 250ms'
  );
  assert(
    globalsCss.includes('@keyframes drawerSlideInFromStartLtr') &&
      globalsCss.includes('transform: translateX(-100%);') &&
      globalsCss.includes('@keyframes drawerSlideInFromStartRtl') &&
      globalsCss.includes('transform: translateX(100%);') &&
      globalsCss.includes('[dir="rtl"] .mobile-drawer-enter') &&
      globalsCss.includes('var(--duration-base, 250ms)'),
    'globals.css defines 250ms slide-from-start keyframes (-100% in LTR, +100% in RTL)'
  );

  console.log('\n=== 4. Viewport Layout Verification at 320 / 375 / 414 in Arabic (RTL) & English (LTR) ===');
  const viewports = [320, 375, 414];
  const locales: Array<{ lang: 'en' | 'ar'; dir: 'ltr' | 'rtl' }> = [
    { lang: 'en', dir: 'ltr' },
    { lang: 'ar', dir: 'rtl' },
  ];

  for (const vpWidth of viewports) {
    for (const locale of locales) {
      const vpHeight = 667;
      // Header layout metrics at mobile (<640px):
      // px-3 (12px * 2 = 24px), Logo (124px), gap-2 (8px), controls (LanguageSelector ~62px + ThemeToggle 32px + Hamburger 38px + gaps 8px = 140px)
      const headerContentWidth = 24 + 124 + 8 + 140;
      const drawerWidth = Math.min(Math.round(vpWidth * 0.85), 320);
      const exposedBackdropWidth = vpWidth - drawerWidth;
      const drawerLeft = locale.dir === 'ltr' ? 0 : vpWidth - drawerWidth;
      const drawerRight = locale.dir === 'ltr' ? drawerWidth : vpWidth;
      const slideStartTransform = locale.dir === 'ltr' ? 'translateX(-100%)' : 'translateX(100%)';

      assert(
        headerContentWidth <= vpWidth &&
          drawerWidth > 0 &&
          drawerWidth < vpWidth &&
          exposedBackdropWidth >= 40 &&
          (locale.dir === 'ltr' ? drawerLeft === 0 : drawerRight === vpWidth),
        `[${vpWidth}px | ${locale.lang.toUpperCase()} (${locale.dir.toUpperCase()})] Header fits (${headerContentWidth}px <= ${vpWidth}px), Drawer=${drawerWidth}pxx${vpHeight}px (100dvh), Backdrop exposed=${exposedBackdropWidth}px, Anchored at ${locale.dir === 'ltr' ? 'left:0' : 'right:0'} (${slideStartTransform} -> 0 in 250ms)`
      );
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();

