import fs from 'fs';
import path from 'path';
import { generateMetadata as pricingMeta } from '../app/pricing/layout';
import { generateMetadata as jobsMeta } from '../app/jobs/layout';
import { generateMetadata as coverLetterMeta } from '../app/cover-letter/layout';
import { generateMetadata as reviewMeta } from '../app/review/layout';
import { generateMetadata as resumeGenMeta } from '../app/resume/generate/layout';
import { generateMetadata as privacyMeta } from '../app/privacy/layout';
import { generateMetadata as termsMeta } from '../app/terms/layout';
import { generateMetadata as loginMeta } from '../app/login/layout';
import { generateMetadata as registerMeta } from '../app/register/layout';
import { generateMetadata as forgotPasswordMeta } from '../app/forgot-password/layout';

import { generateMetadata as dashboardMeta } from '../app/dashboard/layout';
import { generateMetadata as builderMeta } from '../app/builder/layout';
import { generateMetadata as cvBuilderMeta } from '../app/cv-builder/layout';
import { generateMetadata as paymentMeta } from '../app/payment/layout';
import { generateMetadata as paymentSuccessMeta } from '../app/payment/success/layout';
import { generateMetadata as paymentCancelledMeta } from '../app/payment/cancelled/layout';
import { generateMetadata as paymentCryptoMeta } from '../app/payment/crypto/layout';
import { generateMetadata as adminMeta } from '../app/admin/layout';
import { generateMetadata as resetPasswordMeta } from '../app/reset-password/layout';
import { generateMetadata as previewTemplateMeta } from '../app/preview-template/layout';
import { generateMetadata as devUiMeta } from '../app/dev/ui/layout';

import sitemap from '../app/sitemap';
import robots from '../app/robots';
import { SITE_URL, SUPPORTED_LANGS, buildPageMetadata } from '../lib/seo';

const ROOT = path.resolve(__dirname, '..');

async function runTests() {
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

  console.log('\n=== 1. Root Layout Metadata Check ===');
  const layoutContent = fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf8');
  assert(
    layoutContent.includes("metadataBase: new URL('https://ai-resume-rho.vercel.app')"),
    `Root layout has metadataBase: ${SITE_URL}`
  );
  assert(
    !layoutContent.includes("canonical: '/'") && !layoutContent.includes('alternates:'),
    'Root layout has NO alternates.canonical: "/" (removed to prevent canonical inheritance)'
  );

  const homePageContent = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf8');
  assert(
    homePageContent.includes('export async function generateMetadata') &&
      homePageContent.includes("path: '/'"),
    'app/page.tsx exports generateMetadata with path: "/"'
  );

  const homeMeta = async () =>
    buildPageMetadata({
      title: 'JobMatch AI - A Resume That Gets Read | Editorial ATS Resume & CV Builder',
      description:
        'ATS-friendly templates, 6 languages with native Arabic RTL, Word & PDF export, and private in-browser diagnostics. Build resumes and cover letters engineered to pass automated screening.',
      path: '/',
      ogTitle: 'JobMatch AI - A Resume That Gets Read',
      ogDescription:
        'ATS-friendly templates, 6 languages with native Arabic RTL, Word & PDF export, and private in-browser diagnostics. Free in-browser scanning.',
    });

  console.log('\n=== 2 & 3. Public Pages generateMetadata + Canonical + OpenGraph + Hreflang ===');
  const publicPages = [
    { path: '/', fn: homeMeta },
    { path: '/pricing', fn: pricingMeta },
    { path: '/jobs', fn: jobsMeta },
    { path: '/cover-letter', fn: coverLetterMeta },
    { path: '/review', fn: reviewMeta },
    { path: '/resume/generate', fn: resumeGenMeta },
    { path: '/privacy', fn: privacyMeta },
    { path: '/terms', fn: termsMeta },
    { path: '/login', fn: loginMeta },
    { path: '/register', fn: registerMeta },
    { path: '/forgot-password', fn: forgotPasswordMeta },
  ];

  for (const page of publicPages) {
    const meta = await page.fn();
    const expectedCanonical = page.path === '/' ? SITE_URL : `${SITE_URL}${page.path}`;
    const queryBase = page.path === '/' ? `${SITE_URL}/` : expectedCanonical;

    assert(
      typeof meta.title === 'string' &&
        meta.title.length > 0 &&
        typeof meta.description === 'string' &&
        meta.description.length > 0,
      `${page.path}: has title & description`
    );
    assert(
      meta.alternates?.canonical === expectedCanonical,
      `${page.path}: canonical is ${expectedCanonical}`,
      `Got ${String(meta.alternates?.canonical)}`
    );

    const langs = (meta.alternates?.languages || {}) as Record<string, string>;
    const allLangsValid =
      SUPPORTED_LANGS.every((l) => langs[l] === `${queryBase}?lang=${l}`) &&
      langs['x-default'] === expectedCanonical;
    assert(
      allLangsValid,
      `${page.path}: has hreflang/?lang= alternates for en, ar, fr, de, es, tr + x-default`
    );

    assert(
      Boolean(
        meta.openGraph?.title &&
          meta.openGraph?.description &&
          meta.openGraph?.url === expectedCanonical
      ),
      `${page.path}: has openGraph with matching url (${expectedCanonical})`
    );
    assert(meta.robots === undefined, `${page.path}: is indexable (no noindex robots)`);
  }

  console.log('\n=== 4. Private Pages robots: { index: false } ===');
  const privatePages = [
    { path: '/dashboard', fn: dashboardMeta },
    { path: '/builder', fn: builderMeta },
    { path: '/cv-builder', fn: cvBuilderMeta },
    { path: '/payment', fn: paymentMeta },
    { path: '/payment/success', fn: paymentSuccessMeta },
    { path: '/payment/cancelled', fn: paymentCancelledMeta },
    { path: '/payment/crypto', fn: paymentCryptoMeta },
    { path: '/admin', fn: adminMeta },
    { path: '/reset-password', fn: resetPasswordMeta },
    { path: '/preview-template', fn: previewTemplateMeta },
    { path: '/dev/ui', fn: devUiMeta },
  ];

  for (const page of privatePages) {
    const meta = await page.fn();
    const robotsObj = meta.robots as { index?: boolean; follow?: boolean } | undefined;
    assert(
      robotsObj !== undefined && typeof robotsObj === 'object' && robotsObj.index === false,
      `${page.path}: has robots: { index: false }`
    );
  }

  console.log('\n=== 5. Verify sitemap.ts & robots.ts ===');
  const sitemapEntries = sitemap();
  const sitemapUrls = sitemapEntries.map((e) => e.url);
  assert(
    sitemapUrls.includes(SITE_URL) &&
      sitemapUrls.includes(`${SITE_URL}/pricing`) &&
      sitemapUrls.includes(`${SITE_URL}/jobs`) &&
      sitemapUrls.includes(`${SITE_URL}/cover-letter`) &&
      sitemapUrls.includes(`${SITE_URL}/review`),
    'sitemap.ts includes /, /pricing, /jobs, /cover-letter, /review'
  );
  assert(
    !sitemapUrls.includes(`${SITE_URL}/dashboard`) &&
      !sitemapUrls.includes(`${SITE_URL}/builder`) &&
      !sitemapUrls.some((u) => u.includes('/payment')),
    'sitemap.ts excludes private noindex pages (/dashboard, /builder, /payment/*)'
  );

  const robotsConfig = robots();
  const rulesArray = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];
  const disallowed = (rulesArray[0]?.disallow || []) as string[];
  assert(
    disallowed.includes('/dashboard') &&
      disallowed.includes('/payment/') &&
      disallowed.includes('/builder') &&
      robotsConfig.sitemap === `${SITE_URL}/sitemap.xml`,
    'robots.ts disallows /dashboard, /payment/, /builder and specifies sitemap.xml'
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
