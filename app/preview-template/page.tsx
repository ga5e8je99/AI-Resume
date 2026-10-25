'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CompactTemplate from '../builder/templates/CompactTemplate';
import TwoColumnTemplate from '../builder/templates/TwoColumnTemplate';
import AtsFriendlyTemplate from '../builder/templates/AtsFriendlyTemplate';
import ModernTemplate from '../builder/templates/ModernTemplate';
import OsloTemplate from '../builder/templates/OsloTemplate';
import SimpleTemplate from '../builder/templates/SimpleTemplate';
import { initialSampleData } from '../builder/initialData';
import { ThemeConfig } from '../builder/types';

function TemplateRenderer() {
  const searchParams = useSearchParams();
  const template = searchParams.get('template') || 'compact';

  const theme: ThemeConfig = {
    accentColor: template === 'ats-friendly' ? '#1e40af' : template === 'two-column' ? '#0f766e' : '#2563eb',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: 'base',
  };

  const renderTemplate = () => {
    switch (template) {
      case 'two-column':
        return <TwoColumnTemplate data={initialSampleData} theme={theme} />;
      case 'ats-friendly':
        return <AtsFriendlyTemplate data={initialSampleData} theme={theme} />;
      case 'modern':
        return <ModernTemplate data={initialSampleData} theme={theme} />;
      case 'oslo':
        return <OsloTemplate data={initialSampleData} theme={theme} />;
      case 'simple':
        return <SimpleTemplate data={initialSampleData} theme={theme} />;
      case 'compact':
      default:
        return <CompactTemplate data={initialSampleData} theme={theme} />;
    }
  };

  return (
    <div className="w-[794px] min-h-[1123px] bg-white text-black p-0 m-0 overflow-hidden box-border">
      {renderTemplate()}
    </div>
  );
}

export default function PreviewTemplatePage() {
  return (
    <Suspense fallback={<div className="p-4 bg-white text-black">Loading template preview...</div>}>
      <TemplateRenderer />
    </Suspense>
  );
}
