import React from 'react';
import { CvData, CvThemeConfig } from '../types';
import { getDocumentHeadings } from '@/app/lib/documentI18n';

interface TemplateProps {
  data: CvData;
  theme: CvThemeConfig;
}

/**
 * Executive Master CV Template
 * Authoritative, prestigious multi-page format tailored for Senior Executives, Directors, and Tech Leads.
 * Emphasizes Executive Summary, Strategic Accomplishments, Leadership Experience, Board Roles, and Global Credentials.
 */
export default function ExecutiveCvTemplate({ data, theme }: TemplateProps) {
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

  const h = getDocumentHeadings(theme.documentLanguage);
  const accent = theme.accentColor || '#0f172a';

  return (
    <div
      dir={h.dir}
      className="bg-white text-slate-900 w-full min-h-[1123px] p-10 font-sans text-[12px] leading-relaxed print:p-8"
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* Executive Header */}
      <div className="border-b-2 pb-5 mb-6" style={{ borderColor: accent }}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <span className="text-[10px] tracking-widest uppercase font-bold text-slate-500 block mb-1">
              Curriculum Vitae • Executive Profile
            </span>
            <h1
              className="text-2xl sm:text-3xl font-serif font-black tracking-tight uppercase"
              style={{ color: accent }}
            >
              {personalInfo.fullName || 'Your Full Name'}
            </h1>
            <p className="text-sm font-semibold tracking-wide text-slate-700 mt-1 uppercase">
              {personalInfo.jobTitle || 'Executive Professional'}
            </p>

            {/* Clean Contact & Demographics Line */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-3 pt-2 border-t border-slate-200">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>• {personalInfo.phone}</span>}
              {personalInfo.location && <span>• {personalInfo.location}</span>}
              {personalInfo.nationality && <span>• {h.nationality}: {personalInfo.nationality}</span>}
              {personalInfo.dateOfBirth && <span>• {h.dateOfBirth}: {personalInfo.dateOfBirth}</span>}
              {personalInfo.drivingLicense && <span>• {h.drivingLicense}: {personalInfo.drivingLicense}</span>}
              {personalInfo.linkedin && (
                <span>• {personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>
              )}
              {personalInfo.website && (
                <span>• {personalInfo.website.replace(/^https?:\/\//, '')}</span>
              )}
            </div>
          </div>

          {personalInfo.showPhoto && personalInfo.photoUrl && (
            <div className={`${h.isRtl ? 'mr-6' : 'ml-6'} shrink-0`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName}
                className="w-24 h-28 object-cover rounded shadow-md border-2 border-slate-300"
              />
            </div>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      {personalInfo.summary && (
        <div className="mb-6">
          <h2
            className="text-[11px] font-bold uppercase tracking-widest border-b pb-1 mb-2.5"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            {h.summary}
          </h2>
          <p className="text-slate-700 text-[11.5px] leading-relaxed text-justify">
            {personalInfo.summary}
          </p>
        </div>
      )}

      {/* Core Competencies & Leadership Attributes */}
      {((skills && skills.length > 0) || (softSkills && softSkills.length > 0)) && (
        <div className="mb-6 bg-slate-50 p-3.5 rounded border border-slate-200">
          <h2
            className="text-[10.5px] font-bold uppercase tracking-widest mb-2"
            style={{ color: accent }}
          >
            {h.skills}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-800 font-medium">
            {skills.concat(softSkills || []).slice(0, 12).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professional Experience */}
      {experience && experience.length > 0 && (
        <div className="mb-6">
          <h2
            className="text-[11px] font-bold uppercase tracking-widest border-b pb-1 mb-3"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            {h.experience}
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="text-[11.5px]">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-slate-900 text-[12.5px]">{exp.position}</span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {exp.startDate} – {exp.current ? h.present : exp.endDate}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 italic font-medium mb-1.5 text-[11px]">
                  <span>{exp.company}</span>
                  {exp.location && <span>{exp.location}</span>}
                </div>
                <ul className={`list-disc list-outside ${h.isRtl ? 'mr-4' : 'ml-4'} space-y-1 text-slate-700`}>
                  {exp.description
                    .filter((d) => d.trim())
                    .map((b, idx) => (
                      <li key={idx} className="leading-snug">
                        {b}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education & Academic Credentials */}
      {education && education.length > 0 && (
        <div className="mb-6">
          <h2
            className="text-[11px] font-bold uppercase tracking-widest border-b pb-1 mb-3"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            {h.education}
          </h2>
          <div className="space-y-2.5">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline text-[11.5px]">
                <div>
                  <span className="font-bold text-slate-900">
                    {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                  </span>
                  <div className="text-slate-600 italic text-[11px]">
                    {edu.institution} {edu.gpa && `• ${h.gpa}: ${edu.gpa}`}
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

      {/* Publications, Research & Thought Leadership */}
      {publications && publications.length > 0 && (
        <div className="mb-6">
          <h2
            className="text-[11px] font-bold uppercase tracking-widest border-b pb-1 mb-2.5"
            style={{ color: accent, borderColor: '#cbd5e1' }}
          >
            {h.publications}
          </h2>
          <div className="space-y-2 text-[11px]">
            {publications.map((p) => (
              <div key={p.id}>
                <p className="font-bold text-slate-900">{p.title}</p>
                <p className="text-slate-600 italic text-[10.5px]">
                  {p.publisher} ({p.date})
                </p>
                {p.description && <p className="text-slate-700 text-[10.5px] mt-0.5">{p.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Footer: Languages & Certifications / References */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
        {/* Left Column: Languages & Training */}
        <div className="space-y-4">
          {languages && languages.length > 0 && (
            <div>
              <h3 className="text-[10.5px] font-bold uppercase tracking-wider mb-2 text-slate-800">
                {h.languages}
              </h3>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {languages.map((l) => (
                  <span
                    key={l.id}
                    className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-medium text-slate-800"
                  >
                    {l.name}: <strong className="font-bold">{l.proficiency}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {certifications && certifications.length > 0 && (
            <div>
              <h3 className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5 text-slate-800">
                {h.certifications}
              </h3>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
                {certifications.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: References & Awards */}
        <div className="space-y-4">
          {awards && awards.length > 0 && (
            <div>
              <h3 className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5 text-slate-800">
                {h.awards}
              </h3>
              <div className="space-y-1.5 text-[11px]">
                {awards.map((a) => (
                  <div key={a.id}>
                    <span className="font-bold text-slate-900">{a.title}</span> —{' '}
                    <span className="text-slate-600 italic">{a.issuer} ({a.date})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5 text-slate-800">
              {h.references}
            </h3>
            {referencesAvailableUponRequest || !references || references.length === 0 ? (
              <p className="text-[10.5px] italic text-slate-500">
                {h.referencesAvailable}
              </p>
            ) : (
              <div className="space-y-2 text-[10.5px] text-slate-700">
                {references.map((r) => (
                  <div key={r.id}>
                    <p className="font-bold text-slate-900">{r.name}</p>
                    <p className="italic">{r.position}, {r.company}</p>
                    <p className="text-slate-500">{r.email} • {r.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
