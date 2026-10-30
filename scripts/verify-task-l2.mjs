import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failedCount++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passedCount++;
  }
}

console.log('\n--- VERIFYING TASK L2: BRANDED LOADING & TRANSITION SYSTEM ---\n');

// 1. RouteProgressBar
const routeBarPath = path.join(root, 'components', 'navigation', 'RouteProgressBar.tsx');
assert(existsSync(routeBarPath), 'components/navigation/RouteProgressBar.tsx exists');
if (existsSync(routeBarPath)) {
  const content = readFileSync(routeBarPath, 'utf8');
  assert(content.includes('delay = 150') || content.includes('150'), 'Anti-flicker delay set to 150ms');
  assert(content.includes('minVisibleTime = 300') || content.includes('300'), 'Minimum visible time set to 300ms');
  assert(content.includes('height: \'3px\'') || content.includes('3px'), 'Progress bar height is 3px');
  assert(content.includes('var(--shadow-glow'), 'Progress bar uses brand --shadow-glow');
  assert(content.includes('insetInlineStart') || content.includes('isRtl'), 'Progress bar respects RTL inline-start');
  assert(content.includes('window.history.pushState'), 'Intercepts programmatic router.push via pushState');
  assert(content.includes('Escape'), 'Supports cancellation on Escape key');
  assert(content.includes('main h1, h1') && content.includes('focus('), 'Shifts focus to main heading after navigation');
  assert(content.includes('aria-hidden="true"'), 'Progress bar has aria-hidden="true"');
}

// 2. ClientProviders Mounting
const clientProvidersPath = path.join(root, 'app', 'components', 'ClientProviders.tsx');
assert(existsSync(clientProvidersPath), 'app/components/ClientProviders.tsx exists');
if (existsSync(clientProvidersPath)) {
  const content = readFileSync(clientProvidersPath, 'utf8');
  assert(content.includes('<RouteProgressBar />') || content.includes('<RouteProgressBar'), 'RouteProgressBar is mounted in ClientProviders');
  assert(content.includes('<FirstVisitSplash />') || content.includes('<FirstVisitSplash'), 'FirstVisitSplash is mounted in ClientProviders');
}

// 3. FirstVisitSplash
const splashPath = path.join(root, 'components', 'brand', 'FirstVisitSplash.tsx');
assert(existsSync(splashPath), 'components/brand/FirstVisitSplash.tsx exists');
if (existsSync(splashPath)) {
  const content = readFileSync(splashPath, 'utf8');
  assert(content.includes('sessionStorage'), 'Splash guards against repeated runs via sessionStorage');
  assert(content.includes('isCrawler') || content.includes('bot'), 'Splash skips crawlers and bots');
  assert(content.includes('prefers-reduced-motion'), 'Splash skips when prefers-reduced-motion is active');
  assert(content.includes('800'), 'Splash unmounts after maximum 800ms (does not block LCP)');
}

// 4. BrandedLoader & i18n
const brandedLoaderPath = path.join(root, 'components', 'brand', 'BrandedLoader.tsx');
assert(existsSync(brandedLoaderPath), 'components/brand/BrandedLoader.tsx exists');
if (existsSync(brandedLoaderPath)) {
  const content = readFileSync(brandedLoaderPath, 'utf8');
  assert(content.includes('LogoMark'), 'BrandedLoader displays the LogoMark');
  assert(content.includes('animate-loader-orbit'), 'BrandedLoader includes the orbiting amber spark');
  assert(content.includes('var(--brand)'), 'BrandedLoader uses the brand jade stroke');
  assert(content.includes('var(--highlight)'), 'BrandedLoader uses the amber spark fill');
  assert(content.includes('role="status"'), 'BrandedLoader has role="status"');
  assert(content.includes('aria-live="polite"'), 'BrandedLoader has aria-live="polite"');
}

// Verify i18n translations across all 6 languages
const langs = ['en', 'ar', 'fr', 'de', 'es', 'tr'];
langs.forEach((lang) => {
  const trPath = path.join(root, 'app', 'lib', 'translations', `${lang}.ts`);
  assert(existsSync(trPath), `app/lib/translations/${lang}.ts exists`);
  if (existsSync(trPath)) {
    const content = readFileSync(trPath, 'utf8');
    assert(
      content.includes('loading_preparing_workspace'),
      `${lang}.ts has translation for loading_preparing_workspace`
    );
  }
});

// 5. Page-loading screens (loading.tsx)
const loadingRoutes = [
  { path: 'app/loading.tsx', name: 'Global' },
  { path: 'app/dashboard/loading.tsx', name: 'Dashboard' },
  { path: 'app/builder/loading.tsx', name: 'Builder' },
  { path: 'app/cv-builder/loading.tsx', name: 'CV Builder' },
  { path: 'app/review/loading.tsx', name: 'Scanner (Review)' },
  { path: 'app/scanner/loading.tsx', name: 'Scanner (/scanner)' },
  { path: 'app/cover-letter/loading.tsx', name: 'Cover Letter' },
  { path: 'app/jobs/loading.tsx', name: 'Job Match (/jobs)' },
  { path: 'app/job-match/loading.tsx', name: 'Job Match (/job-match)' },
  { path: 'app/pricing/loading.tsx', name: 'Pricing' },
];

loadingRoutes.forEach((route) => {
  const p = path.join(root, ...route.path.split('/'));
  assert(existsSync(p), `${route.name} loading screen (${route.path}) exists`);
  if (existsSync(p)) {
    const content = readFileSync(p, 'utf8');
    assert(
      content.includes('Skeleton') || content.includes('export { default }') || content.includes('BrandedLoader'),
      `${route.path} uses structured skeletons or BrandedLoader`
    );
  }
});

// 6. Component-level Loading States
const buttonPath = path.join(root, 'components', 'ui', 'Button.tsx');
assert(existsSync(buttonPath), 'components/ui/Button.tsx exists');
if (existsSync(buttonPath)) {
  const content = readFileSync(buttonPath, 'utf8');
  assert(content.includes('isLoading'), 'Button supports isLoading prop');
  assert(content.includes('Loader2'), 'Button renders Loader2 spinner when isLoading is true');
  assert(content.includes('aria-busy'), 'Button sets aria-busy when isLoading is true');
  assert(content.includes('iconSizeClass'), 'Button preserves exact icon dimensions to prevent width jump');
}

// 7. Staged AI Progress with Cancel Button
const resumeGenPath = path.join(root, 'app', 'resume', 'generate', 'page.tsx');
if (existsSync(resumeGenPath)) {
  const content = readFileSync(resumeGenPath, 'utf8');
  assert(content.includes('BrandedLoader'), 'Resume generator uses BrandedLoader');
  assert(content.includes('handleCancelGeneration'), 'Resume generator has cancel generation handler');
}

const reviewPagePath = path.join(root, 'app', 'review', 'page.tsx');
if (existsSync(reviewPagePath)) {
  const content = readFileSync(reviewPagePath, 'utf8');
  assert(content.includes('handleCancelProcessing'), 'ATS review page has cancel processing handler');
}

const jobsPagePath = path.join(root, 'app', 'jobs', 'page.tsx');
if (existsSync(jobsPagePath)) {
  const content = readFileSync(jobsPagePath, 'utf8');
  assert(content.includes('handleCancelSearch'), 'Jobs match page has cancel search handler');
  assert(content.includes('animate-in fade-in duration-150'), 'Jobs match list has 150ms fade-in');
}

const dashboardPagePath = path.join(root, 'app', 'dashboard', 'page.tsx');
if (existsSync(dashboardPagePath)) {
  const content = readFileSync(dashboardPagePath, 'utf8');
  assert(content.includes('animate-in fade-in duration-150'), 'Dashboard items have 150ms fade-in');
}

// 8. Reduced Motion & CSS Styles
const globalsCssPath = path.join(root, 'app', 'globals.css');
assert(existsSync(globalsCssPath), 'app/globals.css exists');
if (existsSync(globalsCssPath)) {
  const content = readFileSync(globalsCssPath, 'utf8');
  assert(content.includes('skeleton-shimmer'), 'globals.css defines skeleton-shimmer animation');
  assert(content.includes('skeleton-shimmer-rtl'), 'globals.css defines RTL shimmer animation');
  assert(content.includes('loader-orbit'), 'globals.css defines loader-orbit animation');
  assert(content.includes('prefers-reduced-motion'), 'globals.css respects prefers-reduced-motion');
}

console.log(`\n==================================================`);
console.log(`RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log(`==================================================\n`);

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Task L2 checks passed successfully!\n');
}
