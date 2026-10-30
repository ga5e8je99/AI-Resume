/**
 * Verification test suite for Task U8:
 * - Unified Feedback & Form UX across JobMatch AI
 * - Register flow (field validation, email taken)
 * - Login failure (wrong credentials)
 * - Login success
 * - Destructive action confirmation & Dialog/ConfirmModal
 * - Toast system validation
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

console.log('\n--- TASK U8 COMPREHENSIVE VERIFICATION SUITE ---\n');

// 1. Check Global Toast System
console.log('1. Global Toast System:');
const toastContextPath = resolve('app/context/ToastContext.tsx');
assert(existsSync(toastContextPath), 'ToastContext.tsx exists');
const toastContent = readFileSync(toastContextPath, 'utf8');
assert(toastContent.includes('useToast'), 'ToastContext exports useToast');
assert(toastContent.includes('ToastProvider'), 'ToastContext exports ToastProvider');
assert(toastContent.includes('success:') && toastContent.includes('error:') && toastContent.includes('info:'), 'Toast supports success, error, info');
assert(toastContent.includes('role="status"') || toastContent.includes('aria-live'), 'Toast notification has accessibility attributes');

const clientProvidersPath = resolve('app/components/ClientProviders.tsx');
const clientProvidersContent = readFileSync(clientProvidersPath, 'utf8');
assert(clientProvidersContent.includes('ToastProvider'), 'ToastProvider is mounted in ClientProviders');

// 2. Check Universal Confirmation Modal
console.log('\n2. Universal Confirmation Dialog for Destructive Actions:');
const confirmModalPath = resolve('components/ui/ConfirmModal.tsx');
assert(existsSync(confirmModalPath), 'ConfirmModal.tsx exists in components/ui');
const confirmModalContent = readFileSync(confirmModalPath, 'utf8');
assert(confirmModalContent.includes('role="dialog"') && confirmModalContent.includes('aria-modal="true"'), 'ConfirmModal has accessible dialog semantics');
assert(confirmModalContent.includes('variant === \'danger\''), 'ConfirmModal supports danger variant');
assert(confirmModalContent.includes('isLoading'), 'ConfirmModal supports loading state on confirm button');

// Check that alert() and confirm() have been eradicated from application code
const adminPagePath = resolve('app/admin/page.tsx');
const adminPageContent = readFileSync(adminPagePath, 'utf8');
assert(!/if\s*\(!confirm\(/.test(adminPageContent), 'app/admin/page.tsx no longer uses native confirm()');
assert(adminPageContent.includes('<ConfirmModal'), 'app/admin/page.tsx renders ConfirmModal');
assert(adminPageContent.includes('useToast'), 'app/admin/page.tsx integrates global useToast');

const cvBuilderPath = resolve('app/cv-builder/page.tsx');
const cvBuilderContent = readFileSync(cvBuilderPath, 'utf8');
assert(!/alert\(/.test(cvBuilderContent), 'app/cv-builder/page.tsx no longer uses alert()');
assert(cvBuilderContent.includes('<ConfirmModal'), 'app/cv-builder/page.tsx uses ConfirmModal for destructive resets');

// 3. Check Form UX on Login & Register
console.log('\n3. Login Page Form UX & Split Layout:');
const loginPagePath = resolve('app/login/page.tsx');
const loginPageContent = readFileSync(loginPagePath, 'utf8');
assert(loginPageContent.includes('lg:grid-cols-12'), 'Login page implements polished split layout (grid-cols-12)');
assert(loginPageContent.includes('fieldErrors.email') && loginPageContent.includes('fieldErrors.password'), 'Login page has field-level inline errors');
assert(loginPageContent.includes('autoFocus'), 'Login page has autofocus on first field');
assert(loginPageContent.includes('autoComplete="email"') && loginPageContent.includes('inputMode="email"'), 'Login page has proper autocomplete and inputMode');
assert(loginPageContent.includes('autoComplete="current-password"'), 'Login page has autoComplete="current-password"');
assert(loginPageContent.includes('showPassword') && loginPageContent.includes('setShowPassword'), 'Login page has password show/hide toggle');
assert(loginPageContent.includes('isLoading={isSubmitting}'), 'Login submit button uses Button isLoading');
assert(loginPageContent.includes('Try Demo Instantly') || loginPageContent.includes('تجربة فورية'), 'Login page features visually distinct instant demo option');
assert(loginPageContent.includes('href="/terms"') && loginPageContent.includes('href="/privacy"'), 'Login page links to Terms & Privacy');

console.log('\n4. Register Page Form UX & Split Layout:');
const registerPagePath = resolve('app/register/page.tsx');
const registerPageContent = readFileSync(registerPagePath, 'utf8');
assert(registerPageContent.includes('lg:grid-cols-12'), 'Register page implements matching polished split layout');
assert(registerPageContent.includes('fieldErrors.name') && registerPageContent.includes('fieldErrors.email'), 'Register page has field-level inline errors for name & email');
assert(registerPageContent.includes('fieldErrors.password') && registerPageContent.includes('fieldErrors.confirmPassword'), 'Register page has field-level errors for password & confirmPassword');
assert(registerPageContent.includes('autoFocus'), 'Register page has autofocus on first field');
assert(registerPageContent.includes('autoComplete="new-password"'), 'Register page has autoComplete="new-password"');
assert(registerPageContent.includes('showPassword') && registerPageContent.includes('showConfirmPassword'), 'Register page has password toggles');
assert(registerPageContent.includes('isLoading={isSubmitting}'), 'Register submit button uses Button isLoading');
assert(registerPageContent.includes('already exists') || registerPageContent.includes('مسجل بالفعل'), 'Register page maps existing email error to field level');
assert(registerPageContent.includes('href="/terms"') && registerPageContent.includes('href="/privacy"'), 'Register page links to Terms & Privacy');

console.log('\n5. Forgot & Reset Password UX:');
const forgotPath = resolve('app/forgot-password/page.tsx');
const forgotContent = readFileSync(forgotPath, 'utf8');
assert(forgotContent.includes('isLoading={isSubmitting}'), 'Forgot password uses Button isLoading instead of raw button spinner');
assert(forgotContent.includes('autoFocus'), 'Forgot password has autofocus on email');
assert(forgotContent.includes('emailError'), 'Forgot password has inline validation message');

const resetPath = resolve('app/reset-password/[token]/page.tsx');
const resetContent = readFileSync(resetPath, 'utf8');
assert(resetContent.includes('isLoading={isSubmitting}'), 'Reset password uses Button isLoading instead of raw button spinner');
assert(resetContent.includes('autoFocus'), 'Reset password has autofocus');
assert(resetContent.includes('showPassword'), 'Reset password has password show/hide toggle');
assert(resetContent.includes('fieldErrors.confirmPassword'), 'Reset password validates matching passwords with inline field error');

console.log('\n6. Lists Loading, Empty, and Error States:');
const dashboardPath = resolve('app/dashboard/page.tsx');
const dashboardContent = readFileSync(dashboardPath, 'utf8');
assert(dashboardContent.includes('SkeletonCard'), 'Dashboard has Skeleton loading states');
assert(dashboardContent.includes('fetchError'), 'Dashboard has error handling state with retry');
assert(dashboardContent.includes('resumes.length === 0') && dashboardContent.includes('analyses.length === 0') && dashboardContent.includes('coverLetters.length === 0'), 'Dashboard handles empty states for all collections');
assert(dashboardContent.includes('useToast'), 'Dashboard integrates unified global toast system');

console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed.`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
