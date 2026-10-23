import React from 'react';
import { ResumeData, ThemeConfig } from '../types';

interface TemplateProps {
  data: ResumeData;
  theme: ThemeConfig;
}

/**
 * Oslo Template (Inspired by Resume.io ATS #1)
 * Pure typography, single-column, strictly ATS text-based, zero glyphs/icons.
 */
export default function OsloTemplate({ data, theme }: TemplateProps) {
  const { personalInfo, experience, education, projects, skills, certifications } = data;
  const accent = theme.accentColor || '#1e293b';

  return (
    <div 
      className="bg-white text-gray-900 w-full min-h-[1050px] p-12 font-sans leading-relaxed text-[13px] print:p-8"
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-300 pb-5 mb-6">
        <div className="flex-1">
          <h1 
            className="text-3xl font-bold tracking-tight uppercase mb-1"
            style={{ color: accent }}
          >
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          <p className="text-base font-medium text-gray-700 mb-3">
            {personalInfo.jobTitle || "Professional Title"}
          </p>

          {/* Pure text contact line with dot separators */}
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
          <div className="ml-6 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-24 h-24 rounded-lg object-cover border border-gray-300 shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Professional Summary */}
      {personalInfo.summary && (
        <div className="mb-6">
          <h2 
            className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2.5"
            style={{ color: accent }}
          >
            Professional Summary
          </h2>
          <p className="text-gray-700 text-xs leading-relaxed">
            {personalInfo.summary}
          </p>
        </div>
      )}

      {/* Work Experience */}
      {experience.length > 0 && (
        <div className="mb-6">
          <h2 
            className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3"
            style={{ color: accent }}
          >
            Employment History
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="text-xs">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-gray-900 text-sm">
                    {exp.position}, <span className="font-normal text-gray-700">{exp.company}</span>
                  </span>
                  <span className="text-gray-500 font-medium">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                {exp.location && (
                  <p className="text-gray-500 italic mb-1.5">{exp.location}</p>
                )}
                <ul className="list-disc list-outside ml-4 space-y-1 text-gray-700">
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
        <div className="mb-6">
          <h2 
            className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2.5"
            style={{ color: accent }}
          >
            Skills
          </h2>
          <p className="text-xs text-gray-700 leading-relaxed">
            {skills.join(' • ')}
          </p>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-6">
          <h2 
            className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2.5"
            style={{ color: accent }}
          >
            Education
          </h2>
          <div className="space-y-2.5">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-gray-900">
                    {edu.degree} in {edu.fieldOfStudy}
                  </span>
                  <div className="text-gray-600">
                    {edu.institution} {edu.gpa && `| GPA: ${edu.gpa}`}
                  </div>
                </div>
                <span className="text-gray-500 font-medium">
                  {edu.startDate} – {edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-6">
          <h2 
            className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3"
            style={{ color: accent }}
          >
            Key Projects
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-gray-900">{proj.title}</span>
                  {proj.link && (
                    <span className="text-gray-500 text-[11px]">{proj.link.replace(/^https?:\/\//, '')}</span>
                  )}
                </div>
                {proj.techStack && (
                  <p className="text-gray-500 italic text-[11px] mb-1">
                    Technologies: {proj.techStack}
                  </p>
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

      {/* Certifications */}
      {certifications.length > 0 && (
        <div>
          <h2 
            className="text-xs font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2"
            style={{ color: accent }}
          >
            Certificates
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-700">
            {certifications.map((cert, idx) => (
              <li key={idx}>{cert}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
