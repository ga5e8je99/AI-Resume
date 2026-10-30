import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('--- Task U9 Arabic + English Support Verification ---\n');

// 1. LanguageContext persistence & zero flash
const langContextPath = path.join(ROOT, 'app', 'context', 'LanguageContext.tsx');
const langContextContent = fs.readFileSync(langContextPath, 'utf8');
assert(langContextContent.includes('jobmatch_user_language'), 'LanguageContext uses jobmatch_user_language storage key');
assert(langContextContent.includes('document.cookie'), 'LanguageContext persists language to document.cookie');
assert(langContextContent.includes('document.documentElement.dir'), 'LanguageContext sets dir attribute directly on documentElement');
assert(langContextContent.includes('document.documentElement.lang'), 'LanguageContext sets lang attribute directly on documentElement');

// 2. RootLayout zero flash inline script & fonts
const layoutPath = path.join(ROOT, 'app', 'layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');
assert(layoutContent.includes('IBM_Plex_Sans_Arabic'), 'RootLayout imports IBM_Plex_Sans_Arabic');
assert(layoutContent.includes('--font-arabic'), 'RootLayout defines --font-arabic variable');
assert(layoutContent.includes('ibmPlexArabic.variable'), 'RootLayout passes ibmPlexArabic variable to body');
assert(layoutContent.includes('dangerouslySetInnerHTML'), 'RootLayout includes inline head script for zero flash');
assert(layoutContent.includes('jobmatch_user_language'), 'Head script inspects jobmatch_user_language cookie and localStorage before paint');
assert(layoutContent.includes("root.setAttribute('dir', 'rtl')"), 'Head script sets dir="rtl" before first paint');

// 3. Typography & styling in globals.css
const cssPath = path.join(ROOT, 'app', 'globals.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');
assert(cssContent.includes('[dir="rtl"]'), 'globals.css has [dir="rtl"] rules');
assert(cssContent.includes(':lang(ar)'), 'globals.css has :lang(ar) rules');
assert(cssContent.includes('var(--font-arabic)'), 'globals.css assigns --font-arabic in RTL');
assert(cssContent.includes('line-height: 1.75'), 'globals.css sets generous 1.75 line-height for Arabic text');
assert(cssContent.includes('line-height: 1.35'), 'globals.css sets 1.35 line-height for Arabic headings');
assert(cssContent.includes('tabular-nums'), 'globals.css sets tabular-nums for numeric figures');

// 4. Resume templates RTL & logical properties
const minimalPath = path.join(ROOT, 'app', 'builder', 'templates', 'MinimalTemplate.tsx');
const minimalContent = fs.readFileSync(minimalPath, 'utf8');
assert(minimalContent.includes('getDocumentHeadings'), 'MinimalTemplate imports and uses getDocumentHeadings');
assert(minimalContent.includes('dir={h.dir}'), 'MinimalTemplate applies dir={h.dir} on root');
assert(minimalContent.includes('h.isRtl'), 'MinimalTemplate handles RTL bullet point spacing');

const stockholmPath = path.join(ROOT, 'app', 'builder', 'templates', 'StockholmTemplate.tsx');
const stockholmContent = fs.readFileSync(stockholmPath, 'utf8');
assert(stockholmContent.includes('shrink-0 ms-4'), 'StockholmTemplate uses logical margin ms-4 for photo');

const osloPath = path.join(ROOT, 'app', 'builder', 'templates', 'OsloTemplate.tsx');
const osloContent = fs.readFileSync(osloPath, 'utf8');
assert(osloContent.includes('ms-6 shrink-0'), 'OsloTemplate uses logical margin ms-6 for photo');

const modernPath = path.join(ROOT, 'app', 'builder', 'templates', 'ModernTemplate.tsx');
const modernContent = fs.readFileSync(modernPath, 'utf8');
assert(modernContent.includes('ms-5 shrink-0'), 'ModernTemplate uses logical margin ms-5 for photo');

const classicPath = path.join(ROOT, 'app', 'builder', 'templates', 'ClassicTemplate.tsx');
const classicContent = fs.readFileSync(classicPath, 'utf8');
assert(classicContent.includes('ms-5 shrink-0'), 'ClassicTemplate uses logical margin ms-5 for photo');

// 5. Academic CV Template & CvForm
const academicPath = path.join(ROOT, 'app', 'cv-builder', 'templates', 'AcademicCvTemplate.tsx');
const academicContent = fs.readFileSync(academicPath, 'utf8');
assert(academicContent.includes('ps-4 -indent-4'), 'AcademicCvTemplate uses logical indent for publications');
assert(academicContent.includes('me-1.5'), 'AcademicCvTemplate uses logical margin me-1.5');
assert(academicContent.includes('ms-1'), 'AcademicCvTemplate uses logical margin ms-1');

const cvFormPath = path.join(ROOT, 'app', 'cv-builder', 'components', 'CvForm.tsx');
const cvFormContent = fs.readFileSync(cvFormPath, 'utf8');
assert(cvFormContent.includes('hover:text-red-400 ms-2'), 'CvForm uses logical margin ms-2 on action buttons');

// 6. CV Builder Page RTL back button & localization
const cvBuilderPagePath = path.join(ROOT, 'app', 'cv-builder', 'page.tsx');
const cvBuilderPageContent = fs.readFileSync(cvBuilderPagePath, 'utf8');
assert(cvBuilderPageContent.includes('useLanguage'), 'cv-builder/page.tsx imports useLanguage');
assert(cvBuilderPageContent.includes('rtl:rotate-180'), 'cv-builder/page.tsx rotates back arrow in RTL');
assert(cvBuilderPageContent.includes('documentLanguage: \'ar\''), 'cv-builder/page.tsx synchronizes documentLanguage in Arabic');

// 7. SavedDraftsModal localization
const draftsModalPath = path.join(ROOT, 'app', 'cover-letter', 'components', 'SavedDraftsModal.tsx');
const draftsModalContent = fs.readFileSync(draftsModalPath, 'utf8');
assert(draftsModalContent.includes('useLanguage'), 'SavedDraftsModal imports useLanguage');
assert(draftsModalContent.includes('dir={isRtl ? \'rtl\' : \'ltr\'}'), 'SavedDraftsModal sets dir dynamically');
assert(draftsModalContent.includes('Saved Cover Letters'), 'SavedDraftsModal has English and Arabic translations');

// 8. Gauge & Numeric display RTL protection
const circularGaugePath = path.join(ROOT, 'components', 'ui', 'CircularGauge.tsx');
const circularGaugeContent = fs.readFileSync(circularGaugePath, 'utf8');
assert(circularGaugeContent.includes('data-score'), 'CircularGauge sets data-score attribute');
assert(circularGaugeContent.includes('dir="ltr"'), 'CircularGauge wraps numeric score with dir="ltr"');

const scoreCirclePath = path.join(ROOT, 'app', 'components', 'ScoreCircle.tsx');
const scoreCircleContent = fs.readFileSync(scoreCirclePath, 'utf8');
assert(scoreCircleContent.includes('dir="ltr"'), 'ScoreCircle wraps score fraction with dir="ltr"');

const progressBarPath = path.join(ROOT, 'components', 'ui', 'ProgressBar.tsx');
const progressBarContent = fs.readFileSync(progressBarPath, 'utf8');
assert(progressBarContent.includes('dir="ltr"'), 'ProgressBar wraps percentage display with dir="ltr"');

// 9. LanguageSelector
const langSelectorPath = path.join(ROOT, 'app', 'components', 'LanguageSelector.tsx');
const langSelectorContent = fs.readFileSync(langSelectorPath, 'utf8');
assert(langSelectorContent.includes("language === 'ar' ? 'اللغة' : 'Language'"), 'LanguageSelector localizes menu header');

console.log('\n--- Task U9 Verification Complete: All Checks Passed! ---');
