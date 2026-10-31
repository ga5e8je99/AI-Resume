'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { trackAtsScanCompleted } from '@/lib/analytics';
import { analyzeResumeText, ATSAnalysisResult } from '../lib/atsAnalyzer';
import { getSampleProfile } from '../lib/sampleResumes';
import { Button } from '../components/ui/Button';
import { Dropzone } from '../components/ui/Dropzone';
import { Dialog } from '../components/ui/Dialog';
import { Textarea } from '../components/ui/Textarea';
import { Toast, useToast } from '../components/ui/Toast';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { CircularGauge } from '@/components/ui/CircularGauge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import Footer from '../components/Footer';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  Edit,
  Upload,
  Search,
  Copy,
  Check,
  FileText,
  ArrowRight,
  ExternalLink,
  Printer,
  Sparkles,
  Share2,
  RefreshCw,
  Sliders,
  Layers,
  FileCheck,
  UserCheck,
  Flame,
  Globe,
  Info,
} from 'lucide-react';
import { ResumeData } from '../builder/types';
import { DOCUMENT_LANGUAGE_OPTIONS } from '../lib/documentI18n';

export type ProcessingStage =
  | 'idle'
  | 'reading'
  | 'extracting'
  | 'analyzing'
  | 'scoring'
  | 'complete'
  | 'error';

interface StageDefinition {
  id: ProcessingStage;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
}

const STAGES: StageDefinition[] = [
  {
    id: 'reading',
    labelEn: 'Reading file',
    labelAr: 'قراءة الملف',
    descEn: 'Validating format and loading document byte stream...',
    descAr: 'التحقق من الصيغة وقراءة محتويات الملف الرقمية...',
  },
  {
    id: 'extracting',
    labelEn: 'Extracting text',
    labelAr: 'استخراج النصوص',
    descEn: 'Extracting digital text layers and normalizing Unicode/Arabic...',
    descAr: 'استخراج الطبقات النصية ومعالجة الخطوط والاتجاهات...',
  },
  {
    id: 'analyzing',
    labelEn: 'Analyzing keywords',
    labelAr: 'مطابقة الكلمات',
    descEn: 'Comparing against 400+ industry skills & contact integrity...',
    descAr: 'مطابقة المهارات مع معايير الصناعة والتأكد من بيانات الاتصال...',
  },
  {
    id: 'scoring',
    labelEn: 'Scoring',
    labelAr: 'احتساب التقييم',
    descEn: 'Computing ATS compatibility metrics & tailored suggestions...',
    descAr: 'حساب نقاط التوافق مع أنظمة الفرز وتوليد التوصيات...',
  },
];

export default function ReviewResultPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, isRtl, language } = useLanguage();
  const isAr = language === 'ar';
  const searchParams = useSearchParams();
  const sampleParam =
    searchParams.get('sample') || searchParams.get('template') || searchParams.get('role');
  const initialProfile = getSampleProfile(sampleParam);

  const [resumeText, setResumeText] = useState<string>(initialProfile.text);
  const [resumeFileName, setResumeFileName] = useState<string>(initialProfile.fileName);
  const [targetJobDescription, setTargetJobDescription] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>(initialProfile.role);
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult>(() =>
    analyzeResumeText(initialProfile.text, initialProfile.role, '')
  );

  // Processing & Staged Progress states
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<{ message: string; isScanned: boolean } | null>(null);

  // Modals & UI helpers
  const [showJdModal, setShowJdModal] = useState(false);
  const [showRawTextModal, setShowRawTextModal] = useState(false);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toast = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCancelledRef = useRef<boolean>(false);

  const handleCancelProcessing = () => {
    isCancelledRef.current = true;
    setProcessingStage('idle');
    setProcessingProgress(0);
  };

  // Sync toastMessage with global toast
  useEffect(() => {
    if (toastMessage) {
      toast.success(toastMessage);
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, toast]);

  // Sync uploadError with global toast
  useEffect(() => {
    if (uploadError) {
      toast.error(uploadError.message);
    }
  }, [uploadError, toast]);

  // Sync state on query param or session storage
  useEffect(() => {
    const profile = getSampleProfile(sampleParam);
    if (sampleParam) {
      setResumeText(profile.text);
      setResumeFileName(profile.fileName);
      setTargetRole(profile.role);
      const res = analyzeResumeText(profile.text, profile.role, '');
      setAnalysisResult(res);
      trackAtsScanCompleted(res.overallScore, res.metrics.matchLabel);
      return;
    }

    if (typeof window !== 'undefined') {
      const storedText = sessionStorage.getItem('jobmatch_resume_text');
      const storedName = sessionStorage.getItem('jobmatch_resume_filename');
      if (storedText && storedText.trim().length > 20) {
        setResumeText(storedText);
        setResumeFileName(storedName || 'Uploaded_Resume.pdf');
        const res = analyzeResumeText(storedText, profile.role, '');
        setAnalysisResult(res);
        trackAtsScanCompleted(res.overallScore, res.metrics.matchLabel);
      }
    }
  }, [sampleParam]);

  const runAnalysis = (text: string, jd?: string, role?: string) => {
    const res = analyzeResumeText(
      text,
      role || targetRole,
      jd !== undefined ? jd : targetJobDescription
    );
    setAnalysisResult(res);
    trackAtsScanCompleted(res.overallScore, res.metrics.matchLabel);
  };

  // Staged multi-step file processing
  const processUploadedFile = async (file: File) => {
    setUploadError(null);

    // Initial validations
    if (file.size === 0) {
      setUploadError({
        message: isAr
          ? 'الملف فارغ (0 بايت). يرجى التأكد من اختيار ملف سيرة ذاتية صحيح.'
          : 'The uploaded file is empty (0 bytes). Please upload a valid document.',
        isScanned: false,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError({
        message: isAr
          ? 'حجم الملف يتجاوز الحد الأقصى (5 ميجابايت). يرجى ضغط الملف أو استخدام منشئ السير الذاتية.'
          : 'File size exceeds 5MB limit. Please compress the file or use our Resume Builder.',
        isScanned: false,
      });
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext || '')) {
      setUploadError({
        message: isAr
          ? `نوع الملف (.${ext}) غير مدعوم. يرجى اختيار ملف بصيغة PDF أو DOCX أو TXT.`
          : `Unsupported file format (.${ext}). Please upload a PDF, DOCX, or TXT resume.`,
        isScanned: false,
      });
      return;
    }

    try {
      isCancelledRef.current = false;

      // Stage 1: Reading file
      setProcessingStage('reading');
      setProcessingProgress(25);
      await new Promise((r) => setTimeout(r, 280));
      if (isCancelledRef.current) return;

      // Stage 2: Extracting text
      setProcessingStage('extracting');
      setProcessingProgress(50);
      const { extractTextFromFile } = await import('../lib/pdfExtractor');
      const text = await extractTextFromFile(file);
      if (isCancelledRef.current) return;

      if (!text || text.trim().length < 25) {
        throw new Error(
          isAr
            ? 'تعذر استخراج نصوص رقمية من هذا الملف. تأكد من أن المستند غير مصور ولا يحتاج لكلمة مرور.'
            : 'Could not extract digital text. Please ensure the PDF is not an image-only scan or password-protected.'
        );
      }

      // Stage 3: Analyzing keywords
      setProcessingStage('analyzing');
      setProcessingProgress(75);
      await new Promise((r) => setTimeout(r, 320));
      if (isCancelledRef.current) return;

      // Stage 4: Scoring
      setProcessingStage('scoring');
      setProcessingProgress(95);
      await new Promise((r) => setTimeout(r, 260));
      if (isCancelledRef.current) return;

      setResumeText(text);
      setResumeFileName(file.name);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('jobmatch_resume_text', text);
        sessionStorage.setItem('jobmatch_resume_filename', file.name);
      }

      runAnalysis(text, targetJobDescription);

      setProcessingProgress(100);
      setProcessingStage('complete');
      setTimeout(() => setProcessingStage('idle'), 400);

      setToastMessage(t('review_toast_scanned'));
    } catch (err: any) {
      console.error('File extraction error:', err);
      const msg = err.message || '';
      const isScanned =
        msg.includes('scanned image') ||
        msg.includes('selectable text') ||
        msg.includes('image-only');

      setProcessingStage('error');
      setUploadError({
        message:
          msg ||
          (isAr
            ? 'تعذر قراءة هذا المستند. يرجى التأكد من رفع ملف PDF رقمي قابل للتحديد.'
            : 'Failed to read document contents. Please ensure the file has selectable text.'),
        isScanned,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleLoadSample = (sampleKey: string) => {
    const profile = getSampleProfile(sampleKey);
    setResumeText(profile.text);
    setResumeFileName(profile.fileName);
    setTargetRole(profile.role);
    runAnalysis(profile.text, targetJobDescription, profile.role);
    setToastMessage(`${profile.fileName}`);
  };

  const handleCopyKeyword = (keyword: string) => {
    navigator.clipboard.writeText(keyword);
    setCopiedKeyword(keyword);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareReport = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage(t('review_toast_link_copied'));
    }
  };

  // Fix with Builder CTA Handler
  const handleFixWithBuilder = () => {
    const lines = resumeText.split('\n').map((l) => l.trim()).filter(Boolean);
    const fullName = lines[0] && lines[0].length < 45 ? lines[0] : 'My Name';
    const email = contactInfo.email || '';
    const phone = contactInfo.phone || '';
    const location = contactInfo.hasLocation
      ? resumeText.match(/(?:[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}|[A-Z][a-zA-Z\s]+,\s*[A-Za-z\s]+)/)?.[0] || ''
      : '';
    const linkedin = contactInfo.linkedIn || '';
    const summaryLine = lines.slice(1, 5).join(' ').slice(0, 360);
    const skills = keywordsDetected.map((k) => k.keyword);

    const prefilledResume: ResumeData = {
      personalInfo: {
        fullName,
        jobTitle: targetRole || 'Professional',
        email,
        phone,
        location,
        website: '',
        linkedin,
        github: contactInfo.hasGitHub ? 'github.com' : '',
        summary: summaryLine || 'Experienced professional with a proven track record of delivering measurable outcomes.',
        photoUrl: '',
        showPhoto: false,
      },
      experience: [
        {
          id: 'exp-1',
          company: 'Target Company / Organization',
          position: targetRole || 'Role Title',
          location: location || '',
          startDate: '2022',
          endDate: 'Present',
          current: true,
          description: weaknesses.slice(0, 3).map((w) => w.suggestion || 'Delivered scalable outcomes with measurable metrics.'),
        },
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'University / College',
          degree: 'Bachelor of Science',
          fieldOfStudy: targetRole ? `${targetRole} Studies` : 'Field of Study',
          startDate: '2018',
          endDate: '2022',
          gpa: '',
        },
      ],
      projects: [],
      skills: skills.length > 0 ? skills : ['Communication', 'Problem Solving', 'Strategic Planning'],
      languages: [
        { id: 'l1', name: isAr ? 'العربية' : 'English', proficiency: 'Native' },
      ],
      certifications: [],
    };

    try {
      localStorage.setItem(
        'jobmatch_resume_builder_cache',
        JSON.stringify({
          resumeTitle: `${prefilledResume.personalInfo.fullName} - ATS Resume`,
          resumeData: prefilledResume,
          selectedTemplate: 'compact',
          paperSize: 'a4',
          theme: {
            accentColor: '#0F5C4D',
            fontFamily: isAr ? 'var(--font-arabic), var(--font-sans), sans-serif' : 'var(--font-sans), sans-serif',
            fontSize: 'base',
            documentLanguage: isAr ? 'ar' : 'en',
          },
          sectionOrder: [
            'personal',
            'summary',
            'experience',
            'education',
            'skills',
            'projects',
            'languages',
            'certifications',
          ],
        })
      );
    } catch {
      // Intentionally ignored: prefilling builder cache in localStorage is best-effort before navigating to /builder
    }

    router.push('/builder');
  };

  const {
    overallScore,
    subScores,
    metrics,
    contactInfo,
    sectionsDetected,
    keywordsDetected,
    missingKeywords,
    strengths,
    weaknesses,
  } = analysisResult;

  // Score tier & color coding
  const getScoreTier = (score: number) => {
    if (score >= 85) {
      return {
        label: t('review_score_excellent'),
        colorClass: 'text-emerald-500',
        bgClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
        title: t('review_score_excellent_desc'),
        desc: isAr
          ? 'سيرتك الذاتية مهيأة بالكامل لتجاوز فلاتر الفرز الآلي بنجاح والوصول مباشرة لأيدي مسؤولي التوظيف.'
          : 'Your document structure, contact data, and key terminology align cleanly with enterprise ATS parsers like Taleo, Workday, and Greenhouse.',
      };
    }
    if (score >= 70) {
      return {
        label: t('review_score_good'),
        colorClass: 'text-sky-500',
        bgClass: 'bg-sky-500/10 border-sky-500/30 text-sky-500',
        title: t('review_score_good_desc'),
        desc: isAr
          ? 'المستند قابل للقراءة بواسطة الأنظمة الآلية، ولكن إضافة الكلمات المفتاحية الناقصة ونتائج قياسية سيرفع ترتيبك.'
          : 'The document is readable by automated parsers, but adding missing role-specific keywords and quantifiable achievements will improve ranking.',
      };
    }
    if (score >= 50) {
      return {
        label: t('review_score_fair'),
        colorClass: 'text-amber-500',
        bgClass: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
        title: t('review_score_fair_desc'),
        desc: isAr
          ? 'بعض الأقسام أو الكلمات المفتاحية مفقودة أو غير واضحة للأنظمة الآلية. يُنصح بمراجعة التوصيات أدناه.'
          : 'Crucial structural sections or standard keywords are missing or difficult for automated parsers to classify accurately.',
      };
    }
    return {
      label: t('review_score_poor'),
      colorClass: 'text-rose-500',
      bgClass: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
      title: t('review_score_poor_desc'),
      desc: isAr
        ? 'بنية المستند الحالية غير متوافقة مع أنظمة التوظيف الآلية. استخدم منشئ السير الذاتية لإصلاح التنسيق فوراً.'
        : 'The document lacks basic ATS formatting requirements or readable digital text layers. Use our Builder to reformat it correctly.',
    };
  };

  const scoreTier = getScoreTier(overallScore);

  return (
    <div className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between selection:bg-brand/20 selection:text-brand print:bg-white print:text-black overflow-x-clip">
      <Script src="https://js.puter.com/v2/" strategy="lazyOnload" />
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.docx,.txt"
        className="hidden"
      />

      {toastMessage && (
        <Toast
          type="info"
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* 1. Document Action Ribbon */}
      <div className="border-b border-line bg-surface backdrop-blur-md py-3 px-4 sm:px-6 print:hidden w-full max-w-full overflow-x-hidden sticky top-14 z-30 shadow-xs box-border">
        <div className="max-w-[1200px] w-full mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-mono text-ink-2 shrink-0">
              {t('review_current_doc')}
            </span>
            <span className="font-semibold text-ink font-mono truncate max-w-[150px] sm:max-w-xs">
              {resumeFileName}
            </span>
            <span className="text-line-strong">|</span>
            <button
              onClick={() => setShowRawTextModal(true)}
              className="text-ink-2 hover:text-ink underline cursor-pointer shrink-0"
            >
              {t('review_view_raw_text')}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Compare with Job Description CTA */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJdModal(true)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
              title={t('review_compare_jd')}
            >
              {t('review_compare_jd')}
            </Button>

            {/* Upload Another CV */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              {t('review_upload_another')}
            </Button>

            {/* Fix with Builder CTA */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFixWithBuilder}
              leftIcon={<Edit className="w-3.5 h-3.5 text-brand" />}
              title={t('review_fix_in_builder')}
            >
              {t('review_fix_in_builder')}
            </Button>

            {/* Print / Share Report */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareReport}
              leftIcon={<Share2 className="w-3.5 h-3.5 text-ink-2" />}
              className="hidden sm:inline-flex"
            >
              {t('review_share')}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              {t('review_print')}
            </Button>
          </div>
        </div>

        {/* Sample Profile Switcher Ribbon */}
        <div className="max-w-[1200px] w-full max-w-full mx-auto pt-2.5 mt-2.5 border-t border-line/60 flex items-center gap-2 text-xs overflow-x-auto min-w-0 pb-1">
          <span className="text-ink-2 shrink-0 font-mono text-[11px]">
            {t('review_quick_samples')}
          </span>
          {[
            { id: 'compact', label: isAr ? 'مهندس برمجيات' : 'Full-Stack Developer' },
            { id: 'two-column', label: isAr ? 'مهندس سحابي (DevOps)' : 'DevOps Architect' },
            { id: 'executive-blue', label: isAr ? 'مدير تقني تنفيذي' : 'Executive Director' },
            { id: 'accountant', label: isAr ? 'محاسب مالي' : 'Corporate Accountant' },
            { id: 'support', label: isAr ? 'دعم العملاء' : 'Customer Success' },
            { id: 'analyst', label: isAr ? 'محلل بيانات' : 'Data Analyst' },
          ].map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample.id)}
              className="px-2.5 py-0.5 rounded-md border border-line bg-surface-2 hover:bg-surface text-ink-2 hover:text-ink text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <main id="main-content" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 w-full text-start space-y-6">
        {/* Breadcrumbs & Header */}
        <div className="print:hidden">
          <Breadcrumbs
            items={[{ label: t('nav_ats_review') }]}
            title={t('review_header_title')}
            description={t('review_header_subtitle')}
          />
        </div>

        {/* 2. Upload Zone with Hints, Drag-and-Drop & Clear Error Handling */}
        <div className="print:hidden space-y-3">
          {/* Staged Processing Progress UI */}
          {processingStage !== 'idle' && processingStage !== 'error' && (
            <div className="rounded-xl border border-brand/30 bg-surface p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      {isAr ? 'جاري فحص وتشخيص السيرة الذاتية...' : 'Analyzing Resume with ATS Engine...'}
                    </h3>
                    <p className="text-xs text-ink-2">
                      {processingStage === 'reading'
                        ? t('review_stage_reading_desc')
                        : processingStage === 'extracting'
                        ? t('review_stage_extracting_desc')
                        : processingStage === 'analyzing'
                        ? t('review_stage_analyzing_desc')
                        : t('review_stage_scoring_desc')}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-brand">{processingProgress}%</span>
              </div>

              <ProgressBar value={processingProgress} max={100} size="sm" variant="brand" />

              {/* Staged 4-Step Progress UI */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {STAGES.map((stg, idx) => {
                  const stageIndex = STAGES.findIndex((s) => s.id === processingStage);
                  const isPast = stageIndex > idx || processingStage === 'complete';
                  const isCurrent = stageIndex === idx;

                  return (
                    <div
                      key={stg.id}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        isCurrent
                          ? 'border-brand bg-brand/10 text-brand font-semibold shadow-xs'
                          : isPast
                          ? 'border-success/30 bg-success/5 text-success'
                          : 'border-line bg-surface-2 text-ink-2 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {isPast ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-3.5 h-3.5 text-brand animate-spin shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-current text-[9px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                        )}
                        <span className="truncate">
                          {stg.id === 'reading'
                            ? t('review_stage_reading_label')
                            : stg.id === 'extracting'
                            ? t('review_stage_extracting_label')
                            : stg.id === 'analyzing'
                            ? t('review_stage_analyzing_label')
                            : t('review_stage_scoring_label')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelProcessing}
                  className="text-xs text-ink-2 hover:text-danger hover:border-danger"
                >
                  {t('loading_cancel')}
                </Button>
              </div>
            </div>
          )}

          {/* Upload Error Alert Card with Specific Recovery Instructions */}
          {uploadError && (
            <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-semibold">
                    {uploadError.isScanned
                      ? isAr
                        ? 'مستند مصوّر غير قابل للقراءة بواسطة أنظمة الـ ATS'
                        : 'Scanned Image Document (Unreadable by ATS)'
                      : isAr
                      ? 'خطأ في معالجة المستند'
                      : 'Unable to Process Document'}
                  </h4>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    {uploadError.message}
                  </p>
                </div>
              </div>

              {/* Recovery Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1 ps-8">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/builder')}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  {isAr ? 'إنشاء سيرة متوافقة في المنشئ مباشرة' : 'Create with ATS Builder instead'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadError(null);
                    fileInputRef.current?.click();
                  }}
                >
                  {isAr ? 'اختيار ملف آخر' : 'Choose another file'}
                </Button>
              </div>
            </div>
          )}

          {/* Large Dropzone with hints */}
          <Dropzone
            onFileSelect={processUploadedFile}
            state={processingStage === 'idle' || processingStage === 'error' ? 'idle' : 'parsing'}
            fileName={resumeFileName}
            isArabic={isAr}
          />
        </div>

        {/* 3. Main Printable Diagnostic Report Card */}
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8">
          {/* Top Score Showcase & Verdict */}
          <div className="border-b border-line pb-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left: Big Circular Gauge + Score Tier Badge */}
              <div className="flex items-center gap-6">
                <div className="shrink-0 relative">
                  <CircularGauge
                    score={overallScore}
                    size={135}
                    strokeWidth={10}
                    className="drop-shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${scoreTier.bgClass}`}>
                      {scoreTier.label}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border border-line bg-surface-2 text-ink-2 flex items-center gap-1.5 shadow-2xs">
                      <Globe className="w-3 h-3 text-brand" />
                      <span>
                        {t('review_doc_language')}{' '}
                        <strong className="text-ink font-semibold">
                          {DOCUMENT_LANGUAGE_OPTIONS.find(
                            (o) => o.id === (analysisResult.detectedLanguage || 'en')
                          )?.nativeName || (analysisResult.detectedLanguage || 'en').toUpperCase()}
                        </strong>
                      </span>
                    </span>
                    <span className="text-xs font-mono text-ink-2">
                      {`${t('review_rank')} ${metrics.rankPercentile}`}
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
                    {scoreTier.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-ink-2 max-w-xl leading-relaxed">
                    {scoreTier.desc}
                  </p>
                </div>
              </div>

              {/* Right: Primary "Fix with Builder" Action Button */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 print:hidden">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleFixWithBuilder}
                  leftIcon={<Edit className="w-4 h-4" />}
                  className="shadow-sm"
                >
                  {t('review_fix_with_builder')}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowJdModal(true)}
                  leftIcon={<Search className="w-3.5 h-3.5" />}
                >
                  {t('review_compare_job_match')}
                </Button>
              </div>
            </div>

            {/* Multilingual ATS Notice Banner */}
            {analysisResult.languageNotice && (
              <div className="rounded-lg border border-brand/20 bg-brand/5 p-3.5 flex items-start gap-3 text-xs leading-relaxed text-ink-2 animate-in fade-in duration-200">
                <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-ink block">
                    {t('review_multilingual_notice')}
                  </span>
                  <p>{isAr ? analysisResult.languageNotice.ar : analysisResult.languageNotice.en}</p>
                </div>
              </div>
            )}

            {/* Document Statistics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg border border-line bg-surface-2">
                <span className="text-ink-2 block font-mono text-[10px] uppercase">
                  {t('review_stat_words')}
                </span>
                <span className="font-mono text-base font-bold text-ink tabular-nums">
                  {metrics.wordCount}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-line bg-surface-2">
                <span className="text-ink-2 block font-mono text-[10px] uppercase">
                  {t('review_stat_reading_time')}
                </span>
                <span className="font-mono text-base font-bold text-ink tabular-nums">
                  {metrics.readingTimeString}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-line bg-surface-2">
                <span className="text-ink-2 block font-mono text-[10px] uppercase">
                  {t('review_stat_metrics')}
                </span>
                <span className="font-mono text-base font-bold text-ink tabular-nums">
                  {metrics.quantifiedMetricsCount}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-line bg-surface-2">
                <span className="text-ink-2 block font-mono text-[10px] uppercase">
                  {t('review_stat_keywords')}
                </span>
                <span className="font-mono text-base font-bold text-ink tabular-nums">
                  {keywordsDetected.length}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Five Diagnostic Breakdown Cards */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-ink flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand" />
              <span>{t('review_breakdown_title')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Pillar 1: Keywords Match */}
              <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    {t('review_pillar_keywords')}
                  </span>
                  <span className="font-mono text-xs font-bold text-ink">
                    {subScores.keywordsMatch}%
                  </span>
                </div>
                <ProgressBar
                  value={subScores.keywordsMatch}
                  size="sm"
                  variant={subScores.keywordsMatch >= 75 ? 'success' : subScores.keywordsMatch >= 50 ? 'brand' : 'warning'}
                />
                <p className="text-[11px] text-ink-2 leading-relaxed">
                  {t('review_pillar_keywords_desc')}
                </p>
              </div>

              {/* Pillar 2: Formatting & ATS Readability */}
              <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    {t('review_pillar_formatting')}
                  </span>
                  <span className="font-mono text-xs font-bold text-ink">
                    {subScores.formatting}%
                  </span>
                </div>
                <ProgressBar
                  value={subScores.formatting}
                  size="sm"
                  variant={subScores.formatting >= 80 ? 'success' : subScores.formatting >= 60 ? 'brand' : 'warning'}
                />
                <p className="text-[11px] text-ink-2 leading-relaxed">
                  {t('review_pillar_formatting_desc')}
                </p>
              </div>

              {/* Pillar 3: Section Structure & Standard Headings */}
              <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    {t('review_pillar_structure')}
                  </span>
                  <span className="font-mono text-xs font-bold text-ink">
                    {subScores.structure}%
                  </span>
                </div>
                <ProgressBar
                  value={subScores.structure}
                  size="sm"
                  variant={subScores.structure >= 80 ? 'success' : subScores.structure >= 60 ? 'brand' : 'warning'}
                />
                <p className="text-[11px] text-ink-2 leading-relaxed">
                  {t('review_pillar_structure_desc')}
                </p>
              </div>

              {/* Pillar 4: Readability & Content Quality */}
              <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    {t('review_pillar_content')}
                  </span>
                  <span className="font-mono text-xs font-bold text-ink">
                    {subScores.contentQuality}%
                  </span>
                </div>
                <ProgressBar
                  value={subScores.contentQuality}
                  size="sm"
                  variant={subScores.contentQuality >= 75 ? 'success' : subScores.contentQuality >= 50 ? 'brand' : 'warning'}
                />
                <p className="text-[11px] text-ink-2 leading-relaxed">
                  {t('review_pillar_content_desc')}
                </p>
              </div>

              {/* Pillar 5: Contact Information Integrity */}
              <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-3 md:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    {t('review_pillar_contact')}
                  </span>
                  <span className="font-mono text-xs font-bold text-ink">
                    {contactInfo.completenessScore}%
                  </span>
                </div>
                <ProgressBar
                  value={contactInfo.completenessScore}
                  size="sm"
                  variant={contactInfo.completenessScore >= 80 ? 'success' : 'warning'}
                />
                <div className="flex flex-wrap gap-3 text-[11px] text-ink-2 pt-0.5">
                  <span className="flex items-center gap-1">
                    {contactInfo.hasEmail ? <Check className="w-3 h-3 text-success" /> : <AlertCircle className="w-3 h-3 text-danger" />}
                    {t('review_contact_email')}
                  </span>
                  <span className="flex items-center gap-1">
                    {contactInfo.hasPhone ? <Check className="w-3 h-3 text-success" /> : <AlertCircle className="w-3 h-3 text-danger" />}
                    {t('review_contact_phone')}
                  </span>
                  <span className="flex items-center gap-1">
                    {contactInfo.hasLocation ? <Check className="w-3 h-3 text-success" /> : <AlertCircle className="w-3 h-3 text-warning" />}
                    {t('review_contact_location')}
                  </span>
                  <span className="flex items-center gap-1">
                    {contactInfo.hasLinkedIn ? <Check className="w-3 h-3 text-success" /> : <AlertCircle className="w-3 h-3 text-ink-2" />}
                    {t('review_contact_linkedin')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Matched vs Missing Keywords Section */}
          <div className="space-y-5 pt-2 border-t border-line">
            <h3 className="font-serif text-lg font-semibold text-ink flex items-center justify-between">
              <span>{isAr ? 'تحليل الكلمات المفتاحية والمهارات' : 'Keyword Alignment & Skill Matching'}</span>
              <span className="font-mono text-xs font-normal text-ink-2">
                {keywordsDetected.length} {isAr ? 'مطابقة' : 'matched'} • {missingKeywords.length} {isAr ? 'مقترحة' : 'missing'}
              </span>
            </h3>

            {/* Matched Keywords Group */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span>{t('review_keywords_detected_title')}</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {keywordsDetected.map((km, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-line bg-surface-2 text-ink text-xs font-mono"
                  >
                    <span>{km.keyword}</span>
                    <span className="text-[10px] text-ink-2">({km.count}x)</span>
                  </span>
                ))}
                {keywordsDetected.length === 0 && (
                  <span className="text-xs text-ink-2 italic">
                    {t('review_keywords_none')}
                  </span>
                )}
              </div>
            </div>

            {/* Missing Keywords Group with Click-to-Copy */}
            {missingKeywords.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                    <span>
                      {`${t('review_keywords_missing_title')} (${targetRole}):`}
                    </span>
                  </span>
                  <span className="text-[11px] text-ink-2 print:hidden">
                    {t('review_keywords_click_to_copy')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {missingKeywords.slice(0, 18).map((kw, idx) => {
                    const isCopied = copiedKeyword === kw;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleCopyKeyword(kw)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-brand/20 hover:border-brand bg-brand/5 text-ink text-xs font-mono transition-colors cursor-pointer"
                        title={kw}
                      >
                        <span>{kw}</span>
                        {isCopied ? (
                          <Check className="w-3 h-3 text-success shrink-0" />
                        ) : (
                          <Copy className="w-3 h-3 text-ink-2 shrink-0 print:hidden" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 6. Prioritized Suggestions with Severity Badges */}
          <div className="space-y-4 pt-2 border-t border-line">
            <h3 className="font-serif text-lg font-semibold text-ink flex items-center gap-2">
              <Flame className="w-4 h-4 text-warning" />
              <span>{t('review_suggestions_title')}</span>
            </h3>

            <div className="space-y-3">
              {/* Weaknesses / Improvements with Severity Badges */}
              {weaknesses.map((weakness, idx) => {
                const badge =
                  weakness.severity === 'high'
                    ? {
                        label: t('review_priority_high'),
                        class: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
                      }
                    : weakness.severity === 'medium'
                    ? {
                        label: t('review_priority_medium'),
                        class: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
                      }
                    : {
                        label: t('review_priority_low'),
                        class: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
                      };

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border border-line bg-surface-2 space-y-2 text-xs list-item-enter ${
                      idx < 8 ? `stagger-${idx + 1}` : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold text-ink text-sm">
                        <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                        <span>{weakness.title}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${badge.class}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-ink-2 leading-relaxed ps-6">
                      {weakness.description}
                    </p>

                    <div className="ps-6 pt-1 text-brand font-medium flex items-start gap-1">
                      <span>→</span>
                      <span>
                        <strong>{t('review_how_to_fix')}</strong>{' '}
                        {weakness.suggestion}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Strengths */}
              {strengths.map((str, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border border-success/20 bg-success/5 space-y-1 text-xs list-item-enter ${
                    (weaknesses.length + idx) < 8 ? `stagger-${weaknesses.length + idx + 1}` : ''
                  }`}
                >
                  <div className="flex items-center gap-2 text-ink font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span>{str.title}</span>
                  </div>
                  <p className="text-ink-2 ps-6 leading-relaxed">{str.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Report Footer & Call-to-Action */}
          <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-2">
            <span className="font-mono">
              {t('review_diagnostic_engine')}
            </span>

            <div className="flex items-center gap-3 print:hidden">
              <Button
                variant="primary"
                size="sm"
                onClick={handleFixWithBuilder}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                {t('review_apply_fixes_builder')}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Compare with Job Description Modal */}
      <Dialog
        isOpen={showJdModal}
        onClose={() => setShowJdModal(false)}
        title={t('review_modal_jd_title')}
        description={t('review_modal_jd_desc')}
      >
        <div className="space-y-4">
          <Textarea
            label={t('review_modal_jd_label')}
            rows={8}
            placeholder={t('review_modal_jd_placeholder')}
            value={targetJobDescription}
            onChange={(e) => setTargetJobDescription(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowJdModal(false)}>
              {t('dashboard_cancel_btn')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                runAnalysis(resumeText, targetJobDescription);
                setShowJdModal(false);
                setToastMessage(t('review_modal_jd_toast'));
              }}
            >
              {t('review_modal_jd_analyze')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* View Extracted Text Modal */}
      <Dialog
        isOpen={showRawTextModal}
        onClose={() => setShowRawTextModal(false)}
        title={t('review_modal_raw_title')}
        description={t('review_modal_raw_desc')}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto p-4 rounded-lg border border-line bg-surface-2 font-mono text-xs text-ink leading-relaxed whitespace-pre-wrap select-all">
            {resumeText}
          </div>

          <div className="flex items-center justify-between text-xs text-ink-2">
            <span>
              {resumeText.length} {t('review_modal_raw_chars')}
            </span>
            <Button variant="outline" size="sm" onClick={() => setShowRawTextModal(false)}>
              {t('dashboard_cancel_btn')}
            </Button>
          </div>
        </div>
      </Dialog>

      <Footer />
    </div>
  );
}