'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  CoverLetterData,
  CoverLetterTone,
  CoverLetterLanguage,
} from './types';
import {
  LANGUAGE_OPTIONS,
} from './constants';
import { CoverLetterHero } from './components/CoverLetterHero';
import { ToneCardSelector } from './components/ToneCardSelector';
import { GeneratingStepper } from './components/GeneratingStepper';
import { CoverLetterPreview } from './components/CoverLetterPreview';
import { SavedDraftsModal } from './components/SavedDraftsModal';
import { ConfirmModal } from './components/ConfirmModal';
import { extractTextFromFile } from '../lib/pdfExtractor';
import { CoverLetterService } from '../lib/coverLetterService';
import {
  Sparkles,
  Building,
  Briefcase,
  Globe,
  Sliders,
  AlertCircle,
  Link2,
  Layout,
  FileCheck,
  Loader2,
  RotateCcw,
  Upload,
  FileText,
  CheckCircle2,
} from 'lucide-react';

const TEMPLATE_PRESETS = [
  { id: 'compact', labelAr: 'مدمج رسمي (Compact)', labelEn: 'Compact ATS' },
  { id: 'modern', labelAr: 'عصري تقني (Modern)', labelEn: 'Modern Indigo' },
  { id: 'classic', labelAr: 'كلاسيكي تنفيذي (Classic)', labelEn: 'Classic Executive' },
  { id: 'ats-friendly', labelAr: 'أزرق احترافي (ATS-Friendly)', labelEn: 'ATS Blue Accent' },
];

export default function CoverLetterPage() {
  const { user } = useAuth();

  // User's saved resumes to pick from
  const [savedResumes, setSavedResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  // Form State
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [hiringManager, setHiringManager] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [templateId, setTemplateId] = useState('compact');
  const [inputMode, setInputMode] = useState<'text' | 'url' | 'file'>('text');
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedTags, setExtractedTags] = useState<string[]>([]);
  const [tone, setTone] = useState<CoverLetterTone>('formal');
  const [language, setLanguage] = useState<CoverLetterLanguage>('ar');

  // Sender details
  const [senderName, setSenderName] = useState(user?.name || '');
  const [senderEmail, setSenderEmail] = useState(user?.email || '');
  const [senderPhone, setSenderPhone] = useState('');

  // UX & Flow States: 'input' | 'generating' | 'preview'
  const [activeView, setActiveView] = useState<'input' | 'generating' | 'preview'>('input');
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [generationStep, setGenerationStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [draftsCount, setDraftsCount] = useState(0);

  // Result & Errors
  const [generatedLetter, setGeneratedLetter] = useState<CoverLetterData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Restore cached form inputs to guarantee Zero Data Loss on reload/navigation
  useEffect(() => {
    try {
      const cached = localStorage.getItem('jobmatch_cover_letter_form_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          if (parsed.companyName && !companyName) setCompanyName(parsed.companyName);
          if (parsed.jobTitle && !jobTitle) setJobTitle(parsed.jobTitle);
          if (parsed.hiringManager && !hiringManager) setHiringManager(parsed.hiringManager);
          if (parsed.jobDescription && !jobDescription) setJobDescription(parsed.jobDescription);
          if (parsed.customNotes && !customNotes) setCustomNotes(parsed.customNotes);
          if (parsed.tone) setTone(parsed.tone);
          if (parsed.language) setLanguage(parsed.language);
          if (parsed.templateId) setTemplateId(parsed.templateId);
          if (parsed.jobUrl && !jobUrl) setJobUrl(parsed.jobUrl);
        }
      }
    } catch {}
  }, []);

  // Auto-persist form inputs into local cache with 350ms debounce for peak typing performance
  useEffect(() => {
    if (activeView !== 'input') return;

    const debounceTimer = setTimeout(() => {
      if (companyName || jobTitle || jobDescription || jobUrl) {
        try {
          localStorage.setItem(
            'jobmatch_cover_letter_form_cache',
            JSON.stringify({
              companyName,
              jobTitle,
              hiringManager,
              jobDescription,
              customNotes,
              tone,
              language,
              templateId,
              jobUrl,
            })
          );
        } catch {}
      }
    }, 350);

    return () => clearTimeout(debounceTimer);
  }, [companyName, jobTitle, hiringManager, jobDescription, customNotes, tone, language, templateId, jobUrl, activeView]);

  // Fetch user resumes and drafts count if logged in
  useEffect(() => {
    if (user) {
      if (!senderName) setSenderName(user.name);
      if (!senderEmail) setSenderEmail(user.email);

      fetch('/api/resumes')
        .then((res) => (res.ok ? res.json() : { resumes: [] }))
        .then((data) => {
          if (data.resumes && data.resumes.length > 0) {
            setSavedResumes(data.resumes);
            setSelectedResumeId(data.resumes[0].id);
            populateFromResume(data.resumes[0]);
            if (data.resumes[0].templateId) {
              setTemplateId(data.resumes[0].templateId);
            }
          }
        })
        .catch((err) => console.error('Error fetching resumes:', err));

      fetch('/api/cover-letters?limit=1')
        .then((res) => (res.ok ? res.json() : { pagination: { total: 0 } }))
        .then((data) => {
          if (data.pagination?.total !== undefined) {
            setDraftsCount(data.pagination.total);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const populateFromResume = (resume: { data?: { personalInfo?: { fullName?: string; email?: string; phone?: string; jobTitle?: string } } } | null | undefined) => {
    if (!resume?.data?.personalInfo) return;
    const p = resume.data.personalInfo;
    if (p.fullName) setSenderName(p.fullName);
    if (p.email) setSenderEmail(p.email);
    if (p.phone) setSenderPhone(p.phone);
    if (p.jobTitle && !jobTitle) setJobTitle(p.jobTitle);
  };

  const handleResumeSelectChange = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    const resume = savedResumes.find((r: any) => r.id === resumeId);
    if (resume) {
      populateFromResume(resume);
      if (resume.templateId && typeof resume.templateId === 'string') {
        setTemplateId(resume.templateId);
      }
    }
  };

  // Safe file extraction for job descriptions (PDF / TXT / DOCX)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError(language === 'ar' ? 'حجم الملف يتجاوز الحد الأقصى المسموح (5 ميجابايت)' : 'File size exceeds 5MB limit');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt', 'doc', 'docx'].includes(ext || '')) {
      setFormError(language === 'ar' ? 'صيغة الملف غير مدعومة. يرجى رفع ملف PDF أو TXT أو DOCX' : 'Unsupported format. Please upload PDF, TXT, or DOCX');
      return;
    }

    setIsExtractingFile(true);
    setFormError(null);
    try {
      const extractedText = await extractTextFromFile(file);
      if (CoverLetterService.isGarbledOrBinaryText(extractedText)) {
        throw new Error(
          language === 'ar'
            ? 'الملف المرفوع يحتوي على بيانات مشفرة أو غير مقروءة. يرجى استخدام ملف PDF نصي أو TXT، أو نسخ ولصق النص مباشرة.'
            : 'The uploaded file contains binary or unreadable content. Please upload a standard text PDF or TXT, or paste the text directly.'
        );
      }
      const cleaned = CoverLetterService.cleanDisplayText(extractedText);
      if (cleaned.length < 25) {
        throw new Error(language === 'ar' ? 'المحتوى المستخرج من الملف قصير جداً أو غير قابل للقراءة' : 'Extracted content is too short or unreadable');
      }

      setJobDescription(cleaned);
      setUploadedFileName(file.name);

      const detectedLang = CoverLetterService.detectLanguage(cleaned);
      setLanguage(detectedLang);
      const kws = CoverLetterService.extractKeywords(cleaned, 10);
      if (kws.length > 0) setExtractedTags(kws);

      showToast(
        language === 'ar'
          ? `تم استخراج محتوى الإعلان بنجاح (${file.name})`
          : `Extracted job description from (${file.name})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء قراءة الملف';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsExtractingFile(false);
      e.target.value = '';
    }
  };

  // Extract keywords and description snippet from URL
  const handleExtractFromUrl = async () => {
    if (isExtractingUrl) return; // Guard against double trigger
    if (!jobUrl.trim()) {
      setFormError(language === 'ar' ? 'يرجى إدخال رابط الوظيفة أولاً' : 'Please enter a job URL first');
      return;
    }

    const cleanUrl = jobUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setFormError(
        language === 'ar'
          ? 'يجب أن يبدأ الرابط بـ https:// أو http://'
          : 'Job URL must start with https:// or http://'
      );
      return;
    }

    setIsExtractingUrl(true);
    setFormError(null);
    try {
      const res = await fetch('/api/cover-letter/extract-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.keywords && data.keywords.length > 0) {
          setExtractedTags(data.keywords);
        }
        if (data.detectedLanguage) {
          setLanguage(data.detectedLanguage);
        }
        if (data.snippet && !jobDescription.trim()) {
          setJobDescription(CoverLetterService.cleanDisplayText(data.snippet));
        }
        showToast(
          language === 'ar'
            ? `تم استخراج ${data.count || data.keywords.length} كلمة مفتاحية بنجاح من الرابط!`
            : `Extracted ${data.count || data.keywords.length} keywords from URL!`
        );
      } else {
        const errorMsg = data.error || (language === 'ar' ? 'تعذر استخراج البيانات من الرابط' : 'Failed to extract from URL');
        setFormError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (language === 'ar' ? 'حدث خطأ أثناء جلب الرابط' : 'Network error while fetching URL');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsExtractingUrl(false);
    }
  };

  // Trigger Generation with comprehensive input validation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating || activeView === 'generating') return; // Guard against double submission
    setFormError(null);

    const hasDesc = jobDescription.trim().length >= 25;
    const hasValidUrl = jobUrl.trim().startsWith('http://') || jobUrl.trim().startsWith('https://');

    if (!hasDesc && !hasValidUrl) {
      setFormError(
        language === 'ar'
          ? 'يرجى إدخال وصف وظيفي (25 حرفاً على الأقل) أو توفير رابط إعلان وظيفي صحيح.'
          : 'Please provide a detailed job description (at least 25 characters) or a valid job URL.'
      );
      return;
    }

    if (!senderName.trim()) {
      setFormError(language === 'ar' ? 'يرجى كتابة اسمك الكامل كمرسل للخطاب.' : 'Please enter your full name as sender.');
      return;
    }

    // Phone format validation if supplied
    if (senderPhone.trim()) {
      const phoneClean = senderPhone.trim();
      if (phoneClean.length > 40 || !/^[0-9+()\-.\s]{5,40}$/.test(phoneClean)) {
        setFormError(language === 'ar' ? 'صيغة رقم الهاتف غير صالحة. يرجى إدخال رقم صحيح.' : 'Invalid phone number format.');
        return;
      }
    }

    setIsGenerating(true);
    setActiveView('generating');
    setGenerationStep(1);

    const stepTimer1 = setTimeout(() => setGenerationStep(2), 600);
    const stepTimer2 = setTimeout(() => setGenerationStep(3), 1300);
    const stepTimer3 = setTimeout(() => setGenerationStep(4), 2000);

    try {
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: jobDescription.trim() || undefined,
          jobUrl: jobUrl.trim() || undefined,
          jobTitle: jobTitle.trim() || (language === 'ar' ? 'الوظيفة المعلنة' : 'Position'),
          companyName: companyName.trim() || (language === 'ar' ? 'الشركة الموقرة' : 'the Company'),
          hiringManager: hiringManager.trim() || (language === 'ar' ? 'فريق الموارد البشرية' : 'Hiring Team'),
          tone,
          language,
          sender: {
            fullName: senderName.trim(),
            email: senderEmail.trim(),
            phone: senderPhone.trim(),
          },
          resumeId: selectedResumeId || undefined,
          customNotes: customNotes.trim() || undefined,
          templateId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.coverLetter) {
        setGeneratedLetter(data.coverLetter);
        setExtractedTags(data.extractedKeywords || data.coverLetter.extractedKeywords || []);
        setIsDirty(false);
        setActiveView('preview');
        setMobileTab('preview');
        showToast(
          language === 'ar'
            ? 'تم توليد خطاب التقديم المخصص بالذكاء الاصطناعي بنجاح!'
            : 'Tailored cover letter generated successfully!'
        );
      } else {
        setActiveView('input');
        setFormError(data.error || (language === 'ar' ? 'حدث خطأ أثناء معالجة الطلب.' : 'Error generating cover letter.'));
        showToast(data.error || (language === 'ar' ? 'تعذر توليد الخطاب، يرجى مراجعة المدخلات' : 'Generation failed'), 'error');
      }
    } catch (err: unknown) {
      setActiveView('input');
      const msg = err instanceof Error ? err.message : (language === 'ar' ? 'حدث خطأ في الاتصال بالخادم.' : 'Server connection failed.');
      setFormError(msg);
      showToast(language === 'ar' ? 'فشل الاتصال بالخادم' : 'Server connection failed', 'error');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsGenerating(false);
    }
  };

  const saveLocalBackup = (letter: CoverLetterData) => {
    try {
      const saved = JSON.parse(localStorage.getItem('jobmatch_cover_letters') || '[]');
      const filtered = saved.filter((d: { id?: string }) => d.id !== letter.id);
      filtered.unshift(letter);
      localStorage.setItem('jobmatch_cover_letters', JSON.stringify(filtered));
      localStorage.setItem('jobmatch_cover_letter_last_backup', JSON.stringify(letter));
    } catch {}
  };

  // Save to DB Drafts with Zero Data Loss Guarantee
  const handleSaveDraft = async () => {
    if (!generatedLetter || isSaving) return;
    setIsSaving(true);

    const hasServerId = generatedLetter.id && !generatedLetter.id.startsWith('cl_local_');

    try {
      if (hasServerId) {
        // Update existing document via PATCH
        const res = await fetch(`/api/cover-letters/${generatedLetter.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: generatedLetter.title,
            companyName: generatedLetter.recipient.companyName,
            jobTitle: generatedLetter.recipient.jobTitle,
            tone: generatedLetter.tone,
            language: generatedLetter.language,
            templateId: generatedLetter.templateId,
            content: generatedLetter.content,
            recipient: generatedLetter.recipient,
            sender: generatedLetter.sender,
            status: 'saved',
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setIsDirty(false);
          saveLocalBackup(generatedLetter);
          showToast(language === 'ar' ? 'تم تحديث مسودة الخطاب وحفظ التعديلات بنجاح!' : 'Draft updated successfully!');
        } else {
          saveLocalBackup(generatedLetter);
          showToast(data.error || (language === 'ar' ? 'تعذر التحديث سحابياً، وتم تأمين النسخة محلياً' : 'Saved locally as backup'), 'error');
        }
      } else {
        // Create new document via POST
        const res = await fetch('/api/cover-letters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generatedLetter),
        });

        const data = await res.json();
        if (res.ok && data.success && data.coverLetter) {
          const updated = { ...generatedLetter, id: data.coverLetter.id };
          setGeneratedLetter(updated);
          setDraftsCount((prev) => prev + 1);
          setIsDirty(false);
          saveLocalBackup(updated);
          showToast(language === 'ar' ? 'تم حفظ مسودة الخطاب بنجاح في حسابك' : 'Cover letter draft saved successfully!');
        } else {
          // Zero data loss fallback
          const localId = generatedLetter.id || 'cl_local_' + Date.now();
          const localDraft = { ...generatedLetter, id: localId };
          setGeneratedLetter(localDraft);
          saveLocalBackup(localDraft);
          setDraftsCount((prev) => prev + 1);
          setIsDirty(false);
          showToast(
            language === 'ar'
              ? 'تم حفظ المسودة في الذاكرة المحلية بأمان (لم تفقد أي بيانات)'
              : 'Draft safely saved locally (zero data loss)',
            'success'
          );
        }
      }
    } catch {
      // Offline / Network Failure - Zero Data Loss Guarantee
      const localId = generatedLetter.id || 'cl_local_' + Date.now();
      const localDraft = { ...generatedLetter, id: localId };
      setGeneratedLetter(localDraft);
      saveLocalBackup(localDraft);
      setIsDirty(false);
      showToast(
        language === 'ar'
          ? 'تعذر الاتصال بالخادم، ولكن تم حفظ كامل مسودتك وتعديلاتك محلياً بأمان!'
          : 'Network error: full draft saved locally with zero data loss!',
        'success'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form or start new letter
  const handleResetRequest = () => {
    if (isDirty) {
      setShowResetConfirm(true);
    } else {
      executeReset();
    }
  };

  const executeReset = () => {
    setShowResetConfirm(false);
    setGeneratedLetter(null);
    setIsDirty(false);
    setActiveView('input');
    setMobileTab('form');
    setJobDescription('');
    setJobUrl('');
    setUploadedFileName(null);
    setExtractedTags([]);
    setCustomNotes('');
    setFormError(null);
    try {
      localStorage.removeItem('jobmatch_cover_letter_form_cache');
    } catch {}
    showToast(language === 'ar' ? 'تمت إعادة ضبط النموذج لكتابة خطاب جديد' : 'Form reset for new letter');
  };

  const handleSelectSavedDraft = async (draft: CoverLetterData) => {
    let fullDraft = draft;
    if (!draft.content?.fullText && draft.id && !draft.id.startsWith('cl_local_')) {
      try {
        const res = await fetch(`/api/cover-letters/${draft.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.coverLetter) {
            fullDraft = data.coverLetter;
          }
        }
      } catch (err) {
        console.error('Error fetching full draft details:', err);
      }
    }

    setGeneratedLetter(fullDraft);
    setIsDirty(false);
    if (fullDraft.recipient?.companyName) setCompanyName(fullDraft.recipient.companyName);
    if (fullDraft.recipient?.jobTitle) setJobTitle(fullDraft.recipient.jobTitle);
    if (fullDraft.recipient?.hiringManager) setHiringManager(fullDraft.recipient.hiringManager);
    if (fullDraft.tone) setTone(fullDraft.tone);
    if (fullDraft.language) setLanguage(fullDraft.language);
    if (fullDraft.templateId) setTemplateId(fullDraft.templateId);
    if (fullDraft.extractedKeywords && fullDraft.extractedKeywords.length > 0) {
      setExtractedTags(fullDraft.extractedKeywords);
    }
    setActiveView('preview');
    setMobileTab('preview');
  };

  const handleDraftDeleted = (deletedId: string) => {
    setDraftsCount((prev) => Math.max(0, prev - 1));
    if (generatedLetter && generatedLetter.id === deletedId) {
      setGeneratedLetter((prev) => (prev ? { ...prev, id: undefined } : null));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      <Navbar />

      {/* Floating Notification Toast */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-2xl border text-xs font-bold transition-all flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === 'error'
              ? 'bg-red-500/90 text-white border-red-400'
              : 'bg-emerald-600/95 text-white border-emerald-400'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <FileCheck className="w-4 h-4 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Hero Component */}
        <CoverLetterHero
          onOpenDrafts={() => setIsDraftsModalOpen(true)}
          draftsCount={draftsCount}
        />

        {/* Mobile Navigation Tabs (Form vs Preview) */}
        <div className="lg:hidden flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setMobileTab('form')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mobileTab === 'form' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            بيانات الإعلان والتقديم 📝
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mobileTab === 'preview' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            معاينة الخطاب 📄 {generatedLetter && '✓'}
          </button>
        </div>

        {/* Split View Grid: Form (Left) & Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Input Form */}
          <div
            className={`lg:col-span-5 space-y-5 ${
              mobileTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            <form onSubmit={handleGenerate} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-sm shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>تخصيص متطلبات الخطاب</span>
                </span>
                {generatedLetter && (
                  <button
                    type="button"
                    onClick={handleResetRequest}
                    disabled={isGenerating}
                    className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>خطاب جديد</span>
                  </button>
                )}
              </div>

              {/* Form Error Alert */}
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{formError}</span>
                </div>
              )}

              {/* Resume Selector (if user has saved resumes) */}
              {savedResumes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>اختر سيرة ذاتية لربط المهارات تلقائياً:</span>
                    <span className="text-[10px] text-cyan-400">تعبئة ذكية ومطابقة</span>
                  </label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => handleResumeSelectChange(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  >
                    {savedResumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        📄 {r.title || 'سيرة ذاتية'} ({r.templateId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Company & Job Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>اسم الشركة / الجهة *</span>
                    <span className="text-[10px] text-slate-500">{companyName.length}/120</span>
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={companyName}
                      disabled={isGenerating}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="مثال: Google, أرامكو"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>المسمى الوظيفي المستهدف *</span>
                    <span className="text-[10px] text-slate-500">{jobTitle.length}/120</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={jobTitle}
                      disabled={isGenerating}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="مثال: مهندس برمجيات، مدير مبيعات"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Language & Template Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>لغة الخطاب</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => setLanguage(lang.id)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
                          language === lang.id
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Layout className="w-3.5 h-3.5 text-amber-400" />
                    <span>تنسيق القالب الموازي للسيرة</span>
                  </label>
                  <select
                    value={templateId}
                    disabled={isGenerating}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  >
                    {TEMPLATE_PRESETS.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {language === 'ar' ? tp.labelAr : tp.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tone Selection Component */}
              <ToneCardSelector
                selectedTone={tone}
                onChange={setTone}
                language={language}
              />

              {/* Mode Toggle: Direct Text vs URL Extraction vs File Upload */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center p-0.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setInputMode('text')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                        inputMode === 'text'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      نص الإعلان 📄
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setInputMode('url')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                        inputMode === 'url'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      <span>رابط 🔗</span>
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setInputMode('file')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                        inputMode === 'file'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>ملف 📁</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400">
                    {jobDescription.length > 0 && `${jobDescription.length} حرف`}
                  </span>
                </div>

                {/* File Upload Mode */}
                {inputMode === 'file' ? (
                  <div className="p-4 bg-slate-950/70 border-2 border-dashed border-slate-700/80 rounded-2xl text-center space-y-2 hover:border-amber-400/50 transition-colors">
                    <label className="cursor-pointer block space-y-2">
                      <input
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={isExtractingFile || isGenerating}
                        className="hidden"
                      />
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-amber-400">
                        {isExtractingFile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          {isExtractingFile ? 'جاري قراءة محتوى الملف...' : 'اضغط لاختيار ملف الإعلان الوظيفي'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          يدعم ملفات PDF و TXT و DOCX حتى 5 ميجابايت
                        </p>
                      </div>
                    </label>
                    {uploadedFileName && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                        <span className="truncate flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{uploadedFileName}</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> تم الاستخراج
                        </span>
                      </div>
                    )}
                  </div>
                ) : inputMode === 'url' ? (
                  <div className="space-y-2 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                    <label className="block text-xs font-semibold text-slate-300">
                      رابط صفحة الوظيفة (LinkedIn, Indeed, موقع التوظيف):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={jobUrl}
                        disabled={isExtractingUrl || isGenerating}
                        onChange={(e) => setJobUrl(e.target.value)}
                        placeholder="https://example.com/careers/job-123"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={handleExtractFromUrl}
                        disabled={isExtractingUrl || isGenerating || !jobUrl.trim()}
                        className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        {isExtractingUrl && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isExtractingUrl ? 'جاري السحب...' : 'استخراج ذكي'}</span>
                      </button>
                    </div>
                    {extractedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="text-[10px] text-cyan-300 font-semibold block w-full">الكلمات المستخرجة:</span>
                        {extractedTags.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                    rows={5}
                    value={jobDescription}
                    disabled={isGenerating}
                    maxLength={35000}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="الصق هنا نص الإعلان الوظيفي أو المتطلبات والمسؤوليات المطلوبة..."
                    className="w-full p-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 leading-relaxed resize-none placeholder-slate-500 disabled:opacity-50"
                  />
                )}
              </div>

              {/* Custom Notes (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>ملاحظات أو تركيز إضافي ترغب بتضمينه (اختياري)</span>
                  <span className="text-[10px] text-slate-500">{customNotes.length}/500</span>
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={customNotes}
                  disabled={isGenerating}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="مثال: ركز على خبرتي في إدارة المشاريع السحابية والانتقال بين الفرق"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/70 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                />
              </div>

              {/* Sender Info Accordion */}
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  بيانات المرسل (أنت)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={senderName}
                    disabled={isGenerating}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="اسمك الكامل"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white disabled:opacity-50"
                  />
                  <input
                    type="email"
                    value={senderEmail}
                    disabled={isGenerating}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="بريدك الإلكتروني"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white disabled:opacity-50"
                  />
                  <input
                    type="tel"
                    value={senderPhone}
                    disabled={isGenerating}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="رقم هاتفك"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Submit Generate Button */}
              <button
                type="submit"
                disabled={isGenerating || activeView === 'generating'}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating || activeView === 'generating' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{language === 'ar' ? 'جاري التحليل والتوليد الذكي...' : 'Analyzing & Generating...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>{language === 'ar' ? 'توليد خطاب التقديم بالذكاء الاصطناعي' : 'Generate AI Cover Letter'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Preview & Interactive Letter State */}
          <div
            className={`lg:col-span-7 space-y-4 ${
              mobileTab === 'form' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* GENERATING STATE */}
            {activeView === 'generating' && (
              <GeneratingStepper
                currentStep={generationStep}
                language={language}
                tone={tone}
              />
            )}

            {/* EMPTY STATE */}
            {activeView === 'input' && !generatedLetter && (
              <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-8 sm:p-12 text-center backdrop-blur-sm min-h-[480px] flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                  <Sparkles className="w-8 h-8 text-amber-400/60" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-base font-bold text-white">الخطاب المخصص سيظهر هنا</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    أدخل بيانات الوظيفة والشركة على اليمين واضغط على زر التوليد لصياغة خطاب متناسق تماماً مع اشتراطات الوظيفة.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-400 pt-2">
                  <span className="p-2 rounded-xl bg-slate-800/60 border border-slate-800">🎯 مطابقة كلمات مفتاحية</span>
                  <span className="p-2 rounded-xl bg-slate-800/60 border border-slate-800">🌐 عربي وإنجليزي</span>
                  <span className="p-2 rounded-xl bg-slate-800/60 border border-slate-800">📄 تصدير PDF مباشر</span>
                </div>
              </div>
            )}

            {/* PREVIEW / SUCCESS STATE */}
            {(activeView === 'preview' || generatedLetter) && generatedLetter && (
              <CoverLetterPreview
                coverLetter={generatedLetter}
                onUpdate={(updated) => {
                  setGeneratedLetter(updated);
                  setIsDirty(true);
                }}
                onSaveDraft={handleSaveDraft}
                isSaving={isSaving}
                isDirty={isDirty}
                onResetRequest={handleResetRequest}
                showToast={showToast}
              />
            )}
          </div>
        </div>
      </main>

      {/* Saved Drafts Modal */}
      <SavedDraftsModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        onSelectDraft={handleSelectSavedDraft}
        onDraftDeleted={handleDraftDeleted}
        showToast={showToast}
      />

      {/* Confirmation Dialog for Resetting with Unsaved Changes */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="تجاهل التعديلات والبدء من جديد؟"
        message="لديك تعديلات حالية على خطاب التقديم لم يتم حفظها كمسودة. إذا تابعت، سيتم مسح التعديلات غير المحفوظة والعودة لنموذج الإدخال."
        confirmText="نعم، ابدأ من جديد"
        cancelText="العودة للحفظ"
        variant="warning"
        onConfirm={executeReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
