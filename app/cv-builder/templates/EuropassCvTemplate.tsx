import React from 'react';
import { CvData, CvThemeConfig } from '../types';
import { getDocumentHeadings } from '@/app/lib/documentI18n';

interface TemplateProps {
  data: CvData;
  theme: CvThemeConfig;
}

/**
 * Europass CV Template
 * Conforms to the structured European Curriculum Vitae layout:
 * Left sidebar: Demographics, Contact, Languages (CEFR-style), Skills, References.
 * Right main column: Executive Summary, Work Experience, Education, Publications, Courses, Projects, Volunteering.
 */
export default function EuropassCvTemplate({ data, theme }: TemplateProps) {
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
  const accent = theme.accentColor || '#0284c7';

  return (
    <div
      dir={h.dir}
      className="bg-white text-slate-900 w-full min-h-[1123px] font-sans text-[12px] leading-relaxed print:p-0"
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* Top Europass-style Brand Header */}
      <div
        className="px-8 py-6 text-white flex flex-wrap justify-between items-center gap-4"
        style={{ backgroundColor: accent }}
      >
        <div className="flex-1 min-w-[280px]">
          <span className="text-[10px] tracking-widest uppercase font-mono opacity-80 block mb-0.5">
            Curriculum Vitae
          </span>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            {personalInfo.fullName || 'Your Full Name'}
          </h1>
          <p className="text-sm font-semibold opacity-95 mt-0.5">
            {personalInfo.jobTitle || 'Professional Title'}
          </p>
        </div>

        {personalInfo.showPhoto && personalInfo.photoUrl && (
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-24 h-24 rounded-full object-cover border-3 border-white/80 shadow-md"
            />
          </div>
        )}
      </div>

      {/* Two Column Layout Grid */}
      <div className="grid grid-cols-12 min-h-[1000px]">
        {/* LEFT SIDEBAR (Col 1-4: 33%) */}
        <div className={`col-span-4 bg-slate-50/90 ${h.isRtl ? 'border-l' : 'border-r'} border-slate-200 p-6 space-y-6`}>
          {/* Contact Details */}
          <div>
            <h3
              className="text-[11px] font-bold uppercase tracking-wider pb-1 mb-2 border-b"
              style={{ color: accent, borderColor: accent }}
            >
              {h.contact}
            </h3>
            <div className="space-y-1.5 text-[11px] text-slate-700 break-words">
              {personalInfo.email && (
                <div>
                  <span className="font-semibold text-slate-900 block text-[10px]">{h.email}:</span>
                  <span>{personalInfo.email}</span>
                </div>
              )}
              {personalInfo.phone && (
                <div>
                  <span className="font-semibold text-slate-900 block text-[10px]">{h.phone}:</span>
                  <span>{personalInfo.phone}</span>
                </div>
              )}
              {personalInfo.location && (
                <div>
                  <span className="font-semibold text-slate-900 block text-[10px]">{h.location}:</span>
                  <span>{personalInfo.location}</span>
                </div>
              )}
              {personalInfo.address && (
                <div>
                  <span className="font-semibold text-slate-900 block text-[10px]">{h.location}:</span>
                  <span>{personalInfo.address}</span>
                </div>
              )}
              {personalInfo.website && (
                <div>
                  <span className="font-semibold text-slate-900 block text-[10px]">{h.website}:</span>
                  <span>{personalInfo.website.replace(/^https?:\/\//, '')}</span>
                </div>
              )}
              {personalInfo.linkedin && (
                <div>
                  <span className="font-semibold text-slate-900 block text-[10px]">LinkedIn:</span>
                  <span>{personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>
                </div>
              )}
              {personalInfo.github && (
                <div>
                  <span className="font-semibold text-slate-900 block text-[10px]">GitHub:</span>
                  <span>{personalInfo.github.replace(/^https?:\/\//, '')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Demographics / Personal Details */}
          {(personalInfo.nationality ||
            personalInfo.dateOfBirth ||
            personalInfo.maritalStatus ||
            personalInfo.drivingLicense ||
            personalInfo.visaOrMilitaryStatus) && (
            <div>
              <h3
                className="text-[11px] font-bold uppercase tracking-wider pb-1 mb-2 border-b"
                style={{ color: accent, borderColor: accent }}
              >
                {h.personalDetails}
              </h3>
              <div className="space-y-1.5 text-[11px] text-slate-700">
                {personalInfo.nationality && (
                  <div>
                    <span className="font-semibold text-slate-900 block text-[10px]">{h.nationality}:</span>
                    <span>{personalInfo.nationality}</span>
                  </div>
                )}
                {personalInfo.dateOfBirth && (
                  <div>
                    <span className="font-semibold text-slate-900 block text-[10px]">{h.dateOfBirth}:</span>
                    <span>{personalInfo.dateOfBirth}</span>
                  </div>
                )}
                {personalInfo.maritalStatus && (
                  <div>
                    <span className="font-semibold text-slate-900 block text-[10px]">{h.maritalStatus}:</span>
                    <span>{personalInfo.maritalStatus}</span>
                  </div>
                )}
                {personalInfo.drivingLicense && (
                  <div>
                    <span className="font-semibold text-slate-900 block text-[10px]">{h.drivingLicense}:</span>
                    <span>{personalInfo.drivingLicense}</span>
                  </div>
                )}
                {personalInfo.visaOrMilitaryStatus && (
                  <div>
                    <span className="font-semibold text-slate-900 block text-[10px]">{h.militaryStatus}:</span>
                    <span>{personalInfo.visaOrMilitaryStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Languages Section */}
          {languages && languages.length > 0 && (
            <div>
              <h3
                className="text-[11px] font-bold uppercase tracking-wider pb-1 mb-2 border-b"
                style={{ color: accent, borderColor: accent }}
              >
                {h.languages}
              </h3>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <div key={lang.id} className="text-[11px]">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{lang.name}</span>
                      <span className="text-[10px] text-slate-500">{lang.proficiency}</span>
                    </div>
                    {lang.levelPercentage !== undefined && (
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(10, lang.levelPercentage))}%`,
                            backgroundColor: accent,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core Skills */}
          {skills && skills.length > 0 && (
            <div>
              <h3
                className="text-[11px] font-bold uppercase tracking-wider pb-1 mb-2 border-b"
                style={{ color: accent, borderColor: accent }}
              >
                {h.technicalSkills}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-800 border border-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Soft Skills */}
          {softSkills && softSkills.length > 0 && (
            <div>
              <h3
                className="text-[11px] font-bold uppercase tracking-wider pb-1 mb-2 border-b"
                style={{ color: accent, borderColor: accent }}
              >
                {h.softSkills}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700">
                {softSkills.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tools & Environments */}
          {tools && tools.length > 0 && (
            <div>
              <h3
                className="text-[11px] font-bold uppercase tracking-wider pb-1 mb-2 border-b"
                style={{ color: accent, borderColor: accent }}
              >
                {h.skills}
              </h3>
              <p className="text-[11px] text-slate-700 leading-normal">
                {tools.join(' • ')}
              </p>
            </div>
          )}

          {/* References */}
          <div>
            <h3
              className="text-[11px] font-bold uppercase tracking-wider pb-1 mb-2 border-b"
              style={{ color: accent, borderColor: accent }}
            >
              {h.references}
            </h3>
            {referencesAvailableUponRequest || !references || references.length === 0 ? (
              <p className="text-[10px] italic text-slate-500">
                {h.referencesAvailable}
              </p>
            ) : (
              <div className="space-y-3">
                {references.map((ref) => (
                  <div key={ref.id} className="text-[10px] text-slate-700">
                    <p className="font-bold text-slate-900">{ref.name}</p>
                    <p className="italic">{ref.position}</p>
                    <p className="font-medium">{ref.company}</p>
                    {ref.email && <p className="text-slate-500">{ref.email}</p>}
                    {ref.phone && <p className="text-slate-500">{ref.phone}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT MAIN CONTENT (Col 5-12: 67%) */}
        <div className="col-span-8 p-6 space-y-6">
          {/* Executive Summary */}
          {personalInfo.summary && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 flex items-center gap-2"
                style={{ color: accent, borderColor: accent }}
              >
                <span>{h.summary}</span>
              </h2>
              <p className="text-slate-700 text-[11.5px] leading-relaxed text-justify">
                {personalInfo.summary}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {experience && experience.length > 0 && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b-2"
                style={{ color: accent, borderColor: accent }}
              >
                {h.experience}
              </h2>
              <div className="space-y-4">
                {experience.map((exp) => (
                  <div key={exp.id} className={`relative ${h.isRtl ? 'pr-3 border-r-2' : 'pl-3 border-l-2'} border-slate-300`}>
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-bold text-slate-900 text-xs">{exp.position}</h4>
                      <span className="text-[10px] font-medium text-slate-500">
                        {exp.startDate} – {exp.current ? h.present : exp.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 text-[11px] mb-1 font-medium">
                      <span>{exp.company}</span>
                      {exp.location && <span>{exp.location}</span>}
                    </div>
                    <ul className={`list-disc list-outside ${h.isRtl ? 'mr-3.5' : 'ml-3.5'} space-y-1 text-slate-700 text-[11px]`}>
                      {exp.description
                        .filter((d) => d.trim())
                        .map((b, i) => (
                          <li key={i} className="leading-snug">
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
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b-2"
                style={{ color: accent, borderColor: accent }}
              >
                {h.education}
              </h2>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className={`relative ${h.isRtl ? 'pr-3 border-r-2' : 'pl-3 border-l-2'} border-slate-300`}>
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-bold text-slate-900 text-xs">
                        {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-500">
                        {edu.startDate} – {edu.endDate}
                      </span>
                    </div>
                    <div className="text-slate-600 text-[11px] italic">
                      {edu.institution} {edu.gpa && `• ${h.gpa}: ${edu.gpa}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publications & Research */}
          {publications && publications.length > 0 && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b-2"
                style={{ color: accent, borderColor: accent }}
              >
                {h.publications}
              </h2>
              <div className="space-y-2.5">
                {publications.map((pub) => (
                  <div key={pub.id} className="text-[11px]">
                    <p className="font-bold text-slate-900 leading-snug">{pub.title}</p>
                    <p className="text-slate-600 italic text-[10px]">
                      {pub.publisher} • {pub.date}
                    </p>
                    {pub.description && (
                      <p className="text-slate-700 mt-0.5 leading-snug">{pub.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications & Licenses */}
          {certifications && certifications.length > 0 && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                style={{ color: accent, borderColor: accent }}
              >
                {h.certifications}
              </h2>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700">
                {certifications.map((c, idx) => (
                  <li key={idx} className="font-medium">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Courses & Professional Training */}
          {courses && courses.length > 0 && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                style={{ color: accent, borderColor: accent }}
              >
                {h.courses}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {courses.map((c) => (
                  <div key={c.id} className="p-2 rounded bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-900 text-[10.5px] leading-tight">{c.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {c.institution} {c.date && `(${c.date})`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Projects */}
          {projects && projects.length > 0 && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b-2"
                style={{ color: accent, borderColor: accent }}
              >
                {h.projects}
              </h2>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="text-[11px]">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900">{proj.title}</span>
                      {proj.techStack && (
                        <span className="text-[10px] text-slate-500 italic">{proj.techStack}</span>
                      )}
                    </div>
                    {proj.link && (
                      <p className="text-[10px] text-sky-600 mb-0.5">{proj.link.replace(/^https?:\/\//, '')}</p>
                    )}
                    <ul className={`list-disc list-outside ${h.isRtl ? 'mr-3.5' : 'ml-3.5'} space-y-0.5 text-slate-700`}>
                      {proj.description
                        .filter((d) => d.trim())
                        .map((b, i) => (
                          <li key={i} className="leading-snug">
                            {b}
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Awards & Honors */}
          {awards && awards.length > 0 && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                style={{ color: accent, borderColor: accent }}
              >
                {h.awards}
              </h2>
              <div className="space-y-2">
                {awards.map((award) => (
                  <div key={award.id} className="text-[11px]">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{award.title}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{award.date}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 italic">{award.issuer}</p>
                    {award.description && (
                      <p className="text-slate-700 text-[10.5px] mt-0.5">{award.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Volunteering & Community Engagement */}
          {volunteering && volunteering.length > 0 && (
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                style={{ color: accent, borderColor: accent }}
              >
                {h.volunteering}
              </h2>
              <div className="space-y-2">
                {volunteering.map((v) => (
                  <div key={v.id} className="text-[11px]">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{v.role}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {v.startDate} – {v.current ? h.present : v.endDate}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 italic">
                      {v.organization} {v.location && `• ${v.location}`}
                    </p>
                    <ul className={`list-disc list-outside ${h.isRtl ? 'mr-3.5' : 'ml-3.5'} space-y-0.5 text-slate-700 mt-1`}>
                      {v.description
                        .filter((d) => d.trim())
                        .map((b, i) => (
                          <li key={i} className="leading-snug">
                            {b}
                          </li>
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
