'use client';

import React from 'react';
import Footer from '@/app/components/Footer';
import UpgradeModal from '@/app/components/UpgradeModal';
import { useLanguage } from '@/app/context/LanguageContext';
import QuotaBanner from './_components/QuotaBanner';
import JobSearchBar from './_components/JobSearchBar';
import ProviderStatusBanner from './_components/ProviderStatusBanner';
import JobFilters from './_components/JobFilters';
import JobResultsList from './_components/JobResultsList';
import { useJobSearch } from './_components/useJobSearch';

export default function JobMatchPage() {
  const { isRtl } = useLanguage();
  const {
    savedResumes,
    selectedResumeId,
    fileInputRef,
    isUploading,
    uploadedFileName,
    handleFileUpload,
    handleSelectResume,
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
    isSearching,
    displayJobs,
    smartLinks,
    attributions,
    allProvidersFailed,
    hasPartialProviderFailure,
    errorMessage,
    isCachedResult,
    executeJobSearch,
    handleCancelSearch,
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
    isProUser,
    freeQuotaUsed,
    isQuotaExhausted,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
  } = useJobSearch();

  return (
    <div
      className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between selection:bg-surface-2 selection:text-ink overflow-x-clip"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <main
        id="main-content"
        className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-8"
      >
        {/* Top Header & Quota Status / Paywall Banner */}
        <QuotaBanner
          isProUser={isProUser}
          freeQuotaUsed={freeQuotaUsed}
          isQuotaExhausted={isQuotaExhausted}
        />

        {/* Search Parameters Card + ResumePicker + 10 Smart Links Panel */}
        <JobSearchBar
          savedResumes={savedResumes}
          selectedResumeId={selectedResumeId}
          uploadedFileName={uploadedFileName}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
          onSelectResume={handleSelectResume}
          onFileUpload={handleFileUpload}
          query={query}
          onQueryChange={setQuery}
          location={location}
          onLocationChange={setLocation}
          country={country}
          onCountryChange={setCountry}
          remoteOnly={remoteOnly}
          onRemoteOnlyChange={setRemoteOnly}
          seniority={seniority}
          onSeniorityChange={setSeniority}
          targetTitles={targetTitles}
          skills={skills}
          newSkillInput={newSkillInput}
          onNewSkillInputChange={setNewSkillInput}
          onAddSkill={handleAddSkill}
          onRemoveSkill={handleRemoveSkill}
          isSearching={isSearching}
          onSearch={executeJobSearch}
          smartLinks={smartLinks}
        />

        {/* Partial Provider Failure Subtle Banner */}
        <ProviderStatusBanner
          visible={hasPartialProviderFailure}
          onRetry={executeJobSearch}
          isSearching={isSearching}
        />

        {/* Matched Jobs Results & Filters */}
        <div className="space-y-4">
          <JobFilters
            totalDisplayed={displayJobs.length}
            isCachedResult={isCachedResult}
            filterRemote={filterRemote}
            onToggleFilterRemote={() => setFilterRemote((prev) => !prev)}
            filterMinScore={filterMinScore}
            onChangeFilterMinScore={setFilterMinScore}
            filterSource={filterSource}
            onChangeFilterSource={setFilterSource}
            availableSources={availableSources}
            sortBy={sortBy}
            onChangeSortBy={setSortBy}
          />

          <JobResultsList
            isSearching={isSearching}
            displayJobs={displayJobs}
            expandedJobId={expandedJobId}
            onToggleExpandJob={(jobId) =>
              setExpandedJobId((prev) => (prev === jobId ? null : jobId))
            }
            onCancelSearch={handleCancelSearch}
            allProvidersFailed={allProvidersFailed}
            errorMessage={errorMessage}
            onRetrySearch={executeJobSearch}
            onResetFilters={resetFilters}
            attributions={attributions}
          />
        </div>
      </main>

      {/* Upgrade Paywall Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
