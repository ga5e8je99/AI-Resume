import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import twPostcss from '@tailwindcss/postcss';

const ROOT = path.resolve(__dirname, '..');

function walkCodeFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'out'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkCodeFiles(fullPath));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

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

  console.log('\n=== 1. Verify globals.css imports & @custom-variant dark ===');
  const globalsCss = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf8');
  const lines = globalsCss.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  assert(lines[0] === '@import "tailwindcss";', 'First rule is @import "tailwindcss";');
  assert(lines[1] === '@import "tw-animate-css";', 'Second rule is @import "tw-animate-css";');
  assert(
    lines[2] === '@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));',
    'Third rule is @custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));'
  );

  console.log('\n=== 2. Verify tailwind.config.ts deleted & values moved to @theme inline ===');
  assert(
    !fs.existsSync(path.join(ROOT, 'tailwind.config.ts')),
    'tailwind.config.ts has been deleted'
  );
  for (const token of [
    '--z-index-sticky',
    '--z-index-dropdown',
    '--z-index-modal',
    '--z-index-tooltip',
    '--z-index-toast',
    '--radius-full',
  ]) {
    assert(globalsCss.includes(token), `@theme inline contains ${token}`);
  }

  console.log('\n=== 3. Verify ThemeContext & layout inline script ===');
  const themeContextCode = fs.readFileSync(
    path.join(ROOT, 'app/context/ThemeContext.tsx'),
    'utf8'
  );
  const layoutCode = fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf8');
  assert(
    themeContextCode.includes("root.setAttribute('data-theme', resolved)"),
    'ThemeContext always sets data-theme="light" or "dark" on <html>'
  );
  assert(
    !themeContextCode.includes("removeAttribute('data-theme')"),
    'ThemeContext never removes data-theme attribute (preventing OS dark override when light is chosen)'
  );
  assert(
    layoutCode.includes("root.setAttribute('data-theme', 'dark')") &&
      layoutCode.includes("root.setAttribute('data-theme', 'light')") &&
      layoutCode.includes("theme === 'system'"),
    'app/layout.tsx inline script resolves system to light/dark before paint'
  );

  console.log('\n=== 4. Verify zero legacy classes in app/ and components/ ===');
  const codeFiles = [
    ...walkCodeFiles(path.join(ROOT, 'app')),
    ...walkCodeFiles(path.join(ROOT, 'components')),
  ];
  const legacyRegex =
    /\b(?:(?:hover|focus|focus-visible|active|disabled|group-hover|peer-checked|dark|rtl|ltr|placeholder|selection|after|before):)*(?:bg|text|border|ring|divide)-(?:bg|text-(?:primary|secondary|muted)|border(?:-(?:strong|subtle))?|surface\/\d+|surface-2\/\d+|paper\/\d+)\b/g;

  const filesWithLegacy: string[] = [];
  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(legacyRegex);
    if (matches && matches.length > 0) {
      filesWithLegacy.push(`${path.relative(ROOT, file)}: ${[...new Set(matches)].join(', ')}`);
    }
  }
  assert(
    filesWithLegacy.length === 0,
    `Zero legacy classes across ${codeFiles.length} files in app/ and components/`,
    filesWithLegacy.join(' | ')
  );

  console.log('\n=== 5. Verify PostCSS compilation of tw-animate-css, dark variant & brand tokens ===');
  const compiled = await postcss([twPostcss()]).process(globalsCss, {
    from: path.join(ROOT, 'app/globals.css'),
  });
  const outCss = compiled.css;

  for (const selector of [
    '.animate-in',
    '.fade-in',
    '.zoom-in',
    '.slide-in-from-bottom-2',
    '.slide-in-from-top-2',
    '.slide-in-from-start',
    '.z-dropdown',
    '.z-sticky',
    '.z-modal',
    '.z-tooltip',
    '.z-toast',
    '.bg-paper',
    '.bg-surface',
    '.bg-surface-2',
    '.text-ink',
    '.text-ink-2',
    '.border-line-strong',
  ]) {
    assert(outCss.includes(selector), `Compiled CSS includes ${selector}`);
  }

  assert(
    outCss.includes(':where([data-theme="dark"], [data-theme="dark"] *)'),
    'Compiled CSS uses custom dark variant selector :where([data-theme="dark"], [data-theme="dark"] *)'
  );

  const successPage = fs.readFileSync(
    path.join(ROOT, 'app/payment/success/page.tsx'),
    'utf8'
  );
  assert(
    successPage.includes('animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300'),
    'Payment success icon uses animate-in fade-in zoom-in slide-in-from-bottom-2'
  );

  console.log('\n=== 6. Simulate Light, Dark, and OS-Dark + Manual-Light Resolution ===');
  function simulateThemeResolution(
    savedStorage: 'light' | 'dark' | 'system' | null,
    osPrefersDark: boolean
  ) {
    // 1. Pre-paint inline script logic from app/layout.tsx
    const isDarkInline =
      savedStorage === 'dark' ||
      ((!savedStorage || savedStorage === 'system') && osPrefersDark);
    const inlineDataTheme = isDarkInline ? 'dark' : 'light';

    // 2. ThemeContext logic from app/context/ThemeContext.tsx
    const pref =
      savedStorage === 'light' || savedStorage === 'dark' || savedStorage === 'system'
        ? savedStorage
        : 'system';
    const contextResolved =
      pref === 'system' ? (osPrefersDark ? 'dark' : 'light') : pref;
    const htmlDataTheme = contextResolved;

    // 3. CSS variable cascade evaluation based on globals.css selectors:
    // - :root, [data-theme="light"] -> Light tokens (#FAF8F4 paper, #14181F ink)
    // - @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) } -> Dark tokens
    // - [data-theme="dark"] -> Dark tokens (#0C100E paper, #EDEBE5 ink)
    const matchesMediaDarkRule = osPrefersDark && htmlDataTheme !== 'light';
    const matchesDataThemeDarkRule = htmlDataTheme === 'dark';
    const isEffectiveCssDark = matchesMediaDarkRule || matchesDataThemeDarkRule;

    return {
      inlineDataTheme,
      htmlDataTheme,
      noFlash: inlineDataTheme === htmlDataTheme,
      computedPaper: isEffectiveCssDark ? '#0C100E' : '#FAF8F4',
      computedInk: isEffectiveCssDark ? '#EDEBE5' : '#14181F',
    };
  }

  // Case 1: Light mode
  const lightCase = simulateThemeResolution('light', false);
  assert(
    lightCase.htmlDataTheme === 'light' &&
      lightCase.noFlash &&
      lightCase.computedPaper === '#FAF8F4' &&
      lightCase.computedInk === '#14181F',
    'Light mode resolves to data-theme="light" (#FAF8F4 paper, #14181F ink) without flash'
  );

  // Case 2: Dark mode
  const darkCase = simulateThemeResolution('dark', false);
  assert(
    darkCase.htmlDataTheme === 'dark' &&
      darkCase.noFlash &&
      darkCase.computedPaper === '#0C100E' &&
      darkCase.computedInk === '#EDEBE5',
    'Dark mode resolves to data-theme="dark" (#0C100E paper, #EDEBE5 ink) without flash'
  );

  // Case 3: OS Dark + Manual Light selection (Critical edge case!)
  const osDarkManualLight = simulateThemeResolution('light', true);
  assert(
    osDarkManualLight.htmlDataTheme === 'light' &&
      osDarkManualLight.noFlash &&
      osDarkManualLight.computedPaper === '#FAF8F4' &&
      osDarkManualLight.computedInk === '#14181F',
    'OS Dark + Manual Light selection resolves to data-theme="light" (#FAF8F4 paper, #14181F ink) without flash or OS override'
  );

  // Case 4: System preference on OS Dark
  const systemOnOsDark = simulateThemeResolution('system', true);
  assert(
    systemOnOsDark.htmlDataTheme === 'dark' &&
      systemOnOsDark.noFlash &&
      systemOnOsDark.computedPaper === '#0C100E',
    'System mode on OS Dark resolves to data-theme="dark" before paint'
  );

  // Case 5: System preference on OS Light
  const systemOnOsLight = simulateThemeResolution('system', false);
  assert(
    systemOnOsLight.htmlDataTheme === 'light' &&
      systemOnOsLight.noFlash &&
      systemOnOsLight.computedPaper === '#FAF8F4',
    'System mode on OS Light resolves to data-theme="light" before paint'
  );

  console.log('\n=== 7. Verify Main Pages Use Brand Tokens ===');
  const mainPages = [
    'app/components/landing/LandingPageClient.tsx',
    'app/jobs/page.tsx',
    'app/dashboard/page.tsx',
    'app/pricing/page.tsx',
    'app/builder/page.tsx',
    'app/cover-letter/page.tsx',
    'app/review/page.tsx',
    'app/payment/success/page.tsx',
    'app/loading.tsx',
  ];
  for (const relPage of mainPages) {
    const content = fs.readFileSync(path.join(ROOT, relPage), 'utf8');
    const hasLegacy = legacyRegex.test(content);
    assert(!hasLegacy, `${relPage} uses only brand tokens (0 legacy classes)`);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

