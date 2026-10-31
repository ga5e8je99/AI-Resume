'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import Footer from '../components/Footer';
import { Shield, Lock, Server, CheckCircle2, ChevronDown } from 'lucide-react';

export default function PrivacyPolicy() {
  const { language, isRtl } = useLanguage();
  const isAr = language === 'ar';
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@jobmatch.ai';

  const sections = [
    { id: 'data-architecture', title: isAr ? '1. مسار ومعالجة البيانات' : '1. Data Architecture & Processing' },
    { id: 'collected-info', title: isAr ? '2. البيانات التي نجمعها' : '2. Information We Collect' },
    { id: 'third-parties', title: isAr ? '3. مزودو الخدمات والجهات الخارجية' : '3. Third-Party Service Providers' },
    { id: 'cookies-analytics', title: isAr ? '4. ملفات تعريف الارتباط والتحليلات' : '4. Cookies & Telemetry' },
    { id: 'retention-rights', title: isAr ? '5. حفظ البيانات وحقوق المستخدم' : '5. Data Retention & User Rights' },
    { id: 'contact', title: isAr ? '6. التواصل والاستفسارات' : '6. Contact & Inquiries' },
  ];

  return (
    <div className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between selection:bg-accent-soft selection:text-ink" dir={isRtl ? 'rtl' : 'ltr'}>
      <main id="main-content" className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12 md:py-20 w-full">
        {/* Document Header */}
        <div className="max-w-[680px] mx-auto text-start pb-8 border-b border-line mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
            {isAr ? 'الشفافية والخصوصية' : 'Legal & Compliance'}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-ink tracking-tight mt-2 mb-3">
            {isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy Policy & Data Practices'}
          </h1>
          <p className="text-xs font-mono text-ink-3">
            {isAr ? 'تاريخ التحديث: 2026-10-25 • المعيار: ISO 8601' : 'Last updated: 2026-10-25 • Version 2.1'}
          </p>
        </div>

        {/* Mobile "On this page" Collapsed Dropdown (<lg) */}
        <div className="lg:hidden max-w-[680px] mx-auto mb-8">
          <details className="group rounded-[8px] border border-line bg-surface p-3.5 transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-mono font-semibold uppercase text-ink select-none">
              <span>{isAr ? 'في هذه الصفحة (فهرس المحتويات)' : 'On this page (Table of Contents)'}</span>
              <ChevronDown className="w-4 h-4 text-ink-3 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <nav className="mt-3 pt-3 border-t border-line space-y-1 text-xs">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block py-1.5 px-2 rounded-[4px] text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors font-medium"
                >
                  {sec.title}
                </a>
              ))}
            </nav>
          </details>
        </div>

        {/* Layout: Sticky Table of Contents on Desktop (lg+) + 680px Reading Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start max-w-[1160px] mx-auto">
          {/* Left / Desktop Sticky TOC (4 cols) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 text-start">
            <div className="rounded-[8px] border border-line bg-surface p-5 space-y-3">
              <span className="text-[11px] font-mono uppercase font-semibold text-ink-3 tracking-wider block border-b border-line pb-2">
                {isAr ? 'فهرس المحتويات' : 'Table of Contents'}
              </span>
              <nav className="space-y-1 text-xs">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block py-1.5 px-2 rounded-[4px] text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors font-medium"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Right Reading Column (8 cols, max-w-[680px]) */}
          <article className="lg:col-span-8 max-w-[680px] w-full text-start space-y-12 text-ink-2 text-sm sm:text-base leading-relaxed">
            {/* Section 1 */}
            <section id="data-architecture" className="space-y-4 pt-2">
              <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
                {isAr ? '1. هندسة معالجة البيانات: ما يبقى محلياً وما يرسل للخادم' : '1. Data Architecture: Local vs. Server Data Flows'}
              </h2>
              <p>
                {isAr
                  ? 'نلتزم بالشفافية الكاملة فيما يتعلق بمسار بياناتك. تختلف معالجة البيانات بحسب الميزة التي تستخدمها:'
                  : 'We operate on a transparent architecture. Your career information is handled with clear boundaries depending on the tool you interact with:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="rounded-[8px] border border-line bg-surface p-4 shadow-subtle space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent font-mono">
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isAr ? 'فحص السيرة الذاتية (محلياً)' : 'CV Scanning (100% In-Browser)'}</span>
                  </div>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    {isAr
                      ? 'قراءة وتحليل ملفات PDF و DOCX و TXT تتم داخل متصفحك مباشرة عبر محرك التوزيع المحلي. لا يتم إرسال ملفاتك أو نصوصها إلى خوادمنا أثناء عمليات الفحص التشخيصي.'
                      : 'Extraction of PDF, DOCX, and text resumes executes locally within browser memory. No document files or parsed text are uploaded to our servers during direct diagnostic scans.'}
                  </p>
                </div>

                <div className="rounded-[8px] border border-line bg-surface p-4 shadow-subtle space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent font-mono">
                    <Server className="w-3.5 h-3.5" />
                    <span>{isAr ? 'توليد خطابات التقديم' : 'Cover Letter Generation'}</span>
                  </div>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    {isAr
                      ? 'عند توليد خطاب تقديم، يتم إرسال نصوص الوصف الوظيفي ومدخلاتك بشكل مشفر إلى مزود الذكاء الاصطناعي (OpenAI, gpt-4o-mini). تُستخدم هذه البيانات حصرياً لإنشاء الخطاب ولا تُستخدم لتدريب النماذج العامة.'
                      : 'When generating a tailored cover letter, the job description and input criteria you provide are transmitted via encrypted API to our AI provider (OpenAI, gpt-4o-mini). Inputs are processed ephemerally and are not used to train public models.'}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="collected-info" className="space-y-4 pt-2">
              <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
                {isAr ? '2. البيانات التي نجمعها ونخزنها' : '2. Information We Collect & Retain'}
              </h2>
              <p>
                {isAr
                  ? 'نقوم بجمع الحد الأدنى الضروري من البيانات لتقديم الخدمة ومتابعة اشتراكاتك:'
                  : 'We collect only the minimum required information to administer your account and process transactions:'}
              </p>
              <ul className="space-y-2.5 ps-4 border-s-2 border-line">
                <li>
                  <strong className="text-ink">{isAr ? 'بيانات الحساب:' : 'Account Credentials:'}</strong>{' '}
                  {isAr
                    ? 'الاسم الكامل وعنوان البريد الإلكتروني وكلمات المرور المشفرة بتجزئة bcrypt الآمنة.'
                    : 'Full name, email address, and cryptographically hashed passwords using bcrypt.'}
                </li>
                <li>
                  <strong className="text-ink">{isAr ? 'السير الذاتية المحفوظة:' : 'Cloud Saved Resumes:'}</strong>{' '}
                  {isAr
                    ? 'المحتوى المنظم للسيرة الذي تختاره أنت صراحة للنقر على "حفظ في السحابة" للوصول إليه لاحقاً، ويُخزن في قاعدة بيانات MongoDB المشفرة.'
                    : 'Structured resume data that you explicitly choose to save via "Save to Cloud", stored in our encrypted MongoDB datastore.'}
                </li>
                <li>
                  <strong className="text-ink">{isAr ? 'بيانات المعاملات:' : 'Billing Records:'}</strong>{' '}
                  {isAr
                    ? 'سجلات عمليات الشراء والاشتراكات عبر Stripe أو Paymob. نحن لا نطلع أو نخزن أرقام بطاقات الائتمان.'
                    : 'Subscription and token purchase records processed through Stripe or Paymob. We never store or inspect raw credit card numbers.'}
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="third-parties" className="space-y-4 pt-2">
              <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
                {isAr ? '3. معالجو البيانات والجهات الخارجية' : '3. Third-Party Service Providers'}
              </h2>
              <p>
                {isAr
                  ? 'نعتمد على مزودي بنية تحتية محددين ومعروفين بامتثالهم لأعلى معايير الأمان:'
                  : 'We work with reputable, specialized infrastructure vendors under strict data handling boundaries:'}
              </p>
              <div className="rounded-[8px] border border-line bg-surface p-4 text-xs space-y-3 font-mono">
                <div className="flex justify-between py-1 border-b border-line">
                  <span className="text-ink font-semibold">OpenAI (gpt-4o-mini)</span>
                  <span className="text-ink-3">Ephemeral LLM Generation</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line">
                  <span className="text-ink font-semibold">Stripe & Paymob</span>
                  <span className="text-ink-3">PCI-DSS Payment Gateways</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line">
                  <span className="text-ink font-semibold">MongoDB Atlas</span>
                  <span className="text-ink-3">Encrypted Cloud Datastore</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink font-semibold">Resend</span>
                  <span className="text-ink-3">Transactional Auth & Receipts</span>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="cookies-analytics" className="space-y-4 pt-2">
              <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
                {isAr ? '4. ملفات تعريف الارتباط والتحليلات' : '4. Cookies & Telemetry'}
              </h2>
              <p>
                {isAr
                  ? 'نستخدم ملفات تعريف ارتباط أساسية لجلسات تسجيل الدخول فقط. بالنسبة لتحليلات الاستخدام ومراقبة الأخطاء (PostHog و Sentry)، يتم حجبها تماماً حتى تمنح موافقتك الصريحة عبر شريط ملفات الارتباط، ولا تتضمن أبداً أي نصوص من سيرتك الذاتية أو بياناتك الشخصية.'
                  : 'We use strictly necessary cookies for session authentication. Operational telemetry (Sentry for error logs and PostHog for usage metrics) is consent-gated and strictly redacts PII, emails, tokens, and resume contents before dispatch.'}
              </p>
            </section>

            {/* Section 5 */}
            <section id="retention-rights" className="space-y-4 pt-2">
              <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
                {isAr ? '5. حفظ البيانات وحقوق المستخدم' : '5. Data Retention & User Rights'}
              </h2>
              <p>
                {isAr
                  ? 'يمكنك في أي وقت تصدير سيرك الذاتية أو حذف حسابك وجميع السجلات المرتبطة به مباشرة من لوحة التحكم أو بمراسلتنا.'
                  : 'You retain full ownership of your career data. You may download your documents in open formats or delete your account and all associated cloud records at any time from your account settings.'}
              </p>
            </section>

            {/* Section 6 */}
            <section id="contact" className="space-y-4 pt-2 border-t border-line">
              <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
                {isAr ? '6. التواصل والاستفسارات' : '6. Contact & Inquiries'}
              </h2>
              <p>
                {isAr
                  ? 'لأي استفسار بخصوص هذه السياسة أو لممارسة حقوقك، يمكنك التواصل معنا مباشرة على:'
                  : 'For privacy inquiries, data deletion requests, or questions regarding our processing practices, contact us at:'}
              </p>
              <div className="p-4 rounded-[6px] border border-line bg-surface font-mono text-sm text-accent">
                <a href={`mailto:${contactEmail}`} className="hover:underline">
                  {contactEmail}
                </a>
              </div>
            </section>
          </article>
        </div>
      </main>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}
