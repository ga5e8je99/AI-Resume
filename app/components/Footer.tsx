'use client';

import React from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import { Github, Mail, Shield } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();
  const contactEmail = 'contact@jobmatch-ai.org';
  const githubUrl = 'https://github.com/Tariq-dev01/AI-Resume';

  return (
    <footer className="overflow-x-clip border-t border-line-strong bg-surface py-14 px-4 sm:px-6 text-start print:hidden transition-colors">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 text-xs text-ink-2">
        {/* Col 1: Wordmark, Description & Controls */}
        <div className="space-y-3.5">
          <Logo size="sm" />
          <p className="text-ink-2 leading-relaxed">
            {t('footer_desc')}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <ThemeToggle size="sm" />
            <LanguageSelector variant="compact" />
          </div>
          <p className="text-[11px] text-ink-2 font-mono pt-1">
            © {new Date().getFullYear()} JobMatch AI • {t('footer_rights')}
          </p>
        </div>

        {/* Col 2: Product */}
        <div className="space-y-2.5">
          <p className="font-mono uppercase font-semibold text-ink text-[11px] tracking-wider">
            {t('footer_col_product')}
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/builder" className="text-ink-2 hover:text-brand hover:underline underline-offset-4 transition-colors">
                {t('nav_resume_builder')}
              </Link>
            </li>
            <li>
              <Link href="/cv-builder" className="text-ink-2 hover:text-brand hover:underline underline-offset-4 transition-colors">
                {t('nav_cv_builder')}
              </Link>
            </li>
            <li>
              <Link href="/review" className="text-ink-2 hover:text-brand hover:underline underline-offset-4 transition-colors">
                {t('nav_ats_review')}
              </Link>
            </li>
            <li>
              <Link href="/cover-letter" className="text-ink-2 hover:text-brand hover:underline underline-offset-4 transition-colors">
                {t('nav_cover_letter')}
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="text-ink-2 hover:text-brand hover:underline underline-offset-4 transition-colors">
                {t('nav_pricing')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Resources */}
        <div className="space-y-2.5">
          <p className="font-mono uppercase font-semibold text-ink text-[11px] tracking-wider">
            {t('footer_col_resources')}
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/#how-it-works" className="text-ink-2 hover:text-brand hover:underline underline-offset-4 transition-colors">
                {t('how_it_works_tag')}
              </Link>
            </li>
            <li>
              <Link href="/#features" className="text-ink-2 hover:text-brand hover:underline underline-offset-4 transition-colors">
                {t('features_tag')}
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="text-ink-2 hover:text-brand hover:underline underline-offset-4 transition-colors">
                {t('faq_tag')}
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${contactEmail}`}
                className="text-ink-2 hover:text-brand hover:underline underline-offset-4 transition-colors inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-ink-2" />
                <span>{t('footer_direct_support')}</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Col 4: Legal & GitHub */}
        <div className="space-y-2.5">
          <p className="font-mono uppercase font-semibold text-ink text-[11px] tracking-wider">
            {t('footer_col_legal')}
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/privacy" className="text-ink-2 hover:text-brand hover:underline underline-offset-4 transition-colors">
                {t('footer_privacy')}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-ink-2 hover:text-brand hover:underline underline-offset-4 transition-colors">
                {t('footer_terms')}
              </Link>
            </li>
            <li>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-ink-2 hover:text-brand hover:underline underline-offset-4 transition-colors"
              >
                <Github className="w-3.5 h-3.5 text-ink-2" />
                <span>{t('footer_github')}</span>
              </a>
            </li>
            <li className="pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-2 font-mono">
                <Shield className="w-3 h-3 text-success" />
                <span>{t('footer_client_privacy')}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
