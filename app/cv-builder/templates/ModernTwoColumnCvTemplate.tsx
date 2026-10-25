import React from 'react';
import { CvData, CvThemeConfig } from '../types';
import { getDocumentHeadings } from '@/app/lib/documentI18n';

interface TemplateProps {
  data: CvData;
  theme: CvThemeConfig;
}

export default function ModernTwoColumnCvTemplate({ data, theme }: TemplateProps) {
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
  const accent = theme.accentColor || '#059669'; // Emerald default

  return (
    <div
      dir={h.dir}
      className="bg-white text-slate-900 w-full min-h-[1123px] font-sans text-[12px] leading-relaxed print:p-0"
      style={{ fontFamily: theme.fontFamily }}
    >
      <div className="grid grid-cols-12 min-h-[1123px]">
        {/* LEFT COLUMN (Col 1-4: 35%) */}
        <div
          className="col-span-4 p-6 text-white space-y-6 flex flex-col justify-between"
          style={{ backgroundColor: accent }}
        >
          <div className="space-y-6">
            {/* Photo & Name */}
            <div className="text-center">
              {personalInfo.showPhoto && personalInfo.photoUrl ? (
                <div className="flex justify-center mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={personalInfo.photoUrl}
                    alt={personalInfo.fullName}
                    className="w-28 h-28 rounded-2xl object-cover border-2 border-white/40 shadow-xl"
                  />
                </div>
              ) : null}

              <h1 className="text-xl font-bold tracking-tight uppercase leading-tight text-white">
                {personalInfo.fullName || 'Your Full Name'}
              </h1>
              <p className="text-xs font-medium text-white/80 mt-1">
                {personalInfo.jobTitle || 'Professional Title'}
              </p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/90 border-b border-white/20 pb-1 mb-2">
                {h.contact}
              </h3>
              <div className="space-y-1.5 text-[11px] text-white/90 break-words">
                {personalInfo.email && <p>{personalInfo.email}</p>}
                {personalInfo.phone && <p>{personalInfo.phone}</p>}
                {personalInfo.location && <p>{personalInfo.location}</p>}
                {personalInfo.website && (
                  <p>{personalInfo.website.replace(/^https?:\/\//, '')}</p>
                )}
                {personalInfo.linkedin && (
                  <p>{personalInfo.linkedin.replace(/^https?:\/\//, '')}</p>
                )}
                {personalInfo.github && (
                  <p>{personalInfo.github.replace(/^https?:\/\//, '')}</p>
                )}
              </div>
            </div>

            {/* Demographics */}
            {(personalInfo.nationality ||
              personalInfo.dateOfBirth ||
              personalInfo.drivingLicense ||
              personalInfo.maritalStatus) && (
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/90 border-b border-white/20 pb-1 mb-2">
                  {h.personalDetails}
                </h3>
                <div className="space-y-1 text-[10.5px] text-white/80">
                  {personalInfo.nationality && (
                    <p>{h.nationality}: <strong>{personalInfo.nationality}</strong></p>
                  )}
                  {personalInfo.dateOfBirth && (
                    <p>{h.dateOfBirth}: <strong>{personalInfo.dateOfBirth}</strong></p>
                  )}
                  {personalInfo.drivingLicense && (
                    <p>{h.drivingLicense}: <strong>{personalInfo.drivingLicense}</strong></p>
                  )}
                  {personalInfo.maritalStatus && (
                    <p>{h.maritalStatus}: <strong>{personalInfo.maritalStatus}</strong></p>
                  )}
                </div>
              </div>
            )}

            {/* Languages */}
            {languages && languages.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/90 border-b border-white/20 pb-1 mb-2">
                  {h.languages}
                </h3>
                <div className="space-y-2">
                  {languages.map((l) => (
                    <div key={l.id} className="text-[11px]">
                      <div className="flex justify-between">
                        <span className="font-semibold text-white">{l.name}</span>
                        <span className="text-[10px] text-white/80">{l.proficiency}</span>
                      </div>
                      <div className="w-full bg-black/20 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-white h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(10, l.levelPercentage || 80))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills && skills.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/90 border-b border-white/20 pb-1 mb-2">
                  {h.skills}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/15 text-white border border-white/25"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications && certifications.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/90 border-b border-white/20 pb-1 mb-2">
                  {h.certifications}
                </h3>
                <ul className="list-disc list-inside space-y-1 text-[10.5px] text-white/80">
                  {certifications.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* References in left pillar */}
          <div className="pt-4 border-t border-white/20">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/90 mb-1">
              {h.references}
            </h3>
            {referencesAvailableUponRequest || !references || references.length === 0 ? (
              <p className="text-[10px] italic text-white/70">{h.referencesAvailable}</p>
            ) : (
              <div className="space-y-2 text-[10px] text-white/80">
                {references.slice(0, 2).map((r) => (
                  <div key={r.id}>
                    <p className="font-bold text-white">{r.name}</p>
                    <p className="text-[9.5px]">{r.position} ({r.company})</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (Col 5-12: 65%) */}
        <div className="col-span-8 p-8 space-y-6">
          {/* Summary */}
          {personalInfo.summary && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider border-b-2 pb-1 mb-2"
                style={{ color: accent, borderColor: accent }}
              >
                {h.summary}
              </h2>
              <p className="text-slate-700 text-[11.5px] leading-relaxed">
                {personalInfo.summary}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {experience && experience.length > 0 && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider border-b-2 pb-1 mb-3"
                style={{ color: accent, borderColor: accent }}
              >
                {h.experience}
              </h2>
              <div className="space-y-4">
                {experience.map((exp) => (
                  <div key={exp.id} className="text-[11.5px]">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900">{exp.position}</span>
                      <span className="text-[10.5px] text-slate-500 font-medium">
                        {exp.startDate} – {exp.current ? h.present : exp.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px] italic mb-1">
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

          {/* Education */}
          {education && education.length > 0 && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider border-b-2 pb-1 mb-3"
                style={{ color: accent, borderColor: accent }}
              >
                {h.education}
              </h2>
              <div className="space-y-2.5">
                {education.map((edu) => (
                  <div key={edu.id} className="text-[11.5px] flex justify-between items-baseline">
                    <div>
                      <p className="font-bold text-slate-900">
                        {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                      </p>
                      <p className="text-slate-600 italic text-[11px]">
                        {edu.institution} {edu.gpa && `• ${h.gpa}: ${edu.gpa}`}
                      </p>
                    </div>
                    <span className="text-[10.5px] text-slate-500">{edu.startDate} – {edu.endDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publications */}
          {publications && publications.length > 0 && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider border-b-2 pb-1 mb-2"
                style={{ color: accent, borderColor: accent }}
              >
                {h.publications}
              </h2>
              <div className="space-y-2 text-[11px]">
                {publications.map((p) => (
                  <div key={p.id}>
                    <p className="font-bold text-slate-900">{p.title}</p>
                    <p className="text-[10px] text-slate-600 italic">{p.publisher} ({p.date})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses & Training */}
          {courses && courses.length > 0 && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider border-b-2 pb-1 mb-2"
                style={{ color: accent, borderColor: accent }}
              >
                {h.courses}
              </h2>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {courses.map((c) => (
                  <div key={c.id} className="p-2 rounded bg-slate-50 border border-slate-200">
                    <p className="font-semibold text-slate-900 text-[10.5px]">{c.title}</p>
                    <p className="text-[10px] text-slate-500">{c.institution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider border-b-2 pb-1 mb-3"
                style={{ color: accent, borderColor: accent }}
              >
                {h.projects}
              </h2>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="text-[11px]">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{proj.title}</span>
                      {proj.techStack && (
                        <span className="font-normal text-[10px] text-slate-500 italic">
                          {proj.techStack}
                        </span>
                      )}
                    </div>
                    <ul className={`list-disc list-outside ${h.isRtl ? 'mr-4' : 'ml-4'} space-y-0.5 text-slate-700 mt-1`}>
                      {proj.description
                        .filter((d) => d.trim())
                        .map((b, i) => (
                          <li key={i} className="leading-snug">{b}</li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
