'use client';

import React, { useState } from 'react';
import {
  CvData,
  ExtendedPersonalInfo,
  LanguageItem,
  CourseItem,
  ReferenceItem,
  VolunteerItem,
  PublicationItem,
  AwardItem,
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
  Globe,
  BookOpen,
  Users,
  HeartHandshake,
  FileCode,
  Shield,
  Layers,
} from 'lucide-react';
import AiCvAssistantModal from './AiCvAssistantModal';

interface CvFormProps {
  data: CvData;
  onChange: (data: CvData) => void;
}

export function CvForm({ data, onChange }: CvFormProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    summary: true,
    experience: true,
    education: true,
    languages: true,
    skills: false,
    certifications: false,
    courses: false,
    projects: false,
    publications: false,
    awards: false,
    volunteering: false,
    references: false,
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newSoftSkillInput, setNewSoftSkillInput] = useState('');
  const [newToolInput, setNewToolInput] = useState('');
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

  // --- Personal Info updates ---
  const updatePersonalInfo = (field: keyof ExtendedPersonalInfo, value: any) => {
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
    const newItem = {
      id: `exp-${Date.now()}`,
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: [''],
    };
    onChange({ ...data, experience: [newItem, ...data.experience] });
    setOpenSections((prev) => ({ ...prev, experience: true }));
  };

  const updateExperience = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      experience: data.experience.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const removeExperience = (id: string) => {
    onChange({
      ...data,
      experience: data.experience.filter((item) => item.id !== id),
    });
  };

  const addExpBullet = (expId: string) => {
    onChange({
      ...data,
      experience: data.experience.map((item) =>
        item.id === expId ? { ...item, description: [...item.description, ''] } : item
      ),
    });
  };

  const updateExpBullet = (expId: string, idx: number, val: string) => {
    onChange({
      ...data,
      experience: data.experience.map((item) =>
        item.id === expId
          ? {
              ...item,
              description: item.description.map((b, i) => (i === idx ? val : b)),
            }
          : item
      ),
    });
  };

  const removeExpBullet = (expId: string, idx: number) => {
    onChange({
      ...data,
      experience: data.experience.map((item) =>
        item.id === expId
          ? {
              ...item,
              description: item.description.filter((_, i) => i !== idx),
            }
          : item
      ),
    });
  };

  // --- Education Handlers ---
  const addEducation = () => {
    const newItem = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      gpa: '',
    };
    onChange({ ...data, education: [...data.education, newItem] });
    setOpenSections((prev) => ({ ...prev, education: true }));
  };

  const updateEducation = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      education: data.education.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const removeEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter((item) => item.id !== id),
    });
  };

  // --- Languages Handlers ---
  const addLanguage = () => {
    const newItem: LanguageItem = {
      id: `lang-${Date.now()}`,
      name: '',
      proficiency: 'Fluent',
      levelPercentage: 85,
    };
    onChange({ ...data, languages: [...(data.languages || []), newItem] });
    setOpenSections((prev) => ({ ...prev, languages: true }));
  };

  const updateLanguage = (id: string, field: keyof LanguageItem, value: any) => {
    onChange({
      ...data,
      languages: (data.languages || []).map((l) =>
        l.id === id ? { ...l, [field]: value } : l
      ),
    });
  };

  const removeLanguage = (id: string) => {
    onChange({
      ...data,
      languages: (data.languages || []).filter((l) => l.id !== id),
    });
  };

  // --- Skills Tags Handlers ---
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkillInput.trim()) {
      e.preventDefault();
      if (!data.skills.includes(newSkillInput.trim())) {
        onChange({ ...data, skills: [...data.skills, newSkillInput.trim()] });
      }
      setNewSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    onChange({ ...data, skills: data.skills.filter((s) => s !== skill) });
  };

  const handleAddSoftSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSoftSkillInput.trim()) {
      e.preventDefault();
      const current = data.softSkills || [];
      if (!current.includes(newSoftSkillInput.trim())) {
        onChange({ ...data, softSkills: [...current, newSoftSkillInput.trim()] });
      }
      setNewSoftSkillInput('');
    }
  };

  const removeSoftSkill = (s: string) => {
    onChange({ ...data, softSkills: (data.softSkills || []).filter((x) => x !== s) });
  };

  const handleAddTool = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newToolInput.trim()) {
      e.preventDefault();
      const current = data.tools || [];
      if (!current.includes(newToolInput.trim())) {
        onChange({ ...data, tools: [...current, newToolInput.trim()] });
      }
      setNewToolInput('');
    }
  };

  const removeTool = (t: string) => {
    onChange({ ...data, tools: (data.tools || []).filter((x) => x !== t) });
  };

  // --- Certifications Handlers ---
  const handleAddCert = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newCertInput.trim()) {
      e.preventDefault();
      if (!data.certifications.includes(newCertInput.trim())) {
        onChange({
          ...data,
          certifications: [...data.certifications, newCertInput.trim()],
        });
      }
      setNewCertInput('');
    }
  };

  const removeCert = (cert: string) => {
    onChange({
      ...data,
      certifications: data.certifications.filter((c) => c !== cert),
    });
  };

  // --- Courses Handlers ---
  const addCourse = () => {
    const newItem: CourseItem = {
      id: `course-${Date.now()}`,
      title: '',
      institution: '',
      date: '',
      credentialUrl: '',
    };
    onChange({ ...data, courses: [...(data.courses || []), newItem] });
    setOpenSections((prev) => ({ ...prev, courses: true }));
  };

  const updateCourse = (id: string, field: keyof CourseItem, value: string) => {
    onChange({
      ...data,
      courses: (data.courses || []).map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  };

  const removeCourse = (id: string) => {
    onChange({
      ...data,
      courses: (data.courses || []).filter((c) => c.id !== id),
    });
  };

  // --- Publications Handlers ---
  const addPublication = () => {
    const newItem: PublicationItem = {
      id: `pub-${Date.now()}`,
      title: '',
      publisher: '',
      date: '',
      link: '',
      description: '',
    };
    onChange({ ...data, publications: [...(data.publications || []), newItem] });
    setOpenSections((prev) => ({ ...prev, publications: true }));
  };

  const updatePublication = (id: string, field: keyof PublicationItem, value: string) => {
    onChange({
      ...data,
      publications: (data.publications || []).map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  };

  const removePublication = (id: string) => {
    onChange({
      ...data,
      publications: (data.publications || []).filter((p) => p.id !== id),
    });
  };

  // --- Awards Handlers ---
  const addAward = () => {
    const newItem: AwardItem = {
      id: `award-${Date.now()}`,
      title: '',
      issuer: '',
      date: '',
      description: '',
    };
    onChange({ ...data, awards: [...(data.awards || []), newItem] });
    setOpenSections((prev) => ({ ...prev, awards: true }));
  };

  const updateAward = (id: string, field: keyof AwardItem, value: string) => {
    onChange({
      ...data,
      awards: (data.awards || []).map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    });
  };

  const removeAward = (id: string) => {
    onChange({
      ...data,
      awards: (data.awards || []).filter((a) => a.id !== id),
    });
  };

  // --- Volunteering Handlers ---
  const addVolunteer = () => {
    const newItem: VolunteerItem = {
      id: `vol-${Date.now()}`,
      role: '',
      organization: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: [''],
    };
    onChange({ ...data, volunteering: [...(data.volunteering || []), newItem] });
    setOpenSections((prev) => ({ ...prev, volunteering: true }));
  };

  const updateVolunteer = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      volunteering: (data.volunteering || []).map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    });
  };

  const removeVolunteer = (id: string) => {
    onChange({
      ...data,
      volunteering: (data.volunteering || []).filter((v) => v.id !== id),
    });
  };

  // --- References Handlers ---
  const addReference = () => {
    const newItem: ReferenceItem = {
      id: `ref-${Date.now()}`,
      name: '',
      position: '',
      company: '',
      email: '',
      phone: '',
    };
    onChange({ ...data, references: [...(data.references || []), newItem] });
    setOpenSections((prev) => ({ ...prev, references: true }));
  };

  const updateReference = (id: string, field: keyof ReferenceItem, value: string) => {
    onChange({
      ...data,
      references: (data.references || []).map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    });
  };

  const removeReference = (id: string) => {
    onChange({
      ...data,
      references: (data.references || []).filter((r) => r.id !== id),
    });
  };

  return (
    <div className="space-y-4 pb-12">
      {/* AI Assistant Modal */}
      <AiCvAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        jobTitle={data.personalInfo.jobTitle}
        onApplySummary={(sum) => updatePersonalInfo('summary', sum)}
        onApplyBullet={(bullet) => {
          if (data.experience.length > 0) {
            const firstId = data.experience[0].id;
            addExpBullet(firstId);
            const updatedBullets = [...data.experience[0].description, bullet];
            updateExperience(firstId, 'description', updatedBullets);
          }
        }}
      />

      {/* Floating AI Helper Bar */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-slate-900 border border-emerald-500/30 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Smart AI CV Writing Engine</h4>
            <p className="text-[10px] text-slate-400">
              Need help writing executive statements or STAR accomplishments?
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAiModalOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition-all shadow hover:scale-105 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Assist</span>
        </button>
      </div>

      {/* 1. PERSONAL INFORMATION & DEMOGRAPHICS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleSection('personal')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">1. Personal Info & Demographics</h3>
              <p className="text-[10px] text-slate-400">
                Contact details, Nationality, DOB, Driving license & Photo
              </p>
            </div>
          </div>
          {openSections.personal ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.personal && (
          <div className="p-4 pt-0 space-y-4 border-t border-slate-800/60">
            {/* Photo Upload Row */}
            <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="relative">
                {data.personalInfo.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.personalInfo.photoUrl}
                    alt="CV Profile"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-200">
                    Professional Profile Photo
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.personalInfo.showPhoto ?? true}
                      onChange={(e) => updatePersonalInfo('showPhoto', e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                    />
                    <span>Show in CV</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="cv-photo-upload"
                  />
                  <label
                    htmlFor="cv-photo-upload"
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                  >
                    Upload Photo
                  </label>
                  {data.personalInfo.photoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-2 py-1 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Standard Contact Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={data.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                  placeholder="e.g. Dr. Ahmed Tarek"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Professional Title *
                </label>
                <input
                  type="text"
                  value={data.personalInfo.jobTitle}
                  onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                  placeholder="e.g. Principal AI Architect & Researcher"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={data.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="dr.ahmed@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={data.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="+20 100 892 4512"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  City & Country
                </label>
                <input
                  type="text"
                  value={data.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  placeholder="Cairo, Egypt"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Detailed Address
                </label>
                <input
                  type="text"
                  value={data.personalInfo.address || ''}
                  onChange={(e) => updatePersonalInfo('address', e.target.value)}
                  placeholder="Dokki, Giza"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Extended Demographics (CV Specific) */}
            <div className="pt-2 border-t border-slate-800/60">
              <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2.5">
                CV Demographics (Vital for European & Regional CVs)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nationality (الجنسية)
                  </label>
                  <input
                    type="text"
                    value={data.personalInfo.nationality || ''}
                    onChange={(e) => updatePersonalInfo('nationality', e.target.value)}
                    placeholder="e.g. Egyptian, Saudi, German"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Date of Birth (تاريخ الميلاد)
                  </label>
                  <input
                    type="text"
                    value={data.personalInfo.dateOfBirth || ''}
                    onChange={(e) => updatePersonalInfo('dateOfBirth', e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Civil / Marital Status
                  </label>
                  <input
                    type="text"
                    value={data.personalInfo.maritalStatus || ''}
                    onChange={(e) => updatePersonalInfo('maritalStatus', e.target.value)}
                    placeholder="Married / Single"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Driving License (رخصة القيادة)
                  </label>
                  <input
                    type="text"
                    value={data.personalInfo.drivingLicense || ''}
                    onChange={(e) => updatePersonalInfo('drivingLicense', e.target.value)}
                    placeholder="Category B / Valid"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Visa / Military Status (الموقف التجنيدي / التأشيرة)
                  </label>
                  <input
                    type="text"
                    value={data.personalInfo.visaOrMilitaryStatus || ''}
                    onChange={(e) => updatePersonalInfo('visaOrMilitaryStatus', e.target.value)}
                    placeholder="e.g. Completed Military Service / Valid Schengen Visa"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Links & Portfolios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Portfolio / Website
                </label>
                <input
                  type="text"
                  value={data.personalInfo.website || ''}
                  onChange={(e) => updatePersonalInfo('website', e.target.value)}
                  placeholder="https://mysite.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  LinkedIn Profile
                </label>
                <input
                  type="text"
                  value={data.personalInfo.linkedin || ''}
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  GitHub Profile
                </label>
                <input
                  type="text"
                  value={data.personalInfo.github || ''}
                  onChange={(e) => updatePersonalInfo('github', e.target.value)}
                  placeholder="github.com/username"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. EXECUTIVE SUMMARY */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleSection('summary')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">2. Executive Summary & Statement</h3>
              <p className="text-[10px] text-slate-400">
                High-impact overview of career trajectory and value proposition
              </p>
            </div>
          </div>
          {openSections.summary ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.summary && (
          <div className="p-4 pt-0 space-y-2 border-t border-slate-800/60">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] text-slate-400">
                Write a 3-5 sentence compelling overview of your senior expertise.
              </span>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Write with AI</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={data.personalInfo.summary}
              onChange={(e) => updatePersonalInfo('summary', e.target.value)}
              placeholder="e.g. Accomplished Principal AI Architect with 12+ years of experience..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* 3. WORK EXPERIENCE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        <div className="w-full p-4 flex items-center justify-between text-left border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => toggleSection('experience')}
            className="flex-1 flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">3. Professional Experience</h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                  {data.experience.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Career history, roles, key achievements and impact
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addExperience}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Role</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSection('experience')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {openSections.experience ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {openSections.experience && (
          <div className="p-4 space-y-4">
            {data.experience.map((exp, expIdx) => (
              <div
                key={exp.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 relative group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-400">
                    Role #{expIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove Role"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Job Title / Position *
                    </label>
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                      placeholder="e.g. Director of Applied Research"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Company / Organization *
                    </label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      placeholder="e.g. OmniCloud Technologies"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={exp.location || ''}
                      onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                      placeholder="e.g. Dubai / Cairo"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Start Date
                      </label>
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                        placeholder="2021-03"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        End Date
                      </label>
                      <input
                        type="text"
                        disabled={exp.current}
                        value={exp.current ? 'Present' : exp.endDate}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        placeholder="Present"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id={`current-exp-${exp.id}`}
                    checked={exp.current}
                    onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                  />
                  <label
                    htmlFor={`current-exp-${exp.id}`}
                    className="text-xs text-slate-400 cursor-pointer"
                  >
                    I currently work in this role
                  </label>
                </div>

                {/* Bullets */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-slate-300">
                      Key Responsibilities & Quantified Achievements:
                    </span>
                    <button
                      type="button"
                      onClick={() => addExpBullet(exp.id)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Bullet</span>
                    </button>
                  </div>

                  {exp.description.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2">
                      <span className="text-slate-600 text-xs">•</span>
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => updateExpBullet(exp.id, bIdx, e.target.value)}
                        placeholder="e.g. Spearheaded high-scale deployment serving 4.5M users..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                      {exp.description.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExpBullet(exp.id, bIdx)}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. EDUCATION & DEGREES */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        <div className="w-full p-4 flex items-center justify-between text-left border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => toggleSection('education')}
            className="flex-1 flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">4. Education & Academic Degrees</h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                  {data.education.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Degrees, universities, GPAs, and academic honors
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addEducation}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Degree</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSection('education')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {openSections.education ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {openSections.education && (
          <div className="p-4 space-y-4">
            {data.education.map((edu, eduIdx) => (
              <div
                key={edu.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-400">
                    Degree #{eduIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Degree Title *
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      placeholder="e.g. Ph.D. in Computer Science"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Major / Field of Study
                    </label>
                    <input
                      type="text"
                      value={edu.fieldOfStudy}
                      onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                      placeholder="Distributed Systems"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Institution / University *
                    </label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      placeholder="Cairo University"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Years (Start - End)
                      </label>
                      <input
                        type="text"
                        value={`${edu.startDate || ''} – ${edu.endDate || ''}`.trim()}
                        onChange={(e) => {
                          const parts = e.target.value.split('–');
                          updateEducation(edu.id, 'startDate', (parts[0] || '').trim());
                          updateEducation(edu.id, 'endDate', (parts[1] || '').trim());
                        }}
                        placeholder="2013 - 2017"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        GPA / Honors
                      </label>
                      <input
                        type="text"
                        value={edu.gpa || ''}
                        onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                        placeholder="4.0 / First Class"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. LANGUAGES (CV ESSENTIAL) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        <div className="w-full p-4 flex items-center justify-between text-left border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => toggleSection('languages')}
            className="flex-1 flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">5. Languages & Fluency</h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                  {(data.languages || []).length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Spoken languages and CEFR proficiency levels
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addLanguage}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Language</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSection('languages')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {openSections.languages ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {openSections.languages && (
          <div className="p-4 space-y-3">
            {(data.languages || []).map((lang) => (
              <div
                key={lang.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center gap-3"
              >
                <div className="flex-1 min-w-[140px]">
                  <input
                    type="text"
                    value={lang.name}
                    onChange={(e) => updateLanguage(lang.id, 'name', e.target.value)}
                    placeholder="e.g. English, Arabic, German"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="w-40">
                  <select
                    value={lang.proficiency}
                    onChange={(e) =>
                      updateLanguage(lang.id, 'proficiency', e.target.value as any)
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:border-emerald-500 outline-none"
                  >
                    <option value="Native">Native (لغة أم)</option>
                    <option value="Bilingual">Bilingual</option>
                    <option value="Fluent">Fluent / C2</option>
                    <option value="Professional">Professional / B2</option>
                    <option value="Intermediate">Intermediate / B1</option>
                    <option value="Elementary">Elementary / A2</option>
                  </select>
                </div>

                <div className="w-28 flex items-center gap-1.5">
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={5}
                    value={lang.levelPercentage || 80}
                    onChange={(e) =>
                      updateLanguage(lang.id, 'levelPercentage', Number(e.target.value))
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 font-mono w-7">
                    {lang.levelPercentage || 80}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeLanguage(lang.id)}
                  className="p-1 text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. SKILLS CATEGORIES */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleSection('skills')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">6. Categorized Skills & Tools</h3>
              <p className="text-[10px] text-slate-400">
                Technical competencies, soft skills, tools & platforms
              </p>
            </div>
          </div>
          {openSections.skills ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.skills && (
          <div className="p-4 pt-0 space-y-4 border-t border-slate-800/60">
            {/* Technical Skills */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Core Technical Skills (Press Enter to add)
              </label>
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="e.g. Distributed Systems, PyTorch, Cloud Architecture"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-200"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Soft Skills */}
            <div className="pt-2 border-t border-slate-800/60">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Leadership & Soft Skills (Press Enter to add)
              </label>
              <input
                type="text"
                value={newSoftSkillInput}
                onChange={(e) => setNewSoftSkillInput(e.target.value)}
                onKeyDown={handleAddSoftSkill}
                placeholder="e.g. Strategic Planning, Team Mentorship, Stakeholder Management"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {(data.softSkills || []).map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => removeSoftSkill(s)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div className="pt-2 border-t border-slate-800/60">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Tools & Technologies (Press Enter to add)
              </label>
              <input
                type="text"
                value={newToolInput}
                onChange={(e) => setNewToolInput(e.target.value)}
                onKeyDown={handleAddTool}
                placeholder="e.g. Docker, Kubernetes, Terraform, Git"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {(data.tools || []).map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-200"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => removeTool(t)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. CERTIFICATIONS & LICENSES */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleSection('certifications')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">7. Certifications & Licenses</h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                  {data.certifications.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                AWS, Google Cloud, Cisco, PMP or professional bar licenses
              </p>
            </div>
          </div>
          {openSections.certifications ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.certifications && (
          <div className="p-4 pt-0 space-y-3 border-t border-slate-800/60">
            <input
              type="text"
              value={newCertInput}
              onChange={(e) => setNewCertInput(e.target.value)}
              onKeyDown={handleAddCert}
              placeholder="e.g. AWS Certified Solutions Architect – Professional (Press Enter)"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
            />
            <div className="space-y-1.5">
              {data.certifications.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200"
                >
                  <span>{c}</span>
                  <button
                    type="button"
                    onClick={() => removeCert(c)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 8. COURSES & TRAINING */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        <div className="w-full p-4 flex items-center justify-between text-left border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => toggleSection('courses')}
            className="flex-1 flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">8. Courses & Training Programs</h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                  {(data.courses || []).length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Specialized executive workshops and training courses
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addCourse}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSection('courses')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {openSections.courses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {openSections.courses && (
          <div className="p-4 space-y-3">
            {(data.courses || []).map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 relative"
              >
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={c.title}
                    onChange={(e) => updateCourse(c.id, 'title', e.target.value)}
                    placeholder="Course Title (e.g. Deep Learning Specialization)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeCourse(c.id)}
                    className="p-1 text-slate-500 hover:text-red-400 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={c.institution}
                    onChange={(e) => updateCourse(c.id, 'institution', e.target.value)}
                    placeholder="Provider / Platform (e.g. MIT Sloan / Coursera)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="text"
                    value={c.date}
                    onChange={(e) => updateCourse(c.id, 'date', e.target.value)}
                    placeholder="Year (e.g. 2023)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 9. PUBLICATIONS & RESEARCH (ACADEMIC / EXPERT CV) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        <div className="w-full p-4 flex items-center justify-between text-left border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => toggleSection('publications')}
            className="flex-1 flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">9. Scientific Publications & Articles</h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                  {(data.publications || []).length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Peer-reviewed papers, journals, conference proceedings, or thought leadership
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addPublication}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Paper</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSection('publications')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {openSections.publications ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {openSections.publications && (
          <div className="p-4 space-y-3">
            {(data.publications || []).map((pub) => (
              <div
                key={pub.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 relative"
              >
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={pub.title}
                    onChange={(e) => updatePublication(pub.id, 'title', e.target.value)}
                    placeholder="Paper Title (e.g. Dynamic Quantization & Latency Bounds...)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removePublication(pub.id)}
                    className="p-1 text-slate-500 hover:text-red-400 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={pub.publisher}
                    onChange={(e) => updatePublication(pub.id, 'publisher', e.target.value)}
                    placeholder="Journal / Venue (e.g. IEEE TPDS)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="text"
                    value={pub.date}
                    onChange={(e) => updatePublication(pub.id, 'date', e.target.value)}
                    placeholder="Date (e.g. 2024-02)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <input
                  type="text"
                  value={pub.description || ''}
                  onChange={(e) => updatePublication(pub.id, 'description', e.target.value)}
                  placeholder="Short impact note or abstract summary..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 10. HONORS & AWARDS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        <div className="w-full p-4 flex items-center justify-between text-left border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => toggleSection('awards')}
            className="flex-1 flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">10. Honors & Scientific Awards</h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                  {(data.awards || []).length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Industry recognitions, innovation medals, and fellowships
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addAward}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Award</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSection('awards')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {openSections.awards ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {openSections.awards && (
          <div className="p-4 space-y-3">
            {(data.awards || []).map((award) => (
              <div
                key={award.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 relative"
              >
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={award.title}
                    onChange={(e) => updateAward(award.id, 'title', e.target.value)}
                    placeholder="Award Name (e.g. National Science Excellence Medal)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeAward(award.id)}
                    className="p-1 text-slate-500 hover:text-red-400 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={award.issuer}
                    onChange={(e) => updateAward(award.id, 'issuer', e.target.value)}
                    placeholder="Issuer / Body (e.g. ASRT / Tech Summit)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="text"
                    value={award.date}
                    onChange={(e) => updateAward(award.id, 'date', e.target.value)}
                    placeholder="Year (e.g. 2023)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 11. VOLUNTEERING & COMMUNITY */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        <div className="w-full p-4 flex items-center justify-between text-left border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => toggleSection('volunteering')}
            className="flex-1 flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">11. Volunteering & Leadership</h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                  {(data.volunteering || []).length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Community service, advisory roles, and non-profit contributions
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addVolunteer}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Role</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSection('volunteering')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {openSections.volunteering ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {openSections.volunteering && (
          <div className="p-4 space-y-3">
            {(data.volunteering || []).map((v) => (
              <div
                key={v.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 relative"
              >
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={v.role}
                    onChange={(e) => updateVolunteer(v.id, 'role', e.target.value)}
                    placeholder="Role (e.g. Technical Advisory & Mentor)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeVolunteer(v.id)}
                    className="p-1 text-slate-500 hover:text-red-400 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={v.organization}
                    onChange={(e) => updateVolunteer(v.id, 'organization', e.target.value)}
                    placeholder="Organization (e.g. TechStars Middle East)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="text"
                    value={`${v.startDate || ''} – ${v.current ? 'Present' : v.endDate || ''}`.trim()}
                    onChange={(e) => {
                      const p = e.target.value.split('–');
                      updateVolunteer(v.id, 'startDate', (p[0] || '').trim());
                      updateVolunteer(v.id, 'endDate', (p[1] || '').trim());
                    }}
                    placeholder="2019 - Present"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 12. REFERENCES */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        <div className="w-full p-4 flex items-center justify-between text-left border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => toggleSection('references')}
            className="flex-1 flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">12. Professional References</h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                  {data.referencesAvailableUponRequest ? 'On Request' : (data.references || []).length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Endorsers or 'Available upon request' statement
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {!data.referencesAvailableUponRequest && (
              <button
                type="button"
                onClick={addReference}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleSection('references')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {openSections.references ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {openSections.references && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <input
                type="checkbox"
                id="ref-toggle-request"
                checked={data.referencesAvailableUponRequest}
                onChange={(e) =>
                  onChange({ ...data, referencesAvailableUponRequest: e.target.checked })
                }
                className="rounded bg-slate-800 border-slate-700 text-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="ref-toggle-request"
                className="text-xs text-slate-300 cursor-pointer font-medium"
              >
                Display standard: <em>"References available upon request"</em> (Hide names & phones)
              </label>
            </div>

            {!data.referencesAvailableUponRequest && (
              <div className="space-y-3 pt-2">
                {(data.references || []).map((ref) => (
                  <div
                    key={ref.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-400">Reference Contact</span>
                      <button
                        type="button"
                        onClick={() => removeReference(ref.id)}
                        className="p-1 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={ref.name}
                        onChange={(e) => updateReference(ref.id, 'name', e.target.value)}
                        placeholder="Full Name (e.g. Dr. Marcus Vance)"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                      <input
                        type="text"
                        value={ref.position}
                        onChange={(e) => updateReference(ref.id, 'position', e.target.value)}
                        placeholder="Position (e.g. VP of Global Engineering)"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                      <input
                        type="text"
                        value={ref.company}
                        onChange={(e) => updateReference(ref.id, 'company', e.target.value)}
                        placeholder="Company / University"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                      <input
                        type="email"
                        value={ref.email}
                        onChange={(e) => updateReference(ref.id, 'email', e.target.value)}
                        placeholder="Email (optional)"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
