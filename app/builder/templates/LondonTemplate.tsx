import React from 'react';
import { ResumeData, ThemeConfig } from '../types';
import { getDocumentHeadings, formatDocumentDateRange } from '@/app/lib/documentI18n';

interface TemplateProps {
  data: ResumeData;
  theme: ThemeConfig;
}

/**
 * London Template (Inspired by Resume.io ATS #4)
 * Executive layout with generous whitespace, centered typography, zero icons.
 */
export default function LondonTemplate({ data, theme }: TemplateProps) {
  const { personalInfo, experience, education, projects, skills, certifications } = data;
  const accent = theme.accentColor || '#1e3a8a';
  const h = getDocumentHeadings(theme.documentLanguage);

  return (
    <div 
      className="bg-white text-gray-900 w-full min-h-[1050px] p-12 font-serif leading-relaxed text-[13px] print:p-8"
      style={{ fontFamily: theme.documentLanguage === 'ar' ? 'var(--font-arabic), "IBM Plex Sans Arabic", sans-serif' : (theme.fontFamily.includes('serif') ? theme.fontFamily : 'Georgia, serif') }}
      dir={h.dir}
    >
      {/* Centered London Header */}
      <div className="text-center pb-6 mb-6 border-b border-gray-300">
        {personalInfo.showPhoto && personalInfo.photoUrl && (
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-24 h-24 rounded-full object-cover border-2 shadow-sm"
              style={{ borderColor: accent }}
            />
          </div>
        )}

        <h1 
          className="text-3xl font-normal tracking-wide uppercase mb-1"
          style={{ color: accent }}
        >
          {personalInfo.fullName || "Your Full Name"}
        </h1>
        <p className="text-sm font-sans tracking-widest uppercase text-gray-600 mb-3">
          {personalInfo.jobTitle || "Professional Title"}
        </p>

        {/* Clean Text Contact Row */}
        <div className="flex flex-wrap justify-center gap-x-4 text-xs font-sans text-gray-600">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
          {personalInfo.website && <span>• {personalInfo.website.replace(/^https?:\/\//, '')}</span>}
          {personalInfo.linkedin && <span>• {personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="mb-6">
          <h2 
            className="text-xs font-sans font-bold uppercase tracking-widest text-center text-gray-800 mb-2.5"
            style={{ color: accent }}
          >
            {h.summary}
          </h2>
          <p className="text-gray-700 text-xs text-center max-w-2xl mx-auto leading-relaxed italic">
            &ldquo;{personalInfo.summary}&rdquo;
          </p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-6">
          <h2 
            className="text-xs font-sans font-bold uppercase tracking-widest text-gray-800 border-b border-gray-200 pb-1 mb-3"
            style={{ color: accent }}
          >
            {h.experience}
          </h2>
          <div className="space-y-4 font-sans">
            {experience.map((exp) => (
              <div key={exp.id} className="text-xs">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-gray-900">{exp.position}</span>
                  <span className={`text-gray-500 font-medium ${h.isRtl ? 'mr-2' : 'ml-2'}`}>
                    {formatDocumentDateRange(exp.startDate, exp.endDate, exp.current, theme.documentLanguage)}
                  </span>
                </div>
                <div className="text-gray-600 italic mb-1">
                  {exp.company} {exp.location && `• ${exp.location}`}
                </div>
                <ul className={`list-disc list-outside ${h.isRtl ? 'mr-4 pr-1' : 'ml-4'} space-y-1 text-gray-700`}>
                  {exp.description.filter(d => d.trim()).map((bullet, idx) => (
                    <li key={idx} className="leading-snug">{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-6 font-sans">
          <h2 
            className="text-xs font-bold uppercase tracking-widest text-gray-800 border-b border-gray-200 pb-1 mb-2"
            style={{ color: accent }}
          >
            {h.skills}
          </h2>
          <p className="text-xs text-gray-700 leading-relaxed">
            {skills.join(' • ')}
          </p>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-6 font-sans">
          <h2 
            className="text-xs font-bold uppercase tracking-widest text-gray-800 border-b border-gray-200 pb-1 mb-2"
            style={{ color: accent }}
          >
            {h.education}
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-gray-900">{edu.degree}, {edu.fieldOfStudy}</span>
                  <div className="text-gray-600 italic">{edu.institution} {edu.gpa && `• ${h.gpa}: ${edu.gpa}`}</div>
                </div>
                <span className={`text-gray-500 font-medium ${h.isRtl ? 'mr-2' : 'ml-2'}`}>
                  {formatDocumentDateRange(edu.startDate, edu.endDate, false, theme.documentLanguage)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-6 font-sans">
          <h2 
            className="text-xs font-bold uppercase tracking-widest text-gray-800 border-b border-gray-200 pb-1 mb-2.5"
            style={{ color: accent }}
          >
            {h.projects}
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-900">{proj.title}</span>
                  {proj.link && (
                    <span className="text-gray-500 text-[11px]">{proj.link.replace(/^https?:\/\//, '')}</span>
                  )}
                </div>
                {proj.techStack && (
                  <p className="text-gray-500 text-[11px] mb-0.5">{proj.techStack}</p>
                )}
                <ul className={`list-disc list-outside ${h.isRtl ? 'mr-4 pr-1' : 'ml-4'} space-y-0.5 text-gray-700`}>
                  {proj.description.filter(d => d.trim()).map((b, idx) => (
                    <li key={idx} className="leading-snug">{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="font-sans">
          <h2 
            className="text-xs font-bold uppercase tracking-widest text-gray-800 border-b border-gray-200 pb-1 mb-1.5"
            style={{ color: accent }}
          >
            {h.certifications}
          </h2>
          <ul className={`list-disc list-outside ${h.isRtl ? 'mr-4 pr-1' : 'ml-4'} space-y-0.5 text-xs text-gray-700`}>
            {certifications.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
