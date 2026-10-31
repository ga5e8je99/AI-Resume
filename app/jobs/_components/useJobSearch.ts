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
} from '@/lib/jobs/types';
import { JOB_MATCH_FREE_QUOTA } from '@/lib/plans';

export interface SavedResumeOption {
  id: string;
  title: string;
  candidateName?: string;
  candidateTitle?: string;
}

export type SeniorityOption = 'junior' | 'mid' | 'senior' | 'lead' | 'any';
export type SortByOption = 'score' | 'date';

export function useJobSearch() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();

  // Resumes list & selected resume
  const [savedResumes, setSavedResumes] = useState<SavedResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [isLoadingResumes, setIsLoadingResumes] = useState<boolean>(true);

  // Search parameters
  const [query, setQuery] = useState<string>('Software Engineer');
  const [location, setLocation] = useState<string>('Cairo, Egypt');
  const [country, setCountry] = useState<string>('eg');
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [seniority, setSeniority] = useState<SeniorityOption>('mid');
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

  // Results state
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [smartLinks, setSmartLinks] = useState<SmartLinkPlatform[]>([]);
  const [attributions, setAttributions] = useState<JobProviderAttribution[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderStatusEntry[]>([]);
  const [allProvidersFailed, setAllProvidersFailed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCachedResult, setIsCachedResult] = useState<boolean>(false);

  // Filter & Sort states
  const [filterRemote, setFilterRemote] = useState<boolean>(false);
  const [filterMinScore, setFilterMinScore] = useState<number>(0);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortByOption>('score');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

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

    if (qParam) setQuery(qParam);
    if (locParam) setLocation(locParam);
    if (countryParam) setCountry(countryParam);
    if (remoteParam === 'true' || remoteParam === '1') setRemoteOnly(true);
    if (
      seniorityParam &&
      ['junior', 'mid', 'senior', 'lead', 'any'].includes(seniorityParam)
    ) {
      setSeniority(seniorityParam as SeniorityOption);
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

  // 1. Fetch user's saved resumes on mount / user change
  useEffect(() => {
    let active = true;
    async function loadResumes() {
      try {
        setIsLoadingResumes(true);
        const res = await fetch('/api/resumes');
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (!active) return;
          const items: SavedResumeOption[] = (data.resumes || []).map((r: any) => ({
            id: r.id || r._id,
            title: r.title || 'Untitled Resume',
            candidateName: r.candidateName,
            candidateTitle: r.candidateTitle,
          }));
          setSavedResumes(items);

          if (items.length > 0 && !hasCustomUploadRef.current) {
            setSelectedResumeId(items[0].id);
            extractProfileFromResume(items[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load user resumes:', err);
      } finally {
        if (active) {
          setIsLoadingResumes(false);
        }
      }
    }

    if (user) {
      loadResumes();
    } else {
      setIsLoadingResumes(false);
    }

    return () => {
      active = false;
    };
  }, [user, extractProfileFromResume]);

  // Handle file upload extraction (PDF or DOCX)
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

        const text = await extractTextFromFile(file);
        if (!text || text.trim().length === 0) {
          setErrorMessage(t('jobs_err_extract_empty'));
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
      if (resumeId !== 'custom_upload') {
        extractProfileFromResume(resumeId);
      } else if (uploadedProfile) {
        applyExtractedProfile(uploadedProfile);
      }
    },
    [extractProfileFromResume, uploadedProfile, applyExtractedProfile]
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

  // Perform Job Match Search (cancels any previous in-flight request via AbortController)
  const executeJobSearch = useCallback(async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setErrorMessage(null);
    setAllProvidersFailed(false);
    setIsQuotaExhausted(false);

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
        }),
      });

      if (controller.signal.aborted) return;

      if (res.status === 402) {
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
        setJobs([]);
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

      setJobs(data.jobs || []);
      setSmartLinks(data.smartLinks || []);
      setAttributions(data.attributions || []);
      setProviderStatus(Array.isArray(data.providerStatus) ? data.providerStatus : []);
      setIsCachedResult(Boolean(data.cached));
      setHasSearched(true);

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
        abortControllerRef.current = null;
      }
    }
  }, [query, location, remoteOnly, country, skills, seniority, t, refreshUser]);

  // Automatically execute first search once when saved resumes finish loading
  useEffect(() => {
    if (savedResumes.length > 0 && !hasSearched && query.trim()) {
      executeJobSearch();
    }
  }, [savedResumes.length, hasSearched, query, executeJobSearch]);

  const hasPartialProviderFailure = useMemo(() => {
    return !allProvidersFailed && providerStatus.some((p) => p.status === 'failed');
  }, [allProvidersFailed, providerStatus]);

  const availableSources = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach((j) => {
      if (j.source) s.add(j.source);
    });
    return Array.from(s);
  }, [jobs]);

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

  const resetFilters = useCallback(() => {
    setFilterRemote(false);
    setFilterMinScore(0);
    setFilterSource('all');
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
    targetTitles,
    skills,
    newSkillInput,
    setNewSkillInput,
    handleAddSkill,
    handleRemoveSkill,

    // Search execution & results
    isSearching,
    hasSearched,
    jobs,
    displayJobs,
    smartLinks,
    attributions,
    providerStatus,
    allProvidersFailed,
    hasPartialProviderFailure,
    errorMessage,
    isCachedResult,
    executeJobSearch,
    handleCancelSearch,

    // Filters & sorting
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

    // Quota & paywall
    isProUser,
    freeQuotaUsed,
    isQuotaExhausted,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
  };
}

