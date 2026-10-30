import { LanguageCode } from '@/app/lib/translations/types';

export type CurrencyCode = 'USD' | 'EGP' | 'USDT';
export type BillingCycle = 'monthly' | 'annual';
export type PlanType = 'free' | 'subscription' | 'one_time';
export type PlanId = 'free' | 'pro' | 'payg';

/**
 * Number of credits consumed per AI Resume or CV generation on Pay-As-You-Go
 */
export const RESUME_GENERATION_CREDIT_COST = 2;

/**
 * Number of credits consumed per Job Match search on Pay-As-You-Go (after 3 free searches)
 */
export const JOB_MATCH_CREDIT_COST = 1;

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

export function getPlanById(id: string): PlanConfig | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export function formatPrice(
  amount: number,
  currency: CurrencyCode,
  lang: LanguageCode | string = 'en'
): string {
  if (currency === 'USDT') {
    return `${amount} USDT`;
  }
  if (currency === 'USD') {
    return `$${amount}`;
  }
  // EGP format
  if (lang === 'ar') {
    return `${amount} ج.م`;
  }
  return `${amount} EGP`;
}

export default PLANS;
