import React from 'react';
import { ResumeData, ThemeConfig } from '../types';
import { getDocumentHeadings } from '@/app/lib/documentI18n';

interface TemplateProps {
  data: ResumeData;
  theme: ThemeConfig;
}

/**
 * Classic ATS Template (Harvard / Resumeforfree Style)
 * Standard single-column format, centered header, horizontal divider rules, zero icons.
 */
export default function ClassicTemplate({ data, theme }: TemplateProps) {
  const { personalInfo, experience, education, projects, skills, certifications } = data;
  const accent = theme.accentColor || '#1e293b';
  const h = getDocumentHeadings(theme.documentLanguage);

  return (
    <div 
      className="bg-white text-gray-900 w-full min-h-[1050px] p-10 font-sans leading-relaxed text-[13px] print:p-8"
      style={{ fontFamily: theme.fontFamily }}
      dir={h.dir}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 pb-4 mb-5" style={{ borderColor: accent }}>
        <div className="flex-1">
          <h1 
            className="text-2xl font-bold tracking-tight uppercase mb-1"
            style={{ color: accent }}
          >
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {personalInfo.jobTitle || "Professional Title"}
          </p>

          {/* Pure text contact line with dot separators, zero icons */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo.location && <span>• {personalInfo.location}</span>}
            {personalInfo.website && <span>• {personalInfo.website.replace(/^https?:\/\//, '')}</span>}
            {personalInfo.linkedin && <span>• {personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>}
            {personalInfo.github && <span>• {personalInfo.github.replace(/^https?:\/\//, '')}</span>}
          </div>
        </div>

        {/* Optional Profile Photo */}
        {personalInfo.showPhoto && personalInfo.photoUrl && (
          <div className="ml-5 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-20 h-20 rounded-md object-cover border border-gray-300 shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="mb-5">
          <h2 
            className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            {h.summary}
          </h2>
          <p className="text-gray-700 text-xs leading-normal">
            {personalInfo.summary}
          </p>
        </div>
      )}

      {/* Work Experience */}
      {experience.length > 0 && (
        <div className="mb-5">
          <h2 
            className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-3"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            {h.experience}
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="text-xs">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-gray-900">{exp.position}</span>
                  <span className={`text-gray-500 font-medium ${h.isRtl ? 'mr-2' : 'ml-2'}`}>
                    {exp.startDate} – {exp.current ? h.present : exp.endDate}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-gray-700 mb-1.5 font-medium italic">
                  <span>{exp.company}</span>
                  {exp.location && <span>{exp.location}</span>}
                </div>
                <ul className={`list-disc list-outside ${h.isRtl ? 'mr-4 pr-1' : 'ml-4'} space-y-1 text-gray-600`}>
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
        <div className="mb-5">
          <h2 
            className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-3"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            {h.projects}
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-gray-900">{proj.title}</span>
                  {proj.techStack && (
                    <span className="text-gray-500 italic text-[11px]">{proj.techStack}</span>
                  )}
                </div>
                {proj.link && (
                  <p className="text-[11px] text-gray-600 mb-1">{proj.link.replace(/^https?:\/\//, '')}</p>
                )}
                <ul className={`list-disc list-outside ${h.isRtl ? 'mr-4 pr-1' : 'ml-4'} space-y-0.5 text-gray-600`}>
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
        <div className="mb-5">
          <h2 
            className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            {h.skills}
          </h2>
          <p className="text-xs text-gray-700 leading-relaxed">
            <span className="font-semibold text-gray-900">{h.skills}: </span>
            {skills.join(' • ')}
          </p>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-5">
          <h2 
            className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            {h.education}
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-gray-900">{edu.degree} in {edu.fieldOfStudy}</span>
                  <div className="text-gray-600 italic">{edu.institution} {edu.gpa && `• ${h.gpa}: ${edu.gpa}`}</div>
                </div>
                <span className={`text-gray-500 font-medium ${h.isRtl ? 'mr-2' : 'ml-2'}`}>
                  {edu.startDate} – {edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div>
          <h2 
            className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            {h.certifications}
          </h2>
          <ul className={`list-disc list-outside ${h.isRtl ? 'mr-4 pr-1' : 'ml-4'} space-y-0.5 text-xs text-gray-600`}>
            {certifications.map((cert, idx) => (
              <li key={idx}>{cert}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
