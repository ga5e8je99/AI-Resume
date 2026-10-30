'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CvData, CvTemplateId, CvThemeConfig } from '../types';
import EuropassCvTemplate from '../templates/EuropassCvTemplate';
import ExecutiveCvTemplate from '../templates/ExecutiveCvTemplate';
import AcademicCvTemplate from '../templates/AcademicCvTemplate';
import ModernTwoColumnCvTemplate from '../templates/ModernTwoColumnCvTemplate';
import ClassicAtsCvTemplate from '../templates/ClassicAtsCvTemplate';
import { ZoomIn, ZoomOut, Maximize2, Check, Printer } from 'lucide-react';

interface CvPreviewProps {
  data: CvData;
  template: CvTemplateId;
  theme: CvThemeConfig;
}

export function CvPreview({ data, template, theme }: CvPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(0.85);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);

  const calculateAutoFitZoom = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const availableWidth = Math.max(containerWidth - 32, 280);
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
    setZoom((prev) => Math.min(Number((prev + 0.1).toFixed(2)), 1.3));
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
      {/* Top Preview Controls Bar */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-surface border border-line rounded-t-[10px] shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-accent-soft text-accent">
            <Check className="w-3 h-3 text-accent" strokeWidth={2} />
            <span>Curriculum Vitae</span>
          </div>
          <span className="text-[11px] text-ink-3 font-mono">
            ISO A4 Multi-Page
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-surface-2 px-1.5 py-0.5 rounded-[6px] border border-line">
          <button
            type="button"
            onClick={zoomOut}
            className="p-1 text-ink-2 hover:text-ink rounded transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={handleFitToScreen}
            className={`px-1.5 py-0.5 text-[11px] font-mono rounded transition-colors flex items-center gap-1 ${
              isAutoFit ? 'text-accent font-semibold' : 'text-ink-2 hover:text-ink'
            }`}
            title="Fit to Screen"
          >
            <Maximize2 className="w-2.5 h-2.5" strokeWidth={1.5} />
            <span>{Math.round(zoom * 100)}%</span>
          </button>

          <button
            type="button"
            onClick={zoomIn}
            className="p-1 text-ink-2 hover:text-ink rounded transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Vector Print button */}
        <button
          type="button"
          onClick={() => window.print()}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-ink-2 hover:text-ink bg-surface hover:bg-surface-2 border border-line rounded-[6px] transition-colors"
          title="Print to PDF"
        >
          <Printer className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.5} />
          <span>Vector Print</span>
        </button>
      </div>

      {/* Sheet Container with responsive auto-fit wrapper */}
      <div
        ref={containerRef}
        className="flex-1 bg-surface-2/40 p-3 sm:p-6 overflow-x-auto overflow-y-auto border-x border-b border-line rounded-b-[10px] flex justify-center items-start min-h-[500px]"
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
              id="cv-preview"
              dir={theme.documentLanguage === 'ar' ? 'rtl' : 'ltr'}
              className={`w-[210mm] min-h-[297mm] bg-white text-ink shadow-xs border border-line overflow-hidden print:w-full print:min-h-0 print:border-none print:shadow-none print:m-0 ${
                theme.documentLanguage === 'ar' ? 'font-arabic' : ''
              }`}
            >
              {renderTemplate()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
