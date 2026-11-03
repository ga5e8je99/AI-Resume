'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  FileText,
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  Globe,
  Cpu,
  Award,
  GraduationCap,
  Mail,
  Search,
  Target,
  TrendingUp,
  UserCheck,
  Zap,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui';
import { Reveal } from '@/components/motion/Reveal';

export interface CtaBandProps {
  onScanClick?: (e: React.MouseEvent) => void;
}

const BG_ICONS = [
  // Start outer column
  { Icon: FileText, pos: 'top-6 start-[3%]', size: 'w-14 h-14', iconSize: 'w-7 h-7', rot: '-rotate-12', opacity: 'text-on-brand/20 bg-on-brand/[0.07]' },
  { Icon: Search, pos: 'top-[32%] start-[2%]', size: 'w-11 h-11', iconSize: 'w-5 h-5', rot: 'rotate-6', opacity: 'text-on-brand/15 bg-on-brand/[0.05]' },
  { Icon: ShieldCheck, pos: 'top-[58%] start-[4%]', size: 'w-13 h-13', iconSize: 'w-6 h-6', rot: '-rotate-6', opacity: 'text-on-brand/20 bg-on-brand/[0.06]' },
  { Icon: Briefcase, pos: 'bottom-6 start-[3%]', size: 'w-14 h-14', iconSize: 'w-7 h-7', rot: 'rotate-12', opacity: 'text-on-brand/20 bg-on-brand/[0.07]' },

  // Start mid column
  { Icon: Award, pos: 'top-10 start-[12%]', size: 'w-12 h-12', iconSize: 'w-6 h-6', rot: 'rotate-12', opacity: 'text-on-brand/15 bg-on-brand/[0.05]' },
  { Icon: Mail, pos: 'top-[45%] start-[10%]', size: 'w-14 h-14', iconSize: 'w-6 h-6', rot: '-rotate-12', opacity: 'text-on-brand/20 bg-on-brand/[0.06]' },
  { Icon: GraduationCap, pos: 'bottom-10 start-[13%]', size: 'w-12 h-12', iconSize: 'w-6 h-6', rot: 'rotate-6', opacity: 'text-on-brand/15 bg-on-brand/[0.05]' },

  // Start inner column
  { Icon: Target, pos: 'top-8 start-[22%]', size: 'w-10 h-10', iconSize: 'w-5 h-5', rot: '-rotate-6', opacity: 'text-on-brand/15 bg-on-brand/[0.04]' },
  { Icon: Layers, pos: 'bottom-8 start-[23%]', size: 'w-11 h-11', iconSize: 'w-5 h-5', rot: 'rotate-12', opacity: 'text-on-brand/15 bg-on-brand/[0.04]' },

  // End inner column
  { Icon: Zap, pos: 'top-8 end-[22%]', size: 'w-10 h-10', iconSize: 'w-5 h-5', rot: 'rotate-6', opacity: 'text-on-brand/15 bg-on-brand/[0.04]' },
  { Icon: TrendingUp, pos: 'bottom-8 end-[23%]', size: 'w-11 h-11', iconSize: 'w-5 h-5', rot: '-rotate-12', opacity: 'text-on-brand/15 bg-on-brand/[0.04]' },

  // End mid column
  { Icon: UserCheck, pos: 'top-10 end-[12%]', size: 'w-12 h-12', iconSize: 'w-6 h-6', rot: '-rotate-12', opacity: 'text-on-brand/15 bg-on-brand/[0.05]' },
  { Icon: Cpu, pos: 'top-[45%] end-[10%]', size: 'w-14 h-14', iconSize: 'w-6 h-6', rot: 'rotate-12', opacity: 'text-on-brand/20 bg-on-brand/[0.06]' },
  { Icon: FileCheck2, pos: 'bottom-10 end-[13%]', size: 'w-12 h-12', iconSize: 'w-6 h-6', rot: '-rotate-6', opacity: 'text-on-brand/15 bg-on-brand/[0.05]' },

  // End outer column
  { Icon: CheckCircle2, pos: 'top-6 end-[3%]', size: 'w-14 h-14', iconSize: 'w-7 h-7', rot: 'rotate-12', opacity: 'text-on-brand/20 bg-on-brand/[0.07]' },
  { Icon: Sparkles, pos: 'top-[32%] end-[2%]', size: 'w-11 h-11', iconSize: 'w-5 h-5', rot: '-rotate-6', opacity: 'text-on-brand/15 bg-on-brand/[0.05]' },
  { Icon: FileText, pos: 'top-[58%] end-[4%]', size: 'w-13 h-13', iconSize: 'w-6 h-6', rot: 'rotate-6', opacity: 'text-on-brand/20 bg-on-brand/[0.06]' },
  { Icon: Globe, pos: 'bottom-6 end-[3%]', size: 'w-14 h-14', iconSize: 'w-7 h-7', rot: '-rotate-12', opacity: 'text-on-brand/20 bg-on-brand/[0.07]' },
];

export default function CtaBand({ onScanClick }: CtaBandProps) {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-x-clip bg-brand text-on-brand py-16 sm:py-24">
      {/* Subtle Decorative Background Icons & Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 -start-24 w-80 h-80 rounded-full bg-on-brand/5 blur-3xl" />
        <div className="absolute -bottom-24 -end-24 w-80 h-80 rounded-full bg-on-brand/5 blur-3xl" />

        {BG_ICONS.map(({ Icon, pos, size, iconSize, rot, opacity }, idx) => (
          <div
            key={idx}
            className={`hidden sm:flex absolute ${pos} ${size} rounded-2xl border border-on-brand/10 items-center justify-center ${rot} ${opacity}`}
          >
            <Icon className={iconSize} />
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6">
        <Reveal
          from="up"
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-on-brand/15 text-on-brand text-xs font-mono font-semibold border border-on-brand/15">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('cta_band_eyebrow')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-on-brand max-w-2xl mx-auto leading-tight">
            {t('cta_band_title')}
          </h2>

          <p className="text-sm sm:text-base text-on-brand/90 max-w-xl mx-auto leading-relaxed">
            {t('cta_band_desc')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/builder" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                endIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {t('cta_band_btn_primary')}
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              onClick={onScanClick}
              className="w-full sm:w-auto border-on-brand/40 text-on-brand hover:bg-on-brand/15"
            >
              {t('cta_band_btn_secondary')}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-mono text-on-brand/85">
            <span>{t('cta_band_trust1')}</span>
            <span>•</span>
            <span>{t('cta_band_trust2')}</span>
            <span>•</span>
            <span>{t('cta_band_trust3')}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
