'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import { useLanguage } from '../context/LanguageContext';
import { openCookiePreferences } from '@/lib/analytics';
import { AlertTriangle, Globe, ShieldCheck, Cookie, Download, Trash2 } from 'lucide-react';

interface PrivacySection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

interface PrivacyContent {
  badge: string;
  title: string;
  updated: string;
  version: string;
  intro: string;
  rightsHighlightTitle: string;
  rightsHighlightBody: string;
  sections: PrivacySection[];
  contactPrompt: string;
}

const PRIVACY_BY_LANG: Record<'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr', PrivacyContent> = {
  en: {
    badge: 'PRIVACY & DATA PROTECTION',
    title: 'Privacy Policy',
    updated: 'Last Updated: October 31, 2026',
    version: 'Version 2026-10-31',
    intro:
      'At JobMatch AI ("Platform", "we", "us"), your career documents and personal data belong to you. This Privacy Policy explains what data we collect, how resumes are processed locally vs. by external AI providers, how long we retain data, how Lemon Squeezy acts as our Merchant of Record, and how you can export or permanently delete your data at any time.',
    rightsHighlightTitle: 'Self-Service Data Export & Account Deletion',
    rightsHighlightBody:
      'Signed-in users can visit Settings > Privacy at any time to download a complete portable JSON archive of their profile, resumes, cover letters, and orders ("Export my data") or permanently erase their account ("Delete my account").',
    sections: [
      {
        title: '1. Local In-Browser Parsing vs. External AI Provider Processing',
        paragraphs: [
          'In-Browser ATS Parsing: When you upload a PDF or DOCX file to our ATS Review scanner, text extraction and deterministic ATS scoring run locally in your browser memory without uploading the raw file to external third-party storage.',
          'External AI Processing: When you explicitly invoke AI features (AI Resume/CV Generator, Bullet Rewriter, or AI Cover Letter Generator), relevant text fields from your resume and target job description are sent over encrypted TLS connections to our external AI provider (OpenAI API) solely to generate your requested output.',
        ],
        bullets: [
          'Zero Model Training: Commercial API requests sent to OpenAI are not used to train foundation AI models.',
          'Minimized Telemetry: We log token counts, latency, and estimated API cost in our internal AiUsage collection for rate-limiting and budget protection, without logging your raw resume text in analytics.',
        ],
      },
      {
        title: '2. Categories of Personal Data Collected',
        paragraphs: [
          'We collect only the minimum data necessary to operate the Platform:',
        ],
        bullets: [
          'Account & Verification Data: Name, email address, bcrypt-hashed password, email verification status, and timestamp/version of Terms acceptance.',
          'Career Documents (When Saved): Resumes, CVs, Cover Letters, and ATS analysis summaries that you explicitly save to your cloud workspace.',
          'Billing Identifiers: Payment status, plan tier, AI credit balance, and provider customer/subscription IDs (e.g., Lemon Squeezy or Stripe IDs).',
        ],
      },
      {
        title: '3. Payment Processing & Merchant of Record (Lemon Squeezy)',
        paragraphs: [
          'Our global checkout and subscription billing are operated by Lemon Squeezy (lemonsqueezy.com) acting as our Merchant of Record, alongside optional regional gateways (Stripe and Paymob) where configured.',
          'Your payment card details, billing address, and tax/VAT information are collected and processed directly by the payment provider under PCI-DSS Level 1 security standards. JobMatch AI never receives or stores your credit card numbers.',
        ],
      },
      {
        title: '4. Data Retention & Accounting Anonymization',
        paragraphs: [
          'Active Accounts: Your profile, saved resumes, cover letters, and ATS analyses are retained for as long as your account remains active.',
          'Deleted Accounts: When you delete your account via Settings > Privacy (DELETE /api/account), your user record, resumes, cover letters, ATS analyses, and active sessions are permanently deleted immediately, and any active subscription is cancelled at the payment provider.',
          'Financial Ledger Anonymization: To comply with statutory tax, audit, and accounting regulations, historical Order and Payment records are retained in an anonymized format where your name, email, and personal metadata are irreversibly replaced with a cryptographic anonymization hash.',
        ],
      },
      {
        title: '5. Your Data Rights (GDPR / UK GDPR / CCPA)',
        paragraphs: [
          'Regardless of your location, we grant all users full data portability and erasure rights:',
        ],
        bullets: [
          'Right to Access & Portability (GET /api/account/export): Download a complete JSON file containing your profile, resumes, cover letters, and orders.',
          'Right to Erasure (DELETE /api/account): Permanently delete your account and personal documents with double confirmation.',
          'Right to Rectification & Objection: Edit your profile and documents at any time, or withdraw analytics consent via the Cookie Settings button below.',
        ],
      },
      {
        title: '6. Cookies & Analytics (Necessary vs. Analytics)',
        paragraphs: [
          'Strictly Necessary Cookies: Required for HTTP-only JWT authentication (`jobmatch_token`), language selection (`jobmatch_user_language`), theme preference, and storing your cookie consent state (`jobmatch_cookie_preferences`). These cannot be disabled.',
          'Optional Analytics (PostHog) & Error Monitoring (Sentry): We use PostHog for strictly anonymized funnel metrics (with a strict PII blacklist that strips names, emails, and resume text). PostHog is blocked by default and NEVER initializes in European jurisdictions (or globally) unless and until you explicitly click "Accept All" or enable Analytics in the Cookie Consent banner.',
        ],
      },
      {
        title: '7. ATS Score Disclaimer & Limitation of Liability',
        paragraphs: [
          'ATS compatibility scores are algorithmic estimates for self-improvement only and do not guarantee job interviews or employment. Our liability for any privacy or service claim is governed by the Limitation of Liability set forth in our Terms of Service (/terms).',
        ],
      },
    ],
    contactPrompt: 'For privacy inquiries, GDPR/CCPA requests, or DPO contact:',
  },
  ar: {
    badge: 'الخصوصية وحماية البيانات',
    title: 'سياسة الخصوصية (Privacy Policy)',
    updated: 'آخر تحديث: 31 أكتوبر 2026',
    version: 'الإصدار 2026-10-31',
    intro:
      'في منصة JobMatch AI ("المنصة" أو "نحن")، نؤمن بأن سيرتك الذاتية وبياناتك المهنية ملكٌ خالص لك. توضح سياسة الخصوصية هذه البيانات التي نجمعها، وكيفية معالجة السير الذاتية محلياً أو عبر مزود الذكاء الاصطناعي الخارجي، ومدة الاحتفاظ بالبيانات، ودور Lemon Squeezy كمزود دفع (Merchant of Record)، وحقوقك الكاملة في تصدير بياناتك أو حذف حسابك نهائياً.',
    rightsHighlightTitle: 'التحكم المباشر: تصدير البيانات وحذف الحساب',
    rightsHighlightBody:
      'يمكن لأي مستخدم مسجّل الدخول التوجه في أي وقت إلى (الإعدادات > الخصوصية) لتنزيل أرشيف JSON كامل يشمل ملفه الشخصي وسيره الذاتية وخطاباته وطلباته ("تصدير بياناتي") أو حذف حسابه نهائياً ("حذف حسابي").',
    sections: [
      {
        title: '1. المعالجة المحلية في المتصفح مقابل مزود الذكاء الاصطناعي الخارجي',
        paragraphs: [
          'الفحص المحلي للـ ATS: عند رفع ملف PDF أو DOCX في فاحص الـ ATS، تتم عملية استخراج النص وحساب النتيجة محلياً داخل ذاكرة متصفحك دون رفع الملف الأصلي إلى خوادم تخزين خارجية.',
          'المعالجة عبر مزود ذكاء اصطناعي خارجي: عند استخدامك لميزات التوليد بالذكاء الاصطناعي (توليد السيرة الذاتية، إعادة صياغة النقاط، أو كتابة خطاب التقديم)، يتم إرسال النصوص ذات الصلة من سيرتك الذاتية والوصف الوظيفي عبر اتصال مشفر (TLS) إلى مزود الذكاء الاصطناعي الخارجي (OpenAI API) حصراً لتوليد النص المطلوب.',
        ],
        bullets: [
          'عدم تدريب النماذج: لا تُستخدم بياناتك المرسلة عبر واجهة البرمجة التجارية لتدريب نماذج الذكاء الاصطناعي العامة.',
          'حماية الخصوصية في السجلات: نسجل فقط عدد الـ Tokens وزمن الاستجابة والتكلفة التقديرية في مجموعة AiUsage لأغراض ضبط الميزانية وحدود الاستخدام، دون تسجيل نصوص سيرتك الذاتية في التحليلات.',
        ],
      },
      {
        title: '2. البيانات التي نجمعها',
        paragraphs: [
          'نقتصر على جمع الحد الأدنى من البيانات اللازمة لتشغيل المنصة وتقديم الخدمة:',
        ],
        bullets: [
          'بيانات الحساب والتوثيق: الاسم، البريد الإلكتروني، كلمة المرور المشفرة (bcrypt)، حالة تأكيد البريد، وتاريخ وإصدار الموافقة على الشروط.',
          'المستندات المحفوظة سحابياً: السير الذاتية وخطابات التقديم ونتائج تحليل الـ ATS التي تختار حفظها في لوحة التحكم الخاصة بك.',
          'معرّفات الفوترة: نوع الخطة، رصيد النقاط، ومعرّفات العميل/الاشتراك لدى مزود الدفع (مثل Lemon Squeezy أو Stripe).',
        ],
      },
      {
        title: '3. مزود الدفع (Lemon Squeezy كـ Merchant of Record)',
        paragraphs: [
          'تُدار عمليات الدفع والفوترة العالمية عبر شريكنا Lemon Squeezy بصفته التاجر المسجل قانونياً (Merchant of Record)، بالإضافة إلى بوابتي Stripe و Paymob الاختياريتين عند تفعيلهما.',
          'تتم معالجة بيانات البطاقات البنكية والضرائب مباشرة لدى مزود الدفع وفق معايير أمان PCI-DSS من المستوى الأول، ولا تصل أرقام بطاقتك الائتمانية أو رمز الـ CVV إلى خوادم JobMatch AI مطلقاً.',
        ],
      },
      {
        title: '4. الاحتفاظ بالبيانات وإخفاء الهوية المحاسبي (Retention & Anonymization)',
        paragraphs: [
          'الحسابات النشطة: نحتفظ ببيانات حسابك ومستنداتك طالما بقي حسابك قائماً لتتمكن من الوصول إليها وتعديلها.',
          'حذف الحساب: فور طلبك حذف الحساب عبر (الإعدادات > الخصوصية)، يتم حذف حسابك وجميع سيرك الذاتية وخطابات التقديم والتحليلات والجلسات النشطة نهائياً، وإلغاء أي اشتراك فعّال لدى مزود الدفع.',
          'السجلات المالية: التزاماً بمتطلبات المحاسبة والضرائب القانونية، يتم الاحتفاظ بسجل الطلبات والمدفوعات بعد إخفاء الهوية بالكامل (Anonymization) وحذف الاسم والبريد الإلكتروني واستبدالهما بمعرّف مشفر غير قابل للعكس.',
        ],
      },
      {
        title: '5. حقوقك القانونية (التصدير، الحذف، والتعديل)',
        paragraphs: [
          'نمنح جميع المستخدمين (بما يتوافق مع لوائح GDPR وغيرها) الحقوق الكاملة التالية:',
        ],
        bullets: [
          'حق الوصول ونقل البيانات (Export my data): تحميل ملف JSON قياسي يحتوي على كافة بياناتك ومستنداتك.',
          'حق المسح والحذف النهائي (Delete my account): حذف الحساب وكافة المستندات الشخصية بتأكيد مزدوج فوري.',
          'حق سحب الموافقة: تعديل إعدادات ملفات تعريف الارتباط وإيقاف التحليلات في أي وقت من الزر الموجود أسفل الصفحة.',
        ],
      },
      {
        title: '6. ملفات تعريف الارتباط (Necessary / Analytics)',
        paragraphs: [
          'ملفات الارتباط الضرورية (Necessary): لازمة لتأمين جلسة الدخول (`jobmatch_token`)، وحفظ اللغة والمظهر، وتذكر اختيار الموافقة (`jobmatch_cookie_preferences`).',
          'ملفات التحليلات الاختيارية (Analytics - PostHog): نستخدم PostHog لإحصائيات الاستخدام العامة مع قائمة حظر صارمة تمنع إرسال أي بيانات شخصية أو نصوص سير ذاتية. لا يعمل PostHog إطلاقاً في الدول الأوروبية أو غيرها قبل موافقتك الصريحة عبر شريط الموافقة.',
        ],
      },
      {
        title: '7. طبيعة نتائج الـ ATS وحدود المسؤولية',
        paragraphs: [
          'نتائج وتقييمات الـ ATS هي مؤشرات تقديرية لمساعدتك في تحسين سيرتك الذاتية وليست ضماناً للتوظيف. تخضع حدود المسؤولية لما هو منصوص عليه في صفحة شروط الاستخدام (/terms).',
        ],
      },
    ],
    contactPrompt: 'لأي استفسارات تتعلق بالخصوصية أو حماية البيانات، راسلنا عبر:',
  },
  fr: {
    badge: 'CONFIDENTIALITÉ & DONNÉES',
    title: 'Politique de Confidentialité',
    updated: 'Dernière mise à jour : 31 octobre 2026',
    version: 'Version 2026-10-31',
    intro:
      'Cette Politique de Confidentialité détaille comment JobMatch AI traite vos CV (analyse ATS locale vs fournisseur IA externe), conserve vos données, gère les paiements via Lemon Squeezy (Merchant of Record) et garantit vos droits d’exportation et de suppression.',
    rightsHighlightTitle: 'Exportation JSON & Suppression de compte en libre-service',
    rightsHighlightBody:
      'Rendez-vous dans Paramètres > Confidentialité pour exporter toutes vos données au format JSON (« Exporter mes données ») ou supprimer définitivement votre compte (« Supprimer mon compte »).',
    sections: [
      {
        title: '1. Analyse ATS locale vs Traitement IA externe (OpenAI)',
        paragraphs: [
          'L’analyse ATS s’exécute dans votre navigateur. Lorsque vous utilisez la génération IA de CV ou de lettres, les textes nécessaires sont transmis de manière chiffrée à notre fournisseur IA externe (OpenAI API) sans jamais servir à l’entraînement de modèles.',
        ],
      },
      {
        title: '2. Conservation des données, exportation et suppression',
        paragraphs: [
          'Vos documents sont conservés tant que votre compte est actif. Lors de la suppression du compte, vos CV, lettres, analyses et sessions sont immédiatement effacés, votre abonnement actif est résilié et les commandes financières sont anonymisées pour la conformité comptable.',
        ],
      },
      {
        title: '3. Paiements (Lemon Squeezy en tant que Merchant of Record)',
        paragraphs: [
          'Les paiements sont traités par Lemon Squeezy (Merchant of Record) ou Stripe/Paymob. Nous ne stockons jamais vos numéros de carte bancaire.',
        ],
      },
      {
        title: '4. Cookies (Nécessaires / Analytiques) & Clause ATS',
        paragraphs: [
          'Les cookies nécessaires assurent l’authentification. PostHog (analytique anonymisée) est bloqué par défaut et ne démarre jamais en Europe ou ailleurs sans votre consentement explicite. Les scores ATS sont des estimations indicatives et non une garantie d’emploi.',
        ],
      },
    ],
    contactPrompt: 'Pour toute demande relative à vos données personnelles :',
  },
  de: {
    badge: 'DATENSCHUTZ & DATENSICHERHEIT',
    title: 'Datenschutzerklärung',
    updated: 'Zuletzt aktualisiert: 31. Oktober 2026',
    version: 'Version 2026-10-31',
    intro:
      'Diese Datenschutzerklärung erläutert, wie JobMatch AI Ihre Lebensläufe verarbeitet (lokale Browser-Analyse vs. externer KI-Anbieter), wie lange Daten gespeichert werden, wie Zahlungen über Lemon Squeezy (Merchant of Record) erfolgen und wie Sie Ihre Daten exportieren oder löschen können.',
    rightsHighlightTitle: 'Datenexport (JSON) & Kontolöschung',
    rightsHighlightBody:
      'Unter Einstellungen > Datenschutz können Sie jederzeit ein vollständiges JSON-Archiv Ihrer Daten herunterladen („Meine Daten exportieren“) oder Ihr Konto endgültig löschen („Mein Konto löschen“).',
    sections: [
      {
        title: '1. Lokale ATS-Prüfung vs. externer KI-Anbieter (OpenAI)',
        paragraphs: [
          'Die ATS-Prüfung erfolgt lokal im Browser. Bei Nutzung von KI-Funktionen werden relevante Textabschnitte verschlüsselt an unseren externen KI-Anbieter (OpenAI API) übermittelt, ohne dass Ihre Daten zum Training von KI-Modellen verwendet werden.',
        ],
      },
      {
        title: '2. Speicherdauer, Löschung & Buchhaltungs-Anonymisierung',
        paragraphs: [
          'Daten bleiben während der Kontonutzung gespeichert. Bei Kontolöschung werden Lebensläufe, Anschreiben, Analysen und Sitzungen sofort gelöscht, Abonnements gekündigt und Rechnungsdatensätze für gesetzliche Aufbewahrungspflichten anonymisiert.',
        ],
      },
      {
        title: '3. Zahlungsabwicklung (Lemon Squeezy als Merchant of Record)',
        paragraphs: [
          'Zahlungen werden über Lemon Squeezy als Merchant of Record (sowie optional Stripe/Paymob) abgewickelt. JobMatch AI speichert niemals Kreditkartendaten.',
        ],
      },
      {
        title: '4. Cookies (Notwendig / Analyse) & ATS-Hinweis',
        paragraphs: [
          'Notwendige Cookies sichern Login und Spracheinstellungen. PostHog-Analysen werden in der EU und weltweit niemals ohne Ihre vorherige Zustimmung geladen. ATS-Scores sind unverbindliche Schätzwerte.',
        ],
      },
    ],
    contactPrompt: 'Bei Datenschutzanfragen (DSGVO) kontaktieren Sie uns unter:',
  },
  es: {
    badge: 'PRIVACIDAD Y PROTECCIÓN DE DATOS',
    title: 'Política de Privacidad',
    updated: 'Última actualización: 31 de octubre de 2026',
    version: 'Versión 2026-10-31',
    intro:
      'Esta Política de Privacidad explica cómo JobMatch AI procesa tus currículums (escaneo ATS local frente a proveedor externo de IA), nuestra política de retención, el rol de Lemon Squeezy como Merchant of Record y tus derechos de exportación y eliminación.',
    rightsHighlightTitle: 'Exportación de datos (JSON) y eliminación de cuenta',
    rightsHighlightBody:
      'En Configuración > Privacidad puedes descargar en cualquier momento un archivo JSON con todos tus datos («Exportar mis datos») o eliminar permanentemente tu cuenta («Eliminar mi cuenta»).',
    sections: [
      {
        title: '1. Análisis ATS local frente a proveedor externo de IA (OpenAI)',
        paragraphs: [
          'El escáner ATS analiza tus documentos localmente en el navegador. Cuando activas la generación por IA, los datos necesarios se envían cifrados a nuestro proveedor externo (OpenAI API) sin utilizarse para entrenar modelos.',
        ],
      },
      {
        title: '2. Retención de datos, eliminación y anonimización contable',
        paragraphs: [
          'Tus documentos se conservan mientras tu cuenta esté activa. Al eliminar tu cuenta, se borran tus CV, cartas, análisis y sesiones, se cancela cualquier suscripción activa y los pedidos se anonimizan para fines fiscales.',
        ],
      },
      {
        title: '3. Proveedor de pagos (Lemon Squeezy como Merchant of Record)',
        paragraphs: [
          'Los pagos globales se procesan a través de Lemon Squeezy como Merchant of Record (o Stripe/Paymob). Nunca almacenamos datos de tarjetas bancarias.',
        ],
      },
      {
        title: '4. Cookies (Necesarias / Analíticas) y aviso ATS',
        paragraphs: [
          'Las cookies necesarias mantienen tu sesión segura. PostHog (analítica opcional) nunca se ejecuta sin tu consentimiento previo. Las puntuaciones ATS son estimaciones orientativas y no garantizan empleo.',
        ],
      },
    ],
    contactPrompt: 'Para consultas de privacidad o ejercicio de derechos:',
  },
  tr: {
    badge: 'GİZLİLİK VE VERİ KORUMA',
    title: 'Gizlilik Politikası',
    updated: 'Son Güncelleme: 31 Ekim 2026',
    version: 'Sürüm 2026-10-31',
    intro:
      'Bu Gizlilik Politikası; JobMatch AI platformunun özgeçmişlerinizi nasıl işlediğini (yerel ATS analizi ve harici yapay zeka sağlayıcısı), veri saklama sürelerini, Lemon Squeezy (Merchant of Record) ödeme altyapısını ve veri dışa aktarma/silme haklarınızı açıklar.',
    rightsHighlightTitle: 'Veri Dışa Aktarma (JSON) ve Hesap Silme',
    rightsHighlightBody:
      'Ayarlar > Gizlilik sayfasından istediğiniz zaman tüm verilerinizi JSON olarak indirebilir ("Verilerimi dışa aktar") veya hesabınızı kalıcı olarak silebilirsiniz ("Hesabımı sil").',
    sections: [
      {
        title: '1. Yerel ATS Analizi ve Harici Yapay Zeka Sağlayıcısı (OpenAI)',
        paragraphs: [
          'ATS taraması tarayıcınızda yerel olarak çalışır. Yapay zeka oluşturma özelliklerini kullandığınızda, ilgili metinler model eğitimi için kullanılmaksızın şifreli olarak harici sağlayıcımıza (OpenAI API) iletilir.',
        ],
      },
      {
        title: '2. Veri Saklama, Silme ve Muhasebe Anonimleştirmesi',
        paragraphs: [
          'Verileriniz hesabınız aktif olduğu sürece saklanır. Hesabınızı sildiğinizde özgeçmişleriniz, ön yazılarınız, analizleriniz ve oturumlarınız derhal silinir, aktif abonelikler iptal edilir ve finansal kayıtlar vergi mevzuatı gereği anonimleştirilir.',
        ],
      },
      {
        title: '3. Ödeme Sağlayıcısı (Merchant of Record Olarak Lemon Squeezy)',
        paragraphs: [
          'Ödemeler Lemon Squeezy (Merchant of Record) ve yapılandırılan bölgelerde Stripe/Paymob tarafından işlenir. Kredi kartı bilgileriniz sunucularımızda tutulmaz.',
        ],
      },
      {
        title: '4. Çerezler (Zorunlu / Analitik) ve ATS Uyarısı',
        paragraphs: [
          'Zorunlu çerezler güvenli oturum için gereklidir. PostHog analitik çerezleri açık onayınız olmadan asla çalışmaz. ATS puanları tahmini olup işe alım garantisi vermez.',
        ],
      },
    ],
    contactPrompt: 'Gizlilik ve veri koruma talepleriniz için:',
  },
};

export default function PrivacyPage() {
  const { language, isRtl, t } = useLanguage();
  const content = PRIVACY_BY_LANG[language] || PRIVACY_BY_LANG.en;

  return (
    <div
      className="min-h-screen bg-paper text-ink flex flex-col justify-between selection:bg-accent-soft selection:text-ink"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Navbar */}
      <nav className="border-b border-line bg-surface sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full text-start">
        {/* Pre-Launch Legal Counsel Review Banner */}
        <div
          role="note"
          className="mb-4 p-4 rounded-[10px] border border-warning/40 bg-surface flex items-start gap-3 text-xs text-ink-2"
        >
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-ink">{t('legal_counsel_notice_title')}</p>
            <p className="leading-relaxed">{t('legal_counsel_notice_desc')}</p>
          </div>
        </div>

        {/* Non-English Governing Reference Notice */}
        {language !== 'en' && (
          <div
            role="note"
            className="mb-6 p-3.5 rounded-[10px] border border-accent/30 bg-accent-soft/40 flex items-start gap-3 text-xs text-ink"
          >
            <Globe className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t('legal_english_ref_notice')}</p>
          </div>
        )}

        <div className="p-6 sm:p-10 rounded-[12px] bg-surface border border-line-strong space-y-8 shadow-subtle">
          <div className="border-b border-line pb-6 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{content.badge}</span>
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-surface-2 border border-line text-ink-2">
                {content.version}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-ink tracking-tight">
              {content.title}
            </h1>
            <p className="text-xs text-ink-3 font-mono">{content.updated}</p>
            <p className="text-sm text-ink-2 leading-relaxed pt-2">{content.intro}</p>
          </div>

          {/* Self-Service Data Rights Box */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-surface-2 border border-line-strong flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink">
                <Download className="w-4 h-4 text-accent shrink-0" />
                <span>{content.rightsHighlightTitle}</span>
              </div>
              <p className="text-xs text-ink-2 leading-relaxed">
                {content.rightsHighlightBody}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href="/settings"
                className="px-3 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent text-xs font-medium transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('nav_settings')}</span>
              </Link>
              <button
                type="button"
                onClick={openCookiePreferences}
                className="px-3 py-1.5 rounded-[6px] border border-line-strong bg-surface hover:bg-surface-2 text-ink text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Cookie className="w-3.5 h-3.5 text-accent" />
                <span>{t('footer_cookie_settings')}</span>
              </button>
            </div>
          </div>

          {/* Privacy Sections */}
          <div className="space-y-6 text-sm text-ink-2 leading-relaxed">
            {content.sections.map((sec, idx) => (
              <section key={idx} className="space-y-2.5">
                <h2 className="font-serif text-base sm:text-lg font-bold text-ink">
                  {sec.title}
                </h2>
                {sec.paragraphs.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}
                {sec.bullets && sec.bullets.length > 0 && (
                  <ul className="list-disc ps-5 space-y-1.5 text-ink-2">
                    {sec.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Related Policies & Contact Footer */}
          <div className="pt-6 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-ink-2">
            <div>
              <span>{content.contactPrompt} </span>
              <Link
                href="/contact"
                className="text-accent font-semibold underline underline-offset-4 hover:opacity-80"
              >
                support@jobmatch.ai
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/terms" className="text-accent hover:underline underline-offset-4">
                {t('footer_terms')}
              </Link>
              <span>•</span>
              <Link href="/refund" className="text-accent hover:underline underline-offset-4">
                {t('footer_refund')}
              </Link>
              <span>•</span>
              <Link href="/contact" className="text-accent hover:underline underline-offset-4">
                {t('footer_contact')}
              </Link>
              <span>•</span>
              <Link href="/about" className="text-accent hover:underline underline-offset-4">
                {t('footer_about')}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
