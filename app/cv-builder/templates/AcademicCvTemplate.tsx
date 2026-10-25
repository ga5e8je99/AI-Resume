import React from 'react';
import { CvData, CvThemeConfig } from '../types';

interface TemplateProps {
  data: CvData;
  theme: CvThemeConfig;
}

/**
 * Academic & Research CV Template
 * Conforms to Oxford/Harvard academic standards:
 * Classical typography (Serif), Education & Credentials prioritized,
 * extensive Publications and Research sections, Grants, Teaching, and References.
 */
export default function AcademicCvTemplate({ data, theme }: TemplateProps) {
  const {
    personalInfo,
    experience,
    education,
    projects,
    skills,
    tools,
    certifications,
    languages,
    courses,
    publications,
    awards,
    volunteering,
    references,
    referencesAvailableUponRequest,
  } = data;

  const accent = theme.accentColor || '#1e3a8a';

  return (
    <div
      className="bg-white text-slate-900 w-full min-h-[1123px] p-12 font-serif text-[12px] leading-relaxed print:p-8"
      style={{ fontFamily: theme.fontFamily || 'Georgia, serif' }}
    >
      {/* Centered Academic Header */}
      <div className="text-center border-b pb-4 mb-6" style={{ borderColor: accent }}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase" style={{ color: accent }}>
          {personalInfo.fullName || 'Academic Full Name'}
        </h1>
        <p className="text-sm italic font-medium text-slate-700 mt-1">
          {personalInfo.jobTitle || 'Doctoral Researcher & Academic Specialist'}
        </p>

        {/* Contact info list */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-2 font-sans">
          {personalInfo.email && <span>Email: {personalInfo.email}</span>}
          {personalInfo.phone && <span>• Tel: {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
          {personalInfo.nationality && <span>• Nationality: {personalInfo.nationality}</span>}
          {personalInfo.website && <span>• Web: {personalInfo.website.replace(/^https?:\/\//, '')}</span>}
        </div>
      </div>

      {/* Research Interests / Academic Summary */}
      {personalInfo.summary && (
        <div className="mb-6">
          <h2
            className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-2 font-sans"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            Research Profile & Scholarly Interests
          </h2>
          <p className="text-slate-800 text-[11.5px] leading-relaxed text-justify">
            {personalInfo.summary}
          </p>
        </div>
      )}

      {/* Education (First in Academic CVs) */}
      {education && education.length > 0 && (
        <div className="mb-6">
          <h2
            className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-3 font-sans"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            Higher Education & Degrees
          </h2>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="text-[11.5px]">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>
                    {edu.degree} in {edu.fieldOfStudy}
                  </span>
                  <span className="font-sans text-[11px] text-slate-600 font-normal">
                    {edu.startDate} – {edu.endDate}
                  </span>
                </div>
                <p className="italic text-slate-700">
                  {edu.institution} {edu.gpa && `— (${edu.gpa})`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Academic & Research Appointments */}
      {experience && experience.length > 0 && (
        <div className="mb-6">
          <h2
            className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-3 font-sans"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            Academic Appointments & Research Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="text-[11.5px]">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-slate-900">{exp.position}</span>
                  <span className="font-sans text-[10.5px] text-slate-600">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <p className="italic text-slate-700 mb-1">
                  {exp.company} {exp.location && `, ${exp.location}`}
                </p>
                <ul className="list-disc list-outside ml-5 space-y-1 text-slate-800 text-[11px]">
                  {exp.description
                    .filter((d) => d.trim())
                    .map((bullet, idx) => (
                      <li key={idx} className="leading-snug">
                        {bullet}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peer-Reviewed Publications */}
      {publications && publications.length > 0 && (
        <div className="mb-6">
          <h2
            className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-3 font-sans"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            Peer-Reviewed Publications & Articles
          </h2>
          <div className="space-y-3 text-[11.5px]">
            {publications.map((pub, idx) => (
              <div key={pub.id} className="pl-4 -indent-4">
                <span className="font-sans font-bold text-slate-500 mr-1.5">[{idx + 1}]</span>
                <span className="font-bold text-slate-900">{pub.title}. </span>
                <span className="italic text-slate-800">{pub.publisher}</span>, {pub.date}.
                {pub.link && (
                  <a
                    href={pub.link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-sans text-[10.5px] text-blue-700 underline ml-1"
                  >
                    DOI
                  </a>
                )}
                {pub.description && (
                  <p className="text-[11px] text-slate-700 italic mt-0.5 ml-4 font-normal">
                    {pub.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Honors, Awards & Grants */}
      {awards && awards.length > 0 && (
        <div className="mb-6">
          <h2
            className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-2 font-sans"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            Fellowships, Grants & Honors
          </h2>
          <div className="space-y-2 text-[11px]">
            {awards.map((a) => (
              <div key={a.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-900">{a.title}</span> —{' '}
                  <span className="italic text-slate-700">{a.issuer}</span>
                </div>
                <span className="font-sans text-slate-500 text-[10px]">{a.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages & Professional Skills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 pt-2 border-t border-slate-200">
        {languages && languages.length > 0 && (
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 font-sans"
              style={{ color: accent }}
            >
              Languages
            </h3>
            <div className="space-y-1 text-[11px] text-slate-800">
              {languages.map((l) => (
                <div key={l.id} className="flex justify-between">
                  <span className="font-bold">{l.name}</span>
                  <span className="italic text-slate-600">{l.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {skills && skills.length > 0 && (
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 font-sans"
              style={{ color: accent }}
            >
              Scientific & Technical Expertise
            </h3>
            <p className="text-[11px] text-slate-800 leading-normal">
              {skills.join(' • ')}
            </p>
          </div>
        )}
      </div>

      {/* Academic References */}
      <div>
        <h2
          className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-3 font-sans"
          style={{ color: accent, borderColor: '#cbd5e1' }}
        >
          Academic & Professional References
        </h2>
        {referencesAvailableUponRequest || !references || references.length === 0 ? (
          <p className="text-[11px] italic text-slate-600">
            Letters of recommendation and confidential academic references available upon request.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
            {references.map((ref) => (
              <div key={ref.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                <p className="font-bold text-slate-900">{ref.name}</p>
                <p className="italic text-slate-700">{ref.position}</p>
                <p className="text-slate-600">{ref.company}</p>
                <div className="font-sans text-[10.5px] text-slate-500 mt-1">
                  {ref.email && <p>Email: {ref.email}</p>}
                  {ref.phone && <p>Tel: {ref.phone}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
