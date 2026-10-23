'use client';

import React, { useState } from 'react';
import {
  ResumeData,
  PersonalInfo,
  ExperienceItem,
  EducationItem,
  ProjectItem,
} from '../types';
import {
  User,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Sparkles,
  Award,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Lightbulb,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';

interface BuilderFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function BuilderForm({ data, onChange }: BuilderFormProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    summary: true,
    experience: true,
    education: false,
    projects: false,
    skills: false,
    certifications: false,
  });

  const [newSkillInput, setNewSkillInput] = useState('');
  const [newCertInput, setNewCertInput] = useState('');
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Photo Upload Handlers ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onChange({
        ...data,
        personalInfo: {
          ...data.personalInfo,
          photoUrl: result,
          showPhoto: true,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        photoUrl: '',
        showPhoto: false,
      },
    });
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleToggleShowPhoto = (checked: boolean) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        showPhoto: checked,
      },
    });
  };

  // --- Personal Info updates ---
  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: value,
      },
    });
  };

  // --- Experience Handlers ---
  const addExperience = () => {
    const newItem: ExperienceItem = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: [''],
    };
    onChange({
      ...data,
      experience: [...data.experience, newItem],
    });
  };

  const updateExperience = (
    index: number,
    field: keyof ExperienceItem,
    value: any
  ) => {
    const updated = [...data.experience];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, experience: updated });
  };

  const removeExperience = (index: number) => {
    onChange({
      ...data,
      experience: data.experience.filter((_, i) => i !== index),
    });
  };

  const addExperienceBullet = (expIndex: number) => {
    const updated = [...data.experience];
    updated[expIndex].description.push('');
    onChange({ ...data, experience: updated });
  };

  const updateExperienceBullet = (
    expIndex: number,
    bulletIndex: number,
    val: string
  ) => {
    const updated = [...data.experience];
    updated[expIndex].description[bulletIndex] = val;
    onChange({ ...data, experience: updated });
  };

  const removeExperienceBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...data.experience];
    updated[expIndex].description = updated[expIndex].description.filter(
      (_, i) => i !== bulletIndex
    );
    onChange({ ...data, experience: updated });
  };

  // --- Education Handlers ---
  const addEducation = () => {
    const newItem: EducationItem = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      gpa: '',
    };
    onChange({ ...data, education: [...data.education, newItem] });
  };

  const updateEducation = (
    index: number,
    field: keyof EducationItem,
    value: any
  ) => {
    const updated = [...data.education];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, education: updated });
  };

  const removeEducation = (index: number) => {
    onChange({
      ...data,
      education: data.education.filter((_, i) => i !== index),
    });
  };

  // --- Projects Handlers ---
  const addProject = () => {
    const newItem: ProjectItem = {
      id: Date.now().toString(),
      title: '',
      techStack: '',
      link: '',
      description: [''],
    };
    onChange({ ...data, projects: [...data.projects, newItem] });
  };

  const updateProject = (index: number, field: keyof ProjectItem, value: any) => {
    const updated = [...data.projects];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, projects: updated });
  };

  const removeProject = (index: number) => {
    onChange({
      ...data,
      projects: data.projects.filter((_, i) => i !== index),
    });
  };

  const addProjectBullet = (projIndex: number) => {
    const updated = [...data.projects];
    updated[projIndex].description.push('');
    onChange({ ...data, projects: updated });
  };

  const updateProjectBullet = (
    projIndex: number,
    bulletIndex: number,
    val: string
  ) => {
    const updated = [...data.projects];
    updated[projIndex].description[bulletIndex] = val;
    onChange({ ...data, projects: updated });
  };

  const removeProjectBullet = (projIndex: number, bulletIndex: number) => {
    const updated = [...data.projects];
    updated[projIndex].description = updated[projIndex].description.filter(
      (_, i) => i !== bulletIndex
    );
    onChange({ ...data, projects: updated });
  };

  // --- Skills Handlers ---
  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const splitSkills = newSkillInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !data.skills.includes(s));
    if (splitSkills.length > 0) {
      onChange({
        ...data,
        skills: [...data.skills, ...splitSkills],
      });
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange({
      ...data,
      skills: data.skills.filter((s) => s !== skillToRemove),
    });
  };

  // --- Certifications Handlers ---
  const handleAddCert = () => {
    if (!newCertInput.trim()) return;
    onChange({
      ...data,
      certifications: [...data.certifications, newCertInput.trim()],
    });
    setNewCertInput('');
  };

  const handleRemoveCert = (index: number) => {
    onChange({
      ...data,
      certifications: data.certifications.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      {/* ATS Tip Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border border-cyan-800/40 rounded-xl p-3.5 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-cyan-300">ATS Recommendation:</span>{' '}
          Keep bullet points concise and action-oriented. Begin each with a strong action verb and highlight measurable outcomes (e.g., &ldquo;Increased conversion by 34%&rdquo;).
        </div>
      </div>

      {/* 1. PERSONAL INFORMATION */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md">
        <button
          type="button"
          onClick={() => toggleSection('personal')}
          className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-800/50 text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Personal Information</h3>
              <p className="text-xs text-slate-400">Contact details, title, and links</p>
            </div>
          </div>
          {openSections.personal ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.personal && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-3">
            {/* Profile Photo Uploader */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0">
                  {data.personalInfo.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.personalInfo.photoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Profile Photo (Optional)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Popular for Middle East & European CVs.
                  </p>
                  <label className="inline-flex items-center gap-1.5 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(data.personalInfo.showPhoto)}
                      onChange={(e) => handleToggleShowPhoto(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-medium text-cyan-300">
                      Show photo on resume
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{data.personalInfo.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
                {data.personalInfo.photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={data.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Target Job Title *
                </label>
                <input
                  type="text"
                  value={data.personalInfo.jobTitle}
                  onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={data.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={data.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="e.g. +1 (555) 123-4567"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Location (City, Country)
                </label>
                <input
                  type="text"
                  value={data.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Portfolio / Website
                </label>
                <input
                  type="text"
                  value={data.personalInfo.website}
                  onChange={(e) => updatePersonalInfo('website', e.target.value)}
                  placeholder="e.g. johndoe.dev"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  LinkedIn Profile
                </label>
                <input
                  type="text"
                  value={data.personalInfo.linkedin}
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                  placeholder="e.g. linkedin.com/in/johndoe"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  GitHub Profile
                </label>
                <input
                  type="text"
                  value={data.personalInfo.github}
                  onChange={(e) => updatePersonalInfo('github', e.target.value)}
                  placeholder="e.g. github.com/johndoe"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. PROFESSIONAL SUMMARY */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md">
        <button
          type="button"
          onClick={() => toggleSection('summary')}
          className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-800/50 text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Professional Summary</h3>
              <p className="text-xs text-slate-400">A 2-4 sentence career overview</p>
            </div>
          </div>
          {openSections.summary ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.summary && (
          <div className="p-4 pt-2 border-t border-slate-800/80">
            <textarea
              rows={4}
              value={data.personalInfo.summary}
              onChange={(e) => updatePersonalInfo('summary', e.target.value)}
              placeholder="Results-oriented Software Engineer with 5+ years of experience building performant web applications..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* 3. WORK EXPERIENCE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md">
        <button
          type="button"
          onClick={() => toggleSection('experience')}
          className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-800/50 text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-sm">Work Experience</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {data.experience.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">Past roles, achievements & metrics</p>
            </div>
          </div>
          {openSections.experience ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.experience && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-5">
            {data.experience.map((exp, expIdx) => (
              <div
                key={exp.id || expIdx}
                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-400">
                    Position #{expIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExperience(expIdx)}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete Position"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => updateExperience(expIdx, 'position', e.target.value)}
                      placeholder="Senior Full Stack Engineer"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(expIdx, 'company', e.target.value)}
                      placeholder="TechCorp Inc."
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateExperience(expIdx, 'location', e.target.value)}
                      placeholder="San Francisco, CA (or Remote)"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Start Date
                      </label>
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(expIdx, 'startDate', e.target.value)}
                        placeholder="Jan 2022"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        End Date
                      </label>
                      <input
                        type="text"
                        disabled={exp.current}
                        value={exp.current ? 'Present' : exp.endDate}
                        onChange={(e) => updateExperience(expIdx, 'endDate', e.target.value)}
                        placeholder="Present"
                        className={`w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 ${
                          exp.current ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => updateExperience(expIdx, 'current', e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>I currently work here</span>
                </label>

                {/* Bullet Points */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-[11px] font-medium text-slate-400">
                    Key Achievements & Responsibilities (Bullet Points)
                  </label>
                  {exp.description.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2">
                      <span className="text-cyan-400 text-xs mt-2">•</span>
                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) => updateExperienceBullet(expIdx, bIdx, e.target.value)}
                        placeholder="Architected and deployed scalable microservices reducing p99 latency by 45%..."
                        className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed"
                      />
                      <button
                        type="button"
                        onClick={() => removeExperienceBullet(expIdx, bIdx)}
                        disabled={exp.description.length <= 1}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors mt-1"
                        title="Remove bullet"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addExperienceBullet(expIdx)}
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 py-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add bullet point</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addExperience}
              className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-cyan-500/60 rounded-lg text-xs font-medium text-slate-300 hover:text-cyan-400 flex items-center justify-center gap-2 hover:bg-slate-800/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Experience</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. EDUCATION */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md">
        <button
          type="button"
          onClick={() => toggleSection('education')}
          className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-800/50 text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-sm">Education</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {data.education.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">Degrees, colleges, and certifications</p>
            </div>
          </div>
          {openSections.education ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.education && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-4">
            {data.education.map((edu, eduIdx) => (
              <div
                key={edu.id || eduIdx}
                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400">
                    Education #{eduIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(eduIdx)}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete Education"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Degree
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(eduIdx, 'degree', e.target.value)}
                      placeholder="Bachelor of Science"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      value={edu.fieldOfStudy}
                      onChange={(e) => updateEducation(eduIdx, 'fieldOfStudy', e.target.value)}
                      placeholder="Computer Science"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Institution / University
                    </label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(eduIdx, 'institution', e.target.value)}
                      placeholder="Stanford University"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Start Year
                      </label>
                      <input
                        type="text"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(eduIdx, 'startDate', e.target.value)}
                        placeholder="2016"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        End / Grad Year
                      </label>
                      <input
                        type="text"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(eduIdx, 'endDate', e.target.value)}
                        placeholder="2020"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    GPA / Honors (Optional)
                  </label>
                  <input
                    type="text"
                    value={edu.gpa || ''}
                    onChange={(e) => updateEducation(eduIdx, 'gpa', e.target.value)}
                    placeholder="GPA: 3.9/4.0 • Magna Cum Laude"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addEducation}
              className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-amber-500/60 rounded-lg text-xs font-medium text-slate-300 hover:text-amber-400 flex items-center justify-center gap-2 hover:bg-slate-800/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Education</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. PROJECTS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md">
        <button
          type="button"
          onClick={() => toggleSection('projects')}
          className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-800/50 text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-sm">Projects</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {data.projects.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">Key open-source & portfolio builds</p>
            </div>
          </div>
          {openSections.projects ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.projects && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-4">
            {data.projects.map((proj, projIdx) => (
              <div
                key={proj.id || projIdx}
                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-pink-400">
                    Project #{projIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProject(projIdx)}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => updateProject(projIdx, 'title', e.target.value)}
                      placeholder="AI Resume Optimizer"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Tech Stack Used
                    </label>
                    <input
                      type="text"
                      value={proj.techStack}
                      onChange={(e) => updateProject(projIdx, 'techStack', e.target.value)}
                      placeholder="Next.js, TypeScript, OpenAI API, Tailwind CSS"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Live Demo / GitHub Link
                  </label>
                  <input
                    type="text"
                    value={proj.link}
                    onChange={(e) => updateProject(projIdx, 'link', e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500"
                  />
                </div>

                {/* Project Bullet Points */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-[11px] font-medium text-slate-400">
                    Key Features / Impact
                  </label>
                  {proj.description.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2">
                      <span className="text-pink-400 text-xs mt-2">•</span>
                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) => updateProjectBullet(projIdx, bIdx, e.target.value)}
                        placeholder="Built real-time scoring engine that parses resumes in <150ms..."
                        className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500 leading-relaxed"
                      />
                      <button
                        type="button"
                        onClick={() => removeProjectBullet(projIdx, bIdx)}
                        disabled={proj.description.length <= 1}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors mt-1"
                        title="Remove bullet"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addProjectBullet(projIdx)}
                    className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 py-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add bullet point</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addProject}
              className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-pink-500/60 rounded-lg text-xs font-medium text-slate-300 hover:text-pink-400 flex items-center justify-center gap-2 hover:bg-slate-800/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Project</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. SKILLS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md">
        <button
          type="button"
          onClick={() => toggleSection('skills')}
          className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-800/50 text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-sm">Skills & Keywords</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {data.skills.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">Target ATS keywords, languages, and frameworks</p>
            </div>
          </div>
          {openSections.skills ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.skills && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type a skill or comma-separated list (e.g. Next.js, Docker, AWS)"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Skill tags */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {data.skills.map((skill, sIdx) => (
                <span
                  key={sIdx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/70 rounded-md text-xs text-slate-200 transition-colors"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {data.skills.length === 0 && (
                <span className="text-xs text-slate-500 italic">
                  No skills added yet. Add key technical and soft skills above.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. CERTIFICATIONS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md">
        <button
          type="button"
          onClick={() => toggleSection('certifications')}
          className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-800/50 text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-sm">Certifications & Honors</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {data.certifications.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">Industry certificates, awards, and licenses</p>
            </div>
          </div>
          {openSections.certifications ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.certifications && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCertInput}
                onChange={(e) => setNewCertInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCert();
                  }
                }}
                placeholder="e.g. AWS Certified Solutions Architect - Associate"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddCert}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {data.certifications.map((cert, cIdx) => (
                <div
                  key={cIdx}
                  className="flex items-center justify-between px-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-md text-xs text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-teal-400" />
                    {cert}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCert(cIdx)}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {data.certifications.length === 0 && (
                <span className="text-xs text-slate-500 italic">
                  No certifications added.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
