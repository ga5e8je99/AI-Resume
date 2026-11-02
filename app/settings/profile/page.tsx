'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { useToast } from '@/app/context/ToastContext';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
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
} from '@/lib/profile/client';
import {
  Briefcase,
  CheckCircle2,
  Globe,
  Link2,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Plus,
  Search,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';

export default function SettingsProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const { t, isRtl, language } = useLanguage();
  const toast = useToast();

  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExtractingCv, setIsExtractingCv] = useState<boolean>(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  // Profile fields
  const [fullName, setFullName] = useState<string>('');
  const [headline, setHeadline] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('');
  const [seniority, setSeniority] = useState<SeniorityLevel | null>('mid');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(2);
  const [industries, setIndustries] = useState<string[]>([]);
  const [industryInput, setIndustryInput] = useState<string>('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillQuery, setSkillQuery] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [willingToRelocate, setWillingToRelocate] = useState<boolean>(false);
  const [remotePreference, setRemotePreference] = useState<RemotePreference>('any');
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>(['full-time']);
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [salaryCurrency, setSalaryCurrency] = useState<string>('USD');
  const [salaryVisible, setSalaryVisible] = useState<boolean>(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [phoneVisible, setPhoneVisible] = useState<boolean>(false);
  const [linkedin, setLinkedin] = useState<string>('');
  const [github, setGithub] = useState<string>('');
  const [portfolio, setPortfolio] = useState<string>('');

  // Autosuggest lists
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState<boolean>(false);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/settings/profile');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchUserProfileClient(true, user.id).then((prof) => {
      if (!active) return;
      if (prof) {
        setFullName(prof.fullName || user.name || '');
        setHeadline(prof.headline || prof.targetRole || '');
        setTargetRole(prof.targetRole || prof.headline || '');
        setSeniority(prof.seniority || 'mid');
        setYearsOfExperience(
          typeof prof.yearsOfExperience === 'number' ? prof.yearsOfExperience : 0
        );
        setIndustries(Array.isArray(prof.industries) ? prof.industries : []);
        setSkills(Array.isArray(prof.skills) ? prof.skills : []);
        setCountry(prof.country || '');
        setCity(prof.city || '');
        setWillingToRelocate(Boolean(prof.willingToRelocate));
        setRemotePreference(prof.remotePreference || 'any');
        setEmploymentTypes(
          Array.isArray(prof.employmentTypes) && prof.employmentTypes.length > 0
            ? prof.employmentTypes
            : ['full-time']
        );
        if (prof.expectedSalary) {
          if (typeof prof.expectedSalary.min === 'number') {
            setSalaryMin(String(prof.expectedSalary.min));
          }
          if (typeof prof.expectedSalary.max === 'number') {
            setSalaryMax(String(prof.expectedSalary.max));
          }
          if (prof.expectedSalary.currency) {
            setSalaryCurrency(prof.expectedSalary.currency);
          }
          setSalaryVisible(Boolean(prof.expectedSalary.visible));
        }
        setLanguages(Array.isArray(prof.languages) ? prof.languages : []);
        setPhone(prof.phone || '');
        setPhoneVisible(Boolean(prof.phoneVisible));
        setLinkedin(prof.links?.linkedin || '');
        setGithub(prof.links?.github || '');
        setPortfolio(prof.links?.portfolio || '');
      }
      setIsLoadingProfile(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  // Role autosuggest
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/profile/suggest?type=role&q=${encodeURIComponent(targetRole.trim())}&lang=${language}&limit=8`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) setRoleSuggestions(data.items);
        }
      } catch {
        // Ignore network errors
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [targetRole, language]);

  // Skill autosuggest
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/profile/suggest?type=skill&q=${encodeURIComponent(skillQuery.trim())}&lang=${language}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) setSkillSuggestions(data.items);
        }
      } catch {
        // Ignore network errors
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [skillQuery, language]);

  const liveCompletion = useMemo(() => {
    return calculateProfileCompletion({
      fullName,
      headline: headline || targetRole,
      targetRole,
      seniority,
      yearsOfExperience,
      industries,
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
      phone,
      phoneVisible,
      links: { linkedin, github, portfolio },
    });
  }, [
    fullName,
    headline,
    targetRole,
    seniority,
    yearsOfExperience,
    industries,
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
    phone,
    phoneVisible,
    linkedin,
    github,
    portfolio,
  ]);

  const handleAddSkill = (s: string) => {
    const cleaned = s.trim();
    if (!cleaned || skills.length >= MAX_PROFILE_SKILLS) return;
    if (!skills.some((item) => item.toLowerCase() === cleaned.toLowerCase())) {
      setSkills((prev) => [...prev, cleaned].slice(0, MAX_PROFILE_SKILLS));
    }
    setSkillQuery('');
  };

  const handleAddIndustry = (ind: string) => {
    const cleaned = ind.trim();
    if (!cleaned || industries.length >= 15) return;
    if (!industries.some((item) => item.toLowerCase() === cleaned.toLowerCase())) {
      setIndustries((prev) => [...prev, cleaned].slice(0, 15));
    }
    setIndustryInput('');
  };

  const handleAddLanguage = (lang: string) => {
    const cleaned = lang.trim();
    if (!cleaned || languages.length >= 15) return;
    if (!languages.some((item) => item.toLowerCase() === cleaned.toLowerCase())) {
      setLanguages((prev) => [...prev, cleaned].slice(0, 15));
    }
    setLanguageInput('');
  };

  const toggleEmploymentType = (emp: EmploymentType) => {
    setEmploymentTypes((prev) =>
      prev.includes(emp) ? prev.filter((e) => e !== emp) : [...prev, emp]
    );
  };

  const handleCvUploadAutoFill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtractingCv(true);
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
          if (extracted.fullName && !fullName.trim()) setFullName(extracted.fullName);
          const role =
            extracted.targetRole ||
            (Array.isArray(extracted.targetTitles) ? extracted.targetTitles[0] : '');
          if (role) {
            setTargetRole(role);
            if (!headline.trim()) setHeadline(role);
          }
          if (extracted.seniority) setSeniority(extracted.seniority as SeniorityLevel);
          if (typeof extracted.yearsOfExperience === 'number') {
            setYearsOfExperience(extracted.yearsOfExperience);
          }
          if (Array.isArray(extracted.topSkills)) {
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
          if (Array.isArray(extracted.languages)) {
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
          toast.success(t('onboarding_cv_autofill_success'));
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to extract profile from CV');
    } finally {
      setIsExtractingCv(false);
      if (cvInputRef.current) cvInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveBanner(null);

    const minVal =
      salaryMin.trim() !== '' && Number.isFinite(Number(salaryMin)) ? Number(salaryMin) : null;
    const maxVal =
      salaryMax.trim() !== '' && Number.isFinite(Number(salaryMax)) ? Number(salaryMax) : null;
    const safeMax =
      minVal !== null && maxVal !== null && maxVal < minVal ? minVal : maxVal;

    const result = await updateUserProfileClient({
      fullName: fullName.trim(),
      headline: (headline || targetRole).trim(),
      targetRole: (targetRole || headline).trim(),
      seniority,
      yearsOfExperience,
      industries,
      skills,
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
      phone: phone.trim(),
      phoneVisible,
      links: {
        linkedin: linkedin.trim(),
        github: github.trim(),
        portfolio: portfolio.trim(),
      },
      completeOnboarding: true,
    });

    setIsSaving(false);
    if (result.ok) {
      await refreshUser();
      setSaveBanner(t('settings_profile_saved_toast'));
      toast.success(t('settings_profile_saved_toast'));
    } else {
      toast.error(result.error || 'Failed to save profile');
    }
  };

  return (
    <AppShell
      title={t('profile_title')}
      description={t('profile_subtitle')}
      breadcrumbs={[
        { label: t('nav_dashboard'), href: '/dashboard' },
        { label: t('profile_title') },
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Profile Completion Progress Card */}
        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5 text-start">
              <h2 className="text-sm sm:text-base font-semibold text-ink">
                {t('profile_completion_label')}
              </h2>
              <p className="text-xs text-ink-2">
                {t('settings_profile_completion_hint')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-brand">
                {liveCompletion}%
              </span>
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
                {t('onboarding_cv_upload_btn')}
              </Button>
            </div>
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
              className="h-full bg-brand transition-all duration-300 rounded-full"
              style={{ width: `${liveCompletion}%` }}
            />
          </div>
        </section>

        {saveBanner && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-brand-soft border border-brand/30 text-brand text-xs sm:text-sm font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveBanner}</span>
          </div>
        )}

        {isLoadingProfile ? (
          <div className="rounded-2xl border border-line bg-surface p-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Basic Info & Role */}
            <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start">
                <div className="space-y-1.5">
                  <label htmlFor="prof-fullname" className="block text-xs font-semibold text-ink">
                    {t('profile_full_name')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-ink-3 absolute top-3.5 start-3.5 pointer-events-none" />
                    <input
                      id="prof-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 ps-10 pe-3.5 rounded-xl bg-paper border border-line text-sm text-ink"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <label htmlFor="prof-role" className="block text-xs font-semibold text-ink">
                    {t('profile_target_role')}
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-ink-3 absolute top-3.5 start-3.5 pointer-events-none" />
                    <input
                      id="prof-role"
                      type="text"
                      value={targetRole}
                      onFocus={() => setShowRoleSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 180)}
                      onChange={(e) => {
                        setTargetRole(e.target.value);
                        setHeadline(e.target.value);
                        setShowRoleSuggestions(true);
                      }}
                      className="w-full h-11 ps-10 pe-3.5 rounded-xl bg-paper border border-line text-sm text-ink"
                    />
                  </div>
                  {showRoleSuggestions && roleSuggestions.length > 0 && (
                    <ul
                      role="listbox"
                      className="absolute z-20 mt-1 w-full max-h-44 overflow-y-auto rounded-xl border border-line bg-surface shadow-lg divide-y divide-line/50"
                    >
                      {roleSuggestions.map((item) => (
                        <li key={item}>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setTargetRole(item);
                              setHeadline(item);
                              setShowRoleSuggestions(false);
                            }}
                            className="w-full text-start px-3.5 py-2 text-xs sm:text-sm text-ink hover:bg-brand-soft/40 cursor-pointer"
                          >
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Seniority & Years of Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-start">
                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-ink">
                    {t('profile_seniority')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SENIORITY_LEVELS.map((lvl) => {
                      const labelKey = `profile_seniority_${lvl}` as const;
                      const active = seniority === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSeniority(lvl)}
                          className={`px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
                            active
                              ? 'bg-brand text-white border-brand'
                              : 'bg-paper text-ink-2 border-line'
                          }`}
                        >
                          {t(labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="prof-years" className="block text-xs font-semibold text-ink">
                    {t('profile_years_experience')}
                  </label>
                  <input
                    id="prof-years"
                    type="number"
                    min={0}
                    max={60}
                    value={yearsOfExperience}
                    onChange={(e) =>
                      setYearsOfExperience(Math.max(0, Math.min(60, Number(e.target.value) || 0)))
                    }
                    className="w-full h-11 px-3.5 rounded-xl bg-paper border border-line text-sm text-ink font-mono"
                  />
                </div>
              </div>

              {/* Location & Relocation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-start">
                <div className="space-y-1.5">
                  <label htmlFor="prof-country" className="block text-xs font-semibold text-ink">
                    {t('profile_country')}
                  </label>
                  <input
                    id="prof-country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-paper border border-line text-sm text-ink"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="prof-city" className="block text-xs font-semibold text-ink">
                    {t('profile_city')}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-ink-3 absolute top-3.5 start-3.5 pointer-events-none" />
                    <input
                      id="prof-city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-11 ps-10 pe-3.5 rounded-xl bg-paper border border-line text-sm text-ink"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs sm:text-sm text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={willingToRelocate}
                  onChange={(e) => setWillingToRelocate(e.target.checked)}
                  className="w-4 h-4 rounded border-line text-brand"
                />
                <span>{t('profile_willing_to_relocate')}</span>
              </label>
            </section>

            {/* Section 2: Skills (Max 30), Industries & Languages */}
            <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 space-y-5 text-start">
              {/* Skills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink">
                    {t('profile_skills')}
                  </label>
                  <span className="text-xs font-mono text-ink-2">
                    {skills.length}/{MAX_PROFILE_SKILLS}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2.5 rounded-xl bg-paper border border-line">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-soft text-brand text-xs font-medium"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => setSkills((prev) => prev.filter((item) => item !== s))}
                        aria-label={`Remove ${s}`}
                        className="hover:text-danger cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
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
                      className="w-full h-11 ps-10 pe-3.5 rounded-xl bg-paper border border-line text-sm text-ink"
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
                {skillSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skillSuggestions
                      .filter((s) => !skills.some((ex) => ex.toLowerCase() === s.toLowerCase()))
                      .slice(0, 8)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleAddSkill(s)}
                          className="px-2.5 py-1 rounded-lg border border-line bg-paper text-xs text-ink-2 hover:border-brand/50 cursor-pointer"
                        >
                          + {s}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Industries */}
              <div className="space-y-2 pt-3 border-t border-line">
                <label className="block text-xs font-semibold text-ink">
                  {t('profile_industries')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {industries.map((ind) => (
                    <span
                      key={ind}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-xs text-ink"
                    >
                      <span>{ind}</span>
                      <button
                        type="button"
                        onClick={() => setIndustries((prev) => prev.filter((i) => i !== ind))}
                        aria-label={`Remove ${ind}`}
                        className="text-ink-3 hover:text-danger cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={industryInput}
                    onChange={(e) => setIndustryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddIndustry(industryInput);
                      }
                    }}
                    placeholder={isRtl ? 'أضف قطاعاً (مثال: التكنولوجيا، البنوك)...' : 'Add industry (e.g. FinTech, Healthcare)...'}
                    className="flex-1 h-10 px-3.5 rounded-xl bg-paper border border-line text-sm text-ink"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddIndustry(industryInput)}
                  >
                    {t('onboarding_add_btn')}
                  </Button>
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-2 pt-3 border-t border-line">
                <label className="block text-xs font-semibold text-ink">
                  {t('profile_languages')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-xs text-ink"
                    >
                      <Globe className="w-3 h-3 text-brand" />
                      <span>{lang}</span>
                      <button
                        type="button"
                        onClick={() => setLanguages((prev) => prev.filter((l) => l !== lang))}
                        aria-label={`Remove ${lang}`}
                        className="text-ink-3 hover:text-danger cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
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
                    className="flex-1 h-10 px-3.5 rounded-xl bg-paper border border-line text-sm text-ink"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddLanguage(languageInput)}
                  >
                    {t('onboarding_add_btn')}
                  </Button>
                </div>
              </div>
            </section>

            {/* Section 3: Work Preferences, Privacy-Protected Salary & Phone, and Links */}
            <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 space-y-5 text-start">
              {/* Remote & Employment Types */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-ink">
                    {t('profile_remote_preference')}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {REMOTE_PREFERENCES.map((pref) => {
                      const labelKey = `profile_remote_${pref}` as const;
                      const active = remotePreference === pref;
                      return (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => setRemotePreference(pref)}
                          className={`px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
                            active
                              ? 'bg-brand text-white border-brand'
                              : 'bg-paper text-ink-2 border-line'
                          }`}
                        >
                          {t(labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-ink">
                    {t('profile_employment_types')}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
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
                          className={`px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
                            active
                              ? 'bg-brand-soft text-brand border-brand font-semibold'
                              : 'bg-paper text-ink-2 border-line'
                          }`}
                        >
                          {t(keyMap[emp])}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Privacy-Protected Expected Salary & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-line">
                <div className="rounded-xl border border-line bg-paper p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <Lock className="w-3.5 h-3.5 text-brand" />
                    <span>{t('profile_expected_salary')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min={0}
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      placeholder={t('onboarding_salary_min_placeholder')}
                      aria-label="Minimum salary"
                      className="h-10 px-2.5 rounded-lg bg-surface border border-line text-xs text-ink font-mono"
                    />
                    <input
                      type="number"
                      min={0}
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      placeholder={t('onboarding_salary_max_placeholder')}
                      aria-label="Maximum salary"
                      className="h-10 px-2.5 rounded-lg bg-surface border border-line text-xs text-ink font-mono"
                    />
                    <select
                      value={salaryCurrency}
                      onChange={(e) => setSalaryCurrency(e.target.value)}
                      aria-label="Salary currency"
                      className="h-10 px-2 rounded-lg bg-surface border border-line text-xs text-ink font-mono"
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
                      className="w-4 h-4 rounded border-line text-brand"
                    />
                    <span>{t('onboarding_salary_visible_toggle')}</span>
                  </label>
                </div>

                <div className="rounded-xl border border-line bg-paper p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <Phone className="w-3.5 h-3.5 text-brand" />
                    <span>{t('profile_phone')}</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="w-full h-10 px-3 rounded-lg bg-surface border border-line text-xs sm:text-sm text-ink font-mono"
                  />
                  <label className="flex items-center gap-2 text-xs text-ink-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={phoneVisible}
                      onChange={(e) => setPhoneVisible(e.target.checked)}
                      className="w-4 h-4 rounded border-line text-brand"
                    />
                    <span>{t('onboarding_phone_visible_toggle')}</span>
                  </label>
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-line">
                <div className="space-y-1.5">
                  <label htmlFor="prof-linkedin" className="block text-xs font-semibold text-ink">
                    {t('profile_links_linkedin')}
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-ink-3 absolute top-3 start-3 pointer-events-none" />
                    <input
                      id="prof-linkedin"
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full h-10 ps-9 pe-3 rounded-xl bg-paper border border-line text-xs text-ink"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="prof-github" className="block text-xs font-semibold text-ink">
                    {t('profile_links_github')}
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-ink-3 absolute top-3 start-3 pointer-events-none" />
                    <input
                      id="prof-github"
                      type="text"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full h-10 ps-9 pe-3 rounded-xl bg-paper border border-line text-xs text-ink"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="prof-portfolio" className="block text-xs font-semibold text-ink">
                    {t('profile_links_portfolio')}
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-ink-3 absolute top-3 start-3 pointer-events-none" />
                    <input
                      id="prof-portfolio"
                      type="text"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="https://yourportfolio.com"
                      className="w-full h-10 ps-9 pe-3 rounded-xl bg-paper border border-line text-xs text-ink"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-line">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSaving}
                  startIcon={
                    isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )
                  }
                >
                  {t('profile_save_btn')}
                </Button>
              </div>
            </section>
          </form>
        )}
      </div>
    </AppShell>
  );
}

