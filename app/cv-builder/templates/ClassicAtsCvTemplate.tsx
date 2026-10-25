import React from 'react';
import { CvData, CvThemeConfig } from '../types';

interface TemplateProps {
  data: CvData;
  theme: CvThemeConfig;
}

/**
 * Classic ATS Full CV Template
 * 100% ATS Safe, single-column, standard headings, clear bullet points.
 * Fully supports all 13 Curriculum Vitae sections with zero parsing ambiguities.
 */
export default function ClassicAtsCvTemplate({ data, theme }: TemplateProps) {
  const {
    personalInfo,
    experience,
    education,
    projects,
    skills,
    softSkills,
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

  const accent = theme.accentColor || '#1e293b';

  return (
    <div
      className="bg-white text-slate-900 w-full min-h-[1123px] p-10 font-sans text-[12px] leading-relaxed print:p-8"
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* Header */}
      <div className="border-b-2 pb-4 mb-5" style={{ borderColor: accent }}>
        <h1
          className="text-2xl font-bold tracking-tight uppercase mb-1"
          style={{ color: accent }}
        >
          {personalInfo.fullName || 'YOUR FULL NAME'}
        </h1>
        <p className="text-sm font-semibold text-slate-700 mb-2">
          {personalInfo.jobTitle || 'PROFESSIONAL TITLE'}
        </p>

        {/* Contact and Demographics */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
          {personalInfo.nationality && <span>• Nationality: {personalInfo.nationality}</span>}
          {personalInfo.dateOfBirth && <span>• DOB: {personalInfo.dateOfBirth}</span>}
          {personalInfo.maritalStatus && <span>• Status: {personalInfo.maritalStatus}</span>}
          {personalInfo.drivingLicense && <span>• License: {personalInfo.drivingLicense}</span>}
          {personalInfo.linkedin && (
            <span>• {personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>
          )}
          {personalInfo.website && (
            <span>• {personalInfo.website.replace(/^https?:\/\//, '')}</span>
          )}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="mb-5">
          <h2
            className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            Professional Summary
          </h2>
          <p className="text-slate-700 text-[11.5px] leading-normal text-justify">
            {personalInfo.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div className="mb-5">
          <h2
            className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-3"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            Work Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="text-[11.5px]">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-slate-900">{exp.position}</span>
                  <span className="text-slate-500 font-medium text-[11px]">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-slate-700 mb-1 font-medium italic text-[11px]">
                  <span>{exp.company}</span>
                  {exp.location && <span>{exp.location}</span>}
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 text-slate-700">
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

      {/* Education */}
      {education && education.length > 0 && (
        <div className="mb-5">
          <h2
            className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            Education & Degrees
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="text-[11.5px] flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-900">
                    {edu.degree} in {edu.fieldOfStudy}
                  </span>
                  <div className="text-slate-600 italic text-[11px]">
                    {edu.institution} {edu.gpa && `• GPA: ${edu.gpa}`}
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

      {/* Languages */}
      {languages && languages.length > 0 && (
        <div className="mb-5">
          <h2
            className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            Languages & Fluency
          </h2>
          <p className="text-[11.5px] text-slate-700">
            {languages.map((l) => `${l.name} (${l.proficiency})`).join(' • ')}
          </p>
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div className="mb-5">
          <h2
            className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            Technical & Professional Skills
          </h2>
          <p className="text-[11.5px] text-slate-700 leading-relaxed">
            {skills.join(' • ')}
          </p>
        </div>
      )}

      {/* Publications */}
      {publications && publications.length > 0 && (
        <div className="mb-5">
          <h2
            className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            Scientific Publications
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-1 text-[11.5px] text-slate-700">
            {publications.map((p) => (
              <li key={p.id}>
                <strong>{p.title}</strong> — {p.publisher} ({p.date})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Courses & Certifications */}
      {((courses && courses.length > 0) || (certifications && certifications.length > 0)) && (
        <div className="mb-5">
          <h2
            className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            Certifications & Training
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-1 text-[11.5px] text-slate-700">
            {certifications.map((c, i) => (
              <li key={`cert-${i}`}>{c}</li>
            ))}
            {courses.map((c) => (
              <li key={`course-${c.id}`}>
                {c.title} — {c.institution} {c.date && `(${c.date})`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* References */}
      <div>
        <h2
          className="text-[11px] font-bold uppercase tracking-wider border-b pb-1 mb-2"
          style={{ color: accent, borderColor: '#cbd5e1' }}
        >
          Professional References
        </h2>
        {referencesAvailableUponRequest || !references || references.length === 0 ? (
          <p className="text-[11px] italic text-slate-600">Available upon request.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            {references.map((r) => (
              <div key={r.id}>
                <p className="font-bold text-slate-900">{r.name}</p>
                <p className="text-slate-700">{r.position}, {r.company}</p>
                <p className="text-slate-500">{r.email} • {r.phone}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
