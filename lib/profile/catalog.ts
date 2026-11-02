export type SupportedCatalogLocale = 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';

export interface MultilingualCatalogItem {
  id: string;
  category: string;
  labels: Record<SupportedCatalogLocale, string>;
  aliases?: string[];
}

export interface ProfileSuggestionItem {
  id: string;
  value: string;
  label: string;
  category: string;
  labels: Record<SupportedCatalogLocale, string>;
}

export const ROLE_CATALOG: MultilingualCatalogItem[] = [
  {
    id: 'role_frontend_engineer',
    category: 'Technology',
    labels: {
      en: 'Frontend Engineer',
      ar: 'مهندس واجهات أمامية (Frontend)',
      fr: 'Ingénieur Frontend',
      de: 'Frontend-Entwickler',
      es: 'Ingeniero Frontend',
      tr: 'Frontend Geliştirici',
    },
    aliases: ['react developer', 'ui developer', 'web developer', 'مطور واجهات', 'فرونت اند'],
  },
  {
    id: 'role_backend_engineer',
    category: 'Technology',
    labels: {
      en: 'Backend Engineer',
      ar: 'مهندس واجهات خلفية (Backend)',
      fr: 'Ingénieur Backend',
      de: 'Backend-Entwickler',
      es: 'Ingeniero Backend',
      tr: 'Backend Geliştirici',
    },
    aliases: ['api developer', 'node.js developer', 'مطور باك اند', 'مهندس برمجيات خلفية'],
  },
  {
    id: 'role_fullstack_developer',
    category: 'Technology',
    labels: {
      en: 'Full Stack Developer',
      ar: 'مطور شامل (Full Stack)',
      fr: 'Développeur Full Stack',
      de: 'Full-Stack-Entwickler',
      es: 'Desarrollador Full Stack',
      tr: 'Full Stack Geliştirici',
    },
    aliases: ['software engineer', 'مطور ويب متكامل', 'فول ستاك'],
  },
  {
    id: 'role_software_engineer',
    category: 'Technology',
    labels: {
      en: 'Software Engineer',
      ar: 'مهندس برمجيات',
      fr: 'Ingénieur Logiciel',
      de: 'Softwareingenieur',
      es: 'Ingeniero de Software',
      tr: 'Yazılım Mühendisi',
    },
    aliases: ['swe', 'programmer', 'مبرمج', 'مطور برمجيات'],
  },
  {
    id: 'role_mobile_developer',
    category: 'Technology',
    labels: {
      en: 'Mobile App Developer',
      ar: 'مطور تطبيقات موبايل',
      fr: 'Développeur Mobile',
      de: 'Mobile-App-Entwickler',
      es: 'Desarrollador Móvil',
      tr: 'Mobil Uygulama Geliştirici',
    },
    aliases: ['ios', 'android', 'flutter', 'react native', 'تطبيقات الهواتف'],
  },
  {
    id: 'role_devops_engineer',
    category: 'Technology',
    labels: {
      en: 'DevOps & Cloud Engineer',
      ar: 'مهندس ديف أوبس وسحابة (DevOps)',
      fr: 'Ingénieur DevOps & Cloud',
      de: 'DevOps- & Cloud-Ingenieur',
      es: 'Ingeniero DevOps y Cloud',
      tr: 'DevOps ve Bulut Mühendisi',
    },
    aliases: ['sre', 'site reliability', 'aws', 'kubernetes', 'مهندس سحابة'],
  },
  {
    id: 'role_cybersecurity_analyst',
    category: 'Technology',
    labels: {
      en: 'Cybersecurity Analyst',
      ar: 'محلل أمن سيبراني',
      fr: 'Analyste en Cybersécurité',
      de: 'Cybersecurity-Analyst',
      es: 'Analista de Ciberseguridad',
      tr: 'Siber Güvenlik Analisti',
    },
    aliases: ['infosec', 'security engineer', 'أمن المعلومات'],
  },
  {
    id: 'role_qa_engineer',
    category: 'Technology',
    labels: {
      en: 'QA Automation Engineer',
      ar: 'مهندس ضمان جودة البرمجيات (QA)',
      fr: 'Ingénieur QA Automatisation',
      de: 'QA-Automatisierungsingenieur',
      es: 'Ingeniero de QA y Automatización',
      tr: 'QA Otomasyon Mühendisi',
    },
    aliases: ['software tester', 'مختبر برمجيات', 'جودة البرمجيات'],
  },
  {
    id: 'role_data_analyst',
    category: 'Data & AI',
    labels: {
      en: 'Data Analyst',
      ar: 'محلل بيانات',
      fr: 'Analyste de Données',
      de: 'Datenanalyst',
      es: 'Analista de Datos',
      tr: 'Veri Analisti',
    },
    aliases: ['bi analyst', 'business intelligence', 'تحليل البيانات'],
  },
  {
    id: 'role_data_scientist',
    category: 'Data & AI',
    labels: {
      en: 'Data Scientist',
      ar: 'عالم بيانات',
      fr: 'Data Scientist',
      de: 'Data Scientist',
      es: 'Científico de Datos',
      tr: 'Veri Bilimcisi',
    },
    aliases: ['machine learning', 'علم البيانات'],
  },
  {
    id: 'role_ai_ml_engineer',
    category: 'Data & AI',
    labels: {
      en: 'AI / Machine Learning Engineer',
      ar: 'مهندس ذكاء اصطناعي وتعلم آلي',
      fr: 'Ingénieur IA / Machine Learning',
      de: 'KI- / Machine-Learning-Ingenieur',
      es: 'Ingeniero de IA y Machine Learning',
      tr: 'Yapay Zeka Mühendisi',
    },
    aliases: ['llm', 'deep learning', 'nlp', 'ذكاء اصطناعي'],
  },
  {
    id: 'role_product_manager',
    category: 'Product & Design',
    labels: {
      en: 'Product Manager',
      ar: 'مدير منتج (Product Manager)',
      fr: 'Chef de Produit',
      de: 'Produktmanager',
      es: 'Gerente de Producto',
      tr: 'Ürün Yöneticisi',
    },
    aliases: ['pm', 'product owner', 'إدارة المنتجات'],
  },
  {
    id: 'role_ui_ux_designer',
    category: 'Product & Design',
    labels: {
      en: 'UI/UX Product Designer',
      ar: 'مصمم واجهات وتجربة المستخدم (UI/UX)',
      fr: 'Designer UI/UX',
      de: 'UI/UX-Produktdesigner',
      es: 'Diseñador UI/UX',
      tr: 'UI/UX Tasarımcısı',
    },
    aliases: ['figma', 'interaction designer', 'مصمم تجربة المستخدم'],
  },
  {
    id: 'role_graphic_designer',
    category: 'Product & Design',
    labels: {
      en: 'Graphic Designer',
      ar: 'مصمم جرافيك',
      fr: 'Graphiste',
      de: 'Grafikdesigner',
      es: 'Diseñador Gráfico',
      tr: 'Grafik Tasarımcı',
    },
    aliases: ['visual designer', 'branding', 'تصميم جرافيك'],
  },
  {
    id: 'role_project_manager',
    category: 'Management & Operations',
    labels: {
      en: 'Project Manager',
      ar: 'مدير مشاريع',
      fr: 'Chef de Projet',
      de: 'Projektmanager',
      es: 'Gerente de Proyectos',
      tr: 'Proje Yöneticisi',
    },
    aliases: ['pmp', 'scrum master', 'agile', 'إدارة المشروعات'],
  },
  {
    id: 'role_operations_manager',
    category: 'Management & Operations',
    labels: {
      en: 'Operations Manager',
      ar: 'مدير عمليات',
      fr: 'Responsable des Opérations',
      de: 'Operations Manager',
      es: 'Gerente de Operaciones',
      tr: 'Operasyon Yöneticisi',
    },
    aliases: ['supply chain', 'logistics', 'إدارة العمليات'],
  },
  {
    id: 'role_business_analyst',
    category: 'Management & Operations',
    labels: {
      en: 'Business Analyst',
      ar: 'محلل أعمال',
      fr: "Analyste d'Affaires",
      de: 'Business-Analyst',
      es: 'Analista de Negocios',
      tr: 'İş Analisti',
    },
    aliases: ['ba', 'requirements', 'تحليل الأعمال'],
  },
  {
    id: 'role_digital_marketing',
    category: 'Marketing & Sales',
    labels: {
      en: 'Digital Marketing Specialist',
      ar: 'أخصائي تسويق رقمي',
      fr: 'Spécialiste Marketing Digital',
      de: 'Digital-Marketing-Spezialist',
      es: 'Especialista en Marketing Digital',
      tr: 'Dijital Pazarlama Uzmanı',
    },
    aliases: ['seo', 'sem', 'growth marketer', 'تسويق إلكتروني'],
  },
  {
    id: 'role_sales_manager',
    category: 'Marketing & Sales',
    labels: {
      en: 'Sales & Business Development Manager',
      ar: 'مدير مبيعات وتطوير أعمال',
      fr: 'Responsable Commercial & Business Development',
      de: 'Vertriebs- und Business-Development-Manager',
      es: 'Gerente de Ventas y Desarrollo de Negocios',
      tr: 'Satış ve İş Geliştirme Yöneticisi',
    },
    aliases: ['account executive', 'bdm', 'مندوب مبيعات', 'تطوير الأعمال'],
  },
  {
    id: 'role_content_strategist',
    category: 'Marketing & Sales',
    labels: {
      en: 'Content Writer & Copywriter',
      ar: 'كاتب محتوى وصانع محتوى إعلاني',
      fr: 'Rédacteur Web & Copywriter',
      de: 'Content-Writer & Texter',
      es: 'Redactor de Contenidos y Copywriter',
      tr: 'İçerik Yazarı ve Metin Yazarı',
    },
    aliases: ['copywriting', 'كتابة محتوى'],
  },
  {
    id: 'role_accountant',
    category: 'Finance & Accounting',
    labels: {
      en: 'Financial Accountant',
      ar: 'محاسب مالي',
      fr: 'Comptable Financier',
      de: 'Finanzbuchhalter',
      es: 'Contador Financiero',
      tr: 'Mali Müşavir / Muhasebeci',
    },
    aliases: ['cpa', 'auditor', 'bookkeeper', 'محاسبة', 'مراجع حسابات'],
  },
  {
    id: 'role_financial_analyst',
    category: 'Finance & Accounting',
    labels: {
      en: 'Financial Analyst',
      ar: 'محلل مالي',
      fr: 'Analyste Financier',
      de: 'Finanzanalyst',
      es: 'Analista Financiero',
      tr: 'Finansal Analist',
    },
    aliases: ['fp&a', 'investment analyst', 'تحليل مالي'],
  },
  {
    id: 'role_hr_specialist',
    category: 'Human Resources',
    labels: {
      en: 'HR & Talent Acquisition Specialist',
      ar: 'أخصائي موارد بشرية واستقطاب كفاءات',
      fr: 'Spécialiste RH & Recrutement',
      de: 'HR- & Recruiting-Spezialist',
      es: 'Especialista en RRHH y Adquisición de Talento',
      tr: 'İK ve Yetenek Kazanımı Uzmanı',
    },
    aliases: ['recruiter', 'human resources', 'موارد بشرية', 'توظيف'],
  },
  {
    id: 'role_civil_engineer',
    category: 'Engineering',
    labels: {
      en: 'Civil & Structural Engineer',
      ar: 'مهندس مدني وإنشائي',
      fr: 'Ingénieur Génie Civil',
      de: 'Bauingenieur',
      es: 'Ingeniero Civil',
      tr: 'İnşaat Mühendisi',
    },
    aliases: ['site engineer', 'construction', 'مهندس موقع', 'هندسة مدنية'],
  },
  {
    id: 'role_mechanical_engineer',
    category: 'Engineering',
    labels: {
      en: 'Mechanical Engineer',
      ar: 'مهندس ميكانيكا',
      fr: 'Ingénieur Mécanique',
      de: 'Maschinenbauingenieur',
      es: 'Ingeniero Mecánico',
      tr: 'Makine Mühendisi',
    },
    aliases: ['hvac', 'cad', 'هندسة ميكانيكية'],
  },
  {
    id: 'role_electrical_engineer',
    category: 'Engineering',
    labels: {
      en: 'Electrical Engineer',
      ar: 'مهندس كهرباء',
      fr: 'Ingénieur Électrique',
      de: 'Elektroingenieur',
      es: 'Ingeniero Eléctrico',
      tr: 'Elektrik Mühendisi',
    },
    aliases: ['power systems', 'electronics', 'هندسة كهربائية'],
  },
  {
    id: 'role_customer_success',
    category: 'Customer Support',
    labels: {
      en: 'Customer Success Specialist',
      ar: 'أخصائي خدمة ونجاح العملاء',
      fr: 'Spécialiste Relation Client',
      de: 'Customer-Success-Manager',
      es: 'Especialista en Éxito del Cliente',
      tr: 'Müşteri Başarı Uzmanı',
    },
    aliases: ['customer support', 'خدمة عملاء', 'دعم فني'],
  },
  {
    id: 'role_pharmacist_healthcare',
    category: 'Healthcare',
    labels: {
      en: 'Clinical Pharmacist / Healthcare Specialist',
      ar: 'صيدلي إكلينيكي / أخصائي رعاية صحية',
      fr: 'Pharmacien Clinicien / Spécialiste Santé',
      de: 'Klinischer Apotheker / Gesundheitsspezialist',
      es: 'Farmacéutico Clínico / Especialista en Salud',
      tr: 'Klinik Eczacı / Sağlık Uzmanı',
    },
    aliases: ['medical', 'doctor', 'nurse', 'صيدلي', 'رعاية صحية'],
  },
  {
    id: 'role_teacher_educator',
    category: 'Education',
    labels: {
      en: 'Teacher & Academic Instructor',
      ar: 'معلم / محاضر أكاديمي',
      fr: 'Enseignant & Formateur',
      de: 'Lehrer & Dozent',
      es: 'Profesor e Instructor Académico',
      tr: 'Öğretmen ve Eğitmen',
    },
    aliases: ['education', 'trainer', 'مدرس', 'تعليم'],
  },
  {
    id: 'role_legal_counsel',
    category: 'Legal',
    labels: {
      en: 'Legal Counsel & Corporate Lawyer',
      ar: 'مستشار قانوني ومحامي شركات',
      fr: 'Juriste d’Entreprise',
      de: 'Unternehmensjurist',
      es: 'Asesor Legal y Abogado Corporativo',
      tr: 'Hukuk Müşaviri ve Avukat',
    },
    aliases: ['attorney', 'contracts', 'محامي', 'شؤون قانونية'],
  },
];

export const SKILL_CATALOG: MultilingualCatalogItem[] = [
  {
    id: 'skill_javascript',
    category: 'Programming',
    labels: {
      en: 'JavaScript',
      ar: 'JavaScript (جافاسكريبت)',
      fr: 'JavaScript',
      de: 'JavaScript',
      es: 'JavaScript',
      tr: 'JavaScript',
    },
    aliases: ['js', 'es6', 'ecmascript'],
  },
  {
    id: 'skill_typescript',
    category: 'Programming',
    labels: {
      en: 'TypeScript',
      ar: 'TypeScript (تايب سكريبت)',
      fr: 'TypeScript',
      de: 'TypeScript',
      es: 'TypeScript',
      tr: 'TypeScript',
    },
    aliases: ['ts'],
  },
  {
    id: 'skill_python',
    category: 'Programming',
    labels: {
      en: 'Python',
      ar: 'Python (بايثون)',
      fr: 'Python',
      de: 'Python',
      es: 'Python',
      tr: 'Python',
    },
    aliases: ['django', 'fastapi', 'flask', 'بايثون'],
  },
  {
    id: 'skill_react',
    category: 'Frontend',
    labels: {
      en: 'React.js',
      ar: 'React.js (ريأكت)',
      fr: 'React.js',
      de: 'React.js',
      es: 'React.js',
      tr: 'React.js',
    },
    aliases: ['reactjs', 'react hooks', 'redux'],
  },
  {
    id: 'skill_nextjs',
    category: 'Frontend',
    labels: {
      en: 'Next.js',
      ar: 'Next.js (نكست)',
      fr: 'Next.js',
      de: 'Next.js',
      es: 'Next.js',
      tr: 'Next.js',
    },
    aliases: ['nextjs', 'app router', 'ssr'],
  },
  {
    id: 'skill_nodejs',
    category: 'Backend',
    labels: {
      en: 'Node.js',
      ar: 'Node.js (نود جي إس)',
      fr: 'Node.js',
      de: 'Node.js',
      es: 'Node.js',
      tr: 'Node.js',
    },
    aliases: ['express', 'nestjs', 'nodejs'],
  },
  {
    id: 'skill_sql',
    category: 'Data & Databases',
    labels: {
      en: 'SQL & Relational Databases',
      ar: 'قواعد بيانات SQL',
      fr: 'SQL & Bases de Données Relationnelles',
      de: 'SQL & Relationale Datenbanken',
      es: 'SQL y Bases de Datos Relacionales',
      tr: 'SQL ve İlişkisel Veritabanları',
    },
    aliases: ['postgresql', 'mysql', 'database', 'قواعد البيانات'],
  },
  {
    id: 'skill_mongodb',
    category: 'Data & Databases',
    labels: {
      en: 'MongoDB & NoSQL',
      ar: 'MongoDB وقواعد بيانات NoSQL',
      fr: 'MongoDB & NoSQL',
      de: 'MongoDB & NoSQL',
      es: 'MongoDB y NoSQL',
      tr: 'MongoDB ve NoSQL',
    },
    aliases: ['mongoose', 'nosql'],
  },
  {
    id: 'skill_aws_cloud',
    category: 'Cloud & DevOps',
    labels: {
      en: 'AWS & Cloud Architecture',
      ar: 'الحوسبة السحابية (AWS / Cloud)',
      fr: 'AWS & Architecture Cloud',
      de: 'AWS & Cloud-Architektur',
      es: 'AWS y Arquitectura en la Nube',
      tr: 'AWS ve Bulut Mimarisi',
    },
    aliases: ['azure', 'gcp', 'cloud computing', 'سحابة'],
  },
  {
    id: 'skill_docker_k8s',
    category: 'Cloud & DevOps',
    labels: {
      en: 'Docker & Kubernetes',
      ar: 'حاويات Docker و Kubernetes',
      fr: 'Docker & Kubernetes',
      de: 'Docker & Kubernetes',
      es: 'Docker y Kubernetes',
      tr: 'Docker ve Kubernetes',
    },
    aliases: ['containers', 'ci/cd', 'devops'],
  },
  {
    id: 'skill_git',
    category: 'Engineering Tools',
    labels: {
      en: 'Git & Version Control',
      ar: 'إدارة الأكواد (Git / GitHub)',
      fr: 'Git & Contrôle de Version',
      de: 'Git & Versionskontrolle',
      es: 'Git y Control de Versiones',
      tr: 'Git ve Versiyon Kontrolü',
    },
    aliases: ['github', 'gitlab'],
  },
  {
    id: 'skill_rest_graphql',
    category: 'Backend',
    labels: {
      en: 'REST APIs & GraphQL',
      ar: 'تصميم واجهات البرمجة (REST / GraphQL)',
      fr: 'API REST & GraphQL',
      de: 'REST-APIs & GraphQL',
      es: 'APIs REST y GraphQL',
      tr: 'REST API ve GraphQL',
    },
    aliases: ['api design', 'microservices'],
  },
  {
    id: 'skill_tailwind_css',
    category: 'Frontend',
    labels: {
      en: 'HTML5, CSS3 & Tailwind CSS',
      ar: 'تطوير الواجهات (HTML / CSS / Tailwind)',
      fr: 'HTML5, CSS3 & Tailwind CSS',
      de: 'HTML5, CSS3 & Tailwind CSS',
      es: 'HTML5, CSS3 y Tailwind CSS',
      tr: 'HTML5, CSS3 ve Tailwind CSS',
    },
    aliases: ['responsive design', 'sass'],
  },
  {
    id: 'skill_java_spring',
    category: 'Programming',
    labels: {
      en: 'Java & Spring Boot',
      ar: 'جافا (Java & Spring Boot)',
      fr: 'Java & Spring Boot',
      de: 'Java & Spring Boot',
      es: 'Java y Spring Boot',
      tr: 'Java ve Spring Boot',
    },
    aliases: ['jvm', 'kotlin'],
  },
  {
    id: 'skill_csharp_dotnet',
    category: 'Programming',
    labels: {
      en: 'C# & .NET Core',
      ar: 'سي شارب (C# & .NET)',
      fr: 'C# & .NET Core',
      de: 'C# & .NET Core',
      es: 'C# y .NET Core',
      tr: 'C# ve .NET Core',
    },
    aliases: ['dotnet', 'asp.net'],
  },
  {
    id: 'skill_data_analysis',
    category: 'Data & Analytics',
    labels: {
      en: 'Data Analysis & Visualization',
      ar: 'تحليل البيانات وتصويرها',
      fr: 'Analyse et Visualisation de Données',
      de: 'Datenanalyse & Visualisierung',
      es: 'Análisis y Visualización de Datos',
      tr: 'Veri Analizi ve Görselleştirme',
    },
    aliases: ['power bi', 'tableau', 'pandas', 'تحليل بيانات'],
  },
  {
    id: 'skill_excel_modeling',
    category: 'Finance & Analytics',
    labels: {
      en: 'Advanced Excel & Financial Modeling',
      ar: 'إكسيل متقدم والنمذجة المالية',
      fr: 'Excel Avancé & Modélisation Financière',
      de: 'Fortgeschrittenes Excel & Finanzmodellierung',
      es: 'Excel Avanzado y Modelado Financiero',
      tr: 'İleri Excel ve Finansal Modelleme',
    },
    aliases: ['spreadsheets', 'vba', 'pivot tables', 'اكسيل', 'محاسبة مالية'],
  },
  {
    id: 'skill_machine_learning',
    category: 'Data & AI',
    labels: {
      en: 'Machine Learning & AI Prompting',
      ar: 'التعلم الآلي وتطبيقات الذكاء الاصطناعي',
      fr: 'Machine Learning & IA Générative',
      de: 'Maschinelles Lernen & KI',
      es: 'Machine Learning e IA Generativa',
      tr: 'Makine Öğrenmesi ve Yapay Zeka',
    },
    aliases: ['pytorch', 'tensorflow', 'llm', 'تعلم الآلة'],
  },
  {
    id: 'skill_figma_uiux',
    category: 'Design',
    labels: {
      en: 'Figma & UI/UX Prototyping',
      ar: 'تصميم النماذج الأولية (Figma & UI/UX)',
      fr: 'Figma & Prototypage UI/UX',
      de: 'Figma & UI/UX-Prototyping',
      es: 'Figma y Prototipado UI/UX',
      tr: 'Figma ve UI/UX Prototipleme',
    },
    aliases: ['wireframing', 'design systems', 'adobe xd', 'فيجما'],
  },
  {
    id: 'skill_project_management',
    category: 'Management',
    labels: {
      en: 'Project Management (Agile / Scrum)',
      ar: 'إدارة المشاريع (Agile / Scrum)',
      fr: 'Gestion de Projet (Agile / Scrum)',
      de: 'Projektmanagement (Agile / Scrum)',
      es: 'Gestión de Proyectos (Agile / Scrum)',
      tr: 'Proje Yönetimi (Agile / Scrum)',
    },
    aliases: ['jira', 'pmp', 'kanban', 'اجايل', 'سكرم'],
  },
  {
    id: 'skill_product_strategy',
    category: 'Product',
    labels: {
      en: 'Product Strategy & Roadmapping',
      ar: 'استراتيجية المنتج وخارطة الطريق',
      fr: 'Stratégie Produit & Roadmap',
      de: 'Produktstrategie & Roadmapping',
      es: 'Estrategia de Producto y Roadmap',
      tr: 'Ürün Stratejisi ve Yol Haritası',
    },
    aliases: ['user research', 'kpis', 'okr'],
  },
  {
    id: 'skill_digital_marketing',
    category: 'Marketing',
    labels: {
      en: 'SEO, SEM & Performance Marketing',
      ar: 'تحسين محركات البحث والتسويق الرقمي (SEO/SEM)',
      fr: 'SEO, SEM & Marketing de Performance',
      de: 'SEO, SEM & Performance-Marketing',
      es: 'SEO, SEM y Marketing de Resultados',
      tr: 'SEO, SEM ve Performans Pazarlaması',
    },
    aliases: ['google ads', 'meta ads', 'google analytics', 'تسويق رقمي'],
  },
  {
    id: 'skill_financial_reporting',
    category: 'Finance',
    labels: {
      en: 'Financial Reporting & IFRS',
      ar: 'التقارير المالية والمعايير الدولية (IFRS)',
      fr: 'Reporting Financier & IFRS',
      de: 'Finanzberichterstattung & IFRS',
      es: 'Informes Financieros y NIIF',
      tr: 'Finansal Raporlama ve UFRS',
    },
    aliases: ['gaap', 'auditing', 'budgeting', 'تقارير مالية', 'ميزانية'],
  },
  {
    id: 'skill_sales_negotiation',
    category: 'Sales',
    labels: {
      en: 'B2B Sales, CRM & Negotiation',
      ar: 'مبيعات الشركات والتفاوض وإدارة علاقات العملاء (CRM)',
      fr: 'Vente B2B, CRM & Négociation',
      de: 'B2B-Vertrieb, CRM & Verhandlungsführung',
      es: 'Ventas B2B, CRM y Negociación',
      tr: 'B2B Satış, CRM ve Müzakere',
    },
    aliases: ['salesforce', 'hubspot', 'lead generation', 'مبيعات', 'تفاوض'],
  },
  {
    id: 'skill_communication',
    category: 'Core Skills',
    labels: {
      en: 'Cross-Functional Communication',
      ar: 'مهارات التواصل الفعّال والعمل الجماعي',
      fr: 'Communication Transversale',
      de: 'Abteilungsübergreifende Kommunikation',
      es: 'Comunicación Interfuncional',
      tr: 'Ekipler Arası İletişim',
    },
    aliases: ['presentation', 'stakeholder management', 'تواصل', 'عمل جماعي'],
  },
  {
    id: 'skill_leadership',
    category: 'Core Skills',
    labels: {
      en: 'Team Leadership & Mentoring',
      ar: 'قيادة الفرق والتوجيه المهني',
      fr: "Leadership d'Équipe & Mentorat",
      de: 'Teamführung & Mentoring',
      es: 'Liderazgo de Equipos y Mentoría',
      tr: 'Ekip Liderliği ve Mentorluk',
    },
    aliases: ['management', 'coaching', 'قيادة'],
  },
  {
    id: 'skill_problem_solving',
    category: 'Core Skills',
    labels: {
      en: 'Analytical Problem Solving',
      ar: 'حل المشكلات والتفكير التحليلي',
      fr: 'Résolution Analytique de Problèmes',
      de: 'Analytische Problemlösung',
      es: 'Resolución Analítica de Problemas',
      tr: 'Analitik Problem Çözme',
    },
    aliases: ['critical thinking', 'troubleshooting', 'حل المشكلات'],
  },
  {
    id: 'skill_autocad_bim',
    category: 'Engineering',
    labels: {
      en: 'AutoCAD, Revit & BIM Modeling',
      ar: 'التصميم الهندسي (AutoCAD / Revit / BIM)',
      fr: 'AutoCAD, Revit & Modélisation BIM',
      de: 'AutoCAD, Revit & BIM-Modellierung',
      es: 'AutoCAD, Revit y Modelado BIM',
      tr: 'AutoCAD, Revit ve BIM Modelleme',
    },
    aliases: ['solidworks', 'civil 3d', 'اوتوكاد', 'ريفيت'],
  },
  {
    id: 'skill_hr_recruiting',
    category: 'Human Resources',
    labels: {
      en: 'Talent Acquisition & HRIS',
      ar: 'استقطاب الكفاءات وأنظمة الموارد البشرية',
      fr: 'Acquisition de Talents & SIRH',
      de: 'Talentakquise & HRIS',
      es: 'Adquisición de Talento y RRHH',
      tr: 'Yetenek Kazanımı ve İK Sistemleri',
    },
    aliases: ['onboarding', 'employee relations', 'توظيف', 'موارد بشرية'],
  },
  {
    id: 'skill_customer_service',
    category: 'Customer Support',
    labels: {
      en: 'Customer Retention & Zendesk',
      ar: 'إدارة رضا العملاء والدعم الفني',
      fr: 'Fidélisation Client & Support',
      de: 'Kundenbindung & Support-Systeme',
      es: 'Retención de Clientes y Soporte',
      tr: 'Müşteri Memnuniyeti ve Destek',
    },
    aliases: ['intercom', 'sla', 'خدمة العملاء'],
  },
];

function detectQueryLocale(query: string, explicitLang?: SupportedCatalogLocale): SupportedCatalogLocale {
  if (explicitLang) return explicitLang;
  if (/[\u0600-\u06FF]/.test(query)) return 'ar';
  return 'en';
}

export function suggestProfileItems(options: {
  type: 'role' | 'skill';
  query: string;
  lang?: SupportedCatalogLocale;
  limit?: number;
}): {
  type: 'role' | 'skill';
  query: string;
  locale: SupportedCatalogLocale;
  suggestions: ProfileSuggestionItem[];
  items: string[];
} {
  const { type, query, lang, limit = 12 } = options;
  const catalog = type === 'role' ? ROLE_CATALOG : SKILL_CATALOG;
  const cleanQuery = (query || '').trim().toLowerCase();
  const locale = detectQueryLocale(cleanQuery, lang);
  const safeLimit = Math.max(1, Math.min(25, limit));

  if (!cleanQuery) {
    const top = catalog.slice(0, safeLimit).map((entry) => ({
      id: entry.id,
      value: entry.labels[locale] || entry.labels.en,
      label: entry.labels[locale] || entry.labels.en,
      category: entry.category,
      labels: entry.labels,
    }));
    return {
      type,
      query: '',
      locale,
      suggestions: top,
      items: top.map((t) => t.label),
    };
  }

  const scored: { entry: MultilingualCatalogItem; score: number }[] = [];

  for (const entry of catalog) {
    const allLabels = Object.values(entry.labels).map((l) => l.toLowerCase());
    const aliases = (entry.aliases || []).map((a) => a.toLowerCase());
    let bestScore = 0;

    for (const label of allLabels) {
      if (label === cleanQuery) {
        bestScore = Math.max(bestScore, 100);
      } else if (label.startsWith(cleanQuery)) {
        bestScore = Math.max(bestScore, 85);
      } else if (label.includes(cleanQuery)) {
        bestScore = Math.max(bestScore, 65);
      }
    }

    for (const alias of aliases) {
      if (alias === cleanQuery) {
        bestScore = Math.max(bestScore, 90);
      } else if (alias.startsWith(cleanQuery)) {
        bestScore = Math.max(bestScore, 75);
      } else if (alias.includes(cleanQuery)) {
        bestScore = Math.max(bestScore, 55);
      }
    }

    if (bestScore > 0) {
      scored.push({ entry, score: bestScore });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const suggestions = scored.slice(0, safeLimit).map(({ entry }) => {
    const localizedLabel = entry.labels[locale] || entry.labels.en;
    return {
      id: entry.id,
      value: localizedLabel,
      label: localizedLabel,
      category: entry.category,
      labels: entry.labels,
    };
  });

  return {
    type,
    query: cleanQuery,
    locale,
    suggestions,
    items: suggestions.map((s) => s.label),
  };
}

