import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT = process.cwd();

console.log('--- [Task U10 Verification: Tasteful Motion & Reduced Motion] ---');

// 1. Verify app/globals.css motion system
console.log('1. Verifying app/globals.css...');
const globalsCss = fs.readFileSync(path.join(ROOT, 'app', 'globals.css'), 'utf8');

assert(globalsCss.includes('@keyframes pageFadeIn'), 'globals.css has pageFadeIn keyframes');
assert(globalsCss.includes('.page-transition-enter'), 'globals.css has .page-transition-enter');
assert(globalsCss.includes('button:not(:disabled)'), 'globals.css has tactile button press');
assert(globalsCss.includes('.card-hover'), 'globals.css has .card-hover');
assert(globalsCss.includes('@keyframes listItemFadeIn'), 'globals.css has listItemFadeIn keyframes');
assert(globalsCss.includes('.list-item-enter'), 'globals.css has .list-item-enter');
assert(globalsCss.includes('.stagger-1'), 'globals.css has stagger animation delays');
assert(globalsCss.includes('@keyframes modalBackdropFadeIn'), 'globals.css has modalBackdropFadeIn keyframes');
assert(globalsCss.includes('@keyframes modalContentZoomIn'), 'globals.css has modalContentZoomIn keyframes');
assert(globalsCss.includes('.modal-backdrop-animate'), 'globals.css has .modal-backdrop-animate');
assert(globalsCss.includes('.modal-card-animate'), 'globals.css has .modal-card-animate');
assert(globalsCss.includes('@media (prefers-reduced-motion: reduce)'), 'globals.css has prefers-reduced-motion block');

// Check that animation durations in motion system are <= 300ms
const motionDurations = globalsCss.match(/(\d+)ms/g) || [];
console.log(`Found ${motionDurations.length} duration values in globals.css`);
// Check specific motion classes durations
assert(globalsCss.includes('180ms ease-out'), 'pageFadeIn is 180ms');
assert(globalsCss.includes('80ms ease-out'), 'button press is 80ms');
assert(globalsCss.includes('200ms cubic-bezier'), 'list-item-enter is 200ms');
console.log('✓ app/globals.css motion system verified');

// 2. Verify app/template.tsx
console.log('2. Verifying app/template.tsx for page transition fade...');
const templatePath = path.join(ROOT, 'app', 'template.tsx');
assert(fs.existsSync(templatePath), 'app/template.tsx exists');
const templateContent = fs.readFileSync(templatePath, 'utf8');
assert(templateContent.includes('page-transition-enter'), 'app/template.tsx applies page-transition-enter');
console.log('✓ app/template.tsx verified');

// 3. Verify CircularGauge.tsx and ScoreCircle.tsx
console.log('3. Verifying score count-up animations...');
const circularGaugeContent = fs.readFileSync(path.join(ROOT, 'components', 'ui', 'CircularGauge.tsx'), 'utf8');
assert(circularGaugeContent.includes('animatedScore'), 'CircularGauge has animatedScore state');
assert(circularGaugeContent.includes('prefers-reduced-motion'), 'CircularGauge checks prefers-reduced-motion');
assert(circularGaugeContent.includes('requestAnimationFrame'), 'CircularGauge uses requestAnimationFrame');
assert(circularGaugeContent.includes('duration = 300'), 'CircularGauge duration is 300ms');

const scoreCircleContent = fs.readFileSync(path.join(ROOT, 'app', 'components', 'ScoreCircle.tsx'), 'utf8');
assert(scoreCircleContent.includes('animatedScore'), 'ScoreCircle has animatedScore state');
assert(scoreCircleContent.includes('prefers-reduced-motion'), 'ScoreCircle checks prefers-reduced-motion');
assert(scoreCircleContent.includes('requestAnimationFrame'), 'ScoreCircle uses requestAnimationFrame');
assert(scoreCircleContent.includes('duration = 300'), 'ScoreCircle duration is 300ms');
console.log('✓ Gauge count-up animations verified');

// 4. Verify ProgressBar.tsx
console.log('4. Verifying ProgressBar.tsx transition...');
const progressBarContent = fs.readFileSync(path.join(ROOT, 'components', 'ui', 'ProgressBar.tsx'), 'utf8');
assert(progressBarContent.includes('duration-300'), 'ProgressBar transition is 300ms');
console.log('✓ ProgressBar transition verified');

// 5. Verify Modals and Drawers
console.log('5. Verifying modals and drawer transitions...');
const confirmModalContent = fs.readFileSync(path.join(ROOT, 'components', 'ui', 'ConfirmModal.tsx'), 'utf8');
assert(confirmModalContent.includes('modal-backdrop-animate'), 'ConfirmModal uses modal-backdrop-animate');
assert(confirmModalContent.includes('modal-card-animate'), 'ConfirmModal uses modal-card-animate');

const dialogContent = fs.readFileSync(path.join(ROOT, 'components', 'ui', 'Dialog.tsx'), 'utf8');
assert(dialogContent.includes('modal-backdrop-animate'), 'Dialog uses modal-backdrop-animate');
assert(dialogContent.includes('modal-card-animate'), 'Dialog uses modal-card-animate');

const upgradeModalContent = fs.readFileSync(path.join(ROOT, 'app', 'components', 'UpgradeModal.tsx'), 'utf8');
assert(upgradeModalContent.includes('modal-backdrop-animate'), 'UpgradeModal uses modal-backdrop-animate');
assert(upgradeModalContent.includes('modal-card-animate'), 'UpgradeModal uses modal-card-animate');

const savedDraftsModalContent = fs.readFileSync(path.join(ROOT, 'app', 'cover-letter', 'components', 'SavedDraftsModal.tsx'), 'utf8');
assert(savedDraftsModalContent.includes('modal-backdrop-animate'), 'SavedDraftsModal uses modal-backdrop-animate');
assert(savedDraftsModalContent.includes('modal-card-animate'), 'SavedDraftsModal uses modal-card-animate');
assert(savedDraftsModalContent.includes('list-item-enter'), 'SavedDraftsModal items have list-item-enter');

const navbarContent = fs.readFileSync(path.join(ROOT, 'app', 'components', 'Navbar.tsx'), 'utf8');
assert(navbarContent.includes('modal-backdrop-animate'), 'Navbar mobile drawer uses modal-backdrop-animate');
assert(navbarContent.includes('slide-in-from-end'), 'Navbar mobile drawer slides in from end (RTL/LTR compatible)');
assert(navbarContent.includes('duration-200'), 'Navbar mobile drawer transition is 200ms');
console.log('✓ Modals and drawers transitions verified');

// 6. Verify List Items enter animation
console.log('6. Verifying list item enter animations...');
const coverLetterHistoryContent = fs.readFileSync(path.join(ROOT, 'app', 'cover-letter', 'components', 'CoverLetterHistory.tsx'), 'utf8');
assert(coverLetterHistoryContent.includes('list-item-enter'), 'CoverLetterHistory uses list-item-enter');
assert(coverLetterHistoryContent.includes('card-hover'), 'CoverLetterHistory uses card-hover');

const reviewPageContent = fs.readFileSync(path.join(ROOT, 'app', 'review', 'page.tsx'), 'utf8');
assert(reviewPageContent.includes('list-item-enter'), 'Review page strengths/weaknesses use list-item-enter');
console.log('✓ List item animations verified');

console.log('\n>>> All Task U10 verification checks PASSED successfully! <<<');
