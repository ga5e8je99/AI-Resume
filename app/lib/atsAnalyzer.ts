import { DocumentLanguage, getDocumentHeadings } from './documentI18n';
import {
  SYNONYM_GROUPS,
  cleanSurfaceTerm,
  countVariantOccurrences,
  findSynonymGroup,
  formatSynonymAdvice,
  matchTermWithSynonyms,
  normalizeArabicText,
  normalizeTerm,
  type SynonymGroup,
  type SynonymMatchResult,
} from './ats/synonyms';

export type { DocumentLanguage };
export {
  SYNONYM_GROUPS,
  cleanSurfaceTerm,
  countVariantOccurrences,
  findSynonymGroup,
  formatSynonymAdvice,
  matchTermWithSynonyms,
  normalizeArabicText,
  normalizeTerm,
  type SynonymGroup,
  type SynonymMatchResult,
};

export interface KeywordMatch {
  keyword: string;
  count: number;
  importance: 'high' | 'medium' | 'low';
  category: string;
  /** Present when matched via a synonym/acronym rather than the exact target surface form */
  matchedViaSynonym?: string;
  /** Present when we recommend also adding the complementary full name or literal JD form */
  recommendedFormToAdd?: string;
  /** Origin of the keyword */
  source?: 'catalog' | 'jd' | 'both';
}

export interface AnalysisStrength {
  title: string;
  description: string;
  category: 'content' | 'structure' | 'keywords' | 'metrics';
}

export interface AnalysisWeakness {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface AnalysisSuggestion {
  category: string;
  suggestions: string[];
  priority: number;
}

export interface ExtractedJDKeyword {
  term: string;
  normalized: string;
  score: number;
  frequency: number;
  inHighWeightZone: boolean;
  inCatalogOrSynonyms: boolean;
  category: string;
}

export interface JobTitleMatchFinding {
  status: 'exact' | 'partial' | 'missing' | 'not_provided';
  targetRole: string;
  matchedInSummary: boolean;
  matchedInExperience: boolean;
  matchedVariant?: string;
  scoreImpact: number;
  message: string;
  suggestion?: string;
}

export interface BulletIssueItem {
  bulletNumber: number;
  wordCount: number;
  text: string;
}

export interface RepeatedVerbItem {
  verb: string;
  count: number;
  section: string;
}

export interface KeywordStuffingItem {
  keyword: string;
  count: number;
  densityPercent: number;
}

export interface BulletAuditResult {
  totalBullets: number;
  shortBullets: BulletIssueItem[];
  longBullets: BulletIssueItem[];
  repeatedVerbs: RepeatedVerbItem[];
  keywordStuffing: KeywordStuffingItem[];
}

export interface DetectedDateRange {
  raw: string;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  startLabel: string;
  endLabel: string;
  isCurrent: boolean;
  lineIndex: number;
}

export interface EmploymentGapItem {
  from: string;
  to: string;
  months: number;
}

export interface DatesAuditResult {
  yearsOfExperience: number;
  totalMonths: number;
  isReverseChronological: boolean;
  chronologyIssues: string[];
  gaps: EmploymentGapItem[];
  rangesDetected: DetectedDateRange[];
}

export interface ATSAnalysisResult {
  detectedLanguage: DocumentLanguage;
  languageNotice?: {
    en: string;
    ar: string;
  };
  overallScore: number;
  subScores: {
    keywordsMatch: number;
    formatting: number;
    structure: number;
    contentQuality: number;
  };
  metrics: {
    wordCount: number;
    readingTimeSeconds: number;
    readingTimeString: string;
    bulletCount: number;
    quantifiedMetricsCount: number;
    grade: string;
    rankPercentile: string;
    matchLabel: string;
    yearsOfExperience?: number;
  };
  contactInfo: {
    hasEmail: boolean;
    email?: string;
    hasPhone: boolean;
    phone?: string;
    hasLinkedIn: boolean;
    linkedIn?: string;
    hasGitHub: boolean;
    hasLocation: boolean;
    completenessScore: number;
  };
  sectionsDetected: {
    name: string;
    found: boolean;
  }[];
  keywordsDetected: KeywordMatch[];
  missingKeywords: string[];
  extractedJdKeywords?: ExtractedJDKeyword[];
  jobTitleMatch?: JobTitleMatchFinding;
  bulletAudit?: BulletAuditResult;
  datesAudit?: DatesAuditResult;
  strengths: AnalysisStrength[];
  weaknesses: AnalysisWeakness[];
  suggestions: AnalysisSuggestion[];
  actionVerbsFound: string[];
  weakVerbsFound: string[];
}

// ============================================================================
// INDUSTRY SKILLS & KEYWORDS CATALOG (Tech + Non-Tech Professions)
// Acts as a domain dictionary & boost, NOT a hard filter when JD is provided
// ============================================================================
const SKILL_CATALOG: { [category: string]: string[] } = {
  'Frontend & Web': [
    'React', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS',
    'Vue.js', 'Angular', 'Svelte', 'Redux', 'Zustand', 'GraphQL', 'REST APIs', 'RESTful',
    'WebSockets', 'Webpack', 'Vite', 'Responsive Design', 'Sass', 'Bootstrap',
    'Material-UI', 'Framer Motion', 'PWA', 'Microfrontends', 'Accessibility', 'WCAG',
  ],
  'Backend & Systems': [
    'Node.js', 'Express', 'NestJS', 'Python', 'Django', 'FastAPI', 'Flask',
    'Java', 'Spring Boot', 'C#', '.NET', 'ASP.NET', 'Go', 'Golang', 'Rust', 'PHP',
    'Laravel', 'Ruby', 'Ruby on Rails', 'Microservices', 'gRPC', 'Kafka', 'RabbitMQ',
    'Redis', 'Serverless', 'Socket.io',
  ],
  'Databases & Storage': [
    'PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Prisma', 'TypeORM', 'Mongoose',
    'DynamoDB', 'Elasticsearch', 'Cassandra', 'Firebase', 'Supabase', 'SQL Server',
    'Oracle', 'Database Optimization', 'Indexing', 'NoSQL',
  ],
  'DevOps & Cloud': [
    'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud', 'GCP', 'Docker',
    'Kubernetes', 'CI/CD', 'GitHub Actions', 'GitLab CI', 'Terraform', 'Linux',
    'Nginx', 'Cloudflare', 'Helm', 'Prometheus', 'Grafana', 'Jenkins', 'Ansible',
  ],
  'AI, ML & Data': [
    'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'LLM',
    'Large Language Models', 'OpenAI', 'Computer Vision', 'Pandas', 'NumPy',
    'Scikit-learn', 'Data Analysis', 'SQL', 'Power BI', 'Tableau', 'Big Data', 'Spark', 'ETL',
  ],
  'Testing & Quality': [
    'Jest', 'Cypress', 'Playwright', 'Vitest', 'Unit Testing', 'Integration Testing',
    'End-to-End Testing', 'E2E', 'TDD', 'Test-Driven Development', 'Mocha', 'Selenium', 'Quality Assurance',
  ],
  'Soft & Methodologies': [
    'Agile', 'Scrum', 'Kanban', 'Jira', 'Git', 'GitHub', 'GitLab', 'Code Review',
    'Team Leadership', 'Mentoring', 'Problem Solving', 'Communication', 'Cross-Functional',
    'Project Management', 'Stakeholder Management', 'Architecture Design', 'CRM', 'ERP', 'KPIs', 'OKRs',
  ],
  'Finance & Accounting': [
    'Financial Reporting', 'General Ledger', 'Accounts Payable', 'Accounts Receivable',
    'Bank Reconciliation', 'Tax Compliance', 'Auditing', 'Internal Audit', 'External Audit',
    'Cost Accounting', 'Budgeting', 'Forecasting', 'Variance Analysis', 'Cash Flow Management',
    'Financial Modeling', 'Financial Analysis', 'Balance Sheet', 'Income Statement',
    'Profit and Loss', 'P&L', 'IFRS', 'GAAP', 'CPA', 'CFA', 'VAT', 'Taxation',
    'SAP', 'SAP FICO', 'Oracle NetSuite', 'QuickBooks', 'Xero', 'Excel', 'Pivot Tables', 'VLOOKUP',
    'Payroll', 'Fixed Assets', 'Bookkeeping', 'Trial Balance', 'Working Capital', 'FP&A',
    'المعايير الدولية للتقارير المالية', 'إعداد القوائم المالية', 'القوائم المالية',
    'دفتر الأستاذ العام', 'الحسابات الدائنة', 'الحسابات المدينة', 'التسويات البنكية',
    'المراجعة الداخلية', 'التدقيق المالي', 'محاسبة التكاليف', 'إعداد الموازنات',
    'التحليل المالي', 'ضريبة القيمة المضافة', 'الإقرارات الضريبية', 'القيود اليومية',
    'ميزان المراجعة', 'الميزانية العمومية', 'الأرباح والخسائر', 'التدفقات النقدية',
    'الأصول الثابتة', 'حسابات الموردين', 'حسابات العملاء', 'محاسب قانوني معتمد',
  ],
  'Marketing & Growth': [
    'SEO', 'Search Engine Optimization', 'SEM', 'Search Engine Marketing', 'PPC',
    'Google Analytics', 'GA4', 'Google Ads', 'Meta Ads', 'Facebook Ads', 'LinkedIn Ads',
    'TikTok Ads', 'Content Marketing', 'Social Media Marketing', 'SMM', 'Email Marketing',
    'Conversion Rate Optimization', 'CRO', 'Copywriting', 'Brand Strategy', 'Brand Management',
    'Market Research', 'Lead Generation', 'HubSpot', 'Mailchimp', 'Salesforce',
    'Ahrefs', 'SEMrush', 'Google Tag Manager', 'Google Search Console', 'ROI', 'ROAS',
    'CTR', 'CAC', 'LTV', 'Influencer Marketing', 'Public Relations', 'Marketing Automation',
    'تحسين محركات البحث', 'التسويق عبر محركات البحث', 'التسويق الرقمي',
    'إدارة الحملات الإعلانية', 'كتابة المحتوى', 'صناعة المحتوى',
    'التسويق عبر وسائل التواصل الاجتماعي', 'أبحاث السوق', 'تحليل المنافسين',
    'إعلانات جوجل', 'إعلانات ميتا', 'العائد على الاستثمار', 'العائد على الإنفاق الإعلاني',
    'الهوية البصرية', 'توليد العملاء المحتملين', 'التسويق عبر البريد الإلكتروني',
  ],
  'Engineering & Construction': [
    'AutoCAD', 'CAD', 'Revit', 'BIM', 'Building Information Modeling', 'Primavera P6',
    'MS Project', 'Structural Analysis', 'Structural Design', 'ETABS', 'SAFE', 'SAP2000',
    'STAAD.Pro', 'Civil 3D', 'Quantity Surveying', 'Bill of Quantities', 'BOQ',
    'Site Supervision', 'Site Management', 'Quality Control', 'QA/QC', 'Concrete Design',
    'Reinforced Concrete', 'Steel Structures', 'Geotechnical Engineering', 'Soil Mechanics',
    'Surveying', 'Land Surveying', 'FIDIC', 'Contract Administration', 'Project Estimation',
    'Cost Control', 'Shop Drawings', 'As-Built Drawings', 'HSE', 'MEP', 'HVAC', 'PMP',
    'أوتوكاد', 'ريفيت', 'نمذجة معلومات البناء', 'بريمافيرا', 'التحليل الإنشائي',
    'التصميم الإنشائي', 'حصر الكميات', 'جدول الكميات', 'المقايسات', 'إشراف هندسي',
    'إشراف موقع', 'تنفيذ المشاريع', 'ضبط الجودة', 'مراقبة الجودة', 'الخرسانة المسلحة',
    'المنشآت المعدنية', 'ميكانيكا التربة', 'المساحة', 'عقود الفيديك', 'الرسومات التنفيذية',
    'شوب دروينج', 'التحكم في التكاليف', 'الجدول الزمني', 'الصحة والسلامة المهنية',
  ],
  'Healthcare & Medical': [
    'Patient Care', 'Clinical Diagnosis', 'Treatment Planning', 'Electronic Medical Records',
    'EMR', 'EHR', 'Triage', 'Emergency Medicine', 'Internal Medicine', 'Pediatrics',
    'Surgery', 'ICU', 'Intensive Care Unit', 'Pharmacotherapy', 'Infection Control',
    'Medical Ethics', 'BLS', 'ACLS', 'HIPAA', 'Clinical Research', 'Patient Counseling',
    'رعاية المرضى', 'التشخيص السريري', 'السجلات الطبية الإلكترونية', 'العناية المركزة',
    'الطوارئ', 'الأمراض الباطنة', 'مكافحة العدوى', 'دعم الحياة الأساسي', 'الخطة العلاجية',
  ],
  'HR & Operations': [
    'Human Resources', 'HR', 'HRIS', 'Talent Acquisition', 'Recruitment', 'Onboarding',
    'Performance Management', 'Employee Relations', 'Compensation and Benefits',
    'Payroll Management', 'Labor Law', 'Organizational Development', 'Training and Development',
    'الموارد البشرية', 'استقطاب الكفاءات', 'التوظيف', 'تقييم الأداء', 'شؤون الموظفين',
    'الرواتب والأجور', 'قانون العمل', 'التدريب والتطوير', 'نظم معلومات الموارد البشرية',
  ],
};

const CATALOG_LOOKUP = new Map<string, { keyword: string; category: string }>();
for (const [category, skills] of Object.entries(SKILL_CATALOG)) {
  for (const skill of skills) {
    CATALOG_LOOKUP.set(cleanSurfaceTerm(skill), { keyword: skill, category });
  }
}

const SYNONYM_CATEGORY_TO_CATALOG_CATEGORY: Record<SynonymGroup['category'], string> = {
  tech: 'Frontend & Web',
  data_ai: 'AI, ML & Data',
  cloud_devops: 'DevOps & Cloud',
  finance_accounting: 'Finance & Accounting',
  marketing_growth: 'Marketing & Growth',
  business_management: 'Soft & Methodologies',
  hr_operations: 'HR & Operations',
  engineering_construction: 'Engineering & Construction',
  healthcare_medical: 'Healthcare & Medical',
  role_title: 'Soft & Methodologies',
};

// Power action verbs for ATS across all 6 supported languages
export const MULTILINGUAL_POWER_VERBS: Record<DocumentLanguage, string[]> = {
  en: [
    'accelerated', 'achieved', 'architected', 'automated', 'built', 'championed',
    'collaborated', 'configured', 'created', 'decreased', 'delivered', 'deployed',
    'designed', 'developed', 'devised', 'directed', 'engineered', 'established',
    'executed', 'expanded', 'formulated', 'generated', 'implemented', 'improved',
    'increased', 'initiated', 'integrated', 'launched', 'lead', 'led', 'managed',
    'maximized', 'mentored', 'minimized', 'modernized', 'negotiated', 'optimized',
    'orchestrated', 'overhauled', 'partnered', 'pioneered', 'produced', 'reduced',
    'refactored', 'resolved', 'restructured', 'revamped', 'scaled', 'spearheaded',
    'standardized', 'streamlined', 'strengthened', 'supervised', 'transformed', 'upgraded',
    'reconciled', 'audited', 'forecasted', 'prepared', 'coordinated',
  ],
  ar: [
    'طوّر', 'طور', 'طورت', 'صمّم', 'صمم', 'صممت', 'أدار', 'ادار', 'أدرت', 'قاد', 'قدت',
    'أسس', 'أسست', 'بنى', 'بنيت', 'نفّذ', 'نفذ', 'نفذت', 'أطلق', 'اطلق', 'أطلقت',
    'حسّن', 'حسن', 'حسنت', 'زاد', 'أنشأ', 'انشأ', 'ابتكر', 'ابتكرت', 'نسّق', 'نسق',
    'أشرف', 'اشرف', 'أشرفت', 'نظّم', 'نظم', 'حقّق', 'حقق', 'حققت', 'سرّع', 'وسع', 'وسّع',
    'أعدّ', 'اعد', 'أعددت', 'راجعت', 'حللت',
  ],
  fr: [
    'développé', 'conçu', 'géré', 'dirigé', 'créé', 'implémenté', 'optimisé',
    'augmenté', 'réduit', 'coordonné', 'lancé', 'amélioré', 'restructuré',
    'piloté', 'supervisé', 'initié', 'déployé', 'accéléré', 'délivré', 'préparé',
  ],
  de: [
    'entwickelt', 'entworfen', 'geleitet', 'aufgebaut', 'optimiert', 'implementiert',
    'gesteigert', 'reduziert', 'koordiniert', 'eingeführt', 'verbessert', 'gesteuert',
    'betreut', 'erstellt', 'skaliert', 'konzipiert', 'umgesetzt',
  ],
  es: [
    'desarrollado', 'diseñado', 'liderado', 'gestionado', 'creado', 'implementado',
    'optimizado', 'aumentado', 'reducido', 'coordinado', 'lanzado', 'mejorado',
    'dirigido', 'supervisado', 'establecido', 'generado', 'ejecutado',
  ],
  tr: [
    'geliştirdi', 'tasarladı', 'yönetti', 'kurdu', 'optimize etti', 'uyguladı',
    'artırdı', 'koordine etti', 'iyileştirdi', 'başlattı', 'denetledi', 'üretti',
    'entegre etti', 'ölçeklendirdi',
  ],
};

const POWER_VERBS = MULTILINGUAL_POWER_VERBS.en;

// Passive or weak phrases to avoid (multilingual)
const WEAK_PHRASES = [
  'responsible for', 'duties included', 'worked on', 'assisted in', 'helped with',
  'tasked with', 'participated in', 'involved in', 'handled', 'did', 'tried to',
  'مسؤول عن', 'المسؤوليات تضمنت', 'ساعد في', 'شارك في',
  'responsable de', 'tâches comprenaient', 'a participé à',
  'verantwortlich für', 'zuständig für', 'mitgewirkt bei',
  'tareas incluían', 'ayudó en',
  'sorumlu', 'görevleri arasındaydı', 'yardım etti',
];

// ============================================================================
// MULTILINGUAL STOPWORDS (6 Languages: EN, AR, FR, DE, ES, TR)
// ============================================================================
const STOPWORDS_BY_LANG: Record<DocumentLanguage, Set<string>> = {
  en: new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'by', 'for', 'with',
    'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
    'once', 'here', 'there', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'can', 'will', 'just', 'should', 'now', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would',
    'could', 'ought', 'of', 'as', 'until', 'while', 'this', 'that', 'these', 'those', 'we',
    'you', 'your', 'our', 'their', 'they', 'them', 'his', 'her', 'its', 'who', 'whom', 'which',
    'what', 'whose', 'also', 'well', 'must', 'may', 'might', 'need', 'needs', 'including',
    'within', 'across', 'per', 'via', 'etc', 'able', 'ability', 'looking', 'seeking', 'join',
    'team', 'company', 'role', 'position', 'job', 'candidate', 'ideal', 'work', 'working',
    'experience', 'experienced', 'year', 'years', 'plus', 'strong', 'proven', 'excellent',
    'good', 'great', 'high', 'highly', 'minimum', 'least', 'required', 'requirements',
    'qualification', 'qualifications', 'responsibilities', 'responsibility', 'preferred',
    'nice', 'skill', 'skills', 'knowledge', 'understanding', 'familiarity', 'proficiency',
    'proficient', 'degree', 'bachelor', 'master', 'related', 'field', 'environment', 'fast',
    'paced', 'collaborate', 'closely', 'ensure', 'support', 'provide', 'develop', 'manage',
    'build', 'maintain', 'create', 'help', 'using', 'use', 'used', 'based', 'new', 'existing',
    'day', 'daily', 'full', 'time', 'part', 'remote', 'hybrid', 'office', 'location', 'hands',
    'track', 'record', 'background', 'deep', 'expertise', 'advanced', 'prepare', 'monthly',
  ]),
  ar: new Set(
    [
      'من', 'في', 'على', 'إلى', 'الى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'هؤلاء', 'أولئك',
      'الذي', 'التي', 'الذين', 'اللاتي', 'اللواتي', 'كل', 'بعض', 'أو', 'او', 'ثم', 'بل', 'لكن',
      'لا', 'ما', 'لم', 'لن', 'قد', 'لقد', 'كان', 'كانت', 'يكون', 'تكون', 'أن', 'ان', 'إن', 'إذ',
      'إذا', 'اذا', 'لو', 'لولا', 'كي', 'لكي', 'حتى', 'حتي', 'منذ', 'مذ', 'بين', 'عند', 'لدى',
      'لدي', 'لديه', 'لديها', 'لدينا', 'خلال', 'حول', 'دون', 'بدون', 'غير', 'سوى', 'فوق', 'تحت',
      'أمام', 'امام', 'خلف', 'وراء', 'بعد', 'قبل', 'نحن', 'هو', 'هي', 'هم', 'هن', 'أنت', 'انت',
      'أنتم', 'انتم', 'أنا', 'انا', 'أي', 'اي', 'أية', 'ايه', 'كلا', 'كلتا', 'نفس', 'عين', 'ذات',
      'ذو', 'ذي', 'ذا', 'فقط', 'أيضا', 'ايضا', 'كذلك', 'جدا', 'أكثر', 'اكثر', 'أقل', 'اقل',
      'مطلوب', 'نبحث', 'تعلن', 'حاجة', 'حاجه', 'وظيفة', 'وظيفه', 'شاغر', 'شاغرة', 'شركة', 'شركه',
      'مؤسسة', 'مؤسسه', 'للعمل', 'العمل', 'عمل', 'فريق', 'خبرة', 'خبره', 'سنوات', 'سنة', 'سنه',
      'عام', 'أعوام', 'اعوام', 'تقل', 'يزيد', 'القدرة', 'القدره', 'مهارات', 'مهارة', 'مهاره',
      'جيدة', 'جيده', 'ممتازة', 'ممتازه', 'عالية', 'عاليه', 'قوية', 'قويه', 'متطلبات', 'المتطلبات',
      'المؤهلات', 'مؤهلات', 'المسؤوليات', 'مسؤوليات', 'المهام', 'مهام', 'الشروط', 'شروط', 'يفضل',
      'إجادة', 'اجاده', 'إتقان', 'اتقان', 'معرفة', 'معرفه', 'فهم', 'تطوير', 'إعداد', 'اعداد',
      'متابعة', 'متابعه', 'تنفيذ', 'تقديم', 'ضمان', 'دعم', 'بشكل', 'ضمن', 'جميع', 'كامل', 'تامة',
      'بكالوريوس', 'درجة', 'درجه', 'مجال', 'تخصص', 'صلة', 'صله', 'دوام', 'جزئي', 'الأساسية', 'اساسيه',
      'عملية', 'عمليه', 'المسمى', 'الوظيفي', 'برنامج',
    ].map((w) => normalizeArabicText(w))
  ),
  fr: new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'et', 'ou', 'où', 'en', 'dans',
    'sur', 'sous', 'avec', 'sans', 'pour', 'par', 'plus', 'moins', 'très', 'ce', 'cet', 'cette',
    'ces', 'qui', 'que', 'quoi', 'dont', 'nous', 'vous', 'ils', 'elles', 'il', 'elle', 'on',
    'être', 'avoir', 'faire', 'son', 'sa', 'ses', 'leur', 'leurs', 'notre', 'nos', 'votre', 'vos',
    'aux', 'au', 'ne', 'pas', 'ni', 'mais', 'donc', 'or', 'car', 'comme', 'tout', 'tous', 'toute',
    'toutes', 'autre', 'autres', 'même', 'aussi', 'bien', 'peut', 'sont', 'est', 'été', 'ayant',
    'expérience', 'ans', 'années', 'travail', 'travailler', 'équipe', 'recherchons', 'cherche',
    'poste', 'entreprise', 'société', 'compétences', 'compétence', 'requis', 'requise', 'profil',
    'missions', 'mission', 'bonne', 'bon', 'excellente', 'maîtrise', 'connaissance', 'capacité',
  ]),
  de: new Set([
    'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'einem', 'einen', 'eines',
    'und', 'oder', 'aber', 'sondern', 'in', 'im', 'an', 'am', 'auf', 'aus', 'bei', 'mit', 'nach',
    'seit', 'von', 'vom', 'zu', 'zum', 'zur', 'für', 'über', 'unter', 'durch', 'gegen', 'ohne',
    'um', 'wir', 'sie', 'ihr', 'ihre', 'ihrem', 'ihren', 'ihrer', 'du', 'er', 'es', 'unser',
    'unsere', 'sein', 'haben', 'werden', 'können', 'müssen', 'sollen', 'wollen', 'dürfen', 'ist',
    'sind', 'war', 'waren', 'wird', 'wurde', 'nicht', 'kein', 'keine', 'auch', 'als', 'wie',
    'wenn', 'weil', 'dass', 'ob', 'sowie', 'mehr', 'sehr', 'gut', 'gute', 'guten', 'erfahrung',
    'berufserfahrung', 'jahre', 'jahren', 'arbeit', 'arbeiten', 'team', 'suchen', 'gesucht',
    'stelle', 'position', 'unternehmen', 'kenntnisse', 'anforderungen', 'aufgaben', 'profil',
  ]),
  es: new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'en', 'con',
    'sin', 'por', 'para', 'sobre', 'entre', 'hacia', 'hasta', 'desde', 'durante', 'mediante',
    'y', 'e', 'o', 'u', 'pero', 'sino', 'aunque', 'que', 'quien', 'cual', 'cuyo', 'donde', 'como',
    'cuando', 'nosotros', 'ustedes', 'ellos', 'ellas', 'él', 'ella', 'ser', 'estar', 'tener',
    'haber', 'hacer', 'poder', 'deber', 'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'nuestro',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'no', 'sí', 'más', 'menos', 'muy', 'todo',
    'todos', 'toda', 'todas', 'otro', 'otra', 'otros', 'otras', 'mismo', 'también', 'experiencia',
    'años', 'año', 'trabajo', 'trabajar', 'equipo', 'buscamos', 'busca', 'puesto', 'vacante',
    'empresa', 'habilidades', 'requisitos', 'funciones', 'conocimiento', 'conocimientos', 'buen',
  ]),
  tr: new Set([
    've', 'veya', 'ile', 'için', 'bir', 'bu', 'şu', 'o', 'da', 'de', 'ta', 'te', 'ki', 'mi',
    'mı', 'mu', 'mü', 'ama', 'fakat', 'ancak', 'lakin', 'çünkü', 'gibi', 'kadar', 'göre', 'doğru',
    'karşı', 'önce', 'sonra', 'üzere', 'ait', 'dair', 'rağmen', 'biz', 'siz', 'onlar', 'ben',
    'sen', 'kendi', 'her', 'tüm', 'bütün', 'bazı', 'hiç', 'çok', 'daha', 'en', 'olarak', 'olan',
    'olup', 'olmak', 'var', 'yok', 'değil', 'ise', 'hem', 'yada', 'deneyim', 'deneyimli',
    'tecrübe', 'tecrübeli', 'yıl', 'çalışma', 'ekip', 'takım', 'arıyoruz', 'aranan', 'pozisyon',
    'şirket', 'firma', 'gereksinimler', 'nitelikler', 'görev', 'tanımı', 'iyi', 'ileri', 'sahip',
  ]),
};

const ALL_STOPWORDS = new Set<string>();
for (const set of Object.values(STOPWORDS_BY_LANG)) {
  for (const w of set) {
    ALL_STOPWORDS.add(w);
  }
}

function isStopword(token: string): boolean {
  const cleaned = cleanSurfaceTerm(token);
  if (!cleaned || cleaned.length <= 1) return true;
  if (ALL_STOPWORDS.has(cleaned)) return true;
  if (/^ال[\u0600-\u06FF]{2,}$/.test(cleaned)) {
    const withoutAl = cleaned.slice(2);
    if (STOPWORDS_BY_LANG.ar.has(withoutAl)) return true;
  }
  return false;
}

/**
 * Detect language of resume text among the 6 supported languages
 */
export function detectResumeLanguage(
  cleanText: string,
  fallbackLocale?: DocumentLanguage
): DocumentLanguage {
  if (!cleanText || cleanText.trim().length === 0) return fallbackLocale || 'en';

  // 1. Arabic: check Arabic Unicode characters
  const arabicMatches = cleanText.match(/[\u0600-\u06FF]/g) || [];
  if (arabicMatches.length >= 8 || arabicMatches.length / Math.max(1, cleanText.length) > 0.04) {
    return 'ar';
  }

  const lower = cleanText.toLowerCase();

  // 2. Turkish: check specific characters (ğ, ş, ı, İ) and common resume keywords
  const turkishChars = cleanText.match(/[ğĞıİşŞ]/g) || [];
  const turkishKeywords = ['özet', 'deneyim', 'iş deneyimi', 'eğitim', 'yetenekler', 'beceriler', 'projeler', 'sertifikalar', 'diller', 'hakkımda', 'üniversite'];
  const turkishScore = turkishChars.length * 2 + turkishKeywords.filter((kw) => lower.includes(kw)).length * 3;

  // 3. German: check specific characters (ä, ö, ü, ß) and common resume keywords
  const germanChars = cleanText.match(/[äöüßÄÖÜ]/g) || [];
  const germanKeywords = ['berufserfahrung', 'ausbildung', 'kenntnisse', 'fähigkeiten', 'lebenslauf', 'kurzprofil', 'über mich', 'hochschule', 'sprachen', 'projekte', 'zertifikate'];
  const germanScore = germanChars.length * 2 + germanKeywords.filter((kw) => lower.includes(kw)).length * 3;

  // 4. French: check accented characters and common resume keywords
  const frenchChars = cleanText.match(/[éèêëàâùûîïôçœÉÈÊËÀÂÙÛÎÏÔÇ]/g) || [];
  const frenchKeywords = ['expérience', 'expériences', 'formation', 'compétences', 'langues', 'projets', 'centres d’intérêt', 'profil', 'diplôme', 'coordonnées'];
  const frenchScore = frenchChars.length * 1.5 + frenchKeywords.filter((kw) => lower.includes(kw)).length * 3;

  // 5. Spanish: check accented characters and common resume keywords
  const spanishChars = cleanText.match(/[áéíóúüñ¿¡ÁÉÍÓÚÜÑ]/g) || [];
  const spanishKeywords = ['experiencia laboral', 'experiencia', 'educación', 'formación', 'habilidades', 'idiomas', 'proyectos', 'sobre mí', 'perfil profesional', 'certificaciones'];
  const spanishScore = spanishChars.length * 1.5 + spanishKeywords.filter((kw) => lower.includes(kw)).length * 3;

  const candidates: { lang: DocumentLanguage; score: number }[] = [
    { lang: 'tr' as const, score: turkishScore },
    { lang: 'de' as const, score: germanScore },
    { lang: 'fr' as const, score: frenchScore },
    { lang: 'es' as const, score: spanishScore },
  ].sort((a, b) => b.score - a.score);

  if (candidates[0].score >= 4) {
    return candidates[0].lang;
  }

  return fallbackLocale || 'en';
}

// ============================================================================
// REQUIREMENT 2: DYNAMIC MULTILINGUAL KEYWORD EXTRACTION FROM JOB DESCRIPTION
// ============================================================================
const HIGH_WEIGHT_HEADER_REGEX =
  /\b(requirements?|qualifications?|skills?|tech\s*stack|must\s*have|what\s*you\s*bring|competenc(?:y|ies)|compétences|prérequis|profil\s*recherché|anforderungen|qualifikationen|kenntnisse|requisitos|habilidades|aranan\s*nitelikler|gereksinimler)\b|المتطلبات|المؤهلات|المهارات|شروط\s*الوظيفة|المهارات\s*المطلوبة/i;

const RESPONSIBILITY_HEADER_REGEX =
  /\b(responsibilit(?:y|ies)|duties|what\s*you\s*will\s*do|role\s*overview|missions?|aufgaben|funciones|responsabilidades|görev\s*tanımı)\b|المسؤوليات|المهام\s*الوظيفية/i;

function inferKeywordCategory(term: string, targetRole?: string): string {
  const cleaned = cleanSurfaceTerm(term);
  const catHit = CATALOG_LOOKUP.get(cleaned);
  if (catHit) return catHit.category;

  const synGroup = findSynonymGroup(term);
  if (synGroup) {
    return SYNONYM_CATEGORY_TO_CATALOG_CATEGORY[synGroup.category] || 'Soft & Methodologies';
  }

  const combined = `${cleaned} ${cleanSurfaceTerm(targetRole || '')}`;
  if (
    /\b(account|financ|audit|tax|ledger|invoice|budget|reconcil|bookkeep|ifrs|gaap|fiscal|treasury|cost)\b|محاسب|مالي|ضرائب|مراجع|تدقيق|ميزاني|تكاليف|حسابات|بنك|قيود/.test(
      combined
    )
  ) {
    return 'Finance & Accounting';
  }
  if (
    /\b(market|seo|sem|ppc|campaign|brand|content|social\s*media|ads|copywrit|growth|conversion|analytics)\b|تسويق|اعلان|إعلان|محتو|حملا|سيو|علامه\s*تجاريه|مبيعات/.test(
      combined
    )
  ) {
    return 'Marketing & Growth';
  }
  if (
    /\b(civil|structur|construct|autocad|revit|bim|concrete|site|survey|boq|geotech|primavera|fidic|mep|hvac|architect)\b|مدني|انشائي|إنشائي|معمار|موقع|خرسان|مقاولات|كميات|مساحه|تنفيذ|اشراف|هندس/.test(
      combined
    )
  ) {
    return 'Engineering & Construction';
  }
  if (
    /\b(medic|clinic|patient|hospital|doctor|physician|nurs|icu|emr|ehr|diagnos|therap|health|pharma)\b|طبيب|مرض|سرير|مستشف|علاج|عنايه|طوارئ|صيدل/.test(
      combined
    )
  ) {
    return 'Healthcare & Medical';
  }
  if (
    /\b(human\s*resources|recruit|talent|onboard|payroll|hris|employee\s*relations)\b|موارد\s*بشريه|توظيف|شؤون\s*الموظفين|رواتب/.test(
      combined
    )
  ) {
    return 'HR & Operations';
  }
  return 'Soft & Methodologies';
}

/**
 * Extracts up to 25 top ranked keywords & phrases (1-3 grams) dynamically from a Job Description
 * using multilingual tokenization, 6-language stopwords, position weighting (Title/Requirements),
 * and SKILL_CATALOG / SYNONYM_GROUPS boosting.
 */
export function extractDynamicKeywordsFromJD(
  jobDescription: string,
  targetRole?: string
): ExtractedJDKeyword[] {
  const rawJd = (jobDescription || '').trim();
  if (!rawJd) return [];

  const lines = rawJd.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates = new Map<
    string,
    {
      displayTerm: string;
      normalized: string;
      score: number;
      frequency: number;
      inHighWeightZone: boolean;
      inCatalogOrSynonyms: boolean;
      wordCount: number;
      category: string;
    }
  >();

  const registerCandidate = (
    surface: string,
    weight: number,
    isHighZone: boolean,
    isCatalogBoost: boolean,
    forcedCategory?: string
  ) => {
    const trimmed = surface.trim().replace(/^[,;:.•\-–—()[\]"']+|[,;:.•\-–—()[\]"']+$/g, '').trim();
    if (!trimmed || trimmed.length < 2) return;
    if (/^\d+$/.test(trimmed)) return;

    const synGroup = findSynonymGroup(trimmed);
    const catalogEntry = CATALOG_LOOKUP.get(cleanSurfaceTerm(trimmed));

    const normKey = synGroup
      ? synGroup.id
      : catalogEntry
      ? cleanSurfaceTerm(catalogEntry.keyword)
      : cleanSurfaceTerm(trimmed).replace(/^ال(?=[\u0600-\u06FF]{3,})/, '');

    if (!normKey || normKey.length < 2) return;

    const words = trimmed.split(/\s+/);
    if (words.length === 1 && isStopword(words[0]) && !synGroup && !catalogEntry) {
      return;
    }

    const boostMultiplier = isCatalogBoost || synGroup || catalogEntry ? 1.65 : 1.0;
    const ngramBonus = words.length === 2 ? 1.35 : words.length === 3 ? 1.45 : 1.0;
    const finalAddScore = weight * boostMultiplier * ngramBonus;

    const existing = candidates.get(normKey);
    const preferredDisplay = catalogEntry
      ? catalogEntry.keyword
      : synGroup && cleanSurfaceTerm(trimmed) === cleanSurfaceTerm(synGroup.canonical)
      ? synGroup.canonical
      : trimmed;

    if (existing) {
      existing.score += finalAddScore;
      existing.frequency += 1;
      existing.inHighWeightZone = existing.inHighWeightZone || isHighZone;
      existing.inCatalogOrSynonyms =
        existing.inCatalogOrSynonyms || Boolean(isCatalogBoost || synGroup || catalogEntry);
      if (catalogEntry) {
        existing.displayTerm = catalogEntry.keyword;
      }
    } else {
      candidates.set(normKey, {
        displayTerm: preferredDisplay,
        normalized: normKey,
        score: finalAddScore,
        frequency: 1,
        inHighWeightZone: isHighZone,
        inCatalogOrSynonyms: Boolean(isCatalogBoost || synGroup || catalogEntry),
        wordCount: words.length,
        category: forcedCategory || inferKeywordCategory(trimmed, targetRole),
      });
    }
  };

  let currentZoneMultiplier = 1.2;
  let inHighWeightSection = false;

  lines.forEach((line, idx) => {
    const isTitleLine = idx <= 1;
    if (HIGH_WEIGHT_HEADER_REGEX.test(line)) {
      currentZoneMultiplier = 2.4;
      inHighWeightSection = true;
    } else if (RESPONSIBILITY_HEADER_REGEX.test(line)) {
      currentZoneMultiplier = 1.6;
      inHighWeightSection = false;
    }

    const lineWeight = isTitleLine ? 2.5 : currentZoneMultiplier;
    const isHighZone = isTitleLine || inHighWeightSection || HIGH_WEIGHT_HEADER_REGEX.test(line);
    const normArLine = cleanSurfaceTerm(line);

    // 1. Scan line for known SKILL_CATALOG entries (boosted)
    for (const [category, skills] of Object.entries(SKILL_CATALOG)) {
      for (const skill of skills) {
        const c = countVariantOccurrences(line, normArLine, skill);
        if (c > 0) {
          for (let i = 0; i < c; i++) {
            registerCandidate(skill, lineWeight * 1.3, isHighZone, true, category);
          }
        }
      }
    }

    // 2. Scan line for SYNONYM_GROUPS variants
    for (const group of SYNONYM_GROUPS) {
      if (group.category === 'role_title' && !isTitleLine) continue;
      for (const variant of group.variants) {
        const c = countVariantOccurrences(line, normArLine, variant);
        if (c > 0) {
          registerCandidate(
            variant,
            lineWeight * 1.25,
            isHighZone,
            true,
            SYNONYM_CATEGORY_TO_CATALOG_CATEGORY[group.category]
          );
          break;
        }
      }
    }

    // 3. Dynamic Multilingual Tokenization & N-Gram (1-3) Extraction
    const clauses = line
      .replace(/^[•\-*▪▸◦–+]+\s*/, '')
      .split(/[,;؛،|•()[\]{}]+|\s+(?:and|or|avec|et|und|oder|con|أو|و(?=\s))\s+/i);

    for (const clause of clauses) {
      const rawTokens = clause
        .trim()
        .split(/\s+/)
        .map((tok) =>
          tok.replace(
            /^[^a-zA-Z0-9\u00C0-\u024F\u0600-\u06FF+#.]+|[^a-zA-Z0-9\u00C0-\u024F\u0600-\u06FF+#.&/-]+$/g,
            ''
          )
        )
        .filter(Boolean);

      if (rawTokens.length === 0) continue;

      for (let start = 0; start < rawTokens.length; start++) {
        const firstTok = rawTokens[start];
        if (isStopword(firstTok) || /^\d+$/.test(firstTok)) continue;

        for (let len = 1; len <= 3 && start + len <= rawTokens.length; len++) {
          const slice = rawTokens.slice(start, start + len);
          const lastTok = slice[slice.length - 1];
          if (isStopword(lastTok) || /^\d+$/.test(lastTok)) continue;

          if (len === 3) {
            const mid = cleanSurfaceTerm(slice[1]);
            const allowedMid =
              !isStopword(slice[1]) ||
              ['of', 'and', '&', 'for', 'to', 'in', 'de', 'du', 'des', 'في', 'على', 'من'].includes(mid);
            if (!allowedMid) continue;
          }
          if (len === 2 && isStopword(slice[1])) continue;

          const phrase = slice.join(' ');
          if (len === 1 && phrase.length < 3 && !/^(ai|ml|bi|ui|ux|qa|js|ts|go|c#|r)$/i.test(phrase)) {
            continue;
          }

          registerCandidate(phrase, lineWeight * (len > 1 ? 1.1 : 0.75), isHighZone, false);
        }
      }
    }
  });

  const sorted = Array.from(candidates.values()).sort((a, b) => {
    if (b.inCatalogOrSynonyms !== a.inCatalogOrSynonyms) {
      if (Math.abs(b.score - a.score) < 2.5) {
        return b.inCatalogOrSynonyms ? 1 : -1;
      }
    }
    return b.score - a.score;
  });

  const finalResults: ExtractedJDKeyword[] = [];
  const selectedPhrasesNormalized: string[] = [];

  for (const item of sorted) {
    if (finalResults.length >= 25) break;

    if (
      item.wordCount === 1 &&
      !item.inCatalogOrSynonyms &&
      selectedPhrasesNormalized.some((p) => p.includes(item.normalized) && p !== item.normalized)
    ) {
      continue;
    }

    finalResults.push({
      term: item.displayTerm,
      normalized: item.normalized,
      score: Math.round(item.score * 100) / 100,
      frequency: item.frequency,
      inHighWeightZone: item.inHighWeightZone,
      inCatalogOrSynonyms: item.inCatalogOrSynonyms,
      category: item.category,
    });
    selectedPhrasesNormalized.push(item.normalized);
  }

  return finalResults;
}

// ============================================================================
// REQUIREMENT 3: JOB TITLE MATCH (Headline / Summary & Experience Titles)
// ============================================================================
const ROLE_SENIORITY_MODIFIERS = new Set([
  'senior', 'sr', 'junior', 'jr', 'mid', 'lead', 'principal', 'staff', 'chief', 'head',
  'associate', 'intern', 'trainee', 'entry', 'level', 'specialist', 'manager', 'consultant',
  'اول', 'أول', 'خبير', 'مبتدئ', 'رئيس', 'مدير', 'قائد', 'استشاري', 'أخصائي', 'اخصائي',
]);

export function evaluateJobTitleMatch(
  resumeText: string,
  targetRole: string | undefined,
  lang: DocumentLanguage
): JobTitleMatchFinding {
  const cleanRole = (targetRole || '').trim();
  const isGeneralPlaceholder =
    !cleanRole ||
    /^(general\s*application|تقييم\s*عام|évaluation\s*générale|allgemeine\s*bewertung|evaluación\s*general|genel\s*değerlendirme)$/i.test(
      cleanRole
    );

  if (isGeneralPlaceholder) {
    return {
      status: 'not_provided',
      targetRole: cleanRole,
      matchedInSummary: false,
      matchedInExperience: false,
      scoreImpact: 0,
      message: '',
    };
  }

  const lines = resumeText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const expHeaderIdx = lines.findIndex((l) =>
    /\b(work\s*experience|professional\s*experience|employment\s*history|experience|work\s*history|career\s*history|expérience|berufserfahrung|experiencia|iş\s*deneyimi)\b|الخبرات\s*العملية|الخبرة\s*المهنية|الخبرة\s*العملية|تاريخ\s*العمل|الخبرات/i.test(
      l
    )
  );
  const eduOrSkillsAfterExpIdx =
    expHeaderIdx >= 0
      ? lines.findIndex(
          (l, idx) =>
            idx > expHeaderIdx &&
            /\b(education|academic|skills|technical\s*skills|certifications|projects|formation|ausbildung|educación|eğitim)\b|التعليم|المؤهلات\s*العلمية|المهارات|الشهادات|المشاريع/i.test(
              l
            )
        )
      : -1;

  const summaryZoneText =
    expHeaderIdx > 0
      ? lines.slice(0, expHeaderIdx).join('\n')
      : lines.slice(0, Math.min(8, lines.length)).join('\n');
  const experienceZoneText =
    expHeaderIdx >= 0
      ? lines
          .slice(expHeaderIdx, eduOrSkillsAfterExpIdx > expHeaderIdx ? eduOrSkillsAfterExpIdx : lines.length)
          .join('\n')
      : resumeText;

  const normSummaryAr = cleanSurfaceTerm(summaryZoneText);
  const normExpAr = cleanSurfaceTerm(experienceZoneText);
  const normFullAr = cleanSurfaceTerm(resumeText);

  const exactInSummary = countVariantOccurrences(summaryZoneText, normSummaryAr, cleanRole) > 0;
  const exactInExp = countVariantOccurrences(experienceZoneText, normExpAr, cleanRole) > 0;
  const exactAnywhere =
    exactInSummary || exactInExp || countVariantOccurrences(resumeText, normFullAr, cleanRole) > 0;

  if (exactAnywhere) {
    const messages: Record<DocumentLanguage, string> = {
      ar: `تطابق تام للمسمى الوظيفي المستهدف (${cleanRole}) في السيرة الذاتية.`,
      en: `Exact target job title match ("${cleanRole}") found in your resume.`,
      fr: `Correspondance exacte du titre de poste cible (« ${cleanRole} ») détectée.`,
      de: `Exakte Übereinstimmung des Ziel-Jobtitels („${cleanRole}“) im Lebenslauf gefunden.`,
      es: `Coincidencia exacta del puesto objetivo ("${cleanRole}") encontrada en el CV.`,
      tr: `Hedef iş unvanı ("${cleanRole}") özgeçmişinizde tam olarak eşleşti.`,
    };
    const suggestions: Record<DocumentLanguage, string> = {
      ar: `ننصح بإدراج المسمى الوظيفي "${cleanRole}" في الملخص المهني أيضاً لرفع أولوية الفرز.`,
      en: `Consider also placing "${cleanRole}" directly in your top Professional Summary headline.`,
      fr: `Pensez à inclure « ${cleanRole} » dans votre résumé professionnel en haut du CV.`,
      de: `Fügen Sie „${cleanRole}“ idealerweise auch direkt in Ihr Kurzprofil am Anfang ein.`,
      es: `Considera incluir "${cleanRole}" también en tu resumen profesional superior.`,
      tr: `"${cleanRole}" unvanını üstteki profesyonel özet başlığına da eklemeniz önerilir.`,
    };
    return {
      status: 'exact',
      targetRole: cleanRole,
      matchedInSummary: exactInSummary,
      matchedInExperience: exactInExp,
      matchedVariant: cleanRole,
      scoreImpact: exactInSummary && exactInExp ? 4 : 3,
      message: messages[lang] || messages.en,
      suggestion: !exactInSummary ? suggestions[lang] || suggestions.en : undefined,
    };
  }

  const synMatchSummary = matchTermWithSynonyms(summaryZoneText, cleanRole, normSummaryAr);
  const synMatchExp = matchTermWithSynonyms(experienceZoneText, cleanRole, normExpAr);
  const synMatchFull = matchTermWithSynonyms(resumeText, cleanRole, normFullAr);

  const roleTokens = cleanSurfaceTerm(cleanRole)
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !ROLE_SENIORITY_MODIFIERS.has(t));

  let tokenHitSummary = false;
  let tokenHitExp = false;
  let matchedCoreTokens: string[] = [];

  if (roleTokens.length > 0) {
    const summaryHits = roleTokens.filter((t) => countVariantOccurrences(summaryZoneText, normSummaryAr, t) > 0);
    const expHits = roleTokens.filter((t) => countVariantOccurrences(experienceZoneText, normExpAr, t) > 0);
    const fullHits = roleTokens.filter((t) => countVariantOccurrences(resumeText, normFullAr, t) > 0);
    const synTokenHits = roleTokens.filter((t) => matchTermWithSynonyms(resumeText, t, normFullAr).found);

    const bestHits = fullHits.length >= synTokenHits.length ? fullHits : synTokenHits;
    if (bestHits.length > 0 && bestHits.length / roleTokens.length >= 0.5) {
      tokenHitSummary = summaryHits.length > 0;
      tokenHitExp = expHits.length > 0;
      matchedCoreTokens = bestHits;
    }
  }

  if (synMatchFull.found || matchedCoreTokens.length > 0) {
    const variantFound = synMatchFull.matchedVariant || matchedCoreTokens.join(' ');
    const messages: Record<DocumentLanguage, string> = {
      ar: `تطابق جزئي/مرادف للمسمى الوظيفي (${cleanRole}) عبر "${variantFound}".`,
      en: `Partial / synonym job title match for "${cleanRole}" (found "${variantFound}").`,
      fr: `Correspondance partielle ou synonyme pour « ${cleanRole} » (trouvé : « ${variantFound} »).`,
      de: `Teilweise oder synonyme Übereinstimmung für „${cleanRole}“ (gefunden: „${variantFound}“).`,
      es: `Coincidencia parcial o sinónimo para "${cleanRole}" (se encontró "${variantFound}").`,
      tr: `"${cleanRole}" için kısmi / eş anlamlı unvan eşleşmesi ("${variantFound}" bulundu).`,
    };
    const suggestions: Record<DocumentLanguage, string> = {
      ar: `وجدنا المسمى القريب "${variantFound}"؛ ننصح بكتابة المسمى المستهدف "${cleanRole}" في العنوان الوظيفي أو الملخص المهني لتجاوز الفلترة الحرفية للـ ATS.`,
      en: `We found "${variantFound}"; add the exact target title "${cleanRole}" in your headline or summary so strict ATS title filters match 100%.`,
      fr: `Nous avons trouvé « ${variantFound} » ; ajoutez le titre exact « ${cleanRole} » dans votre titre ou résumé pour les filtres ATS stricts.`,
      de: `Wir haben „${variantFound}“ gefunden; ergänzen Sie den exakten Zieltitel „${cleanRole}“ in der Überschrift oder Zusammenfassung.`,
      es: `Encontramos "${variantFound}"; añade el título exacto "${cleanRole}" en tu titular o resumen para filtros ATS estrictos.`,
      tr: `"${variantFound}" bulundu; katı ATS filtreleri için tam hedef unvan olan "${cleanRole}" ifadesini başlık veya özete ekleyin.`,
    };
    return {
      status: 'partial',
      targetRole: cleanRole,
      matchedInSummary: synMatchSummary.found || tokenHitSummary,
      matchedInExperience: synMatchExp.found || tokenHitExp,
      matchedVariant: variantFound,
      scoreImpact: 1,
      message: messages[lang] || messages.en,
      suggestion: suggestions[lang] || suggestions.en,
    };
  }

  const missingMessages: Record<DocumentLanguage, string> = {
    ar: `المسمى الوظيفي المستهدف (${cleanRole}) غير موجود في الملخص المهني أو مسميات الخبرة.`,
    en: `Target job title "${cleanRole}" is missing from both your summary headline and experience titles.`,
    fr: `Le titre de poste cible « ${cleanRole} » est absent du résumé et des intitulés d'expérience.`,
    de: `Der Ziel-Jobtitel „${cleanRole}“ fehlt sowohl im Profil als auch in den Berufserfahrungen.`,
    es: `El puesto objetivo "${cleanRole}" no aparece ni en el resumen ni en los títulos de experiencia.`,
    tr: `Hedef iş unvanı ("${cleanRole}") profesyonel özette ve deneyim başlıklarında bulunamadı.`,
  };
  const missingSuggestions: Record<DocumentLanguage, string> = {
    ar: `أضف المسمى الوظيفي المستهدف "${cleanRole}" بوضوح في العنوان الرئيسي والملخص المهني لرفع نسبة التطابق في أنظمة الـ ATS.`,
    en: `Include the target role "${cleanRole}" in your resume headline and Professional Summary to pass ATS role-relevance screening.`,
    fr: `Ajoutez l'intitulé « ${cleanRole} » dans l'en-tête et le résumé professionnel pour améliorer le score ATS.`,
    de: `Nehmen Sie den Zieltitel „${cleanRole}“ in Ihre Kopfzeile und Zusammenfassung auf, um das ATS-Screening zu bestehen.`,
    es: `Incluye el puesto objetivo "${cleanRole}" en el encabezado y resumen profesional para superar el filtro ATS.`,
    tr: `ATS rol uyumluluğu taramasını geçmek için "${cleanRole}" unvanını başlığınıza ve profesyonel özetinize ekleyin.`,
  };

  return {
    status: 'missing',
    targetRole: cleanRole,
    matchedInSummary: false,
    matchedInExperience: false,
    scoreImpact: -3,
    message: missingMessages[lang] || missingMessages.en,
    suggestion: missingSuggestions[lang] || missingSuggestions.en,
  };
}

// ============================================================================
// REQUIREMENT 4A: BULLET LENGTH (<6 or >35 words), VERB REPETITION (>2), KEYWORD STUFFING (>5 or >3%)
// ============================================================================
export function auditBulletsAndStuffing(
  resumeText: string,
  keywordsDetected: KeywordMatch[],
  totalWordCount: number,
  lang: DocumentLanguage
): {
  audit: BulletAuditResult;
  weaknessItems: AnalysisWeakness[];
  suggestionStrings: string[];
} {
  const lines = resumeText.split(/\r?\n/);
  const shortBullets: BulletIssueItem[] = [];
  const longBullets: BulletIssueItem[] = [];
  const repeatedVerbs: RepeatedVerbItem[] = [];
  const keywordStuffing: KeywordStuffingItem[] = [];
  const weaknessItems: AnalysisWeakness[] = [];
  const suggestionStrings: string[] = [];

  const sectionHeaderRegex =
    /^(?:[A-Z\s&/]{4,}|(?:work\s*experience|professional\s*experience|experience|education|skills|technical\s*skills|projects|certifications|summary|professional\s*summary|الخبرات\s*العملية|الخبرة\s*المهنية|التعليم|المهارات|المشاريع|الشهادات|الملخص\s*المهني|نبذة\s*عني)[:\s]*)$/i;
  const skillsOrCertSectionRegex =
    /\b(skills|technical\s*skills|core\s*competencies|languages|certifications|interests|hobbies|compétences|langues|kenntnisse|sprachen|habilidades|idiomas|yetenekler|beceriler|diller)\b|المهارات|اللغات|الشهادات|الهوايات/i;

  let currentSection = 'general';
  let inSkillsListSection = false;
  let bulletCounter = 0;

  const sectionVerbCounts = new Map<string, Map<string, { displayVerb: string; count: number }>>();

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const isBulletLine = /^([•\-*▪▸◦–+]|\d+[.)])\s+/.test(trimmed);
    if (!isBulletLine && trimmed.length <= 45 && sectionHeaderRegex.test(trimmed)) {
      currentSection = trimmed.replace(/[:：]+$/, '').trim();
      inSkillsListSection = skillsOrCertSectionRegex.test(currentSection);
      continue;
    }

    if (!isBulletLine) continue;
    const content = trimmed.replace(/^([•\-*▪▸◦–+]|\d+[.)])\s+/, '').trim();
    if (!content) continue;
    if (inSkillsListSection && content.split(',').length >= 3 && content.split(/\s+/).length < 12) {
      continue;
    }

    bulletCounter += 1;
    const words = content.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount < 6) {
      shortBullets.push({
        bulletNumber: bulletCounter,
        wordCount,
        text: content,
      });
    } else if (wordCount > 35) {
      longBullets.push({
        bulletNumber: bulletCounter,
        wordCount,
        text: content,
      });
    }

    if (words.length >= 2) {
      const rawFirstWord = words[0].replace(
        /^[^a-zA-Z\u00C0-\u024F\u0600-\u06FF]+|[^a-zA-Z\u00C0-\u024F\u0600-\u06FF]+$/g,
        ''
      );
      const normVerb = cleanSurfaceTerm(rawFirstWord);
      if (normVerb.length >= 2 && !isStopword(rawFirstWord)) {
        if (!sectionVerbCounts.has(currentSection)) {
          sectionVerbCounts.set(currentSection, new Map());
        }
        const verbMap = sectionVerbCounts.get(currentSection)!;
        const prev = verbMap.get(normVerb);
        if (prev) {
          prev.count += 1;
        } else {
          verbMap.set(normVerb, { displayVerb: rawFirstWord, count: 1 });
        }
      }
    }
  }

  for (const sb of shortBullets) {
    const isAr = lang === 'ar';
    const desc = isAr
      ? `النقطة رقم #${sb.bulletNumber} قصيرة جداً (${sb.wordCount} كلمات — أقل من 6 كلمات).`
      : `Bullet #${sb.bulletNumber} is too short (${sb.wordCount} words — under 6 words).`;
    const sug = isAr
      ? `وسّع النقطة رقم #${sb.bulletNumber} لتشمل الفعل، السياق، والنتيجة الرقمية (بين 6 و35 كلمة).`
      : `Expand Bullet #${sb.bulletNumber} with context and measurable impact (aim for 6–35 words).`;
    weaknessItems.push({
      title: isAr ? `نقطة قصيرة جداً (#${sb.bulletNumber})` : `Short Bullet Point (#${sb.bulletNumber})`,
      description: desc,
      severity: 'medium',
      suggestion: sug,
    });
    suggestionStrings.push(`${desc} ${sug}`);
  }

  for (const lb of longBullets) {
    const isAr = lang === 'ar';
    const desc = isAr
      ? `النقطة رقم #${lb.bulletNumber} طويلة جداً (${lb.wordCount} كلمة — تتجاوز 35 كلمة).`
      : `Bullet #${lb.bulletNumber} is too long (${lb.wordCount} words — exceeds 35 words).`;
    const sug = isAr
      ? `قسّم النقطة رقم #${lb.bulletNumber} إلى نقطتين مركزتين لا تتجاوز كل منهما 35 كلمة.`
      : `Split Bullet #${lb.bulletNumber} into two concise points under 35 words each.`;
    weaknessItems.push({
      title: isAr ? `نقطة طويلة جداً (#${lb.bulletNumber})` : `Overly Long Bullet (#${lb.bulletNumber})`,
      description: desc,
      severity: 'medium',
      suggestion: sug,
    });
    suggestionStrings.push(`${desc} ${sug}`);
  }

  for (const [section, verbMap] of sectionVerbCounts.entries()) {
    for (const [, info] of verbMap.entries()) {
      if (info.count > 2) {
        repeatedVerbs.push({
          verb: info.displayVerb,
          count: info.count,
          section,
        });
        const isAr = lang === 'ar';
        const desc = isAr
          ? `تكرار فعل البداية "${info.displayVerb}" (${info.count} مرات) في نفس القسم.`
          : `Starting verb "${info.displayVerb}" is repeated ${info.count} times in the same section.`;
        const sug = isAr
          ? `نوّع أفعال الحركة في بداية النقاط بدلاً من تكرار "${info.displayVerb}".`
          : `Vary your opening action verbs instead of repeating "${info.displayVerb}".`;
        weaknessItems.push({
          title: isAr ? `تكرار فعل البداية (${info.displayVerb})` : `Repeated Action Verb ("${info.displayVerb}")`,
          description: desc,
          severity: 'low',
          suggestion: sug,
        });
        suggestionStrings.push(`${desc} ${sug}`);
      }
    }
  }

  const seenStuffedNorm = new Set<string>();
  const normArFull = cleanSurfaceTerm(resumeText);

  for (const kw of keywordsDetected) {
    const exactOccurrences = countVariantOccurrences(resumeText, normArFull, kw.keyword);
    const effectiveCount = Math.max(
      exactOccurrences,
      kw.matchedViaSynonym ? countVariantOccurrences(resumeText, normArFull, kw.matchedViaSynonym) : 0
    );
    const densityPercent =
      totalWordCount > 0 ? Math.round((effectiveCount / totalWordCount) * 1000) / 10 : 0;

    if (effectiveCount > 5 || (effectiveCount >= 4 && totalWordCount >= 30 && densityPercent > 3.0)) {
      const norm = normalizeTerm(kw.keyword);
      if (!seenStuffedNorm.has(norm)) {
        seenStuffedNorm.add(norm);
        keywordStuffing.push({
          keyword: kw.keyword,
          count: effectiveCount,
          densityPercent,
        });
      }
    }
  }

  const rawTokens = resumeText
    .split(/\s+/)
    .map((t) =>
      t.replace(/^[^a-zA-Z0-9\u00C0-\u024F\u0600-\u06FF+#.]+|[^a-zA-Z0-9\u00C0-\u024F\u0600-\u06FF+#.]+$/g, '')
    )
    .filter((t) => t.length >= 3 && !/^\d+$/.test(t) && !isStopword(t));

  const tokenFreq = new Map<string, { display: string; count: number }>();
  for (const tok of rawTokens) {
    const cleaned = cleanSurfaceTerm(tok);
    if (!cleaned || cleaned.length < 3 || isStopword(cleaned)) continue;
    const prev = tokenFreq.get(cleaned);
    if (prev) {
      prev.count += 1;
    } else {
      tokenFreq.set(cleaned, { display: tok, count: 1 });
    }
  }

  for (const [cleaned, info] of tokenFreq.entries()) {
    const norm = normalizeTerm(cleaned);
    if (seenStuffedNorm.has(norm)) continue;
    const densityPercent =
      totalWordCount > 0 ? Math.round((info.count / totalWordCount) * 1000) / 10 : 0;
    if (info.count > 5 || (info.count >= 4 && totalWordCount >= 30 && densityPercent > 3.0)) {
      seenStuffedNorm.add(norm);
      keywordStuffing.push({
        keyword: info.display,
        count: info.count,
        densityPercent,
      });
    }
  }

  for (const ks of keywordStuffing) {
    const isAr = lang === 'ar';
    const desc = isAr
      ? `المصطلح "${ks.keyword}" تكرر بشكل غير طبيعي (${ks.count} مرات — ${ks.densityPercent}% من النص).`
      : `Keyword "${ks.keyword}" is repeated unnaturally (${ks.count} times — ${ks.densityPercent}% of text).`;
    const sug = isAr
      ? `قلل تكرار "${ks.keyword}" إلى 3–5 مرات طبيعية لتجنب عقوبات حشو الكلمات (Keyword Stuffing).`
      : `Reduce "${ks.keyword}" frequency to 3–5 natural mentions to avoid ATS keyword stuffing penalties.`;
    weaknessItems.push({
      title: isAr ? `حشو الكلمات المفتاحية (${ks.keyword})` : `Keyword Stuffing Detected ("${ks.keyword}")`,
      description: desc,
      severity: 'high',
      suggestion: sug,
    });
    suggestionStrings.push(`${desc} ${sug}`);
  }

  return {
    audit: {
      totalBullets: bulletCounter,
      shortBullets,
      longBullets,
      repeatedVerbs,
      keywordStuffing,
    },
    weaknessItems,
    suggestionStrings,
  };
}

// ============================================================================
// REQUIREMENT 4B: MULTILINGUAL DATES, REVERSE CHRONOLOGY, GAPS (>6m) & YEARS OF EXPERIENCE
// ============================================================================
const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
  janv: 1, janvier: 1,
  févr: 2, fevr: 2, février: 2, fevrier: 2,
  mars: 3,
  avr: 4, avril: 4,
  mai: 5,
  juin: 6,
  juil: 7, juillet: 7,
  août: 8, aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  déc: 12, decembre: 12, décembre: 12,
  januar: 1, jänner: 1,
  februar: 2,
  märz: 3, maerz: 3, mrz: 3,
  juni: 6,
  juli: 7,
  oktober: 10, okt: 10,
  dezember: 12, dez: 12,
  ene: 1, enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4, abr: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  ago: 8, agosto: 8,
  setiembre: 9, septiembre: 9,
  octubre: 10,
  noviembre: 11,
  dic: 12, diciembre: 12,
  ocak: 1,
  şubat: 2, subat: 2,
  mart: 3,
  nisan: 4,
  mayıs: 5, mayis: 5,
  haziran: 6,
  temmuz: 7,
  ağustos: 8, agustos: 8,
  eylül: 9, eylul: 9,
  ekim: 10,
  kasım: 11, kasim: 11,
  aralık: 12, aralik: 12,
  [normalizeArabicText('يناير')]: 1,
  [normalizeArabicText('كانون الثاني')]: 1,
  [normalizeArabicText('فبراير')]: 2,
  [normalizeArabicText('شباط')]: 2,
  [normalizeArabicText('مارس')]: 3,
  [normalizeArabicText('آذار')]: 3,
  [normalizeArabicText('أبريل')]: 4,
  [normalizeArabicText('نيسان')]: 4,
  [normalizeArabicText('مايو')]: 5,
  [normalizeArabicText('أيار')]: 5,
  [normalizeArabicText('يونيو')]: 6,
  [normalizeArabicText('حزيران')]: 6,
  [normalizeArabicText('يوليو')]: 7,
  [normalizeArabicText('تموز')]: 7,
  [normalizeArabicText('أغسطس')]: 8,
  [normalizeArabicText('آب')]: 8,
  [normalizeArabicText('سبتمبر')]: 9,
  [normalizeArabicText('أيلول')]: 9,
  [normalizeArabicText('أكتوبر')]: 10,
  [normalizeArabicText('تشرين الأول')]: 10,
  [normalizeArabicText('نوفمبر')]: 11,
  [normalizeArabicText('تشرين الثاني')]: 11,
  [normalizeArabicText('ديسمبر')]: 12,
  [normalizeArabicText('كانون الأول')]: 12,
};

function convertEasternArabicNumerals(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

function isPresentToken(raw: string): boolean {
  const norm = cleanSurfaceTerm(raw);
  return /^(present|current|now|ongoing|till\s*date|to\s*date|الان|حتي\s*الان|لغايه\s*الان|الحالي|حالي|مستمر|aujourd'hui|aujourd’hui|présent|actuel|en\s*cours|heute|gegenwart|aktuell|bis\s*heute|jetzt|actualidad|presente|actual|hasta\s*la\s*fecha|günümüz|gunumuz|halen|devam\s*ediyor|şu\s*an)$/.test(
    norm
  );
}

function parseSingleDateEndpoint(
  rawEndpoint: string,
  isEnd: boolean,
  nowYear: number,
  nowMonth: number
): { year: number; month: number; isCurrent: boolean } | null {
  const str = convertEasternArabicNumerals(rawEndpoint).trim();
  if (!str) return null;

  if (isPresentToken(str)) {
    return { year: nowYear, month: nowMonth, isCurrent: true };
  }

  const mmYyyy = str.match(/^(\d{1,2})\s*[/.-]\s*(19\d{2}|20\d{2})$/);
  if (mmYyyy) {
    const m = Math.min(12, Math.max(1, parseInt(mmYyyy[1], 10)));
    const y = parseInt(mmYyyy[2], 10);
    return { year: y, month: m, isCurrent: false };
  }

  const yyyyMm = str.match(/^(19\d{2}|20\d{2})\s*[/.-]\s*(\d{1,2})$/);
  if (yyyyMm) {
    const y = parseInt(yyyyMm[1], 10);
    const m = Math.min(12, Math.max(1, parseInt(yyyyMm[2], 10)));
    return { year: y, month: m, isCurrent: false };
  }

  const monthYear = str.match(/^([a-zA-Z\u00C0-\u024F\u0600-\u06FF.\s]+?)\s*,?\s*(19\d{2}|20\d{2})$/);
  if (monthYear) {
    const rawM = cleanSurfaceTerm(monthYear[1].replace(/\./g, ''));
    const monthNum = MONTH_NAME_TO_NUMBER[rawM];
    if (monthNum) {
      return { year: parseInt(monthYear[2], 10), month: monthNum, isCurrent: false };
    }
  }

  const yyyyOnly = str.match(/^(19\d{2}|20\d{2})$/);
  if (yyyyOnly) {
    return {
      year: parseInt(yyyyOnly[1], 10),
      month: isEnd ? 12 : 1,
      isCurrent: false,
    };
  }

  return null;
}

function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function auditDatesAndChronology(
  resumeText: string,
  lang: DocumentLanguage
): {
  audit: DatesAuditResult;
  weaknessItems: AnalysisWeakness[];
  suggestionStrings: string[];
} {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  const lines = resumeText.split(/\r?\n/);
  const weaknessItems: AnalysisWeakness[] = [];
  const suggestionStrings: string[] = [];

  const expHeaderRegex =
    /^(?:work\s*experience|professional\s*experience|employment\s*history|experience|work\s*history|career\s*history|expérience\s*professionnelle|expérience|berufserfahrung|erfahrung|experiencia\s*laboral|experiencia\s*profesional|experiencia|iş\s*deneyimi|deneyim|الخبرات\s*العملية|الخبرة\s*المهنية|الخبرة\s*العملية|تاريخ\s*العمل|الخبرات)[:\s]*$/i;
  const nonExpHeaderRegex =
    /^(?:education|academic\s*background|certifications|licenses|projects|skills|technical\s*skills|languages|awards|publications|volunteering|formation|études|ausbildung|studium|educación|formación|eğitim|sertifikalar|التعليم|المؤهلات\s*العلمية|الشهادات|الدورات|المشاريع|المهارات|اللغات)[:\s]*$/i;

  let currentZone: 'pre' | 'experience' | 'other' = 'pre';
  const hasExplicitExpHeader = lines.some((l) => expHeaderRegex.test(l.trim()));

  const dateTokenPattern =
    '(?:\\d{1,2}\\s*[/.-]\\s*(?:19|20)\\d{2}|(?:19|20)\\d{2}\\s*[/.-]\\s*\\d{1,2}|[a-zA-Z\\u00C0-\\u024F\\u0600-\\u06FF.]+(?:\\s+[a-zA-Z\\u00C0-\\u024F\\u0600-\\u06FF.]+)?\\s*,?\\s*(?:19|20)\\d{2}|(?:19|20)\\d{2})';
  const endTokenPattern = `(?:${dateTokenPattern}|present|current|now|ongoing|till\\s*date|to\\s*date|الآن|الان|حتى\\s*الآن|حتي\\s*الان|لغاية\\s*الآن|الحالي|حالي|مستمر|aujourd['’]hui|présent|actuel|en\\s*cours|heute|gegenwart|aktuell|bis\\s*heute|actualidad|presente|actual|hasta\\s*la\\s*fecha|günümüz|gunumuz|halen|devam\\s*ediyor)`;
  const rangeSepPattern = '(?:\\s*(?:[-–—]|to|until|till|إلى|الى|حتى|حتي|à|au|bis|a|hasta)\\s*)';
  const fullRangeRegex = new RegExp(`(${dateTokenPattern})${rangeSepPattern}(${endTokenPattern})`, 'gi');

  const experienceRanges: DetectedDateRange[] = [];
  const allRanges: DetectedDateRange[] = [];

  lines.forEach((rawLine, idx) => {
    const trimmed = rawLine.trim();
    if (!trimmed) return;

    if (expHeaderRegex.test(trimmed)) {
      currentZone = 'experience';
      return;
    }
    if (nonExpHeaderRegex.test(trimmed)) {
      currentZone = 'other';
      return;
    }

    const westernLine = convertEasternArabicNumerals(trimmed);
    let match: RegExpExecArray | null;
    fullRangeRegex.lastIndex = 0;

    while ((match = fullRangeRegex.exec(westernLine)) !== null) {
      const rawFull = match[0].trim();
      const rawStart = match[1].trim();
      const rawEnd = match[2].trim();

      const parsedStart = parseSingleDateEndpoint(rawStart, false, nowYear, nowMonth);
      const parsedEnd = parseSingleDateEndpoint(rawEnd, true, nowYear, nowMonth);

      if (!parsedStart || !parsedEnd) continue;
      const startTotalMonths = parsedStart.year * 12 + parsedStart.month;
      const endTotalMonths = parsedEnd.year * 12 + parsedEnd.month;
      if (endTotalMonths < startTotalMonths) continue;

      const detected: DetectedDateRange = {
        raw: rawFull,
        startYear: parsedStart.year,
        startMonth: parsedStart.month,
        endYear: parsedEnd.year,
        endMonth: parsedEnd.month,
        startLabel: formatYearMonth(parsedStart.year, parsedStart.month),
        endLabel: parsedEnd.isCurrent ? 'Present' : formatYearMonth(parsedEnd.year, parsedEnd.month),
        isCurrent: parsedEnd.isCurrent,
        lineIndex: idx,
      };

      allRanges.push(detected);

      const isEducationLine =
        /\b(bachelor|master|phd|b\.?sc|m\.?sc|b\.?a|m\.?b\.?a|university|college|school|gpa|diploma|degree)\b|بكالوريوس|ماجستير|دكتوراه|جامعة|جامعه|كلية|كليه|ثانوية|معهد/i.test(
          westernLine
        );

      if (
        (currentZone === 'experience' || (!hasExplicitExpHeader && currentZone !== 'other')) &&
        !isEducationLine
      ) {
        experienceRanges.push(detected);
      }
    }
  });

  let isReverseChronological = true;
  const chronologyIssues: string[] = [];

  for (let i = 0; i < experienceRanges.length - 1; i++) {
    const upper = experienceRanges[i];
    const lower = experienceRanges[i + 1];
    const upperStartVal = upper.startYear * 12 + upper.startMonth;
    const lowerStartVal = lower.startYear * 12 + lower.startMonth;
    const upperEndVal = upper.endYear * 12 + upper.endMonth;
    const lowerEndVal = lower.endYear * 12 + lower.endMonth;

    if (lowerStartVal > upperStartVal && lowerEndVal > upperEndVal) {
      isReverseChronological = false;
      chronologyIssues.push(`${upper.raw} -> ${lower.raw}`);
    }
  }

  if (!isReverseChronological) {
    const isAr = lang === 'ar';
    const desc = isAr
      ? `الخبرات العملية غير مرتبة ترتيباً زمنياً عكسياً (${chronologyIssues[0]}).`
      : `Work experience is not in reverse chronological order (${chronologyIssues[0]}).`;
    const sug = isAr
      ? 'رتّب خبراتك العملية من الأحدث إلى الأقدم لضمان قراءة صحيحة في أنظمة الـ ATS.'
      : 'Order your work history from newest to oldest role for standard ATS timeline parsing.';
    weaknessItems.push({
      title: isAr ? 'خلل في الترتيب الزمني العكسي' : 'Reverse Chronological Order Issue',
      description: desc,
      severity: 'medium',
      suggestion: sug,
    });
    suggestionStrings.push(`${desc} ${sug}`);
  }

  const gaps: EmploymentGapItem[] = [];
  let totalMonths = 0;

  if (experienceRanges.length > 0) {
    const sortedAsc = [...experienceRanges].sort(
      (a, b) => a.startYear * 12 + a.startMonth - (b.startYear * 12 + b.startMonth)
    );

    const merged: {
      startVal: number;
      endVal: number;
      startYear: number;
      startMonth: number;
      endYear: number;
      endMonth: number;
    }[] = [];

    for (const r of sortedAsc) {
      const sVal = r.startYear * 12 + r.startMonth;
      const eVal = r.endYear * 12 + r.endMonth;
      if (merged.length === 0) {
        merged.push({
          startVal: sVal,
          endVal: eVal,
          startYear: r.startYear,
          startMonth: r.startMonth,
          endYear: r.endYear,
          endMonth: r.endMonth,
        });
      } else {
        const last = merged[merged.length - 1];
        if (sVal <= last.endVal + 1) {
          if (eVal > last.endVal) {
            last.endVal = eVal;
            last.endYear = r.endYear;
            last.endMonth = r.endMonth;
          }
        } else {
          const gapMonths = sVal - last.endVal;
          if (gapMonths > 6) {
            gaps.push({
              from: formatYearMonth(last.endYear, last.endMonth),
              to: formatYearMonth(r.startYear, r.startMonth),
              months: gapMonths,
            });
          }
          merged.push({
            startVal: sVal,
            endVal: eVal,
            startYear: r.startYear,
            startMonth: r.startMonth,
            endYear: r.endYear,
            endMonth: r.endMonth,
          });
        }
      }
    }

    for (const interval of merged) {
      totalMonths += Math.max(1, interval.endVal - interval.startVal + 1);
    }
  }

  for (const gap of gaps) {
    const isAr = lang === 'ar';
    const desc = isAr
      ? `تم رصد فجوة زمنية مدتها ${gap.months} شهراً بين ${gap.from} و ${gap.to} (أكثر من 6 أشهر).`
      : `Detected a ${gap.months}-month employment gap between ${gap.from} and ${gap.to} (>6 months).`;
    const sug = isAr
      ? 'وضّح سبب الانقطاع المهني (عمل حر، دراسة، أو مشاريع مستقلة) لتجنب التساؤلات أثناء الفرز.'
      : 'Consider addressing employment gaps >6 months by listing freelance work, certifications, or independent projects.';
    weaknessItems.push({
      title: isAr ? `فجوة زمنية في الخبرة (${gap.months} شهراً)` : `Employment Gap Detected (${gap.months} months)`,
      description: desc,
      severity: 'low',
      suggestion: sug,
    });
    suggestionStrings.push(`${desc} ${sug}`);
  }

  let yearsOfExperience = Math.round((totalMonths / 12) * 10) / 10;
  if (yearsOfExperience === 0) {
    const westernResume = convertEasternArabicNumerals(resumeText);
    const proseMatch =
      westernResume.match(
        /(\d{1,2})\+?\s*(?:years?\s+of\s+experience|ans\s+d['’]expérience|jahren?\s+berufserfahrung|años\s+de\s+experiencia|yıl\s+deneyim)/i
      ) ||
      westernResume.match(/خبر[ةه]\s*(?:تزيد\s*عن\s*|أكثر\s*من\s*)?(\d{1,2})\s*(?:سنوات|سنة|سنه|أعوام)/i) ||
      westernResume.match(/(\d{1,2})\+?\s*(?:سنوات|سنة|سنه)\s*(?:من\s*)?الخبر[ةه]/i);
    if (proseMatch) {
      yearsOfExperience = parseInt(proseMatch[1], 10);
      totalMonths = yearsOfExperience * 12;
    }
  }

  return {
    audit: {
      yearsOfExperience,
      totalMonths,
      isReverseChronological,
      chronologyIssues,
      gaps,
      rangesDetected: experienceRanges.length > 0 ? experienceRanges : allRanges,
    },
    weaknessItems,
    suggestionStrings,
  };
}

/**
 * Real ATS Resume Analyzer Engine with Full Multilingual Support,
 * Synonym/Acronym Matching, Dynamic JD Extraction, Job Title Match, and Bullet & Chronology Audits.
 */
export function analyzeResumeText(
  resumeText: string,
  targetRole?: string,
  targetJobDescription?: string,
  locale?: DocumentLanguage
): ATSAnalysisResult {
  const cleanText = resumeText || '';
  const lowerText = cleanText.toLowerCase();
  const detectedLanguage = detectResumeLanguage(cleanText, locale);
  const reportLang: DocumentLanguage = locale || detectedLanguage;
  const isAr = reportLang === 'ar';
  const normalizedArabicResume = cleanSurfaceTerm(cleanText);

  // 1. Basic Metrics
  const words = cleanText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeSeconds = Math.max(5, Math.round((wordCount / 180) * 60));
  const readingTimeString = `${(readingTimeSeconds / 60).toFixed(1)}m`;

  // 2. Contact Information Audit (Multilingual locations & headers)
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = cleanText.match(emailRegex);
  const hasEmail = !!emailMatch;
  const email = emailMatch ? emailMatch[1] : undefined;

  const phoneRegex = /(\+?\d{1,4}[\s.-]?)?(\(?\d{2,4}\)[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/;
  const phoneMatch = cleanText.match(phoneRegex);
  const hasPhone = !!phoneMatch;
  const phone = phoneMatch ? phoneMatch[0] : undefined;

  const linkedInRegex = /(linkedin\.com\/in\/[a-zA-Z0-9_-]+|linkedin)/i;
  const linkedInMatch = cleanText.match(linkedInRegex);
  const hasLinkedIn = !!linkedInMatch;
  const linkedIn = linkedInMatch ? linkedInMatch[0] : undefined;

  const gitHubRegex = /(github\.com\/[a-zA-Z0-9_-]+|github)/i;
  const hasGitHub = gitHubRegex.test(cleanText);

  const locationRegex =
    /\b(remote|cairo|القاهرة|dubai|دبي|riyadh|الرياض|london|new york|san francisco|california|egypt|مصر|uae|الإمارات|usa|uk|germany|deutschland|ألمانيا|berlin|munich|münchen|frankfurt|paris|france|madrid|barcelona|spain|españa|istanbul|ankara|turkey|türkiye|toronto|canada|سعودية|السعودية)\b/i;
  const hasLocation =
    locationRegex.test(cleanText) ||
    /(address|location|city|country|adresse|ville|pays|stadt|ort|land|dirección|ciudad|país|adres|şehir|ülke|العنوان|المدينة|الدولة|الموقع)/i.test(
      cleanText
    );

  let contactCount = 0;
  if (hasEmail) contactCount += 25;
  if (hasPhone) contactCount += 25;
  if (hasLinkedIn) contactCount += 25;
  if (hasLocation || hasGitHub) contactCount += 25;
  const contactScore = contactCount;

  // 3. Multilingual Section Audit across all 6 supported languages
  const sectionsToCheck = [
    {
      name: 'Summary / Objective',
      regex:
        /\b(summary|professional summary|profile|about me|objective|résumé|profil|profil professionnel|à propos|objectif|zusammenfassung|kurzprofil|über mich|ziel|resumen|perfil|perfil profesional|sobre mí|özet|hakkımda|kariyer hedefi)\b|ملخص|الملخص المهني|نبذة|نبذة شخصية|الهدف المهني|الملف الشخصي/i,
    },
    {
      name: 'Experience / Work History',
      regex:
        /\b(experience|work experience|employment|history|work history|expérience|expériences|expérience professionnelle|parcours professionnel|berufserfahrung|erfahrung|beruflicher werdegang|arbeitserfahrung|experiencia|experiencia laboral|experiencia profesional|historial laboral|deneyim|iş deneyimi|tecrübe|çalışma geçmişi)\b|الخبرة|الخبرات|الخبرة المهنية|الخبرات العملية|خبرات العمل|تاريخ العمل/i,
    },
    {
      name: 'Education',
      regex:
        /\b(education|academic|university|degree|bachelor|master|phd|diploma|formation|éducation|diplômes|université|baccalauréat|licence|doctorat|ausbildung|studium|abschluss|universität|doktor|educación|formación|estudios|universidad|título|licenciatura|grado|máster|eğitim|akademik|üniversite|lisans|yüksek lisans|doktora)\b|التعليم|المؤهلات|المؤهل الدراسي|الجامعة|جامعة|درجة|بكالوريوس|ماجستير|دكتوراه|دبلوم/i,
    },
    {
      name: 'Skills / Technical Stack',
      regex:
        /\b(skills|technical skills|technologies|tools|stack|competencies|compétences|compétences techniques|aptitudes|kenntnisse|fähigkeiten|it-kenntnisse|kompetenzen|habilidades|habilidades técnicas|competencias|herramientas|beceriler|yetenekler|teknik beceriler|yetkinlikler)\b|المهارات|المهارات التقنية|المهارات الفنية|التقنيات|الأدوات|الكفاءات/i,
    },
    {
      name: 'Projects / Portfolio',
      regex:
        /\b(projects|personal projects|portfolio|key projects|projets|réalisations|projets clés|projekte|ausgewählte projekte|proyectos|proyectos destacados|portafolio|projeler|önemli projeler|portföy)\b|المشاريع|مشاريع سابقة|أبرز المشاريع|معرض الأعمال/i,
    },
    {
      name: 'Certifications / Awards',
      regex:
        /\b(certifications|certificates|licenses|awards|honors|credentials|certificats|licences|prix|distinctions|zertifikate|zertifizierungen|weiterbildung|auszeichnungen|certificados|premios|reconocimientos|sertifikalar|belgeler|lisanslar|ödüller)\b|الشهادات|الدورات التدريبية|الرخص|الجوائز|شهادات التقدير|الاعتمادات/i,
    },
  ];

  const sectionsDetected = sectionsToCheck.map((s) => ({
    name: s.name,
    found: s.regex.test(cleanText),
  }));

  const foundSectionsCount = sectionsDetected.filter((s) => s.found).length;
  const structureScore = Math.min(100, Math.round((foundSectionsCount / 5) * 100));

  // 4. Quantifiable Metrics Detection (Supports %, $, €, £, multilingual scale words)
  const metricRegex =
    /(\b\d+(\.\d+)?%|[\$€£]\s?\d+[\d,]*(\.\d+)?([kKmMbB])?|\b\d+([kKmM])\+?\b|\b\d{2,}\+?\s*(users|clients|customers|requests|transactions|projects|engineers|members|downloads|utilisateurs|projets|kunden|projekte|usuarios|proyectos|kullanıcı|proje|عملاء|مستخدمين|مشاريع|مهندسين|خدمة|فرعاً|فرع)\b|improved by \d+|reduced by \d+|increased by \d+|augmenté de \d+|réduit de \d+|gesteigert um \d+|reduziert um \d+|aumentado en \d+|reducido en \d+|oranında artırıldı|بنسبة \d+)/gi;
  const matchedMetrics = cleanText.match(metricRegex) || [];
  const quantifiedMetricsCount = matchedMetrics.length;

  // 5. Action Verbs vs Weak Verbs
  const actionVerbsFound: string[] = [];
  const verbsToCheck = Array.from(
    new Set([...POWER_VERBS, ...(MULTILINGUAL_POWER_VERBS[detectedLanguage] || [])])
  );

  verbsToCheck.forEach((verb) => {
    const isVerbArabic = /[\u0600-\u06FF]/.test(verb);
    const regex = isVerbArabic
      ? new RegExp(`(^|\\s|[.,;•\\-*])${verb}(\\s|[.,;]|$)`, 'i')
      : new RegExp(`\\b${verb}\\b`, 'i');
    if (regex.test(cleanText)) {
      actionVerbsFound.push(verb.charAt(0).toUpperCase() + verb.slice(1));
    }
  });

  const weakVerbsFound: string[] = [];
  WEAK_PHRASES.forEach((phrase) => {
    if (lowerText.includes(phrase)) {
      weakVerbsFound.push(phrase);
    }
  });

  // Bullet points count
  const bulletLines = cleanText.split('\n').filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('•') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('*') ||
      /^\d+\./.test(trimmed)
    );
  });
  const bulletCount =
    bulletLines.length > 0 ? bulletLines.length : Math.max(3, Math.round(words.length / 25));

  // 6. Real Keywords Extraction with Synonym & Acronym Support (Requirements 1 & 2)
  const keywordsDetected: KeywordMatch[] = [];
  const detectedNormSet = new Set<string>();
  const synonymAdviceMessages: { foundVariant: string; missingForm: string; message: string }[] = [];
  const emittedSynonymAdviceKeys = new Set<string>();

  const recordSynonymAdviceIfNeeded = (matchRes: SynonymMatchResult) => {
    if (matchRes.found && matchRes.matchedVariant && matchRes.recommendedFormToAdd) {
      const adviceKey = `${cleanSurfaceTerm(matchRes.matchedVariant)}->${cleanSurfaceTerm(matchRes.recommendedFormToAdd)}`;
      if (!emittedSynonymAdviceKeys.has(adviceKey)) {
        emittedSynonymAdviceKeys.add(adviceKey);
        synonymAdviceMessages.push({
          foundVariant: matchRes.matchedVariant,
          missingForm: matchRes.recommendedFormToAdd,
          message: formatSynonymAdvice(
            matchRes.matchedVariant,
            matchRes.recommendedFormToAdd,
            Boolean(matchRes.isAcronymToFullNameAdvice),
            reportLang
          ),
        });
      }
    }
  };

  Object.entries(SKILL_CATALOG).forEach(([category, skills]) => {
    skills.forEach((skill) => {
      const normKey = normalizeTerm(skill);
      if (detectedNormSet.has(normKey)) return;

      const synMatch = matchTermWithSynonyms(cleanText, skill, normalizedArabicResume);
      if (synMatch.found) {
        detectedNormSet.add(normKey);
        keywordsDetected.push({
          keyword: skill,
          count: synMatch.totalCount,
          importance:
            synMatch.totalCount >= 3 ? 'high' : synMatch.totalCount === 2 ? 'medium' : 'low',
          category,
          matchedViaSynonym: !synMatch.exactFormFound ? synMatch.matchedVariant : undefined,
          recommendedFormToAdd: synMatch.recommendedFormToAdd,
          source: 'catalog',
        });
        recordSynonymAdviceIfNeeded(synMatch);
      }
    });
  });

  for (const group of SYNONYM_GROUPS) {
    if (group.category === 'role_title') continue;
    if (detectedNormSet.has(group.id)) continue;

    const synMatch = matchTermWithSynonyms(cleanText, group.canonical, normalizedArabicResume);
    if (synMatch.found) {
      detectedNormSet.add(group.id);
      keywordsDetected.push({
        keyword: group.canonical,
        count: synMatch.totalCount,
        importance:
          synMatch.totalCount >= 3 ? 'high' : synMatch.totalCount === 2 ? 'medium' : 'low',
        category: SYNONYM_CATEGORY_TO_CATALOG_CATEGORY[group.category] || 'Soft & Methodologies',
        matchedViaSynonym: !synMatch.exactFormFound ? synMatch.matchedVariant : undefined,
        recommendedFormToAdd: synMatch.recommendedFormToAdd,
        source: 'catalog',
      });
      recordSynonymAdviceIfNeeded(synMatch);
    }
  }

  // 7. Dynamic JD Keyword Extraction & Missing Keywords Detection
  let extractedJdKeywords: ExtractedJDKeyword[] = [];
  let missingKeywords: string[] = [];
  let matchedJdCount = 0;

  if (targetJobDescription && targetJobDescription.trim().length > 10) {
    extractedJdKeywords = extractDynamicKeywordsFromJD(targetJobDescription, targetRole);

    for (const jdKw of extractedJdKeywords) {
      const synMatch = matchTermWithSynonyms(cleanText, jdKw.term, normalizedArabicResume);
      if (synMatch.found) {
        matchedJdCount += 1;
        recordSynonymAdviceIfNeeded(synMatch);

        const normKey = normalizeTerm(jdKw.term);
        const existingKw = keywordsDetected.find((k) => normalizeTerm(k.keyword) === normKey);
        if (existingKw) {
          existingKw.source = 'both';
          if (!synMatch.exactFormFound && synMatch.matchedVariant) {
            existingKw.matchedViaSynonym = synMatch.matchedVariant;
            existingKw.recommendedFormToAdd = jdKw.term;
          }
        } else {
          detectedNormSet.add(normKey);
          keywordsDetected.push({
            keyword: jdKw.term,
            count: synMatch.totalCount,
            importance:
              synMatch.totalCount >= 3 ? 'high' : synMatch.totalCount === 2 ? 'medium' : 'low',
            category: jdKw.category,
            matchedViaSynonym: !synMatch.exactFormFound ? synMatch.matchedVariant : undefined,
            recommendedFormToAdd: synMatch.recommendedFormToAdd,
            source: 'jd',
          });
        }
      } else {
        missingKeywords.push(jdKw.term);
      }
    }
  } else {
    const categoryCounts: { [cat: string]: number } = {};
    keywordsDetected.forEach((k) => {
      categoryCounts[k.category] = (categoryCounts[k.category] || 0) + 1;
    });

    const inferredCat = inferKeywordCategory('', targetRole);
    const topCategory =
      Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      (inferredCat !== 'Soft & Methodologies' ? inferredCat : 'Frontend & Web');

    const domainSkills = SKILL_CATALOG[topCategory] || SKILL_CATALOG['Frontend & Web'];
    missingKeywords = domainSkills
      .filter((s) => !matchTermWithSynonyms(cleanText, s, normalizedArabicResume).found)
      .slice(0, 6);

    if (topCategory === 'Frontend & Web' || topCategory === 'Backend & Systems') {
      ['CI/CD', 'Docker', 'Agile', 'Unit Testing', 'TypeScript'].forEach((fallback) => {
        if (
          !matchTermWithSynonyms(cleanText, fallback, normalizedArabicResume).found &&
          !missingKeywords.includes(fallback)
        ) {
          missingKeywords.push(fallback);
        }
      });
    }
    missingKeywords = missingKeywords.slice(0, 6);
  }

  keywordsDetected.sort((a, b) => b.count - a.count);

  // 8. Requirement 3 & 4: Job Title Match + Bullet & Dates Audits
  const jobTitleMatch = evaluateJobTitleMatch(cleanText, targetRole, reportLang);

  const {
    audit: bulletAudit,
    weaknessItems: bulletWeaknesses,
    suggestionStrings: bulletSuggestions,
  } = auditBulletsAndStuffing(cleanText, keywordsDetected, wordCount, reportLang);

  const {
    audit: datesAudit,
    weaknessItems: dateWeaknesses,
    suggestionStrings: dateSuggestions,
  } = auditDatesAndChronology(cleanText, reportLang);

  // 9. Compute Detailed Pillar Subscores
  const keywordCount = keywordsDetected.length;
  let keywordsScore = Math.min(
    100,
    Math.max(wordCount < 25 ? 10 : 35, Math.round((keywordCount / 12) * 100))
  );
  if (extractedJdKeywords.length > 0) {
    const jdRatio = matchedJdCount / extractedJdKeywords.length;
    keywordsScore = Math.min(
      100,
      Math.max(keywordsScore, Math.round(jdRatio * 85 + Math.min(15, keywordCount * 1.5)))
    );
  }

  let contentQuality = 40;
  contentQuality += Math.min(30, quantifiedMetricsCount * 6);
  contentQuality += Math.min(25, actionVerbsFound.length * 3);
  if (weakVerbsFound.length > 0) contentQuality -= Math.min(15, weakVerbsFound.length * 4);
  if (bulletAudit.keywordStuffing.length > 0) contentQuality -= 5;
  if (bulletAudit.repeatedVerbs.length > 0) contentQuality -= 3;
  const contentQualityScore = Math.min(100, Math.max(wordCount < 25 ? 15 : 30, contentQuality));

  let formattingScore = 60;
  if (wordCount >= 350 && wordCount <= 1000) formattingScore += 25;
  else if (wordCount >= 200 && wordCount <= 1300) formattingScore += 15;
  else formattingScore -= 15;

  if (bulletCount >= 4 && wordCount >= 40) formattingScore += 15;
  if (!datesAudit.isReverseChronological) formattingScore -= 5;
  formattingScore = Math.min(100, Math.max(wordCount < 25 ? 20 : 30, formattingScore));

  const baseOverallScore = Math.round(
    keywordsScore * 0.35 +
      structureScore * 0.25 +
      contentQualityScore * 0.25 +
      formattingScore * 0.15
  );
  const overallScore =
    wordCount === 0
      ? 0
      : Math.max(5, Math.min(100, baseOverallScore + (jobTitleMatch.scoreImpact || 0)));

  let grade = 'C+';
  let rankPercentile = 'Top 50%';
  let matchLabel = 'Moderate';

  if (overallScore >= 88) {
    grade = 'A+';
    rankPercentile = 'Top 5%';
    matchLabel = 'Exceptional';
  } else if (overallScore >= 80) {
    grade = 'A';
    rankPercentile = 'Top 15%';
    matchLabel = 'Very Strong';
  } else if (overallScore >= 70) {
    grade = 'B+';
    rankPercentile = 'Top 30%';
    matchLabel = 'Good Match';
  } else if (overallScore >= 60) {
    grade = 'B';
    rankPercentile = 'Top 45%';
    matchLabel = 'Average';
  } else {
    grade = 'C';
    rankPercentile = 'Needs Revision';
    matchLabel = 'Low Match';
  }

  // 10. Generate Concrete Real Strengths
  const strengths: AnalysisStrength[] = [];

  if (jobTitleMatch.status === 'exact') {
    strengths.push({
      title: isAr ? 'تطابق المسمى الوظيفي المستهدف' : 'Target Job Title Match',
      description: jobTitleMatch.message,
      category: 'keywords',
    });
  }

  if (keywordsDetected.length >= 6) {
    strengths.push({
      title: 'Strong Technical Vocabulary',
      description: `Detected ${keywordsDetected.length} recognized technical and domain keywords (${keywordsDetected
        .slice(0, 4)
        .map((k) => k.keyword)
        .join(', ')}).`,
      category: 'keywords',
    });
  }

  if (quantifiedMetricsCount >= 3) {
    strengths.push({
      title: 'Quantified Impact & Results',
      description: `Found ${quantifiedMetricsCount} concrete metrics (${matchedMetrics
        .slice(0, 3)
        .join(', ')}), demonstrating measurable career value.`,
      category: 'metrics',
    });
  }

  if (actionVerbsFound.length >= 5) {
    strengths.push({
      title: 'High-Impact Action Verbs',
      description: `Excellent use of active leadership verbs (${actionVerbsFound
        .slice(0, 4)
        .join(', ')}), highlighting ownership.`,
      category: 'content',
    });
  }

  if (hasEmail && hasPhone && hasLinkedIn) {
    strengths.push({
      title: 'Complete Professional Contact Info',
      description:
        'Email, phone, and professional LinkedIn link were all detected and formatted for ATS parsers.',
      category: 'structure',
    });
  }

  if (foundSectionsCount >= 4) {
    strengths.push({
      title: 'ATS-Friendly Section Organization',
      description: `Clearly defined core resume sections found: ${sectionsDetected
        .filter((s) => s.found)
        .map((s) => s.name.split('/')[0].trim())
        .join(', ')}.`,
      category: 'structure',
    });
  }

  if (strengths.length < 2) {
    strengths.push({
      title: 'Solid Core Experience',
      description: `Resume text is clearly formatted with ${wordCount} words and consistent line breaks.`,
      category: 'content',
    });
  }

  // 11. Generate Concrete Real Weaknesses & Action Items
  const weaknesses: AnalysisWeakness[] = [];

  if (jobTitleMatch.status === 'partial' || jobTitleMatch.status === 'missing') {
    weaknesses.push({
      title: isAr ? 'تطابق المسمى الوظيفي المستهدف' : 'Target Job Title Alignment',
      description: jobTitleMatch.message,
      severity: jobTitleMatch.status === 'missing' ? 'high' : 'low',
      suggestion: jobTitleMatch.suggestion || '',
    });
  }

  for (const adv of synonymAdviceMessages) {
    weaknesses.push({
      title: isAr
        ? `مرادف/اختصار مكتشف (${adv.foundVariant})`
        : `Synonym / Acronym Match (${adv.foundVariant})`,
      description: adv.message,
      severity: 'low',
      suggestion: adv.message,
    });
  }

  weaknesses.push(...bulletWeaknesses);
  weaknesses.push(...dateWeaknesses);

  if (!hasLinkedIn) {
    weaknesses.push({
      title: 'Missing LinkedIn Profile URL',
      description: 'Over 85% of recruiters review LinkedIn profiles before reaching out.',
      severity: 'high',
      suggestion: 'Add your custom LinkedIn URL (e.g., linkedin.com/in/yourname) in the header.',
    });
  }

  if (quantifiedMetricsCount < 3) {
    weaknesses.push({
      title: 'Limited Quantifiable Achievements',
      description: `Found only ${quantifiedMetricsCount} numerical metric(s) in your work experience.`,
      severity: 'high',
      suggestion:
        'Quantify your impact with %, dollar figures, team sizes, or speed improvements (e.g., "Increased sales by 25%").',
    });
  }

  if (missingKeywords.length > 0) {
    weaknesses.push({
      title: 'Missing Key Domain Keywords',
      description: `Industry benchmark checks indicate missing high-demand skills: ${missingKeywords
        .slice(0, 3)
        .join(', ')}.`,
      severity: 'high',
      suggestion: `Incorporate ${missingKeywords
        .slice(0, 3)
        .join(', ')} naturally in your skills and project descriptions.`,
    });
  }

  if (weakVerbsFound.length > 0) {
    weaknesses.push({
      title: 'Passive Phrases Detected',
      description: `Found passive phrases like "${weakVerbsFound.slice(0, 2).join('", "')}".`,
      severity: 'medium',
      suggestion:
        'Replace passive phrases with power action verbs like "Spearheaded", "Engineered", or "Orchestrated".',
    });
  }

  if (!sectionsDetected.find((s) => s.name.includes('Projects') && s.found)) {
    weaknesses.push({
      title: 'No Dedicated Projects Section',
      description: 'Projects provide proof of hands-on technical execution and initiative.',
      severity: 'medium',
      suggestion:
        'Add a "Key Projects" section showcasing 2-3 prominent achievements with tech stacks and links.',
    });
  }

  if (wordCount < 300) {
    weaknesses.push({
      title: 'Resume Content is Too Brief',
      description: `Current resume has only ${wordCount} words, which may lack depth for senior ATS filtering.`,
      severity: 'medium',
      suggestion:
        'Expand your experience bullet points to follow the Action + Context + Result formula.',
    });
  }

  // 12. Categorized Suggestions
  const atsOptSuggestions: string[] = [
    ...synonymAdviceMessages.map((a) => a.message),
    ...(jobTitleMatch.suggestion ? [jobTitleMatch.suggestion] : []),
    'Use standard section headings (Work Experience, Education, Skills, Projects).',
    !hasLinkedIn
      ? 'Include your LinkedIn profile link in the top contact section.'
      : 'Keep contact info updated.',
    'Avoid tables, text boxes, and multi-column designs that confuse older ATS parsers.',
  ];

  const claritySuggestions: string[] = [
    ...bulletSuggestions,
    ...dateSuggestions,
    `Target length is 450 - 850 words (current: ${wordCount} words).`,
    'Ensure bullet points start with an active past-tense verb.',
    'Place your most relevant technical skills near the top half of the first page.',
  ];

  const suggestions: AnalysisSuggestion[] = [
    {
      category: 'Content & Impact',
      suggestions: [
        quantifiedMetricsCount < 4
          ? `Add at least ${4 - quantifiedMetricsCount} more quantifiable metrics (% or figures) across your job accomplishments.`
          : 'Maintain high metric density across recent roles.',
        missingKeywords.length > 0
          ? `Integrate target keywords: ${missingKeywords.slice(0, 3).join(', ')} into your experience bullet points.`
          : 'Ensure keywords are distributed across multiple sections.',
        'Apply the Google XYZ Formula: "Accomplished [X] as measured by [Y], by doing [Z]".',
      ],
      priority: 1,
    },
    {
      category: 'ATS Optimization',
      suggestions: atsOptSuggestions,
      priority: 2,
    },
    {
      category: 'Clarity & Structure',
      suggestions: claritySuggestions,
      priority: 3,
    },
  ];

  // 13. Multilingual Analysis Notice
  let languageNotice: { en: string; ar: string } | undefined;
  if (detectedLanguage === 'ar') {
    languageNotice = {
      en: 'Arabic resume detected. Comprehensive RTL structure, localized section mapping, and technical keywords were analyzed.',
      ar: 'تم فحص السيرة الذاتية باللغة العربية مع دعم كامل للاتجاه وتصنيف الأقسام والمهارات التقنية.',
    };
  } else if (detectedLanguage !== 'en') {
    const langNames: Record<DocumentLanguage, { en: string; ar: string }> = {
      fr: { en: 'French', ar: 'الفرنسية' },
      de: { en: 'German', ar: 'الألمانية' },
      es: { en: 'Spanish', ar: 'الإسبانية' },
      tr: { en: 'Turkish', ar: 'التركية' },
      ar: { en: 'Arabic', ar: 'العربية' },
      en: { en: 'English', ar: 'الإنجليزية' },
    };
    const name = langNames[detectedLanguage];
    languageNotice = {
      en: `${name.en} resume detected. Core sections, formatting, and international technical keywords were successfully analyzed without penalty.`,
      ar: `تم فحص السيرة الذاتية باللغة ${name.ar}. تم تحليل الأقسام الأساسية والتنسيق والكلمات التقنية بنجاح دون التأثير على التقييم.`,
    };
  }

  return {
    detectedLanguage,
    languageNotice,
    overallScore,
    subScores: {
      keywordsMatch: keywordsScore,
      formatting: formattingScore,
      structure: structureScore,
      contentQuality: contentQualityScore,
    },
    metrics: {
      wordCount,
      readingTimeSeconds,
      readingTimeString,
      bulletCount,
      quantifiedMetricsCount,
      grade,
      rankPercentile,
      matchLabel,
      yearsOfExperience: datesAudit.yearsOfExperience,
    },
    contactInfo: {
      hasEmail,
      email,
      hasPhone,
      phone,
      hasLinkedIn,
      linkedIn,
      hasGitHub,
      hasLocation,
      completenessScore: contactScore,
    },
    sectionsDetected,
    keywordsDetected,
    missingKeywords,
    extractedJdKeywords,
    jobTitleMatch,
    bulletAudit,
    datesAudit,
    strengths,
    weaknesses,
    suggestions,
    actionVerbsFound,
    weakVerbsFound,
  };
}

/**
 * Converts structured ResumeData to text representation for ATS analysis,
 * using localized section headings matching the document output language.
 */
export function resumeDataToText(data: any): string {
  if (!data) return '';
  const lang: DocumentLanguage = data.theme?.documentLanguage || 'en';
  const headings = getDocumentHeadings(lang);
  const lines: string[] = [];

  if (data.personalInfo) {
    const p = data.personalInfo;
    if (p.fullName) lines.push(p.fullName);
    if (p.jobTitle) lines.push(p.jobTitle);
    const contacts = [p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean);
    if (contacts.length) lines.push(contacts.join(' | '));
    if (p.summary) {
      lines.push(`\n${headings.summary}`);
      lines.push(p.summary);
    }
  }

  if (data.experience && data.experience.length > 0) {
    lines.push(`\n${headings.experience}`);
    data.experience.forEach((exp: any) => {
      lines.push(
        `${exp.position || ''} at ${exp.company || ''} (${exp.startDate || ''} - ${
          exp.current ? headings.present : exp.endDate || ''
        })`
      );
      if (exp.location) lines.push(exp.location);
      if (exp.description && Array.isArray(exp.description)) {
        exp.description.forEach((d: string) => {
          if (d.trim()) lines.push(`• ${d.trim()}`);
        });
      }
    });
  }

  if (data.skills && data.skills.length > 0) {
    lines.push(`\n${headings.skills}`);
    data.skills.forEach((cat: any) => {
      const items = Array.isArray(cat.items) ? cat.items.join(', ') : cat.items;
      lines.push(`${cat.category || headings.skills}: ${items}`);
    });
  }

  if (data.projects && data.projects.length > 0) {
    lines.push(`\n${headings.projects}`);
    data.projects.forEach((proj: any) => {
      lines.push(
        `${proj.title || ''} (${
          proj.technologies
            ? Array.isArray(proj.technologies)
              ? proj.technologies.join(', ')
              : proj.technologies
            : ''
        })`
      );
      if (proj.description) lines.push(`• ${proj.description}`);
    });
  }

  if (data.education && data.education.length > 0) {
    lines.push(`\n${headings.education}`);
    data.education.forEach((edu: any) => {
      lines.push(
        `${edu.degree || ''} in ${edu.fieldOfStudy || ''} - ${edu.institution || ''} (${
          edu.startDate || ''
        } - ${edu.endDate || ''})`
      );
      if (edu.gpa) lines.push(`${headings.gpa}: ${edu.gpa}`);
    });
  }

  return lines.join('\n');
}
