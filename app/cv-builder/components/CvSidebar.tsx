'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CvTemplateId, CvThemeConfig } from '../types';
import {
  FileText,
  Layout,
  Award,
  AlignLeft,
  Sparkles,
  BookOpen,
  Palette,
  Type,
  RefreshCw,
  Trash2,
  Printer,
  Download,
  Check,
  Sliders,
  CheckCircle2,
  Cloud,
  Loader2,
  Globe,
  Briefcase,
  GraduationCap,
  ArrowRight,
  FileCode,
} from 'lucide-react';

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
  onDownloadPdf,
  onDownloadWord,
  onPrint,
  isExportingPdf = false,
  isExportingWord = false,
  onSaveCloud,
  isSavingCloud = false,
  saveMessage = null,
}: CvSidebarProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'style'>('templates');

  const templates: {
    id: CvTemplateId;
    name: string;
    tag: string;
    icon: React.ReactNode;
    desc: string;
  }[] = [
    {
      id: 'europass',
      name: 'Europass CV',
      tag: 'European Standard',
      icon: <Globe className="w-4 h-4 text-sky-400" />,
      desc: 'Official European layout with dedicated languages and demographics sidebar',
    },
    {
      id: 'executive',
      name: 'Executive Master',
      tag: 'Leadership & C-Level',
      icon: <Briefcase className="w-4 h-4 text-amber-400" />,
      desc: 'Authoritative serif profile with executive competencies and board experience',
    },
    {
      id: 'academic',
      name: 'Academic & Research',
      tag: 'Harvard & Oxford Standard',
      icon: <GraduationCap className="w-4 h-4 text-blue-400" />,
      desc: 'Education first, peer-reviewed publications, grants, and scholarly citations',
    },
    {
      id: 'modern-two-column',
      name: 'Modern Dual-Pillar',
      tag: 'Tech & Engineers',
      icon: <Layout className="w-4 h-4 text-emerald-400" />,
      desc: 'Vibrant sidebar with photo, progress indicators, and comprehensive timeline',
    },
    {
      id: 'classic-ats',
      name: 'Classic Full ATS',
      tag: '100% Parsing Safe',
      icon: <AlignLeft className="w-4 h-4 text-slate-300" />,
      desc: 'Pure single-column format covering all 13 sections with zero parsing issues',
    },
  ];

  const colors = [
    { name: 'Emerald', hex: '#059669' },
    { name: 'Sky Blue', hex: '#0284c7' },
    { name: 'Royal Indigo', hex: '#4f46e5' },
    { name: 'Midnight Navy', hex: '#0f172a' },
    { name: 'Crimson', hex: '#dc2626' },
    { name: 'Violet', hex: '#7c3aed' },
    { name: 'Amber Gold', hex: '#d97706' },
    { name: 'Charcoal', hex: '#334155' },
  ];

  const fonts = [
    { name: 'Modern Sans (Inter)', value: 'var(--font-sans), sans-serif' },
    { name: 'Academic Serif (Georgia)', value: 'Georgia, serif' },
    { name: 'Corporate (Roboto)', value: 'Roboto, Arial, sans-serif' },
    { name: 'Technical Mono', value: 'ui-monospace, monospace' },
  ];

  return (
    <aside className="w-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Banner & Mode Switch */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Curriculum Vitae Studio
          </span>
        </div>
        <Link
          href="/builder"
          className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          title="Switch to 1-Page Resume Builder"
        >
          <span>Resume Mode →</span>
        </Link>
      </div>

      {/* Tabs Switcher: Templates vs Styling */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'templates'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Layout className="w-3.5 h-3.5 text-emerald-400" />
          <span>CV Templates</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {templates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'style'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-emerald-400" />
          <span>Design & Theme</span>
        </button>
      </div>

      {/* Tab 1: Templates */}
      {activeTab === 'templates' && (
        <div className="p-4 space-y-3 overflow-y-auto max-h-[380px]">
          {templates.map((tpl) => {
            const isSelected = selectedTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onSelectTemplate(tpl.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all relative ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/5'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tpl.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{tpl.name}</h4>
                      <span className="text-[10px] text-emerald-400 font-semibold">{tpl.tag}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{tpl.desc}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab 2: Styling */}
      {activeTab === 'style' && (
        <div className="p-4 space-y-5 overflow-y-auto max-h-[380px]">
          {/* Accent Color Palette */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2.5">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span>Accent Color</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setTheme((prev) => ({ ...prev, accentColor: c.hex }))}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 transition-all hover:scale-105"
                  title={c.name}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: c.hex }}
                  >
                    {theme.accentColor === c.hex && (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                    )}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium truncate max-w-full">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
              <Type className="w-3.5 h-3.5 text-emerald-400" />
              <span>Font Family</span>
            </label>
            <div className="space-y-1.5">
              {fonts.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setTheme((prev) => ({ ...prev, fontFamily: f.value }))}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-between ${
                    theme.fontFamily === f.value
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <span>{f.name}</span>
                  {theme.fontFamily === f.value && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Scaling */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Content Density</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['sm', 'base', 'lg'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setTheme((prev) => ({ ...prev, fontSize: size }))}
                  className={`py-2 text-xs font-bold rounded-xl border uppercase transition-all ${
                    theme.fontSize === size
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {size === 'sm' ? 'Compact' : size === 'base' ? 'Standard' : 'Spacious'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cloud Save & Status Feedback */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-2.5">
        {saveMessage && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{saveMessage}</span>
          </div>
        )}

        {onSaveCloud && (
          <button
            type="button"
            onClick={onSaveCloud}
            disabled={isSavingCloud}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] cursor-pointer"
          >
            {isSavingCloud ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Cloud...</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5" />
                <span>Save CV to My Account</span>
              </>
            )}
          </button>
        )}

        {/* Primary Export Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isExportingPdf}
              className="py-2 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Export PDF</span>
            </button>
          )}

          {onDownloadWord && (
            <button
              type="button"
              onClick={onDownloadWord}
              disabled={isExportingWord}
              className="py-2 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {isExportingWord ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span>Export Word</span>
            </button>
          )}
        </div>

        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="w-full py-2 px-3 rounded-xl font-medium text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print CV (A4 Vector)</span>
          </button>
        )}

        {/* Preset Loaders */}
        <div className="flex gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onLoadSample}
            className="flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Load Sample CV</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            className="py-1.5 px-2.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 transition-colors cursor-pointer"
            title="Clear all fields"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
}
