'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/Logo';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import { Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft, Star, FileText } from 'lucide-react';
import { trackDemoStarted } from '@/lib/analytics';
import { Button } from '../components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const { user, login, loginDemo } = useAuth();
  const { isRtl, language, t } = useLanguage();
  const isAr = language === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Field-level errors & general errors
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      router.push(returnUrl);
    }
  }, [user, returnUrl, router]);

  // Autofocus on first field
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = t('auth_err_email_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = t('auth_err_email_invalid');
    }

    if (!password) {
      errors.password = t('auth_err_password_required');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        router.push(returnUrl);
      } else {
        const errorMsg = result.error || t('auth_err_login_failed');
        
        // Map to field-level error if credential issue
        if (/invalid|password|credentials|wrong/i.test(errorMsg)) {
          setFieldErrors({
            password: t('auth_err_login_failed'),
          });
        }
        setGeneralError(errorMsg);
      }
    } catch (err: any) {
      setGeneralError(err?.message || t('auth_err_unexpected'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setGeneralError(null);
    setFieldErrors({});
    setIsDemoSubmitting(true);

    try {
      const result = await loginDemo();
      if (result.success) {
        trackDemoStarted();
        router.push(returnUrl);
      } else {
        setGeneralError(result.error || t('auth_err_unexpected'));
      }
    } catch (err: any) {
      setGeneralError(err?.message || t('auth_err_unexpected'));
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] bg-paper text-ink flex flex-col lg:grid lg:grid-cols-12 selection:bg-accent-soft selection:text-ink relative"
    >
      {/* LEFT / FORM PANEL (Cols 1-12 on mobile, 5 or 6 on desktop) */}
      <main id="main-content" className="lg:col-span-7 xl:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-screen">
        {/* Top Navbar: Brand & Controls */}
        <header className="flex items-center justify-between gap-4">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <LanguageSelector variant="compact" />
          </div>
        </header>

        {/* Center: Auth Form Container */}
        <div className="w-full max-w-[420px] mx-auto py-8">
          {/* Header */}
          <div className="mb-6 space-y-1.5 text-start">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {t('auth_login_title')}
            </h1>
            <p className="text-xs sm:text-sm text-ink-2">
              {t('auth_login_subtitle')}
            </p>
          </div>

          {/* General alert error banner */}
          {generalError && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-[8px] bg-danger-soft border border-danger/30 flex items-start gap-2.5 text-xs text-danger animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <span>{generalError}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1 text-start">
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-ink uppercase tracking-wide"
              >
                {t('auth_login_email')}
                <span className="text-danger ms-1" aria-hidden="true">*</span>
              </label>
              <input
                ref={emailInputRef}
                id="login-email"
                type="email"
                name="email"
                required
                autoFocus
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                placeholder="name@example.com"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                className={`w-full rounded-[6px] border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-3/60 transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                  fieldErrors.email
                    ? 'border-danger focus-visible:ring-danger'
                    : 'border-line hover:border-line-strong focus-visible:ring-accent focus-visible:border-accent'
                }`}
              />
              {fieldErrors.email && (
                <p
                  id="login-email-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-xs text-danger font-medium mt-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1 text-start">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-ink uppercase tracking-wide"
                >
                  {t('auth_login_password')}
                  <span className="text-danger ms-1" aria-hidden="true">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-accent hover:underline font-medium transition-colors"
                >
                  {t('auth_login_forgot')}
                </Link>
              </div>

              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                  className={`w-full rounded-[6px] border bg-surface px-3 py-2.5 pe-10 text-sm text-ink placeholder:text-ink-3/60 transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                    fieldErrors.password
                      ? 'border-danger focus-visible:ring-danger'
                      : 'border-line hover:border-line-strong focus-visible:ring-accent focus-visible:border-accent'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? t('auth_hide_password') : t('auth_show_password')}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1 cursor-pointer transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {fieldErrors.password && (
                <p
                  id="login-password-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-xs text-danger font-medium mt-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={isSubmitting || isDemoSubmitting}
              className="w-full mt-2 font-medium"
            >
              {isSubmitting ? t('auth_login_submitting') : t('auth_login_submit')}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-line w-full" />
            <span className="bg-paper px-3 text-[11px] font-mono uppercase text-ink-3 tracking-wider">
              {t('auth_login_or_demo')}
            </span>
            <div className="border-t border-line w-full" />
          </div>

          {/* Visually Distinct "Try Demo Instantly" Option */}
          <div className="p-3.5 rounded-[10px] border-2 border-accent/40 bg-accent-soft/40 hover:bg-accent-soft/70 transition-all text-start relative group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                <Sparkles className="w-4 h-4 shrink-0 text-accent animate-pulse" />
                <span>{t('auth_login_demo_btn')}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
                {t('auth_one_click_ready')}
              </span>
            </div>
            <p className="text-[11px] text-ink-2 mb-3 leading-relaxed">
              {t('auth_login_demo_hint')}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="md"
              isLoading={isDemoSubmitting}
              disabled={isSubmitting || isDemoSubmitting}
              onClick={handleDemoLogin}
              className="w-full border-accent/40 hover:border-accent text-accent font-semibold"
            >
              {t('auth_login_demo_btn')}
            </Button>
          </div>

          {/* Register Link */}
          <div className="pt-4 mt-4 border-t border-line text-center text-xs text-ink-2">
            {t('auth_login_no_account')}{' '}
            <Link
              href={`/register${returnUrl !== '/dashboard' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
              className="font-semibold text-accent hover:underline"
            >
              {t('auth_login_signup_link')}
            </Link>
          </div>
        </div>

        {/* Footer: Legal & Back link */}
        <footer className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-3 gap-2 border-t border-line/60">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-ink transition-colors"
          >
            <BackIcon className="w-3.5 h-3.5" />
            <span>{t('common_back')}</span>
          </Link>
          <div className="flex items-center gap-3 text-[11px]">
            <Link href="/terms" className="hover:text-ink underline transition-colors">
              {t('footer_terms')}
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-ink underline transition-colors">
              {t('footer_privacy')}
            </Link>
          </div>
        </footer>
      </main>

      {/* RIGHT / SHOWCASE PANEL (hidden on mobile, visible on desktop) */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 bg-surface border-s border-line flex-col justify-between p-10 xl:p-14 relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 end-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 start-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Top Tagline */}
        <div className="relative z-10 text-start">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-surface-2/80 text-xs font-medium text-ink-2 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>{t('footer_client_privacy')}</span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-ink leading-tight">
            {t('auth_login_trust_banner_title')}
          </h2>
        </div>

        {/* Center Mockup Card: ATS Preview */}
        <div className="relative z-10 my-8 max-w-[460px] w-full mx-auto">
          <div className="rounded-[12px] border border-line bg-surface-2/90 p-5 shadow-card space-y-4 backdrop-blur-sm">
            {/* Header of Mock Card */}
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold text-xs">
                  ATS
                </div>
                <div>
                  <div className="text-xs font-semibold text-ink">
                    {t('review_upload_title')}
                  </div>
                  <div className="text-[11px] text-ink-3">
                    Workday, Taleo, Greenhouse
                  </div>
                </div>
              </div>
              <div className="text-end">
                <span className="text-xl font-bold font-serif text-emerald-500">94</span>
                <span className="text-[10px] text-ink-3">/100</span>
              </div>
            </div>

            {/* Checklist highlights */}
            <div className="space-y-2 text-xs text-ink-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('auth_login_trust_feature1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('auth_login_trust_feature2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('auth_login_trust_feature3')}</span>
              </div>
            </div>

            {/* Live Pill tags */}
            <div className="pt-2 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-ink-2">
                {t('auth_pdf_vector')}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-ink-2">
                {t('auth_editable_docx')}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-ink-2">
                {t('auth_instant_rtl_ltr')}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof / Testimonial */}
        <div className="relative z-10 pt-4 border-t border-line/60 text-start space-y-2">
          <div className="flex items-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
            <span className="text-xs font-mono font-semibold text-ink ms-1.5">4.9 / 5.0</span>
          </div>
          <p className="text-xs text-ink-2 italic">
            {t('auth_login_quote')}
          </p>
          <div className="text-[11px] text-ink-3">
            — {t('auth_login_quote_author')}
          </div>
        </div>
      </div>
    </div>
  );
}
