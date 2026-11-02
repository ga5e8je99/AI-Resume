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

  const globalsCss = readFile('app/globals.css');

  console.log('\n=== 1. Motion Tokens in @theme & prefers-reduced-motion ===');
  assert(
    globalsCss.includes('--duration-fast: 150ms;') &&
      globalsCss.includes('--duration-base: 250ms;') &&
      globalsCss.includes('--duration-slow: 400ms;') &&
      globalsCss.includes('--ease-out: cubic-bezier(.22, 1, .36, 1);'),
    'app/globals.css defines --duration-fast: 150ms, --duration-base: 250ms, --duration-slow: 400ms, --ease-out: cubic-bezier(.22, 1, .36, 1)'
  );
  assert(
    globalsCss.includes('@media (prefers-reduced-motion: reduce)') &&
      globalsCss.includes('html:not(.js-aos) [data-aos]'),
    'app/globals.css preserves prefers-reduced-motion block and html:not(.js-aos) progressive enhancement'
  );

  console.log('\n=== 2. AosProvider & Reveal / Stagger (80ms, max 400ms) ===');
  const aosProviderCode = readFile('components/motion/AosProvider.tsx');
  assert(
    aosProviderCode.includes('AOS.init') &&
      aosProviderCode.includes('duration: 700') &&
      aosProviderCode.includes("easing: 'ease-out-cubic'") &&
      aosProviderCode.includes('once: true') &&
      aosProviderCode.includes('offset: 80') &&
      aosProviderCode.includes('AOS.refresh()'),
    'AosProvider initializes AOS (700ms, ease-out-cubic, once: true, offset: 80) and refreshes on route/lang change'
  );

  const revealCode = readFile('components/motion/Reveal.tsx');
  assert(
    revealCode.includes("'up' | 'down' | 'start' | 'end' | 'zoom' | 'fade'") &&
      revealCode.includes("dir === 'rtl' ? 'fade-left' : 'fade-right'"),
    'Reveal supports from: up | down | start | end | zoom | fade and flips fade-left <-> fade-right in RTL'
  );
  assert(
    revealCode.includes('export function Stagger') &&
      revealCode.includes('staggerMs = 80') &&
      revealCode.includes('400'),
    'Stagger wrapper exported and applies automatic 80ms delay per child capped at 400ms'
  );
  assert(
    !fs.existsSync(path.join(ROOT, 'app/components/landing/ScrollReveal.tsx')),
    'Legacy ScrollReveal.tsx has been removed'
  );

  console.log('\n=== 3. Applied to Landing, Pricing, Jobs, Dashboard, Templates, About & Contact ===');
  for (const landingFile of [
    'app/components/landing/TrustStrip.tsx',
    'app/components/landing/HowItWorks.tsx',
    'app/components/landing/FeatureShowcase.tsx',
    'app/components/landing/ComparisonSection.tsx',
    'app/components/landing/PricingTeaser.tsx',
    'app/components/landing/FaqSection.tsx',
    'app/components/landing/CtaBand.tsx',
    'app/about/page.tsx',
    'app/contact/page.tsx',
  ]) {
    const code = readFile(landingFile);
    assert(
      code.includes('Reveal') || code.includes('Stagger'),
      `${landingFile} uses Reveal / Stagger`
    );
  }

  const pricingPage = readFile('app/pricing/page.tsx');
  const planCard = readFile('app/pricing/components/PlanCard.tsx');
  assert(
    pricingPage.includes('<Stagger') && planCard.includes('card-interactive'),
    'Pricing page uses Stagger and PlanCard uses .card-interactive'
  );

  const jobList = readFile('app/jobs/_components/JobResultsList.tsx');
  const jobCard = readFile('app/jobs/_components/JobCard.tsx');
  assert(
    jobList.includes('<Stagger') && jobCard.includes('card-interactive'),
    'JobResultsList wraps JobCards in Stagger and JobCard uses .card-interactive'
  );

  const dashboardPage = readFile('app/dashboard/page.tsx');
  assert(
    dashboardPage.includes('<Stagger') &&
      dashboardPage.includes('<Reveal') &&
      dashboardPage.includes('card-interactive'),
    'Dashboard cards use Reveal / Stagger and .card-interactive'
  );

  const templateSelector = readFile('app/builder/components/TemplateSelector.tsx');
  const cvSidebar = readFile('app/cv-builder/components/CvSidebar.tsx');
  assert(
    templateSelector.includes('<Stagger') &&
      templateSelector.includes('card-interactive') &&
      cvSidebar.includes('<Stagger') &&
      cvSidebar.includes('card-interactive'),
    'Template lists (TemplateSelector & CvSidebar) use Stagger and .card-interactive'
  );

  console.log('\n=== 4. template.tsx: Page Transition opacity + translateY(8px) over 250ms ===');
  const templateCode = readFile('app/template.tsx');
  assert(
    templateCode.includes('page-transition-enter') &&
      globalsCss.includes('transform: translateY(8px);') &&
      globalsCss.includes('animation: pageFadeIn var(--duration-base, 250ms)'),
    'app/template.tsx & globals.css animate opacity + translateY(8px) over 250ms'
  );

  console.log('\n=== 5. Micro-interactions: .btn & .card-interactive ===');
  const buttonCode = readFile('components/ui/Button.tsx');
  const cardCode = readFile('components/ui/Card.tsx');
  assert(
    globalsCss.includes('.btn') &&
      globalsCss.includes('.card-interactive') &&
      globalsCss.includes('transform: scale(0.98)') &&
      buttonCode.includes('btn ') &&
      buttonCode.includes('active:scale-[0.98]') &&
      cardCode.includes('card-interactive'),
    '.btn and .card-interactive defined in globals.css and applied to Button and Card components'
  );

  console.log('\n=== 6. Modals: Fade + Scale for Enter and Exit ===');
  const dialogCode = readFile('components/ui/Dialog.tsx');
  const confirmModalCode = readFile('components/ui/ConfirmModal.tsx');
  const upgradeModalCode = readFile('app/components/UpgradeModal.tsx');
  assert(
    globalsCss.includes('@keyframes modalContentZoomIn') &&
      globalsCss.includes('@keyframes modalContentZoomOut') &&
      globalsCss.includes('.modal-card-enter') &&
      globalsCss.includes('.modal-card-exit') &&
      dialogCode.includes('modal-card-exit') &&
      confirmModalCode.includes('modal-card-exit') &&
      upgradeModalCode.includes('modal-card-exit'),
    'Modals animate fade + scale on both enter and exit'
  );

  console.log('\n=== 7. LCP-Safe HeroSection & One-Time 800ms Count-Up ===');
  const heroCode = readFile('app/components/HeroSection.tsx');
  assert(
    heroCode.includes('IntersectionObserver') &&
      heroCode.includes('hasAnimatedScoreRef') &&
      heroCode.includes('useRef(false)') &&
      heroCode.includes('SCORE_DURATION_MS = 800'),
    'HeroSection animates ATS score once via IntersectionObserver + useRef guard over 800ms'
  );
  assert(
    heroCode.includes('hero-lcp-enter') &&
      heroCode.includes('hero-lcp-delay-100') &&
      heroCode.includes('bento-float-1') &&
      !heroCode.includes('data-aos='),
    'HeroSection uses sequential CSS entrance (headline -> subtitle -> CTAs -> bento) without AOS'
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
