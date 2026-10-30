'use client';

import React from 'react';
import { ThemeConfig } from '../types';
import { Download, RefreshCw, Trash2, Palette, Type, FileText, Printer, Globe } from 'lucide-react';
import {
  DOCUMENT_LANGUAGE_OPTIONS,
  DocumentLanguage,
  setStoredDocumentLanguage,
  getDocumentFontFamily,
} from '@/app/lib/documentI18n';

interface Props {
  theme: ThemeConfig;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  onLoadSample: () => void;
  onClear: () => void;
  onDownloadPdf: () => void;
  onDownloadWord: () => void;
  onPrint?: () => void;
  isExportingPdf?: boolean;
  isExportingWord?: boolean;
}

export default function CustomizerBar({
  theme,
  setTheme,
  onLoadSample,
  onClear,
  onDownloadPdf,
  onDownloadWord,
  onPrint,
  isExportingPdf = false,
  isExportingWord = false,
}: Props) {
  const colors = [
    { name: 'Editorial Ink', hex: '#14181F' },
    { name: 'Pine Accent', hex: '#0F5C4D' },
    { name: 'Warm Slate', hex: '#4A5160' },
    { name: 'Amber Highlight', hex: '#C8892B' },
    { name: 'Forest Green', hex: '#1B7F4B' },
    { name: 'Classic Burgundy', hex: '#8B1E17' },
    { name: 'Charcoal', hex: '#2A322D' },
  ];

  const fonts = [
    { label: 'Clean Sans (Inter)', value: 'var(--font-sans), sans-serif' },
    { label: 'Plex Arabic (العربية)', value: 'var(--font-arabic), "IBM Plex Sans Arabic", var(--font-sans), sans-serif' },
    { label: 'Executive Serif (Georgia)', value: 'Georgia, serif' },
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
    <div className="bg-surface border border-line rounded-[10px] p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 shadow-subtle">
      {/* Colors, Output Language & Fonts */}
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 sm:gap-5">
        {/* Output Language Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-accent shrink-0" />
          <span className="text-xs font-medium text-ink-2 hidden sm:inline">Output:</span>
          <select
            id="document-output-language"
            aria-label="Resume output language"
            value={theme.documentLanguage || 'en'}
            onChange={(e) => handleDocumentLanguageChange(e.target.value as DocumentLanguage)}
            className="bg-surface border border-line-strong text-xs text-ink rounded-[6px] px-2 py-1.5 focus:border-accent outline-none font-medium"
          >
            {DOCUMENT_LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.nativeName} ({opt.code})
              </option>
            ))}
          </select>
        </div>

        {/* Accent Colors */}
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-ink-3 shrink-0" />
          <span className="text-xs font-medium text-ink-2 hidden sm:inline">Accent:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {colors.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.name}
                aria-label={`Select accent color ${c.name}`}
                onClick={() => setTheme((prev) => ({ ...prev, accentColor: c.hex }))}
                className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-transform ${
                  theme.accentColor === c.hex
                    ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface'
                    : 'hover:scale-110 opacity-85 hover:opacity-100'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full pointer-events-none" style={{ backgroundColor: c.hex }} />
              </button>
            ))}
          </div>
        </div>

        {/* Font Selector */}
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-ink-3 shrink-0" />
          <span className="text-xs font-medium text-ink-2 hidden sm:inline">Font:</span>
          <select
            id="theme-font-family"
            aria-label="Resume font family"
            value={theme.fontFamily}
            onChange={(e) => setTheme((prev) => ({ ...prev, fontFamily: e.target.value }))}
            className="bg-surface border border-line-strong text-xs text-ink rounded-[6px] px-2 py-1.5 focus:border-accent outline-none max-w-[130px] sm:max-w-none"
          >
            {fonts.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={onLoadSample}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-[6px] text-xs font-medium bg-surface-2 text-ink hover:bg-line transition-colors border border-line"
            title="Fill form with professional sample data"
          >
            <RefreshCw className="w-3 h-3 text-accent" />
            <span>Sample</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-[6px] text-xs font-medium bg-surface text-ink-3 hover:text-danger hover:bg-danger-soft border border-line transition-colors"
            title="Clear all fields"
          >
            <Trash2 className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
          {/* Download Word (.docx) */}
          <button
            type="button"
            disabled={isExportingWord}
            onClick={onDownloadWord}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-[6px] text-xs font-medium text-ink bg-surface border border-line-strong hover:bg-surface-2 disabled:opacity-50 transition-colors"
            title="Download editable Microsoft Word document (.docx)"
          >
            <FileText className="w-3.5 h-3.5 text-ink-2" />
            <span>{isExportingWord ? 'Exporting...' : 'Word'}</span>
          </button>

          {/* Direct Download PDF */}
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={onDownloadPdf}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-[6px] text-xs font-medium text-on-accent bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
            title="Directly download PDF file to computer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? 'Saving...' : 'PDF'}</span>
          </button>
        </div>

        {/* Optional Browser Print (Physical Printer) */}
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="hidden md:inline-flex p-2 rounded-[6px] text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
            title="Open browser printer dialog"
          >
            <Printer className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
