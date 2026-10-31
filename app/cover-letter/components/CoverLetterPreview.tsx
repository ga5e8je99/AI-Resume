'use client';

import React, { useState, useRef } from 'react';
import { CoverLetterData } from '../types';
import {
  Edit3,
  Copy,
  Check,
  Printer,
  Save,
  RotateCcw,
  Loader2,
  FileText,
  FileDown,
  Sparkles,
  Languages,
  Bold,
  Italic,
  List,
  Eye,
  Undo2,
} from 'lucide-react';
import { CoverLetterService } from '@/app/lib/coverLetterService';
import { exportCoverLetterToDocx } from '../utils/exportCoverLetterWord';
import {
  DOCUMENT_LANGUAGE_OPTIONS,
  DocumentLanguage,
  setStoredDocumentLanguage,
} from '@/app/lib/documentI18n';

function sanitizePreview(val?: string | null): string {
  if (!val || typeof val !== 'string') return '';
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

interface CoverLetterPreviewProps {
  coverLetter: CoverLetterData;
  onUpdate: (updated: CoverLetterData) => void;
  onSaveDraft: () => Promise<void>;
  isSaving: boolean;
  isDirty?: boolean;
  onResetRequest?: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function CoverLetterPreview({
  coverLetter,
  onUpdate,
  onSaveDraft,
  isSaving,
  isDirty = false,
  onResetRequest,
  onRegenerate,
  isRegenerating = false,
  showToast,
}: CoverLetterPreviewProps) {
  // Start in direct edit mode or view mode
  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isAr = (coverLetter.language || 'ar') === 'ar';

  // Live word & character count
  const { wordCount, charCount } = React.useMemo(() => {
    const text = coverLetter.content?.fullText || '';
    return {
      wordCount: text.trim().split(/\s+/).filter(Boolean).length,
      charCount: text.length,
    };
  }, [coverLetter.content?.fullText]);

  // Copy letter to clipboard
  const handleCopy = async () => {
    if (isCopied) return;
    try {
      const cleaned = CoverLetterService.cleanDisplayText(coverLetter.content.fullText);
      await navigator.clipboard.writeText(cleaned);
      setIsCopied(true);
      showToast(isAr ? 'تم نسخ نص الخطاب إلى الحافظة' : 'Cover letter copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast(isAr ? 'تعذر النسخ التلقائي' : 'Failed to copy', 'error');
    }
  };

  // Export to Word (.docx)
  const handleExportDocx = async () => {
    if (isExportingDocx) return;
    setIsExportingDocx(true);
    try {
      await exportCoverLetterToDocx(coverLetter);
      showToast(isAr ? 'تم تنزيل مستند Word بنجاح' : 'Cover letter downloaded as Word (.docx)');
    } catch {
      showToast(isAr ? 'تعذر تصدير ملف Word' : 'Failed to export Word document', 'error');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Export to PDF via clean browser print
  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);
    showToast(isAr ? 'جاري فتح نافذة الطباعة / تصدير PDF...' : 'Opening print preview / PDF export...');
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 350);
  };

  // Switch document language across all 6 supported locales
  const handleSelectLanguage = (newLang: DocumentLanguage) => {
    setStoredDocumentLanguage(newLang);
    onUpdate({
      ...coverLetter,
      language: newLang,
    });
    showToast(
      newLang === 'ar'
        ? 'تم تحويل اتجاه الخطاب إلى العربية (RTL)'
        : `Switched layout language to ${newLang.toUpperCase()} (LTR)`
    );
  };

  // Handle direct text changes in the editable area
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      ...coverLetter,
      content: {
        ...coverLetter.content,
        fullText: e.target.value,
      },
    });
  };

  // Rich formatting helpers for the editable area
  const applyTextFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = coverLetter.content.fullText || '';
    const selected = text.substring(start, end);

    let replacement = '';
    if (selected) {
      replacement = `${prefix}${selected}${suffix}`;
    } else {
      replacement = `${prefix}${isAr ? 'نص مخصص' : 'formatted text'}${suffix}`;
    }

    const updated = text.substring(0, start) + replacement + text.substring(end);
    onUpdate({
      ...coverLetter,
      content: {
        ...coverLetter.content,
        fullText: updated,
      },
    });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 0);
  };

  const insertBulletItem = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = coverLetter.content.fullText || '';
    const bullet = '\n• ';
    const updated = text.substring(0, start) + bullet + text.substring(start);

    onUpdate({
      ...coverLetter,
      content: {
        ...coverLetter.content,
        fullText: updated,
      },
    });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + bullet.length, start + bullet.length);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Primary Actions Toolbar */}
      <div className="bg-surface border border-line rounded-[12px] p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Left Toolbar Items: Status, Direction, Word Count */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Output Language Selector (6 Languages) */}
          <div className="flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-accent shrink-0" />
            <select
              id="cover-letter-preview-output-language"
              aria-label="Cover letter output language"
              value={coverLetter.language || 'en'}
              onChange={(e) => handleSelectLanguage(e.target.value as DocumentLanguage)}
              className="px-2 py-1 rounded-[6px] bg-accent-soft hover:bg-accent/20 text-accent font-semibold text-xs border border-accent/25 focus:outline-none cursor-pointer"
            >
              {DOCUMENT_LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.nativeName} ({opt.dir === 'rtl' ? 'RTL' : 'LTR'})
                </option>
              ))}
            </select>
          </div>

          {/* Tone Indicator Badge */}
          <span className="px-2 py-1 rounded-[4px] bg-surface-2 text-ink-2 border border-line font-medium capitalize text-[11px]">
            {coverLetter.tone === 'formal'
              ? isAr ? 'احترافي' : 'Professional'
              : coverLetter.tone === 'enthusiastic'
              ? isAr ? 'ودي' : 'Friendly'
              : coverLetter.tone === 'leadership'
              ? isAr ? 'واثق' : 'Confident'
              : isAr ? 'تقني' : 'Technical'}
          </span>

          {/* Real-time Word & Char Count */}
          <span
            className="px-2 py-1 rounded-[4px] bg-surface-2 text-ink-3 font-mono text-[11px] border border-line flex items-center gap-1"
            title={`${charCount} ${isAr ? 'حرف' : 'characters'}`}
          >
            <FileText className="w-3 h-3 text-ink-3" />
            <span>{wordCount} {isAr ? 'كلمة' : 'words'}</span>
          </span>

          {/* Saved / Unsaved Indicator */}
          {isDirty ? (
            <span className="px-2 py-0.5 rounded-[4px] bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[11px] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>{isAr ? 'تعديل غير محفوظ' : 'Unsaved edits'}</span>
            </span>
          ) : coverLetter.id ? (
            <span className="px-2 py-0.5 rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[11px] font-medium flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>{isAr ? 'محفوظ' : 'Saved'}</span>
            </span>
          ) : null}
        </div>

        {/* Right Toolbar Items: Actions (Regenerate, Edit Toggle, Copy, Download, Save) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Action: Regenerate */}
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating || isSaving}
              className="px-2.5 py-1.5 rounded-[6px] bg-surface hover:bg-surface-2 border border-line text-xs text-ink-2 hover:text-accent transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={isAr ? 'إعادة توليد الخطاب بنفس المعطيات' : 'Regenerate cover letter'}
            >
              {isRegenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
              )}
              <span className="hidden sm:inline font-medium">{isAr ? 'إعادة التوليد' : 'Regenerate'}</span>
            </button>
          )}

          {/* View / Edit Mode Toggle */}
          <div className="flex items-center p-0.5 bg-surface-2 rounded-[6px] border border-line">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors flex items-center gap-1 cursor-pointer ${
                !isEditing
                  ? 'bg-surface text-ink shadow-xs font-semibold'
                  : 'text-ink-2 hover:text-ink'
              }`}
              title={isAr ? 'معاينة المستند المطبوع' : 'Document layout preview'}
            >
              <Eye className="w-3 h-3" />
              <span>{isAr ? 'المعاينة' : 'Preview'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors flex items-center gap-1 cursor-pointer ${
                isEditing
                  ? 'bg-surface text-accent shadow-xs font-semibold'
                  : 'text-ink-2 hover:text-ink'
              }`}
              title={isAr ? 'تحرير النص المباشر' : 'Direct text editing'}
            >
              <Edit3 className="w-3 h-3" />
              <span>{isAr ? 'تحرير' : 'Edit'}</span>
            </button>
          </div>

          {/* Copy Button with Feedback */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={isCopied}
            className="px-2.5 py-1.5 rounded-[6px] bg-surface hover:bg-surface-2 border border-line text-xs text-ink font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-80"
            title={isAr ? 'نسخ النص كاملاً' : 'Copy letter text'}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
                <span className="text-emerald-600 font-semibold">{isAr ? 'تم النسخ' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-ink-2" strokeWidth={1.5} />
                <span>{isAr ? 'نسخ' : 'Copy'}</span>
              </>
            )}
          </button>

          {/* Download Word (.docx) */}
          <button
            type="button"
            onClick={handleExportDocx}
            disabled={isExportingDocx || isSaving}
            className="px-2.5 py-1.5 rounded-[6px] bg-surface hover:bg-surface-2 border border-line text-xs text-ink font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title={isAr ? 'تنزيل بصيغة Word (.docx)' : 'Download Word document'}
          >
            {isExportingDocx ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.75} />
            )}
            <span className="hidden sm:inline">Word</span>
          </button>

          {/* Download PDF / Print */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="px-2.5 py-1.5 rounded-[6px] bg-surface hover:bg-surface-2 border border-line text-xs text-ink font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title={isAr ? 'تصدير PDF أو طباعة' : 'Export PDF or print'}
          >
            {isPrinting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-ink-2" strokeWidth={1.75} />
            )}
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Save Draft Button */}
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent shadow-xs"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Save className="w-3.5 h-3.5 text-white" strokeWidth={1.75} />
            )}
            <span>
              {isSaving
                ? isAr ? 'جاري الحفظ...' : 'Saving...'
                : isDirty
                ? isAr ? 'حفظ التعديلات' : 'Save edits'
                : coverLetter.id
                ? isAr ? 'تحديث المسودة' : 'Update draft'
                : isAr ? 'حفظ كمسودة' : 'Save draft'}
            </span>
          </button>
        </div>
      </div>

      {/* Rich Text Editing Helper Toolbar (Active when in edit mode) */}
      {isEditing && (
        <div className="p-2.5 rounded-[8px] -surface-2 border border-line text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink-3 me-1">
              {isAr ? 'تنسيق سريع:' : 'Formatting:'}
            </span>
            <button
              type="button"
              onClick={() => applyTextFormat('**', '**')}
              className="p-1.5 rounded-[4px] bg-surface hover:bg-surface-2 border border-line text-ink font-bold cursor-pointer"
              title={isAr ? 'نص عريض' : 'Bold'}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyTextFormat('*', '*')}
              className="p-1.5 rounded-[4px] bg-surface hover:bg-surface-2 border border-line text-ink italic cursor-pointer"
              title={isAr ? 'نص مائل' : 'Italic'}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={insertBulletItem}
              className="p-1.5 rounded-[4px] bg-surface hover:bg-surface-2 border border-line text-ink cursor-pointer"
              title={isAr ? 'نقطة تعداد' : 'Bullet item'}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[11px] text-ink-3 flex items-center gap-2">
            <span>{isAr ? 'تحرير مباشر: اكتب وعدل الفقرات بحرية' : 'Direct editing: adjust text and phrasing freely'}</span>
            <span className="font-mono text-accent">({wordCount} {isAr ? 'كلمة' : 'words'})</span>
          </div>
        </div>
      )}

      {/* Matched Keywords Pills */}
      {coverLetter.extractedKeywords && coverLetter.extractedKeywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-[8px] bg-surface border border-line text-xs">
          <span className="text-ink-3 text-[11px] font-medium ms-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
            <span>{isAr ? 'الكلمات المفتاحية المضمنة:' : 'Matched keywords:'}</span>
          </span>
          {coverLetter.extractedKeywords.slice(0, 10).map((kw, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-[4px] bg-surface-2 text-ink-2 border border-line text-[11px] font-mono"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* A4 Paper Sheet Preview / Editable Rich Text Area with Instant RTL/LTR Direction */}
      <div
        id="cover-letter-sheet"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          fontFamily: isAr
            ? 'var(--font-arabic), "IBM Plex Sans Arabic", var(--font-sans), sans-serif'
            : 'var(--font-sans), sans-serif',
        }}
        className={`bg-surface text-ink rounded-[12px] p-6 sm:p-12 shadow-sm border border-line min-h-[640px] relative transition-all ${
          isAr ? 'font-arabic' : 'font-sans'
        }`}
      >
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-ink-3 pb-2 border-b border-line">
              <span>{isAr ? 'محرر نص خطاب التقديم' : 'Cover Letter Text Editor'}</span>
              <span className="font-mono">{charCount} {isAr ? 'حرف' : 'chars'}</span>
            </div>
            <textarea
              ref={textareaRef}
              rows={24}
              dir={isAr ? 'rtl' : 'ltr'}
              value={coverLetter.content.fullText}
              onChange={handleTextChange}
              aria-label={isAr ? 'نص خطاب التقديم القابل للتعديل' : 'Editable cover letter text'}
              style={{
                fontFamily: isAr
                  ? 'var(--font-arabic), "IBM Plex Sans Arabic", var(--font-sans), sans-serif'
                  : 'var(--font-sans), sans-serif',
              }}
              className="w-full p-4 bg-paper border border-line rounded-[8px] text-ink text-sm sm:text-base leading-relaxed focus:outline-none focus:border-accent resize-y min-h-[500px]"
              placeholder={isAr ? 'اكتب نص خطاب التقديم هنا...' : 'Enter cover letter text here...'}
            />
          </div>
        ) : (
          <div className="space-y-6 text-sm sm:text-base leading-relaxed text-ink">
            {/* Header: Sender Info & Date */}
            <div className="border-b border-line pb-4 mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2">
              <div>
                <h2 className="text-2xl font-serif font-bold text-ink tracking-tight">
                  {sanitizePreview(coverLetter.sender.fullName)}
                </h2>
                <p className="text-xs text-ink-2 mt-1">
                  {[
                    sanitizePreview(coverLetter.sender.email),
                    sanitizePreview(coverLetter.sender.phone),
                    sanitizePreview(coverLetter.sender.location),
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </p>
              </div>
              <div className="text-xs text-ink-3 font-mono">
                {new Date().toLocaleDateString(
                  coverLetter.language === 'ar'
                    ? 'ar-EG'
                    : coverLetter.language === 'fr'
                    ? 'fr-FR'
                    : coverLetter.language === 'de'
                    ? 'de-DE'
                    : coverLetter.language === 'es'
                    ? 'es-ES'
                    : coverLetter.language === 'tr'
                    ? 'tr-TR'
                    : 'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </div>
            </div>

            {/* Recipient Details */}
            <div className="text-xs sm:text-sm text-ink-2 space-y-0.5">
              {coverLetter.recipient.hiringManager && (
                <p className="font-semibold text-ink">{sanitizePreview(coverLetter.recipient.hiringManager)}</p>
              )}
              {coverLetter.recipient.jobTitle && (
                <p>{sanitizePreview(coverLetter.recipient.jobTitle)}</p>
              )}
              {coverLetter.recipient.companyName && (
                <p className="font-medium text-ink">{sanitizePreview(coverLetter.recipient.companyName)}</p>
              )}
            </div>

            {/* Letter Subject */}
            {coverLetter.content.subject && (
              <div className="font-semibold text-ink text-sm sm:text-base pt-2">
                <span className="text-ink-3 font-medium">{isAr ? 'الموضوع' : 'Subject'}: </span>
                <span>{sanitizePreview(coverLetter.content.subject)}</span>
              </div>
            )}

            {/* Main Letter Body */}
            <div className="space-y-4 pt-2 whitespace-pre-line text-ink leading-relaxed">
              {coverLetter.content.fullText ? (
                sanitizePreview(coverLetter.content.fullText)
              ) : (
                <>
                  <p className="font-semibold text-ink">{sanitizePreview(coverLetter.content.salutation)}</p>
                  <p>{sanitizePreview(coverLetter.content.introduction)}</p>
                  {coverLetter.content.bodyParagraphs?.map((para, i) => (
                    <p key={i}>{sanitizePreview(para)}</p>
                  ))}
                  <p>{sanitizePreview(coverLetter.content.conclusion)}</p>
                  <div className="pt-4 space-y-1">
                    <p className="text-ink-2">{sanitizePreview(coverLetter.content.signOff)}</p>
                    <p className="font-semibold text-ink">{sanitizePreview(coverLetter.sender.fullName)}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
