'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertTriangle,
  Flag,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useLanguage } from '@/app/context/LanguageContext';
import { useToast } from '@/app/context/ToastContext';
import type {
  EmployerJobRecord,
  JobReportRecord,
  OrganizationRecord,
} from '@/lib/hr';

export default function AdminModerationPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'jobs' | 'reports' | 'orgs'>('jobs');
  const [loading, setLoading] = useState(true);
  const [pendingJobs, setPendingJobs] = useState<EmployerJobRecord[]>([]);
  const [reports, setReports] = useState<JobReportRecord[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);

  const fetchModerationData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/moderation');
      const data = await res.json();
      if (res.ok && data.ok) {
        setPendingJobs(data.pendingJobs || []);
        setReports(data.reports || []);
        setOrganizations(data.organizations || []);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchModerationData();
  }, [fetchModerationData]);

  const handleJobAction = async (jobId: string, action: 'approve' | 'reject') => {
    const res = await fetch('/api/admin/moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: 'job', jobId, action }),
    });
    if (res.ok) {
      showToast(action === 'approve' ? 'Job approved & published.' : 'Job rejected.', 'success');
      void fetchModerationData();
    }
  };

  const handleReportAction = async (reportId: string, status: 'resolved' | 'dismissed') => {
    const res = await fetch('/api/admin/moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: 'report', reportId, status }),
    });
    if (res.ok) {
      showToast(`Report marked as ${status}.`, 'success');
      void fetchModerationData();
    }
  };

  const handleVerifyOrg = async (orgId: string, verified: boolean) => {
    const res = await fetch('/api/admin/moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: 'organization', orgId, verified }),
    });
    if (res.ok) {
      showToast('Organization verification updated.', 'success');
      void fetchModerationData();
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('admin_mod_title')}
            </h1>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setTab('jobs')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'jobs'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 inline-block me-1.5" />
              {t('admin_mod_pending_jobs_tab')} ({pendingJobs.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('reports')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'reports'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Flag className="w-3.5 h-3.5 inline-block me-1.5" />
              {t('admin_mod_reports_tab')} ({reports.filter((r) => r.status === 'open').length})
            </button>
            <button
              type="button"
              onClick={() => setTab('orgs')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'orgs'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 inline-block me-1.5" />
              {t('admin_mod_orgs_tab')} ({organizations.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-40 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse" />
        ) : tab === 'jobs' ? (
          <div className="space-y-4">
            {pendingJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center text-sm text-slate-500">
                No pending or flagged employer jobs.
              </div>
            ) : (
              pendingJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Status: {job.status} · Location: {job.location || 'Remote'}
                      </p>
                      {job.moderationFlags && job.moderationFlags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {job.moderationFlags.map((flag) => (
                            <span
                              key={flag}
                              className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-bold"
                            >
                              Flag: {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleJobAction(job.id, 'approve')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('admin_mod_approve_btn')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJobAction(job.id, 'reject')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {t('admin_mod_reject_btn')}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line line-clamp-4">
                    {job.description}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : tab === 'reports' ? (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center text-sm text-slate-500">
                No user job reports submitted.
              </div>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {rep.jobTitle || rep.jobId}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                        {rep.reason}
                      </span>
                      <span className="text-xs text-slate-500">({rep.status})</span>
                    </div>
                    {rep.details && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">{rep.details}</p>
                    )}
                  </div>

                  {rep.status === 'open' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReportAction(rep.id, 'resolved')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold"
                      >
                        {t('admin_mod_resolve_report_btn')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReportAction(rep.id, 'dismissed')}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                      >
                        {t('admin_mod_dismiss_report_btn')}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {org.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {org.website || 'No website'} · Work email: {org.workEmail || 'Not set'} · HR Credits:{' '}
                    {org.hrCredits}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyOrg(org.id, !org.verified)}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold ${
                    org.verified
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {org.verified ? t('emp_org_verified_badge') : t('admin_mod_verify_org_btn')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

