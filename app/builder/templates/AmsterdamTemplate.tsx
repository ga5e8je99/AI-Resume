import React from 'react';
import { ResumeData, ThemeConfig } from '../types';

interface TemplateProps {
  data: ResumeData;
  theme: ThemeConfig;
}

/**
 * Amsterdam Template (Inspired by Resume.io ATS #2)
 * Clean single-column layout with optional profile photo, modern typography, zero icons.
 */
export default function AmsterdamTemplate({ data, theme }: TemplateProps) {
  const { personalInfo, experience, education, projects, skills, certifications } = data;
  const accent = theme.accentColor || '#0284c7';

  return (
    <div 
      className="bg-white text-slate-900 w-full min-h-[1050px] p-10 font-sans leading-relaxed text-[13px] print:p-8"
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* Amsterdam Header */}
      <div className="flex items-center gap-6 pb-6 mb-6 border-b-2" style={{ borderColor: accent }}>
        {/* Optional Profile Photo */}
        {personalInfo.showPhoto && personalInfo.photoUrl && (
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-24 h-24 rounded-full object-cover border-2 shadow-sm"
              style={{ borderColor: accent }}
            />
          </div>
        )}

        <div className="flex-1">
          <h1 
            className="text-3xl font-extrabold tracking-tight mb-1"
            style={{ color: accent }}
          >
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          <p className="text-base font-semibold text-slate-700 mb-2.5">
            {personalInfo.jobTitle || "Professional Title"}
          </p>

          {/* Clean Text Contact Row without any icons */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>| {personalInfo.phone}</span>}
            {personalInfo.location && <span>| {personalInfo.location}</span>}
            {personalInfo.website && <span>| {personalInfo.website.replace(/^https?:\/\//, '')}</span>}
            {personalInfo.linkedin && <span>| {personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>}
            {personalInfo.github && <span>| {personalInfo.github.replace(/^https?:\/\//, '')}</span>}
          </div>
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Professional Summary
            </h2>
          </div>
          <p className="text-slate-700 text-xs leading-relaxed pl-4 border-l-2 border-slate-200">
            {personalInfo.summary}
          </p>
        </div>
      )}

      {/* Employment History */}
      {experience.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Employment History
            </h2>
          </div>
          <div className="space-y-4 pl-4 border-l-2 border-slate-200">
            {experience.map((exp) => (
              <div key={exp.id} className="text-xs">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-slate-900 text-sm">{exp.position}</span>
                  <span className="text-slate-500 font-medium text-[11px]">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="text-slate-600 font-semibold mb-1.5">
                  {exp.company} {exp.location && `• ${exp.location}`}
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 text-slate-700">
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
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Core Competencies & Skills
            </h2>
          </div>
          <div className="pl-4 border-l-2 border-slate-200 flex flex-wrap gap-2 text-xs">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-medium"
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
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Education
            </h2>
          </div>
          <div className="space-y-2.5 pl-4 border-l-2 border-slate-200">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-900">
                    {edu.degree} in {edu.fieldOfStudy}
                  </span>
                  <div className="text-slate-600">
                    {edu.institution} {edu.gpa && `| GPA: ${edu.gpa}`}
                  </div>
                </div>
                <span className="text-slate-500 font-medium text-[11px]">
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
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Projects
            </h2>
          </div>
          <div className="space-y-3 pl-4 border-l-2 border-slate-200">
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-slate-900">{proj.title}</span>
                  {proj.link && (
                    <span className="text-slate-500 text-[11px]">{proj.link.replace(/^https?:\/\//, '')}</span>
                  )}
                </div>
                {proj.techStack && (
                  <p className="text-slate-500 text-[11px] mb-1">
                    Stack: {proj.techStack}
                  </p>
                )}
                <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-700">
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
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accent }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Certifications
            </h2>
          </div>
          <ul className="list-disc list-outside ml-8 space-y-0.5 text-xs text-slate-700">
            {certifications.map((cert, idx) => (
              <li key={idx}>{cert}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
