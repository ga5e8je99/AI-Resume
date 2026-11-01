import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeResumeText,
  extractDynamicKeywordsFromJD,
  normalizeArabicText,
  normalizeTerm,
  matchTermWithSynonyms,
} from '../app/lib/atsAnalyzer';

describe('ATS Analyzer Upgrade — Synonyms, Dynamic JD Extraction, Job Title Match & Audits', () => {
  // ==========================================================================
  // 1. SYNONYMS & ACRONYMS
  // ==========================================================================
  describe('1. Synonyms & Acronyms (app/lib/ats/synonyms.ts)', () => {
    it('normalizes acronyms and multilingual equivalents to identical canonical IDs', () => {
      assert.equal(normalizeTerm('K8s'), normalizeTerm('Kubernetes'));
      assert.equal(normalizeTerm('SEO'), normalizeTerm('Search Engine Optimization'));
      assert.equal(normalizeTerm('SEO'), normalizeTerm('تحسين محركات البحث'));
      assert.equal(normalizeTerm('SEO'), normalizeTerm('Suchmaschinenoptimierung'));
      assert.equal(normalizeTerm('CI/CD'), normalizeTerm('Continuous Integration'));
      assert.equal(normalizeTerm('JS'), normalizeTerm('JavaScript'));
      assert.equal(normalizeTerm('ML'), normalizeTerm('Machine Learning'));
      assert.equal(normalizeTerm('ML'), normalizeTerm('تعلم الآلة'));
      assert.equal(normalizeTerm('CRM'), normalizeTerm('Customer Relationship Management'));
      assert.equal(normalizeTerm('CRM'), normalizeTerm('إدارة علاقات العملاء'));
      assert.equal(normalizeTerm('CRM'), normalizeTerm('Gestion de la relation client'));
      assert.equal(normalizeTerm('ERP'), normalizeTerm('Enterprise Resource Planning'));
      assert.equal(normalizeTerm('ERP'), normalizeTerm('تخطيط موارد المؤسسات'));
      assert.equal(normalizeTerm('KPI'), normalizeTerm('Key Performance Indicators'));
      assert.equal(normalizeTerm('KPIs'), normalizeTerm('مؤشرات الأداء الرئيسية'));
      assert.equal(normalizeTerm('P&L'), normalizeTerm('Profit and Loss'));
      assert.equal(normalizeTerm('P&L'), normalizeTerm('الأرباح والخسائر'));
      assert.equal(normalizeTerm('IFRS'), normalizeTerm('International Financial Reporting Standards'));
      assert.equal(normalizeTerm('IFRS'), normalizeTerm('المعايير الدولية للتقارير المالية'));
      assert.equal(normalizeTerm('HR'), normalizeTerm('Human Resources'));
      assert.equal(normalizeTerm('HR'), normalizeTerm('الموارد البشرية'));
      assert.equal(normalizeTerm('HR'), normalizeTerm('Ressources humaines'));
      assert.equal(normalizeTerm('HR'), normalizeTerm('Personalwesen'));
      assert.equal(normalizeTerm('HR'), normalizeTerm('Recursos humanos'));
      assert.equal(normalizeTerm('HR'), normalizeTerm('İnsan Kaynakları'));
    });

    it('counts K8s as found for Kubernetes JD requirement and emits advice to include the full name', () => {
      const resumeText = `
        أحمد محمود
        القاهرة، مصر | ahmed.devops@example.com | +20 100 123 4567 | linkedin.com/in/ahmeddevops

        الملخص المهني
        مهندس سحابة وبنية تحتية بخبرة 5 سنوات في إدارة الأنظمة الموزعة.

        الخبرات العملية
        مهندس DevOps — شركة تقنية السحابة
        01/2021 - حتى الآن
        - طورت عنقود K8s لإدارة 45 خدمة مصغرة بكفاءة عالية وتقليل وقت التوقف بنسبة 40%.
        - بنيت خطوط أنابيب Docker و Linux لأتمتة عمليات الإطلاق السحابي بنجاح.

        التعليم
        بكالوريوس هندسة الحاسبات — جامعة القاهرة (2016 - 2020)

        المهارات
        Docker, Linux, K8s, Terraform
      `;
      const jd = `
        المتطلبات الأساسية:
        - خبرة عملية قوية في Kubernetes وإدارة الحاويات Docker.
        - إجادة Terraform و Linux.
      `;

      const result = analyzeResumeText(resumeText, 'مهندس DevOps', jd, 'ar');

      // K8s should match Kubernetes and be marked as found
      const k8sDetected = result.keywordsDetected.find(
        (k) => normalizeTerm(k.keyword) === normalizeTerm('Kubernetes')
      );
      assert.ok(k8sDetected, 'Kubernetes should be detected via K8s synonym');
      assert.ok(
        !result.missingKeywords.some((m) => normalizeTerm(m) === normalizeTerm('Kubernetes')),
        'Kubernetes should not be in missingKeywords when K8s is present'
      );

      // Should emit the specific Arabic advice for K8s -> Kubernetes
      const allSuggestions = result.suggestions.flatMap((s) => s.suggestions);
      const hasK8sAdvice =
        allSuggestions.some(
          (s) => s.includes('وجدنا الاختصار K8s') && s.includes('Kubernetes')
        ) ||
        result.weaknesses.some(
          (w) => w.description.includes('وجدنا الاختصار K8s') && w.description.includes('Kubernetes')
        );
      assert.ok(
        hasK8sAdvice,
        `Expected K8s -> Kubernetes advice in suggestions/weaknesses, got: ${JSON.stringify(allSuggestions)}`
      );
    });

    it('counts SEO as found for Search Engine Optimization and advises writing the full term', () => {
      const resumeText = `
        Sarah Jenkins
        London, UK | sarah.j@example.com | +44 7700 900077 | linkedin.com/in/sarahjenkins

        PROFESSIONAL SUMMARY
        Digital Marketing Specialist with 4 years of experience scaling organic traffic.

        WORK EXPERIENCE
        Digital Marketing Specialist — GrowthPulse Agency
        Jan 2022 - Present
        - Executed technical SEO audits across 15 client websites, increasing organic traffic by 65%.
        - Managed Google Analytics dashboards and optimized landing pages to boost conversion rates by 22%.

        EDUCATION
        B.A. in Marketing — University of Manchester (2017 - 2021)

        SKILLS
        SEO, Google Analytics, Copywriting, Content Marketing
      `;
      const jd = `
        Requirements:
        - Proven track record in Search Engine Optimization and organic growth.
        - Hands-on experience with Google Analytics and Content Marketing.
      `;

      const result = analyzeResumeText(
        resumeText,
        'Digital Marketing Specialist',
        jd,
        'en'
      );

      const seoDetected = result.keywordsDetected.find(
        (k) => normalizeTerm(k.keyword) === normalizeTerm('Search Engine Optimization')
      );
      assert.ok(seoDetected, 'Search Engine Optimization should be detected via SEO acronym');

      const allSuggestions = result.suggestions.flatMap((s) => s.suggestions);
      const hasSeoAdvice =
        allSuggestions.some(
          (s) =>
            s.includes('Found the abbreviation SEO') &&
            s.includes('Search Engine Optimization')
        ) ||
        result.weaknesses.some(
          (w) =>
            w.description.includes('Found the abbreviation SEO') &&
            w.description.includes('Search Engine Optimization')
        );
      assert.ok(
        hasSeoAdvice,
        `Expected SEO -> Search Engine Optimization advice, got: ${JSON.stringify(allSuggestions)}`
      );
    });
  });

  // ==========================================================================
  // 2. DYNAMIC KEYWORD EXTRACTION & NON-TECH ROLES (EN + AR)
  // ==========================================================================
  describe('2. Dynamic Keyword Extraction (Accountant, Marketer, Civil Engineer, Arabic RTL)', () => {
    it('extracts up to 25 ranked keywords dynamically with title/requirements weighting', () => {
      const accountantJd = `
        Senior Financial Accountant
        Requirements & Qualifications:
        - Deep expertise in IFRS, General Ledger reconciliation, and Financial Reporting.
        - Hands-on experience with Accounts Payable, Accounts Receivable, Bank Reconciliation, and Tax Compliance.
        - Advanced proficiency in SAP FICO, Cost Accounting, Budgeting, Variance Analysis, and P&L statements.
        Responsibilities:
        - Prepare monthly Balance Sheet schedules, Cash Flow Management reports, and Internal Audit documentation.
      `;

      const extracted = extractDynamicKeywordsFromJD(accountantJd, 'Senior Financial Accountant');
      assert.ok(extracted.length > 0 && extracted.length <= 25, 'Should return up to 25 keywords');

      const extractedNorms = extracted.map((e) => e.normalized);
      assert.ok(
        extractedNorms.includes(normalizeTerm('IFRS')),
        'Should extract IFRS'
      );
      assert.ok(
        extractedNorms.includes(normalizeTerm('General Ledger')),
        'Should extract General Ledger'
      );
      assert.ok(
        extractedNorms.some((n) => n.includes('financial reporting') || n.includes('bank reconciliation')),
        'Should extract multi-word accounting n-grams'
      );
    });

    it('evaluates non-tech Arabic Accountant resume with hamza/diacritic normalization', () => {
      const arabicAccountantResume = `
        محمد عبد الرحمن
        الرياض، السعودية | m.abdelrahman@example.com | +966 50 123 4567 | linkedin.com/in/mabdelrahman

        الملخص المهني
        محاسب مالي معتمد بخبرة 6 سنوات في إِعدادُ القوائمِ الماليّة والتدقيق المالي وفق المعايير الدولية.

        الخبرات العملية
        محاسب مالي — مجموعة الخليج التجارية
        03/2020 - الآن
        - أعددت القوائم المالية الربع سنوية والسنوية وحساب الأرباح والخسائر بدقة 100% وفق معايير IFRS.
        - نفذت التسويات البنكية الشهرية وإدارة دفتر الأستاذ العام وتقليل فروقات المطابقة بنسبة 45%.
        - راجعت الإقرارات الضريبية وضريبة القيمة المضافة والقيود اليومية لأكثر من 12 فرعاً إقليمياً.

        التعليم
        بكالوريوس تجارة قسم محاسبة — جامعة الملك سعود (2014 - 2018)

        المهارات
        إعداد القوائم المالية، دفتر الأستاذ العام، التسويات البنكية، ضريبة القيمة المضافة، SAP، Excel، محاسبة التكاليف
      `;

      const arabicAccountantJd = `
        المسمى الوظيفي: محاسب مالي
        المتطلبات الأساسية:
        - خبرة قوية في اعداد القوائم الماليه ودفتر الاستاذ العام والتسويات البنكيه.
        - إجادة المعايير الدولية للتقارير المالية وحساب الارباح والخسائر وضريبه القيمه المضافه.
        - إتقان برنامج SAP و Excel ومحاسبة التكاليف والمراجعة الداخلية.
      `;

      // Verify Arabic normalization strips tashkeel and normalizes hamzas/teh marbuta
      assert.equal(
        normalizeArabicText('إِعدادُ القوائمِ الماليّة'),
        normalizeArabicText('اعداد القوائم الماليه')
      );

      const result = analyzeResumeText(
        arabicAccountantResume,
        'محاسب مالي',
        arabicAccountantJd,
        'ar'
      );

      assert.equal(result.detectedLanguage, 'ar');
      assert.ok(result.overallScore >= 75, `Expected strong score for matching Arabic Accountant resume, got ${result.overallScore}`);
      assert.ok(
        result.keywordsDetected.some((k) => k.category === 'Finance & Accounting'),
        'Should detect Finance & Accounting domain keywords'
      );
    });

    it('evaluates Civil Engineer (مهندس مدني) resume accurately with engineering JD', () => {
      const civilResume = `
        Omar Hassan
        Cairo, Egypt | omar.civil@example.com | +20 109 876 5432 | linkedin.com/in/omarcivil

        PROFESSIONAL SUMMARY
        Senior Civil Engineer with 7 years of experience in Structural Analysis, Reinforced Concrete design, and Site Supervision.

        WORK EXPERIENCE
        Senior Civil Engineer — Nile Construction Group
        02/2020 - Present
        - Supervised construction of 8 multi-story commercial towers, reducing material waste by 18% via accurate Bill of Quantities.
        - Designed Reinforced Concrete foundations using AutoCAD, Revit, and ETABS in full compliance with FIDIC standards.
        - Coordinated project schedules in Primavera P6 and led Quality Control inspections across 120+ site personnel.

        EDUCATION
        B.Sc. in Civil Engineering — Ain Shams University (2013 - 2018)

        SKILLS
        AutoCAD, Revit, BIM, Primavera P6, ETABS, Structural Analysis, Bill of Quantities, Site Supervision, Quality Control
      `;

      const civilJd = `
        Role: Senior Civil Engineer
        Requirements:
        - Proficiency in AutoCAD, Revit, Building Information Modeling (BIM), and ETABS.
        - Strong background in Structural Analysis, Reinforced Concrete, Bill of Quantities (BOQ), and Primavera P6.
        - Experience in Site Supervision, Quality Control, and Geotechnical Engineering.
      `;

      const result = analyzeResumeText(civilResume, 'Senior Civil Engineer', civilJd, 'en');
      assert.ok(result.overallScore >= 75, `Expected score >= 75 for Civil Engineer, got ${result.overallScore}`);
      assert.ok(
        result.keywordsDetected.some((k) => normalizeTerm(k.keyword) === normalizeTerm('AutoCAD')),
        'Should detect AutoCAD'
      );
      assert.ok(
        result.keywordsDetected.some((k) => normalizeTerm(k.keyword) === normalizeTerm('BIM')),
        'Should detect BIM / Building Information Modeling'
      );
    });
  });

  // ==========================================================================
  // 3. JOB TITLE MATCH (exact / partial / missing)
  // ==========================================================================
  describe('3. Job Title Match (Summary & Experience)', () => {
    const sampleResume = `
      Karim Nabil
      Dubai, UAE | karim@example.com | +971 50 234 5678 | linkedin.com/in/karimnabil

      PROFESSIONAL SUMMARY
      Experienced Software Developer specializing in scalable backend architectures and cloud microservices.

      WORK EXPERIENCE
      Software Developer — CloudScale Tech
      01/2022 - Present
      - Engineered distributed Node.js and PostgreSQL services handling 50,000 requests per second with 99.99% uptime.
      - Automated CI/CD deployment workflows using Docker and AWS, cutting release time by 45%.

      EDUCATION
      B.Sc. in Computer Science — American University (2017 - 2021)

      SKILLS
      Node.js, PostgreSQL, Docker, AWS, TypeScript, REST APIs
    `;

    it('returns exact status when targetRole matches verbatim', () => {
      const res = analyzeResumeText(sampleResume, 'Software Developer', '', 'en');
      assert.ok(res.jobTitleMatch);
      assert.equal(res.jobTitleMatch.status, 'exact');
      assert.equal(res.jobTitleMatch.matchedInSummary, true);
      assert.equal(res.jobTitleMatch.matchedInExperience, true);
      assert.ok(res.jobTitleMatch.scoreImpact > 0);
    });

    it('returns partial status when targetRole matches via synonym or core tokens', () => {
      const res = analyzeResumeText(sampleResume, 'Senior Software Engineer', '', 'en');
      assert.ok(res.jobTitleMatch);
      assert.equal(res.jobTitleMatch.status, 'partial');
      assert.ok(res.jobTitleMatch.suggestion, 'Partial match should provide an actionable suggestion');
    });

    it('returns missing status when targetRole is absent', () => {
      const res = analyzeResumeText(sampleResume, 'Civil Engineer', '', 'en');
      assert.ok(res.jobTitleMatch);
      assert.equal(res.jobTitleMatch.status, 'missing');
      assert.equal(res.jobTitleMatch.scoreImpact, -3);
      assert.ok(res.jobTitleMatch.suggestion);
    });
  });

  // ==========================================================================
  // 4. BULLET & DATES AUDIT
  // ==========================================================================
  describe('4. Bullet & Dates Audit (Length, Verb Repetition, Stuffing, Chronology, Gaps, Years)', () => {
    it('flags short bullets (<6 words), long bullets (>35 words), repeated starting verbs (>2), and keyword stuffing (>5 or >3%)', () => {
      const auditResume = `
        Alex Carter
        New York, NY | alex@example.com | +1 555 234 5678 | linkedin.com/in/alexcarter

        PROFESSIONAL SUMMARY
        React specialist building React applications with React hooks, React state, React components, React router, and React performance tuning.

        WORK EXPERIENCE
        Frontend Developer — WebCorp
        01/2023 - Present
        - Built UI fast.
        - Developed a modular design system that reduced frontend bundle size by 32% across 4 consumer products.
        - Developed interactive analytics dashboards with real-time streaming charts for 25,000 daily enterprise users.
        - Developed automated visual regression test suites that caught 95% of layout defects before production release.
        - Engineered a comprehensive multi-tenant enterprise portal with role-based access control, dynamic form builders, localized reporting pipelines, real-time notifications, custom theming, offline caching, and automated audit logging across twelve international regional subsidiaries worldwide to streamline global operations, reduce manual onboarding overhead, and improve compliance visibility.

        EDUCATION
        B.Sc. in Computer Science — NYU (2016 - 2020)

        SKILLS
        React, TypeScript, Next.js, Tailwind CSS
      `;

      const res = analyzeResumeText(auditResume, 'Frontend Developer', '', 'en');
      assert.ok(res.bulletAudit, 'bulletAudit should be populated');

      // Bullet #1 ("Built UI fast.") has 3 words (< 6)
      assert.equal(res.bulletAudit.shortBullets.length, 1);
      assert.equal(res.bulletAudit.shortBullets[0].bulletNumber, 1);
      assert.ok(
        res.weaknesses.some((w) => w.description.includes('#1') && w.description.includes('3 words')),
        'Should warn about short bullet #1 with its number'
      );

      // Bullet #5 has > 35 words
      assert.equal(res.bulletAudit.longBullets.length, 1);
      assert.equal(res.bulletAudit.longBullets[0].bulletNumber, 5);
      assert.ok(
        res.weaknesses.some((w) => w.description.includes('#5') && w.description.includes('exceeds 35 words')),
        'Should warn about long bullet #5 with its number'
      );

      // Verb "Developed" is used 3 times (> 2) in WORK EXPERIENCE
      assert.ok(
        res.bulletAudit.repeatedVerbs.some(
          (rv) => rv.verb.toLowerCase() === 'developed' && rv.count === 3
        ),
        'Should detect "Developed" repeated 3 times in the same section'
      );

      // Keyword "React" is stuffed 8 times (> 5 times and > 3% of text)
      assert.ok(
        res.bulletAudit.keywordStuffing.some(
          (ks) => ks.keyword.toLowerCase() === 'react' && ks.count > 5
        ),
        'Should detect keyword stuffing for React'
      );
    });

    it('detects date formats, reverse chronology violations, >6 month employment gaps, and calculates years of experience', () => {
      const chronologyResume = `
        Nour El-Din
        Cairo, Egypt | nour@example.com | +20 101 222 3333 | linkedin.com/in/noureldin

        WORK EXPERIENCE
        Junior Accountant — Delta Firm
        01/2018 - 12/2019
        - Prepared monthly journal entries and assisted with bank reconciliations for 30 commercial accounts.

        Senior Accountant — Apex Holdings
        Jan 2021 - Dec 2023
        - Managed full-cycle financial reporting, IFRS compliance, and annual audit preparation reducing closing time by 30%.

        EDUCATION
        B.Com in Accounting — Cairo University (2013 - 2017)

        SKILLS
        IFRS, Financial Reporting, General Ledger, Excel
      `;

      const res = analyzeResumeText(chronologyResume, 'Senior Accountant', '', 'en');
      assert.ok(res.datesAudit, 'datesAudit should be populated');

      // 2018-2019 is listed ABOVE 2021-2023 -> not reverse chronological!
      assert.equal(
        res.datesAudit.isReverseChronological,
        false,
        'Should flag non-reverse chronological order when 2018-2019 is listed before 2021-2023'
      );

      // Gap between 2019-12 and 2021-01 is 13 months (> 6 months)
      assert.equal(res.datesAudit.gaps.length, 1, 'Should detect 1 employment gap > 6 months');
      assert.ok(res.datesAudit.gaps[0].months > 6, `Expected gap > 6 months, got ${res.datesAudit.gaps[0].months}`);

      // Total experience: (2018-01 to 2019-12 = 24 months) + (2021-01 to 2023-12 = 36 months) = 60 months = 5.0 years
      assert.equal(res.datesAudit.yearsOfExperience, 5);
    });

    it('parses Arabic and French Present indicators (الآن / Aujourd\'hui)', () => {
      const frResume = `
        Claire Dubois
        Paris, France | claire@example.com | +33 6 12 34 56 78

        EXPÉRIENCE PROFESSIONNELLE
        Comptable Senior — Groupe Lumière
        01/2023 - Aujourd'hui
        - Piloté la clôture mensuelle et préparé les états financiers IFRS pour 5 filiales européennes.
        - Optimisé la gestion de la trésorerie et réduit les délais de facturation clients de 25%.

        Comptable — Cabinet Alpha
        01/2021 - 12/2022
        - Géré le grand livre général et les déclarations fiscales TVA avec une conformité de 100%.

        FORMATION
        Master en Comptabilité — Université Paris Dauphine (2018 - 2020)

        COMPÉTENCES
        IFRS, Comptabilité fournisseurs, Grand livre, Excel, SAP
      `;

      const res = analyzeResumeText(frResume, 'Comptable', '', 'fr');
      assert.ok(res.datesAudit);
      assert.equal(res.datesAudit.isReverseChronological, true);
      assert.equal(res.datesAudit.gaps.length, 0);
      assert.ok(res.datesAudit.yearsOfExperience >= 3.5);
    });
  });
});

