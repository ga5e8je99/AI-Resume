'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import { useLanguage } from '../context/LanguageContext';
import { Reveal, Stagger } from '@/components/motion/Reveal';
import { Sparkles, ShieldCheck, Layers, Globe, Cpu, FileCheck, Mail } from 'lucide-react';

interface AboutPillar {
  title: string;
  desc: string;
}

interface AboutContent {
  badge: string;
  title: string;
  subtitle: string;
  missionTitle: string;
  missionParagraphs: string[];
  pillarsTitle: string;
  pillars: AboutPillar[];
  transparencyTitle: string;
  transparencyDesc: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

const ABOUT_BY_LANG: Record<'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr', AboutContent> = {
  en: {
    badge: 'ABOUT JOBMATCH AI',
    title: 'Editorial Resume Engineering & Transparent ATS Intelligence',
    subtitle:
      'JobMatch AI was built to bridge the gap between talented candidates and modern Applicant Tracking Systems (Workday, Greenhouse, Lever, Taleo) across 6 languages with first-class Arabic RTL and English LTR typography.',
    missionTitle: 'Our Mission & Philosophy',
    missionParagraphs: [
      'Most qualified candidates are filtered out not because they lack experience, but because their resumes use multi-column layouts, unparseable graphics, or miss exact keyword taxonomy required by automated screening parsers.',
      'We engineered JobMatch AI around three principles: (1) local in-browser ATS diagnostics so you can inspect the exact digital text stream read by parsers, (2) resilient AI-assisted Resume & Cover Letter generation with deterministic fallbacks, and (3) strict data ownership with one-click JSON export and account deletion.',
    ],
    pillarsTitle: 'How JobMatch AI Is Built',
    pillars: [
      {
        title: '100% In-Browser ATS Diagnostic Engine',
        desc: 'Extracts text from PDF & DOCX files directly in your browser and audits keyword overlap, reverse chronology, employment gaps, and bullet density. Note: ATS scores are algorithmic estimates for guidance and do not guarantee employment.',
      },
      {
        title: 'Resilient AI Co-Pilot + Circuit Breaker',
        desc: 'Tailors resumes and cover letters via encrypted commercial LLM APIs (zero model training on your data) backed by a deterministic template engine if external AI providers experience downtime.',
      },
      {
        title: 'Native 6-Language & RTL Architecture',
        desc: 'Designed from the ground up for English, Arabic (RTL), French, German, Spanish, and Turkish—with print-ready vector PDF and DOCX export.',
      },
      {
        title: 'Privacy-First & Merchant of Record Billing',
        desc: 'Global billing is handled by Lemon Squeezy as our Merchant of Record (plus optional Stripe & Paymob gateways). Consent-gated analytics never run without your permission.',
      },
    ],
    transparencyTitle: 'Legal & Privacy Transparency',
    transparencyDesc:
      'We believe in clear, readable policies. Explore how we protect your data, handle AI processing, and honor our 14-day refund policy:',
    ctaTitle: 'Ready to optimize your next job application?',
    ctaDesc: 'Start building an ATS-friendly resume for free or reach out to our team with any questions.',
    ctaPrimary: 'Launch Resume Builder',
    ctaSecondary: 'Contact Support',
  },
  ar: {
    badge: 'عن منصة JOBMATCH AI',
    title: 'هندسة السير الذاتية الاحترافية وتحليل الـ ATS بشفافية كاملة',
    subtitle:
      'صُممت منصة JobMatch AI لسد الفجوة بين الكفاءات المهنية وأنظمة فرز المتقدمين الحديثة (Workday و Greenhouse و Taleo) بـ 6 لغات عالمية مع دعم أصيل ومتقن للغة العربية (RTL) والإنجليزية (LTR).',
    missionTitle: 'رسالتنا وفلسفة العمل',
    missionParagraphs: [
      'يتم استبعاد الكثير من المرشحين المؤهلين ليس لنقص خبرتهم، بل بسبب استخدام قوالب معقدة غير قابلة للقراءة آلياً أو غياب المرادفات والكلمات المفتاحية الدقيقة التي تبحث عنها أنظمة الفرز.',
      'بنينا JobMatch AI على ثلاثة ركائز أساسية: (1) فحص ATS محلي داخل المتصفح يعرض لك النص الرقمي الصافي كما تقرؤه أنظمة التوظيف، (2) توليد ذكي للسير الذاتية وخطابات التقديم مع قاطع حماية (Circuit Breaker) ومحرك احتياطي يضمن عدم توقف الخدمة، و(3) ملكية كاملة لبياناتك مع إمكانية التصدير بصيغة JSON أو الحذف النهائي في أي وقت.',
    ],
    pillarsTitle: 'الركائز التقنية للمنصة',
    pillars: [
      {
        title: 'محرك فحص ATS محلي وشفاف',
        desc: 'يستخرج النصوص من ملفات PDF و DOCX داخل متصفحك ويدقق تطابق الكلمات المفتاحية والترتيب الزمني العكسي وطول النقاط. (تنويه: نتائج الـ ATS تقديرية لإرشادك وليست ضماناً للتوظيف).',
      },
      {
        title: 'ذكاء اصطناعي موثوق مع حماية تلقائية',
        desc: 'يصيغ السير الذاتية وخطابات التقديم عبر واجهات برمجية مشفرة لا تستخدم بياناتك لتدريب النماذج، مع تحول فوري للمحرك الاحتياطي عند أي ضغط.',
      },
      {
        title: 'دعم أصيل لـ 6 لغات وتنسيق عربي متقن',
        desc: 'واجهة وقوالب مصممة خصيصاً لدعم العربية (RTL) والإنجليزية والفرنسية والألمانية والإسبانية والتركية، مع تصدير PDF و Word قياسي.',
      },
      {
        title: 'خصوصية صارمة وفوترة آمنة (Merchant of Record)',
        desc: 'تتم معالجة المدفوعات العالمية عبر Lemon Squeezy كـ Merchant of Record (مع توفر Stripe و Paymob)، ولا تعمل تحليلات الأداء إلا بموافقتك الصريحة.',
      },
    ],
    transparencyTitle: 'الشفافية القانونية وحماية المستخدم',
    transparencyDesc:
      'نلتزم بسياسات واضحة تحفظ حقوقك. يمكنك الاطلاع على تفاصيل معالجة البيانات وشروط الخدمة وسياسة الاسترداد عبر الروابط التالية:',
    ctaTitle: 'هل أنت مستعد لبناء سيرتك الذاتية القادمة؟',
    ctaDesc: 'ابدأ مجاناً الآن في منشئ السير الذاتية أو تواصل مع فريقنا لأي استفسار.',
    ctaPrimary: 'ابدأ بناء سيرتك مجاناً',
    ctaSecondary: 'تواصل معنا',
  },
  fr: {
    badge: 'À PROPOS DE JOBMATCH AI',
    title: 'Ingénierie de CV Éditoriale & Intelligence ATS Transparente',
    subtitle:
      'JobMatch AI aide les candidats à optimiser leurs CV et lettres de motivation pour les systèmes ATS modernes en 6 langues (avec support natif RTL et LTR).',
    missionTitle: 'Notre Mission',
    missionParagraphs: [
      'Nous combinons une analyse ATS locale dans le navigateur, une génération IA résiliente (sans entraînement sur vos données) et un contrôle total de vos données personnelles (export JSON et suppression en un clic).',
    ],
    pillarsTitle: 'Nos Engagements Techniques',
    pillars: [
      {
        title: 'Diagnostic ATS Local',
        desc: 'Analyse vos fichiers PDF et DOCX directement dans le navigateur. Les scores ATS sont des estimations indicatives et ne garantissent pas une embauche.',
      },
      {
        title: 'IA Résiliente & Sécurisée',
        desc: 'Génération de CV et lettres via API chiffrée avec basculement automatique (circuit breaker).',
      },
      {
        title: '6 Langues & Export Vectoriel',
        desc: 'Prise en charge complète du français, anglais, arabe, allemand, espagnol et turc.',
      },
      {
        title: 'Confidentialité & Lemon Squeezy (MoR)',
        desc: 'Paiements gérés par Lemon Squeezy (Merchant of Record) et analytique soumise au consentement.',
      },
    ],
    transparencyTitle: 'Transparence Juridique',
    transparencyDesc: 'Consultez nos politiques complètes concernant vos droits et nos engagements :',
    ctaTitle: 'Prêt à optimiser vos candidatures ?',
    ctaDesc: 'Créez votre CV gratuitement ou contactez notre équipe.',
    ctaPrimary: 'Créer un CV',
    ctaSecondary: 'Nous contacter',
  },
  de: {
    badge: 'ÜBER JOBMATCH AI',
    title: 'Redaktionelles Lebenslauf-Engineering & Transparente ATS-Analyse',
    subtitle:
      'JobMatch AI unterstützt Bewerber dabei, Lebensläufe und Anschreiben für moderne ATS-Systeme in 6 Sprachen (inkl. RTL & LTR) optimal aufzubereiten.',
    missionTitle: 'Unsere Mission',
    missionParagraphs: [
      'Wir verbinden lokale ATS-Diagnose im Browser mit ausfallsicherer KI-Generierung (ohne Modelltraining mit Ihren Daten) und voller Datenkontrolle (JSON-Export und Kontolöschung jederzeit).',
    ],
    pillarsTitle: 'Unsere Grundpfeiler',
    pillars: [
      {
        title: 'Lokale ATS-Diagnose',
        desc: 'Prüft PDF- und DOCX-Dateien direkt im Browser. ATS-Scores sind algorithmische Schätzwerte zur Orientierung und keine Einstellungsgarantie.',
      },
      {
        title: 'Ausfallsichere KI-Unterstützung',
        desc: 'Verschlüsselte KI-Generierung mit automatischem Circuit-Breaker-Fallback.',
      },
      {
        title: '6 Sprachen & PDF/DOCX-Export',
        desc: 'Volle Unterstützung für Deutsch, Englisch, Arabisch, Französisch, Spanisch und Türkisch.',
      },
      {
        title: 'Datenschutz & Lemon Squeezy (MoR)',
        desc: 'Abrechnung über Lemon Squeezy als Merchant of Record und strikte Cookie-Einwilligung.',
      },
    ],
    transparencyTitle: 'Rechtliche Transparenz',
    transparencyDesc: 'Erfahren Sie mehr über Datenschutz, Nutzungsbedingungen und unsere 14-Tage-Rückerstattungsrichtlinie:',
    ctaTitle: 'Bereit für Ihre nächste Bewerbung?',
    ctaDesc: 'Starten Sie kostenlos mit dem Lebenslauf-Builder oder kontaktieren Sie uns.',
    ctaPrimary: 'Lebenslauf erstellen',
    ctaSecondary: 'Kontakt aufnehmen',
  },
  es: {
    badge: 'SOBRE JOBMATCH AI',
    title: 'Ingeniería Editorial de CV e Inteligencia ATS Transparente',
    subtitle:
      'JobMatch AI ayuda a los candidatos a superar los filtros ATS modernos en 6 idiomas con soporte nativo LTR y RTL.',
    missionTitle: 'Nuestra Misión',
    missionParagraphs: [
      'Combinamos análisis ATS local en el navegador, generación con IA resiliente (sin entrenar modelos con tus datos) y control total de tu privacidad (exportación JSON y eliminación de cuenta).',
    ],
    pillarsTitle: 'Nuestros Pilares',
    pillars: [
      {
        title: 'Escáner ATS Local',
        desc: 'Analiza PDF y DOCX en tu navegador. Las puntuaciones ATS son estimaciones orientativas y no garantizan contratación.',
      },
      {
        title: 'IA Resiliente con Circuit Breaker',
        desc: 'Generación de CV y cartas mediante API cifrada con motor de respaldo automático.',
      },
      {
        title: '6 Idiomas y Exportación Profesional',
        desc: 'Soporte nativo para español, inglés, árabe, francés, alemán y turco.',
      },
      {
        title: 'Privacidad y Lemon Squeezy (MoR)',
        desc: 'Facturación global mediante Lemon Squeezy como Merchant of Record y analítica solo bajo consentimiento.',
      },
    ],
    transparencyTitle: 'Transparencia Legal',
    transparencyDesc: 'Consulta nuestras políticas de privacidad, términos y reembolso de 14 días:',
    ctaTitle: '¿Listo para optimizar tu próximo CV?',
    ctaDesc: 'Empieza gratis hoy mismo o escríbenos si tienes cualquier duda.',
    ctaPrimary: 'Crear CV Gratis',
    ctaSecondary: 'Contactar Soporte',
  },
  tr: {
    badge: 'JOBMATCH AI HAKKINDA',
    title: 'Editoryal Özgeçmiş Mühendisliği ve Şeffaf ATS Analizi',
    subtitle:
      'JobMatch AI, adayların modern ATS sistemlerine uyumlu özgeçmiş ve ön yazılar hazırlamasını 6 dilde (RTL ve LTR desteğiyle) kolaylaştırır.',
    missionTitle: 'Misyonumuz',
    missionParagraphs: [
      'Tarayıcı içi yerel ATS analizi, kesintisiz yapay zeka üretimi (verileriniz model eğitiminde kullanılmaz) ve tam veri sahipliğini (JSON dışa aktarma ve hesap silme) bir araya getiriyoruz.',
    ],
    pillarsTitle: 'Temel İlkelerimiz',
    pillars: [
      {
        title: 'Yerel ATS Tanı Motoru',
        desc: 'PDF ve DOCX dosyalarını tarayıcınızda inceler. ATS puanları rehberlik amaçlı tahminlerdir ve işe alım garantisi vermez.',
      },
      {
        title: 'Kesintisiz Yapay Zeka ve Devre Kesici',
        desc: 'Şifreli API üzerinden özgeçmiş ve ön yazı üretimi ve otomatik yedek şablon motoru.',
      },
      {
        title: '6 Dil ve Vektörel PDF/DOCX Çıktısı',
        desc: 'Türkçe, İngilizce, Arapça, Fransızca, Almanca ve İspanyolca tam destek.',
      },
      {
        title: 'Gizlilik ve Lemon Squeezy (MoR)',
        desc: 'Lemon Squeezy (Merchant of Record) ile güvenli ödeme ve onaya bağlı analitik.',
      },
    ],
    transparencyTitle: 'Hukuki Şeffaflık',
    transparencyDesc: 'Veri koruma, kullanım koşulları ve 14 günlük iade politikamızı inceleyin:',
    ctaTitle: 'Yeni başvurunuzu güçlendirmeye hazır mısınız?',
    ctaDesc: 'Ücretsiz özgeçmiş oluşturucuyu hemen deneyin veya ekibimizle iletişime geçin.',
    ctaPrimary: 'Özgeçmiş Oluştur',
    ctaSecondary: 'İletişime Geç',
  },
};

export default function AboutPage() {
  const { language, isRtl, t } = useLanguage();
  const content = ABOUT_BY_LANG[language] || ABOUT_BY_LANG.en;
  const icons = [FileCheck, Cpu, Globe, ShieldCheck];

  return (
    <div
      className="min-h-screen bg-paper text-ink flex flex-col justify-between selection:bg-accent-soft selection:text-ink overflow-x-clip"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Navbar */}
      <nav className="border-b border-line bg-surface sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle size="sm" />
            <LanguageSelector variant="compact" />
            <Link
              href="/"
              className="text-xs font-medium text-ink-2 hover:text-ink px-3 py-1.5 rounded-lg border border-line hover:bg-surface-2 transition-colors"
            >
              {t('common_back')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full text-start space-y-12">
        {/* Hero */}
        <section className="hero-lcp-enter space-y-4 max-w-3xl overflow-x-clip">
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{content.badge}</span>
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink tracking-tight leading-tight">
            {content.title}
          </h1>
          <p className="text-sm sm:text-base text-ink-2 leading-relaxed">
            {content.subtitle}
          </p>
        </section>

        {/* Mission Card */}
        <Reveal from="up"><section className="p-6 sm:p-8 rounded-[12px] bg-surface border border-line-strong space-y-4 shadow-subtle overflow-x-clip">
          <div className="flex items-center gap-2 text-lg font-serif font-bold text-ink">
            <Layers className="w-5 h-5 text-accent shrink-0" />
            <h2>{content.missionTitle}</h2>
          </div>
          <div className="space-y-3 text-sm text-ink-2 leading-relaxed">
            {content.missionParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section></Reveal>

        {/* 4 Pillars Grid */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-ink">
            {content.pillarsTitle}
          </h2>
          <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-5" from="up" itemClassName="h-full">
            {content.pillars.map((pillar, idx) => {
              const Icon = icons[idx % icons.length];
              return (
                <div
                  key={idx}
                  className="card-interactive h-full p-6 rounded-[12px] bg-surface border border-line-strong space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-[8px] bg-accent-soft text-accent flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif text-base font-bold text-ink">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </Stagger>
        </section>

        {/* Legal & Policy Links Strip */}
        <Reveal from="up"><section className="p-6 rounded-[12px] bg-surface-2 border border-line space-y-3 overflow-x-clip">
          <h2 className="font-serif text-lg font-bold text-ink">
            {content.transparencyTitle}
          </h2>
          <p className="text-xs sm:text-sm text-ink-2">{content.transparencyDesc}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-medium">
            <Link
              href="/terms"
              className="px-3.5 py-2 rounded-[6px] bg-surface border border-line-strong text-ink hover:border-accent transition-colors"
            >
              {t('footer_terms')}
            </Link>
            <Link
              href="/privacy"
              className="px-3.5 py-2 rounded-[6px] bg-surface border border-line-strong text-ink hover:border-accent transition-colors"
            >
              {t('footer_privacy')}
            </Link>
            <Link
              href="/refund"
              className="px-3.5 py-2 rounded-[6px] bg-surface border border-line-strong text-ink hover:border-accent transition-colors"
            >
              {t('footer_refund')}
            </Link>
            <Link
              href="/pricing"
              className="px-3.5 py-2 rounded-[6px] bg-surface border border-line-strong text-ink hover:border-accent transition-colors"
            >
              {t('nav_pricing')}
            </Link>
          </div>
        </section></Reveal>

        {/* Bottom CTA */}
        <Reveal from="up"><section className="p-6 sm:p-8 rounded-[12px] bg-surface border border-line-strong flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-x-clip">
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-ink">
              {content.ctaTitle}
            </h2>
            <p className="text-xs sm:text-sm text-ink-2">{content.ctaDesc}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/builder"
              className="px-4 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
            >
              {content.ctaPrimary}
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2.5 rounded-[6px] border border-line-strong bg-surface hover:bg-surface-2 text-ink text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{content.ctaSecondary}</span>
            </Link>
          </div>
        </section></Reveal>
      </main>

      <Footer />
    </div>
  );
}

