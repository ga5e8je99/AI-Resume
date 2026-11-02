'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  Mail,
  Briefcase,
  Globe,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Reveal, Stagger } from '@/components/motion/Reveal';

export default function FeatureShowcase() {
  const { t } = useLanguage();

  const features = [
    {
      id: 'ats',
      icon: ShieldCheck,
      tag: t('feature_ats_tag'),
      title: t('feature_ats_title'),
      desc: t('feature_ats_desc'),
      bullets: [
        t('feature_ats_bullet1'),
        t('feature_ats_bullet2'),
        t('feature_ats_bullet3'),
      ],
      cta: t('feature_ats_cta'),
      href: '/review',
    },
    {
      id: 'builder',
      icon: FileText,
      tag: t('feature_builder_tag'),
      title: t('feature_builder_title'),
      desc: t('feature_builder_desc'),
      bullets: [
        t('feature_builder_bullet1'),
        t('feature_builder_bullet2'),
        t('feature_builder_bullet3'),
      ],
      cta: t('feature_builder_cta'),
      href: '/builder',
    },
    {
      id: 'cover',
      icon: Mail,
      tag: t('feature_cover_tag'),
      title: t('feature_cover_title'),
      desc: t('feature_cover_desc'),
      bullets: [
        t('feature_cover_bullet1'),
        t('feature_cover_bullet2'),
        t('feature_cover_bullet3'),
      ],
      cta: t('feature_cover_cta'),
      href: '/cover-letter',
    },
    {
      id: 'match',
      icon: Briefcase,
      tag: t('feature_match_tag'),
      title: t('feature_match_title'),
      desc: t('feature_match_desc'),
      bullets: [
        t('feature_match_bullet1'),
        t('feature_match_bullet2'),
        t('feature_match_bullet3'),
      ],
      cta: t('feature_match_cta'),
      href: '/jobs',
    },
    {
      id: 'lang',
      icon: Globe,
      tag: t('feature_lang_tag'),
      title: t('feature_lang_title'),
      desc: t('feature_lang_desc'),
      bullets: [
        t('feature_lang_bullet1'),
        t('feature_lang_bullet2'),
        t('feature_lang_bullet3'),
      ],
      cta: t('feature_builder_cta'),
      href: '/builder',
    },
  ];

  const isOddTotal = features.length % 2 !== 0;

  return (
    <section id="features" className="overflow-x-clip py-16 sm:py-24 bg-surface-2 border-y border-line-strong">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
        <Reveal from="up" className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-block text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-brand-soft text-brand font-semibold">
            {t('features_tag')}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-ink">
            {t('features_title')}
          </h2>
          <p className="text-sm sm:text-base text-ink-2 leading-relaxed">
            {t('features_desc')}
          </p>
        </Reveal>

        <Stagger
          className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"
          itemClassName={(idx, total) =>
            `h-full flex ${total % 2 !== 0 && idx === total - 1 ? 'md:col-span-2' : ''}`
          }
          from="up"
        >
          {features.map((item, idx) => {
            const Icon = item.icon;
            const isLastOdd = isOddTotal && idx === features.length - 1;
            return (
              <div
                key={item.id}
                className="card-interactive h-full w-full rounded-2xl border border-line-strong bg-surface p-6 sm:p-8 shadow-subtle flex flex-col justify-between gap-6 text-start"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-mono font-semibold">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.tag}</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-ink">
                    {item.title}
                  </h3>
                  <p className="text-sm text-ink-2 leading-relaxed">{item.desc}</p>
                  <ul
                    className={
                      isLastOdd
                        ? 'grid grid-cols-1 md:grid-cols-3 gap-3 pt-1'
                        : 'space-y-2 pt-1'
                    }
                  >
                    {item.bullets.map((bullet, bIdx) => (
                      <li
                        key={bIdx}
                        className="flex items-start gap-2 text-xs sm:text-sm text-ink-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Link
                    href={item.href}
                    className="btn inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover"
                  >
                    <span>{item.cta}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
