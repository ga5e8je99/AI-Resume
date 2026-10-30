'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Logo from '../components/Logo';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import { useLanguage } from '../context/LanguageContext';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function ForgotPasswordPage() {
  const { isRtl, language, t } = useLanguage();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError(t('auth_err_email_required'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError(t('auth_err_email_invalid'));
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, language }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || data.error || t('common_error'));
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('common_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-center items-center px-4 py-12 relative selection:bg-accent-soft selection:text-ink"
    >
      {/* Top Utility Bar with Language and Theme Switcher */}
      <div className="absolute top-6 end-6 z-20 flex items-center gap-2">
        <ThemeToggle size="sm" />
        <LanguageSelector variant="compact" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-ink tracking-tight">
            {t('auth_forgot_title')}
          </h1>
          <p className="text-xs sm:text-sm text-ink-3 mt-1 max-w-sm mx-auto">
            {t('auth_forgot_subtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-line-strong rounded-[10px] p-6 sm:p-8 shadow-card text-start">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-[8px] bg-success-soft text-success border border-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-serif font-semibold text-ink mb-2">
                {t('auth_forgot_check_inbox')}
              </h2>
              <p className="text-xs sm:text-sm text-ink-2 mb-6 leading-relaxed">
                {t('auth_forgot_sent_desc')}
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors inline-flex items-center justify-center gap-2"
                >
                  <BackArrow className="w-4 h-4" />
                  <span>{t('auth_forgot_back_login')}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                  className="text-xs text-ink-3 hover:text-ink transition-colors cursor-pointer"
                >
                  {t('error_try_again')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-[6px] bg-danger-soft border border-danger/20 flex items-center gap-2.5 text-xs text-danger"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-semibold text-ink uppercase tracking-wide"
                >
                  {t('auth_login_email')}
                  <span className="text-danger ms-1" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-3 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={emailInputRef}
                    id="forgot-email"
                    type="email"
                    name="email"
                    required
                    autoFocus
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder="name@example.com"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'forgot-email-error' : undefined}
                    className={`w-full ps-9 pe-3.5 py-2.5 bg-surface border rounded-[6px] text-sm text-ink placeholder:text-ink-3/60 outline-none transition-colors ${
                      emailError
                        ? 'border-danger focus:ring-2 focus:ring-danger'
                        : 'border-line-strong focus:border-accent focus:ring-2 focus:ring-accent/20'
                    }`}
                  />
                </div>
                {emailError && (
                  <p
                    id="forgot-email-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-xs text-danger font-medium mt-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="w-full mt-2 font-medium"
              >
                {t('auth_forgot_submit')}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline transition-colors"
                >
                  <BackArrow className="w-3.5 h-3.5" />
                  <span>{t('auth_forgot_back_login')}</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
