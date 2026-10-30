import React from 'react';
import { ResumeData, ThemeConfig } from '../types';
import { getDocumentHeadings, formatDocumentDateRange } from '@/app/lib/documentI18n';

interface TemplateProps {
  data: ResumeData;
  theme: ThemeConfig;
}

/**
 * Modern Tech ATS Template
 * Clean typography with subtle colored indicators, zero icons or emojis, ATS-safe format.
 */
export default function ModernTemplate({ data, theme }: TemplateProps) {
  const { personalInfo, experience, education, projects, skills, certifications, languages } = data;
  const accent = theme.accentColor || '#2563eb';
  const h = getDocumentHeadings(theme.documentLanguage);

  return (
    <div 
      className="bg-white text-slate-900 w-full min-h-[1050px] p-10 font-sans leading-relaxed text-[13px] print:p-8"
      style={{ fontFamily: theme.fontFamily }}
      dir={h.dir}
    >
      {/* Modern Header Banner */}
      <div className="pb-5 mb-5 border-b border-slate-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 
              className="text-3xl font-extrabold tracking-tight mb-1"
              style={{ color: accent }}
            >
              {personalInfo.fullName || "Your Full Name"}
            </h1>
            <p className="text-base font-medium text-slate-700">
              {personalInfo.jobTitle || "Professional Title"}
            </p>
          </div>

          {/* Optional Profile Photo */}
          {personalInfo.showPhoto && personalInfo.photoUrl && (
            <div className="ms-5 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName}
                className="w-20 h-20 rounded-xl object-cover border-2 shadow-sm"
                style={{ borderColor: accent }}
              />
            </div>
          )}
        </div>

        {/* Contact Badges - Pure Text, Zero Emojis or Icons */}
        <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-600">
          {personalInfo.email && (
            <span className="bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-medium">
              {personalInfo.email}
            </span>
          )}
          {personalInfo.phone && (
            <span className="bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-medium">
              {personalInfo.phone}
            </span>
          )}
          {personalInfo.location && (
            <span className="bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-medium">
              {personalInfo.location}
            </span>
          )}
          {personalInfo.website && (
            <span className="bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-medium">
              {personalInfo.website.replace(/^https?:\/\//, '')}
            </span>
          )}
          {personalInfo.linkedin && (
            <span className="bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-medium">
              {personalInfo.linkedin.replace(/^https?:\/\//, '')}
            </span>
          )}
          {personalInfo.github && (
            <span className="bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-medium">
              {personalInfo.github.replace(/^https?:\/\//, '')}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {h.summary}
            </h2>
          </div>
          <p className={`text-slate-600 text-xs leading-relaxed ${h.isRtl ? 'pr-3.5' : 'pl-3.5'}`}>
            {personalInfo.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {h.experience}
            </h2>
          </div>
          <div className={`space-y-4 ${h.isRtl ? 'pr-3.5' : 'pl-3.5'}`}>
            {experience.map((exp) => (
              <div key={exp.id} className="text-xs">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-slate-900 text-sm">{exp.position}</span>
                  <span className={`text-slate-500 font-medium ${h.isRtl ? 'mr-2' : 'ml-2'}`}>
                    {formatDocumentDateRange(exp.startDate, exp.endDate, exp.current, theme.documentLanguage)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-slate-600 mb-1.5 font-medium">
                  <span style={{ color: accent }}>{exp.company}</span>
                  {exp.location && <span>{exp.location}</span>}
                </div>
                <ul className={`list-disc list-outside ${h.isRtl ? 'mr-4 pr-1' : 'ml-4'} space-y-1 text-slate-600`}>
                  {exp.description.filter(d => d.trim()).map((bullet, idx) => (
                    <li key={idx} className="leading-snug">{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {h.projects}
            </h2>
          </div>
          <div className={`space-y-3.5 ${h.isRtl ? 'pr-3.5' : 'pl-3.5'}`}>
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-slate-900 text-sm">{proj.title}</span>
                  {proj.link && (
                    <span className="text-[11px] text-slate-500">
                      {proj.link.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                </div>
                {proj.techStack && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {proj.techStack.split(',').map((t, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <ul className={`list-disc list-outside ${h.isRtl ? 'mr-4 pr-1' : 'ml-4'} space-y-0.5 text-slate-600`}>
                  {proj.description.filter(d => d.trim()).map((b, idx) => (
                    <li key={idx} className="leading-snug">{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {h.skills}
            </h2>
          </div>
          <div className={`flex flex-wrap gap-1.5 ${h.isRtl ? 'pr-3.5' : 'pl-3.5'}`}>
            {skills.map((skill, idx) => (
              <span 
                key={idx}
                className="px-2.5 py-1 bg-slate-100 border border-slate-200/80 rounded-md text-xs font-medium text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {h.education}
            </h2>
          </div>
          <div className={`space-y-2.5 ${h.isRtl ? 'pr-3.5' : 'pl-3.5'}`}>
            {education.map((edu) => (
              <div key={edu.id} className="text-xs flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-900">{edu.degree} in {edu.fieldOfStudy}</span>
                  <div className="text-slate-600 font-medium">
                    {edu.institution} {edu.gpa && `• ${h.gpa}: ${edu.gpa}`}
                  </div>
                </div>
                <span className={`text-slate-500 font-medium ${h.isRtl ? 'mr-2' : 'ml-2'}`}>
                  {formatDocumentDateRange(edu.startDate, edu.endDate, false, theme.documentLanguage)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {h.certifications}
            </h2>
          </div>
          <ul className={`list-disc list-outside ${h.isRtl ? 'mr-7 pr-1' : 'ml-7'} space-y-0.5 text-xs text-slate-600`}>
            {certifications.map((cert, idx) => (
              <li key={idx}>{cert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {h.languages}
            </h2>
          </div>
          <div className={`flex flex-wrap gap-1.5 ${h.isRtl ? 'pr-3.5' : 'pl-3.5'}`}>
            {languages.map((l, idx) => (
              <span key={idx} className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                {l.name} <span className="text-slate-500 font-normal">({l.proficiency})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
