'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/context/LanguageContext';

interface CandidateApplicationItem {
  id: string;
  jobId: string;
  jobTitle: string;
  jobSlug: string;
  jobLocation: string;
  jobRemote: boolean;
  organizationName: string;
  organizationLogo?: string;
  organizationVerified: boolean;
  status: 'new' | 'shortlisted' | 'interview' | 'rejected' | 'hired';
  coverLetter?: string;
  answers: Array<{ questionId: string; question: string; answer: string }>;
  consent: {
    sharedAt: string;
    version: string;
    sharePhone?: boolean;
    shareSalary?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export default function CandidateApplicationsPage() {
  const { t, dir } = useLanguage();
  const [applications, setApplications] = useState<CandidateApplicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/applications')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.ok && Array.isArray(data.applications)) {
          setApplications(data.applications);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleWithdraw = async (applicationId: string) => {
    if (!window.confirm(t('my_apps_withdraw_confirm'))) return;
    setWithdrawingId(applicationId);
    setToastMsg(null);
    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(applicationId)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setApplications((prev) => prev.filter((item) => item.id !== applicationId));
        setToastMsg(t('my_apps_withdrawn_toast'));
      }
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusLabel = (status: CandidateApplicationItem['status']) => {
    switch (status) {
      case 'new':
        return t('emp_app_status_new');
      case 'shortlisted':
        return t('emp_app_status_shortlisted');
      case 'interview':
        return t('emp_app_status_interview');
      case 'rejected':
        return t('emp_app_status_rejected');
      case 'hired':
        return t('emp_app_status_hired');
      default:
        return status;
    }
  };

  const getStatusBadgeClasses = (status: CandidateApplicationItem['status']) => {
    switch (status) {
      case 'hired':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'interview':
      case 'shortlisted':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'rejected':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-[#FAF8F5] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-start space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('my_apps_title')}</h1>
          <p className="text-sm text-slate-600">{t('my_apps_subtitle')}</p>
        </div>

        {toastMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm text-start">
            {toastMsg}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-sm text-slate-500">
            ...
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-4">
            <p className="text-sm text-slate-600">{t('my_apps_empty')}</p>
            <Link
              href="/jobs"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition"
            >
              {t('jobs_find_matching_btn')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 text-start"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClasses(
                          app.status
                        )}`}
                      >
                        {getStatusLabel(app.status)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {t('my_apps_applied_on')}:{' '}
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900">
                      {app.jobSlug ? (
                        <Link
                          href={`/jobs/hire/${encodeURIComponent(app.jobSlug)}`}
                          className="hover:text-emerald-700 transition"
                        >
                          {app.jobTitle}
                        </Link>
                      ) : (
                        app.jobTitle
                      )}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {app.organizationName} · {app.jobLocation}{' '}
                      {app.jobRemote ? '(Remote)' : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleWithdraw(app.id)}
                    disabled={withdrawingId === app.id}
                    className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                  >
                    {withdrawingId === app.id ? '...' : t('my_apps_withdraw_btn')}
                  </button>
                </div>

                {app.answers && app.answers.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-700">
                      {t('hire_screening_heading')}
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {app.answers.map((ans) => (
                        <li key={ans.questionId}>
                          <span className="font-medium text-slate-800">{ans.question}:</span>{' '}
                          {ans.answer}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

