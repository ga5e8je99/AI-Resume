'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Eye,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Sparkles,
  MapPin,
  DollarSign,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useToast } from '@/app/context/ToastContext';
import type { EmployerJobRecord, EmployerJobSeniority } from '@/lib/hr';
import type { EmploymentType } from '@/lib/profile';

interface EmployerJobFormProps {
  orgId: string;
  orgName: string;
  orgVerified: boolean;
  hrCredits: number;
  initialJob?: EmployerJobRecord | null;
  onSuccess?: (job: EmployerJobRecord) => void;
  onCancel?: () => void;
}

export default function EmployerJobForm({
  orgId,
  orgName,
  orgVerified,
  hrCredits,
  initialJob,
  onSuccess,
  onCancel,
}: EmployerJobFormProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'review'>('edit');
  const [title, setTitle] = useState(initialJob?.title || '');
  const [description, setDescription] = useState(initialJob?.description || '');
  const [requirementsText, setRequirementsText] = useState(
    (initialJob?.requirements || []).join('\n')
  );
  const [skillsText, setSkillsText] = useState((initialJob?.skills || []).join(', '));
  const [location, setLocation] = useState(initialJob?.location || '');
  const [remote, setRemote] = useState<boolean>(initialJob?.remote ?? false);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    initialJob?.employmentType || 'full-time'
  );
  const [seniority, setSeniority] = useState<EmployerJobSeniority>(
    initialJob?.seniority || 'any'
  );
  const [salaryMin, setSalaryMin] = useState<string>(
    initialJob?.salary?.min !== null && initialJob?.salary?.min !== undefined
      ? String(initialJob.salary.min)
      : ''
  );
  const [salaryMax, setSalaryMax] = useState<string>(
    initialJob?.salary?.max !== null && initialJob?.salary?.max !== undefined
      ? String(initialJob.salary.max)
      : ''
  );
  const [salaryCurrency, setSalaryCurrency] = useState<string>(
    initialJob?.salary?.currency || 'USD'
  );
  const [salaryVisible, setSalaryVisible] = useState<boolean>(
    initialJob?.salary?.visible ?? false
  );
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>(
    initialJob?.screeningQuestions || []
  );
  const [submitting, setSubmitting] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(initialJob?.id || null);

  const parsedRequirements = requirementsText
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean)
    .slice(0, 30);

  const parsedSkills = skillsText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);

  const parsedScreening = screeningQuestions
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 5);

  const handleAddQuestion = () => {
    if (screeningQuestions.length >= 5) return;
    setScreeningQuestions([...screeningQuestions, '']);
  };

  const handleQuestionChange = (index: number, value: string) => {
    const next = [...screeningQuestions];
    next[index] = value;
    setScreeningQuestions(next);
  };

  const handleRemoveQuestion = (index: number) => {
    setScreeningQuestions(screeningQuestions.filter((_, i) => i !== index));
  };

  const buildPayload = (publishNow: boolean) => ({
    orgId,
    title: title.trim(),
    description: description.trim(),
    requirements: parsedRequirements,
    skills: parsedSkills,
    location: location.trim(),
    remote,
    employmentType,
    seniority,
    salary: {
      min: salaryMin ? Number(salaryMin) : null,
      max: salaryMax ? Number(salaryMax) : null,
      currency: salaryCurrency || 'USD',
      visible: salaryVisible,
    },
    screeningQuestions: parsedScreening,
    status: publishNow ? 'published' : 'draft',
    publishNow,
  });

  const handleSubmit = async (publishNow: boolean) => {
    if (!title.trim() || title.trim().length < 2) {
      showToast('Please enter a valid job title.', 'error');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      showToast('Please enter a job description (at least 10 characters).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const targetId = savedDraftId || initialJob?.id;
      const endpoint = targetId ? `/api/employer/jobs/${targetId}` : '/api/employer/jobs';
      const method = targetId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(publishNow)),
      });

      const data = await res.json();

      if (data.job?.id) {
        setSavedDraftId(data.job.id);
      }

      if (res.status === 402 || data.error === 'INSUFFICIENT_HR_CREDITS') {
        showToast(t('emp_insufficient_credits_msg'), 'error');
        router.push(data.purchaseUrl || '/employer/billing');
        return;
      }

      if (!res.ok || !data.ok) {
        showToast(data.message || 'Failed to save job posting.', 'error');
        return;
      }

      showToast(
        publishNow
          ? data.job.status === 'pending'
            ? 'Job submitted and is pending admin review.'
            : 'Job published successfully!'
          : t('emp_draft_saved_toast'),
        'success'
      );

      if (onSuccess && data.job) {
        onSuccess(data.job);
      }
    } catch {
      showToast('Network error while saving job posting.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-sm p-6">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {initialJob ? t('emp_form_edit_title') : t('emp_form_create_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {orgName} · {t('emp_hr_credits_label')}:{' '}
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {hrCredits}
              </span>
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'edit'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 inline-block me-1.5" />
            {t('emp_form_tab_edit')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5 inline-block me-1.5" />
            {t('emp_form_tab_preview')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'review'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 inline-block me-1.5" />
            {t('emp_form_tab_review')}
          </button>
        </div>
      </div>

      {/* TAB 1: EDIT FORM */}
      {activeTab === 'edit' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('emp_job_title_label')} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('emp_job_location_label')}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Cairo / Dubai / Remote"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={remote}
                    onChange={(e) => setRemote(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {t('emp_job_remote_label')}
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('emp_job_emp_type_label')}
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('emp_job_seniority_label')}
              </label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value as EmployerJobSeniority)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              >
                <option value="any">Any Level</option>
                <option value="student">Student / Fresh Grad</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid-Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead / Principal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('emp_job_desc_label')} *
            </label>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the responsibilities, team culture, and impact..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('emp_job_reqs_label')}
              </label>
              <textarea
                rows={4}
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                placeholder="3+ years experience with React&#10;Strong TypeScript fundamentals"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('emp_job_skills_label')}
              </label>
              <textarea
                rows={4}
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="TypeScript, React, Next.js, Node.js, SQL"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('emp_job_salary_min_label')}
              </label>
              <input
                type="number"
                min={0}
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="2000"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('emp_job_salary_max_label')}
              </label>
              <input
                type="number"
                min={0}
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="4000"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('emp_job_salary_currency_label')}
              </label>
              <input
                type="text"
                maxLength={5}
                value={salaryCurrency}
                onChange={(e) => setSalaryCurrency(e.target.value.toUpperCase())}
                placeholder="USD"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>
            <div className="pb-2">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={salaryVisible}
                  onChange={(e) => setSalaryVisible(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600"
                />
                {t('emp_job_salary_visible_label')}
              </label>
            </div>
          </div>

          {/* Optional Screening Questions (Max 5) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t('emp_screening_title')} ({screeningQuestions.length}/5)
              </span>
              {screeningQuestions.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('emp_screening_add_btn')}
                </button>
              )}
            </div>

            {screeningQuestions.map((q, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={q}
                  onChange={(e) => handleQuestionChange(idx, e.target.value)}
                  placeholder={t('emp_screening_placeholder')}
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(idx)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-5 p-5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                {orgName}
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {title || 'Untitled Job Role'}
              </h3>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {location || 'Unspecified'} {remote ? '· Remote' : ''}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
                  {employmentType}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                  {seniority}
                </span>
                {salaryVisible && (salaryMin || salaryMax) && (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                    <DollarSign className="w-3.5 h-3.5" />
                    {salaryMin || '0'} - {salaryMax || 'Open'} {salaryCurrency}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-slate-700">
            {description || 'No description provided yet.'}
          </div>

          {parsedRequirements.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {t('emp_job_reqs_label')}
              </h4>
              <ul className="list-disc ps-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {parsedRequirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {parsedSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {parsedSkills.map((sk, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                >
                  {sk}
                </span>
              ))}
            </div>
          )}

          {parsedScreening.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {t('emp_screening_title')}
              </h4>
              <ol className="list-decimal ps-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {parsedScreening.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REVIEW & PUBLISH */}
      {activeTab === 'review' && (
        <div className="space-y-4 p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-900 dark:text-white">
                {t('emp_form_tab_review')}
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs">
                {t('emp_review_before_publish_note')}
              </p>
              {!orgVerified && (
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  • {t('emp_org_unverified_badge')}: {t('emp_verify_domain_desc')}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">{t('emp_job_title_label')}</span>
              <span className="font-bold text-slate-900 dark:text-white">{title || '—'}</span>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">{t('emp_job_skills_label')}</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {parsedSkills.length} skills
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">Screening</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {parsedScreening.length} / 5
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">{t('emp_hr_credits_label')}</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {hrCredits} available
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Footer */}
      <div className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit(false)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {t('emp_save_draft_btn')}
        </button>

        {activeTab !== 'review' ? (
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t('emp_form_tab_review')}
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {t('emp_publish_job_btn')}
          </button>
        )}
      </div>
    </div>
  );
}

