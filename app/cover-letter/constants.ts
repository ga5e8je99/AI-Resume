import { CoverLetterTone, CoverLetterLanguage } from './types';

export interface TonePreset {
  id: CoverLetterTone;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  badgeColor: string;
}

export const TONE_PRESETS: TonePreset[] = [
  {
    id: 'formal',
    labelAr: 'احترافي ورسمي',
    labelEn: 'Professional',
    descriptionAr: 'نبرة رصينة ومحترمة، مثالية للشركات الكبرى والمؤسسات والوظائف التنفيذية.',
    descriptionEn: 'Polished, authoritative, and respectful. Ideal for corporate, finance, and enterprise roles.',
    icon: 'Briefcase',
    badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  },
  {
    id: 'enthusiastic',
    labelAr: 'ودي وحماسي',
    labelEn: 'Friendly',
    descriptionAr: 'نبرة إيجابية وشغوفة بالنمو والعمل الجماعي، ممتازة للشركات الناشئة وفرق التقنية.',
    descriptionEn: 'Warm, personable, and energetic. Perfect for modern startups and collaborative cultures.',
    icon: 'Sparkles',
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  {
    id: 'leadership',
    labelAr: 'واثق وقيادي',
    labelEn: 'Confident',
    descriptionAr: 'يبرز المبادرة، الإنجازات الملموسة، وتحقيق الأهداف القيادية بجرأة وثقة.',
    descriptionEn: 'Assertive, impact-driven, and forward-looking. Emphasizes strategic vision and initiative.',
    icon: 'Award',
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  },
  {
    id: 'technical',
    labelAr: 'تقني تحليلي',
    labelEn: 'Technical',
    descriptionAr: 'تركيز دقيق على المهارات البرمجية، الحلول الهندسية، والمشاريع والأرقام القياسية.',
    descriptionEn: 'Laser-focused on tech stack, engineering metrics, and technical contributions.',
    icon: 'Code',
    badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  },
];

export const LANGUAGE_OPTIONS: { id: CoverLetterLanguage; label: string; dir: 'rtl' | 'ltr' }[] = [
  { id: 'ar', label: 'العربية (RTL)', dir: 'rtl' },
  { id: 'en', label: 'English (LTR)', dir: 'ltr' },
  { id: 'fr', label: 'Français', dir: 'ltr' },
  { id: 'de', label: 'Deutsch', dir: 'ltr' },
  { id: 'es', label: 'Español', dir: 'ltr' },
  { id: 'tr', label: 'Türkçe', dir: 'ltr' },
];

export const GENERATION_STEPS = [
  { id: 1, titleAr: 'تحليل الوصف الوظيفي واستخراج الكلمات المفتاحية (Keywords)...', titleEn: 'Analyzing job description and extracting keywords...' },
  { id: 2, titleAr: 'مطابقة المهارات والإنجازات من السيرة الذاتية...', titleEn: 'Matching skills and achievements from resume...' },
  { id: 3, titleAr: 'صياغة فقرات الخطاب بالنبرة المختارة...', titleEn: 'Crafting letter paragraphs with selected tone...' },
  { id: 4, titleAr: 'التنسيق النهائي والمراجعة اللغوية ATS...', titleEn: 'Final formatting and ATS compliance check...' },
];

export const UX_VALIDATION = {
  MIN_JOB_DESCRIPTION_LENGTH: 50,
  MAX_JOB_DESCRIPTION_LENGTH: 10000,
  RECOMMENDED_MIN_WORDS: 20,
};
