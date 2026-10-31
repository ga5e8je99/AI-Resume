'use client';

import React from 'react';
import {
  Sliders,
  MapPin,
  Globe,
  ChevronDown,
  X,
  Search,
  Compass,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { SmartLinkPlatform } from '@/lib/jobs/types';
import ResumePicker from './ResumePicker';
import { SavedResumeOption, SeniorityOption } from './useJobSearch';

interface JobSearchBarProps {
  // Resume picker props
  savedResumes: SavedResumeOption[];
  selectedResumeId: string;
  uploadedFileName: string | null;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectResume: (resumeId: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Search parameter props
  query: string;
  onQueryChange: (val: string) => void;
  location: string;
  onLocationChange: (val: string) => void;
  country: string;
  onCountryChange: (val: string) => void;
  remoteOnly: boolean;
  onRemoteOnlyChange: (val: boolean) => void;
  seniority: SeniorityOption;
  onSeniorityChange: (val: SeniorityOption) => void;
  targetTitles: string[];
  skills: string[];
  newSkillInput: string;
  onNewSkillInputChange: (val: string) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skill: string) => void;

  // Search action & smart links
  isSearching: boolean;
  onSearch: () => void;
  smartLinks: SmartLinkPlatform[];
}

export default function JobSearchBar({
  savedResumes,
  selectedResumeId,
  uploadedFileName,
  isUploading,
  fileInputRef,
  onSelectResume,
  onFileUpload,
  query,
  onQueryChange,
  location,
  onLocationChange,
  country,
  onCountryChange,
  remoteOnly,
  onRemoteOnlyChange,
  seniority,
  onSeniorityChange,
  targetTitles,
  skills,
  newSkillInput,
  onNewSkillInputChange,
  onAddSkill,
  onRemoveSkill,
  isSearching,
  onSearch,
  smartLinks,
}: JobSearchBarProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="rounded-xl border border-line-strong bg-surface p-5 sm:p-6 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line-strong">
          <div>
            <h2 className="text-base font-serif font-semibold text-ink flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent" />
              <span>{t('jobs_params_title')}</span>
            </h2>
            <p className="text-xs text-ink-2 mt-0.5">{t('jobs_params_desc')}</p>
          </div>

          <ResumePicker
            savedResumes={savedResumes}
            selectedResumeId={selectedResumeId}
            uploadedFileName={uploadedFileName}
            isUploading={isUploading}
            fileInputRef={fileInputRef}
            onSelectResume={onSelectResume}
            onFileUpload={onFileUpload}
          />
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Target Title */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-semibold text-ink-2 flex items-center justify-between">
              <span>{t('jobs_target_title_label')}</span>
              <span className="text-[10px] text-ink-2 font-mono">
                {t('jobs_top_3_extracted')}
              </span>
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={t('jobs_target_title_placeholder')}
              className="w-full h-9 rounded-lg border border-line-strong bg-paper px-3 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            />

            {/* Top 3 Quick Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {targetTitles.map((tTitle, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onQueryChange(tTitle)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                    query === tTitle
                      ? 'bg-accent text-on-accent border-accent font-semibold'
                      : 'bg-surface-2 text-ink-2 border-line-strong hover:border-accent/40'
                  }`}
                >
                  {tTitle}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-2">
              {t('jobs_location_label')}
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-ink-2 absolute start-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                placeholder={t('jobs_location_placeholder')}
                className="w-full h-9 rounded-lg border border-line-strong bg-paper ps-8 pe-3 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* 3. Country / Region Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-2">
              {t('jobs_country_label')}
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-ink-2 absolute start-2.5 top-1/2 -translate-y-1/2" />
              <select
                aria-label={t('jobs_country_aria')}
                value={country}
                onChange={(e) => onCountryChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-line-strong bg-paper ps-8 pe-8 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent appearance-none"
              >
                <option value="eg">{t('jobs_country_eg')}</option>
                <option value="sa">{t('jobs_country_sa')}</option>
                <option value="ae">{t('jobs_country_ae')}</option>
                <option value="us">{t('jobs_country_us')}</option>
                <option value="gb">{t('jobs_country_gb')}</option>
                <option value="de">{t('jobs_country_de')}</option>
                <option value="global">{t('jobs_country_global')}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-ink-2 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 2: Seniority, Remote Toggle, & Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start pt-2">
          {/* Seniority */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-2">
              {t('jobs_seniority_label')}
            </label>
            <div className="relative">
              <select
                aria-label={t('jobs_seniority_aria')}
                value={seniority}
                onChange={(e) => onSeniorityChange(e.target.value as SeniorityOption)}
                className="w-full h-9 rounded-lg border border-line-strong bg-paper px-3 pe-8 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent appearance-none"
              >
                <option value="any">{t('jobs_seniority_any')}</option>
                <option value="junior">{t('jobs_seniority_junior')}</option>
                <option value="mid">{t('jobs_seniority_mid')}</option>
                <option value="senior">{t('jobs_seniority_senior')}</option>
                <option value="lead">{t('jobs_seniority_lead')}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-ink-2 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Remote Only Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-2">
              {t('jobs_work_arrangement_label')}
            </label>
            <label className="h-9 px-3 rounded-lg border border-line-strong bg-paper flex items-center justify-between cursor-pointer hover:border-accent/40 transition-colors">
              <span className="text-xs text-ink flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-accent" />
                <span>{t('jobs_remote_only_label')}</span>
              </span>
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => onRemoteOnlyChange(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent"
              />
            </label>
          </div>

          {/* Top Skills Tags */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-semibold text-ink-2 flex items-center justify-between">
              <span>{t('jobs_skills_label')}</span>
              <span className="text-[10px] text-ink-2">
                {t('jobs_skills_count').replace('{count}', String(skills.length))}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => onNewSkillInputChange(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), onAddSkill())
                }
                placeholder={t('jobs_skill_input_placeholder')}
                className="w-full h-9 rounded-lg border border-line-strong bg-paper px-3 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={onAddSkill}
                className="shrink-0 h-9 px-3 text-xs border-line-strong"
              >
                {t('jobs_add_skill_btn')}
              </Button>
            </div>

            {/* Skills badges */}
            <div className="flex flex-wrap gap-1.5 pt-1 max-h-20 overflow-y-auto">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-2 text-ink-2 border border-line-strong"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSkill(skill)}
                    className="text-ink-2 hover:text-warning focus:outline-none"
                    aria-label={`${t('jobs_remove_skill_aria')} ${skill}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Transparent Query Bar */}
        <div className="rounded-lg bg-surface-2 border border-line-strong p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-mono max-w-full overflow-hidden min-w-0">
          <div className="flex items-center gap-2 text-ink-2 overflow-hidden min-w-0 w-full">
            <Search className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="shrink-0 text-ink-2">{t('jobs_generated_query_label')}</span>
            <span className="text-accent truncate min-w-0">
              &ldquo;{query}&rdquo; {location ? `in ${location}` : ''}{' '}
              {remoteOnly ? '(remote:true)' : ''}
            </span>
          </div>

          <Button
            size="md"
            variant="primary"
            onClick={onSearch}
            loading={isSearching}
            loadingText={t('common_loading')}
            startIcon={<Search className="w-4 h-4" />}
            className="w-full sm:w-auto shrink-0 font-sans"
          >
            <span>{t('jobs_find_matching_btn')}</span>
          </Button>
        </div>
      </div>

      {/* Platforms Panel (10 Smart Search Deep-Link Buttons) */}
      {smartLinks.length > 0 && (
        <div className="rounded-xl border border-line-strong bg-surface p-5 sm:p-6 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-serif font-semibold text-ink flex items-center gap-2">
                <Compass className="w-4 h-4 text-accent" />
                <span>{t('jobs_platforms_title')}</span>
              </h3>
              <p className="text-xs text-ink-2 mt-0.5">{t('jobs_platforms_desc')}</p>
            </div>

            <span className="text-[11px] font-mono text-ink-2 shrink-0">
              {t('jobs_platforms_covered')}
            </span>
          </div>

          {/* Grid of 10 Smart Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {smartLinks.map((platform) => {
              const isMena =
                platform.region.includes('Egypt') ||
                platform.region.includes('MENA') ||
                platform.region.includes('Gulf');
              return (
                <a
                  key={platform.id}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-line-strong bg-paper p-3 hover:border-accent/50 hover:bg-surface-2 transition-all flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-xs text-ink group-hover:text-accent transition-colors truncate">
                      {platform.name}
                    </span>
                    <ExternalLink className="w-3 h-3 text-ink-2 group-hover:text-accent transition-colors shrink-0" />
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-medium ${
                        isMena
                          ? 'bg-surface-2 text-accent border border-line-strong'
                          : 'bg-surface-2 text-ink-2'
                      }`}
                    >
                      {platform.region}
                    </span>
                    <span className="text-[10px] font-mono text-ink-2">
                      #{platform.priority}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
