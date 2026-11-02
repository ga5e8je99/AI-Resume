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
import JobDetailsDrawer from './_components/JobDetailsDrawer';
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
    includeMatch,
    handleToggleIncludeMatch,
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
    isSearching,
    isLoadingMore,
    displayJobs,
    totalFound,
    hasMore,
    handleLoadMore,
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
    selectedDrawerJob,
    setSelectedDrawerJob,
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

        {/* Search Parameters Card + Optional CV Match + 10 Smart Links Panel */}
        <JobSearchBar
          savedResumes={savedResumes}
          selectedResumeId={selectedResumeId}
          uploadedFileName={uploadedFileName}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
          onSelectResume={handleSelectResume}
          onFileUpload={handleFileUpload}
          includeMatch={includeMatch}
          onToggleIncludeMatch={handleToggleIncludeMatch}
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
          employmentType={employmentType}
          onEmploymentTypeChange={setEmploymentType}
          datePosted={datePosted}
          onDatePostedChange={setDatePosted}
          minSalary={minSalary}
          onMinSalaryChange={setMinSalary}
          filterSource={filterSource}
          onFilterSourceChange={setFilterSource}
          availableSources={availableSources}
          targetTitles={targetTitles}
          skills={skills}
          newSkillInput={newSkillInput}
          onNewSkillInputChange={setNewSkillInput}
          onAddSkill={handleAddSkill}
          onRemoveSkill={handleRemoveSkill}
          alertFrequency={alertFrequency}
          onAlertFrequencyChange={setAlertFrequency}
          isSavingSearch={isSavingSearch}
          searchSavedToast={searchSavedToast}
          onSaveSearch={handleSaveCurrentSearch}
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

        {/* Matched Jobs Results, Saved Jobs, Saved Searches & Filters */}
        <div className="space-y-4">
          <JobFilters
            totalDisplayed={displayJobs.length}
            isCachedResult={isCachedResult}
            includeMatch={includeMatch}
            activeTab={activeTab}
            onChangeActiveTab={setActiveTab}
            savedJobsCount={savedJobs.length}
            savedSearchesCount={savedSearches.length}
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
            isLoadingMore={isLoadingMore}
            displayJobs={displayJobs}
            totalFound={totalFound}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
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
            activeTab={activeTab}
            savedJobs={savedJobs}
            savedJobIds={savedJobIds}
            onToggleSaveJob={handleToggleSaveJob}
            savedSearches={savedSearches}
            onApplySavedSearch={handleApplySavedSearch}
            onDeleteSavedSearch={handleDeleteSavedSearch}
            onOpenDrawer={setSelectedDrawerJob}
            onApplyClick={handleRecordJobClick}
          />
        </div>
      </main>

      {/* Side Drawer for Full Job Details */}
      <JobDetailsDrawer
        job={selectedDrawerJob}
        onClose={() => setSelectedDrawerJob(null)}
        isSaved={Boolean(selectedDrawerJob && savedJobIds.has(selectedDrawerJob.id))}
        onToggleSave={handleToggleSaveJob}
        onApplyClick={handleRecordJobClick}
      />

      {/* Upgrade Paywall Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
