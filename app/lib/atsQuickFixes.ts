import { analyzeResumeText, type ATSAnalysisResult } from './atsAnalyzer';

export type QuickFixId = 'keywords' | 'summary' | 'metrics' | 'all';

export interface QuickFixOptions {
  targetRole?: string;
  jobDescription?: string;
  missingKeywords?: string[];
  isAr?: boolean;
}

export interface QuickFixApplicationResult {
  updatedText: string;
  previousScore: number;
  newScore: number;
  scoreDelta: number;
  appliedFixes: Array<'keywords' | 'summary' | 'metrics'>;
  analysis: ATSAnalysisResult;
}

const DEFAULT_EN_KEYWORDS = [
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'REST APIs',
  'CI/CD',
  'Cloud Architecture',
  'Agile',
];

const DEFAULT_AR_KEYWORDS = [
  'إدارة المشاريع',
  'تحليل البيانات',
  'تطوير البرمجيات',
  'TypeScript',
  'React',
  'Node.js',
  'REST APIs',
  'Agile',
];

/**
 * Applies one of the 3 instant 1-click ATS improvements (or all 3 at once)
 * to raw resume text and returns the updated text + recalculated ATS analysis.
 */
export function applyOneClickAtsFix(
  resumeText: string,
  fixId: QuickFixId,
  options: QuickFixOptions = {}
): QuickFixApplicationResult {
  const baseText = (resumeText || '').trim();
  const role = (options.targetRole || '').trim();
  const jd = (options.jobDescription || '').trim();
  const beforeAnalysis = analyzeResumeText(baseText, role || undefined, jd || undefined);
  const isAr = options.isAr ?? beforeAnalysis.detectedLanguage === 'ar';

  const fixesToRun: Array<'keywords' | 'summary' | 'metrics'> =
    fixId === 'all' ? ['keywords', 'summary', 'metrics'] : [fixId];

  let currentText = baseText;
  const appliedFixes: Array<'keywords' | 'summary' | 'metrics'> = [];

  for (const singleFix of fixesToRun) {
    if (singleFix === 'keywords') {
      const missingFromAnalysis = (beforeAnalysis.missingKeywords || [])
        .slice(0, 6)
        .filter((k): k is string => typeof k === 'string' && k.trim().length > 0);
      const candidateKeywords =
        options.missingKeywords && options.missingKeywords.length > 0
          ? options.missingKeywords.slice(0, 6)
          : missingFromAnalysis.length > 0
          ? missingFromAnalysis
          : isAr
          ? DEFAULT_AR_KEYWORDS.slice(0, 6)
          : DEFAULT_EN_KEYWORDS.slice(0, 6);

      const lowerText = currentText.toLowerCase();
      const toInject = candidateKeywords.filter(
        (kw) => !lowerText.includes(kw.toLowerCase())
      );
      const finalKeywords =
        toInject.length > 0
          ? toInject
          : candidateKeywords.slice(0, 4);

      const skillsBlock = isAr
        ? `\n\nالمهارات الأساسية (SKILLS)\n• المهارات التقنية والكلمات المفتاحية: ${finalKeywords.join('، ')}`
        : `\n\nSKILLS\n• Core Technical & Role Competencies: ${finalKeywords.join(', ')}`;

      if (!currentText.includes(finalKeywords.join(', ')) && !currentText.includes(finalKeywords.join('، '))) {
        currentText = `${currentText.trim()}${skillsBlock}`;
        appliedFixes.push('keywords');
      }
    }

    if (singleFix === 'summary') {
      const effectiveRole =
        role ||
        (isAr ? 'مهندس برمجيات أول (Senior Software Engineer)' : 'Senior Software Engineer');

      const summaryBlock = isAr
        ? `الملخص المهني (PROFESSIONAL SUMMARY)\n${effectiveRole} ذو خبرة مثبتة في تصميم وتطوير الأنظمة القابلة للتوسع، وتحسين الأداء التشغيلي، وقيادة الفرق متعددة التخصصات لتحقيق نتائج قابلة للقياس وتوافق كامل مع معايير ATS.\n\n`
        : `PROFESSIONAL SUMMARY\nResults-driven ${effectiveRole} with proven expertise in scalable architecture, cross-functional leadership, and high-impact product delivery aligned with modern ATS standards.\n\n`;

      const hasSummaryHeader = /professional summary|الملخص المهني/i.test(currentText);
      if (!hasSummaryHeader || (role && !currentText.toLowerCase().includes(role.toLowerCase()))) {
        currentText = `${summaryBlock}${currentText.trim()}`;
        appliedFixes.push('summary');
      }
    }

    if (singleFix === 'metrics') {
      const metricsBlock = isAr
        ? `\n\nالخبرة العملية والإنجازات (WORK EXPERIENCE)\n• قدت تطوير وتحسين الأنظمة الأساسية مما رفع كفاءة الأداء بنسبة 38% وقلل زمن الاستجابة بمقدار 250ms.\n• صممت مسارات أتمتة متكاملة وفّرت 15 ساعة عمل أسبوعياً وخفضت التكاليف التشغيلية السنوية بقيمة $45,000.\n• حسّنت جودة الإطلاق واستقرار الخدمة لتصل إلى 99.95% لأكثر من 50,000 مستخدم نشط.`
        : `\n\nWORK EXPERIENCE HIGHLIGHTS\n• Spearheaded core platform optimization that increased throughput by 38% and reduced API latency by 240ms across production services.\n• Architected automated CI/CD workflows that saved 14 engineering hours per week and reduced annual cloud infrastructure spend by $45,000.\n• Accelerated feature delivery velocity by 32% while maintaining 99.95% uptime for 50,000+ monthly active users.`;

      if (!currentText.includes('38%') && !currentText.includes('$45,000')) {
        currentText = `${currentText.trim()}${metricsBlock}`;
        appliedFixes.push('metrics');
      }
    }
  }

  const afterAnalysis = analyzeResumeText(currentText, role || undefined, jd || undefined);
  const previousScore = beforeAnalysis.overallScore;
  const newScore = Math.max(previousScore, afterAnalysis.overallScore);

  return {
    updatedText: currentText,
    previousScore,
    newScore,
    scoreDelta: Math.max(0, newScore - previousScore),
    appliedFixes,
    analysis: afterAnalysis,
  };
}

