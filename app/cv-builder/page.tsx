'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CvData, CvTemplateId, CvThemeConfig } from './types';
import { sampleCvData, emptyCvData } from './initialData';
import CvSidebar from './components/CvSidebar';
import { CvForm } from './components/CvForm';
import { CvPreview } from './components/CvPreview';
import { exportCvToPdf } from './utils/exportCvPdf';
import { exportCvToDocx } from './utils/exportCvWord';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Download,
  Sparkles,
  FileCheck2,
  Upload,
  FileCode,
  Eye,
  Edit3,
  FileText,
  Sliders,
  Cloud,
  Check,
  Loader2,
  Globe,
  Printer,
  ChevronLeft,
} from 'lucide-react';
import LogoLoader from '../components/LogoLoader';

export default function CvBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [cvId, setCvId] = useState<string | null>(null);
  const [cvTitle, setCvTitle] = useState<string>('My Comprehensive Curriculum Vitae (CV)');
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [cvData, setCvData] = useState<CvData>(sampleCvData);
  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplateId>('europass');
  const [theme, setTheme] = useState<CvThemeConfig>({
    accentColor: '#059669', // Emerald
    fontFamily: 'var(--font-sans), sans-serif',
    fontSize: 'base',
  });

  const [mobileTab, setMobileTab] = useState<'editor' | 'preview' | 'templates'>('editor');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

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

  // Handle Cloud Save (MongoDB & Datastore)
  const handleSaveToCloud = async () => {
    if (!user) {
      alert('Please sign in to save your CV to your cloud account.');
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
        // Update existing document
        res = await fetch(`/api/resumes/${cvId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new document
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
        setSaveMessage('Saved to cloud account successfully!');
        setTimeout(() => setSaveMessage(null), 3500);
      } else {
        const errBody = await res.json().catch(() => ({}));
        setSaveMessage(errBody.error || 'Failed to save to cloud.');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveMessage('Error connecting to cloud.');
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
      await exportCvToPdf('cv-preview', safeName);
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Word (.docx)
  const handleDownloadWord = async () => {
    try {
      setIsExportingWord(true);
      await exportCvToDocx(cvData, theme);
    } catch (err: any) {
      console.error('Word export error:', err);
      alert('Failed to export Word: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExportingWord(false);
    }
  };

  // Print CV
  const handlePrint = () => {
    window.print();
  };

  // Load Sample
  const handleLoadSample = () => {
    if (
      window.confirm(
        'Load the full sample CV for Dr. Ahmed Tarek? This will replace your current editor inputs.'
      )
    ) {
      setCvData(sampleCvData);
    }
  };

  // Clear
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all fields and start fresh?')) {
      setCvData(emptyCvData);
    }
  };

  if (isLoadingDocument) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <LogoLoader text="Loading your Curriculum Vitae..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Bar (Hidden in print) */}
      <header className="print:hidden sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cvTitle}
                onChange={(e) => setCvTitle(e.target.value)}
                className="text-xs sm:text-sm font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-500 outline-none px-1 py-0.5 max-w-[220px] sm:max-w-xs transition-colors"
              />
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                CV STUDIO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 px-1 hidden sm:block">
              Full Multi-Page Curriculum Vitae • 13 Extended Professional Sections
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick PDF button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Quick Cloud Save */}
          <button
            type="button"
            onClick={handleSaveToCloud}
            disabled={isSavingCloud}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
          >
            {isSavingCloud ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Cloud className="w-3.5 h-3.5" />
            )}
            <span>{isSavingCloud ? 'Saving...' : 'Save CV'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar (Hidden on Desktop & Print) */}
      <div className="print:hidden lg:hidden flex bg-slate-900 border-b border-slate-800 p-1 gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'editor'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'preview'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live CV</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('templates')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'templates'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Design</span>
        </button>
      </div>

      {/* Main Body Grid */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Sidebar (Templates & Style) */}
        <div
          className={`print:hidden lg:w-80 xl:w-96 p-3 lg:p-4 border-r border-slate-800/80 overflow-y-auto ${
            mobileTab === 'templates' ? 'block' : 'hidden lg:block'
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

        {/* Center Column: CvForm Editor */}
        <div
          className={`flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto max-w-3xl mx-auto w-full ${
            mobileTab === 'editor' ? 'block' : 'hidden lg:block'
          }`}
        >
          <CvForm data={cvData} onChange={setCvData} />
        </div>

        {/* Right Column: Live A4 Preview */}
        <div
          className={`flex-1 p-2 sm:p-4 lg:p-6 overflow-y-auto bg-slate-950 flex flex-col items-center ${
            mobileTab === 'preview' ? 'block' : 'hidden lg:flex'
          }`}
        >
          <CvPreview data={cvData} template={selectedTemplate} theme={theme} />
        </div>
      </main>
    </div>
  );
}
