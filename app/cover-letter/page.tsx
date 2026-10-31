'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '@/components/ui/Button';
import {
  CoverLetterData,
  CoverLetterTone,
  CoverLetterLanguage,
} from './types';
import {
  LANGUAGE_OPTIONS,
} from './constants';
import {
  DOCUMENT_LANGUAGE_OPTIONS,
  getStoredDocumentLanguage,
  setStoredDocumentLanguage,
} from '@/app/lib/documentI18n';
import { CoverLetterHero } from './components/CoverLetterHero';
import { ToneCardSelector } from './components/ToneCardSelector';
import { GeneratingStepper } from './components/GeneratingStepper';
import { CoverLetterPreview } from './components/CoverLetterPreview';
import dynamic from 'next/dynamic';
import { CoverLetterHistory } from './components/CoverLetterHistory';
const SavedDraftsModal = dynamic(
  () => import('./components/SavedDraftsModal').then((m) => m.SavedDraftsModal),
  { ssr: false }
);
const ConfirmModal = dynamic(
  () => import('./components/ConfirmModal').then((m) => m.ConfirmModal),
  { ssr: false }
);
const UpgradeModal = dynamic(() => import('../components/UpgradeModal'), {
  ssr: false,
});
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { extractTextFromFile } from '../lib/pdfExtractor';
import { CoverLetterService } from '../lib/coverLetterService';
import { trackAiGenerationUsed, trackCreditsExhausted } from '@/lib/analytics';
import {
  Sparkles,
  Building,
  Briefcase,
  Globe,
  Sliders,
  AlertCircle,
  Link2,
  FileCheck,
  Loader2,
  RotateCcw,
  Upload,
  FileText,
  CheckCircle2,
  Eye,
  RefreshCw,
  X,
  History,
} from 'lucide-react';

export default function CoverLetterPage() {
  const { user, refreshUser } = useAuth();
  const { t, isRtl, language: uiLang } = useLanguage();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
  const [language, setLanguage] = useState<CoverLetterLanguage>(() => {
    return (getStoredDocumentLanguage('en') as CoverLetterLanguage) || 'en';
  });

  // Sender details
  const [senderName, setSenderName] = useState(user?.name || '');
  const [senderEmail, setSenderEmail] = useState(user?.email || '');
  const [senderPhone, setSenderPhone] = useState('');

  // UX & Flow States: 'input' | 'generating' | 'preview'
  const [activeView, setActiveView] = useState<'input' | 'generating' | 'preview'>('input');
  const [mobileTab, setMobileTab] = useState<'form' | 'preview' | 'history'>('form');
  const [generationStep, setGenerationStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [draftsCount, setDraftsCount] = useState(0);

  // History state
  const [historyLetters, setHistoryLetters] = useState<CoverLetterData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Result & Errors
  const [generatedLetter, setGeneratedLetter] = useState<CoverLetterData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastFailedPayload, setLastFailedPayload] = useState<Record<string, unknown> | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // AbortController for cancel generation
  const abortControllerRef = useRef<AbortController | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const isAr = uiLang === 'ar';

  // Restore cached form inputs
  useEffect(() => {
    try {
      const stored = getStoredDocumentLanguage();
      if (stored) {
        setLanguage(stored as CoverLetterLanguage);
      }
      const cached = localStorage.getItem('jobmatch_cover_letter_form_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          if (parsed.companyName) setCompanyName((prev) => prev || parsed.companyName);
          if (parsed.jobTitle) setJobTitle((prev) => prev || parsed.jobTitle);
          if (parsed.hiringManager) setHiringManager((prev) => prev || parsed.hiringManager);
          if (parsed.jobDescription) setJobDescription((prev) => prev || parsed.jobDescription);
          if (parsed.customNotes) setCustomNotes((prev) => prev || parsed.customNotes);
          if (parsed.tone) setTone(parsed.tone);
          if (parsed.language) {
            setLanguage(parsed.language);
            setStoredDocumentLanguage(parsed.language);
          }
          if (parsed.templateId) setTemplateId(parsed.templateId);
          if (parsed.jobUrl) setJobUrl((prev) => prev || parsed.jobUrl);
        }
      }
    } catch {
      // Ignore localStorage / JSON parse errors in restricted browsing modes
    }
  }, []);

  // Auto-persist form inputs into local cache
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
        } catch {
          // Ignore localStorage quota or security restrictions
        }
      }
    }, 350);

    return () => clearTimeout(debounceTimer);
  }, [companyName, jobTitle, hiringManager, jobDescription, customNotes, tone, language, templateId, jobUrl, activeView]);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/cover-letters?limit=50&summary=false');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.coverLetters)) {
          setHistoryLetters(data.coverLetters);
          setDraftsCount(data.coverLetters.length);
          return;
        }
      }
      const local = JSON.parse(localStorage.getItem('jobmatch_cover_letters') || '[]');
      setHistoryLetters(local);
      setDraftsCount(local.length);
    } catch {
      // Fallback to localStorage drafts when offline or unauthenticated
      const local = JSON.parse(localStorage.getItem('jobmatch_cover_letters') || '[]');
      setHistoryLetters(local);
      setDraftsCount(local.length);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const populateFromResume = useCallback(
    (resume: { data?: { personalInfo?: { fullName?: string; email?: string; phone?: string; jobTitle?: string } } } | null | undefined) => {
      if (!resume?.data?.personalInfo) return;
      const p = resume.data.personalInfo;
      if (p.fullName) setSenderName(p.fullName);
      if (p.email) setSenderEmail(p.email);
      if (p.phone) setSenderPhone(p.phone);
      if (p.jobTitle) setJobTitle((prev) => prev || p.jobTitle!);
    },
    []
  );

  // Fetch user resumes and drafts count if logged in
  useEffect(() => {
    if (user) {
      if (user.name) setSenderName((prev) => prev || user.name);
      if (user.email) setSenderEmail((prev) => prev || user.email);

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
    }
    loadHistory();
  }, [user, loadHistory, populateFromResume]);

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

  // Safe file extraction for job descriptions
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError(isAr ? 'حجم الملف يتجاوز الحد الأقصى (5 ميجابايت)' : 'File size exceeds 5MB limit');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt', 'doc', 'docx'].includes(ext || '')) {
      setFormError(isAr ? 'صيغة الملف غير مدعومة. يرجى رفع ملف PDF أو TXT أو DOCX' : 'Unsupported format. Please upload PDF, TXT, or DOCX');
      return;
    }

    setIsExtractingFile(true);
    setFormError(null);
    try {
      const extractedText = await extractTextFromFile(file);
      if (CoverLetterService.isGarbledOrBinaryText(extractedText)) {
        throw new Error(
          isAr
            ? 'الملف المرفوع يحتوي على بيانات مشفرة أو غير مقروءة. يرجى استخدام ملف نصي أو نسخ النص مباشرة.'
            : 'The uploaded file contains binary or unreadable content. Please upload a standard text document or paste the text directly.'
        );
      }
      const cleaned = CoverLetterService.cleanDisplayText(extractedText);
      if (cleaned.length < 25) {
        throw new Error(isAr ? 'المحتوى المستخرج قصير جداً أو غير مقروء' : 'Extracted content is too short or unreadable');
      }

      setJobDescription(cleaned);
      setUploadedFileName(file.name);

      const detectedLang = CoverLetterService.detectLanguage(cleaned);
      setLanguage(detectedLang);
      const kws = CoverLetterService.extractKeywords(cleaned, 10);
      if (kws.length > 0) setExtractedTags(kws);

      showToast(
        isAr
          ? `تم استخراج محتوى الإعلان (${file.name})`
          : `Extracted job description from (${file.name})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isAr ? 'حدث خطأ أثناء قراءة الملف' : 'File parsing failed');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsExtractingFile(false);
      e.target.value = '';
    }
  };

  // Extract from URL
  const handleExtractFromUrl = async () => {
    if (isExtractingUrl) return;
    if (!jobUrl.trim()) {
      setFormError(isAr ? 'يرجى إدخال رابط الوظيفة أولاً' : 'Please enter a job URL first');
      return;
    }

    const cleanUrl = jobUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setFormError(isAr ? 'يجب أن يبدأ الرابط بـ https:// أو http://' : 'Job URL must start with https:// or http://');
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
          isAr
            ? `تم استخراج ${data.count || data.keywords.length} كلمة مفتاحية من الرابط`
            : `Extracted ${data.count || data.keywords.length} keywords from URL`
        );
      } else {
        const errorMsg = data.error || (isAr ? 'تعذر استخراج البيانات من الرابط' : 'Failed to extract from URL');
        setFormError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isAr ? 'حدث خطأ أثناء جلب الرابط' : 'Network error while fetching URL');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsExtractingUrl(false);
    }
  };

  const handleLanguageChange = (newLang: CoverLetterLanguage) => {
    setLanguage(newLang);
    setStoredDocumentLanguage(newLang);
    if (generatedLetter) {
      setGeneratedLetter((prev) => (prev ? { ...prev, language: newLang } : null));
      setIsDirty(true);
    }
  };

  // Cancel in-flight generation
  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setActiveView('input');
    setMobileTab('form');
    showToast(
      isAr ? 'تم إلغاء التوليد والعودة للنموذج' : 'Generation cancelled by user'
    );
  };

  // Generate Letter with optional job description support and AbortController
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGenerating || activeView === 'generating') return;
    setFormError(null);
    setLastFailedPayload(null);

    // Validate minimum required fields
    if (!jobTitle.trim()) {
      setFormError(isAr ? 'يرجى إدخال المسمى الوظيفي المستهدف.' : 'Please enter target job title.');
      return;
    }

    if (!companyName.trim()) {
      setFormError(isAr ? 'يرجى إدخال اسم الشركة.' : 'Please enter company name.');
      return;
    }

    if (!senderName.trim()) {
      setFormError(isAr ? 'يرجى كتابة اسمك كمرسل للخطاب.' : 'Please enter your name as sender.');
      return;
    }

    if (senderPhone.trim()) {
      const phoneClean = senderPhone.trim();
      if (phoneClean.length > 40 || !/^[0-9+()\-.\s]{5,40}$/.test(phoneClean)) {
        setFormError(isAr ? 'صيغة رقم الهاتف غير صالحة.' : 'Invalid phone number format.');
        return;
      }
    }

    // Contextual description fallback if user left job description empty
    const resolvedDescription = jobDescription.trim() || (
      language === 'ar'
        ? `الوظيفة المعلنة: ${jobTitle.trim()} في شركة ${companyName.trim()}. نبحث عن مرشح طموح ومتميز يمتلك الكفاءة والمهارات المناسبة للمساهمة في تحقيق أهداف المؤسسة وتطوير الأعمال.`
        : `Target Position: ${jobTitle.trim()} at ${companyName.trim()}. Seeking an accomplished and driven professional with relevant skills, strong dedication, and problem-solving abilities to contribute to key team milestones and business growth.`
    );

    const payload = {
      jobDescription: resolvedDescription,
      jobUrl: jobUrl.trim() || undefined,
      jobTitle: jobTitle.trim(),
      companyName: companyName.trim(),
      hiringManager: hiringManager.trim() || (isAr ? 'فريق التوظيف' : 'Hiring Team'),
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
    };

    setIsGenerating(true);
    setActiveView('generating');
    setMobileTab('preview');
    setGenerationStep(1);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const stepTimer1 = setTimeout(() => setGenerationStep(2), 600);
    const stepTimer2 = setTimeout(() => setGenerationStep(3), 1300);
    const stepTimer3 = setTimeout(() => setGenerationStep(4), 2000);

    try {
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await res.json();

      // Paywall / Credit Exhaustion Check (HTTP 402)
      if (res.status === 402 || data.error === 'NO_CREDITS') {
        trackCreditsExhausted();
        setActiveView('input');
        setMobileTab('form');
        setShowUpgradeModal(true);
        const creditErrorMsg = isAr
          ? 'نفد رصيدك المجاني لتوليد الذكاء الاصطناعي (3/3). يرجى الترقية إلى باقة برو للاستمرار.'
          : 'You have used all 3 free AI generation credits. Please upgrade to Pro for unlimited generations.';
        setFormError(creditErrorMsg);
        showToast(creditErrorMsg, 'error');
        return;
      }

      if (res.ok && data.success && data.coverLetter) {
        trackAiGenerationUsed('cover_letter');
        setGeneratedLetter(data.coverLetter);
        setExtractedTags(data.extractedKeywords || data.coverLetter.extractedKeywords || []);
        setIsDirty(false);
        setActiveView('preview');
        setMobileTab('preview');
        saveLocalBackup(data.coverLetter);

        // Prepend to history
        setHistoryLetters((prev) => [data.coverLetter, ...prev.filter((cl) => cl.id !== data.coverLetter.id)]);
        setDraftsCount((prev) => prev + 1);

        if (typeof refreshUser === 'function') {
          refreshUser();
        }
        showToast(
          isAr
            ? 'تمت صياغة خطاب التقديم بنجاح'
            : 'Cover letter generated successfully'
        );
      } else {
        setActiveView('input');
        setMobileTab('form');
        const errorMsg = data.error || (isAr ? 'حدث خطأ أثناء صياغة الخطاب.' : 'Error generating cover letter.');
        setFormError(errorMsg);
        setLastFailedPayload(payload);
        showToast(errorMsg, 'error');
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        // Generation was cancelled by user
        return;
      }
      setActiveView('input');
      setMobileTab('form');
      const msg = err instanceof Error ? err.message : (isAr ? 'حدث خطأ في الاتصال بالخادم.' : 'Server connection failed.');
      setFormError(msg);
      setLastFailedPayload(payload);
      showToast(isAr ? 'فشل الاتصال بالخادم' : 'Server connection failed', 'error');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    handleGenerate();
  };

  const saveLocalBackup = (letter: CoverLetterData) => {
    try {
      const saved = JSON.parse(localStorage.getItem('jobmatch_cover_letters') || '[]');
      const filtered = saved.filter((d: { id?: string }) => d.id !== letter.id);
      filtered.unshift(letter);
      localStorage.setItem('jobmatch_cover_letters', JSON.stringify(filtered));
      localStorage.setItem('jobmatch_cover_letter_last_backup', JSON.stringify(letter));
    } catch {
      // Intentionally ignored: localStorage backup is best-effort and may fail if storage quota is exceeded
    }
  };

  // Save to DB Drafts
  const handleSaveDraft = async () => {
    if (!generatedLetter || isSaving) return;
    setIsSaving(true);

    const hasServerId = generatedLetter.id && !generatedLetter.id.startsWith('cl_local_');

    try {
      if (hasServerId) {
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
          }),
        });

        if (res.ok) {
          setIsDirty(false);
          saveLocalBackup(generatedLetter);
          showToast(isAr ? 'تم حفظ التعديلات بنجاح' : 'Changes saved successfully');
        } else {
          saveLocalBackup(generatedLetter);
          setIsDirty(false);
          showToast(isAr ? 'تم الحفظ في الذاكرة المحلية' : 'Saved to local cache');
        }
      } else {
        const res = await fetch('/api/cover-letters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generatedLetter),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.coverLetter?.id) {
            setGeneratedLetter((prev) => (prev ? { ...prev, id: data.coverLetter.id } : null));
          }
          setIsDirty(false);
          saveLocalBackup(generatedLetter);
          setDraftsCount((prev) => prev + 1);
          loadHistory();
          showToast(isAr ? 'تم حفظ المسودة في حسابك' : 'Draft saved to account');
        } else {
          saveLocalBackup(generatedLetter);
          setIsDirty(false);
          showToast(isAr ? 'تم حفظ المسودة محلياً' : 'Saved locally');
        }
      }
    } catch {
      saveLocalBackup(generatedLetter);
      setIsDirty(false);
      showToast(isAr ? 'تم حفظ المسودة محلياً' : 'Saved locally');
    } finally {
      setIsSaving(false);
    }
  };

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
    setLastFailedPayload(null);
    try {
      localStorage.removeItem('jobmatch_cover_letter_form_cache');
    } catch {
      // Intentionally ignored: localStorage may be unavailable in private browsing mode
    }
    showToast(isAr ? 'تمت إعادة ضبط النموذج' : 'Form reset');
  };

  const handleSelectHistoryLetter = async (draft: CoverLetterData) => {
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
    showToast(isAr ? 'تم فتح خطاب التقديم للتعديل' : 'Opened cover letter for editing');
  };

  const handleDeleteHistoryLetter = async (id: string) => {
    try {
      const res = await fetch(`/api/cover-letters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistoryLetters((prev) => prev.filter((cl) => cl.id !== id));
        setDraftsCount((prev) => Math.max(0, prev - 1));
        if (generatedLetter && generatedLetter.id === id) {
          setGeneratedLetter((prev) => (prev ? { ...prev, id: undefined } : null));
        }
        showToast(isAr ? 'تم حذف خطاب التقديم' : 'Cover letter deleted');
      } else {
        const local = JSON.parse(localStorage.getItem('jobmatch_cover_letters') || '[]');
        const updated = local.filter((d: { id?: string }) => d.id !== id);
        localStorage.setItem('jobmatch_cover_letters', JSON.stringify(updated));
        setHistoryLetters((prev) => prev.filter((cl) => cl.id !== id));
        setDraftsCount((prev) => Math.max(0, prev - 1));
        showToast(isAr ? 'تم حذف خطاب التقديم' : 'Cover letter deleted');
      }
    } catch {
      showToast(isAr ? 'حدث خطأ أثناء حذف الخطاب' : 'Failed to delete cover letter', 'error');
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      lang={uiLang}
      className="min-h-[100dvh] bg-paper text-ink flex flex-col selection:bg-accent-soft selection:text-accent overflow-x-clip"
    >
      {/* Floating Notification Toast */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-20 start-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-[8px] shadow-sm border text-xs font-medium transition-all flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" strokeWidth={1.5} />
          ) : (
            <FileCheck className="w-4 h-4 shrink-0 text-emerald-500" strokeWidth={1.5} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main id="main-content" className="flex-1 max-w-[1160px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Breadcrumbs
          items={[{ label: t('nav_cover_letter') }]}
          title={t('cover_page_title')}
          description={t('feature_cover_desc')}
        />

        <CoverLetterHero
          onOpenDrafts={() => setIsDraftsModalOpen(true)}
          draftsCount={draftsCount}
          language={language}
        />

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden flex items-center p-1 bg-surface-2 border border-line rounded-[8px]">
          <button
            type="button"
            onClick={() => setMobileTab('form')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-[6px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === 'form' ? 'bg-surface text-ink shadow-xs font-semibold' : 'text-ink-2'
            }`}
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{t('cover_mode_text')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-[6px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === 'preview' ? 'bg-surface text-ink shadow-xs font-semibold' : 'text-ink-2'
            }`}
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{t('feature_builder_card_preview')}</span>
            {generatedLetter && <span className="text-[10px] text-accent">●</span>}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('history')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-[6px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === 'history' ? 'bg-surface text-ink shadow-xs font-semibold' : 'text-ink-2'
            }`}
          >
            <History className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{t('cover_saved_drafts')}</span>
            {historyLetters.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-accent-soft text-accent font-mono">
                {historyLetters.length}
              </span>
            )}
          </button>
        </div>

        {/* Two-Column Grid: Form (Left) & Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Input Form */}
          <div
            className={`lg:col-span-5 space-y-5 ${
              mobileTab !== 'form' ? 'hidden lg:block' : 'block'
            }`}
          >
            <form onSubmit={handleGenerate} className="bg-surface border border-line rounded-[12px] p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                  <span>{t('cover_job_title')}</span>
                </span>
                {generatedLetter && (
                  <button
                    type="button"
                    onClick={handleResetRequest}
                    disabled={isGenerating}
                    className="text-[11px] text-ink-3 hover:text-ink flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
                    <span>{t('cover_reset_btn')}</span>
                  </button>
                )}
              </div>

              {/* Friendly Error Alert with Instant Retry */}
              {formError && (
                <div className="p-3.5 rounded-[8px] bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex flex-col space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <span className="leading-relaxed font-medium">{formError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormError(null)}
                      className="text-rose-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {lastFailedPayload && (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="px-3 py-1.5 rounded-[6px] bg-rose-500 text-white font-medium text-xs hover:bg-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{isAr ? 'إعادة المحاولة الآن' : 'Retry Generation'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Resume Selector */}
              {savedResumes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1 flex items-center justify-between">
                    <span>{isAr ? 'ربط المهارات من سيرة ذاتية محفوظة:' : 'Link with a saved resume:'}</span>
                    <span className="text-[11px] text-accent font-normal">{isAr ? 'مطابقة تلقائية' : 'Auto-match'}</span>
                  </label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => handleResumeSelectChange(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 rounded-[6px] bg-paper border border-line text-xs sm:text-sm text-ink focus:outline-none focus:border-accent disabled:opacity-50"
                  >
                    {savedResumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title || (isAr ? 'سيرة ذاتية' : 'Resume')} ({r.templateId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Job Title & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    {t('cover_job_title')} *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-ink-3 absolute start-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={jobTitle}
                      disabled={isGenerating}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder={t('cover_job_title')}
                      className="w-full ps-9 pe-3 py-2 rounded-[6px] bg-paper border border-line text-xs sm:text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    {t('cover_company_name')} *
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-ink-3 absolute start-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={companyName}
                      disabled={isGenerating}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t('cover_company_name')}
                      className="w-full ps-9 pe-3 py-2 rounded-[6px] bg-paper border border-line text-xs sm:text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Output Language Selector (6 Languages) */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                    <span>{t('cover_target_doc_language')}</span>
                  </div>
                  <span className="text-[11px] text-ink-3">
                    {language === 'ar' ? 'RTL • العربية' : 'LTR'}
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DOCUMENT_LANGUAGE_OPTIONS.map((opt) => {
                    const isSelected = language === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => handleLanguageChange(opt.id as CoverLetterLanguage)}
                        className={`py-2 px-2.5 text-xs font-medium rounded-[8px] border transition-all cursor-pointer disabled:opacity-50 flex items-center justify-between ${
                          isSelected
                            ? 'bg-accent text-white border-accent shadow-xs font-semibold'
                            : 'bg-surface border-line text-ink-2 hover:bg-surface-2'
                        }`}
                      >
                        <span>{opt.nativeName}</span>
                        <span
                          className={`text-[10px] font-mono uppercase px-1 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-surface-2 text-ink-3'
                          }`}
                        >
                          {opt.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tone Selection Component (Professional / Friendly / Confident) */}
              <ToneCardSelector
                selectedTone={tone}
                onChange={setTone}
                language={language}
              />

              {/* Job Description (Optional) with Text, URL, or File Input */}
              <div className="space-y-2 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                      <span>{t('upload_job_desc_label')}</span>
                      <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-surface-2 text-ink-3 border border-line">
                        {isAr ? 'اختياري' : 'optional'}
                      </span>
                    </label>
                    <p className="text-[10px] text-ink-3 mt-0.5">
                      {isAr
                        ? 'في حال عدم توفره، يصاغ الخطاب تلقائياً بناءً على المسمى والشركة'
                        : 'Optional — AI crafts tailored letter from title & company if blank'}
                    </p>
                  </div>

                  <div className="flex items-center p-0.5 bg-surface-2 rounded-[6px] border border-line">
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setInputMode('text')}
                      className={`px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                        inputMode === 'text'
                          ? 'bg-surface text-ink shadow-xs font-semibold'
                          : 'text-ink-2 hover:text-ink'
                      }`}
                    >
                      <FileText className="w-3 h-3" strokeWidth={1.5} />
                      <span>{t('cover_mode_text')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setInputMode('url')}
                      className={`px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                        inputMode === 'url'
                          ? 'bg-surface text-ink shadow-xs font-semibold'
                          : 'text-ink-2 hover:text-ink'
                      }`}
                    >
                      <Link2 className="w-3 h-3" strokeWidth={1.5} />
                      <span>{t('cover_mode_url')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setInputMode('file')}
                      className={`px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                        inputMode === 'file'
                          ? 'bg-surface text-ink shadow-xs font-semibold'
                          : 'text-ink-2 hover:text-ink'
                      }`}
                    >
                      <Upload className="w-3 h-3" strokeWidth={1.5} />
                      <span>{t('cover_mode_file')}</span>
                    </button>
                  </div>
                </div>

                {/* File Upload Mode */}
                {inputMode === 'file' ? (
                  <div className="p-4 -surface-2 border border-dashed border-line-strong rounded-[8px] text-center space-y-2 hover:border-accent transition-colors">
                    <label className="cursor-pointer block space-y-2">
                      <input
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={isExtractingFile || isGenerating}
                        className="hidden"
                      />
                      <div className="w-9 h-9 rounded-[6px] bg-surface border border-line mx-auto flex items-center justify-center text-accent">
                        {isExtractingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" strokeWidth={1.5} />}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-ink">
                          {isExtractingFile
                            ? (isAr ? 'جاري قراءة محتوى الملف...' : 'Extracting file content...')
                            : (isAr ? 'اختر ملف الإعلان الوظيفي' : 'Select job posting document')}
                        </p>
                        <p className="text-[11px] text-ink-3 mt-0.5">
                          {isAr ? 'يدعم PDF و TXT و DOCX حتى 5 ميجابايت' : 'PDF, TXT, DOCX up to 5MB'}
                        </p>
                      </div>
                    </label>
                    {uploadedFileName && (
                      <div className="p-2 rounded-[6px] bg-surface border border-line text-ink-2 text-xs flex items-center justify-between">
                        <span className="truncate flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                          <span>{uploadedFileName}</span>
                        </span>
                        <span className="text-[11px] text-accent font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} /> {isAr ? 'تم الاستخراج' : 'Ready'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : inputMode === 'url' ? (
                  <div className="space-y-2 p-3 -surface-2 border border-line rounded-[8px]">
                    <label className="block text-xs font-medium text-ink-2">
                      {isAr ? 'رابط الوظيفة:' : 'Job posting URL:'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={jobUrl}
                        disabled={isExtractingUrl || isGenerating}
                        onChange={(e) => setJobUrl(e.target.value)}
                        placeholder="https://company.com/careers/role"
                        className="flex-1 px-3 py-1.5 rounded-[6px] bg-paper border border-line text-xs sm:text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent disabled:opacity-50"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleExtractFromUrl}
                        disabled={isGenerating || !jobUrl.trim()}
                        loading={isExtractingUrl}
                        loadingText={isAr ? 'جلب...' : 'Fetching...'}
                        className="shrink-0"
                      >
                        <span>{isAr ? 'استخراج' : 'Extract'}</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    value={jobDescription}
                    disabled={isGenerating}
                    maxLength={35000}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder={
                      isAr
                        ? 'الصق متطلبات وشروط الوظيفة هنا إن وجدت لتحسين دقة الخطاب (اختياري)...'
                        : 'Paste job requirements or qualifications here for higher accuracy (optional)...'
                    }
                    className="w-full p-3 rounded-[6px] bg-paper border border-line text-xs sm:text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent leading-relaxed resize-none disabled:opacity-50"
                  />
                )}
              </div>

              {/* Sender Details */}
              <div className="p-3 -surface-2 rounded-[8px] border border-line space-y-2">
                <span className="text-[11px] font-semibold text-ink-2 block">
                  {t('cover_sender_info')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={senderName}
                    disabled={isGenerating}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder={`${t('cover_sender_name')} *`}
                    className="px-2.5 py-1.5 rounded-[6px] bg-paper border border-line text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent disabled:opacity-50"
                  />
                  <input
                    type="email"
                    value={senderEmail}
                    disabled={isGenerating}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder={t('cover_sender_email')}
                    className="px-2.5 py-1.5 rounded-[6px] bg-paper border border-line text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent disabled:opacity-50"
                  />
                  <input
                    type="tel"
                    value={senderPhone}
                    disabled={isGenerating}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder={t('cover_sender_phone')}
                    className="px-2.5 py-1.5 rounded-[6px] bg-paper border border-line text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isGenerating || activeView === 'generating'}
                loadingText={t('upload_submitting_btn')}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                <span>{t('cover_generate_btn')}</span>
              </Button>
            </form>
          </div>

          {/* RIGHT COLUMN: Preview & Interactive Letter Sheet */}
          <div
            className={`lg:col-span-7 space-y-4 lg:sticky lg:top-20 ${
              mobileTab === 'form' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* GENERATING STATE with Cancel Action */}
            {activeView === 'generating' && (
              <GeneratingStepper
                currentStep={generationStep}
                language={language}
                tone={tone}
                onCancel={handleCancelGeneration}
              />
            )}

            {/* EMPTY STATE */}
            {activeView === 'input' && !generatedLetter && (
              <div className="bg-surface border border-dashed border-line-strong rounded-[12px] p-8 sm:p-14 text-center min-h-[460px] flex flex-col items-center justify-center space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-[10px] bg-surface-2 border border-line flex items-center justify-center text-ink-3">
                  <FileText className="w-7 h-7 text-accent" strokeWidth={1.5} />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-lg font-serif font-semibold text-ink">
                    {isAr ? 'معاينة الخطاب التفاعلية' : 'Interactive Letter Preview'}
                  </h3>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    {isAr
                      ? 'املأ بيانات المسمى والشركة واضغط على زر الصياغة. ستتمكن من تعديل النص مباشرة وتصديره إلى Word و PDF.'
                      : 'Fill in the job title and company on the left. Your tailored cover letter renders here on a clean printable sheet with live editing.'}
                  </p>
                </div>
              </div>
            )}

            {/* PREVIEW STATE with Live Edit, Word Download, PDF Print, and Regenerate */}
            {(activeView === 'preview' || generatedLetter) && generatedLetter && (
              <CoverLetterPreview
                coverLetter={generatedLetter}
                onUpdate={(updated) => {
                  setGeneratedLetter(updated);
                  if (updated.language && updated.language !== language) {
                    setLanguage(updated.language);
                  }
                  setIsDirty(true);
                }}
                onSaveDraft={handleSaveDraft}
                isSaving={isSaving}
                isDirty={isDirty}
                onResetRequest={handleResetRequest}
                onRegenerate={() => handleGenerate()}
                isRegenerating={isGenerating}
                showToast={showToast}
              />
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: Cover Letter History with Search and Delete Confirmation */}
        <div className={`pt-4 ${mobileTab === 'history' ? 'block' : 'block'}`}>
          <CoverLetterHistory
            coverLetters={historyLetters}
            isLoading={isLoadingHistory}
            onSelect={handleSelectHistoryLetter}
            onDelete={handleDeleteHistoryLetter}
            isAr={isAr}
            activeId={generatedLetter?.id}
            onRefresh={loadHistory}
          />
        </div>
      </main>

      {/* Saved Drafts Modal (Alternative modal entry) */}
      <SavedDraftsModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        onSelectDraft={handleSelectHistoryLetter}
        onDraftDeleted={(deletedId) => {
          setDraftsCount((prev) => Math.max(0, prev - 1));
          setHistoryLetters((prev) => prev.filter((cl) => cl.id !== deletedId));
          if (generatedLetter && generatedLetter.id === deletedId) {
            setGeneratedLetter((prev) => (prev ? { ...prev, id: undefined } : null));
          }
        }}
        showToast={showToast}
      />

      {/* Confirmation Dialog for Resetting with Unsaved Changes */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title={isAr ? 'تجاهل التعديلات؟' : 'Discard unsaved changes?'}
        message={
          isAr
            ? 'لديك تعديلات على خطاب التقديم الحالي لم يتم حفظها. إذا تابعت، سيتم فقدها والعودة إلى النموذج.'
            : 'You have unsaved edits in this cover letter. Starting a new letter will discard them.'
        }
        confirmText={isAr ? 'بدء جديد' : 'Discard & start new'}
        cancelText={isAr ? 'البقاء في التعديل' : 'Keep editing'}
        variant="warning"
        onConfirm={executeReset}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Upgrade Modal for Exhausted Credits (HTTP 402 Paywall) */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        language={language}
      />

      <Footer />
    </div>
  );
}
