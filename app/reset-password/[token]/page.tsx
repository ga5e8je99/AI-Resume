'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Logo from '../../components/Logo';
import LanguageSelector from '../../components/LanguageSelector';
import ThemeToggle from '../../components/ThemeToggle';
import { useLanguage } from '../../context/LanguageContext';
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === 'string' ? params.token : Array.isArray(params?.token) ? params.token[0] : '';
  const { isRtl, language, t } = useLanguage();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  const validate = (): boolean => {
    const errors: { password?: string; confirmPassword?: string } = {};

    if (!token) {
      setErrorMessage(t('auth_err_unexpected'));
      return false;
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
    setErrorMessage(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || data.error || t('auth_err_unexpected'));
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('common_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const NextArrow = isRtl ? ArrowLeft : ArrowRight;

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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-ink tracking-tight">
            {t('auth_reset_title')}
          </h1>
          <p className="text-xs sm:text-sm text-ink-3 mt-1 max-w-sm mx-auto">
            {t('auth_reset_subtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-line-strong rounded-[10px] p-6 sm:p-8 shadow-card text-start">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-[8px] bg-success-soft text-success border border-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-serif font-semibold text-ink mb-2">
                {t('auth_reset_success')}
              </h2>
              <p className="text-xs sm:text-sm text-ink-2 mb-6 leading-relaxed">
                {t('auth_reset_success')}
              </p>
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors inline-flex items-center justify-center gap-2"
              >
                <span>{t('auth_reset_go_login')}</span>
                <NextArrow className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-[6px] bg-danger-soft border border-danger/20 flex flex-col gap-2 text-xs text-danger"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                    <span>{errorMessage}</span>
                  </div>
                  <div className="text-end">
                    <Link
                      href="/forgot-password"
                      className="text-accent underline hover:underline inline-block mt-1 font-medium"
                    >
                      {t('auth_forgot_title')}
                    </Link>
                  </div>
                </div>
              )}

              {/* Password field */}
              <div className="space-y-1">
                <label
                  htmlFor="new-password"
                  className="block text-xs font-semibold text-ink uppercase tracking-wide"
                >
                  {t('auth_register_password')}
                  <span className="text-danger ms-1" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-3 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={passwordInputRef}
                    id="new-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    autoComplete="new-password"
                    minLength={6}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    placeholder="••••••••"
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'new-password-error' : undefined}
                    className={`w-full ps-9 pe-10 py-2.5 bg-surface border rounded-[6px] text-sm text-ink placeholder:text-ink-3/60 outline-none transition-colors ${
                      fieldErrors.password
                        ? 'border-danger focus:ring-2 focus:ring-danger'
                        : 'border-line-strong focus:border-accent focus:ring-2 focus:ring-accent/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p
                    id="new-password-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-xs text-danger font-medium mt-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password field */}
              <div className="space-y-1">
                <label
                  htmlFor="confirm-new-password"
                  className="block text-xs font-semibold text-ink uppercase tracking-wide"
                >
                  {t('auth_register_confirm_password')}
                  <span className="text-danger ms-1" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-ink-3 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }
                    }}
                    placeholder="••••••••"
                    aria-invalid={!!fieldErrors.confirmPassword}
                    aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                    className={`w-full ps-9 pe-10 py-2.5 bg-surface border rounded-[6px] text-sm text-ink placeholder:text-ink-3/60 outline-none transition-colors ${
                      fieldErrors.confirmPassword
                        ? 'border-danger focus:ring-2 focus:ring-danger'
                        : 'border-line-strong focus:border-accent focus:ring-2 focus:ring-accent/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1 cursor-pointer transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p
                    id="confirm-password-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-xs text-danger font-medium mt-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{fieldErrors.confirmPassword}</span>
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
                {t('auth_reset_submit')}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-xs text-ink-3 hover:text-accent transition-colors"
                >
                  {t('auth_forgot_back_login')}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
