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
