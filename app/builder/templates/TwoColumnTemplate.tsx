import React from 'react';
import { ResumeData, ThemeConfig } from '../types';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
  theme: ThemeConfig;
}

/**
 * ResumeForFree: Two Column Template
 * Description: A two-column resume layout with sections side by side
 * Left Column (70%): Experience, Education, Projects, Profile
 * Right Column (30%): Contact Info, Skills, Certifications
 */
export default function TwoColumnTemplate({ data, theme }: TemplateProps) {
  const { personalInfo, experience, education, projects, skills, certifications } = data;
  const accent = theme.accentColor || '#1d4ed8';

  return (
    <div
      className="bg-white text-gray-900 w-full min-h-[1100px] font-sans p-8 print:p-6 text-[12px] leading-relaxed shadow-sm"
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* 1. Header (Spans full width) */}
      <header className="border-b border-gray-200 pb-4 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
              {personalInfo.fullName || 'Your Full Name'}
            </h1>
            {personalInfo.jobTitle && (
              <p
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: accent }}
              >
                {personalInfo.jobTitle}
              </p>
            )}
          </div>

          {/* Optional Photo */}
          {personalInfo.showPhoto && personalInfo.photoUrl && (
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-20 h-20 rounded-xl object-cover border border-gray-300 shadow-sm shrink-0"
            />
          )}
        </div>
      </header>

      {/* 2. Two-Column Layout (7fr left, 3fr right) */}
      <div className="grid grid-cols-12 gap-7">
        {/* Left Column (Main: 8 cols = ~67%) */}
        <div className="col-span-8 space-y-4">
          {/* Summary / Profile */}
          {personalInfo.summary && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-2">
                Profile
              </h2>
              <p className="text-[11.5px] text-gray-700 leading-relaxed">
                {personalInfo.summary}
              </p>
            </section>
          )}

          {/* Work Experience */}
          {experience.length > 0 && experience.some((e) => e.company || e.position) && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-2.5">
                Work Experience
              </h2>
              <div className="space-y-3.5">
                {experience
                  .filter((exp) => exp.company || exp.position)
                  .map((exp) => (
                    <div key={exp.id} className="text-[11.5px]">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-bold text-gray-900">
                          {exp.position}
                        </span>
                        {(exp.startDate || exp.endDate) && (
                          <span className="text-gray-500 font-medium text-[10.5px]">
                            {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-700 font-medium text-[11px] mb-1">
                        {exp.company}{exp.location ? ` • ${exp.location}` : ''}
                      </div>
                      {exp.description && exp.description.length > 0 && (
                        <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
                          {exp.description
                            .filter(Boolean)
                            .map((bullet, idx) => (
                              <li key={idx} className="leading-snug">
                                {bullet}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && education.some((edu) => edu.institution || edu.degree) && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-2.5">
                Education
              </h2>
              <div className="space-y-3">
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
                          <span className="text-gray-500 font-medium text-[10.5px]">
                            {edu.startDate} – {edu.endDate}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-700 text-[11px]">
                        {edu.institution}
                        {edu.gpa ? ` • GPA: ${edu.gpa}` : ''}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Key Projects */}
          {projects.length > 0 && projects.some((p) => p.title) && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-2.5">
                Projects
              </h2>
              <div className="space-y-3">
                {projects
                  .filter((p) => p.title)
                  .map((proj) => (
                    <div key={proj.id} className="text-[11.5px]">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-bold text-gray-900 flex items-center gap-1.5">
                          {proj.title}
                          {proj.link && (
                            <a
                              href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] hover:underline"
                              style={{ color: accent }}
                            >
                              <ExternalLink className="w-2.5 h-2.5 inline" />
                            </a>
                          )}
                        </span>
                        {proj.techStack && (
                          <span className="text-[10.5px] text-gray-500 font-medium">
                            {proj.techStack}
                          </span>
                        )}
                      </div>
                      {proj.description && proj.description.length > 0 && (
                        <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
                          {proj.description
                            .filter(Boolean)
                            .map((bullet, idx) => (
                              <li key={idx} className="leading-snug">
                                {bullet}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column (Sidebar: 4 cols = ~33%) */}
        <div className="col-span-4 space-y-5 border-l border-gray-100 pl-5">
          {/* Contact Details */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-2.5">
              Contact
            </h2>
            <div className="space-y-1.5 text-[11px] text-gray-700">
              {personalInfo.email && (
                <div className="flex items-center gap-1.5 break-all">
                  <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                  <span>{personalInfo.email}</span>
                </div>
              )}
              {personalInfo.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                  <span>{personalInfo.phone}</span>
                </div>
              )}
              {personalInfo.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                  <span>{personalInfo.location}</span>
                </div>
              )}
              {personalInfo.linkedin && (
                <div className="flex items-center gap-1.5 break-all">
                  <Linkedin className="w-3 h-3 text-gray-400 shrink-0" />
                  <a
                    href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-medium"
                    style={{ color: accent }}
                  >
                    LinkedIn
                  </a>
                </div>
              )}
              {personalInfo.github && (
                <div className="flex items-center gap-1.5 break-all">
                  <Github className="w-3 h-3 text-gray-400 shrink-0" />
                  <a
                    href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-medium"
                    style={{ color: accent }}
                  >
                    GitHub
                  </a>
                </div>
              )}
              {personalInfo.website && (
                <div className="flex items-center gap-1.5 break-all">
                  <Globe className="w-3 h-3 text-gray-400 shrink-0" />
                  <a
                    href={personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-medium"
                    style={{ color: accent }}
                  >
                    Portfolio
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Technical Skills */}
          {skills.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-2.5">
                Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-gray-100 text-gray-800 border border-gray-200/80"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 mb-2.5">
                Certificates
              </h2>
              <ul className="space-y-1 text-[11px] text-gray-700">
                {certifications.map((cert, idx) => (
                  <li key={idx} className="leading-snug flex items-start gap-1">
                    <span className="text-gray-400">•</span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
