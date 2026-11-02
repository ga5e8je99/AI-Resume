'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Users,
  Briefcase,
  Coins,
  ShieldCheck,
  ShieldAlert,
  MailCheck,
  Edit3,
  ExternalLink,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useLanguage } from '@/app/context/LanguageContext';
import { useToast } from '@/app/context/ToastContext';
import Reveal from '@/components/motion/Reveal';
import EmployerJobForm from '@/app/components/employer/EmployerJobForm';
import type {
  OrganizationRecord,
  EmployerJobRecord,
  OrganizationSize,
} from '@/lib/hr';
import { ORG_SIZES } from '@/lib/hr';

export default function EmployerDashboardPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeOrg, setActiveOrg] = useState<OrganizationRecord | null>(null);
  const [jobs, setJobs] = useState<EmployerJobRecord[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<EmployerJobRecord | null>(null);

  // Create organization form state
  const [orgName, setOrgName] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [orgIndustry, setOrgIndustry] = useState('');
  const [orgSize, setOrgSize] = useState<OrganizationSize>('1-10');
  const [orgCountry, setOrgCountry] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Domain verification state
  const [workEmail, setWorkEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employer/overview');
      const data = await res.json();
      if (res.ok && data.ok) {
        setActiveOrg(data.activeOrganization || null);
        setJobs(data.jobs || []);
        if (data.activeOrganization?.workEmail) {
          setWorkEmail(data.activeOrganization.workEmail);
        }
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || orgName.trim().length < 2) return;
    setCreatingOrg(true);
    try {
      const res = await fetch('/api/employer/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName.trim(),
          website: orgWebsite.trim(),
          industry: orgIndustry.trim(),
          size: orgSize,
          country: orgCountry.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActiveOrg(data.organization);
        setJobs([]);
        showToast('Organization created successfully!', 'success');
      } else {
        showToast(data.message || 'Could not create organization.', 'error');
      }
    } catch {
      showToast('Network error while creating organization.', 'error');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleRequestVerificationCode = async () => {
    if (!activeOrg || !workEmail.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/employer/organizations/${activeOrg.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          workEmail: workEmail.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCodeSent(true);
        showToast(data.message || 'Verification code sent!', 'success');
      } else {
        showToast(data.message || 'Invalid company email.', 'error');
      }
    } catch {
      showToast('Failed to send verification code.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmVerificationCode = async () => {
    if (!activeOrg || !verifyCode.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/employer/organizations/${activeOrg.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          code: verifyCode.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.organization) {
        setActiveOrg(data.organization);
        showToast('Organization domain verified!', 'success');
      } else {
        showToast(data.message || 'Invalid verification code.', 'error');
      }
    } catch {
      showToast('Failed to verify code.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0);

  const renderStatusBadge = (status: EmployerJobRecord['status']) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          {t('emp_status_published')}
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          {t('emp_status_pending')}
        </span>
      );
    }
    if (status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <FileText className="w-3 h-3" />
          {t('emp_status_draft')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400">
        {status === 'expired' ? t('emp_status_expired') : t('emp_status_closed')}
      </span>
    );
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <Reveal from="up">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {t('emp_dashboard_title')}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {t('emp_dashboard_subtitle')}
              </p>
            </div>

            {activeOrg && !composerOpen && (
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/employer/billing"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Coins className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  {t('emp_billing_nav_btn')}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setEditingJob(null);
                    setComposerOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  {t('emp_post_job_btn')}
                </button>
              </div>
            )}
          </div>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse"
              />
            ))}
          </div>
        ) : !activeOrg ? (
          /* Create Organization Onboarding Card */
          <Reveal from="up">
            <form
              onSubmit={handleCreateOrg}
              className="max-w-xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t('emp_create_org_title')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('emp_create_org_subtitle')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('emp_org_name_label')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Technologies"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('emp_org_website_label')}
                    </label>
                    <input
                      type="url"
                      value={orgWebsite}
                      onChange={(e) => setOrgWebsite(e.target.value)}
                      placeholder="https://company.com"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('emp_org_industry_label')}
                    </label>
                    <input
                      type="text"
                      value={orgIndustry}
                      onChange={(e) => setOrgIndustry(e.target.value)}
                      placeholder="Software / Fintech"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('emp_org_size_label')}
                    </label>
                    <select
                      value={orgSize}
                      onChange={(e) => setOrgSize(e.target.value as OrganizationSize)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                    >
                      {ORG_SIZES.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz} employees
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('emp_org_country_label')}
                    </label>
                    <input
                      type="text"
                      value={orgCountry}
                      onChange={(e) => setOrgCountry(e.target.value)}
                      placeholder="Egypt / UAE / Germany"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingOrg}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition disabled:opacity-50"
              >
                {t('emp_create_org_btn')}
              </button>
            </form>
          </Reveal>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Reveal from="up" delay={0}>
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t('emp_total_jobs_label')}
                    </span>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {jobs.length}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs mt-1 font-medium text-slate-600 dark:text-slate-400">
                      {activeOrg.verified ? (
                        <span className="text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {t('emp_org_verified_badge')}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {t('emp_org_unverified_badge')}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>
              </Reveal>

              <Reveal from="up" delay={80}>
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t('emp_total_applicants_label')}
                    </span>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {totalApplicants}
                    </p>
                    <span className="text-xs text-slate-500">{activeOrg.name}</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </Reveal>

              <Reveal from="up" delay={160}>
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t('emp_hr_credits_label')}
                    </span>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                      {activeOrg.hrCredits}
                    </p>
                    <Link
                      href="/employer/billing"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline mt-1"
                    >
                      {t('emp_buy_credits_btn')}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Domain Verification Banner if Unverified */}
            {!activeOrg.verified && (
              <Reveal from="up">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <MailCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {t('emp_verify_domain_title')}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {t('emp_verify_domain_desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="email"
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      placeholder={t('emp_verify_email_placeholder')}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs min-w-[240px]"
                    />
                    <button
                      type="button"
                      disabled={verifying}
                      onClick={handleRequestVerificationCode}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      {t('emp_verify_send_code_btn')}
                    </button>

                    {codeSent && (
                      <>
                        <input
                          type="text"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value)}
                          placeholder={t('emp_verify_code_placeholder')}
                          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs w-36"
                        />
                        <button
                          type="button"
                          disabled={verifying}
                          onClick={handleConfirmVerificationCode}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition disabled:opacity-50"
                        >
                          {t('emp_verify_confirm_btn')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Create / Edit Job Composer OR Jobs List */}
            {composerOpen ? (
              <EmployerJobForm
                orgId={activeOrg.id}
                orgName={activeOrg.name}
                orgVerified={activeOrg.verified}
                hrCredits={activeOrg.hrCredits}
                initialJob={editingJob}
                onCancel={() => {
                  setComposerOpen(false);
                  setEditingJob(null);
                }}
                onSuccess={() => {
                  setComposerOpen(false);
                  setEditingJob(null);
                  void fetchOverview();
                }}
              />
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('emp_jobs_list_title')}
                </h2>

                {jobs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center text-sm text-slate-500">
                    {t('emp_no_jobs_yet')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job, idx) => (
                      <Reveal key={job.id} from="up" delay={Math.min(idx * 80, 400)}>
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {job.title}
                              </h3>
                              {renderStatusBadge(job.status)}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {job.location || 'Remote'} · {job.employmentType} · {job.seniority}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <Link
                              href={`/employer/jobs/${job.id}/applicants`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition"
                            >
                              <Users className="w-3.5 h-3.5" />
                              {t('emp_view_applicants_btn')} ({job.applicantsCount || 0})
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingJob(job);
                                setComposerOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              {t('emp_edit_job_btn')}
                            </button>
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

