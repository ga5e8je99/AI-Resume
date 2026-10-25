'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, TemplateId, ThemeConfig } from '../types';
import OsloTemplate from '../templates/OsloTemplate';
import AmsterdamTemplate from '../templates/AmsterdamTemplate';
import StockholmTemplate from '../templates/StockholmTemplate';
import LondonTemplate from '../templates/LondonTemplate';
import ClassicTemplate from '../templates/ClassicTemplate';
import ModernTemplate from '../templates/ModernTemplate';
import CompactTemplate from '../templates/CompactTemplate';
import TwoColumnTemplate from '../templates/TwoColumnTemplate';
import AtsFriendlyTemplate from '../templates/AtsFriendlyTemplate';
import SimpleTemplate from '../templates/SimpleTemplate';
import { ZoomIn, ZoomOut, CheckCircle2, Maximize2, Printer } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  template: TemplateId;
  theme: ThemeConfig;
}

export function ResumePreview({ data, template, theme }: ResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(0.85);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);

  // Auto-calculate best zoom scale based on container width
  const calculateAutoFitZoom = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    // Standard A4 width in px at 96 DPI is ~794px. Leave 24px padding on mobile.
    const availableWidth = Math.max(containerWidth - 24, 280);
    if (availableWidth < 794) {
      // Scale down to fit mobile/tablet screen perfectly
      const fitZoom = Math.min(1, Math.max(0.35, availableWidth / 794));
      setZoom(Number(fitZoom.toFixed(2)));
    } else {
      // Desktop: default comfortable preview
      setZoom(0.85);
    }
  };

  useEffect(() => {
    calculateAutoFitZoom();

    const handleResize = () => {
      if (isAutoFit) {
        calculateAutoFitZoom();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAutoFit]);

  const zoomIn = () => {
    setIsAutoFit(false);
    setZoom((prev) => Math.min(Number((prev + 0.1).toFixed(2)), 1.4));
  };

  const zoomOut = () => {
    setIsAutoFit(false);
    setZoom((prev) => Math.max(Number((prev - 0.1).toFixed(2)), 0.35));
  };

  const handleFitToScreen = () => {
    setIsAutoFit(true);
    calculateAutoFitZoom();
  };

  const renderTemplate = () => {
    switch (template) {
      // ResumeForFree Official Templates
      case 'compact':
        return <CompactTemplate data={data} theme={theme} />;
      case 'two-column':
        return <TwoColumnTemplate data={data} theme={theme} />;
      case 'ats-friendly':
        return <AtsFriendlyTemplate data={data} theme={theme} />;
      case 'simple':
        return <SimpleTemplate data={data} theme={theme} />;

      // Other ATS Templates
      case 'oslo':
        return <OsloTemplate data={data} theme={theme} />;
      case 'amsterdam':
        return <AmsterdamTemplate data={data} theme={theme} />;
      case 'stockholm':
        return <StockholmTemplate data={data} theme={theme} />;
      case 'london':
        return <LondonTemplate data={data} theme={theme} />;
      case 'modern':
        return <ModernTemplate data={data} theme={theme} />;
      case 'classic':
      default:
        return <ClassicTemplate data={data} theme={theme} />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Preview Controls Bar (hidden during print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-t-xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>100% ATS Safe</span>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
            Standard A4
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={zoomOut}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFitToScreen}
            className={`px-1.5 py-0.5 text-[10px] sm:text-xs font-mono rounded transition-colors flex items-center gap-1 ${
              isAutoFit ? 'text-cyan-400 bg-cyan-950/60 font-semibold' : 'text-slate-300 hover:text-cyan-400'
            }`}
            title="Auto Fit to Screen Width"
          >
            <Maximize2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>{Math.round(zoom * 100)}%</span>
          </button>

          <button
            type="button"
            onClick={zoomIn}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {/* Vector Print to PDF shortcut */}
        <button
          type="button"
          onClick={() => window.print()}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors shadow-sm"
          title="Print to PDF via browser dialog (saves 100% selectable vector text with clickable links for ATS applicant portals)"
        >
          <Printer className="w-3 h-3 text-cyan-400" />
          <span>Vector Print (ATS)</span>
        </button>
      </div>

      {/* Sheet Container with responsive auto-fit wrapper */}
      <div
        ref={containerRef}
        className="flex-1 bg-slate-950/60 p-2 sm:p-4 md:p-6 overflow-x-auto overflow-y-auto border-x border-b border-slate-800 rounded-b-xl flex justify-center items-start min-h-[450px]"
      >
        <div
          style={{
            width: `${794 * zoom}px`,
            transition: 'width 0.15s ease-out',
          }}
          className="flex justify-center print:w-full"
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="print:transform-none"
          >
            {/* A4 Sheet with printable ID */}
            <div
              id="resume-preview"
              className="w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl shadow-black/80 rounded-sm overflow-hidden print:w-full print:min-h-0 print:shadow-none print:m-0 print:rounded-none"
            >
              {renderTemplate()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
