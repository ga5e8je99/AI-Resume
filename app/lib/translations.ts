export type LanguageCode = 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
];

export interface TranslationDictionary {
  // Navigation & Header
  nav_brand: string;
  nav_brand_sub: string;
  nav_resume_builder: string;
  nav_cv_builder: string;
  nav_ats_review: string;
  nav_cover_letter: string;
  nav_dashboard: string;
  nav_admin: string;
  nav_login: string;
  nav_signup: string;
  nav_logout: string;
  nav_lang_switch: string;

  // Hero Section
  hero_badge: string;
  hero_title_prefix: string;
  hero_title_highlight: string;
  hero_title_suffix: string;
  hero_desc: string;
  hero_cta_create: string;
  hero_cta_create_desc: string;
  hero_cta_analyze: string;
  hero_cta_analyze_desc: string;
  hero_metric_skills: string;
  hero_metric_privacy: string;
  hero_metric_export: string;

  // Upload & Analyzer Section
  upload_section_tag: string;
  upload_section_title: string;
  upload_section_desc: string;
  upload_drop_title: string;
  upload_drop_sub: string;
  upload_drop_browse: string;
  upload_privacy_notice: string;
  upload_file_selected: string;
  upload_file_chars: string;
  upload_paste_label: string;
  upload_paste_placeholder: string;
  upload_job_title_label: string;
  upload_job_title_placeholder: string;
  upload_job_title_hint: string;
  upload_job_desc_label: string;
  upload_job_desc_placeholder: string;
  upload_job_desc_hint: string;
  upload_submit_btn: string;
  upload_submitting_btn: string;
  upload_sample_btn: string;
  upload_clear_btn: string;

  // Value Pillars & Features
  pillars_tag: string;
  pillars_title: string;
  pillars_desc: string;
  pillar_1_title: string;
  pillar_1_desc: string;
  pillar_2_title: string;
  pillar_2_desc: string;
  pillar_3_title: string;
  pillar_3_desc: string;
  pillar_4_title: string;
  pillar_4_desc: string;

  // Template Showcase
  templates_tag: string;
  templates_title: string;
  templates_desc: string;
  template_card_use: string;
  template_card_inspect: string;
  template_card_score: string;
  template_1_badge: string;
  template_1_title: string;
  template_1_job: string;
  template_1_summary: string;
  template_2_badge: string;
  template_2_title: string;
  template_2_job: string;
  template_2_summary: string;
  template_3_badge: string;
  template_3_title: string;
  template_3_job: string;
  template_3_summary: string;

  // Common UI Actions & Labels
  common_or: string;
  common_edit_builder: string;
  common_print_vector: string;
  common_download_pdf: string;
  common_download_word: string;
  common_save_cloud: string;
  common_loading: string;
  common_error: string;
  common_success: string;
  common_close: string;
  common_cancel: string;

  // Footer
  footer_desc: string;
  footer_col_tools: string;
  footer_col_legal: string;
  footer_col_account: string;
  footer_privacy: string;
  footer_terms: string;
  footer_rights: string;
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    nav_brand: 'JobMatch AI',
    nav_brand_sub: 'Career Platform',
    nav_resume_builder: 'Resume Builder',
    nav_cv_builder: 'CV Builder',
    nav_ats_review: 'ATS Review',
    nav_cover_letter: 'Cover Letter AI',
    nav_dashboard: 'Dashboard',
    nav_admin: 'Admin',
    nav_login: 'Sign In',
    nav_signup: 'Get Started',
    nav_logout: 'Sign Out',
    nav_lang_switch: 'Language',

    hero_badge: 'Intelligent Career Engine • Free & Private',
    hero_title_prefix: 'Build & Optimize Resumes for',
    hero_title_highlight: 'Real ATS Systems',
    hero_title_suffix: 'with JobMatch AI',
    hero_desc: 'Build applicant-tracking-system compliant resumes, diagnose compatibility gaps against 400+ industry skills, and generate tailored cover letters with instant client-side privacy.',
    hero_cta_create: 'Create New Resume',
    hero_cta_create_desc: 'Choose from 10+ standard single & two-column formats. Export to PDF, Word (.docx) or print.',
    hero_cta_analyze: 'Analyze Existing CV',
    hero_cta_analyze_desc: 'Upload your current PDF or text resume for instant algorithmic scoring and missing skill detection.',
    hero_metric_skills: '400+ Industry Skills Parsed',
    hero_metric_privacy: '100% Client-Side Privacy',
    hero_metric_export: 'Standard ISO A4 Layouts',

    upload_section_tag: 'AI Diagnostic Engine',
    upload_section_title: 'Analyze Your Existing Resume',
    upload_section_desc: 'Upload your resume file or paste text below to see an instant algorithmic evaluation of contact details, formatting, keywords, and metric density.',
    upload_drop_title: 'Drop your resume file here, or browse',
    upload_drop_sub: 'Supports PDF and TXT up to 5MB',
    upload_drop_browse: 'Select File',
    upload_privacy_notice: '100% private: PDF parsing happens entirely in your local browser using client-side Web Workers. No resume text is transmitted until you run analysis.',
    upload_file_selected: 'Selected file:',
    upload_file_chars: 'characters extracted',
    upload_paste_label: 'Or paste resume text directly:',
    upload_paste_placeholder: 'Paste your resume content here...',
    upload_job_title_label: 'Target Job Title (Optional)',
    upload_job_title_placeholder: 'e.g. Senior Frontend Engineer',
    upload_job_title_hint: 'Entering a title benchmarks your resume against relevant catalog skills.',
    upload_job_desc_label: 'Target Job Description (Optional)',
    upload_job_desc_placeholder: 'Paste the requirements and responsibilities to calculate exact keyword alignment...',
    upload_job_desc_hint: 'Pasting the full job description performs direct keyword matching and uncovers missing terms.',
    upload_submit_btn: 'Analyze Resume & View ATS Score',
    upload_submitting_btn: 'Analyzing Resume...',
    upload_sample_btn: 'Load Sample Resume',
    upload_clear_btn: 'Clear Form',

    pillars_tag: 'Core Advantages',
    pillars_title: 'Engineered for Modern Applicant Tracking Systems',
    pillars_desc: 'JobMatch AI eliminates the guesswork from job applications with verified algorithmic checks and clean export formats.',
    pillar_1_title: 'Algorithmic ATS Compatibility',
    pillar_1_desc: 'Evaluates heading hierarchy, contact fields, reverse-chronological flow, and metric density without fictional claims.',
    pillar_2_title: 'Keyword & Skill Alignment',
    pillar_2_desc: 'Identifies high-priority missing technical and soft skills directly from job postings across 400+ indexed domains.',
    pillar_3_title: 'Tailored AI Cover Letters',
    pillar_3_desc: 'Synthesizes authentic cover letters tailored to your target job title, experience level, and preferred professional tone.',
    pillar_4_title: 'Multi-Format Vector Export',
    pillar_4_desc: 'Download clean Microsoft Word (.docx) files or use Vector Print for 100% selectable, ATS-readable text PDFs.',

    templates_tag: 'Official Templates',
    templates_title: 'ATS-Optimized Resume Templates',
    templates_desc: 'Battle-tested layouts designed specifically to pass Taleo, Workday, Greenhouse, and standard HR parsers.',
    template_card_use: 'Use Template',
    template_card_inspect: 'Inspect Score',
    template_card_score: 'ATS Score',
    template_1_badge: '100% Single-Column ATS',
    template_1_title: 'Compact ATS Model',
    template_1_job: 'Frontend / Full-Stack Engineer',
    template_1_summary: 'Optimized for Taleo, Workday, and Greenhouse with strict single-column flow and inline contact metadata.',
    template_2_badge: 'Side-by-Side ATS Friendly',
    template_2_title: 'Structured Two-Column Model',
    template_2_job: 'Cloud & DevOps Architect',
    template_2_summary: 'Balanced layout with dedicated sidebar for core skills, certifications, and language proficiencies.',
    template_3_badge: 'High Density Layout',
    template_3_title: 'Executive Blue Accent Model',
    template_3_job: 'Engineering Manager / Lead',
    template_3_summary: 'Subtle corporate blue styling with generous whitespace for senior candidates and multi-year experience.',

    common_or: 'or',
    common_edit_builder: 'Edit in Builder',
    common_print_vector: 'Print / Vector PDF',
    common_download_pdf: 'Download PDF',
    common_download_word: 'Word (.docx)',
    common_save_cloud: 'Save to Cloud',
    common_loading: 'Loading...',
    common_error: 'An error occurred',
    common_success: 'Success',
    common_close: 'Close',
    common_cancel: 'Cancel',

    footer_desc: 'JobMatch AI helps job seekers craft ATS-compliant resumes, diagnose compatibility gaps, and generate customized cover letters with privacy by design.',
    footer_col_tools: 'Platform Tools',
    footer_col_legal: 'Legal & Privacy',
    footer_col_account: 'Account',
    footer_privacy: 'Privacy Policy',
    footer_terms: 'Terms of Service',
    footer_rights: 'All rights reserved.',
  },

  ar: {
    nav_brand: 'JobMatch AI',
    nav_brand_sub: 'منصة المسار المهني',
    nav_resume_builder: 'منشئ السيرة الذاتية',
    nav_cv_builder: 'منشئ CV الأكاديمي',
    nav_ats_review: 'فحص الـ ATS',
    nav_cover_letter: 'خطاب التقديم الذكي',
    nav_dashboard: 'لوحة التحكم',
    nav_admin: 'لوحة الإدارة',
    nav_login: 'تسجيل الدخول',
    nav_signup: 'ابدأ مجاناً',
    nav_logout: 'تسجيل الخروج',
    nav_lang_switch: 'اللغة',

    hero_badge: 'منظومة مهنية ذكية مدعومة بالذكاء الاصطناعي • مجانية وآمنة',
    hero_title_prefix: 'ابنِ وافحص سيرتك الذاتية لأنظمة',
    hero_title_highlight: 'ATS الحقيقية',
    hero_title_suffix: 'مع JobMatch AI',
    hero_desc: 'أنشئ سير ذاتية متوافقة مع أنظمة تتبع المتقدمين، واكتشف الفجوات والمهارات المفقودة مقارنة بأكثر من 400 مهارة معتمدة، مع خصوصية تامة ومعالجة محلية داخل متصفحك.',
    hero_cta_create: 'إنشاء سيرة ذاتية جديدة',
    hero_cta_create_desc: 'اختر من بين أكثر من 10 قوالب قياسية أحادية وثنائية الأعمدة. تصدير مباشر لـ PDF و Word أو طباعة متجهة.',
    hero_cta_analyze: 'فحص سيرة ذاتية حالية',
    hero_cta_analyze_desc: 'ارفع ملف سيرتك الحالية (PDF أو نص) للحصول على تقييم خوارزمي دقيق وكشف المهارات المطلوبة فوراً.',
    hero_metric_skills: 'أكثر من 400 مهارة مفهرسة',
    hero_metric_privacy: 'خصوصية محلية 100%',
    hero_metric_export: 'تنسيقات قياسية ISO A4',

    upload_section_tag: 'محرك الفحص الخوارزمي',
    upload_section_title: 'فحص وتحليل سيرتك الذاتية الحالية',
    upload_section_desc: 'ارفع ملف السيرة الذاتية أو الصق النص بالأسفل للحصول على تقييم فوري لبيانات الاتصال، التنسيق، الكلمات المفتاحية، وكثافة الإنجازات الرقمية.',
    upload_drop_title: 'أسقط ملف سيرتك الذاتية هنا، أو تصفح جهازك',
    upload_drop_sub: 'يدعم صيغ PDF و TXT بحجم أقصى 5 ميجابايت',
    upload_drop_browse: 'اختر ملفاً',
    upload_privacy_notice: 'خصوصية كاملة 100%: تتم قراءة وتحليل ملفات PDF محلياً بالكامل داخل متصفحك دون رفعها إلى أي خادم خارجي قبل الفحص.',
    upload_file_selected: 'الملف المحدد:',
    upload_file_chars: 'حرف تم استخراجه',
    upload_paste_label: 'أو الصق نص السيرة الذاتية مباشرة:',
    upload_paste_placeholder: 'الصق محتوى سيرتك الذاتية هنا...',
    upload_job_title_label: 'المسمى الوظيفي المستهدف (اختياري)',
    upload_job_title_placeholder: 'مثال: Senior Frontend Engineer',
    upload_job_title_hint: 'إدخال المسمى يقارن سيرتك الذاتية بمهارات المجال المعتمدة في الفهرس.',
    upload_job_desc_label: 'الوصف الوظيفي المستهدف (اختياري)',
    upload_job_desc_placeholder: 'الصق متطلبات ومسؤوليات الوظيفة لحساب نسبة التطابق الفعلي بدقة...',
    upload_job_desc_hint: 'لصق الوصف الوظيفي الكامل يقارن الكلمات المفتاحية بدقة ويبرز المصطلحات الناقصة ذات الأولوية.',
    upload_submit_btn: 'بدء فحص السيرة الذاتية وعرض درجة ATS',
    upload_submitting_btn: 'جارٍ تحليل السيرة الذاتية...',
    upload_sample_btn: 'تحميل سيرة ذاتية تجريبية',
    upload_clear_btn: 'مسح الحقول',

    pillars_tag: 'المزايا الجوهرية',
    pillars_title: 'مصمم خصيصاً لأنظمة تتبع المرشحين الحديثة',
    pillars_desc: 'يقضي JobMatch AI على التخمين في التقديم للوظائف بفضل الفحوصات الخوارزمية الصارمة والتصدير النظيف المتوافق مع معايير الشركات العالمية.',
    pillar_1_title: 'توافق ATS خوارزمي دقيق',
    pillar_1_desc: 'تقييم تسلسل العناوين، حقول الاتصال، الترتيب الزمني العكسي، وكثافة الأرقام بدون أي وعود وهمية.',
    pillar_2_title: 'مطابقة الكلمات والمهارات المفتاحية',
    pillar_2_desc: 'اكتشاف المهارات التقنية والشخصية المفقودة مباشرة من الوصف الوظيفي عبر فهرس يضم أكثر من 400 تخصص.',
    pillar_3_title: 'خطابات تقديم مخصصة بالذكاء الاصطناعي',
    pillar_3_desc: 'صياغة خطابات تقديم احترافية ومقنعة تتناسب مع المسمى الوظيفي المستهدف وخبراتك ونبرة الخطاب المطلوبة.',
    pillar_4_title: 'تصدير متعدد الصيغ بنصوص متجهة',
    pillar_4_desc: 'تنزيل ملفات Word (.docx) قابلة للتعديل أو طباعة متجهة (Vector Print) لملفات PDF بنصوص قابلة للبحث 100%.',

    templates_tag: 'القوالب المعتمدة',
    templates_title: 'نماذج سير ذاتية متوافقة 100% مع أنظمة ATS',
    templates_desc: 'تصاميم تم اختبارها خصيصاً لاجتياز أنظمة Taleo و Workday و Greenhouse وفلاتر مسؤولي التوظيف بنجاح.',
    template_card_use: 'استخدم القالب',
    template_card_inspect: 'نتيجة الفحص',
    template_card_score: 'درجة ATS',
    template_1_badge: 'نظام ATS أحادي العمود 100%',
    template_1_title: 'نموذج ATS صغير الحجم',
    template_1_job: 'مهندس واجهة أمامية / مهندس تطبيقات متكاملة',
    template_1_summary: 'تم تحسينه لأنظمة Taleo و Workday و Greenhouse مع تدفق صارم أحادي العمود وبيانات تعريف جهات الاتصال المضمنة.',
    template_2_badge: 'متوافق مع أنظمة التتبع جنباً إلى جنب',
    template_2_title: 'نموذج ذو عمودين منظم',
    template_2_job: 'مهندس معماري للحوسبة السحابية وتطوير العمليات',
    template_2_summary: 'تصميم متوازن مع شريط جانبي مخصص للمهارات الأساسية والشهادات وإتقان اللغات.',
    template_3_badge: 'تخطيط عالي الكثافة',
    template_3_title: 'نموذج اللمسة الزرقاء التنفيذي',
    template_3_job: 'مدير / رئيس قسم الهندسة',
    template_3_summary: 'تصميم أنيق باللون الأزرق مع مساحة بيضاء واسعة للمرشحين ذوي الخبرة الطويلة والإنجازات الاستراتيجية.',

    common_or: 'أو',
    common_edit_builder: 'تعديل في المنشئ',
    common_print_vector: 'طباعة / حفظ PDF متجه',
    common_download_pdf: 'تحميل PDF',
    common_download_word: 'مستند Word (.docx)',
    common_save_cloud: 'حفظ سحابي',
    common_loading: 'جارٍ التحميل...',
    common_error: 'حدث خطأ',
    common_success: 'تم بنجاح',
    common_close: 'إغلاق',
    common_cancel: 'إلغاء',

    footer_desc: 'منصة JobMatch AI تساعد الباحثين عن عمل في تصميم سير ذاتية متوافقة مع أنظمة ATS، وتحليل فجوات المهارات، وإنشاء خطابات تقديم مخصصة بخصوصية وأمان تام.',
    footer_col_tools: 'أدوات المنصة',
    footer_col_legal: 'الشؤون القانونية والخصوصية',
    footer_col_account: 'الحساب',
    footer_privacy: 'سياسة الخصوصية',
    footer_terms: 'شروط الاستخدام',
    footer_rights: 'جميع الحقوق محفوظة.',
  },

  fr: {
    nav_brand: 'JobMatch AI',
    nav_brand_sub: 'Plateforme Carrière',
    nav_resume_builder: 'Créateur de CV',
    nav_cv_builder: 'CV Académique',
    nav_ats_review: 'Audit ATS',
    nav_cover_letter: 'Lettre de Motivation IA',
    nav_dashboard: 'Tableau de bord',
    nav_admin: 'Admin',
    nav_login: 'Connexion',
    nav_signup: 'Commencer',
    nav_logout: 'Déconnexion',
    nav_lang_switch: 'Langue',

    hero_badge: 'Moteur de Carrière Intelligent • Gratuit & Privé',
    hero_title_prefix: 'Créez & Optimisez vos CV pour les',
    hero_title_highlight: 'Vrais Systèmes ATS',
    hero_title_suffix: 'avec JobMatch AI',
    hero_desc: 'Concevez des CV conformes aux systèmes de suivi des candidatures (ATS), diagnostiquez vos compétences manquantes parmi plus de 400 compétences indexées, avec une confidentialité locale garantie.',
    hero_cta_create: 'Créer un nouveau CV',
    hero_cta_create_desc: 'Choisissez parmi plus de 10 modèles conformes en colonnes simples ou doubles. Exportez en PDF, Word (.docx) ou imprimez.',
    hero_cta_analyze: 'Analyser un CV existant',
    hero_cta_analyze_desc: 'Téléversez votre CV PDF ou texte pour une évaluation algorithmique instantanée et la détection des compétences requises.',
    hero_metric_skills: '+400 Compétences Indexées',
    hero_metric_privacy: 'Confidentialité Locale 100%',
    hero_metric_export: 'Formats Standard ISO A4',

    upload_section_tag: 'Moteur de Diagnostic IA',
    upload_section_title: 'Analysez votre CV existant',
    upload_section_desc: 'Déposez votre CV ou collez son texte pour une évaluation algorithmique immédiate des coordonnées, de la structure, des mots-clés et des résultats chiffrés.',
    upload_drop_title: 'Glissez votre fichier de CV ici, ou parcourez',
    upload_drop_sub: 'Prend en charge PDF et TXT jusqu\'à 5 Mo',
    upload_drop_browse: 'Choisir un fichier',
    upload_privacy_notice: '100% privé : l\'extraction du PDF s\'effectue entièrement dans votre navigateur via des Web Workers locaux. Aucun texte n\'est transmis sans votre action.',
    upload_file_selected: 'Fichier sélectionné :',
    upload_file_chars: 'caractères extraits',
    upload_paste_label: 'Ou collez directement le texte du CV :',
    upload_paste_placeholder: 'Collez le contenu de votre CV ici...',
    upload_job_title_label: 'Titre du poste visé (Optionnel)',
    upload_job_title_placeholder: 'ex. Développeur Full-Stack Senior',
    upload_job_title_hint: 'Indiquer un titre compare votre CV aux compétences requises de notre catalogue.',
    upload_job_desc_label: 'Description du poste visé (Optionnel)',
    upload_job_desc_placeholder: 'Collez les prérequis et responsabilités pour calculer l\'adéquation exacte des mots-clés...',
    upload_job_desc_hint: 'Coller l\'offre complète permet une comparaison directe et met en valeur les termes prioritaires manquants.',
    upload_submit_btn: 'Analyser le CV & Voir le Score ATS',
    upload_submitting_btn: 'Analyse en cours...',
    upload_sample_btn: 'Charger un exemple',
    upload_clear_btn: 'Effacer le formulaire',

    pillars_tag: 'Points Forts',
    pillars_title: 'Conçu pour les Systèmes de Recrutement Modernes',
    pillars_desc: 'JobMatch AI élimine les incertitudes de vos candidatures grâce à des audits algorithmiques transparents et des formats fiables.',
    pillar_1_title: 'Compatibilité ATS Algorithmique',
    pillar_1_desc: 'Évalue la hiérarchie des titres, les coordonnées, l\'ordre chronologique inversé et les métriques sans fausses promesses.',
    pillar_2_title: 'Alignement des Mots-clés',
    pillar_2_desc: 'Détecte les compétences techniques et transversales manquantes directement depuis l\'offre d\'emploi ciblée.',
    pillar_3_title: 'Lettres de Motivation IA Sur-Mesure',
    pillar_3_desc: 'Génère des lettres de motivation percutantes adaptées au poste visé, à votre expérience et au ton souhaité.',
    pillar_4_title: 'Export Multi-Formats Vectoriel',
    pillar_4_desc: 'Téléchargez des fichiers Word (.docx) éditables ou imprimez en PDF vectoriel avec texte 100% sélectionnable.',

    templates_tag: 'Modèles Officiels',
    templates_title: 'Modèles de CV Optimisés ATS',
    templates_desc: 'Mises en page éprouvées conçues spécifiquement pour franchir les filtres Taleo, Workday, Greenhouse et les RH.',
    template_card_use: 'Utiliser ce modèle',
    template_card_inspect: 'Voir le score',
    template_card_score: 'Score ATS',
    template_1_badge: '100% Colonne Unique ATS',
    template_1_title: 'Modèle ATS Compact',
    template_1_job: 'Ingénieur Full-Stack / Front-End',
    template_1_summary: 'Optimisé pour Taleo, Workday et Greenhouse avec un flux rigoureux à colonne unique et métadonnées de contact en ligne.',
    template_2_badge: 'Deux Colonnes ATS Friendly',
    template_2_title: 'Modèle Structuré Deux Colonnes',
    template_2_job: 'Architecte Cloud & DevOps',
    template_2_summary: 'Mise en page équilibrée avec barre latérale dédiée aux compétences clés, certifications et compétences linguistiques.',
    template_3_badge: 'Mise en page Haute Densité',
    template_3_title: 'Modèle Exécutif Accent Bleu',
    template_3_job: 'Directeur Technique / Lead Développeur',
    template_3_summary: 'Style corporate élégant avec accents bleus et espace optimisé pour candidats expérimentés et profils seniors.',

    common_or: 'ou',
    common_edit_builder: 'Modifier dans le créateur',
    common_print_vector: 'Imprimer / PDF Vectoriel',
    common_download_pdf: 'Télécharger PDF',
    common_download_word: 'Document Word (.docx)',
    common_save_cloud: 'Enregistrer dans le Cloud',
    common_loading: 'Chargement...',
    common_error: 'Une erreur est survenue',
    common_success: 'Succès',
    common_close: 'Fermer',
    common_cancel: 'Annuler',

    footer_desc: 'JobMatch AI aide les candidats à créer des CV conformes aux ATS, à diagnostiquer les compétences manquantes et à rédiger des lettres de motivation sur-mesure.',
    footer_col_tools: 'Outils',
    footer_col_legal: 'Mentions Légales',
    footer_col_account: 'Compte',
    footer_privacy: 'Politique de Confidentialité',
    footer_terms: 'Conditions d\'Utilisation',
    footer_rights: 'Tous droits réservés.',
  },

  de: {
    nav_brand: 'JobMatch AI',
    nav_brand_sub: 'Karriere-Plattform',
    nav_resume_builder: 'Lebenslauf-Editor',
    nav_cv_builder: 'Akademischer CV',
    nav_ats_review: 'ATS-Prüfung',
    nav_cover_letter: 'KI-Anschreiben',
    nav_dashboard: 'Dashboard',
    nav_admin: 'Admin',
    nav_login: 'Anmelden',
    nav_signup: 'Kostenlos starten',
    nav_logout: 'Abmelden',
    nav_lang_switch: 'Sprache',

    hero_badge: 'Intelligente Karriere-Engine • Kostenlos & Sicher',
    hero_title_prefix: 'Erstellen & Optimieren Sie Lebensläufe für',
    hero_title_highlight: 'Echte ATS-Systeme',
    hero_title_suffix: 'mit JobMatch AI',
    hero_desc: 'Erstellen Sie ATS-konforme Lebensläufe, erkennen Sie Lücken gegenüber über 400 Branchenkompetenzen und generieren Sie maßgeschneiderte Anschreiben mit garantierter lokaler Privatsphäre.',
    hero_cta_create: 'Neuen Lebenslauf erstellen',
    hero_cta_create_desc: 'Wählen Sie aus über 10 Vorlagen in Ein- oder Zwei-Spalten-Layouts. Exportieren Sie als PDF, Word (.docx) oder Vektor-Druck.',
    hero_cta_analyze: 'Vorhandenen CV analysieren',
    hero_cta_analyze_desc: 'Laden Sie Ihren aktuellen PDF- oder Text-Lebenslauf hoch für eine sofortige algorithmische Bewertung und Skill-Analyse.',
    hero_metric_skills: 'Über 400 Branchen-Skills indexiert',
    hero_metric_privacy: '100% Lokaler Datenschutz',
    hero_metric_export: 'Standardisierte ISO A4 Vorlagen',

    upload_section_tag: 'KI-Diagnose-Engine',
    upload_section_title: 'Vorhandenen Lebenslauf analysieren',
    upload_section_desc: 'Laden Sie Ihren Lebenslauf hoch oder fügen Sie den Text ein, um Kontaktdaten, Formatierung, Schlüsselwörter und Leistungskennzahlen sofort prüfen zu lassen.',
    upload_drop_title: 'Lebenslauf-Datei hier ablegen oder durchsuchen',
    upload_drop_sub: 'Unterstützt PDF und TXT bis 5 MB',
    upload_drop_browse: 'Datei auswählen',
    upload_privacy_notice: '100% privat: Die PDF-Extraktion erfolgt vollständig lokal in Ihrem Browser über Web Worker. Keine Datenübertragung vor dem Start der Analyse.',
    upload_file_selected: 'Ausgewählte Datei:',
    upload_file_chars: 'Zeichen extrahiert',
    upload_paste_label: 'Oder Lebenslauf-Text direkt einfügen:',
    upload_paste_placeholder: 'Fügen Sie Ihren Lebenslauf-Text hier ein...',
    upload_job_title_label: 'Ziel-Berufsbezeichnung (Optional)',
    upload_job_title_placeholder: 'z.B. Senior Frontend Entwickler',
    upload_job_title_hint: 'Die Angabe vergleicht Ihren Lebenslauf mit relevanten Qualifikationen unseres Katalogs.',
    upload_job_desc_label: 'Ziel-Stellenbeschreibung (Optional)',
    upload_job_desc_placeholder: 'Fügen Sie Anforderungen und Aufgaben ein, um die exakte Keyword-Übereinstimmung zu ermitteln...',
    upload_job_desc_hint: 'Der vollständige Ausschreibungstext ermöglicht den exakten Abgleich und hebt fehlende Schlüsselbegriffe hervor.',
    upload_submit_btn: 'Lebenslauf analysieren & ATS-Score anzeigen',
    upload_submitting_btn: 'Analyse läuft...',
    upload_sample_btn: 'Muster-Lebenslauf laden',
    upload_clear_btn: 'Felder leeren',

    pillars_tag: 'Hauptvorteile',
    pillars_title: 'Entwickelt für Moderne Bewerber-Tracking-Systeme',
    pillars_desc: 'JobMatch AI beseitigt Unklarheiten bei Bewerbungen durch transparente algorithmische Analysen und saubere Ausgabeformate.',
    pillar_1_title: 'Algorithmische ATS-Prüfung',
    pillar_1_desc: 'Prüft Titelhierarchien, Kontaktdaten, umgekehrte Chronologie und messbare Erfolge ohne erfundene Kennzahlen.',
    pillar_2_title: 'Keyword- & Skill-Abgleich',
    pillar_2_desc: 'Ermittelt fehlende Hard- und Soft-Skills direkt aus der Stellenausschreibung über mehr als 400 indexierte Fachbereiche.',
    pillar_3_title: 'Individuelle KI-Anschreiben',
    pillar_3_desc: 'Formuliert überzeugende Anschreiben, die exakt auf die Stelle, Ihre Berufserfahrung und den gewünschten Ton abgestimmt sind.',
    pillar_4_title: 'Multi-Format Vektor-Export',
    pillar_4_desc: 'Laden Sie bearbeitbare Word (.docx) Dateien herunter oder nutzen Sie den Vektordruck für 100% durchsuchbare PDF-Dokumente.',

    templates_tag: 'Offizielle Vorlagen',
    templates_title: 'ATS-Optimierte Lebenslauf-Vorlagen',
    templates_desc: 'Erprobte Layouts, optimiert für Taleo, Workday, Greenhouse und HR-Recruiting-Software.',
    template_card_use: 'Vorlage verwenden',
    template_card_inspect: 'Score prüfen',
    template_card_score: 'ATS-Score',
    template_1_badge: '100% Einspaltiges ATS',
    template_1_title: 'Kompaktes ATS-Modell',
    template_1_job: 'Frontend / Full-Stack Entwickler',
    template_1_summary: 'Optimiert für Taleo, Workday und Greenhouse mit strengem einspaltigem Ablauf und integrierten Kontaktdaten.',
    template_2_badge: 'Zweispaltig ATS-Freundlich',
    template_2_title: 'Strukturiertes Zwei-Spalten-Modell',
    template_2_job: 'Cloud & DevOps Architekt',
    template_2_summary: 'Ausgewogenes Layout mit strukturierter Seitenleiste für Kernkompetenzen, Zertifikate und Sprachkenntnisse.',
    template_3_badge: 'Hohe Informationsdichte',
    template_3_title: 'Executive Blau-Akzent Modell',
    template_3_job: 'Engineering Manager / Lead',
    template_3_summary: 'Subtile Corporate-Blue Akzente mit idealem Weißraum für Senior-Kandidaten mit mehrjähriger Führungserfahrung.',

    common_or: 'oder',
    common_edit_builder: 'Im Editor anpassen',
    common_print_vector: 'Drucken / Vektor-PDF',
    common_download_pdf: 'PDF herunterladen',
    common_download_word: 'Word (.docx) Dokument',
    common_save_cloud: 'In Cloud speichern',
    common_loading: 'Wird geladen...',
    common_error: 'Ein Fehler ist aufgetreten',
    common_success: 'Erfolgreich',
    common_close: 'Schließen',
    common_cancel: 'Abbrechen',

    footer_desc: 'JobMatch AI unterstützt Bewerber bei der Erstellung ATS-konformer Lebensläufe, der Fehleranalyse und der Erstellung individueller Anschreiben mit höchstem Datenschutz.',
    footer_col_tools: 'Werkzeuge',
    footer_col_legal: 'Rechtliches & Datenschutz',
    footer_col_account: 'Konto',
    footer_privacy: 'Datenschutzerklärung',
    footer_terms: 'Nutzungsbedingungen',
    footer_rights: 'Alle Rechte vorbehalten.',
  },

  es: {
    nav_brand: 'JobMatch AI',
    nav_brand_sub: 'Plataforma Profesional',
    nav_resume_builder: 'Creador de CV',
    nav_cv_builder: 'CV Académico',
    nav_ats_review: 'Revisión ATS',
    nav_cover_letter: 'Carta de Presentación IA',
    nav_dashboard: 'Panel de Control',
    nav_admin: 'Admin',
    nav_login: 'Iniciar Sesión',
    nav_signup: 'Empezar Gratis',
    nav_logout: 'Cerrar Sesión',
    nav_lang_switch: 'Idioma',

    hero_badge: 'Motor de Carrera Inteligente • Gratuito & Privado',
    hero_title_prefix: 'Crea y Optimiza tu Currículum para',
    hero_title_highlight: 'Sistemas ATS Reales',
    hero_title_suffix: 'con JobMatch AI',
    hero_desc: 'Crea currículums compatibles con sistemas de seguimiento de candidatos (ATS), detecta palabras clave faltantes entre más de 400 competencias y genera cartas personalizadas con privacidad local garantizada.',
    hero_cta_create: 'Crear Nuevo Currículum',
    hero_cta_create_desc: 'Elige entre más de 10 plantillas estándar de una o dos columnas. Exporta en PDF, Word (.docx) o imprime en vectores.',
    hero_cta_analyze: 'Analizar CV Existente',
    hero_cta_analyze_desc: 'Sube tu CV en PDF o texto para obtener una puntuación algorítmica instantánea y detectar habilidades faltantes.',
    hero_metric_skills: '+400 Habilidades Indexadas',
    hero_metric_privacy: 'Privacidad Local 100%',
    hero_metric_export: 'Formatos Estándar ISO A4',

    upload_section_tag: 'Motor de Diagnóstico IA',
    upload_section_title: 'Analiza tu Currículum Existente',
    upload_section_desc: 'Sube tu archivo o pega tu texto para evaluar al instante datos de contacto, formato, palabras clave y densidad de métricas cuantificables.',
    upload_drop_title: 'Arrastra tu currículum aquí, o busca en tu equipo',
    upload_drop_sub: 'Admite archivos PDF y TXT de hasta 5 MB',
    upload_drop_browse: 'Seleccionar Archivo',
    upload_privacy_notice: '100% privado: la extracción de texto en PDF se ejecuta localmente en tu navegador sin transmitir datos a servidores externos antes del análisis.',
    upload_file_selected: 'Archivo seleccionado:',
    upload_file_chars: 'caracteres extraídos',
    upload_paste_label: 'O pega el texto del CV directamente:',
    upload_paste_placeholder: 'Pega el contenido de tu currículum aquí...',
    upload_job_title_label: 'Puesto de Trabajo Deseado (Opcional)',
    upload_job_title_placeholder: 'ej. Ingeniero Frontend Senior',
    upload_job_title_hint: 'Ingresar el puesto compara tu CV con las competencias estándar del sector.',
    upload_job_desc_label: 'Descripción de la Oferta de Empleo (Opcional)',
    upload_job_desc_placeholder: 'Pega los requisitos y responsabilidades para medir la coincidencia exacta de palabras clave...',
    upload_job_desc_hint: 'Pegar la oferta completa calcula el emparejamiento exacto y resalta las palabras clave ausentes.',
    upload_submit_btn: 'Analizar CV y Ver Puntuación ATS',
    upload_submitting_btn: 'Analizando currículum...',
    upload_sample_btn: 'Cargar CV de Ejemplo',
    upload_clear_btn: 'Limpiar Campos',

    pillars_tag: 'Ventajas Principales',
    pillars_title: 'Diseñado para los Sistemas ATS Modernos',
    pillars_desc: 'JobMatch AI elimina las dudas al postularte mediante diagnósticos algorítmicos precisos y formatos de exportación limpios.',
    pillar_1_title: 'Compatibilidad ATS Algorítmica',
    pillar_1_desc: 'Evalúa la jerarquía de títulos, datos de contacto, cronología inversa y métricas cuantificables sin datos ficticios.',
    pillar_2_title: 'Alineación de Habilidades y Palabras Clave',
    pillar_2_desc: 'Identifica competencias técnicas y blandas faltantes directamente desde las ofertas laborales entre más de 400 especialidades.',
    pillar_3_title: 'Cartas de Presentación IA a Medida',
    pillar_3_desc: 'Genera cartas de presentación convincentes adaptadas al puesto, a tus años de experiencia y al tono profesional deseado.',
    pillar_4_title: 'Exportación Vectorial Multiformato',
    pillar_4_desc: 'Descarga archivos Word (.docx) editables o imprime en PDF vectorial con texto 100% seleccionable para portales de empleo.',

    templates_tag: 'Plantillas Oficiales',
    templates_title: 'Plantillas de CV Optimizadas para ATS',
    templates_desc: 'Formatos aprobados diseñados específicamente para superar filtros de Taleo, Workday, Greenhouse y reclutadores humanos.',
    template_card_use: 'Usar Plantilla',
    template_card_inspect: 'Inspeccionar Score',
    template_card_score: 'Puntuación ATS',
    template_1_badge: '100% Una Columna ATS',
    template_1_title: 'Modelo ATS Compacto',
    template_1_job: 'Ingeniero Full-Stack / Frontend',
    template_1_summary: 'Optimizado para Taleo, Workday y Greenhouse con diseño estricto de una columna y datos de contacto en línea.',
    template_2_badge: 'Dos Columnas ATS Friendly',
    template_2_title: 'Modelo Estructurado en Dos Columnas',
    template_2_job: 'Arquitecto Cloud & DevOps',
    template_2_summary: 'Diseño equilibrado con barra lateral para competencias técnicas, certificaciones oficiales y dominio de idiomas.',
    template_3_badge: 'Alta Densidad de Contenido',
    template_3_title: 'Modelo Ejecutivo Acento Azul',
    template_3_job: 'Director / Gerente de Ingeniería',
    template_3_summary: 'Estilo corporativo con detalles en azul y espacio blanco equilibrado para perfiles sénior y trayectoria amplia.',

    common_or: 'o',
    common_edit_builder: 'Editar en el Creador',
    common_print_vector: 'Imprimir / PDF Vectorial',
    common_download_pdf: 'Descargar PDF',
    common_download_word: 'Documento Word (.docx)',
    common_save_cloud: 'Guardar en la Nube',
    common_loading: 'Cargando...',
    common_error: 'Ocurrió un error',
    common_success: 'Completado con éxito',
    common_close: 'Cerrar',
    common_cancel: 'Cancelar',

    footer_desc: 'JobMatch AI ayuda a los profesionales a crear currículums adaptados a sistemas ATS, diagnosticar brechas de habilidades y redactar cartas personalizadas con total privacidad.',
    footer_col_tools: 'Herramientas',
    footer_col_legal: 'Legal y Privacidad',
    footer_col_account: 'Cuenta',
    footer_privacy: 'Política de Privacidad',
    footer_terms: 'Términos de Servicio',
    footer_rights: 'Todos los derechos reservados.',
  },

  tr: {
    nav_brand: 'JobMatch AI',
    nav_brand_sub: 'Kariyer Platformu',
    nav_resume_builder: 'Özgeçmiş Oluşturucu',
    nav_cv_builder: 'Akademik CV',
    nav_ats_review: 'ATS Analizi',
    nav_cover_letter: 'Yapay Zeka Ön Yazı',
    nav_dashboard: 'Kontrol Paneli',
    nav_admin: 'Yönetici',
    nav_login: 'Giriş Yap',
    nav_signup: 'Ücretsiz Başla',
    nav_logout: 'Çıkış Yap',
    nav_lang_switch: 'Dil',

    hero_badge: 'Akıllı Kariyer Motoru • Ücretsiz ve Güvenli',
    hero_title_prefix: 'Özgeçmişinizi Hazırlayın ve',
    hero_title_highlight: 'Gerçek ATS Sistemleri',
    hero_title_suffix: 'İçin Optimize Edin',
    hero_desc: 'Aday Takip Sistemleri (ATS) ile tam uyumlu özgeçmişler hazırlayın, 400\'den fazla sektör becerisine göre eksiklerinizi tespit edin ve tam yerel gizlilikle kişiselleştirilmiş ön yazılar oluşturun.',
    hero_cta_create: 'Yeni Özgeçmiş Oluştur',
    hero_cta_create_desc: '10\'dan fazla tek ve çift sütunlu standart şablon arasından seçim yapın. PDF, Word (.docx) veya vektörel baskı olarak dışa aktarın.',
    hero_cta_analyze: 'Mevcut CV\'yi Analiz Et',
    hero_cta_analyze_desc: 'Anında algoritmik puanlama ve eksik beceri analizi için mevcut PDF veya metin özgeçmişinizi yükleyin.',
    hero_metric_skills: '400+ İndekslenmiş Sektör Becerisi',
    hero_metric_privacy: '%100 Yerel Tarayıcı Gizliliği',
    hero_metric_export: 'Standart ISO A4 Formatları',

    upload_section_tag: 'Yapay Zeka Teşhis Motoru',
    upload_section_title: 'Mevcut Özgeçmişinizi Analiz Edin',
    upload_section_desc: 'İletişim bilgileri, biçimlendirme, anahtar kelimeler ve ölçülebilir başarı yoğunluğunu anında görmek için özgeçmişinizi yükleyin veya metnini yapıştırın.',
    upload_drop_title: 'Özgeçmiş dosyanızı buraya bırakın veya göz atın',
    upload_drop_sub: '5 MB\'a kadar PDF ve TXT formatlarını destekler',
    upload_drop_browse: 'Dosya Seç',
    upload_privacy_notice: '%100 gizli: PDF ayrıştırma işlemi tamamen tarayıcınızda yerel Web Worker\'lar aracılığıyla gerçekleşir. Analiz başlatılana kadar metin dışarı aktarılmaz.',
    upload_file_selected: 'Seçilen dosya:',
    upload_file_chars: 'karakter çıkarıldı',
    upload_paste_label: 'Veya özgeçmiş metnini doğrudan yapıştırın:',
    upload_paste_placeholder: 'Özgeçmiş içeriğinizi buraya yapıştırın...',
    upload_job_title_label: 'Hedef Pozisyon Başlığı (İsteğe Bağlı)',
    upload_job_title_placeholder: 'örn. Kıdemli Ön Yüz Geliştirici',
    upload_job_title_hint: 'Başlık girmek, özgeçmişinizi ilgili sektör becerileri kataloğuyla karşılaştırır.',
    upload_job_desc_label: 'Hedef İş İlanı Açıklaması (İsteğe Bağlı)',
    upload_job_desc_placeholder: 'Tam anahtar kelime eşleşmesini hesaplamak için iş gereksinimlerini ve sorumluluklarını yapıştırın...',
    upload_job_desc_hint: 'Tüm iş tanımını yapıştırmak, doğrudan anahtar kelime eşleşmesi sağlar ve eksik terimleri vurgular.',
    upload_submit_btn: 'Özgeçmişi Analiz Et ve ATS Puanını Gör',
    upload_submitting_btn: 'Özgeçmiş analiz ediliyor...',
    upload_sample_btn: 'Örnek Özgeçmiş Yükle',
    upload_clear_btn: 'Formu Temizle',

    pillars_tag: 'Temel Avantajlar',
    pillars_title: 'Modern Aday Takip Sistemleri İçin Tasarlandı',
    pillars_desc: 'JobMatch AI, şeffaf algoritmik kontroller ve temiz çıktı formatlarıyla iş başvurularınızdaki belirsizlikleri ortadan kaldırır.',
    pillar_1_title: 'Algoritmik ATS Uyumluluğu',
    pillar_1_desc: 'Başlık hiyerarşisi, iletişim alanları, ters kronolojik akış ve ölçülebilir metrik yoğunluğunu gerçekçi olarak değerlendirir.',
    pillar_2_title: 'Anahtar Kelime ve Beceri Eşleştirme',
    pillar_2_desc: '400\'den fazla sektör alanında hedef iş ilanındaki eksik teknik ve sosyal becerileri doğrudan tespit eder.',
    pillar_3_title: 'Kişiselleştirilmiş Yapay Zeka Ön Yazılar',
    pillar_3_desc: 'Hedef unvanınıza, tecrübenize ve tercih ettiğiniz profesyonel üsluba uygun ikna edici ön yazılar oluşturur.',
    pillar_4_title: 'Çok Formatlı Vektör Dışa Aktarım',
    pillar_4_desc: 'Düzenlenebilir Microsoft Word (.docx) indirin veya ATS portalları için %100 seçilebilir metin içeren Vektörel PDF yazdırın.',

    templates_tag: 'Resmi Şablonlar',
    templates_title: 'ATS-Optimize Özgeçmiş Şablonları',
    templates_desc: 'Taleo, Workday, Greenhouse ve İK filtrelerinden başarıyla geçecek şekilde tasarlanmış şablonlar.',
    template_card_use: 'Şablonu Kullan',
    template_card_inspect: 'Puanı İncele',
    template_card_score: 'ATS Puanı',
    template_1_badge: '%100 Tek Sütunlu ATS',
    template_1_title: 'Kompakt ATS Modeli',
    template_1_job: 'Ön Yüz / Full-Stack Mühendisi',
    template_1_summary: 'Taleo, Workday ve Greenhouse için optimize edilmiş, katı tek sütunlu ve satır içi iletişim meta verilerine sahip düzen.',
    template_2_badge: 'Çift Sütunlu ATS Uyumlu',
    template_2_title: 'Yapılandırılmış Çift Sütun Modeli',
    template_2_job: 'Bulut ve DevOps Mimarı',
    template_2_summary: 'Temel beceriler, sertifikalar ve dil yeterlilikleri için ayrılmış kenar çubuğuyla dengeli düzen.',
    template_3_badge: 'Yüksek Bilgi Yoğunluğu',
    template_3_title: 'Yönetici Mavi Vurgulu Model',
    template_3_job: 'Mühendislik Yöneticisi / Lider',
    template_3_summary: 'Deneyimli adaylar ve yöneticiler için kurumsal mavi vurgular ve ferah beyaz boşluk dengesi.',

    common_or: 'veya',
    common_edit_builder: 'Oluşturucuda Düzenle',
    common_print_vector: 'Yazdır / Vektörel PDF',
    common_download_pdf: 'PDF İndir',
    common_download_word: 'Word (.docx) İndir',
    common_save_cloud: 'Buluta Kaydet',
    common_loading: 'Yükleniyor...',
    common_error: 'Bir hata oluştu',
    common_success: 'Başarılı',
    common_close: 'Kapat',
    common_cancel: 'İptal',

    footer_desc: 'JobMatch AI, iş arayanların ATS uyumlu özgeçmişler hazırlamasına, beceri açıklarını analiz etmesine ve gizlilik odaklı ön yazılar oluşturmasına yardımcı olur.',
    footer_col_tools: 'Platform Araçları',
    footer_col_legal: 'Yasal ve Gizlilik',
    footer_col_account: 'Hesap',
    footer_privacy: 'Gizlilik Politikası',
    footer_terms: 'Kullanım Şartları',
    footer_rights: 'Tüm hakları saklıdır.',
  },
};
