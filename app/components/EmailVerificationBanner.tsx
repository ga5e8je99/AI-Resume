'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MailWarning, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const { t, language, isRtl } = useLanguage();
  const pathname = usePathname();

  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'rate_limited' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Only show when a logged-in regular user is unverified (not demo, not admin, and not on the verify page itself)
  if (!user || user.isDemo || user.role === 'admin' || user.emailVerified) {
    return null;
  }

  if (pathname?.startsWith('/auth/verify-email')) {
    return null;
  }

  const handleResend = async () => {
    if (status === 'sending') return;
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, language }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        setStatus('rate_limited');
        return;
      }

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.message || data.error || '');
        return;
      }

      setStatus('sent');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || '');
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      role="status"
      aria-live="polite"
      className="w-full bg-warning/10 border-b border-warning/30 text-ink px-4 py-3"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-warning/20 text-warning flex items-center justify-center shrink-0">
            <MailWarning className="w-4 h-4" />
          </div>
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-ink">{t('verify_banner_title')}</p>
            <p className="text-muted mt-0.5">{t('verify_banner_desc')}</p>
            {status === 'sent' && (
              <p className="text-success font-medium mt-1 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('verify_banner_sent')}</span>
              </p>
            )}
            {status === 'rate_limited' && (
              <p className="text-danger font-medium mt-1 inline-flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t('verify_banner_rate_limited')}</span>
              </p>
            )}
            {status === 'error' && errorMsg && (
              <p className="text-danger font-medium mt-1 inline-flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleResend}
          disabled={status === 'sending'}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-60 shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${status === 'sending' ? 'animate-spin' : ''}`} />
          <span>
            {status === 'sending' ? t('verify_banner_sending') : t('verify_banner_resend_btn')}
          </span>
        </button>
      </div>
    </div>
  );
}

