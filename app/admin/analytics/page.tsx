'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/context/LanguageContext';
import {
  TrendingUp,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Key,
  ShieldCheck,
  Filter,
  DollarSign,
  Award,
  Activity,
  Download,
  UserMinus,
} from 'lucide-react';
import type { FunnelStepMetric, AnalyticsEventRecord } from '@/lib/analytics';

interface AdminFunnelResponse {
  funnel: {
    steps: FunnelStepMetric[];
    overallConversionPct: number;
    churnCount: number;
  };
  avgAtsScore: number;
  revenueByProvider: Record<string, { orders: number; usdTotal: number; egpTotal: number }>;
  revenueByPlan: Record<string, { orders: number; usdTotal: number; egpTotal: number }>;
  posthogDashboardConfig: Record<string, any>;
  recentEvents: AnalyticsEventRecord[];
}

export default function AdminAnalyticsFunnelPage() {
  const { language, isRtl, dir } = useLanguage();
  const isAr = language === 'ar';

  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);

  const [data, setData] = useState<AdminFunnelResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFunnelData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.status === 403) {
        setIsAdminAuthorized(false);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setIsAdminAuthorized(true);
      }
    } catch (err) {
      console.error('Failed to load funnel analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFunnelData();
  }, [fetchFunnelData]);

  const handleVerifyKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    setIsVerifyingKey(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: adminKeyInput }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsAdminAuthorized(true);
        await fetchFunnelData();
      } else {
        setKeyError(json.error || 'Invalid admin key');
      }
    } catch (err: any) {
      setKeyError(err?.message || 'Verification failed');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleDownloadPostHogConfig = () => {
    if (!data?.posthogDashboardConfig) return;
    const blob = new Blob([JSON.stringify(data.posthogDashboardConfig, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'posthog-jobmatch-funnel-dashboard.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isAdminAuthorized === false) {
    return (
      <div
        dir={dir}
        className="min-h-[100dvh] bg-paper text-ink flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md bg-surface border border-edge rounded-2xl p-8 shadow-sm">
          <div className="flex justify-center mb-5">
            <div className="p-3.5 rounded-xl bg-accent-soft border border-edge text-accent">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-ink mb-2">
            {isAr ? 'لوحة قمع التحويل (PostHog Funnel)' : 'PostHog Conversion Funnel'}
          </h1>
          {keyError && (
            <div className="mb-4 p-3 rounded-xl bg-bad-soft border border-edge text-bad text-xs">
              {keyError}
            </div>
          )}
          <form onSubmit={handleVerifyKey} className="space-y-4">
            <div className="relative">
              <Key className="w-4 h-4 text-ink-3 absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                placeholder="Admin Secret Key"
                className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-paper border border-edge text-ink text-sm focus:outline-none focus:border-accent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isVerifyingKey}
              className="w-full py-2.5 rounded-xl bg-accent text-on-accent hover:bg-accent-hover font-semibold text-sm transition-colors cursor-pointer"
            >
              {isVerifyingKey ? '...' : isAr ? 'دخول لوحة التحليلات' : 'Unlock Funnel Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const steps = data?.funnel?.steps || [];
  const conversionSteps = steps.filter((s) => s.event !== 'subscription_cancelled');
  const cancelledStep = steps.find((s) => s.event === 'subscription_cancelled');

  return (
    <div dir={dir} className="min-h-[100dvh] bg-paper text-ink">
      <header className="border-b border-edge bg-surface sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink flex items-center gap-2.5">
              <Filter className="w-6 h-6 text-accent" />
              <span>
                {isAr
                  ? 'لوحة قمع التحويل والأحداث (PostHog Funnel)'
                  : 'PostHog Conversion Funnel & Revenue Dashboard'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-ink-2 mt-0.5">
              {isAr
                ? 'تتبع مراحل المستخدم بعد موافقة الكوكيز، وإيرادات الدفع المؤكدة من الـ Webhook فقط'
                : 'Consent-gated user journey tracking & webhook-verified payment conversions'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadPostHogConfig}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-paper hover:bg-paper-2 border border-edge text-xs font-semibold text-ink transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>{isAr ? 'تصدير إعداد PostHog JSON' : 'Export PostHog JSON'}</span>
            </button>
            <button
              onClick={fetchFunnelData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-paper hover:bg-paper-2 border border-edge text-xs font-semibold text-ink transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-accent' : ''}`} />
              <span>{isAr ? 'تحديث' : 'Refresh'}</span>
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-on-accent hover:bg-accent-hover text-xs font-semibold transition-colors"
            >
              <BackIcon className="w-3.5 h-3.5" />
              <span>{isAr ? 'العودة للوحة المشرف' : 'Back to Admin'}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-edge rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                {isAr ? 'معدل التحويل الكلي (Landing → Paid)' : 'Overall Conversion (Landing → Paid)'}
              </span>
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-bold font-mono text-ink">
              {data?.funnel?.overallConversionPct ?? 0}%
            </div>
            <div className="text-xs text-ink-2 mt-1">
              {isAr ? 'من أول زيارة حتى الدفع المؤكد' : 'From landing_view to payment_succeeded'}
            </div>
          </div>

          <div className="bg-surface border border-edge rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                {isAr ? 'متوسط درجة ATS (ats_scored)' : 'Avg ATS Score (ats_scored)'}
              </span>
              <Award className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-bold font-mono text-ink">
              {data?.avgAtsScore ?? 0}%
            </div>
            <div className="text-xs text-ink-2 mt-1">
              {isAr ? 'بدون تخزين أي نصوص سيرة ذاتية' : 'Zero PII / resume text transmitted'}
            </div>
          </div>

          <div className="bg-surface border border-edge rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                {isAr ? 'مدفوعات مؤكدة (Webhook)' : 'Webhook-Verified Payments'}
              </span>
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-bold font-mono text-ink">
              {conversionSteps.find((s) => s.event === 'payment_succeeded')?.count ?? 0}
            </div>
            <div className="text-xs text-ink-2 mt-1">
              {isAr ? 'قيمة حقيقية من الـ Order المخزّن' : 'Strictly from verified Order records'}
            </div>
          </div>

          <div className="bg-surface border border-edge rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                {isAr ? 'إلغاء الاشتراكات (Churn)' : 'Cancelled Subscriptions'}
              </span>
              <UserMinus className="w-4 h-4 text-ink-3" />
            </div>
            <div className="text-2xl font-bold font-mono text-ink">
              {cancelledStep?.count ?? data?.funnel?.churnCount ?? 0}
            </div>
            <div className="text-xs text-ink-2 mt-1">
              <code>subscription_cancelled</code>
            </div>
          </div>
        </div>

        {/* 11-Stage Conversion Funnel Visualization */}
        <section className="bg-surface border border-edge rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink">
                {isAr
                  ? 'مراحل قمع التحويل (11 خطوة أساسية + مراقبة الإلغاء)'
                  : '11-Stage Conversion Funnel + Churn Monitor'}
              </h2>
              <p className="text-xs text-ink-2">
                {isAr
                  ? 'مرتبة زمنياً من زيارة الصفحة الرئيسية حتى تأكيد الدفع عبر الـ Webhook'
                  : 'Ordered sequentially from landing_view to webhook-verified payment_succeeded'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {conversionSteps.map((step) => (
              <div
                key={step.event}
                className="p-3.5 rounded-xl bg-paper border border-edge space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-accent-soft text-accent font-mono text-xs font-bold flex items-center justify-center">
                      {step.step}
                    </span>
                    <span className="font-semibold text-ink">
                      {isAr ? step.labelAr : step.labelEn}
                    </span>
                    <code className="px-2 py-0.5 rounded bg-surface border border-edge text-[11px] font-mono text-accent">
                      {step.event}
                    </code>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="font-bold text-ink">{step.count}</span>
                    <span className="text-ink-2">
                      ({step.conversionFromPreviousPct}% {isAr ? 'من السابق' : 'step'} ·{' '}
                      {step.conversionFromTopPct}% {isAr ? 'إجمالي' : 'top'})
                    </span>
                  </div>
                </div>

                <div className="w-full h-2.5 rounded-full bg-surface border border-edge overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${Math.max(3, step.conversionFromTopPct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Provider & Plan Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-surface border border-edge rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" />
              <span>
                {isAr
                  ? 'الإيرادات المؤكدة حسب مزود الدفع (provider)'
                  : 'Webhook-Verified Revenue by Provider'}
              </span>
            </h3>
            <div className="space-y-2.5">
              {Object.entries(data?.revenueByProvider || {}).map(([provider, stats]) => (
                <div
                  key={provider}
                  className="flex items-center justify-between p-3 rounded-xl bg-paper border border-edge text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-2">
                    <code className="font-mono font-semibold text-ink">{provider}</code>
                    <span className="text-ink-3">({stats.orders} orders)</span>
                  </div>
                  <div className="font-mono font-bold text-ink">
                    ${stats.usdTotal.toFixed(2)} USD
                    {stats.egpTotal > 0 ? ` · ${stats.egpTotal.toFixed(0)} EGP` : ''}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface border border-edge rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              <span>
                {isAr
                  ? 'الإيرادات المؤكدة حسب الباقة (plan)'
                  : 'Webhook-Verified Revenue by Plan'}
              </span>
            </h3>
            <div className="space-y-2.5">
              {Object.entries(data?.revenueByPlan || {}).map(([plan, stats]) => (
                <div
                  key={plan}
                  className="flex items-center justify-between p-3 rounded-xl bg-paper border border-edge text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-2">
                    <code className="font-mono font-semibold text-ink uppercase">{plan}</code>
                    <span className="text-ink-3">({stats.orders} orders)</span>
                  </div>
                  <div className="font-mono font-bold text-ink">
                    ${stats.usdTotal.toFixed(2)} USD
                    {stats.egpTotal > 0 ? ` · ${stats.egpTotal.toFixed(0)} EGP` : ''}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

