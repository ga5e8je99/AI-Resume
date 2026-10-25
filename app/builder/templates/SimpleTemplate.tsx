import React from 'react';
import { ResumeData, ThemeConfig } from '../types';
import { getDocumentHeadings } from '@/app/lib/documentI18n';

interface TemplateProps {
  data: ResumeData;
  theme: ThemeConfig;
}

/**
 * ResumeForFree: Simple Template
 * Description: Traditional academic CV layout with labeled columns and horizontal rules
 * Features:
 * - Centered academic header
 * - Full horizontal rule lines (0.4pt) above each section
 * - 2-column grid per section: Left column (22%) has the uppercase Section Label, Right column (78%) has the contents
 */
export default function SimpleTemplate({ data, theme }: TemplateProps) {
  const { personalInfo, experience, education, projects, skills, certifications } = data;
  const accent = theme.accentColor || '#1d4ed8';
  const h = getDocumentHeadings(theme.documentLanguage);

  const contactItems: string[] = [];
  if (personalInfo.location) contactItems.push(personalInfo.location);
  if (personalInfo.phone) contactItems.push(personalInfo.phone);
  if (personalInfo.email) contactItems.push(personalInfo.email);
  if (personalInfo.linkedin) contactItems.push('LinkedIn: ' + personalInfo.linkedin.replace(/^https?:\/\//, ''));
  if (personalInfo.github) contactItems.push('GitHub: ' + personalInfo.github.replace(/^https?:\/\//, ''));

  return (
    <div
      className="bg-white text-gray-900 w-full min-h-[1100px] font-sans p-10 print:p-6 text-[12px] leading-relaxed shadow-sm"
      style={{ fontFamily: theme.fontFamily }}
      dir={h.dir}
    >
      {/* 1. Header (Centered Academic Style) */}
      <header className="text-center mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 uppercase mb-1">
          {personalInfo.fullName || 'YOUR FULL NAME'}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-xs font-semibold text-gray-700 tracking-wide mb-1.5">
            {personalInfo.jobTitle}
          </p>
        )}
        {contactItems.length > 0 && (
          <p className="text-[11px] text-gray-600 max-w-xl mx-auto">
            {contactItems.join(' • ')}
          </p>
        )}
      </header>

      {/* 2. Profile / Summary */}
      {personalInfo.summary && (
        <div>
          <hr className="border-t border-gray-300 my-3" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {h.summary}
              </h2>
            </div>
            <div className="col-span-9">
              <p className="text-[11.5px] text-gray-700 leading-normal">
                {personalInfo.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Education */}
      {education.length > 0 && education.some((edu) => edu.institution || edu.degree) && (
        <div>
          <hr className="border-t border-gray-300 my-3" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {h.education}
              </h2>
            </div>
            <div className="col-span-9 space-y-3">
              {education
                .filter((edu) => edu.institution || edu.degree)
                .map((edu) => (
                  <div key={edu.id} className="text-[11.5px]">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-gray-900">
                        {edu.degree}
                        {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                      </span>
                      {(edu.startDate || edu.endDate) && (
                        <span className={`text-gray-600 font-medium text-[11px] shrink-0 ${h.isRtl ? 'mr-2' : 'ml-2'}`}>
                          {edu.startDate} – {edu.endDate}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-700 text-[11px]">
                      {edu.institution}
                      {edu.gpa ? ` (${h.gpa}: ${edu.gpa})` : ''}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Experience */}
      {experience.length > 0 && experience.some((e) => e.company || e.position) && (
        <div>
          <hr className="border-t border-gray-300 my-3" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {h.experience}
              </h2>
            </div>
            <div className="col-span-9 space-y-3.5">
              {experience
                .filter((exp) => exp.company || exp.position)
                .map((exp) => (
                  <div key={exp.id} className="text-[11.5px]">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-gray-900">
                        {exp.position}{exp.company ? ` | ${exp.company}` : ''}
                      </span>
                      {(exp.startDate || exp.endDate) && (
                        <span className={`text-gray-600 font-medium text-[11px] shrink-0 ${h.isRtl ? 'mr-2' : 'ml-2'}`}>
                          {exp.startDate} – {exp.current ? h.present : exp.endDate}
                        </span>
                      )}
                    </div>
                    {exp.location && (
                      <div className="text-gray-600 text-[10.5px] mb-1">
                        {exp.location}
                      </div>
                    )}
                    {exp.description && exp.description.length > 0 && (
                      <ul className={`list-disc ${h.isRtl ? 'pr-4' : 'pl-4'} space-y-0.5 text-gray-700`}>
                        {exp.description
                          .filter(Boolean)
                          .map((point, idx) => (
                            <li key={idx} className="leading-snug">
                              {point}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Projects */}
      {projects.length > 0 && projects.some((p) => p.title) && (
        <div>
          <hr className="border-t border-gray-300 my-3" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {h.projects}
              </h2>
            </div>
            <div className="col-span-9 space-y-3">
              {projects
                .filter((p) => p.title)
                .map((proj) => (
                  <div key={proj.id} className="text-[11.5px]">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-gray-900">
                        {proj.title}
                        {proj.techStack ? (
                          <span className={`font-normal text-gray-600 ${h.isRtl ? 'mr-1.5' : 'ml-1.5'}`}>
                            ({proj.techStack})
                          </span>
                        ) : null}
                      </span>
                      {proj.link && (
                        <a
                          href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-[11px] font-medium hover:underline shrink-0 ${h.isRtl ? 'mr-2' : 'ml-2'}`}
                          style={{ color: accent }}
                        >
                          {h.isRtl ? 'عرض ↗' : 'View ↗'}
                        </a>
                      )}
                    </div>
                    {proj.description && proj.description.length > 0 && (
                      <ul className={`list-disc ${h.isRtl ? 'pr-4' : 'pl-4'} space-y-0.5 text-gray-700`}>
                        {proj.description
                          .filter(Boolean)
                          .map((point, idx) => (
                            <li key={idx} className="leading-snug">
                              {point}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Skills */}
      {skills.length > 0 && (
        <div>
          <hr className="border-t border-gray-300 my-3" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {h.skills}
              </h2>
            </div>
            <div className="col-span-9">
              <p className="text-[11.5px] text-gray-700 leading-relaxed">
                {skills.join(' • ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. Certifications */}
      {certifications.length > 0 && (
        <div>
          <hr className="border-t border-gray-300 my-3" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                {h.certifications}
              </h2>
            </div>
            <div className="col-span-9">
              <ul className={`list-disc ${h.isRtl ? 'pr-4' : 'pl-4'} space-y-0.5 text-[11.5px] text-gray-700`}>
                {certifications.map((cert, idx) => (
                  <li key={idx} className="leading-snug">
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
