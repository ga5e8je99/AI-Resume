'use client';

import React, { useState } from 'react';
import { TemplateId, ThemeConfig } from '../types';
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
  ChevronLeft,
  ChevronRight,
  Check,
  Sliders,
  CheckCircle2,
  Cloud,
  Loader2,
} from 'lucide-react';

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
}

export default function BuilderSidebar({
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
  isCollapsed = false,
  onToggleCollapse,
  onSaveCloud,
  isSavingCloud = false,
  saveMessage = null,
}: BuilderSidebarProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'style'>('templates');

  const templates: {
    id: TemplateId;
    name: string;
    source: string;
    tag: string;
    icon: React.ReactNode;
    desc: string;
  }[] = [
    // ResumeForFree Official Templates
    {
      id: 'compact',
      name: 'Compact',
      source: 'ResumeForFree #1',
      tag: 'ATS Friendly',
      icon: <AlignLeft className="w-4 h-4" />,
      desc: 'Single column ATS friendly template with clean typography and inline dates.',
    },
    {
      id: 'two-column',
      name: 'Two Column',
      source: 'ResumeForFree #2',
      tag: 'Side by Side',
      icon: <Layout className="w-4 h-4" />,
      desc: 'A two-column resume layout with sections side by side.',
    },
    {
      id: 'ats-friendly',
      name: 'ATS Friendly',
      source: 'ResumeForFree #3',
      tag: 'Blue Accent',
      icon: <Award className="w-4 h-4" />,
      desc: 'Single-column template with blue accents, optimized for applicant tracking systems.',
    },
    {
      id: 'simple',
      name: 'Simple',
      source: 'ResumeForFree #4',
      tag: 'Academic CV',
      icon: <BookOpen className="w-4 h-4" />,
      desc: 'Traditional academic CV layout with labeled columns and horizontal rules.',
    },
    // Top ATS Models
    {
      id: 'oslo',
      name: 'Oslo ATS',
      source: 'Resume.io ATS #1',
      tag: 'Max Parse Rate',
      icon: <FileText className="w-4 h-4" />,
      desc: 'Pure typography, zero graphics or icons. Passes Taleo & Workday with 100% accuracy.',
    },
    {
      id: 'amsterdam',
      name: 'Amsterdam',
      source: 'Resume.io ATS #2',
      tag: 'Modern + Photo',
      icon: <Layout className="w-4 h-4" />,
      desc: 'Sleek single-column with optional photo, soft accent divider, and clean text contact.',
    },
    {
      id: 'stockholm',
      name: 'Stockholm',
      source: 'Resume.io ATS #3',
      tag: 'High Density',
      icon: <FileText className="w-4 h-4" />,
      desc: 'Compact layout built to fit maximum career experience cleanly onto 1-2 pages.',
    },
    {
      id: 'london',
      name: 'London',
      source: 'Resume.io ATS #4',
      tag: 'Executive Serif',
      icon: <Sparkles className="w-4 h-4" />,
      desc: 'Generous whitespace with refined executive serif typography and optional photo.',
    },
  ];

  const colors = [
    { name: 'Classic Slate', hex: '#1e293b' },
    { name: 'Tech Blue', hex: '#2563eb' },
    { name: 'Sky Cyan', hex: '#0284c7' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Indigo Purple', hex: '#6366f1' },
    { name: 'Burgundy Rose', hex: '#be123c' },
    { name: 'Amber Gold', hex: '#d97706' },
  ];

  const fonts = [
    { label: 'Clean Sans (Inter)', value: 'var(--font-sans), sans-serif', sample: 'Aa' },
    { label: 'Executive Serif (Georgia)', value: 'Georgia, serif', sample: 'Ag' },
    { label: 'Technical Mono', value: 'var(--font-mono), monospace', sample: '{;}' },
  ];

  const selectedTplObj = templates.find((t) => t.id === selectedTemplate) || templates[0];

  // Collapsed Minimal Rail (Desktop)
  if (isCollapsed) {
    return (
      <aside className="w-16 shrink-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex flex-col items-center gap-3 backdrop-blur-xl shadow-xl transition-all duration-300">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Expand Sidebar"
        >
          <ChevronRight className="w-5 h-5 text-cyan-400" />
        </button>

        <div className="w-8 h-px bg-slate-800 my-1" />

        {/* Active Template Icon */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center hover:scale-105 transition-all shadow-md shadow-cyan-500/20"
          title={`Template: ${selectedTplObj.name}`}
        >
          {selectedTplObj.icon}
        </button>

        {/* Active Accent Color Dot */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-6 h-6 rounded-full border-2 border-white/60 shadow-md transition-transform hover:scale-110"
          style={{ backgroundColor: theme.accentColor }}
          title={`Color: ${theme.accentColor}`}
        />

        <div className="w-8 h-px bg-slate-800 my-1" />

        {/* Quick Sample Button */}
        <button
          type="button"
          onClick={onLoadSample}
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
          title="Fill Sample Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Print Resume"
          >
            <Printer className="w-4 h-4" />
          </button>
        )}
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-[320px] xl:w-[340px] shrink-0 bg-slate-900/95 border border-slate-800/90 rounded-2xl flex flex-col backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300">
      {/* Sidebar Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/25">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>Templates & Style</span>
            </h3>
            <p className="text-[11px] text-slate-400">Custom ATS Styling</p>
          </div>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Internal Sub-Tabs (Templates / Appearance) */}
      <div className="px-3 pt-3 pb-1 border-b border-slate-800/60 flex items-center gap-1.5 bg-slate-950/20">
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'templates'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Templates</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-bold">
            {templates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('style')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'style'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Design & Fonts</span>
        </button>
      </div>

      {/* Sidebar Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-h-[calc(100vh-14rem)] lg:max-h-[calc(100vh-12rem)] [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
        {/* TAB 1: TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-0.5">
              <span>Choose Layout Model</span>
              <span className="text-cyan-400 text-[10px] font-bold">100% ATS Safe</span>
            </div>

            <div className="space-y-2">
              {templates.map((tpl) => {
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onSelectTemplate(tpl.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col gap-1.5 relative group ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/15 ring-2 ring-cyan-500/30'
                        : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                              : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                          }`}
                        >
                          {tpl.icon}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            {tpl.name}
                          </h4>
                          <span className="text-[10px] text-cyan-400/90 font-medium block">
                            {tpl.source}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700/60'
                        }`}
                      >
                        {tpl.tag}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-0.5">
                      {tpl.desc}
                    </p>

                    {isSelected && (
                      <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-semibold pt-1 border-t border-cyan-500/20">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Active Template</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: STYLE & DESIGN */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            {/* Accent Colors Section */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Accent Color</span>
                </label>
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  {colors.find((c) => c.hex === theme.accentColor)?.name || theme.accentColor}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 pt-1">
                {colors.map((c) => {
                  const isColorActive = theme.accentColor === c.hex;
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.name}
                      onClick={() => setTheme((prev) => ({ ...prev, accentColor: c.hex }))}
                      className={`w-7 h-7 rounded-full shrink-0 transition-all flex items-center justify-center ${
                        isColorActive
                          ? 'scale-115 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 shadow-md shadow-cyan-500/30'
                          : 'hover:scale-110 opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isColorActive && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Typography Section */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-cyan-400" />
                <span>Typography & Font</span>
              </label>

              <div className="space-y-1.5">
                {fonts.map((f) => {
                  const isFontActive = theme.fontFamily === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setTheme((prev) => ({ ...prev, fontFamily: f.value }))}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                        isFontActive
                          ? 'border-cyan-500 bg-cyan-500/10 text-white font-semibold shadow-sm'
                          : 'border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <span style={{ fontFamily: f.value }}>{f.label}</span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {f.sample}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions (Sample, Reset, Print) */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold block">Presets & Tools</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onLoadSample}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                  title="Fill form with sample data"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sample</span>
                </button>

                <button
                  type="button"
                  onClick={onClear}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-colors"
                  title="Clear all fields"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              {onSaveCloud && (
                <button
                  type="button"
                  disabled={isSavingCloud}
                  onClick={onSaveCloud}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-white transition-all ${
                    saveMessage
                      ? 'bg-emerald-600 shadow-md shadow-emerald-600/30'
                      : 'bg-emerald-700 hover:bg-emerald-600'
                  }`}
                  title="Save resume to cloud"
                >
                  {isSavingCloud ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : saveMessage ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{saveMessage}</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Save to Cloud</span>
                    </>
                  )}
                </button>
              )}

              {onPrint && (
                <button
                  type="button"
                  onClick={onPrint}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Print resume"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Print Document</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer with Quick Export shortcuts */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
        {onDownloadWord && (
          <button
            type="button"
            disabled={isExportingWord}
            onClick={onDownloadWord}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-blue-700/80 hover:bg-blue-600 disabled:opacity-50 text-white text-[11px] font-semibold transition-all"
            title="Download Word Document"
          >
            <FileText className="w-3 h-3 text-blue-200" />
            <span>Word</span>
          </button>
        )}

        {onDownloadPdf && (
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={onDownloadPdf}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-[11px] font-semibold transition-all shadow-md shadow-cyan-500/20"
            title="Download PDF"
          >
            <Download className="w-3 h-3 text-cyan-200" />
            <span>PDF</span>
          </button>
        )}
      </div>
    </aside>
  );
}
