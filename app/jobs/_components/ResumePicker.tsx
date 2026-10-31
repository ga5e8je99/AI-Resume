'use client';

import React from 'react';
import { ChevronDown, Upload } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { SavedResumeOption } from './useJobSearch';

interface ResumePickerProps {
  savedResumes: SavedResumeOption[];
  selectedResumeId: string;
  uploadedFileName: string | null;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectResume: (resumeId: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ResumePicker({
  savedResumes,
  selectedResumeId,
  uploadedFileName,
  isUploading,
  fileInputRef,
  onSelectResume,
  onFileUpload,
}: ResumePickerProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2.5">
      {(savedResumes.length > 0 || uploadedFileName || selectedResumeId === 'custom_upload') && (
        <div className="relative">
          <select
            aria-label={t('jobs_select_resume_aria')}
            value={selectedResumeId}
            onChange={(e) => onSelectResume(e.target.value)}
            className="h-9 appearance-none text-xs rounded-lg border border-line-strong bg-paper px-3 pe-8 text-ink focus:outline-none focus:ring-1 focus:ring-accent font-sans"
          >
            {savedResumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
            {(uploadedFileName || selectedResumeId === 'custom_upload') && (
              <option value="custom_upload">
                {uploadedFileName || t('jobs_custom_uploaded_file')}
              </option>
            )}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-ink-2 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileUpload}
        accept=".pdf,.docx,.txt"
        className="hidden"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        loading={isUploading}
        leftIcon={<Upload className="w-3.5 h-3.5" />}
        className="text-xs border-line-strong"
      >
        <span>{t('jobs_upload_resume_btn')}</span>
      </Button>
    </div>
  );
}

