import React from 'react';
import { ResumeData, ThemeConfig } from '../types';

interface TemplateProps {
  data: ResumeData;
  theme: ThemeConfig;
}

/**
 * Stockholm Template (Inspired by Resume.io ATS #3)
 * High-density compact layout, right-aligned dates, clear typographic hierarchy, zero icons.
 */
export default function StockholmTemplate({ data, theme }: TemplateProps) {
  const { personalInfo, experience, education, projects, skills, certifications } = data;
  const accent = theme.accentColor || '#334155';

  return (
    <div 
      className="bg-white text-gray-900 w-full min-h-[1050px] p-9 font-sans leading-normal text-[12.5px] print:p-6"
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-300">
        <div>
          <h1 
            className="text-2xl font-bold tracking-tight mb-0.5"
            style={{ color: accent }}
          >
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {personalInfo.jobTitle || "Professional Title"}
          </p>

          <div className="flex flex-wrap gap-x-2 text-xs text-gray-600">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo.location && <span>• {personalInfo.location}</span>}
            {personalInfo.linkedin && <span>• {personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>}
            {personalInfo.github && <span>• {personalInfo.github.replace(/^https?:\/\//, '')}</span>}
          </div>
        </div>

        {personalInfo.showPhoto && personalInfo.photoUrl && (
          <div className="shrink-0 ml-4">
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
        <div className="mb-4">
          <h2 
            className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-0.5 mb-1.5"
          >
            Profile
          </h2>
          <p className="text-gray-700 text-xs leading-relaxed">
            {personalInfo.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-4">
          <h2 
            className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-0.5 mb-2"
          >
            Employment History
          </h2>
          <div className="space-y-3">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-gray-900">
                    {exp.position} at {exp.company}{exp.location ? `, ${exp.location}` : ''}
                  </span>
                  <span className="text-gray-500 font-medium text-[11px]">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-xs text-gray-700">
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
        <div className="mb-4">
          <h2 
            className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-0.5 mb-1.5"
          >
            Skills
          </h2>
          <p className="text-xs text-gray-700">
            {skills.join(' • ')}
          </p>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-4">
          <h2 
            className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-0.5 mb-2"
          >
            Projects
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
                  <p className="text-gray-500 text-[11px] mb-0.5">Stack: {proj.techStack}</p>
                )}
                <ul className="list-disc list-outside ml-4 space-y-0.5 text-gray-700">
                  {proj.description.filter(d => d.trim()).map((b, idx) => (
                    <li key={idx} className="leading-snug">{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-4">
          <h2 
            className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-0.5 mb-1.5"
          >
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-gray-900">{edu.degree}, {edu.fieldOfStudy}</span>
                  <div className="text-gray-600">{edu.institution} {edu.gpa && `• GPA: ${edu.gpa}`}</div>
                </div>
                <span className="text-gray-500 text-[11px]">
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
            className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-0.5 mb-1"
          >
            Certificates
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-700">
            {certifications.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
