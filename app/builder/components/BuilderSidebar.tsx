'use client';

import React, { useState } from 'react';
import { TemplateId, ThemeConfig } from '../types';
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Sparkles,
  Award,
  Languages as LanguagesIcon,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Layout,
  BookOpen,
  AlignLeft,
  Palette,
  Type,
  RefreshCw,
  Trash2,
  Cloud,
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { PaperSize } from '../utils/exportPdf';
import { useLanguage } from '@/app/context/LanguageContext';
import {
  DOCUMENT_LANGUAGE_OPTIONS,
  DocumentLanguage,
  setStoredDocumentLanguage,
  getDocumentFontFamily,
} from '@/app/lib/documentI18n';

export type SectionKey =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'languages'
  | 'certifications';

export interface SectionMeta {
  id: SectionKey;
  labelEn: string;
  labelAr: string;
  icon: React.ReactNode;
}

export const DEFAULT_SECTION_METAS: Record<SectionKey, { labelEn: string; labelAr: string; icon: any }> = {
  personal: { labelEn: 'Personal Information', labelAr: 'البيانات الشخصية', icon: User },
  summary: { labelEn: 'Professional Summary', labelAr: 'النبذة المهنية', icon: FileText },
  experience: { labelEn: 'Work Experience', labelAr: 'الخبرات المهنية', icon: Briefcase },
  education: { labelEn: 'Education', labelAr: 'التعليم والمؤهلات', icon: GraduationCap },
  projects: { labelEn: 'Key Projects', labelAr: 'المشاريع البارزة', icon: FolderGit2 },
  skills: { labelEn: 'Skills & Proficiencies', labelAr: 'المهارات والتقنيات', icon: Sparkles },
  languages: { labelEn: 'Languages & Fluency', labelAr: 'اللغات ومستوى الإتقان', icon: LanguagesIcon },
  certifications: { labelEn: 'Certifications', labelAr: 'الشهادات المهنية', icon: Award },
};

interface BuilderSidebarProps {
  selectedTemplate: TemplateId;
  onSelectTemplate: (t: TemplateId) => void;
  theme: ThemeConfig;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  onLoadSample: () => void;
  onClear: () => void;
  onDownloadPdf?: () => void;
  onDownloadWord?: () => void;
  onPrint?: () => void;
  isExportingPdf?: boolean;
  isExportingWord?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSaveCloud?: () => void;
  isSavingCloud?: boolean;
  saveMessage?: string | null;
  sectionOrder: SectionKey[];
  onReorderSections: (newOrder: SectionKey[]) => void;
  activeSection?: SectionKey;
  onSelectSection?: (section: SectionKey) => void;
  paperSize?: PaperSize;
  onChangePaperSize?: (size: PaperSize) => void;
  lastSavedText?: string;
  isRtl?: boolean;
}

export default function BuilderSidebar({
  selectedTemplate,
  onSelectTemplate,
  theme,
  setTheme,
  onLoadSample,
  onClear,
  isCollapsed = false,
  onToggleCollapse,
  sectionOrder,
  onReorderSections,
  activeSection,
  onSelectSection,
  paperSize = 'a4',
  onChangePaperSize,
  lastSavedText,
  isRtl = false,
}: BuilderSidebarProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sections' | 'templates' | 'style'>('sections');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const getSectionLabel = (secId: SectionKey) => {
    switch (secId) {
      case 'personal': return t('builder_sec_personal');
      case 'summary': return t('builder_sec_summary');
      case 'experience': return t('builder_sec_experience');
      case 'education': return t('builder_sec_education');
      case 'projects': return t('builder_sec_projects');
      case 'skills': return t('builder_sec_skills');
      case 'languages': return t('builder_sec_languages');
      case 'certifications': return t('builder_sec_certifications');
      default: return secId;
    }
  };

  const templates: {
    id: TemplateId;
    name: string;
    tag: string;
    desc: string;
  }[] = [
    {
      id: 'compact',
      name: 'Compact ATS',
      tag: 'Single column',
      desc: 'Clean typography, inline contact and dates.',
    },
    {
      id: 'executive-blue',
      name: 'Executive Studio',
      tag: 'High whitespace',
      desc: 'Spacious header with understated border accent.',
    },
    {
      id: 'two-column',
      name: 'Two Column',
      tag: 'Side by side',
      desc: 'Skills and education paired alongside experience.',
    },
    {
      id: 'simple',
      name: 'Simple Editorial',
      tag: 'Classic',
      desc: 'Traditional serif layout with horizontal division lines.',
    },
    {
      id: 'oslo',
      name: 'Oslo Minimal',
      tag: '100% Text',
      desc: 'Pure typography designed for strict ATS parsers.',
    },
    {
      id: 'amsterdam',
      name: 'Amsterdam',
      tag: 'With photo',
      desc: 'Modern layout with optional profile photograph.',
    },
    {
      id: 'stockholm',
      name: 'Stockholm',
      tag: 'High density',
      desc: 'Maximum content efficiency for extensive careers.',
    },
    {
      id: 'london',
      name: 'London Serif',
      tag: 'Executive',
      desc: 'Editorial serif headings with balanced margins.',
    },
  ];

  const colors = [
    { name: 'Studio Green', hex: '#0F5C4D' },
    { name: 'Deep Ink', hex: '#14181F' },
    { name: 'Navy Blue', hex: '#1E3A5F' },
    { name: 'Terra Cotta', hex: '#8C5A20' },
    { name: 'Burgundy', hex: '#7A2021' },
    { name: 'Graphite', hex: '#374151' },
  ];

  const fonts = [
    { label: 'Clean Sans (IBM Plex)', value: 'var(--font-sans), sans-serif' },
    { label: 'Plex Arabic (العربية)', value: 'var(--font-arabic), "IBM Plex Sans Arabic", var(--font-sans), sans-serif' },
    { label: 'Editorial Serif (Newsreader)', value: 'var(--font-serif), serif' },
    { label: 'Technical Mono', value: 'var(--font-mono), monospace' },
  ];

  const handleDocumentLanguageChange = (newLang: DocumentLanguage) => {
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
  };

  // Keyboard reorder handlers
  const moveSectionUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(index - 1, 0, moved);
    onReorderSections(newOrder);
  };

  const moveSectionDown = (index: number) => {
    if (index >= sectionOrder.length - 1) return;
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(index + 1, 0, moved);
    onReorderSections(newOrder);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, moved);
    setDraggedIndex(index);
    onReorderSections(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 shrink-0 bg-surface border border-line rounded-[10px] p-2 flex flex-col items-center gap-3 shadow-xs">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-[6px] hover:bg-surface-2 text-ink-2 hover:text-ink transition-colors"
          title="Expand rail"
        >
          <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} strokeWidth={1.5} />
        </button>
        <div className="w-6 h-px bg-line" />
        <div
          className="w-4 h-4 rounded-full border border-line"
          style={{ backgroundColor: theme.accentColor }}
          title={`Accent: ${theme.accentColor}`}
        />
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-[280px] shrink-0 bg-surface border border-line rounded-[10px] flex flex-col shadow-xs overflow-hidden">
      {/* Rail Header with Tabs & Collapse */}
      <div className="p-3 border-b border-line flex items-center justify-between -surface-2">
        <div className="flex items-center gap-1 bg-surface border border-line p-0.5 rounded-[6px] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`px-2 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
              activeTab === 'sections'
                ? 'bg-accent text-white'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            {t('builder_tab_sections')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-2 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-accent text-white'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            {t('builder_tab_templates')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`px-2 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
              activeTab === 'style'
                ? 'bg-accent text-white'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            {t('builder_tab_style')}
          </button>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 rounded-[4px] text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
            title="Collapse rail"
          >
            <ChevronLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* TAB 1: SECTIONS REORDERING */}
      {activeTab === 'sections' && (
        <div className="p-3.5 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-ink">
              {isRtl ? 'ترتيب الأقسام' : 'Section Order'}
            </span>
            <span className="text-[11px] text-ink-3">
              {isRtl ? 'اسحب أو استخدم الأسهم' : 'Drag or use arrows'}
            </span>
          </div>

          <div className="space-y-1.5" role="list">
            {sectionOrder.map((secId, idx) => {
              const meta = DEFAULT_SECTION_METAS[secId];
              const IconComponent = meta?.icon || FileText;
              const isSelected = activeSection === secId;

              return (
                <div
                  key={secId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  role="listitem"
                  className={`group flex items-center justify-between gap-2 p-2 rounded-[6px] border transition-colors cursor-grab active:cursor-grabbing text-xs ${
                    draggedIndex === idx
                      ? 'opacity-40 border-dashed border-accent bg-accent-soft'
                      : isSelected
                      ? 'bg-accent-soft border-accent text-ink'
                      : 'bg-surface -surface-2 border-line text-ink-2'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectSection?.(secId)}
                    className="flex items-center gap-2 text-start flex-1 min-w-0"
                  >
                    <GripVertical className="w-3.5 h-3.5 text-ink-3 group-hover:text-ink shrink-0" strokeWidth={1.5} />
                    <IconComponent className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} />
                    <span className="truncate font-medium text-ink">
                      {getSectionLabel(secId)}
                    </span>
                  </button>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSectionUp(idx)}
                      className="p-1 rounded-[4px] text-ink-3 hover:text-ink hover:bg-surface disabled:opacity-30 cursor-pointer"
                      title={isRtl ? 'تحريك للأعلى' : 'Move up'}
                      aria-label={`${meta.labelEn} move up`}
                    >
                      <ChevronUp className="w-3 h-3" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sectionOrder.length - 1}
                      onClick={() => moveSectionDown(idx)}
                      className="p-1 rounded-[4px] text-ink-3 hover:text-ink hover:bg-surface disabled:opacity-30 cursor-pointer"
                      title={isRtl ? 'تحريك للأسفل' : 'Move down'}
                      aria-label={`${meta.labelEn} move down`}
                    >
                      <ChevronDown className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paper Size Setting */}
          {onChangePaperSize && (
            <div className="pt-2 border-t border-line space-y-1.5">
              <label className="block text-xs font-semibold text-ink">
                {isRtl ? 'حجم الصفحة القياسي' : 'Paper Format'}
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-surface-2 rounded-[6px] border border-line text-xs font-medium">
                <button
                  type="button"
                  onClick={() => onChangePaperSize('a4')}
                  className={`py-1 text-center rounded-[4px] transition-colors cursor-pointer ${
                    paperSize === 'a4'
                      ? 'bg-surface text-ink font-semibold shadow-xs'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  ISO A4
                </button>
                <button
                  type="button"
                  onClick={() => onChangePaperSize('letter')}
                  className={`py-1 text-center rounded-[4px] transition-colors cursor-pointer ${
                    paperSize === 'letter'
                      ? 'bg-surface text-ink font-semibold shadow-xs'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  US Letter
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions (Sample / Reset) */}
          <div className="pt-2 border-t border-line flex items-center gap-2">
            <button
              type="button"
              onClick={onLoadSample}
              className="flex-1 py-1.5 px-2 rounded-[6px] bg-surface hover:bg-surface-2 border border-line text-xs font-medium text-ink-2 hover:text-ink transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" strokeWidth={1.5} />
              <span>{isRtl ? 'ملء بيانات تجريبية' : 'Sample data'}</span>
            </button>
            <button
              type="button"
              onClick={onClear}
              aria-label={isRtl ? 'مسح كافة الحقول' : 'Clear all fields'}
              className="py-1.5 px-2 rounded-[6px] bg-surface hover:bg-red-50 border border-line text-xs font-medium text-ink-3 hover:text-danger transition-colors cursor-pointer"
              title={isRtl ? 'مسح كافة الحقول' : 'Clear all fields'}
            >
              <Trash2 className="w-3 h-3" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES SELECTION */}
      {activeTab === 'templates' && (
        <div className="p-3.5 space-y-2 max-h-[500px] overflow-y-auto">
          <span className="block text-xs font-semibold text-ink mb-1">
            {isRtl ? 'اختر قالب السيرة' : 'Select Resume Layout'}
          </span>
          {templates.map((tpl) => {
            const isSelected = selectedTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onSelectTemplate(tpl.id)}
                className={`w-full p-2.5 rounded-[6px] border text-start transition-colors cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-surface border-accent shadow-xs text-ink ring-1 ring-accent'
                    : '-surface-2 border-line hover:bg-surface text-ink-2'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-medium ${isSelected ? 'text-accent font-semibold' : 'text-ink'}`}>
                    {tpl.name}
                  </span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-surface border border-line text-ink-3">
                    {tpl.tag}
                  </span>
                </div>
                <p className="text-[11px] text-ink-3 mt-1 leading-snug">
                  {tpl.desc}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 3: STYLE (COLORS & TYPOGRAPHY) */}
      {activeTab === 'style' && (
        <div className="p-3.5 space-y-4">
          {/* Output Language Selector (6 Languages) */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-2">
              {isRtl ? 'لغة إخراج المستند' : 'Output Language'}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {DOCUMENT_LANGUAGE_OPTIONS.map((opt) => {
                const isSelected = (theme.documentLanguage || 'en') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleDocumentLanguageChange(opt.id)}
                    className={`p-2 rounded-[6px] border text-xs text-start transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-surface border-accent text-accent font-semibold shadow-xs'
                        : 'bg-surface border-line text-ink-2 hover:bg-surface-2'
                    }`}
                  >
                    <span>{opt.nativeName}</span>
                    <span className="text-[10px] font-mono text-ink-3">
                      {opt.dir === 'rtl' ? 'RTL' : 'LTR'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Palette */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-2">
              {isRtl ? 'لون التمييز (Accent)' : 'Accent Color'}
            </label>
            <div className="grid grid-cols-6 gap-2">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setTheme((prev) => ({ ...prev, accentColor: c.hex }))}
                  className={`w-7 h-7 rounded-[4px] border transition-transform flex items-center justify-center ${
                    theme.accentColor === c.hex
                      ? 'scale-110 border-ink shadow-xs'
                      : 'border-line hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {theme.accentColor === c.hex && (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-2">
              {isRtl ? 'عائلة الخط' : 'Typeface'}
            </label>
            <div className="space-y-1.5">
              {fonts.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setTheme((prev) => ({ ...prev, fontFamily: f.value }))}
                  className={`w-full p-2 rounded-[6px] border text-xs text-start transition-colors flex items-center justify-between ${
                    theme.fontFamily === f.value
                      ? 'bg-surface border-accent text-accent font-semibold shadow-xs'
                      : 'bg-surface border-line text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  <span>{f.label}</span>
                  {theme.fontFamily === f.value && (
                    <Check className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
