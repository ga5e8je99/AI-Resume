'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import UpgradeModal from '@/app/components/UpgradeModal';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/app/components/ui/Button';
import { extractTextFromFile } from '@/app/lib/pdfExtractor';
import { Job, SmartLinkPlatform, CandidateProfileExtract } from '@/lib/jobs/types';
import {
  Briefcase,
  Search,
  MapPin,
  Sparkles,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Upload,
  FileText,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Globe,
  Building,
  Clock,
  DollarSign,
  Layers,
  Lock,
  RefreshCw,
  Compass,
  Sliders,
  Mail,
  Zap,
} from 'lucide-react';

interface SavedResumeOption {
  id: string;
  title: string;
  candidateName?: string;
  candidateTitle?: string;
}

export default function JobMatchPage() {
  const { user } = useAuth();
  const { language, isRtl, t } = useLanguage();
  const isAr = language === 'ar';

  // Resumes list & selected resume
  const [savedResumes, setSavedResumes] = useState<SavedResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [isLoadingResumes, setIsLoadingResumes] = useState<boolean>(true);

  // Search parameters
  const [query, setQuery] = useState<string>('Software Engineer');
  const [location, setLocation] = useState<string>('Cairo, Egypt');
  const [country, setCountry] = useState<string>('eg');
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [seniority, setSeniority] = useState<'junior' | 'mid' | 'senior' | 'lead' | 'any'>('mid');
  const [targetTitles, setTargetTitles] = useState<string[]>(['Software Engineer', 'Full-Stack Developer', 'Frontend Engineer']);
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript', 'Node.js', 'Next.js', 'SQL', 'Git']);
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  // Results state
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [smartLinks, setSmartLinks] = useState<SmartLinkPlatform[]>([]);
  const [attributions, setAttributions] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCachedResult, setIsCachedResult] = useState<boolean>(false);

  // Filter & Sort states
  const [filterRemote, setFilterRemote] = useState<boolean>(false);
  const [filterMinScore, setFilterMinScore] = useState<number>(0);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Quota & Paywall states
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [freeQuotaUsed, setFreeQuotaUsed] = useState<number>(user?.jobMatchFreeUsed ?? 0);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState<boolean>(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSearching(false);
  };

  // 1. Fetch user's saved resumes on mount
  useEffect(() => {
    async function loadResumes() {
      try {
        setIsLoadingResumes(true);
        const res = await fetch('/api/resumes');
        if (res.ok) {
          const data = await res.json();
          const items: SavedResumeOption[] = (data.resumes || []).map((r: any) => ({
            id: r.id || r._id,
            title: r.title || 'Untitled Resume',
            candidateName: r.candidateName,
            candidateTitle: r.candidateTitle,
          }));
          setSavedResumes(items);

          if (items.length > 0) {
            setSelectedResumeId(items[0].id);
            // Trigger automatic profile extraction from 1st resume
            extractProfileFromResume(items[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load user resumes:', err);
      } finally {
        setIsLoadingResumes(false);
      }
    }

    if (user) {
      loadResumes();
    } else {
      setIsLoadingResumes(false);
    }
  }, [user]);

  // Extract profile parameters from a saved resume
  const extractProfileFromResume = async (resumeId: string) => {
    try {
      const res = await fetch('/api/jobs/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          applyExtractedProfile(data.profile);
        }
      }
    } catch (err) {
      console.error('Extraction error:', err);
    }
  };

  const applyExtractedProfile = (profile: CandidateProfileExtract) => {
    if (profile.targetTitles && profile.targetTitles.length > 0) {
      setTargetTitles(profile.targetTitles);
      setQuery(profile.targetTitles[0]);
    }
    if (profile.location) setLocation(profile.location);
    if (profile.country) setCountry(profile.country);
    if (profile.topSkills && profile.topSkills.length > 0) setSkills(profile.topSkills);
    if (profile.seniority) setSeniority(profile.seniority);
    if (typeof profile.remotePreference === 'boolean') setRemoteOnly(profile.remotePreference);
  };

  // Handle file upload extraction (PDF or DOCX)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length === 0) {
        setErrorMessage(isAr ? 'لم نتمكن من قراءة محتوى الملف.' : 'Could not extract text from file.');
        return;
      }

      const res = await fetch('/api/jobs/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          applyExtractedProfile(data.profile);
          setSelectedResumeId('custom_upload');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || (isAr ? 'خطأ في معالجة الملف' : 'Error processing file'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add / remove custom skill
  const handleAddSkill = () => {
    const s = newSkillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Perform Job Match Search
  const executeJobSearch = async () => {
    if (!query.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setErrorMessage(null);
    setIsQuotaExhausted(false);

    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query: query.trim(),
          location: location.trim(),
          remote: remoteOnly,
          country,
          skills,
          seniority,
        }),
      });

      if (res.status === 402) {
        // HTTP 402: Quota exhausted! Friendly paywall trigger
        setIsQuotaExhausted(true);
        setIsUpgradeModalOpen(true);
        setFreeQuotaUsed(3);
        return;
      }

      if (res.status === 401) {
        window.location.href = `/login?returnUrl=${encodeURIComponent('/jobs')}`;
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || (isAr ? 'تعذر جلب نتائج الوظائف' : 'Failed to search matching jobs'));
      }

      const data = await res.json();
      setJobs(data.jobs || []);
      setSmartLinks(data.smartLinks || []);
      setAttributions(data.attributions || []);
      setIsCachedResult(Boolean(data.cached));
      setHasSearched(true);

      if (data.quota && typeof data.quota.freeUsed === 'number') {
        setFreeQuotaUsed(data.quota.freeUsed);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setErrorMessage(err?.message || (isAr ? 'حدث خطأ أثناء البحث' : 'An error occurred during search'));
    } finally {
      setIsSearching(false);
      abortControllerRef.current = null;
    }
  };

  // Automatically execute first search when parameters are ready on initial load
  useEffect(() => {
    if (savedResumes.length > 0 && !hasSearched && query) {
      executeJobSearch();
    }
  }, [savedResumes.length]);

  // Available sources for filter dropdown
  const availableSources = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach((j) => {
      if (j.source) s.add(j.source);
    });
    return Array.from(s);
  }, [jobs]);

  // Filtered and sorted jobs
  const displayJobs = useMemo(() => {
    let list = [...jobs];

    if (filterRemote) {
      list = list.filter((j) => j.remote);
    }

    if (filterMinScore > 0) {
      list = list.filter((j) => (j.matchScore || 0) >= filterMinScore);
    }

    if (filterSource !== 'all') {
      list = list.filter((j) => j.source === filterSource);
    }

    if (sortBy === 'date') {
      list.sort((a, b) => {
        const dateA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
        const dateB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
        return dateB - dateA;
      });
    } else {
      list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    return list;
  }, [jobs, filterRemote, filterMinScore, filterSource, sortBy]);

  // Score badge helper matching brand rules
  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return {
        classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        label: isAr ? 'مطابقة استثنائية' : 'Strong Match',
      };
    }
    if (score >= 60) {
      return {
        classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        label: isAr ? 'مطابقة جيدة' : 'Good Fit',
      };
    }
    return {
      classes: 'bg-surface-2 text-ink-3 border-border',
      label: isAr ? 'مطابقة جزئية' : 'Partial Match',
    };
  };

  const isProUser = user?.plan === 'pro' || user?.plan === 'enterprise';

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col justify-between selection:bg-brand-soft selection:text-text-primary" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-8">
        {/* Top Header & Quota Status Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-brand-soft text-brand border border-brand/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'مطابقة الوظائف الذكية' : 'AI Job Match Aggregator'}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-text-primary tracking-tight">
              {isAr ? 'مطابقة الوظائف الشاغرة مع سيرتك الذاتية' : 'Match Open Jobs to Your Resume'}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed">
              {isAr
                ? 'تحليل دقيق لسيرتك الذاتية واستخراج الشواغر المطابقة من كبرى المنصات العالمية والعربية مع روابط بحث ذكية فورية وبدون أي كشط مخالف للمواقع.'
                : 'Analyzes your CV to find suitable vacancies across premier open job APIs and generates smart direct search links for LinkedIn, Wuzzuf, Indeed, and Bayt.'}
            </p>
          </div>

          {/* Quota Badge */}
          <div className="flex items-center gap-3 shrink-0">
            {isProUser ? (
              <div className="px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block leading-tight">
                    PRO UNLIMITED
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {isAr ? 'بحث غير محدود مفعل' : 'Unlimited Fair-Use Search'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-3.5 py-2 rounded-lg bg-surface border border-border flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-brand" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-text-primary">
                      {isAr ? `${Math.min(3, freeQuotaUsed)} من 3 مجاناً` : `${Math.min(3, freeQuotaUsed)} of 3 Free Used`}
                    </span>
                    {freeQuotaUsed >= 3 && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-semibold">
                        PAYG (1 CR)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted block">
                    {freeQuotaUsed < 3
                      ? (isAr ? `${3 - freeQuotaUsed} عمليات بحث مجانية متبقية` : `${3 - freeQuotaUsed} free searches remaining`)
                      : (isAr ? '1 نقطة لكل بحث إضافي' : '1 credit per search')}
                  </span>
                </div>
              </div>
            )}

            <Link href="/pricing">
              <Button size="sm" variant="outline" className="border-border hover:bg-surface-2 text-xs">
                {isAr ? 'ترقية الباقة' : 'View Plans'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Quota Exhausted Paywall Banner (if 402 or 3 of 3 used) */}
        {isQuotaExhausted && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {isAr ? 'لقد استخدمت كافة عمليات البحث المجانية الـ 3' : 'You have used all 3 free Job Match searches'}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {isAr
                    ? 'قم بالترقية إلى باقة برو للبحث غير المحدود، أو اشترِ رصيد الدفع حسب الاستخدام (نقطة واحدة لكل بحث).'
                    : 'Upgrade to JobMatch Pro for unlimited searches, or purchase Pay-As-You-Go credits (1 credit per search).'}
                </p>
              </div>
            </div>
            <Link href="/pricing" className="shrink-0">
              <Button size="sm" variant="primary">
                <span>{isAr ? 'ترقية إلى برو' : 'Upgrade to Pro'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        )}

        {/* ================================================================= */}
        {/* PARAMETERS & PROFILE EXTRACTION CARD                              */}
        {/* ================================================================= */}
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h2 className="text-base font-serif font-semibold text-text-primary flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand" />
                <span>{isAr ? 'الملف المهني ومعايير البحث' : 'Candidate Profile & Search Parameters'}</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                {isAr
                  ? 'تم استخراج البيانات تلقائياً من سيرتك الذاتية. يمكنك تعديل المعايير والكلمات قبل بدء البحث.'
                  : 'Extracted automatically from your resume. Adjust parameters to fine-tune your matches.'}
              </p>
            </div>

            {/* Resume Switcher & Upload Button */}
            <div className="flex items-center gap-2.5">
              {savedResumes.length > 0 && (
                <div className="relative">
                  <select
                    aria-label={isAr ? 'اختر السيرة الذاتية للمطابقة' : 'Select resume to match jobs'}
                    value={selectedResumeId}
                    onChange={(e) => {
                      setSelectedResumeId(e.target.value);
                      if (e.target.value !== 'custom_upload') {
                        extractProfileFromResume(e.target.value);
                      }
                    }}
                    className="h-9 text-xs rounded-lg border border-border bg-bg px-3 pe-8 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand font-sans"
                  >
                    {savedResumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                    {selectedResumeId === 'custom_upload' && (
                      <option value="custom_upload">
                        {isAr ? 'ملف مرفوع مخصص' : 'Custom Uploaded File'}
                      </option>
                    )}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx"
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
                className="text-xs border-border"
              >
                <span>{isAr ? 'رفع CV آخر' : 'Upload Resume'}</span>
              </Button>
            </div>
          </div>

          {/* Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Target Title */}
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-semibold text-text-secondary flex items-center justify-between">
                <span>{isAr ? 'المسمى الوظيفي المستهدف' : 'Target Job Title'}</span>
                <span className="text-[10px] text-text-muted font-mono">{isAr ? 'أعلى 3 خيارات' : 'Top 3 extracted'}</span>
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                className="w-full h-9 rounded-lg border border-border bg-bg px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
              />

              {/* Top 3 Quick Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {targetTitles.map((tTitle, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuery(tTitle)}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                      query === tTitle
                        ? 'bg-brand text-white border-brand font-semibold'
                        : 'bg-surface-2 text-text-secondary border-border hover:border-brand/40'
                    }`}
                  >
                    {tTitle}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">
                {isAr ? 'المدينة / المنطقة' : 'Location'}
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-text-muted absolute start-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Cairo, Egypt or Remote"
                  className="w-full h-9 rounded-lg border border-border bg-bg ps-8 pe-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* 3. Country / Region Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">
                {isAr ? 'الدولة / النطاق' : 'Country Focus'}
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-text-muted absolute start-2.5 top-1/2 -translate-y-1/2" />
                <select
                  aria-label={isAr ? 'الدولة أو النطاق الجغرافي' : 'Country focus'}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-bg ps-8 pe-8 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand appearance-none"
                >
                  <option value="eg">{isAr ? 'مصر (Egypt)' : 'Egypt (eg)'}</option>
                  <option value="sa">{isAr ? 'السعودية (Saudi Arabia)' : 'Saudi Arabia (sa)'}</option>
                  <option value="ae">{isAr ? 'الإمارات (UAE)' : 'United Arab Emirates (ae)'}</option>
                  <option value="us">{isAr ? 'الولايات المتحدة (US)' : 'United States (us)'}</option>
                  <option value="gb">{isAr ? 'المملكة المتحدة (UK)' : 'United Kingdom (gb)'}</option>
                  <option value="de">{isAr ? 'ألمانيا (Germany)' : 'Germany (de)'}</option>
                  <option value="global">{isAr ? 'دولي / عالمي (Worldwide)' : 'Worldwide (global)'}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Seniority, Remote Toggle, & Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start pt-2">
            {/* Seniority */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">
                {isAr ? 'المستوى الوظيفي' : 'Seniority Level'}
              </label>
              <div className="relative">
                <select
                  aria-label={isAr ? 'المستوى الوظيفي' : 'Seniority level'}
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value as any)}
                  className="w-full h-9 rounded-lg border border-border bg-bg px-3 pe-8 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand appearance-none"
                >
                  <option value="any">{isAr ? 'جميع المستويات' : 'All Seniority Levels'}</option>
                  <option value="junior">{isAr ? 'مبتدئ (Junior / Entry)' : 'Junior / Entry-Level'}</option>
                  <option value="mid">{isAr ? 'متوسط الخبرة (Mid-Level)' : 'Mid-Level'}</option>
                  <option value="senior">{isAr ? 'خبير أول (Senior)' : 'Senior Level'}</option>
                  <option value="lead">{isAr ? 'قائد فريق / إدارة (Lead)' : 'Lead / Principal'}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Remote Only Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">
                {isAr ? 'طبيعة العمل' : 'Work Arrangement'}
              </label>
              <label className="h-9 px-3 rounded-lg border border-border bg-bg flex items-center justify-between cursor-pointer hover:border-brand/40 transition-colors">
                <span className="text-xs text-text-primary flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-brand" />
                  <span>{isAr ? 'عن بُعد فقط (Remote Only)' : 'Remote Only'}</span>
                </span>
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-brand focus:ring-brand"
                />
              </label>
            </div>

            {/* Top Skills Tags */}
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-semibold text-text-secondary flex items-center justify-between">
                <span>{isAr ? 'المهارات المفتاحية للمطابقة' : 'Key Skills for Matching'}</span>
                <span className="text-[10px] text-text-muted">{skills.length} {isAr ? 'مهارات' : 'skills'}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder={isAr ? 'أضف مهارة واضغط Enter...' : 'Add a skill & press Enter...'}
                  className="w-full h-9 rounded-lg border border-border bg-bg px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <Button size="sm" variant="outline" onClick={handleAddSkill} className="shrink-0 h-9 px-3 text-xs border-border">
                  {isAr ? 'إضافة' : 'Add'}
                </Button>
              </div>

              {/* Skills badges */}
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-20 overflow-y-auto">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-2 text-text-secondary border border-border"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-text-muted hover:text-danger focus:outline-none"
                      aria-label={`${isAr ? 'حذف مهارة' : 'Remove skill'} ${skill}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Transparent Query Bar */}
          <div className="rounded-lg bg-surface-2/60 border border-border p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-mono max-w-full overflow-hidden">
            <div className="flex items-center gap-2 text-text-muted overflow-hidden min-w-0 w-full">
              <Search className="w-3.5 h-3.5 text-brand shrink-0" />
              <span className="shrink-0 text-text-secondary">{isAr ? 'استعلام البحث:' : 'Generated Query:'}</span>
              <span className="text-brand truncate min-w-0">
                &ldquo;{query}&rdquo; {location ? `in ${location}` : ''} {remoteOnly ? '(remote:true)' : ''}
              </span>
            </div>

            <Button
              size="md"
              variant="primary"
              onClick={executeJobSearch}
              isLoading={isSearching}
              leftIcon={<Search className="w-4 h-4" />}
              className="w-full sm:w-auto shrink-0 font-sans"
            >
              <span>{isAr ? 'تحديث نتائج المطابقة' : 'Find Matching Jobs'}</span>
            </Button>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 flex items-center gap-3 text-xs text-danger">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* PLATFORMS PANEL (10 SMART SEARCH DEEP-LINK BUTTONS)               */}
        {/* ================================================================= */}
        {smartLinks.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-serif font-semibold text-text-primary flex items-center gap-2">
                  <Compass className="w-4 h-4 text-brand" />
                  <span>{isAr ? 'منصات التوظيف الكبرى (روابط بحث ذكية مباشرة)' : 'Major Platforms (Direct Smart Search Links)'}</span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {isAr
                    ? 'منصات لا توفر واجهات برمجة مفتوحة. انقر لفتح نتائج البحث المباشرة بالكلمات المستخرجة على المنصة الأصلية.'
                    : 'Platforms without open APIs. Click to open deep-linked search results directly on their native websites in a new tab.'}
                </p>
              </div>

              <span className="text-[11px] font-mono text-text-muted shrink-0">
                10 {isAr ? 'منصات معتمدة' : 'Platforms Covered'}
              </span>
            </div>

            {/* Grid of 10 Smart Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {smartLinks.map((platform) => {
                const isMena = platform.region.includes('Egypt') || platform.region.includes('MENA') || platform.region.includes('Gulf');
                return (
                  <a
                    key={platform.id}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-lg border border-border bg-bg p-3 hover:border-brand/50 hover:bg-surface-2 transition-all flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-text-primary group-hover:text-brand transition-colors truncate">
                        {platform.name}
                      </span>
                      <ExternalLink className="w-3 h-3 text-text-muted group-hover:text-brand transition-colors shrink-0" />
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-medium ${
                          isMena
                            ? 'bg-brand-soft text-brand border border-brand/20'
                            : 'bg-surface-2 text-text-muted'
                        }`}
                      >
                        {platform.region}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted">
                        #{platform.priority}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MATCHED JOBS RESULTS & FILTERS                                    */}
        {/* ================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-serif font-bold text-text-primary">
                {isAr ? 'الوظائف المطابقة المتاحة' : 'Open Matching Positions'}
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand border border-brand/20">
                {displayJobs.length} {isAr ? 'وظيفة' : 'Found'}
              </span>
              {isCachedResult && (
                <span className="text-[10px] font-mono text-text-muted px-2 py-0.5 rounded bg-surface border border-border">
                  {isAr ? 'محفوظة مؤقتاً (6 ساعات)' : 'Cached (6h TTL)'}
                </span>
              )}
            </div>

            {/* Filter and Sort Toolbar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Remote only filter */}
              <button
                type="button"
                onClick={() => setFilterRemote(!filterRemote)}
                className={`h-8 px-2.5 rounded-lg border font-mono transition-colors flex items-center gap-1.5 ${
                  filterRemote
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface border-border text-text-secondary hover:border-brand/40'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Remote</span>
              </button>

              {/* Min Match Filter */}
              <select
                aria-label={isAr ? 'تصفية حسب نسبة المطابقة' : 'Filter by minimum match score'}
                value={filterMinScore}
                onChange={(e) => setFilterMinScore(Number(e.target.value))}
                className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-text-primary focus:outline-none font-mono"
              >
                <option value={0}>{isAr ? 'كل النسب' : 'All Scores'}</option>
                <option value={60}>{isAr ? 'مطابقة 60%+' : '60%+ Fit'}</option>
                <option value={80}>{isAr ? 'مطابقة 80%+' : '80%+ Strong'}</option>
              </select>

              {/* Source Filter */}
              {availableSources.length > 1 && (
                <select
                  aria-label={isAr ? 'تصفية حسب المصدر' : 'Filter by job source'}
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-text-primary focus:outline-none font-mono"
                >
                  <option value="all">{isAr ? 'كل المصادر' : 'All Sources'}</option>
                  {availableSources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort By */}
              <select
                aria-label={isAr ? 'ترتيب الوظائف المعروضة' : 'Sort displayed jobs'}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-text-primary focus:outline-none font-mono"
              >
                <option value="score">{isAr ? 'ترتيب: أعلى مطابقة' : 'Sort: Highest Match'}</option>
                <option value="date">{isAr ? 'ترتيب: الأحدث تاريخاً' : 'Sort: Most Recent'}</option>
              </select>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isSearching && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-brand/20 bg-surface flex items-center justify-between gap-4 shadow-subtle animate-in fade-in duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-xs text-text-secondary font-medium">
                    {isAr
                      ? 'جاري مطابقة وتدقيق الوظائف عبر محركات البحث المباشرة...'
                      : 'Matching jobs and calculating compatibility score against requirements...'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelSearch}
                  className="text-xs text-text-muted hover:text-danger hover:border-danger shrink-0"
                >
                  {t('loading_cancel')}
                </Button>
              </div>

              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-5 skeleton-shimmer space-y-3 shadow-subtle">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-48 bg-surface-2 rounded" />
                    <div className="h-6 w-16 bg-surface-2 rounded" />
                  </div>
                  <div className="h-4 w-72 bg-surface-2 rounded" />
                  <div className="h-3 w-full bg-surface-2 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isSearching && displayJobs.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-brand-soft border border-brand/20 text-brand mx-auto flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-serif font-semibold text-text-primary">
                  {isAr ? 'لم نجد شواغر مطابقة لهذه المعايير حالياً' : 'No open jobs matched these exact filters'}
                </h3>
                <p className="text-xs text-text-muted">
                  {isAr
                    ? 'جرب توسيع نطاق البحث أو تفعيل خيار جميع المستويات، أو تفقد منصات البحث المباشر في الأعلى.'
                    : 'Try broadening your job title or adjusting the location. You can also explore direct platform links above.'}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { setFilterRemote(false); setFilterMinScore(0); setFilterSource('all'); }}>
                {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </Button>
            </div>
          )}

          {/* Job Cards List with 150ms Fade-in */}
          {!isSearching && displayJobs.length > 0 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {displayJobs.map((job) => {
                const score = job.matchScore || 50;
                const badge = getScoreBadge(score);
                const isExpanded = expandedJobId === job.id;

                return (
                  <div
                    key={job.id}
                    className="rounded-xl border border-border bg-surface p-5 hover:border-brand/40 shadow-subtle transition-all space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-serif text-base sm:text-lg font-bold text-text-primary">
                            {job.title}
                          </h3>
                          {job.remote && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                              Remote
                            </span>
                          )}
                          {job.jobType && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-text-muted">
                              {job.jobType}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                          <span className="font-medium text-text-primary flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-text-muted" />
                            <span>{job.company}</span>
                          </span>

                          <span className="flex items-center gap-1 text-text-muted">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{job.location}</span>
                          </span>

                          {job.salary && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>{job.salary}</span>
                            </span>
                          )}

                          {job.postedDate && (
                            <span className="flex items-center gap-1 text-text-muted font-mono">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{job.postedDate}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-1 shrink-0">
                        <div className={`px-2.5 py-1 rounded-lg border font-mono flex items-baseline gap-1 ${badge.classes}`}>
                          <span className="text-xl sm:text-2xl font-bold tracking-tight">
                            {score}%
                          </span>
                          <span className="text-[10px] uppercase font-bold">
                            Match
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-text-muted">
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {/* Excerpt Description */}
                    {job.description && (
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    )}

                    {/* Why It Matches Explanation / Expandable Accordion */}
                    <div className="rounded-lg bg-surface-2/40 border border-border/60 p-3 text-xs space-y-2">
                      <button
                        type="button"
                        onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                        className="w-full flex items-center justify-between text-text-secondary hover:text-text-primary focus:outline-none"
                      >
                        <span className="font-medium flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-brand" />
                          <span>{isAr ? 'تفاصيل المطابقة وفجوات المهارات' : 'Why it matches & skill breakdown'}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                        )}
                      </button>

                      {/* Collapsed summary pill list */}
                      {!isExpanded && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {(job.matchReasons || []).slice(0, 2).map((reason, idx) => (
                            <span key={idx} className="text-[11px] text-text-muted font-mono flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>{reason}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expanded detailed breakdown */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-border/50 space-y-2.5">
                          {/* Match reasons */}
                          <div className="space-y-1">
                            {(job.matchReasons || []).map((reason, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-text-secondary font-mono">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>

                          {/* Matched skills chips */}
                          {job.matchedSkills && job.matchedSkills.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                                {isAr ? 'المهارات المتطابقة:' : 'Matched Skills in Your Resume:'}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {job.matchedSkills.map((sk) => (
                                  <span
                                    key={sk}
                                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  >
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Missing skills warning chips */}
                          {job.missingSkills && job.missingSkills.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>{isAr ? 'مهارات مذكورة في الإعلان تنقص سيرتك:' : 'Mentioned in Job Posting (Missing from Resume):'}</span>
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {job.missingSkills.map((sk) => (
                                  <span
                                    key={sk}
                                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  >
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-text-muted">
                          {isAr ? 'المصدر:' : 'Source:'}
                        </span>
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-2 text-text-primary border border-border">
                          {job.source}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Direct link to tailor a cover letter */}
                        <Link
                          href={`/cover-letter?targetRole=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`}
                        >
                          <Button size="sm" variant="outline" className="text-xs border-border" leftIcon={<Mail className="w-3.5 h-3.5" />}>
                            <span>{isAr ? 'صياغة خطاب تقديم' : 'Tailor Cover Letter'}</span>
                          </Button>
                        </Link>

                        {/* View on source external link */}
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex"
                        >
                          <Button size="sm" variant="primary" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                            <span>{isAr ? `التقديم عبر ${job.source}` : `View on ${job.source}`}</span>
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Official Provider Attribution Strip */}
        {attributions.length > 0 && (
          <div className="rounded-xl border border-border bg-surface-2/40 p-4 text-center space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block">
              {isAr ? 'بيانات الشواغر المعتمدة وواجهات الربط المفتوحة' : 'Official Open Job Feeds & Attribution'}
            </span>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-text-secondary">
              {attributions.map((attr, idx) => (
                <a
                  key={idx}
                  href={attr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand underline underline-offset-4 font-mono text-[11px] transition-colors"
                >
                  {attr.text}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Upgrade Paywall Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        language={language}
      />

      <Footer />
    </div>
  );
}
