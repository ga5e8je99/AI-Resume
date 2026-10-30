'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { ChevronDown } from 'lucide-react';

export default function TermsOfService() {
  const { language, isRtl } = useLanguage();
  const isAr = language === 'ar';
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@jobmatch.ai';

  const sections = [
    { id: 'acceptance', title: isAr ? '1. قبول الشروط والأحكام' : '1. Acceptance of Terms' },
    { id: 'services', title: isAr ? '2. خدمات المنصة ومحرر السير' : '2. Platform Services' },
    { id: 'subscriptions', title: isAr ? '3. الاشتراكات والدفع وسياسة الاسترجاع' : '3. Subscriptions, Payments & Refunds' },
    { id: 'ai-disclaimer', title: isAr ? '4. إخلاء المسؤولية عن محتوى الذكاء الاصطناعي' : '4. AI Content Disclaimer' },
    { id: 'user-responsibilities', title: isAr ? '5. مسؤوليات المستخدم والاستخدام المقبول' : '5. Acceptable Use' },
    { id: 'contact', title: isAr ? '6. التواصل والدعم القانوني' : '6. Contact Information' },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between selection:bg-accent-soft selection:text-ink" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar />

      <main id="main-content" className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12 md:py-20 w-full">
        {/* Document Header */}
        <div className="max-w-[680px] mx-auto text-start pb-8 border-b border-line mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
            {isAr ? 'الاتفاقية القانونية' : 'Legal Agreement'}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-ink tracking-tight mt-2 mb-3">
            {isAr ? 'شروط الاستخدام والخدمة' : 'Terms of Service'}
          </h1>
          <p className="text-xs font-mono text-ink-3">
            {isAr ? 'تاريخ التحديث: 2026-10-25 • المعيار: ISO 8601' : 'Last updated: 2026-10-25 • Version 2.1'}
          </p>
        </div>

        {/* Mobile "On this page" Collapsed Dropdown (<lg) */}
        <div className="lg:hidden max-w-[680px] mx-auto mb-8">
          <details className="group rounded-[8px] border border-line bg-surface p-3.5 transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-mono font-semibold uppercase text-ink select-none">
              <span>{isAr ? 'في هذه الصفحة (فهرس البنود)' : 'On this page (Table of Contents)'}</span>
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
                {isAr ? 'فهرس البنود' : 'Table of Contents'}
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
            <section id="acceptance" className="space-y-4 pt-2">
              <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
                {isAr ? '1. قبول الشروط والأحكام' : '1. Acceptance of Terms'}
              </h2>
              <p>
                {isAr
                  ? 'من خلال استخدامك لمنصة JobMatch AI أو إنشاء حساب أو استخدام أدوات فحص وتوليد السير الذاتية، فإنك تقر بأنك قرأت وفهمت ووافقت على الالتزام بجميع بنود هذه الاتفاقية. إذا كنت لا توافق على هذه الشروط، يُرجى التوقف عن استخدام المنصة.'
                  : 'By accessing JobMatch AI, creating an account, or using our resume diagnostics, CV builder, or cover letter tools, you agree to be bound by these Terms of Service. If you disagree with any portion of these terms, please discontinue using the service.'}
              </p>
            </section>

            {/* Section 2 */}
            <section id="services" className="space-y-4 pt-2">
              <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
                {isAr ? '2. خدمات المنصة (محرر السير الذاتية ومولد خطابات التقديم)' : '2. Platform Services'}
              </h2>
              <p>
                {isAr
                  ? 'توفر المنصة أدوات متخصصة لصياغة وثائق التقديم على الوظائف:'
                  : 'JobMatch AI provides software tools designed to assist in career documentation:'}
              </p>
              <ul className="space-y-3 ps-4 border-s-2 border-line">
                <li>
                  <strong className="text-ink">{isAr ? 'محرر السير الذاتية (CV Builder):' : 'Resume & CV Builder:'}</strong>{' '}
                  {isAr
                    ? 'يوفر نماذج متوافقة مع أنظمة تتبع المتقدمين (ATS) مع تصدير متجهي بصيغ A4 و US Letter و Word. تقع مسؤولية صحة ودقة البيانات المدخلة على المستخدم وحده.'
                    : 'Provides structured single and two-column layouts formatted for applicant tracking systems, supporting A4, US Letter, and DOCX exports. You are responsible for the truthfulness of all entered information.'}
                </li>
                <li>
                  <strong className="text-ink">{isAr ? 'توليد خطابات التقديم (Cover Letter):' : 'Cover Letter Generator:'}</strong>{' '}
                  {isAr
                    ? 'أداة مساعدة مدعومة بالذكاء الاصطناعي تقترح صياغات للفقرات بناءً على متطلبات الوظيفة وخبراتك.'
                    : 'An assistive tool generating custom paragraphs tailored to specific job specifications.'}
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="subscriptions" className="space-y-4 pt-2">
              <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
                {isAr ? '3. خطط الاشتراك والدفع وسياسة الاسترجاع' : '3. Subscriptions, Payments & Refunds'}
              </h2>
              <div className="space-y-3">
                <p>
                  <strong className="text-ink">{isAr ? 'الفوترة:' : 'Billing:'}</strong>{' '}
                  {isAr
                    ? 'يتم تجديد اشتراك باقة برو شهرياً أو سنوياً بشكل تلقائي حتى تقوم بإلغائه من لوحة التحكم.'
                    : 'Pro subscriptions renew automatically on a recurring monthly or annual basis until canceled via your account dashboard.'}
                </p>
                <p>
                  <strong className="text-ink">{isAr ? 'سياسة الاسترجاع (14 يوماً):' : '14-Day Refund Policy:'}</strong>{' '}
                  {isAr
                    ? 'يحق للمشتركين الجدد في باقة برو طلب استرداد كامل المبلغ المدفوع خلال 14 يوماً من تاريخ الاشتراك الأول في حال عدم رضاهم عن الخدمة، بشرط عدم استهلاك الخدمة بأعداد غير معتادة.'
                    : 'First-time Pro subscribers are entitled to a full refund within 14 days of purchase upon contacting support, provided usage has remained within standard personal parameters.'}
                </p>
                <p>
                  <strong className="text-ink">{isAr ? 'رصيد الدفع حسب الاستخدام:' : 'Pay-As-You-Go Credits:'}</strong>{' '}
                  {isAr
                    ? 'نقاط باقة الدفع حسب الاستخدام صالحة مدى الحياة ولا تنتهي صلاحيتها.'
                    : 'Credits purchased under the Pay-As-You-Go plan have lifetime validity and do not expire.'}
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="ai-disclaimer" className="space-y-4 pt-2">
              <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
                {isAr ? '4. إخلاء المسؤولية عن محتوى الذكاء الاصطناعي ونتائج التوظيف' : '4. AI Content & Hiring Outcome Disclaimer'}
              </h2>
              <div className="p-4 rounded-[8px] border border-line bg-surface text-xs sm:text-sm text-ink-2 space-y-2">
                <p className="font-semibold text-ink">
                  {isAr ? 'تنبيه مهني هام:' : 'Important Employment Disclaimer:'}
                </p>
                <p className="leading-relaxed">
                  {isAr
                    ? 'تُعد مخرجات الذكاء الاصطناعي مسودات مساعدة واقتراحات تتطلب المراجعة والتحقق البشري من قبلك قبل التقديم. لا تقدم منصة JobMatch AI أي تعهدات أو ضمانات صريحة أو ضمنية بقبول وظيفي أو اجتياز مقابلة معينة.'
                    : 'Outputs generated by our AI tools serve as draft suggestions and require human review. JobMatch AI makes no representations, warranties, or guarantees regarding interview invitations, hiring decisions, or employment outcomes.'}
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="user-responsibilities" className="space-y-4 pt-2">
              <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
                {isAr ? '5. مسؤوليات المستخدم والاستخدام المقبول' : '5. Acceptable Use'}
              </h2>
              <p>
                {isAr
                  ? 'يلتزم المستخدم بعدم استخدام المنصة لأي أغراض غير قانونية، أو استخراج البيانات آلياً (Scraping)، أو محاولة اختراق البنية التحتية، أو انتحال هويات مهنية زائفة.'
                  : 'You agree not to misuse the service, reverse engineer our parsers, perform unauthorized automated scraping, or misrepresent third-party identities.'}
              </p>
            </section>

            {/* Section 6 */}
            <section id="contact" className="space-y-4 pt-2 border-t border-line">
              <h2 className="font-serif text-2xl font-semibold text-ink tracking-tight">
                {isAr ? '6. التواصل والدعم القانوني' : '6. Contact Information'}
              </h2>
              <p>
                {isAr
                  ? 'لأي استفسارات قانونية أو متعلقة بسياسة الاسترجاع والاشتراكات، يمكنك مراسلتنا مباشرة على:'
                  : 'For legal questions, refund claims, or subscription assistance, please reach out to:'}
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