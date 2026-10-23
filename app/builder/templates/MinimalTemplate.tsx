import React from 'react';
import { ResumeData, ThemeConfig } from '../types';

interface TemplateProps {
  data: ResumeData;
  theme: ThemeConfig;
}

export default function MinimalTemplate({ data, theme }: TemplateProps) {
  const { personalInfo, experience, education, projects, skills, certifications } = data;
  const accent = theme.accentColor || '#0f172a';

  return (
    <div 
      className="bg-white text-gray-900 w-full min-h-[1050px] p-12 font-sans leading-relaxed text-[12.5px] print:p-8"
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* Centered Minimal Header */}
      <div className="text-center pb-6 mb-6 border-b border-gray-200">
        <h1 
          className="text-2xl font-semibold tracking-wide uppercase mb-1.5"
          style={{ color: accent }}
        >
          {personalInfo.fullName || "Your Full Name"}
        </h1>
        <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-3">
          {personalInfo.jobTitle || "Professional Title"}
        </p>

        {/* Clean Centered Contact */}
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          {personalInfo.github && <span>{personalInfo.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="mb-6">
          <h2 
            className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2"
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
        <div className="mb-6">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="text-xs">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-semibold text-gray-900">{exp.position}</span>
                  <span className="text-gray-400 text-[11px]">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="text-gray-600 mb-1.5 text-[11px]">
                  <span>{exp.company}</span>
                  {exp.location && ` • ${exp.location}`}
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 text-gray-600">
                  {exp.description.filter(d => d.trim()).map((bullet, idx) => (
                    <li key={idx} className="leading-relaxed">{bullet}</li>
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
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Projects
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-semibold text-gray-900">{proj.title}</span>
                  {proj.techStack && (
                    <span className="text-gray-400 text-[11px]">{proj.techStack}</span>
                  )}
                </div>
                {proj.link && (
                  <p className="text-[11px] text-gray-500 mb-1">{proj.link}</p>
                )}
                <ul className="list-disc list-outside ml-4 space-y-0.5 text-gray-600">
                  {proj.description.filter(d => d.trim()).map((b, idx) => (
                    <li key={idx} className="leading-relaxed">{b}</li>
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
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Skills
          </h2>
          <p className="text-xs text-gray-700 leading-relaxed">
            {skills.join('  /  ')}
          </p>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs flex justify-between items-baseline">
                <div>
                  <span className="font-semibold text-gray-900">{edu.degree} in {edu.fieldOfStudy}</span>
                  <div className="text-gray-500 text-[11px]">{edu.institution} {edu.gpa && `• GPA: ${edu.gpa}`}</div>
                </div>
                <span className="text-gray-400 text-[11px]">
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
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Certifications
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-gray-600">
            {certifications.map((cert, idx) => (
              <li key={idx}>{cert}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
