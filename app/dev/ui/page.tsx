'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Dialog,
  Tabs,
  Tooltip,
  Toast,
  Skeleton,
  SkeletonCard,
  EmptyState,
  ProgressBar,
  Stepper,
  Accordion,
  Dropzone,
  SegmentedControl,
} from '@/components/ui';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Search,
  Check,
  AlertCircle,
  FileText,
  Trash2,
  Download,
  Upload,
  Globe,
  Sun,
  Moon,
  Info,
} from 'lucide-react';

export default function DevUiPage() {
  // Visual QA overrides
  const [qaLang, setQaLang] = useState<'en' | 'ar'>('en');
  const [qaTheme, setQaTheme] = useState<'dark' | 'light'>('dark');

  // Interactive component states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activePillTab, setActivePillTab] = useState('all');
  const [activeStep, setActiveStep] = useState(1);
  const [segmentedVal, setSegmentedVal] = useState('monthly');
  const [toastItem, setToastItem] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  } | null>(null);

  const isRtl = qaLang === 'ar';

  const toggleLanguage = () => {
    setQaLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const toggleTheme = () => {
    setQaTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div
      data-theme={qaTheme}
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] bg-paper text-ink transition-colors duration-200 p-4 sm:p-8 lg:p-12 font-sans selection:bg-brand-soft selection:text-brand"
    >
      {/* Toast Notification Container */}
      {toastItem && (
        <Toast
          type={toastItem.type}
          message={toastItem.message}
          onClose={() => setToastItem(null)}
        />
      )}

      {/* Floating QA Control Toolbar */}
      <header className="sticky top-4 z-elevated max-w-6xl mx-auto mb-10 p-4 rounded-xl border border-line-strong bg-surface backdrop-blur-md shadow-elevated flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold font-serif">JobMatch AI Component Lab</h1>
              <Badge variant="accent" size="sm">
                /dev/ui
              </Badge>
            </div>
            <p className="text-xs -ink-2">
              Design system QA playground • Live token & component inspection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Language Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            leftIcon={<Globe className="w-3.5 h-3.5" />}
          >
            {isRtl ? 'English (LTR)' : 'العربية (RTL)'}
          </Button>

          {/* Quick Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            leftIcon={
              qaTheme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-warning" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-brand" />
              )
            }
          >
            {qaTheme === 'dark' ? 'Light Theme' : 'Dark Theme'}
          </Button>

          <Link href="/">
            <Button variant="ghost" size="sm">
              {isRtl ? 'الرئيسية' : 'App Home'}
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-16">
        {/* ===================================================================== */}
        {/* 1. DESIGN TOKENS & COLOR PALETTE                                      */}
        {/* ===================================================================== */}
        <section className="space-y-6">
          <div className="border-b -line-strong pb-3">
            <h2 className="text-xl font-bold font-serif -ink">
              1. Design Tokens & Elevation Layers
            </h2>
            <p className="text-xs -ink-2 mt-1">
              Background canvas, surfaces, elevated layers, and status palettes
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border -line-strong -paper text-start shadow-subtle space-y-2">
              <span className="text-xs font-mono -ink-2">bg / paper</span>
              <p className="text-sm font-semibold">Canvas Layer</p>
              <div className="text-[11px] -ink-2 font-mono">var(--bg)</div>
            </div>

            <div className="p-4 rounded-lg border -line-strong bg-surface text-start shadow-subtle space-y-2">
              <span className="text-xs font-mono -ink-2">surface</span>
              <p className="text-sm font-semibold">Card Surface</p>
              <div className="text-[11px] -ink-2 font-mono">var(--surface)</div>
            </div>

            <div className="p-4 rounded-lg border -line-strong bg-surface-2 text-start shadow-subtle space-y-2">
              <span className="text-xs font-mono -ink-2">surface-2</span>
              <p className="text-sm font-semibold">Subtle Fill</p>
              <div className="text-[11px] -ink-2 font-mono">var(--surface-2)</div>
            </div>

            <div className="p-4 rounded-lg border -line-strong bg-elevated text-start shadow-elevated space-y-2">
              <span className="text-xs font-mono -ink-2">elevated</span>
              <p className="text-sm font-semibold">Floating Layer</p>
              <div className="text-[11px] -ink-2 font-mono">var(--elevated)</div>
            </div>
          </div>

          {/* Brand & Accent Tokens */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-brand/30 bg-brand-soft text-start space-y-1">
              <span className="text-xs font-mono text-brand">brand-soft</span>
              <p className="text-sm font-semibold text-brand">Deep Pine Jade Soft</p>
              <div className="text-[11px] text-brand/80 font-mono">var(--brand-soft)</div>
            </div>
            <div className="p-4 rounded-lg bg-brand text-on-brand text-start shadow-subtle space-y-1">
              <span className="text-xs font-mono opacity-80">brand</span>
              <p className="text-sm font-semibold">Brand Primary</p>
              <div className="text-[11px] opacity-80 font-mono">var(--brand)</div>
            </div>
            <div className="p-4 rounded-lg border border-highlight/30 bg-highlight-soft text-start space-y-1">
              <span className="text-xs font-mono text-highlight">highlight-soft</span>
              <p className="text-sm font-semibold text-highlight">Amber Highlight Soft</p>
              <div className="text-[11px] text-highlight/80 font-mono">var(--highlight-soft)</div>
            </div>
            <div className="p-4 rounded-lg bg-highlight text-white text-start shadow-subtle space-y-1">
              <span className="text-xs font-mono opacity-80">highlight</span>
              <p className="text-sm font-semibold">Amber Highlight</p>
              <div className="text-[11px] opacity-80 font-mono">var(--highlight)</div>
            </div>
          </div>

          {/* Semantic Status Colors */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="p-3 rounded-md bg-brand-soft border border-brand/20 text-brand text-xs font-medium">
              Brand / Accent
            </div>
            <div className="p-3 rounded-md bg-success-soft border border-success/20 text-success text-xs font-medium">
              Success / Verified
            </div>
            <div className="p-3 rounded-md bg-warning-soft border border-warning/20 text-warning text-xs font-medium">
              Warning / Caution
            </div>
            <div className="p-3 rounded-md bg-danger-soft border border-danger/20 text-danger text-xs font-medium">
              Danger / Error
            </div>
            <div className="p-3 rounded-md bg-info-soft border border-info/20 text-info text-xs font-medium">
              Info / Notice
            </div>
            <div className="p-3 rounded-md bg-surface border-2 border-focus -ink text-xs font-medium">
              Focus Ring (2px)
            </div>
          </div>

          {/* Radii & Elevation Scale */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-md border -line-strong bg-surface shadow-subtle text-start space-y-1">
              <span className="text-xs font-mono -ink-2">radius-md (6px)</span>
              <p className="text-xs font-semibold -ink">shadow-subtle</p>
            </div>
            <div className="p-4 rounded-lg border -line-strong bg-surface shadow-card text-start space-y-1">
              <span className="text-xs font-mono -ink-2">radius-lg (10px)</span>
              <p className="text-xs font-semibold -ink">shadow-card</p>
            </div>
            <div className="p-4 rounded-xl border -line-strong bg-surface shadow-elevated text-start space-y-1">
              <span className="text-xs font-mono -ink-2">radius-xl (14px)</span>
              <p className="text-xs font-semibold -ink">shadow-elevated</p>
            </div>
            <div className="p-4 rounded-2xl border border-brand/30 bg-surface shadow-glow text-start space-y-1">
              <span className="text-xs font-mono text-brand">radius-2xl (20px)</span>
              <p className="text-xs font-semibold text-brand">shadow-glow</p>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 2. TYPOGRAPHY SCALE                                                   */}
        {/* ===================================================================== */}
        <section className="space-y-6">
          <div className="border-b -line-strong pb-3">
            <h2 className="text-xl font-bold font-serif -ink">
              2. Typography Hierarchy (Inter & IBM Plex Sans Arabic + Newsreader)
            </h2>
            <p className="text-xs -ink-2 mt-1">
              Fluid clamps, proportional leading, and bidirectional support
            </p>
          </div>

          <div className="p-6 rounded-lg border -line-strong bg-surface space-y-6 text-start">
            <div>
              <span className="text-xs font-mono -ink-2 uppercase">.font-display</span>
              <p className="font-display -ink mt-1">
                {isRtl ? 'سيرة ذاتية متميزة تلفت الأنظار' : 'A resume that gets read.'}
              </p>
            </div>

            <div>
              <span className="text-xs font-mono -ink-2 uppercase">h1 / .font-h1</span>
              <h1 className="mt-1">
                {isRtl ? 'العنوان الرئيسي للصفحات والمستندات' : 'Headline Level 1: Primary Section'}
              </h1>
            </div>

            <div>
              <span className="text-xs font-mono -ink-2 uppercase">h2 / .font-h2</span>
              <h2 className="mt-1">
                {isRtl ? 'العنوان الثانوي للمجموعات' : 'Headline Level 2: Section Breakdown'}
              </h2>
            </div>

            <div>
              <span className="text-xs font-mono -ink-2 uppercase">h3 / .font-h3</span>
              <h3 className="mt-1">
                {isRtl ? 'العنوان الفرعي للبطاقات' : 'Headline Level 3: Card Subheading'}
              </h3>
            </div>

            <div>
              <span className="text-xs font-mono -ink-2 uppercase">.font-body</span>
              <p className="font-body -ink-2 mt-1">
                {isRtl
                  ? 'بنية المستند مصممة بدقة لتتوافق مع أنظمة التوظيف الآلية (ATS)، مع توفير محاذاة تلقائية واتصال سلس بين الأقسام دون تعقيد.'
                  : 'Document layouts are mathematically spaced for parsing accuracy across enterprise ATS parsers, providing legible margins and zero layout distortions.'}
              </p>
            </div>

            <div>
              <span className="text-xs font-mono -ink-2 uppercase">.font-caption</span>
              <p className="font-caption -ink-2 mt-1">
                {isRtl ? 'ملاحظة توضيحية: تدعم الأرقام التجدولية 2026-10-27' : 'Caption: Tabular figures enabled 2026-10-27 • 98.5% match score'}
              </p>
            </div>

            {/* JetBrains Mono ATS Numbers & Keywords Specimen */}
            <div className="pt-4 border-t -line-strong">
              <span className="text-xs font-mono text-brand uppercase">.font-mono / JetBrains Mono (ATS Numbers & Metrics)</span>
              <div className="flex flex-wrap items-center gap-4 mt-2 font-mono">
                <span className="text-2xl font-bold text-success tabular-nums">96.8%</span>
                <span className="text-sm px-2.5 py-1 rounded bg-surface-2 border -line-strong -ink-2">
                  ATS_SCORE: 94/100
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-brand-soft text-brand font-medium">
                  KEYWORD_DENSITY: 14.2%
                </span>
                <span className="text-xs -ink-2">
                  ISO-8601: 2026-10-28T01:30:00Z
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 3. BUTTONS                                                            */}
        {/* ===================================================================== */}
        <section className="space-y-6">
          <div className="border-b -line-strong pb-3">
            <h2 className="text-xl font-bold font-serif -ink">
              3. Button Components & States
            </h2>
            <p className="text-xs -ink-2 mt-1">
              Variants, sizes, loading spinners, disabled states, and icon alignment
            </p>
          </div>

          <div className="space-y-6 p-6 rounded-lg border -line-strong bg-surface">
            {/* Variants */}
            <div>
              <h4 className="text-xs font-semibold -ink-2 uppercase mb-3">Variants</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">{isRtl ? 'زر أساسي' : 'Primary Button'}</Button>
                <Button variant="secondary">{isRtl ? 'زر ثانوي' : 'Secondary'}</Button>
                <Button variant="outline">{isRtl ? 'زر إطار' : 'Outline'}</Button>
                <Button variant="ghost">{isRtl ? 'زر شفاف' : 'Ghost'}</Button>
                <Button variant="highlight">{isRtl ? 'زر تمييز' : 'Highlight'}</Button>
                <Button variant="danger">{isRtl ? 'إجراء حرج' : 'Danger Action'}</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-xs font-semibold -ink-2 uppercase mb-3">Sizes</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">
                  {isRtl ? 'صغير (32px)' : 'Small (32px)'}
                </Button>
                <Button variant="primary" size="md">
                  {isRtl ? 'متوسط (40px)' : 'Medium (40px)'}
                </Button>
                <Button variant="primary" size="lg">
                  {isRtl ? 'كبير (48px)' : 'Large (48px)'}
                </Button>
              </div>
            </div>

            {/* States & Icons */}
            <div>
              <h4 className="text-xs font-semibold -ink-2 uppercase mb-3">States & Icons</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" isLoading>
                  {isRtl ? 'جاري التحميل...' : 'Loading State'}
                </Button>
                <Button variant="primary" disabled>
                  {isRtl ? 'معطل' : 'Disabled'}
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  {isRtl ? 'تنزيل PDF' : 'Download PDF'}
                </Button>
                <Button
                  variant="outline"
                  rightIcon={<ArrowRight className="w-4 h-4 rtl:-scale-x-100" />}
                >
                  {isRtl ? 'متابعة الخطوة' : 'Next Step'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 4. FORM CONTROLS                                                      */}
        {/* ===================================================================== */}
        <section className="space-y-6">
          <div className="border-b -line-strong pb-3">
            <h2 className="text-xl font-bold font-serif -ink">
              4. Form Controls (Input, Textarea, Select)
            </h2>
            <p className="text-xs -ink-2 mt-1">
              Floating/clear labels, validation states, character counters, and logical addons
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-lg border -line-strong bg-surface">
            {/* Input Standard */}
            <Input
              label={isRtl ? 'البريد الإلكتروني' : 'Email Address'}
              placeholder="name@example.com"
              helperText={isRtl ? 'لن نشارك بريدك مع أي جهة خارجية.' : 'We will never share your email address.'}
              leftAddon={<Mail className="w-4 h-4" />}
              required
            />

            {/* Input with Error */}
            <Input
              label={isRtl ? 'كلمة المرور' : 'Password'}
              type="password"
              defaultValue="123"
              error={isRtl ? 'يجب ألا تقل كلمة المرور عن 8 أحرف.' : 'Password must contain at least 8 characters.'}
              leftAddon={<Lock className="w-4 h-4" />}
              required
            />

            {/* Select Dropdown */}
            <Select
              label={isRtl ? 'القالب الافتراضي' : 'Resume Template'}
              options={[
                { value: 'compact', label: isRtl ? 'مدمج رسمي (Compact ATS)' : 'Compact ATS' },
                { value: 'two-column', label: isRtl ? 'عمودان تقني (Two-Column)' : 'Two-Column Technical' },
                { value: 'executive', label: isRtl ? 'تنفيذي حديث (Modern Executive)' : 'Modern Executive' },
              ]}
              helperText={isRtl ? 'اختر القالب الأنسب لطبيعة دورك المهني.' : 'Select the optimal layout for your industry.'}
            />

            {/* Disabled Input */}
            <Input
              label={isRtl ? 'المعرف الفرعي (غير قابل للتعديل)' : 'Immutable System ID'}
              defaultValue="usr_live_891724"
              disabled
              helperText={isRtl ? 'تم قفل هذا الحقل لأغراض التوثيق.' : 'Field is locked for security compliance.'}
            />

            {/* Textarea with Character Counter */}
            <div className="md:col-span-2">
              <Textarea
                label={isRtl ? 'الوصف الوظيفي المستهدف' : 'Target Job Description'}
                placeholder={
                  isRtl
                    ? 'الصق متطلبات الوظيفة هنا لتحليل الكلمات المفتاحية...'
                    : 'Paste the target job specifications to extract relevant keywords...'
                }
                showCount
                maxLength={500}
                defaultValue={
                  isRtl
                    ? 'نبحث عن مهندس برمجيات أول لقيادة وتطوير البنية التحتية السحابية.'
                    : 'Looking for a Senior Backend Engineer to architect resilient cloud microservices.'
                }
                helperText={isRtl ? 'كلما كان الوصف أدق، كانت نتائج فحص الـ ATS أفضل.' : 'Longer descriptions yield higher keyword matching accuracy.'}
              />
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 5. CARDS & CONTAINERS                                                 */}
        {/* ===================================================================== */}
        <section className="space-y-6">
          <div className="border-b -line-strong pb-3">
            <h2 className="text-xl font-bold font-serif -ink">
              5. Card Containers
            </h2>
            <p className="text-xs -ink-2 mt-1">
              Surface, elevated, subtle, outline variants with interactive hover transforms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="surface" interactive>
              <CardHeader
                title={isRtl ? 'بطاقة تفاعلية' : 'Interactive Card'}
                subtitle={isRtl ? 'تأثير صعود خفيف' : 'Hover elevation lift'}
                action={<Badge variant="accent">Active</Badge>}
              />
              <CardBody>
                <p className="text-xs -ink-2 leading-relaxed">
                  {isRtl
                    ? 'بطاقة تعتمد نمط surface الافتراضي مع إمكانية النقر والتفاعل.'
                    : 'Default surface card with hover translation and elevated shadow depth.'}
                </p>
              </CardBody>
              <CardFooter>
                <span className="text-xs font-mono -ink-2">A4 Paper</span>
                <span className="text-xs text-brand font-semibold">View details →</span>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader
                title={isRtl ? 'بطاقة مرتفعة' : 'Elevated Card'}
                subtitle={isRtl ? 'طبقة عائمة مع ظل عميق' : 'Higher z-plane with card shadow'}
                action={<Badge variant="success">Passed</Badge>}
              />
              <CardBody>
                <p className="text-xs -ink-2 leading-relaxed">
                  {isRtl
                    ? 'مخصصة للنوافذ المنبثقة، والتقارير التشخيصية ذات الأهمية العالية.'
                    : 'Optimized for diagnostic modals, key metrics, and priority callouts.'}
                </p>
              </CardBody>
              <CardFooter>
                <span className="text-xs font-mono text-success font-semibold">92 / 100</span>
                <Badge variant="outline" size="sm">
                  ATS Verified
                </Badge>
              </CardFooter>
            </Card>

            <Card variant="subtle">
              <CardHeader
                title={isRtl ? 'بطاقة ناعمة' : 'Subtle Fill Card'}
                subtitle={isRtl ? 'خلفية surface-2 هادئة' : 'Muted fill background'}
              />
              <CardBody>
                <p className="text-xs -ink-2 leading-relaxed">
                  {isRtl
                    ? 'تُستخدم للقوائم الجانبية أو الجداول الإحصائية المجمعة.'
                    : 'Ideal for secondary sidebars, auxiliary stats, and metadata lists.'}
                </p>
              </CardBody>
              <CardFooter>
                <span className="text-xs -ink-2 font-mono">12 Sections</span>
                <span className="text-xs text-brand font-semibold">Edit</span>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 6. BADGES & STATUS PILLS                                              */}
        {/* ===================================================================== */}
        <section className="space-y-6">
          <div className="border-b -line-strong pb-3">
            <h2 className="text-xl font-bold font-serif -ink">
              6. Badges & Status Indicators
            </h2>
            <p className="text-xs -ink-2 mt-1">
              Semantic status tags with optional pulse/dot indicators
            </p>
          </div>

          <div className="p-6 rounded-lg border -line-strong bg-surface flex flex-wrap items-center gap-3">
            <Badge variant="default">{isRtl ? 'افتراضي' : 'Default'}</Badge>
            <Badge variant="brand" dot>
              {isRtl ? 'يشم زمردي' : 'Brand Pine'}
            </Badge>
            <Badge variant="highlight" dot>
              {isRtl ? 'كهرمان ذهبي' : 'Highlight Amber'}
            </Badge>
            <Badge variant="success" dot>
              {isRtl ? 'ناجح' : 'Passed ATS'}
            </Badge>
            <Badge variant="warning" dot>
              {isRtl ? 'تنبيه' : 'Review Needed'}
            </Badge>
            <Badge variant="danger" dot>
              {isRtl ? 'فشل' : 'Missing Field'}
            </Badge>
            <Badge variant="info" dot>
              {isRtl ? 'معلومة' : 'Information'}
            </Badge>
            <Badge variant="outline">{isRtl ? 'إطار فقط' : 'Outline Tag'}</Badge>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 7. NAVIGATION, TABS & STEPPERS                                        */}
        {/* ===================================================================== */}
        <section className="space-y-6">
          <div className="border-b -line-strong pb-3">
            <h2 className="text-xl font-bold font-serif -ink">
              7. Navigation, Tabs & Steppers
            </h2>
            <p className="text-xs -ink-2 mt-1">
              Underline & pill tab strips with keyboard arrows, plus multi-step workflows
            </p>
          </div>

          <div className="p-6 rounded-lg border -line-strong bg-surface space-y-8">
            {/* Underline Tabs */}
            <div>
              <h4 className="text-xs font-semibold -ink-2 uppercase mb-3">Underline Tabs</h4>
              <Tabs
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                  { id: 'overview', label: isRtl ? 'نظرة عامة' : 'Overview', count: 12 },
                  { id: 'keywords', label: isRtl ? 'الكلمات المفتاحية' : 'Keywords', count: 4 },
                  { id: 'formatting', label: isRtl ? 'تنسيق الخطوط' : 'Formatting' },
                ]}
              />
            </div>

            {/* Pill Tabs */}
            <div>
              <h4 className="text-xs font-semibold -ink-2 uppercase mb-3">Pill Tabs</h4>
              <Tabs
                variant="pills"
                activeTab={activePillTab}
                onChange={setActivePillTab}
                tabs={[
                  { id: 'all', label: isRtl ? 'الكل' : 'All Resumes' },
                  { id: 'cv', label: isRtl ? 'سير أكاديمية (CV)' : 'Full CV' },
                  { id: 'scans', label: isRtl ? 'فحوصات سابقة' : 'Saved Scans' },
                ]}
              />
            </div>

            {/* Segmented Control */}
            <div>
              <h4 className="text-xs font-semibold -ink-2 uppercase mb-3">Segmented Control</h4>
              <SegmentedControl
                value={segmentedVal}
                onChange={setSegmentedVal}
                options={[
                  { value: 'monthly', label: isRtl ? 'شهري' : 'Monthly' },
                  { value: 'annual', label: isRtl ? 'سنوي (وفر 22%)' : 'Annual (Save 22%)', badge: 'PRO' },
                ]}
              />
            </div>

            {/* Stepper Component */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold -ink-2 uppercase">Interactive Stepper</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeStep <= 0}
                    onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={activeStep >= 2}
                    onClick={() => setActiveStep((prev) => Math.min(2, prev + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>

              <Stepper
                activeStep={activeStep}
                onStepClick={setActiveStep}
                steps={[
                  {
                    title: isRtl ? 'رفع المستند' : 'Upload Document',
                    description: isRtl ? 'استخراج النصوص الآلي' : 'In-browser PDF text extraction',
                  },
                  {
                    title: isRtl ? 'فحص ومطابقة ATS' : 'Match Diagnostics',
                    description: isRtl ? 'مطابقة الكلمات مع الوصف' : 'Analyze structure and keyword presence',
                  },
                  {
                    title: isRtl ? 'تصدير واعتماد' : 'Export Vector PDF',
                    description: isRtl ? 'تحميل سيرة ذاتية جاهزة' : 'Produce verified clean document',
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 8. PROGRESS, SKELETON & TOAST                                         */}
        {/* ===================================================================== */}
        <section className="space-y-6">
          <div className="border-b -line-strong pb-3">
            <h2 className="text-xl font-bold font-serif -ink">
              8. Progress, Skeletons & Toast Notifications
            </h2>
            <p className="text-xs -ink-2 mt-1">
              Visual feedback, loading states, and accessible toasts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-lg border -line-strong bg-surface">
            {/* Progress Bars */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold -ink-2 uppercase">Progress Bars</h4>
              <ProgressBar
                value={88}
                variant="brand"
                label={isRtl ? 'درجة التوافق العامة' : 'Overall Match Score'}
                showValue
              />
              <ProgressBar
                value={95}
                variant="success"
                label={isRtl ? 'سلامة بيانات الاتصال' : 'Contact Integrity'}
                showValue
              />
              <ProgressBar
                value={78}
                variant="highlight"
                label={isRtl ? 'مطابقة الكلمات المفتاحية' : 'Keyword Match Density'}
                showValue
              />
              <ProgressBar
                value={60}
                variant="warning"
                label={isRtl ? 'الأفعال القيادية والكمية' : 'Quantified Metrics'}
                showValue
              />
              <ProgressBar
                value={25}
                variant="danger"
                label={isRtl ? 'الكلمات المفتاحية المفقودة' : 'Missing Skills'}
                showValue
              />
            </div>

            {/* Skeleton Loaders */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold -ink-2 uppercase">Skeleton Shimmer</h4>
              <SkeletonCard />
            </div>

            {/* Toast Triggers */}
            <div className="md:col-span-2 pt-4 border-t -line-strong">
              <h4 className="text-xs font-semibold -ink-2 uppercase mb-3">Live Toast Triggers</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setToastItem({
                      type: 'success',
                      message: isRtl ? 'تم حفظ التعديلات سحابياً بنجاح.' : 'Document changes synced to cloud successfully.',
                    })
                  }
                >
                  Trigger Success Toast
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setToastItem({
                      type: 'warning',
                      message: isRtl ? 'تنبيه: يوجد نقص في الكلمات المفتاحية.' : 'Notice: 3 required keywords missing from resume.',
                    })
                  }
                >
                  Trigger Warning Toast
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setToastItem({
                      type: 'error',
                      message: isRtl ? 'فشل الاتصال: يرجى التحقق من الشبكة.' : 'Connection failed: could not reach remote server.',
                    })
                  }
                >
                  Trigger Error Toast
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 9. MODALS, TOOLTIPS & EMPTY STATES                                    */}
        {/* ===================================================================== */}
        <section className="space-y-6">
          <div className="border-b -line-strong pb-3">
            <h2 className="text-xl font-bold font-serif -ink">
              9. Overlays & Empty States
            </h2>
            <p className="text-xs -ink-2 mt-1">
              Focus-trapped dialogs, directional tooltips, and zero-data states
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-lg border -line-strong bg-surface flex flex-wrap items-center gap-4">
              <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
                {isRtl ? 'فتح نافذة الحوار (Modal)' : 'Open Accessible Dialog'}
              </Button>

              {/* Tooltip demos */}
              <Tooltip content={isRtl ? 'تصدير سيرة متوافقة مع ATS' : 'Standard ATS vector export'} position="top">
                <Button variant="outline" size="sm">
                  Tooltip Top
                </Button>
              </Tooltip>

              <Tooltip content={isRtl ? 'حفظ تلقائي كل 4 ثوانٍ' : 'Autosaved locally'} position="bottom">
                <Button variant="outline" size="sm">
                  Tooltip Bottom
                </Button>
              </Tooltip>
            </div>

            {/* EmptyState Component Preview */}
            <EmptyState
              title={isRtl ? 'لا توجد سير ذاتية محفوظة بعد' : 'No resumes created yet'}
              description={
                isRtl
                  ? 'ابدأ ببناء سيرتك الأولى الآن باستخدام محرر JobMatch الذكي أو افحص ملفاً موجوداً.'
                  : 'Get started by building your first ATS-friendly resume or scan an existing document.'
              }
              actionLabel={isRtl ? 'إنشاء سيرة جديدة' : 'Build First Resume'}
              onAction={() => alert('EmptyState action clicked')}
              secondaryActionLabel={isRtl ? 'استيراد JSON' : 'Import JSON'}
              onSecondaryAction={() => alert('Secondary action clicked')}
            />
          </div>
        </section>
      </main>

      {/* Modal Instance */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={isRtl ? 'تأكيد تصدير السيرة الذاتية' : 'Confirm Document Export'}
        description={
          isRtl
            ? 'سيتم إنشاء ملف PDF عالي الدقة موجه بمقاس A4 القياسي المتوافق مع برامج التوظيف.'
            : 'A clean ISO A4 vector PDF will be generated and downloaded directly to your device.'
        }
      >
        <div className="space-y-4">
          <p className="text-sm -ink-2">
            {isRtl
              ? 'تأكد من مراجعة أرقام الهواتف وصيغة التواريخ قبل الإرسال لجهات العمل.'
              : 'Please ensure contact phone numbers, location, and dates are completely verified.'}
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t -line-strong">
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsDialogOpen(false);
                setToastItem({
                  type: 'success',
                  message: isRtl ? 'بدأ تنزيل ملف الـ PDF.' : 'PDF download initialized.',
                });
              }}
            >
              {isRtl ? 'تصدير وتحميل' : 'Export & Download'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
