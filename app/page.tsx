'use client';

import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Logo from './components/Logo';
import { resumes } from './contents/index';
import ResumeCard from './components/ResumeCard';
import { useLanguage } from './context/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  CheckCircle,
  Sparkles,
  ChevronRight,
  Shield,
  Zap,
  Search,
  FileCheck2,
  Clock,
  ArrowRight,
  FileText,
  AlertCircle,
  HelpCircle,
  Lock,
  Download,
  Sliders,
  Layers,
} from 'lucide-react';
import { extractTextFromFile } from './lib/pdfExtractor';

export default function Home() {
  const router = useRouter();
  const { t, isRtl } = useLanguage();

  // Uploader State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [extractedCharCount, setExtractedCharCount] = useState<number | null>(null);

  const processSelectedFile = async (file: File) => {
    try {
      setIsProcessingFile(true);
      setFileError(null);
      setUploadedFile(file);
      setExtractedCharCount(null);

      // 1. Validate File Size (Max 5MB)
      const MAX_SIZE_BYTES = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE_BYTES) {
        throw new Error(
          `File size is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum supported file size is 5MB.`
        );
      }

      // 2. Validate Supported Extensions
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'txt') {
        throw new Error(
          `Format ".${ext}" is not directly parseable by our client-side scanner. Please upload a PDF or TXT file, or build directly in our ATS Resume Builder.`
        );
      }

      // 3. Extract text
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 25) {
        throw new Error(
          'Could not extract readable digital text from this file. Ensure the PDF contains digital text, not only scanned photos.'
        );
      }

      setExtractedCharCount(text.trim().length);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('jobmatch_resume_text', text);
        sessionStorage.setItem('jobmatch_resume_filename', file.name);
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      setFileError(err.message || 'Failed to parse file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      <div>
        <Navbar />

        {/* HERO SECTION */}
        <section className="container mx-auto px-4 sm:px-6 py-12 md:py-20 text-center max-w-5xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 rounded-full mb-6 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs sm:text-sm font-semibold text-cyan-200">
              {t('hero_badge')}
            </span>
          </div>

          {/* Main H1 Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-tight">
            {t('hero_title_prefix')}{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              {t('hero_title_highlight')}
            </span>{' '}
            {t('hero_title_suffix')}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('hero_desc')}
          </p>

          {/* Two Clear Paths Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto mb-16 text-left rtl:text-right">
            {/* Path 1: Build New */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/30 shadow-xl flex flex-col justify-between hover:border-cyan-500/60 transition-all">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    01
                  </div>
                  <h2 className="text-lg font-bold text-white">{t('hero_cta_create')}</h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {t('hero_cta_create_desc')}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                <Link
                  href="/builder"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-lg shadow-cyan-500/20 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('nav_resume_builder')}</span>
                  <ChevronRight className={`w-4 h-4 ml-auto rtl:ml-0 rtl:mr-auto ${isRtl ? 'rotate-180' : ''}`} />
                </Link>

                <Link
                  href="/cv-builder"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-semibold py-2 px-4 rounded-xl text-xs transition-colors"
                >
                  <span>{t('nav_cv_builder')} (PRO) →</span>
                </Link>
              </div>
            </div>

            {/* Path 2: Analyze Existing */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-indigo-500/30 shadow-xl flex flex-col justify-between hover:border-indigo-500/60 transition-all">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    02
                  </div>
                  <h2 className="text-lg font-bold text-white">{t('hero_cta_analyze')}</h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {t('hero_cta_analyze_desc')}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                <a
                  href="#upload"
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>{t('hero_cta_analyze')}</span>
                  <ChevronRight className={`w-4 h-4 ml-auto rtl:ml-0 rtl:mr-auto ${isRtl ? 'rotate-180' : ''}`} />
                </a>

                <Link
                  href="/review"
                  className="w-full inline-flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 py-2 px-4 text-xs font-semibold"
                >
                  <span>{t('upload_sample_btn')} →</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Honest Technical Capabilities */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
            {[
              { stat: "400+", label: t('hero_metric_skills'), icon: <Search className="w-4 h-4 text-cyan-400" /> },
              { stat: "100%", label: t('hero_metric_privacy'), icon: <Shield className="w-4 h-4 text-emerald-400" /> },
              { stat: "ISO A4", label: t('hero_metric_export'), icon: <FileCheck2 className="w-4 h-4 text-blue-400" /> },
              { stat: "< 2s", label: "< 2s Diagnostic Speed", icon: <Zap className="w-4 h-4 text-amber-400" /> },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md text-center flex flex-col items-center justify-center"
              >
                <div className="mb-2 p-2 rounded-lg bg-slate-800/80">{item.icon}</div>
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">{item.stat}</div>
                <div className="text-xs text-slate-400 leading-tight">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CORE PLATFORM SERVICES SECTION (Moved from Navbar for a clean, professional UX) */}
        <section id="services" className="container mx-auto px-4 sm:px-6 mb-20 scroll-mt-24">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('services_tag')}</span>
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
              {t('services_title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {t('services_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
            {/* 1. AI Cover Letter Generator */}
            <div className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 p-6 flex flex-col justify-between backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5">
              <div className="absolute top-0 inset-x-6 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    {t('service_cover_badge')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  {t('service_cover_title')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {t('service_cover_desc')}
                </p>
              </div>

              <Link
                href="/cover-letter"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 text-amber-300 hover:text-slate-950 font-bold text-xs transition-all shadow-sm group-hover:shadow-md"
              >
                <span>{t('service_cover_action')}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              </Link>
            </div>

            {/* 2. ATS Resume Builder */}
            <div className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 p-6 flex flex-col justify-between backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5">
              <div className="absolute top-0 inset-x-6 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    {t('service_resume_badge')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {t('service_resume_title')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {t('service_resume_desc')}
                </p>
              </div>

              <Link
                href="/builder"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 border border-cyan-500/30 text-cyan-300 hover:text-slate-950 font-bold text-xs transition-all shadow-sm group-hover:shadow-md"
              >
                <span>{t('service_resume_action')}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              </Link>
            </div>

            {/* 3. Academic & Executive CV Builder */}
            <div className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-6 flex flex-col justify-between backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5">
              <div className="absolute top-0 inset-x-6 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    {t('service_cv_badge')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  {t('service_cv_title')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {t('service_cv_desc')}
                </p>
              </div>

              <Link
                href="/cv-builder"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 text-emerald-300 hover:text-slate-950 font-bold text-xs transition-all shadow-sm group-hover:shadow-md"
              >
                <span>{t('service_cv_action')}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              </Link>
            </div>

            {/* 4. ATS Diagnostic & Review */}
            <div className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 p-6 flex flex-col justify-between backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5">
              <div className="absolute top-0 inset-x-6 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                    {t('service_review_badge')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  {t('service_review_title')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {t('service_review_desc')}
                </p>
              </div>

              <Link
                href="/review"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/30 text-indigo-300 hover:text-slate-950 font-bold text-xs transition-all shadow-sm group-hover:shadow-md"
              >
                <span>{t('service_review_action')}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </div>
        </section>

        {/* RESUME UPLOAD SECTION */}
        <section id="upload" className="container mx-auto px-4 sm:px-6 mb-20 scroll-mt-24">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-3xl mx-auto backdrop-blur-xl shadow-2xl">
            <div className="text-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full inline-block mb-3">
                {t('upload_section_tag')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {t('upload_section_title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {t('upload_section_desc')}
              </p>
            </div>

            {/* Dropzone container */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="bg-slate-950/50 border-2 border-dashed border-slate-700 hover:border-cyan-500/60 transition-colors rounded-2xl p-6 sm:p-8 text-center"
            >
              {/* Screen reader status announcement */}
              <div role="status" aria-live="polite" className="sr-only">
                {isProcessingFile
                  ? 'Extracting resume text, please wait'
                  : fileError
                  ? `Upload error: ${fileError}`
                  : uploadedFile
                  ? `Resume text extracted successfully for ${uploadedFile.name}`
                  : 'Resume uploader ready'}
              </div>

              {isProcessingFile ? (
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-3 border-cyan-400 border-t-transparent animate-spin mb-4" />
                  <h3 className="text-base font-bold text-white mb-1">
                    {t('upload_submitting_btn')}
                  </h3>
                  <p className="text-xs text-cyan-300">
                    {t('upload_privacy_notice')}
                  </p>
                </div>
              ) : fileError ? (
                <div className="py-4">
                  <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-rose-300 mb-1">
                    {t('common_error')}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto mb-4">{fileError}</p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFileError(null);
                        setUploadedFile(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                    >
                      {t('upload_clear_btn')}
                    </button>
                    <Link
                      href="/review"
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors"
                    >
                      {t('upload_sample_btn')} →
                    </Link>
                  </div>
                </div>
              ) : uploadedFile ? (
                <div className="py-2">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
                    <span>✓ {t('common_success')}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-0.5 truncate max-w-md mx-auto">
                    {uploadedFile.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {formatFileSize(uploadedFile.size)} • {extractedCharCount?.toLocaleString()} {t('upload_file_chars')}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setFileError(null);
                        setExtractedCharCount(null);
                      }}
                      className="text-slate-400 hover:text-white text-xs transition-colors px-3 py-2 rounded-xl border border-slate-700"
                    >
                      {t('upload_clear_btn')}
                    </button>

                    <Link
                      href="/review"
                      className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>{t('upload_submit_btn')} →</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-1">
                    {t('upload_drop_title')}
                  </h3>
                  <p className="text-xs text-slate-300 mb-4">
                    {t('upload_drop_sub')}
                  </p>

                  <label className="inline-block bg-white text-slate-900 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors shadow-md focus-within:ring-2 focus-within:ring-cyan-400">
                    {t('upload_drop_browse')}
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,.txt"
                      onChange={handleFileUpload}
                    />
                  </label>
                </>
              )}
            </div>

            {/* Privacy Guarantee Note */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-slate-400 text-xs leading-relaxed">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-200">{t('hero_metric_privacy')}:</strong> {t('upload_privacy_notice')}
              </p>
            </div>
          </div>
        </section>

        {/* TEMPLATE SHOWCASE SECTION */}
        <section id="templates" className="container mx-auto px-4 sm:px-6 mb-20 scroll-mt-24">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full inline-block mb-3">
              {t('templates_tag')}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              {t('templates_title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              {t('templates_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        </section>

        {/* VALUE PILLARS */}
        <section className="container mx-auto px-4 sm:px-6 mb-20">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full inline-block mb-3">
              {t('pillars_tag')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {t('pillars_title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              {t('pillars_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {[
              {
                number: "01",
                title: t('pillar_1_title'),
                desc: t('pillar_1_desc'),
              },
              {
                number: "02",
                title: t('pillar_2_title'),
                desc: t('pillar_2_desc'),
              },
              {
                number: "03",
                title: t('pillar_3_title'),
                desc: t('pillar_3_desc'),
              },
              {
                number: "04",
                title: t('pillar_4_title'),
                desc: t('pillar_4_desc'),
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl font-extrabold text-cyan-400 mb-2 font-mono">
                    {step.number}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{step.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="container mx-auto px-4 sm:px-6 mb-16 max-w-4xl text-center">
          <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 shadow-2xl">
            <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {t('hero_title_prefix')} {t('hero_title_highlight')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-6">
              {t('hero_desc')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/builder"
                className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-lg transition-colors inline-flex items-center gap-2"
              >
                <span>{t('hero_cta_create')}</span>
                <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Link>
              <a
                href="#upload"
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm py-3 px-6 rounded-xl border border-slate-700 transition-colors inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>{t('hero_cta_analyze')}</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-xl py-8 px-4 sm:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span>&copy; {new Date().getFullYear()} JobMatch AI. {t('footer_rights')}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/builder" className="hover:text-slate-200 transition-colors">
              {t('nav_resume_builder')}
            </Link>
            <Link href="/cv-builder" className="hover:text-slate-200 transition-colors">
              {t('nav_cv_builder')}
            </Link>
            <Link href="/cover-letter" className="hover:text-slate-200 transition-colors">
              {t('nav_cover_letter')}
            </Link>
            <Link href="/review" className="hover:text-slate-200 transition-colors">
              {t('nav_ats_review')}
            </Link>
            <Link href="/privacy" className="hover:text-slate-200 transition-colors">
              {t('footer_privacy')}
            </Link>
            <Link href="/terms" className="hover:text-slate-200 transition-colors">
              {t('footer_terms')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}