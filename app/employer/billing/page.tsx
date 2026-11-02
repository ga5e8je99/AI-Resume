'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Coins,
  CreditCard,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  History,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useLanguage } from '@/app/context/LanguageContext';
import { useToast } from '@/app/context/ToastContext';
import Reveal from '@/components/motion/Reveal';
import type { OrganizationRecord, HrCreditLedgerRecord } from '@/lib/hr';
import type { PlanConfig, HrPackId } from '@/lib/plans';
import { getLocalized } from '@/lib/plans';

interface BillingOverviewResponse {
  ok: boolean;
  organization: OrganizationRecord;
  monthlySpent: number;
  lowBalanceWarning: boolean;
  negativeBalanceBlocked: boolean;
  ledger: HrCreditLedgerRecord[];
  packs: PlanConfig[];
}

export default function EmployerBillingPage() {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<OrganizationRecord | null>(null);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [lowBalanceWarning, setLowBalanceWarning] = useState(false);
  const [negativeBalanceBlocked, setNegativeBalanceBlocked] = useState(false);
  const [ledger, setLedger] = useState<HrCreditLedgerRecord[]>([]);
  const [packs, setPacks] = useState<PlanConfig[]>([]);

  // Settings form state
  const [spendCapInput, setSpendCapInput] = useState<string>('');
  const [lowThresholdInput, setLowThresholdInput] = useState<string>('5');
  const [lowAlertEnabled, setLowAlertEnabled] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [buyingPackId, setBuyingPackId] = useState<HrPackId | null>(null);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employer/billing');
      const data: BillingOverviewResponse = await res.json();
      if (res.ok && data.ok && data.organization) {
        setOrg(data.organization);
        setMonthlySpent(data.monthlySpent || 0);
        setLowBalanceWarning(Boolean(data.lowBalanceWarning));
        setNegativeBalanceBlocked(Boolean(data.negativeBalanceBlocked));
        setLedger(data.ledger || []);
        setPacks(data.packs || []);

        setSpendCapInput(
          typeof data.organization.monthlySpendCap === 'number' &&
            data.organization.monthlySpendCap > 0
            ? String(data.organization.monthlySpendCap)
            : ''
        );
        setLowThresholdInput(
          typeof data.organization.lowBalanceThreshold === 'number'
            ? String(data.organization.lowBalanceThreshold)
            : '5'
        );
        setLowAlertEnabled(data.organization.lowBalanceAlertEnabled !== false);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBilling();
  }, [fetchBilling]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setSavingSettings(true);
    try {
      const parsedCap =
        spendCapInput.trim() === ''
          ? null
          : Math.max(1, Math.floor(Number(spendCapInput)));
      const parsedThreshold = Math.max(0, Math.floor(Number(lowThresholdInput) || 0));

      const res = await fetch('/api/employer/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: org.id,
          monthlySpendCap: parsedCap,
          lowBalanceThreshold: parsedThreshold,
          lowBalanceAlertEnabled: lowAlertEnabled,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast('Billing settings saved successfully.', 'success');
        void fetchBilling();
      } else {
        showToast(data.message || 'Could not update billing settings.', 'error');
      }
    } catch {
      showToast('Network error while saving settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleBuyPack = async (packId: HrPackId) => {
    if (!org) return;
    setBuyingPackId(packId);
    try {
      const res = await fetch('/api/employer/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: org.id,
          packId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        showToast(data.message || 'Failed to start Lemon Squeezy checkout.', 'error');
      }
    } catch {
      showToast('Network error while starting checkout.', 'error');
    } finally {
      setBuyingPackId(null);
    }
  };

  const formatReason = (reason: HrCreditLedgerRecord['reason']) => {
    switch (reason) {
      case 'credit_purchase':
        return 'HR Credit Pack Purchase (Webhook)';
      case 'job_post_publish':
        return 'Job Posting Published';
      case 'candidate_ai_analysis':
        return 'Applicant AI Match Analysis';
      case 'candidate_ai_analysis_refund':
        return 'Auto-Refund (AI Analysis Failed)';
      case 'top10_comparison_report':
        return 'Top-10 Candidate Comparison Report';
      case 'refund':
        return 'Provider Order Refund (Revoked)';
      case 'initial_grant':
        return 'Initial Organization Grant';
      default:
        return reason;
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <Reveal from="up">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/employer"
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label={t('emp_back_to_dashboard')}
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {t('emp_billing_title')}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {t('emp_billing_subtitle')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchBilling()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('admin_ai_refresh_btn')}
            </button>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse"
              />
            ))}
          </div>
        ) : !org ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('emp_create_org_subtitle')}
            </p>
            <Link
              href="/employer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition"
            >
              {t('emp_back_to_dashboard')}
            </Link>
          </div>
        ) : (
          <>
            {/* Negative Balance Blocking Banner */}
            {negativeBalanceBlocked && (
              <Reveal from="up">
                <div className="rounded-2xl border-2 border-rose-500/40 bg-rose-500/10 p-5 flex items-start gap-3.5">
                  <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-rose-800 dark:text-rose-300">
                      {t('emp_billing_negative_banner_title')} ({org.hrCredits} Credits)
                    </h2>
                    <p className="text-xs text-rose-700 dark:text-rose-200 leading-relaxed">
                      {t('emp_billing_negative_banner_desc')}
                    </p>
                  </div>
                </div>
              </Reveal>
            )}

            {/* Low Balance Warning Banner */}
            {!negativeBalanceBlocked && lowBalanceWarning && (
              <Reveal from="up">
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                    {t('emp_billing_low_balance_banner')} ({org.hrCredits} /{' '}
                    {org.lowBalanceThreshold ?? 5})
                  </p>
                </div>
              </Reveal>
            )}

            {/* Balance & Monthly Spend Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Reveal from="up" delay={0}>
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t('emp_billing_current_balance')}
                    </span>
                    <p
                      className={`text-3xl font-extrabold mt-1 ${
                        org.hrCredits < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {org.hrCredits}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                      {org.name}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <Coins className="w-6 h-6" />
                  </div>
                </div>
              </Reveal>

              <Reveal from="up" delay={80}>
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t('emp_billing_monthly_spent')}
                    </span>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                      {monthlySpent}
                      {typeof org.monthlySpendCap === 'number' && org.monthlySpendCap > 0 ? (
                        <span className="text-base font-medium text-slate-500 dark:text-slate-400">
                          {' '}
                          / {org.monthlySpendCap}
                        </span>
                      ) : null}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                      {typeof org.monthlySpendCap === 'number' && org.monthlySpendCap > 0
                        ? `Monthly Spend Cap: ${org.monthlySpendCap} credits`
                        : 'No monthly spend cap configured'}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                    <CreditCard className="w-6 h-6" />
                  </div>
                </div>
              </Reveal>
            </div>

            {/* 50 / 200 / 1000 HR Credit Packs */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('emp_billing_packs_heading')}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {packs.map((pack, idx) => {
                  const title = getLocalized(pack.name, language);
                  const tagline = getLocalized(pack.tagline, language);
                  const desc = getLocalized(pack.description, language);
                  const cta = getLocalized(pack.cta, language);
                  const priceUsd = pack.pricing.USD.oneTime ?? 0;
                  const packId = pack.id as HrPackId;

                  return (
                    <Reveal key={pack.id} from="up" delay={idx * 80}>
                      <div
                        className={`rounded-2xl border p-6 flex flex-col justify-between h-full transition shadow-xs ${
                          pack.popular
                            ? 'border-emerald-600/60 dark:border-emerald-500/50 bg-emerald-500/[0.03] dark:bg-emerald-950/20'
                            : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                              {tagline}
                            </span>
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                              {pack.credits} Credits
                            </span>
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              {title}
                            </h3>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                                ${priceUsd}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                USD · One-time
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                              {desc}
                            </p>
                          </div>

                          <ul className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                            {pack.features.map((feat, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <span>{getLocalized(feat.text, language)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          disabled={buyingPackId !== null}
                          onClick={() => void handleBuyPack(packId)}
                          className={`mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition disabled:opacity-50 ${
                            pack.popular
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                          }`}
                        >
                          {buyingPackId === packId ? t('pricing_checkout_loading') : cta}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>

            {/* Spend Controls & Low-Balance Alert Settings */}
            <Reveal from="up">
              <form
                onSubmit={handleSaveSettings}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t('emp_billing_settings_heading')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('emp_billing_spend_cap_label')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000000}
                      value={spendCapInput}
                      onChange={(e) => setSpendCapInput(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {t('emp_billing_spend_cap_hint')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('emp_billing_low_threshold_label')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={lowThresholdInput}
                      onChange={(e) => setLowThresholdInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm"
                    />
                    <label className="inline-flex items-center gap-2 mt-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lowAlertEnabled}
                        onChange={(e) => setLowAlertEnabled(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                      />
                      <span>{t('emp_billing_low_alert_toggle')}</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition disabled:opacity-50"
                  >
                    {t('emp_billing_save_settings_btn')}
                  </button>
                </div>
              </form>
            </Reveal>

            {/* Usage History Ledger */}
            <Reveal from="up">
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <History className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t('emp_billing_ledger_heading')}
                  </h2>
                </div>

                {ledger.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                    {t('emp_billing_ledger_empty')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                          <th className="py-2.5 pe-4 text-start font-semibold">Date (UTC)</th>
                          <th className="py-2.5 px-4 text-start font-semibold">Reason</th>
                          <th className="py-2.5 px-4 text-start font-semibold">Delta</th>
                          <th className="py-2.5 px-4 text-start font-semibold">Balance After</th>
                          <th className="py-2.5 ps-4 text-start font-semibold">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/70">
                        {ledger.map((item) => (
                          <tr key={item.id} className="text-slate-700 dark:text-slate-300">
                            <td className="py-3 pe-4 whitespace-nowrap font-mono text-[11px]">
                              {new Date(item.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                            </td>
                            <td className="py-3 px-4 font-medium">{formatReason(item.reason)}</td>
                            <td className="py-3 px-4 font-bold whitespace-nowrap">
                              <span
                                className={
                                  item.delta > 0
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : item.reason === 'refund'
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-amber-700 dark:text-amber-400'
                                }
                              >
                                {item.delta > 0 ? `+${item.delta}` : item.delta}
                              </span>
                            </td>
                            <td
                              className={`py-3 px-4 font-semibold whitespace-nowrap ${
                                item.balanceAfter < 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.balanceAfter}
                            </td>
                            <td className="py-3 ps-4 font-mono text-[11px] text-slate-500">
                              {item.refId}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Reveal>
          </>
        )}
      </div>
    </AppShell>
  );
}

