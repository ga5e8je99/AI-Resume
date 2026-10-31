'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CvData, CvTemplateId, CvThemeConfig } from './types';
import { sampleCvData, emptyCvData } from './initialData';
import CvSidebar from './components/CvSidebar';
import { CvForm } from './components/CvForm';
import { CvPreview } from './components/CvPreview';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Download,
  Eye,
  Edit3,
  FileText,
  Sliders,
  Cloud,
  Check,
  Loader2,
  Printer,
} from 'lucide-react';
import LogoLoader from '../components/LogoLoader';
import { UserMenu } from '@/components/layout/UserMenu';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useLanguage } from '../context/LanguageContext';
import {
  DocumentLanguage,
  getStoredDocumentLanguage,
  getDocumentFontFamily,
} from '../lib/documentI18n';

export default function CvBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language, isRtl, formatRelativeTime } = useLanguage();
  const isAr = language === 'ar';

  const [cvId, setCvId] = useState<string | null>(null);
  const [cvTitle, setCvTitle] = useState<string>('My Comprehensive Curriculum Vitae (CV)');
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [cvData, setCvData] = useState<CvData>(sampleCvData);
  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplateId>('europass');
  const [theme, setTheme] = useState<CvThemeConfig>({
    accentColor: '#0F5C4D',
    fontFamily: language === 'ar' ? 'var(--font-arabic), var(--font-sans), sans-serif' : 'var(--font-sans), sans-serif',
    fontSize: 'base',
    documentLanguage: (language as DocumentLanguage) || 'en',
  });

  const [mobileTab, setMobileTab] = useState<'editor' | 'preview' | 'templates'>('editor');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  // Autosave indicator state
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number>(Date.now());
  const [autosaveText, setAutosaveText] = useState<string>(t('common_saved_just_now'));

  // Initialize documentLanguage independently from stored preference
  useEffect(() => {
    const stored = getStoredDocumentLanguage();
    if (stored) {
      setTheme((prev) => ({
        ...prev,
        documentLanguage: stored,
        fontFamily: stored === 'ar' ? getDocumentFontFamily('ar') : prev.fontFamily,
      }));
    }
  }, []);

  useEffect(() => {
    const updateAutosaveString = () => {
      const diffSec = Math.floor((Date.now() - lastSavedTimestamp) / 1000);
      if (diffSec < 5) {
        setAutosaveText(t('common_saved_just_now'));
      } else {
        setAutosaveText(formatRelativeTime(lastSavedTimestamp));
      }
    };

    const interval = setInterval(updateAutosaveString, 4000);
    return () => clearInterval(interval);
  }, [lastSavedTimestamp, t, formatRelativeTime]);

  // Local persistence with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          'jobmatch_cv_builder_cache',
          JSON.stringify({
            cvTitle,
            cvData,
            selectedTemplate,
            theme,
          })
        );
        setLastSavedTimestamp(Date.now());
        setAutosaveText(t('common_saved_just_now'));
      } catch {
        // Intentionally ignored: localStorage autosave is best-effort and may fail in private browsing
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [cvData, cvTitle, selectedTemplate, theme, t]);

  // Load CV if ?id=... is present in URL
  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) return;

    const fetchExistingCv = async () => {
      try {
        setIsLoadingDocument(true);
        const res = await fetch(`/api/resumes/${id}`);
        if (res.ok) {
          const body = await res.json();
          const doc = body.resume;
          if (doc) {
            setCvId(doc.id || doc._id);
            if (doc.title) setCvTitle(doc.title);
            if (doc.templateId) setSelectedTemplate(doc.templateId as CvTemplateId);
            if (doc.theme) setTheme(doc.theme);
            if (doc.data) {
              setCvData({
                ...emptyCvData,
                ...doc.data,
                documentType: 'cv',
              });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching CV by ID:', err);
      } finally {
        setIsLoadingDocument(false);
      }
    };

    fetchExistingCv();
  }, [searchParams]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  // Handle Cloud Save
  const handleSaveToCloud = async () => {
    if (!user) {
      toast.info('Please sign in to save your CV to your cloud account.');
      router.push('/login?returnUrl=/cv-builder');
      return;
    }

    try {
      setIsSavingCloud(true);
      setSaveMessage(null);

      const titleToSave =
        cvTitle ||
        (cvData.personalInfo?.fullName
          ? `${cvData.personalInfo.fullName} - CV`
          : 'My Curriculum Vitae');

      const payload = {
        title: titleToSave,
        templateId: selectedTemplate,
        theme,
        data: {
          ...cvData,
          documentType: 'cv',
        },
      };

      let res;
      if (cvId) {
        res = await fetch(`/api/resumes/${cvId}`, {
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
        const savedDoc = body.resume;
        if (savedDoc && (savedDoc.id || savedDoc._id)) {
          setCvId(savedDoc.id || savedDoc._id);
        }
        setSaveMessage('Saved');
        toast.success('CV saved to cloud successfully');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const errBody = await res.json().catch(() => ({}));
        const errMsg = errBody.error || 'Failed to save';
        setSaveMessage(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      console.error('Save error:', err);
      setSaveMessage('Error connecting to cloud');
      toast.error('Network error while saving to cloud');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Export PDF
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const safeName = cvData.personalInfo?.fullName
        ? `${cvData.personalInfo.fullName.replace(/\s+/g, '_')}_CV.pdf`
        : 'Curriculum_Vitae.pdf';
      const { exportCvToPdf } = await import('./utils/exportCvPdf');
      await exportCvToPdf('cv-preview', safeName);
      toast.success('PDF exported successfully');
    } catch (err: any) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Word (.docx)
  const handleDownloadWord = async () => {
    try {
      setIsExportingWord(true);
      const { exportCvToDocx } = await import('./utils/exportCvWord');
      await exportCvToDocx(cvData, theme);
      toast.success('Word document (.docx) exported successfully');
    } catch (err: any) {
      console.error('Word export error:', err);
      toast.error('Failed to export Word: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExportingWord(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLoadSample = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Load Sample CV Data?',
      message: 'This will replace your current editor inputs with structured sample data. Are you sure you want to proceed?',
      confirmText: 'Load Sample Data',
      cancelText: 'Cancel',
      variant: 'warning',
      onConfirm: () => {
        setCvData(sampleCvData);
        setConfirmModal(null);
        toast.success('Sample CV data loaded');
      },
    });
  };

  const handleClear = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear All CV Fields?',
      message: 'This will reset all sections in your CV to blank fields. This action cannot be undone.',
      confirmText: 'Clear All Fields',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        setCvData(emptyCvData);
        setConfirmModal(null);
        toast.success('All CV fields cleared');
      },
    });
  };

  if (isLoadingDocument) {
    return (
      <div className="min-h-[100dvh] bg-paper flex flex-col items-center justify-center text-ink">
        <LogoLoader text={t('cv_loading')} />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-paper text-ink flex flex-col selection:bg-accent-soft selection:text-accent overflow-x-clip">
      {/* Top Header Bar */}
      <header className="print:hidden sticky top-0 z-40 bg-surface border-b border-line px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-[6px] text-ink-2 hover:text-ink hover:bg-surface-2 border border-line transition-colors"
            title={t('common_back_to_dashboard')}
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" strokeWidth={1.5} />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cvTitle}
                onChange={(e) => setCvTitle(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-ink bg-transparent border-b border-transparent hover:border-line focus:border-accent outline-none px-1 py-0.5 max-w-[180px] sm:max-w-xs transition-colors"
              />
              <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-ink-3 font-mono px-2 py-0.5 rounded-[4px] bg-surface-2 border border-line">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>{autosaveText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Word (.docx) Export */}
          <button
            type="button"
            onClick={handleDownloadWord}
            disabled={isExportingWord}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-xs font-medium bg-surface hover:bg-surface-2 border border-line text-ink transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.5} />
            <span>{isExportingWord ? t('common_exporting') : t('common_word')}</span>
          </button>

          {/* Cloud Save */}
          <button
            type="button"
            onClick={handleSaveToCloud}
            disabled={isSavingCloud}
            className="px-3 py-1.5 rounded-[6px] text-xs font-medium bg-surface hover:bg-surface-2 border border-line text-ink flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSavingCloud ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveMessage ? (
              <Check className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.5} />
            )}
            <span>{isSavingCloud ? t('common_saving') : saveMessage || t('common_save_cloud')}</span>
          </button>

          {/* Export PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="px-3.5 py-1.5 rounded-[6px] text-xs font-medium bg-accent hover:bg-accent-hover text-on-accent flex items-center gap-1.5 shadow-subtle transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-on-accent" strokeWidth={1.5} />
            )}
            <span>{isExportingPdf ? t('common_exporting') : t('common_export_pdf')}</span>
          </button>

          {/* User Account Menu */}
          <UserMenu variant="compact" />
        </div>
      </header>

      {/* Main 3-Pane Responsive Workspace */}
      <main className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 flex-1 flex flex-col space-y-4">
        {/* Template Selector Top Horizontal Scroll Tabs (1024-1279px) */}
        <div className="hidden lg:flex xl:hidden overflow-x-auto gap-2 pb-2 border-b border-line shrink-0">
          {(['executive', 'academic', 'classic-cv'] as CvTemplateId[]).map((tplId) => (
            <button
              key={tplId}
              type="button"
              onClick={() => setSelectedTemplate(tplId)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedTemplate === tplId
                  ? 'bg-accent-soft text-accent font-semibold border border-accent/20'
                  : 'bg-surface text-ink-2 hover:text-ink border border-line'
              }`}
            >
              {tplId === 'executive' ? 'Executive CV' : tplId === 'academic' ? 'Academic CV' : 'Classic CV'}
            </button>
          ))}
        </div>

        {/* Workspace Columns */}
        <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-w-0">
          {/* Left Column: Sidebar (Templates & Style, xl:block >=1280px) */}
          <div
            className={`print:hidden shrink-0 transition-all ${
              mobileTab === 'templates'
                ? 'block w-full'
                : 'hidden xl:block xl:w-72 xl:sticky xl:top-20'
            }`}
          >
            <CvSidebar
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
              theme={theme}
              setTheme={setTheme}
              onLoadSample={handleLoadSample}
              onClear={handleClear}
              onDownloadPdf={handleDownloadPdf}
              onDownloadWord={handleDownloadWord}
              onPrint={handlePrint}
              isExportingPdf={isExportingPdf}
              isExportingWord={isExportingWord}
              onSaveCloud={handleSaveToCloud}
              isSavingCloud={isSavingCloud}
              saveMessage={saveMessage}
            />
          </div>

          {/* Center Column: Form Editor */}
          <div
            className={`space-y-4 print:hidden transition-all flex-1 min-w-0 ${
              mobileTab === 'editor'
                ? 'block w-full'
                : 'hidden lg:block'
            }`}
          >
            <CvForm data={cvData} onChange={setCvData} />
          </div>

          {/* Right Column: Live A4 Preview */}
          <div
            className={`transition-all flex-1 min-w-0 ${
              mobileTab === 'preview'
                ? 'block w-full'
                : 'hidden lg:block'
            } lg:sticky lg:top-20 print:!block print:!w-full print:!m-0 print:!p-0`}
          >
            <CvPreview data={cvData} template={selectedTemplate} theme={theme} />
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Bar (<1024px) */}
      <div className="print:hidden lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line py-2 px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between shadow-card">
        <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-[6px] border border-line text-xs">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`px-3 py-1.5 rounded-[4px] transition-colors ${
              mobileTab === 'editor' ? 'bg-surface font-semibold text-ink shadow-subtle' : 'text-ink-2'
            }`}
          >
            {isAr ? 'المحرر' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`px-3 py-1.5 rounded-[4px] transition-colors ${
              mobileTab === 'preview' ? 'bg-surface font-semibold text-ink shadow-subtle' : 'text-ink-2'
            }`}
          >
            {isAr ? 'المعاينة' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('templates')}
            className={`px-3 py-1.5 rounded-[4px] transition-colors ${
              mobileTab === 'templates' ? 'bg-surface font-semibold text-ink shadow-subtle' : 'text-ink-2'
            }`}
          >
            {isAr ? 'القوالب' : 'Templates'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isExportingPdf}
          className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-medium rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-subtle"
        >
          <Download className="w-3.5 h-3.5 text-on-accent" strokeWidth={1.5} />
          <span>{isAr ? 'تحميل' : 'Download'}</span>
        </button>
      </div>

      {/* Loading Overlay */}
      {(isExportingPdf || isExportingWord) && (
        <LogoLoader
          text={
            isExportingPdf
              ? isAr
                ? 'جاري تصدير ملف PDF...'
                : 'Exporting PDF...'
              : isAr
              ? 'جاري تصدير ملف Word...'
              : 'Exporting Word...'
          }
          subtext={isAr ? 'جاري تنسيق صفحات السيرة الذاتية المهنية...' : 'Formatting multi-page CV layout...'}
          size="md"
          fullScreen
        />
      )}

      {/* Confirmation Dialog for Destructive Actions */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
