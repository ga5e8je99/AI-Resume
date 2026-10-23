import React from 'react';
import { ResumeData, ThemeConfig } from '../types';

interface TemplateProps {
  data: ResumeData;
  theme: ThemeConfig;
}

/**
 * ResumeForFree: ATS Friendly Template
 * Description: Single-column template with blue accents, optimized for applicant tracking systems
 * Features:
 * - Bold uppercase name & headings in accent color (#1d4ed8)
 * - Solid underline border across sections
 * - Pipe (|) separators for contact info
 * - Strict single-column layout with 100% ATS parse rate
 */
export default function AtsFriendlyTemplate({ data, theme }: TemplateProps) {
  const { personalInfo, experience, education, projects, skills, certifications } = data;
  const accent = theme.accentColor || '#1d4ed8';

  const contactList: string[] = [];
  if (personalInfo.location) contactList.push(personalInfo.location);
  if (personalInfo.email) contactList.push(personalInfo.email);
  if (personalInfo.phone) contactList.push(personalInfo.phone);

  const linksList: { label: string; url: string }[] = [];
  if (personalInfo.linkedin) {
    linksList.push({
      label: 'LinkedIn',
      url: personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`,
    });
  }
  if (personalInfo.github) {
    linksList.push({
      label: 'GitHub',
      url: personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`,
    });
  }
  if (personalInfo.website) {
    linksList.push({
      label: 'Portfolio',
      url: personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`,
    });
  }

  return (
    <div
      className="bg-white text-gray-900 w-full min-h-[1100px] font-sans p-9 print:p-6 text-[12px] leading-relaxed shadow-sm"
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* 1. Header (ATS Friendly Style) */}
      <header className="mb-4">
        {/* Full Name in Accent Color & Uppercase */}
        <h1
          className="text-2xl font-bold uppercase tracking-wider mb-1"
          style={{ color: accent }}
        >
          {personalInfo.fullName || 'YOUR FULL NAME'}
        </h1>

        {/* Position Title Uppercase */}
        {personalInfo.jobTitle && (
          <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
            {personalInfo.jobTitle}
          </p>
        )}

        {/* Contact Info with Pipe Separators */}
        {contactList.length > 0 && (
          <p className="text-[11px] text-gray-700 mb-1">
            {contactList.join(' | ')}
          </p>
        )}

        {/* Links with Pipe Separators */}
        {linksList.length > 0 && (
          <p className="text-[11px]">
            {linksList.map((link, idx) => (
              <span key={idx}>
                {idx > 0 && ' | '}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                  style={{ color: accent }}
                >
                  {link.label}
                </a>
              </span>
            ))}
          </p>
        )}
      </header>

      {/* 2. Professional Profile / Summary */}
      {personalInfo.summary && (
        <section className="mb-4">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
            style={{ color: accent, borderColor: accent }}
          >
            Professional Summary
          </h2>
          <p className="text-[11.5px] text-gray-700 leading-normal">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* 3. Work Experience */}
      {experience.length > 0 && experience.some((e) => e.company || e.position) && (
        <section className="mb-4">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
            style={{ color: accent, borderColor: accent }}
          >
            Experience
          </h2>
          <div className="space-y-3">
            {experience
              .filter((exp) => exp.company || exp.position)
              .map((exp) => (
                <div key={exp.id} className="text-[11.5px]">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-bold text-gray-900">
                      {exp.position}{exp.company ? `, ${exp.company}` : ''}
                    </span>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-gray-600 font-medium text-[11px] shrink-0 ml-2">
                        {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                      </span>
                    )}
                  </div>
                  {exp.location && (
                    <div className="text-gray-600 text-[10.5px] mb-1">
                      {exp.location}
                    </div>
                  )}
                  {exp.description && exp.description.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
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
        </section>
      )}

      {/* 4. Education */}
      {education.length > 0 && education.some((edu) => edu.institution || edu.degree) && (
        <section className="mb-4">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
            style={{ color: accent, borderColor: accent }}
          >
            Education
          </h2>
          <div className="space-y-2.5">
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
                      <span className="text-gray-600 font-medium text-[11px] shrink-0 ml-2">
                        {edu.startDate} – {edu.endDate}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-700 text-[11px]">
                    {edu.institution}
                    {edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* 5. Key Projects */}
      {projects.length > 0 && projects.some((p) => p.title) && (
        <section className="mb-4">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
            style={{ color: accent, borderColor: accent }}
          >
            Projects
          </h2>
          <div className="space-y-2.5">
            {projects
              .filter((p) => p.title)
              .map((proj) => (
                <div key={proj.id} className="text-[11.5px]">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-bold text-gray-900">
                      {proj.title}
                      {proj.techStack ? (
                        <span className="font-normal text-gray-600 ml-1.5">
                          ({proj.techStack})
                        </span>
                      ) : null}
                    </span>
                    {proj.link && (
                      <a
                        href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium hover:underline shrink-0 ml-2"
                        style={{ color: accent }}
                      >
                        Link ↗
                      </a>
                    )}
                  </div>
                  {proj.description && proj.description.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
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
        </section>
      )}

      {/* 6. Skills */}
      {skills.length > 0 && (
        <section className="mb-4">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
            style={{ color: accent, borderColor: accent }}
          >
            Skills
          </h2>
          <p className="text-[11.5px] text-gray-700 leading-relaxed">
            {skills.join(' • ')}
          </p>
        </section>
      )}

      {/* 7. Certifications */}
      {certifications.length > 0 && (
        <section className="mb-3">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
            style={{ color: accent, borderColor: accent }}
          >
            Certifications
          </h2>
          <ul className="list-disc pl-4 space-y-0.5 text-[11.5px] text-gray-700">
            {certifications.map((cert, idx) => (
              <li key={idx} className="leading-snug">
                {cert}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
