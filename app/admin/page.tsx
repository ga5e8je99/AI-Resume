'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/app/context/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  Users,
  FileText,
  ScanSearch,
  Award,
  TrendingUp,
  ShieldCheck,
  Search,
  Trash2,
  ExternalLink,
  RefreshCw,
  Download,
  Key,
  CheckCircle2,
  AlertCircle,
  Layout,
  Layers,
  ArrowRight,
  Filter,
  UserCheck,
  UserX,
  Sparkles,
  Rocket,
  Lightbulb,
  Palette,
  Briefcase,
  Bot,
  Zap,
  Globe,
  Share2,
  Code,
  DollarSign,
  Plus,
  Check,
  Clock,
  Star,
  FileCheck,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface RoadmapIdea {
  id: string;
  title: string;
  category: 'ai' | 'design' | 'jobs' | 'export' | 'business';
  categoryLabel: string;
  description: string;
  specs: string[];
  impact: 'عالي جداً' | 'عالي' | 'متوسط';
  effort: 'سريع (1-3 أيام)' | 'متوسط (1-2 أسبوع)' | 'كبير (شهر)';
  priority: 'urgent' | 'high' | 'medium';
  status: 'idea' | 'in-progress' | 'completed';
  badgeColor: string;
}

const DEFAULT_ROADMAP_IDEAS: RoadmapIdea[] = [
  {
    id: 'idea-cover-letter',
    title: 'مولد خطابات التقديم الذكي (AI Cover Letter Generator)',
    category: 'ai',
    categoryLabel: 'ذكاء اصطناعي',
    description: 'توليد خطابات تقديم مخصصة ومبهرة بنسبة 100% لأي إعلان وظيفي بنقرة زر واحدة بناءً على السيرة الذاتية واشتراطات الشركة.',
    specs: [
      'استخراج الكلمات المفتاحية التلقائي من نص أو رابط الوصف الوظيفي (Job Description).',
      'تحديد نبرة الخطاب (رسمي، تقني، قيادي، حماسي) مع إمكانية التوليد باللغتين العربية والإنجليزية.',
      'تنسيق مطابق وموازي لقالب الـ Resume المختار مع زر تصدير PDF مباشر ونسخ بنقرة واحدة.',
      'حفظ مسودات خطابات التغطية لكل شركة في قاعدة البيانات للرجوع إليها لاحقاً.',
    ],
    impact: 'عالي جداً',
    effort: 'متوسط (1-2 أسبوع)',
    priority: 'urgent',
    status: 'in-progress',
    badgeColor: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
  },
  {
    id: 'idea-auto-tailor-cv',
    title: 'التوليد والتعديل التلقائي الذكي للـ CV حسب الوظيفة (Auto-Tailored CV)',
    category: 'ai',
    categoryLabel: 'ذكاء اصطناعي',
    description: 'تكييف وإعادة صياغة السيرة الذاتية بالكامل لتتطابق بنسبة 95%+ مع أي شاغر وظيفي مستهدف دون الحاجة لإعادة كتابتها يدوياً.',
    specs: [
      'المستخدم يلصق رابط الوظيفة أو وصفها، فيقوم الذكاء الاصطناعي بإعادة صياغة نقاط الخبرة (Bullet Points).',
      'إبراز المهارات المتوافقة وسد فجوات الكلمات المفتاحية المفقودة تلقائياً في السيرة الذاتية.',
      'حساب النتيجة التقديرية للـ ATS قبل وبعد التطوير لإثبات الفارق للمستخدم.',
      'إمكانية حفظ نسخة مخصصة لكل شركة يتقدم إليها المستخدم (e.g., CV_Google, CV_Vodafone).',
    ],
    impact: 'عالي جداً',
    effort: 'متوسط (1-2 أسبوع)',
    priority: 'urgent',
    status: 'in-progress',
    badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  },
  {
    id: 'idea-job-aggregator',
    title: 'محرك جلب وتجميع الوظائف من كبرى المنصات (Real-Time Job Aggregator)',
    category: 'jobs',
    categoryLabel: 'سوق العمل والوظائف',
    description: 'تجميع مباشر للوظائف الشاغرة من أشهر المنصات (LinkedIn, Wuzzuf, Indeed, Bayt, Tanqeeb) مع حساب درجة المطابقة الفورية.',
    specs: [
      'سحب الوظائف اليومية وتصنيفها حسب الدولة (مصر، السعودية، الإمارات، والعمل عن بعد Remote).',
      'فحص تلقائي للمطابقة (Instant Match Score %): إظهار نسبة توافق الـ CV مع كل وظيفة معروضة.',
      'فلترة الوظائف التي يتجاوز معدل توافقها 80% ليتقدم إليها المستخدم فورياً.',
      'زر تقديم بضغطة واحدة مع السيرة الذاتية المحسنة تلقائياً.',
    ],
    impact: 'عالي جداً',
    effort: 'كبير (شهر)',
    priority: 'urgent',
    status: 'idea',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },
  {
    id: 'idea-mock-interview',
    title: 'محاكي المقابلات الشخصية الذكي (AI Mock Interviewer)',
    category: 'ai',
    categoryLabel: 'ذكاء اصطناعي',
    description: 'إجراء مقابلة تدريبية افتراضية مع الذكاء الاصطناعي تحاكي أسئلة الموارد البشرية والأسئلة التقنية لوظيفتك المستهدفة.',
    specs: [
      'توليد 5 إلى 10 أسئلة مخصصة بدقة بناءً على خبرات السيرة والوظيفة المستهدفة.',
      'إتاحة الإجابة بالصوت (Speech-to-Text) أو كتابة نصية مع مؤقت واقعي للضغط النفسي.',
      'تقييم فوري شامل لكل إجابة: درجة الثقة، وضوح الكلمات، المصطلحات، ونموذج STAR.',
      'تقديم الإجابة النموذجية المثلى لكل سؤال لتدريب المستخدم على أفضل طريقة للرد.',
    ],
    impact: 'عالي',
    effort: 'متوسط (1-2 أسبوع)',
    priority: 'high',
    status: 'idea',
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  },
  {
    id: 'idea-linkedin-optimizer',
    title: 'فاحص ومطور ملف LinkedIn الاحترافي (LinkedIn Profile Optimizer)',
    category: 'ai',
    categoryLabel: 'ذكاء اصطناعي',
    description: 'أداة ذكية لتحليل حساب لينكدإن وإعادة صياغة العناوين والنبذة الشخصية لزيادة فرص الظهور في بحث مسؤولي التوظيف (Recruiter Search).',
    specs: [
      'توليد صيغ احترافية للـ Headline لجذب مسؤولي التوظيف بالكلمات المفتاحية الأكثر طلباً.',
      'صياغة قسم النبذة التعريفية (About Section) بطريقة سردية مقنعة تلخص إنجازاتك بالأرقام.',
      'تحديد أفضل المهارات (Skills) التي يجب إضافتها لتصدر نتائج البحث في مجالك.',
    ],
    impact: 'عالي',
    effort: 'سريع (1-3 أيام)',
    priority: 'high',
    status: 'idea',
    badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  },
  {
    id: 'idea-drag-drop-builder',
    title: 'محرر بصري متطور بالسحب والإفلات (Visual Drag & Drop CV Builder)',
    category: 'design',
    categoryLabel: 'تصميم وتجربة المستخدم',
    description: 'تطوير واجهة بناء السيرة الذاتية لتكون تفاعلية كلياً مع إمكانية تحريك الأقسام وإعادة ترتيبها بالسحب والإفلات المباشر.',
    specs: [
      'إعادة ترتيب الأقسام (التعليم، الخبرات، المهارات، اللغات) وتغيير موضعها بالسحب المباشر.',
      'إمكانية التعديل المباشر داخل ورقة المعاينة الحية (Inline Editing).',
      'لوحة تحكم مرنة لتغيير الخطوط، المسافات، تباعد السطور، وألوان العناوين بحرية.',
      'تصميم أنيق فائق الجودة متوافق مع كافة أحجام الشاشات مع دعم كامل لخصائص RTL العربية.',
    ],
    impact: 'عالي جداً',
    effort: 'متوسط (1-2 أسبوع)',
    priority: 'urgent',
    status: 'in-progress',
    badgeColor: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
  },
  {
    id: 'idea-templates-gallery',
    title: 'حزمة قوالب عالمية معتمدة (Harvard & Modern ATS Gallery)',
    category: 'design',
    categoryLabel: 'تصميم وتجربة المستخدم',
    description: 'إضافة مكتبة تضم 10 قوالب جديدة مصممة بدقة لتلائم معايير كبرى الجامعات (هارفارد، ستانفورد) وأنظمة ATS العالمية.',
    specs: [
      'قالب Harvard Academic الكلاسيكي المفضل للوظائف الإدارية والاستشارية والمالية.',
      'قالب Modern Tech المتخصص لمهندسي البرمجيات والتقنيين مع تسليط الضوء على Stack و GitHub.',
      'قالب Creative Minimal للمصممين مع مظهر نظيف وبسيط يمرر الفحص الآلي بدون عقبات.',
      'خيارات متقدمة لتخصيص الألوان والسمات البصرية بنقرة واحدة.',
    ],
    impact: 'عالي',
    effort: 'سريع (1-3 أيام)',
    priority: 'high',
    status: 'idea',
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  {
    id: 'idea-public-portfolio-url',
    title: 'رابط ويب تفاعلي وبورتفوليو أونلاين بـ QR Code لكل مستخدم',
    category: 'design',
    categoryLabel: 'تصميم وتجربة المستخدم',
    description: 'تمكين المستخدم من نشر سيرته كصفحة ويب شخصية خاصة به برابط سريع وباركود QR لمشاركته مع مدراء التوظيف والشبكات المهنية.',
    specs: [
      'إنشاء رابط مخصص (e.g., jobmatch.ai/cv/ahmed-ali) بتصميم تفاعلي متجاوب مع الهواتف.',
      'إنشاء رمز QR تلقائي عالي الدقة لوضعه في أعلى ملف الـ PDF المطبوع.',
      'إحصائيات ذكية للمستخدم: عدد زوار الصفحة، البلدان، وتحميلات ملف السيرة الذاتية.',
      'إمكانية حماية الصفحة بكلمة مرور أو جعلها متاحة فقط لمن يملك الرابط.',
    ],
    impact: 'عالي',
    effort: 'متوسط (1-2 أسبوع)',
    priority: 'high',
    status: 'idea',
    badgeColor: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
  },
  {
    id: 'idea-kanban-tracker',
    title: 'نظام تتبع طلبات التوظيف (Job Application Kanban Tracker)',
    category: 'jobs',
    categoryLabel: 'سوق العمل والوظائف',
    description: 'لوحة تفاعلية لإدارة ومتابعة طلبات التقديم على الوظائف في مكان واحد مثل Trello، لمعرفة ما تم إرساله وما تم الرد عليه.',
    specs: [
      'أعمدة منظمة: (تم التقديم 📤 -> مقابلة هاتفية 📞 -> مقابلة تقنية 💻 -> عرض وظيفي 🎉 -> مرفوض ❌).',
      'حفظ السيرة الذاتية وخطاب التغطية المستخدمين في كل تقديم بشكل مستقل.',
      'إضافة ملاحظات، الرواتب المتوقعة، ومواعيد المقابلات مع منبهات تقويم Google Calendar.',
    ],
    impact: 'متوسط',
    effort: 'متوسط (1-2 أسبوع)',
    priority: 'medium',
    status: 'idea',
    badgeColor: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
  },
  {
    id: 'idea-multi-export',
    title: 'تصدير متقدم بصيغ متعددة (Word docx, ATS Plain Text, High-Res PDF)',
    category: 'export',
    categoryLabel: 'تصدير وتكامل تقني',
    description: 'توفير خيارات تصدير متنوعة تناسب كافة متطلبات الشركات، مع معالجة احترافية لدعم الخطوط واللغة العربية.',
    specs: [
      'تصدير ملف Microsoft Word (.docx) قابل للتعديل ومنسق بأسلوب ATS قياسي.',
      'تصدير نص خام (Plain Text) مخصص للتقديم في النماذج النصية المعقدة لشركات مثل Oracle و Taleo.',
      'محرك PDF فائق الدقة بدون أي تشويه في تشابك الحروف العربية أو المسافات.',
      'ضغط ذكي لحجم الملف ليكون دائماً أقل من 500KB مع الحفاظ على أعلى نقاء بصري.',
    ],
    impact: 'عالي جداً',
    effort: 'متوسط (1-2 أسبوع)',
    priority: 'urgent',
    status: 'in-progress',
    badgeColor: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  },
  {
    id: 'idea-portfolio-scraper',
    title: 'جالب مشاريع GitHub و Behance التلقائي (Dev & Creative Scraper)',
    category: 'export',
    categoryLabel: 'تصدير وتكامل تقني',
    description: 'استيراد فوري للمشاريع من حساب المطور في GitHub أو المصمم في Behance وصياغتها كإنجازات قوية في السيرة الذاتية.',
    specs: [
      'إدخال اسم مستخدم GitHub لجلب أهم المستودعات (Repos)، والنجوم، واللغات البرمجية المستخدمة.',
      'الذكاء الاصطناعي يلخص فكرة كل مشروع، وأبرز التحديات، والنتائج بأسلوب احترافي مختصر.',
      'دعم جلب روابط المعارض والتصاميم من Behance مع مصغرات الصور.',
    ],
    impact: 'متوسط',
    effort: 'سريع (1-3 أيام)',
    priority: 'medium',
    status: 'idea',
    badgeColor: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  },
  {
    id: 'idea-free-for-seekers',
    title: 'نموذج المنصة المجانية 100% للباحثين عن عمل (100% Free Job Seekers Model)',
    category: 'business',
    categoryLabel: 'الاشتراكات والأعمال',
    description: 'إتاحة كافة أدوات المنصة، بناء السيرة، قوالب ATS، وتوليد Cover Letters مجاناً بالكامل دون أي رسوم على الأفراد لضمان أعلى انتشار فيروسي (Viral Growth).',
    specs: [
      'إتاحة جميع القوالب، فحص ATS، وتوليد خطابات التقديم بالذكاء الاصطناعي مجاناً 100% للأفراد.',
      'استغلال الميزة المجانية في حملات تيك توك ولينكدإن وجروبات الخريجين لتحقيق ملايين الزيارات العضوية السريعة.',
      'بناء أضخم قاعدة بيانات كفاءات وباحثين عن عمل لتصبح المنصة ذات قيمة خيالية للشركات.',
    ],
    impact: 'عالي جداً',
    effort: 'سريع (1-3 أيام)',
    priority: 'urgent',
    status: 'in-progress',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },
  {
    id: 'idea-b2b-employers',
    title: 'بوابة الشركات وأصحاب الأعمال والوظائف المميزة (B2B Employer Portal & Featured Jobs)',
    category: 'business',
    categoryLabel: 'الاشتراكات والأعمال',
    description: 'تحصيل الأرباح من الشركات والـ HR بدلاً من الباحثين عن عمل (نفس نموذج Indeed و Wuzzuf).',
    specs: [
      'إعلانات وظائف مميزة (Featured Job Listings) مدفوعة لتثبيت وظائف الشركات في مقدمة المنصة.',
      'محرك البحث في بنك الكفاءات (Talent Search Database) باشتراك شهري للشركات للوصول للمرشحين المناسبين.',
      'أداة الفرز الآلي للشركات (Bulk ATS Screener): فحص 100+ سيرة ذاتية وتحديد أفضل 5 مرشحين بضغطة زر.',
    ],
    impact: 'عالي جداً',
    effort: 'كبير (شهر)',
    priority: 'urgent',
    status: 'idea',
    badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  },
  {
    id: 'idea-edtech-affiliate',
    title: 'التسويق بالعمولة للكورسات والدورات التدريبية (EdTech & Courses Affiliate)',
    category: 'business',
    categoryLabel: 'الاشتراكات والأعمال',
    description: 'توصية المستخدم بالدورات والشهادات المناسبة لسد فجوات المهارات في السيرة الذاتية والحصول على عمولات من منصات التعليم.',
    specs: [
      'الذكاء الاصطناعي يحلل نقاط الضعف في الـ CV ويقترح دورات تدريبية معتمدة لسد نقص المهارات.',
      'الربط مع برامج الأفلييت العالمية (Coursera, Udemy, edX) والمنصات العربية (ينفع، المنتور).',
      'الحصول على عمولة 20% إلى 50% عن كل تسجيل دون أن يدفع الباحث عن عمل أي قرش للموقع.',
    ],
    impact: 'عالي',
    effort: 'سريع (1-3 أيام)',
    priority: 'high',
    status: 'idea',
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  {
    id: 'idea-ads-sponsorships',
    title: 'شبكة إعلانات جوجل والرعايات المؤسسية (Google AdSense & CSR Sponsorships)',
    category: 'business',
    categoryLabel: 'الاشتراكات والأعمال',
    description: 'توليد دخل سلبي مستمر من حركة الزيارات العالية عبر إعلانات Google AdSense ورعايات البنوك والشركات الكبرى.',
    specs: [
      'دمج إعلانات Google AdSense أنيقة وغير مزعجة في صفحات النتائج وصفحات تنزيل الـ PDF.',
      'عقد شراكات رعاية سنوية مع البنوك والمصارف وشركات الاتصالات لدعم توظيف وتأهيل الشباب (CSR).',
      'إظهار شعار الجهة الراعية في الترويسة مع شعار (مبادرة مجانية لدعم الشباب برعاية X).',
    ],
    impact: 'عالي',
    effort: 'سريع (1-3 أيام)',
    priority: 'high',
    status: 'idea',
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  },
  {
    id: 'idea-vip-human-review',
    title: 'خدمة الاستشارة والمراجعة البشرية المخصصة الاختيارية (Optional VIP Human Review)',
    category: 'business',
    categoryLabel: 'الاشتراكات والأعمال',
    description: 'خدمة مدفوعة اختيارية تماماً للمدراء والباحثين عن مراجعة بشرية 1-on-1 مع مستشار توظيف، بينما تظل كافة أدوات المنصة مجانية 100%.',
    specs: [
      'الأداة الذكية والقوالب والـ PDF مجانية بالكامل بلا أي استثناء.',
      'خيار إضافي فرعي اختياري لمن يرغب في فحص يدوي دقيق من استشاري موارد بشرية محترف.',
      'تسليم الملاحظات والتعديلات خلال 24-48 ساعة بهامش ربح مرتفع جداً (High-Ticket Upsell).',
    ],
    impact: 'متوسط',
    effort: 'سريع (1-3 أيام)',
    priority: 'medium',
    status: 'idea',
    badgeColor: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
  },
  {
    id: 'idea-telegram-whatsapp-alerts',
    title: 'تنبيهات الفرص الذكية عبر واتساب وتيليجرام (WhatsApp & Telegram Alerts)',
    category: 'ai',
    categoryLabel: 'ذكاء اصطناعي',
    description: 'بوت ذكي يرسل إشعاراً فورياً للمستخدم عندما تتوفر وظيفة شاغرة تناسب مهاراته وسيرته بنسبة توافق تفوق 85%.',
    specs: [
      'ربط حساب التيليجرام أو الواتساب برقم هاتف المستخدم بنقرة واحدة.',
      'إرسال ملخص يومي بأهم الوظائف الجديدة مع نسبة التوافق ورابط التقديم المباشر.',
      'إمكانية الاستفسار من البوت عن حالة طلبات التوظيف أو طلب تعديل سريع على السيرة الذاتية.',
    ],
    impact: 'متوسط',
    effort: 'متوسط (1-2 أسبوع)',
    priority: 'medium',
    status: 'idea',
    badgeColor: 'border-green-500/30 bg-green-500/10 text-green-400',
  },
];


interface AdminStats {
  metrics: {
    totalUsers: number;
    totalResumes: number;
    totalAnalyses: number;
    newUsers7d: number;
    newResumes7d: number;
    avgScore: number;
    minScore: number;
    maxScore: number;
  };
  templateCounts: Record<string, number>;
  scoreDistribution: {
    excellent: number;
    good: number;
    average: number;
    needsWork: number;
  };
  recentActivity: {
    users: any[];
    resumes: any[];
    analyses: any[];
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  resumeCount: number;
  analysisCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminResume {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  templateId: string;
  theme: any;
  candidateName: string;
  candidateTitle: string;
  experienceCount: number;
  educationCount: number;
  skillsCount: number;
  projectsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminAnalysis {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  resumeFileName: string;
  targetRole: string;
  overallScore: number;
  grade: string;
  rankPercentile: string;
  matchLabel: string;
  subScores: {
    keywordsMatch: number;
    formatting: number;
    structure: number;
    contentQuality: number;
  };
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);

  // Dashboard Data
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'resumes' | 'analyses' | 'plan'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [resumesList, setResumesList] = useState<AdminResume[]>([]);
  const [analysesList, setAnalysesList] = useState<AdminAnalysis[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [resumeSearch, setResumeSearch] = useState('');
  const [resumeTemplateFilter, setResumeTemplateFilter] = useState('all');
  const [analysisSearch, setAnalysisSearch] = useState('');

  // Roadmap State & Management
  const [roadmapIdeas, setRoadmapIdeas] = useState<RoadmapIdea[]>(DEFAULT_ROADMAP_IDEAS);
  const [planCategoryFilter, setPlanCategoryFilter] = useState<string>('all');
  const [planStatusFilter, setPlanStatusFilter] = useState<string>('all');
  const [planSearch, setPlanSearch] = useState<string>('');
  const [isAddIdeaModalOpen, setIsAddIdeaModalOpen] = useState<boolean>(false);
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);

  // New Idea Form State
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaCategory, setNewIdeaCategory] = useState<'ai' | 'design' | 'jobs' | 'export' | 'business'>('ai');
  const [newIdeaDescription, setNewIdeaDescription] = useState('');
  const [newIdeaSpecs, setNewIdeaSpecs] = useState('');
  const [newIdeaPriority, setNewIdeaPriority] = useState<'urgent' | 'high' | 'medium'>('high');
  const [newIdeaImpact, setNewIdeaImpact] = useState<'عالي جداً' | 'عالي' | 'متوسط'>('عالي');
  const [newIdeaEffort, setNewIdeaEffort] = useState<'سريع (1-3 أيام)' | 'متوسط (1-2 أسبوع)' | 'كبير (شهر)'>('متوسط (1-2 أسبوع)');

  // Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotice = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
  }, [toast]);

  // Load Roadmap from LocalStorage with smart merge of new default ideas
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jobmatch_roadmap_ideas');
      if (saved) {
        const parsed: RoadmapIdea[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((item) => item.id));
        const missingDefaults = DEFAULT_ROADMAP_IDEAS.filter((def) => !existingIds.has(def.id));
        if (missingDefaults.length > 0) {
          const merged = [...parsed, ...missingDefaults];
          setRoadmapIdeas(merged);
          localStorage.setItem('jobmatch_roadmap_ideas', JSON.stringify(merged));
        } else {
          setRoadmapIdeas(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading roadmap from localStorage:', e);
    }
  }, []);

  const saveRoadmapIdeas = (ideas: RoadmapIdea[]) => {
    setRoadmapIdeas(ideas);
    try {
      localStorage.setItem('jobmatch_roadmap_ideas', JSON.stringify(ideas));
    } catch (e) {
      console.error('Error saving roadmap to localStorage:', e);
    }
  };

  const handleUpdateIdeaStatus = (id: string, newStatus: 'idea' | 'in-progress' | 'completed') => {
    const updated = roadmapIdeas.map((idea) =>
      idea.id === id ? { ...idea, status: newStatus } : idea
    );
    saveRoadmapIdeas(updated);
    showNotice(
      newStatus === 'completed'
        ? 'تهانينا! تم تحديث حالة الميزة إلى مكتملة بنجاح 🎉'
        : newStatus === 'in-progress'
        ? 'تم نقل الميزة إلى قيد التطوير والعمل 🚀'
        : 'تم نقل الميزة إلى قائمة الأفكار المجدولة 💡'
    );
  };

  const handleDeleteIdea = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف فكرة من خطة التطوير',
      message: 'هل أنت متأكد من حذف هذه الفكرة من خطة التطوير؟',
      confirmLabel: 'حذف الفكرة',
      variant: 'danger',
      onConfirm: () => {
        const updated = roadmapIdeas.filter((item) => item.id !== id);
        saveRoadmapIdeas(updated);
        showNotice('تم حذف الفكرة من خطة التطوير');
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleResetDefaultIdeas = () => {
    setConfirmState({
      isOpen: true,
      title: 'إعادة تعيين خطة التطوير',
      message: 'هل تريد إعادة تعيين خطة التطوير إلى الخطة الأساسية الشاملة؟',
      confirmLabel: 'إعادة التعيين',
      variant: 'warning',
      onConfirm: () => {
        saveRoadmapIdeas(DEFAULT_ROADMAP_IDEAS);
        showNotice('تمت استعادة خطة التطوير الأساسية بنجاح');
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleCreateNewIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaTitle.trim()) return;

    const categoryLabels: Record<string, string> = {
      ai: 'ذكاء اصطناعي',
      design: 'تصميم وتجربة المستخدم',
      jobs: 'سوق العمل والوظائف',
      export: 'تصدير وتكامل تقني',
      business: 'الاشتراكات والأعمال',
    };

    const categoryBadges: Record<string, string> = {
      ai: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
      design: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
      jobs: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      export: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
      business: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    };

    const specsArray = newIdeaSpecs
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newIdea: RoadmapIdea = {
      id: `custom-idea-${Date.now()}`,
      title: newIdeaTitle.trim(),
      category: newIdeaCategory,
      categoryLabel: categoryLabels[newIdeaCategory] || 'تطوير المنصة',
      description: newIdeaDescription.trim() || 'فكرة وخدمة جديدة مخصصة لتطوير منصة JobMatch.',
      specs: specsArray.length > 0 ? specsArray : ['تنفيذ واختبار الميزة وفق المعايير البرمجية والتصميمية الحديثة.'],
      impact: newIdeaImpact,
      effort: newIdeaEffort,
      priority: newIdeaPriority,
      status: 'idea',
      badgeColor: categoryBadges[newIdeaCategory] || 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    };

    const updated = [newIdea, ...roadmapIdeas];
    saveRoadmapIdeas(updated);
    setIsAddIdeaModalOpen(false);
    setNewIdeaTitle('');
    setNewIdeaDescription('');
    setNewIdeaSpecs('');
    showNotice('تمت إضافة الفكرة بنجاح إلى خطة التطوير! 🚀');
  };

  const handleExportRoadmap = () => {
    let md = `# 🚀 خطة تطوير منصة JobMatch AI (Roadmap 2026)\n\n`;
    md += `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}\n`;
    md += `إجمالي الميزات والخدمات: ${roadmapIdeas.length}\n`;
    const completedCount = roadmapIdeas.filter((i) => i.status === 'completed').length;
    md += `نسبة الإنجاز: ${Math.round((completedCount / (roadmapIdeas.length || 1)) * 100)}%\n\n`;
    md += `---\n\n`;

    roadmapIdeas.forEach((idea, idx) => {
      const statusText =
        idea.status === 'completed'
          ? '✅ مكتمل'
          : idea.status === 'in-progress'
          ? '⏳ قيد التنفيذ'
          : '💡 فكرة مجدولة';
      md += `### ${idx + 1}. ${idea.title}\n`;
      md += `- **التصنيف:** ${idea.categoryLabel}\n`;
      md += `- **الحالة:** ${statusText}\n`;
      md += `- **الأولوية:** ${
        idea.priority === 'urgent' ? 'قصوى 🔥' : idea.priority === 'high' ? 'عالية ⭐' : 'متوسطة'
      }\n`;
      md += `- **الأثر:** ${idea.impact} | **الجهد التقديري:** ${idea.effort}\n`;
      md += `- **الوصف:** ${idea.description}\n`;
      md += `- **المواصفات الفنية:**\n`;
      idea.specs.forEach((s) => {
        md += `  * ${s}\n`;
      });
      md += `\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JobMatch_Development_Roadmap_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('تم تصدير ملف خطة التطوير (Markdown) بنجاح!');
  };

  // Check admin authorization on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/verify');
        const data = await res.json();
        if (data.isAdmin) {
          setIsAdminAuthorized(true);
        } else {
          setIsAdminAuthorized(false);
        }
      } catch (err) {
        setIsAdminAuthorized(false);
      }
    };

    if (!authLoading) {
      checkAuth();
    }
  }, [authLoading, user]);

  const loadAllAdminData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [statsRes, usersRes, resumesRes, analysesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/resumes'),
        fetch('/api/admin/analyses'),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsersList(u.users || []);
      }
      if (resumesRes.ok) {
        const r = await resumesRes.json();
        setResumesList(r.resumes || []);
      }
      if (analysesRes.ok) {
        const a = await analysesRes.json();
        setAnalysesList(a.analyses || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showNotice('حدث خطأ أثناء تحميل البيانات', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [showNotice]);

  // Load Admin Data when authorized
  useEffect(() => {
    if (isAdminAuthorized) {
      loadAllAdminData();
    }
  }, [isAdminAuthorized, loadAllAdminData]);

  const handleVerifyKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    setIsVerifyingKey(true);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: adminKeyInput }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminAuthorized(true);
        showNotice('تم تأكيد صلاحيات الأدمن بنجاح! مرحباً بك');
      } else {
        setKeyError(data.error || 'رمز دخول الأدمن غير صحيح');
      }
    } catch (err: any) {
      setKeyError(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: 'user' | 'admin') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMsg =
      currentRole === 'admin'
        ? 'هل أنت متأكد من سحب صلاحية الأدمن من هذا المستخدم؟'
        : 'هل تريد ترقية هذا المستخدم إلى مشرف (Admin)؟';

    setConfirmState({
      isOpen: true,
      title: currentRole === 'admin' ? 'سحب صلاحية المشرف' : 'ترقية إلى مشرف',
      message: confirmMsg,
      confirmLabel: currentRole === 'admin' ? 'سحب الصلاحية' : 'ترقية المشرف',
      variant: currentRole === 'admin' ? 'warning' : 'info',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, role: newRole }),
          });

          if (res.ok) {
            setUsersList((prev) =>
              prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
            );
            showNotice(`تم تعديل صلاحية المستخدم إلى ${newRole === 'admin' ? 'مشرف (Admin)' : 'مستخدم عادي'}`);
          } else {
            const d = await res.json();
            showNotice(d.error || 'فشل تعديل الصلاحية', 'error');
          }
        } catch (err) {
          showNotice('حدث خطأ أثناء تعديل الصلاحية', 'error');
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setConfirmState({
      isOpen: true,
      title: `حذف المستخدم "${userName}"`,
      message: `تحذير: هل أنت متأكد تماماً من حذف المستخدم "${userName}"؟\nسيتم حذف حسابه وجميع السير الذاتية وفحوصات الـ ATS التابعة له نهائياً!`,
      confirmLabel: 'حذف المستخدم نهائياً',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
          if (res.ok) {
            setUsersList((prev) => prev.filter((u) => u.id !== userId));
            setResumesList((prev) => prev.filter((r) => r.userId !== userId));
            setAnalysesList((prev) => prev.filter((a) => a.userId !== userId));
            if (stats) {
              setStats({
                ...stats,
                metrics: {
                  ...stats.metrics,
                  totalUsers: Math.max(0, stats.metrics.totalUsers - 1),
                },
              });
            }
            showNotice(`تم حذف المستخدم "${userName}" وبياناته بنجاح`);
          } else {
            const d = await res.json();
            showNotice(d.error || 'فشل حذف المستخدم', 'error');
          }
        } catch (err) {
          showNotice('حدث خطأ أثناء حذف المستخدم', 'error');
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteResume = async (resumeId: string, title: string) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف السيرة الذاتية',
      message: `هل أنت متأكد من حذف السيرة الذاتية "${title}"؟`,
      confirmLabel: 'حذف السيرة',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/resumes?id=${resumeId}`, { method: 'DELETE' });
          if (res.ok) {
            setResumesList((prev) => prev.filter((r) => r.id !== resumeId));
            if (stats) {
              setStats({
                ...stats,
                metrics: {
                  ...stats.metrics,
                  totalResumes: Math.max(0, stats.metrics.totalResumes - 1),
                },
              });
            }
            showNotice('تم حذف السيرة الذاتية بنجاح');
          } else {
            const d = await res.json();
            showNotice(d.error || 'فشل حذف السيرة الذاتية', 'error');
          }
        } catch (err) {
          showNotice('حدث خطأ أثناء حذف السيرة الذاتية', 'error');
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف فحص الـ ATS',
      message: 'هل تريد حذف سجل فحص الـ ATS هذا؟',
      confirmLabel: 'حذف السجل',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/analyses?id=${analysisId}`, { method: 'DELETE' });
          if (res.ok) {
            setAnalysesList((prev) => prev.filter((a) => a.id !== analysisId));
            if (stats) {
              setStats({
                ...stats,
                metrics: {
                  ...stats.metrics,
                  totalAnalyses: Math.max(0, stats.metrics.totalAnalyses - 1),
                },
              });
            }
            showNotice('تم حذف سجل الفحص');
          } else {
            const d = await res.json();
            showNotice(d.error || 'فشل حذف سجل الفحص', 'error');
          }
        } catch (err) {
          showNotice('حدث خطأ أثناء حذف السجل', 'error');
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleExportData = () => {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      stats,
      users: usersList,
      resumes: resumesList,
      analyses: analysesList,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobmatch-admin-full-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('تم تصدير نسخة كاملة من البيانات بنجاح (JSON)');
  };

  // Filtered Users
  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filtered Resumes
  const filteredResumes = resumesList.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(resumeSearch.toLowerCase()) ||
      r.userName.toLowerCase().includes(resumeSearch.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(resumeSearch.toLowerCase()) ||
      r.candidateName.toLowerCase().includes(resumeSearch.toLowerCase()) ||
      r.candidateTitle.toLowerCase().includes(resumeSearch.toLowerCase());

    const matchesTemplate = resumeTemplateFilter === 'all' || r.templateId === resumeTemplateFilter;
    return matchesSearch && matchesTemplate;
  });

  // Filtered Analyses
  const filteredAnalyses = analysesList.filter(
    (a) =>
      a.targetRole.toLowerCase().includes(analysisSearch.toLowerCase()) ||
      a.userName.toLowerCase().includes(analysisSearch.toLowerCase()) ||
      a.userEmail.toLowerCase().includes(analysisSearch.toLowerCase()) ||
      a.resumeFileName.toLowerCase().includes(analysisSearch.toLowerCase()) ||
      a.grade.toLowerCase().includes(analysisSearch.toLowerCase())
  );

  // If Auth loading
  if (authLoading || isAdminAuthorized === null) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm font-medium">جاري التحقق من صلاحيات المشرف...</p>
        </div>
      </div>
    );
  }

  // If NOT authorized as admin, show Admin Authentication Access Gate
  if (!isAdminAuthorized) {
    return (
      <div className="min-h-[100dvh] bg-paper flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8  shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 end-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 start-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-10 h-10" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-white mb-2">
            لوحة تحكم المشرف (Admin)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 text-center mb-6 leading-relaxed">
            هذه الصفحة مخصصة لمالك المنصة لمراقبة المستخدمين، السير الذاتية، والإحصائيات الكاملة.
          </p>

          {keyError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{keyError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyKey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                مفتاح الدخول السري (Admin Secret Key)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={adminKeyInput}
                  onChange={(e) => setAdminKeyInput(e.target.value)}
                  placeholder="أدخل مفتاح الإدارة أو كلمة المرور السرية"
                  className="w-full ps-10 pe-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder-slate-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifyingKey}
              className="w-full py-3.5 rounded-xl bg-accent text-on-accent hover:bg-accent-hover text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifyingKey ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>دخول لوحة الإدارة</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center flex flex-col gap-2">
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              تسجيل الدخول بحساب مسؤول مسجل
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Helper for template badge colors
  const getTemplateBadge = (tpl: string) => {
    switch (tpl) {
      case 'compact':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Compact (Resumeforfree)</span>;
      case 'two-column':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">Two Column</span>;
      case 'ats-friendly':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">ATS Friendly</span>;
      case 'simple':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-500/20 text-slate-300 border border-slate-600/40">Simple Standard</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">{tpl}</span>;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) {
      return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{score}%</span>;
    }
    if (score >= 70) {
      return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">{score}%</span>;
    }
    if (score >= 50) {
      return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">{score}%</span>;
    }
    return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">{score}%</span>;
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 end-4 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium flex items-center gap-2.5 animate-in slide-in-from-top duration-300 ${
            notification.type === 'error'
              ? 'bg-red-950/95 border-red-800 text-red-200'
              : 'bg-emerald-950/95 border-emerald-800 text-emerald-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Admin Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60  sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent text-on-accent shadow-md shadow-cyan-500/20 text-white font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  JobMatch <span className="text-cyan-400">Admin</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  لوحة التحكم
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                متابعة شاملة للمستخدمين، السير الذاتية، ومؤشرات الأداء
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={loadAllAdminData}
              disabled={isLoadingData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>

            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
              title="تصدير كامل البيانات JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">تصدير كامل البيانات</span>
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs text-cyan-300 font-medium transition-all"
            >
              <span className="hidden sm:inline">لوحة المستخدم</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* KPI Metrics Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Users */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden ">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">إجمالي المستخدمين</span>
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats?.metrics.totalUsers ?? usersList.length}
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +{stats?.metrics.newUsers7d ?? 0} هذا الأسبوع
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">حسابات مسجلة بالمنصة</p>
          </div>

          {/* Card 2: Resumes */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden ">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">إجمالي السير الذاتية</span>
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats?.metrics.totalResumes ?? resumesList.length}
              </span>
              <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +{stats?.metrics.newResumes7d ?? 0} جديدة
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">سيرة ذاتية تم إنشاؤها وحفظها</p>
          </div>

          {/* Card 3: ATS Scans */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden ">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">فحوصات الـ ATS</span>
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <ScanSearch className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats?.metrics.totalAnalyses ?? analysesList.length}
              </span>
              <span className="text-[11px] text-purple-400 font-medium">فحص مكتمل</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">تحليل ومطابقة مع الوظائف</p>
          </div>

          {/* Card 4: Avg Score */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden ">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">متوسط درجات المطابقة</span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats?.metrics.avgScore ?? 0}%
              </span>
              <span className="text-[11px] text-amber-400 font-semibold">
                أعلى: {stats?.metrics.maxScore ?? 0}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">معدل توافق السير الذاتية مع ATS</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>نظرة عامة والتحليلات</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>المستخدمين ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('resumes')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'resumes'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>السير الذاتية ({resumesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analyses')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'analyses'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ScanSearch className="w-4 h-4" />
            <span>سجل فحص ATS ({analysesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'plan'
                ? 'bg-accent text-on-accent text-slate-950 font-bold shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Rocket className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
            <span>خطة التطوير ({roadmapIdeas.length})</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              خارطة الطريق
            </span>
          </button>

          <Link
            href="/admin/payments"
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 transition-all cursor-pointer"
            title="Crypto & Binance Payments Verification"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>مدفوعات Binance والـ Crypto</span>
          </Link>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Popularity Distribution */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 ">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <Layout className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-white text-base">القوالب الأكثر استخداماً</h3>
                  </div>
                  <span className="text-xs text-slate-400">إجمالي: {resumesList.length} سيرة</span>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'compact', label: 'Compact (Resumeforfree)', color: 'bg-emerald-500' },
                    { id: 'two-column', label: 'Two Column (Sidebar)', color: 'bg-blue-500' },
                    { id: 'ats-friendly', label: 'ATS Friendly (Structured)', color: 'bg-purple-500' },
                    { id: 'simple', label: 'Simple (Classic Minimal)', color: 'bg-slate-400' },
                  ].map((tpl) => {
                    const count = stats?.templateCounts[tpl.id] || resumesList.filter((r) => r.templateId === tpl.id).length;
                    const total = resumesList.length || 1;
                    const percent = Math.round((count / total) * 100);

                    return (
                      <div key={tpl.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">{tpl.label}</span>
                          <span className="text-slate-400 font-semibold">{count} سيرة ({percent}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${tpl.color} transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Score Distribution Breakdown */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 ">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-base">توزيع نتائج مطابقة الـ ATS</h3>
                  </div>
                  <span className="text-xs text-slate-400">إجمالي: {analysesList.length} فحص</span>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      label: 'ممتاز (85% فأعلى) - توافق قوي جداً',
                      count: stats?.scoreDistribution.excellent || analysesList.filter((a) => a.overallScore >= 85).length,
                      color: 'bg-emerald-500',
                      textColor: 'text-emerald-400',
                    },
                    {
                      label: 'جيد (70% - 84%) - يحتاج تحسين بسيط',
                      count: stats?.scoreDistribution.good || analysesList.filter((a) => a.overallScore >= 70 && a.overallScore < 85).length,
                      color: 'bg-cyan-500',
                      textColor: 'text-cyan-400',
                    },
                    {
                      label: 'متوسط (50% - 69%) - نقص في الكلمات المفتاحية',
                      count: stats?.scoreDistribution.average || analysesList.filter((a) => a.overallScore >= 50 && a.overallScore < 70).length,
                      color: 'bg-amber-500',
                      textColor: 'text-amber-400',
                    },
                    {
                      label: 'يحتاج إعادة صياغة (أقل من 50%)',
                      count: stats?.scoreDistribution.needsWork || analysesList.filter((a) => a.overallScore < 50).length,
                      color: 'bg-red-500',
                      textColor: 'text-red-400',
                    },
                  ].map((row, idx) => {
                    const total = analysesList.length || 1;
                    const percent = Math.round((row.count / total) * 100);

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`${row.textColor} font-medium`}>{row.label}</span>
                          <span className="text-slate-400 font-semibold">{row.count} ({percent}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.color} transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Platform Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Latest Users */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 ">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>أحدث المستخدمين المسجلين</span>
                  </h4>
                  <button onClick={() => setActiveTab('users')} className="text-xs text-cyan-400 hover:underline">
                    عرض الكل
                  </button>
                </div>
                <div className="space-y-2.5">
                  {usersList.slice(0, 5).map((u) => (
                    <div key={u.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                      <div className="min-w-0 pe-2">
                        <div className="font-semibold text-xs text-white truncate">{u.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.role === 'admin' ? 'مشرف' : 'مستخدم'}
                      </span>
                    </div>
                  ))}
                  {usersList.length === 0 && <p className="text-xs text-slate-500 py-3 text-center">لا يوجد مستخدمين بعد</p>}
                </div>
              </div>

              {/* Latest Resumes */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 ">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>أحدث السير الذاتية المنشأة</span>
                  </h4>
                  <button onClick={() => setActiveTab('resumes')} className="text-xs text-cyan-400 hover:underline">
                    عرض الكل
                  </button>
                </div>
                <div className="space-y-2.5">
                  {resumesList.slice(0, 5).map((r) => (
                    <div key={r.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                      <div className="min-w-0 pe-2">
                        <div className="font-semibold text-xs text-white truncate">{r.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">بواسطة: {r.userName}</div>
                      </div>
                      {getTemplateBadge(r.templateId)}
                    </div>
                  ))}
                  {resumesList.length === 0 && <p className="text-xs text-slate-500 py-3 text-center">لا توجد سير ذاتية بعد</p>}
                </div>
              </div>

              {/* Latest ATS Scans */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 ">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <ScanSearch className="w-4 h-4 text-purple-400" />
                    <span>أحدث فحوصات ATS</span>
                  </h4>
                  <button onClick={() => setActiveTab('analyses')} className="text-xs text-cyan-400 hover:underline">
                    عرض الكل
                  </button>
                </div>
                <div className="space-y-2.5">
                  {analysesList.slice(0, 5).map((a) => (
                    <div key={a.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                      <div className="min-w-0 pe-2">
                        <div className="font-semibold text-xs text-white truncate">{a.targetRole}</div>
                        <div className="text-[11px] text-slate-400 truncate">{a.userName}</div>
                      </div>
                      <div className="text-start shrink-0">
                        {getScoreBadge(a.overallScore)}
                      </div>
                    </div>
                  ))}
                  {analysesList.length === 0 && <p className="text-xs text-slate-500 py-3 text-center">لا توجد فحوصات بعد</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-6  space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>دليل المستخدمين المسجلين</span>
                  <span className="text-xs font-normal text-slate-400">({filteredUsers.length} مستخدم)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  إدارة الصلاحيات، عرض عدد السير الذاتية لكل مستخدم، والتحكم بالحسابات
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الإيميل..."
                  className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead className="bg-slate-800/80 text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4">المستخدم</th>
                    <th className="py-3 px-4">البريد الإلكتروني</th>
                    <th className="py-3 px-4 text-center">الصلاحية</th>
                    <th className="py-3 px-4 text-center">عدد السير الذاتية</th>
                    <th className="py-3 px-4 text-center">فحوصات ATS</th>
                    <th className="py-3 px-4">تاريخ التسجيل</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-accent text-on-accent flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {u.id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 text-xs">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {u.role === 'admin' ? 'مشرف (Admin)' : 'مستخدم'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">
                          {u.resumeCount} سيرة
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20">
                          {u.analysisCount} فحص
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleToggleUserRole(u.id, u.role)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                            title={u.role === 'admin' ? 'تنزيل إلى مستخدم عادي' : 'ترقية إلى مشرف'}
                          >
                            {u.role === 'admin' ? <UserX className="w-3.5 h-3.5 text-amber-400" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="حذف المستخدم وجميع بياناته"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        لا توجد نتائج مطابقة لبحثك
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ALL RESUMES DIRECTORY */}
        {activeTab === 'resumes' && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-6  space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>جميع السير الذاتية بالمنصة</span>
                  <span className="text-xs font-normal text-slate-400">({filteredResumes.length} سيرة)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تفاصيل كاملة لكل سيرة: صاحب السيرة، القالب المستخدم، الأقسام، وإمكانية المعاينة والتعديل
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={resumeTemplateFilter}
                  onChange={(e) => setResumeTemplateFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">جميع القوالب</option>
                  <option value="compact">Compact (Resumeforfree)</option>
                  <option value="two-column">Two Column (Sidebar)</option>
                  <option value="ats-friendly">ATS Friendly</option>
                  <option value="simple">Simple</option>
                </select>

                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={resumeSearch}
                    onChange={(e) => setResumeSearch(e.target.value)}
                    placeholder="بحث بالعنوان أو صاحب السيرة..."
                    className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Resumes Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead className="bg-slate-800/80 text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4">عنوان السيرة الذاتية</th>
                    <th className="py-3 px-4">صاحب الحساب</th>
                    <th className="py-3 px-4">اسم المرشح / المسمى</th>
                    <th className="py-3 px-4 text-center">القالب</th>
                    <th className="py-3 px-4 text-center">محتويات السيرة</th>
                    <th className="py-3 px-4">آخر تحديث</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredResumes.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{r.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {r.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{r.userName}</div>
                        <div className="text-xs text-slate-400 font-mono">{r.userEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-cyan-300">{r.candidateName}</div>
                        <div className="text-xs text-slate-400">{r.candidateTitle || 'بدون مسمى'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getTemplateBadge(r.templateId)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700" title="عدد الخبرات">
                            💼 {r.experienceCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700" title="عدد المؤهلات">
                            🎓 {r.educationCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700" title="عدد المهارات">
                            ⚡ {r.skillsCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {new Date(r.updatedAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/builder?id=${r.id}`}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors"
                            title="فتح ومعاينة في منشئ السيرة"
                            target="_blank"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteResume(r.id, r.title)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="حذف السيرة الذاتية"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredResumes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        لا توجد سير ذاتية مطابقة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ATS SCANS HISTORY */}
        {activeTab === 'analyses' && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-6  space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ScanSearch className="w-5 h-5 text-purple-400" />
                  <span>سجل فحوصات وتدقيق الـ ATS</span>
                  <span className="text-xs font-normal text-slate-400">({filteredAnalyses.length} فحص)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  جميع عمليات التحليل ومطابقة السير الذاتية مع التقديرات والدرجات التفصيلية
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={analysisSearch}
                  onChange={(e) => setAnalysisSearch(e.target.value)}
                  placeholder="بحث بالمسمى أو المستخدم..."
                  className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Analyses Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead className="bg-slate-800/80 text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4">الوظيفة المستهدفة</th>
                    <th className="py-3 px-4">المستخدم / الملف</th>
                    <th className="py-3 px-4 text-center">الدرجة الكلية</th>
                    <th className="py-3 px-4 text-center">التقدير</th>
                    <th className="py-3 px-4 text-center">المطابقة والتصنيف</th>
                    <th className="py-3 px-4 text-center">تفاصيل الدرجات</th>
                    <th className="py-3 px-4">تاريخ الفحص</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAnalyses.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{a.targetRole}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {a.id.slice(-6)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{a.userName}</div>
                        <div className="text-xs text-slate-400 font-mono">{a.resumeFileName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getScoreBadge(a.overallScore)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-white">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {a.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs text-slate-300 font-medium">
                          {a.matchLabel} ({a.rankPercentile})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700" title="الكلمات المفتاحية">
                            🔑 {a.subScores?.keywordsMatch ?? 0}%
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700" title="التنسيق">
                            📐 {a.subScores?.formatting ?? 0}%
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700" title="الهيكل">
                            🏗️ {a.subScores?.structure ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {new Date(a.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteAnalysis(a.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="حذف سجل الفحص"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAnalyses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        لا توجد سجلات فحص مطابقة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DEVELOPMENT ROADMAP & FUTURE PLAN */}
        {activeTab === 'plan' && (() => {
          const filteredRoadmapIdeas = roadmapIdeas.filter((item) => {
            const matchesCategory = planCategoryFilter === 'all' || item.category === planCategoryFilter;
            const matchesStatus = planStatusFilter === 'all' || item.status === planStatusFilter;
            const matchesSearch =
              planSearch.trim() === '' ||
              item.title.toLowerCase().includes(planSearch.toLowerCase()) ||
              item.description.toLowerCase().includes(planSearch.toLowerCase()) ||
              item.specs.some((s) => s.toLowerCase().includes(planSearch.toLowerCase()));
            return matchesCategory && matchesStatus && matchesSearch;
          });

          const totalRoadmapItems = roadmapIdeas.length;
          const completedRoadmapItems = roadmapIdeas.filter((i) => i.status === 'completed').length;
          const inProgressRoadmapItems = roadmapIdeas.filter((i) => i.status === 'in-progress').length;
          const plannedRoadmapItems = roadmapIdeas.filter((i) => i.status === 'idea').length;
          const completionPercentage =
            totalRoadmapItems > 0 ? Math.round((completedRoadmapItems / totalRoadmapItems) * 100) : 0;

          const getCategoryIcon = (cat: string) => {
            switch (cat) {
              case 'ai':
                return <Bot className="w-4 h-4 text-cyan-400" />;
              case 'design':
                return <Palette className="w-4 h-4 text-pink-400" />;
              case 'jobs':
                return <Briefcase className="w-4 h-4 text-emerald-400" />;
              case 'export':
                return <Code className="w-4 h-4 text-yellow-400" />;
              case 'business':
                return <DollarSign className="w-4 h-4 text-amber-400" />;
              default:
                return <Sparkles className="w-4 h-4 text-cyan-400" />;
            }
          };

          const getPriorityBadge = (priority: string) => {
            switch (priority) {
              case 'urgent':
                return (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    أولوية قصوى 🔥
                  </span>
                );
              case 'high':
                return (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    أولوية عالية ⭐
                  </span>
                );
              default:
                return (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    أولوية متوسطة 📌
                  </span>
                );
            }
          };

          return (
            <div className="space-y-6">
              {/* Header Hero Banner */}
              <div className="bg-surface border border-amber-500/20 rounded-3xl p-6 sm:p-8  relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 end-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
                <div className="absolute bottom-0 start-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                      <Rocket className="w-3.5 h-3.5 text-amber-400" />
                      <span>خارطة طريق تطوير المنصة والخدمات المستقبلية 2026</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      خطة التطوير الشاملة لمنصة JobMatch
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      توثيق ومتابعة كافة الأفكار المتفق عليها، ترقيات الذكاء الاصطناعي الذاتية، تحسينات التصميم والقوالب،
                      وربط الوظائف المباشرة للارتقاء بالمنصة إلى الصدارة في سوق العمل.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => setIsAddIdeaModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-on-accent hover:bg-accent-hover text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة فكرة جديدة</span>
                    </button>

                    <button
                      onClick={handleExportRoadmap}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 hover:text-white transition-all cursor-pointer"
                      title="تحميل خطة التطوير بصيغة Markdown"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>تصدير الخطة</span>
                    </button>

                    <button
                      onClick={handleResetDefaultIdeas}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                      title="استعادة الخطة الأساسية"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">الافتراضية</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress & KPIs Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 ">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">إجمالي الأفكار</span>
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                      <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalRoadmapItems}</div>
                  <p className="text-[11px] text-slate-400 mt-1">ميزة وخدمة في الخطة</p>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 ">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">قيد التنفيذ والبرمجة</span>
                    <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">{inProgressRoadmapItems}</div>
                  <p className="text-[11px] text-cyan-400 mt-1">جاري تطويرها حالياً</p>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 ">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">مكتمل ومنفذ</span>
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">{completedRoadmapItems}</div>
                  <p className="text-[11px] text-emerald-400 mt-1">جاهزة وتعمل بالمنصة</p>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 ">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">نسبة الإنجاز العامة</span>
                    <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white">{completionPercentage}%</span>
                    <span className="text-[11px] text-slate-400">من إجمالي الخطة</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4  space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute end-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={planSearch}
                      onChange={(e) => setPlanSearch(e.target.value)}
                      placeholder="ابحث في أفكار التطوير، الذكاء الاصطناعي، التصميم، أو المواصفات..."
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 placeholder-slate-500"
                    />
                    {planSearch && (
                      <button
                        onClick={() => setPlanSearch('')}
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    <button
                      onClick={() => setPlanStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        planStatusFilter === 'all'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      الكل ({totalRoadmapItems})
                    </button>
                    <button
                      onClick={() => setPlanStatusFilter('in-progress')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        planStatusFilter === 'in-progress'
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ⏳ قيد التنفيذ ({inProgressRoadmapItems})
                    </button>
                    <button
                      onClick={() => setPlanStatusFilter('idea')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        planStatusFilter === 'idea'
                          ? 'bg-purple-500 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      💡 أفكار مجدولة ({plannedRoadmapItems})
                    </button>
                    <button
                      onClick={() => setPlanStatusFilter('completed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        planStatusFilter === 'completed'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ✅ مكتملة ({completedRoadmapItems})
                    </button>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-1 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400 whitespace-nowrap ms-2">التصنيف:</span>
                  <button
                    onClick={() => setPlanCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      planCategoryFilter === 'all'
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    🌟 كافة المجالات
                  </button>
                  <button
                    onClick={() => setPlanCategoryFilter('ai')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      planCategoryFilter === 'ai'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>الذكاء الاصطناعي (AI)</span>
                  </button>
                  <button
                    onClick={() => setPlanCategoryFilter('design')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      planCategoryFilter === 'design'
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>التصميم والقوالب (UI/UX)</span>
                  </button>
                  <button
                    onClick={() => setPlanCategoryFilter('jobs')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      planCategoryFilter === 'jobs'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>محرك الوظائف وسوق العمل</span>
                  </button>
                  <button
                    onClick={() => setPlanCategoryFilter('export')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      planCategoryFilter === 'export'
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>التصدير والتكامل التقني</span>
                  </button>
                  <button
                    onClick={() => setPlanCategoryFilter('business')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      planCategoryFilter === 'business'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>الاشتراكات والمدفوعات</span>
                  </button>
                </div>
              </div>

              {/* Ideas Cards Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {filteredRoadmapIdeas.map((idea, index) => {
                  const isExpanded = expandedIdeaId === idea.id;
                  return (
                    <div
                      key={idea.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 sm:p-6  transition-all duration-200 flex flex-col justify-between group shadow-xl relative overflow-hidden"
                    >
                      {/* Top Badges */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200">
                              {getCategoryIcon(idea.category)}
                              <span>{idea.categoryLabel}</span>
                            </span>
                            {getPriorityBadge(idea.priority)}
                          </div>

                          {/* Status Pill */}
                          <div>
                            {idea.status === 'completed' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>مكتمل</span>
                              </span>
                            )}
                            {idea.status === 'in-progress' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-spin" />
                                <span>قيد التنفيذ</span>
                              </span>
                            )}
                            {idea.status === 'idea' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Lightbulb className="w-3 h-3" />
                                <span>فكرة مجدولة</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors mb-2">
                          {idea.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                          {idea.description}
                        </p>

                        {/* Specs List */}
                        <div className="space-y-2 mb-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>المواصفات الفنية ومخرجات الميزة:</span>
                          </div>
                          <ul className="space-y-1.5">
                            {idea.specs.slice(0, isExpanded ? idea.specs.length : 3).map((spec, sIdx) => (
                              <li key={sIdx} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                                <span className="leading-relaxed">{spec}</span>
                              </li>
                            ))}
                          </ul>
                          {idea.specs.length > 3 && (
                            <button
                              onClick={() => setExpandedIdeaId(isExpanded ? null : idea.id)}
                              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium pt-1 flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? 'عرض أقل' : `عرض ${idea.specs.length - 3} مواصفات إضافية...`}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions & Metadata */}
                      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px]">
                            الأثر: <strong className="text-slate-200">{idea.impact}</strong>
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400 text-[11px]">
                            الجهد: <strong className="text-slate-200">{idea.effort}</strong>
                          </span>
                        </div>

                        {/* Status Switcher Buttons */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 hidden sm:inline">الحالة:</span>
                          <button
                            onClick={() => handleUpdateIdeaStatus(idea.id, 'idea')}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                              idea.status === 'idea'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="تعيين كفكرة مجدولة"
                          >
                            💡 فكرة
                          </button>
                          <button
                            onClick={() => handleUpdateIdeaStatus(idea.id, 'in-progress')}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                              idea.status === 'in-progress'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="تعيين كقيد التطوير"
                          >
                            🚀 قيد التنفيذ
                          </button>
                          <button
                            onClick={() => handleUpdateIdeaStatus(idea.id, 'completed')}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                              idea.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="تعيين كمكتمل"
                          >
                            ✅ مكتمل
                          </button>

                          <button
                            onClick={() => handleDeleteIdea(idea.id)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors ms-1 cursor-pointer"
                            title="حذف من الخطة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredRoadmapIdeas.length === 0 && (
                  <div className="col-span-1 xl:col-span-2 py-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                    <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-white mb-1">لا توجد أفكار مطابقة للبحث أو الفلتر المختار</h4>
                    <p className="text-xs text-slate-400 mb-4">
                      جرب مسح خانة البحث أو تغيير التصنيف لعرض المزيد من الميزات.
                    </p>
                    <button
                      onClick={() => {
                        setPlanSearch('');
                        setPlanCategoryFilter('all');
                        setPlanStatusFilter('all');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      إعادة ضبط الفلاتر
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Modal: Add New Roadmap Idea */}
        {isAddIdeaModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80  flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              <button
                onClick={() => setIsAddIdeaModalOpen(false)}
                className="absolute top-5 start-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">إضافة فكرة أو خدمة جديدة للخطة</h3>
                  <p className="text-xs text-slate-400">سجل فكرتك ومواصفاتها لتنضم إلى خارطة طريق التطوير</p>
                </div>
              </div>

              <form onSubmit={handleCreateNewIdea} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">عنوان الفكرة / الميزة *</label>
                  <input
                    type="text"
                    required
                    value={newIdeaTitle}
                    onChange={(e) => setNewIdeaTitle(e.target.value)}
                    placeholder="مثال: مولد البورتفوليو الشخصي بالذكاء الاصطناعي"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">التصنيف</label>
                    <select
                      value={newIdeaCategory}
                      onChange={(e: any) => setNewIdeaCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                    >
                      <option value="ai">🤖 ذكاء اصطناعي (AI Features)</option>
                      <option value="design">🎨 تصميم وقوالب (UI/UX Design)</option>
                      <option value="jobs">💼 محرك الوظائف (Job Integration)</option>
                      <option value="export">⚡ تصدير وتكامل (Tech & Export)</option>
                      <option value="business">💳 اشتراكات ومدفوعات (Business)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الأولوية</label>
                    <select
                      value={newIdeaPriority}
                      onChange={(e: any) => setNewIdeaPriority(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                    >
                      <option value="urgent">قصوى 🔥 (Urgent)</option>
                      <option value="high">عالية ⭐ (High)</option>
                      <option value="medium">متوسطة 📌 (Medium)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الأثر المتوقع</label>
                    <select
                      value={newIdeaImpact}
                      onChange={(e: any) => setNewIdeaImpact(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                    >
                      <option value="عالي جداً">عالي جداً</option>
                      <option value="عالي">عالي</option>
                      <option value="متوسط">متوسط</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الجهد التقديري</label>
                    <select
                      value={newIdeaEffort}
                      onChange={(e: any) => setNewIdeaEffort(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                    >
                      <option value="سريع (1-3 أيام)">سريع (1-3 أيام)</option>
                      <option value="متوسط (1-2 أسبوع)">متوسط (1-2 أسبوع)</option>
                      <option value="كبير (شهر)">كبير (شهر)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوصف العام للميزة</label>
                  <textarea
                    rows={2}
                    value={newIdeaDescription}
                    onChange={(e) => setNewIdeaDescription(e.target.value)}
                    placeholder="اشرح الهدف من هذه الميزة وكيف تفيد المستخدم..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    المواصفات الفنية والتفاصيل (كل نقطة في سطر منفصل)
                  </label>
                  <textarea
                    rows={3}
                    value={newIdeaSpecs}
                    onChange={(e) => setNewIdeaSpecs(e.target.value)}
                    placeholder="النقطة الأولى&#10;النقطة الثانية&#10;النقطة الثالثة..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddIdeaModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-on-accent hover:bg-accent-hover text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>حفظ وإضافة إلى الخطة</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Admin Confirmation Dialog */}
        <ConfirmModal
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel || 'تأكيد'}
          cancelLabel="إلغاء"
          variant={confirmState.variant || 'danger'}
          isLoading={confirmState.isLoading}
          onConfirm={confirmState.onConfirm}
          onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        />
      </main>
    </div>
  );
}
