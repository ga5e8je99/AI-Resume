'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '@/app/components/Footer';
import UpgradeModal from '@/app/components/UpgradeModal';
import { ResumePreview } from '@/app/builder/components/ResumePreview';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import BrandedLoader from '@/components/brand/BrandedLoader';
import {
  DOCUMENT_LANGUAGE_OPTIONS,
  getStoredDocumentLanguage,
  setStoredDocumentLanguage,
  DocumentLanguage,
  getDocumentFontFamily,
} from '@/app/lib/documentI18n';
import { ResumeData, TemplateId, ThemeConfig } from '@/app/builder/types';
import { ResumeTone, ResumeDocumentType, KeywordCoverageResult } from '@/app/lib/resumeService';
import {
  Sparkles,
  FileText,
  Layers,
  Upload,
  Check,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Download,
  ExternalLink,
  Crown,
  Zap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  Eye,
  Sliders,
  Briefcase,
  GraduationCap,
  Languages as LanguagesIcon,
  HelpCircle,
} from 'lucide-react';

const TONES: { id: ResumeTone; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
  {
    id: 'professional',
    labelEn: 'Professional',
    labelAr: 'مهني متوازن',
    descEn: 'Classic, objective, balanced ATS corporate tone',
    descAr: 'نبرة كلاسيكية موضوعية معتمدة للشركات وأنظمة التوظيف',
  },
  {
    id: 'confident',
    labelEn: 'Confident & Impactful',
    labelAr: 'واثق ومؤثر',
    descEn: 'Emphasizes leadership, ownership, and measurable growth',
    descAr: 'تركز على القيادة والمبادرة والنتائج الرقمية المتسارعة',
  },
  {
    id: 'technical',
    labelEn: 'Technical & Rigorous',
    labelAr: 'تقني ودقيق',
    descEn: 'Focuses on systems architecture, stack depth, and engineering metrics',
    descAr: 'تركز على هندسة الأنظمة والعمق البرمجي ومؤشرات الأداء',
  },
  {
    id: 'executive',
    labelEn: 'Executive & Strategic',
    labelAr: 'تنفيذي واستراتيجي',
    descEn: 'Designed for directors, managers, and organizational visionaries',
    descAr: 'مخصصة للمدراء والقيادات التنفيذية وأصحاب الرؤى الاستراتيجية',
  },
  {
    id: 'creative',
    labelEn: 'Creative & Engaging',
    labelAr: 'إبداعي وتفاعلي',
    descEn: 'Engaging, narrative-focused tone for product, design, and marketing roles',
    descAr: 'سردي تفاعلي ملائم للأدوار الإبداعية والمنتجات والتسويق',
  },
];

const TEMPLATES: { id: TemplateId; name: string; tag: string }[] = [
  { id: 'compact', name: 'Compact ATS', tag: 'High-Density 1 Page' },
  { id: 'two-column', name: 'Two-Column Modern', tag: 'Balanced Layout' },
  { id: 'executive-blue', name: 'Executive Blue', tag: 'Corporate Clean' },
  { id: 'oslo', name: 'Oslo Minimalist', tag: 'Pure Typography' },
  { id: 'amsterdam', name: 'Amsterdam Clean', tag: 'Modern Elegance' },
  { id: 'stockholm', name: 'Stockholm Dense', tag: 'Tech Specialist' },
  { id: 'london', name: 'London Classic', tag: 'Ivy League' },
  { id: 'modern', name: 'Modern Engineering', tag: 'Engineer Favorite' },
  { id: 'simple', name: 'Academic Simple', tag: 'Traditional Clean' },
];

export default function ResumeGeneratePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, isRtl, t } = useLanguage();
  const isAr = language === 'ar';

  // Output Language
  const [outputLanguage, setOutputLanguage] = useState<DocumentLanguage>('en');

  // Document Type
  const [documentType, setDocumentType] = useState<ResumeDocumentType>('resume');

  // Form Inputs
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('3-5');
  const [keySkills, setKeySkills] = useState('');
  const [workHistory, setWorkHistory] = useState('');
  const [education, setEducation] = useState('');
  const [languages, setLanguages] = useState('English (Fluent), Arabic (Native)');
  const [tone, setTone] = useState<ResumeTone>('professional');
  const [templateChoice, setTemplateChoice] = useState<TemplateId>('compact');

  // Existing Resume Prefill
  const [savedResumes, setSavedResumes] = useState<any[]>([]);
  const [selectedExistingResumeId, setSelectedExistingResumeId] = useState<string>('');
  const [originalResumeData, setOriginalResumeData] = useState<ResumeData | null>(null);
  const [originalResumeText, setOriginalResumeText] = useState<string>('');
  const [isPrefillOpen, setIsPrefillOpen] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);

  // Generation & UX State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Result State
  const [generatedResume, setGeneratedResume] = useState<ResumeData | null>(null);
  const [savedResumeId, setSavedResumeId] = useState<string | null>(null);
  const [keywordCoverage, setKeywordCoverage] = useState<KeywordCoverageResult | null>(null);
  const [userCreditsLeft, setUserCreditsLeft] = useState<number | null>(null);

  // Comparative View Tab on Mobile
  const [comparisonTab, setComparisonTab] = useState<'generated' | 'original'>('generated');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load stored language preference & user saved resumes
  useEffect(() => {
    const stored = getStoredDocumentLanguage();
    if (stored) {
      setOutputLanguage(stored);
    } else if (language === 'ar') {
      setOutputLanguage('ar');
    }

    if (user) {
      fetch('/api/resumes')
        .then((res) => (res.ok ? res.json() : { resumes: [] }))
        .then((data) => {
          if (Array.isArray(data.resumes)) {
            setSavedResumes(data.resumes);
          }
        })
        .catch(() => {});
    }
  }, [user, language]);

  // Stepper timer during generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setGenerationStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 2400);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Handle prefill from existing saved resume
  const handleSelectSavedResume = (resumeId: string) => {
    setSelectedExistingResumeId(resumeId);
    const found = savedResumes.find((r) => r.id === resumeId);
    if (found && found.data) {
      applyResumeDataToForm(found.data);
    }
  };

  const applyResumeDataToForm = (data: ResumeData) => {
    setOriginalResumeData(data);
    if (data.personalInfo?.jobTitle && !targetJobTitle) {
      setTargetJobTitle(data.personalInfo.jobTitle);
    }
    if (data.skills && data.skills.length > 0) {
      setKeySkills(data.skills.join(', '));
    }
    if (data.experience && data.experience.length > 0) {
      const historyStr = data.experience
        .map(
          (e) =>
            `${e.position} at ${e.company} (${e.startDate} - ${e.current ? 'Present' : e.endDate}):\n` +
            (e.description || []).map((b) => `• ${b}`).join('\n')
        )
        .join('\n\n');
      setWorkHistory(historyStr);
    }
    if (data.education && data.education.length > 0) {
      const eduStr = data.education
        .map((ed) => `${ed.degree} in ${ed.fieldOfStudy}, ${ed.institution} (${ed.startDate} - ${ed.endDate})`)
        .join('\n');
      setEducation(eduStr);
    }
    if (data.languages && data.languages.length > 0) {
      setLanguages(data.languages.map((l) => `${l.name} (${l.proficiency})`).join(', '));
    }
  };

  // Handle uploaded resume file extraction (.pdf, .docx, .txt)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(isAr ? 'حجم الملف يتجاوز 5 ميجابايت' : 'File size exceeds 5MB');
      return;
    }

    setIsExtractingFile(true);
    setErrorMsg(null);

    try {
      const { extractTextFromFile } = await import('@/app/lib/pdfExtractor');
      const extractedText = await extractTextFromFile(file);
      setOriginalResumeText(extractedText);
      const isArabic = /[\u0600-\u06FF]/.test(extractedText);
      if (isArabic) {
        setOutputLanguage('ar');
        setStoredDocumentLanguage('ar');
      }

      // Auto populate Work History field with extracted resume text
      setWorkHistory(extractedText.slice(0, 2000));
      setIsPrefillOpen(true);
    } catch (err: any) {
      setErrorMsg(err?.message || (isAr ? 'فشل استخراج النص من الملف' : 'Failed to extract text from file'));
    } finally {
      setIsExtractingFile(false);
    }
  };

  // Cancel in-flight generation
  const handleCancelGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsGenerating(false);
    setGenerationStep(1);
  };

  // Trigger AI Resume Generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetJobTitle.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال المسمى الوظيفي المستهدف' : 'Please provide a target job title');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);
    setGenerationStep(1);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetJobTitle: targetJobTitle.trim(),
          jobDescription: jobDescription.trim(),
          yearsOfExperience,
          keySkills,
          workHistory,
          education,
          tone,
          documentType,
          outputLanguage,
          templateChoice,
          originalResumeData,
          originalResumeText,
          senderName: user?.name,
          senderEmail: user?.email,
        }),
        signal: controller.signal,
      });

      if (res.status === 402) {
        setIsGenerating(false);
        setIsUpgradeModalOpen(true);
        setErrorMsg(
          isAr
            ? 'لقد استهلكت رصيدك المتاح لتوليد السيرة الذاتية. يرجى الترقية إلى باقة برو لتوليد غير محدود أو شراء رصيد إضافي.'
            : 'You have exhausted your available generation credits. Upgrade to Pro for unlimited generations or purchase credits.'
        );
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !data.resume) {
        throw new Error(data.error || 'Failed to generate resume');
      }

      setGeneratedResume(data.resume);
      setSavedResumeId(data.savedResumeId);
      setKeywordCoverage(data.keywordCoverage);
      if (typeof data.creditsLeft === 'number') {
        setUserCreditsLeft(data.creditsLeft);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User manually cancelled
        return;
      }
      setErrorMsg(err.message || (isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Word (.docx)
  const handleExportWord = async () => {
    if (!generatedResume) return;
    try {
      const theme: ThemeConfig = {
        accentColor: '#0F5C4D',
        fontFamily: outputLanguage === 'ar' ? getDocumentFontFamily('ar') : 'var(--font-sans), sans-serif',
        fontSize: 'base',
        documentLanguage: outputLanguage,
      };
      const { exportResumeToDocx } = await import('@/app/builder/utils/exportWord');
      await exportResumeToDocx(generatedResume, theme);
    } catch (err: any) {
      setErrorMsg(isAr ? 'فشل تصدير ملف Word' : 'Failed to export Word document');
    }
  };

  // Open in Builder
  const handleOpenInBuilder = () => {
    if (savedResumeId) {
      router.push(`/builder?id=${savedResumeId}`);
    } else {
      router.push('/builder');
    }
  };

  const isPro = user?.plan === 'pro' || user?.plan === 'enterprise';
  const isDemo = Boolean(user?.isDemo);

  return (
    <div
      className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between selection:bg-accent-soft selection:text-ink overflow-x-clip"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <main id="main-content" className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full flex-1">
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-accent-soft text-accent border border-accent/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'الذكاء الاصطناعي للسير الذاتية' : 'AI Resume & CV Generator'}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-ink tracking-tight">
            {isAr ? 'أنشئ سيرة ذاتية أو CV مخصص بذكاء' : 'Generate an ATS Resume & CV in Seconds'}
          </h1>

          <p className="text-sm sm:text-base text-ink-2 max-w-xl mx-auto leading-relaxed">
            {isAr
              ? 'حوّل خبراتك إلى سيرة ذاتية احترافية ومتوافقة مع أنظمة الـ ATS ومعايير كبرى الشركات، مصممة بلغة أصلية بدون ترجمة ركيكة وبدون اختلاق بيانات.'
              : 'Craft precision-targeted, recruiter-tested ATS resumes and detailed CVs natively tailored to any job opening with action verbs and zero hallucinations.'}
          </p>

          {/* User Credits & Plan Pill */}
          <div className="pt-2 flex items-center justify-center gap-3 text-xs">
            <span className="text-ink-3">
              {isPro
                ? isAr
                  ? '✨ باقة برو: توليد غير محدود'
                  : '✨ Pro Plan: Unlimited Generations'
                : isDemo
                ? isAr
                  ? '🎮 وضع تجريبي: مجاني للاختبار'
                  : '🎮 Demo Mode: Active for testing'
                : isAr
                ? `الرصيد المتبقي: ${userCreditsLeft ?? user?.aiCredits ?? 3} نقاط (2 نقطة لكل سيرة)`
                : `Balance: ${userCreditsLeft ?? user?.aiCredits ?? 3} credits (2 credits / doc)`}
            </span>
            {!isPro && !isDemo && (
              <Link href="/pricing" className="font-semibold text-accent hover:underline flex items-center gap-1">
                <span>{isAr ? 'ترقية لباقة برو' : 'Upgrade to Pro'}</span>
                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </Link>
            )}
          </div>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="max-w-3xl mx-auto mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{errorMsg}</p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="p-1 rounded hover:bg-red-500/20 text-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* RESULTS SCREEN (WHEN GENERATED) */}
        {generatedResume && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Success & ATS Keyword Banner */}
            <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-ink">
                      {isAr ? 'تم توليد السيرة بنجاح وحفظها' : 'Resume Successfully Generated & Saved'}
                    </h2>
                    <p className="text-xs text-ink-3">
                      {isAr
                        ? 'تم حفظ المستند في استوديو السير الذاتية ويمكنك تحريره وتخصيصه بالكامل الآن.'
                        : 'Saved to your cloud resume library. You can now edit, reorder sections, and export.'}
                    </p>
                  </div>
                </div>

                {/* Keyword Coverage Pill */}
                {keywordCoverage && (
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-accent-soft text-accent border border-accent/20 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{keywordCoverage.score}% {isAr ? 'تطابق الكلمات المفتاحية' : 'ATS Keyword Match'}</span>
                    </span>

                    {keywordCoverage.matchedKeywords.slice(0, 5).map((kw, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      >
                        ✓ {kw}
                      </span>
                    ))}

                    {keywordCoverage.missingKeywords.length > 0 && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-2 text-ink-3">
                        +{keywordCoverage.missingKeywords.length} {isAr ? 'كلمات مقترحة' : 'more keywords'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <Button variant="primary" size="md" onClick={handleOpenInBuilder} className="flex-1 md:flex-initial">
                  <ExternalLink className="w-4 h-4 me-1.5" />
                  <span>{isAr ? 'فتح في محرر السير الذاتية' : 'Edit in Resume Builder'}</span>
                </Button>

                <Button variant="outline" size="md" onClick={handleExportWord} className="flex-1 md:flex-initial">
                  <Download className="w-4 h-4 me-1.5" />
                  <span>Word (.docx)</span>
                </Button>

                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setGeneratedResume(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs text-ink-3"
                >
                  <RotateCcw className="w-3.5 h-3.5 me-1" />
                  <span>{isAr ? 'توليد سيرة أخرى' : 'New Generation'}</span>
                </Button>
              </div>
            </div>

            {/* COMPARATIVE SPLIT VIEW: ORIGINAL VS GENERATED */}
            {originalResumeData && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-accent" />
                    <span>{isAr ? 'مقارنة: السيرة الأصلية مقابل السيرة المولدة بالذكاء الاصطناعي' : 'Comparison: Original vs AI-Enhanced'}</span>
                  </h3>

                  {/* Mobile Tab Switcher */}
                  <div className="flex md:hidden rounded-lg bg-surface-2 p-0.5 border border-line text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setComparisonTab('generated')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        comparisonTab === 'generated' ? 'bg-surface text-ink font-semibold shadow-xs' : 'text-ink-3'
                      }`}
                    >
                      {isAr ? 'المولدة بالذكاء' : 'AI Generated'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setComparisonTab('original')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        comparisonTab === 'original' ? 'bg-surface text-ink font-semibold shadow-xs' : 'text-ink-3'
                      }`}
                    >
                      {isAr ? 'السيرة السابقة' : 'Original'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Original Resume Content */}
                  <div
                    className={`rounded-xl border border-line bg-surface p-5 space-y-4 text-xs ${
                      comparisonTab === 'generated' ? 'hidden md:block' : 'block'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-line">
                      <span className="font-mono uppercase text-[11px] font-bold text-ink-3 tracking-wider">
                        {isAr ? 'السيرة الذاتية السابقة (المدخلات)' : 'Original Resume (Source)'}
                      </span>
                      <span className="text-ink-3">
                        {originalResumeData.personalInfo?.fullName || user?.name || ''}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pe-2">
                      <div>
                        <h4 className="font-semibold text-ink">{isAr ? 'المسمى والملخص' : 'Title & Summary'}</h4>
                        <p className="text-ink-2 mt-1 leading-relaxed">
                          {originalResumeData.personalInfo?.summary || (isAr ? 'لا يوجد ملخص مسبق' : 'No summary provided')}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-ink">{isAr ? 'المهارات المذكورة' : 'Original Skills'}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(originalResumeData.skills || []).map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-surface-2 text-ink-2 text-[11px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-ink">{isAr ? 'الخبرات السابقة' : 'Past Experience'}</h4>
                        <ul className="mt-1 space-y-2">
                          {(originalResumeData.experience || []).slice(0, 3).map((e, idx) => (
                            <li key={idx} className="p-2 rounded -surface-2 border border-line/50">
                              <span className="font-medium text-ink block">{e.position} - {e.company}</span>
                              <span className="text-[10px] text-ink-3 font-mono block">{e.startDate} - {e.current ? 'Present' : e.endDate}</span>
                              <p className="text-ink-3 mt-1 line-clamp-2">{(e.description || [])[0]}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Right: AI-Generated Result Highlights */}
                  <div
                    className={`rounded-xl border-2 border-accent/40 bg-surface p-5 space-y-4 text-xs ${
                      comparisonTab === 'original' ? 'hidden md:block' : 'block'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-line">
                      <span className="font-mono uppercase text-[11px] font-bold text-accent tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAr ? 'السيرة المحسنة بالذكاء الاصطناعي' : 'AI-Optimized Version'}</span>
                      </span>
                      <span className="font-mono text-[10px] text-accent font-semibold px-2 py-0.5 rounded bg-accent-soft">
                        {documentType === 'cv' ? 'CV (Multi-Page)' : 'ATS Resume (1-Page)'}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pe-2">
                      <div>
                        <h4 className="font-semibold text-ink flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-accent" />
                          <span>{isAr ? 'ملخص تنفيذي مدعوم بالكلمات المفتاحية' : 'Keyword-Aligned Professional Summary'}</span>
                        </h4>
                        <p className="text-ink-2 mt-1 leading-relaxed bg-accent-soft/30 p-2.5 rounded-lg border border-accent/15">
                          {generatedResume.personalInfo.summary}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-ink flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-accent" />
                          <span>{isAr ? 'المهارات المستهدفة للوظيفة' : 'Targeted Technical & Core Skills'}</span>
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {generatedResume.skills.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-accent-soft text-accent border border-accent/20 text-[11px] font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-ink flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-accent" />
                          <span>{isAr ? 'نقاط الإنجاز بصيغ الأفعال القوية' : 'Action-Driven Experience Bullets'}</span>
                        </h4>
                        <ul className="mt-1 space-y-2">
                          {generatedResume.experience.map((e, idx) => (
                            <li key={idx} className="p-2.5 rounded-lg -surface-2 border border-line">
                              <span className="font-medium text-ink block">{e.position} — {e.company}</span>
                              <span className="text-[10px] text-ink-3 font-mono block">{e.startDate} — {e.endDate}</span>
                              <ul className="mt-1.5 space-y-1 list-disc list-inside text-ink-2">
                                {(e.description || []).map((b, bIdx) => (
                                  <li key={bIdx} className="leading-relaxed">{b}</li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LIVE RESUME PREVIEW CONTAINER */}
            <div className="rounded-xl border border-line bg-surface p-4 sm:p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-accent" />
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-ink">
                    {isAr ? 'المعاينة الحية للسيرة الذاتية' : 'Live Document Preview'}
                  </h3>
                </div>
                <span className="text-xs font-mono text-ink-3">
                  {outputLanguage.toUpperCase()} • {templateChoice.toUpperCase()}
                </span>
              </div>

              <div className="-surface-2 rounded-lg p-3 sm:p-6 flex justify-center overflow-x-auto min-h-[600px]">
                <ResumePreview
                  data={generatedResume}
                  template={templateChoice}
                  theme={{
                    accentColor: '#0F5C4D',
                    fontFamily: outputLanguage === 'ar' ? getDocumentFontFamily('ar') : 'var(--font-sans), sans-serif',
                    fontSize: 'base',
                    documentLanguage: outputLanguage,
                  }}
                  paperSize="a4"
                />
              </div>
            </div>
          </div>
        )}

        {/* INPUT FORM (HIDDEN WHEN RESUME IS GENERATED TO FOCUS ON RESULT, WITH "EDIT INPUTS" BUTTON) */}
        {!generatedResume && (
          <form onSubmit={handleGenerate} className="space-y-8 max-w-4xl mx-auto">
            {/* 1. DOCUMENT TYPE SELECTOR (RESUME VS CV) */}
            <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-subtle space-y-3">
              <label className="block text-xs font-mono uppercase font-bold tracking-wider text-ink-3">
                {isAr ? 'نوع المستند المطلوب' : '1. Select Document Format'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDocumentType('resume')}
                  className={`p-4 rounded-xl border text-start transition-all flex items-start gap-3.5 ${
                    documentType === 'resume'
                      ? 'border-2 border-accent bg-accent-soft/40 shadow-xs'
                      : 'border-line hover:border-line-strong bg-surface'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      documentType === 'resume' ? 'bg-accent text-paper' : 'bg-surface-2 text-ink-3'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-ink flex items-center gap-1.5">
                      <span>{isAr ? 'سيرة ذاتية ATS (صفحة واحدة، موجزة)' : 'Resume (1 Page, Concise)'}</span>
                      {documentType === 'resume' && <Check className="w-3.5 h-3.5 text-accent" />}
                    </h3>
                    <p className="text-xs text-ink-3 mt-1 leading-relaxed">
                      {isAr
                        ? 'مكثفة وعالية الكثافة للشركات التقنية والـ ATS، مع التركيز على أهم 3-4 إنجازات رقمية لكل وظيفة.'
                        : 'Tight, high-density format built for corporate ATS parsers and recruiters scanning in 6 seconds.'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDocumentType('cv')}
                  className={`p-4 rounded-xl border text-start transition-all flex items-start gap-3.5 ${
                    documentType === 'cv'
                      ? 'border-2 border-accent bg-accent-soft/40 shadow-xs'
                      : 'border-line hover:border-line-strong bg-surface'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      documentType === 'cv' ? 'bg-accent text-paper' : 'bg-surface-2 text-ink-3'
                    }`}
                  >
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-ink flex items-center gap-1.5">
                      <span>{isAr ? 'سيرة أكاديمية / CV (تفصيلية، متعددة الصفحات)' : 'Curriculum Vitae (Detailed, Multi-Page)'}</span>
                      {documentType === 'cv' && <Check className="w-3.5 h-3.5 text-accent" />}
                    </h3>
                    <p className="text-xs text-ink-3 mt-1 leading-relaxed">
                      {isAr
                        ? 'شاملة ومتعددة الصفحات للأدوار الأكاديمية والطبية والاستشارية والقيادية العليا.'
                        : 'Comprehensive academic & executive vitae with expanded research, certifications, and technical projects.'}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. PREFILL OPTION: START FROM EXISTING RESUME */}
            <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-accent" />
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-ink">
                    {isAr ? 'البدء من سيرة ذاتية سابقة (اختياري)' : '2. Start from an Existing Resume (Optional)'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrefillOpen(!isPrefillOpen)}
                  className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
                >
                  <span>{isPrefillOpen ? (isAr ? 'إخفاء الخيارات' : 'Hide') : (isAr ? 'استيراد سيرة سابقة' : 'Prefill')}</span>
                  {isPrefillOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {isPrefillOpen && (
                <div className="pt-2 border-t border-line space-y-4 animate-in fade-in duration-200">
                  <p className="text-xs text-ink-3">
                    {isAr
                      ? 'يمكنك ملء الحقول تلقائياً من إحدى سيرك المحفوظة، أو رفع ملف PDF / Word لاستخراج البيانات والمقارنة جنباً إلى جنب.'
                      : 'Automatically populate inputs from your saved resumes or upload a PDF/Word file to compare side-by-side.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Saved Resumes Dropdown */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-ink-2">
                        {isAr ? 'اختر من سيرك المحفوظة:' : 'Choose saved resume:'}
                      </label>
                      <select
                        aria-label={isAr ? 'اختر من سيرك المحفوظة' : 'Choose saved resume'}
                        value={selectedExistingResumeId}
                        onChange={(e) => handleSelectSavedResume(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value="">{isAr ? '-- اختر سيرة محفوظة --' : '-- Select from library --'}</option>
                        {savedResumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title} ({new Date(r.updatedAt).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* File Upload Button */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-ink-2">
                        {isAr ? 'أو ارفع ملف PDF / Word:' : 'Or upload PDF / Word:'}
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={isExtractingFile}
                        className="w-full text-xs"
                      >
                        <Upload className="w-3.5 h-3.5 me-1.5" />
                        <span>{isAr ? 'رفع ملف سيرة ذاتية' : 'Upload Resume File'}</span>
                      </Button>
                    </div>
                  </div>

                  {originalResumeData && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isAr
                          ? 'تم تحميل السيرة السابقة بنجاح. سننشئ مقارنة جنباً إلى جنب بعد التوليد!'
                          : 'Previous resume loaded successfully. A side-by-side comparison will be shown after generation!'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. TARGET JOB & CAREER DETAILS */}
            <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-subtle space-y-5">
              <label className="block text-xs font-mono uppercase font-bold tracking-wider text-ink-3">
                {isAr ? 'بيانات الوظيفة المستهدفة والخبرة' : '3. Target Job & Profile Details'}
              </label>

              {/* Target Job Title (Required) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink">
                  {isAr ? 'المسمى الوظيفي المستهدف *' : 'Target Job Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={targetJobTitle}
                  onChange={(e) => setTargetJobTitle(e.target.value)}
                  placeholder={
                    isAr ? 'مثال: Senior Full-Stack Engineer أو مهندس برمجيات' : 'e.g. Senior Frontend Engineer'
                  }
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-line bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Job Description (Optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-ink">
                    {isAr ? 'الوصف الوظيفي المستهدف (اختياري للتحسين المتقدم)' : 'Target Job Description (Optional for ATS Optimization)'}
                  </label>
                  <span className="text-[11px] text-ink-3 font-mono">
                    {isAr ? 'يساعد على قياس توافق الكلمات المفتاحية' : 'Powers keyword coverage scoring'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={
                    isAr
                      ? 'الصق نص الإعلان الوظيفي أو متطلبات الدور هنا لمطابقة الكلمات المفتاحية بدقة...'
                      : 'Paste the target job description or requirements to align keywords naturally...'
                  }
                  className="w-full text-xs p-3 rounded-lg border border-line bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
                />
              </div>

              {/* Years of Experience & Tone in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink">
                    {isAr ? 'سنوات الخبرة' : 'Years of Experience'}
                  </label>
                  <select
                    aria-label={isAr ? 'سنوات الخبرة' : 'Years of Experience'}
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="0-1">{isAr ? 'مبتدئ (0-1 سنة)' : 'Entry-level (0-1 year)'}</option>
                    <option value="1-3">{isAr ? 'مبتدئ / متوسط (1-3 سنوات)' : 'Junior (1-3 years)'}</option>
                    <option value="3-5">{isAr ? 'متوسط (3-5 سنوات)' : 'Mid-Level (3-5 years)'}</option>
                    <option value="5-8">{isAr ? 'أول / متقدم (5-8 سنوات)' : 'Senior (5-8 years)'}</option>
                    <option value="8+">{isAr ? 'خبير / قائد (8+ سنوات)' : 'Lead / Executive (8+ years)'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink">
                    {isAr ? 'نبرة الخطاب والسيرة' : 'Tone & Voice'}
                  </label>
                  <select
                    aria-label={isAr ? 'نبرة الخطاب والسيرة' : 'Tone and Voice'}
                    value={tone}
                    onChange={(e) => setTone(e.target.value as ResumeTone)}
                    className="w-full text-xs p-2.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {TONES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {isAr ? t.labelAr : t.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Key Skills */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink">
                  {isAr ? 'المهارات والتقنيات الأساسية (مفصولة بفواصل)' : 'Key Skills & Technologies (comma separated)'}
                </label>
                <input
                  type="text"
                  value={keySkills}
                  onChange={(e) => setKeySkills(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مثال: React, TypeScript, Next.js, Node.js, AWS, Docker, إدارة الفرق'
                      : 'e.g. React, TypeScript, Node.js, AWS, Kubernetes, Agile, Microservices'
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-line bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Work History (free text or structured positions) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-ink">
                    {isAr ? 'السجل الوظيفي والمسؤوليات السابقة' : 'Work History & Key Achievements'}
                  </label>
                  <span className="text-[11px] text-ink-3">
                    {isAr ? 'نص حر أو نقاط مختصرة' : 'Free text or bullet points'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={workHistory}
                  onChange={(e) => setWorkHistory(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب نبذة عن أدوارك السابقة أو الشركات والمشاريع التي عملت بها، وسيقوم الذكاء بصياغتها في نقاط إنجاز قوية...'
                      : 'Outline past companies, roles, and accomplishments. The AI will refine these into high-impact action bullets with zero fabrication...'
                  }
                  className="w-full text-xs p-3 rounded-lg border border-line bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
                />
              </div>

              {/* Education & Languages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink">
                    {isAr ? 'المؤهل التعليمي' : 'Education'}
                  </label>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder={
                      isAr
                        ? 'مثال: بكالوريوس علوم الحاسب، جامعة القاهرة'
                        : 'e.g. B.S. in Computer Science, State University'
                    }
                    className="w-full text-xs p-2.5 rounded-lg border border-line bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink">
                    {isAr ? 'اللغات' : 'Languages'}
                  </label>
                  <input
                    type="text"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder="English (Fluent), Arabic (Native)"
                    className="w-full text-xs p-2.5 rounded-lg border border-line bg-surface text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {/* 4. OUTPUT LANGUAGE & TEMPLATE SELECTOR */}
            <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-subtle space-y-5">
              <label className="block text-xs font-mono uppercase font-bold tracking-wider text-ink-3">
                {isAr ? 'لغة المستند وقالب التنسيق' : '4. Output Language & Template'}
              </label>

              {/* Language Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-ink flex items-center gap-1.5">
                  <LanguagesIcon className="w-3.5 h-3.5 text-accent" />
                  <span>{isAr ? 'لغة إخراج الوثيقة (مستقلة عن لغة الواجهة)' : 'Document Output Language (Independent from UI)'}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {DOCUMENT_LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => {
                        setOutputLanguage(opt.code as DocumentLanguage);
                        setStoredDocumentLanguage(opt.code as DocumentLanguage);
                      }}
                      className={`p-2.5 rounded-lg border text-center transition-all text-xs font-medium ${
                        outputLanguage === opt.code
                          ? 'border-2 border-accent bg-accent-soft text-accent font-semibold shadow-xs'
                          : 'border-line hover:border-line-strong bg-surface text-ink-2'
                      }`}
                    >
                      <span className="block">{opt.nativeName}</span>
                      <span className="text-[10px] text-ink-3 uppercase font-mono">{opt.dir}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Choice Grid */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-ink">
                  {isAr ? 'قالب التنسيق الأولي' : 'Initial Template Style'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setTemplateChoice(tmpl.id)}
                      className={`p-3 rounded-lg border text-start transition-all ${
                        templateChoice === tmpl.id
                          ? 'border-2 border-accent bg-accent-soft/30 shadow-xs'
                          : 'border-line hover:border-line-strong bg-surface'
                      }`}
                    >
                      <span className="text-xs font-semibold text-ink block">{tmpl.name}</span>
                      <span className="text-[10px] text-ink-3 font-mono block mt-0.5">{tmpl.tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. SUBMIT ACTION & STAGED LOADING */}
            <div className="pt-2">
              {isGenerating ? (
                <div className="rounded-xl border border-accent/40 bg-surface p-6 shadow-card">
                  <BrandedLoader
                    size="md"
                    status={
                      isAr
                        ? 'جارٍ توليد السيرة الذاتية بالذكاء الاصطناعي...'
                        : 'Generating Your AI Resume & CV...'
                    }
                    subtext={
                      generationStep === 1
                        ? isAr
                          ? 'تحليل الخبرات المهنية والمسمى الوظيفي...'
                          : 'Analyzing professional background & target role...'
                        : generationStep === 2
                        ? isAr
                          ? 'استخراج الكلمات المفتاحية ومطابقة معايير الـ ATS...'
                          : 'Extracting keywords and aligning with target job requirements...'
                        : generationStep === 3
                        ? isAr
                          ? 'صياغة نقاط الإنجاز المهنية بأفعال قوية...'
                          : 'Synthesizing action-oriented achievement bullet points...'
                        : isAr
                        ? 'بناء وتنسيق هيكل السيرة النهائي وحفظه...'
                        : 'Formatting structured ATS layout and cloud persistence...'
                    }
                    stage={
                      isAr ? `المرحلة ${generationStep} من 4` : `Stage ${generationStep} of 4`
                    }
                    progress={generationStep * 25}
                    onCancel={handleCancelGeneration}
                    cancelText={isAr ? 'إلغاء التوليد' : 'Cancel Generation'}
                  />
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isGenerating}
                    loadingText={t('upload_submitting_btn')}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    className="w-full sm:w-auto flex-1 font-semibold"
                  >
                    <span>
                      {documentType === 'cv'
                        ? isAr
                          ? 'توليد الـ CV بالذكاء الاصطناعي'
                          : 'Generate Tailored CV'
                        : isAr
                        ? 'توليد السيرة الذاتية (Resume)'
                        : 'Generate Tailored ATS Resume'}
                    </span>
                  </Button>

                  <Link href="/builder" className="w-full sm:w-auto">
                    <Button type="button" variant="ghost" size="lg" className="w-full text-xs text-ink-3">
                      <span>{isAr ? 'الانتقال للمحرر اليدوي' : 'Use Manual Builder'}</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </form>
        )}
      </main>

      {/* FRIENDLY UPGRADE MODAL ON HTTP 402 */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        language={language}
      />

      <Footer />
    </div>
  );
}
