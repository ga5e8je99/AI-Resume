'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { getConsentStatus, setConsentStatus } from '@/lib/analytics';
import { ShieldCheck, Cookie, Check, X } from 'lucide-react';

export default function CookieConsentBanner() {
  const { isRtl } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if consent has not been decided yet
    const status = getConsentStatus();
    if (status === 'pending') {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setConsentStatus('granted');
    setVisible(false);
  };

  const handleDecline = () => {
    setConsentStatus('denied');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label={isRtl ? 'إشعار ملفات تعريف الارتباط والخصوصية' : 'Cookie & Analytics Consent'}
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed bottom-4 start-4 end-4 sm:start-auto sm:end-6 sm:max-w-md z-50 animate-in fade-in duration-300"
    >
      <div className="bg-surface border border-line-strong rounded-[10px] p-5 shadow-elevated text-ink relative">
        <div className="flex items-start gap-3.5 mb-3.5">
          <div className="p-2 rounded-[8px] bg-accent-soft text-accent shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 text-start">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif font-semibold text-sm text-ink">
                {isRtl ? 'الخصوصية وملفات تعريف الارتباط' : 'Privacy & Performance Analytics'}
              </h3>
              <ShieldCheck className="w-4 h-4 text-success" />
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">
              {isRtl
                ? 'نستخدم تحليلات مجهولة الهوية لتحسين تجربة منشئ السير الذاتية. لا نقوم إطلاقاً بجمع أو حفظ بياناتك الشخصية أو محتوى سيرتك الذاتية.'
                : 'We use privacy-friendly, anonymized analytics to measure platform performance. We never track or store your personal identity, resume text, or documents.'}
            </p>

            <div className="mt-1.5">
              <Link
                href="/privacy"
                className="text-[11px] text-accent underline underline-offset-4 hover:underline"
              >
                {isRtl ? 'سياسة الخصوصية' : 'Learn more in Privacy Policy'}
              </Link>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
          <button
            type="button"
            id="cookie-consent-decline-btn"
            onClick={handleDecline}
            className="px-3.5 py-1.5 rounded-[6px] border border-line-strong bg-surface hover:bg-surface-2 text-xs font-medium text-ink transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5 text-ink-3" />
            <span>{isRtl ? 'رفض' : 'Decline'}</span>
          </button>

          <button
            type="button"
            id="cookie-consent-accept-btn"
            onClick={handleAccept}
            className="px-4 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-xs font-medium text-on-accent transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isRtl ? 'قبول التحليلات' : 'Accept Analytics'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
