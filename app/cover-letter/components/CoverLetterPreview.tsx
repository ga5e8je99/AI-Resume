'use client';

import React, { useState } from 'react';
import { CoverLetterData } from '../types';
import {
  Edit3,
  Copy,
  Check,
  Printer,
  Save,
  Sparkles,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { CoverLetterService } from '@/app/lib/coverLetterService';

interface CoverLetterPreviewProps {
  coverLetter: CoverLetterData;
  onUpdate: (updated: CoverLetterData) => void;
  onSaveDraft: () => Promise<void>;
  isSaving: boolean;
  isDirty?: boolean;
  onResetRequest?: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function CoverLetterPreview({
  coverLetter,
  onUpdate,
  onSaveDraft,
  isSaving,
  isDirty = false,
  onResetRequest,
  showToast,
}: CoverLetterPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const isAr = coverLetter.language === 'ar';

  const handleCopy = async () => {
    if (isCopied) return;
    try {
      const cleaned = CoverLetterService.cleanDisplayText(coverLetter.content.fullText);
      await navigator.clipboard.writeText(cleaned);
      setIsCopied(true);
      showToast(isAr ? 'تم نسخ الخطاب بنجاح إلى الحافظة' : 'Cover letter copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast(isAr ? 'تعذر النسخ التلقائي' : 'Failed to copy', 'error');
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Clean and normalize text upon leaving edit mode
      onUpdate({
        ...coverLetter,
        content: {
          ...coverLetter.content,
          fullText: CoverLetterService.cleanDisplayText(coverLetter.content.fullText),
        },
      });
    }
    setIsEditing(!isEditing);
  };

  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);
    showToast(isAr ? 'جاري تجهيز الخطاب للطباعة / تصدير PDF...' : 'Preparing for print / PDF export...');
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 400);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      ...coverLetter,
      content: {
        ...coverLetter.content,
        fullText: e.target.value,
      },
    });
  };

  const templateId = coverLetter.templateId || 'compact';
  const { wordCount, charCount } = React.useMemo(() => {
    const text = coverLetter.content?.fullText || '';
    return {
      wordCount: text.trim().split(/\s+/).filter(Boolean).length,
      charCount: text.length,
    };
  }, [coverLetter.content?.fullText]);

  return (
    <div className="space-y-4">
      {/* Actions Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-lg">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {isAr ? 'العربية' : 'English'}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
            {coverLetter.tone}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            {templateId}
          </span>

          {/* Unsaved Changes Indicator */}
          {isDirty ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-pulse flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>{isAr ? 'تعديلات غير محفوظة' : 'Unsaved changes'}</span>
            </span>
          ) : coverLetter.id ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>{isAr ? 'محفوظ بالمسودات' : 'Saved to drafts'}</span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Reset / New Letter */}
          {onResetRequest && (
            <button
              type="button"
              onClick={onResetRequest}
              disabled={isSaving}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title={isAr ? 'البدء من جديد' : 'New letter'}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{isAr ? 'جديد' : 'New'}</span>
            </button>
          )}

          {/* Live Edit Toggle */}
          <button
            type="button"
            onClick={handleToggleEdit}
            disabled={isSaving}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isEditing
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? (isAr ? 'إنهاء التعديل' : 'Done') : (isAr ? 'تعديل النص' : 'Edit')}</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={isCopied}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
            title="نسخ النص كاملاً"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">{isAr ? 'تم النسخ' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'نسخ' : 'Copy'}</span>
              </>
            )}
          </button>

          {/* Print / Export PDF */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="طباعة أو تصدير PDF مباشر"
          >
            {isPrinting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="hidden sm:inline">{isAr ? 'تصدير PDF' : 'Export PDF'}</span>
          </button>

          {/* Save Draft Button */}
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isDirty
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                : 'bg-emerald-600/80 hover:bg-emerald-600 text-white shadow-emerald-600/20'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>
              {isSaving
                ? isAr
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : isDirty
                ? isAr
                  ? 'حفظ التعديلات'
                  : 'Save Changes'
                : coverLetter.id
                ? isAr
                  ? 'تحديث المسودة'
                  : 'Update Draft'
                : isAr
                ? 'حفظ كمسودة'
                : 'Save Draft'}
            </span>
          </button>
        </div>
      </div>

      {/* Editing Mode Banner */}
      {isEditing && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Edit3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {isAr
                ? 'وضع التعديل النشط: يمكنك تعديل وحذف أي فقرة بحرية وسيعتمد الخطاب المعدل عند الحفظ أو التصدير.'
                : 'Live Edit Mode: Edit any text freely. Changes are reflected instantly on save and PDF export.'}
            </span>
          </div>
          <span className="text-[11px] text-amber-300 font-mono shrink-0">
            {wordCount} {isAr ? 'كلمة' : 'words'} • {charCount} {isAr ? 'حرف' : 'chars'}
          </span>
        </div>
      )}

      {/* Extracted Keywords Chips */}
      {coverLetter.extractedKeywords && coverLetter.extractedKeywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold ml-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{isAr ? 'الكلمات المفتاحية المدمجة (ATS Keywords):' : 'Embedded ATS Keywords:'}</span>
          </span>
          {coverLetter.extractedKeywords.map((kw, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-medium"
            >
              ✓ {kw}
            </span>
          ))}
        </div>
      )}

      {/* A4 Sheet Preview Container matching Resume template style */}
      <div
        id="cover-letter-sheet"
        dir={isAr ? 'rtl' : 'ltr'}
        className={`bg-white text-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl border min-h-[700px] relative transition-all ${
          templateId === 'modern'
            ? 'border-t-8 border-t-indigo-600 font-sans'
            : templateId === 'ats-friendly'
            ? 'border-t-8 border-t-blue-600 font-sans'
            : templateId === 'classic'
            ? 'border-t-8 border-t-emerald-700 font-serif'
            : 'border-t-8 border-t-amber-500 font-sans'
        }`}
      >
        {isEditing ? (
          <textarea
            rows={22}
            value={coverLetter.content.fullText}
            onChange={handleTextChange}
            aria-label={isAr ? 'نص خطاب التقديم القابل للتعديل' : 'Editable cover letter text'}
            className="w-full h-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm leading-relaxed focus:outline-none focus:border-amber-500 font-sans resize-none"
          />
        ) : (
          <div className="space-y-6 text-sm sm:text-base leading-relaxed whitespace-pre-line text-slate-800">
            {/* Letter Header matching selected resume template */}
            <div className="border-b border-slate-200 pb-4 mb-4 flex justify-between items-baseline">
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    className={`text-xl sm:text-2xl font-bold tracking-tight ${
                      templateId === 'modern'
                        ? 'text-indigo-900'
                        : templateId === 'ats-friendly'
                        ? 'text-blue-900'
                        : templateId === 'classic'
                        ? 'text-emerald-950 font-serif'
                        : 'text-slate-950'
                    }`}
                  >
                    {coverLetter.sender.fullName}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-500 border border-slate-200">
                    {templateId}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {[coverLetter.sender.email, coverLetter.sender.phone].filter(Boolean).join(' • ')}
                </p>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {/* Recipient Box */}
            <div className="text-xs sm:text-sm text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-900">{coverLetter.recipient.hiringManager}</p>
              <p className="text-slate-800">{coverLetter.recipient.companyName}</p>
              <p className="text-slate-500 font-medium mt-0.5">
                {isAr ? 'بخصوص وظيفة:' : 'Re:'} {coverLetter.recipient.jobTitle}
              </p>
            </div>

            {/* Letter Body Text */}
            <div className="pt-2 text-slate-800 leading-relaxed text-sm sm:text-base">
              {CoverLetterService.cleanDisplayText(coverLetter.content.fullText)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
