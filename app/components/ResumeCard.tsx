'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ScoreCircle from './ScoreCircle';
import { Resume } from '../contents/index';
import { Layout, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ResumeCard({ resume }: { resume: Resume }) {
  return (
    <div className="group border border-slate-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden bg-slate-900/80 backdrop-blur-md hover:border-slate-700 flex flex-col justify-between">
      {/* Header Info */}
      <div className="p-5 pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 mb-2">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
              <span>{resume.badge}</span>
            </span>

            <h3 className="text-lg font-bold text-white truncate">
              {resume.companyName}
            </h3>

            <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
              {resume.jobTitle}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center">
            <ScoreCircle score={resume.feedback.overallScore} />
            <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
              ATS Score
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 mt-3 leading-relaxed">
          {resume.summary}
        </p>
      </div>

      {/* Divider */}
      <div className="px-5">
        <div className="border-t border-slate-800/80" />
      </div>

      {/* Image Preview & Interactive CTA */}
      <div className="p-4 bg-slate-950/40">
        <Link
          href={`/builder?template=${resume.templateId}`}
          className="block relative rounded-xl overflow-hidden border border-slate-800 group-hover:border-cyan-500/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          aria-label={`Use ${resume.companyName} template in Resume Builder`}
        >
          <div className="relative w-full h-[220px] bg-slate-900">
            <Image
              src={resume.imagePath}
              alt={`${resume.companyName} Preview`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          </div>
        </Link>

        {/* Action Button Row */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <Link
            href={`/review`}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-2 rounded-lg hover:bg-slate-800/60 font-medium"
          >
            Inspect Score
          </Link>

          <Link
            href={`/builder?template=${resume.templateId}`}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl shadow-md shadow-cyan-500/20 transition-all group-hover:shadow-cyan-500/40 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <span>Use Template</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
