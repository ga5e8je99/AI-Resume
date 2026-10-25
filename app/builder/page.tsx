'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResumeData, TemplateId, ThemeConfig } from './types';
import { initialSampleData } from './initialData';
import BuilderSidebar from './components/BuilderSidebar';
import { BuilderForm } from './components/BuilderForm';
import { ResumePreview } from './components/ResumePreview';
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
  Printer,
} from 'lucide-react';
import LogoLoader from '../components/LogoLoader';

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
  certifications: [],
};

export default function BuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeTitle, setResumeTitle] = useState<string>('My Professional Resume');
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [resumeData, setResumeData] = useState<ResumeData>(initialSampleData);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('compact');
  const [theme, setTheme] = useState<ThemeConfig>({
    accentColor: '#2563eb',
    fontFamily: 'var(--font-sans), sans-serif',
    fontSize: 'base',
  });
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview' | 'templates'>('editor');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch resume by ID if opening an existing resume from dashboard
  useEffect(() => {
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
            if (json.resume.templateId) setSelectedTemplate(json.resume.templateId);
            if (json.resume.theme) setTheme(json.resume.theme);
            if (json.resume.title) setResumeTitle(json.resume.title);
          }
        })
        .catch((err) => console.error('Failed to load resume by id:', err));
    }
  }, [searchParams]);

  const handleSaveCloud = async () => {
    if (!user) {
      if (window.confirm('You need to be signed in to save your resume to your cloud account. Go to login?')) {
        router.push(`/login?returnUrl=/builder${resumeId ? `?id=${resumeId}` : ''}`);
      }
      return;
    }

    try {
      setIsSavingCloud(true);
      setSaveMessage(null);

      const payload = {
        title: resumeTitle || `${resumeData.personalInfo?.fullName || 'Untitled'} - Resume`,
        templateId: selectedTemplate,
        theme,
        data: resumeData,
      };

      if (resumeId) {
        // Update existing resume in MongoDB
        const res = await fetch(`/api/resumes/${resumeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update resume');
        setSaveMessage('Saved!');
      } else {
        // Create new resume in MongoDB
        const res = await fetch('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to save resume');
        const json = await res.json();
        if (json.resume?.id) {
          setResumeId(json.resume.id);
          window.history.replaceState(null, '', `/builder?id=${json.resume.id}`);
        }
        setSaveMessage('Saved!');
      }

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving resume to cloud.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleLoadSample = () => {
    if (
      window.confirm(
        'Load pre-filled sample data? This will replace your current entries.'
      )
    ) {
      setResumeData(initialSampleData);
    }
  };

  const handleClear = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all fields? This cannot be undone.'
      )
    ) {
      setResumeData(emptyResumeData);
    }
  };

  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadWord = async () => {
    try {
      setIsExportingWord(true);
      const { exportResumeToDocx } = await import('./utils/exportWord');
      await exportResumeToDocx(resumeData, theme);
    } catch (err) {
      console.error('Word export error:', err);
      alert('Failed to generate Word document. Please try again.');
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const safeName = resumeData.personalInfo.fullName
        ? `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`
        : 'Resume_ATS.pdf';
      const { exportResumeToPdf } = await import('./utils/exportPdf');
      await exportResumeToPdf('resume-preview', safeName);
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert(`Failed to generate PDF: ${err?.message || 'Please try again.'}`);
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
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.personalInfo) {
          setResumeData(parsed);
          alert('Resume data imported successfully!');
        } else {
          alert('Invalid resume JSON format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <header className="print:hidden sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors shrink-0"
              title="Return to homepage"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden text-xs">Back</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 shrink-0" />
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
                <FileCheck2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h1 className="text-xs sm:text-base font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent truncate">
                ATS Builder
              </h1>
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Sparkles className="w-3 h-3" /> 100% Free
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Toggle Templates Sidebar (Desktop) */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isSidebarOpen
                  ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300 shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
              title={isSidebarOpen ? 'Minimize Templates Sidebar' : 'Open Templates Sidebar'}
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isSidebarOpen ? 'Sidebar' : 'Templates & Style'}</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-xs text-slate-300 transition-colors"
              title="Upload previously saved JSON resume"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-xs text-slate-300 transition-colors"
              title="Save a backup copy as JSON"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>

            {/* Save to Cloud Button */}
            <button
              type="button"
              disabled={isSavingCloud}
              onClick={handleSaveCloud}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-white font-semibold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
                saveMessage
                  ? 'bg-emerald-600 shadow-md shadow-emerald-600/30'
                  : 'bg-emerald-700 hover:bg-emerald-600 shadow-md shadow-emerald-700/25'
              }`}
              title="Save resume to your cloud account to edit anytime"
            >
              {isSavingCloud ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : saveMessage ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{saveMessage}</span>
                  <span className="sm:hidden">Saved</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-200" />
                  <span className="hidden sm:inline">{resumeId ? 'Save Changes' : 'Save CV'}</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </button>

            {/* Download Word (.docx) */}
            <button
              type="button"
              disabled={isExportingWord}
              onClick={handleDownloadWord}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-700/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Download editable Microsoft Word document (.docx)"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-200" />
              <span className="hidden sm:inline">{isExportingWord ? 'Exporting...' : 'Word (.docx)'}</span>
              <span className="sm:hidden">{isExportingWord ? '...' : 'Word'}</span>
            </button>

            {/* Direct Download PDF */}
            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Directly download PDF file to computer"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-200" />
              <span className="hidden sm:inline">{isExportingPdf ? 'Saving PDF...' : 'Download PDF'}</span>
              <span className="sm:hidden">{isExportingPdf ? '...' : 'PDF'}</span>
            </button>

            {/* Print / Save Vector PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Print or Save as Vector PDF via browser dialog (preserves 100% selectable text & ATS compatibility)"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              <span className="hidden sm:inline">Print / Vector</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Mobile View Switcher (Tabs) */}
        <div className="print:hidden lg:hidden flex rounded-xl bg-slate-900/90 border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              mobileTab === 'editor'
                ? 'bg-cyan-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              mobileTab === 'preview'
                ? 'bg-cyan-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>A4 Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('templates')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              mobileTab === 'templates'
                ? 'bg-cyan-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Templates</span>
          </button>
        </div>

        {/* 3-Column Responsive Workspace with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left Column: Sidebar (Templates & Style) */}
          <div
            className={`print:hidden shrink-0 transition-all duration-300 ${
              mobileTab === 'templates'
                ? 'block w-full'
                : 'hidden lg:block lg:sticky lg:top-20'
            }`}
          >
            <BuilderSidebar
              selectedTemplate={selectedTemplate}
              onSelectTemplate={(tpl) => {
                setSelectedTemplate(tpl);
              }}
              theme={theme}
              setTheme={setTheme}
              onLoadSample={handleLoadSample}
              onClear={handleClear}
              onDownloadPdf={handleDownloadPdf}
              onDownloadWord={handleDownloadWord}
              onPrint={handlePrint}
              isExportingPdf={isExportingPdf}
              isExportingWord={isExportingWord}
              isCollapsed={!isSidebarOpen}
              onToggleCollapse={() => setIsSidebarOpen((prev) => !prev)}
              onSaveCloud={handleSaveCloud}
              isSavingCloud={isSavingCloud}
              saveMessage={saveMessage}
            />
          </div>

          {/* Middle Column: Form Editor */}
          <div
            className={`space-y-4 print:hidden transition-all duration-300 ${
              mobileTab === 'editor'
                ? 'block w-full'
                : mobileTab === 'preview' || mobileTab === 'templates'
                ? 'hidden lg:block'
                : 'hidden lg:block'
            } ${
              isSidebarOpen
                ? 'lg:w-[45%] xl:w-[48%]'
                : 'lg:w-[50%] xl:w-[52%]'
            } flex-1`}
          >
            <BuilderForm data={resumeData} onChange={setResumeData} />
          </div>

          {/* Right Column: Live Sticky A4 Preview */}
          <div
            className={`transition-all duration-300 ${
              mobileTab === 'preview'
                ? 'block w-full'
                : 'hidden lg:block'
            } lg:sticky lg:top-20 print:!block print:!w-full print:!m-0 print:!p-0 flex-1 min-w-0`}
          >
            <ResumePreview
              data={resumeData}
              template={selectedTemplate}
              theme={theme}
            />
          </div>
        </div>
      </main>

      {/* Animated Logo Loading Overlay during PDF/Word Export */}
      {(isExportingPdf || isExportingWord) && (
        <LogoLoader
          text={isExportingPdf ? 'Generating PDF Resume...' : 'Generating Word Document...'}
          subtext="Formatting high-precision ATS template..."
          size="md"
          fullScreen
        />
      )}
    </div>
  );
}
