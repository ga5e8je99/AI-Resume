'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import {
  getConsentStatus,
  setConsentStatus,
  isEuropeanRegion,
} from '@/lib/analytics';
import { ShieldCheck, Cookie, Check, X, Lock } from 'lucide-react';

export default function CookieConsentBanner() {
  const { isRtl, t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const handleOpenBanner = () => {
      const current = getConsentStatus();
      setAnalyticsEnabled(current === 'granted');
      setVisible(true);
    };

    window.addEventListener('jobmatch_open_cookie_banner', handleOpenBanner);

    // Only auto-show if consent has not been decided yet
    const status = getConsentStatus();
    if (status !== 'pending') {
      return () => {
        window.removeEventListener('jobmatch_open_cookie_banner', handleOpenBanner);
      };
    }

    const isAutomated =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver === true ||
        /bot|googlebot|crawler|spider|lighthouse|headless|speed insights/i.test(
          navigator.userAgent
        ));
    if (isAutomated) {
      return () => {
        window.removeEventListener('jobmatch_open_cookie_banner', handleOpenBanner);
      };
    }

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setVisible(true);
      cleanup();
    };

    // Show faster in European regions so users can immediately decide consent
    const delayMs = isEuropeanRegion() ? 1500 : 4000;
    const timer = setTimeout(show, delayMs);
    const onInteract = () => show();

    window.addEventListener('scroll', onInteract, { passive: true, once: true });
    window.addEventListener('pointerdown', onInteract, { passive: true, once: true });
    window.addEventListener('keydown', onInteract, { passive: true, once: true });

    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
    }

    return () => {
      cleanup();
      window.removeEventListener('jobmatch_open_cookie_banner', handleOpenBanner);
    };
  }, []);

  const handleNecessaryOnly = () => {
    setAnalyticsEnabled(false);
    setConsentStatus('denied');
    setVisible(false);
  };

  const handleAcceptAll = () => {
    setAnalyticsEnabled(true);
    setConsentStatus('granted');
    setVisible(false);
  };

  const handleSaveSelection = () => {
    setConsentStatus(analyticsEnabled ? 'granted' : 'denied');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label={t('cookie_banner_aria')}
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed bottom-4 start-4 end-4 sm:start-auto sm:end-6 sm:max-w-lg z-50 animate-in fade-in duration-300"
    >
      <div className="bg-surface border border-line-strong rounded-[10px] p-5 shadow-elevated text-ink relative">
        <div className="flex items-start gap-3.5 mb-3">
          <div className="p-2 rounded-[8px] bg-accent-soft text-accent shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 text-start">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif font-semibold text-sm text-ink">
                {t('cookie_banner_title')}
              </h3>
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">
              {t('cookie_banner_desc')}
            </p>
          </div>
        </div>

        {/* Granular Category Toggles: Necessary vs Analytics */}
        <div className="space-y-2 my-3 text-start">
          {/* Necessary (Always Active) */}
          <div className="p-2.5 rounded-[8px] bg-surface-2 border border-line flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Lock className="w-3.5 h-3.5 text-success shrink-0" />
                <span>{t('cookie_cat_necessary_title')}</span>
              </div>
              <p className="text-[11px] text-ink-2 mt-0.5 leading-snug">
                {t('cookie_cat_necessary_desc')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={true}
              disabled
              aria-label={t('cookie_cat_necessary_title')}
              className="mt-1 h-4 w-4 accent-accent rounded cursor-not-allowed opacity-70"
            />
          </div>

          {/* Analytics (Optional Toggle) */}
          <label
            htmlFor="cookie-analytics-toggle"
            className="p-2.5 rounded-[8px] bg-surface-2 border border-line hover:border-line-strong flex items-start justify-between gap-3 cursor-pointer transition-colors"
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold text-ink">
                {t('cookie_cat_analytics_title')}
              </div>
              <p className="text-[11px] text-ink-2 mt-0.5 leading-snug">
                {t('cookie_cat_analytics_desc')}
              </p>
            </div>
            <input
              id="cookie-analytics-toggle"
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 accent-accent rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Links & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-line">
          <div className="flex items-center gap-2 text-[11px]">
            <Link
              href="/privacy"
              className="text-accent underline underline-offset-4 hover:opacity-80"
            >
              {t('cookie_privacy_link')}
            </Link>
            <span className="text-ink-3">•</span>
            <Link
              href="/terms"
              className="text-ink-2 underline underline-offset-4 hover:text-ink"
            >
              {t('footer_terms')}
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 ms-auto">
            <button
              type="button"
              id="cookie-consent-decline-btn"
              onClick={handleNecessaryOnly}
              className="px-3 py-1.5 rounded-[6px] border border-line-strong bg-surface hover:bg-surface-2 text-xs font-medium text-ink transition-colors cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5 text-ink-3" />
              <span>{t('cookie_btn_necessary_only')}</span>
            </button>

            {analyticsEnabled && (
              <button
                type="button"
                id="cookie-consent-save-btn"
                onClick={handleSaveSelection}
                className="px-3 py-1.5 rounded-[6px] border border-accent text-accent hover:bg-accent-soft text-xs font-medium transition-colors cursor-pointer"
              >
                {t('cookie_btn_save_prefs')}
              </button>
            )}

            <button
              type="button"
              id="cookie-consent-accept-btn"
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-xs font-medium text-on-accent transition-colors cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t('cookie_btn_accept_all')}</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
