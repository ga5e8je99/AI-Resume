'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/Logo';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import { Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft, Star, FileCheck, Layers } from 'lucide-react';
import { trackSignupCompleted, trackDemoStarted } from '@/lib/analytics';
import { Button } from '../components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const { user, register, loginDemo } = useAuth();
  const { isRtl, language, t } = useLanguage();
  const isAr = language === 'ar';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field-level errors & general error
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      router.push(returnUrl);
    }
  }, [user, returnUrl, router]);

  // Autofocus on first field
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const validate = (): boolean => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = t('auth_err_name_required');
    } else if (trimmedName.length < 2) {
      errors.name = t('auth_err_name_min');
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = t('auth_err_email_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = t('auth_err_email_invalid');
    }

    if (!password) {
      errors.password = t('auth_err_password_required');
    } else if (password.length < 6) {
      errors.password = t('auth_err_password_min');
    }

    if (!confirmPassword) {
      errors.confirmPassword = t('auth_err_password_required');
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t('auth_err_passwords_mismatch');
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
      const result = await register(name.trim(), email.trim(), password);
      if (result.success) {
        trackSignupCompleted('free');
        router.push(returnUrl);
      } else {
        const errorMsg = result.error || t('auth_err_unexpected');
        
        // Map server error to specific fields
        if (/already exists|مسجل مسبقاً|already registered/i.test(errorMsg)) {
          setFieldErrors((prev) => ({
            ...prev,
            email: t('auth_err_email_invalid'),
          }));
        } else if (/password/i.test(errorMsg)) {
          setFieldErrors((prev) => ({
            ...prev,
            password: errorMsg,
          }));
        } else {
          setGeneralError(errorMsg);
        }
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
      {/* LEFT / FORM PANEL */}
      <main id="main-content" className="lg:col-span-7 xl:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-screen">
        {/* Top Navbar */}
        <header className="flex items-center justify-between gap-4">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <LanguageSelector variant="compact" />
          </div>
        </header>

        {/* Center Form Container */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-6">
          {/* Header */}
          <div className="mb-5 space-y-1.5 text-start">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {t('auth_register_title')}
            </h1>
            <p className="text-xs sm:text-sm text-ink-2">
              {t('auth_register_subtitle')}
            </p>
          </div>

          {/* General Alert */}
          {generalError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-[8px] bg-danger-soft border border-danger/30 flex items-start gap-2.5 text-xs text-danger animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {/* Full Name Field */}
            <div className="space-y-1 text-start">
              <label
                htmlFor="reg-name"
                className="block text-xs font-semibold text-ink uppercase tracking-wide"
              >
                {t('auth_register_name')}
                <span className="text-danger ms-1" aria-hidden="true">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="reg-name"
                name="name"
                type="text"
                required
                autoFocus
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                placeholder="Alex Johnson"
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? 'reg-name-error' : undefined}
                className={`w-full rounded-[6px] border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3/60 transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                  fieldErrors.name
                    ? 'border-danger focus-visible:ring-danger'
                    : 'border-line hover:border-line-strong focus-visible:ring-accent focus-visible:border-accent'
                }`}
              />
              {fieldErrors.name && (
                <p
                  id="reg-name-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-xs text-danger font-medium mt-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{fieldErrors.name}</span>
                </p>
              )}
            </div>

            {/* Email Address Field */}
            <div className="space-y-1 text-start">
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold text-ink uppercase tracking-wide"
              >
                {t('auth_login_email')}
                <span className="text-danger ms-1" aria-hidden="true">*</span>
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                required
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
                aria-describedby={fieldErrors.email ? 'reg-email-error' : undefined}
                className={`w-full rounded-[6px] border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3/60 transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                  fieldErrors.email
                    ? 'border-danger focus-visible:ring-danger'
                    : 'border-line hover:border-line-strong focus-visible:ring-accent focus-visible:border-accent'
                }`}
              />
              {fieldErrors.email && (
                <div
                  id="reg-email-error"
                  role="alert"
                  className="flex items-center justify-between gap-1.5 text-xs text-danger font-medium mt-1"
                >
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{fieldErrors.email}</span>
                  </div>
                  {fieldErrors.email.includes('already exists') || fieldErrors.email.includes('مسجل بالفعل') ? (
                    <Link
                      href={`/login?email=${encodeURIComponent(email)}`}
                      className="text-accent underline font-semibold ms-2 hover:opacity-80"
                    >
                      {t('nav_login')} →
                    </Link>
                  ) : null}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1 text-start">
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold text-ink uppercase tracking-wide"
              >
                {t('auth_login_password')}
                <span className="text-danger ms-1" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'reg-password-error' : undefined}
                  className={`w-full rounded-[6px] border bg-surface px-3 py-2 pe-10 text-sm text-ink placeholder:text-ink-3/60 transition-colors focus-visible:outline-none focus-visible:ring-2 ${
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
                  id="reg-password-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-xs text-danger font-medium mt-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1 text-start">
              <label
                htmlFor="reg-confirm-password"
                className="block text-xs font-semibold text-ink uppercase tracking-wide"
              >
                {t('auth_register_confirm_password')}
                <span className="text-danger ms-1" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={fieldErrors.confirmPassword ? 'reg-confirm-error' : undefined}
                  className={`w-full rounded-[6px] border bg-surface px-3 py-2 pe-10 text-sm text-ink placeholder:text-ink-3/60 transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                    fieldErrors.confirmPassword
                      ? 'border-danger focus-visible:ring-danger'
                      : 'border-line hover:border-line-strong focus-visible:ring-accent focus-visible:border-accent'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? t('auth_hide_password') : t('auth_show_password')}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1 cursor-pointer transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p
                  id="reg-confirm-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-xs text-danger font-medium mt-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{fieldErrors.confirmPassword}</span>
                </p>
              )}
            </div>

            {/* Terms & Privacy Agreement Notice */}
            <p className="text-[11px] text-ink-3 leading-relaxed text-start pt-1">
              {t('auth_register_terms_notice')}
            </p>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={isSubmitting || isDemoSubmitting}
              className="w-full mt-2 font-medium"
            >
              {isSubmitting ? t('auth_register_submitting') : t('auth_register_submit')}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-line w-full" />
            <span className="bg-paper px-3 text-[11px] font-mono uppercase text-ink-3 tracking-wider">
              {t('auth_login_or_demo')}
            </span>
            <div className="border-t border-line w-full" />
          </div>

          {/* Visually Distinct "Try Demo Instantly" Option */}
          <div className="p-3 rounded-[10px] border-2 border-accent/40 bg-accent-soft/40 hover:bg-accent-soft/70 transition-all text-start relative group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                <Sparkles className="w-4 h-4 shrink-0 text-accent animate-pulse" />
                <span>{t('auth_login_demo_btn')}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
                {t('auth_one_click_ready')}
              </span>
            </div>
            <p className="text-[11px] text-ink-2 mb-2 leading-relaxed">
              {t('auth_login_demo_hint')}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={isDemoSubmitting}
              disabled={isSubmitting || isDemoSubmitting}
              onClick={handleDemoLogin}
              className="w-full border-accent/40 hover:border-accent text-accent font-semibold text-xs py-2"
            >
              {t('auth_login_demo_btn')}
            </Button>
          </div>

          {/* Login Link */}
          <div className="pt-3 mt-3 border-t border-line text-center text-xs text-ink-2">
            {t('auth_register_have_account')}{' '}
            <Link
              href={`/login${returnUrl !== '/dashboard' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
              className="font-semibold text-accent hover:underline"
            >
              {t('auth_register_login_link')}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-3 gap-2 border-t border-line/60">
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

      {/* RIGHT / SHOWCASE PANEL */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 bg-surface border-s border-line flex-col justify-between p-10 xl:p-14 relative overflow-hidden">
        {/* Ambient glow */}
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

        {/* Value Prop Cards */}
        <div className="relative z-10 my-6 max-w-[460px] w-full mx-auto space-y-3">
          <div className="rounded-[10px] border border-line bg-surface-2/90 p-4 text-start backdrop-blur-sm shadow-subtle flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-ink">
                {t('feature_ats_title')}
              </h3>
              <p className="text-[11px] text-ink-3 mt-0.5 leading-relaxed">
                {t('feature_ats_desc')}
              </p>
            </div>
          </div>

          <div className="rounded-[10px] border border-line bg-surface-2/90 p-4 text-start backdrop-blur-sm shadow-subtle flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-ink">
                {t('feature_builder_title')}
              </h3>
              <p className="text-[11px] text-ink-3 mt-0.5 leading-relaxed">
                {t('feature_builder_desc')}
              </p>
            </div>
          </div>

          <div className="rounded-[10px] border border-line bg-surface-2/90 p-4 text-start backdrop-blur-sm shadow-subtle flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-ink">
                {t('feature_cover_title')}
              </h3>
              <p className="text-[11px] text-ink-3 mt-0.5 leading-relaxed">
                {t('feature_cover_desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
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
        </div>
      </div>
    </div>
  );
}