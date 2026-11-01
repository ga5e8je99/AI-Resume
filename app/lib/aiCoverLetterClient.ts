import {
  CoverLetterData,
  CoverLetterContent,
  GenerateCoverLetterRequest,
  CoverLetterTone,
} from '../cover-letter/types';
import { CoverLetterService } from './coverLetterService';
import {
  evaluateAiPreCallGuard,
  logAiUsageAndCheckBudget,
  recordCircuitSuccess,
  recordCircuitFailure,
  getCircuitBreakerState,
  resetCircuitBreaker,
  estimateTokensFromText,
  estimateAiCostUsd,
  CircuitBreakerSnapshot,
} from './aiGovernance';

export interface AIClientConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  maxTokens: number;
  maxRetries: number;
  enabled: boolean;
}

export interface AICoverLetterRequestOptions {
  userId?: string | null;
  endpoint?: string;
}

export interface AICoverLetterResult {
  coverLetter: CoverLetterData;
  provider: string;
  aiGenerated: boolean;
  fallbackReason?: string;
  tokens?: number;
  costUsd?: number;
  latencyMs: number;
}

export class AICoverLetterClient {
  /**
   * Resolve environment settings safely at runtime
   * Enforces timeout, max_tokens, and 1 retry by default.
   */
  static getConfig(): AIClientConfig {
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    const model = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
    const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const timeoutMs = parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '15000', 10);
    const maxTokens = parseInt(
      process.env.AI_COVER_LETTER_MAX_TOKENS || process.env.AI_MAX_TOKENS || '1500',
      10
    );
    const maxRetries = parseInt(process.env.AI_MAX_RETRIES || '1', 10);
    const enabled = process.env.AI_PROVIDER_ENABLED !== 'false' && apiKey.length > 0;

    return {
      apiKey,
      model,
      baseUrl,
      timeoutMs: isNaN(timeoutMs) || timeoutMs < 100 ? 15000 : timeoutMs,
      maxTokens: isNaN(maxTokens) || maxTokens < 100 ? 1500 : Math.min(maxTokens, 4096),
      maxRetries: isNaN(maxRetries) || maxRetries < 0 ? 1 : Math.min(maxRetries, 3),
      enabled,
    };
  }

  static getCircuitBreakerState(now?: number): CircuitBreakerSnapshot {
    return getCircuitBreakerState(now);
  }

  static resetCircuitBreaker(): void {
    resetCircuitBreaker();
  }

  /**
   * Check if an external AI provider is configured and available
   */
  static isConfigured(): boolean {
    return this.getConfig().enabled;
  }

  /**
   * Main entry point: Generates a tailored cover letter using external AI (LLM) if available,
   * enforcing circuit breaker, daily user quota (lib/plans.ts), and daily project budget (AI_DAILY_BUDGET_USD),
   * and logging every request in the AiUsage collection.
   */
  static async generateCoverLetter(
    req: GenerateCoverLetterRequest,
    resumeData?: any,
    options?: AICoverLetterRequestOptions
  ): Promise<AICoverLetterResult> {
    const startTime = Date.now();
    const config = this.getConfig();
    const userId = options?.userId || (req as any)?.userId || 'anonymous';
    const endpoint = options?.endpoint || '/api/cover-letter/generate';

    const { systemPrompt, userPrompt } = this.buildPrompts(req, resumeData);
    const approxPromptTokens = estimateTokensFromText(systemPrompt + '\n' + userPrompt);

    // 1. Check Circuit Breaker, Global Daily Budget (AI_DAILY_BUDGET_USD), and Per-User Daily Limit (from plans.ts)
    const guard = await evaluateAiPreCallGuard({ userId, endpoint });
    if (!guard.allowExternalCall) {
      const fallbackLetter = CoverLetterService.generateCoverLetter(req, resumeData);
      const approxCompletionTokens = estimateTokensFromText(fallbackLetter.content?.fullText || '');
      const totalTokens = approxPromptTokens + approxCompletionTokens;
      const latencyMs = Date.now() - startTime;

      await logAiUsageAndCheckBudget({
        userId,
        endpoint,
        tokens: totalTokens,
        promptTokens: approxPromptTokens,
        completionTokens: approxCompletionTokens,
        costUsd: 0,
        latencyMs,
        status: 'fallback',
        fallbackReason: guard.fallbackReason,
        provider: 'built-in-ats-fallback',
        model: config.model,
      });

      return {
        coverLetter: {
          ...fallbackLetter,
          provider: 'built-in-ats-fallback',
          aiGenerated: false,
        },
        provider: 'built-in-ats-fallback',
        aiGenerated: false,
        fallbackReason: guard.fallbackReason,
        tokens: totalTokens,
        costUsd: 0,
        latencyMs,
      };
    }

    // 2. If AI is not configured or disabled, smoothly use domain-driven fallback and log usage
    if (!config.enabled) {
      const fallbackLetter = CoverLetterService.generateCoverLetter(req, resumeData);
      const approxCompletionTokens = estimateTokensFromText(fallbackLetter.content?.fullText || '');
      const totalTokens = approxPromptTokens + approxCompletionTokens;
      const latencyMs = Date.now() - startTime;

      await logAiUsageAndCheckBudget({
        userId,
        endpoint,
        tokens: totalTokens,
        promptTokens: approxPromptTokens,
        completionTokens: approxCompletionTokens,
        costUsd: 0,
        latencyMs,
        status: 'fallback',
        fallbackReason: 'provider_not_configured',
        provider: 'built-in-ats-engine',
        model: config.model,
      });

      return {
        coverLetter: {
          ...fallbackLetter,
          provider: 'built-in-ats-engine',
          aiGenerated: false,
        },
        provider: 'built-in-ats-engine',
        aiGenerated: false,
        fallbackReason: 'provider_not_configured',
        tokens: totalTokens,
        costUsd: 0,
        latencyMs,
      };
    }

    // 3. Attempt generation via external AI Provider with single retry and timeout
    try {
      const { coverLetter: aiResult, promptTokens, completionTokens } = await this.callAIWithRetry(
        req,
        config,
        systemPrompt,
        userPrompt,
        approxPromptTokens
      );
      recordCircuitSuccess();

      const totalTokens = promptTokens + completionTokens;
      const costUsd = estimateAiCostUsd(promptTokens, completionTokens, config.model);
      const latencyMs = Date.now() - startTime;

      await logAiUsageAndCheckBudget({
        userId,
        endpoint,
        tokens: totalTokens,
        promptTokens,
        completionTokens,
        costUsd,
        latencyMs,
        status: 'hit',
        provider: config.model,
        model: config.model,
      });

      return {
        coverLetter: {
          ...aiResult,
          provider: config.model,
          aiGenerated: true,
        },
        provider: config.model,
        aiGenerated: true,
        tokens: totalTokens,
        costUsd,
        latencyMs,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown external AI error';
      recordCircuitFailure(errorMsg);
      console.warn(
        `[AICoverLetterClient] External AI provider failed (${errorMsg}). Switching smoothly to built-in ATS fallback.`
      );

      // 4. Fallback safely without crashing or leaking server details and log in AiUsage
      const fallbackLetter = CoverLetterService.generateCoverLetter(req, resumeData);
      const approxCompletionTokens = estimateTokensFromText(fallbackLetter.content?.fullText || '');
      const totalTokens = approxPromptTokens + approxCompletionTokens;
      const latencyMs = Date.now() - startTime;

      await logAiUsageAndCheckBudget({
        userId,
        endpoint,
        tokens: totalTokens,
        promptTokens: approxPromptTokens,
        completionTokens: approxCompletionTokens,
        costUsd: 0,
        latencyMs,
        status: 'fallback',
        fallbackReason: errorMsg,
        provider: 'built-in-ats-fallback',
        model: config.model,
      });

      return {
        coverLetter: {
          ...fallbackLetter,
          provider: 'built-in-ats-fallback',
          aiGenerated: false,
        },
        provider: 'built-in-ats-fallback',
        aiGenerated: false,
        fallbackReason: errorMsg,
        tokens: totalTokens,
        costUsd: 0,
        latencyMs,
      };
    }
  }

  /**
   * Execute API call to OpenAI-compatible Chat Completion endpoint with bounded retry (1 retry) and timeout
   */
  private static async callAIWithRetry(
    req: GenerateCoverLetterRequest,
    config: AIClientConfig,
    systemPrompt: string,
    userPrompt: string,
    approxPromptTokens: number
  ): Promise<{ coverLetter: CoverLetterData; promptTokens: number; completionTokens: number }> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= config.maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: config.maxTokens,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutHandle);

        if (!response.ok) {
          const status = response.status;
          const errorBody = await response.text().catch(() => '');

          // Non-retryable errors (e.g. 401 Unauthorized, 400 Bad Request)
          if (status === 401 || status === 403 || status === 400) {
            throw new Error(`AI Provider rejected request with HTTP ${status}: ${errorBody.slice(0, 100)}`);
          }

          // Transient errors (429 Rate Limit, 500, 502, 503, 504) -> retry if attempts remaining
          if (attempt <= config.maxRetries) {
            const delay = attempt * 300 + Math.floor(Math.random() * 100);
            await new Promise((res) => setTimeout(res, delay));
            continue;
          }

          throw new Error(`AI Provider HTTP ${status} error: ${errorBody.slice(0, 100)}`);
        }

        const data = await response.json();
        const rawContent = data?.choices?.[0]?.message?.content;

        if (!rawContent || typeof rawContent !== 'string') {
          throw new Error('AI Provider returned empty or invalid completion payload');
        }

        const coverLetter = this.parseAndValidateAIResponse(rawContent, req);
        const promptTokens =
          typeof data?.usage?.prompt_tokens === 'number' && data.usage.prompt_tokens > 0
            ? data.usage.prompt_tokens
            : approxPromptTokens;
        const completionTokens =
          typeof data?.usage?.completion_tokens === 'number' && data.usage.completion_tokens > 0
            ? data.usage.completion_tokens
            : estimateTokensFromText(rawContent);

        return { coverLetter, promptTokens, completionTokens };
      } catch (err: unknown) {
        clearTimeout(timeoutHandle);
        lastError = err instanceof Error ? err : new Error(String(err));

        const errObj = err as { name?: string; code?: string };
        const isAbort = errObj?.name === 'AbortError';
        const isNetworkErr = errObj?.code === 'ECONNRESET' || errObj?.code === 'ETIMEDOUT' || isAbort;

        if (isNetworkErr && attempt <= config.maxRetries) {
          const delay = attempt * 300;
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }

        if (attempt > config.maxRetries) {
          break;
        }
      }
    }

    throw lastError || new Error('AI Provider call failed after retries');
  }

  /**
   * Parse LLM JSON output, strip formatting fences, and validate required cover letter structure
   */
  private static parseAndValidateAIResponse(
    rawContent: string,
    req: GenerateCoverLetterRequest
  ): CoverLetterData {
    let clean = rawContent.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      throw new Error('Failed to parse AI response as valid JSON');
    }

    // Validate essential properties
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON structure returned by AI');
    }

    const lang = (req.language || 'en') as string;
    const isAr = lang === 'ar';
    const isFr = lang === 'fr';
    const isDe = lang === 'de';
    const isEs = lang === 'es';
    const isTr = lang === 'tr';

    const defaultSalutation = isAr
      ? `عناية ${req.hiringManager || 'فريق التوظيف المحترم'}،`
      : isFr
      ? (req.hiringManager ? `À l'attention de ${req.hiringManager},` : 'Madame, Monsieur,')
      : isDe
      ? (req.hiringManager ? `Sehr geehrte(r) ${req.hiringManager},` : 'Sehr geehrte Damen und Herren,')
      : isEs
      ? (req.hiringManager ? `Estimado/a ${req.hiringManager}:` : 'Estimado/a responsable de selección:')
      : isTr
      ? (req.hiringManager ? `Sayın ${req.hiringManager},` : 'Sayın Yetkili,')
      : `Dear ${req.hiringManager || 'Hiring Team'},`;

    const defaultSignOff = isAr
      ? 'مع خالص التحية والتقدير،'
      : isFr
      ? "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées,"
      : isDe
      ? 'Mit freundlichen Grüßen,'
      : isEs
      ? 'Atentamente,'
      : isTr
      ? 'Saygılarımla,'
      : 'Sincerely,';

    const salutation = typeof parsed.salutation === 'string' && parsed.salutation.trim()
      ? parsed.salutation.trim()
      : defaultSalutation;

    const introduction = typeof parsed.introduction === 'string' && parsed.introduction.trim()
      ? parsed.introduction.trim()
      : '';

    const bodyParagraphs = Array.isArray(parsed.bodyParagraphs) && parsed.bodyParagraphs.length > 0
      ? parsed.bodyParagraphs.filter((p: any) => typeof p === 'string' && p.trim())
      : [];

    const conclusion = typeof parsed.conclusion === 'string' && parsed.conclusion.trim()
      ? parsed.conclusion.trim()
      : '';

    const signOff = typeof parsed.signOff === 'string' && parsed.signOff.trim()
      ? parsed.signOff.trim()
      : defaultSignOff;

    if (!introduction || bodyParagraphs.length === 0 || !conclusion) {
      throw new Error('AI response is missing core cover letter paragraphs');
    }

    const subjectPrefix = isAr
      ? 'الموضوع: '
      : isFr
      ? 'Objet : '
      : isDe
      ? 'Betreff: '
      : isEs
      ? 'Asunto: '
      : isTr
      ? 'Konu: '
      : 'Subject: ';

    const fullText = typeof parsed.fullText === 'string' && parsed.fullText.trim().length > 100
      ? parsed.fullText.trim()
      : [
          parsed.subject ? `${subjectPrefix}${parsed.subject}\n` : '',
          salutation,
          '',
          introduction,
          '',
          ...bodyParagraphs.map((p: string) => p + '\n'),
          conclusion,
          '',
          signOff,
          req.sender?.fullName || '',
          req.sender?.email || '',
          req.sender?.phone || '',
        ]
          .filter(Boolean)
          .join('\n');

    const keywords = Array.isArray(parsed.extractedKeywords) && parsed.extractedKeywords.length > 0
      ? parsed.extractedKeywords.filter((k: any) => typeof k === 'string').slice(0, 15)
      : CoverLetterService.extractKeywords(req.jobDescription || '', 8);

    const defaultCompany = isAr ? 'الشركة الموقرة' : isFr ? "l'Entreprise" : isDe ? 'das Unternehmen' : isEs ? 'la Empresa' : isTr ? 'Şirket' : 'the Company';
    const defaultRole = isAr ? 'الوظيفة المطروحة' : isFr ? 'le Poste' : isDe ? 'die Position' : isEs ? 'el Puesto' : isTr ? 'Pozisyon' : 'the Role';
    const defaultManager = isAr ? 'فريق الموارد البشرية' : isFr ? 'Équipe de recrutement' : isDe ? 'Personalabteilung' : isEs ? 'Equipo de selección' : isTr ? 'İşe Alım Ekibi' : 'Hiring Team';
    const defaultDocTitle = isAr ? 'خطاب تقديم' : isFr ? 'Lettre de motivation' : isDe ? 'Bewerbungsanschreiben' : isEs ? 'Carta de presentación' : isTr ? 'Ön Yazı' : 'Cover Letter';

    const company = req.companyName || defaultCompany;
    const jobTitle = req.jobTitle || defaultRole;

    const defaultSubject = isAr
      ? `طلب التقديم لشغل وظيفة: ${jobTitle}`
      : isFr
      ? `Candidature au poste de : ${jobTitle}`
      : isDe
      ? `Bewerbung als ${jobTitle}`
      : isEs
      ? `Candidatura para el puesto de: ${jobTitle}`
      : isTr
      ? `${jobTitle} Pozisyonu Başvurusu`
      : `Application for ${jobTitle} Role`;

    const content: CoverLetterContent = {
      subject: parsed.subject || defaultSubject,
      salutation,
      introduction,
      bodyParagraphs,
      conclusion,
      signOff,
      fullText,
    };

    return {
      title: `${defaultDocTitle} - ${company}`,
      sender: {
        fullName: req.sender?.fullName || (isAr ? 'مقدم الطلب' : 'Applicant'),
        email: req.sender?.email || '',
        phone: req.sender?.phone || '',
      },
      recipient: {
        companyName: company,
        jobTitle,
        hiringManager: req.hiringManager || defaultManager,
      },
      jobDescription: req.jobDescription || '',
      extractedKeywords: keywords,
      tone: req.tone || 'formal',
      language: req.language || 'en',
      templateId: req.templateId || 'compact',
      content,
      linkedResumeId: req.resumeId,
    };
  }

  /**
   * Build targeted System and User prompts for Cover Letter generation
   */
  private static buildPrompts(
    req: GenerateCoverLetterRequest,
    resumeData: any
  ): { systemPrompt: string; userPrompt: string } {
    const lang = (req.language || 'en') as string;
    const tone = req.tone || 'formal';

    const langNameMap: Record<string, string> = {
      en: 'English',
      ar: 'Arabic (العربية الفصحى)',
      fr: 'French (Français)',
      de: 'German (Deutsch)',
      es: 'Spanish (Español)',
      tr: 'Turkish (Türkçe)',
    };

    const conventionsMap: Record<string, { salutation: string; signOff: string }> = {
      en: { salutation: 'Dear Hiring Team,', signOff: 'Sincerely,' },
      ar: { salutation: 'السادة أعضاء لجنة التوظيف الموقرين،', signOff: 'وتفضلوا بقبول فائق الاحترام والتقدير،' },
      fr: { salutation: 'Madame, Monsieur,', signOff: "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées," },
      de: { salutation: 'Sehr geehrte Damen und Herren,', signOff: 'Mit freundlichen Grüßen,' },
      es: { salutation: 'Estimado/a responsable de selección:', signOff: 'Atentamente,' },
      tr: { salutation: 'Sayın Yetkili,', signOff: 'Saygılarımla,' },
    };

    const targetLangName = langNameMap[lang] || 'English';
    const targetConventions = conventionsMap[lang] || conventionsMap.en;

    const toneInstruction =
      tone === 'technical'
        ? 'Focus heavily on technical precision, engineering methodologies, software architecture, tools, and quantifiable operational metrics.'
        : tone === 'leadership'
        ? 'Adopt an authoritative strategic tone emphasizing cross-functional leadership, team scaling, business outcomes, and stakeholder alignment.'
        : tone === 'enthusiastic'
        ? 'Inject genuine passion for the company vision, dynamic team collaboration, rapid learning agility, and positive energy.'
        : 'Maintain a polished, respectful, formal executive business tone suited for enterprise corporate recruitment.';

    const systemPrompt = `You are a world-class HR Director and Executive Job Application Specialist crafting high-impact, ATS-optimized cover letters.
Your mission is to write a tailored, compelling cover letter grounded strictly in the candidate's actual qualifications and target job criteria.

CRITICAL INSTRUCTIONS FOR TARGET LANGUAGE (${targetLangName}):
1. WRITE NATIVELY: Write directly and naturally in ${targetLangName}. Do NOT perform literal machine translation. Use authentic native phrasing, idioms, and conventions expected in high-level job applications in that language.
2. REGISTER & TONE: ${toneInstruction} Use the formal register appropriate for job applications.
3. CONVENTIONS:
   - Salutation convention: "${targetConventions.salutation}" (or address by name if provided).
   - Sign-off convention: "${targetConventions.signOff}".
4. PRESERVE TECHNICAL TERMS & PROPER NOUNS: Keep personal names, company names, tools, libraries, frameworks, and technical keywords (e.g. React, Next.js, TypeScript, Python, Docker, Kubernetes, AWS, PostgreSQL, Redis, CI/CD, Git) in their original Latin alphabet and spelling. Do NOT translate or transliterate them.
5. STRICT FACTUAL ACCURACY: NEVER invent, extrapolate, or hallucinate degrees, former employers, certifications, metrics, or experiences not present in the provided candidate data. If specific information is absent, frame the narrative around the candidate's verified background and enthusiastic capacity to deliver value.

MANDATORY OUTPUT FORMAT:
You MUST respond strictly with valid JSON conforming to the following structure (no markdown fences, no explanatory preamble):
{
  "subject": "Clear, professional subject line in ${targetLangName}",
  "salutation": "Proper formal salutation line",
  "introduction": "Engaging opening paragraph outlining candidate interest and core value proposition",
  "bodyParagraphs": [
    "First body paragraph detailing relevant skills, projects, and work experience matching the job",
    "Second body paragraph highlighting quantifiable achievements, problem-solving, and alignment with company culture"
  ],
  "conclusion": "Polite, confident closing paragraph with a proactive call to interview",
  "signOff": "Proper formal sign-off phrase in ${targetLangName}",
  "fullText": "Full formatted cover letter text with paragraphs cleanly arranged",
  "extractedKeywords": ["keyword1", "keyword2", "keyword3"]
}`;

    // Candidate details
    const candidateName = req.sender?.fullName || resumeData?.data?.personalInfo?.fullName || 'Candidate';
    const candidateRole = resumeData?.data?.personalInfo?.jobTitle || 'Professional';
    const skills = Array.isArray(resumeData?.data?.skills)
      ? resumeData.data.skills.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean).slice(0, 12).join(', ')
      : 'Software development, Problem solving';

    let experienceSummary = '';
    if (Array.isArray(resumeData?.data?.experience) && resumeData.data.experience.length > 0) {
      experienceSummary = resumeData.data.experience
        .slice(0, 3)
        .map((e: any) => `- ${e.position || e.title} at ${e.company} (${e.startDate || ''} - ${e.endDate || 'Present'})`)
        .join('\n');
    }

    const userPrompt = `
Job Title: ${req.jobTitle || 'Target Role'}
Company Name: ${req.companyName || 'Target Company'}
Hiring Manager: ${req.hiringManager || 'Hiring Manager'}
Language: ${req.language || 'ar'}
Tone: ${tone}

Job Description:
${req.jobDescription}

Candidate Profile:
- Name: ${candidateName}
- Current/Target Role: ${candidateRole}
- Key Skills: ${skills}
${experienceSummary ? `\nPast Experience:\n${experienceSummary}` : ''}
${req.customNotes ? `\nSpecial Notes from Candidate: ${req.customNotes}` : ''}
`;

    return { systemPrompt, userPrompt };
  }
}
