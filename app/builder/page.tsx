'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResumeData, TemplateId, ThemeConfig, DocumentLanguage } from './types';
import { initialSampleData } from './initialData';
import { SectionKey } from './components/BuilderSidebar';
import { BuilderForm } from './components/BuilderForm';
import dynamic from 'next/dynamic';
import { ResumePreview } from './components/ResumePreview';
const TemplateSelector = dynamic(() => import('./components/TemplateSelector'), { ssr: false });
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Download,
  Upload,
  FileCode,
  FileText,
  Check,
  Printer,
  Layout,
  RefreshCw,
  Globe,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import LogoLoader from '../components/LogoLoader';
import { useLanguage } from '../context/LanguageContext';
import { PaperSize, getDefaultPaperSize, exportResumeToPdf } from './utils/exportPdf';
import { exportResumeToDocx } from './utils/exportWord';
import { Button } from '@/components/ui/Button';
import { Toast, ToastProps } from '@/components/ui/Toast';
import { UserMenu } from '@/components/layout/UserMenu';
import {
  DOCUMENT_LANGUAGE_OPTIONS,
  getStoredDocumentLanguage,
  setStoredDocumentLanguage,
  getDocumentFontFamily,
} from '../lib/documentI18n';

const emptyResumeData: ResumeData = {
  personalInfo: {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    github: '',
    summary: '',
    photoUrl: '',
    showPhoto: false,
  },
  experience: [
    {
      id: '1',
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: [''],
    },
  ],
  education: [
    {
      id: '1',
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      gpa: '',
    },
  ],
  projects: [
    {
      id: '1',
      title: '',
      techStack: '',
      link: '',
      description: [''],
    },
  ],
  skills: [],
  languages: [],
  certifications: [],
};

const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'personal',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'languages',
  'certifications',
];

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export default function BuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isRtl, language } = useLanguage();

  const [mounted, setMounted] = useState<boolean>(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeTitle, setResumeTitle] = useState<string>('My Professional Resume');

  // Autosave and unsaved changes tracking
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number>(Date.now());
  const [autosaveRelativeText, setAutosaveRelativeText] = useState<string>('Saved just now');

  // Export states
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Resume Document Data
  const [resumeData, setResumeData] = useState<ResumeData>(initialSampleData);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('compact');
  const [paperSize, setPaperSize] = useState<PaperSize>(() => getDefaultPaperSize());
  const [theme, setTheme] = useState<ThemeConfig>({
    accentColor: '#0F5C4D',
    fontFamily: 'var(--font-sans), sans-serif',
    fontSize: 'base',
    documentLanguage: (language as DocumentLanguage) || 'en',
  });

  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(DEFAULT_SECTION_ORDER);
  const [activeSection, setActiveSection] = useState<SectionKey>('personal');

  // Responsive Layout: Mobile tabs "Edit | Preview"
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Drawer / Switcher states
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);
  const [isThemeControlsOpen, setIsThemeControlsOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ type: ToastProps['type']; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    const storedDocLang = getStoredDocumentLanguage();
    if (storedDocLang) {
      setTheme((prev) => ({
        ...prev,
        documentLanguage: storedDocLang,
        fontFamily: storedDocLang === 'ar' ? getDocumentFontFamily('ar') : prev.fontFamily,
      }));
    }
  }, []);


  // Update relative autosave text every 4 seconds
  useEffect(() => {
    const updateAutosaveString = () => {
      const diffSec = Math.floor((Date.now() - lastSavedTimestamp) / 1000);
      if (diffSec < 4) {
        setAutosaveRelativeText(isRtl ? 'تم الحفظ الآن' : 'Saved just now');
      } else if (diffSec < 60) {
        setAutosaveRelativeText(isRtl ? `حُفظ منذ ${diffSec} ثانية` : `Saved ${diffSec}s ago`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        setAutosaveRelativeText(isRtl ? `حُفظ منذ ${diffMin} دقيقة` : `Saved ${diffMin}m ago`);
      }
    };

    const interval = setInterval(updateAutosaveString, 4000);
    return () => clearInterval(interval);
  }, [lastSavedTimestamp, isRtl]);

  // Warning when leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges || autosaveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, autosaveStatus]);

  // Load from URL query or ID
  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam) {
      if (templateParam === 'ats-friendly' || templateParam === 'executive-blue') {
        setSelectedTemplate('executive-blue');
      } else {
        setSelectedTemplate(templateParam as TemplateId);
      }
    }

    const id = searchParams.get('id');
    if (id) {
      setResumeId(id);
      fetch(`/api/resumes/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Could not load resume');
          return res.json();
        })
        .then((json) => {
          if (json.resume) {
            if (json.resume.data) setResumeData(json.resume.data);
            if (json.resume.templateId) {
              const tid = json.resume.templateId === 'ats-friendly' ? 'executive-blue' : json.resume.templateId;
              setSelectedTemplate(tid);
            }
            if (json.resume.theme) setTheme(json.resume.theme);
            if (json.resume.title) setResumeTitle(json.resume.title);
            setHasUnsavedChanges(false);
          }
        })
        .catch((err) => console.error('Failed to load resume by id:', err));
    }
  }, [searchParams]);

  // Core Cloud / Local Persistence Function
  const persistResume = useCallback(
    async (isManualTrigger = false) => {
      try {
        setAutosaveStatus('saving');

        // 1. Local storage cache
        try {
          localStorage.setItem(
            'jobmatch_resume_builder_cache',
            JSON.stringify({
              resumeTitle,
              resumeData,
              selectedTemplate,
              paperSize,
              theme,
              sectionOrder,
            })
          );
        } catch {
          // Intentionally ignored: localStorage may be full or disabled in private browsing; cloud save proceeds below
        }

        // 2. Cloud save if logged in
        if (user) {
          const titleToSave =
            resumeTitle ||
            (resumeData.personalInfo.fullName
              ? `${resumeData.personalInfo.fullName} - Resume`
              : 'My Resume');

          const payload = {
            title: titleToSave,
            templateId: selectedTemplate,
            theme,
            data: resumeData,
          };

          let res;
          if (resumeId) {
            res = await fetch(`/api/resumes/${resumeId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
          } else {
            res = await fetch('/api/resumes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
          }

          if (res.ok) {
            const body = await res.json();
            const savedResume = body.resume;
            if (savedResume && (savedResume.id || savedResume._id)) {
              setResumeId(savedResume.id || savedResume._id);
            }
            setAutosaveStatus('saved');
            setHasUnsavedChanges(false);
            setLastSavedTimestamp(Date.now());
            if (isManualTrigger) {
              setToast({
                type: 'success',
                message: isRtl ? 'تم حفظ السيرة الذاتية بنجاح!' : 'Resume saved to cloud successfully!',
              });
            }
          } else {
            setAutosaveStatus('failed');
          }
        } else {
          // Guest user: local saved
          setAutosaveStatus('saved');
          setHasUnsavedChanges(false);
          setLastSavedTimestamp(Date.now());
        }
      } catch (err) {
        console.error('Autosave error:', err);
        setAutosaveStatus('failed');
      }
    },
    [resumeTitle, resumeData, selectedTemplate, paperSize, theme, sectionOrder, user, resumeId, isRtl]
  );

  // Debounced Autosave Trigger
  const triggerDebouncedAutosave = useCallback(() => {
    setHasUnsavedChanges(true);
    setAutosaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      persistResume(false);
    }, 1500);
  }, [persistResume]);

  const handleDataChange = (newData: ResumeData) => {
    setResumeData(newData);
    triggerDebouncedAutosave();
  };

  const handleTitleChange = (newTitle: string) => {
    setResumeTitle(newTitle);
    triggerDebouncedAutosave();
  };

  const handleTemplateSelect = (t: TemplateId) => {
    setSelectedTemplate(t);
    triggerDebouncedAutosave();
    setToast({
      type: 'info',
      message: isRtl ? 'تم تحديث قالب المعاينة فورياً' : 'Template updated instantly in preview',
    });
  };

  // Word (.docx) Export Handler
  const handleDownloadWord = async () => {
    try {
      setIsExportingWord(true);
      await exportResumeToDocx(resumeData, theme);
      setToast({
        type: 'success',
        message: isRtl
          ? 'تم تصدير مستند Word (.docx) المتوافق بنجاح!'
          : 'ATS-compliant Word (.docx) downloaded successfully!',
      });
    } catch (err: any) {
      console.error('Word export error:', err);
      setToast({
        type: 'error',
        message: isRtl
          ? 'فشل تصدير ملف Word. يرجى المحاولة ثانية.'
          : `Failed to export Word file: ${err?.message || 'Please try again.'}`,
      });
    } finally {
      setIsExportingWord(false);
    }
  };

  // PDF Export Handler
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const safeName = resumeData.personalInfo.fullName
        ? `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume`
        : 'Resume';
      await exportResumeToPdf('resume-preview', safeName, paperSize);
      setToast({
        type: 'success',
        message: isRtl
          ? 'تم تحميل السيرة الذاتية بصيغة PDF بنجاح!'
          : 'ATS-compliant PDF resume downloaded successfully!',
      });
    } catch (err: any) {
      console.error('PDF export error:', err);
      setToast({
        type: 'error',
        message: isRtl
          ? 'فشل إنشاء ملف PDF. يرجى المحاولة ثانية.'
          : `Failed to generate PDF: ${err?.message || 'Please try again.'}`,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(resumeData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const fileName = `${
      resumeData.personalInfo.fullName
        ? resumeData.personalInfo.fullName.replace(/\s+/g, '_')
        : 'Resume'
    }_ATS_Data.json`;
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToast({
      type: 'info',
      message: isRtl ? 'تم تنزيل النسخة الاحتياطية JSON' : 'Backup JSON downloaded',
    });
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.personalInfo) {
          handleDataChange(parsed);
          setToast({
            type: 'success',
            message: isRtl ? 'تم استيراد بيانات السيرة الذاتية بنجاح!' : 'Resume JSON imported successfully!',
          });
        } else {
          setToast({
            type: 'error',
            message: isRtl ? 'صيغة JSON غير صحيحة للسيرة الذاتية' : 'Invalid resume JSON format',
          });
        }
      } catch {
        setToast({
          type: 'error',
          message: isRtl ? 'فشل قراءة ملف JSON' : 'Failed to parse JSON file',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const colors = [
    { name: 'Studio Green', hex: '#0F5C4D' },
    { name: 'Deep Ink', hex: '#14181F' },
    { name: 'Navy Blue', hex: '#1E3A5F' },
    { name: 'Terra Cotta', hex: '#8C5A20' },
    { name: 'Burgundy', hex: '#7A2021' },
    { name: 'Graphite', hex: '#374151' },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      suppressHydrationWarning
      className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-paper text-ink flex flex-col selection:bg-brand/20 selection:text-brand"
    >
      {/* 1. Top Builder Header & Comprehensive Action Toolbar */}
      <header
        suppressHydrationWarning
        className="print:hidden sticky top-0 z-40 bg-surface backdrop-blur-md border-b border-line-strong shadow-xs w-full"
      >
        <div className="max-w-[1720px] w-full mx-auto px-2 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-1.5 sm:gap-3 min-w-0">
          {/* Left: Brand Return & Resume Title & Autosave Badge */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <Link
              href="/dashboard"
              suppressHydrationWarning
              aria-label={isRtl ? 'العودة إلى لوحة التحكم' : 'Return to Dashboard'}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2 hover:text-ink hover:bg-surface-2 p-1.5 rounded-md min-h-[44px] min-w-[44px] justify-center transition-colors shrink-0"
              title={isRtl ? 'العودة إلى لوحة التحكم' : 'Return to Dashboard'}
            >
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} strokeWidth={1.75} />
              <span suppressHydrationWarning className="hidden sm:inline">
                {isRtl ? 'لوحة التحكم' : 'Dashboard'}
              </span>
            </Link>

            <div className="h-4 w-px bg-line-strong shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={resumeTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                aria-label={isRtl ? 'عنوان السيرة الذاتية' : 'Resume title'}
                className="bg-transparent border-b border-transparent hover:border-line-strong focus:border-brand text-xs sm:text-sm font-semibold text-ink px-1 py-0.5 truncate focus:outline-none max-w-[70px] xs:max-w-[140px] sm:max-w-[240px] md:max-w-[280px]"
                title={isRtl ? 'انقر لتعديل عنوان السيرة الذاتية' : 'Click to rename resume'}
              />

              {/* Autosave Status Badge with Three Distinct States */}
              <div
                className={`hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                  autosaveStatus === 'saving'
                    ? 'bg-brand/10 border-brand/20 text-brand'
                    : autosaveStatus === 'failed'
                    ? 'bg-danger/10 border-danger/30 text-danger'
                    : 'bg-surface-2 border-line text-ink-2 font-medium'
                }`}
              >
                {autosaveStatus === 'saving' && (
                  <>
                    <RefreshCw className="w-3 h-3 text-brand animate-spin" />
                    <span>{isRtl ? 'جاري الحفظ…' : 'Saving…'}</span>
                  </>
                )}
                {autosaveStatus === 'saved' && (
                  <>
                    <Check className="w-3 h-3 text-success stroke-[2.5]" />
                    <span>{isRtl ? 'تم الحفظ ✓' : 'Saved ✓'}</span>
                    <span className="text-[10px] opacity-70">({autosaveRelativeText})</span>
                  </>
                )}
                {autosaveStatus === 'failed' && (
                  <button
                    type="button"
                    onClick={() => persistResume(true)}
                    className="inline-flex items-center gap-1 text-danger hover:underline cursor-pointer"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>{isRtl ? 'فشل – إعادة المحاولة' : 'Failed – retry'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Toolbar: Templates, Styling, Language, Export, Account */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Template Switcher Trigger Button */}
            <Button
              variant={isTemplateDrawerOpen ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setIsTemplateDrawerOpen((prev) => !prev);
                setIsThemeControlsOpen(false);
              }}
              leftIcon={<Layout className="w-3.5 h-3.5" strokeWidth={1.75} />}
              className="hidden sm:inline-flex"
              title={isRtl ? 'تغيير قالب السيرة الذاتية' : 'Change resume template'}
            >
              <span>{isRtl ? 'القوالب' : 'Templates'}</span>
              <span className="text-[10px] font-mono px-1 rounded bg-black/10 dark:bg-white/10 uppercase ms-1 hidden lg:inline">
                {selectedTemplate}
              </span>
            </Button>

            {/* Output Language Selector (6 Languages) */}
            <div className="relative">
              <select
                id="builder-document-output-language"
                value={theme.documentLanguage || 'en'}
                aria-label={isRtl ? 'لغة إخراج المستند' : 'Document output language'}
                onChange={(e) => {
                  const newLang = e.target.value as DocumentLanguage;
                  setStoredDocumentLanguage(newLang);
                  setTheme((prev) => ({
                    ...prev,
                    documentLanguage: newLang,
                    fontFamily:
                      newLang === 'ar'
                        ? getDocumentFontFamily('ar')
                        : prev.fontFamily.includes('font-arabic')
                        ? 'var(--font-sans), sans-serif'
                        : prev.fontFamily,
                  }));
                  triggerDebouncedAutosave();
                }}
                className="text-xs bg-surface border border-line rounded-md px-1.5 sm:px-2.5 py-1 text-ink focus:outline-none focus:border-brand cursor-pointer font-medium max-w-[62px] sm:max-w-none"
                title={isRtl ? 'لغة إخراج المستند (مستقلة عن لغة الواجهة)' : 'Output language (independent from UI language)'}
              >
                {DOCUMENT_LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.nativeName} ({opt.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Hidden JSON file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="hidden 2xl:inline-flex"
              leftIcon={<Upload className="w-3.5 h-3.5" strokeWidth={1.5} />}
              title={isRtl ? 'استيراد نسخة JSON' : 'Import JSON'}
            >
              <span>{isRtl ? 'استيراد' : 'Import'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportJSON}
              className="hidden 2xl:inline-flex"
              leftIcon={<FileCode className="w-3.5 h-3.5" strokeWidth={1.5} />}
              title={isRtl ? 'نسخة احتياطية JSON' : 'Backup JSON'}
            >
              <span>{isRtl ? 'نسخة JSON' : 'JSON'}</span>
            </Button>

            {/* Export Word (.docx) */}
            <Button
              variant="outline"
              size="sm"
              disabled={isExportingWord}
              isLoading={isExportingWord}
              onClick={handleDownloadWord}
              className="hidden lg:inline-flex"
              leftIcon={<FileText className="w-3.5 h-3.5 -ink-2" strokeWidth={1.75} />}
              title={isRtl ? 'تحميل بصيغة مايكروسوفت وورد (.docx)' : 'Download editable Microsoft Word document'}
            >
              <span>Word</span>
            </Button>

            {/* Print / Vector PDF dialog */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="hidden xl:inline-flex"
              leftIcon={<Printer className="w-3.5 h-3.5 -ink-2" strokeWidth={1.75} />}
              title={isRtl ? 'طباعة مباشرة عبر المتصفح' : 'Print via browser dialog'}
            >
              <span>{isRtl ? 'طباعة' : 'Print'}</span>
            </Button>

            {/* Primary Download PDF */}
            <Button
              variant="primary"
              size="sm"
              disabled={isExportingPdf}
              isLoading={isExportingPdf}
              onClick={handleDownloadPdf}
              leftIcon={<Download className="w-3.5 h-3.5" strokeWidth={1.75} />}
              title={isRtl ? 'تحميل مباشر كملف PDF عالي الجودة' : 'Direct download ATS PDF'}
            >
              <span className="hidden sm:inline">
                {isExportingPdf ? (isRtl ? 'جاري التحميل…' : 'Downloading…') : (isRtl ? 'تحميل PDF' : 'Download PDF')}
              </span>
              <span className="sm:hidden">
                {isExportingPdf ? '...' : 'PDF'}
              </span>
            </Button>

            {/* User Account Menu */}
            <UserMenu variant="compact" />
          </div>
        </div>

        {/* Expandable Template Switcher Bar */}
        {isTemplateDrawerOpen && (
          <div className="border-t border-line-strong bg-surface-2 backdrop-blur-md p-4 sm:p-5 max-w-[1720px] mx-auto animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-brand" />
                <h3 className="text-xs font-semibold text-ink">
                  {isRtl ? 'اختر قالب السيرة الذاتية (معاينة فورية)' : 'Choose Template (Instant Live Preview)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateDrawerOpen(false)}
                className="text-xs text-ink-2 hover:text-ink p-1 rounded-md"
              >
                ✕ {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>

            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateSelect}
              accentColor={theme.accentColor}
              isRtl={isRtl}
            />
          </div>
        )}
      </header>

      {/* 2. Main Workspace Split Layout */}
      <main id="main-content" className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-24 lg:pb-6 flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Tab Switcher (<1024px): "Edit | Preview" */}
        <div className="lg:hidden flex items-center justify-between mb-4 bg-surface-2 p-1 rounded-xl border border-line-strong">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`flex-1 min-h-[44px] py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mobileTab === 'editor'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            ✏️ {isRtl ? 'تعديل البيانات' : 'Edit Resume'}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 min-h-[44px] py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mobileTab === 'preview'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            👁️ {isRtl ? 'المعاينة الحية' : 'Live Preview'}
          </button>
        </div>

        {/* 2-Column Split: Form Editor (Left) & Sticky Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-w-0">
          {/* Form Editor Column (50-55% width on desktop) */}
          <div
            className={`lg:col-span-6 xl:col-span-6 2xl:col-span-6 space-y-4 print:hidden transition-all min-w-0 ${
              mobileTab === 'editor' ? 'block w-full' : 'hidden lg:block'
            }`}
          >
            {/* Quick Template Switcher Card for Desktop */}
            <div className="hidden lg:flex items-center justify-between gap-3 p-3 bg-surface border border-line-strong rounded-xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-medium text-ink-2">
                <Layout className="w-4 h-4 text-brand" />
                <span>{isRtl ? 'القالب النشط:' : 'Active Template:'}</span>
                <span className="font-semibold text-ink capitalize">{selectedTemplate}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Accent Color Circles */}
                <div className="flex items-center gap-1.5 me-2">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        setTheme((prev) => ({ ...prev, accentColor: c.hex }));
                        triggerDebouncedAutosave();
                      }}
                      className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                        theme.accentColor === c.hex ? 'scale-125 ring-2 ring-brand ring-offset-2 ring-offset-bg' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplateDrawerOpen((prev) => !prev)}
                  className="text-xs h-7 px-2.5"
                >
                  {isTemplateDrawerOpen ? (isRtl ? 'إخفاء القوالب' : 'Hide Templates') : (isRtl ? 'تغيير القالب' : 'Change Template')}
                </Button>
              </div>
            </div>

            {/* Core Form Component */}
            <BuilderForm
              data={resumeData}
              onChange={handleDataChange}
              sectionOrder={sectionOrder}
              activeSection={activeSection}
              onActiveSectionChange={(s) => setActiveSection(s)}
            />
          </div>

          {/* Live Sticky Preview Column (45-50% width on desktop) */}
          <div
            className={`lg:col-span-6 xl:col-span-6 2xl:col-span-6 transition-all min-w-0 ${
              mobileTab === 'preview' ? 'block w-full' : 'hidden lg:block'
            } lg:sticky lg:top-20 print:!block print:!w-full print:!m-0 print:!p-0`}
          >
            <ResumePreview
              data={resumeData}
              template={selectedTemplate}
              theme={theme}
              paperSize={paperSize}
            />
          </div>
        </div>
      </main>

      {/* 3. Mobile Sticky Bottom Action Bar (<1024px) */}
      <div className="print:hidden lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface backdrop-blur-md border-t border-line-strong py-2 px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between shadow-card">
        {/* Autosave Mini Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-2">
          {autosaveStatus === 'saving' ? (
            <RefreshCw className="w-3 h-3 text-brand animate-spin" />
          ) : (
            <Check className="w-3 h-3 text-success" />
          )}
          <span>{autosaveStatus === 'saving' ? (isRtl ? 'حفظ…' : 'Saving…') : autosaveRelativeText}</span>
        </div>

        {/* Quick Export Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isExportingWord}
            onClick={handleDownloadWord}
            className="text-xs h-8 px-2.5"
          >
            Word
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={isExportingPdf}
            isLoading={isExportingPdf}
            onClick={handleDownloadPdf}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="text-xs h-8 px-3"
          >
            <span>{isExportingPdf ? '...' : (isRtl ? 'تحميل PDF' : 'Download PDF')}</span>
          </Button>
        </div>
      </div>

      {/* 4. Fullscreen Export Loader Overlay */}
      {(isExportingPdf || isExportingWord) && (
        <LogoLoader
          text={isExportingPdf ? (isRtl ? 'جاري تجهيز وتحميل ملف PDF...' : 'Generating ATS-Compliant PDF...') : (isRtl ? 'جاري تجهيز مستند Word...' : 'Generating Word Document...')}
          subtext={isRtl ? 'تنسيق الخطوط والجداول بدقة عالية...' : 'Applying strict typography & formatting guidelines...'}
          size="md"
          fullScreen
        />
      )}

      {/* 5. Accessible Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3500}
        />
      )}
    </div>
  );
}
