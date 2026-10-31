'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { ZoomIn, ZoomOut, Maximize2, Printer, Check } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  template: TemplateId;
  theme: ThemeConfig;
  paperSize?: string;
}

export const ResumePreview = React.memo(function ResumePreview({
  data,
  template,
  theme,
  paperSize = 'a4',
}: ResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(0.85);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);

  // Auto-calculate best zoom scale based on container width
  const calculateAutoFitZoom = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const standardWidth = paperSize === 'letter' ? 816 : 794;
    const availableWidth = Math.max(containerWidth - 32, 280);
    if (availableWidth < standardWidth) {
      const fitZoom = Math.min(1, Math.max(0.35, availableWidth / standardWidth));
      setZoom(Number(fitZoom.toFixed(2)));
    } else {
      setZoom(0.85);
    }
  }, [paperSize]);

  useEffect(() => {
    let animationFrameId = requestAnimationFrame(() => {
      calculateAutoFitZoom();
    });

    const handleResize = () => {
      if (isAutoFit) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          calculateAutoFitZoom();
        });
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAutoFit, calculateAutoFitZoom]);

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
      case 'compact':
        return <CompactTemplate data={data} theme={theme} />;
      case 'two-column':
        return <TwoColumnTemplate data={data} theme={theme} />;
      case 'ats-friendly':
      case 'executive-blue':
        return <AtsFriendlyTemplate data={data} theme={theme} />;
      case 'simple':
        return <SimpleTemplate data={data} theme={theme} />;
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
      {/* Top Preview Controls Bar */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-surface border border-line rounded-t-[10px] shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-accent-soft text-accent">
            <Check className="w-3 h-3 text-accent" strokeWidth={2} />
            <span>ATS Format</span>
          </div>
          <span className="text-[11px] text-ink-3 uppercase font-mono">
            {paperSize === 'letter' ? 'US Letter' : 'A4'}
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

        {/* Vector Print to PDF shortcut */}
        <button
          type="button"
          onClick={() => window.print()}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-ink-2 hover:text-ink bg-surface hover:bg-surface-2 border border-line rounded-[6px] transition-colors"
          title="Print to PDF via browser dialog (saves 100% selectable vector text)"
        >
          <Printer className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.5} />
          <span>Vector Print</span>
        </button>
      </div>

      {/* Sheet Container */}
      <div
        ref={containerRef}
        className="flex-1 bg-surface-2 p-3 sm:p-6 overflow-x-auto overflow-y-auto border-x border-b border-line-strong rounded-b-[10px] flex justify-center items-start min-h-[500px]"
      >
        <div
          style={{
            width: `${(paperSize === 'letter' ? 816 : 794) * zoom}px`,
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
            {/* Paper Sheet with printable ID */}
            <div
              id="resume-preview"
              dir={theme.documentLanguage === 'ar' ? 'rtl' : 'ltr'}
              className={`bg-white text-ink shadow-xs border border-line print:border-none print:shadow-none overflow-hidden print:w-full print:min-h-0 print:m-0 ${
                theme.documentLanguage === 'ar' ? 'font-arabic' : ''
              } ${
                paperSize === 'letter'
                  ? 'w-[8.5in] min-h-[11in]'
                  : 'w-[210mm] min-h-[297mm]'
              }`}
            >
              {renderTemplate()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
