export type DocumentLanguage = 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';

export interface DocumentLanguageOption {
  id: DocumentLanguage;
  name: string;
  nativeName: string;
  code: string;
  dir: 'ltr' | 'rtl';
}

export const DOCUMENT_LANGUAGE_OPTIONS: DocumentLanguageOption[] = [
  { id: 'en', name: 'English', nativeName: 'English', code: 'EN', dir: 'ltr' },
  { id: 'ar', name: 'Arabic', nativeName: 'العربية', code: 'AR', dir: 'rtl' },
  { id: 'fr', name: 'French', nativeName: 'Français', code: 'FR', dir: 'ltr' },
  { id: 'de', name: 'German', nativeName: 'Deutsch', code: 'DE', dir: 'ltr' },
  { id: 'es', name: 'Spanish', nativeName: 'Español', code: 'ES', dir: 'ltr' },
  { id: 'tr', name: 'Turkish', nativeName: 'Türkçe', code: 'TR', dir: 'ltr' },
];

export interface DocumentHeadings {
  lang: DocumentLanguage;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;

  // Core Resume & CV Headings
  summary: string;
  experience: string;
  education: string;
  projects: string;
  skills: string;
  softSkills: string;
  technicalSkills: string;
  certifications: string;
  languages: string;
  present: string;

  // Extended CV Headings
  publications: string;
  awards: string;
  courses: string;
  volunteering: string;
  references: string;
  referencesAvailable: string;
  personalDetails: string;
  nationality: string;
  dateOfBirth: string;
  maritalStatus: string;
  drivingLicense: string;
  militaryStatus: string;
  contact: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  gpa: string;
}

export const DOCUMENT_TRANSLATIONS: Record<DocumentLanguage, DocumentHeadings> = {
  en: {
    lang: 'en',
    dir: 'ltr',
    isRtl: false,
    summary: 'Professional Summary',
    experience: 'Work Experience',
    education: 'Education',
    projects: 'Key Projects',
    skills: 'Skills & Competencies',
    softSkills: 'Soft Skills',
    technicalSkills: 'Technical Skills',
    certifications: 'Certifications',
    languages: 'Languages',
    present: 'Present',
    publications: 'Publications & Research',
    awards: 'Honors & Awards',
    courses: 'Courses & Training',
    volunteering: 'Volunteering & Community',
    references: 'References',
    referencesAvailable: 'References available upon request',
    personalDetails: 'Personal Details',
    nationality: 'Nationality',
    dateOfBirth: 'Date of Birth',
    maritalStatus: 'Marital Status',
    drivingLicense: 'Driving License',
    militaryStatus: 'Military/Visa Status',
    contact: 'Contact',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    website: 'Portfolio',
    gpa: 'GPA',
  },
  ar: {
    lang: 'ar',
    dir: 'rtl',
    isRtl: true,
    summary: 'النبذة المهنية',
    experience: 'الخبرات المهنية',
    education: 'المؤهلات العلمية والتعليم',
    projects: 'المشاريع والإنجازات',
    skills: 'المهارات والقدرات',
    softSkills: 'المهارات الشخصية',
    technicalSkills: 'المهارات التقنية',
    certifications: 'الشهادات والاعتمادات',
    languages: 'اللغات',
    present: 'حتى الآن',
    publications: 'الأبحاث والمنشورات العلمية',
    awards: 'الجوائز والتكريمات',
    courses: 'الدورات والتدريب',
    volunteering: 'العمل التطوعي',
    references: 'المعرفون والمراجع',
    referencesAvailable: 'المراجع والشهادات متاحة عند الطلب',
    personalDetails: 'البيانات الشخصية',
    nationality: 'الجنسية',
    dateOfBirth: 'تاريخ الميلاد',
    maritalStatus: 'الحالة الاجتماعية',
    drivingLicense: 'رخصة القيادة',
    militaryStatus: 'الموقف التجنيدي / التأشيرة',
    contact: 'بيانات الاتصال',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    location: 'العنوان / المدينة',
    website: 'المعرض الشخصي',
    gpa: 'المعدل التراكمي',
  },
  fr: {
    lang: 'fr',
    dir: 'ltr',
    isRtl: false,
    summary: 'Profil Professionnel',
    experience: 'Expérience Professionnelle',
    education: 'Formation & Diplômes',
    projects: 'Projets Réalisés',
    skills: 'Compétences & Atouts',
    softSkills: 'Compétences Relationnelles',
    technicalSkills: 'Compétences Techniques',
    certifications: 'Certifications',
    languages: 'Langues',
    present: 'Présent',
    publications: 'Publications & Recherche',
    awards: 'Prix & Distinctions',
    courses: 'Formations & Séminaires',
    volunteering: 'Bénévolat',
    references: 'Références',
    referencesAvailable: 'Références disponibles sur demande',
    personalDetails: 'Informations Personnelles',
    nationality: 'Nationalité',
    dateOfBirth: 'Date de Naissance',
    maritalStatus: 'État Civil',
    drivingLicense: 'Permis de Conduire',
    militaryStatus: 'Statut Militaire / Visa',
    contact: 'Contact',
    email: 'Email',
    phone: 'Téléphone',
    location: 'Adresse',
    website: 'Site Web / Portfolio',
    gpa: 'Moyenne',
  },
  de: {
    lang: 'de',
    dir: 'ltr',
    isRtl: false,
    summary: 'Berufliches Profil',
    experience: 'Berufserfahrung',
    education: 'Ausbildung & Studium',
    projects: 'Wichtige Projekte',
    skills: 'Kenntnisse & Fähigkeiten',
    softSkills: 'Soziale Kompetenzen',
    technicalSkills: 'Fachkompetenzen',
    certifications: 'Zertifikate',
    languages: 'Sprachen',
    present: 'Heute',
    publications: 'Publikationen & Forschung',
    awards: 'Auszeichnungen & Ehrungen',
    courses: 'Weiterbildungen & Kurse',
    volunteering: 'Ehrenamtliches Engagement',
    references: 'Referenzen',
    referencesAvailable: 'Referenzen auf Anfrage erhältlich',
    personalDetails: 'Persönliche Angaben',
    nationality: 'Staatsangehörigkeit',
    dateOfBirth: 'Geburtsdatum',
    maritalStatus: 'Familienstand',
    drivingLicense: 'Führerschein',
    militaryStatus: 'Wehrdienst / Visastatus',
    contact: 'Kontakt',
    email: 'E-Mail',
    phone: 'Telefon',
    location: 'Wohnort',
    website: 'Portfolio / Website',
    gpa: 'Note',
  },
  es: {
    lang: 'es',
    dir: 'ltr',
    isRtl: false,
    summary: 'Perfil Profesional',
    experience: 'Experiencia Laboral',
    education: 'Educación y Formación',
    projects: 'Proyectos Destacados',
    skills: 'Habilidades y Competencias',
    softSkills: 'Habilidades Blandas',
    technicalSkills: 'Habilidades Técnicas',
    certifications: 'Certificaciones',
    languages: 'Idiomas',
    present: 'Presente',
    publications: 'Publicaciones e Investigación',
    awards: 'Premios y Reconocimientos',
    courses: 'Cursos y Capacitación',
    volunteering: 'Voluntariado',
    references: 'Referencias',
    referencesAvailable: 'Referencias disponibles a petición',
    personalDetails: 'Datos Personales',
    nationality: 'Nacionalidad',
    dateOfBirth: 'Fecha de Nacimiento',
    maritalStatus: 'Estado Civil',
    drivingLicense: 'Permiso de Conducir',
    militaryStatus: 'Estado Militar / Visa',
    contact: 'Contacto',
    email: 'Correo',
    phone: 'Teléfono',
    location: 'Ubicación',
    website: 'Portafolio',
    gpa: 'Promedio',
  },
  tr: {
    lang: 'tr',
    dir: 'ltr',
    isRtl: false,
    summary: 'Profesyonel Özet',
    experience: 'İş Deneyimi',
    education: 'Eğitim Bilgileri',
    projects: 'Projeler',
    skills: 'Beceriler ve Yetkinlikler',
    softSkills: 'Kişisel Beceriler',
    technicalSkills: 'Teknik Beceriler',
    certifications: 'Sertifikalar',
    languages: 'Diller',
    present: 'Günümüz',
    publications: 'Yayınlar ve Araştırmalar',
    awards: 'Ödüller ve Başarılar',
    courses: 'Kurslar ve Eğitimler',
    volunteering: 'Gönüllülük',
    references: 'Referanslar',
    referencesAvailable: 'Referanslar talep üzerine sunulabilir',
    personalDetails: 'Kişisel Bilgiler',
    nationality: 'Uyruk',
    dateOfBirth: 'Doğum Tarihi',
    maritalStatus: 'Medeni Hal',
    drivingLicense: 'Sürücü Belgesi',
    militaryStatus: 'Askerlik / Vize Durumu',
    contact: 'İletişim',
    email: 'E-posta',
    phone: 'Telefon',
    location: 'Adres',
    website: 'Web Sitesi / Portfolyo',
    gpa: 'Not Ortalaması',
  },
};

export function getDocumentHeadings(lang?: DocumentLanguage | string): DocumentHeadings {
  if (lang && lang in DOCUMENT_TRANSLATIONS) {
    return DOCUMENT_TRANSLATIONS[lang as DocumentLanguage];
  }
  return DOCUMENT_TRANSLATIONS.en;
}

export const DOCUMENT_OUTPUT_LANG_STORAGE_KEY = 'jobmatch_document_output_lang';

export function isDocumentLanguage(val: unknown): val is DocumentLanguage {
  return typeof val === 'string' && ['en', 'ar', 'fr', 'de', 'es', 'tr'].includes(val);
}

export function getStoredDocumentLanguage(fallback: DocumentLanguage = 'en'): DocumentLanguage {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(DOCUMENT_OUTPUT_LANG_STORAGE_KEY);
    if (stored && isDocumentLanguage(stored)) {
      return stored;
    }
  } catch {}
  return fallback;
}

export function setStoredDocumentLanguage(lang: DocumentLanguage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DOCUMENT_OUTPUT_LANG_STORAGE_KEY, lang);
  } catch {}
}

export function getDocumentDir(lang?: DocumentLanguage | string): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

export function isRtlDocument(lang?: DocumentLanguage | string): boolean {
  return lang === 'ar';
}

export function getDocumentFontFamily(lang?: DocumentLanguage | string): string {
  if (lang === 'ar') {
    return 'var(--font-arabic), "IBM Plex Sans Arabic", var(--font-sans), sans-serif';
  }
  return 'var(--font-sans), sans-serif';
}

const LOCALE_DATE_MAP: Record<DocumentLanguage, string> = {
  en: 'en-US',
  ar: 'ar-EG',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  tr: 'tr-TR',
};

const ARABIC_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * Formats a resume/CV date string (e.g. "2023-08", "2023-08-15", "08/2023", "2023", "Jan 2023") into the localized representation.
 */
export function formatDocumentDate(dateStr?: string, lang: DocumentLanguage = 'en'): string {
  if (!dateStr || !dateStr.trim()) return '';
  const clean = dateStr.trim();

  // 1. If only a 4-digit year like "2024"
  if (/^\d{4}$/.test(clean)) {
    return clean;
  }

  // 2. Handle YYYY-MM or YYYY-MM-DD or YYYY/MM/DD
  const yyyyMmMatch = clean.match(/^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/);
  if (yyyyMmMatch) {
    const year = parseInt(yyyyMmMatch[1], 10);
    const month = parseInt(yyyyMmMatch[2], 10);
    if (month >= 1 && month <= 12) {
      if (lang === 'ar') {
        return `${ARABIC_MONTH_NAMES[month - 1]} ${year}`;
      }
      try {
        const d = new Date(year, month - 1, 1);
        const locale = LOCALE_DATE_MAP[lang] || 'en-US';
        return d.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
      } catch {
        return `${month}/${year}`;
      }
    }
  }

  // 3. Handle MM/YYYY or MM-YYYY
  const mmYyyyMatch = clean.match(/^(\d{1,2})[-/](\d{4})$/);
  if (mmYyyyMatch) {
    const month = parseInt(mmYyyyMatch[1], 10);
    const year = parseInt(mmYyyyMatch[2], 10);
    if (month >= 1 && month <= 12) {
      if (lang === 'ar') {
        return `${ARABIC_MONTH_NAMES[month - 1]} ${year}`;
      }
      try {
        const d = new Date(year, month - 1, 1);
        const locale = LOCALE_DATE_MAP[lang] || 'en-US';
        return d.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
      } catch {
        return `${month}/${year}`;
      }
    }
  }

  // 4. Fallback attempt with standard Date constructor (e.g. "Jan 2023", "2023-05")
  const parsedTime = Date.parse(clean);
  if (!isNaN(parsedTime)) {
    const d = new Date(parsedTime);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed
    if (year >= 1950 && year <= 2100) {
      if (lang === 'ar') {
        return `${ARABIC_MONTH_NAMES[month]} ${year}`;
      }
      try {
        const locale = LOCALE_DATE_MAP[lang] || 'en-US';
        return d.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
      } catch {
        return clean;
      }
    }
  }

  return clean;
}

/**
 * Formats a start - end date range with proper localized "Present" text.
 */
export function formatDocumentDateRange(
  startDate?: string,
  endDate?: string,
  current?: boolean,
  lang: DocumentLanguage = 'en'
): string {
  const h = getDocumentHeadings(lang);
  const formattedStart = formatDocumentDate(startDate, lang);
  const formattedEnd = current ? h.present : formatDocumentDate(endDate, lang);

  if (!formattedStart && !formattedEnd) return '';
  if (formattedStart && !formattedEnd) return formattedStart;
  if (!formattedStart && formattedEnd) return formattedEnd;

  return `${formattedStart} – ${formattedEnd}`;
}

export interface CoverLetterConventions {
  lang: DocumentLanguage;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
  salutation: (hiringManager?: string) => string;
  signOff: (senderName?: string, senderRole?: string) => string;
  defaultSubject: (jobTitle?: string, companyName?: string) => string;
  formalInstruction: string;
}

export const COVER_LETTER_CONVENTIONS: Record<DocumentLanguage, CoverLetterConventions> = {
  en: {
    lang: 'en',
    dir: 'ltr',
    isRtl: false,
    salutation: (mgr) => (mgr ? `Dear ${mgr},` : 'Dear Hiring Team,'),
    signOff: () => 'Sincerely,',
    defaultSubject: (role) => (role ? `Application for ${role} Role` : 'Job Application'),
    formalInstruction:
      'Write in a polished, highly professional formal executive register appropriate for top-tier job applications. Use standard English corporate greetings and closings.',
  },
  ar: {
    lang: 'ar',
    dir: 'rtl',
    isRtl: true,
    salutation: (mgr) => (mgr ? `عناية ${mgr} المحترم،` : 'السادة أعضاء لجنة التوظيف الموقرين،'),
    signOff: () => 'وتفضلوا بقبول فائق الاحترام والتقدير،',
    defaultSubject: (role) => (role ? `طلب التقديم لشغل وظيفة: ${role}` : 'طلب توظيف'),
    formalInstruction:
      'اكتب باللغة العربية الفصحى المعاصرة برصانة واحترافية عالية تناسب بيئات العمل والشركات الكبرى. استخدم التحيات والختاميات الرسمية المعتمدة.',
  },
  fr: {
    lang: 'fr',
    dir: 'ltr',
    isRtl: false,
    salutation: (mgr) => (mgr ? `À l'attention de ${mgr},` : 'Madame, Monsieur,'),
    signOff: () => "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées,",
    defaultSubject: (role) => (role ? `Candidature au poste de : ${role}` : 'Candidature'),
    formalInstruction:
      'Rédigez dans un registre formel et soutenu, parfaitement adapté aux candidatures professionnelles en France et dans la francophonie.',
  },
  de: {
    lang: 'de',
    dir: 'ltr',
    isRtl: false,
    salutation: (mgr) => (mgr ? `Sehr geehrte(r) ${mgr},` : 'Sehr geehrte Damen und Herren,'),
    signOff: () => 'Mit freundlichen Grüßen,',
    defaultSubject: (role) => (role ? `Bewerbung als ${role}` : 'Bewerbung'),
    formalInstruction:
      'Verfassen Sie das Anschreiben in einem gehobenen, hochprofessionellen Ton (Sie-Form), entsprechend den deutschen Bewerbungsstandards.',
  },
  es: {
    lang: 'es',
    dir: 'ltr',
    isRtl: false,
    salutation: (mgr) => (mgr ? `Estimado/a ${mgr}:` : 'Estimado/a responsable de selección:'),
    signOff: () => 'Atentamente,',
    defaultSubject: (role) => (role ? `Candidatura para el puesto de: ${role}` : 'Candidatura de empleo'),
    formalInstruction:
      'Redacte en un tono formal, profesional y respetuoso (tratamiento de usted), siguiendo los estándares corporativos de cartas de presentación.',
  },
  tr: {
    lang: 'tr',
    dir: 'ltr',
    isRtl: false,
    salutation: (mgr) => (mgr ? `Sayın ${mgr},` : 'Sayın Yetkili,'),
    signOff: () => 'Saygılarımla,',
    defaultSubject: (role) => (role ? `${role} Pozisyonu Başvurusu` : 'İş Başvurusu'),
    formalInstruction:
      'Resmi ve profesyonel bir iş mektubu üslubu (Saygılarımla) kullanarak, Türk iş dünyası standartlarına uygun şekilde yazınız.',
  },
};

export function getCoverLetterConventions(lang: DocumentLanguage = 'en'): CoverLetterConventions {
  return COVER_LETTER_CONVENTIONS[lang] || COVER_LETTER_CONVENTIONS.en;
}

