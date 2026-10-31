import React from 'react';
import { ResumeData, ThemeConfig } from '../types';
import { getDocumentHeadings, formatDocumentDateRange } from '@/app/lib/documentI18n';

interface TemplateProps {
  data: ResumeData;
  theme: ThemeConfig;
}

/**
 * ResumeForFree: Compact Template
 * Description: Single column ATS friendly template
 * Clean typography, 1cm margin, inline dates, single-column high-density layout.
 */
export default function CompactTemplate({ data, theme }: TemplateProps) {
  const { personalInfo, experience, education, projects, skills, certifications, languages } = data;
  const accent = theme.accentColor || '#1d4ed8';
  const h = getDocumentHeadings(theme.documentLanguage);

  const contactItems: string[] = [];
  if (personalInfo.email) contactItems.push(personalInfo.email);
  if (personalInfo.phone) contactItems.push(personalInfo.phone);
  if (personalInfo.location) contactItems.push(personalInfo.location);

  const linkItems: { label: string; url: string }[] = [];
  if (personalInfo.linkedin) {
    linkItems.push({
      label: 'LinkedIn',
      url: personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`,
    });
  }
  if (personalInfo.github) {
    linkItems.push({
      label: 'GitHub',
      url: personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`,
    });
  }
  if (personalInfo.website) {
    linkItems.push({
      label: h.website,
      url: personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`,
    });
  }

  return (
    <div
      className="bg-white text-gray-900 w-full min-h-[1100px] font-sans p-8 print:p-6 text-[12px] leading-relaxed shadow-sm"
      style={{ fontFamily: theme.fontFamily }}
      dir={h.dir}
    >
      {/* 1. Header (ResumeForFree Compact Style) */}
      <header className="mb-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-0.5">
              {personalInfo.fullName || 'Your Full Name'}
            </h1>
            {personalInfo.jobTitle && (
              <p className="text-sm font-semibold text-gray-700 mb-1.5">
                {personalInfo.jobTitle}
              </p>
            )}

            {/* Contact details with dot separators */}
            {contactItems.length > 0 && (
              <p className="text-[11px] text-gray-600 mb-1">
                {contactItems.join(' • ')}
              </p>
            )}

            {/* Social links with dot separators */}
            {linkItems.length > 0 && (
              <p className="text-[11px] text-gray-600">
                {linkItems.map((link, idx) => (
                  <span key={idx}>
                    {idx > 0 && ' • '}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-medium"
                      style={{ color: accent }}
                    >
                      {link.label}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </div>

          {/* Optional Photo */}
          {personalInfo.showPhoto && personalInfo.photoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-20 h-20 rounded-full object-cover border border-gray-300 shrink-0"
            />
          )}
        </div>

        {/* Clean divider line */}
        <hr className="border-t border-gray-900 my-3" />
      </header>

      {/* 2. Professional Summary / Profile */}
      {personalInfo.summary && (
        <section className="mb-4">
          <p className="text-[11.5px] text-gray-700 leading-normal">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* 3. Work Experience */}
      {experience.length > 0 && experience.some((e) => e.company || e.position) && (
        <section className="mb-4">
          <h2 className="text-xs font-bold tracking-wider text-gray-900 uppercase mb-2">
            {h.experience}
          </h2>
          <div className="space-y-3">
            {experience
              .filter((exp) => exp.company || exp.position)
              .map((exp) => (
                <div key={exp.id} className="text-[11.5px]">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-bold text-gray-900">
                      {exp.position}{exp.company ? ` | ${exp.company}` : ''}
                      {exp.location ? ` — ${exp.location}` : ''}
                    </span>
                    {(exp.startDate || exp.endDate) && (
                      <span className={`text-gray-600 font-medium text-[11px] shrink-0 ${h.isRtl ? 'mr-2' : 'ml-2'}`}>
                        {formatDocumentDateRange(exp.startDate, exp.endDate, exp.current, theme.documentLanguage)}
                      </span>
                    )}
                  </div>
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
        </section>
      )}

      {/* 4. Education */}
      {education.length > 0 && education.some((edu) => edu.institution || edu.degree) && (
        <section className="mb-4">
          <h2 className="text-xs font-bold tracking-wider text-gray-900 uppercase mb-2">
            {h.education}
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
                      {edu.institution ? ` — ${edu.institution}` : ''}
                    </span>
                    {(edu.startDate || edu.endDate) && (
                      <span className={`text-gray-600 font-medium text-[11px] shrink-0 ${h.isRtl ? 'mr-2' : 'ml-2'}`}>
                        {formatDocumentDateRange(edu.startDate, edu.endDate, false, theme.documentLanguage)}
                      </span>
                    )}
                  </div>
                  {edu.gpa && (
                    <p className="text-gray-600 text-[11px]">{h.gpa}: {edu.gpa}</p>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* 5. Key Projects */}
      {projects.length > 0 && projects.some((p) => p.title) && (
        <section className="mb-4">
          <h2 className="text-xs font-bold tracking-wider text-gray-900 uppercase mb-2">
            {h.projects}
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
                        {h.isRtl ? 'عرض المشروع ↗' : 'View Project ↗'}
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
        </section>
      )}

      {/* 6. Skills */}
      {skills.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold tracking-wider text-gray-900 uppercase mb-1.5">
            {h.skills}
          </h2>
          <p className="text-[11.5px] text-gray-700 leading-relaxed">
            {skills.join(' • ')}
          </p>
        </section>
      )}

      {/* 7. Certifications */}
      {certifications.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold tracking-wider text-gray-900 uppercase mb-1.5">
            {h.certifications}
          </h2>
          <ul className={`list-disc ${h.isRtl ? 'pr-4' : 'pl-4'} space-y-0.5 text-[11.5px] text-gray-700`}>
            {certifications.map((cert, idx) => (
              <li key={idx} className="leading-snug">
                {cert}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 8. Languages */}
      {languages && languages.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold tracking-wider text-gray-900 uppercase mb-1.5">
            {h.languages}
          </h2>
          <p className="text-[11.5px] text-gray-700 leading-relaxed">
            {languages.map((l) => `${l.name} (${l.proficiency})`).join(' • ')}
          </p>
        </section>
      )}
    </div>
  );
}
