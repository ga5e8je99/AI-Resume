'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, Globe, RotateCcw, CheckCircle2, Mail } from 'lucide-react';

interface RefundSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

interface RefundContent {
  badge: string;
  title: string;
  updated: string;
  version: string;
  intro: string;
  summaryTitle: string;
  summaryBody: string;
  sections: RefundSection[];
  ctaTitle: string;
  ctaBody: string;
  ctaBtn: string;
}

const REFUND_BY_LANG: Record<'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr', RefundContent> = {
  en: {
    badge: 'BILLING & REFUNDS',
    title: 'Refund & Cancellation Policy',
    updated: 'Last Updated: October 31, 2026',
    version: 'Version 2026-10-31',
    intro:
      'At JobMatch AI, we want you to be confident when upgrading to JobMatch Pro or purchasing Pay-As-You-Go (PAYG) credits. Because our global orders are processed by Lemon Squeezy as our Merchant of Record (alongside optional regional gateways such as Stripe and Paymob), this Refund Policy is designed to align with Merchant of Record buyer protection standards and applicable consumer laws.',
    summaryTitle: '14-Day Refund Window & Anytime Cancellation',
    summaryBody:
      'You can cancel your Pro subscription at any time with one click from Settings > Billing. Eligible initial purchases and unused credit packs qualify for a full refund within 14 days of purchase.',
    sections: [
      {
        title: '1. Merchant of Record (Lemon Squeezy) & Payment Gateways',
        paragraphs: [
          'Global orders are processed by Lemon Squeezy (lemonsqueezy.com) as our Merchant of Record, which handles payment collection, VAT/sales tax, invoicing, and refund disbursements back to your original payment method. Where Stripe or Paymob is used for regional checkout, refunds are returned through the same gateway used at purchase.',
        ],
      },
      {
        title: '2. Pro Subscriptions (Monthly & Annual) — 14-Day Refund Eligibility',
        paragraphs: [
          'If you are not satisfied with your initial JobMatch Pro subscription purchase, you may request a full refund within 14 calendar days of the transaction date, provided that:',
        ],
        bullets: [
          'Fair-Use Condition: You have not consumed excessive AI generation volume (e.g., more than 5 full AI Resume/Cover Letter generations) or bulk-exported premium templates during the trial window.',
          'Technical Issues: Full refunds are always granted if a verified technical defect prevented you from accessing Pro features you paid for.',
          'Renewal Charges: If you forgot to cancel before an automatic renewal, contact us within 72 hours of the renewal charge with zero AI usage in the new cycle for a full refund.',
        ],
      },
      {
        title: '3. Pay-As-You-Go (PAYG) Credit Packs',
        paragraphs: [
          'Pay-As-You-Go credit packs (15 AI Credits) never expire while your account is active.',
          'Unused PAYG packs (where 0 credits from the purchased pack have been spent) are eligible for a 100% refund within 14 days of purchase. Once AI credits from a PAYG pack have been consumed to generate resumes, cover letters, or job searches, the pack becomes non-refundable except in cases of verified platform error.',
        ],
      },
      {
        title: '4. Subscription Cancellation (No Cancellation Fees)',
        paragraphs: [
          'You may cancel your recurring Pro subscription at any time via Settings > Billing ("Manage Subscription") or through the customer portal link in your receipt email.',
          'Cancelling stops all future billing cycles immediately. Your account will retain full Pro access until the end of your current paid billing period, after which it automatically reverts to the Free tier without losing your saved resumes.',
        ],
      },
      {
        title: '5. Effect of Refunds on Account Entitlements',
        paragraphs: [
          'When a refund is issued (`order_refunded` webhook), our system automatically revokes the associated Pro subscription status or deducts the refunded PAYG credits from your account balance.',
        ],
      },
      {
        title: '6. How to Request a Refund',
        paragraphs: [
          'To request a refund, please submit a request via our Contact Page (/contact) or email support@jobmatch.ai with your account email address and Order Reference / Receipt number. We review and respond to all refund requests within 1–2 business days, and approved refunds typically appear on your statement within 5–10 business days depending on your bank.',
        ],
      },
    ],
    ctaTitle: 'Need help with an order or refund request?',
    ctaBody: 'Send us your order reference and our support team will assist you promptly.',
    ctaBtn: 'Contact Billing Support',
  },
  ar: {
    badge: 'الفوترة والاسترداد',
    title: 'سياسة الاسترداد وإلغاء الاشتراك (Refund Policy)',
    updated: 'آخر تحديث: 31 أكتوبر 2026',
    version: 'الإصدار 2026-10-31',
    intro:
      'نحرص في منصة JobMatch AI على رضاك التام عند الترقية إلى باقة JobMatch Pro أو شراء حزم نقاط الدفع حسب الاستخدام (PAYG). ونظراً لأن عمليات الدفع العالمية تتم عبر شريكنا Lemon Squeezy بصفته التاجر المسجل (Merchant of Record) — إلى جانب بوابتي Stripe و Paymob في المناطق المفعّلة — فقد صُممت هذه السياسة لتتوافق مع معايير حماية المشتري لدى مزود الدفع وقوانين حماية المستهلك.',
    summaryTitle: 'ضمان استرداد خلال 14 يوماً وإلغاء في أي وقت',
    summaryBody:
      'يمكنك إلغاء اشتراكك في أي وقت بنقرة واحدة من صفحة الإعدادات دون أي رسوم إضافية. كما يحق لك طلب استرداد كامل المبلغ خلال 14 يوماً للطلبات المؤهلة وحزم النقاط غير المستهلكة.',
    sections: [
      {
        title: '1. مزود الدفع (Lemon Squeezy كـ Merchant of Record)',
        paragraphs: [
          'تُدار عمليات التحصيل والضرائب والفواتير واسترجاع المدفوعات عالمياً بواسطة Lemon Squeezy بصفته الـ Merchant of Record، أو عبر البوابة التي تم الدفع من خلالها (Stripe أو Paymob). ويتم إرجاع أي مبالغ مستردة إلى نفس وسيلة الدفع الأصلية التي استخدمتها.',
        ],
      },
      {
        title: '2. اشتراكات باقة المحترفين (Pro الشهري والسنوي) — مهلة 14 يوماً',
        paragraphs: [
          'يحق لك طلب استرداد كامل المبلغ المدفوع لأول اشتراك في باقة Pro خلال 14 يوماً تقويمياً من تاريخ الدفع، وفق الشروط العادلة التالية:',
        ],
        bullets: [
          'شرط الاستخدام المعقول: ألا يكون قد تم استهلاك مكثف لمولد الذكاء الاصطناعي (أكثر من 5 عمليات توليد كاملة للسير الذاتية أو خطابات التقديم) وتصدير القوالب المدفوعة بشكل كامل خلال فترة التجربة.',
          'الأعطال التقنية: يتم رد المبلغ بالكامل فوراً في حال وجود أي خلل تقني موثق حال دون استفادتك من مزايا الباقة المدفوعة.',
          'رسوم التجديد التلقائي: في حال نسيت إلغاء الاشتراك قبل موعد التجديد التلقائي، يمكنك مراسلتنا خلال 72 ساعة من تاريخ التجديد (شريطة عدم استهلاك نقاط ذكاء اصطناعي في الدورة الجديدة) لاسترداد مبلغ التجديد بالكامل.',
        ],
      },
      {
        title: '3. حزم نقاط الدفع حسب الاستخدام (Pay-As-You-Go Credits)',
        paragraphs: [
          'تتميز نقاط الدفع حسب الاستخدام (15 نقطة) بأنها صالحة مدى الحياة طالما بقي حسابك نشطاً.',
          'تكون حزمة النقاط مؤهلة لاسترداد كامل المبلغ (100%) خلال 14 يوماً من تاريخ الشراء شريطة عدم استهلاك أي نقطة منها. أما بعد البدء في استخدام النقاط لتوليد سير ذاتية أو خطابات تقديم، تصبح الحزمة غير قابلة للاسترداد النقدي إلا في حال حدوث خطأ تقني من المنصة.',
        ],
      },
      {
        title: '4. إلغاء الاشتراك في أي وقت (بدون رسوم إلغاء)',
        paragraphs: [
          'يمكنك إلغاء التجديد التلقائي لاشتراكك في أي وقت عبر صفحة الإعدادات ("إدارة الاشتراك" / Manage Subscription) أو من خلال رابط إدارة الاشتراك في فاتورتك.',
          'يوقف الإلغاء أي خصومات مستقبلية فوراً، مع احتفاظك بكافة مزايا Pro حتى نهاية الفترة المدفوعة الحالية، ثم يعود حسابك تلقائياً للباقة المجانية دون فقدان سيرك الذاتية المحفوظة.',
        ],
      },
      {
        title: '5. أثر الاسترداد على رصيد ومزايا الحساب',
        paragraphs: [
          'عند إتمام عملية الاسترداد لدى مزود الدفع (`order_refunded`)، يقوم النظام تلقائياً وبشكل فوري بإلغاء تفعيل خطة Pro أو خصم نقاط PAYG المستردة من رصيد الحساب.',
        ],
      },
      {
        title: '6. كيفية تقديم طلب استرداد',
        paragraphs: [
          'لتقديم طلب استرداد، يرجى مراسلتنا عبر صفحة تواصل معنا (/contact) أو إرسال بريد إلكتروني إلى support@jobmatch.ai يتضمن البريد الإلكتروني للحساب ورقم الطلب أو الفاتورة (Order Reference). تتم مراجعة الطلبات والرد عليها خلال 1–2 يوم عمل، ويظهر المبلغ في حسابك البنكي خلال 5–10 أيام عمل حسب البنك المصدر لبطاقتك.',
        ],
      },
    ],
    ctaTitle: 'هل تحتاج إلى مساعدة بخصوص دفعة أو طلب استرداد؟',
    ctaBody: 'أرسل لنا رقم الطلب وسيتولى فريق الدعم معالجة طلبك في أسرع وقت.',
    ctaBtn: 'تواصل مع دعم الفوترة',
  },
  fr: {
    badge: 'FACTURATION & REMBOURSEMENTS',
    title: 'Politique de Remboursement et d’Annulation',
    updated: 'Dernière mise à jour : 31 octobre 2026',
    version: 'Version 2026-10-31',
    intro:
      'Cette Politique de Remboursement s’aligne sur les règles de Lemon Squeezy (notre Merchant of Record mondial) ainsi que Stripe et Paymob.',
    summaryTitle: 'Garantie de remboursement de 14 jours & Annulation libre',
    summaryBody:
      'Vous pouvez annuler votre abonnement Pro à tout moment depuis Paramètres > Facturation. Les nouveaux abonnements éligibles et les packs de crédits non utilisés sont remboursables sous 14 jours.',
    sections: [
      {
        title: '1. Abonnements Pro (Mensuel et Annuel)',
        paragraphs: [
          'Vous pouvez demander un remboursement intégral dans les 14 jours suivant votre premier achat Pro, sous réserve d’une utilisation raisonnable (moins de 5 générations IA complètes). En cas de renouvellement oublié, contactez-nous sous 72 heures sans utilisation dans le nouveau cycle.',
        ],
      },
      {
        title: '2. Packs de crédits Pay-As-You-Go (PAYG)',
        paragraphs: [
          'Les packs de 15 crédits non entamés (0 crédit utilisé) sont intégralement remboursables dans un délai de 14 jours suivant l’achat. Une fois un remboursement traité, les crédits ou l’accès Pro sont automatiquement retirés du compte.',
        ],
      },
      {
        title: '3. Comment demander un remboursement',
        paragraphs: [
          'Contactez-nous via /contact ou à support@jobmatch.ai en indiquant l’adresse e-mail de votre compte et la référence de votre commande. Délai de réponse : 1 à 2 jours ouvrés.',
        ],
      },
    ],
    ctaTitle: 'Besoin d’aide concernant une commande ?',
    ctaBody: 'Notre équipe support vous répond sous 24 à 48 heures.',
    ctaBtn: 'Contacter le support',
  },
  de: {
    badge: 'ABRECHNUNG & RÜCKERSTATTUNG',
    title: 'Rückerstattungs- und Kündigungsrichtlinie',
    updated: 'Zuletzt aktualisiert: 31. Oktober 2026',
    version: 'Version 2026-10-31',
    intro:
      'Diese Rückerstattungsrichtlinie entspricht den Käuferschutzstandards unseres Merchant of Record Lemon Squeezy sowie den gesetzlichen Verbraucherrechten.',
    summaryTitle: '14-tägiges Rückgaberecht & jederzeitige Kündigung',
    summaryBody:
      'Pro-Abonnements können jederzeit mit einem Klick in den Einstellungen gekündigt werden. Erstkäufe und ungenutzte Credit-Pakete können innerhalb von 14 Tagen erstattet werden.',
    sections: [
      {
        title: '1. Pro-Abonnements (Monatlich & Jährlich)',
        paragraphs: [
          'Innerhalb von 14 Tagen nach dem Erstkauf können Sie eine vollständige Rückerstattung beantragen, sofern keine übermäßige KI-Nutzung (maximal 5 vollständige KI-Generierungen) stattgefunden hat. Bei versehentlicher Verlängerung kontaktieren Sie uns bitte innerhalb von 72 Stunden ohne Nutzung im neuen Zeitraum.',
        ],
      },
      {
        title: '2. Pay-As-You-Go (PAYG) Credit-Pakete',
        paragraphs: [
          'Unbenutzte PAYG-Pakete (0 verbrauchte Credits) werden innerhalb von 14 Tagen nach Kauf vollständig erstattet. Nach erfolgter Rückerstattung werden der Pro-Status bzw. die Credits automatisch vom Konto abgezogen.',
        ],
      },
      {
        title: '3. Rückerstattung beantragen',
        paragraphs: [
          'Senden Sie Ihre Bestellreferenz über unser Kontaktformular (/contact) oder per E-Mail an support@jobmatch.ai. Wir bearbeiten Anfragen innerhalb von 1–2 Werktagen.',
        ],
      },
    ],
    ctaTitle: 'Fragen zu einer Zahlung oder Rückerstattung?',
    ctaBody: 'Senden Sie uns Ihre Bestellnummer und wir helfen Ihnen umgehend.',
    ctaBtn: 'Support kontaktieren',
  },
  es: {
    badge: 'FACTURACIÓN Y REEMBOLSOS',
    title: 'Política de Reembolso y Cancelación',
    updated: 'Última actualización: 31 de octubre de 2026',
    version: 'Versión 2026-10-31',
    intro:
      'Esta Política de Reembolso está alineada con nuestro Merchant of Record global, Lemon Squeezy, así como con las pasarelas Stripe y Paymob.',
    summaryTitle: 'Plazo de reembolso de 14 días y cancelación en cualquier momento',
    summaryBody:
      'Puedes cancelar tu suscripción Pro en cualquier momento desde Configuración. Las compras iniciales elegibles y los paquetes de créditos no utilizados tienen garantía de reembolso de 14 días.',
    sections: [
      {
        title: '1. Suscripciones Pro (Mensual y Anual)',
        paragraphs: [
          'Puedes solicitar un reembolso completo dentro de los 14 días posteriores a tu compra inicial Pro siempre que no se haya realizado un uso intensivo de IA (máximo 5 generaciones completas). Para renovaciones automáticas, contáctanos dentro de las 72 horas sin uso en el nuevo ciclo.',
        ],
      },
      {
        title: '2. Paquetes de créditos Pay-As-You-Go (PAYG)',
        paragraphs: [
          'Los paquetes de créditos no utilizados (0 créditos consumidos) son 100% reembolsables dentro de los 14 días posteriores a la compra. Al procesarse un reembolso, el plan o los créditos se revocan automáticamente.',
        ],
      },
      {
        title: '3. Cómo solicitar un reembolso',
        paragraphs: [
          'Escríbenos a través de /contact o a support@jobmatch.ai indicando el correo de tu cuenta y la referencia del pedido. Respondemos en 1–2 días hábiles.',
        ],
      },
    ],
    ctaTitle: '¿Necesitas ayuda con un pago o reembolso?',
    ctaBody: 'Envíanos la referencia de tu pedido y te ayudaremos de inmediato.',
    ctaBtn: 'Contactar soporte',
  },
  tr: {
    badge: 'FATURALANDIRMA VE İADE',
    title: 'İade ve İptal Politikası',
    updated: 'Son Güncelleme: 31 Ekim 2026',
    version: 'Sürüm 2026-10-31',
    intro:
      'Bu İade Politikası, küresel Merchant of Record sağlayıcımız Lemon Squeezy (ve Stripe/Paymob) kuralları ve tüketici koruma standartlarıyla uyumlu olarak hazırlanmıştır.',
    summaryTitle: '14 Günlük İade Süresi ve İstediğiniz Zaman İptal',
    summaryBody:
      'Pro aboneliğinizi Ayarlar sayfasından tek tıkla istediğiniz zaman iptal edebilirsiniz. Uygun ilk abonelikler ve kullanılmamış kredi paketleri 14 gün içinde tam iade kapsamındadır.',
    sections: [
      {
        title: '1. Pro Abonelikler (Aylık ve Yıllık)',
        paragraphs: [
          'İlk Pro satın alımınızdan sonraki 14 gün içinde, aşırı yapay zeka kullanımı yapılmamış olması (en fazla 5 tam üretim) koşuluyla tam iade talep edebilirsiniz. Unutulan yenilemelerde yeni dönemde kullanım yapmadan 72 saat içinde bize ulaşabilirsiniz.',
        ],
      },
      {
        title: '2. Kullandıkça Öde (PAYG) Kredi Paketleri',
        paragraphs: [
          'Hiç kullanılmamış PAYG kredi paketleri (0 kredi harcanmış) satın alma tarihinden itibaren 14 gün içinde %100 iade edilebilir. İade onaylandığında ilgili Pro planı veya krediler hesaptan otomatik olarak geri alınır.',
        ],
      },
      {
        title: '3. İade Talebi Nasıl Oluşturulur?',
        paragraphs: [
          'Sipariş referans numaranız ve hesap e-postanız ile /contact sayfasından veya support@jobmatch.ai adresinden bize ulaşabilirsiniz. Talepler 1–2 iş günü içinde yanıtlanır.',
        ],
      },
    ],
    ctaTitle: 'Ödeme veya iade konusunda yardıma mı ihtiyacınız var?',
    ctaBody: 'Sipariş numaranızı bize iletin, destek ekibimiz hemen yardımcı olsun.',
    ctaBtn: 'Destek Ekibiyle İletişime Geç',
  },
};

export default function RefundPage() {
  const { language, isRtl, t } = useLanguage();
  const content = REFUND_BY_LANG[language] || REFUND_BY_LANG.en;

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
              href="/pricing"
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
                <RotateCcw className="w-3.5 h-3.5" />
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

          {/* Highlight Box */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-surface-2 border border-line-strong space-y-1.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span>{content.summaryTitle}</span>
            </div>
            <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
              {content.summaryBody}
            </p>
          </div>

          {/* Refund Sections */}
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

          {/* CTA Box */}
          <div className="p-5 rounded-[10px] bg-surface-2 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-serif text-sm sm:text-base font-semibold text-ink">
                {content.ctaTitle}
              </h3>
              <p className="text-xs text-ink-2">{content.ctaBody}</p>
            </div>
            <Link
              href="/contact?topic=refund"
              className="px-4 py-2 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent text-xs font-medium transition-colors inline-flex items-center gap-1.5 shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{content.ctaBtn}</span>
            </Link>
          </div>

          {/* Related Links */}
          <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs text-ink-2">
            <span>
              Support:{' '}
              <a
                href="mailto:support@jobmatch.ai"
                className="text-accent font-semibold underline underline-offset-4"
              >
                support@jobmatch.ai
              </a>
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/terms" className="text-accent hover:underline underline-offset-4">
                {t('footer_terms')}
              </Link>
              <span>•</span>
              <Link href="/privacy" className="text-accent hover:underline underline-offset-4">
                {t('footer_privacy')}
              </Link>
              <span>•</span>
              <Link href="/pricing" className="text-accent hover:underline underline-offset-4">
                {t('nav_pricing')}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

