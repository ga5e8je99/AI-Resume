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
import { TEMPLATES } from './components/TemplateSelector';
import { useAuth } from '../context/AuthContext';
import { fetchUserProfileClient } from '@/lib/profile/client';
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
  Palette,
  Type,
} from 'lucide-react';
import LogoLoader from '../components/LogoLoader';
import { useLanguage } from '../context/LanguageContext';
import { PaperSize, getDefaultPaperSize, exportResumeToPdf } from './utils/exportPdf';
import { exportResumeToDocx } from './utils/exportWord';
import { Button } from '@/components/ui/Button';
import { Toast, ToastProps } from '@/components/ui/Toast';
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

const FONT_OPTIONS = [
  {
    id: 'sans',
    name: 'Inter (Clean Sans)',
    nameAr: 'إنتر (عصري قياسي)',
    category: 'Sans-Serif',
    value: 'var(--font-sans), sans-serif',
    sample: 'Alex Morgan • سيرة ذاتية احترافية',
    tag: 'ATS 100%',
  },
  {
    id: 'arabic-plex',
    name: 'IBM Plex Sans Arabic',
    nameAr: 'آي بي إم بلكس (عربي رسمي)',
    category: 'Arabic / Global',
    value: 'var(--font-arabic), "IBM Plex Sans Arabic", var(--font-sans), sans-serif',
    sample: 'مهندس برمجيات • Software Engineer',
    tag: 'Official Arabic',
  },
  {
    id: 'arial',
    name: 'Arial',
    nameAr: 'أريال (المعيار العالمي)',
    category: 'Classic ATS',
    value: 'Arial, Helvetica, sans-serif',
    sample: 'Professional Experience • خبرات عملية',
    tag: 'Classic ATS',
  },
  {
    id: 'calibri',
    name: 'Calibri',
    nameAr: 'كاليبري (شركات ومؤسسات)',
    category: 'Corporate',
    value: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif',
    sample: 'Leadership & Strategy • مهارات قيادية',
    tag: 'Corporate',
  },
  {
    id: 'georgia',
    name: 'Georgia',
    nameAr: 'جورجيا (سيريف فخم)',
    category: 'Executive Serif',
    value: 'Georgia, "Times New Roman", serif',
    sample: 'Executive Profile • سيرة قيادية',
    tag: 'Executive',
  },
  {
    id: 'times',
    name: 'Times New Roman',
    nameAr: 'تايمز نيو رومان (أكاديمي)',
    category: 'Academic Serif',
    value: '"Times New Roman", Times, var(--font-serif), serif',
    sample: 'Academic Curriculum Vitae • أكاديمي',
    tag: 'Academic',
  },
  {
    id: 'mono',
    name: 'JetBrains Mono',
    nameAr: 'جيت برينز مونو (تقني)',
    category: 'Monospace',
    value: 'var(--font-mono), monospace',
    sample: 'const engineer = "Full-Stack";',
    tag: 'Tech / Dev',
  },
];

const FONT_SIZE_OPTIONS: { id: 'sm' | 'base' | 'lg'; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
  {
    id: 'sm',
    labelEn: 'Small (10-11pt)',
    labelAr: 'صغير (10-11pt)',
    descEn: 'Compact sizing to fit more content on a single page',
    descAr: 'تنسيق مكثف يساعد في احتواء البيانات في صفحة واحدة',
  },
  {
    id: 'base',
    labelEn: 'Medium (11-12pt)',
    labelAr: 'متوسط (11-12pt)',
    descEn: 'Recommended balanced standard for optimal readability',
    descAr: 'المعيار المتوازن والموصى به لأفضل قراءة ومسح ATS',
  },
  {
    id: 'lg',
    labelEn: 'Large (12-13.5pt)',
    labelAr: 'كبير (12-13.5pt)',
    descEn: 'High legibility, ideal for concise & executive resumes',
    descAr: 'خط عريض وواضح جداً يناسب السير الذاتية المركزة',
  },
];

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

  // Two view modes for the editor column: 'data' (عرض إدخال البيانات) or 'design' (إعدادات شكل الـ CV)
  const [editorViewMode, setEditorViewMode] = useState<'data' | 'design'>('data');

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
    } else if (user) {
      // Prefill builder from user's Career Profile when creating a new resume
      fetchUserProfileClient(false, user.id).then((prof) => {
        if (!prof) return;
        const loc = [prof.city, prof.country].filter(Boolean).join(', ');
        setResumeData((prev) => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            fullName: prof.fullName || user.name || prev.personalInfo.fullName,
            jobTitle: prof.targetRole || prof.headline || prev.personalInfo.jobTitle,
            email: user.email || prev.personalInfo.email,
            phone: prof.phone || prev.personalInfo.phone,
            location: loc || prev.personalInfo.location,
            linkedin: prof.links?.linkedin || prev.personalInfo.linkedin,
            github: prof.links?.github || prev.personalInfo.github,
            website: prof.links?.portfolio || prev.personalInfo.website,
          },
          skills:
            Array.isArray(prof.skills) && prof.skills.length > 0
              ? prof.skills
              : prev.skills,
          languages:
            Array.isArray(prof.languages) && prof.languages.length > 0
              ? prof.languages.map((l, idx) => ({
                  id: `lang_prof_${idx}`,
                  name: l,
                  proficiency: 'Fluent',
                }))
              : prev.languages,
        }));
      });
    }
  }, [searchParams, user]);

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
    { name: isRtl ? 'أخضر أستوديو' : 'Studio Green', hex: '#0F5C4D' },
    { name: isRtl ? 'حبر داكن' : 'Deep Ink', hex: '#14181F' },
    { name: isRtl ? 'أزرق بحري' : 'Navy Blue', hex: '#1E3A5F' },
    { name: isRtl ? 'تيرا كوتا' : 'Terra Cotta', hex: '#8C5A20' },
    { name: isRtl ? 'بورغندي ملكي' : 'Burgundy', hex: '#7A2021' },
    { name: isRtl ? 'رمادي جرافيت' : 'Graphite', hex: '#374151' },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      suppressHydrationWarning
      className="min-h-[calc(100dvh-4rem)] w-full max-w-full overflow-x-hidden bg-paper text-ink flex flex-col selection:bg-brand/20 selection:text-brand"
    >
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJSON}
        accept=".json"
        className="hidden"
      />

      {/* Main Workspace Split Layout */}
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

        {/* 2-Column Split: Form & Settings Column (Left) & Sticky Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-w-0">
          {/* Data Entry & Settings Column */}
          <div
            className={`lg:col-span-6 xl:col-span-6 2xl:col-span-6 space-y-4 print:hidden transition-all min-w-0 ${
              mobileTab === 'editor' ? 'block w-full' : 'hidden lg:block'
            }`}
          >
            {/* Top Toolbar Card: Return to Dashboard, Editable Resume Title, Autosave Status, Quick PDF Download */}
            <div className="bg-surface border border-line-strong rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              {/* Dashboard Return & Title */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <Link
                  href="/dashboard"
                  aria-label={isRtl ? 'العودة إلى لوحة التحكم' : 'Return to Dashboard'}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2 hover:text-ink hover:bg-surface-2 p-1.5 rounded-lg transition-colors shrink-0"
                  title={isRtl ? 'العودة إلى لوحة التحكم' : 'Return to Dashboard'}
                >
                  <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} strokeWidth={1.75} />
                  <span className="hidden sm:inline">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</span>
                </Link>

                <div className="h-4 w-px bg-line-strong shrink-0" />

                <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[280px] sm:max-w-md">
                  <input
                    type="text"
                    value={resumeTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    aria-label={isRtl ? 'عنوان السيرة الذاتية' : 'Resume title'}
                    className="bg-transparent border-b border-transparent hover:border-line-strong focus:border-brand text-xs sm:text-sm font-bold text-ink px-1 py-0.5 truncate focus:outline-none w-full"
                    title={isRtl ? 'انقر لتعديل عنوان السيرة الذاتية' : 'Click to rename resume'}
                  />
                </div>
              </div>

              {/* Autosave Status & Quick PDF button */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Autosave Status Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
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
                    </>
                  )}
                  {autosaveStatus === 'failed' && (
                    <button
                      type="button"
                      onClick={() => persistResume(true)}
                      className="inline-flex items-center gap-1 text-danger hover:underline cursor-pointer"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>{isRtl ? 'إعادة المحاولة' : 'Retry'}</span>
                    </button>
                  )}
                </div>

                {/* Quick PDF download button */}
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isExportingPdf}
                  isLoading={isExportingPdf}
                  onClick={handleDownloadPdf}
                  leftIcon={<Download className="w-3.5 h-3.5" strokeWidth={1.75} />}
                  className="shadow-xs"
                  title={isRtl ? 'تحميل مباشر كملف PDF' : 'Direct download ATS PDF'}
                >
                  <span>{isExportingPdf ? '...' : (isRtl ? 'تحميل PDF' : 'PDF')}</span>
                </Button>
              </div>
            </div>

            {/* The Two Main Control Buttons Requested by User */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-surface border border-line-strong rounded-2xl shadow-xs">
              <button
                type="button"
                onClick={() => setEditorViewMode('data')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  editorViewMode === 'data'
                    ? 'bg-brand text-white shadow-sm ring-1 ring-brand'
                    : 'text-ink-2 hover:text-ink hover:bg-surface-2'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>{isRtl ? 'عرض إدخال البيانات' : 'Resume Data Entry'}</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorViewMode('design')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  editorViewMode === 'design'
                    ? 'bg-brand text-white shadow-sm ring-1 ring-brand'
                    : 'text-ink-2 hover:text-ink hover:bg-surface-2'
                }`}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>{isRtl ? 'إعدادات شكل الـ CV' : 'CV Appearance Settings'}</span>
              </button>
            </div>

            {/* Dynamic Content based on Active Button */}
            {editorViewMode === 'design' ? (
              /* ========================================================================= */
              /* 1. CV Appearance, Styling, Template, Typography & Export Settings Panel    */
              /* ========================================================================= */
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                {/* Export & Actions Card */}
                <div className="bg-surface border border-line-strong rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-ink">
                          {isRtl ? 'تحميل وتصدير السيرة الذاتية' : 'Download & Export Resume'}
                        </h3>
                        <p className="text-[11px] text-ink-2">
                          {isRtl
                            ? 'خيارات تصدير عالية الدقة متوافقة 100% مع أنظمة التوظيف ATS'
                            : 'High-fidelity export options 100% compliant with ATS systems'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Primary PDF Download */}
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={isExportingPdf}
                    isLoading={isExportingPdf}
                    onClick={handleDownloadPdf}
                    leftIcon={<Download className="w-4 h-4" strokeWidth={2} />}
                    className="w-full justify-center shadow-sm"
                  >
                    <span className="font-bold">
                      {isExportingPdf
                        ? (isRtl ? 'جاري تجهيز ملف PDF…' : 'Generating PDF…')
                        : (isRtl ? 'تحميل مباشر كملف PDF معتمد' : 'Download Direct ATS PDF')}
                    </span>
                  </Button>

                  {/* Secondary Export Actions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {/* Word (.docx) */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isExportingWord}
                      isLoading={isExportingWord}
                      onClick={handleDownloadWord}
                      leftIcon={<FileText className="w-4 h-4 text-ink-2" />}
                      className="justify-center"
                    >
                      <span>{isRtl ? 'مستند Word (.docx)' : 'Word (.docx)'}</span>
                    </Button>

                    {/* Print / Vector */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      leftIcon={<Printer className="w-4 h-4 text-ink-2" />}
                      className="justify-center"
                    >
                      <span>{isRtl ? 'طباعة مباشرة' : 'Print Document'}</span>
                    </Button>

                    {/* JSON Export */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportJSON}
                      leftIcon={<FileCode className="w-4 h-4 text-ink-2" />}
                      className="justify-center"
                    >
                      <span>{isRtl ? 'نسخة JSON احتياطية' : 'Backup JSON'}</span>
                    </Button>
                  </div>

                  {/* Import JSON */}
                  <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                    <span className="text-xs text-ink-2">
                      {isRtl ? 'هل لديك نسخة سابقة بصيغة JSON؟' : 'Have a previous JSON backup?'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<Upload className="w-3.5 h-3.5 text-brand" />}
                      className="text-xs font-semibold text-brand hover:text-brand-hover cursor-pointer"
                    >
                      <span>{isRtl ? 'استيراد ملف JSON' : 'Import JSON'}</span>
                    </Button>
                  </div>
                </div>

                {/* Templates Selection Card */}
                <div className="bg-surface border border-line-strong rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                        <Layout className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-ink">
                          {isRtl ? 'قوالب السيرة الذاتية' : 'Resume Templates'}
                        </h3>
                        <p className="text-[11px] text-ink-2">
                          {isRtl
                            ? 'اختر من بين 11 قالباً احترافياً معتمداً من مسؤولي التوظيف'
                            : 'Select from 11 recruiter-approved, ATS-tested templates'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-semibold px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 flex items-center gap-1.5 shadow-2xs">
                      <span className="opacity-80">{isRtl ? 'القالب النشط:' : 'Active:'}</span>
                      <span className="font-bold">
                        {isRtl
                          ? TEMPLATES.find((t) => t.id === selectedTemplate)?.nameAr || selectedTemplate
                          : TEMPLATES.find((t) => t.id === selectedTemplate)?.nameEn || selectedTemplate}
                      </span>
                    </div>
                  </div>

                  <TemplateSelector
                    selectedTemplate={selectedTemplate}
                    onSelect={handleTemplateSelect}
                    accentColor={theme.accentColor}
                    isRtl={isRtl}
                  />
                </div>

                {/* Accent Colors Card */}
                <div className="bg-surface border border-line-strong rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-line">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink">
                        {isRtl ? 'اللون الرئيسي للسيرة الذاتية' : 'Accent Color'}
                      </h3>
                      <p className="text-[11px] text-ink-2">
                        {isRtl
                          ? 'يتم تطبيقه على العناوين والخطوط الفاصلة بشكل متناسق'
                          : 'Applied to headings and section dividers'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {colors.map((c) => {
                      const isSelected = theme.accentColor === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => {
                            setTheme((prev) => ({ ...prev, accentColor: c.hex }));
                            triggerDebouncedAutosave();
                          }}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-start transition-all cursor-pointer ${
                            isSelected
                              ? 'border-brand bg-brand/10 ring-2 ring-brand/30 shadow-xs'
                              : 'border-line hover:border-line-strong hover:bg-surface-2'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full shrink-0 shadow-xs flex items-center justify-center"
                            style={{ backgroundColor: c.hex }}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </span>
                          <span className="text-xs font-semibold text-ink truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Typography & Font Settings Card (Font Size & Font Family) */}
                <div className="bg-surface border border-line-strong rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                        <Type className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-ink">
                          {isRtl ? 'حجم الخط ونوع الفونت' : 'Font Size & Family'}
                        </h3>
                        <p className="text-[11px] text-ink-2">
                          {isRtl
                            ? 'تخصيص حجم الخط ونوعه المعتمد والمريح للقراءة وفلاتر ATS'
                            : 'Customize font size and family optimized for ATS parsers'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1. Font Size Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">
                        {isRtl ? 'حجم الخط (Font Size):' : 'Font Size:'}
                      </span>
                      <span className="text-[11px] font-mono text-brand font-medium">
                        {(theme.fontSize || 'base') === 'sm'
                          ? (isRtl ? 'صغير (10-11pt)' : 'Small (10-11pt)')
                          : (theme.fontSize || 'base') === 'lg'
                          ? (isRtl ? 'كبير (12-13.5pt)' : 'Large (12-13.5pt)')
                          : (isRtl ? 'متوسط (11-12pt - موصى به)' : 'Medium (11-12pt - Standard)')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {FONT_SIZE_OPTIONS.map((fs) => {
                        const isSelected = (theme.fontSize || 'base') === fs.id;
                        return (
                          <button
                            key={fs.id}
                            type="button"
                            onClick={() => {
                              setTheme((prev) => ({ ...prev, fontSize: fs.id }));
                              triggerDebouncedAutosave();
                            }}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                              isSelected
                                ? 'border-brand bg-brand/10 ring-2 ring-brand/30 shadow-xs'
                                : 'border-line hover:border-line-strong hover:bg-surface-2'
                            }`}
                          >
                            <span
                              className={`font-bold text-ink ${
                                fs.id === 'sm' ? 'text-xs' : fs.id === 'lg' ? 'text-base' : 'text-sm'
                              }`}
                            >
                              {isRtl ? fs.labelAr : fs.labelEn}
                            </span>
                            <span className="text-[10px] text-ink-2 line-clamp-1">
                              {isRtl ? fs.descAr : fs.descEn}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Font Family Selector */}
                  <div className="space-y-2 pt-2 border-t border-line/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">
                        {isRtl ? 'نوع الفونت (Font Family):' : 'Font Family:'}
                      </span>
                      <span className="text-[11px] text-ink-2 font-mono">
                        {FONT_OPTIONS.find((f) => f.value === theme.fontFamily)?.name || (isRtl ? 'خط المستند' : 'Document Font')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {FONT_OPTIONS.map((font) => {
                        const isSelected = theme.fontFamily === font.value;
                        return (
                          <button
                            key={font.id}
                            type="button"
                            onClick={() => {
                              setTheme((prev) => ({ ...prev, fontFamily: font.value }));
                              triggerDebouncedAutosave();
                            }}
                            className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                              isSelected
                                ? 'border-brand bg-brand/10 ring-2 ring-brand/30 shadow-xs'
                                : 'border-line hover:border-line-strong hover:bg-surface-2'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="text-xs font-bold text-ink truncate">
                                {isRtl ? font.nameAr : font.name}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-line text-ink-2 shrink-0">
                                {font.tag}
                              </span>
                            </div>

                            <p
                              className="text-xs text-ink-2 truncate py-0.5"
                              style={{ fontFamily: font.value }}
                              dir={font.id === 'arabic-plex' ? 'rtl' : 'ltr'}
                            >
                              {font.sample}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Document Language & Paper Size Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Language */}
                  <div className="bg-surface border border-line-strong rounded-2xl p-4 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-brand" />
                      <h4 className="text-xs font-bold text-ink">
                        {isRtl ? 'لغة إخراج المستند والاتجاه' : 'Document Output Language'}
                      </h4>
                    </div>
                    <p className="text-[11px] text-ink-2 leading-relaxed">
                      {isRtl
                        ? 'تحدد اتجاه الـ CV (RTL/LTR) والخط المتوافق مع ATS.'
                        : 'Controls text direction and ATS font encoding.'}
                    </p>
                    <select
                      id="builder-settings-document-language"
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
                      className="w-full text-xs bg-surface-2 border border-line rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-brand cursor-pointer font-medium"
                    >
                      {DOCUMENT_LANGUAGE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.nativeName} ({opt.code.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Paper Size */}
                  <div className="bg-surface border border-line-strong rounded-2xl p-4 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand" />
                      <h4 className="text-xs font-bold text-ink">
                        {isRtl ? 'مقاس الصفحة' : 'Paper Size'}
                      </h4>
                    </div>
                    <p className="text-[11px] text-ink-2 leading-relaxed">
                      {isRtl
                        ? 'A4 للمعايير الدولية، أو Letter لأمريكا وكندا.'
                        : 'A4 for international, Letter for US/Canada.'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaperSize('a4')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          paperSize === 'a4'
                            ? 'bg-brand/10 border-brand text-brand ring-1 ring-brand/30'
                            : 'border-line hover:border-line-strong bg-surface-2 text-ink-2'
                        }`}
                      >
                        A4 (210×297)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaperSize('letter')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          paperSize === 'letter'
                            ? 'bg-brand/10 border-brand text-brand ring-1 ring-brand/30'
                            : 'border-line hover:border-line-strong bg-surface-2 text-ink-2'
                        }`}
                      >
                        US Letter
                      </button>
                    </div>
                  </div>
                </div>

                {/* Return Button to Data Entry */}
                <div className="pt-2 flex justify-center">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setEditorViewMode('data')}
                    leftIcon={<FileText className="w-4 h-4" />}
                    className="px-6 shadow-xs"
                  >
                    <span>{isRtl ? 'العودة لإدخال البيانات والمحتوى ←' : 'Return to Resume Data Entry →'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* 2. Resume Data Entry Form Mode                                            */
              /* ========================================================================= */
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                {/* Active Template Banner with quick link to design settings */}
                <div className="flex items-center justify-between gap-3 p-3 bg-surface border border-line-strong rounded-xl text-xs shadow-xs">
                  <div className="flex items-center gap-2 text-ink-2">
                    <Layout className="w-4 h-4 text-brand" />
                    <span>{isRtl ? 'القالب النشط:' : 'Active Template:'}</span>
                    <span className="font-semibold text-ink capitalize">{selectedTemplate}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block ms-1 shadow-xs"
                      style={{ backgroundColor: theme.accentColor }}
                      title={theme.accentColor}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditorViewMode('design')}
                    className="text-brand hover:underline font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{isRtl ? 'إعدادات شكل وقالب الـ CV ←' : 'CV appearance & template settings →'}</span>
                  </button>
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
            )}
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
