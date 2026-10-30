import assert from 'assert';
import {
  DOCUMENT_LANGUAGE_OPTIONS,
  DOCUMENT_TRANSLATIONS,
  DocumentLanguage,
  getDocumentHeadings,
  getDocumentDir,
  isRtlDocument,
  getDocumentFontFamily,
  formatDocumentDate,
  formatDocumentDateRange,
  getCoverLetterConventions,
  COVER_LETTER_CONVENTIONS,
  isDocumentLanguage,
} from '../app/lib/documentI18n';
import { detectResumeLanguage, analyzeResumeText } from '../app/lib/atsAnalyzer';

console.log('🧪 Starting Document I18n and Language-to-Direction / Headings Tests...\n');

let passedTests = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    process.exit(1);
  }
}

// 1. Language Options & Direction Mapping
test('All 6 document languages exist in options with correct codes and directions', () => {
  const expectedLangs: DocumentLanguage[] = ['en', 'ar', 'fr', 'de', 'es', 'tr'];
  const actualLangs = DOCUMENT_LANGUAGE_OPTIONS.map((o) => o.id);
  assert.deepStrictEqual(actualLangs, expectedLangs);

  DOCUMENT_LANGUAGE_OPTIONS.forEach((opt) => {
    if (opt.id === 'ar') {
      assert.strictEqual(opt.dir, 'rtl');
      assert.strictEqual(opt.nativeName, 'العربية');
      assert.strictEqual(getDocumentDir('ar'), 'rtl');
      assert.strictEqual(isRtlDocument('ar'), true);
    } else {
      assert.strictEqual(opt.dir, 'ltr');
      assert.strictEqual(getDocumentDir(opt.id), 'ltr');
      assert.strictEqual(isRtlDocument(opt.id), false);
    }
  });
});

// 2. Section Headings Completeness across all 6 Languages
test('All 6 languages have non-empty, localized core section headings', () => {
  const langs: DocumentLanguage[] = ['en', 'ar', 'fr', 'de', 'es', 'tr'];

  langs.forEach((lang) => {
    const h = getDocumentHeadings(lang);
    assert(h, `Headings for ${lang} must exist`);
    assert(h.summary && h.summary.trim().length > 0, `${lang} summary heading missing`);
    assert(h.experience && h.experience.trim().length > 0, `${lang} experience heading missing`);
    assert(h.education && h.education.trim().length > 0, `${lang} education heading missing`);
    assert(h.skills && h.skills.trim().length > 0, `${lang} skills heading missing`);
    assert(h.projects && h.projects.trim().length > 0, `${lang} projects heading missing`);
    assert(h.certifications && h.certifications.trim().length > 0, `${lang} certifications heading missing`);
    assert(h.languages && h.languages.trim().length > 0, `${lang} languages heading missing`);
    assert(h.present && h.present.trim().length > 0, `${lang} present heading missing`);

    // Verify language-specific values
    if (lang === 'ar') {
      assert.strictEqual(h.dir, 'rtl');
      assert.strictEqual(h.isRtl, true);
      assert.strictEqual(h.summary, 'النبذة المهنية');
      assert.strictEqual(h.experience, 'الخبرات المهنية');
      assert.strictEqual(h.present, 'حتى الآن');
    } else if (lang === 'fr') {
      assert.strictEqual(h.summary, 'Profil Professionnel');
      assert.strictEqual(h.experience, 'Expérience Professionnelle');
      assert.strictEqual(h.present, 'Présent');
    } else if (lang === 'de') {
      assert.strictEqual(h.summary, 'Berufliches Profil');
      assert.strictEqual(h.experience, 'Berufserfahrung');
      assert.strictEqual(h.present, 'Heute');
    } else if (lang === 'es') {
      assert.strictEqual(h.summary, 'Perfil Profesional');
      assert.strictEqual(h.experience, 'Experiencia Laboral');
      assert.strictEqual(h.present, 'Presente');
    } else if (lang === 'tr') {
      assert.strictEqual(h.summary, 'Profesyonel Özet');
      assert.strictEqual(h.experience, 'İş Deneyimi');
      assert.strictEqual(h.present, 'Günümüz');
    } else if (lang === 'en') {
      assert.strictEqual(h.summary, 'Professional Summary');
      assert.strictEqual(h.experience, 'Work Experience');
      assert.strictEqual(h.present, 'Present');
    }
  });
});

// 3. Fallback Headings Handling
test('getDocumentHeadings falls back gracefully to English for unknown locales', () => {
  const fallback = getDocumentHeadings('unknown-lang' as any);
  assert.strictEqual(fallback.lang, 'en');
  assert.strictEqual(fallback.dir, 'ltr');
  assert.strictEqual(fallback.experience, 'Work Experience');
});

// 4. Date Formatting across Locales
test('formatDocumentDate formats dates according to target document language', () => {
  // Arabic formatting
  const arDate = formatDocumentDate('2024-05', 'ar');
  assert.strictEqual(arDate, 'مايو 2024');

  // Arabic date with full YYYY-MM-DD
  const arFullDate = formatDocumentDate('2024-01-15', 'ar');
  assert.strictEqual(arFullDate, 'يناير 2024');

  // English formatting
  const enDate = formatDocumentDate('2024-05', 'en');
  assert(enDate.includes('2024'), 'English date must include 2024');
  assert(enDate.toLowerCase().includes('may'), 'English date must include May');

  // 4-digit year preserved
  assert.strictEqual(formatDocumentDate('2025', 'ar'), '2025');
  assert.strictEqual(formatDocumentDate('2025', 'de'), '2025');

  // Empty string handling
  assert.strictEqual(formatDocumentDate('', 'en'), '');
  assert.strictEqual(formatDocumentDate(undefined, 'en'), '');
});

// 5. Date Range Formatting with "Present" Handling
test('formatDocumentDateRange handles current roles and date ranges per language', () => {
  // Arabic Present
  const arRange = formatDocumentDateRange('2022-01', '', true, 'ar');
  assert.strictEqual(arRange, 'يناير 2022 – حتى الآن');

  // German Present
  const deRange = formatDocumentDateRange('2022-01', '', true, 'de');
  assert(deRange.includes('Heute'), `German range must include 'Heute': ${deRange}`);

  // French Present
  const frRange = formatDocumentDateRange('2022-01', '', true, 'fr');
  assert(frRange.includes('Présent'), `French range must include 'Présent': ${frRange}`);

  // Spanish Present
  const esRange = formatDocumentDateRange('2022-01', '', true, 'es');
  assert(esRange.includes('Presente'), `Spanish range must include 'Presente': ${esRange}`);

  // Turkish Present
  const trRange = formatDocumentDateRange('2022-01', '', true, 'tr');
  assert(trRange.includes('Günümüz'), `Turkish range must include 'Günümüz': ${trRange}`);

  // English Present
  const enRange = formatDocumentDateRange('2022-01', '', true, 'en');
  assert(enRange.includes('Present'), `English range must include 'Present': ${enRange}`);
});

// 6. Font Family Selection
test('getDocumentFontFamily returns IBM Plex Sans Arabic for Arabic and sans-serif for others', () => {
  const arFont = getDocumentFontFamily('ar');
  assert(arFont.includes('IBM Plex Sans Arabic'), 'Arabic font must specify IBM Plex Sans Arabic');
  assert(arFont.includes('--font-arabic'), 'Arabic font must include font-arabic CSS var');

  const enFont = getDocumentFontFamily('en');
  assert(!enFont.includes('IBM Plex Sans Arabic'), 'English font must not default to Arabic font');
  assert(enFont.includes('--font-sans'), 'English font must include font-sans CSS var');
});

// 7. Cover Letter Language Conventions
test('Cover Letter conventions define formal register greetings and sign-offs for all 6 languages', () => {
  const langs: DocumentLanguage[] = ['en', 'ar', 'fr', 'de', 'es', 'tr'];

  langs.forEach((lang) => {
    const conv = getCoverLetterConventions(lang);
    assert(conv, `Conventions for ${lang} must exist`);

    const genericSalutation = conv.salutation();
    const namedSalutation = conv.salutation('Sarah Connor');
    const signOff = conv.signOff();

    assert(genericSalutation.length > 0, `${lang} generic salutation missing`);
    assert(namedSalutation.includes('Sarah Connor'), `${lang} named salutation must include manager name`);
    assert(signOff.length > 0, `${lang} sign-off missing`);

    if (lang === 'de') {
      assert(genericSalutation.includes('Sehr geehrte Damen und Herren'), 'German generic greeting');
      assert(signOff.includes('Mit freundlichen Grüßen'), 'German sign-off');
    } else if (lang === 'fr') {
      assert(genericSalutation.includes('Madame, Monsieur'), 'French generic greeting');
      assert(signOff.includes('salutations distinguées'), 'French sign-off');
    } else if (lang === 'es') {
      assert(genericSalutation.includes('Estimado/a'), 'Spanish generic greeting');
      assert(signOff.includes('Atentamente'), 'Spanish sign-off');
    } else if (lang === 'tr') {
      assert(genericSalutation.includes('Sayın'), 'Turkish generic greeting');
      assert(signOff.includes('Saygılarımla'), 'Turkish sign-off');
    } else if (lang === 'ar') {
      assert(genericSalutation.includes('السادة'), 'Arabic generic greeting');
      assert(signOff.includes('الاحترام والتقدير'), 'Arabic sign-off');
    }
  });
});

// 8. Type Guard
test('isDocumentLanguage validates only supported languages', () => {
  assert.strictEqual(isDocumentLanguage('en'), true);
  assert.strictEqual(isDocumentLanguage('ar'), true);
  assert.strictEqual(isDocumentLanguage('fr'), true);
  assert.strictEqual(isDocumentLanguage('de'), true);
  assert.strictEqual(isDocumentLanguage('es'), true);
  assert.strictEqual(isDocumentLanguage('tr'), true);
  assert.strictEqual(isDocumentLanguage('it'), false);
  assert.strictEqual(isDocumentLanguage(''), false);
  assert.strictEqual(isDocumentLanguage(null), false);
});

// 9. ATS Language Detection & Multilingual Notice
test('detectResumeLanguage detects all 6 supported languages and does not penalize non-English', () => {
  const arSample = `
    النبذة المهنية: مهندس برمجيات بخبرة 5 سنوات في تطوير تطبيقات الويب والنظم الموزعة.
    الخبرات المهنية: شركة التقنية المتقدمة - مطور أول
    • قمت بتطوير وبناء واجهات باستخدام React و Next.js
    • إدارة قواعد بيانات PostgreSQL و Docker
    التعليم: بكالوريوس في علوم الحاسب - جامعة القاهرة
    المهارات: JavaScript, TypeScript, Python, Git
  `;
  assert.strictEqual(detectResumeLanguage(arSample), 'ar');

  const deSample = `
    Berufliches Profil: Erfahrener Softwareentwickler mit 6 Jahren Berufserfahrung.
    Berufserfahrung: Senior Software Engineer bei Tech GmbH, Berlin
    • Entwicklung skalierbarer Microservices mit Java und Spring Boot
    • Optimierung von PostgreSQL Datenbanken und Docker Containern
    Ausbildung: Master of Science in Informatik, TU München
    Kenntnisse: Java, Python, Kubernetes, AWS, Git
  `;
  assert.strictEqual(detectResumeLanguage(deSample), 'de');

  const frSample = `
    Profil Professionnel: Ingénieur logiciel full-stack avec 4 ans d'expérience.
    Expérience Professionnelle: Développeur Senior chez Solutions Digitales, Paris
    • Conception et développement d'applications avec React et Node.js
    • Mise en place de pipelines CI/CD et déploiement sur Docker
    Formation: Diplôme d'Ingénieur en Informatique
    Compétences: TypeScript, React, Docker, PostgreSQL
  `;
  assert.strictEqual(detectResumeLanguage(frSample), 'fr');

  const esSample = `
    Perfil Profesional: Desarrollador de software con más de 5 años de experiencia laboral.
    Experiencia Laboral: Ingeniero de Software en Innovación Digital, Madrid
    • Desarrollo de microservicios utilizando Node.js y React
    • Gestión y optimización de bases de datos PostgreSQL
    Educación: Grado en Ingeniería Informática, Universidad de Barcelona
    Habilidades: JavaScript, Python, Docker, Git, AWS
  `;
  assert.strictEqual(detectResumeLanguage(esSample), 'es');

  const trSample = `
    Profesyonel Özet: 5 yılı aşkın iş deneyimi olan yazılım mühendisi.
    İş Deneyimi: Kıdemli Yazılım Geliştirici, Bilişim A.Ş., İstanbul
    • React ve Node.js mimarileri ile yüksek ölçekli projeler geliştirdi
    • Docker ve CI/CD süreçlerini optimize etti
    Eğitim: Lisans, Bilgisayar Mühendisliği, İTÜ
    Beceriler: TypeScript, Python, Docker, Kubernetes
  `;
  assert.strictEqual(detectResumeLanguage(trSample), 'tr');

  // Verify ATS analysis result attaches proper notice
  const analysis = analyzeResumeText(deSample);
  assert.strictEqual(analysis.detectedLanguage, 'de');
  assert(analysis.languageNotice, 'Non-English resume must receive a languageNotice');
  assert(analysis.languageNotice.en.includes('German resume detected'), 'Notice should identify German');
  assert(analysis.overallScore > 60, 'German resume should not be penalised in scoring');
});

console.log(`\n🎉 All ${passedTests} Document I18n & Language Mapping tests passed successfully!\n`);
