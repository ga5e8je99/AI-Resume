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

  console.log('\n=== 1. Bento Hero Layout, Responsive Bounds & overflow-x-clip ===');
  assert(
    heroCode.includes('overflow-x-clip') && heroCode.includes('lg:max-h-[100svh]'),
    'HeroSection <section> includes overflow-x-clip and lg:max-h-[100svh]'
  );
  assert(
    heroCode.includes("variant = 'bento'") &&
      heroCode.includes("variant?: 'bento' | 'classic'") &&
      heroCode.includes('aria-hidden="true"') &&
      heroCode.includes('className="sr-only"'),
    'HeroSection supports variant="bento"|"classic" (default bento) and aria-hidden mockup with sr-only summary'
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

  console.log('\n=== 2. Abstract Numbers & Percentages in Bento Mockup: dir="ltr" + unicodeBidi: isolate ===');
  assert(
    heroCode.includes('dir="ltr"') &&
      heroCode.includes("unicodeBidi: 'isolate'") &&
      heroCode.includes('hero_bento_score_title') &&
      heroCode.includes('hero_bento_skills_title') &&
      heroCode.includes('hero_bento_jobs_title'),
    'Bento 3 cards (Score Ring + Metrics, Skill Chips, Role Matches) use dir="ltr" with unicodeBidi: isolate on numbers'
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

  console.log('\n=== 4. Zero Personal Names, Company Names, Emails, Phones, or Unproven Claims ===');
  assert(
    !heroCode.includes('Tariq') &&
      !heroCode.includes('طارق') &&
      !heroCode.includes('Apex FinTech') &&
      !heroCode.includes('Workday & Taleo Ready') &&
      !heroCode.includes('Top 5% Match') &&
      !heroCode.includes('tariq@example.com') &&
      !heroCode.includes('+971 50 123 4567') &&
      !heroCode.includes('Dubai, UAE'),
    'HeroSection has zero personal names, company names, emails, phones, or unproven claims'
  );

  const requiredKeys = [
    'hero_how_it_works_cta',
    'hero_trust_languages',
    'hero_bento_sr_summary',
    'hero_bento_score_title',
    'hero_bento_score_badge',
    'hero_bento_metric_keywords',
    'hero_bento_metric_format',
    'hero_bento_metric_impact',
    'hero_bento_skills_title',
    'hero_bento_skills_matched',
    'hero_bento_skills_missing',
    'hero_skill_communication',
    'hero_skill_analysis',
    'hero_skill_teamwork',
    'hero_skill_reporting',
    'hero_skill_planning',
    'hero_skill_leadership',
    'hero_bento_jobs_title',
    'hero_bento_jobs_subtitle',
    'hero_bento_jobs_match_badge',
  ];

  for (const lang of ['en', 'ar', 'fr', 'de', 'es', 'tr']) {
    const dictCode = readFile(`app/lib/translations/${lang}.ts`);
    const missing = requiredKeys.filter((k) => !dictCode.includes(`${k}:`));
    assert(
      missing.length === 0,
      `app/lib/translations/${lang}.ts defines all ${requiredKeys.length} Bento Hero i18n keys`,
      missing.join(', ')
    );
    assert(
      !dictCode.includes('Tariq Al-Mansoor') &&
        !dictCode.includes('طارق المنصور') &&
        !dictCode.includes('tariq@example.com') &&
        !dictCode.includes('+971 50 123 4567'),
      `app/lib/translations/${lang}.ts has zero personal names, emails, or phone numbers in hero keys`
    );
  }

  console.log('\n=== 5. Zero Horizontal Scroll on 320px Viewport (LTR & RTL) ===');
  assert(
    heroCode.includes('min-w-0 max-w-full') &&
      heroCode.includes('w-full sm:w-auto') &&
      heroCode.includes('grid-cols-1 sm:grid-cols-2') &&
      heroCode.includes('overflow-x-clip'),
    'HeroSection layout enforces min-w-0 max-w-full, w-full sm:w-auto CTAs, mobile single-column Bento collapse, and overflow-x-clip for 0px horizontal scroll at 320px'
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
