'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '../Footer';
import HeroSection from '../HeroSection';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { DropzoneState } from '@/components/ui';
import TrustStrip from './TrustStrip';
import HowItWorks from './HowItWorks';
import FeatureShowcase from './FeatureShowcase';
import ComparisonSection from './ComparisonSection';
import PricingTeaser from './PricingTeaser';
import FaqSection from './FaqSection';
import CtaBand from './CtaBand';

export default function LandingPageClient() {
  const router = useRouter();
  const { t } = useLanguage();
  const { loginDemo } = useAuth();

  // ATS Dropzone state
  const [dropzoneState, setDropzoneState] = useState<DropzoneState>('idle');
  const [dropzoneError, setDropzoneError] = useState<string | undefined>();
  const [uploadedFileName, setUploadedFileName] = useState<string | undefined>();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleFileDrop = async (file: File) => {
    setDropzoneState('parsing');
    setUploadedFileName(file.name);
    setDropzoneError(undefined);

    try {
      const { extractTextFromFile } = await import('../../lib/pdfExtractor');
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 25) {
        throw new Error(t('landing_err_unreadable_file'));
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('jobmatch_resume_text', text);
        sessionStorage.setItem('jobmatch_resume_filename', file.name);
      }

      setDropzoneState('success');
      setTimeout(() => {
        router.push('/review');
      }, 700);
    } catch (err: any) {
      setDropzoneState('error');
      setDropzoneError(err.message || t('landing_err_parse_failed'));
    }
  };

  const handleScanClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('ats-scanner');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/review');
    }
  };

  const handleDemoClick = async () => {
    try {
      setIsDemoLoading(true);
      const res = await loginDemo();
      if (res.success) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Structured Data (JSON-LD for SoftwareApplication)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'JobMatch AI',
    operatingSystem: 'All (Modern Web Browsers)',
    applicationCategory: 'BusinessApplication',
    description: t('landing_jsonld_desc'),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '100% In-Browser Client-Side ATS Scanner',
      'Editorial Resume & Academic CV Builder',
      'Vacancy-Tailored AI Cover Letter',
      'Native Arabic RTL & Latin Typography',
      'Vector PDF and Microsoft Word (.docx) Export',
    ],
  };

  return (
    <div
      suppressHydrationWarning
      className="min-h-[100dvh] bg-paper text-ink overflow-x-clip flex flex-col justify-between selection:bg-brand-soft selection:text-brand font-sans transition-colors duration-150"
    >
      {/* JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main id="main-content">
        {/* 1. Hero Section */}
        <HeroSection
          onScanClick={handleScanClick}
          onDemoClick={handleDemoClick}
          isDemoLoading={isDemoLoading}
        />

        {/* 2. Logos / Trust Strip (Honest Facts Only) */}
        <TrustStrip />

        {/* 3. How It Works (3 Steps + Anchor Dropzone) */}
        <HowItWorks
          dropzoneState={dropzoneState}
          dropzoneError={dropzoneError}
          uploadedFileName={uploadedFileName}
          onFileSelect={handleFileDrop}
        />

        {/* 4. Feature Showcase (5 Alternating Zigzag Rows) */}
        <FeatureShowcase />

        {/* 5. Before / After Resume Comparison (54 -> 91) */}
        <ComparisonSection />

        {/* 6. Pricing Teaser (3 Compact Cards from PLANS Config) */}
        <PricingTeaser />

        {/* 7. FAQ Accordion (8 Questions covering Privacy, Formats, Languages, Free tier, Credits, Cancellation, Refunds, Deletion) */}
        <FaqSection />

        {/* 8. Final CTA Band in Brand Color */}
        <CtaBand onScanClick={handleScanClick} />
      </main>

      {/* 9. Footer */}
      <Footer />
    </div>
  );
}
