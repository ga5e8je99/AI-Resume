import React from 'react';
import { ThemeConfig } from '../types';
import { Download, RefreshCw, Trash2, Palette, Type, FileText, Printer } from 'lucide-react';

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
    { name: 'Classic Slate', hex: '#1e293b' },
    { name: 'Tech Blue', hex: '#2563eb' },
    { name: 'Sky Cyan', hex: '#0284c7' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Indigo Purple', hex: '#6366f1' },
    { name: 'Burgundy Rose', hex: '#be123c' },
    { name: 'Amber Gold', hex: '#d97706' },
  ];

  const fonts = [
    { label: 'Clean Sans (Inter)', value: 'var(--font-sans), sans-serif' },
    { label: 'Executive Serif (Georgia)', value: 'Georgia, serif' },
    { label: 'Technical Mono', value: 'var(--font-mono), monospace' }
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 backdrop-blur-xl shadow-xl">
      {/* Colors & Fonts */}
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 sm:gap-6">
        {/* Accent Colors */}
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Accent:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {colors.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.name}
                onClick={() => setTheme(prev => ({ ...prev, accentColor: c.hex }))}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full shrink-0 transition-transform ${
                  theme.accentColor === c.hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        {/* Font Selector */}
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Font:</span>
          <select
            value={theme.fontFamily}
            onChange={(e) => setTheme(prev => ({ ...prev, fontFamily: e.target.value }))}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 max-w-[130px] sm:max-w-none"
          >
            {fonts.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
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
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Fill form with professional sample data"
          >
            <RefreshCw className="w-3 h-3 text-indigo-400" />
            <span>Sample</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/60 text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
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
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 disabled:opacity-50 shadow-md shadow-blue-700/25 transition-all"
            title="Download editable Microsoft Word document (.docx)"
          >
            <FileText className="w-3.5 h-3.5 text-blue-200" />
            <span>{isExportingWord ? 'Exporting...' : 'Word'}</span>
          </button>

          {/* Direct Download PDF */}
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={onDownloadPdf}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 disabled:opacity-50 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            title="Directly download PDF file to computer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-200" />
            <span>{isExportingPdf ? 'Saving...' : 'PDF'}</span>
          </button>
        </div>

        {/* Optional Browser Print (Physical Printer) */}
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="hidden md:inline-flex p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
            title="Open browser printer dialog"
          >
            <Printer className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
