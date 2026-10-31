'use client';

import React, { useState } from 'react';
import { CvTemplateId, CvThemeConfig } from '../types';
import {
  FileText,
  Layout,
  Briefcase,
  GraduationCap,
  AlignLeft,
  Globe,
  Palette,
  Type,
  RefreshCw,
  Trash2,
  Check,
} from 'lucide-react';
import {
  DOCUMENT_LANGUAGE_OPTIONS,
  DocumentLanguage,
  setStoredDocumentLanguage,
  getDocumentFontFamily,
} from '@/app/lib/documentI18n';
import { Stagger } from '@/app/components/landing/ScrollReveal';

interface CvSidebarProps {
  selectedTemplate: CvTemplateId;
  onSelectTemplate: (t: CvTemplateId) => void;
  theme: CvThemeConfig;
  setTheme: React.Dispatch<React.SetStateAction<CvThemeConfig>>;
  onLoadSample: () => void;
  onClear: () => void;
  onDownloadPdf?: () => void;
  onDownloadWord?: () => void;
  onPrint?: () => void;
  isExportingPdf?: boolean;
  isExportingWord?: boolean;
  onSaveCloud?: () => void;
  isSavingCloud?: boolean;
  saveMessage?: string | null;
}

export default function CvSidebar({
  selectedTemplate,
  onSelectTemplate,
  theme,
  setTheme,
  onLoadSample,
  onClear,
}: CvSidebarProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'style'>('templates');

  const templates: {
    id: CvTemplateId;
    name: string;
    tag: string;
    icon: any;
    desc: string;
  }[] = [
    {
      id: 'europass',
      name: 'Europass Standard',
      tag: 'European Format',
      icon: Globe,
      desc: 'Structured academic & professional format aligned to EU guidelines.',
    },
    {
      id: 'executive',
      name: 'Executive Studio',
      tag: 'Leadership',
      icon: Briefcase,
      desc: 'Authoritative serif typography for directors and senior management.',
    },
    {
      id: 'academic',
      name: 'Academic & Research',
      tag: 'Higher Ed',
      icon: GraduationCap,
      desc: 'Education first, peer-reviewed publications, grants, and citations.',
    },
    {
      id: 'modern-two-column',
      name: 'Dual Pillar',
      tag: 'Technical',
      icon: Layout,
      desc: 'Two-column structure separating credentials and technical capabilities.',
    },
    {
      id: 'classic-ats',
      name: 'Classic ATS Multi-Page',
      tag: '100% Parsing Safe',
      icon: AlignLeft,
      desc: 'Pure single-column format covering extensive career histories cleanly.',
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
      fontFamily: newLang === 'ar' ? getDocumentFontFamily('ar') : (prev.fontFamily.includes('font-arabic') ? 'var(--font-sans), sans-serif' : prev.fontFamily),
    }));
  };

  return (
    <aside className="w-full shrink-0 bg-surface border border-line rounded-[10px] flex flex-col shadow-xs overflow-hidden">
      {/* Header Tabs */}
      <div className="p-3 border-b border-line flex items-center justify-between -surface-2">
        <div className="flex items-center gap-1 bg-surface border border-line p-0.5 rounded-[6px] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-accent text-white'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Templates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`px-3 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
              activeTab === 'style'
                ? 'bg-accent text-white'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Style
          </button>
        </div>
      </div>

      {/* Tab 1: Templates */}
      {activeTab === 'templates' && (
        <div className="p-3.5 space-y-2">
          <span className="block text-xs font-semibold text-ink mb-1">
            Curriculum Vitae Templates
          </span>
          <Stagger className="space-y-2" direction="up">
            {templates.map((tpl) => {
              const isSelected = selectedTemplate === tpl.id;
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onSelectTemplate(tpl.id)}
                  className={`card-interactive w-full p-2.5 rounded-[6px] border text-start cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-surface border-accent shadow-xs text-ink ring-1 ring-accent'
                      : 'bg-surface-2 border-line-strong hover:bg-surface text-ink-2'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} />
                      <span className={`text-xs font-medium ${isSelected ? 'text-accent font-semibold' : 'text-ink'}`}>
                        {tpl.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-surface border border-line-strong text-ink-3">
                      {tpl.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-3 mt-1 leading-snug">
                    {tpl.desc}
                  </p>
                </button>
              );
            })}
          </Stagger>

          {/* Quick Actions */}
          <div className="pt-2 border-t border-line flex items-center gap-2">
            <button
              type="button"
              onClick={onLoadSample}
              className="flex-1 py-1.5 px-2 rounded-[6px] bg-surface hover:bg-surface-2 border border-line text-xs font-medium text-ink-2 hover:text-ink transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" strokeWidth={1.5} />
              <span>Sample data</span>
            </button>
            <button
              type="button"
              onClick={onClear}
              className="py-1.5 px-2 rounded-[6px] bg-surface hover:bg-red-50 border border-line text-xs font-medium text-ink-3 hover:text-danger transition-colors cursor-pointer"
              title="Clear all fields"
            >
              <Trash2 className="w-3 h-3" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Style */}
      {activeTab === 'style' && (
        <div className="p-3.5 space-y-4">
          {/* Output Language */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-2">
              Output Language
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
                    {isSelected && <Check className="w-3.5 h-3.5 text-accent" strokeWidth={2} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2">
              Accent Color
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

          <div>
            <label className="block text-xs font-semibold text-ink mb-2">
              Typeface
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
