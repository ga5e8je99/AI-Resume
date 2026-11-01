import type { DocumentLanguage } from '../atsAnalyzer';

export interface SynonymGroup {
  /** Canonical identifier used as the normalized key */
  id: string;
  /** Primary display name (usually the standard full term or industry-standard name) */
  canonical: string;
  /** Primary abbreviation/acronym if applicable (e.g. "K8s", "SEO", "IFRS") */
  acronym?: string;
  /** Full expanded name in English (e.g. "Kubernetes", "Search Engine Optimization") */
  fullName: string;
  /** Localized full names or common equivalents per language */
  localizedFullNames?: Partial<Record<DocumentLanguage, string>>;
  /** Domain category */
  category:
    | 'tech'
    | 'data_ai'
    | 'cloud_devops'
    | 'finance_accounting'
    | 'marketing_growth'
    | 'business_management'
    | 'hr_operations'
    | 'engineering_construction'
    | 'healthcare_medical'
    | 'role_title';
  /** All surface forms (English + Arabic + French + German + Spanish + Turkish) */
  variants: string[];
}

/**
 * Strips Arabic diacritics (Tashkeel), Tatweel, and normalizes Hamza/Alef,
 * Teh Marbuta, and Alef Maksura for reliable RTL/Arabic ATS matching.
 */
export function normalizeArabicText(input: string): string {
  if (!input) return '';
  return input
    // Remove tashkeel / harakat and Quranic annotations
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    // Remove tatweel (kashida)
    .replace(/\u0640/g, '')
    // Normalize Alef variants (أ إ آ ٱ -> ا)
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    // Normalize Hamza on Waw/Yeh for loose matching consistency
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    // Normalize Teh Marbuta (ة -> ه)
    .replace(/\u0629/g, '\u0647')
    // Normalize Alef Maksura (ى -> ي)
    .replace(/\u0649/g, '\u064A');
}

/**
 * Basic surface normalization (case-folding, Arabic normalization, punctuation cleanup)
 * without collapsing synonyms yet.
 */
export function cleanSurfaceTerm(raw: string): string {
  if (!raw) return '';
  const arabicNormalized = normalizeArabicText(raw.trim().toLowerCase());
  return arabicNormalized
    .replace(/[\u2010-\u2015\u2212]/g, '-') // normalize dashes
    .replace(/[""«»„‟]/g, '"')
    .replace(/[''‚‛]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export const SYNONYM_GROUPS: SynonymGroup[] = [
  // ============================================================================
  // CLOUD, DEVOPS & INFRASTRUCTURE
  // ============================================================================
  {
    id: 'kubernetes',
    canonical: 'Kubernetes',
    acronym: 'K8s',
    fullName: 'Kubernetes',
    localizedFullNames: {
      ar: 'كوبرنيتس (Kubernetes)',
      fr: 'Kubernetes',
      de: 'Kubernetes',
      es: 'Kubernetes',
      tr: 'Kubernetes',
    },
    category: 'cloud_devops',
    variants: ['Kubernetes', 'K8s', 'k8s', 'Kube', 'كوبرنيتس', 'كوبرنيتيس'],
  },
  {
    id: 'ci_cd',
    canonical: 'CI/CD',
    acronym: 'CI/CD',
    fullName: 'Continuous Integration / Continuous Deployment',
    localizedFullNames: {
      ar: 'التكامل المستمر والنشر المستمر (CI/CD)',
      fr: 'Intégration continue et déploiement continu',
      de: 'Kontinuierliche Integration und Bereitstellung',
      es: 'Integración continua y despliegue continuo',
      tr: 'Sürekli Entegrasyon ve Sürekli Dağıtım',
    },
    category: 'cloud_devops',
    variants: [
      'CI/CD',
      'CI-CD',
      'CICD',
      'Continuous Integration',
      'Continuous Delivery',
      'Continuous Deployment',
      'Continuous Integration and Continuous Delivery',
      'Continuous Integration and Continuous Deployment',
      'التكامل المستمر',
      'النشر المستمر',
      'التكامل والنشر المستمر',
      'Intégration continue',
      'Déploiement continu',
      'Kontinuierliche Integration',
      'Integración continua',
      'Despliegue continuo',
      'Sürekli Entegrasyon',
    ],
  },
  {
    id: 'aws',
    canonical: 'AWS',
    acronym: 'AWS',
    fullName: 'Amazon Web Services',
    category: 'cloud_devops',
    variants: ['AWS', 'Amazon Web Services', 'خدمات أمازون السحابية', 'أمازون ويب سيرفيسز'],
  },
  {
    id: 'gcp',
    canonical: 'GCP',
    acronym: 'GCP',
    fullName: 'Google Cloud Platform',
    category: 'cloud_devops',
    variants: ['GCP', 'Google Cloud Platform', 'Google Cloud', 'سحابة جوجل', 'منصة جوجل السحابية'],
  },
  {
    id: 'iac',
    canonical: 'IaC',
    acronym: 'IaC',
    fullName: 'Infrastructure as Code',
    category: 'cloud_devops',
    variants: ['IaC', 'Infrastructure as Code', 'البنية التحتية ككود', 'البنية التحتية كبرمجيات'],
  },

  // ============================================================================
  // SOFTWARE DEVELOPMENT & WEB
  // ============================================================================
  {
    id: 'javascript',
    canonical: 'JavaScript',
    acronym: 'JS',
    fullName: 'JavaScript',
    localizedFullNames: {
      ar: 'جافاسكريبت (JavaScript)',
    },
    category: 'tech',
    variants: ['JavaScript', 'JS', 'ECMAScript', 'ES6', 'ES6+', 'جافاسكريبت', 'جافا سكريبت'],
  },
  {
    id: 'typescript',
    canonical: 'TypeScript',
    acronym: 'TS',
    fullName: 'TypeScript',
    localizedFullNames: {
      ar: 'تايب سكريبت (TypeScript)',
    },
    category: 'tech',
    variants: ['TypeScript', 'TS', 'تايب سكريبت', 'تايبسكريبت'],
  },
  {
    id: 'postgresql',
    canonical: 'PostgreSQL',
    acronym: 'Postgres',
    fullName: 'PostgreSQL',
    category: 'tech',
    variants: ['PostgreSQL', 'Postgres', 'بوستجرس', 'بوستجري إس كيو إل'],
  },
  {
    id: 'rest_api',
    canonical: 'REST APIs',
    acronym: 'REST',
    fullName: 'Representational State Transfer APIs',
    category: 'tech',
    variants: ['REST', 'REST API', 'REST APIs', 'RESTful', 'RESTful API', 'RESTful APIs', 'واجهات برمجة التطبيقات REST'],
  },
  {
    id: 'ui',
    canonical: 'User Interface',
    acronym: 'UI',
    fullName: 'User Interface',
    localizedFullNames: {
      ar: 'واجهة المستخدم (User Interface)',
      fr: 'Interface utilisateur',
      de: 'Benutzeroberfläche',
      es: 'Interfaz de usuario',
      tr: 'Kullanıcı Arayüzü',
    },
    category: 'tech',
    variants: [
      'UI',
      'User Interface',
      'واجهة المستخدم',
      'تصميم واجهات المستخدم',
      'Interface utilisateur',
      'Benutzeroberfläche',
      'Interfaz de usuario',
      'Kullanıcı Arayüzü',
    ],
  },
  {
    id: 'ux',
    canonical: 'User Experience',
    acronym: 'UX',
    fullName: 'User Experience',
    localizedFullNames: {
      ar: 'تجربة المستخدم (User Experience)',
      fr: 'Expérience utilisateur',
      de: 'Benutzererfahrung',
      es: 'Experiencia de usuario',
      tr: 'Kullanıcı Deneyimi',
    },
    category: 'tech',
    variants: [
      'UX',
      'User Experience',
      'تجربة المستخدم',
      'أبحاث تجربة المستخدم',
      'Expérience utilisateur',
      'Benutzererfahrung',
      'Experiencia de usuario',
      'Kullanıcı Deneyimi',
    ],
  },
  {
    id: 'qa',
    canonical: 'Quality Assurance',
    acronym: 'QA',
    fullName: 'Quality Assurance',
    localizedFullNames: {
      ar: 'ضمان الجودة (Quality Assurance)',
      fr: 'Assurance qualité',
      de: 'Qualitätssicherung',
      es: 'Aseguramiento de la calidad',
      tr: 'Kalite Güvencesi',
    },
    category: 'tech',
    variants: [
      'QA',
      'Quality Assurance',
      'ضمان الجودة',
      'تأكيد الجودة',
      'Assurance qualité',
      'Qualitätssicherung',
      'Aseguramiento de la calidad',
      'Control de calidad',
      'Kalite Güvencesi',
    ],
  },
  {
    id: 'oop',
    canonical: 'Object-Oriented Programming',
    acronym: 'OOP',
    fullName: 'Object-Oriented Programming',
    localizedFullNames: {
      ar: 'البرمجة كائنية التوجه (OOP)',
      fr: 'Programmation orientée objet',
      de: 'Objektorientierte Programmierung',
      es: 'Programación orientada a objetos',
      tr: 'Nesne Yönelimli Programlama',
    },
    category: 'tech',
    variants: [
      'OOP',
      'Object-Oriented Programming',
      'Object Oriented Programming',
      'البرمجة كائنية التوجه',
      'البرمجة الشيئية',
      'Programmation orientée objet',
      'POO',
      'Objektorientierte Programmierung',
      'Programación orientada a objetos',
      'Nesne Yönelimli Programlama',
    ],
  },
  {
    id: 'tdd',
    canonical: 'Test-Driven Development',
    acronym: 'TDD',
    fullName: 'Test-Driven Development',
    category: 'tech',
    variants: ['TDD', 'Test-Driven Development', 'Test Driven Development', 'التطوير الموجه بالاختبارات'],
  },

  // ============================================================================
  // DATA, AI & MACHINE LEARNING
  // ============================================================================
  {
    id: 'machine_learning',
    canonical: 'Machine Learning',
    acronym: 'ML',
    fullName: 'Machine Learning',
    localizedFullNames: {
      ar: 'تعلم الآلة (Machine Learning)',
      fr: 'Apprentissage automatique',
      de: 'Maschinelles Lernen',
      es: 'Aprendizaje automático',
      tr: 'Makine Öğrenimi',
    },
    category: 'data_ai',
    variants: [
      'ML',
      'Machine Learning',
      'تعلم الآلة',
      'التعلم الآلي',
      'Apprentissage automatique',
      'Maschinelles Lernen',
      'Aprendizaje automático',
      'Makine Öğrenimi',
      'Makine Öğrenmesi',
    ],
  },
  {
    id: 'artificial_intelligence',
    canonical: 'Artificial Intelligence',
    acronym: 'AI',
    fullName: 'Artificial Intelligence',
    localizedFullNames: {
      ar: 'الذكاء الاصطناعي (Artificial Intelligence)',
      fr: 'Intelligence artificielle',
      de: 'Künstliche Intelligenz',
      es: 'Inteligencia artificial',
      tr: 'Yapay Zeka',
    },
    category: 'data_ai',
    variants: [
      'AI',
      'Artificial Intelligence',
      'الذكاء الاصطناعي',
      'Intelligence artificielle',
      'IA',
      'Künstliche Intelligenz',
      'KI',
      'Inteligencia artificial',
      'Yapay Zeka',
    ],
  },
  {
    id: 'nlp',
    canonical: 'Natural Language Processing',
    acronym: 'NLP',
    fullName: 'Natural Language Processing',
    localizedFullNames: {
      ar: 'معالجة اللغات الطبيعية (NLP)',
      fr: 'Traitement automatique du langage naturel',
      de: 'Natürliche Sprachverarbeitung',
      es: 'Procesamiento del lenguaje natural',
      tr: 'Doğal Dil İşleme',
    },
    category: 'data_ai',
    variants: [
      'NLP',
      'Natural Language Processing',
      'معالجة اللغات الطبيعية',
      'معالجة اللغة الطبيعية',
      'Traitement automatique du langage naturel',
      'TALN',
      'Natürliche Sprachverarbeitung',
      'Procesamiento del lenguaje natural',
      'PLN',
      'Doğal Dil İşleme',
    ],
  },
  {
    id: 'llm',
    canonical: 'Large Language Models',
    acronym: 'LLM',
    fullName: 'Large Language Models',
    category: 'data_ai',
    variants: ['LLM', 'LLMs', 'Large Language Model', 'Large Language Models', 'نماذج اللغة الكبيرة', 'النماذج اللغوية الكبيرة'],
  },
  {
    id: 'etl',
    canonical: 'ETL',
    acronym: 'ETL',
    fullName: 'Extract, Transform, Load',
    category: 'data_ai',
    variants: ['ETL', 'Extract Transform Load', 'Extract, Transform, Load', 'استخراج وتحويل وتحميل البيانات'],
  },
  {
    id: 'bi',
    canonical: 'Business Intelligence',
    acronym: 'BI',
    fullName: 'Business Intelligence',
    localizedFullNames: {
      ar: 'ذكاء الأعمال (Business Intelligence)',
      fr: 'Informatique décisionnelle',
      de: 'Business Intelligence',
      es: 'Inteligencia de negocios',
      tr: 'İş Zekası',
    },
    category: 'data_ai',
    variants: [
      'BI',
      'Business Intelligence',
      'ذكاء الأعمال',
      'Informatique décisionnelle',
      'Inteligencia de negocios',
      'Inteligencia empresarial',
      'İş Zekası',
    ],
  },

  // ============================================================================
  // MARKETING, SEO & GROWTH
  // ============================================================================
  {
    id: 'seo',
    canonical: 'Search Engine Optimization',
    acronym: 'SEO',
    fullName: 'Search Engine Optimization',
    localizedFullNames: {
      ar: 'تحسين محركات البحث (SEO)',
      fr: 'Optimisation pour les moteurs de recherche (SEO)',
      de: 'Suchmaschinenoptimierung (SEO)',
      es: 'Optimización en motores de búsqueda (SEO)',
      tr: 'Arama Motoru Optimizasyonu (SEO)',
    },
    category: 'marketing_growth',
    variants: [
      'SEO',
      'Search Engine Optimization',
      'Search Engine Optimisation',
      'تحسين محركات البحث',
      'تهيئة المواقع لمحركات البحث',
      'سيو',
      'Référencement naturel',
      'Optimisation pour les moteurs de recherche',
      'Suchmaschinenoptimierung',
      'Optimización en motores de búsqueda',
      'Optimización para motores de búsqueda',
      'Posicionamiento web',
      'Arama Motoru Optimizasyonu',
    ],
  },
  {
    id: 'sem',
    canonical: 'Search Engine Marketing',
    acronym: 'SEM',
    fullName: 'Search Engine Marketing',
    localizedFullNames: {
      ar: 'التسويق عبر محركات البحث (SEM)',
      fr: 'Marketing sur les moteurs de recherche',
      de: 'Suchmaschinenmarketing',
      es: 'Marketing en motores de búsqueda',
      tr: 'Arama Motoru Pazarlaması',
    },
    category: 'marketing_growth',
    variants: [
      'SEM',
      'Search Engine Marketing',
      'التسويق عبر محركات البحث',
      'Marketing sur les moteurs de recherche',
      'Suchmaschinenmarketing',
      'Marketing en motores de búsqueda',
      'Arama Motoru Pazarlaması',
    ],
  },
  {
    id: 'ppc',
    canonical: 'Pay-Per-Click',
    acronym: 'PPC',
    fullName: 'Pay-Per-Click Advertising',
    localizedFullNames: {
      ar: 'إعلانات الدفع لكل نقرة (PPC)',
    },
    category: 'marketing_growth',
    variants: ['PPC', 'Pay-Per-Click', 'Pay Per Click', 'Pay-Per-Click Advertising', 'الدفع لكل نقرة', 'إعلانات الدفع لكل نقرة'],
  },
  {
    id: 'smm',
    canonical: 'Social Media Marketing',
    acronym: 'SMM',
    fullName: 'Social Media Marketing',
    localizedFullNames: {
      ar: 'التسويق عبر وسائل التواصل الاجتماعي',
      fr: 'Marketing des médias sociaux',
      de: 'Social-Media-Marketing',
      es: 'Marketing en redes sociales',
      tr: 'Sosyal Medya Pazarlaması',
    },
    category: 'marketing_growth',
    variants: [
      'SMM',
      'Social Media Marketing',
      'التسويق عبر وسائل التواصل الاجتماعي',
      'التسويق عبر منصات التواصل الاجتماعي',
      'تسويق السوشيال ميديا',
      'Marketing des médias sociaux',
      'Marketing sur les réseaux sociaux',
      'Social-Media-Marketing',
      'Marketing en redes sociales',
      'Sosyal Medya Pazarlaması',
    ],
  },
  {
    id: 'roi',
    canonical: 'Return on Investment',
    acronym: 'ROI',
    fullName: 'Return on Investment',
    localizedFullNames: {
      ar: 'العائد على الاستثمار (ROI)',
      fr: 'Retour sur investissement',
      de: 'Kapitalrendite (ROI)',
      es: 'Retorno de la inversión',
      tr: 'Yatırım Getirisi',
    },
    category: 'marketing_growth',
    variants: [
      'ROI',
      'Return on Investment',
      'العائد على الاستثمار',
      'عائد الاستثمار',
      'Retour sur investissement',
      'Kapitalrendite',
      'Retorno de la inversión',
      'Yatırım Getirisi',
    ],
  },
  {
    id: 'roas',
    canonical: 'Return on Ad Spend',
    acronym: 'ROAS',
    fullName: 'Return on Ad Spend',
    localizedFullNames: {
      ar: 'العائد على الإنفاق الإعلاني (ROAS)',
    },
    category: 'marketing_growth',
    variants: ['ROAS', 'Return on Ad Spend', 'العائد على الإنفاق الإعلاني', 'عائد الإنفاق الإعلاني'],
  },
  {
    id: 'ctr',
    canonical: 'Click-Through Rate',
    acronym: 'CTR',
    fullName: 'Click-Through Rate',
    category: 'marketing_growth',
    variants: ['CTR', 'Click-Through Rate', 'Click Through Rate', 'معدل النقر إلى الظهور', 'نسبة النقر إلى الظهور'],
  },
  {
    id: 'cac',
    canonical: 'Customer Acquisition Cost',
    acronym: 'CAC',
    fullName: 'Customer Acquisition Cost',
    category: 'marketing_growth',
    variants: ['CAC', 'Customer Acquisition Cost', 'تكلفة الاستحواذ على العميل', 'تكلفة اكتساب العملاء'],
  },

  // ============================================================================
  // BUSINESS, CRM, ERP, KPIs
  // ============================================================================
  {
    id: 'crm',
    canonical: 'Customer Relationship Management',
    acronym: 'CRM',
    fullName: 'Customer Relationship Management',
    localizedFullNames: {
      ar: 'إدارة علاقات العملاء (CRM)',
      fr: 'Gestion de la relation client (CRM)',
      de: 'Kundenbeziehungsmanagement (CRM)',
      es: 'Gestión de relaciones con clientes (CRM)',
      tr: 'Müşteri İlişkileri Yönetimi (CRM)',
    },
    category: 'business_management',
    variants: [
      'CRM',
      'Customer Relationship Management',
      'إدارة علاقات العملاء',
      'نظم إدارة علاقات العملاء',
      'Gestion de la relation client',
      'GRC',
      'Kundenbeziehungsmanagement',
      'Gestión de relaciones con clientes',
      'Gestión de la relación con el cliente',
      'Müşteri İlişkileri Yönetimi',
    ],
  },
  {
    id: 'erp',
    canonical: 'Enterprise Resource Planning',
    acronym: 'ERP',
    fullName: 'Enterprise Resource Planning',
    localizedFullNames: {
      ar: 'تخطيط موارد المؤسسات (ERP)',
      fr: 'Progiciel de gestion intégré (ERP)',
      de: 'Unternehmensressourcenplanung (ERP)',
      es: 'Planificación de recursos empresariales (ERP)',
      tr: 'Kurumsal Kaynak Planlaması (ERP)',
    },
    category: 'business_management',
    variants: [
      'ERP',
      'Enterprise Resource Planning',
      'تخطيط موارد المؤسسات',
      'نظام تخطيط موارد المؤسسات',
      'Progiciel de gestion intégré',
      'PGI',
      'Unternehmensressourcenplanung',
      'Planificación de recursos empresariales',
      'Kurumsal Kaynak Planlaması',
    ],
  },
  {
    id: 'kpi',
    canonical: 'Key Performance Indicators',
    acronym: 'KPI',
    fullName: 'Key Performance Indicators',
    localizedFullNames: {
      ar: 'مؤشرات الأداء الرئيسية (KPIs)',
      fr: 'Indicateurs clés de performance (KPI)',
      de: 'Leistungskennzahlen (KPIs)',
      es: 'Indicadores clave de rendimiento (KPI)',
      tr: 'Temel Performans Göstergeleri (KPI)',
    },
    category: 'business_management',
    variants: [
      'KPI',
      'KPIs',
      'Key Performance Indicator',
      'Key Performance Indicators',
      'مؤشرات الأداء الرئيسية',
      'مؤشرات قياس الأداء',
      'مؤشر الأداء الرئيسي',
      'Indicateurs clés de performance',
      'Indicateur clé de performance',
      'Leistungskennzahlen',
      'Kennzahlen',
      'Indicadores clave de rendimiento',
      'Indicadores clave de desempeño',
      'Temel Performans Göstergeleri',
      'Anahtar Performans Göstergeleri',
    ],
  },
  {
    id: 'okr',
    canonical: 'Objectives and Key Results',
    acronym: 'OKRs',
    fullName: 'Objectives and Key Results',
    localizedFullNames: {
      ar: 'الأهداف والنتائج الرئيسية (OKRs)',
    },
    category: 'business_management',
    variants: ['OKR', 'OKRs', 'Objectives and Key Results', 'الأهداف والنتائج الرئيسية'],
  },
  {
    id: 'b2b',
    canonical: 'Business-to-Business',
    acronym: 'B2B',
    fullName: 'Business-to-Business',
    category: 'business_management',
    variants: ['B2B', 'Business-to-Business', 'Business to Business', 'مبيعات الشركات', 'الشركات إلى الشركات'],
  },
  {
    id: 'b2c',
    canonical: 'Business-to-Consumer',
    acronym: 'B2C',
    fullName: 'Business-to-Consumer',
    category: 'business_management',
    variants: ['B2C', 'Business-to-Consumer', 'Business to Consumer', 'الشركات إلى المستهلكين'],
  },
  {
    id: 'saas',
    canonical: 'Software as a Service',
    acronym: 'SaaS',
    fullName: 'Software as a Service',
    category: 'business_management',
    variants: ['SaaS', 'Software as a Service', 'Software-as-a-Service', 'البرمجيات كخدمة'],
  },
  {
    id: 'sla',
    canonical: 'Service Level Agreement',
    acronym: 'SLA',
    fullName: 'Service Level Agreement',
    category: 'business_management',
    variants: ['SLA', 'SLAs', 'Service Level Agreement', 'Service Level Agreements', 'اتفاقية مستوى الخدمة'],
  },

  // ============================================================================
  // FINANCE & ACCOUNTING
  // ============================================================================
  {
    id: 'pnl',
    canonical: 'Profit and Loss',
    acronym: 'P&L',
    fullName: 'Profit and Loss',
    localizedFullNames: {
      ar: 'الأرباح والخسائر (P&L)',
      fr: 'Compte de résultat (P&L)',
      de: 'Gewinn- und Verlustrechnung (GuV)',
      es: 'Pérdidas y ganancias (P&L)',
      tr: 'Kar ve Zarar Tablosu (P&L)',
    },
    category: 'finance_accounting',
    variants: [
      'P&L',
      'PnL',
      'P & L',
      'Profit and Loss',
      'Profit & Loss',
      'Profit and Loss Statement',
      'الأرباح والخسائر',
      'حساب الأرباح والخسائر',
      'قائمة الأرباح والخسائر',
      'Compte de résultat',
      'Pertes et profits',
      'Gewinn- und Verlustrechnung',
      'GuV',
      'Pérdidas y ganancias',
      'Estado de resultados',
      'Kar ve Zarar',
      'Gelir Tablosu',
    ],
  },
  {
    id: 'ifrs',
    canonical: 'International Financial Reporting Standards',
    acronym: 'IFRS',
    fullName: 'International Financial Reporting Standards',
    localizedFullNames: {
      ar: 'المعايير الدولية للتقارير المالية (IFRS)',
      fr: "Normes internationales d'information financière (IFRS)",
      de: 'Internationale Rechnungslegungsstandards (IFRS)',
      es: 'Normas Internacionales de Información Financiera (NIIF / IFRS)',
      tr: 'Uluslararası Finansal Raporlama Standartları (UFRS / IFRS)',
    },
    category: 'finance_accounting',
    variants: [
      'IFRS',
      'International Financial Reporting Standards',
      'المعايير الدولية للتقارير المالية',
      'معايير التقارير المالية الدولية',
      'المعايير المحاسبية الدولية',
      "Normes internationales d'information financière",
      'Internationale Rechnungslegungsstandards',
      'Normas Internacionales de Información Financiera',
      'NIIF',
      'Uluslararası Finansal Raporlama Standartları',
      'UFRS',
    ],
  },
  {
    id: 'gaap',
    canonical: 'Generally Accepted Accounting Principles',
    acronym: 'GAAP',
    fullName: 'Generally Accepted Accounting Principles',
    localizedFullNames: {
      ar: 'مبادئ المحاسبة المقبولة عموماً (GAAP)',
      fr: 'Principes comptables généralement reconnus',
      de: 'Grundsätze ordnungsmäßiger Buchführung',
      es: 'Principios de Contabilidad Generalmente Aceptados',
      tr: 'Genel Kabul Görmüş Muhasebe İlkeleri',
    },
    category: 'finance_accounting',
    variants: [
      'GAAP',
      'US GAAP',
      'Generally Accepted Accounting Principles',
      'مبادئ المحاسبة المقبولة عموماً',
      'المبادئ المحاسبية المقبولة عموماً',
      'Principes comptables généralement reconnus',
      'PCGR',
      'Grundsätze ordnungsmäßiger Buchführung',
      'Principios de Contabilidad Generalmente Aceptados',
      'PCGA',
      'Genel Kabul Görmüş Muhasebe İlkeleri',
    ],
  },
  {
    id: 'cpa',
    canonical: 'Certified Public Accountant',
    acronym: 'CPA',
    fullName: 'Certified Public Accountant',
    localizedFullNames: {
      ar: 'محاسب قانوني معتمد (CPA)',
      fr: 'Expert-comptable agréé (CPA)',
      de: 'Wirtschaftsprüfer (CPA)',
      es: 'Contador Público Certificado (CPA)',
      tr: 'Serbest Muhasebeci Mali Müşavir (SMMM / CPA)',
    },
    category: 'finance_accounting',
    variants: [
      'CPA',
      'Certified Public Accountant',
      'محاسب قانوني معتمد',
      'محاسب قانوني',
      'Expert-comptable',
      'Wirtschaftsprüfer',
      'Contador Público Certificado',
      'Serbest Muhasebeci Mali Müşavir',
      'SMMM',
    ],
  },
  {
    id: 'cfa',
    canonical: 'Chartered Financial Analyst',
    acronym: 'CFA',
    fullName: 'Chartered Financial Analyst',
    localizedFullNames: {
      ar: 'محلل مالي معتمد (CFA)',
    },
    category: 'finance_accounting',
    variants: ['CFA', 'Chartered Financial Analyst', 'محلل مالي معتمد'],
  },
  {
    id: 'ap',
    canonical: 'Accounts Payable',
    acronym: 'AP',
    fullName: 'Accounts Payable',
    localizedFullNames: {
      ar: 'الحسابات الدائنة (Accounts Payable)',
      fr: 'Comptabilité fournisseurs',
      de: 'Kreditorenbuchhaltung',
      es: 'Cuentas por pagar',
      tr: 'Borç Hesapları',
    },
    category: 'finance_accounting',
    variants: [
      'Accounts Payable',
      'A/P',
      'الحسابات الدائنة',
      'حسابات الموردين',
      'Comptabilité fournisseurs',
      'Kreditorenbuchhaltung',
      'Cuentas por pagar',
      'Borç Hesapları',
    ],
  },
  {
    id: 'ar_finance',
    canonical: 'Accounts Receivable',
    acronym: 'AR',
    fullName: 'Accounts Receivable',
    localizedFullNames: {
      ar: 'الحسابات المدينة (Accounts Receivable)',
      fr: 'Comptabilité clients',
      de: 'Debitorenbuchhaltung',
      es: 'Cuentas por cobrar',
      tr: 'Alacak Hesapları',
    },
    category: 'finance_accounting',
    variants: [
      'Accounts Receivable',
      'A/R',
      'الحسابات المدينة',
      'حسابات العملاء',
      'Comptabilité clients',
      'Debitorenbuchhaltung',
      'Cuentas por cobrar',
      'Alacak Hesapları',
    ],
  },
  {
    id: 'gl',
    canonical: 'General Ledger',
    acronym: 'GL',
    fullName: 'General Ledger',
    localizedFullNames: {
      ar: 'دفتر الأستاذ العام (General Ledger)',
      fr: 'Grand livre général',
      de: 'Hauptbuch',
      es: 'Libro mayor',
      tr: 'Büyük Defter',
    },
    category: 'finance_accounting',
    variants: [
      'GL',
      'General Ledger',
      'دفتر الأستاذ العام',
      'الأستاذ العام',
      'Grand livre',
      'Grand livre général',
      'Hauptbuch',
      'Libro mayor',
      'Büyük Defter',
    ],
  },
  {
    id: 'vat',
    canonical: 'Value Added Tax',
    acronym: 'VAT',
    fullName: 'Value Added Tax',
    localizedFullNames: {
      ar: 'ضريبة القيمة المضافة (VAT)',
      fr: 'Taxe sur la valeur ajoutée (TVA)',
      de: 'Mehrwertsteuer (MwSt)',
      es: 'Impuesto al Valor Agregado (IVA)',
      tr: 'Katma Değer Vergisi (KDV)',
    },
    category: 'finance_accounting',
    variants: [
      'VAT',
      'Value Added Tax',
      'ضريبة القيمة المضافة',
      'TVA',
      'Taxe sur la valeur ajoutée',
      'MwSt',
      'Mehrwertsteuer',
      'Umsatzsteuer',
      'IVA',
      'Impuesto al Valor Agregado',
      'KDV',
      'Katma Değer Vergisi',
    ],
  },
  {
    id: 'fpna',
    canonical: 'Financial Planning and Analysis',
    acronym: 'FP&A',
    fullName: 'Financial Planning and Analysis',
    localizedFullNames: {
      ar: 'التخطيط والتحليل المالي (FP&A)',
    },
    category: 'finance_accounting',
    variants: [
      'FP&A',
      'FPA',
      'Financial Planning and Analysis',
      'Financial Planning & Analysis',
      'التخطيط والتحليل المالي',
      'التحليل المالي',
    ],
  },

  // ============================================================================
  // HUMAN RESOURCES & OPERATIONS
  // ============================================================================
  {
    id: 'hr',
    canonical: 'Human Resources',
    acronym: 'HR',
    fullName: 'Human Resources',
    localizedFullNames: {
      ar: 'الموارد البشرية (HR)',
      fr: 'Ressources humaines (RH)',
      de: 'Personalwesen (HR)',
      es: 'Recursos humanos (RRHH)',
      tr: 'İnsan Kaynakları (İK)',
    },
    category: 'hr_operations',
    variants: [
      'HR',
      'Human Resources',
      'الموارد البشرية',
      'إدارة الموارد البشرية',
      'شؤون الموظفين',
      'Ressources humaines',
      'RH',
      'Personalwesen',
      'Personalmanagement',
      'Recursos humanos',
      'RRHH',
      'İnsan Kaynakları',
      'İK',
    ],
  },
  {
    id: 'hris',
    canonical: 'Human Resource Information System',
    acronym: 'HRIS',
    fullName: 'Human Resource Information System',
    localizedFullNames: {
      ar: 'نظم معلومات الموارد البشرية (HRIS)',
    },
    category: 'hr_operations',
    variants: [
      'HRIS',
      'HRMS',
      'HCM',
      'Human Resource Information System',
      'Human Resources Management System',
      'Human Capital Management',
      'نظم معلومات الموارد البشرية',
      'إدارة رأس المال البشري',
    ],
  },

  // ============================================================================
  // ENGINEERING, CIVIL, CONSTRUCTION & PROJECT MANAGEMENT
  // ============================================================================
  {
    id: 'pmp',
    canonical: 'Project Management Professional',
    acronym: 'PMP',
    fullName: 'Project Management Professional',
    localizedFullNames: {
      ar: 'إدارة المشاريع الاحترافية (PMP)',
    },
    category: 'engineering_construction',
    variants: [
      'PMP',
      'Project Management Professional',
      'إدارة المشاريع الاحترافية',
      'محترف إدارة المشاريع',
      'شهادة PMP',
    ],
  },
  {
    id: 'bim',
    canonical: 'Building Information Modeling',
    acronym: 'BIM',
    fullName: 'Building Information Modeling',
    localizedFullNames: {
      ar: 'نمذجة معلومات البناء (BIM)',
      fr: 'Modélisation des informations du bâtiment (BIM)',
      de: 'Bauwerksdatenmodellierung (BIM)',
      es: 'Modelado de información de construcción (BIM)',
      tr: 'Yapı Bilgi Modellemesi (BIM)',
    },
    category: 'engineering_construction',
    variants: [
      'BIM',
      'Building Information Modeling',
      'Building Information Modelling',
      'نمذجة معلومات البناء',
      'نمذجة معلومات المباني',
      'Modélisation des informations du bâtiment',
      'Bauwerksdatenmodellierung',
      'Modelado de información de construcción',
      'Yapı Bilgi Modellemesi',
    ],
  },
  {
    id: 'cad',
    canonical: 'Computer-Aided Design',
    acronym: 'AutoCAD / CAD',
    fullName: 'Computer-Aided Design (AutoCAD)',
    localizedFullNames: {
      ar: 'التصميم بمساعدة الحاسوب (AutoCAD / CAD)',
    },
    category: 'engineering_construction',
    variants: [
      'CAD',
      'AutoCAD',
      'Computer-Aided Design',
      'Computer Aided Design',
      'أوتوكاد',
      'اوتوكاد',
      'التصميم بمساعدة الحاسوب',
    ],
  },
  {
    id: 'boq',
    canonical: 'Bill of Quantities',
    acronym: 'BOQ',
    fullName: 'Bill of Quantities',
    localizedFullNames: {
      ar: 'جدول الكميات والمقايسات (BOQ)',
    },
    category: 'engineering_construction',
    variants: [
      'BOQ',
      'Bill of Quantities',
      'جدول الكميات',
      'جداول الكميات',
      'حصر الكميات',
      'المقايسات',
    ],
  },
  {
    id: 'hvac',
    canonical: 'Heating, Ventilation, and Air Conditioning',
    acronym: 'HVAC',
    fullName: 'Heating, Ventilation, and Air Conditioning',
    localizedFullNames: {
      ar: 'التدفئة والتهوية وتكييف الهواء (HVAC)',
    },
    category: 'engineering_construction',
    variants: [
      'HVAC',
      'Heating, Ventilation, and Air Conditioning',
      'Heating Ventilation and Air Conditioning',
      'التدفئة والتهوية وتكييف الهواء',
      'التكييف والتبريد',
    ],
  },
  {
    id: 'hse',
    canonical: 'Health, Safety, and Environment',
    acronym: 'HSE',
    fullName: 'Health, Safety, and Environment',
    localizedFullNames: {
      ar: 'الصحة والسلامة المهنية والبيئة (HSE)',
    },
    category: 'engineering_construction',
    variants: [
      'HSE',
      'EHS',
      'OHS',
      'Health, Safety, and Environment',
      'Health Safety and Environment',
      'Occupational Health and Safety',
      'الصحة والسلامة المهنية والبيئة',
      'السلامة والصحة المهنية',
    ],
  },
  {
    id: 'mep',
    canonical: 'Mechanical, Electrical, and Plumbing',
    acronym: 'MEP',
    fullName: 'Mechanical, Electrical, and Plumbing',
    localizedFullNames: {
      ar: 'الأعمال الميكانيكية والكهربائية والصحية (MEP)',
    },
    category: 'engineering_construction',
    variants: [
      'MEP',
      'Mechanical, Electrical, and Plumbing',
      'Mechanical Electrical and Plumbing',
      'الأعمال الميكانيكية والكهربائية والصحية',
      'إلكتروميكانيك',
    ],
  },

  // ============================================================================
  // HEALTHCARE & MEDICAL
  // ============================================================================
  {
    id: 'emr',
    canonical: 'Electronic Medical Records',
    acronym: 'EMR',
    fullName: 'Electronic Medical Records',
    localizedFullNames: {
      ar: 'السجلات الطبية الإلكترونية (EMR / EHR)',
      fr: 'Dossier médical électronique',
      de: 'Elektronische Patientenakte',
      es: 'Historia clínica electrónica',
      tr: 'Elektronik Sağlık Kaydı',
    },
    category: 'healthcare_medical',
    variants: [
      'EMR',
      'EHR',
      'Electronic Medical Records',
      'Electronic Health Records',
      'السجلات الطبية الإلكترونية',
      'الملفات الصحية الإلكترونية',
      'Dossier médical électronique',
      'Elektronische Patientenakte',
      'Historia clínica electrónica',
      'Elektronik Sağlık Kaydı',
    ],
  },
  {
    id: 'icu',
    canonical: 'Intensive Care Unit',
    acronym: 'ICU',
    fullName: 'Intensive Care Unit',
    localizedFullNames: {
      ar: 'وحدة العناية المركزة (ICU)',
      fr: 'Unité de soins intensifs',
      de: 'Intensivstation',
      es: 'Unidad de Cuidados Intensivos (UCI)',
      tr: 'Yoğun Bakım Ünitesi (YBÜ)',
    },
    category: 'healthcare_medical',
    variants: [
      'ICU',
      'Intensive Care Unit',
      'Intensive Care',
      'العناية المركزة',
      'وحدة العناية المركزة',
      'Unité de soins intensifs',
      'Soins intensifs',
      'Intensivstation',
      'Unidad de Cuidados Intensivos',
      'UCI',
      'Yoğun Bakım Ünitesi',
      'YBÜ',
    ],
  },

  // ============================================================================
  // JOB TITLES / ROLE EQUIVALENCES (Multilingual)
  // ============================================================================
  {
    id: 'role_software_engineer',
    canonical: 'Software Engineer',
    fullName: 'Software Engineer',
    category: 'role_title',
    variants: [
      'Software Engineer',
      'Software Developer',
      'Application Developer',
      'SWE',
      'مهندس برمجيات',
      'مطور برمجيات',
      'Ingénieur logiciel',
      'Développeur logiciel',
      'Softwareentwickler',
      'Software-Ingenieur',
      'Ingeniero de software',
      'Desarrollador de software',
      'Yazılım Mühendisi',
      'Yazılım Geliştirici',
    ],
  },
  {
    id: 'role_frontend_developer',
    canonical: 'Frontend Developer',
    fullName: 'Frontend Developer',
    category: 'role_title',
    variants: [
      'Frontend Developer',
      'Front-End Developer',
      'Front End Developer',
      'Frontend Engineer',
      'Front-End Engineer',
      'UI Developer',
      'مطور واجهات أمامية',
      'مهندس واجهات أمامية',
      'مطور فرونت إند',
      'Développeur Front-End',
      'Développeur Frontend',
      'Frontend-Entwickler',
      'Desarrollador Frontend',
      'Desarrollador Front-End',
      'Ön Yüz Geliştirici',
      'Frontend Geliştirici',
    ],
  },
  {
    id: 'role_backend_developer',
    canonical: 'Backend Developer',
    fullName: 'Backend Developer',
    category: 'role_title',
    variants: [
      'Backend Developer',
      'Back-End Developer',
      'Back End Developer',
      'Backend Engineer',
      'Back-End Engineer',
      'مطور خلفية',
      'مهندس برمجيات خلفية',
      'مطور باك إند',
      'Développeur Back-End',
      'Développeur Backend',
      'Backend-Entwickler',
      'Desarrollador Backend',
      'Desarrollador Back-End',
      'Arka Uç Geliştirici',
      'Backend Geliştirici',
    ],
  },
  {
    id: 'role_fullstack_developer',
    canonical: 'Full-Stack Developer',
    fullName: 'Full-Stack Developer',
    category: 'role_title',
    variants: [
      'Full-Stack Developer',
      'Full Stack Developer',
      'Fullstack Developer',
      'Full-Stack Engineer',
      'Full Stack Engineer',
      'Fullstack Engineer',
      'مطور شامل',
      'مطور ويب متكامل',
      'مهندس برمجيات متكامل',
      'مطور فول ستاك',
      'Développeur Full-Stack',
      'Développeur Full Stack',
      'Full-Stack-Entwickler',
      'Desarrollador Full-Stack',
      'Desarrollador Full Stack',
      'Full Stack Geliştirici',
    ],
  },
  {
    id: 'role_accountant',
    canonical: 'Accountant',
    fullName: 'Accountant',
    category: 'role_title',
    variants: [
      'Accountant',
      'Financial Accountant',
      'General Accountant',
      'Senior Accountant',
      'Staff Accountant',
      'Corporate Accountant',
      'محاسب',
      'محاسب مالي',
      'محاسب عام',
      'محاسب أول',
      'رئيس حسابات',
      'Comptable',
      'Chef comptable',
      'Buchhalter',
      'Finanzbuchhalter',
      'Bilanzbuchhalter',
      'Contador',
      'Contable',
      'Contador financiero',
      'Muhasebeci',
      'Mali Müşavir',
      'Muhasebe Uzmanı',
    ],
  },
  {
    id: 'role_marketer',
    canonical: 'Digital Marketing Specialist',
    fullName: 'Digital Marketing Specialist',
    category: 'role_title',
    variants: [
      'Digital Marketing Specialist',
      'Marketing Specialist',
      'Digital Marketer',
      'Marketing Manager',
      'Digital Marketing Manager',
      'Growth Marketer',
      'Performance Marketer',
      'أخصائي تسويق رقمي',
      'أخصائي تسويق',
      'مسوق رقمي',
      'مسوّق رقمي',
      'مدير تسويق',
      'مدير تسويق رقمي',
      'Spécialiste du marketing numérique',
      'Responsable marketing',
      'Online-Marketing-Manager',
      'Marketing-Spezialist',
      'Especialista en marketing digital',
      'Gerente de marketing',
      'Dijital Pazarlama Uzmanı',
      'Pazarlama Uzmanı',
    ],
  },
  {
    id: 'role_civil_engineer',
    canonical: 'Civil Engineer',
    fullName: 'Civil Engineer',
    category: 'role_title',
    variants: [
      'Civil Engineer',
      'Site Engineer',
      'Structural Engineer',
      'Construction Engineer',
      'Senior Civil Engineer',
      'مهندس مدني',
      'مهندس موقع',
      'مهندس إنشائي',
      'مهندس تنفيذ',
      'مهندس مدني أول',
      'Ingénieur civil',
      'Ingénieur travaux',
      'Bauingenieur',
      'Bauleiter',
      'Ingeniero civil',
      'Ingeniero de obra',
      'İnşaat Mühendisi',
      'Saha Mühendisi',
    ],
  },
  {
    id: 'role_doctor',
    canonical: 'Physician',
    fullName: 'Physician / Medical Doctor',
    category: 'role_title',
    variants: [
      'Physician',
      'Medical Doctor',
      'General Practitioner',
      'Resident Physician',
      'Specialist Physician',
      'MD',
      'طبيب',
      'طبيب بشري',
      'طبيب عام',
      'طبيب مقيم',
      'أخصائي طبي',
      'Médecin',
      'Arzt',
      'Assistenzarzt',
      'Facharzt',
      'Médico',
      'Doktor',
      'Hekim',
      'Tıp Doktoru',
    ],
  },
  {
    id: 'role_hr_specialist',
    canonical: 'Human Resources Specialist',
    fullName: 'Human Resources Specialist',
    category: 'role_title',
    variants: [
      'Human Resources Specialist',
      'HR Specialist',
      'HR Manager',
      'Human Resources Manager',
      'Talent Acquisition Specialist',
      'Recruiter',
      'People Operations',
      'أخصائي موارد بشرية',
      'مدير موارد بشرية',
      'مسؤول توظيف',
      'Spécialiste RH',
      'Responsable RH',
      'Personalreferent',
      'Personalleiter',
      'Especialista en Recursos Humanos',
      'İnsan Kaynakları Uzmanı',
      'İK Uzmanı',
    ],
  },
];

// Build fast lookup maps at module load time
const VARIANT_TO_GROUP = new Map<string, SynonymGroup>();
const ID_TO_GROUP = new Map<string, SynonymGroup>();

for (const group of SYNONYM_GROUPS) {
  ID_TO_GROUP.set(group.id, group);
  VARIANT_TO_GROUP.set(cleanSurfaceTerm(group.canonical), group);
  VARIANT_TO_GROUP.set(cleanSurfaceTerm(group.fullName), group);
  if (group.acronym) {
    VARIANT_TO_GROUP.set(cleanSurfaceTerm(group.acronym), group);
  }
  for (const variant of group.variants) {
    VARIANT_TO_GROUP.set(cleanSurfaceTerm(variant), group);
  }
}

/**
 * Normalizes any term (English, Arabic, French, German, Spanish, Turkish,
 * acronym or full phrase) into its standard canonical form prior to matching.
 *
 * Examples:
 * - normalizeTerm("K8s") === normalizeTerm("Kubernetes") -> "kubernetes"
 * - normalizeTerm("SEO") === normalizeTerm("Search Engine Optimization") === normalizeTerm("تحسين محركات البحث") -> "seo"
 * - normalizeTerm("إدارة علاقات العملاء") === normalizeTerm("CRM") -> "crm"
 */
export function normalizeTerm(term: string): string {
  const cleaned = cleanSurfaceTerm(term);
  if (!cleaned) return '';
  const group = VARIANT_TO_GROUP.get(cleaned);
  if (group) {
    return group.id;
  }
  return cleaned;
}

/**
 * Finds the SynonymGroup associated with a term, if one exists.
 */
export function findSynonymGroup(term: string): SynonymGroup | undefined {
  const cleaned = cleanSurfaceTerm(term);
  if (!cleaned) return undefined;
  return VARIANT_TO_GROUP.get(cleaned) || ID_TO_GROUP.get(cleaned);
}

/**
 * Checks whether a single variant appears in the given text (using boundary-safe matching
 * for Latin and normalized Arabic matching for Arabic scripts).
 */
export function countVariantOccurrences(
  rawText: string,
  normalizedArabicFullText: string,
  variant: string
): number {
  const trimmed = variant.trim();
  if (!trimmed) return 0;

  const hasArabic = /[\u0600-\u06FF]/.test(trimmed);
  if (hasArabic) {
    const normVariant = cleanSurfaceTerm(trimmed);
    if (!normVariant) return 0;
    const escaped = normVariant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^\\u0600-\\u06FFa-zA-Z0-9])${escaped}(?=$|[^\\u0600-\\u06FFa-zA-Z0-9])`, 'gi');
    const matches = normalizedArabicFullText.match(regex);
    return matches ? matches.length : 0;
  }

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^a-zA-Z0-9+#.])${escaped}(?=$|[^a-zA-Z0-9+#.])`, 'gi');
  const matches = rawText.match(regex);
  return matches ? matches.length : 0;
}

export interface SynonymMatchResult {
  /** Whether the term or any of its synonyms was found in the resume */
  found: boolean;
  /** Total occurrences across all variants of the group */
  totalCount: number;
  /** Whether the exact requested surface form was found */
  exactFormFound: boolean;
  /** Which variant was actually found in the resume (e.g. "K8s") */
  matchedVariant?: string;
  /** If matched via synonym/acronym only, the recommended missing form to add (e.g. "Kubernetes") */
  recommendedFormToAdd?: string;
  /** Whether the matched variant is an acronym and the missing form is the full name */
  isAcronymToFullNameAdvice?: boolean;
  /** Canonical name of the matched concept */
  canonical: string;
  /** Group metadata if matched through a synonym group */
  group?: SynonymGroup;
}

/**
 * Matches a target term against resume text with full synonym/acronym awareness.
 * If matched via a synonym/acronym while the literal requested form (or complementary full name/acronym)
 * is missing, returns `recommendedFormToAdd` so the analyzer can advise the user.
 */
export function matchTermWithSynonyms(
  resumeText: string,
  targetTerm: string,
  normalizedArabicResume?: string
): SynonymMatchResult {
  const normAr = normalizedArabicResume ?? cleanSurfaceTerm(resumeText);
  const group = findSynonymGroup(targetTerm);

  if (!group) {
    const count = countVariantOccurrences(resumeText, normAr, targetTerm);
    return {
      found: count > 0,
      totalCount: count,
      exactFormFound: count > 0,
      matchedVariant: count > 0 ? targetTerm : undefined,
      canonical: targetTerm,
    };
  }

  const targetCount = countVariantOccurrences(resumeText, normAr, targetTerm);
  let totalCount = 0;
  const foundVariants: { variant: string; count: number }[] = [];

  for (const variant of group.variants) {
    const c = countVariantOccurrences(resumeText, normAr, variant);
    if (c > 0) {
      totalCount += c;
      foundVariants.push({ variant, count: c });
    }
  }

  if (totalCount === 0) {
    return {
      found: false,
      totalCount: 0,
      exactFormFound: false,
      canonical: group.canonical,
      group,
    };
  }

  const primaryMatchedVariant = foundVariants[0].variant;
  const acronymCount = group.acronym
    ? countVariantOccurrences(resumeText, normAr, group.acronym)
    : 0;
  const fullNameCount = countVariantOccurrences(resumeText, normAr, group.fullName);

  // Determine if we should advise adding the complementary form:
  // Case A: Exact targetTerm was NOT found in resume (matched only via synonym/acronym)
  if (targetCount === 0) {
    const isMatchedAcronym =
      Boolean(group.acronym) &&
      cleanSurfaceTerm(primaryMatchedVariant) === cleanSurfaceTerm(group.acronym!);
    return {
      found: true,
      totalCount,
      exactFormFound: false,
      matchedVariant: primaryMatchedVariant,
      recommendedFormToAdd:
        cleanSurfaceTerm(targetTerm) === cleanSurfaceTerm(primaryMatchedVariant)
          ? group.fullName
          : targetTerm,
      isAcronymToFullNameAdvice: isMatchedAcronym,
      canonical: group.canonical,
      group,
    };
  }

  // Case B: Even if targetTerm was found (or when scanning general catalog),
  // if the resume ONLY has the acronym (e.g. "K8s" or "SEO") and NOT the full name ("Kubernetes" or "Search Engine Optimization")
  if (
    group.acronym &&
    cleanSurfaceTerm(group.acronym) !== cleanSurfaceTerm(group.fullName) &&
    acronymCount > 0 &&
    fullNameCount === 0
  ) {
    return {
      found: true,
      totalCount,
      exactFormFound: true,
      matchedVariant: group.acronym,
      recommendedFormToAdd: group.fullName,
      isAcronymToFullNameAdvice: true,
      canonical: group.canonical,
      group,
    };
  }

  return {
    found: true,
    totalCount,
    exactFormFound: true,
    matchedVariant: primaryMatchedVariant,
    canonical: group.canonical,
    group,
  };
}

/**
 * Formats the localized ATS advice when a synonym/acronym is found without its complementary full name or literal form.
 */
export function formatSynonymAdvice(
  foundVariant: string,
  missingForm: string,
  isAcronymToFull: boolean,
  lang: DocumentLanguage
): string {
  const templates: Record<DocumentLanguage, { acronymToFull: string; variantToExact: string }> = {
    ar: {
      acronymToFull: `وجدنا الاختصار ${foundVariant}؛ ننصح بكتابة الاسم الكامل ${missingForm} أيضاً للـ ATS.`,
      variantToExact: `وجدنا المرادف ${foundVariant}؛ ننصح بكتابة الصيغة المطلوبة ${missingForm} أيضاً للـ ATS.`,
    },
    en: {
      acronymToFull: `Found the abbreviation ${foundVariant}; we recommend also writing the full name ${missingForm} for ATS parsers.`,
      variantToExact: `Found the synonym ${foundVariant}; we recommend also including the exact term ${missingForm} for ATS matching.`,
    },
    fr: {
      acronymToFull: `Nous avons trouvé l'abréviation ${foundVariant} ; nous conseillons d'écrire aussi le nom complet ${missingForm} pour les ATS.`,
      variantToExact: `Nous avons trouvé le synonyme ${foundVariant} ; nous conseillons d'inclure aussi le terme exact ${missingForm} pour les ATS.`,
    },
    de: {
      acronymToFull: `Wir haben die Abkürzung ${foundVariant} gefunden; wir empfehlen, auch den vollständigen Namen ${missingForm} für ATS-Systeme zu schreiben.`,
      variantToExact: `Wir haben das Synonym ${foundVariant} gefunden; wir empfehlen, auch den exakten Begriff ${missingForm} für das ATS aufzunehmen.`,
    },
    es: {
      acronymToFull: `Encontramos la abreviatura ${foundVariant}; recomendamos escribir también el nombre completo ${missingForm} para el ATS.`,
      variantToExact: `Encontramos el sinónimo ${foundVariant}; recomendamos incluir también el término exacto ${missingForm} para el ATS.`,
    },
    tr: {
      acronymToFull: `${foundVariant} kısaltmasını bulduk; ATS için tam adı olan ${missingForm} ifadesini de yazmanızı öneririz.`,
      variantToExact: `${foundVariant} eş anlamlısını bulduk; ATS uyumu için ${missingForm} ifadesini de eklemenizi öneririz.`,
    },
  };

  const t = templates[lang] || templates.en;
  return isAcronymToFull ? t.acronymToFull : t.variantToExact;
}
