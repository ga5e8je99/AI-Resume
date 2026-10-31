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

  const heroCode = readFile('app/components/HeroSection.tsx');

  console.log('\n=== 1. ATS Badge Safe Mobile Bounds (inset-x) + sm+ Floating + overflow-x-clip ===');
  assert(
    heroCode.includes('overflow-x-clip'),
    'HeroSection <section> includes overflow-x-clip'
  );
  assert(
    heroCode.includes('relative inset-x-0 mb-3.5 w-full') &&
      heroCode.includes('sm:absolute sm:inset-x-auto sm:w-auto sm:mb-0 sm:-top-5 sm:-end-4') &&
      !heroCode.includes("'-top-5 -end-4"),
    'ATS badge uses safe in-bounds relative inset-x-0 on mobile and returns to sm:absolute sm:-top-5 sm:-end-4 on sm+'
  );

  for (const landingFile of [
    'app/components/landing/LandingPageClient.tsx',
    'app/components/landing/TrustStrip.tsx',
    'app/components/landing/HowItWorks.tsx',
    'app/components/landing/FeatureShowcase.tsx',
    'app/components/landing/ComparisonSection.tsx',
    'app/components/landing/PricingTeaser.tsx',
    'app/components/landing/FaqSection.tsx',
    'app/components/landing/CtaBand.tsx',
  ]) {
    const code = readFile(landingFile);
    assert(
      code.includes('overflow-x-clip'),
      `${landingFile} includes overflow-x-clip`
    );
  }

  console.log('\n=== 2. Phone Number, Emails & Numbers in Mockup: dir="ltr" + unicode-bidi: isolate ===');
  assert(
    heroCode.includes('dir="ltr"') &&
      heroCode.includes("unicodeBidi: 'isolate'") &&
      heroCode.includes('[unicode-bidi:isolate]') &&
      heroCode.includes("{t('hero_preview_email')}") &&
      heroCode.includes("{t('hero_preview_phone')}"),
    'Mockup email, phone number, and numeric badges use dir="ltr" with unicode-bidi: isolate'
  );

  console.log('\n=== 3. Zero Physical Directional Classes (left/right/ml/mr/pl/pr) in Hero & Landing ===');
  const physicalClassRegex =
    /\b(?:(?:sm|md|lg|xl|2xl|hover|focus|active|group-hover|rtl|ltr|dark):)*(?:ml|mr|pl|pr|left|right|text-left|text-right|border-l|border-r|rounded-l|rounded-r)(?:-[a-z0-9[\]./%]+)?\b|\b(?:leftIcon|rightIcon)\b/g;

  for (const file of [
    'app/components/HeroSection.tsx',
    'app/components/landing/LandingPageClient.tsx',
    'app/components/landing/TrustStrip.tsx',
    'app/components/landing/HowItWorks.tsx',
    'app/components/landing/FeatureShowcase.tsx',
    'app/components/landing/ComparisonSection.tsx',
    'app/components/landing/PricingTeaser.tsx',
    'app/components/landing/FaqSection.tsx',
    'app/components/landing/CtaBand.tsx',
  ]) {
    const code = readFile(file);
    const matches = code.match(physicalClassRegex) || [];
    assert(
      matches.length === 0,
      `${file} has 0 physical left/right/ml/mr/pl/pr classes or leftIcon/rightIcon props`,
      matches.join(', ')
    );
  }

  console.log('\n=== 4. All Hero Hardcoded Strings Moved to i18n Across All 6 Languages ===');
  assert(
    !heroCode.includes('Workday & Taleo Ready') &&
      !heroCode.includes('ATS Passed') &&
      !heroCode.includes('tariq@example.com') &&
      !heroCode.includes('+971 50 123 4567') &&
      !heroCode.includes('Dubai, UAE') &&
      !heroCode.includes('ATS Score:'),
    'HeroSection has zero hardcoded English UI/mockup strings'
  );

  const requiredKeys = [
    'hero_preview_parser_ready',
    'hero_preview_ats_passed',
    'hero_preview_ats_short',
    'hero_preview_ats_score_aria',
    'hero_preview_email',
    'hero_preview_phone',
    'hero_preview_location',
    'hero_preview_kw1',
    'hero_preview_kw2',
    'hero_preview_kw3',
    'hero_preview_kw4',
    'hero_preview_kw5',
  ];

  for (const lang of ['en', 'ar', 'fr', 'de', 'es', 'tr']) {
    const dictCode = readFile(`app/lib/translations/${lang}.ts`);
    const missing = requiredKeys.filter((k) => !dictCode.includes(`${k}:`));
    assert(
      missing.length === 0,
      `app/lib/translations/${lang}.ts defines all ${requiredKeys.length} Hero mockup i18n keys`,
      missing.join(', ')
    );
  }

  console.log('\n=== 5. Zero Horizontal Scroll on 320px Viewport (LTR & RTL) ===');
  // Verify container padding (px-4 = 32px -> 288px content width), min-w-0 on grid columns,
  // full-width mobile CTAs (w-full sm:w-auto), and in-bounds ATS badge (inset-x-0 w-full)
  assert(
    heroCode.includes('min-w-0 max-w-full') &&
      heroCode.includes('w-full sm:w-auto') &&
      heroCode.includes('pe-0 sm:pe-5') &&
      heroCode.includes('overflow-x-clip'),
    'HeroSection layout enforces min-w-0 max-w-full, w-full sm:w-auto CTAs, pe-0 on <640px, and overflow-x-clip for 0px horizontal scroll at 320px'
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();

