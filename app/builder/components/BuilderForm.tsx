'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ResumeData,
  PersonalInfo,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  LanguageItem,
} from '../types';
import {
  User,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Sparkles,
  Award,
  Languages as LanguagesIcon,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Lightbulb,
  Camera,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { SectionKey } from './BuilderSidebar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useLanguage } from '../../context/LanguageContext';

interface BuilderFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  sectionOrder?: SectionKey[];
  activeSection?: SectionKey;
  onActiveSectionChange?: (section: SectionKey) => void;
}

const ACTION_VERBS_EN = [
  'Architected',
  'Optimized',
  'Spearheaded',
  'Accelerated',
  'Engineered',
  'Delivered',
  'Reduced',
  'Scaled',
];

const ACTION_VERBS_AR = [
  'طوّر',
  'حسّن',
  'قاد',
  'صمم',
  'قلّص',
  'أطلق',
  'سرّع',
  'أدار',
];

const COMMON_LANGUAGES_EN = ['English', 'Arabic', 'French', 'German', 'Spanish', 'Turkish'];
const COMMON_LANGUAGES_AR = ['الإنجليزية', 'العربية', 'الفرنسية', 'الألمانية', 'الإسبانية', 'التركية'];

const PROFICIENCY_LEVELS_EN = [
  { value: 'Native', label: 'Native / Bilingual' },
  { value: 'Fluent', label: 'Fluent / Advanced' },
  { value: 'Proficient', label: 'Proficient' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Basic', label: 'Basic / Elementary' },
];

const PROFICIENCY_LEVELS_AR = [
  { value: 'Native', label: 'اللغة الأم / ثنائي اللغة' },
  { value: 'Fluent', label: 'طلاقة / متقدم' },
  { value: 'Proficient', label: 'كفاءة مهنية' },
  { value: 'Intermediate', label: 'متوسط' },
  { value: 'Basic', label: 'مبتدئ / أساسي' },
];

export function BuilderForm({
  data,
  onChange,
  sectionOrder = [
    'personal',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'languages',
    'certifications',
  ],
  activeSection,
  onActiveSectionChange,
}: BuilderFormProps) {
  const { isRtl } = useLanguage();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    languages: true,
    certifications: false,
  });

  const [newSkillInput, setNewSkillInput] = useState('');
  const [newCertInput, setNewCertInput] = useState('');
  const [newLangName, setNewLangName] = useState('');
  const [newLangProficiency, setNewLangProficiency] = useState('Fluent');
  const [isAtsTipsOpen, setIsAtsTipsOpen] = useState(false);

  // Active focused bullet tracker for inserting verbs
  const [activeExpBullet, setActiveExpBullet] = useState<{ expIdx: number; bIdx: number } | null>(null);

  // Drag and drop states for items
  const [draggedExpIndex, setDraggedExpIndex] = useState<number | null>(null);
  const [draggedEduIndex, setDraggedEduIndex] = useState<number | null>(null);
  const [draggedProjIndex, setDraggedProjIndex] = useState<number | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);

  // Auto-open activeSection if set externally
  useEffect(() => {
    if (!activeSection) return;
    const frame = requestAnimationFrame(() => {
      setOpenSections((prev) => (prev[activeSection] ? prev : { ...prev, [activeSection]: true }));
      const el = document.getElementById(`section-${activeSection}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [activeSection]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectStep = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: true }));
    onActiveSectionChange?.(key);
    const el = document.getElementById(`section-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // --- Section Completion Status Calculations ---
  const isPersonalComplete = Boolean(
    data.personalInfo.fullName?.trim() && data.personalInfo.email?.trim()
  );
  const isSummaryComplete = Boolean((data.personalInfo.summary || '').trim().length >= 20);
  const isExperienceComplete = Boolean(
    data.experience?.length > 0 &&
      data.experience.some((e) => e.company?.trim() || e.position?.trim())
  );
  const isEducationComplete = Boolean(
    data.education?.length > 0 &&
      data.education.some((e) => e.institution?.trim() || e.degree?.trim())
  );
  const isSkillsComplete = Boolean(data.skills?.length >= 3);
  const isProjectsComplete = Boolean(
    data.projects?.length > 0 && data.projects.some((p) => p.title?.trim())
  );
  const isLanguagesComplete = Boolean(data.languages && data.languages.length > 0);
  const isCertificationsComplete = Boolean(data.certifications && data.certifications.length > 0);

  const sectionStatus: Record<SectionKey, boolean> = {
    personal: isPersonalComplete,
    summary: isSummaryComplete,
    experience: isExperienceComplete,
    education: isEducationComplete,
    skills: isSkillsComplete,
    projects: isProjectsComplete,
    languages: isLanguagesComplete,
    certifications: isCertificationsComplete,
  };

  const coreSections: SectionKey[] = [
    'personal',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'languages',
  ];
  const completedSectionsCount = coreSections.filter((s) => sectionStatus[s]).length;
  const resumeScorePercentage = Math.round((completedSectionsCount / coreSections.length) * 100);

  // --- Photo Upload Handlers ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onChange({
        ...data,
        personalInfo: {
          ...data.personalInfo,
          photoUrl: result,
          showPhoto: true,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        photoUrl: '',
        showPhoto: false,
      },
    });
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleToggleShowPhoto = (checked: boolean) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        showPhoto: checked,
      },
    });
  };

  // --- Personal Info updates ---
  const updatePersonalInfo = (field: keyof PersonalInfo, value: any) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: value,
      },
    });
  };

  // --- Experience Handlers ---
  const addExperience = () => {
    const newItem: ExperienceItem = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: [''],
    };
    onChange({
      ...data,
      experience: [newItem, ...data.experience],
    });
    setOpenSections((prev) => ({ ...prev, experience: true }));
  };

  const updateExperience = (
    index: number,
    field: keyof ExperienceItem,
    value: any
  ) => {
    const updated = [...data.experience];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, experience: updated });
  };

  const removeExperience = (index: number) => {
    onChange({
      ...data,
      experience: data.experience.filter((_, i) => i !== index),
    });
  };

  const moveExperience = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= data.experience.length) return;
    const updated = [...data.experience];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onChange({ ...data, experience: updated });
  };

  const addExperienceBullet = (expIndex: number) => {
    const updated = [...data.experience];
    updated[expIndex].description.push('');
    onChange({ ...data, experience: updated });
  };

  const updateExperienceBullet = (
    expIndex: number,
    bulletIndex: number,
    val: string
  ) => {
    const updated = [...data.experience];
    updated[expIndex].description[bulletIndex] = val;
    onChange({ ...data, experience: updated });
  };

  const removeExperienceBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...data.experience];
    updated[expIndex].description = updated[expIndex].description.filter(
      (_, i) => i !== bulletIndex
    );
    onChange({ ...data, experience: updated });
  };

  const insertActionVerb = (verb: string) => {
    if (activeExpBullet) {
      const { expIdx, bIdx } = activeExpBullet;
      const current = data.experience[expIdx]?.description[bIdx] || '';
      const updatedText = current ? `${verb} ${current.replace(/^[a-zA-Z\u0600-\u06FF]+ /, '')}` : `${verb} `;
      updateExperienceBullet(expIdx, bIdx, updatedText);
    } else if (data.experience.length > 0) {
      // Default to first experience item's first bullet
      const current = data.experience[0].description[0] || '';
      updateExperienceBullet(0, 0, `${verb} ${current}`);
    }
  };

  // --- Education Handlers ---
  const addEducation = () => {
    const newItem: EducationItem = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      gpa: '',
    };
    onChange({ ...data, education: [newItem, ...data.education] });
    setOpenSections((prev) => ({ ...prev, education: true }));
  };

  const updateEducation = (
    index: number,
    field: keyof EducationItem,
    value: any
  ) => {
    const updated = [...data.education];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, education: updated });
  };

  const removeEducation = (index: number) => {
    onChange({
      ...data,
      education: data.education.filter((_, i) => i !== index),
    });
  };

  const moveEducation = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= data.education.length) return;
    const updated = [...data.education];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onChange({ ...data, education: updated });
  };

  // --- Projects Handlers ---
  const addProject = () => {
    const newItem: ProjectItem = {
      id: Date.now().toString(),
      title: '',
      techStack: '',
      link: '',
      description: [''],
    };
    onChange({ ...data, projects: [newItem, ...data.projects] });
    setOpenSections((prev) => ({ ...prev, projects: true }));
  };

  const updateProject = (index: number, field: keyof ProjectItem, value: any) => {
    const updated = [...data.projects];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, projects: updated });
  };

  const removeProject = (index: number) => {
    onChange({
      ...data,
      projects: data.projects.filter((_, i) => i !== index),
    });
  };

  const moveProject = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= data.projects.length) return;
    const updated = [...data.projects];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onChange({ ...data, projects: updated });
  };

  const addProjectBullet = (projIndex: number) => {
    const updated = [...data.projects];
    updated[projIndex].description.push('');
    onChange({ ...data, projects: updated });
  };

  const updateProjectBullet = (
    projIndex: number,
    bulletIndex: number,
    val: string
  ) => {
    const updated = [...data.projects];
    updated[projIndex].description[bulletIndex] = val;
    onChange({ ...data, projects: updated });
  };

  const removeProjectBullet = (projIndex: number, bulletIndex: number) => {
    const updated = [...data.projects];
    updated[projIndex].description = updated[projIndex].description.filter(
      (_, i) => i !== bulletIndex
    );
    onChange({ ...data, projects: updated });
  };

  // --- Skills Handlers ---
  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const rawSkills = newSkillInput
      .split(/[,،]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !data.skills.includes(s));

    if (rawSkills.length > 0) {
      onChange({
        ...data,
        skills: [...data.skills, ...rawSkills],
      });
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange({
      ...data,
      skills: data.skills.filter((s) => s !== skillToRemove),
    });
  };

  // --- Languages Handlers ---
  const handleAddLanguage = (name?: string, proficiency?: string) => {
    const langName = (name || newLangName).trim();
    if (!langName) return;

    const currentLangs = data.languages || [];
    if (currentLangs.some((l) => l.name.toLowerCase() === langName.toLowerCase())) {
      return;
    }

    const newLangItem: LanguageItem = {
      id: `lang_${langName.toLowerCase().replace(/\s+/g, '_')}_${currentLangs.length + 1}`,
      name: langName,
      proficiency: proficiency || newLangProficiency || 'Fluent',
    };

    onChange({
      ...data,
      languages: [...currentLangs, newLangItem],
    });
    setNewLangName('');
  };

  const handleUpdateLanguage = (index: number, field: keyof LanguageItem, val: string) => {
    const currentLangs = [...(data.languages || [])];
    if (!currentLangs[index]) return;
    currentLangs[index] = { ...currentLangs[index], [field]: val };
    onChange({ ...data, languages: currentLangs });
  };

  const handleRemoveLanguage = (index: number) => {
    const currentLangs = [...(data.languages || [])];
    currentLangs.splice(index, 1);
    onChange({ ...data, languages: currentLangs });
  };

  const moveLanguage = (index: number, direction: -1 | 1) => {
    const currentLangs = [...(data.languages || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentLangs.length) return;
    const [moved] = currentLangs.splice(index, 1);
    currentLangs.splice(targetIndex, 0, moved);
    onChange({ ...data, languages: currentLangs });
  };

  // --- Certifications Handlers ---
  const handleAddCert = () => {
    if (!newCertInput.trim()) return;
    onChange({
      ...data,
      certifications: [...data.certifications, newCertInput.trim()],
    });
    setNewCertInput('');
  };

  const handleRemoveCert = (index: number) => {
    onChange({
      ...data,
      certifications: data.certifications.filter((_, i) => i !== index),
    });
  };

  // --- Step Metadata for Navigation Bar ---
  const stepNavItems: { key: SectionKey; labelEn: string; labelAr: string; icon: any }[] = [
    { key: 'personal', labelEn: 'Personal', labelAr: 'البيانات', icon: User },
    { key: 'summary', labelEn: 'Summary', labelAr: 'الملخص', icon: FileText },
    { key: 'experience', labelEn: 'Experience', labelAr: 'الخبرات', icon: Briefcase },
    { key: 'education', labelEn: 'Education', labelAr: 'التعليم', icon: GraduationCap },
    { key: 'skills', labelEn: 'Skills', labelAr: 'المهارات', icon: Sparkles },
    { key: 'projects', labelEn: 'Projects', labelAr: 'المشاريع', icon: FolderGit2 },
    { key: 'languages', labelEn: 'Languages', labelAr: 'اللغات', icon: LanguagesIcon },
    { key: 'certifications', labelEn: 'Certificates', labelAr: 'الشهادات', icon: Award },
  ];

  // Character counter for summary
  const summaryLength = (data.personalInfo.summary || '').length;
  const isSummaryOptimal = summaryLength >= 200 && summaryLength <= 400;

  // --- Render Sections ---

  const renderPersonalSection = () => (
    <div
      key="personal"
      id="section-personal"
      className="bg-surface border border-line rounded-xl overflow-hidden shadow-xs transition-all"
    >
      <button
        type="button"
        onClick={() => toggleSection('personal')}
        className="w-full flex items-center justify-between p-4 bg-surface -surface-2 text-start transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isPersonalComplete ? 'bg-success/15 text-success' : 'bg-brand/10 text-brand'
          }`}>
            <User className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold -ink text-sm">
                {isRtl ? 'البيانات الشخصية ومعلومات الاتصال' : 'Personal Information'}
              </h3>
              {isPersonalComplete && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-success/10 px-1.5 py-0.2 rounded-full">
                  <Check className="w-3 h-3" />
                  <span>{isRtl ? 'مكتمل' : 'Complete'}</span>
                </span>
              )}
            </div>
            <p className="text-xs -ink-2">
              {isRtl ? 'الاسم، المسمى الوظيفي، البريد، الروابط' : 'Full name, job title, email, phone & links'}
            </p>
          </div>
        </div>
        {openSections.personal ? (
          <ChevronUp className="w-4 h-4 -ink-2" />
        ) : (
          <ChevronDown className="w-4 h-4 -ink-2" />
        )}
      </button>

      {openSections.personal && (
        <div className="p-4 pt-2 border-t border-line space-y-4">
          {/* Profile Photo Uploader */}
          <div className="p-3.5 -surface-2 border border-line rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface border border-line flex items-center justify-center shrink-0 shadow-xs">
                {data.personalInfo.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.personalInfo.photoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 -ink-2" strokeWidth={1.5} />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold -ink">
                  {isRtl ? 'الصورة الشخصية (اختيارية)' : 'Profile Photograph (Optional)'}
                </div>
                <label className="inline-flex items-center gap-1.5 mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(data.personalInfo.showPhoto)}
                    onChange={(e) => handleToggleShowPhoto(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-line text-brand focus:ring-brand"
                  />
                  <span className="text-xs -ink-2">
                    {isRtl ? 'إظهار الصورة في السيرة الذاتية' : 'Show photo on printable resume'}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="px-3 py-1.5 bg-surface hover:bg-surface-2 -ink text-xs font-medium rounded-md border border-line transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Camera className="w-3.5 h-3.5 text-brand" strokeWidth={1.5} />
                <span>{data.personalInfo.photoUrl ? (isRtl ? 'تغيير' : 'Change') : (isRtl ? 'رفع صورة' : 'Upload photo')}</span>
              </button>
              {data.personalInfo.photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-1.5 -ink-2 hover:text-danger hover:bg-danger/10 rounded-md transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold -ink mb-1">
                {isRtl ? 'الاسم الكامل *' : 'Full Name *'}
              </label>
              <input
                type="text"
                value={data.personalInfo.fullName}
                onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                placeholder={isRtl ? 'مثال: أحمد عبد الله' : 'e.g. Alex Morgan'}
                className="w-full px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink -ink-2 focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold -ink mb-1">
                {isRtl ? 'المسمى الوظيفي المستهدف *' : 'Target Job Title *'}
              </label>
              <input
                type="text"
                value={data.personalInfo.jobTitle}
                onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                placeholder={isRtl ? 'مثال: مهندس برمجيات أول' : 'e.g. Senior Full-Stack Engineer'}
                className="w-full px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink -ink-2 focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold -ink mb-1">
                {isRtl ? 'البريد الإلكتروني *' : 'Email Address *'}
              </label>
              <input
                type="email"
                value={data.personalInfo.email}
                onChange={(e) => updatePersonalInfo('email', e.target.value)}
                placeholder="alex.morgan@email.com"
                className="w-full px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink -ink-2 focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold -ink mb-1">
                {isRtl ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <input
                type="tel"
                value={data.personalInfo.phone}
                onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                placeholder="+1 (555) 349-2041"
                className="w-full px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink -ink-2 focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold -ink mb-1">
                {isRtl ? 'الموقع الجغرافي (المدينة، الدولة)' : 'Location (City, Country)'}
              </label>
              <input
                type="text"
                value={data.personalInfo.location}
                onChange={(e) => updatePersonalInfo('location', e.target.value)}
                placeholder={isRtl ? 'الرياض، المملكة العربية السعودية' : 'San Francisco, CA'}
                className="w-full px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink -ink-2 focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold -ink mb-1">
                {isRtl ? 'الموقع الشخصي / المعرض' : 'Portfolio / Website'}
              </label>
              <input
                type="text"
                value={data.personalInfo.website}
                onChange={(e) => updatePersonalInfo('website', e.target.value)}
                placeholder="https://alexmorgan.dev"
                className="w-full px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink -ink-2 focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold -ink mb-1">
                {isRtl ? 'حساب لينكد إن (LinkedIn)' : 'LinkedIn Profile'}
              </label>
              <input
                type="text"
                value={data.personalInfo.linkedin}
                onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                placeholder="linkedin.com/in/alexmorgan"
                className="w-full px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink -ink-2 focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold -ink mb-1">
                {isRtl ? 'حساب غيت هاب (GitHub)' : 'GitHub Profile'}
              </label>
              <input
                type="text"
                value={data.personalInfo.github}
                onChange={(e) => updatePersonalInfo('github', e.target.value)}
                placeholder="github.com/alexmorgan"
                className="w-full px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink -ink-2 focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSummarySection = () => (
    <div
      key="summary"
      id="section-summary"
      className="bg-surface border border-line rounded-xl overflow-hidden shadow-xs transition-all"
    >
      <button
        type="button"
        onClick={() => toggleSection('summary')}
        className="w-full flex items-center justify-between p-4 bg-surface -surface-2 text-start transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isSummaryComplete ? 'bg-success/15 text-success' : 'bg-brand/10 text-brand'
          }`}>
            <FileText className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold -ink text-sm">
                {isRtl ? 'الملخص والنبذة المهنية' : 'Professional Summary'}
              </h3>
              {isSummaryComplete && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-success/10 px-1.5 py-0.2 rounded-full">
                  <Check className="w-3 h-3" />
                  <span>{isRtl ? 'مكتمل' : 'Complete'}</span>
                </span>
              )}
            </div>
            <p className="text-xs -ink-2">
              {isRtl ? 'نظرة عامة موجزة من 2-4 جمل عن خبراتك' : 'A 2-4 sentence executive elevator pitch'}
            </p>
          </div>
        </div>
        {openSections.summary ? (
          <ChevronUp className="w-4 h-4 -ink-2" />
        ) : (
          <ChevronDown className="w-4 h-4 -ink-2" />
        )}
      </button>

      {openSections.summary && (
        <div className="p-4 pt-2 border-t border-line space-y-3">
          <textarea
            rows={4}
            value={data.personalInfo.summary}
            onChange={(e) => updatePersonalInfo('summary', e.target.value)}
            placeholder={
              isRtl
                ? 'مهندس برمجيات ذو خبرة 5+ سنوات في تصميم وتطوير الأنظمة السحابية والواجهات التفاعلية...'
                : 'Results-driven Software Engineer with 5+ years of experience designing scalable web applications and cloud architectures...'
            }
            className="w-full px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink -ink-2 focus:outline-none focus:border-brand leading-relaxed"
          />

          {/* Character counter & inline helper */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className={`font-mono text-xs font-medium ${
                isSummaryOptimal ? 'text-success' : summaryLength > 400 ? 'text-warning' : '-ink-2'
              }`}>
                {summaryLength} / 400 {isRtl ? 'حرف' : 'characters'}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                isSummaryOptimal
                  ? 'bg-success/10 text-success'
                  : summaryLength > 400
                  ? 'bg-warning/10 text-warning'
                  : 'bg-surface-2 -ink-2'
              }`}>
                {summaryLength === 0
                  ? isRtl ? 'فارغ' : 'Empty'
                  : isSummaryOptimal
                  ? isRtl ? '✓ الطول المثالي لأنظمة ATS' : '✓ Optimal ATS length'
                  : summaryLength < 200
                  ? isRtl ? 'قصير نسبياً – يُفضل التوسّع' : 'Brief – expand with key metrics'
                  : isRtl ? 'طويل – اختصر لصفحة واحدة' : 'Consider condensing'}
              </span>
            </div>
            <p className="text-[11px] -ink-2">
              {isRtl ? 'الموصى به لأنظمة ATS: من 200 إلى 400 حرف' : 'Recommended for ATS: 200–400 chars'}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderExperienceSection = () => (
    <div
      key="experience"
      id="section-experience"
      className="bg-surface border border-line rounded-xl overflow-hidden shadow-xs transition-all"
    >
      <button
        type="button"
        onClick={() => toggleSection('experience')}
        className="w-full flex items-center justify-between p-4 bg-surface -surface-2 text-start transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isExperienceComplete ? 'bg-success/15 text-success' : 'bg-brand/10 text-brand'
          }`}>
            <Briefcase className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold -ink text-sm">
                {isRtl ? 'الخبرات المهنية وسجل العمل' : 'Work Experience'}
              </h3>
              <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-surface-2 -ink-2 border border-line font-mono">
                {data.experience.length}
              </span>
              {isExperienceComplete && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-success/10 px-1.5 py-0.2 rounded-full">
                  <Check className="w-3 h-3" />
                  <span>{isRtl ? 'مكتمل' : 'Complete'}</span>
                </span>
              )}
            </div>
            <p className="text-xs -ink-2">
              {isRtl ? 'الأدوار السابقة، الإنجازات والأرقام القياسية' : 'Past roles, quantifiable impact & metrics'}
            </p>
          </div>
        </div>
        {openSections.experience ? (
          <ChevronUp className="w-4 h-4 -ink-2" />
        ) : (
          <ChevronDown className="w-4 h-4 -ink-2" />
        )}
      </button>

      {openSections.experience && (
        <div className="p-4 pt-2 border-t border-line space-y-4">
          {/* Action Verbs Helper Bar */}
          <div className="p-3 -surface-2 border border-line rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium -ink-2">
              <Lightbulb className="w-3.5 h-3.5 text-brand shrink-0" />
              <span>
                {isRtl
                  ? '💡 نصيحة ATS: ابدأ كل نقطة بفعل إنجاز قوي وأرفقه بنسبة مئوية أو أرقام:'
                  : '💡 ATS Pro-Tip: Start bullets with a power action verb and include metrics:'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(isRtl ? ACTION_VERBS_AR : ACTION_VERBS_EN).map((verb) => (
                <button
                  key={verb}
                  type="button"
                  onClick={() => insertActionVerb(verb)}
                  className="px-2 py-0.5 rounded-md bg-surface border border-line hover:border-brand text-[11px] font-medium -ink hover:text-brand transition-colors cursor-pointer"
                  title={isRtl ? `إدراج الفعل "${verb}"` : `Insert action verb "${verb}"`}
                >
                  + {verb}
                </button>
              ))}
            </div>
          </div>

          {/* List of Experience Items */}
          {data.experience.map((exp, expIdx) => (
            <div
              key={exp.id || expIdx}
              draggable
              onDragStart={() => setDraggedExpIndex(expIdx)}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedExpIndex === null || draggedExpIndex === expIdx) return;
                const updated = [...data.experience];
                const [moved] = updated.splice(draggedExpIndex, 1);
                updated.splice(expIdx, 0, moved);
                setDraggedExpIndex(expIdx);
                onChange({ ...data, experience: updated });
              }}
              onDragEnd={() => setDraggedExpIndex(null)}
              className="p-4 -surface-2 border border-line hover:border-line-strong rounded-xl space-y-3.5 relative transition-all duration-200"
            >
              {/* Header with Drag Handle, Order Controls & Delete */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-line">
                <div className="flex items-center gap-2">
                  <div
                    className="p-1 -ink-2 -ink cursor-grab active:cursor-grabbing"
                    title={isRtl ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-brand font-mono">
                    #{expIdx + 1} {exp.position || (isRtl ? 'وظيفة جديدة' : 'New Role')}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Up / Down buttons as accessible reordering */}
                  <button
                    type="button"
                    onClick={() => moveExperience(expIdx, -1)}
                    disabled={expIdx === 0}
                    className="p-1 rounded -ink-2 -ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={isRtl ? 'تحريك للأعلى' : 'Move up'}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveExperience(expIdx, 1)}
                    disabled={expIdx === data.experience.length - 1}
                    className="p-1 rounded -ink-2 -ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={isRtl ? 'تحريك للأسفل' : 'Move down'}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-3.5 bg-line mx-1" />

                  <button
                    type="button"
                    onClick={() => removeExperience(expIdx)}
                    className="p-1 -ink-2 hover:text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer"
                    title={isRtl ? 'حذف هذه الوظيفة' : 'Delete role'}
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold -ink mb-1">
                    {isRtl ? 'المسمى الوظيفي' : 'Job Title'}
                  </label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateExperience(expIdx, 'position', e.target.value)}
                    placeholder={isRtl ? 'مهندس برمجيات أول' : 'Senior Full-Stack Engineer'}
                    className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold -ink mb-1">
                    {isRtl ? 'اسم الشركة أو المنظمة' : 'Company Name'}
                  </label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(expIdx, 'company', e.target.value)}
                    placeholder="TechNova Solutions"
                    className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold -ink mb-1">
                    {isRtl ? 'موقع العمل (مدينة أو عن بعد)' : 'Location'}
                  </label>
                  <input
                    type="text"
                    value={exp.location}
                    onChange={(e) => updateExperience(expIdx, 'location', e.target.value)}
                    placeholder={isRtl ? 'الرياض (أو عن بُعد)' : 'San Francisco, CA (or Remote)'}
                    className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold -ink mb-1">
                      {isRtl ? 'تاريخ البدء' : 'Start Date'}
                    </label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(expIdx, 'startDate', e.target.value)}
                      placeholder="2023-01"
                      className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold -ink mb-1">
                      {isRtl ? 'تاريخ الانتهاء' : 'End Date'}
                    </label>
                    <input
                      type="text"
                      disabled={exp.current}
                      value={exp.current ? (isRtl ? 'حتى الآن' : 'Present') : exp.endDate}
                      onChange={(e) => updateExperience(expIdx, 'endDate', e.target.value)}
                      placeholder={isRtl ? 'حتى الآن' : 'Present'}
                      className={`w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand ${
                        exp.current ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer text-xs -ink-2">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => updateExperience(expIdx, 'current', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-line text-brand focus:ring-brand"
                />
                <span>{isRtl ? 'أعمل هنا حالياً' : 'I currently work here'}</span>
              </label>

              {/* Bullet Points with Action Verb Insertion */}
              <div className="space-y-2 pt-2 border-t border-line">
                <label className="block text-xs font-semibold -ink">
                  {isRtl ? 'أبرز الإنجازات والمسؤوليات (نقاط نقطية)' : 'Key Achievements & Measurable Responsibilities'}
                </label>
                {exp.description.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2">
                    <span className="text-brand text-xs mt-2">•</span>
                    <textarea
                      rows={2}
                      value={bullet}
                      onFocus={() => setActiveExpBullet({ expIdx, bIdx })}
                      onChange={(e) => updateExperienceBullet(expIdx, bIdx, e.target.value)}
                      placeholder={
                        isRtl
                          ? 'قاد فريقاً مكوناً من 6 مهندسين وطوّر منصة رقمية خفضت وقت التحميل بنسبة 35%...'
                          : 'Architected and deployed high-performance platforms, decreasing latency by 42%...'
                      }
                      className="flex-1 px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand leading-relaxed"
                    />
                    <button
                      type="button"
                      onClick={() => removeExperienceBullet(expIdx, bIdx)}
                      disabled={exp.description.length <= 1}
                      className="p-1 -ink-2 hover:text-danger hover:bg-danger/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors mt-1 cursor-pointer"
                      title={isRtl ? 'حذف النقطة' : 'Remove bullet'}
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addExperienceBullet(expIdx)}
                  className="inline-flex items-center gap-1.5 text-xs text-brand hover:opacity-80 font-medium py-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{isRtl ? 'إضافة نقطة إنجاز' : 'Add bullet point'}</span>
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addExperience}
            className="w-full py-2.5 px-3 border border-dashed border-line hover:border-brand rounded-lg text-xs font-medium -ink-2 -ink flex items-center justify-center gap-2 hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brand" strokeWidth={1.75} />
            <span>{isRtl ? 'إضافة خبرة مهنية جديدة' : 'Add Work Experience'}</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderEducationSection = () => (
    <div
      key="education"
      id="section-education"
      className="bg-surface border border-line rounded-xl overflow-hidden shadow-xs transition-all"
    >
      <button
        type="button"
        onClick={() => toggleSection('education')}
        className="w-full flex items-center justify-between p-4 bg-surface -surface-2 text-start transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isEducationComplete ? 'bg-success/15 text-success' : 'bg-brand/10 text-brand'
          }`}>
            <GraduationCap className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold -ink text-sm">
                {isRtl ? 'التعليم والمؤهلات الأكاديمية' : 'Education'}
              </h3>
              <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-surface-2 -ink-2 border border-line font-mono">
                {data.education.length}
              </span>
              {isEducationComplete && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-success/10 px-1.5 py-0.2 rounded-full">
                  <Check className="w-3 h-3" />
                  <span>{isRtl ? 'مكتمل' : 'Complete'}</span>
                </span>
              )}
            </div>
            <p className="text-xs -ink-2">
              {isRtl ? 'الدرجات العلمية، الجامعات، والتقدير' : 'Degrees, universities, dates & GPA'}
            </p>
          </div>
        </div>
        {openSections.education ? (
          <ChevronUp className="w-4 h-4 -ink-2" />
        ) : (
          <ChevronDown className="w-4 h-4 -ink-2" />
        )}
      </button>

      {openSections.education && (
        <div className="p-4 pt-2 border-t border-line space-y-4">
          {data.education.map((edu, eduIdx) => (
            <div
              key={edu.id || eduIdx}
              draggable
              onDragStart={() => setDraggedEduIndex(eduIdx)}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedEduIndex === null || draggedEduIndex === eduIdx) return;
                const updated = [...data.education];
                const [moved] = updated.splice(draggedEduIndex, 1);
                updated.splice(eduIdx, 0, moved);
                setDraggedEduIndex(eduIdx);
                onChange({ ...data, education: updated });
              }}
              onDragEnd={() => setDraggedEduIndex(null)}
              className="p-4 -surface-2 border border-line hover:border-line-strong rounded-xl space-y-3 relative transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-line">
                <div className="flex items-center gap-2">
                  <div
                    className="p-1 -ink-2 -ink cursor-grab active:cursor-grabbing"
                    title={isRtl ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-brand font-mono">
                    #{eduIdx + 1} {edu.degree || (isRtl ? 'مؤهل جديد' : 'New Degree')}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveEducation(eduIdx, -1)}
                    disabled={eduIdx === 0}
                    className="p-1 rounded -ink-2 -ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={isRtl ? 'تحريك للأعلى' : 'Move up'}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveEducation(eduIdx, 1)}
                    disabled={eduIdx === data.education.length - 1}
                    className="p-1 rounded -ink-2 -ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={isRtl ? 'تحريك للأسفل' : 'Move down'}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-3.5 bg-line mx-1" />

                  <button
                    type="button"
                    onClick={() => removeEducation(eduIdx)}
                    className="p-1 -ink-2 hover:text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer"
                    title={isRtl ? 'حذف هذا المؤهل' : 'Delete education'}
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold -ink mb-1">
                    {isRtl ? 'الدرجة العلمية' : 'Degree'}
                  </label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateEducation(eduIdx, 'degree', e.target.value)}
                    placeholder={isRtl ? 'بكالوريوس' : 'Bachelor of Science'}
                    className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold -ink mb-1">
                    {isRtl ? 'التخصص الدراسي' : 'Field of Study'}
                  </label>
                  <input
                    type="text"
                    value={edu.fieldOfStudy}
                    onChange={(e) => updateEducation(eduIdx, 'fieldOfStudy', e.target.value)}
                    placeholder={isRtl ? 'علوم الحاسب' : 'Computer Science'}
                    className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold -ink mb-1">
                    {isRtl ? 'الجامعة أو المعهد' : 'Institution / University'}
                  </label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateEducation(eduIdx, 'institution', e.target.value)}
                    placeholder="University of California, Berkeley"
                    className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold -ink mb-1">
                      {isRtl ? 'سنة البدء' : 'Start Year'}
                    </label>
                    <input
                      type="text"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(eduIdx, 'startDate', e.target.value)}
                      placeholder="2017"
                      className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold -ink mb-1">
                      {isRtl ? 'سنة التخرج' : 'Grad Year'}
                    </label>
                    <input
                      type="text"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(eduIdx, 'endDate', e.target.value)}
                      placeholder="2021"
                      className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold -ink mb-1">
                  {isRtl ? 'المعدل التراكمي / مرتبة الشرف (اختياري)' : 'GPA / Honors (Optional)'}
                </label>
                <input
                  type="text"
                  value={edu.gpa || ''}
                  onChange={(e) => updateEducation(eduIdx, 'gpa', e.target.value)}
                  placeholder="3.85 / 4.0 • Magna Cum Laude"
                  className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addEducation}
            className="w-full py-2.5 px-3 border border-dashed border-line hover:border-brand rounded-lg text-xs font-medium -ink-2 -ink flex items-center justify-center gap-2 hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brand" strokeWidth={1.75} />
            <span>{isRtl ? 'إضافة مؤهل دراسي جديد' : 'Add Education Entry'}</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderSkillsSection = () => (
    <div
      key="skills"
      id="section-skills"
      className="bg-surface border border-line rounded-xl overflow-hidden shadow-xs transition-all"
    >
      <button
        type="button"
        onClick={() => toggleSection('skills')}
        className="w-full flex items-center justify-between p-4 bg-surface -surface-2 text-start transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isSkillsComplete ? 'bg-success/15 text-success' : 'bg-brand/10 text-brand'
          }`}>
            <Sparkles className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold -ink text-sm">
                {isRtl ? 'المهارات والتقنيات' : 'Skills & Proficiencies'}
              </h3>
              <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-surface-2 -ink-2 border border-line font-mono">
                {data.skills.length}
              </span>
              {isSkillsComplete && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-success/10 px-1.5 py-0.2 rounded-full">
                  <Check className="w-3 h-3" />
                  <span>{isRtl ? 'مكتمل' : 'Complete'}</span>
                </span>
              )}
            </div>
            <p className="text-xs -ink-2">
              {isRtl ? 'لغات البرمجة، أطر العمل، والمهارات الصلبة' : 'Key hard skills and tools matching job posts'}
            </p>
          </div>
        </div>
        {openSections.skills ? (
          <ChevronUp className="w-4 h-4 -ink-2" />
        ) : (
          <ChevronDown className="w-4 h-4 -ink-2" />
        )}
      </button>

      {openSections.skills && (
        <div className="p-4 pt-2 border-t border-line space-y-3.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder={
                isRtl
                  ? 'أدخل مهارة أو افصل بينها بفاصلة (مثال: React, TypeScript, Python)'
                  : 'Type a skill or comma-separated list (e.g. React, TypeScript, Docker)'
              }
              className="flex-1 px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink -ink-2 focus:outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-brand hover:opacity-90 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{isRtl ? 'إضافة' : 'Add'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {data.skills.map((skill, sIdx) => (
              <span
                key={sIdx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-2 border border-line rounded-md text-xs font-medium -ink transition-all hover:border-brand/40"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="-ink-2 hover:text-danger transition-colors cursor-pointer"
                  aria-label={`Remove ${skill}`}
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </span>
            ))}
            {data.skills.length === 0 && (
              <span className="text-xs -ink-2 italic">
                {isRtl
                  ? 'لم تقم بإضافة أي مهارات بعد. أضف على الأقل 3-6 مهارات متوافقة مع إعلان الوظيفة.'
                  : 'No skills added yet. Add at least 3-6 hard skills to boost your ATS match score.'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderProjectsSection = () => (
    <div
      key="projects"
      id="section-projects"
      className="bg-surface border border-line rounded-xl overflow-hidden shadow-xs transition-all"
    >
      <button
        type="button"
        onClick={() => toggleSection('projects')}
        className="w-full flex items-center justify-between p-4 bg-surface -surface-2 text-start transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isProjectsComplete ? 'bg-success/15 text-success' : 'bg-brand/10 text-brand'
          }`}>
            <FolderGit2 className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold -ink text-sm">
                {isRtl ? 'المشاريع البارزة' : 'Key Projects'}
              </h3>
              <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-surface-2 -ink-2 border border-line font-mono">
                {data.projects.length}
              </span>
              {isProjectsComplete && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-success/10 px-1.5 py-0.2 rounded-full">
                  <Check className="w-3 h-3" />
                  <span>{isRtl ? 'مكتمل' : 'Complete'}</span>
                </span>
              )}
            </div>
            <p className="text-xs -ink-2">
              {isRtl ? 'الأعمال المستقلة، المصادر المفتوحة، والمشاريع البرمجية' : 'Portfolio highlights, GitHub repos & live products'}
            </p>
          </div>
        </div>
        {openSections.projects ? (
          <ChevronUp className="w-4 h-4 -ink-2" />
        ) : (
          <ChevronDown className="w-4 h-4 -ink-2" />
        )}
      </button>

      {openSections.projects && (
        <div className="p-4 pt-2 border-t border-line space-y-4">
          {data.projects.map((proj, projIdx) => (
            <div
              key={proj.id || projIdx}
              draggable
              onDragStart={() => setDraggedProjIndex(projIdx)}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedProjIndex === null || draggedProjIndex === projIdx) return;
                const updated = [...data.projects];
                const [moved] = updated.splice(draggedProjIndex, 1);
                updated.splice(projIdx, 0, moved);
                setDraggedProjIndex(projIdx);
                onChange({ ...data, projects: updated });
              }}
              onDragEnd={() => setDraggedProjIndex(null)}
              className="p-4 -surface-2 border border-line hover:border-line-strong rounded-xl space-y-3 relative transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-line">
                <div className="flex items-center gap-2">
                  <div
                    className="p-1 -ink-2 -ink cursor-grab active:cursor-grabbing"
                    title={isRtl ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-brand font-mono">
                    #{projIdx + 1} {proj.title || (isRtl ? 'مشروع جديد' : 'New Project')}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveProject(projIdx, -1)}
                    disabled={projIdx === 0}
                    className="p-1 rounded -ink-2 -ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={isRtl ? 'تحريك للأعلى' : 'Move up'}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProject(projIdx, 1)}
                    disabled={projIdx === data.projects.length - 1}
                    className="p-1 rounded -ink-2 -ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={isRtl ? 'تحريك للأسفل' : 'Move down'}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-3.5 bg-line mx-1" />

                  <button
                    type="button"
                    onClick={() => removeProject(projIdx)}
                    className="p-1 -ink-2 hover:text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer"
                    title={isRtl ? 'حذف المشروع' : 'Delete project'}
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold -ink mb-1">
                    {isRtl ? 'عنوان المشروع' : 'Project Title'}
                  </label>
                  <input
                    type="text"
                    value={proj.title}
                    onChange={(e) => updateProject(projIdx, 'title', e.target.value)}
                    placeholder="ATS Resume & Career Platform"
                    className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold -ink mb-1">
                    {isRtl ? 'التقنيات المستخدمة' : 'Technologies Used'}
                  </label>
                  <input
                    type="text"
                    value={proj.techStack}
                    onChange={(e) => updateProject(projIdx, 'techStack', e.target.value)}
                    placeholder="Next.js, TypeScript, Tailwind, Node.js"
                    className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold -ink mb-1">
                  {isRtl ? 'رابط المشروع أو الكود (Live Demo / GitHub)' : 'Live Demo / GitHub URL'}
                </label>
                <input
                  type="text"
                  value={proj.link}
                  onChange={(e) => updateProject(projIdx, 'link', e.target.value)}
                  placeholder="https://github.com/alexmorgan/project"
                  className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand"
                />
              </div>

              {/* Project Bullet Points */}
              <div className="space-y-2 pt-2 border-t border-line">
                <label className="block text-xs font-semibold -ink">
                  {isRtl ? 'تفاصيل الإنجاز والنتائج التقنية' : 'Key Outcomes & Technical Features'}
                </label>
                {proj.description.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2">
                    <span className="text-brand text-xs mt-2">•</span>
                    <textarea
                      rows={2}
                      value={bullet}
                      onChange={(e) => updateProjectBullet(projIdx, bIdx, e.target.value)}
                      placeholder={
                        isRtl
                          ? 'بناء نظام محاكاة لتقييم السيرة الذاتية بدقة 99.4% مع دعم المعاينة المباشرة...'
                          : 'Developed an AI-assisted resume analyzer with automated ATS keyword matching and PDF generation...'
                      }
                      className="flex-1 px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs -ink -ink-2 focus:outline-none focus:border-brand leading-relaxed"
                    />
                    <button
                      type="button"
                      onClick={() => removeProjectBullet(projIdx, bIdx)}
                      disabled={proj.description.length <= 1}
                      className="p-1 -ink-2 hover:text-danger hover:bg-danger/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors mt-1 cursor-pointer"
                      title={isRtl ? 'حذف النقطة' : 'Remove bullet'}
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addProjectBullet(projIdx)}
                  className="inline-flex items-center gap-1.5 text-xs text-brand hover:opacity-80 font-medium py-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{isRtl ? 'إضافة نقطة للمشروع' : 'Add bullet point'}</span>
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addProject}
            className="w-full py-2.5 px-3 border border-dashed border-line hover:border-brand rounded-lg text-xs font-medium -ink-2 -ink flex items-center justify-center gap-2 hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brand" strokeWidth={1.75} />
            <span>{isRtl ? 'إضافة مشروع جديد' : 'Add Project Entry'}</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderLanguagesSection = () => (
    <div
      key="languages"
      id="section-languages"
      className="bg-surface border border-line rounded-xl overflow-hidden shadow-xs transition-all"
    >
      <button
        type="button"
        onClick={() => toggleSection('languages')}
        className="w-full flex items-center justify-between p-4 bg-surface -surface-2 text-start transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLanguagesComplete ? 'bg-success/15 text-success' : 'bg-brand/10 text-brand'
          }`}>
            <LanguagesIcon className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold -ink text-sm">
                {isRtl ? 'اللغات ومستوى الإتقان' : 'Languages & Fluency'}
              </h3>
              <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-surface-2 -ink-2 border border-line font-mono">
                {(data.languages || []).length}
              </span>
              {isLanguagesComplete && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-success/10 px-1.5 py-0.2 rounded-full">
                  <Check className="w-3 h-3" />
                  <span>{isRtl ? 'مكتمل' : 'Complete'}</span>
                </span>
              )}
            </div>
            <p className="text-xs -ink-2">
              {isRtl ? 'اللغات المنطوقة ودرجات الإجادة' : 'Spoken languages & proficiency levels'}
            </p>
          </div>
        </div>
        {openSections.languages ? (
          <ChevronUp className="w-4 h-4 -ink-2" />
        ) : (
          <ChevronDown className="w-4 h-4 -ink-2" />
        )}
      </button>

      {openSections.languages && (
        <div className="p-4 pt-2 border-t border-line space-y-4">
          {/* Quick Language Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs -ink-2 me-1">
              {isRtl ? 'اقتراحات سريعة:' : 'Quick add:'}
            </span>
            {(isRtl ? COMMON_LANGUAGES_AR : COMMON_LANGUAGES_EN).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleAddLanguage(lang, 'Fluent')}
                className="px-2.5 py-0.5 rounded-full bg-surface border border-line hover:border-brand text-xs -ink-2 -ink transition-colors cursor-pointer"
              >
                + {lang}
              </button>
            ))}
          </div>

          {/* Add custom language input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newLangName}
              onChange={(e) => setNewLangName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLanguage();
                }
              }}
              placeholder={isRtl ? 'اسم اللغة (مثال: الفرنسية)' : 'Language name (e.g. Spanish)'}
              className="flex-1 px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink -ink-2 focus:outline-none focus:border-brand"
            />

            <select
              value={newLangProficiency}
              onChange={(e) => setNewLangProficiency(e.target.value)}
              aria-label={isRtl ? 'مستوى إتقان اللغة الجديدة' : 'Proficiency level for new language'}
              className="px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink focus:outline-none focus:border-brand cursor-pointer"
            >
              {(isRtl ? PROFICIENCY_LEVELS_AR : PROFICIENCY_LEVELS_EN).map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleAddLanguage()}
              className="px-4 py-2 bg-brand hover:opacity-90 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{isRtl ? 'إضافة لغة' : 'Add Language'}</span>
            </button>
          </div>

          {/* List of active languages */}
          <div className="space-y-2 pt-1">
            {(data.languages || []).map((lang, lIdx) => (
              <div
                key={lang.id || lIdx}
                className="flex items-center justify-between gap-3 p-3 -surface-2 border border-line rounded-lg"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-brand/10 text-brand flex items-center justify-center font-mono text-[11px] font-bold">
                    {lang.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-semibold -ink block">
                      {lang.name}
                    </span>
                    <span className="text-[11px] -ink-2">
                      {lang.proficiency}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={lang.proficiency}
                    onChange={(e) => handleUpdateLanguage(lIdx, 'proficiency', e.target.value)}
                    aria-label={isRtl ? `مستوى إتقان ${lang.name}` : `Proficiency level for ${lang.name}`}
                    className="px-2 py-1 bg-surface border border-line rounded text-xs -ink focus:outline-none focus:border-brand cursor-pointer"
                  >
                    {(isRtl ? PROFICIENCY_LEVELS_AR : PROFICIENCY_LEVELS_EN).map((lvl) => (
                      <option key={lvl.value} value={lvl.value}>
                        {lvl.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => moveLanguage(lIdx, -1)}
                    disabled={lIdx === 0}
                    className="p-1 rounded -ink-2 -ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={isRtl ? 'تحريك للأعلى' : 'Move up'}
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLanguage(lIdx, 1)}
                    disabled={lIdx === (data.languages?.length || 0) - 1}
                    className="p-1 rounded -ink-2 -ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={isRtl ? 'تحريك للأسفل' : 'Move down'}
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveLanguage(lIdx)}
                    className="p-1 -ink-2 hover:text-danger hover:bg-danger/10 rounded transition-colors cursor-pointer"
                    title={isRtl ? 'حذف اللغة' : 'Remove language'}
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}

            {(!data.languages || data.languages.length === 0) && (
              <span className="text-xs -ink-2 italic block py-1">
                {isRtl ? 'لم يتم إضافة لغات بعد. أضف لغاتك المحكية لتعزيز فرصك الدولية.' : 'No languages added yet. Add languages you speak for international roles.'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderCertificationsSection = () => (
    <div
      key="certifications"
      id="section-certifications"
      className="bg-surface border border-line rounded-xl overflow-hidden shadow-xs transition-all"
    >
      <button
        type="button"
        onClick={() => toggleSection('certifications')}
        className="w-full flex items-center justify-between p-4 bg-surface -surface-2 text-start transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isCertificationsComplete ? 'bg-success/15 text-success' : 'bg-brand/10 text-brand'
          }`}>
            <Award className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold -ink text-sm">
                {isRtl ? 'الشهادات المهنية والتراخيص' : 'Certifications & Honors'}
              </h3>
              <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-surface-2 -ink-2 border border-line font-mono">
                {data.certifications.length}
              </span>
              {isCertificationsComplete && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-success/10 px-1.5 py-0.2 rounded-full">
                  <Check className="w-3 h-3" />
                  <span>{isRtl ? 'مكتمل' : 'Complete'}</span>
                </span>
              )}
            </div>
            <p className="text-xs -ink-2">
              {isRtl ? 'الشهادات المعتمدة من AWS, Google, Meta وغيرها' : 'Professional credentials, AWS/Meta/Google certificates'}
            </p>
          </div>
        </div>
        {openSections.certifications ? (
          <ChevronUp className="w-4 h-4 -ink-2" />
        ) : (
          <ChevronDown className="w-4 h-4 -ink-2" />
        )}
      </button>

      {openSections.certifications && (
        <div className="p-4 pt-2 border-t border-line space-y-3.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCertInput}
              onChange={(e) => setNewCertInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCert();
                }
              }}
              placeholder={isRtl ? 'مثال: AWS Certified Solutions Architect' : 'e.g. AWS Certified Solutions Architect – Associate'}
              className="flex-1 px-3 py-2 bg-surface border border-line rounded-md text-xs sm:text-sm -ink -ink-2 focus:outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={handleAddCert}
              className="px-4 py-2 bg-brand hover:opacity-90 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{isRtl ? 'إضافة' : 'Add'}</span>
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            {data.certifications.map((cert, cIdx) => (
              <div
                key={cIdx}
                className="flex items-center justify-between px-3 py-2 -surface-2 border border-line rounded-lg text-xs -ink"
              >
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand shrink-0" strokeWidth={1.5} />
                  <span>{cert}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveCert(cIdx)}
                  className="-ink-2 hover:text-danger transition-colors p-1 cursor-pointer"
                  title={isRtl ? 'حذف الشهادة' : 'Remove certification'}
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ))}
            {data.certifications.length === 0 && (
              <span className="text-xs -ink-2 italic block py-1">
                {isRtl ? 'لا توجد شهادات مضافة حالياً.' : 'No certifications added yet.'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const sectionMap: Record<SectionKey, () => React.ReactNode> = {
    personal: renderPersonalSection,
    summary: renderSummarySection,
    experience: renderExperienceSection,
    education: renderEducationSection,
    skills: renderSkillsSection,
    projects: renderProjectsSection,
    languages: renderLanguagesSection,
    certifications: renderCertificationsSection,
  };

  return (
    <div className="space-y-4 w-full max-w-full min-w-0">
      {/* 1. Overall Resume Strength & Completion Progress Bar */}
      <div className="bg-surface border border-line rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold -ink">
              {isRtl ? 'جاهزية السيرة لأنظمة ATS' : 'Resume ATS Strength'}
            </span>
            <span className="font-mono text-xs font-bold text-brand px-2 py-0.5 rounded-full bg-brand/10">
              {resumeScorePercentage}%
            </span>
          </div>

          <span className="text-xs -ink-2">
            {isRtl
              ? `${completedSectionsCount} من ${coreSections.length} أقسام مكتملة`
              : `${completedSectionsCount} of ${coreSections.length} sections complete`}
          </span>
        </div>

        <ProgressBar
          value={resumeScorePercentage}
          max={100}
          variant={resumeScorePercentage >= 85 ? 'success' : resumeScorePercentage >= 50 ? 'brand' : 'warning'}
          size="sm"
          className="mb-3"
        />

        {/* 2. Step Navigation Pills */}
        <div className="w-full max-w-full min-w-0 flex items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {stepNavItems.map((step) => {
            const isCompleted = sectionStatus[step.key];
            const StepIcon = step.icon;
            const isOpen = openSections[step.key];
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => handleSelectStep(step.key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isOpen
                    ? 'bg-brand/15 text-brand border border-brand/30 shadow-xs'
                    : isCompleted
                    ? 'bg-surface hover:bg-surface-2 -ink border border-line'
                    : '-surface-2 -ink-2 -ink border border-transparent'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                ) : (
                  <StepIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                )}
                <span>{isRtl ? step.labelAr : step.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Collapsible ATS Optimization Tips Panel */}
      <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setIsAtsTipsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-3.5 bg-surface -surface-2 text-start transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-accent-soft text-accent flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5" strokeWidth={2} />
            </div>
            <span className="text-xs font-semibold -ink">
              {isRtl ? 'قائمة إرشادات توافق ATS (5 قواعد ذهبية)' : 'ATS Optimization Guidelines (5 Golden Rules)'}
            </span>
          </div>
          {isAtsTipsOpen ? (
            <ChevronUp className="w-4 h-4 -ink-2" />
          ) : (
            <ChevronDown className="w-4 h-4 -ink-2" />
          )}
        </button>

        {isAtsTipsOpen && (
          <div className="p-4 pt-1 border-t border-line text-xs -ink-2 space-y-2 -surface-2 leading-relaxed">
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
              <span>
                <strong>{isRtl ? 'عناوين قياسية:' : 'Standard Headings:'}</strong>{' '}
                {isRtl
                  ? 'استخدم مسميات واضحة للأقسام (الخبرات، التعليم، المهارات) حتى يتعرف عليها الماسح الآلي.'
                  : 'Keep section names standard (Experience, Education, Skills) for accurate parsing.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
              <span>
                <strong>{isRtl ? 'أفعال إنجاز قوية:' : 'Power Action Verbs:'}</strong>{' '}
                {isRtl
                  ? 'ابدأ كل نقطة في مهامك الوظيفية بفعل إنجاز (طوّر، قاد، سرّع، حسّن).'
                  : 'Begin achievement bullets with verbs like Architected, Optimized, Spearheaded.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
              <span>
                <strong>{isRtl ? 'أرقام ونتائج قياسية:' : 'Quantified Metrics:'}</strong>{' '}
                {isRtl
                  ? 'أضف نسباً مئوية وأرقاماً (مثال: خفض زمن الاستجابة بنسبة 35% أو خدمة 50 ألف مستخدم).'
                  : 'Include % numbers, dollars saved, or user counts in at least 60% of your bullets.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
              <span>
                <strong>{isRtl ? 'مطابقة الكلمات المفتاحية:' : 'Exact Keyword Match:'}</strong>{' '}
                {isRtl
                  ? 'قم بإدراج المهارات التقنية المذكورة نصاً في إعلان الوظيفة التي تستهدفها.'
                  : 'Incorporate skills explicitly mentioned in target job descriptions.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
              <span>
                <strong>{isRtl ? 'تنسيق متوافق للطباعة:' : 'Clean Layout:'}</strong>{' '}
                {isRtl
                  ? 'تجنب الجداول المعقدة أو إخفاء النصوص داخل رسوميات لضمان استخراج النص بدقة.'
                  : 'Single/two column clean structure guarantees zero loss during automated parsing.'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Render Form Sections According to sectionOrder */}
      {sectionOrder.map((key) => {
        const renderer = sectionMap[key];
        return renderer ? renderer() : null;
      })}
    </div>
  );
}
