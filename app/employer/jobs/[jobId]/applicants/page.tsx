'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Mail,
  Sparkles,
  ShieldCheck,
  Filter,
  ArrowUpDown,
  Save,
  X,
  CheckCircle2,
  Scale,
  Trophy,
  HelpCircle,
  AlertTriangle,
  ListOrdered,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useLanguage } from '@/app/context/LanguageContext';
import { useToast } from '@/app/context/ToastContext';
import Reveal from '@/components/motion/Reveal';
import type { ApplicationStatus, EmployerJobRecord, ApplicationAnalysis } from '@/lib/hr';
import type { CandidateEmailTemplateType } from '@/lib/hr/moderation';
import type { Top10CandidateComparisonItem } from '@/lib/employer/analyzeApplicant';

interface EnrichedApplicant {
  id: string;
  jobId: string;
  orgId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateHeadline?: string;
  computedScore: number;
  manualRank?: number | null;
  status: ApplicationStatus;
  notes?: string;
  coverLetter?: string;
  answers: Array<{ question: string; answer: string }>;
  analysis?: ApplicationAnalysis | null;
  createdAt: string;
}

export default function JobApplicantsPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId || '';
  const router = useRouter();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<EmployerJobRecord | null>(null);
  const [applicants, setApplicants] = useState<EnrichedApplicant[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'status'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [rankDraft, setRankDraft] = useState<Record<string, string>>({});
  const [busyAppId, setBusyAppId] = useState<string | null>(null);

  // Bulk selection & Analyze queue state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAnalyzeConfirmModal, setShowAnalyzeConfirmModal] = useState(false);
  const [targetAnalyzeIds, setTargetAnalyzeIds] = useState<string[]>([]);
  const [analyzingQueue, setAnalyzingQueue] = useState(false);
  const [queueProgress, setQueueProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  // Top 10 Comparison Report state
  const [loadingTop10, setLoadingTop10] = useState(false);
  const [top10Report, setTop10Report] = useState<{
    executiveSummary: string;
    candidates: Top10CandidateComparisonItem[];
  } | null>(null);

  // Email modal state
  const [emailTarget, setEmailTarget] = useState<EnrichedApplicant | null>(null);
  const [emailTemplate, setEmailTemplate] =
    useState<CandidateEmailTemplateType>('interview');
  const [customMessage, setCustomMessage] = useState('');
  const [revealHrEmail, setRevealHrEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchApplicants = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        status: statusFilter,
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/api/employer/jobs/${jobId}/applicants?${qs.toString()}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setJob(data.job);
        setApplicants(data.applicants || []);
        const notesMap: Record<string, string> = {};
        const rankMap: Record<string, string> = {};
        for (const a of data.applicants || []) {
          notesMap[a.id] = a.notes || '';
          rankMap[a.id] =
            typeof a.manualRank === 'number' && a.manualRank > 0
              ? String(a.manualRank)
              : '';
        }
        setNotesDraft(notesMap);
        setRankDraft(rankMap);
      } else if (res.status === 403) {
        showToast('Access denied to this job posting.', 'error');
        router.push('/employer');
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }, [jobId, statusFilter, sortBy, sortOrder, router, showToast]);

  useEffect(() => {
    void fetchApplicants();
  }, [fetchApplicants]);

  const toggleSelectApplicant = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openBulkAnalyzeModal = () => {
    if (selectedIds.length > 0) {
      setTargetAnalyzeIds(selectedIds);
    } else {
      // Default to new / un-analyzed applicants, or all if all are analyzed
      const unanalyzed = applicants.filter((a) => !a.analysis).map((a) => a.id);
      setTargetAnalyzeIds(
        unanalyzed.length > 0 ? unanalyzed : applicants.map((a) => a.id)
      );
    }
    setShowAnalyzeConfirmModal(true);
  };

  const handleConfirmBulkAnalyze = async () => {
    if (targetAnalyzeIds.length === 0) {
      setShowAnalyzeConfirmModal(false);
      return;
    }
    setShowAnalyzeConfirmModal(false);
    setAnalyzingQueue(true);
    setQueueProgress({ done: 0, total: targetAnalyzeIds.length });

    const batchSize = 2;
    let processed = 0;

    try {
      for (let i = 0; i < targetAnalyzeIds.length; i += batchSize) {
        const chunk = targetAnalyzeIds.slice(i, i + batchSize);
        const res = await fetch(`/api/employer/jobs/${jobId}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze_batch',
            applicationIds: chunk,
            onlyNew: false,
            force: false,
          }),
        });
        const data = await res.json();
        if (res.status === 402 || data.error === 'INSUFFICIENT_HR_CREDITS') {
          showToast(t('emp_insufficient_credits_msg'), 'error');
          router.push(data.purchaseUrl || '/pricing?tab=hr');
          break;
        }
        if (!res.ok || !data.ok) {
          showToast(data.message || 'Batch analysis interrupted.', 'error');
          break;
        }
        processed += chunk.length;
        setQueueProgress({
          done: Math.min(processed, targetAnalyzeIds.length),
          total: targetAnalyzeIds.length,
        });
      }
      showToast('Applicant AI analysis completed!', 'success');
      setSelectedIds([]);
      await fetchApplicants();
    } catch {
      showToast('Network error during batch analysis.', 'error');
    } finally {
      setAnalyzingQueue(false);
    }
  };

  const handleGenerateTop10Report = async () => {
    setLoadingTop10(true);
    try {
      const res = await fetch(`/api/employer/jobs/${jobId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'compare_top10' }),
      });
      const data = await res.json();
      if (res.status === 402 || data.error === 'INSUFFICIENT_HR_CREDITS') {
        showToast(t('emp_insufficient_credits_msg'), 'error');
        router.push(data.purchaseUrl || '/pricing?tab=hr');
        return;
      }
      if (res.ok && data.ok && data.report) {
        setTop10Report({
          executiveSummary: data.report.executiveSummary,
          candidates: data.report.candidates || [],
        });
        showToast('Top 10 Comparison Report generated!', 'success');
      } else {
        showToast(data.message || 'Could not generate Top 10 report.', 'error');
      }
    } catch {
      showToast('Network error generating Top 10 report.', 'error');
    } finally {
      setLoadingTop10(false);
    }
  };

  const handleStatusChange = async (applicationId: string, nextStatus: ApplicationStatus) => {
    setBusyAppId(applicationId);
    try {
      const res = await fetch(`/api/employer/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setApplicants((prev) =>
          prev.map((a) => (a.id === applicationId ? { ...a, status: nextStatus } : a))
        );
        showToast('Applicant status updated.', 'success');
      } else {
        showToast(data.message || 'Failed to update status.', 'error');
      }
    } catch {
      showToast('Network error updating status.', 'error');
    } finally {
      setBusyAppId(null);
    }
  };

  const handleManualRankSave = async (applicationId: string) => {
    setBusyAppId(applicationId);
    const rawVal = rankDraft[applicationId]?.trim() || '';
    const parsedRank = rawVal === '' ? null : Math.max(1, Math.min(999, Number(rawVal) || 1));
    try {
      const res = await fetch(`/api/employer/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualRank: parsedRank }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast('Candidate ranking updated.', 'success');
        await fetchApplicants();
      } else {
        showToast(data.message || 'Failed to update rank.', 'error');
      }
    } catch {
      showToast('Network error updating rank.', 'error');
    } finally {
      setBusyAppId(null);
    }
  };

  const handleSaveNotes = async (applicationId: string) => {
    setBusyAppId(applicationId);
    try {
      const res = await fetch(`/api/employer/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesDraft[applicationId] || '' }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast('Private HR notes saved.', 'success');
      } else {
        showToast(data.message || 'Failed to save notes.', 'error');
      }
    } catch {
      showToast('Network error saving notes.', 'error');
    } finally {
      setBusyAppId(null);
    }
  };

  const handleRunAnalysis = async (applicationId: string) => {
    setBusyAppId(applicationId);
    try {
      const res = await fetch(`/api/employer/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runAnalysis: true }),
      });
      const data = await res.json();
      if (res.status === 402 || data.error === 'INSUFFICIENT_HR_CREDITS') {
        showToast(t('emp_insufficient_credits_msg'), 'error');
        router.push(data.purchaseUrl || '/pricing?tab=hr');
        return;
      }
      if (res.ok && data.ok) {
        showToast(
          data.cached
            ? 'Analysis already up-to-date for current job description (0 credits charged).'
            : 'AI analysis completed!',
          'success'
        );
        void fetchApplicants();
      } else {
        showToast(data.message || 'Failed to run analysis.', 'error');
      }
    } catch {
      showToast('Network error running analysis.', 'error');
    } finally {
      setBusyAppId(null);
    }
  };

  const handleSendCandidateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTarget) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/employer/applications/${emailTarget.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: emailTemplate,
          customMessage,
          revealHrEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(t('emp_email_sent_toast'), 'success');
        setEmailTarget(null);
        setCustomMessage('');
        setRevealHrEmail(false);
      } else {
        showToast(data.message || 'Failed to send email.', 'error');
      }
    } catch {
      showToast('Network error sending email.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/employer"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {t('emp_applicants_page_title')}: {job?.title || '...'}
              </h1>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('emp_privacy_notice')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={applicants.length === 0 || analyzingQueue}
              onClick={openBulkAnalyzeModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {selectedIds.length > 0
                ? `${t('emp_analyze_selected_btn')} (${selectedIds.length})`
                : t('emp_analyze_applicants_btn')}
            </button>

            <button
              type="button"
              disabled={applicants.length === 0 || loadingTop10}
              onClick={handleGenerateTop10Report}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-600/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition disabled:opacity-50"
            >
              <Trophy className="w-4 h-4" />
              {t('emp_compare_top10_btn')}
            </button>

            <a
              href={`/api/employer/jobs/${jobId}/applicants?format=csv`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              {t('emp_export_csv_btn')}
            </a>
          </div>
        </div>

        {/* Fairness, Anti-Bias Redaction & Human-in-the-Loop Notice */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h2 className="font-bold text-slate-900 dark:text-white">
              {t('emp_fairness_disclaimer_title')}
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {t('emp_fairness_disclaimer_body')}
            </p>
          </div>
        </div>

        {/* Live Batch Queue Progress Bar */}
        {analyzingQueue && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              <span className="inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                {t('emp_analyze_queue_progress')}
              </span>
              <span>
                {queueProgress.done} / {queueProgress.total}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-emerald-950/15 overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{
                  width: `${
                    queueProgress.total > 0
                      ? Math.round((queueProgress.done / queueProgress.total) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Top 10 Comparison Report Panel */}
        {top10Report && (
          <div className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('emp_compare_top10_title')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTop10Report(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              {top10Report.executiveSummary}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 pe-3 text-start">#</th>
                    <th className="py-2 px-3 text-start">ID</th>
                    <th className="py-2 px-3 text-start">Score</th>
                    <th className="py-2 px-3 text-start">{t('emp_analysis_strengths_label')}</th>
                    <th className="py-2 ps-3 text-start">{t('emp_analysis_gaps_label')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                  {top10Report.candidates.map((cand) => (
                    <tr key={cand.applicationId}>
                      <td className="py-2.5 pe-3 font-bold text-emerald-700 dark:text-emerald-400">
                        #{cand.rank}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {cand.anonymizedLabel}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {cand.score}%
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {cand.topStrength}
                      </td>
                      <td className="py-2.5 ps-3 text-amber-700 dark:text-amber-300">
                        {cand.primaryGap || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium"
            >
              <option value="all">{t('emp_filter_status_all')}</option>
              <option value="new">{t('emp_app_status_new')}</option>
              <option value="shortlisted">{t('emp_app_status_shortlisted')}</option>
              <option value="interview">{t('emp_app_status_interview')}</option>
              <option value="rejected">{t('emp_app_status_rejected')}</option>
              <option value="hired">{t('emp_app_status_hired')}</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'date' | 'status')}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium"
            >
              <option value="score">{t('emp_sort_by_score')}</option>
              <option value="date">{t('emp_sort_by_date')}</option>
              <option value="status">{t('emp_sort_by_status')}</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Applicants List */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse"
              />
            ))}
          </div>
        ) : applicants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center text-sm text-slate-500">
            No applicants matching the selected filter yet.
          </div>
        ) : (
          <div className="space-y-4">
            {applicants.map((app, idx) => (
              <Reveal key={app.id} from="up" delay={Math.min(idx * 80, 400)}>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(app.id)}
                        onChange={() => toggleSelectApplicant(app.id)}
                        className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        aria-label={`Select ${app.candidateName}`}
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {app.candidateName}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            Match {app.computedScore}%
                          </span>
                          {typeof app.manualRank === 'number' && app.manualRank > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                              #{app.manualRank} {t('emp_manual_rank_label')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {app.candidateHeadline || 'Candidate'} · Applied{' '}
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Manual Rank Input */}
                      <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2 py-1">
                        <ListOrdered className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="number"
                          min={1}
                          max={999}
                          placeholder="#"
                          value={rankDraft[app.id] ?? ''}
                          onChange={(e) =>
                            setRankDraft((prev) => ({ ...prev, [app.id]: e.target.value }))
                          }
                          onBlur={() => handleManualRankSave(app.id)}
                          aria-label={t('emp_manual_rank_label')}
                          className="w-12 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                      </div>

                      <select
                        disabled={busyAppId === app.id}
                        value={app.status}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value as ApplicationStatus)
                        }
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="new">{t('emp_app_status_new')}</option>
                        <option value="shortlisted">{t('emp_app_status_shortlisted')}</option>
                        <option value="interview">{t('emp_app_status_interview')}</option>
                        <option value="rejected">{t('emp_app_status_rejected')}</option>
                        <option value="hired">{t('emp_app_status_hired')}</option>
                      </select>

                      <button
                        type="button"
                        disabled={busyAppId === app.id}
                        onClick={() => handleRunAnalysis(app.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {t('emp_run_ai_analysis_btn')}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEmailTarget(app);
                          setEmailTemplate(
                            app.status === 'rejected'
                              ? 'rejected'
                              : app.status === 'shortlisted'
                              ? 'shortlisted'
                              : 'interview'
                          );
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {t('emp_send_email_btn')}
                      </button>
                    </div>
                  </div>

                  {/* AI Analysis Summary, Breakdown, Strengths, Gaps & Interview Questions */}
                  {app.analysis && (
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {app.analysis.summary}
                      </p>

                      {/* Score Component Breakdown */}
                      {app.analysis.scoreBreakdown && (
                        <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                          <div className="font-bold text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
                            <span>{t('emp_analysis_breakdown_label')}</span>
                            <div className="flex flex-wrap gap-3 text-[11px]">
                              <span className="text-emerald-700 dark:text-emerald-400">
                                Skills: {app.analysis.scoreBreakdown.skillsScore}/100
                              </span>
                              <span className="text-emerald-700 dark:text-emerald-400">
                                Experience: {app.analysis.scoreBreakdown.experienceScore}/100
                              </span>
                              <span className="text-emerald-700 dark:text-emerald-400">
                                Role Fit: {app.analysis.scoreBreakdown.roleFitScore}/100
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            {app.analysis.scoreBreakdown.explanation}
                          </p>
                        </div>
                      )}

                      {/* Matched & Missing Skills */}
                      <div className="flex flex-wrap gap-1.5">
                        {app.analysis.matchedSkills.map((sk, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-medium"
                          >
                            ✓ {sk}
                          </span>
                        ))}
                        {app.analysis.missingSkills.map((sk, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 font-medium"
                          >
                            Missing: {sk}
                          </span>
                        ))}
                      </div>

                      {/* Strengths, Gaps, & Suggested Interview Questions */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        {app.analysis.strengths && app.analysis.strengths.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                            <h4 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t('emp_analysis_strengths_label')}
                            </h4>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300">
                              {app.analysis.strengths.map((st, i) => (
                                <li key={i}>{st}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {app.analysis.gaps && app.analysis.gaps.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
                            <h4 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {t('emp_analysis_gaps_label')}
                            </h4>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300">
                              {app.analysis.gaps.map((gp, i) => (
                                <li key={i}>{gp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {app.analysis.interviewQuestions &&
                          app.analysis.interviewQuestions.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                <HelpCircle className="w-3.5 h-3.5" />
                                {t('emp_analysis_questions_label')}
                              </h4>
                              <ul className="list-decimal list-inside space-y-0.5 text-slate-700 dark:text-slate-300">
                                {app.analysis.interviewQuestions.map((q, i) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Screening Answers */}
                  {app.answers && app.answers.length > 0 && (
                    <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                      {app.answers.map((ans, i) => (
                        <div key={i}>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Q: {ans.question}
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 ps-3">{ans.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Private HR Notes */}
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        {t('emp_private_notes_label')}
                      </label>
                      <input
                        type="text"
                        value={notesDraft[app.id] ?? ''}
                        onChange={(e) =>
                          setNotesDraft((prev) => ({ ...prev, [app.id]: e.target.value }))
                        }
                        placeholder="Add private recruiter observations..."
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={busyAppId === app.id}
                      onClick={() => handleSaveNotes(app.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {t('emp_save_notes_btn')}
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* Confirm Bulk Analyze & Credit Cost Modal */}
        {showAnalyzeConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {t('emp_analyze_confirm_title')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAnalyzeConfirmModal(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('emp_analyze_confirm_cost_desc')}
              </p>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                <span>{t('emp_analyze_estimated_credits')}</span>
                <span className="text-sm">{targetAnalyzeIds.length} HR Credits</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnalyzeConfirmModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkAnalyze}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('emp_analyze_confirm_proceed_btn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Candidate Modal */}
        {emailTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <form
              onSubmit={handleSendCandidateEmail}
              className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('emp_email_modal_title')} — {emailTarget.candidateName}
                </h3>
                <button
                  type="button"
                  onClick={() => setEmailTarget(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('emp_email_template_label')}
                </label>
                <select
                  value={emailTemplate}
                  onChange={(e) =>
                    setEmailTemplate(e.target.value as CandidateEmailTemplateType)
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm"
                >
                  <option value="interview">{t('emp_email_tpl_interview')}</option>
                  <option value="shortlisted">{t('emp_email_tpl_shortlisted')}</option>
                  <option value="rejected">{t('emp_email_tpl_rejected')}</option>
                  <option value="custom">{t('emp_email_tpl_custom')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('emp_email_custom_msg_label')}
                </label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Optional details (e.g. proposed interview times or instructions)..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={revealHrEmail}
                  onChange={(e) => setRevealHrEmail(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600"
                />
                <span>{t('emp_email_reveal_hr_label')}</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('emp_email_send_confirm_btn')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
