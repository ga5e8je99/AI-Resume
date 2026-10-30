'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Tabs } from '@/components/ui/Tabs';
import { CircularGauge } from '@/components/ui/CircularGauge';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/app/context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Sparkles,
  BarChart3,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Layers,
  Zap,
  Copy,
  Download,
  Mail,
  Clock,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Check,
  Search,
  Sliders,
  Briefcase,
} from 'lucide-react';

interface SavedResume {
  id: string;
  title: string;
  templateId: string;
  theme: any;
  data: any;
  updatedAt: string;
}

interface SavedAnalysis {
  id: string;
  resumeFileName: string;
  targetRole: string;
  overallScore: number;
  grade: string;
  rankPercentile: string;
  matchLabel: string;
  createdAt: string;
  result?: {
    missingKeywords?: string[];
    matchingKeywords?: string[];
  };
}

interface SavedCoverLetter {
  id: string;
  title: string;
  targetRole?: string;
  companyName?: string;
  status?: string;
  tone?: string;
  content?: string;
  updatedAt: string;
  createdAt: string;
}

interface DeleteTarget {
  type: 'resume' | 'analysis' | 'coverLetter';
  id: string;
  title: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isRtl, language, setLanguage, supportedLanguages, t, formatRelativeTime } = useLanguage();
  const isAr = language === 'ar';
  const toast = useToast();

  // Data states
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [coverLetters, setCoverLetters] = useState<SavedCoverLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Active items tab: 'resumes' | 'analyses' | 'coverLetters'
  const [activeTab, setActiveTab] = useState<string>('resumes');

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnUrl=/dashboard');
    }
  }, [user, authLoading, router]);

  // Toast auto-dismiss & global toast trigger
  useEffect(() => {
    if (toastMessage) {
      if (toastMessage.type === 'error') {
        toast.error(toastMessage.text);
      } else {
        toast.success(toastMessage.text);
      }
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, toast]);

  // Fetch all dashboard data concurrently
  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setFetchError(null);

      const [resumesRes, analysesRes, coverLettersRes] = await Promise.all([
        fetch('/api/resumes'),
        fetch('/api/analyses'),
        fetch('/api/cover-letters?limit=50&summary=true'),
      ]);

      if (!resumesRes.ok && !analysesRes.ok && !coverLettersRes.ok) {
        throw new Error('Failed to communicate with dashboard APIs.');
      }

      if (resumesRes.ok) {
        const rData = await resumesRes.json();
        setResumes(rData.resumes || []);
      }

      if (analysesRes.ok) {
        const aData = await analysesRes.json();
        setAnalyses(aData.analyses || []);
      }

      if (coverLettersRes.ok) {
        const cData = await coverLettersRes.json();
        setCoverLetters(cData.coverLetters || []);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setFetchError(err?.message || t('common_error'));
    } finally {
      setIsLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // -------------------------------------------------------------
  // Derived KPIs & Next-Best-Action computations
  // -------------------------------------------------------------
  const latestAnalysis = useMemo(() => {
    if (!analyses || analyses.length === 0) return null;
    return analyses[0];
  }, [analyses]);

  const latestScore = latestAnalysis ? latestAnalysis.overallScore : null;

  const cvCount = useMemo(() => {
    return resumes.filter(
      (r) =>
        r.data?.documentType === 'cv' ||
        ['europass', 'executive', 'academic', 'modern-two-column', 'classic-ats'].includes(r.templateId)
    ).length;
  }, [resumes]);

  const resumeCount = resumes.length - cvCount;

  // Compute most recent activity timestamp across all collections
  const latestActivity = useMemo(() => {
    const dates: { date: Date; label: string }[] = [];

    if (resumes.length > 0) {
      const topResume = resumes[0];
      dates.push({
        date: new Date(topResume.updatedAt || topResume.data?.updatedAt || 0),
        label: `${t('dashboard_updated_resume')}: ${topResume.title}`,
      });
    }

    if (analyses.length > 0) {
      const topAnalysis = analyses[0];
      dates.push({
        date: new Date(topAnalysis.createdAt || 0),
        label: `${t('dashboard_ats_scan')}: ${topAnalysis.resumeFileName}`,
      });
    }

    if (coverLetters.length > 0) {
      const topCL = coverLetters[0];
      dates.push({
        date: new Date(topCL.updatedAt || topCL.createdAt || 0),
        label: `${t('dashboard_cover_letter')}: ${topCL.title}`,
      });
    }

    if (dates.length === 0) return null;

    dates.sort((a, b) => b.date.getTime() - a.date.getTime());
    return dates[0];
  }, [resumes, analyses, coverLetters, t]);

  // Next-Best-Action card context
  const nextBestAction = useMemo(() => {
    // 1. New user: No resumes and no scans
    if (resumes.length === 0 && analyses.length === 0) {
      return {
        badge: t('dashboard_rec_step_badge'),
        title: t('dashboard_rec_step_title'),
        description: t('dashboard_rec_step_desc'),
        primaryAction: {
          label: t('dashboard_scan_my_resume'),
          href: '/review',
        },
        secondaryAction: {
          label: t('dashboard_create_scratch'),
          href: '/builder',
        },
        type: 'upload_first',
      };
    }

    // 2. Scan exists with missing keywords or score < 80
    if (latestAnalysis && latestAnalysis.overallScore < 80) {
      return {
        badge: t('dashboard_action_needed'),
        title: t('dashboard_fix_keywords_title'),
        description: t('dashboard_fix_keywords_desc'),
        primaryAction: {
          label: t('dashboard_view_report'),
          href: '/review',
        },
        secondaryAction: {
          label: t('dashboard_fix_in_builder'),
          href: resumes.length > 0 ? `/builder?id=${resumes[0].id}` : '/builder',
        },
        type: 'fix_keywords',
      };
    }

    // 3. Has resume & good score, but no cover letter
    if (resumes.length > 0 && coverLetters.length === 0) {
      return {
        badge: t('dashboard_action_needed'),
        title: t('dashboard_tailor_cover_title'),
        description: t('dashboard_tailor_cover_desc'),
        primaryAction: {
          label: t('dashboard_create_cover_letter'),
          href: '/cover-letter',
        },
        secondaryAction: {
          label: t('dashboard_view_all'),
          href: `/builder?id=${resumes[0].id}`,
        },
        type: 'build_cover_letter',
      };
    }

    // 4. Fully established user
    return {
      badge: t('dashboard_rec_step_badge'),
      title: t('dashboard_rec_step_title'),
      description: t('dashboard_rec_step_desc'),
      primaryAction: {
        label: t('builder_export_pdf'),
        href: resumes.length > 0 ? `/builder?id=${resumes[0].id}` : '/builder',
      },
      secondaryAction: {
        label: t('dashboard_scan_my_resume'),
        href: '/review',
      },
      type: 'export_ready',
    };
  }, [resumes, analyses, coverLetters, latestAnalysis, t]);

  // -------------------------------------------------------------
  // Quick Actions Handlers
  // -------------------------------------------------------------
  const handleDuplicateResume = async (resume: SavedResume) => {
    try {
      setActionLoadingId(resume.id);
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${resume.title} (${isAr ? 'نسخة' : 'Copy'})`,
          templateId: resume.templateId,
          theme: resume.theme,
          data: resume.data,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.resume) {
          setResumes((prev) => [data.resume, ...prev]);
          setToastMessage({
            type: 'success',
            text: isAr ? 'تم تكرار السيرة الذاتية بنجاح!' : 'Resume duplicated successfully!',
          });
        }
      } else {
        throw new Error('Failed to duplicate resume');
      }
    } catch {
      setToastMessage({
        type: 'error',
        text: isAr ? 'تعذر تكرار السيرة الذاتية.' : 'Failed to duplicate resume.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDuplicateCoverLetter = async (letter: SavedCoverLetter) => {
    try {
      setActionLoadingId(letter.id);
      const res = await fetch('/api/cover-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${letter.title} (${isAr ? 'نسخة' : 'Copy'})`,
          targetRole: letter.targetRole || 'Professional Role',
          companyName: letter.companyName || 'Target Company',
          content: letter.content || '',
          status: 'draft',
          tone: letter.tone || 'professional',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.coverLetter) {
          setCoverLetters((prev) => [data.coverLetter, ...prev]);
          setToastMessage({
            type: 'success',
            text: isAr ? 'تم تكرار خطاب التقديم بنجاح!' : 'Cover letter duplicated successfully!',
          });
        }
      } else {
        throw new Error('Failed to duplicate cover letter');
      }
    } catch {
      setToastMessage({
        type: 'error',
        text: isAr ? 'تعذر تكرار خطاب التقديم.' : 'Failed to duplicate cover letter.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyCoverLetterContent = async (letter: SavedCoverLetter) => {
    if (!letter.content) {
      setToastMessage({
        type: 'error',
        text: isAr ? 'الخطاب لا يحتوي على نص للنسخ.' : 'No text content available to copy.',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(letter.content);
      setCopiedId(letter.id);
      setToastMessage({
        type: 'success',
        text: isAr ? 'تم نسخ نص خطاب التقديم إلى الحافظة!' : 'Cover letter content copied to clipboard!',
      });
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setToastMessage({
        type: 'error',
        text: isAr ? 'تعذر النسخ إلى الحافظة.' : 'Could not copy to clipboard.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      let endpoint = '';
      if (deleteTarget.type === 'resume') endpoint = `/api/resumes/${deleteTarget.id}`;
      else if (deleteTarget.type === 'analysis') endpoint = `/api/analyses/${deleteTarget.id}`;
      else if (deleteTarget.type === 'coverLetter') endpoint = `/api/cover-letters/${deleteTarget.id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        if (deleteTarget.type === 'resume') {
          setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        } else if (deleteTarget.type === 'analysis') {
          setAnalyses((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        } else if (deleteTarget.type === 'coverLetter') {
          setCoverLetters((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        }
        setToastMessage({
          type: 'success',
          text: t('dashboard_item_deleted'),
        });
      } else {
        throw new Error('Failed to delete item');
      }
    } catch {
      setToastMessage({
        type: 'error',
        text: t('dashboard_item_delete_failed'),
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // -------------------------------------------------------------
  // Navigation Tabs configuration
  // -------------------------------------------------------------
  const tabsList = useMemo(() => [
    {
      id: 'resumes',
      label: t('dashboard_tab_resumes'),
      icon: <FileText className="w-4 h-4" />,
      count: resumes.length,
    },
    {
      id: 'analyses',
      label: t('dashboard_tab_scans'),
      icon: <ShieldCheck className="w-4 h-4" />,
      count: analyses.length,
    },
    {
      id: 'coverLetters',
      label: t('dashboard_tab_letters'),
      icon: <Mail className="w-4 h-4" />,
      count: coverLetters.length,
    },
    {
      id: 'settings',
      label: t('dashboard_tab_settings'),
      icon: <Sliders className="w-4 h-4" />,
    },
  ], [resumes.length, analyses.length, coverLetters.length, t]);

  // Header quick actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Link href="/builder">
        <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
          <span>{t('dashboard_btn_new_resume')}</span>
        </Button>
      </Link>
    </div>
  );

  return (
    <AppShell
      breadcrumbs={[{ label: t('dashboard_title') }]}
      title={`${t('dashboard_welcome')}, ${user?.name || ''}!`}
      description={t('dashboard_subtitle')}
      actions={headerActions}
    >
      <div className="space-y-8 max-w-7xl mx-auto w-full">
        {/* Floating Notification Toast */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed top-20 start-1/2 -translate-x-1/2 z-toast px-4 py-2.5 rounded-md shadow-elevated border text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
              toastMessage.type === 'error'
                ? 'bg-danger-soft text-danger border-danger/30'
                : 'bg-success-soft text-success border-success/30'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Check className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Error State with Retry */}
        {fetchError && (
          <Card className="border-danger/30 bg-danger-soft/30 p-4">
            <CardBody className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">
                    {t('error_title')}
                  </h4>
                  <p className="text-xs text-text-secondary mt-0.5">{fetchError}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchData}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                <span>{t('error_try_again')}</span>
              </Button>
            </CardBody>
          </Card>
        )}

        {/* TOP: Welcome & Next-Best-Action Card + Credits Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Next-Best-Action Highlight Card */}
          <div className="lg:col-span-2 relative rounded-xl border border-brand/25 bg-gradient-to-br from-surface to-surface-2 p-5 sm:p-6 shadow-subtle flex flex-col justify-between overflow-hidden">
            {/* Background glow ornament */}
            <div className="absolute -top-12 -end-12 w-48 h-48 bg-brand/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-soft text-brand border border-brand/20">
                  <Sparkles className="w-3 h-3" />
                  <span>{nextBestAction.badge}</span>
                </span>
                {user?.isDemo && (
                  <Badge variant="warning" size="sm" className="font-mono">
                    {isAr ? 'وضع تجريبي' : 'DEMO'}
                  </Badge>
                )}
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-text-primary tracking-tight">
                  {nextBestAction.title}
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed max-w-xl">
                  {nextBestAction.description}
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-4 mt-2 flex flex-wrap items-center gap-2.5">
              <Link href={nextBestAction.primaryAction.href}>
                <Button
                  size="sm"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />}
                >
                  <span>{nextBestAction.primaryAction.label}</span>
                </Button>
              </Link>

              <Link href="/resume/generate">
                <Button size="sm" variant="outline" className="border-accent/40 text-accent hover:bg-accent-soft" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                  <span>{isAr ? 'توليد بالذكاء الاصطناعي' : 'Generate with AI'}</span>
                </Button>
              </Link>

              <Link href="/jobs">
                <Button size="sm" variant="outline" className="border-border text-text-primary hover:bg-surface-2" leftIcon={<Briefcase className="w-3.5 h-3.5" />}>
                  <span>{isAr ? 'مطابقة الوظائف' : 'Job Match'}</span>
                </Button>
              </Link>

              {nextBestAction.secondaryAction && (
                <Link href={nextBestAction.secondaryAction.href}>
                  <Button size="sm" variant="secondary">
                    <span>{nextBestAction.secondaryAction.label}</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* AI Credits & Plan Widget */}
          <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-subtle flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t('dashboard_ai_plan')}
                </span>
                <Badge variant={user?.plan === 'pro' ? 'accent' : 'default'} size="sm" className="font-mono">
                  {(user?.plan || 'Free').toUpperCase()}
                </Badge>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold font-serif text-amber-400">
                    {user?.plan === 'pro' || user?.plan === 'enterprise'
                      ? '∞'
                      : user?.aiCredits ?? 3}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {user?.plan === 'pro' || user?.plan === 'enterprise'
                      ? t('dashboard_ai_unlimited')
                      : t('dashboard_ai_credits_left')}
                  </span>
                </div>

                {/* Progress Visual for Free tier */}
                {user?.plan !== 'pro' && user?.plan !== 'enterprise' && (
                  <div className="w-full bg-surface-2 h-2 rounded-full overflow-hidden mt-3 border border-border">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((user?.aiCredits ?? 3) / 5) * 100))}%`,
                      }}
                    />
                  </div>
                )}

                <p className="text-[11px] text-text-muted mt-2">
                  {user?.plan === 'pro'
                    ? t('dashboard_ai_pro_desc')
                    : t('dashboard_ai_free_desc')}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-3 flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium">
                {user?.plan === 'pro' ? t('dashboard_ai_pro_active') : t('dashboard_ai_get_unlimited')}
              </span>
              <Link href="/pricing">
                <Button size="sm" variant={user?.plan === 'pro' ? 'outline' : 'secondary'} className="text-xs">
                  <span>{user?.plan === 'pro' ? t('dashboard_manage_plan') : t('dashboard_upgrade_now')}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* KPI CARDS (4 CARDS) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Latest ATS Score (Circular Gauge) */}
          <div className="p-4 sm:p-5 rounded-lg bg-surface border border-border shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">
                {t('dashboard_kpi_latest_score')}
              </span>
              <Link href="/review" className="text-[11px] font-semibold text-brand hover:underline">
                {t('dashboard_view_all')}
              </Link>
            </div>

            <div className="py-2 flex items-center gap-3.5">
              <CircularGauge score={latestScore} size={58} strokeWidth={5} />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-text-primary block truncate">
                  {latestScore === null
                    ? t('dashboard_kpi_no_scans')
                    : latestScore >= 80
                    ? t('dashboard_kpi_excellent')
                    : latestScore >= 65
                    ? t('dashboard_kpi_good')
                    : t('dashboard_kpi_needs_work')}
                </span>
                <span className="text-[10px] text-text-muted font-mono truncate block">
                  {latestAnalysis?.resumeFileName || t('dashboard_kpi_scan_benchmark')}
                </span>
              </div>
            </div>

            <span className="text-[10px] text-text-muted pt-2 border-t border-border block">
              {latestScore !== null
                ? t('dashboard_kpi_parsed_ats')
                : t('dashboard_kpi_audit_private')}
            </span>
          </div>

          {/* 2. Number of Resumes */}
          <div className="p-4 sm:p-5 rounded-lg bg-surface border border-border shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">
                {t('dashboard_kpi_resumes_saved')}
              </span>
              <div className="flex items-center gap-1.5">
                <Link href="/resume/generate" className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{isAr ? 'ذكاء اصطناعي' : 'AI'}</span>
                </Link>
                <span className="text-ink-3/30">|</span>
                <Link href="/builder" className="text-[11px] font-semibold text-brand hover:underline">
                  + {t('dashboard_btn_new_resume')}
                </Link>
              </div>
            </div>

            <div className="py-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-serif text-text-primary">
                {resumes.length}
              </span>
              <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            <div className="text-[10px] text-text-muted pt-2 border-t border-border flex items-center justify-between">
              <span>{`${resumeCount} ATS`}</span>
              <span>{`${cvCount} CV`}</span>
            </div>
          </div>

          {/* 3. Number of Cover Letters */}
          <div className="p-4 sm:p-5 rounded-lg bg-surface border border-border shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">
                {t('dashboard_kpi_cover_letters')}
              </span>
              <Link href="/cover-letter" className="text-[11px] font-semibold text-brand hover:underline">
                + {t('dashboard_btn_new_cover')}
              </Link>
            </div>

            <div className="py-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold font-serif text-text-primary">
                {coverLetters.length}
              </span>
              <div className="w-8 h-8 rounded-md bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Mail className="w-4 h-4" />
              </div>
            </div>

            <div className="text-[10px] text-text-muted pt-2 border-t border-border flex items-center justify-between">
              <span>{t('cover_tone_label')}</span>
              <span>AI</span>
            </div>
          </div>

          {/* 4. Last Activity */}
          <div className="p-4 sm:p-5 rounded-lg bg-surface border border-border shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">
                {t('dashboard_kpi_last_activity')}
              </span>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>

            <div className="py-2 flex items-baseline justify-between">
              <span className="text-lg font-bold font-serif text-text-primary truncate max-w-[140px]">
                {latestActivity ? formatRelativeTime(latestActivity.date) : '—'}
              </span>
              <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <span className="text-[10px] text-text-muted pt-2 border-t border-border truncate block">
              {latestActivity ? latestActivity.label : t('dashboard_no_activity')}
            </span>
          </div>
        </div>

        {/* RECENT ITEMS SECTION WITH TABS */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-text-primary">
                {t('dashboard_recent_items_title')}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {t('dashboard_recent_items_desc')}
              </p>
            </div>

            {/* Accessible Tab Strip */}
            <Tabs
              tabs={tabsList}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id)}
              variant="pills"
            />
          </div>

          {/* SKELETON LOADING STATE */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* TAB 1: RESUMES & CVS */}
          {!isLoading && activeTab === 'resumes' && (
            <div className="animate-in fade-in duration-150">
              {resumes.length === 0 ? (
                /* Proper Empty State */
                <Card className="text-center py-12 px-4 border-dashed bg-surface/50">
                  <CardBody className="space-y-3 max-w-md mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-text-muted mx-auto shadow-subtle">
                      <FileText className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      {t('dashboard_empty_resumes_title')}
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {t('dashboard_empty_resumes_desc')}
                    </p>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                      <Link href="/builder">
                        <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                          <span>{t('dashboard_btn_new_resume')}</span>
                        </Button>
                      </Link>
                      <Link href="/cv-builder">
                        <Button size="sm" variant="outline" leftIcon={<Layers className="w-3.5 h-3.5" />}>
                          <span>{t('dashboard_btn_new_academic_cv')}</span>
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                /* Resumes Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resumes.map((resume) => {
                    const isCv =
                      resume.data?.documentType === 'cv' ||
                      ['europass', 'executive', 'academic', 'modern-two-column', 'classic-ats'].includes(
                        resume.templateId
                      );
                    const relativeDate = formatRelativeTime(resume.updatedAt);

                    return (
                      <Card
                        key={resume.id}
                        className="group hover:border-border-strong transition-all flex flex-col justify-between shadow-subtle"
                      >
                        <CardBody className="space-y-3">
                          {/* Card Header: Type Badge & Relative Date */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Badge
                                variant={isCv ? 'success' : 'accent'}
                                size="sm"
                                className="font-mono text-[10px]"
                              >
                                {isCv ? 'CV' : 'ATS'}
                              </Badge>
                              <span className="text-[11px] text-text-muted truncate font-mono">
                                {resume.templateId}
                              </span>
                            </div>

                            <span className="text-[11px] text-text-muted flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3" />
                              <span>{relativeDate}</span>
                            </span>
                          </div>

                          {/* Title & Target Job */}
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary group-hover:text-brand transition-colors line-clamp-1">
                              {resume.title || t('dashboard_untitled_doc')}
                            </h4>
                            <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                              {resume.data?.personalInfo?.jobTitle || t('dashboard_no_target_title')}
                            </p>
                          </div>

                          {/* Quick Actions Ribbon */}
                          <div className="pt-3 border-t border-border flex items-center justify-between gap-1.5">
                            {/* Open / Edit */}
                            <Link
                              href={isCv ? `/cv-builder?id=${resume.id}` : `/builder?id=${resume.id}`}
                              className="flex-1"
                            >
                              <Button
                                variant="secondary"
                                size="sm"
                                fullWidth
                                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                              >
                                <span>{t('dashboard_btn_open_edit')}</span>
                              </Button>
                            </Link>

                            {/* Duplicate */}
                            <Button
                              variant="outline"
                              size="sm"
                              title={t('dashboard_btn_duplicate')}
                              isLoading={actionLoadingId === resume.id}
                              disabled={actionLoadingId === resume.id}
                              onClick={() => handleDuplicateResume(resume)}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>

                            {/* Match Jobs */}
                            <Link href="/jobs">
                              <Button
                                variant="outline"
                                size="sm"
                                title={isAr ? 'مطابقة الوظائف' : 'Find Matching Jobs'}
                              >
                                <Briefcase className="w-3.5 h-3.5 text-brand" />
                              </Button>
                            </Link>

                            {/* Export Link */}
                            <Link href={`/builder?id=${resume.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                title={t('dashboard_btn_export')}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            </Link>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-text-muted hover:text-danger hover:bg-danger-soft"
                              title={t('dashboard_btn_delete')}
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'resume',
                                  id: resume.id,
                                  title: resume.title,
                                })
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ATS REPORTS */}
          {!isLoading && activeTab === 'analyses' && (
            <div className="animate-in fade-in duration-150">
              {analyses.length === 0 ? (
                /* Proper Empty State */
                <Card className="text-center py-12 px-4 border-dashed bg-surface/50">
                  <CardBody className="space-y-3 max-w-md mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-text-muted mx-auto shadow-subtle">
                      <ShieldCheck className="w-7 h-7 text-brand" />
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      {t('dashboard_empty_scans_title')}
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {t('dashboard_empty_scans_desc')}
                    </p>
                    <div className="pt-2">
                      <Link href="/review">
                        <Button size="sm" variant="primary" leftIcon={<Search className="w-3.5 h-3.5" />}>
                          <span>{t('dashboard_btn_new_scan')}</span>
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                /* Analyses Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyses.map((scan) => {
                    const relativeDate = formatRelativeTime(scan.createdAt);
                    const scoreColor =
                      scan.overallScore >= 80
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                        : scan.overallScore >= 65
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/25';

                    return (
                      <Card
                        key={scan.id}
                        className="hover:border-border-strong transition-all flex flex-col justify-between shadow-subtle"
                      >
                        <CardBody className="space-y-3 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-text-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{relativeDate}</span>
                            </span>
                            <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                              {scan.matchLabel || 'ATS AUDIT'}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-lg border flex flex-col items-center justify-center font-bold text-sm shrink-0 ${scoreColor}`}
                            >
                              <span>{scan.overallScore}</span>
                              <span className="text-[9px] uppercase font-normal">{scan.grade}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-semibold text-text-primary truncate">
                                {scan.resumeFileName}
                              </h4>
                              <p className="text-[11px] text-text-secondary truncate mt-0.5">
                                {scan.targetRole || t('upload_job_title_placeholder')}
                              </p>
                              <span className="text-[10px] text-text-muted">
                                {scan.rankPercentile ? `Top ${scan.rankPercentile}` : 'Verified ATS'}
                              </span>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                            <Link href="/review" className="flex-1">
                              <Button variant="secondary" size="sm" fullWidth leftIcon={<Search className="w-3.5 h-3.5" />}>
                                <span>{t('dashboard_view_report')}</span>
                              </Button>
                            </Link>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-text-muted hover:text-danger hover:bg-danger-soft"
                              title={t('dashboard_btn_delete')}
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'analysis',
                                  id: scan.id,
                                  title: scan.resumeFileName,
                                })
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COVER LETTERS */}
          {!isLoading && activeTab === 'coverLetters' && (
            <div className="animate-in fade-in duration-150">
              {coverLetters.length === 0 ? (
                /* Proper Empty State */
                <Card className="text-center py-12 px-4 border-dashed bg-surface/50">
                  <CardBody className="space-y-3 max-w-md mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-text-muted mx-auto shadow-subtle">
                      <Mail className="w-7 h-7 text-violet-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      {t('dashboard_empty_letters_title')}
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {t('dashboard_empty_letters_desc')}
                    </p>
                    <div className="pt-2">
                      <Link href="/cover-letter">
                        <Button size="sm" variant="primary" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                          <span>{t('dashboard_btn_new_cover')}</span>
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                /* Cover Letters Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coverLetters.map((letter) => {
                    const relativeDate = formatRelativeTime(letter.updatedAt || letter.createdAt);

                    return (
                      <Card
                        key={letter.id}
                        className="group hover:border-border-strong transition-all flex flex-col justify-between shadow-subtle"
                      >
                        <CardBody className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="accent" size="sm" className="font-mono text-[10px]">
                              {letter.status ? letter.status.toUpperCase() : 'SAVED'}
                            </Badge>
                            <span className="text-[11px] text-text-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{relativeDate}</span>
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-text-primary group-hover:text-brand transition-colors line-clamp-1">
                              {letter.title || t('dashboard_untitled_doc')}
                            </h4>
                            <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                              {letter.targetRole ? `${letter.targetRole} ${letter.companyName ? `@ ${letter.companyName}` : ''}` : t('cover_subtitle')}
                            </p>
                          </div>

                          {/* Quick Actions */}
                          <div className="pt-3 border-t border-border flex items-center justify-between gap-1.5">
                            <Link href="/cover-letter" className="flex-1">
                              <Button variant="secondary" size="sm" fullWidth leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                                <span>{t('dashboard_btn_open_edit')}</span>
                              </Button>
                            </Link>

                            {/* Duplicate */}
                            <Button
                              variant="outline"
                              size="sm"
                              title={t('dashboard_btn_duplicate')}
                              isLoading={actionLoadingId === letter.id}
                              disabled={actionLoadingId === letter.id}
                              onClick={() => handleDuplicateCoverLetter(letter)}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>

                            {/* Copy text content */}
                            <Button
                              variant="outline"
                              size="sm"
                              title={t('cover_copy_btn')}
                              onClick={() => handleCopyCoverLetterContent(letter)}
                            >
                              {copiedId === letter.id ? (
                                <Check className="w-3.5 h-3.5 text-success" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-text-muted hover:text-danger hover:bg-danger-soft"
                              title={t('dashboard_btn_delete')}
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'coverLetter',
                                  id: letter.id,
                                  title: letter.title,
                                })
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {!isLoading && activeTab === 'settings' && (
            <Card className="p-6">
              <CardBody className="space-y-6">
                <div>
                  <h4 className="text-base font-serif font-bold text-text-primary">
                    {t('dashboard_settings_language')}
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">
                    {t('dashboard_settings_language_desc')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {supportedLanguages.map((lang) => {
                      const isSelected = lang.code === language;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => setLanguage(lang.code)}
                          className={`p-3.5 rounded-lg border text-start flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-brand bg-brand-soft/40 shadow-sm'
                              : 'border-border bg-surface-2 hover:border-border-strong hover:bg-surface'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-6 rounded bg-surface border border-border text-xs font-mono font-bold flex items-center justify-center text-text-primary uppercase">
                              {lang.code}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-text-primary">{lang.nativeName}</p>
                              <p className="text-[11px] text-text-muted">{lang.name}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h4 className="text-base font-serif font-bold text-text-primary">
                    {t('dashboard_settings_theme')}
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">
                    {t('dashboard_settings_theme_desc')}
                  </p>
                  <div className="mt-4">
                    <ThemeToggle size="md" />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </section>

        {/* DELETE CONFIRMATION MODAL */}
        <Dialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={t('dashboard_confirm_delete_title')}
          description={t('dashboard_confirm_delete_desc')}
          maxWidth="sm"
        >
          <div className="space-y-4 pt-1">
            <div className="p-3 rounded-md bg-surface-2 border border-border">
              <span className="text-xs font-mono text-text-primary block truncate">
                {deleteTarget?.title}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                <span>{t('dashboard_cancel_btn')}</span>
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
                disabled={isDeleting}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                <span>{t('dashboard_confirm_delete_btn')}</span>
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </AppShell>
  );
}
