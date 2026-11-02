'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Reveal, Stagger } from '@/components/motion/Reveal';
import { Button } from '../components/ui/Button';
import { Mail, MessageSquare, Clock, ShieldCheck, CheckCircle2, AlertCircle, Send } from 'lucide-react';

interface ContactStrings {
  badge: string;
  title: string;
  subtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  topicLabel: string;
  topics: {
    general: string;
    billing: string;
    refund: string;
    privacy: string;
    bug: string;
  };
  orderRefLabel: string;
  orderRefPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  submitBtn: string;
  submittingBtn: string;
  successTitle: string;
  successDesc: string;
  sendAnotherBtn: string;
  directEmailTitle: string;
  directEmailDesc: string;
  slaTitle: string;
  slaDesc: string;
  privacyCardTitle: string;
  privacyCardDesc: string;
  errRequired: string;
}

const CONTACT_BY_LANG: Record<'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr', ContactStrings> = {
  en: {
    badge: 'SUPPORT & INQUIRIES',
    title: 'Contact Our Support Team',
    subtitle:
      'Have a question about your ATS scan, AI resume generation, Lemon Squeezy billing, or refund request? Fill out the form below or email us directly.',
    nameLabel: 'Full Name',
    namePlaceholder: 'Alex Johnson',
    emailLabel: 'Email Address',
    emailPlaceholder: 'you@example.com',
    topicLabel: 'Inquiry Category',
    topics: {
      general: 'General Product Question',
      billing: 'Subscription & Billing',
      refund: 'Refund Request (14-Day Policy)',
      privacy: 'Privacy / GDPR Data Request',
      bug: 'Technical Issue / Bug Report',
    },
    orderRefLabel: 'Order Reference (Optional)',
    orderRefPlaceholder: 'e.g. ORD-2026-... or Lemon Squeezy Receipt #',
    messageLabel: 'Your Message',
    messagePlaceholder: 'Please describe how we can help you (minimum 10 characters)...',
    submitBtn: 'Send Message',
    submittingBtn: 'Sending...',
    successTitle: 'Message Sent Successfully!',
    successDesc:
      'We have received your inquiry and generated your support ticket. Our team typically responds within 1–2 business days.',
    sendAnotherBtn: 'Send Another Message',
    directEmailTitle: 'Direct Support Email',
    directEmailDesc: 'Prefer emailing directly from your inbox? Reach our support and billing desk at:',
    slaTitle: 'Response Time',
    slaDesc: '1–2 business days (Priority same-day handling for Pro subscribers and billing inquiries).',
    privacyCardTitle: 'Self-Service Data & Billing Controls',
    privacyCardDesc:
      'You can manage your subscription, export your data (JSON), or delete your account anytime from Settings.',
    errRequired: 'Please fill out your name, valid email, and a message of at least 10 characters.',
  },
  ar: {
    badge: 'الدعم الفني والتواصل',
    title: 'تواصل مع فريق دعم JobMatch AI',
    subtitle:
      'هل لديك استفسار حول فحص الـ ATS، أو توليد السيرة الذاتية بالذكاء الاصطناعي، أو الفوترة وطلبات الاسترداد؟ املأ النموذج أدناه أو راسلنا مباشرة عبر البريد الإلكتروني.',
    nameLabel: 'الاسم الكامل',
    namePlaceholder: 'أحمد محمد',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'you@example.com',
    topicLabel: 'نوع الاستفسار',
    topics: {
      general: 'استفسار عام حول المنصة',
      billing: 'الاشتراكات والفوترة',
      refund: 'طلب استرداد مبلغ (سياسة 14 يوماً)',
      privacy: 'الخصوصية وحقوق البيانات',
      bug: 'مشكلة تقنية أو بلاغ عن عطل',
    },
    orderRefLabel: 'رقم الطلب / الفاتورة (اختياري)',
    orderRefPlaceholder: 'مثال: ORD-2026-... أو رقم إيصال Lemon Squeezy',
    messageLabel: 'نص الرسالة',
    messagePlaceholder: 'يرجى شرح استفسارك بالتفصيل لنتمكن من مساعدتك بأفضل شكل (10 أحرف على الأقل)...',
    submitBtn: 'إرسال الرسالة',
    submittingBtn: 'جارٍ الإرسال...',
    successTitle: 'تم استلام رسالتك بنجاح!',
    successDesc:
      'تم تسجيل تذكرة الدعم الخاصة بك، وسيقوم فريقنا بالرد عليك عبر البريد الإلكتروني خلال 1–2 يوم عمل.',
    sendAnotherBtn: 'إرسال رسالة أخرى',
    directEmailTitle: 'البريد المباشر للدعم الفني',
    directEmailDesc: 'هل تفضل مراسلتنا مباشرة من بريدك الإلكتروني؟ تواصل معنا على:',
    slaTitle: 'وقت الاستجابة المتوقع',
    slaDesc: 'من يوم إلى يومي عمل (أولوية الرد في نفس اليوم لمشتركي باقة Pro وطلبات الفوترة).',
    privacyCardTitle: 'التحكم المباشر بالاشتراك والبيانات',
    privacyCardDesc:
      'يمكنك إدارة اشتراكك، أو تصدير بياناتك بصيغة JSON، أو حذف حسابك مباشرة من صفحة الإعدادات.',
    errRequired: 'يرجى إدخال الاسم، وبريد إلكتروني صحيح، ورسالة لا تقل عن 10 أحرف.',
  },
  fr: {
    badge: 'SUPPORT & CONTACT',
    title: 'Contacter l’équipe JobMatch AI',
    subtitle:
      'Une question sur l’analyse ATS, la génération IA, la facturation Lemon Squeezy ou un remboursement ? Envoyez-nous un message ou écrivez-nous directement.',
    nameLabel: 'Nom complet',
    namePlaceholder: 'Jean Dupont',
    emailLabel: 'Adresse e-mail',
    emailPlaceholder: 'vous@exemple.com',
    topicLabel: 'Catégorie',
    topics: {
      general: 'Question générale',
      billing: 'Abonnement & Facturation',
      refund: 'Demande de remboursement (14 jours)',
      privacy: 'Confidentialité & Données RGPD',
      bug: 'Problème technique',
    },
    orderRefLabel: 'Référence de commande (Optionnel)',
    orderRefPlaceholder: 'ex. ORD-2026-...',
    messageLabel: 'Votre message',
    messagePlaceholder: 'Décrivez votre demande (minimum 10 caractères)...',
    submitBtn: 'Envoyer le message',
    submittingBtn: 'Envoi...',
    successTitle: 'Message envoyé avec succès !',
    successDesc: 'Votre demande a bien été enregistrée. Notre équipe vous répondra sous 1 à 2 jours ouvrés.',
    sendAnotherBtn: 'Envoyer un autre message',
    directEmailTitle: 'E-mail de support direct',
    directEmailDesc: 'Vous pouvez également nous écrire directement à :',
    slaTitle: 'Délai de réponse',
    slaDesc: '1 à 2 jours ouvrés (traitement prioritaire pour les abonnés Pro).',
    privacyCardTitle: 'Gestion autonome des données',
    privacyCardDesc: 'Gérez votre abonnement, exportez vos données JSON ou supprimez votre compte depuis les Paramètres.',
    errRequired: 'Veuillez renseigner votre nom, un e-mail valide et un message d’au moins 10 caractères.',
  },
  de: {
    badge: 'SUPPORT & KONTAKT',
    title: 'Kontaktieren Sie unser Support-Team',
    subtitle:
      'Fragen zu ATS-Analyse, KI-Generierung, Abrechnung über Lemon Squeezy oder Rückerstattungen? Nutzen Sie das Formular oder schreiben Sie uns direkt.',
    nameLabel: 'Vollständiger Name',
    namePlaceholder: 'Max Mustermann',
    emailLabel: 'E-Mail-Adresse',
    emailPlaceholder: 'name@beispiel.de',
    topicLabel: 'Kategorie',
    topics: {
      general: 'Allgemeine Frage',
      billing: 'Abonnement & Abrechnung',
      refund: 'Rückerstattungsanfrage (14-Tage-Richtlinie)',
      privacy: 'Datenschutz / DSGVO-Anfrage',
      bug: 'Technisches Problem',
    },
    orderRefLabel: 'Bestellreferenz (Optional)',
    orderRefPlaceholder: 'z.B. ORD-2026-...',
    messageLabel: 'Ihre Nachricht',
    messagePlaceholder: 'Bitte beschreiben Sie Ihr Anliegen (mindestens 10 Zeichen)...',
    submitBtn: 'Nachricht senden',
    submittingBtn: 'Wird gesendet...',
    successTitle: 'Nachricht erfolgreich gesendet!',
    successDesc: 'Wir haben Ihre Anfrage erhalten und melden uns innerhalb von 1–2 Werktagen bei Ihnen.',
    sendAnotherBtn: 'Weitere Nachricht senden',
    directEmailTitle: 'Direkte Support-E-Mail',
    directEmailDesc: 'Schreiben Sie uns jederzeit direkt per E-Mail an:',
    slaTitle: 'Antwortzeit',
    slaDesc: '1–2 Werktage (Prioritäts-Support für Pro-Abonnenten).',
    privacyCardTitle: 'Selbstverwaltung in den Einstellungen',
    privacyCardDesc: 'Abonnements verwalten, JSON-Daten exportieren oder Konto löschen jederzeit unter Einstellungen.',
    errRequired: 'Bitte geben Sie Ihren Namen, eine gültige E-Mail und eine Nachricht (mind. 10 Zeichen) ein.',
  },
  es: {
    badge: 'SOPORTE Y CONTACTO',
    title: 'Contacta con el equipo de JobMatch AI',
    subtitle:
      '¿Tienes dudas sobre el escáner ATS, la generación con IA, facturación o reembolsos? Completa el formulario o escríbenos directamente.',
    nameLabel: 'Nombre completo',
    namePlaceholder: 'Carlos García',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'tu@ejemplo.com',
    topicLabel: 'Categoría de consulta',
    topics: {
      general: 'Consulta general',
      billing: 'Suscripción y facturación',
      refund: 'Solicitud de reembolso (14 días)',
      privacy: 'Privacidad y datos personales',
      bug: 'Problema técnico',
    },
    orderRefLabel: 'Referencia del pedido (Opcional)',
    orderRefPlaceholder: 'ej. ORD-2026-...',
    messageLabel: 'Tu mensaje',
    messagePlaceholder: 'Describe cómo podemos ayudarte (mínimo 10 caracteres)...',
    submitBtn: 'Enviar mensaje',
    submittingBtn: 'Enviando...',
    successTitle: '¡Mensaje enviado con éxito!',
    successDesc: 'Hemos recibido tu consulta. Nuestro equipo responderá en 1–2 días hábiles.',
    sendAnotherBtn: 'Enviar otro mensaje',
    directEmailTitle: 'Correo directo de soporte',
    directEmailDesc: 'También puedes escribirnos directamente a:',
    slaTitle: 'Tiempo de respuesta',
    slaDesc: '1–2 días hábiles (prioridad para suscriptores Pro).',
    privacyCardTitle: 'Control directo de cuenta y datos',
    privacyCardDesc: 'Gestiona tu suscripción, exporta tus datos JSON o elimina tu cuenta desde Configuración.',
    errRequired: 'Por favor completa tu nombre, un correo válido y un mensaje de al menos 10 caracteres.',
  },
  tr: {
    badge: 'DESTEK VE İLETİŞİM',
    title: 'Destek Ekibimizle İletişime Geçin',
    subtitle:
      'ATS taraması, yapay zeka özgeçmiş üretimi, Lemon Squeezy faturalandırması veya iade talepleri hakkında sorularınız için formu doldurun veya doğrudan e-posta gönderin.',
    nameLabel: 'Ad Soyad',
    namePlaceholder: 'Ahmet Yılmaz',
    emailLabel: 'E-posta Adresi',
    emailPlaceholder: 'ornek@eposta.com',
    topicLabel: 'Konu Kategorisi',
    topics: {
      general: 'Genel Ürün Sorusu',
      billing: 'Abonelik ve Faturalandırma',
      refund: 'İade Talebi (14 Günlük Politika)',
      privacy: 'Gizlilik ve Veri Talebi',
      bug: 'Teknik Sorun / Hata Bildirimi',
    },
    orderRefLabel: 'Sipariş Referansı (İsteğe Bağlı)',
    orderRefPlaceholder: 'örn. ORD-2026-...',
    messageLabel: 'Mesajınız',
    messagePlaceholder: 'Size nasıl yardımcı olabileceğimizi açıklayın (en az 10 karakter)...',
    submitBtn: 'Mesajı Gönder',
    submittingBtn: 'Gönderiliyor...',
    successTitle: 'Mesajınız Başarıyla Gönderildi!',
    successDesc: 'Talebiniz alındı ve destek kaydınız oluşturuldu. Ekibimiz 1–2 iş günü içinde yanıt verecektir.',
    sendAnotherBtn: 'Başka Bir Mesaj Gönder',
    directEmailTitle: 'Doğrudan Destek E-postası',
    directEmailDesc: 'Doğrudan e-posta göndermek isterseniz bize şu adresten ulaşabilirsiniz:',
    slaTitle: 'Yanıt Süresi',
    slaDesc: '1–2 iş günü (Pro aboneler ve ödeme talepleri için öncelikli destek).',
    privacyCardTitle: 'Self-Servis Veri ve Abonelik Yönetimi',
    privacyCardDesc: 'Ayarlar sayfasından aboneliğinizi yönetebilir, JSON verilerinizi indirebilir veya hesabınızı silebilirsiniz.',
    errRequired: 'Lütfen adınızı, geçerli bir e-posta adresini ve en az 10 karakterlik mesajınızı girin.',
  },
};

function ContactPageInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { language, isRtl, t } = useLanguage();
  const content = CONTACT_BY_LANG[language] || CONTACT_BY_LANG.en;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('general');
  const [orderReference, setOrderReference] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || '');
      setEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  useEffect(() => {
    const qTopic = searchParams.get('topic');
    if (qTopic && ['general', 'billing', 'refund', 'privacy', 'bug'].includes(qTopic)) {
      setTopic(qTopic);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      name.trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      message.trim().length < 10
    ) {
      setError(content.errRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          orderReference: orderReference.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || content.errRequired);
        return;
      }
      setTicketId(data.ticketId || 'TKT-RECEIVED');
      setMessage('');
    } catch {
      setError('Network error. Please email support@jobmatch.ai directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full text-start">
        <div className="hero-lcp-enter max-w-2xl mb-10 space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold inline-flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{content.badge}</span>
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            {content.title}
          </h1>
          <p className="text-sm text-ink-2 leading-relaxed">{content.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Form (7 cols) */}
          <Reveal from="start" className="lg:col-span-7"><div className="p-6 sm:p-8 rounded-[12px] bg-surface border border-line-strong shadow-subtle">
            {ticketId ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="font-serif text-xl font-bold text-ink">
                  {content.successTitle}
                </h2>
                <p className="text-xs font-mono px-3 py-1 rounded-full bg-surface-2 border border-line inline-block text-accent">
                  Ticket ID: {ticketId}
                </p>
                <p className="text-sm text-ink-2 max-w-md mx-auto leading-relaxed">
                  {content.successDesc}
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setTicketId(null)}
                  >
                    {content.sendAnotherBtn}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && (
                  <div
                    role="alert"
                    className="p-3 rounded-[8px] bg-danger-soft border border-danger/30 flex items-start gap-2.5 text-xs text-danger"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-ink">
                      {content.nameLabel} *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={content.namePlaceholder}
                      className="w-full rounded-[6px] border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-ink">
                      {content.emailLabel} *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={content.emailPlaceholder}
                      className="w-full rounded-[6px] border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="contact-topic" className="block text-xs font-semibold text-ink">
                      {content.topicLabel}
                    </label>
                    <select
                      id="contact-topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full rounded-[6px] border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="general">{content.topics.general}</option>
                      <option value="billing">{content.topics.billing}</option>
                      <option value="refund">{content.topics.refund}</option>
                      <option value="privacy">{content.topics.privacy}</option>
                      <option value="bug">{content.topics.bug}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="contact-order" className="block text-xs font-semibold text-ink">
                      {content.orderRefLabel}
                    </label>
                    <input
                      id="contact-order"
                      type="text"
                      value={orderReference}
                      onChange={(e) => setOrderReference(e.target.value)}
                      placeholder={content.orderRefPlaceholder}
                      className="w-full rounded-[6px] border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-ink">
                    {content.messageLabel} *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={content.messagePlaceholder}
                    className="w-full rounded-[6px] border border-line bg-paper p-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  leftIcon={<Send className="w-4 h-4" />}
                  className="w-full"
                >
                  {isSubmitting ? content.submittingBtn : content.submitBtn}
                </Button>
              </form>
            )}
          </div></Reveal>

          {/* Direct Support Info Cards (5 cols) */}
          <Stagger className="lg:col-span-5 space-y-4" from="end">
            <div className="p-5 rounded-[12px] bg-surface border border-line-strong space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span>{content.directEmailTitle}</span>
              </div>
              <p className="text-xs text-ink-2 leading-relaxed">
                {content.directEmailDesc}
              </p>
              <div className="pt-1 flex flex-col gap-1 font-mono text-xs">
                <a
                  href="mailto:support@jobmatch.ai"
                  className="text-accent font-semibold hover:underline"
                >
                  support@jobmatch.ai
                </a>
                <a
                  href="mailto:contact@jobmatch-ai.org"
                  className="text-ink-2 hover:text-ink hover:underline"
                >
                  contact@jobmatch-ai.org
                </a>
              </div>
            </div>

            <div className="p-5 rounded-[12px] bg-surface border border-line-strong space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Clock className="w-4 h-4 text-accent shrink-0" />
                <span>{content.slaTitle}</span>
              </div>
              <p className="text-xs text-ink-2 leading-relaxed">{content.slaDesc}</p>
            </div>

            <div className="p-5 rounded-[12px] bg-surface border border-line-strong space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                <span>{content.privacyCardTitle}</span>
              </div>
              <p className="text-xs text-ink-2 leading-relaxed">
                {content.privacyCardDesc}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <Link href="/refund" className="text-accent underline underline-offset-4">
                  {t('footer_refund')}
                </Link>
                <span>•</span>
                <Link href="/privacy" className="text-accent underline underline-offset-4">
                  {t('footer_privacy')}
                </Link>
                <span>•</span>
                <Link href="/terms" className="text-accent underline underline-offset-4">
                  {t('footer_terms')}
                </Link>
              </div>
            </div>
          </Stagger>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ContactPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <ContactPageInner />
    </React.Suspense>
  );
}
