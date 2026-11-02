'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { extractTextFromFile } from '@/app/lib/pdfExtractor';
import {
  EMPLOYMENT_TYPES,
  MAX_PROFILE_SKILLS,
  REMOTE_PREFERENCES,
  SENIORITY_LEVELS,
  calculateProfileCompletion,
  type EmploymentType,
  type RemotePreference,
  type SeniorityLevel,
} from '@/lib/profile';
import {
  fetchUserProfileClient,
  updateUserProfileClient,
  skipUserOnboardingClient,
  resolveCountryCodeFromProfile,
} from '@/lib/profile/client';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle2,
  Sparkles,
  Upload,
  Briefcase,
  FileText,
  MapPin,
  ShieldCheck,
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Search,
  Globe,
  Lock,
} from 'lucide-react';

const QUICK_COUNTRIES = [
  { labelEn: 'Egypt', labelAr: 'مصر', defaultCityEn: 'Cairo', defaultCityAr: 'القاهرة' },
  { labelEn: 'Saudi Arabia', labelAr: 'السعودية', defaultCityEn: 'Riyadh', defaultCityAr: 'الرياض' },
  { labelEn: 'UAE', labelAr: 'الإمارات', defaultCityEn: 'Dubai', defaultCityAr: 'دبي' },
  { labelEn: 'Germany', labelAr: 'ألمانيا', defaultCityEn: 'Berlin', defaultCityAr: 'برلين' },
  { labelEn: 'United Kingdom', labelAr: 'المملكة المتحدة', defaultCityEn: 'London', defaultCityAr: 'لندن' },
  { labelEn: 'United States', labelAr: 'الولايات المتحدة', defaultCityEn: 'New York', defaultCityAr: 'نيويورك' },
];

const QUICK_LANGUAGES = ['Arabic', 'English', 'French', 'German', 'Spanish', 'Turkish'];

const ROLE_SKILL_RECOMMENDATIONS: Record<string, string[]> = {
  frontend: ['React.js', 'TypeScript', 'Next.js', 'JavaScript', 'HTML5, CSS3 & Tailwind CSS', 'Git & Version Control'],
  backend: ['Node.js', 'TypeScript', 'Python', 'SQL & Relational Databases', 'MongoDB & NoSQL', 'REST APIs & GraphQL', 'Docker & Kubernetes'],
  full: ['TypeScript', 'React.js', 'Next.js', 'Node.js', 'SQL & Relational Databases', 'MongoDB & NoSQL', 'Git & Version Control'],
  software: ['JavaScript', 'TypeScript', 'Python', 'SQL & Relational Databases', 'Git & Version Control', 'REST APIs & GraphQL'],
  data: ['Python', 'SQL & Relational Databases', 'Data Analysis & Visualization', 'Advanced Excel & Financial Modeling', 'Machine Learning & AI Prompting'],
  design: ['Figma & UI/UX Prototyping', 'HTML5, CSS3 & Tailwind CSS', 'Cross-Functional Communication', 'Product Strategy & Roadmapping'],
  product: ['Product Strategy & Roadmapping', 'Project Management (Agile / Scrum)', 'Data Analysis & Visualization', 'Cross-Functional Communication'],
  account: ['Financial Reporting & IFRS', 'Advanced Excel & Financial Modeling', 'Analytical Problem Solving', 'Data Analysis & Visualization'],
  financ: ['Financial Reporting & IFRS', 'Advanced Excel & Financial Modeling', 'Data Analysis & Visualization', 'Analytical Problem Solving'],
  market: ['SEO, SEM & Performance Marketing', 'Data Analysis & Visualization', 'Cross-Functional Communication', 'B2B Sales, CRM & Negotiation'],
  sales: ['B2B Sales, CRM & Negotiation', 'Cross-Functional Communication', 'Team Leadership & Mentoring'],
  civil: ['AutoCAD, Revit & BIM Modeling', 'Project Management (Agile / Scrum)', 'Analytical Problem Solving'],
  hr: ['Talent Acquisition & HRIS', 'Cross-Functional Communication', 'Team Leadership & Mentoring'],
  default: ['Cross-Functional Communication', 'Analytical Problem Solving', 'Project Management (Agile / Scrum)', 'Data Analysis & Visualization', 'Advanced Excel & Financial Modeling', 'Team Leadership & Mentoring'],
};

function getRecommendedSkillsForRole(roleText: string): string[] {
  const lower = (roleText || '').toLowerCase();
  for (const [key, skills] of Object.entries(ROLE_SKILL_RECOMMENDATIONS)) {
    if (key !== 'default' && lower.includes(key)) {
      return skills;
    }
  }
  if (/مهندس برمجيات|واجهة|فرونت|ريأكت/.test(lower)) return ROLE_SKILL_RECOMMENDATIONS.frontend;
  if (/باك|خلفية/.test(lower)) return ROLE_SKILL_RECOMMENDATIONS.backend;
  if (/بيانات|ذكاء/.test(lower)) return ROLE_SKILL_RECOMMENDATIONS.data;
  if (/محاسب|مالي/.test(lower)) return ROLE_SKILL_RECOMMENDATIONS.account;
  if (/تسويق/.test(lower)) return ROLE_SKILL_RECOMMENDATIONS.market;
  if (/مدني|معماري|مهندس موقع/.test(lower)) return ROLE_SKILL_RECOMMENDATIONS.civil;
  return ROLE_SKILL_RECOMMENDATIONS.default;
}

export default function OnboardingWizardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const { t, isRtl, language } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isSubmittingFinal, setIsSubmittingFinal] = useState<boolean>(false);
  const [isSkipping, setIsSkipping] = useState<boolean>(false);

  // Form fields
  const [fullName, setFullName] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [willingToRelocate, setWillingToRelocate] = useState<boolean>(false);

  const [targetRole, setTargetRole] = useState<string>('');
  const [seniority, setSeniority] = useState<SeniorityLevel | null>('mid');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(2);

  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['Arabic', 'English']);

  const [remotePreference, setRemotePreference] = useState<RemotePreference>('any');
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>(['full-time']);
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [salaryCurrency, setSalaryCurrency] = useState<string>('USD');
  const [salaryVisible, setSalaryVisible] = useState<boolean>(false);

  // Autosuggest states
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [showRoleDropdown, setShowRoleDropdown] = useState<boolean>(false);
  const [skillQuery, setSkillQuery] = useState<string>('');
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState<string>('');

  // CV Auto-Fill states
  const [isExtractingCv, setIsExtractingCv] = useState<boolean>(false);
  const [cvNotice, setCvNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/onboarding');
    }
  }, [authLoading, user, router]);

  // Load existing profile draft on mount
  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchUserProfileClient(true, user.id).then((prof) => {
      if (!active) return;
      if (prof) {
        setFullName(prof.fullName || user.name || '');
        setCountry(prof.country || '');
        setCity(prof.city || '');
        setWillingToRelocate(Boolean(prof.willingToRelocate));
        setTargetRole(prof.targetRole || prof.headline || '');
        if (prof.seniority) setSeniority(prof.seniority);
        if (typeof prof.yearsOfExperience === 'number') setYearsOfExperience(prof.yearsOfExperience);
        if (Array.isArray(prof.skills) && prof.skills.length > 0) setSkills(prof.skills);
        if (Array.isArray(prof.languages) && prof.languages.length > 0) setLanguages(prof.languages);
        if (prof.remotePreference) setRemotePreference(prof.remotePreference);
        if (Array.isArray(prof.employmentTypes) && prof.employmentTypes.length > 0) {
          setEmploymentTypes(prof.employmentTypes);
        }
        if (prof.expectedSalary) {
          if (typeof prof.expectedSalary.min === 'number') setSalaryMin(String(prof.expectedSalary.min));
          if (typeof prof.expectedSalary.max === 'number') setSalaryMax(String(prof.expectedSalary.max));
          if (prof.expectedSalary.currency) setSalaryCurrency(prof.expectedSalary.currency);
          setSalaryVisible(Boolean(prof.expectedSalary.visible));
        }
      } else {
        setFullName(user.name || '');
      }
      setIsInitialLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  // Fetch role suggestions when typing targetRole in step 2
  useEffect(() => {
    if (step !== 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/profile/suggest?type=role&q=${encodeURIComponent(targetRole.trim())}&lang=${language}&limit=8`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) {
            setRoleSuggestions(data.items);
          }
        }
      } catch {
        // Ignore network errors during autosuggest
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [targetRole, step, language]);

  // Fetch skill suggestions when typing skillQuery in step 3
  useEffect(() => {
    if (step !== 3) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/profile/suggest?type=skill&q=${encodeURIComponent(skillQuery.trim())}&lang=${language}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) {
            setSkillSuggestions(data.items);
          }
        }
      } catch {
        // Ignore network errors during autosuggest
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [skillQuery, step, language]);

  const buildPayload = useCallback(
    (completeOnboarding: boolean) => {
      const minVal = salaryMin.trim() !== '' && Number.isFinite(Number(salaryMin)) ? Number(salaryMin) : null;
      const maxVal = salaryMax.trim() !== '' && Number.isFinite(Number(salaryMax)) ? Number(salaryMax) : null;
      const safeMax =
        minVal !== null && maxVal !== null && maxVal < minVal ? minVal : maxVal;

      return {
        fullName: fullName.trim(),
        headline: targetRole.trim(),
        targetRole: targetRole.trim(),
        seniority,
        yearsOfExperience: Number.isFinite(yearsOfExperience) ? yearsOfExperience : 0,
        skills: skills.slice(0, MAX_PROFILE_SKILLS),
        country: country.trim(),
        city: city.trim(),
        willingToRelocate,
        remotePreference,
        employmentTypes,
        expectedSalary: {
          min: minVal,
          max: safeMax,
          currency: salaryCurrency || 'USD',
          visible: salaryVisible,
        },
        languages,
        completeOnboarding,
      };
    },
    [
      fullName,
      targetRole,
      seniority,
      yearsOfExperience,
      skills,
      country,
      city,
      willingToRelocate,
      remotePreference,
      employmentTypes,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryVisible,
      languages,
    ]
  );

  // Compute live profile completion percentage
  const liveCompletion = useMemo(() => {
    return calculateProfileCompletion({
      fullName,
      headline: targetRole,
      targetRole,
      seniority,
      yearsOfExperience,
      skills,
      country,
      city,
      willingToRelocate,
      remotePreference,
      employmentTypes,
      expectedSalary: {
        min: salaryMin ? Number(salaryMin) : null,
        max: salaryMax ? Number(salaryMax) : null,
        currency: salaryCurrency,
        visible: salaryVisible,
      },
      languages,
    });
  }, [
    fullName,
    targetRole,
    seniority,
    yearsOfExperience,
    skills,
    country,
    city,
    willingToRelocate,
    remotePreference,
    employmentTypes,
    salaryMin,
    salaryMax,
    salaryCurrency,
    salaryVisible,
    languages,
  ]);

  // Save draft helper called after each step
  const saveDraft = useCallback(async () => {
    setSaveState('saving');
    const res = await updateUserProfileClient(buildPayload(false));
    setSaveState(res.ok ? 'saved' : 'idle');
  }, [buildPayload]);

  const handleNextStep = async () => {
    await saveDraft();
    if (step < 4) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handlePrevStep = async () => {
    await saveDraft();
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleSkipCurrentStep = async () => {
    if (step < 4) {
      await saveDraft();
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    } else {
      await handleSkipAllOnboarding();
    }
  };

  const handleSkipAllOnboarding = async () => {
    setIsSkipping(true);
    try {
      await skipUserOnboardingClient();
      await refreshUser();
      router.push('/dashboard');
    } finally {
      setIsSkipping(false);
    }
  };

  const handleFinishOnboarding = async () => {
    setIsSubmittingFinal(true);
    try {
      const res = await updateUserProfileClient(buildPayload(true));
      if (res.ok) {
        await refreshUser();
        setIsCompleted(true);
      }
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  const handleAddSkill = (skillToAdd: string) => {
    const cleaned = skillToAdd.trim();
    if (!cleaned) return;
    if (skills.length >= MAX_PROFILE_SKILLS) return;
    if (!skills.some((s) => s.toLowerCase() === cleaned.toLowerCase())) {
      setSkills((prev) => [...prev, cleaned].slice(0, MAX_PROFILE_SKILLS));
    }
    setSkillQuery('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleAddLanguage = (langToAdd: string) => {
    const cleaned = langToAdd.trim();
    if (!cleaned) return;
    if (!languages.some((l) => l.toLowerCase() === cleaned.toLowerCase())) {
      setLanguages((prev) => [...prev, cleaned].slice(0, 15));
    }
    setLanguageInput('');
  };

  const handleRemoveLanguage = (langToRemove: string) => {
    setLanguages((prev) => prev.filter((l) => l !== langToRemove));
  };

  const toggleEmploymentType = (empType: EmploymentType) => {
    setEmploymentTypes((prev) =>
      prev.includes(empType) ? prev.filter((tItem) => tItem !== empType) : [...prev, empType]
    );
  };

  // Upload CV and call /api/jobs/extract-profile to auto-fill remaining fields
  const handleCvUploadAutoFill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingCv(true);
    setCvNotice(null);
    try {
      const rawText = await extractTextFromFile(file);
      const res = await fetch('/api/jobs/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });

      if (res.ok) {
        const data = await res.json();
        const extracted = data.profile;
        if (extracted) {
          if (extracted.fullName && !fullName.trim()) {
            setFullName(extracted.fullName);
          }
          const extractedRole =
            extracted.targetRole ||
            (Array.isArray(extracted.targetTitles) ? extracted.targetTitles[0] : '');
          if (extractedRole) {
            setTargetRole(extractedRole);
          }
          if (extracted.seniority && ['student', 'junior', 'mid', 'senior', 'lead'].includes(extracted.seniority)) {
            setSeniority(extracted.seniority as SeniorityLevel);
          }
          if (typeof extracted.yearsOfExperience === 'number') {
            setYearsOfExperience(extracted.yearsOfExperience);
          }
          if (Array.isArray(extracted.topSkills) && extracted.topSkills.length > 0) {
            setSkills((prev) => {
              const merged = [...prev];
              for (const s of extracted.topSkills) {
                if (
                  typeof s === 'string' &&
                  s.trim() &&
                  !merged.some((m) => m.toLowerCase() === s.trim().toLowerCase()) &&
                  merged.length < MAX_PROFILE_SKILLS
                ) {
                  merged.push(s.trim());
                }
              }
              return merged;
            });
          }
          if (Array.isArray(extracted.languages) && extracted.languages.length > 0) {
            setLanguages((prev) => {
              const merged = [...prev];
              for (const l of extracted.languages) {
                if (
                  typeof l === 'string' &&
                  l.trim() &&
                  !merged.some((m) => m.toLowerCase() === l.trim().toLowerCase())
                ) {
                  merged.push(l.trim());
                }
              }
              return merged;
            });
          }
          if (extracted.city && !city.trim()) setCity(extracted.city);
          if (extracted.countryName && !country.trim()) setCountry(extracted.countryName);

          setCvNotice({
            type: 'success',
            text: t('onboarding_cv_autofill_success'),
          });
        }
      }
    } catch (err: any) {
      setCvNotice({
        type: 'error',
        text: err?.message || 'Could not extract CV text.',
      });
    } finally {
      setIsExtractingCv(false);
      if (cvInputRef.current) cvInputRef.current.value = '';
    }
  };

  const recommendedRoleSkills = useMemo(
    () => getRecommendedSkillsForRole(targetRole),
    [targetRole]
  );

  const NextArrow = isRtl ? ArrowLeft : ArrowRight;
  const PrevArrow = isRtl ? ArrowRight : ArrowLeft;

  if (authLoading || isInitialLoading) {
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="min-h-[100dvh] bg-paper text-ink flex items-center justify-center p-6"
      >
        <div className="flex items-center gap-3 text-ink-2 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-brand" />
          <span>{t('onboarding_draft_saving')}</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUCCESS SCREEN AFTER FINISHING ONBOARDING
  // =========================================================================
  if (isCompleted) {
    const jobsUrlParams = new URLSearchParams();
    if (targetRole.trim()) jobsUrlParams.set('query', targetRole.trim());
    const locStr = [city.trim(), country.trim()].filter(Boolean).join(', ');
    if (locStr) jobsUrlParams.set('location', locStr);
    jobsUrlParams.set('country', resolveCountryCodeFromProfile(country, city));
    if (remotePreference === 'remote') jobsUrlParams.set('remote', 'true');
    if (seniority) {
      jobsUrlParams.set('seniority', seniority === 'student' ? 'junior' : seniority);
    }

    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="min-h-[100dvh] bg-paper text-ink flex items-center justify-center px-4 py-10"
      >
        <main
          id="main-content"
          className="w-full max-w-xl rounded-2xl border border-line bg-surface p-6 sm:p-10 shadow-sm text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-soft text-brand text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('onboarding_success_badge')}</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              {t('onboarding_success_title')}
            </h1>
            <p className="text-sm text-ink-2 max-w-md mx-auto">
              {t('onboarding_success_desc')}
            </p>
          </div>

          {/* Profile Completion Card */}
          <div className="rounded-xl border border-line bg-surface-2/60 p-5 space-y-3 text-start">
            <div className="flex items-center justify-between text-sm font-semibold text-ink">
              <span>
                {t('onboarding_success_completion').replace('{percent}', String(liveCompletion))}
              </span>
              <span className="font-mono text-brand font-bold">{liveCompletion}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={liveCompletion}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('profile_completion_label')}
              className="w-full h-2.5 rounded-full bg-line overflow-hidden"
            >
              <div
                className="h-full bg-brand transition-all duration-500 rounded-full"
                style={{ width: `${liveCompletion}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-ink-2">
              {targetRole && (
                <span className="px-2.5 py-1 rounded-md bg-surface border border-line">
                  {targetRole}
                </span>
              )}
              {skills.slice(0, 4).map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-md bg-surface border border-line">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Primary Actions: "Find jobs for me" & "Build my resume" */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(`/jobs?${jobsUrlParams.toString()}`)}
              endIcon={<Briefcase className="w-4 h-4" />}
              className="w-full justify-center"
            >
              {t('onboarding_cta_find_jobs')}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push('/builder?prefill=profile')}
              endIcon={<FileText className="w-4 h-4" />}
              className="w-full justify-center"
            >
              {t('onboarding_cta_build_resume')}
            </Button>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="text-xs font-medium text-ink-2 hover:text-ink underline underline-offset-4"
            >
              {t('onboarding_cta_go_dashboard')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // 4-STEP WIZARD
  // =========================================================================
  const progressPercent = step * 25;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between py-6 sm:py-10 px-4 sm:px-6"
    >
      <main id="main-content" className="w-full max-w-2xl mx-auto space-y-6">
        {/* Top Bar: Step counter, Profile Completion badge, and Skip button */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-semibold">
              {t('onboarding_step_of')
                .replace('{current}', String(step))
                .replace('{total}', '4')}
            </span>
            <span className="text-xs text-ink-2 font-mono">
              {t('profile_completion_label')}: <strong className="text-ink">{liveCompletion}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {saveState !== 'idle' && (
              <span aria-live="polite" className="text-xs text-ink-3 hidden sm:inline">
                {saveState === 'saving'
                  ? t('onboarding_draft_saving')
                  : t('onboarding_draft_saved')}
              </span>
            )}
            <button
              type="button"
              onClick={handleSkipAllOnboarding}
              disabled={isSkipping}
              className="text-xs font-medium text-ink-2 hover:text-ink underline underline-offset-4 cursor-pointer"
            >
              {t('onboarding_skip_all')}
            </button>
          </div>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="space-y-2">
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('onboarding_step_of')
              .replace('{current}', String(step))
              .replace('{total}', '4')}
            className="w-full h-2 rounded-full bg-line overflow-hidden"
          >
            <div
              className="h-full bg-brand transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setStep(idx as 1 | 2 | 3 | 4)}
                className={`text-start text-[11px] font-medium py-1 border-t-2 transition-colors cursor-pointer ${
                  step >= idx ? 'border-brand text-ink' : 'border-transparent text-ink-3'
                }`}
              >
                {idx}.{' '}
                {idx === 1
                  ? t('profile_country')
                  : idx === 2
                  ? t('profile_target_role')
                  : idx === 3
                  ? t('profile_skills')
                  : t('profile_remote_preference')}
              </button>
            ))}
          </div>
        </div>

        {/* Step Card */}
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-8 shadow-sm space-y-6">
          {/* STEP 1: Name + Country / City */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1 text-start">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                  {t('onboarding_step1_title')}
                </h1>
                <p className="text-xs sm:text-sm text-ink-2">
                  {t('onboarding_step1_desc')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 text-start">
                  <label htmlFor="onb-fullname" className="block text-xs font-semibold text-ink">
                    {t('profile_full_name')}
                  </label>
                  <input
                    id="onb-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isRtl ? 'مثال: أحمد محمد' : 'e.g. Alex Morgan'}
                    className="w-full h-11 px-3.5 rounded-xl bg-paper border border-line text-sm text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Quick Country Chips */}
                <div className="space-y-2 text-start">
                  <label htmlFor="onb-country" className="block text-xs font-semibold text-ink">
                    {t('profile_country')}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_COUNTRIES.map((c) => {
                      const label = isRtl ? c.labelAr : c.labelEn;
                      const isSelected =
                        country.toLowerCase() === c.labelEn.toLowerCase() ||
                        country === c.labelAr;
                      return (
                        <button
                          key={c.labelEn}
                          type="button"
                          onClick={() => {
                            setCountry(label);
                            if (!city.trim()) {
                              setCity(isRtl ? c.defaultCityAr : c.defaultCityEn);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-brand text-white border-brand'
                              : 'bg-paper text-ink-2 border-line hover:border-brand/50'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    id="onb-country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={isRtl ? 'الدولة (مثال: مصر)' : 'Country (e.g. Egypt)'}
                    className="w-full h-11 px-3.5 rounded-xl bg-paper border border-line text-sm text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5 text-start">
                  <label htmlFor="onb-city" className="block text-xs font-semibold text-ink">
                    {t('profile_city')}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-ink-3 absolute top-3.5 start-3.5 pointer-events-none" />
                    <input
                      id="onb-city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={isRtl ? 'المدينة (مثال: القاهرة)' : 'City (e.g. Cairo)'}
                      className="w-full h-11 ps-10 pe-3.5 rounded-xl bg-paper border border-line text-sm text-ink focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-xs sm:text-sm text-ink cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={willingToRelocate}
                    onChange={(e) => setWillingToRelocate(e.target.checked)}
                    className="w-4 h-4 rounded border-line text-brand focus:ring-brand"
                  />
                  <span>{t('profile_willing_to_relocate')}</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: Target Role (Autosuggest) + Seniority + Years of Experience */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1 text-start">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                  {t('onboarding_step2_title')}
                </h1>
                <p className="text-xs sm:text-sm text-ink-2">
                  {t('onboarding_step2_desc')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 text-start relative">
                  <label htmlFor="onb-role" className="block text-xs font-semibold text-ink">
                    {t('profile_target_role')}
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-ink-3 absolute top-3.5 start-3.5 pointer-events-none" />
                    <input
                      id="onb-role"
                      type="text"
                      value={targetRole}
                      onFocus={() => setShowRoleDropdown(true)}
                      onBlur={() => setTimeout(() => setShowRoleDropdown(false), 180)}
                      onChange={(e) => {
                        setTargetRole(e.target.value);
                        setShowRoleDropdown(true);
                      }}
                      placeholder={
                        isRtl
                          ? 'مثال: مهندس واجهات أمامية، محاسب مالي...'
                          : 'e.g. Frontend Engineer, Financial Analyst...'
                      }
                      role="combobox"
                      aria-autocomplete="list"
                      aria-controls="onb-role-listbox"
                      aria-expanded={showRoleDropdown && roleSuggestions.length > 0}
                      className="w-full h-11 ps-10 pe-3.5 rounded-xl bg-paper border border-line text-sm text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  {showRoleDropdown && roleSuggestions.length > 0 && (
                    <ul
                      id="onb-role-listbox"
                      role="listbox"
                      className="z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-line bg-surface shadow-lg divide-y divide-line/50"
                    >
                      {roleSuggestions.map((suggestion) => (
                        <li key={suggestion}>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setTargetRole(suggestion);
                              setShowRoleDropdown(false);
                            }}
                            className="w-full text-start px-3.5 py-2.5 text-xs sm:text-sm text-ink hover:bg-brand-soft/50 transition-colors cursor-pointer"
                          >
                            {suggestion}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Seniority Selector */}
                <div className="space-y-2 text-start">
                  <span className="block text-xs font-semibold text-ink">
                    {t('profile_seniority')}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {SENIORITY_LEVELS.map((lvl) => {
                      const labelKey = `profile_seniority_${lvl}` as const;
                      const isSelected = seniority === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSeniority(lvl)}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand text-white border-brand shadow-xs'
                              : 'bg-paper text-ink-2 border-line hover:border-brand/50'
                          }`}
                        >
                          {t(labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Years of Experience */}
                <div className="space-y-1.5 text-start">
                  <label htmlFor="onb-years" className="block text-xs font-semibold text-ink">
                    {t('profile_years_experience')}:{' '}
                    <span className="font-mono text-brand font-bold">{yearsOfExperience}</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      id="onb-years"
                      type="range"
                      min={0}
                      max={25}
                      value={Math.min(25, yearsOfExperience)}
                      onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                      className="flex-1 accent-brand cursor-pointer"
                    />
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={yearsOfExperience}
                      onChange={(e) =>
                        setYearsOfExperience(Math.max(0, Math.min(60, Number(e.target.value) || 0)))
                      }
                      aria-label={t('profile_years_experience')}
                      className="w-20 h-10 px-2.5 rounded-xl bg-paper border border-line text-center font-mono text-sm text-ink"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Skills (Chips + Search + Role Suggestions) & Languages */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1 text-start">
                <div className="flex items-center justify-between">
                  <h1 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                    {t('onboarding_step3_title')}
                  </h1>
                  <span className="text-xs font-mono text-ink-2">
                    {skills.length}/{MAX_PROFILE_SKILLS}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-ink-2">
                  {t('onboarding_step3_desc')}
                </p>
              </div>

              {/* Selected Skills Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2.5 rounded-xl bg-paper border border-line">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-soft text-brand text-xs font-medium"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label={`Remove ${skill}`}
                      className="hover:text-danger cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                {skills.length === 0 && (
                  <span className="text-xs text-ink-3 py-1">
                    {t('profile_skills_limit_hint')}
                  </span>
                )}
              </div>

              {/* Skill Search Input + Autosuggest */}
              <div className="space-y-2 text-start">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-ink-3 absolute top-3.5 start-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={skillQuery}
                      onChange={(e) => setSkillQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill(skillQuery);
                        }
                      }}
                      placeholder={t('onboarding_skills_search_placeholder')}
                      className="w-full h-11 ps-10 pe-3.5 rounded-xl bg-paper border border-line text-sm text-ink focus:outline-none focus:border-brand"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleAddSkill(skillQuery)}
                    disabled={!skillQuery.trim() || skills.length >= MAX_PROFILE_SKILLS}
                  >
                    <Plus className="w-4 h-4 me-1" />
                    {t('onboarding_add_btn')}
                  </Button>
                </div>

                {/* Autosuggest & Role-based Suggested Skills */}
                <div className="space-y-1.5 pt-1">
                  <span className="block text-[11px] font-semibold text-ink-2 uppercase tracking-wider">
                    {t('onboarding_skills_suggested_for_role')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set([...recommendedRoleSkills, ...skillSuggestions]))
                      .filter((s) => !skills.some((existing) => existing.toLowerCase() === s.toLowerCase()))
                      .slice(0, 10)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleAddSkill(s)}
                          disabled={skills.length >= MAX_PROFILE_SKILLS}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-line bg-paper hover:border-brand/50 text-xs text-ink-2 hover:text-ink transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-brand" />
                          <span>{s}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Languages Section */}
              <div className="space-y-2.5 pt-2 border-t border-line text-start">
                <label className="block text-xs font-semibold text-ink">
                  {t('profile_languages')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-xs font-medium text-ink"
                    >
                      <Globe className="w-3 h-3 text-brand" />
                      <span>{lang}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(lang)}
                        aria-label={`Remove ${lang}`}
                        className="text-ink-3 hover:text-danger cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_LANGUAGES.filter(
                    (ql) => !languages.some((l) => l.toLowerCase() === ql.toLowerCase())
                  ).map((ql) => (
                    <button
                      key={ql}
                      type="button"
                      onClick={() => handleAddLanguage(ql)}
                      className="px-2.5 py-1 rounded-lg border border-line bg-paper text-xs text-ink-2 hover:border-brand/50 cursor-pointer"
                    >
                      + {ql}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLanguage(languageInput);
                      }
                    }}
                    placeholder={t('onboarding_languages_placeholder')}
                    className="flex-1 h-10 px-3.5 rounded-xl bg-paper border border-line text-xs sm:text-sm text-ink focus:outline-none focus:border-brand"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddLanguage(languageInput)}
                    disabled={!languageInput.trim()}
                  >
                    {t('onboarding_add_btn')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Preferences + Salary (Private) + Upload CV Auto-Fill */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-1 text-start">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                  {t('onboarding_step4_title')}
                </h1>
                <p className="text-xs sm:text-sm text-ink-2">
                  {t('onboarding_step4_desc')}
                </p>
              </div>

              {/* Remote Preference */}
              <div className="space-y-2 text-start">
                <span className="block text-xs font-semibold text-ink">
                  {t('profile_remote_preference')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REMOTE_PREFERENCES.map((pref) => {
                    const labelKey = `profile_remote_${pref}` as const;
                    const active = remotePreference === pref;
                    return (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setRemotePreference(pref)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          active
                            ? 'bg-brand text-white border-brand'
                            : 'bg-paper text-ink-2 border-line hover:border-brand/50'
                        }`}
                      >
                        {t(labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Employment Types */}
              <div className="space-y-2 text-start">
                <span className="block text-xs font-semibold text-ink">
                  {t('profile_employment_types')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EMPLOYMENT_TYPES.map((emp) => {
                    const keyMap: Record<EmploymentType, any> = {
                      'full-time': 'profile_emp_full_time',
                      'part-time': 'profile_emp_part_time',
                      contract: 'profile_emp_contract',
                      internship: 'profile_emp_internship',
                    };
                    const active = employmentTypes.includes(emp);
                    return (
                      <button
                        key={emp}
                        type="button"
                        onClick={() => toggleEmploymentType(emp)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          active
                            ? 'bg-brand-soft text-brand border-brand font-semibold'
                            : 'bg-paper text-ink-2 border-line hover:border-brand/50'
                        }`}
                      >
                        {t(keyMap[emp])}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expected Salary (Optional, Private by default) */}
              <div className="rounded-xl border border-line bg-paper p-4 space-y-3 text-start">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-brand" />
                    {t('profile_expected_salary')}
                  </span>
                  <span className="text-[11px] text-ink-3">
                    {t('profile_salary_privacy_hint')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min={0}
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder={t('onboarding_salary_min_placeholder')}
                    aria-label="Minimum expected salary"
                    className="h-10 px-3 rounded-lg bg-surface border border-line text-xs sm:text-sm text-ink font-mono"
                  />
                  <input
                    type="number"
                    min={0}
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder={t('onboarding_salary_max_placeholder')}
                    aria-label="Maximum expected salary"
                    className="h-10 px-3 rounded-lg bg-surface border border-line text-xs sm:text-sm text-ink font-mono"
                  />
                  <select
                    value={salaryCurrency}
                    onChange={(e) => setSalaryCurrency(e.target.value)}
                    aria-label="Salary currency"
                    className="h-10 px-2.5 rounded-lg bg-surface border border-line text-xs sm:text-sm text-ink font-mono"
                  >
                    <option value="USD">USD</option>
                    <option value="EGP">EGP</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs text-ink-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={salaryVisible}
                    onChange={(e) => setSalaryVisible(e.target.checked)}
                    className="w-4 h-4 rounded border-line text-brand focus:ring-brand"
                  />
                  <span>{t('onboarding_salary_visible_toggle')}</span>
                </label>
              </div>

              {/* CV Upload Auto-Fill Card */}
              <div className="rounded-xl border border-dashed border-brand/50 bg-brand-soft/20 p-4 sm:p-5 space-y-3 text-start">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand" />
                      <span>{t('onboarding_cv_autofill_title')}</span>
                    </h2>
                    <p className="text-xs text-ink-2">
                      {t('onboarding_cv_autofill_desc')}
                    </p>
                  </div>
                  <input
                    ref={cvInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleCvUploadAutoFill}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => cvInputRef.current?.click()}
                    disabled={isExtractingCv}
                    startIcon={
                      isExtractingCv ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )
                    }
                  >
                    {isExtractingCv
                      ? t('onboarding_cv_extracting')
                      : t('onboarding_cv_upload_btn')}
                  </Button>
                </div>

                {cvNotice && (
                  <div
                    role="status"
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      cvNotice.type === 'success'
                        ? 'bg-brand-soft text-brand font-medium'
                        : 'bg-danger-soft text-danger'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{cvNotice.text}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Navigation inside Wizard Card */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-line">
            <div>
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handlePrevStep}
                  startIcon={<PrevArrow className="w-4 h-4" />}
                >
                  {t('onboarding_back_btn')}
                </Button>
              ) : (
                <span />
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSkipCurrentStep}
              >
                {t('onboarding_skip_step')}
              </Button>

              {step < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNextStep}
                  endIcon={<NextArrow className="w-4 h-4" />}
                >
                  {t('onboarding_next_btn')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleFinishOnboarding}
                  disabled={isSubmittingFinal}
                  endIcon={
                    isSubmittingFinal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )
                  }
                >
                  {t('onboarding_finish_btn')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
