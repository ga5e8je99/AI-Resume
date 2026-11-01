import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';

export type SupportedEmailLanguage = 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';

export const DEFAULT_PROJECT_FROM = 'JobMatch AI <noreply@jobmatch.ai>';

const FORBIDDEN_SENDER_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'gmx.com',
  'yandex.com',
  'mail.com',
]);

// Lazy initialization of Resend client (with test injection support)
let resendInstance: Resend | null = null;
let customResendSenderForTests:
  | ((payload: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
    }) => Promise<{ data?: { id?: string } | null; error?: { message: string; name?: string } | null }>)
  | null = null;

export function setCustomResendSenderForTests(
  fn:
    | ((payload: {
        from: string;
        to: string | string[];
        subject: string;
        html: string;
      }) => Promise<{ data?: { id?: string } | null; error?: { message: string; name?: string } | null }>)
    | null
): void {
  customResendSenderForTests = fn;
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

/**
 * Validates that the sender address belongs to the verified project domain (never Gmail/Yahoo/Hotmail).
 * Falls back to `JobMatch AI <noreply@jobmatch.ai>` if a consumer webmail domain is detected.
 */
export function resolveVerifiedSenderAddress(explicitFrom?: string): string {
  const candidate = (explicitFrom || process.env.EMAIL_FROM || DEFAULT_PROJECT_FROM).trim();
  const emailMatch = candidate.match(/<([^<>]+)>/) || [null, candidate];
  const rawEmail = (emailMatch[1] || candidate).trim().toLowerCase();
  const domain = rawEmail.includes('@') ? rawEmail.split('@').pop() || '' : '';

  if (!domain || FORBIDDEN_SENDER_DOMAINS.has(domain)) {
    const warnMsg = `[Email Security] Rejected unverified consumer sender domain "${domain || candidate}". Enforcing project domain sender "${DEFAULT_PROJECT_FROM}".`;
    console.warn(warnMsg);
    try {
      Sentry.captureMessage(warnMsg, {
        level: 'warning',
        tags: { component: 'email', reason: 'forbidden_sender_domain' },
        extra: { attemptedSender: candidate, enforcedSender: DEFAULT_PROJECT_FROM },
      });
    } catch {
      // Never block on Sentry error
    }
    return DEFAULT_PROJECT_FROM;
  }

  return candidate;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  isDemo?: boolean;
  maxRetries?: number;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
  queuedForRetry?: boolean;
  sender?: string;
}

export interface EmailRetryQueueItem {
  id: string;
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  attempts: number;
  maxRetries: number;
  lastError: string;
  nextRetryAt: number;
  createdAt: string;
}

export interface EmailFailureRecord {
  timestamp: string;
  to: string;
  subject: string;
  error: string;
  attempt: number;
  sentryCaptured: boolean;
}

const MAX_RETRY_QUEUE_SIZE = 200;
const emailRetryQueue: EmailRetryQueueItem[] = [];
const emailFailureHistory: EmailFailureRecord[] = [];
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let isProcessingQueue = false;

function maskRecipientForSentry(to: string | string[]): string {
  const list = Array.isArray(to) ? to : [to];
  return list
    .map((addr) => {
      const parts = String(addr).split('@');
      if (parts.length !== 2) return '***';
      const local = parts[0];
      return `${local.slice(0, 2)}***@${parts[1]}`;
    })
    .join(', ');
}

function recordEmailFailureInSentry(
  to: string | string[],
  subject: string,
  errorMsg: string,
  attempt: number,
  rawError?: unknown
): void {
  const maskedTo = maskRecipientForSentry(to);
  let sentryCaptured = false;
  try {
    const errObj =
      rawError instanceof Error ? rawError : new Error(`Email delivery failed: ${errorMsg}`);
    Sentry.captureException(errObj, {
      tags: {
        component: 'email',
        provider: 'resend',
        attempt: String(attempt),
      },
      extra: {
        recipient: maskedTo,
        subject,
        errorMessage: errorMsg,
        attempt,
      },
    });
    sentryCaptured = true;
  } catch {
    sentryCaptured = false;
  }

  emailFailureHistory.unshift({
    timestamp: new Date().toISOString(),
    to: maskedTo,
    subject,
    error: errorMsg,
    attempt,
    sentryCaptured,
  });
  if (emailFailureHistory.length > 100) {
    emailFailureHistory.length = 100;
  }
}

async function attemptDirectSend(payload: {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ ok: boolean; id?: string; error?: string; rawError?: unknown }> {
  if (customResendSenderForTests) {
    try {
      const res = await customResendSenderForTests(payload);
      if (res?.error) {
        return { ok: false, error: res.error.message || 'Resend API error', rawError: res.error };
      }
      return { ok: true, id: res?.data?.id || `test_${Date.now()}` };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Send exception', rawError: err };
    }
  }

  const resend = getResendClient();
  if (!resend) {
    console.log(
      `[Email Simulator] From: ${payload.from} | To: ${
        Array.isArray(payload.to) ? payload.to.join(', ') : payload.to
      } | Subject: "${payload.subject}"`
    );
    return {
      ok: true,
      id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  try {
    const data = await resend.emails.send({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    if (data.error) {
      return {
        ok: false,
        error: data.error.message || 'Resend API returned an error',
        rawError: data.error,
      };
    }

    return {
      ok: true,
      id: data.data?.id,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message || 'Failed to send email',
      rawError: error,
    };
  }
}

function getRetryDelayMs(attempt: number): number {
  const configuredBase = Number(process.env.EMAIL_RETRY_BASE_MS);
  const baseMs = Number.isFinite(configuredBase) && configuredBase >= 10 ? configuredBase : 1500;
  return baseMs * Math.pow(2, Math.max(0, attempt - 1));
}

function scheduleRetryQueueDrain(delayMs: number = 1500): void {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void flushEmailRetryQueue();
  }, delayMs);
  if (typeof (retryTimer as any)?.unref === 'function') {
    (retryTimer as any).unref();
  }
}

/**
 * Flushes due items (or all items if `forceAll = true`) in the in-memory email retry queue.
 * Never throws; logs and captures persistent failures in Sentry.
 */
export async function flushEmailRetryQueue(forceAll: boolean = false): Promise<{
  processed: number;
  succeeded: number;
  requeued: number;
  dropped: number;
}> {
  if (isProcessingQueue) {
    return { processed: 0, succeeded: 0, requeued: 0, dropped: 0 };
  }
  isProcessingQueue = true;

  let processed = 0;
  let succeeded = 0;
  let requeued = 0;
  let dropped = 0;

  try {
    const now = Date.now();
    const pendingCount = emailRetryQueue.length;
    for (let i = 0; i < pendingCount; i++) {
      const item = emailRetryQueue.shift();
      if (!item) break;

      if (!forceAll && item.nextRetryAt > now) {
        emailRetryQueue.push(item);
        continue;
      }

      processed++;
      const nextAttempt = item.attempts + 1;
      const result = await attemptDirectSend({
        from: item.from,
        to: item.to,
        subject: item.subject,
        html: item.html,
      });

      if (result.ok) {
        succeeded++;
      } else {
        const errMsg = result.error || 'Retry send failed';
        recordEmailFailureInSentry(item.to, item.subject, errMsg, nextAttempt, result.rawError);

        if (nextAttempt <= item.maxRetries) {
          item.attempts = nextAttempt;
          item.lastError = errMsg;
          item.nextRetryAt = Date.now() + getRetryDelayMs(nextAttempt);
          emailRetryQueue.push(item);
          requeued++;
        } else {
          dropped++;
        }
      }
    }

    if (emailRetryQueue.length > 0 && !forceAll) {
      const earliest = Math.min(...emailRetryQueue.map((q) => q.nextRetryAt));
      scheduleRetryQueueDrain(Math.max(50, earliest - Date.now()));
    }
  } finally {
    isProcessingQueue = false;
  }

  return { processed, succeeded, requeued, dropped };
}

export function getEmailRetryQueue(): EmailRetryQueueItem[] {
  return [...emailRetryQueue];
}

export function getEmailFailureLogs(): EmailFailureRecord[] {
  return [...emailFailureHistory];
}

export function clearEmailRetryQueueForTests(): void {
  emailRetryQueue.length = 0;
  emailFailureHistory.length = 0;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

/**
 * Universal typed email sender with:
 * 1. Demo protection (skips sending for demo accounts).
 * 2. Verified project domain enforcement (never allows @gmail.com / consumer webmail).
 * 3. Non-blocking Sentry reporting + background Retry Queue on failure (never throws or breaks caller).
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
  isDemo = false,
  maxRetries = 2,
}: SendEmailOptions): Promise<EmailResult> {
  if (isDemo) {
    return {
      success: true,
      skipped: true,
      id: 'demo_skipped',
    };
  }

  const sender = resolveVerifiedSenderAddress(from);

  const firstTry = await attemptDirectSend({
    from: sender,
    to,
    subject,
    html,
  });

  if (firstTry.ok) {
    return {
      success: true,
      id: firstTry.id,
      sender,
    };
  }

  const errorMessage = firstTry.error || 'Failed to send email';
  console.error('[Resend Delivery Failed — Enqueuing for Retry]:', errorMessage);

  // 1. Log failure to Sentry without throwing
  recordEmailFailureInSentry(to, subject, errorMessage, 1, firstTry.rawError);

  // 2. Enqueue for background retry if maxRetries > 0
  let queuedForRetry = false;
  if (maxRetries > 0 && emailRetryQueue.length < MAX_RETRY_QUEUE_SIZE) {
    const delayMs = getRetryDelayMs(1);
    emailRetryQueue.push({
      id: `retry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      to,
      from: sender,
      subject,
      html,
      attempts: 1,
      maxRetries,
      lastError: errorMessage,
      nextRetryAt: Date.now() + delayMs,
      createdAt: new Date().toISOString(),
    });
    queuedForRetry = true;
    scheduleRetryQueueDrain(delayMs);
  }

  return {
    success: false,
    error: errorMessage,
    queuedForRetry,
    sender,
  };
}

// ==============================================================================
// UNIFIED EMAIL TEMPLATES (6 Languages: en, ar, fr, de, es, tr + RTL Support)
// ==============================================================================

interface TemplateBaseProps {
  name?: string;
  language?: SupportedEmailLanguage;
}

function normalizeEmailLang(lang?: string): SupportedEmailLanguage {
  if (lang && ['en', 'ar', 'fr', 'de', 'es', 'tr'].includes(lang)) {
    return lang as SupportedEmailLanguage;
  }
  return 'en';
}

function emailWrapper(content: string, lang: SupportedEmailLanguage, title: string): string {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const fontFamily = isAr
    ? "'Segoe UI', Tahoma, Arial, sans-serif"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const footers: Record<SupportedEmailLanguage, { rights: string; desc: string }> = {
    en: { rights: 'All rights reserved.', desc: 'Intelligent ATS Optimization & Career Platform.' },
    ar: { rights: 'جميع الحقوق محفوظة.', desc: 'منصة ذكية متكاملة لتخطي أنظمة ATS وتطوير المسار المهني.' },
    fr: { rights: 'Tous droits réservés.', desc: "Plateforme intelligente d'optimisation ATS et de carrière." },
    de: { rights: 'Alle Rechte vorbehalten.', desc: 'Intelligente ATS-Optimierungs- und Karriereplattform.' },
    es: { rights: 'Todos los derechos reservados.', desc: 'Plataforma inteligente de optimización ATS y carrera.' },
    tr: { rights: 'Tüm hakları saklıdır.', desc: 'Akıllı ATS Optimizasyonu ve Kariyer Platformu.' },
  };

  const footer = footers[lang] || footers.en;

  return `
<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F4; font-family: ${fontFamily}; color: #14181F;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF8F4; width: 100%; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border: 1px solid #E4DFD5; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(20,24,31,0.04);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; background-color: #FAF8F4; border-bottom: 1px solid #E4DFD5;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 6px 16px; border-radius: 6px; background-color: #E3EFEA; border: 1px solid #0F5C4D;">
                      <span style="font-size: 15px; font-weight: 700; color: #0F5C4D; letter-spacing: 0.5px;">JobMatch AI</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 32px 36px 32px; font-size: 15px; line-height: 1.6; color: #4A5160; direction: ${dir}; text-align: ${isAr ? 'right' : 'left'};">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #F3F0EA; border-top: 1px solid #E4DFD5; text-align: center; font-size: 12px; color: #6B7280;">
              <p style="margin: 0 0 4px 0;">© ${new Date().getFullYear()} JobMatch AI. ${footer.rights}</p>
              <p style="margin: 0;">${footer.desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 1. Welcome Email Template (6 Languages)
 */
export function getWelcomeEmailHtml({ name = 'there', language = 'en' }: TemplateBaseProps): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const lang = normalizeEmailLang(language);

  const welcomeContent: Record<
    SupportedEmailLanguage,
    {
      title: string;
      heading: string;
      body: string;
      stepsTitle: string;
      step1: string;
      step2: string;
      step3: string;
      cta: string;
    }
  > = {
    en: {
      title: 'Welcome to JobMatch AI',
      heading: `Welcome to JobMatch AI, ${name}! 👋`,
      body: `We're thrilled to have you onboard. Your account has been credited with <strong style="color: #0F5C4D;">3 free AI generations</strong> and unlimited ATS diagnostics.`,
      stepsTitle: 'Key tools to kickstart your applications:',
      step1: '<strong>ATS Diagnostic Scanner:</strong> Audit your existing PDF resume against real-world parsing rules.',
      step2: '<strong>ATS Resume Builder:</strong> Choose from standard single/two-column formats engineered for Taleo & Workday.',
      step3: '<strong>AI Cover Letter Generator:</strong> Synthesize personalized, authentic cover letters in 6 languages.',
      cta: 'Go to Dashboard →',
    },
    ar: {
      title: 'أهلاً بك في JobMatch AI',
      heading: `أهلاً بك في JobMatch AI، ${name}! 👋`,
      body: `يسعدنا انضمامك إلى مجتمعنا. لقد تم تجهيز حسابك بـ <strong style="color: #0F5C4D;">3 عمليات توليد مجانية</strong> بالذكاء الاصطناعي، بالإضافة إلى فحص ATS غير محدود.`,
      stepsTitle: 'أهم الخطوات لبدء رحلتك المهنية:',
      step1: '<strong>فحص السيرة الذاتية (ATS):</strong> ارفع ملف PDF لتشخيص نسبة التوافق مع متطلبات الوظائف.',
      step2: '<strong>منشئ السيرة الذاتية:</strong> صمّم سيرة ذاتية قياسية متوافقة 100% مع أنظمة التوظيف.',
      step3: '<strong>خطابات التقديم الذكية:</strong> ولّد خطابات تقديم مخصصة بضغطة زر بـ 6 لغات.',
      cta: 'الانتقال إلى لوحة التحكم ←',
    },
    fr: {
      title: 'Bienvenue sur JobMatch AI',
      heading: `Bienvenue sur JobMatch AI, ${name} ! 👋`,
      body: `Nous sommes ravis de vous compter parmi nous. Votre compte a été crédité de <strong style="color: #0F5C4D;">3 générations IA gratuites</strong> et d'audits ATS illimités.`,
      stepsTitle: 'Les outils clés pour vos candidatures :',
      step1: '<strong>Scanner ATS :</strong> Évaluez votre CV PDF par rapport aux filtres de recrutement réels.',
      step2: '<strong>Créateur de CV ATS :</strong> Choisissez parmi des modèles optimisés pour Taleo et Workday.',
      step3: '<strong>Générateur de lettres de motivation :</strong> Créez des lettres authentiques en 6 langues.',
      cta: 'Accéder au tableau de bord →',
    },
    de: {
      title: 'Willkommen bei JobMatch AI',
      heading: `Willkommen bei JobMatch AI, ${name}! 👋`,
      body: `Wir freuen uns, Sie an Bord zu haben. Ihr Konto wurde mit <strong style="color: #0F5C4D;">3 kostenlosen KI-Generierungen</strong> und unbegrenzten ATS-Scans aufgeladen.`,
      stepsTitle: 'Wichtige Werkzeuge für Ihre Bewerbungen:',
      step1: '<strong>ATS-Scanner:</strong> Prüfen Sie Ihren PDF-Lebenslauf nach realistischen Parsing-Regeln.',
      step2: '<strong>ATS-Lebenslauf-Editor:</strong> Wählen Sie aus Vorlagen, die für Taleo und Workday optimiert sind.',
      step3: '<strong>KI-Anschreiben-Generator:</strong> Erstellen Sie maßgeschneiderte Anschreiben in 6 Sprachen.',
      cta: 'Zum Dashboard →',
    },
    es: {
      title: 'Bienvenido a JobMatch AI',
      heading: `¡Bienvenido a JobMatch AI, ${name}! 👋`,
      body: `Nos alegra tenerte con nosotros. Tu cuenta ha sido acreditada con <strong style="color: #0F5C4D;">3 generaciones IA gratuitas</strong> y análisis ATS ilimitados.`,
      stepsTitle: 'Herramientas clave para tus candidaturas:',
      step1: '<strong>Escáner ATS:</strong> Evalúa tu currículum PDF con reglas de filtrado reales.',
      step2: '<strong>Creador de currículums ATS:</strong> Elige entre plantillas optimizadas para Taleo y Workday.',
      step3: '<strong>Generador de cartas de presentación:</strong> Crea cartas personalizadas en 6 idiomas.',
      cta: 'Ir al panel de control →',
    },
    tr: {
      title: "JobMatch AI'a Hoş Geldiniz",
      heading: `JobMatch AI'a Hoş Geldiniz, ${name}! 👋`,
      body: `Aramıza katıldığınız için çok mutluyuz. Hesabınıza <strong style="color: #0F5C4D;">3 ücretsiz yapay zeka kredisi</strong> ve sınırsız ATS taraması tanımlandı.`,
      stepsTitle: 'Başvurularınız için temel araçlar:',
      step1: '<strong>ATS Teşhis Tarayıcısı:</strong> PDF özgeçmişinizi gerçek ayrıştırma kurallarına göre denetleyin.',
      step2: '<strong>ATS Özgeçmiş Oluşturucu:</strong> Taleo ve Workday için optimize edilmiş şablonları seçin.',
      step3: '<strong>Yapay Zeka Ön Yazı Üretici:</strong> 6 dilde hedefe yönelik profesyonel ön yazılar oluşturun.',
      cta: 'Kontrol Paneline Git →',
    },
  };

  const c = welcomeContent[lang];

  const content = `
    <h1 style="color: #14181F; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">${c.heading}</h1>
    <p style="margin: 0 0 20px 0; color: #4A5160;">
      ${c.body}
    </p>

    <div style="background-color: #F3F0EA; border: 1px solid #E4DFD5; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
      <h3 style="color: #0F5C4D; font-size: 14px; margin: 0 0 10px 0;">${c.stepsTitle}</h3>
      <ul style="margin: 0; padding: 0 20px; color: #4A5160; font-size: 14px;">
        <li style="margin-bottom: 8px;">${c.step1}</li>
        <li style="margin-bottom: 8px;">${c.step2}</li>
        <li>${c.step3}</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
        ${c.cta}
      </a>
    </div>
  `;

  return emailWrapper(content, lang, c.title);
}

/**
 * 2. Password Reset Email Template (6 Languages)
 */
export interface PasswordResetEmailProps extends TemplateBaseProps {
  resetToken: string;
}

export function getPasswordResetEmailHtml({
  name = 'User',
  resetToken,
  language = 'en',
}: PasswordResetEmailProps): string {
  const lang = normalizeEmailLang(language);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password/${resetToken}`;

  const resetContent: Record<
    SupportedEmailLanguage,
    {
      title: string;
      heading: string;
      greeting: string;
      body: string;
      cta: string;
      notice: string;
      copyLink: string;
    }
  > = {
    en: {
      title: 'Password Reset - JobMatch AI',
      heading: 'Reset Your Password 🔐',
      greeting: `Hi ${name},`,
      body: 'We received a request to reset your JobMatch AI password. Click the button below to choose a new password:',
      cta: 'Reset Password →',
      notice:
        '⏱️ <strong>Security Notice:</strong> This link is single-use and will expire in <strong>15 minutes</strong>. If you didn\'t make this request, you can safely ignore this email.',
      copyLink: 'Or paste this link into your browser:',
    },
    ar: {
      title: 'إعادة تعيين كلمة المرور - JobMatch AI',
      heading: 'طلب إعادة تعيين كلمة المرور 🔐',
      greeting: `مرحباً ${name}،`,
      body: 'تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على JobMatch AI. يمكنك تعيين كلمة مرور جديدة بالنقر على الزر أدناه:',
      cta: 'إعادة تعيين كلمة المرور ←',
      notice:
        '⏱️ <strong>تنبيه أمني:</strong> هذا الرابط صالح لمدة <strong>15 دقيقة فقط</strong> ولا يمكن استخدامه إلا لمرة واحدة. إذا لم تكن قد طلبت ذلك، يمكنك تجاهل هذا البريد بأمان ولن يتم إجراء أي تعديل على حسابك.',
      copyLink: 'أو انسخ الرابط المباشر في متصفحك:',
    },
    fr: {
      title: 'Réinitialisation du mot de passe - JobMatch AI',
      heading: 'Réinitialiser votre mot de passe 🔐',
      greeting: `Bonjour ${name},`,
      body: 'Nous avons reçu une demande de réinitialisation de votre mot de passe JobMatch AI. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :',
      cta: 'Réinitialiser le mot de passe →',
      notice:
        '⏱️ <strong>Avis de sécurité :</strong> Ce lien est à usage unique et expire dans <strong>15 minutes</strong>. Si vous n\'êtes pas à l\'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.',
      copyLink: 'Ou collez ce lien dans votre navigateur :',
    },
    de: {
      title: 'Passwort zurücksetzen - JobMatch AI',
      heading: 'Passwort zurücksetzen 🔐',
      greeting: `Hallo ${name},`,
      body: 'Wir haben eine Anfrage zum Zurücksetzen Ihres JobMatch AI-Passworts erhalten. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort festzulegen:',
      cta: 'Passwort zurücksetzen →',
      notice:
        '⏱️ <strong>Sicherheitshinweis:</strong> Dieser Link ist einmalig gültig und verfällt in <strong>15 Minuten</strong>. Wenn Sie dies nicht angefordert haben, können Sie diese E-Mail ignorieren.',
      copyLink: 'Oder fügen Sie diesen Link in Ihren Browser ein:',
    },
    es: {
      title: 'Restablecer contraseña - JobMatch AI',
      heading: 'Restablece tu contraseña 🔐',
      greeting: `Hola ${name},`,
      body: 'Recibimos una solicitud para restablecer tu contraseña de JobMatch AI. Haz clic en el botón de abajo para elegir una nueva contraseña:',
      cta: 'Restablecer contraseña →',
      notice:
        '⏱️ <strong>Aviso de seguridad:</strong> Este enlace es de un solo uso y caduca en <strong>15 minutos</strong>. Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.',
      copyLink: 'O pega este enlace en tu navegador:',
    },
    tr: {
      title: 'Şifre Sıfırlama - JobMatch AI',
      heading: 'Şifrenizi Sıfırlayın 🔐',
      greeting: `Merhaba ${name},`,
      body: 'JobMatch AI şifrenizi sıfırlama talebi aldık. Yeni bir şifre seçmek için aşağıdaki butona tıklayın:',
      cta: 'Şifreyi Sıfırla →',
      notice:
        '⏱️ <strong>Güvenlik Uyarısı:</strong> Bu bağlantı tek kullanımlıktır ve <strong>15 dakika</strong> içinde sona erecektir. Bu talebi siz yapmadıysanız, bu e-postayı güvenle yok sayabilirsiniz.',
      copyLink: 'Veya bu bağlantıyı tarayıcınıza yapıştırın:',
    },
  };

  const c = resetContent[lang];

  const content = `
    <h1 style="color: #14181F; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">${c.heading}</h1>
    <p style="margin: 0 0 16px 0; color: #4A5160;">${c.greeting}</p>
    <p style="margin: 0 0 24px 0; color: #4A5160;">
      ${c.body}
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
        ${c.cta}
      </a>
    </div>

    <div style="background-color: #FBF0DC; ${lang === 'ar' ? 'border-right: 4px solid #9A5B00;' : 'border-left: 4px solid #9A5B00;'} border-radius: 6px; padding: 14px; margin: 24px 0; font-size: 13px; color: #14181F;">
      ${c.notice}
    </div>

    <p style="font-size: 12px; color: #6B7280; word-break: break-all; margin-top: 24px;">
      ${c.copyLink}<br>
      <a href="${resetUrl}" style="color: #0F5C4D; text-decoration: underline;">${resetUrl}</a>
    </p>
  `;

  return emailWrapper(content, lang, c.title);
}

/**
 * 2b. Email Verification Template (6 Languages)
 */
export interface EmailVerificationProps extends TemplateBaseProps {
  verifyToken: string;
}

export function getEmailVerificationHtml({
  name = 'User',
  verifyToken,
  language = 'en',
}: EmailVerificationProps): string {
  const lang = normalizeEmailLang(language);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyUrl = `${appUrl}/auth/verify-email?token=${encodeURIComponent(verifyToken)}`;

  const verifyContent: Record<
    SupportedEmailLanguage,
    {
      title: string;
      heading: string;
      greeting: string;
      body: string;
      cta: string;
      notice: string;
      copyLink: string;
    }
  > = {
    en: {
      title: 'Verify Your Email - JobMatch AI',
      heading: 'Verify Your Email Address ✉️',
      greeting: `Hi ${name},`,
      body: 'Welcome to JobMatch AI! Please confirm your email address to unlock free Job Search, AI Resume & Cover Letter generation, and plan upgrades:',
      cta: 'Verify Email Address →',
      notice:
        '⏱️ <strong>Security Notice:</strong> This verification link is valid for <strong>24 hours</strong>. Until verified, you can sign in and use the basic CV Builder.',
      copyLink: 'Or paste this verification link into your browser:',
    },
    ar: {
      title: 'تأكيد البريد الإلكتروني - JobMatch AI',
      heading: 'تأكيد عنوان بريدك الإلكتروني ✉️',
      greeting: `مرحباً ${name}،`,
      body: 'أهلاً بك في JobMatch AI! يرجى تأكيد بريدك الإلكتروني لتفعيل البحث المجاني عن الوظائف، وتوليد السيرة الذاتية وخطاب التقديم بالذكاء الاصطناعي، والترقية للخطط المدفوعة:',
      cta: 'تأكيد البريد الإلكتروني ←',
      notice:
        '⏱️ <strong>تنبيه أمني:</strong> رابط التأكيد هذا صالح لمدة <strong>24 ساعة</strong>. وحتى يتم التأكيد، يمكنك تسجيل الدخول واستخدام منشئ السيرة الذاتية الأساسي.',
      copyLink: 'أو انسخ رابط التأكيد المباشر في متصفحك:',
    },
    fr: {
      title: 'Vérifiez votre adresse e-mail - JobMatch AI',
      heading: 'Confirmez votre adresse e-mail ✉️',
      greeting: `Bonjour ${name},`,
      body: "Bienvenue sur JobMatch AI ! Veuillez confirmer votre adresse e-mail pour débloquer la recherche d'emploi gratuite, la génération IA et les mises à niveau :",
      cta: 'Vérifier mon e-mail →',
      notice:
        '⏱️ <strong>Avis de sécurité :</strong> Ce lien de vérification est valable pendant <strong>24 heures</strong>. En attendant, vous pouvez vous connecter et utiliser le créateur de CV de base.',
      copyLink: 'Ou collez ce lien dans votre navigateur :',
    },
    de: {
      title: 'E-Mail-Adresse bestätigen - JobMatch AI',
      heading: 'Bestätigen Sie Ihre E-Mail-Adresse ✉️',
      greeting: `Hallo ${name},`,
      body: 'Willkommen bei JobMatch AI! Bitte bestätigen Sie Ihre E-Mail-Adresse, um die kostenlose Jobsuche, KI-Generierung und Plan-Upgrades freizuschalten:',
      cta: 'E-Mail bestätigen →',
      notice:
        '⏱️ <strong>Sicherheitshinweis:</strong> Dieser Bestätigungslink ist <strong>24 Stunden</strong> lang gültig. Bis zur Bestätigung können Sie sich anmelden und den Basis-CV-Editor nutzen.',
      copyLink: 'Oder fügen Sie diesen Link in Ihren Browser ein:',
    },
    es: {
      title: 'Verifica tu correo electrónico - JobMatch AI',
      heading: 'Confirma tu dirección de correo electrónico ✉️',
      greeting: `Hola ${name},`,
      body: '¡Bienvenido a JobMatch AI! Por favor confirma tu correo electrónico para desbloquear la búsqueda de empleo gratuita, la generación con IA y las mejoras de plan:',
      cta: 'Verificar correo electrónico →',
      notice:
        '⏱️ <strong>Aviso de seguridad:</strong> Este enlace de verificación es válido por <strong>24 horas</strong>. Hasta que verifiques tu cuenta, puedes iniciar sesión y usar el creador de CV básico.',
      copyLink: 'O pega este enlace en tu navegador:',
    },
    tr: {
      title: 'E-posta Adresinizi Doğrulayın - JobMatch AI',
      heading: 'E-posta Adresinizi Doğrulayın ✉️',
      greeting: `Merhaba ${name},`,
      body: "JobMatch AI'a hoş geldiniz! Ücretsiz İş Arama, Yapay Zeka üretimi ve paket yükseltmelerini açmak için lütfen e-posta adresinizi doğrulayın:",
      cta: 'E-postayı Doğrula →',
      notice:
        '⏱️ <strong>Güvenlik Uyarısı:</strong> Bu doğrulama bağlantısı <strong>24 saat</strong> boyunca geçerlidir. Doğrulama yapılana kadar giriş yapabilir ve temel CV Oluşturucuyu kullanabilirsiniz.',
      copyLink: 'Veya bu bağlantıyı tarayıcınıza yapıştırın:',
    },
  };

  const c = verifyContent[lang];

  const content = `
    <h1 style="color: #14181F; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">${c.heading}</h1>
    <p style="margin: 0 0 16px 0; color: #4A5160;">${c.greeting}</p>
    <p style="margin: 0 0 24px 0; color: #4A5160;">
      ${c.body}
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${verifyUrl}" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
        ${c.cta}
      </a>
    </div>

    <div style="background-color: #FBF0DC; ${lang === 'ar' ? 'border-right: 4px solid #9A5B00;' : 'border-left: 4px solid #9A5B00;'} border-radius: 6px; padding: 14px; margin: 24px 0; font-size: 13px; color: #14181F;">
      ${c.notice}
    </div>

    <p style="font-size: 12px; color: #6B7280; word-break: break-all; margin-top: 24px;">
      ${c.copyLink}<br>
      <a href="${verifyUrl}" style="color: #0F5C4D; text-decoration: underline;">${verifyUrl}</a>
    </p>
  `;

  return emailWrapper(content, lang, c.title);
}

/**
 * 3. Payment Receipt Email Template (All 6 Languages: en, ar, fr, de, es, tr)
 */
export interface PaymentReceiptEmailProps extends TemplateBaseProps {
  amount: number;
  currency: string;
  planId: string;
  transactionId: string;
  date?: string;
}

export function getPaymentReceiptEmailSubject(language: SupportedEmailLanguage = 'en'): string {
  const lang = normalizeEmailLang(language);
  const subjects: Record<SupportedEmailLanguage, string> = {
    en: 'Payment Receipt & Confirmation - JobMatch AI 🧾',
    ar: 'إيصال الدفع وتأكيد الاشتراك - JobMatch AI 🧾',
    fr: 'Reçu de paiement et confirmation - JobMatch AI 🧾',
    de: 'Zahlungsbeleg & Bestätigung - JobMatch AI 🧾',
    es: 'Recibo de pago y confirmación - JobMatch AI 🧾',
    tr: 'Ödeme Makbuzu ve Onay - JobMatch AI 🧾',
  };
  return subjects[lang];
}

export function getPaymentReceiptEmailHtml({
  name = 'Valued Customer',
  amount,
  currency,
  planId,
  transactionId,
  date = new Date().toISOString().split('T')[0],
  language = 'en',
}: PaymentReceiptEmailProps): string {
  const lang = normalizeEmailLang(language);
  const isAr = lang === 'ar';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const isPro = planId === 'pro';

  const copy: Record<
    SupportedEmailLanguage,
    {
      title: string;
      heading: string;
      body: string;
      planName: string;
      planLabel: string;
      amountLabel: string;
      txLabel: string;
      dateLabel: string;
      cta: string;
    }
  > = {
    en: {
      title: 'Payment Receipt - JobMatch AI',
      heading: 'Payment Receipt & Confirmation 🧾',
      body: `Thank you, ${name}! Your payment has been processed and your account entitlements are now active.`,
      planName: isPro ? 'JobMatch Pro (Unlimited)' : '15 AI Credits (Pay-As-You-Go)',
      planLabel: 'Purchased Plan:',
      amountLabel: 'Amount Paid:',
      txLabel: 'Transaction ID:',
      dateLabel: 'Date:',
      cta: 'Open Dashboard →',
    },
    ar: {
      title: 'إيصال دفع اشتراك JobMatch AI',
      heading: 'إيصال الدفع وتأكيد الاشتراك 🧾',
      body: `شكراً لك ${name}! تم استلام دفعتك بنجاح وتفعيل مزايا باقتك في حسابك فوراً.`,
      planName: isPro ? 'باقة JobMatch Pro غير المحدودة' : 'باقة 15 نقطة ذكاء اصطناعي (Pay-As-You-Go)',
      planLabel: 'الخطة / الباقة:',
      amountLabel: 'المبلغ المدفوع:',
      txLabel: 'رقم المعاملة:',
      dateLabel: 'التاريخ:',
      cta: 'الذهاب إلى لوحة التحكم ←',
    },
    fr: {
      title: 'Reçu de paiement - JobMatch AI',
      heading: 'Reçu de paiement et confirmation 🧾',
      body: `Merci ${name} ! Votre paiement a été traité avec succès et vos avantages sont désormais actifs.`,
      planName: isPro ? 'JobMatch Pro (Illimité)' : 'Pack de 15 crédits IA (Pay-As-You-Go)',
      planLabel: 'Offre souscrite :',
      amountLabel: 'Montant payé :',
      txLabel: 'Référence :',
      dateLabel: 'Date :',
      cta: 'Ouvrir le tableau de bord →',
    },
    de: {
      title: 'Zahlungsbeleg - JobMatch AI',
      heading: 'Zahlungsbeleg & Bestätigung 🧾',
      body: `Vielen Dank, ${name}! Ihre Zahlung wurde erfolgreich verarbeitet und Ihr Konto wurde freigeschaltet.`,
      planName: isPro ? 'JobMatch Pro (Unbegrenzt)' : '15 KI-Credits (Pay-As-You-Go)',
      planLabel: 'Gewählter Tarif:',
      amountLabel: 'Gezahlter Betrag:',
      txLabel: 'Transaktions-ID:',
      dateLabel: 'Datum:',
      cta: 'Zum Dashboard →',
    },
    es: {
      title: 'Recibo de pago - JobMatch AI',
      heading: 'Recibo de pago y confirmación 🧾',
      body: `¡Gracias, ${name}! Tu pago se ha procesado correctamente y los beneficios de tu cuenta ya están activos.`,
      planName: isPro ? 'JobMatch Pro (Ilimitado)' : '15 Créditos de IA (Pay-As-You-Go)',
      planLabel: 'Plan adquirido:',
      amountLabel: 'Importe pagado:',
      txLabel: 'ID de transacción:',
      dateLabel: 'Fecha:',
      cta: 'Abrir panel de control →',
    },
    tr: {
      title: 'Ödeme Makbuzu - JobMatch AI',
      heading: 'Ödeme Makbuzu ve Onay 🧾',
      body: `Teşekkürler ${name}! Ödemeniz başarıyla işlendi ve paket özellikleriniz hesabınızda etkinleştirildi.`,
      planName: isPro ? 'JobMatch Pro (Sınırsız)' : '15 Yapay Zeka Kredisi (Kullandıkça Öde)',
      planLabel: 'Satın Alınan Paket:',
      amountLabel: 'Ödenen Tutar:',
      txLabel: 'İşlem Numarası:',
      dateLabel: 'Tarih:',
      cta: 'Kontrol Panelini Aç →',
    },
  };

  const c = copy[lang];
  const valueAlign = isAr ? 'left' : 'right';

  const content = `
    <h1 style="color: #14181F; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">${c.heading}</h1>
    <p style="margin: 0 0 20px 0; color: #4A5160;">
      ${c.body}
    </p>

    <table role="presentation" width="100%" style="background-color: #F3F0EA; border: 1px solid #E4DFD5; border-radius: 8px; padding: 18px; margin-bottom: 24px; border-collapse: separate; border-spacing: 0;">
      <tr>
        <td style="padding: 8px 0; color: #6B7280; font-size: 13px;">${c.planLabel}</td>
        <td style="padding: 8px 0; color: #14181F; font-weight: 600; text-align: ${valueAlign}; font-size: 14px;">${c.planName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6B7280; font-size: 13px;">${c.amountLabel}</td>
        <td style="padding: 8px 0; color: #1B7F4B; font-weight: 700; text-align: ${valueAlign}; font-size: 15px;">${amount} ${currency}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6B7280; font-size: 13px;">${c.txLabel}</td>
        <td style="padding: 8px 0; color: #14181F; font-family: monospace; font-size: 12px; text-align: ${valueAlign};">${transactionId}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6B7280; font-size: 13px;">${c.dateLabel}</td>
        <td style="padding: 8px 0; color: #4A5160; text-align: ${valueAlign}; font-size: 13px;">${date}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0 12px 0;">
      <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
        ${c.cta}
      </a>
    </div>
  `;

  return emailWrapper(content, lang, c.title);
}

/**
 * 4. Unified Subscription Lifecycle Templates (6 Languages):
 *    - subscription_renewed
 *    - subscription_cancelled
 *    - payment_failed
 *    - subscription_ended
 *    - expiring_soon
 */
export type SubscriptionAlertType =
  | 'subscription_renewed'
  | 'subscription_cancelled'
  | 'payment_failed'
  | 'subscription_ended'
  | 'expiring_soon';

export interface SubscriptionAlertEmailProps extends TemplateBaseProps {
  type: SubscriptionAlertType;
  daysLeft?: number;
  amount?: number;
  currency?: string;
  renewsOrEndsAt?: string | null;
}

export function getSubscriptionEmailSubject(
  type: SubscriptionAlertType,
  language: SupportedEmailLanguage = 'en'
): string {
  const lang = normalizeEmailLang(language);
  const subjects: Record<SubscriptionAlertType, Record<SupportedEmailLanguage, string>> = {
    subscription_renewed: {
      en: 'Your JobMatch Pro Subscription Has Been Renewed 🔄',
      ar: 'تم تجديد اشتراكك في باقة JobMatch Pro بنجاح 🔄',
      fr: 'Votre abonnement JobMatch Pro a été renouvelé 🔄',
      de: 'Ihr JobMatch Pro-Abonnement wurde verlängert 🔄',
      es: 'Tu suscripción a JobMatch Pro ha sido renovada 🔄',
      tr: 'JobMatch Pro Aboneliğiniz Yenilendi 🔄',
    },
    subscription_cancelled: {
      en: 'JobMatch Pro Subscription Cancellation Confirmed',
      ar: 'تأكيد إلغاء التجديد التلقائي لاشتراك JobMatch Pro',
      fr: 'Confirmation de résiliation de votre abonnement JobMatch Pro',
      de: 'Kündigungsbestätigung Ihres JobMatch Pro-Abonnements',
      es: 'Confirmación de cancelación de tu suscripción JobMatch Pro',
      tr: 'JobMatch Pro Abonelik İptali Onaylandı',
    },
    payment_failed: {
      en: 'Action Required: JobMatch Pro Payment Failed ⚠️',
      ar: 'تنبيه: تعذر تحصيل دفعة تجديد اشتراك JobMatch Pro ⚠️',
      fr: 'Action requise : Échec du paiement de votre abonnement JobMatch Pro ⚠️',
      de: 'Handlungsbedarf: Zahlung für JobMatch Pro fehlgeschlagen ⚠️',
      es: 'Acción requerida: Falló el pago de tu suscripción JobMatch Pro ⚠️',
      tr: 'İşlem Gerekli: JobMatch Pro Abonelik Ödemesi Başarısız ⚠️',
    },
    subscription_ended: {
      en: 'Your JobMatch Pro Subscription Has Ended',
      ar: 'انتهاء صلاحية اشتراك JobMatch Pro',
      fr: 'Votre abonnement JobMatch Pro a pris fin',
      de: 'Ihr JobMatch Pro-Abonnement ist abgelaufen',
      es: 'Tu suscripción a JobMatch Pro ha finalizado',
      tr: 'JobMatch Pro Aboneliğiniz Sona Erdi',
    },
    expiring_soon: {
      en: 'Reminder: Your JobMatch Pro Plan Expires Soon ⏳',
      ar: 'تذكير: اشتراكك في باقة JobMatch Pro ينتهي قريباً ⏳',
      fr: 'Rappel : Votre abonnement JobMatch Pro expire bientôt ⏳',
      de: 'Erinnerung: Ihr JobMatch Pro-Tarif läuft bald ab ⏳',
      es: 'Recordatorio: Tu plan JobMatch Pro vence pronto ⏳',
      tr: 'Hatırlatma: JobMatch Pro Paketinizin Süresi Yakında Doluyor ⏳',
    },
  };
  return subjects[type][lang];
}

export function getSubscriptionAlertEmailHtml({
  name = 'Valued Customer',
  type,
  daysLeft = 3,
  amount,
  currency = 'USD',
  renewsOrEndsAt,
  language = 'en',
}: SubscriptionAlertEmailProps): string {
  const lang = normalizeEmailLang(language);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const formattedDate = renewsOrEndsAt
    ? new Date(renewsOrEndsAt).toISOString().split('T')[0]
    : null;
  const amountBadge =
    typeof amount === 'number' && amount > 0 ? ` (${amount} ${currency})` : '';

  if (type === 'subscription_renewed') {
    const copy: Record<
      SupportedEmailLanguage,
      { title: string; heading: string; body: string; cta: string }
    > = {
      en: {
        title: 'Subscription Renewed - JobMatch AI',
        heading: 'Subscription Renewed Successfully 🔄',
        body: `Hi ${name}, your JobMatch Pro subscription${amountBadge} has been renewed${
          formattedDate ? ` through <strong>${formattedDate}</strong>` : ''
        }. Your unlimited AI resume & cover letter generations remain active.`,
        cta: 'Go to Dashboard →',
      },
      ar: {
        title: 'تم تجديد الاشتراك - JobMatch AI',
        heading: 'تم تجديد اشتراك JobMatch Pro بنجاح 🔄',
        body: `مرحباً ${name}، تم تجديد اشتراكك في باقة JobMatch Pro${amountBadge}${
          formattedDate ? ` حتى تاريخ <strong>${formattedDate}</strong>` : ''
        }. جميع مزايا التوليد بالذكاء الاصطناعي والقوالب الاحترافية مستمرة في حسابك.`,
        cta: 'الذهاب إلى لوحة التحكم ←',
      },
      fr: {
        title: 'Abonnement renouvelé - JobMatch AI',
        heading: 'Abonnement renouvelé avec succès 🔄',
        body: `Bonjour ${name}, votre abonnement JobMatch Pro${amountBadge} a été renouvelé${
          formattedDate ? ` jusqu'au <strong>${formattedDate}</strong>` : ''
        }. Vos générations IA illimitées restent actives.`,
        cta: 'Accéder au tableau de bord →',
      },
      de: {
        title: 'Abonnement verlängert - JobMatch AI',
        heading: 'Abonnement erfolgreich verlängert 🔄',
        body: `Hallo ${name}, Ihr JobMatch Pro-Abonnement${amountBadge} wurde${
          formattedDate ? ` bis zum <strong>${formattedDate}</strong>` : ''
        } verlängert. Alle Pro-Funktionen bleiben weiterhin aktiv.`,
        cta: 'Zum Dashboard →',
      },
      es: {
        title: 'Suscripción renovada - JobMatch AI',
        heading: 'Suscripción renovada con éxito 🔄',
        body: `Hola ${name}, tu suscripción a JobMatch Pro${amountBadge} se ha renovado${
          formattedDate ? ` hasta el <strong>${formattedDate}</strong>` : ''
        }. Tus generaciones con IA siguen activas.`,
        cta: 'Ir al panel de control →',
      },
      tr: {
        title: 'Abonelik Yenilendi - JobMatch AI',
        heading: 'Aboneliğiniz Başarıyla Yenilendi 🔄',
        body: `Merhaba ${name}, JobMatch Pro aboneliğiniz${amountBadge}${
          formattedDate ? ` <strong>${formattedDate}</strong> tarihine kadar` : ''
        } yenilendi. Tüm Pro özellikleriniz kesintisiz devam ediyor.`,
        cta: 'Kontrol Paneline Git →',
      },
    };
    const c = copy[lang];
    const html = `
      <h1 style="color: #0F5C4D; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">${c.heading}</h1>
      <p style="margin: 0 0 20px 0; color: #4A5160;">${c.body}</p>
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
          ${c.cta}
        </a>
      </div>
    `;
    return emailWrapper(html, lang, c.title);
  }

  if (type === 'subscription_cancelled') {
    const copy: Record<
      SupportedEmailLanguage,
      { title: string; heading: string; body: string; cta: string }
    > = {
      en: {
        title: 'Subscription Cancelled - JobMatch AI',
        heading: 'Your Subscription Cancellation Is Confirmed',
        body: `Hi ${name}, we have confirmed the cancellation of your JobMatch Pro auto-renewal. You will not be charged again, and your Pro access remains active${
          formattedDate ? ` until <strong>${formattedDate}</strong>` : ' until the end of your current billing period'
        }.`,
        cta: 'Manage Billing & Plans →',
      },
      ar: {
        title: 'تأكيد إلغاء الاشتراك - JobMatch AI',
        heading: 'تم تأكيد إلغاء التجديد التلقائي لاشتراكك',
        body: `مرحباً ${name}، نؤكد لك أنه تم إيقاف التجديد التلقائي لاشتراك JobMatch Pro ولن يتم خصم أي مبالغ مستقبلية. ستظل مزايا Pro متاحة في حسابك${
          formattedDate ? ` حتى تاريخ <strong>${formattedDate}</strong>` : ' حتى نهاية فترة الفوترة المدفوعة الحالية'
        }.`,
        cta: 'إدارة الفوترة والباقات ←',
      },
      fr: {
        title: 'Abonnement résilié - JobMatch AI',
        heading: 'Confirmation de résiliation de votre abonnement',
        body: `Bonjour ${name}, le renouvellement automatique de votre abonnement JobMatch Pro a bien été désactivé. Votre accès Pro reste actif${
          formattedDate ? ` jusqu'au <strong>${formattedDate}</strong>` : " jusqu'à la fin de la période payée"
        }.`,
        cta: 'Gérer mon abonnement →',
      },
      de: {
        title: 'Abonnement gekündigt - JobMatch AI',
        heading: 'Ihre Kündigung wurde bestätigt',
        body: `Hallo ${name}, die automatische Verlängerung Ihres JobMatch Pro-Abonnements wurde deaktiviert. Ihr Pro-Zugang bleibt${
          formattedDate ? ` bis zum <strong>${formattedDate}</strong>` : ' bis zum Ende des aktuellen Abrechnungszeitraums'
        } aktiv.`,
        cta: 'Tarife & Abrechnung →',
      },
      es: {
        title: 'Suscripción cancelada - JobMatch AI',
        heading: 'Confirmación de cancelación de suscripción',
        body: `Hola ${name}, hemos confirmado la cancelación de la renovación automática de tu plan JobMatch Pro. Seguirás teniendo acceso Pro${
          formattedDate ? ` hasta el <strong>${formattedDate}</strong>` : ' hasta el final de tu periodo de facturación actual'
        }.`,
        cta: 'Ver planes y facturación →',
      },
      tr: {
        title: 'Abonelik İptal Edildi - JobMatch AI',
        heading: 'Abonelik İptaliniz Onaylandı',
        body: `Merhaba ${name}, JobMatch Pro otomatik yenilemeniz iptal edildi. Hesabınızdan tekrar çekim yapılmayacak olup Pro erişiminiz${
          formattedDate ? ` <strong>${formattedDate}</strong> tarihine kadar` : ' mevcut fatura döneminin sonuna kadar'
        } devam edecektir.`,
        cta: 'Faturalandırmayı Yönet →',
      },
    };
    const c = copy[lang];
    const html = `
      <h1 style="color: #14181F; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">${c.heading}</h1>
      <p style="margin: 0 0 20px 0; color: #4A5160;">${c.body}</p>
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="${appUrl}/settings" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
          ${c.cta}
        </a>
      </div>
    `;
    return emailWrapper(html, lang, c.title);
  }

  if (type === 'payment_failed') {
    const copy: Record<
      SupportedEmailLanguage,
      { title: string; heading: string; body: string; cta: string }
    > = {
      en: {
        title: 'Subscription Payment Failed - JobMatch AI',
        heading: 'Action Required: Subscription Payment Failed ⚠️',
        body: `Hi ${name}, we were unable to process the renewal payment for your JobMatch Pro subscription. Please update your payment method in Settings > Billing to keep your Pro features active.`,
        cta: 'Manage Subscription →',
      },
      ar: {
        title: 'تنبيه دفع اشتراك JobMatch AI',
        heading: 'تنبيه: تعذر تجديد اشتراك JobMatch Pro ⚠️',
        body: `مرحباً ${name}، تعذر خصم رسوم تجديد اشتراك باقة Pro الخاصة بك. يرجى تحديث وسيلة الدفع من خلال بوابة إدارة الاشتراك لتجنب توقف المزايا الاحترافية.`,
        cta: 'إدارة الاشتراك وتحديث الدفع ←',
      },
      fr: {
        title: 'Échec du paiement - JobMatch AI',
        heading: 'Action requise : Échec du paiement de votre abonnement ⚠️',
        body: `Bonjour ${name}, nous n'avons pas pu traiter le paiement de renouvellement de votre abonnement JobMatch Pro. Veuillez mettre à jour votre moyen de paiement dans vos Paramètres.`,
        cta: 'Gérer mon abonnement →',
      },
      de: {
        title: 'Abonnementzahlung fehlgeschlagen - JobMatch AI',
        heading: 'Handlungsbedarf: Zahlung fehlgeschlagen ⚠️',
        body: `Hallo ${name}, wir konnten die Verlängerungszahlung für Ihr JobMatch Pro-Abonnement nicht verarbeiten. Bitte aktualisieren Sie Ihre Zahlungsmethode in den Einstellungen.`,
        cta: 'Abonnement verwalten →',
      },
      es: {
        title: 'Fallo en el pago de suscripción - JobMatch AI',
        heading: 'Acción requerida: Falló el pago de tu suscripción ⚠️',
        body: `Hola ${name}, no pudimos procesar el pago de renovación de tu suscripción JobMatch Pro. Por favor actualiza tu método de pago en Configuración.`,
        cta: 'Gestionar suscripción →',
      },
      tr: {
        title: 'Abonelik Ödemesi Başarısız - JobMatch AI',
        heading: 'İşlem Gerekli: Abonelik Ödemesi Başarısız ⚠️',
        body: `Merhaba ${name}, JobMatch Pro abonelik yenileme ödemenizi gerçekleştiremedik. Pro özelliklerinizin kesilmemesi için lütfen ödeme yönteminizi güncelleyin.`,
        cta: 'Aboneliği Yönet →',
      },
    };
    const c = copy[lang];
    const html = `
      <h1 style="color: #9A5B00; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">${c.heading}</h1>
      <p style="margin: 0 0 20px 0; color: #4A5160;">${c.body}</p>
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="${appUrl}/dashboard?tab=settings" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
          ${c.cta}
        </a>
      </div>
    `;
    return emailWrapper(html, lang, c.title);
  }

  if (type === 'expiring_soon') {
    const copy: Record<
      SupportedEmailLanguage,
      { title: string; heading: string; body: string; cta: string }
    > = {
      en: {
        title: 'Pro Plan Expiring Soon - JobMatch AI',
        heading: `Reminder: Your Pro Plan Expires in ${daysLeft} Days ⏳`,
        body: `Hi ${name}, your JobMatch Pro access is scheduled to expire in ${daysLeft} days. Renew anytime to keep unlimited AI generations and all templates unlocked.`,
        cta: 'Renew Pro Plan →',
      },
      ar: {
        title: 'تذكير بقرب انتهاء اشتراك JobMatch Pro',
        heading: `تنبيه: اشتراك JobMatch Pro ينتهي خلال ${daysLeft} أيام ⏳`,
        body: `مرحباً ${name}، نود تذكيرك بأن صلاحية باقة JobMatch Pro الخاصة بك ستنتهي خلال ${daysLeft} أيام. يمكنك تجديد اشتراكك في أي وقت للحفاظ على التوليد غير المحدود وجميع القوالب.`,
        cta: 'تجديد الاشتراك الآن ←',
      },
      fr: {
        title: 'Votre abonnement Pro expire bientôt - JobMatch AI',
        heading: `Rappel : Votre plan Pro expire dans ${daysLeft} jours ⏳`,
        body: `Bonjour ${name}, votre accès JobMatch Pro arrive à échéance dans ${daysLeft} jours. Renouvelez à tout moment pour conserver vos générations IA illimitées.`,
        cta: 'Renouveler mon plan Pro →',
      },
      de: {
        title: 'Pro-Tarif läuft bald ab - JobMatch AI',
        heading: `Erinnerung: Ihr Pro-Tarif läuft in ${daysLeft} Tagen ab ⏳`,
        body: `Hallo ${name}, Ihr JobMatch Pro-Zugang endet in ${daysLeft} Tagen. Verlängern Sie jederzeit, um alle Pro-Vorlagen und KI-Funktionen zu behalten.`,
        cta: 'Pro-Tarif verlängern →',
      },
      es: {
        title: 'Tu plan Pro vence pronto - JobMatch AI',
        heading: `Recordatorio: Tu plan Pro vence en ${daysLeft} días ⏳`,
        body: `Hola ${name}, tu acceso a JobMatch Pro finalizará en ${daysLeft} días. Renueva en cualquier momento para mantener las funciones ilimitadas.`,
        cta: 'Renovar plan Pro →',
      },
      tr: {
        title: 'Pro Paketinizin Süresi Doluyor - JobMatch AI',
        heading: `Hatırlatma: Pro Paketiniz ${daysLeft} Gün İçinde Sona Eriyor ⏳`,
        body: `Merhaba ${name}, JobMatch Pro erişiminiz ${daysLeft} gün içinde sona erecek. Sınırsız yapay zeka üretimini korumak için istediğiniz zaman yenileyebilirsiniz.`,
        cta: 'Pro Paketi Yenile →',
      },
    };
    const c = copy[lang];
    const html = `
      <h1 style="color: #9A5B00; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">${c.heading}</h1>
      <p style="margin: 0 0 20px 0; color: #4A5160;">${c.body}</p>
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="${appUrl}/pricing" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
          ${c.cta}
        </a>
      </div>
    `;
    return emailWrapper(html, lang, c.title);
  }

  // subscription_ended
  const copy: Record<
    SupportedEmailLanguage,
    { title: string; heading: string; body: string; cta: string }
  > = {
    en: {
      title: 'Subscription Ended - JobMatch AI',
      heading: 'Your JobMatch Pro Subscription Has Ended',
      body: `Hi ${name}, your JobMatch Pro subscription has ended and your account has moved to the Free plan. Your saved resumes remain safe, and you can upgrade again anytime.`,
      cta: 'View Plans →',
    },
    ar: {
      title: 'انتهاء اشتراك JobMatch Pro',
      heading: 'تم إنهاء اشتراك JobMatch Pro',
      body: `مرحباً ${name}، انتهت فترة اشتراكك في باقة JobMatch Pro وتم تحويل حسابك إلى الباقة المجانية (Free) مع الاحتفاظ بجميع سيرك الذاتية المحفوظة. يمكنك إعادة الاشتراك في أي وقت.`,
      cta: 'عرض الباقات ←',
    },
    fr: {
      title: 'Abonnement terminé - JobMatch AI',
      heading: 'Votre abonnement JobMatch Pro a pris fin',
      body: `Bonjour ${name}, votre abonnement JobMatch Pro est terminé et votre compte est repassé au plan Gratuit. Vous pouvez vous réabonner à tout moment.`,
      cta: 'Voir les offres →',
    },
    de: {
      title: 'Abonnement beendet - JobMatch AI',
      heading: 'Ihr JobMatch Pro-Abonnement ist beendet',
      body: `Hallo ${name}, Ihr JobMatch Pro-Abonnement ist abgelaufen und Ihr Konto wurde auf den kostenlosen Tarif umgestellt. Sie können jederzeit wieder upgraden.`,
      cta: 'Tarife ansehen →',
    },
    es: {
      title: 'Suscripción finalizada - JobMatch AI',
      heading: 'Tu suscripción a JobMatch Pro ha finalizado',
      body: `Hola ${name}, tu suscripción a JobMatch Pro ha terminado y tu cuenta ha pasado al plan Gratuito. Puedes volver a mejorar tu plan cuando quieras.`,
      cta: 'Ver planes →',
    },
    tr: {
      title: 'Abonelik Sona Erdi - JobMatch AI',
      heading: 'JobMatch Pro Aboneliğiniz Sona Erdi',
      body: `Merhaba ${name}, JobMatch Pro aboneliğiniz sona erdi ve hesabınız Ücretsiz plana geçirildi. İstediğiniz zaman tekrar yükseltebilirsiniz.`,
      cta: 'Paketleri Gör →',
    },
  };
  const c = copy[lang];
  const html = `
    <h1 style="color: #14181F; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">${c.heading}</h1>
    <p style="margin: 0 0 20px 0; color: #4A5160;">${c.body}</p>
    <div style="text-align: center; margin: 28px 0 12px 0;">
      <a href="${appUrl}/pricing" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
        ${c.cta}
      </a>
    </div>
  `;
  return emailWrapper(html, lang, c.title);
}

/**
 * Convenience helpers for Subscription Renewed / Cancelled / Failed (6 Languages)
 */
export function getSubscriptionRenewedEmailHtml(
  props: Omit<SubscriptionAlertEmailProps, 'type'>
): string {
  return getSubscriptionAlertEmailHtml({ ...props, type: 'subscription_renewed' });
}

export function getSubscriptionCancelledEmailHtml(
  props: Omit<SubscriptionAlertEmailProps, 'type'>
): string {
  return getSubscriptionAlertEmailHtml({ ...props, type: 'subscription_cancelled' });
}

export function getSubscriptionFailedEmailHtml(
  props: Omit<SubscriptionAlertEmailProps, 'type'>
): string {
  return getSubscriptionAlertEmailHtml({ ...props, type: 'payment_failed' });
}

/**
 * 5. Account Deletion Confirmation Email (Sent After Account Is Deleted — 6 Languages)
 */
export function getAccountDeletedEmailHtml({
  name = 'User',
  language = 'en',
}: TemplateBaseProps): string {
  const lang = normalizeEmailLang(language);
  const copy: Record<
    SupportedEmailLanguage,
    { title: string; heading: string; greeting: string; body: string; note: string }
  > = {
    en: {
      title: 'Account Deleted - JobMatch AI',
      heading: 'Your Account Has Been Permanently Deleted',
      greeting: `Hi ${name},`,
      body: 'This email confirms that your JobMatch AI account, along with all saved resumes, cover letters, ATS analyses, and active sessions, has been permanently deleted.',
      note: 'Any active subscription has been canceled, and historical billing records have been anonymized in accordance with accounting and privacy regulations.',
    },
    ar: {
      title: 'تأكيد حذف الحساب - JobMatch AI',
      heading: 'تم حذف حسابك نهائياً',
      greeting: `مرحباً ${name}،`,
      body: 'تؤكد هذه الرسالة أنه تم حذف حسابك على JobMatch AI نهائياً، بما في ذلك جميع السير الذاتية وخطابات التقديم وتحليلات ATS والجلسات النشطة.',
      note: 'تم إلغاء أي اشتراك فعّال، وتم إخفاء الهوية الشخصية من السجلات المالية السابقة التزاماً بمتطلبات المحاسبة والخصوصية.',
    },
    fr: {
      title: 'Compte supprimé - JobMatch AI',
      heading: 'Votre compte a été définitivement supprimé',
      greeting: `Bonjour ${name},`,
      body: 'Cet e-mail confirme que votre compte JobMatch AI ainsi que tous vos CV, lettres de motivation, analyses ATS et sessions actives ont été définitivement supprimés.',
      note: 'Tout abonnement actif a été résilié et les registres comptables ont été anonymisés conformément aux exigences légales.',
    },
    de: {
      title: 'Konto gelöscht - JobMatch AI',
      heading: 'Ihr Konto wurde dauerhaft gelöscht',
      greeting: `Hallo ${name},`,
      body: 'Diese E-Mail bestätigt, dass Ihr JobMatch AI-Konto sowie alle gespeicherten Lebensläufe, Anschreiben, ATS-Analysen und aktiven Sitzungen dauerhaft gelöscht wurden.',
      note: 'Ein aktives Abonnement wurde gekündigt und Abrechnungsdaten wurden gemäß den gesetzlichen Buchhaltungsvorschriften anonymisiert.',
    },
    es: {
      title: 'Cuenta eliminada - JobMatch AI',
      heading: 'Tu cuenta ha sido eliminada permanentemente',
      greeting: `Hola ${name},`,
      body: 'Este correo confirma que tu cuenta de JobMatch AI, junto con todos tus currículums, cartas de presentación, análisis ATS y sesiones activas, ha sido eliminada de forma permanente.',
      note: 'Cualquier suscripción activa ha sido cancelada y los registros financieros han sido anonimizados por requisitos contables.',
    },
    tr: {
      title: 'Hesap Silindi - JobMatch AI',
      heading: 'Hesabınız Kalıcı Olarak Silindi',
      greeting: `Merhaba ${name},`,
      body: 'Bu e-posta, JobMatch AI hesabınızın ve kayıtlı tüm özgeçmişlerinizin, ön yazılarınızın, ATS analizlerinizin ve aktif oturumlarınızın kalıcı olarak silindiğini doğrular.',
      note: 'Aktif abonelikler iptal edilmiş ve muhasebe yükümlülükleri gereği finansal kayıtlar anonimleştirilmiştir.',
    },
  };

  const c = copy[lang];
  const content = `
    <h1 style="color: #14181F; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">${c.heading}</h1>
    <p style="margin: 0 0 16px 0; color: #4A5160;">${c.greeting}</p>
    <p style="margin: 0 0 20px 0; color: #4A5160;">${c.body}</p>
    <div style="background-color: #F3F0EA; border: 1px solid #E4DFD5; border-radius: 6px; padding: 14px; margin: 20px 0; font-size: 13px; color: #4A5160;">
      ${c.note}
    </div>
  `;

  return emailWrapper(content, lang, c.title);
}

/**
 * 6. Account Deletion Verification Code Email (6 Languages)
 */
export function getAccountDeleteConfirmEmailHtml({
  name = 'User',
  confirmToken,
  language = 'en',
}: TemplateBaseProps & { confirmToken: string }): string {
  const lang = normalizeEmailLang(language);
  const copy: Record<
    SupportedEmailLanguage,
    { title: string; heading: string; body: string; codeLabel: string; notice: string }
  > = {
    en: {
      title: 'Confirm Account Deletion - JobMatch AI',
      heading: 'Account Deletion Confirmation Code ⚠️',
      body: `Hi ${name}, use the confirmation code below to authorize permanent deletion of your JobMatch AI account:`,
      codeLabel: 'Confirmation Code',
      notice: 'This code expires in 15 minutes. If you did not request account deletion, please ignore this email.',
    },
    ar: {
      title: 'تأكيد حذف الحساب - JobMatch AI',
      heading: 'رمز تأكيد حذف الحساب ⚠️',
      body: `مرحباً ${name}، استخدم رمز التأكيد أدناه للموافقة على الحذف النهائي لحسابك في JobMatch AI:`,
      codeLabel: 'رمز التأكيد',
      notice: 'ينتهي هذا الرمز خلال 15 دقيقة. إذا لم تطلب حذف الحساب، يرجى تجاهل هذه الرسالة.',
    },
    fr: {
      title: 'Confirmer la suppression du compte - JobMatch AI',
      heading: 'Code de confirmation de suppression ⚠️',
      body: `Bonjour ${name}, utilisez le code ci-dessous pour confirmer la suppression définitive de votre compte :`,
      codeLabel: 'Code de confirmation',
      notice: 'Ce code expire dans 15 minutes.',
    },
    de: {
      title: 'Kontolöschung bestätigen - JobMatch AI',
      heading: 'Bestätigungscode zur Kontolöschung ⚠️',
      body: `Hallo ${name}, verwenden Sie den folgenden Code, um die dauerhafte Löschung Ihres Kontos zu bestätigen:`,
      codeLabel: 'Bestätigungscode',
      notice: 'Dieser Code läuft in 15 Minuten ab.',
    },
    es: {
      title: 'Confirmar eliminación de cuenta - JobMatch AI',
      heading: 'Código de confirmación de eliminación ⚠️',
      body: `Hola ${name}, utiliza el siguiente código para confirmar la eliminación permanente de tu cuenta:`,
      codeLabel: 'Código de confirmación',
      notice: 'Este código caduca en 15 minutos.',
    },
    tr: {
      title: 'Hesap Silme Onayı - JobMatch AI',
      heading: 'Hesap Silme Onay Kodu ⚠️',
      body: `Merhaba ${name}, hesabınızın kalıcı olarak silinmesini onaylamak için aşağıdaki kodu kullanın:`,
      codeLabel: 'Onay Kodu',
      notice: 'Bu kodun süresi 15 dakika içinde dolacaktır.',
    },
  };

  const c = copy[lang];
  const content = `
    <h1 style="color: #B42318; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">${c.heading}</h1>
    <p style="margin: 0 0 20px 0; color: #4A5160;">${c.body}</p>
    <div style="background-color: #FEF3F2; border: 1px solid #FECDCA; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
      <div style="font-size: 12px; color: #B42318; margin-bottom: 6px; font-weight: 600;">${c.codeLabel}</div>
      <div style="font-family: monospace; font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #14181F;">${confirmToken}</div>
    </div>
    <p style="font-size: 12px; color: #6B7280;">${c.notice}</p>
  `;

  return emailWrapper(content, lang, c.title);
}

export default sendEmail;
