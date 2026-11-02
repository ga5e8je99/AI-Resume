'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/context/LanguageContext';

interface ScreeningQuestion {
  id: string;
  question: string;
  required: boolean;
}

export interface PublicJobView {
  id: string;
  slug: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  location: string;
  remote: boolean;
  employmentType: string;
  seniority: string;
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    visible: boolean;
  };
  screeningQuestions: ScreeningQuestion[];
  status: string;
  publishedAt?: string;
  expiresAt?: string;
}

export interface PublicOrgView {
  id: string;
  name: string;
  website?: string;
  logo?: string;
  industry?: string;
  size?: string;
  country?: string;
  verified: boolean;
}

interface SavedResumeSummary {
  id: string;
  title: string;
  updatedAt: string;
  data?: Record<string, unknown>;
}

export default function HireJobClient({
  job,
  organization,
  initialAlreadyApplied = false,
}: {
  job: PublicJobView;
  organization: PublicOrgView;
  initialAlreadyApplied?: boolean;
}) {
  const { t, dir } = useLanguage();

  const [savedResumes, setSavedResumes] = useState<SavedResumeSummary[]>([]);
  const [cvMode, setCvMode] = useState<'saved' | 'upload'>('saved');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [generatingCl, setGeneratingCl] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);
  const [sharePhone, setSharePhone] = useState<boolean>(false);
  const [shareSalary, setShareSalary] = useState<boolean>(false);

  const [showApplyForm, setShowApplyForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [alreadyApplied, setAlreadyApplied] = useState<boolean>(initialAlreadyApplied);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/resumes')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data) return;
        const list: SavedResumeSummary[] = Array.isArray(data.resumes) ? data.resumes : [];
        setSavedResumes(list);
        if (list.length > 0) {
          setSelectedResumeId(list[0].id);
          setCvMode('saved');
        } else {
          setCvMode('upload');
        }
      })
      .catch(() => {
        if (active) setCvMode('upload');
      });
    return () => {
      active = false;
    };
  }, []);

  const handleGenerateCoverLetter = async () => {
    setErrorMsg(null);
    setGeneratingCl(true);
    try {
      const selected = savedResumes.find((r) => r.id === selectedResumeId);
      const resumeContext = selected?.data
        ? JSON.stringify(selected.data).slice(0, 4000)
        : `${job.title} candidate with skills in ${job.skills.join(', ')}`;

      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: job.title,
          companyName: organization.name,
          jobDescription: job.description.slice(0, 3000),
          resumeText: resumeContext,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.coverLetter) {
          setCoverLetter(String(data.coverLetter));
          return;
        }
      }
      // Fallback concise template if user has no AI credits or endpoint unavailable
      setCoverLetter(
        `Dear ${organization.name} Hiring Team,\n\nI am excited to apply for the ${job.title} position. My experience with ${job.skills.slice(0, 4).join(', ') || 'relevant technologies'} aligns closely with your requirements, and I look forward to contributing to ${organization.name}.\n\nBest regards`
      );
    } catch {
      setCoverLetter(
        `Dear ${organization.name} Hiring Team,\n\nI am writing to apply for the ${job.title} role at ${organization.name}.\n\nBest regards`
      );
    } finally {
      setGeneratingCl(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const f = e.target.files?.[0] || null;
    if (!f) {
      setUploadedFile(null);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setErrorMsg('File exceeds maximum allowed size of 5 MB.');
      e.target.value = '';
      return;
    }
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
    if (!['.pdf', '.docx', '.doc', '.txt'].includes(ext)) {
      setErrorMsg('Unsupported file format. Please upload PDF, DOCX, DOC, or TXT.');
      e.target.value = '';
      return;
    }
    setUploadedFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!consentAccepted) {
      setErrorMsg(t('hire_consent_checkbox_label'));
      return;
    }

    if (cvMode === 'saved' && !selectedResumeId) {
      setErrorMsg(t('hire_select_cv_label'));
      return;
    }
    if (cvMode === 'upload' && !uploadedFile) {
      setErrorMsg(t('hire_upload_cv_label'));
      return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = (job.screeningQuestions || [])
        .map((q) => ({
          questionId: q.id,
          question: q.question,
          answer: (answers[q.id] || '').trim(),
        }))
        .filter((a) => a.answer.length > 0);

      let res: Response;
      if (cvMode === 'upload' && uploadedFile) {
        const fd = new FormData();
        fd.append('file', uploadedFile);
        if (coverLetter.trim()) fd.append('coverLetter', coverLetter.trim());
        fd.append('answers', JSON.stringify(formattedAnswers));
        fd.append('consentAccepted', String(consentAccepted));
        fd.append('sharePhone', String(sharePhone));
        fd.append('shareSalary', String(shareSalary));

        res = await fetch(`/api/jobs/hire/${encodeURIComponent(job.slug)}/apply`, {
          method: 'POST',
          body: fd,
        });
      } else {
        res = await fetch(`/api/jobs/hire/${encodeURIComponent(job.slug)}/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeId: selectedResumeId,
            coverLetter: coverLetter.trim() || undefined,
            answers: formattedAnswers,
            consentAccepted,
            sharePhone,
            shareSalary,
          }),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (res.status === 409 || data.error === 'DUPLICATE_APPLICATION') {
          setAlreadyApplied(true);
          setErrorMsg(t('hire_already_applied_msg'));
        } else {
          setErrorMsg(data.reason || data.message || data.error || 'Failed to submit application');
        }
        return;
      }

      setSubmitted(true);
      setAlreadyApplied(true);
    } catch {
      setErrorMsg('Network error while submitting application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-[#FAF8F5] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Job Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 text-start">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {t('hire_direct_badge')}
                </span>
                {organization.verified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    ✓ {t('hire_verified_org')}
                  </span>
                )}
                <span className="text-xs text-slate-500 uppercase tracking-wider">
                  {job.employmentType} · {job.seniority}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{job.title}</h1>
              <p className="text-base font-medium text-slate-700">
                {organization.name} · {job.location} {job.remote ? '(Remote)' : ''}
              </p>

              {job.salary?.visible && (job.salary.min || job.salary.max) && (
                <p className="text-sm font-semibold text-emerald-700">
                  {job.salary.currency} {job.salary.min?.toLocaleString() || ''}{' '}
                  {job.salary.max ? `– ${job.salary.max.toLocaleString()}` : ''}
                </p>
              )}
            </div>

            {!submitted && !alreadyApplied && (
              <button
                type="button"
                onClick={() => setShowApplyForm(true)}
                className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
              >
                {t('hire_apply_now_btn')}
              </button>
            )}
          </div>

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Description & Requirements */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 text-start">
            <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-700 text-sm leading-relaxed">
              {job.description}
            </div>

            {job.requirements.length > 0 && (
              <div className="pt-2">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                  {t('emp_job_reqs_label')}
                </h2>
                <ul className="list-disc ps-5 space-y-1 text-sm text-slate-700">
                  {job.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Already Applied Notice */}
        {alreadyApplied && !submitted && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-start flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-medium text-amber-900">{t('hire_already_applied_msg')}</p>
            <Link
              href="/applications"
              className="px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 transition"
            >
              {t('hire_view_my_apps_btn')}
            </Link>
          </div>
        )}

        {/* Confirmation Screen */}
        {submitted && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h2 className="text-xl font-bold text-emerald-950">{t('hire_confirmed_title')}</h2>
            <p className="text-sm text-emerald-900 max-w-xl mx-auto">{t('hire_confirmed_desc')}</p>
            <div className="pt-2">
              <Link
                href="/applications"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition"
              >
                {t('hire_view_my_apps_btn')}
              </Link>
            </div>
          </div>
        )}

        {/* Interactive Apply Form */}
        {(showApplyForm || !alreadyApplied) && !submitted && !alreadyApplied && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 text-start"
          >
            <h2 className="text-xl font-bold text-slate-900">{t('hire_apply_now_btn')}</h2>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            {/* 1. CV Selection or Upload */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setCvMode('saved')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    cvMode === 'saved'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {t('hire_select_cv_label')}
                </button>
                <button
                  type="button"
                  onClick={() => setCvMode('upload')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    cvMode === 'upload'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {t('hire_upload_cv_label')}
                </button>
              </div>

              {cvMode === 'saved' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('hire_select_cv_label')}
                  </label>
                  {savedResumes.length > 0 ? (
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                    >
                      {savedResumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No saved CVs found in your account. Switch to file upload above.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('hire_upload_cv_label')}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-700 file:me-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100"
                  />
                  <p className="mt-1 text-xs text-slate-500">{t('hire_upload_cv_hint')}</p>
                </div>
              )}
            </div>

            {/* 2. Optional Cover Letter + AI Generation */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('hire_cover_letter_label')}
                </label>
                <button
                  type="button"
                  onClick={handleGenerateCoverLetter}
                  disabled={generatingCl}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50 cursor-pointer"
                >
                  ✨ {generatingCl ? '...' : t('hire_generate_cl_ai_btn')}
                </button>
              </div>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm"
              />
            </div>

            {/* 3. Screening Questions */}
            {job.screeningQuestions && job.screeningQuestions.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">{t('hire_screening_heading')}</h3>
                {job.screeningQuestions.map((q) => (
                  <div key={q.id} className="space-y-1">
                    <label className="block text-xs font-medium text-slate-800">
                      {q.question} {q.required && <span className="text-red-600">*</span>}
                    </label>
                    <input
                      type="text"
                      required={q.required}
                      value={answers[q.id] || ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 4. Explicit Consent & Privacy Checkboxes */}
            <div className="space-y-3 pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-xl">
              <label className="flex items-start gap-3 text-xs text-slate-800 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>{t('hire_consent_checkbox_label')}</span>
              </label>

              <label className="flex items-start gap-3 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sharePhone}
                  onChange={(e) => setSharePhone(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>{t('hire_share_phone_label')}</span>
              </label>

              <label className="flex items-start gap-3 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareSalary}
                  onChange={(e) => setShareSalary(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>{t('hire_share_salary_label')}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !consentAccepted}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-sm transition cursor-pointer"
            >
              {submitting ? '...' : t('hire_submit_application_btn')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

