'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CvData, CvTemplateId, CvThemeConfig } from '../types';
import EuropassCvTemplate from '../templates/EuropassCvTemplate';
import ExecutiveCvTemplate from '../templates/ExecutiveCvTemplate';
import AcademicCvTemplate from '../templates/AcademicCvTemplate';
import ModernTwoColumnCvTemplate from '../templates/ModernTwoColumnCvTemplate';
import ClassicAtsCvTemplate from '../templates/ClassicAtsCvTemplate';
import { ZoomIn, ZoomOut, CheckCircle2, Maximize2, FileText } from 'lucide-react';

interface CvPreviewProps {
  data: CvData;
  template: CvTemplateId;
  theme: CvThemeConfig;
}

export function CvPreview({ data, template, theme }: CvPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(0.85);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);

  // Auto-calculate best zoom scale based on container width
  const calculateAutoFitZoom = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    // Standard A4 width in px at 96 DPI is ~794px.
    const availableWidth = Math.max(containerWidth - 24, 280);
    if (availableWidth < 794) {
      const fitZoom = Math.min(1, Math.max(0.35, availableWidth / 794));
      setZoom(Number(fitZoom.toFixed(2)));
    } else {
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
      case 'europass':
        return <EuropassCvTemplate data={data} theme={theme} />;
      case 'executive':
        return <ExecutiveCvTemplate data={data} theme={theme} />;
      case 'academic':
        return <AcademicCvTemplate data={data} theme={theme} />;
      case 'modern-two-column':
        return <ModernTwoColumnCvTemplate data={data} theme={theme} />;
      case 'classic-ats':
      default:
        return <ClassicAtsCvTemplate data={data} theme={theme} />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Preview Controls Bar (hidden during print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-t-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Full Curriculum Vitae (CV)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            ISO A4 Multi-Page Ready
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={zoomOut}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFitToScreen}
            className={`px-2 py-0.5 text-xs font-mono rounded transition-colors flex items-center gap-1 ${
              isAutoFit
                ? 'text-emerald-400 bg-emerald-950/60 font-semibold'
                : 'text-slate-300 hover:text-emerald-400'
            }`}
            title="Auto Fit to Screen Width"
          >
            <Maximize2 className="w-3 h-3" />
            <span>{Math.round(zoom * 100)}%</span>
          </button>

          <button
            type="button"
            onClick={zoomIn}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sheet Container with responsive auto-fit wrapper */}
      <div
        ref={containerRef}
        className="flex-1 bg-slate-950/70 p-3 sm:p-6 overflow-x-auto overflow-y-auto border-x border-b border-slate-800 rounded-b-xl flex justify-center items-start min-h-[500px]"
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
            {/* A4 Printable Sheet */}
            <div
              id="cv-preview"
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
