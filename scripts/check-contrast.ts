/**
 * Automated WCAG Contrast Ratio Checker for JobMatch AI Design Tokens
 * 
 * Verifies WCAG 2.1 AA requirements:
 * - Body text on paper/surface >= 4.5:1
 * - ink-3 on paper >= 4.5:1
 * - on-accent on accent >= 4.5:1
 * - accent on paper (links) >= 4.5:1
 * - danger/success/warning on their -soft backgrounds >= 4.5:1
 * - UI borders needed for inputs (line-strong on surface) >= 3:1
 */

interface ThemeTokens {
  paper: string;
  surface: string;
  surface2: string;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  lineStrong: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  onAccent: string;
  highlight: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  focus: string;
}

export const lightTokens: ThemeTokens = {
  paper: '#FAF8F4',
  surface: '#FFFFFF',
  surface2: '#F3F0EA',
  ink: '#14181F',
  ink2: '#4A5160',
  ink3: '#6B7280',
  line: '#E4DFD5',
  lineStrong: '#8E887C', // Tuned from #CFC8BA to guarantee >= 3.0:1 on #FFFFFF for inputs
  accent: '#0F5C4D',
  accentHover: '#0B4A3E',
  accentSoft: '#E3EFEA',
  onAccent: '#FFFFFF',
  highlight: '#C8892B',
  danger: '#B3261E',
  dangerSoft: '#FBEAE8',
  success: '#156E3F', // Tuned from #1B7F4B to guarantee >= 4.5:1 on #E4F3EA
  successSoft: '#E4F3EA',
  warning: '#9A5B00',
  warningSoft: '#FBF0DC',
  focus: '#0F5C4D',
};

export const darkTokens: ThemeTokens = {
  paper: '#0C100E',
  surface: '#151A18',
  surface2: '#1B221E',
  ink: '#EDEBE5',
  ink2: '#B4B9B3',
  ink3: '#8E948E',
  line: '#252F29',
  lineStrong: '#5A6E62',
  accent: '#3FB596',
  accentHover: '#5CC8AC',
  accentSoft: '#16302A',
  onAccent: '#08110E',
  highlight: '#E0A84A',
  danger: '#F87171',
  dangerSoft: '#3A1515',
  success: '#4ADE80',
  successSoft: '#143322',
  warning: '#FBBF24',
  warningSoft: '#362005',
  focus: '#5CC8AC',
};

export function getRelativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const [rLin, gLin, bLin] = [r, g, b].map((val) =>
    val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

interface CheckResult {
  theme: 'Light' | 'Dark';
  description: string;
  fg: string;
  bg: string;
  ratio: number;
  minRequired: number;
  passed: boolean;
}

export function runContrastChecks(): CheckResult[] {
  const checks: CheckResult[] = [];

  const addCheck = (
    theme: 'Light' | 'Dark',
    desc: string,
    fg: string,
    bg: string,
    minRequired: number
  ) => {
    const ratio = Number(getContrastRatio(fg, bg).toFixed(2));
    checks.push({
      theme,
      description: desc,
      fg,
      bg,
      ratio,
      minRequired,
      passed: ratio >= minRequired,
    });
  };

  // Light Theme Checks
  addCheck('Light', 'Body text (ink) on paper', lightTokens.ink, lightTokens.paper, 4.5);
  addCheck('Light', 'Body text (ink) on surface', lightTokens.ink, lightTokens.surface, 4.5);
  addCheck('Light', 'Secondary text (ink-2) on paper', lightTokens.ink2, lightTokens.paper, 4.5);
  addCheck('Light', 'Tertiary text (ink-3) on paper', lightTokens.ink3, lightTokens.paper, 4.5);
  addCheck('Light', 'On-accent on accent button', lightTokens.onAccent, lightTokens.accent, 4.5);
  addCheck('Light', 'Accent on paper (links)', lightTokens.accent, lightTokens.paper, 4.5);
  addCheck('Light', 'Danger on danger-soft', lightTokens.danger, lightTokens.dangerSoft, 4.5);
  addCheck('Light', 'Success on success-soft', lightTokens.success, lightTokens.successSoft, 4.5);
  addCheck('Light', 'Warning on warning-soft', lightTokens.warning, lightTokens.warningSoft, 4.5);
  addCheck('Light', 'Input border (line-strong) on surface', lightTokens.lineStrong, lightTokens.surface, 3.0);

  // Dark Theme Checks
  addCheck('Dark', 'Body text (ink) on paper', darkTokens.ink, darkTokens.paper, 4.5);
  addCheck('Dark', 'Body text (ink) on surface', darkTokens.ink, darkTokens.surface, 4.5);
  addCheck('Dark', 'Secondary text (ink-2) on paper', darkTokens.ink2, darkTokens.paper, 4.5);
  addCheck('Dark', 'Tertiary text (ink-3) on paper', darkTokens.ink3, darkTokens.paper, 4.5);
  addCheck('Dark', 'On-accent on accent button', darkTokens.onAccent, darkTokens.accent, 4.5);
  addCheck('Dark', 'Accent on paper (links)', darkTokens.accent, darkTokens.paper, 4.5);
  addCheck('Dark', 'Danger on danger-soft', darkTokens.danger, darkTokens.dangerSoft, 4.5);
  addCheck('Dark', 'Success on success-soft', darkTokens.success, darkTokens.successSoft, 4.5);
  addCheck('Dark', 'Warning on warning-soft', darkTokens.warning, darkTokens.warningSoft, 4.5);
  addCheck('Dark', 'Input border (line-strong) on surface', darkTokens.lineStrong, darkTokens.surface, 3.0);

  return checks;
}

export function printTable(results: CheckResult[]) {
  console.log('\n========================================================================================');
  console.log('                    JOBMATCH AI - DESIGN TOKEN WCAG CONTRAST AUDIT                       ');
  console.log('========================================================================================');
  console.log(
    'Theme'.padEnd(7) +
    ' | ' + 'Check Description'.padEnd(42) +
    ' | ' + 'FG / BG'.padEnd(19) +
    ' | ' + 'Ratio'.padEnd(8) +
    ' | ' + 'Min Req'.padEnd(8) +
    ' | ' + 'Status'
  );
  console.log('-'.repeat(88));

  let allPassed = true;
  for (const r of results) {
    const pair = `${r.fg} / ${r.bg}`;
    const status = r.passed ? '✓ PASS' : '✗ FAIL';
    if (!r.passed) allPassed = false;
    console.log(
      r.theme.padEnd(7) +
      ' | ' + r.description.padEnd(42) +
      ' | ' + pair.padEnd(19) +
      ' | ' + `${r.ratio}:1`.padEnd(8) +
      ' | ' + `${r.minRequired}:1`.padEnd(8) +
      ' | ' + status
    );
  }
  console.log('========================================================================================\n');
  return allPassed;
}

const results = runContrastChecks();
const ok = printTable(results);
if (!ok) {
  console.error('❌ Contrast check FAILED: One or more tokens do not meet WCAG AA requirements.\n');
  process.exit(1);
} else {
  console.log('✅ ALL CONTRAST CHECKS PASSED: Every token meets or exceeds required contrast ratios.\n');
}
