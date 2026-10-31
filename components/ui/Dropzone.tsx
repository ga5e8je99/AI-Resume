'use client';

import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';

export type DropzoneState = 'idle' | 'drag-over' | 'parsing' | 'success' | 'error';

export interface DropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeBytes?: number;
  state?: DropzoneState;
  errorMessage?: string;
  fileName?: string;
  onReset?: () => void;
  className?: string;
  isArabic?: boolean;
}

export function Dropzone({
  onFileSelect,
  accept = '.pdf,.docx,.txt',
  maxSizeBytes = 5 * 1024 * 1024,
  state: controlledState,
  errorMessage: controlledError,
  fileName,
  onReset,
  className = '',
  isArabic = false,
}: DropzoneProps) {
  const [internalState, setInternalState] = useState<DropzoneState>('idle');
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const state = controlledState || internalState;
  const error = controlledError || internalError;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (state !== 'parsing') {
      setInternalState('drag-over');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (state === 'drag-over') {
      setInternalState('idle');
    }
  };

  const validateAndHandle = (file: File) => {
    setInternalError(null);

    if (file.size === 0) {
      setInternalState('error');
      setInternalError(
        isArabic
          ? 'الملف فارغ (0 بايت). يرجى رفع ملف سيرة ذاتية يحتوي على نصوص.'
          : 'File is empty (0 bytes). Please upload a valid resume with selectable text.'
      );
      return;
    }

    if (file.size > maxSizeBytes) {
      setInternalState('error');
      setInternalError(
        isArabic
          ? 'حجم الملف يتجاوز الحد الأقصى المسموح به (5 ميجابايت).'
          : 'File size exceeds maximum permitted limit (5MB).'
      );
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext || '')) {
      setInternalState('error');
      setInternalError(
        isArabic
          ? 'نوع الملف غير مدعوم. يرجى اختيار ملف PDF أو DOCX أو TXT.'
          : 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.'
      );
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setInternalState('idle');
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndHandle(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndHandle(files[0]);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (state !== 'parsing' && inputRef.current) {
            inputRef.current.click();
          }
        }}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed rounded-lg transition-all duration-150 cursor-pointer text-center select-none ${
          state === 'drag-over'
            ? 'border-brand bg-brand-soft/30'
            : state === 'error'
            ? 'border-danger/60 bg-danger-soft/40'
            : state === 'success'
            ? 'border-success/60 bg-success-soft/40'
            : '-line-strong -line-strong bg-surface'
        }`}
      >
        <input
          ref={inputRef}
          id="resume-file-upload"
          type="file"
          accept={accept}
          suppressHydrationWarning
          aria-label={isArabic ? 'رفع ملف السيرة الذاتية (PDF أو Word أو TXT)' : 'Upload resume file (PDF, Word, or TXT)'}
          onChange={handleChange}
          className="sr-only"
        />

        {state === 'parsing' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
            <div>
              <p className="font-serif text-base font-semibold -ink">
                {isArabic ? 'جارٍ فحص المستند محلياً...' : 'Analyzing document in browser...'}
              </p>
              <p className="text-xs -ink-2 mt-1">
                {fileName || (isArabic ? 'استخراج النصوص وفحص البنية' : 'Extracting text and verifying structure')}
              </p>
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-success" />
            <p className="font-serif text-base font-semibold -ink">
              {isArabic ? 'تم فحص المستند بنجاح' : 'Document analyzed successfully'}
            </p>
            <p className="text-xs -ink-2 font-mono">{fileName}</p>
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
              >
                {isArabic ? 'فحص ملف آخر' : 'Scan another document'}
              </Button>
            )}
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-danger" />
            <p className="font-serif text-base font-semibold text-danger">
              {isArabic ? 'تعذر فحص المستند' : 'Unable to parse document'}
            </p>
            <p className="text-xs -ink-2 max-w-md">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                if (inputRef.current) inputRef.current.click();
              }}
            >
              {isArabic ? 'إعادة المحاولة' : 'Choose another file'}
            </Button>
          </div>
        )}

        {(state === 'idle' || state === 'drag-over') && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-surface-2 border -line-strong flex items-center justify-center -ink-2">
              <Upload className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="font-serif text-base sm:text-lg font-semibold -ink">
                {isArabic
                  ? 'اسحب سيرتك الذاتية هنا أو اضغط للاختيار'
                  : 'Drop your resume here, or choose a file'}
              </p>
              <p className="text-xs -ink-2 mt-1">
                {isArabic
                  ? 'يدعم ملفات PDF و DOCX و TXT حتى 5 ميجابايت • المعالجة فورية وتتم في متصفحك'
                  : 'Supports PDF, DOCX, and TXT up to 5MB • Processed in your browser'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
