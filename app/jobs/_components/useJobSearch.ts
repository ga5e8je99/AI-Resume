'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { extractTextFromFile } from '@/app/lib/pdfExtractor';
import {
  Job,
  SmartLinkPlatform,
  CandidateProfileExtract,
  ProviderStatusEntry,
  JobProviderAttribution,
  JobEmploymentTypeFilter,
  JobDatePostedFilter,
  JobAlertFrequency,
  SavedJobItem,
  SavedJobSearch,
} from '@/lib/jobs/types';
import {
  filterAndSortJobs,
} from '@/lib/jobs/matcher';
import { JOB_MATCH_FREE_QUOTA } from '@/lib/plans';
import {
  fetchUserProfileClient,
  resolveCountryCodeFromProfile,
} from '@/lib/profile/client';
import {
  trackResumeUploaded,
  trackJobSearchRun,
  trackFreeQuotaExhausted,
} from '@/lib/analytics';

export interface SavedResumeOption {
  id: string;
  title: string;
  candidateName?: string;
  candidateTitle?: string;
}

export type SeniorityOption = 'junior' | 'mid' | 'senior' | 'lead' | 'any';
export type SortByOption = 'relevance' | 'newest' | 'match' | 'score' | 'date';
export type JobsViewTab = 'all' | 'saved_jobs' | 'saved_searches';

const PAGE_LIMIT = 12;

export function useJobSearch() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();

  // Resumes list & selected resume
  const [savedResumes, setSavedResumes] = useState<SavedResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [isLoadingResumes, setIsLoadingResumes] = useState<boolean>(true);

  // Optional CV Match toggle (Search works WITHOUT a CV for free; CV Match is optional and adds Match %)
  const [includeMatch, setIncludeMatch] = useState<boolean>(false);

  // Search parameters
  const [query, setQuery] = useState<string>('Software Engineer');
  const [location, setLocation] = useState<string>('Cairo, Egypt');
  const [country, setCountry] = useState<string>('eg');
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [seniority, setSeniority] = useState<SeniorityOption>('any');
  const [employmentType, setEmploymentType] = useState<JobEmploymentTypeFilter>('any');
  const [datePosted, setDatePosted] = useState<JobDatePostedFilter>('any');
  const [minSalary, setMinSalary] = useState<number>(0);
  const [targetTitles, setTargetTitles] = useState<string[]>([
    'Software Engineer',
    'Full-Stack Developer',
    'Frontend Engineer',
  ]);
  const [skills, setSkills] = useState<string[]>([
    'React',
    'TypeScript',
    'Node.js',
    'Next.js',
    'SQL',
    'Git',
  ]);
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  // Results & Cursor Pagination state
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [smartLinks, setSmartLinks] = useState<SmartLinkPlatform[]>([]);
  const [attributions, setAttributions] = useState<JobProviderAttribution[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderStatusEntry[]>([]);
  const [allProvidersFailed, setAllProvidersFailed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCachedResult, setIsCachedResult] = useState<boolean>(false);

  // Filter, Sort & Drawer states
  const [filterRemote, setFilterRemote] = useState<boolean>(false);
  const [filterMinScore, setFilterMinScore] = useState<number>(0);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortByOption>('relevance');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [selectedDrawerJob, setSelectedDrawerJob] = useState<Job | null>(null);

  // Saved Jobs, Saved Searches, & Email Job Alerts states
  const [activeTab, setActiveTab] = useState<JobsViewTab>('all');
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedJobSearch[]>([]);
  const [alertFrequency, setAlertFrequency] = useState<JobAlertFrequency>('none');
  const [isSavingSearch, setIsSavingSearch] = useState<boolean>(false);
  const [searchSavedToast, setSearchSavedToast] = useState<boolean>(false);

  // Quota & Paywall states
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [freeQuotaUsed, setFreeQuotaUsed] = useState<number>(user?.jobMatchFreeUsed ?? 0);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState<boolean>(false);

  // Upload & AbortControllers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const extractAbortRef = useRef<AbortController | null>(null);
  const hasCustomUploadRef = useRef<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedProfile, setUploadedProfile] = useState<CandidateProfileExtract | null>(null);

  // Sync user's initial quota when auth user loads
  useEffect(() => {
    if (typeof user?.jobMatchFreeUsed === 'number') {
      setFreeQuotaUsed(user.jobMatchFreeUsed);
    }
  }, [user?.jobMatchFreeUsed]);

  // Read optional initial URL query parameters on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('query') || params.get('q');
    const locParam = params.get('location');
    const countryParam = params.get('country');
    const remoteParam = params.get('remote');
    const seniorityParam = params.get('seniority');
    const empParam = params.get('employmentType');
    const dateParam = params.get('datePosted');

    if (qParam) setQuery(qParam);
    if (locParam !== null) setLocation(locParam);
    if (countryParam) setCountry(countryParam);
    if (remoteParam === 'true' || remoteParam === '1') setRemoteOnly(true);
    if (
      seniorityParam &&
      ['junior', 'mid', 'senior', 'lead', 'any'].includes(seniorityParam)
    ) {
      setSeniority(seniorityParam as SeniorityOption);
    }
    if (
      empParam &&
      ['any', 'full-time', 'part-time', 'contract', 'internship'].includes(empParam)
    ) {
      setEmploymentType(empParam as JobEmploymentTypeFilter);
    }
    if (dateParam && ['any', '24h', '7d', '30d'].includes(dateParam)) {
      setDatePosted(dateParam as JobDatePostedFilter);
    }
  }, []);

  // Cleanup any in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (extractAbortRef.current) {
        extractAbortRef.current.abort();
      }
    };
  }, []);

  const handleCancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSearching(false);
    setIsLoadingMore(false);
  }, []);

  const applyExtractedProfile = useCallback((profile: CandidateProfileExtract) => {
    if (profile.targetTitles && profile.targetTitles.length > 0) {
      setTargetTitles(profile.targetTitles);
      setQuery(profile.targetTitles[0]);
    }
    if (profile.location) setLocation(profile.location);
    if (profile.country) setCountry(profile.country);
    if (profile.topSkills && profile.topSkills.length > 0) setSkills(profile.topSkills);
    if (profile.seniority) setSeniority(profile.seniority);
    if (typeof profile.remotePreference === 'boolean') {
      setRemoteOnly(profile.remotePreference);
    }
  }, []);

  // Extract profile parameters from a saved resume (with AbortController deduplication)
  const extractProfileFromResume = useCallback(
    async (resumeId: string) => {
      if (!resumeId) return;
      if (extractAbortRef.current) {
        extractAbortRef.current.abort();
      }
      const controller = new AbortController();
      extractAbortRef.current = controller;

      try {
        const res = await fetch('/api/jobs/extract-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ resumeId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            applyExtractedProfile(data.profile);
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Extraction error:', err);
      } finally {
        if (extractAbortRef.current === controller) {
          extractAbortRef.current = null;
        }
      }
    },
    [applyExtractedProfile]
  );

  // 0. Prefill search parameters from User Profile (/api/profile) when logged in
  useEffect(() => {
    if (!user) return;
    let active = true;
    const hasExplicitQueryParam =
      typeof window !== 'undefined' &&
      Boolean(
        new URLSearchParams(window.location.search).get('query') ||
          new URLSearchParams(window.location.search).get('q')
      );

    fetchUserProfileClient(false, user.id).then((prof) => {
      if (!active || !prof || hasCustomUploadRef.current) return;
      const roleText = (prof.targetRole || prof.headline || '').trim();
      if (roleText && !hasExplicitQueryParam) {
        setQuery(roleText);
        setTargetTitles([roleText, `Senior ${roleText}`, `${roleText} Specialist`]);
      }
      const locParts = [prof.city, prof.country].filter((x) => typeof x === 'string' && x.trim());
      if (locParts.length > 0 && !hasExplicitQueryParam) {
        setLocation(locParts.join(', '));
        setCountry(resolveCountryCodeFromProfile(prof.country, prof.city));
      }
      if (prof.remotePreference === 'remote' && !hasExplicitQueryParam) {
        setRemoteOnly(true);
      }
      if (prof.seniority && !hasExplicitQueryParam) {
        const mappedSeniority = prof.seniority === 'student' ? 'junior' : prof.seniority;
        setSeniority(mappedSeniority);
      }
      if (Array.isArray(prof.employmentTypes) && prof.employmentTypes.length > 0 && !hasExplicitQueryParam) {
        setEmploymentType(prof.employmentTypes[0]);
      }
      if (Array.isArray(prof.skills) && prof.skills.length > 0) {
        setSkills(prof.skills);
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  // 1. Fetch user's saved resumes, saved jobs, and saved searches on mount
  useEffect(() => {
    let active = true;
    async function loadUserData() {
      try {
        setIsLoadingResumes(true);
        const [resResumes, resSavedJobs, resSavedSearches] = await Promise.all([
          fetch('/api/resumes').catch(() => null),
          fetch('/api/jobs/saved').catch(() => null),
          fetch('/api/jobs/saved-searches').catch(() => null),
        ]);
        if (!active) return;

        if (resResumes && resResumes.ok) {
          const data = await resResumes.json();
          if (active) {
            const items: SavedResumeOption[] = (data.resumes || []).map((r: any) => ({
              id: r.id || r._id,
              title: r.title || 'Untitled Resume',
              candidateName: r.candidateName,
              candidateTitle: r.candidateTitle,
            }));
            setSavedResumes(items);
            if (items.length > 0 && !hasCustomUploadRef.current) {
              setSelectedResumeId(items[0].id);
            }
          }
        }

        if (resSavedJobs && resSavedJobs.ok) {
          const data = await resSavedJobs.json();
          if (active && Array.isArray(data.savedJobs)) {
            setSavedJobs(data.savedJobs);
          }
        }

        if (resSavedSearches && resSavedSearches.ok) {
          const data = await resSavedSearches.json();
          if (active && Array.isArray(data.savedSearches)) {
            setSavedSearches(data.savedSearches);
          }
        }
      } catch (err) {
        console.error('Failed to load user job search data:', err);
      } finally {
        if (active) {
          setIsLoadingResumes(false);
        }
      }
    }

    if (user) {
      loadUserData();
    } else {
      setIsLoadingResumes(false);
    }

    return () => {
      active = false;
    };
  }, [user]);

  // Handle file upload extraction (PDF or DOCX) -> automatically enables CV Match %
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setIsUploading(true);
        setErrorMessage(null);
        hasCustomUploadRef.current = true;
        setUploadedFileName(file.name);
        setSelectedResumeId('custom_upload');
        setIncludeMatch(true);
        setSortBy('match');

        const text = await extractTextFromFile(file);
        if (!text || text.trim().length === 0) {
          setErrorMessage(t('jobs_err_extract_empty'));
          return;
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
        trackResumeUploaded({ fileType: ext, source: 'jobs' });

        const res = await fetch('/api/jobs/extract-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setUploadedProfile(data.profile);
            applyExtractedProfile(data.profile);
            setSelectedResumeId('custom_upload');
          }
        }
      } catch (err: any) {
        setErrorMessage(err?.message || t('jobs_err_process_file'));
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [applyExtractedProfile, t]
  );

  const handleSelectResume = useCallback(
    (resumeId: string) => {
      setSelectedResumeId(resumeId);
      if (!resumeId) {
        setIncludeMatch(false);
        setSortBy('relevance');
        return;
      }
      setIncludeMatch(true);
      setSortBy('match');
      if (resumeId !== 'custom_upload') {
        extractProfileFromResume(resumeId);
      } else if (uploadedProfile) {
        applyExtractedProfile(uploadedProfile);
      }
    },
    [extractProfileFromResume, uploadedProfile, applyExtractedProfile]
  );

  const handleToggleIncludeMatch = useCallback(
    (enabled: boolean) => {
      setIncludeMatch(enabled);
      if (enabled) {
        setSortBy('match');
        if (selectedResumeId && selectedResumeId !== 'custom_upload') {
          extractProfileFromResume(selectedResumeId);
        }
      } else if (sortBy === 'match' || sortBy === 'score') {
        setSortBy('relevance');
      }
    },
    [selectedResumeId, extractProfileFromResume, sortBy]
  );

  // Add / remove custom skill
  const handleAddSkill = useCallback(() => {
    const s = newSkillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s]);
      setNewSkillInput('');
    }
  }, [newSkillInput, skills]);

  const handleRemoveSkill = useCallback((skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  }, []);

  // Perform Job Search (supports both fresh search and cursor load-more)
  const runSearchRequest = useCallback(
    async (cursorToLoad: string | null = null) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;

      const isLoadMore = Boolean(cursorToLoad);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsSearching(true);
        setErrorMessage(null);
        setAllProvidersFailed(false);
        setIsQuotaExhausted(false);
        setActiveTab('all');
      }

      try {
        const res = await fetch('/api/jobs/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            query: trimmedQuery,
            location: location.trim(),
            remote: remoteOnly,
            country,
            skills,
            seniority,
            employmentType,
            datePosted,
            minSalary: minSalary > 0 ? minSalary : undefined,
            source: filterSource,
            sortBy,
            includeMatch,
            cursor: cursorToLoad,
            limit: PAGE_LIMIT,
          }),
        });

        if (controller.signal.aborted) return;

        if (res.status === 402) {
          trackFreeQuotaExhausted({
            feature: 'job_search',
            reason: 'job_match_quota_reached',
          });
          setIsQuotaExhausted(true);
          setIsUpgradeModalOpen(true);
          setFreeQuotaUsed(JOB_MATCH_FREE_QUOTA);
          return;
        }

        if (res.status === 401) {
          window.location.href = `/login?returnUrl=${encodeURIComponent('/jobs')}`;
          return;
        }

        if (res.status === 502) {
          const errData = await res.json().catch(() => ({}));
          if (controller.signal.aborted) return;
          setAllProvidersFailed(true);
          if (!isLoadMore) setJobs([]);
          if (Array.isArray(errData.smartLinks)) {
            setSmartLinks(errData.smartLinks);
          }
          if (Array.isArray(errData.providerStatus)) {
            setProviderStatus(errData.providerStatus);
          }
          setErrorMessage(t('jobs_all_providers_failed_desc'));
          setHasSearched(true);
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || t('jobs_all_providers_failed_desc'));
        }

        const data = await res.json();
        if (controller.signal.aborted) return;

        const incomingJobs: Job[] = Array.isArray(data.jobs) ? data.jobs : [];
        if (isLoadMore) {
          setJobs((prev) => {
            const seen = new Set(prev.map((j) => j.id));
            const next = [...prev];
            incomingJobs.forEach((j) => {
              if (!seen.has(j.id)) {
                seen.add(j.id);
                next.push(j);
              }
            });
            return next;
          });
        } else {
          setJobs(incomingJobs);
        }

        setTotalFound(
          typeof data.totalFound === 'number' ? data.totalFound : incomingJobs.length
        );
        setNextCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.hasMore));
        setSmartLinks(data.smartLinks || []);
        setAttributions(data.attributions || []);
        setProviderStatus(Array.isArray(data.providerStatus) ? data.providerStatus : []);
        setIsCachedResult(Boolean(data.cached));
        setHasSearched(true);

        if (!isLoadMore) {
          trackJobSearchRun({
            country,
            remoteOnly,
            seniority,
            resultsCount: incomingJobs.length,
            cached: Boolean(data.cached),
          });
        }

        if (data.quota && typeof data.quota.freeUsed === 'number') {
          setFreeQuotaUsed(data.quota.freeUsed);
        } else if (typeof data.freeRemaining === 'number') {
          setFreeQuotaUsed(Math.max(0, JOB_MATCH_FREE_QUOTA - data.freeRemaining));
        }
        if (data.charged || data.quota?.charged) {
          refreshUser();
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || controller.signal.aborted) return;
        setErrorMessage(err?.message || t('jobs_all_providers_failed_desc'));
      } finally {
        if (abortControllerRef.current === controller) {
          setIsSearching(false);
          setIsLoadingMore(false);
          abortControllerRef.current = null;
        }
      }
    },
    [
      query,
      location,
      remoteOnly,
      country,
      skills,
      seniority,
      employmentType,
      datePosted,
      minSalary,
      filterSource,
      sortBy,
      includeMatch,
      t,
      refreshUser,
    ]
  );

  const executeJobSearch = useCallback(async () => {
    await runSearchRequest(null);
  }, [runSearchRequest]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore || isSearching) return;
    await runSearchRequest(nextCursor);
  }, [nextCursor, isLoadingMore, isSearching, runSearchRequest]);

  // Automatically execute initial free search once when user is authenticated and resumes check finishes
  useEffect(() => {
    if (user && !isLoadingResumes && !hasSearched && query.trim()) {
      executeJobSearch();
    }
  }, [user, isLoadingResumes, hasSearched, query, executeJobSearch]);

  // Save / Unsave Job
  const savedJobIds = useMemo(() => {
    return new Set(savedJobs.map((item) => item.jobId));
  }, [savedJobs]);

  const handleToggleSaveJob = useCallback(
    async (job: Job) => {
      if (!user) {
        window.location.href = `/login?returnUrl=${encodeURIComponent('/jobs')}`;
        return;
      }

      const isCurrentlySaved = savedJobIds.has(job.id);
      if (isCurrentlySaved) {
        setSavedJobs((prev) => prev.filter((item) => item.jobId !== job.id));
        try {
          await fetch(`/api/jobs/saved?jobId=${encodeURIComponent(job.id)}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.error('Failed to remove saved job:', err);
        }
      } else {
        const optimisticItem: SavedJobItem = {
          id: `temp_${Date.now()}`,
          userId: user.id,
          jobId: job.id,
          job,
          savedAt: new Date().toISOString(),
        };
        setSavedJobs((prev) => [optimisticItem, ...prev]);
        try {
          const res = await fetch('/api/jobs/saved', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.savedJob) {
              setSavedJobs((prev) =>
                prev.map((item) => (item.jobId === job.id ? data.savedJob : item))
              );
            }
          }
        } catch (err) {
          console.error('Failed to save job:', err);
        }
      }
    },
    [user, savedJobIds]
  );

  // Save Current Search & Email Alert
  const handleSaveCurrentSearch = useCallback(async () => {
    if (!user) {
      window.location.href = `/login?returnUrl=${encodeURIComponent('/jobs')}`;
      return;
    }
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsSavingSearch(true);
    try {
      const res = await fetch('/api/jobs/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmedQuery,
          location: location.trim(),
          country,
          remote: remoteOnly,
          employmentType,
          datePosted,
          seniority,
          minSalary: minSalary > 0 ? minSalary : null,
          source: filterSource,
          alertFrequency,
          alertEnabled: alertFrequency !== 'none',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.savedSearch) {
          setSavedSearches((prev) => {
            const exists = prev.some((s) => s.id === data.savedSearch.id);
            if (exists) {
              return prev.map((s) => (s.id === data.savedSearch.id ? data.savedSearch : s));
            }
            return [data.savedSearch, ...prev];
          });
          setSearchSavedToast(true);
          setTimeout(() => setSearchSavedToast(false), 3500);
        }
      }
    } catch (err) {
      console.error('Failed to save search:', err);
    } finally {
      setIsSavingSearch(false);
    }
  }, [
    user,
    query,
    location,
    country,
    remoteOnly,
    employmentType,
    datePosted,
    seniority,
    minSalary,
    filterSource,
    alertFrequency,
  ]);

  const handleDeleteSavedSearch = useCallback(async (searchId: string) => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
    try {
      await fetch(`/api/jobs/saved-searches?id=${encodeURIComponent(searchId)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete saved search:', err);
    }
  }, []);

  const handleApplySavedSearch = useCallback((s: SavedJobSearch) => {
    setQuery(s.query);
    setLocation(s.location || '');
    if (s.country) setCountry(s.country);
    setRemoteOnly(Boolean(s.remote));
    if (s.employmentType) setEmploymentType(s.employmentType);
    if (s.datePosted) setDatePosted(s.datePosted);
    if (s.seniority) setSeniority(s.seniority);
    setMinSalary(s.minSalary || 0);
    if (s.source) setFilterSource(s.source);
    setAlertFrequency(s.alertFrequency || 'none');
    setActiveTab('all');
  }, []);

  // Outbound Apply Click Tracking
  const handleRecordJobClick = useCallback((job: Job) => {
    try {
      fetch('/api/jobs/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          jobId: job.id,
          title: job.title,
          company: job.company,
          source: job.source,
          url: job.url,
        }),
      }).catch(() => {});
    } catch {
      // Non-blocking analytics click log
    }
  }, []);

  const hasPartialProviderFailure = useMemo(() => {
    return !allProvidersFailed && providerStatus.some((p) => p.status === 'failed');
  }, [allProvidersFailed, providerStatus]);

  const availableSources = useMemo(() => {
    const s = new Set<string>(['Remotive', 'Arbeitnow', 'RemoteOK', 'The Muse']);
    jobs.forEach((j) => {
      if (j.source) s.add(j.source);
    });
    return Array.from(s);
  }, [jobs]);

  const displayJobs = useMemo(() => {
    return filterAndSortJobs(jobs, {
      query,
      location,
      remote: filterRemote || remoteOnly,
      employmentType,
      datePosted,
      minSalary: minSalary > 0 ? minSalary : undefined,
      source: filterSource,
      minScore: includeMatch ? filterMinScore : 0,
      sortBy,
    });
  }, [
    jobs,
    query,
    location,
    filterRemote,
    remoteOnly,
    employmentType,
    datePosted,
    minSalary,
    filterSource,
    includeMatch,
    filterMinScore,
    sortBy,
  ]);

  const resetFilters = useCallback(() => {
    setFilterRemote(false);
    setFilterMinScore(0);
    setFilterSource('all');
    setEmploymentType('any');
    setDatePosted('any');
    setMinSalary(0);
    setRemoteOnly(false);
  }, []);

  const isProUser = user?.plan === 'pro' || user?.plan === 'enterprise';

  return {
    // Resumes & upload
    savedResumes,
    selectedResumeId,
    isLoadingResumes,
    fileInputRef,
    isUploading,
    uploadedFileName,
    handleFileUpload,
    handleSelectResume,
    includeMatch,
    handleToggleIncludeMatch,

    // Search parameters
    query,
    setQuery,
    location,
    setLocation,
    country,
    setCountry,
    remoteOnly,
    setRemoteOnly,
    seniority,
    setSeniority,
    employmentType,
    setEmploymentType,
    datePosted,
    setDatePosted,
    minSalary,
    setMinSalary,
    targetTitles,
    skills,
    newSkillInput,
    setNewSkillInput,
    handleAddSkill,
    handleRemoveSkill,

    // Search execution, pagination & results
    isSearching,
    isLoadingMore,
    hasSearched,
    jobs,
    displayJobs,
    totalFound,
    nextCursor,
    hasMore,
    handleLoadMore,
    smartLinks,
    attributions,
    providerStatus,
    allProvidersFailed,
    hasPartialProviderFailure,
    errorMessage,
    isCachedResult,
    executeJobSearch,
    handleCancelSearch,

    // Filters, sorting & drawer
    filterRemote,
    setFilterRemote,
    filterMinScore,
    setFilterMinScore,
    filterSource,
    setFilterSource,
    availableSources,
    sortBy,
    setSortBy,
    resetFilters,
    expandedJobId,
    setExpandedJobId,
    selectedDrawerJob,
    setSelectedDrawerJob,

    // Saved jobs, saved searches & alerts, click tracking
    activeTab,
    setActiveTab,
    savedJobs,
    savedJobIds,
    handleToggleSaveJob,
    savedSearches,
    alertFrequency,
    setAlertFrequency,
    isSavingSearch,
    searchSavedToast,
    handleSaveCurrentSearch,
    handleDeleteSavedSearch,
    handleApplySavedSearch,
    handleRecordJobClick,

    // Quota & paywall
    isProUser,
    freeQuotaUsed,
    isQuotaExhausted,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
  };
}
