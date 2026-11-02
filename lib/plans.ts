import { LanguageCode } from '@/app/lib/translations/types';

export type CurrencyCode = 'USD' | 'EGP';
export type BillingCycle = 'monthly' | 'annual';
export type PlanType = 'free' | 'subscription' | 'one_time';
export type HrPackId = 'hr_pack_50' | 'hr_pack_200' | 'hr_pack_1000';
export type PlanId = 'free' | 'pro' | 'payg' | HrPackId;

/**
 * Number of credits consumed per AI Resume or CV generation on Pay-As-You-Go
 */
export const RESUME_GENERATION_CREDIT_COST = 2;

/**
 * Number of free Job Match searches included on the Starter (Free) tier
 */
export const JOB_MATCH_FREE_QUOTA = 3;

/**
 * Number of credits consumed per Job Match search on Pay-As-You-Go (after JOB_MATCH_FREE_QUOTA free searches)
 */
export const JOB_MATCH_CREDIT_COST = 1;

/**
 * Daily AI request limits per user plan tier (Fair-Use & Cost Protection)
 */
export const FREE_DAILY_AI_LIMIT = 5;
export const PAYG_DAILY_AI_LIMIT = 25;
export const PRO_DAILY_AI_LIMIT = 50;

export interface LocalizedString {
  en: string;
  ar: string;
  fr?: string;
  de?: string;
  es?: string;
  tr?: string;
}

export function getLocalized(str: LocalizedString, lang: string = 'en'): string {
  if (!str) return '';
  return (str as any)[lang] || str.en || str.ar || '';
}

export interface PlanFeature {
  text: LocalizedString;
  included: boolean;
  highlight?: boolean;
}

export interface PlanConfig {
  id: PlanId;
  name: LocalizedString;
  tagline: LocalizedString;
  description: LocalizedString;
  type: PlanType;
  popular?: boolean;
  badge?: LocalizedString;
  credits: number | 'unlimited';
  dailyAiLimit: number;
  pricing: {
    USD: {
      monthly?: number;
      annualMonthly?: number;
      annualTotal?: number;
      oneTime?: number;
      savingsPercentage?: number;
    };
    EGP: {
      monthly?: number;
      annualMonthly?: number;
      annualTotal?: number;
      oneTime?: number;
      savingsPercentage?: number;
    };
  };
  features: PlanFeature[];
  cta: LocalizedString;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: {
      en: 'Starter',
      ar: 'الباقة المجانية',
      fr: 'Gratuit',
      de: 'Basis',
      es: 'Inicial',
      tr: 'Başlangıç',
    },
    tagline: {
      en: 'Free forever for basic job applications',
      ar: 'مجاناً مدى الحياة لتقديمات العمل الأساسية',
      fr: 'Gratuit à vie pour vos candidatures courantes',
      de: 'Dauerhaft kostenlos für grundlegende Bewerbungen',
      es: 'Gratis para siempre para postulaciones básicas',
      tr: 'Temel iş başvuruları için sonsuza dek ücretsiz',
    },
    description: {
      en: 'Essential tools to build standard ATS-compliant resumes and explore AI generation.',
      ar: 'الأدوات الأساسية لإنشاء سيرة ذاتية متوافقة مع أنظمة ATS وتجربة الذكاء الاصطناعي.',
      fr: 'Outils essentiels pour concevoir un CV compatible ATS et tester l’IA.',
      de: 'Wesentliche Werkzeuge zur Erstellung ATS-konformer Lebensläufe.',
      es: 'Herramientas esenciales para crear CV compatibles con ATS y probar la IA.',
      tr: 'ATS uyumlu özgeçmiş oluşturmak ve yapay zekayı denemek için temel araçlar.',
    },
    type: 'free',
    popular: false,
    credits: 3,
    dailyAiLimit: FREE_DAILY_AI_LIMIT,
    pricing: {
      USD: {
        monthly: 0,
        annualMonthly: 0,
        annualTotal: 0,
        oneTime: 0,
      },
      EGP: {
        monthly: 0,
        annualMonthly: 0,
        annualTotal: 0,
        oneTime: 0,
      },
    },
    features: [
      {
        text: {
          en: '1 AI Resume/CV generation total (taste)',
          ar: 'توليد سيرة ذاتية أو CV بالذكاء الاصطناعي لمرة واحدة (تجربة مجانية)',
          fr: '1 génération de CV par IA au total (essai)',
          de: '1 KI-Lebenslauf-/CV-Generierung insgesamt (Testversion)',
          es: '1 generación de CV con IA en total (prueba)',
          tr: 'Toplam 1 yapay zeka özgeçmiş/CV üretimi (deneme)',
        },
        included: true,
      },
      {
        text: {
          en: '3 Free Job Match searches with smart deep-links',
          ar: '3 عمليات بحث مجانية في مطابقة الوظائف مع روابط البحث الذكية',
          fr: '3 recherches Job Match gratuites avec liens profonds',
          de: '3 kostenlose Job-Match-Suchen mit Deep-Links',
          es: '3 búsquedas de Job Match gratuitas con enlaces inteligentes',
          tr: 'Akıllı bağlantılarla 3 ücretsiz Job Match araması',
        },
        included: true,
      },
      {
        text: {
          en: '3 AI cover letter generations & edits',
          ar: '3 عمليات توليد لخطابات التقديم بالذكاء الاصطناعي',
          fr: '3 générations IA (lettres et modifications)',
          de: '3 KI-Generierungen (Anschreiben & Überarbeitungen)',
          es: '3 generaciones de IA (cartas y revisiones)',
          tr: '3 yapay zeka üretimi (ön yazı ve düzenlemeler)',
        },
        included: true,
      },
      {
        text: {
          en: '100% Free ATS scan & keyword analysis',
          ar: 'فحص ATS كامل وتحليل الكلمات المفتاحية مجاناً',
          fr: 'Audit ATS 100% gratuit et analyse de mots-clés',
          de: '100% kostenloser ATS-Scan & Keyword-Analyse',
          es: 'Escaneo ATS 100% gratuito y análisis de palabras clave',
          tr: '%100 ücretsiz ATS taraması ve anahtar kelime analizi',
        },
        included: true,
      },
      {
        text: {
          en: 'Basic ATS-friendly resume templates',
          ar: 'قوالب سيرة ذاتية أساسية متوافقة مع ATS',
          fr: 'Modèles de CV compatibles ATS de base',
          de: 'Klassische ATS-freundliche Vorlagen',
          es: 'Plantillas de CV básicas compatibles con ATS',
          tr: 'Temel ATS uyumlu özgeçmiş şablonları',
        },
        included: true,
      },
      {
        text: {
          en: 'Standard PDF export with basic formatting',
          ar: 'تصدير PDF بتنسيق قياسي',
          fr: 'Export PDF standard',
          de: 'Standardmäßiger PDF-Export',
          es: 'Exportación a PDF estándar',
          tr: 'Standart PDF dışa aktarma',
        },
        included: true,
      },
      {
        text: {
          en: 'Community support & documentation',
          ar: 'دعم المجتمع والتوثيق',
          fr: 'Support communautaire et documentation',
          de: 'Community-Support & Dokumentation',
          es: 'Soporte comunitario y documentación',
          tr: 'Topluluk desteği ve belgeler',
        },
        included: true,
      },
      {
        text: {
          en: 'Watermark-free Word (.docx) export',
          ar: 'تصدير Word (.docx) بدون علامة مائية',
          fr: 'Export Word (.docx) sans filigrane',
          de: 'Word (.docx) Export ohne Wasserzeichen',
          es: 'Exportación a Word (.docx) sin marcas de agua',
          tr: 'Filigransız Word (.docx) dışa aktarma',
        },
        included: false,
      },
      {
        text: {
          en: 'Unlimited AI cover letter revisions',
          ar: 'تعديلات وتوليد غير محدود لخطابات التقديم',
          fr: 'Révisions illimitées de lettres par IA',
          de: 'Unbegrenzte KI-Anschreiben-Überarbeitungen',
          es: 'Revisiones ilimitadas de cartas con IA',
          tr: 'Sınırsız yapay zeka ön yazı revizyonu',
        },
        included: false,
      },
    ],
    cta: {
      en: 'Get Started Free',
      ar: 'ابدأ مجاناً',
      fr: 'Commencer Gratuitement',
      de: 'Kostenlos starten',
      es: 'Comenzar Gratis',
      tr: 'Ücretsiz Başla',
    },
  },
  {
    id: 'pro',
    name: {
      en: 'JobMatch Pro',
      ar: 'جوب ماتش برو',
      fr: 'JobMatch Pro',
      de: 'JobMatch Pro',
      es: 'JobMatch Pro',
      tr: 'JobMatch Pro',
    },
    tagline: {
      en: 'For dedicated candidates targeting top job offers',
      ar: 'للمحترفين والباحثين عن أفضل العروض الوظيفية',
      fr: 'Pour les candidats visant les meilleures offres',
      de: 'Für zielorientierte Bewerber auf Top-Stellen',
      es: 'Para profesionales que buscan las mejores ofertas',
      tr: 'En iyi teklifleri hedefleyen adaylar için',
    },
    description: {
      en: 'Unlimited AI generations, all templates, watermark-free exports, and VIP priority.',
      ar: 'توليد غير محدود بالذكاء الاصطناعي، جميع القوالب، تصدير بدون علامة مائية، وأولوية قصوى.',
      fr: 'Générations IA illimitées, tous les modèles et exports Word/PDF vectoriels.',
      de: 'Unbegrenzte KI-Generierungen, alle Vorlagen und saubere Exporte.',
      es: 'Generaciones de IA ilimitadas, todas las plantillas y exportaciones limpias.',
      tr: 'Sınırsız yapay zeka üretimi, tüm şablonlar ve filigransız dışa aktarma.',
    },
    type: 'subscription',
    popular: true,
    badge: {
      en: 'Most Popular',
      ar: 'الأكثر شيوعاً',
      fr: 'Le Plus Populaire',
      de: 'Beliebteste Wahl',
      es: 'Más Popular',
      tr: 'En Popüler',
    },
    credits: 'unlimited',
    dailyAiLimit: PRO_DAILY_AI_LIMIT,
    pricing: {
      USD: {
        monthly: 9,
        annualMonthly: 7,
        annualTotal: 84,
        savingsPercentage: 22,
      },
      EGP: {
        monthly: 350,
        annualMonthly: 275,
        annualTotal: 3300,
        savingsPercentage: 22,
      },
    },
    features: [
      {
        text: {
          en: 'Unlimited AI Resume & CV generations with ATS optimization',
          ar: 'توليد غير محدود للسير الذاتية وCV بالذكاء الاصطناعي مع تحسين الـ ATS',
          fr: 'Générations illimitées de CV et résumés par IA avec optimisation ATS',
          de: 'Unbegrenzte KI-Lebenslauf- & CV-Generierungen mit ATS-Optimierung',
          es: 'Generaciones ilimitadas de CV con IA y optimización ATS',
          tr: 'ATS optimizasyonlu sınırsız yapay zeka özgeçmiş ve CV üretimi',
        },
        included: true,
        highlight: true,
      },
      {
        text: {
          en: 'Unlimited Job Match searches across 10+ platforms & open APIs',
          ar: 'بحث غير محدود في مطابقة الوظائف عبر 10+ منصات وواجهات API مفتوحة',
          fr: 'Recherches Job Match illimitées sur plus de 10 plateformes',
          de: 'Unbegrenzte Job-Match-Suchen auf 10+ Plattformen & offenen APIs',
          es: 'Búsquedas ilimitadas de Job Match en más de 10 plataformas',
          tr: '10+ platform ve açık API’de sınırsız Job Match araması',
        },
        included: true,
        highlight: true,
      },
      {
        text: {
          en: 'Unlimited AI cover letters customized for any job description',
          ar: 'توليد غير محدود لخطابات التقديم المخصصة لأي وصف وظيفي',
          fr: 'Lettres de motivation IA illimitées adaptées à chaque annonce',
          de: 'Unbegrenzte KI-Anschreiben für jedes Stellenprofil',
          es: 'Cartas de presentación ilimitadas adaptadas a cualquier oferta',
          tr: 'Her iş ilanına uyarlanmış sınırsız yapay zeka ön yazısı',
        },
        included: true,
        highlight: true,
      },
      {
        text: {
          en: 'All 5 professional ATS & classic templates unlocked',
          ar: 'فتح جميع القوالب الخمسة الاحترافية المعتمدة للـ ATS',
          fr: 'Accès aux 5 modèles professionnels compatibles ATS',
          de: 'Alle 5 professionellen ATS-Vorlagen freigeschaltet',
          es: 'Las 5 plantillas profesionales de ATS desbloqueadas',
          tr: 'Tüm 5 profesyonel ATS şablonunun kilidi açık',
        },
        included: true,
      },
      {
        text: {
          en: 'Unrestricted Word (.docx) & Vector PDF exports',
          ar: 'تصدير مفتوح بصيغتي Word (.docx) و PDF عالي الدقة',
          fr: 'Exports illimités Word (.docx) et PDF vectoriel',
          de: 'Uneingeschränkter Word (.docx) & Vektor-PDF-Export',
          es: 'Exportaciones ilimitadas a Word (.docx) y PDF vectorial',
          tr: 'Sınırsız Word (.docx) ve vektörel PDF dışa aktarma',
        },
        included: true,
      },
      {
        text: {
          en: 'Deep ATS Diagnostic (Keyword density & structure audit)',
          ar: 'فحص ATS متقدم وتشخيص عميق لكثافة الكلمات والتنسيق',
          fr: 'Audit ATS approfondi (densité de mots-clés et structure)',
          de: 'Tiefgehende ATS-Diagnose mit Keyword-Dichte-Prüfung',
          es: 'Diagnóstico ATS profundo (densidad de palabras clave)',
          tr: 'Derin ATS teşhisi (anahtar kelime yoğunluğu ve yapı)',
        },
        included: true,
        highlight: true,
      },
      {
        text: {
          en: 'Tone & language customizer (Formal, Friendly, Confident, Technical)',
          ar: 'تخصيص كامل للنبرة واللغة (رسمي، ودي، واثق، تقني)',
          fr: 'Personnalisation du ton (formel, amical, confiant, technique)',
          de: 'Tonfall-Anpassung (Formell, Freundlich, Selbstbewusst, Technisch)',
          es: 'Selector de tono (formal, cercano, seguro, técnico)',
          tr: 'Ton özelleştirme (Resmi, Samimi, Özgüvenli, Teknik)',
        },
        included: true,
      },
      {
        text: {
          en: 'Priority email & chat support',
          ar: 'أولوية في الدعم الفني عبر البريد والمحادثة',
          fr: 'Support prioritaire par e-mail et chat',
          de: 'Prioritärer E-Mail- & Chat-Support',
          es: 'Soporte prioritario por correo y chat',
          tr: 'Öncelikli e-posta ve sohbet desteği',
        },
        included: true,
      },
    ],
    cta: {
      en: 'Upgrade to Pro',
      ar: 'ترقية إلى باقة برو',
      fr: 'Passer à Pro',
      de: 'Auf Pro upgraden',
      es: 'Mejorar a Pro',
      tr: 'Pro’ya Yükselt',
    },
  },
  {
    id: 'payg',
    name: {
      en: 'Pay-As-You-Go',
      ar: 'الدفع حسب الاستخدام',
      fr: 'À la Carte',
      de: 'Pay-As-You-Go',
      es: 'Pago por Uso',
      tr: 'Kullandıkça Öde',
    },
    tagline: {
      en: 'Flexible bundle for occasional applications',
      ar: 'باقة مرنة بدون اشتراك شهري للتقديمات المتقطعة',
      fr: 'Crédits flexibles sans abonnement pour besoins ponctuels',
      de: 'Flexibles Guthaben ohne Abonnement',
      es: 'Créditos flexibles sin suscripción mensual',
      tr: 'Aboneliksiz, esnek kullanım paketi',
    },
    description: {
      en: 'One-time purchase of 15 AI credits that never expire. Zero recurring billing.',
      ar: 'شراء لمرة واحدة لـ 15 نقطة توليد بالذكاء الاصطناعي لا تنتهي صلاحيتها أبداً وبدون تجديد تلقائي.',
      fr: 'Achat unique de 15 crédits IA sans expiration ni renouvellement.',
      de: 'Einmaliger Kauf von 15 KI-Guthaben ohne Verfallsdatum.',
      es: 'Compra única de 15 créditos de IA que nunca caducan.',
      tr: 'Süresi asla dolmayan tek seferlik 15 yapay zeka kredisi.',
    },
    type: 'one_time',
    popular: false,
    credits: 15,
    dailyAiLimit: PAYG_DAILY_AI_LIMIT,
    pricing: {
      USD: {
        oneTime: 5,
      },
      EGP: {
        oneTime: 199,
      },
    },
    features: [
      {
        text: {
          en: '15 AI generation credits (never expire)',
          ar: '15 نقطة توليد ذكية صالحة مدى الحياة',
          fr: '15 crédits IA à vie sans expiration',
          de: '15 lebenslang gültige KI-Credits',
          es: '15 créditos de IA de por vida',
          tr: 'Ömür boyu geçerli 15 yapay zeka kredisi',
        },
        included: true,
        highlight: true,
      },
      {
        text: {
          en: 'AI Resume & CV generation (costs 2 credits / document)',
          ar: 'توليد السير الذاتية وCV بالذكاء الاصطناعي (نقطتان لكل مستند)',
          fr: 'Génération de CV par IA (2 crédits par document)',
          de: 'KI-Lebenslauf-Generierung (kostet 2 Credits pro Dokument)',
          es: 'Generación de CV con IA (cuesta 2 créditos por documento)',
          tr: 'Yapay zeka özgeçmiş/CV üretimi (belge başına 2 kredi)',
        },
        included: true,
        highlight: true,
      },
      {
        text: {
          en: 'Job Match search (costs 1 credit / search after 3 free)',
          ar: 'مطابقة الوظائف (نقطة واحدة لكل بحث بعد استهلاك الـ 3 المجانية)',
          fr: 'Recherche Job Match (1 crédit par recherche après les 3 gratuites)',
          de: 'Job-Match-Suche (1 Credit pro Suche nach den 3 kostenlosen)',
          es: 'Búsqueda de Job Match (1 crédito por búsqueda tras las 3 gratuitas)',
          tr: 'Job Match araması (3 ücretsizden sonra arama başına 1 kredi)',
        },
        included: true,
        highlight: true,
      },
      {
        text: {
          en: 'No monthly subscription or automatic renewal',
          ar: 'بدون اشتراك شهري أو تجديد تلقائي',
          fr: 'Sans abonnement ni prélèvement récurrent',
          de: 'Kein Monatsabo, keine automatische Verlängerung',
          es: 'Sin suscripción mensual ni cobros automáticos',
          tr: 'Aylık abonelik veya otomatik yenileme yok',
        },
        included: true,
      },
      {
        text: {
          en: 'Access to all templates for generated documents',
          ar: 'الوصول لجميع القوالب للوثائق المولدة',
          fr: 'Accès à tous les modèles pour les documents créés',
          de: 'Zugriff auf alle Vorlagen für generierte Dokumente',
          es: 'Acceso a todas las plantillas para tus documentos',
          tr: 'Oluşturulan belgeler için tüm şablonlara erişim',
        },
        included: true,
      },
      {
        text: {
          en: 'Word & PDF export capabilities',
          ar: 'إمكانية التصدير بصيغ Word و PDF',
          fr: 'Exportations Word et PDF',
          de: 'Word & PDF Exportoptionen',
          es: 'Exportación a Word y PDF',
          tr: 'Word ve PDF dışa aktarma',
        },
        included: true,
      },
      {
        text: {
          en: 'Standard email support',
          ar: 'دعم عبر البريد الإلكتروني',
          fr: 'Support standard par e-mail',
          de: 'Standardmäßiger E-Mail-Support',
          es: 'Soporte estándar por correo',
          tr: 'Standart e-posta desteği',
        },
        included: true,
      },
    ],
    cta: {
      en: 'Buy 15 Credits',
      ar: 'شراء 15 نقطة',
      fr: 'Acheter 15 Crédits',
      de: '15 Credits kaufen',
      es: 'Comprar 15 Créditos',
      tr: '15 Kredi Satın Al',
    },
  },
];

export const HR_CREDIT_PACKS: PlanConfig[] = [
  {
    id: 'hr_pack_50',
    name: {
      en: '50 HR Credits Pack',
      ar: 'باقة 50 كريدت للتوظيف (HR)',
      fr: 'Pack 50 Crédits RH',
      de: '50 HR-Credits Paket',
      es: 'Paquete de 50 Créditos RRHH',
      tr: '50 İK Kredisi Paketi',
    },
    tagline: {
      en: 'Ideal for startups hiring 1–3 roles',
      ar: 'مثالية للشركات الناشئة لتوظيف 1–3 وظائف',
      fr: 'Idéal pour les startups recrutant 1 à 3 postes',
      de: 'Ideal für Startups mit 1–3 offenen Stellen',
      es: 'Ideal para startups que contratan 1–3 puestos',
      tr: '1–3 pozisyon için işe alım yapan girişimler için ideal',
    },
    description: {
      en: '50 dedicated HR credits for job postings and bias-free AI applicant evaluations.',
      ar: '50 نقطة مخصصة لنشر الوظائف وتحليل المتقدمين بالذكاء الاصطناعي الحيادي.',
      fr: '50 crédits RH dédiés aux offres d’emploi et à l’analyse IA des candidats.',
      de: '50 HR-Credits für Stellenanzeigen und faire KI-Bewerberanalysen.',
      es: '50 créditos RRHH para publicar empleos y evaluar candidatos con IA.',
      tr: 'İş ilanları ve tarafsız yapay zeka aday analizi için 50 İK kredisi.',
    },
    type: 'one_time',
    popular: false,
    credits: 50,
    dailyAiLimit: 100,
    pricing: {
      USD: { oneTime: 29 },
      EGP: { oneTime: 1399 },
    },
    features: [
      {
        text: {
          en: '50 HR credits (never expire)',
          ar: '50 كريدت HR (لا تنتهي صلاحيتها)',
          fr: '50 crédits RH (sans expiration)',
          de: '50 HR-Credits (kein Verfallsdatum)',
          es: '50 créditos RRHH (nunca caducan)',
          tr: '50 İK kredisi (süresi dolmaz)',
        },
        included: true,
        highlight: true,
      },
      {
        text: {
          en: 'Publish jobs (1 credit / job) & analyze applicants (1 credit / candidate)',
          ar: 'نشر وظائف (1 كريدت) وتحليل المتقدمين (1 كريدت لكل مرشح)',
          fr: 'Publication d’offres (1 crédit) et analyse candidats (1 crédit)',
          de: 'Jobs veröffentlichen (1 Credit) & Bewerber analysieren (1 Credit)',
          es: 'Publicar empleos (1 crédito) y analizar candidatos (1 crédito)',
          tr: 'İlan yayınlama (1 kredi) ve aday analizi (1 kredi)',
        },
        included: true,
      },
    ],
    cta: {
      en: 'Buy 50 Credits',
      ar: 'شراء 50 كريدت',
      fr: 'Acheter 50 Crédits',
      de: '50 Credits kaufen',
      es: 'Comprar 50 Créditos',
      tr: '50 Kredi Satın Al',
    },
  },
  {
    id: 'hr_pack_200',
    name: {
      en: '200 HR Credits Pack',
      ar: 'باقة 200 كريدت للتوظيف (HR)',
      fr: 'Pack 200 Crédits RH',
      de: '200 HR-Credits Paket',
      es: 'Paquete de 200 Créditos RRHH',
      tr: '200 İK Kredisi Paketi',
    },
    tagline: {
      en: 'Most popular for growing HR teams',
      ar: 'الأكثر اختياراً لفرق الموارد البشرية المتنامية',
      fr: 'Le plus populaire pour les équipes RH en croissance',
      de: 'Beliebteste Wahl für wachsende HR-Teams',
      es: 'El más popular para equipos de RRHH en crecimiento',
      tr: 'Büyüyen İK ekipleri için en popüler',
    },
    description: {
      en: '200 HR credits with volume savings for active recruitment pipelines and Top-10 comparison reports.',
      ar: '200 كريدت HR بتوفير أعلى لخطوط التوظيف النشطة وتقارير مقارنة أفضل 10 مرشحين.',
      fr: '200 crédits RH avec économies sur volume et rapports comparatifs Top 10.',
      de: '200 HR-Credits mit Mengenrabatt und Top-10-Vergleichsberichten.',
      es: '200 créditos RRHH con descuento por volumen e informes Top 10.',
      tr: 'Aktif işe alım ve İlk 10 karşılaştırma raporları için 200 İK kredisi.',
    },
    type: 'one_time',
    popular: true,
    badge: {
      en: 'Best Value',
      ar: 'الأفضل قيمة',
      fr: 'Meilleure Valeur',
      de: 'Bester Wert',
      es: 'Mejor Valor',
      tr: 'En İyi Değer',
    },
    credits: 200,
    dailyAiLimit: 100,
    pricing: {
      USD: { oneTime: 99, savingsPercentage: 15 },
      EGP: { oneTime: 4799, savingsPercentage: 15 },
    },
    features: [
      {
        text: {
          en: '200 HR credits (save 15% per credit)',
          ar: '200 كريدت HR (توفير 15% لكل نقطة)',
          fr: '200 crédits RH (économisez 15%)',
          de: '200 HR-Credits (15% sparen)',
          es: '200 créditos RRHH (ahorra 15%)',
          tr: '200 İK kredisi (%15 tasarruf)',
        },
        included: true,
        highlight: true,
      },
      {
        text: {
          en: 'Includes Top-10 candidate comparison reports & CSV exports',
          ar: 'يشمل تقارير مقارنة أفضل 10 مرشحين وتصدير CSV',
          fr: 'Inclut les rapports Top 10 et exports CSV',
          de: 'Inklusive Top-10-Berichte & CSV-Export',
          es: 'Incluye informes Top 10 y exportación CSV',
          tr: 'İlk 10 aday karşılaştırma raporları ve CSV dışa aktarma dahil',
        },
        included: true,
      },
    ],
    cta: {
      en: 'Buy 200 Credits',
      ar: 'شراء 200 كريدت',
      fr: 'Acheter 200 Crédits',
      de: '200 Credits kaufen',
      es: 'Comprar 200 Créditos',
      tr: '200 Kredi Satın Al',
    },
  },
  {
    id: 'hr_pack_1000',
    name: {
      en: '1000 HR Credits Pack',
      ar: 'باقة 1000 كريدت للتوظيف (HR)',
      fr: 'Pack 1000 Crédits RH',
      de: '1000 HR-Credits Paket',
      es: 'Paquete de 1000 Créditos RRHH',
      tr: '1000 İK Kredisi Paketi',
    },
    tagline: {
      en: 'Enterprise scale for high-volume recruiting',
      ar: 'للشركات الكبرى وحملات التوظيف المكثفة',
      fr: 'Échelle entreprise pour recrutement à fort volume',
      de: 'Enterprise-Paket für High-Volume-Recruiting',
      es: 'Escala empresarial para reclutamiento de alto volumen',
      tr: 'Yüksek hacimli işe alımlar için kurumsal paket',
    },
    description: {
      en: '1000 HR credits at maximum discount for multi-recruiter organizations.',
      ar: '1000 كريدت HR بأقصى خصم للمنظمات وفرق التوظيف الكبيرة.',
      fr: '1000 crédits RH avec remise maximale pour les grandes organisations.',
      de: '1000 HR-Credits mit maximalem Rabatt für große Organisationen.',
      es: '1000 créditos RRHH con descuento máximo para grandes organizaciones.',
      tr: 'Çoklu işe alım ekipleri için maksimum indirimli 1000 İK kredisi.',
    },
    type: 'one_time',
    popular: false,
    credits: 1000,
    dailyAiLimit: 100,
    pricing: {
      USD: { oneTime: 399, savingsPercentage: 31 },
      EGP: { oneTime: 18999, savingsPercentage: 31 },
    },
    features: [
      {
        text: {
          en: '1000 HR credits (save 31% per credit)',
          ar: '1000 كريدت HR (توفير 31% لكل نقطة)',
          fr: '1000 crédits RH (économisez 31%)',
          de: '1000 HR-Credits (31% sparen)',
          es: '1000 créditos RRHH (ahorra 31%)',
          tr: '1000 İK kredisi (%31 tasarruf)',
        },
        included: true,
        highlight: true,
      },
      {
        text: {
          en: 'Shared across all organization recruiters with spend cap controls',
          ar: 'رصيد مشترك لجميع مسؤولي التوظيف بالمنظمة مع تحكم بحد الإنفاق الشهري',
          fr: 'Partagé entre tous les recruteurs avec plafond mensuel',
          de: 'Gemeinsam nutzbar im gesamten Recruiting-Team mit Ausgabenlimit',
          es: 'Compartido entre reclutadores con límite de gasto mensual',
          tr: 'Harcama limiti kontrolüyle tüm İK ekibiyle paylaşılır',
        },
        included: true,
      },
    ],
    cta: {
      en: 'Buy 1000 Credits',
      ar: 'شراء 1000 كريدت',
      fr: 'Acheter 1000 Crédits',
      de: '1000 Credits kaufen',
      es: 'Comprar 1000 Créditos',
      tr: '1000 Kredi Satın Al',
    },
  },
];

export function isHrPackId(id: string | null | undefined): id is HrPackId {
  return id === 'hr_pack_50' || id === 'hr_pack_200' || id === 'hr_pack_1000';
}

export function getHrPackById(id: string): PlanConfig | undefined {
  return HR_CREDIT_PACKS.find((pack) => pack.id === id);
}

export function getPlanById(id: string): PlanConfig | undefined {
  return PLANS.find((plan) => plan.id === id) || HR_CREDIT_PACKS.find((pack) => pack.id === id);
}

/**
 * Resolves the canonical price for a plan from PLANS in lib/plans.ts.
 * Throws if the plan or price is not defined (no hardcoded fallbacks).
 */
export function getPlanPrice(
  planId: PlanId | string,
  currency: 'USD' | 'EGP',
  billingCycle: BillingCycle = 'monthly'
): number {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  if (plan.type === 'free') {
    return 0;
  }

  const currencyPricing = plan.pricing[currency];
  if (!currencyPricing) {
    throw new Error(`Currency "${currency}" is not configured for plan "${plan.id}".`);
  }

  let price: number | undefined;
  if (plan.type === 'one_time' || plan.id === 'payg') {
    price = currencyPricing.oneTime;
  } else {
    price = billingCycle === 'annual' ? currencyPricing.annualTotal : currencyPricing.monthly;
  }

  if (typeof price !== 'number' || price <= 0) {
    throw new Error(
      `Price not configured in lib/plans.ts for plan "${plan.id}" (${currency}, ${billingCycle}).`
    );
  }

  return price;
}

/**
 * Resolves the canonical credit allocation for a plan from PLANS in lib/plans.ts.
 */
export function getPlanCredits(planId: PlanId | string): number | 'unlimited' {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  return plan.credits;
}

/**
 * Resolves the numeric credit bundle size for Pay-As-You-Go from lib/plans.ts.
 */
export function getPaygCredits(): number {
  const credits = getPlanCredits('payg');
  if (typeof credits !== 'number' || credits <= 0) {
    throw new Error('PAYG credits are not validly configured in lib/plans.ts.');
  }
  return credits;
}

/**
 * Resolves the canonical daily AI request limit for a user plan from PLANS in lib/plans.ts.
 * Supports optional environment variable overrides for operational tuning.
 */
export function getPlanDailyAiLimit(planId: PlanId | string): number {
  const normalized = (planId || 'free').toLowerCase();
  if (normalized === 'pro' || normalized === 'enterprise') {
    const envOverride = Number(process.env.AI_DAILY_LIMIT_PRO);
    if (Number.isFinite(envOverride) && envOverride > 0) return envOverride;
    return getPlanById('pro')?.dailyAiLimit ?? PRO_DAILY_AI_LIMIT;
  }
  if (normalized === 'payg') {
    const envOverride = Number(process.env.AI_DAILY_LIMIT_PAYG);
    if (Number.isFinite(envOverride) && envOverride > 0) return envOverride;
    return getPlanById('payg')?.dailyAiLimit ?? PAYG_DAILY_AI_LIMIT;
  }
  const envOverride = Number(process.env.AI_DAILY_LIMIT_FREE);
  if (Number.isFinite(envOverride) && envOverride > 0) return envOverride;
  return getPlanById('free')?.dailyAiLimit ?? FREE_DAILY_AI_LIMIT;
}

export function formatPrice(
  amount: number,
  currency: CurrencyCode,
  lang: LanguageCode | string = 'en'
): string {
  if (currency === 'USD') {
    return `$${amount}`;
  }
  // EGP format
  if (lang === 'ar') {
    return `${amount} ج.م`;
  }
  return `${amount} EGP`;
}

export type DisplayCurrencyCode = 'USD' | 'EGP' | 'EUR' | 'GBP' | 'SAR' | 'AED' | 'TRY';

export interface DisplayCurrencyMeta {
  code: DisplayCurrencyCode;
  symbol: string;
  rateFromUsd: number;
  labelEn: string;
  labelAr: string;
}

export const DISPLAY_CURRENCIES: DisplayCurrencyMeta[] = [
  { code: 'USD', symbol: '$', rateFromUsd: 1, labelEn: 'USD ($)', labelAr: 'دولار (USD $)' },
  { code: 'EGP', symbol: 'EGP', rateFromUsd: 49, labelEn: 'EGP (ج.م)', labelAr: 'جنيه مصري (EGP)' },
  { code: 'EUR', symbol: '€', rateFromUsd: 0.92, labelEn: 'EUR (€)', labelAr: 'يورو (EUR €)' },
  { code: 'GBP', symbol: '£', rateFromUsd: 0.79, labelEn: 'GBP (£)', labelAr: 'جنيه إسترليني (GBP £)' },
  { code: 'SAR', symbol: 'SAR', rateFromUsd: 3.75, labelEn: 'SAR (ر.س)', labelAr: 'ريال سعودي (SAR)' },
  { code: 'AED', symbol: 'AED', rateFromUsd: 3.67, labelEn: 'AED (د.إ)', labelAr: 'درهم إماراتي (AED)' },
  { code: 'TRY', symbol: '₺', rateFromUsd: 34, labelEn: 'TRY (₺)', labelAr: 'ليرة تركية (TRY ₺)' },
];

/**
 * Detects a user's preferred local display currency from timezone or language when available.
 * Used for display reference only; actual checkout billing always uses the provider's currency.
 */
export function detectUserDisplayCurrency(
  lang: string = 'en',
  timeZone?: string
): DisplayCurrencyCode {
  const tz = (
    timeZone ||
    (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '') ||
    ''
  ).toLowerCase();

  if (tz.includes('cairo') || tz.includes('egypt')) return 'EGP';
  if (tz.includes('riyadh') || tz.includes('saudi')) return 'SAR';
  if (tz.includes('dubai') || tz.includes('muscat') || tz.includes('kuwait') || tz.includes('qatar')) return 'AED';
  if (tz.includes('istanbul') || tz.includes('turkey')) return 'TRY';
  if (tz.includes('london') || tz.includes('belfast')) return 'GBP';
  if (
    tz.includes('paris') ||
    tz.includes('berlin') ||
    tz.includes('madrid') ||
    tz.includes('rome') ||
    tz.includes('amsterdam') ||
    tz.includes('brussels') ||
    tz.includes('vienna')
  ) {
    return 'EUR';
  }

  const normalizedLang = (lang || 'en').toLowerCase();
  if (normalizedLang === 'tr') return 'TRY';
  if (normalizedLang === 'fr' || normalizedLang === 'de' || normalizedLang === 'es') return 'EUR';
  return 'USD';
}

/**
 * Formats a plan amount in the user's selected/detected display currency while also
 * returning the authoritative provider billing currency and amount.
 */
export function formatDisplayPrice(
  usdAmount: number,
  egpAmount: number | undefined,
  displayCurrency: DisplayCurrencyCode,
  providerBillingCurrency: CurrencyCode = 'USD',
  lang: LanguageCode | string = 'en'
): {
  formattedDisplay: string;
  providerBillingAmount: number;
  providerBillingCurrency: CurrencyCode;
  isDisplayOnlyConversion: boolean;
} {
  const providerBillingAmount =
    providerBillingCurrency === 'EGP' && typeof egpAmount === 'number'
      ? egpAmount
      : usdAmount;

  if (usdAmount === 0) {
    const zeroDisplay =
      displayCurrency === 'EGP'
        ? formatPrice(0, 'EGP', lang)
        : displayCurrency === 'EUR'
        ? '€0'
        : displayCurrency === 'GBP'
        ? '£0'
        : displayCurrency === 'TRY'
        ? '₺0'
        : displayCurrency === 'SAR'
        ? lang === 'ar'
          ? '0 ر.س'
          : '0 SAR'
        : displayCurrency === 'AED'
        ? lang === 'ar'
          ? '0 د.إ'
          : '0 AED'
        : '$0';
    return {
      formattedDisplay: zeroDisplay,
      providerBillingAmount: 0,
      providerBillingCurrency,
      isDisplayOnlyConversion: false,
    };
  }

  let formattedDisplay = `$${usdAmount}`;
  if (displayCurrency === 'USD') {
    formattedDisplay = `$${usdAmount}`;
  } else if (displayCurrency === 'EGP') {
    const amt = typeof egpAmount === 'number' ? egpAmount : Math.round(usdAmount * 49);
    formattedDisplay = formatPrice(amt, 'EGP', lang);
  } else {
    const meta = DISPLAY_CURRENCIES.find((c) => c.code === displayCurrency);
    const rate = meta ? meta.rateFromUsd : 1;
    const converted = Math.max(1, Math.round(usdAmount * rate));
    if (displayCurrency === 'EUR') formattedDisplay = `€${converted}`;
    else if (displayCurrency === 'GBP') formattedDisplay = `£${converted}`;
    else if (displayCurrency === 'TRY') formattedDisplay = `₺${converted}`;
    else if (displayCurrency === 'SAR') {
      formattedDisplay = lang === 'ar' ? `${converted} ر.س` : `${converted} SAR`;
    } else if (displayCurrency === 'AED') {
      formattedDisplay = lang === 'ar' ? `${converted} د.إ` : `${converted} AED`;
    }
  }

  return {
    formattedDisplay,
    providerBillingAmount,
    providerBillingCurrency,
    isDisplayOnlyConversion: displayCurrency !== providerBillingCurrency,
  };
}

export interface PlanComparisonRow {
  id: string;
  feature: string;
  free: string;
  payg: string;
  pro: string;
}

/**
 * Generates the Free / PAYG / Pro comparison rows dynamically from the real constants in lib/plans.ts.
 */
export function getPlanComparisonRows(lang: LanguageCode | string = 'en'): PlanComparisonRow[] {
  const freeCredits = getPlanCredits('free');
  const paygCredits = getPaygCredits();
  const freeDaily = getPlanDailyAiLimit('free');
  const paygDaily = getPlanDailyAiLimit('payg');
  const proDaily = getPlanDailyAiLimit('pro');

  const rows: Array<{
    id: string;
    feature: LocalizedString;
    free: LocalizedString;
    payg: LocalizedString;
    pro: LocalizedString;
  }> = [
    {
      id: 'credits',
      feature: {
        en: 'Included AI Credits',
        ar: 'رصيد نقاط الذكاء الاصطناعي',
        fr: 'Crédits IA inclus',
        de: 'Enthaltene KI-Credits',
        es: 'Créditos de IA incluidos',
        tr: 'Dahil Edilen Yapay Zeka Kredisi',
      },
      free: {
        en: `${freeCredits} starter credits`,
        ar: `${freeCredits} نقاط ترحيبية مجانية`,
        fr: `${freeCredits} crédits de départ`,
        de: `${freeCredits} Start-Credits`,
        es: `${freeCredits} créditos iniciales`,
        tr: `${freeCredits} başlangıç kredisi`,
      },
      payg: {
        en: `${paygCredits} credits (never expire)`,
        ar: `${paygCredits} نقطة (لا تنتهي صلاحيتها أبداً)`,
        fr: `${paygCredits} crédits (sans expiration)`,
        de: `${paygCredits} Credits (verfallen nie)`,
        es: `${paygCredits} créditos (nunca caducan)`,
        tr: `${paygCredits} kredi (süresi asla dolmaz)`,
      },
      pro: {
        en: 'Unlimited during subscription',
        ar: 'غير محدود طوال فترة الاشتراك',
        fr: 'Illimité pendant l’abonnement',
        de: 'Unbegrenzt während des Abos',
        es: 'Ilimitado durante la suscripción',
        tr: 'Abonelik boyunca sınırsız',
      },
    },
    {
      id: 'daily_ai_limit',
      feature: {
        en: 'Daily AI Fair-Use Cap',
        ar: 'الحد اليومي لطلبات الذكاء الاصطناعي',
        fr: 'Limite quotidienne d’requêtes IA',
        de: 'Tägliches KI-Fair-Use-Limit',
        es: 'Límite diario de uso justo de IA',
        tr: 'Günlük Yapay Zeka Kullanım Limiti',
      },
      free: {
        en: `${freeDaily} AI requests / day`,
        ar: `${freeDaily} طلبات ذكاء اصطناعي / يومياً`,
        fr: `${freeDaily} requêtes IA / jour`,
        de: `${freeDaily} KI-Anfragen / Tag`,
        es: `${freeDaily} solicitudes IA / día`,
        tr: `Günde ${freeDaily} YZ isteği`,
      },
      payg: {
        en: `${paygDaily} AI requests / day`,
        ar: `${paygDaily} طلب ذكاء اصطناعي / يومياً`,
        fr: `${paygDaily} requêtes IA / jour`,
        de: `${paygDaily} KI-Anfragen / Tag`,
        es: `${paygDaily} solicitudes IA / día`,
        tr: `Günde ${paygDaily} YZ isteği`,
      },
      pro: {
        en: `${proDaily} AI requests / day (Priority)`,
        ar: `${proDaily} طلب ذكاء اصطناعي / يومياً (أولوية قصوى)`,
        fr: `${proDaily} requêtes IA / jour (Prioritaire)`,
        de: `${proDaily} KI-Anfragen / Tag (Priorität)`,
        es: `${proDaily} solicitudes IA / día (Prioridad)`,
        tr: `Günde ${proDaily} YZ isteği (Öncelikli)`,
      },
    },
    {
      id: 'ai_resume',
      feature: {
        en: 'AI Resume & CV Generation',
        ar: 'توليد السيرة الذاتية وCV بالذكاء الاصطناعي',
        fr: 'Génération de CV par IA',
        de: 'KI-Lebenslauf- & CV-Generierung',
        es: 'Generación de CV con IA',
        tr: 'Yapay Zeka Özgeçmiş & CV Üretimi',
      },
      free: {
        en: '1 free generation (trial)',
        ar: 'توليد مجاني لمرة واحدة (تجربة)',
        fr: '1 génération gratuite (essai)',
        de: '1 kostenlose Generierung (Test)',
        es: '1 generación gratuita (prueba)',
        tr: '1 ücretsiz üretim (deneme)',
      },
      payg: {
        en: `${RESUME_GENERATION_CREDIT_COST} credits / document`,
        ar: `${RESUME_GENERATION_CREDIT_COST} نقطة لكل مستند`,
        fr: `${RESUME_GENERATION_CREDIT_COST} crédits / document`,
        de: `${RESUME_GENERATION_CREDIT_COST} Credits / Dokument`,
        es: `${RESUME_GENERATION_CREDIT_COST} créditos / documento`,
        tr: `Belge başına ${RESUME_GENERATION_CREDIT_COST} kredi`,
      },
      pro: {
        en: 'Unlimited generations & tailoring',
        ar: 'توليد وتخصيص غير محدود',
        fr: 'Générations et adaptations illimitées',
        de: 'Unbegrenzte Generierungen',
        es: 'Generaciones ilimitadas',
        tr: 'Sınırsız üretim ve uyarlama',
      },
    },
    {
      id: 'job_match',
      feature: {
        en: 'Smart Job Match Searches',
        ar: 'عمليات البحث في مطابقة الوظائف',
        fr: 'Recherches d’emplois Job Match',
        de: 'Intelligente Job-Match-Suchen',
        es: 'Búsquedas de empleo Job Match',
        tr: 'Akıllı İş Eşleştirme Aramaları',
      },
      free: {
        en: `${JOB_MATCH_FREE_QUOTA} free searches included`,
        ar: `${JOB_MATCH_FREE_QUOTA} عمليات بحث مجانية`,
        fr: `${JOB_MATCH_FREE_QUOTA} recherches gratuites incluses`,
        de: `${JOB_MATCH_FREE_QUOTA} kostenlose Suchen inklusive`,
        es: `${JOB_MATCH_FREE_QUOTA} búsquedas gratuitas incluidas`,
        tr: `${JOB_MATCH_FREE_QUOTA} ücretsiz arama dahil`,
      },
      payg: {
        en: `${JOB_MATCH_CREDIT_COST} credit / search (after ${JOB_MATCH_FREE_QUOTA} free)`,
        ar: `${JOB_MATCH_CREDIT_COST} نقطة لكل بحث (بعد الـ ${JOB_MATCH_FREE_QUOTA} المجانية)`,
        fr: `${JOB_MATCH_CREDIT_COST} crédit / recherche (après les ${JOB_MATCH_FREE_QUOTA} gratuites)`,
        de: `${JOB_MATCH_CREDIT_COST} Credit / Suche (nach ${JOB_MATCH_FREE_QUOTA} kostenlosen)`,
        es: `${JOB_MATCH_CREDIT_COST} crédito / búsqueda (tras ${JOB_MATCH_FREE_QUOTA} gratis)`,
        tr: `Arama başına ${JOB_MATCH_CREDIT_COST} kredi (${JOB_MATCH_FREE_QUOTA} ücretsizden sonra)`,
      },
      pro: {
        en: 'Unlimited Job Match searches',
        ar: 'بحث غير محدود في مطابقة الوظائف',
        fr: 'Recherches Job Match illimitées',
        de: 'Unbegrenzte Job-Match-Suchen',
        es: 'Búsquedas Job Match ilimitadas',
        tr: 'Sınırsız Job Match araması',
      },
    },
    {
      id: 'cover_letters',
      feature: {
        en: 'AI Cover Letters',
        ar: 'خطابات التقديم بالذكاء الاصطناعي',
        fr: 'Lettres de motivation IA',
        de: 'KI-Anschreiben',
        es: 'Cartas de presentación con IA',
        tr: 'Yapay Zeka Ön Yazıları',
      },
      free: {
        en: 'Up to 3 drafts (using starter credits)',
        ar: 'حتى 3 خطابات (باستخدام الرصيد الترحيبي)',
        fr: 'Jusqu’à 3 brouillons',
        de: 'Bis zu 3 Entwürfe',
        es: 'Hasta 3 borradores',
        tr: '3 taslağa kadar',
      },
      payg: {
        en: `1 credit / letter (up to ${paygCredits} letters)`,
        ar: `نقطة واحدة لكل خطاب (حتى ${paygCredits} خطاباً)`,
        fr: `1 crédit / lettre (jusqu’à ${paygCredits})`,
        de: `1 Credit / Anschreiben (bis zu ${paygCredits})`,
        es: `1 crédito / carta (hasta ${paygCredits})`,
        tr: `Mektup başına 1 kredi (${paygCredits} adede kadar)`,
      },
      pro: {
        en: 'Unlimited cover letters & revisions',
        ar: 'توليد وتعديل غير محدود لخطابات التقديم',
        fr: 'Lettres et révisions illimitées',
        de: 'Unbegrenzte Anschreiben & Revisionen',
        es: 'Cartas y revisiones ilimitadas',
        tr: 'Sınırsız ön yazı ve revizyon',
      },
    },
    {
      id: 'ats_scans',
      feature: {
        en: 'ATS Score & Keyword Audit',
        ar: 'فحص التوافق مع ATS وتحليل الكلمات المفتاحية',
        fr: 'Audit ATS et analyse de mots-clés',
        de: 'ATS-Score & Keyword-Prüfung',
        es: 'Escaneo ATS y auditoría de palabras clave',
        tr: 'ATS Puanı ve Anahtar Kelime Analizi',
      },
      free: {
        en: 'Unlimited instant scans + 3 quick fixes',
        ar: 'فحص فوري غير محدود + 3 تحسينات سريعة',
        fr: 'Scans illimités + 3 corrections rapides',
        de: 'Unbegrenzte Scans + 3 Schnellkorrekturen',
        es: 'Escaneos ilimitados + 3 mejoras rápidas',
        tr: 'Sınırsız tarama + 3 hızlı iyileştirme',
      },
      payg: {
        en: 'Unlimited scans + full keyword audit',
        ar: 'فحص غير محدود + تدقيق كامل للكلمات المفتاحية',
        fr: 'Scans illimités + audit complet',
        de: 'Unbegrenzte Scans + Voll-Audit',
        es: 'Escaneos ilimitados + auditoría completa',
        tr: 'Sınırsız tarama + tam anahtar kelime denetimi',
      },
      pro: {
        en: 'Unlimited deep ATS diagnostic & JD match',
        ar: 'تشخيص ATS عميق وغير محدود ومطابقة الوصف الوظيفي',
        fr: 'Diagnostic ATS approfondi illimité',
        de: 'Unbegrenzte Tiefen-ATS-Diagnose',
        es: 'Diagnóstico ATS profundo ilimitado',
        tr: 'Sınırsız derin ATS teşhisi ve ilan eşleştirme',
      },
    },
    {
      id: 'templates_exports',
      feature: {
        en: 'Templates & Export Formats',
        ar: 'القوالب وصيغ التصدير المتاحة',
        fr: 'Modèles et formats d’export',
        de: 'Vorlagen & Exportformate',
        es: 'Plantillas y formatos de exportación',
        tr: 'Şablonlar ve Dışa Aktarma Formatları',
      },
      free: {
        en: 'Basic ATS templates • Standard PDF & TXT',
        ar: 'قوالب أساسية • تصدير PDF قياسي وTXT',
        fr: 'Modèles de base • PDF standard & TXT',
        de: 'Basisvorlagen • Standard-PDF & TXT',
        es: 'Plantillas básicas • PDF estándar y TXT',
        tr: 'Temel şablonlar • Standart PDF ve TXT',
      },
      payg: {
        en: 'All 5 templates • Clean Word (.docx) & PDF',
        ar: 'جميع القوالب الـ 5 • تصدير Word (.docx) وPDF',
        fr: 'Les 5 modèles • Word (.docx) & PDF',
        de: 'Alle 5 Vorlagen • Word (.docx) & PDF',
        es: 'Las 5 plantillas • Word (.docx) y PDF',
        tr: 'Tüm 5 şablon • Filigransız Word (.docx) ve PDF',
      },
      pro: {
        en: 'All 5 templates • Unrestricted Word (.docx) & Vector PDF',
        ar: 'جميع القوالب الـ 5 • تصدير مفتوح Word (.docx) وVector PDF بدون علامة مائية',
        fr: 'Les 5 modèles • Word (.docx) & PDF vectoriel illimités',
        de: 'Alle 5 Vorlagen • Unbegrenzter Word (.docx) & Vektor-PDF-Export',
        es: 'Las 5 plantillas • Word (.docx) y PDF vectorial sin límites',
        tr: 'Tüm 5 şablon • Sınırsız Word (.docx) ve Vektörel PDF',
      },
    },
  ];

  return rows.map((r) => ({
    id: r.id,
    feature: getLocalized(r.feature, lang),
    free: getLocalized(r.free, lang),
    payg: getLocalized(r.payg, lang),
    pro: getLocalized(r.pro, lang),
  }));
}

export default PLANS;
