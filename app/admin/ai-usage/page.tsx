'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/context/LanguageContext';
import {
  Activity,
  DollarSign,
  Cpu,
  ShieldAlert,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Key,
  ShieldCheck,
} from 'lucide-react';

interface EndpointUsageRow {
  endpoint: string;
  todayCostUsd: number;
  todayRequests: number;
  todayTokens: number;
  todayHits: number;
  todayFallbacks: number;
  weekCostUsd: number;
  weekRequests: number;
  weekTokens: number;
  weekHits: number;
  weekFallbacks: number;
  avgLatencyMs: number;
}

interface AiUsageLogRow {
  id: string;
  userId: string;
  endpoint: string;
  tokens: number;
  costUsd: number;
  latencyMs: number;
  status: 'hit' | 'fallback';
  fallbackReason?: string;
  provider: string;
  model: string;
  createdAt: string;
}

interface AiUsageResponse {
  today: {
    costUsd: number;
    requests: number;
    tokens: number;
    hits: number;
    fallbacks: number;
    avgLatencyMs: number;
  };
  week: {
    costUsd: number;
    requests: number;
    tokens: number;
    hits: number;
    fallbacks: number;
    avgLatencyMs: number;
  };
  dailyBudgetUsd: number;
  budgetRemainingUsd: number;
  budgetExceeded: boolean;
  endpoints: EndpointUsageRow[];
  recentLogs: AiUsageLogRow[];
  circuitBreaker: {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    consecutiveFailures: number;
    failureThreshold: number;
    cooldownMs: number;
    lastError: string | null;
  };
}

export default function AdminAiUsagePage() {
  const { t, isRtl, dir } = useLanguage();
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);

  const [data, setData] = useState<AiUsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/ai-usage');
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
      console.error('Failed to load AI usage stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

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
        await fetchUsageData();
      } else {
        setKeyError(json.error || 'Invalid admin key');
      }
    } catch (err: any) {
      setKeyError(err?.message || 'Verification failed');
    } finally {
      setIsVerifyingKey(false);
    }
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
          <h1 className="text-xl font-bold text-center text-ink mb-2">{t('admin_ai_title')}</h1>
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
              {isVerifyingKey ? '...' : 'Unlock Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const budgetPct = data?.dailyBudgetUsd
    ? Math.min(100, Math.round((data.today.costUsd / data.dailyBudgetUsd) * 100))
    : 0;

  return (
    <div dir={dir} className="min-h-[100dvh] bg-paper text-ink">
      <header className="border-b border-edge bg-surface sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink flex items-center gap-2.5">
              <Cpu className="w-6 h-6 text-accent" />
              <span>{t('admin_ai_title')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-ink-2 mt-0.5">{t('admin_ai_subtitle')}</p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchUsageData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-paper hover:bg-paper-2 border border-edge text-xs font-semibold text-ink transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-accent' : ''}`} />
              <span>{t('admin_ai_refresh_btn')}</span>
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-on-accent hover:bg-accent-hover text-xs font-semibold transition-colors"
            >
              <BackIcon className="w-3.5 h-3.5" />
              <span>{t('admin_ai_back_admin')}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today Cost */}
          <div className="bg-surface border border-edge rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                {t('admin_ai_today_cost')}
              </span>
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-bold font-mono text-ink">
              ${(data?.today.costUsd ?? 0).toFixed(4)}
            </div>
            <div className="text-xs text-ink-2 mt-1">
              {data?.today.requests ?? 0} reqs ({data?.today.hits ?? 0} hit / {data?.today.fallbacks ?? 0} fallback)
            </div>
          </div>

          {/* 7-Day Cost */}
          <div className="bg-surface border border-edge rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                {t('admin_ai_week_cost')}
              </span>
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-bold font-mono text-ink">
              ${(data?.week.costUsd ?? 0).toFixed(4)}
            </div>
            <div className="text-xs text-ink-2 mt-1">
              {data?.week.requests ?? 0} reqs · {(data?.week.tokens ?? 0).toLocaleString()} tokens
            </div>
          </div>

          {/* Daily Budget */}
          <div className="bg-surface border border-edge rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                {t('admin_ai_daily_budget')}
              </span>
              <ShieldAlert className="w-4 h-4 text-warn" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-ink">
                ${(data?.dailyBudgetUsd ?? 10).toFixed(2)}
              </span>
              <span className="text-xs font-mono text-ink-2">{budgetPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-paper-2 overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all ${
                  data?.budgetExceeded ? 'bg-bad' : 'bg-accent'
                }`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>

          {/* Circuit Breaker Status */}
          <div className="bg-surface border border-edge rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                {t('admin_ai_circuit_status')}
              </span>
              {data?.circuitBreaker?.state === 'OPEN' ? (
                <AlertTriangle className="w-4 h-4 text-bad" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-ok" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  data?.circuitBreaker?.state === 'OPEN'
                    ? 'bg-bad-soft text-bad'
                    : data?.circuitBreaker?.state === 'HALF_OPEN'
                    ? 'bg-warn-soft text-warn'
                    : 'bg-ok-soft text-ok'
                }`}
              >
                {data?.circuitBreaker?.state || 'CLOSED'}
              </span>
              <span className="text-xs text-ink-2 font-mono">
                failures: {data?.circuitBreaker?.consecutiveFailures ?? 0}/
                {data?.circuitBreaker?.failureThreshold ?? 3}
              </span>
            </div>
            <div className="text-xs text-ink-3 mt-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Avg latency: {data?.week.avgLatencyMs ?? 0} ms</span>
            </div>
          </div>
        </div>

        {/* Per-Endpoint Cost & Usage Table */}
        <section className="bg-surface border border-edge rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">{t('admin_ai_endpoints_title')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-paper text-ink-3 text-xs uppercase border-b border-edge">
                <tr>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_endpoint')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_today_cost')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_today_reqs')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_week_cost')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_week_reqs')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_tokens')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_hit_fallback')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_latency')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {(data?.endpoints || []).map((ep) => (
                  <tr key={ep.endpoint} className="hover:bg-paper/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-ink">
                      {ep.endpoint}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-accent font-bold">
                      ${ep.todayCostUsd.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-ink-2">
                      {ep.todayRequests}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-ink font-semibold">
                      ${ep.weekCostUsd.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-ink-2">
                      {ep.weekRequests}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-ink-2">
                      {ep.weekTokens.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="text-ok font-semibold">{ep.weekHits}</span>
                      <span className="text-ink-3 mx-1">/</span>
                      <span className="text-warn font-semibold">{ep.weekFallbacks}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-ink-2">
                      {ep.avgLatencyMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent AI Usage Logs */}
        <section className="bg-surface border border-edge rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-edge">
            <h2 className="text-base font-bold text-ink">{t('admin_ai_recent_logs_title')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-paper text-ink-3 text-xs uppercase border-b border-edge">
                <tr>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_endpoint')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_user')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_status')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_tokens')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_today_cost')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_latency')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('admin_ai_col_time')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {!data?.recentLogs || data.recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-ink-3">
                      {t('admin_ai_no_logs')}
                    </td>
                  </tr>
                ) : (
                  data.recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-paper/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-xs text-ink">{log.endpoint}</td>
                      <td className="py-2.5 px-4 font-mono text-xs text-ink-2">{log.userId}</td>
                      <td className="py-2.5 px-4 text-xs">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold ${
                            log.status === 'hit'
                              ? 'bg-ok-soft text-ok'
                              : 'bg-warn-soft text-warn'
                          }`}
                        >
                          {log.status === 'hit' ? t('admin_ai_status_hit') : t('admin_ai_status_fallback')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-ink-2">
                        {log.tokens.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-ink">
                        ${log.costUsd.toFixed(6)}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-ink-2">
                        {log.latencyMs} ms
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-ink-3">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
