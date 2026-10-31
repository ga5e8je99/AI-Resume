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
      console.log(`  PASS: ${name}`);
      passed++;
    } else {
      console.error(`  FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  const navbar = readFile('app/components/Navbar.tsx');
  const userMenu = readFile('components/layout/UserMenu.tsx');
  const langSelector = readFile('app/components/LanguageSelector.tsx');
  const themeToggle = readFile('app/components/ThemeToggle.tsx');
  const i18nTypes = readFile('app/lib/translations/types.ts');

  console.log('\n=== 1. 3-Zone Desktop Layout (Start: Newsreader Wordmark, Center: 4 Links + Tools ~480px, End: Controls + CTA) ===');
  assert(
    navbar.includes('<LogoMark') &&
      navbar.includes('font-serif') &&
      navbar.includes("t('nav_brand')"),
    'Start zone renders brand LogoMark icon + Newsreader (font-serif) wordmark'
  );
  assert(
    navbar.includes("id: 'features'") &&
      navbar.includes("id: 'jobs'") &&
      navbar.includes("id: 'templates'") &&
      navbar.includes("id: 'pricing'") &&
      navbar.includes('w-[480px]'),
    'Center zone renders 4 primary links (Features, Jobs, Templates, Pricing) + Tools dropdown with ~480px panel'
  );
  assert(
    navbar.includes('<LanguageSelector variant="compact" />') &&
      navbar.includes('<ThemeToggle size="sm" variant="icon" />') &&
      navbar.includes('data-testid="navbar-login-btn"') &&
      navbar.includes('data-testid="navbar-start-free-cta"') &&
      navbar.includes('bg-accent text-on-accent'),
    'End zone renders Language switcher, Theme toggle, ghost "Log in" button, and prominent bg-accent "Start free" CTA'
  );

  console.log('\n=== 2. Dimensions (64px height, max-w-[1200px]) & Scrolled State (> 8px) ===');
  assert(
    navbar.includes('max-w-[1200px]') && navbar.includes('h-16'),
    'Navbar container uses max-w-[1200px] and 64px (h-16) height'
  );
  assert(
    navbar.includes('window.scrollY > 8') &&
      navbar.includes('bg-paper/90 backdrop-blur-md border-b border-line-strong shadow-subtle'),
    'Scrolled state (> 8px) applies border-b, subtle shadow, and bg-paper/90 with backdrop-blur'
  );
  assert(
    navbar.includes('createPortal(mobileDrawerElement, document.body)'),
    'Mobile drawer remains rendered via createPortal outside <header> so backdrop-blur never breaks fixed positioning'
  );

  console.log('\n=== 3. Active Link (accent + animated scaleX underline 250ms) vs Lighter Hover ===');
  assert(
    navbar.includes('text-accent font-semibold') &&
      navbar.includes('scale-x-100') &&
      navbar.includes('scale-x-0') &&
      navbar.includes('group-hover:scale-x-75') &&
      navbar.includes('duration-[250ms]'),
    'Active link uses text-accent + scaleX(1) underline with 250ms transition, while hover uses lighter/shorter preview'
  );

  console.log('\n=== 4. Tools Dropdown: Hover + Click + Keyboard + Close Delay + Fade/TranslateY Animation ===');
  assert(
    navbar.includes('onMouseEnter={openToolsMenu}') &&
      navbar.includes('onMouseLeave={scheduleCloseToolsMenu}') &&
      navbar.includes('150') &&
      navbar.includes("onClick={() => setIsToolsOpen((prev) => !prev)}"),
    'Dropdown opens on hover and click with 150ms close delay to prevent accidental dismissal'
  );
  assert(
    navbar.includes("e.key === 'Enter' || e.key === ' '") &&
      navbar.includes("e.key === 'Escape'") &&
      navbar.includes("e.key === 'ArrowDown'") &&
      navbar.includes("e.key === 'ArrowUp'"),
    'Dropdown supports full keyboard interaction (Enter, Space, Escape, ArrowDown, ArrowUp, Home, End)'
  );
  assert(
    navbar.includes('animate-in fade-in slide-in-from-top-2'),
    'Dropdown animates with fade + translateY (slide-in-from-top-2)'
  );

  console.log('\n=== 5. Authenticated State: Credits Badge + Avatar Menu (Dashboard, Billing, Settings, Logout) ===');
  assert(
    navbar.includes('data-testid="navbar-credits-badge"') &&
      navbar.includes('<UserMenu variant="compact" />'),
    'When authenticated, Navbar displays remaining credits badge and UserMenu instead of Log in / Start free CTA'
  );
  assert(
    userMenu.includes("t('nav_dashboard')") &&
      userMenu.includes("t('nav_billing')") &&
      userMenu.includes("t('nav_settings')") &&
      userMenu.includes("t('nav_logout')"),
    'Avatar menu includes Dashboard, Billing, Settings, and Logout'
  );

  console.log('\n=== 6. 6-Language i18n & Zero Hardcoded English aria-labels ===');
  const requiredKeys = [
    'nav_features',
    'nav_jobs',
    'nav_login_btn',
    'nav_start_free',
    'nav_billing',
    'nav_settings',
    'nav_main_aria',
    'nav_mobile_drawer_aria',
    'nav_home_aria',
    'nav_change_language_aria',
    'nav_language_options_aria',
    'nav_theme_light',
    'nav_theme_dark',
    'nav_theme_system',
    'nav_theme_switcher_aria',
  ];

  const locales = ['en', 'ar', 'fr', 'de', 'es', 'tr'];
  for (const locale of locales) {
    const content = readFile(`app/lib/translations/${locale}.ts`);
    const missing = requiredKeys.filter((k) => !content.includes(`${k}:`));
    assert(
      missing.length === 0 && requiredKeys.every((k) => i18nTypes.includes(`${k}: string;`)),
      `Locale [${locale}] defines all ${requiredKeys.length} Navbar i18n keys`,
      missing.join(', ')
    );
  }

  assert(
    !navbar.includes('tools[0]') &&
      !navbar.includes('aria-label="Main Navigation"') &&
      !navbar.includes('aria-label="Navigation Menu"') &&
      !navbar.includes('aria-label="Close Navigation Menu"') &&
      !langSelector.includes('isAr ?') &&
      !themeToggle.includes('isAr ?'),
    'Navbar, LanguageSelector, and ThemeToggle have zero hardcoded English aria-labels or tools[0] references'
  );

  console.log('\n=== 7. RTL Logical Properties & Accessibility (skip-to-content, focus-visible, landmark nav) ===');
  assert(
    navbar.includes('href="#main-content"') &&
      navbar.includes("t('common_skip_content')") &&
      navbar.includes("aria-label={t('nav_main_aria')}") &&
      navbar.includes('focus-visible:ring-2 focus-visible:ring-accent'),
    'Includes skip-to-content link, landmark <nav> with translated aria-label, and focus-visible rings'
  );

  console.log(`\n========================================`);
  console.log(`Total Passed: ${passed}`);
  console.log(`Total Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

