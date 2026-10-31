import { Resend } from 'resend';

// Lazy initialization of Resend client
let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  isDemo?: boolean;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Universal typed email sender with demo protection and graceful fallback.
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
  isDemo = false,
}: SendEmailOptions): Promise<EmailResult> {
  // Requirement: Skip all emails for demo users
  if (isDemo) {
    return {
      success: true,
      skipped: true,
      id: 'demo_skipped',
    };
  }

  const sender =
    from ||
    process.env.EMAIL_FROM ||
    'JobMatch AI <onboarding@resend.dev>';

  const resend = getResendClient();

  // If Resend API key is not configured, simulate delivery safely
  if (!resend) {
    console.log(`[Email Simulator] To: ${Array.isArray(to) ? to.join(', ') : to} | Subject: "${subject}"`);
    return {
      success: true,
      id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  try {
    const data = await resend.emails.send({
      from: sender,
      to,
      subject,
      html,
    });

    if (data.error) {
      console.error('[Resend Error]', data.error);
      return {
        success: false,
        error: data.error.message,
      };
    }

    return {
      success: true,
      id: data.data?.id,
    };
  } catch (error: any) {
    console.error('[Email Send Exception]', error);
    return {
      success: false,
      error: error?.message || 'Failed to send email',
    };
  }
}

// ==============================================================================
// EMAIL TEMPLATES (Paper & Ink, Editorial, Responsive, AR/EN with RTL Support)
// ==============================================================================

interface TemplateBaseProps {
  name?: string;
  language?: 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';
}

function emailWrapper(content: string, lang: 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr', title: string): string {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const fontFamily = isAr
    ? "'Segoe UI', Tahoma, Arial, sans-serif"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const footers = {
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
  const lang = language || 'en';

  const welcomeContent: Record<string, { title: string; heading: string; body: string; stepsTitle: string; step1: string; step2: string; step3: string; cta: string }> = {
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

  const c = welcomeContent[lang] || welcomeContent.en;

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
  const lang = language || 'en';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password/${resetToken}`;

  const resetContent: Record<string, { title: string; heading: string; greeting: string; body: string; cta: string; notice: string; copyLink: string }> = {
    en: {
      title: 'Password Reset - JobMatch AI',
      heading: 'Reset Your Password 🔐',
      greeting: `Hi ${name},`,
      body: 'We received a request to reset your JobMatch AI password. Click the button below to choose a new password:',
      cta: 'Reset Password →',
      notice: '⏱️ <strong>Security Notice:</strong> This link is single-use and will expire in <strong>15 minutes</strong>. If you didn\'t make this request, you can safely ignore this email.',
      copyLink: 'Or paste this link into your browser:',
    },
    ar: {
      title: 'إعادة تعيين كلمة المرور - JobMatch AI',
      heading: 'طلب إعادة تعيين كلمة المرور 🔐',
      greeting: `مرحباً ${name}،`,
      body: 'تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على JobMatch AI. يمكنك تعيين كلمة مرور جديدة بالنقر على الزر أدناه:',
      cta: 'إعادة تعيين كلمة المرور ←',
      notice: '⏱️ <strong>تنبيه أمني:</strong> هذا الرابط صالح لمدة <strong>15 دقيقة فقط</strong> ولا يمكن استخدامه إلا لمرة واحدة. إذا لم تكن قد طلبت ذلك، يمكنك تجاهل هذا البريد بأمان ولن يتم إجراء أي تعديل على حسابك.',
      copyLink: 'أو انسخ الرابط المباشر في متصفحك:',
    },
    fr: {
      title: 'Réinitialisation du mot de passe - JobMatch AI',
      heading: 'Réinitialiser votre mot de passe 🔐',
      greeting: `Bonjour ${name},`,
      body: 'Nous avons reçu une demande de réinitialisation de votre mot de passe JobMatch AI. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :',
      cta: 'Réinitialiser le mot de passe →',
      notice: '⏱️ <strong>Avis de sécurité :</strong> Ce lien est à usage unique et expire dans <strong>15 minutes</strong>. Si vous n\'êtes pas à l\'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.',
      copyLink: 'Ou collez ce lien dans votre navigateur :',
    },
    de: {
      title: 'Passwort zurücksetzen - JobMatch AI',
      heading: 'Passwort zurücksetzen 🔐',
      greeting: `Hallo ${name},`,
      body: 'Wir haben eine Anfrage zum Zurücksetzen Ihres JobMatch AI-Passworts erhalten. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort festzulegen:',
      cta: 'Passwort zurücksetzen →',
      notice: '⏱️ <strong>Sicherheitshinweis:</strong> Dieser Link ist einmalig gültig und verfällt in <strong>15 Minuten</strong>. Wenn Sie dies nicht angefordert haben, können Sie diese E-Mail ignorieren.',
      copyLink: 'Oder fügen Sie diesen Link in Ihren Browser ein:',
    },
    es: {
      title: 'Restablecer contraseña - JobMatch AI',
      heading: 'Restablece tu contraseña 🔐',
      greeting: `Hola ${name},`,
      body: 'Recibimos una solicitud para restablecer tu contraseña de JobMatch AI. Haz clic en el botón de abajo para elegir una nueva contraseña:',
      cta: 'Restablecer contraseña →',
      notice: '⏱️ <strong>Aviso de seguridad:</strong> Este enlace es de un solo uso y caduca en <strong>15 minutos</strong>. Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.',
      copyLink: 'O pega este enlace en tu navegador:',
    },
    tr: {
      title: 'Şifre Sıfırlama - JobMatch AI',
      heading: 'Şifrenizi Sıfırlayın 🔐',
      greeting: `Merhaba ${name},`,
      body: 'JobMatch AI şifrenizi sıfırlama talebi aldık. Yeni bir şifre seçmek için aşağıdaki butona tıklayın:',
      cta: 'Şifreyi Sıfırla →',
      notice: '⏱️ <strong>Güvenlik Uyarısı:</strong> Bu bağlantı tek kullanımlıktır ve <strong>15 dakika</strong> içinde sona erecektir. Bu talebi siz yapmadıysanız, bu e-postayı güvenle yok sayabilirsiniz.',
      copyLink: 'Veya bu bağlantıyı tarayıcınıza yapıştırın:',
    },
  };

  const c = resetContent[lang] || resetContent.en;

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
 * 3. Payment Receipt Email Template (AR / EN)
 */
export interface PaymentReceiptEmailProps extends TemplateBaseProps {
  amount: number;
  currency: string;
  planId: string;
  transactionId: string;
  date?: string;
}

export function getPaymentReceiptEmailHtml({
  name = 'Valued Customer',
  amount,
  currency,
  planId,
  transactionId,
  date = new Date().toLocaleDateString(),
  language = 'en',
}: PaymentReceiptEmailProps): string {
  const isAr = language === 'ar';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const planName =
    planId === 'pro'
      ? isAr
        ? 'باقة JobMatch Pro غير المحدودة'
        : 'JobMatch Pro (Unlimited)'
      : isAr
      ? 'باقة 15 نقطة ذكاء اصطناعي (Pay-As-You-Go)'
      : '15 AI Credits (Pay-As-You-Go)';

  const content = isAr
    ? `
      <h1 style="color: #14181F; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">إيصال الدفع وتأكيد الاشتراك 🧾</h1>
      <p style="margin: 0 0 20px 0; color: #4A5160;">
        شكراً لك ${name}! تم استلام دفعتك بنجاح وتفعيل مزايا باقتك في حسابك فوراً.
      </p>

      <table role="presentation" width="100%" style="background-color: #F3F0EA; border: 1px solid #E4DFD5; border-radius: 8px; padding: 18px; margin-bottom: 24px; border-collapse: separate; border-spacing: 0;">
        <tr>
          <td style="padding: 8px 0; color: #6B7280; font-size: 13px;">الخطة / الباقة:</td>
          <td style="padding: 8px 0; color: #14181F; font-weight: 600; text-align: left; font-size: 14px;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280; font-size: 13px;">المبلغ المدفوع:</td>
          <td style="padding: 8px 0; color: #1B7F4B; font-weight: 700; text-align: left; font-size: 15px;">${amount} ${currency}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280; font-size: 13px;">رقم المعاملة:</td>
          <td style="padding: 8px 0; color: #14181F; font-family: monospace; font-size: 12px; text-align: left;">${transactionId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280; font-size: 13px;">التاريخ:</td>
          <td style="padding: 8px 0; color: #4A5160; text-align: left; font-size: 13px;">${date}</td>
        </tr>
      </table>

      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
          الذهاب إلى لوحة التحكم ←
        </a>
      </div>
    `
    : `
      <h1 style="color: #14181F; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">Payment Receipt & Confirmation 🧾</h1>
      <p style="margin: 0 0 20px 0; color: #4A5160;">
        Thank you ${name}! Your payment has been processed successfully and your account has been upgraded.
      </p>

      <table role="presentation" width="100%" style="background-color: #F3F0EA; border: 1px solid #E4DFD5; border-radius: 8px; padding: 18px; margin-bottom: 24px; border-collapse: separate; border-spacing: 0;">
        <tr>
          <td style="padding: 8px 0; color: #6B7280; font-size: 13px;">Purchased Plan:</td>
          <td style="padding: 8px 0; color: #14181F; font-weight: 600; text-align: right; font-size: 14px;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280; font-size: 13px;">Amount Paid:</td>
          <td style="padding: 8px 0; color: #1B7F4B; font-weight: 700; text-align: right; font-size: 15px;">${amount} ${currency}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280; font-size: 13px;">Transaction ID:</td>
          <td style="padding: 8px 0; color: #14181F; font-family: monospace; font-size: 12px; text-align: right;">${transactionId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280; font-size: 13px;">Date:</td>
          <td style="padding: 8px 0; color: #4A5160; text-align: right; font-size: 13px;">${date}</td>
        </tr>
      </table>

      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
          Open Dashboard →
        </a>
      </div>
    `;

  const emailTitle = isAr ? 'إيصال دفع اشتراك JobMatch AI' : 'Payment Receipt - JobMatch AI';
  return emailWrapper(content, (language as any) || 'en', emailTitle);
}

export interface SubscriptionAlertEmailProps extends TemplateBaseProps {
  type: 'payment_failed' | 'subscription_ended' | 'expiring_soon';
  daysLeft?: number;
}

export function getSubscriptionAlertEmailHtml({
  name = 'Valued Customer',
  type,
  daysLeft = 3,
  language = 'en',
}: SubscriptionAlertEmailProps): string {
  const isAr = language === 'ar';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (type === 'payment_failed') {
    const content = isAr
      ? `
        <h1 style="color: #9A5B00; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">تنبيه: تعذر تجديد اشتراك JobMatch Pro ⚠️</h1>
        <p style="margin: 0 0 20px 0; color: #4A5160;">
          مرحباً ${name}، تعذر خصم رسوم تجديد اشتراك باقة Pro الخاصة بك. يرجى تحديث وسيلة الدفع من خلال بوابة إدارة الاشتراك لتجنب توقف المزايا الاحترافية.
        </p>
        <div style="text-align: center; margin: 28px 0 12px 0;">
          <a href="${appUrl}/dashboard?tab=settings" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
            إدارة الاشتراك وتحديث الدفع ←
          </a>
        </div>
      `
      : `
        <h1 style="color: #9A5B00; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">Action Required: Subscription Payment Failed ⚠️</h1>
        <p style="margin: 0 0 20px 0; color: #4A5160;">
          Hi ${name}, we were unable to process the renewal payment for your JobMatch Pro subscription. Please update your payment method in the Billing Portal to keep your Pro features active.
        </p>
        <div style="text-align: center; margin: 28px 0 12px 0;">
          <a href="${appUrl}/dashboard?tab=settings" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
            Manage Subscription →
          </a>
        </div>
      `;
    return emailWrapper(
      content,
      (language as any) || 'en',
      isAr ? 'تنبيه دفع اشتراك JobMatch AI' : 'Subscription Payment Failed - JobMatch AI'
    );
  }

  if (type === 'expiring_soon') {
    const content = isAr
      ? `
        <h1 style="color: #9A5B00; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">تنبيه: اشتراك JobMatch Pro ينتهي خلال ${daysLeft} أيام ⏳</h1>
        <p style="margin: 0 0 20px 0; color: #4A5160;">
          مرحباً ${name}، نود تذكيرك بأن صلاحية باقة JobMatch Pro الخاصة بك ستنتهي خلال ${daysLeft} أيام. يمكنك تجديد اشتراكك في أي وقت للحفاظ على التوليد غير المحدود وجميع القوالب.
        </p>
        <div style="text-align: center; margin: 28px 0 12px 0;">
          <a href="${appUrl}/pricing" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
            تجديد الاشتراك الآن ←
          </a>
        </div>
      `
      : `
        <h1 style="color: #9A5B00; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">Reminder: Your Pro Plan Expires in ${daysLeft} Days ⏳</h1>
        <p style="margin: 0 0 20px 0; color: #4A5160;">
          Hi ${name}, your JobMatch Pro access is scheduled to expire in ${daysLeft} days. Renew anytime to keep unlimited AI generations and all templates unlocked.
        </p>
        <div style="text-align: center; margin: 28px 0 12px 0;">
          <a href="${appUrl}/pricing" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
            Renew Pro Plan →
          </a>
        </div>
      `;
    return emailWrapper(
      content,
      (language as any) || 'en',
      isAr ? 'تذكير بقرب انتهاء اشتراك JobMatch Pro' : 'Pro Plan Expiring Soon - JobMatch AI'
    );
  }

  const content = isAr
    ? `
      <h1 style="color: #14181F; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">تم إنهاء اشتراك JobMatch Pro</h1>
      <p style="margin: 0 0 20px 0; color: #4A5160;">
        مرحباً ${name}، تم إنهاء اشتراكك في باقة JobMatch Pro وتحويل حسابك إلى الباقة المجانية (Free). يمكنك إعادة الاشتراك في أي وقت من صفحة الأسعار.
      </p>
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="${appUrl}/pricing" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
          عرض الباقات ←
        </a>
      </div>
    `
    : `
      <h1 style="color: #14181F; font-size: 22px; font-weight: 700; margin: 0 0 16px 0;">Your JobMatch Pro Subscription Has Ended</h1>
      <p style="margin: 0 0 20px 0; color: #4A5160;">
        Hi ${name}, your JobMatch Pro subscription has ended and your account has been moved to the Free plan. You can upgrade again at any time.
      </p>
      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="${appUrl}/pricing" style="display: inline-block; background-color: #0F5C4D; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px;">
          View Plans →
        </a>
      </div>
    `;
  return emailWrapper(
    content,
    (language as any) || 'en',
    isAr ? 'انتهاء اشتراك JobMatch Pro' : 'Subscription Ended - JobMatch AI'
  );
}

export default sendEmail;
