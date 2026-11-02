'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Building,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  ExternalLink,
  Bookmark,
  Mail,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  Flag,
} from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useToast } from '@/app/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Job } from '@/lib/jobs/types';
import type { JobReportReason } from '@/lib/hr';
import MatchScoreBadge from './MatchScoreBadge';

interface JobDetailsDrawerProps {
  job: Job | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (job: Job) => void;
  onApplyClick: (job: Job) => void;
}

export default function JobDetailsDrawer({
  job,
  onClose,
  isSaved,
  onToggleSave,
  onApplyClick,
}: JobDetailsDrawerProps) {
  const { t, isRtl } = useLanguage();
  const { showToast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<JobReportReason>('payment_request');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setReporting(true);
    try {
      const res = await fetch('/api/jobs/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      if (res.ok) {
        showToast(t('jobs_report_submitted_toast'), 'success');
        setReportOpen(false);
        setReportDetails('');
      } else {
        showToast('Please sign in to report a job.', 'error');
      }
    } catch {
      showToast('Failed to submit report.', 'error');
    } finally {
      setReporting(false);
    }
  };

  useEffect(() => {
    if (!job) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [job, onClose]);

  if (!job) return null;

  const hasMatchScore = typeof job.matchScore === 'number';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-drawer-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-paper text-ink h-full shadow-2xl border-s border-line-strong flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Header */}
        <div className="p-5 sm:p-6 border-b border-line-strong bg-surface flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-2 text-accent border border-line-strong">
                {job.source}
              </span>
              {job.remote && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 font-semibold">
                  {t('jobs_filter_remote_btn')}
                </span>
              )}
              {job.jobType && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-2 text-ink-2">
                  {job.jobType}
                </span>
              )}
            </div>

            <h2
              id="job-drawer-title"
              className="text-lg sm:text-xl font-serif font-bold text-ink leading-snug"
            >
              {job.title}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-accent" />
                <span>{job.company}</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{job.location}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('jobs_drawer_close_aria')}
            className="w-8 h-8 rounded-lg border border-line-strong bg-paper text-ink-2 hover:text-ink hover:border-accent/50 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {job.postedDate && (
              <div className="rounded-lg border border-line-strong bg-surface p-3 space-y-1">
                <span className="text-[10px] font-mono uppercase text-ink-2 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-accent" />
                  <span>{t('jobs_drawer_posted_on')}</span>
                </span>
                <p className="text-xs font-mono font-semibold text-ink">{job.postedDate}</p>
              </div>
            )}

            {job.jobType && (
              <div className="rounded-lg border border-line-strong bg-surface p-3 space-y-1">
                <span className="text-[10px] font-mono uppercase text-ink-2 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-accent" />
                  <span>{t('jobs_drawer_employment_type')}</span>
                </span>
                <p className="text-xs font-mono font-semibold text-ink">{job.jobType}</p>
              </div>
            )}

            {job.salary && (
              <div className="rounded-lg border border-line-strong bg-surface p-3 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono uppercase text-ink-2 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-success" />
                  <span>{t('jobs_drawer_salary_range')}</span>
                </span>
                <p className="text-xs font-mono font-semibold text-success">{job.salary}</p>
              </div>
            )}
          </div>

          {/* Match Breakdown (if CV Match mode was used) */}
          {hasMatchScore && (
            <div className="rounded-xl border border-line-strong bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>{t('jobs_why_matches_btn')}</span>
                </span>
                <MatchScoreBadge score={job.matchScore || 50} />
              </div>

              {Array.isArray(job.matchReasons) && job.matchReasons.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {job.matchReasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-ink-2 font-mono"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {Array.isArray(job.matchedSkills) && job.matchedSkills.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-line-strong/60">
                  <span className="text-[10px] font-mono uppercase font-bold text-success block">
                    {t('jobs_matched_skills_label')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.matchedSkills.map((sk) => (
                      <span
                        key={sk}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-success/10 text-success border border-success/20"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(job.missingSkills) && job.missingSkills.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-line-strong/60">
                  <span className="text-[10px] font-mono uppercase font-bold text-warning flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{t('jobs_missing_skills_label')}</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.missingSkills.map((sk) => (
                      <span
                        key={sk}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Job Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-serif font-semibold text-ink">
              {t('jobs_drawer_overview_title')}
            </h3>
            <div className="rounded-xl border border-line-strong bg-surface p-4 text-xs sm:text-sm text-ink-2 leading-relaxed whitespace-pre-line">
              {job.description || t('jobs_empty_state_desc')}
            </div>
          </div>

          {/* Tags & Categories */}
          {Array.isArray(job.tags) && job.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-ink-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-accent" />
                <span>{t('jobs_drawer_tags_title')}</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-surface-2 text-ink-2 border border-line-strong"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Report Job Section */}
          <div className="pt-3 border-t border-line-strong/60">
            {!reportOpen ? (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-ink-2 hover:text-warning transition"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{t('jobs_report_btn')}</span>
              </button>
            ) : (
              <form
                onSubmit={handleReportSubmit}
                className="rounded-xl border border-line-strong bg-surface p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-warning" />
                    <span>{t('jobs_report_modal_title')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="text-xs text-ink-2 hover:text-ink"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as JobReportReason)}
                  className="w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-xs text-ink"
                >
                  <option value="payment_request">{t('jobs_report_reason_payment')}</option>
                  <option value="fake_job">{t('jobs_report_reason_fake')}</option>
                  <option value="suspicious_links">{t('jobs_report_reason_links')}</option>
                  <option value="offensive">{t('jobs_report_reason_offensive')}</option>
                  <option value="other">{t('jobs_report_reason_other')}</option>
                </select>

                <textarea
                  rows={2}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder={t('jobs_report_details_placeholder')}
                  className="w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-xs text-ink"
                />

                <div className="flex justify-end">
                  <Button size="sm" variant="primary" type="submit" disabled={reporting}>
                    <span>{t('jobs_report_submit_btn')}</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-line-strong bg-surface flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleSave(job)}
              leftIcon={
                <Bookmark
                  className={`w-3.5 h-3.5 ${isSaved ? 'fill-accent text-accent' : ''}`}
                />
              }
              className={`text-xs ${
                isSaved ? 'border-accent text-accent bg-accent/5' : 'border-line-strong'
              }`}
            >
              <span>
                {isSaved ? t('jobs_drawer_saved_btn') : t('jobs_drawer_save_btn')}
              </span>
            </Button>

            <Link
              href={`/cover-letter?targetRole=${encodeURIComponent(
                job.title
              )}&company=${encodeURIComponent(job.company)}`}
            >
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Mail className="w-3.5 h-3.5" />}
                className="text-xs border-line-strong"
              >
                <span>{t('jobs_tailor_cover_btn')}</span>
              </Button>
            </Link>
          </div>

          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onApplyClick(job)}
            className="inline-flex"
          >
            <Button
              size="md"
              variant="primary"
              rightIcon={<ExternalLink className="w-4 h-4" />}
            >
              <span>
                {t('jobs_drawer_apply_btn').replace('{source}', job.source)}
              </span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

