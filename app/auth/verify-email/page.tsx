'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { trackEmailVerified } from '@/lib/analytics';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { user, refreshUser } = useAuth();
  const { t, language, isRtl } = useLanguage();

  const [verifyState, setVerifyState] = useState<'verifying' | 'success' | 'error'>(
    token ? 'verifying' : 'error'
  );
  const [emailInput, setEmailInput] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'rate_limited'>('idle');

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (cancelled) return;

        if (res.ok) {
          setVerifyState('success');
          trackEmailVerified({ method: 'token' });
          await refreshUser();
        } else {
          setVerifyState('error');
        }
      } catch {
        if (!cancelled) {
          setVerifyState('error');
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, refreshUser]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resendState === 'sending') return;

    const targetEmail = (user?.email || emailInput).trim();
    if (!user && !targetEmail) return;

    setResendState('sending');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, language }),
      });

      if (res.status === 429) {
        setResendState('rate_limited');
        return;
      }

      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <main
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-[calc(100vh-4rem)] bg-paper text-ink flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-md bg-surface border border-line rounded-2xl p-6 sm:p-8 shadow-sm text-center">
        {verifyState === 'verifying' && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-ink">{t('verify_page_verifying_title')}</h1>
            <p className="text-sm text-muted leading-relaxed">{t('verify_page_verifying_desc')}</p>
          </div>
        )}

        {verifyState === 'success' && (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-ink">{t('verify_page_success_title')}</h1>
              <p className="text-sm text-muted leading-relaxed">{t('verify_page_success_desc')}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-colors"
              >
                <span>{t('verify_page_go_dashboard')}</span>
                <ArrowIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/jobs"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-2 border border-line text-ink font-semibold text-sm hover:bg-paper transition-colors"
              >
                <span>{t('verify_page_go_jobs')}</span>
              </Link>
            </div>
          </div>
        )}

        {verifyState === 'error' && (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-ink">{t('verify_page_error_title')}</h1>
              <p className="text-sm text-muted leading-relaxed">{t('verify_page_error_desc')}</p>
            </div>

            <form onSubmit={handleResend} className="space-y-3 pt-2 text-start">
              {!user && (
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={t('verify_page_email_placeholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-paper border border-line text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent"
                />
              )}

              <button
                type="submit"
                disabled={resendState === 'sending'}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${resendState === 'sending' ? 'animate-spin' : ''}`}
                />
                <span>
                  {resendState === 'sending'
                    ? t('verify_banner_sending')
                    : t('verify_banner_resend_btn')}
                </span>
              </button>
            </form>

            {resendState === 'sent' && (
              <p className="text-xs font-medium text-success">{t('verify_banner_sent')}</p>
            )}
            {resendState === 'rate_limited' && (
              <p className="text-xs font-medium text-danger">{t('verify_banner_rate_limited')}</p>
            )}

            <div className="pt-2 border-t border-line">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
              >
                <span>{t('verify_page_go_dashboard')}</span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] bg-paper text-ink flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-accent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

