import { ResumeData } from '../builder/types';
import { GenerateResumeRequest, ResumeService, GeneratedResumeResult } from './resumeService';
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

export interface AIResumeClientConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  maxTokens: number;
  maxRetries: number;
  enabled: boolean;
}

export interface AIResumeRequestOptions {
  userId?: string | null;
  endpoint?: string;
}

export class AIResumeClient {
  /**
   * Safely resolve environment settings at runtime
   * Enforces timeout, max_tokens, and 1 retry by default.
   */
  static getConfig(): AIResumeClientConfig {
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    const model = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
    const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const timeoutMs = parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '15000', 10);
    const maxTokens = parseInt(
      process.env.AI_RESUME_MAX_TOKENS || process.env.AI_MAX_TOKENS || '2500',
      10
    );
    const maxRetries = parseInt(process.env.AI_MAX_RETRIES || '1', 10);
    const enabled = process.env.AI_PROVIDER_ENABLED !== 'false' && apiKey.length > 0;

    return {
      apiKey,
      model,
      baseUrl,
      timeoutMs: isNaN(timeoutMs) || timeoutMs < 100 ? 15000 : timeoutMs,
      maxTokens: isNaN(maxTokens) || maxTokens < 100 ? 2500 : Math.min(maxTokens, 4096),
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
   * Main entry point: Generates structured ATS Resume or CV JSON via external AI (LLM) if available,
   * enforcing circuit breaker, daily user quota (lib/plans.ts), and daily project budget (AI_DAILY_BUDGET_USD),
   * and logging every request in the AiUsage collection.
   */
  static async generateResume(
    req: GenerateResumeRequest,
    options?: AIResumeRequestOptions
  ): Promise<GeneratedResumeResult> {
    const startTime = Date.now();
    const config = this.getConfig();
    const docType = req.documentType || 'resume';
    const outputLang = req.outputLanguage || 'en';
    const userId = options?.userId || (req as any)?.userId || 'anonymous';
    const endpoint = options?.endpoint || '/api/resume/generate';

    const { systemPrompt, userPrompt } = this.buildPrompts(req);
    const approxPromptTokens = estimateTokensFromText(systemPrompt + '\n' + userPrompt);

    // 1. Check Circuit Breaker, Global Daily Budget (AI_DAILY_BUDGET_USD), and Per-User Daily Limit (from plans.ts)
    const guard = await evaluateAiPreCallGuard({ userId, endpoint });
    if (!guard.allowExternalCall) {
      const fallbackResume = ResumeService.generateResume(req);
      const coverage = ResumeService.analyzeKeywordCoverage(req.jobDescription || '', fallbackResume);
      const approxCompletionTokens = estimateTokensFromText(JSON.stringify(fallbackResume));
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
        resume: fallbackResume,
        keywordCoverage: coverage,
        provider: 'built-in-ats-fallback',
        aiGenerated: false,
        fallbackReason: guard.fallbackReason,
        tokens: totalTokens,
        costUsd: 0,
        latencyMs,
        documentType: docType,
        outputLanguage: outputLang,
      };
    }

    // 2. If AI is not configured or disabled, smoothly use domain-driven fallback and log usage
    if (!config.enabled) {
      const fallbackResume = ResumeService.generateResume(req);
      const coverage = ResumeService.analyzeKeywordCoverage(req.jobDescription || '', fallbackResume);
      const approxCompletionTokens = estimateTokensFromText(JSON.stringify(fallbackResume));
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
        resume: fallbackResume,
        keywordCoverage: coverage,
        provider: 'built-in-ats-engine',
        aiGenerated: false,
        fallbackReason: 'provider_not_configured',
        tokens: totalTokens,
        costUsd: 0,
        latencyMs,
        documentType: docType,
        outputLanguage: outputLang,
      };
    }

    // 3. Attempt generation via external AI Provider with single retry and timeout
    try {
      const { resume: aiResume, promptTokens, completionTokens } = await this.callAIWithRetry(
        req,
        config,
        systemPrompt,
        userPrompt,
        approxPromptTokens
      );
      recordCircuitSuccess();

      const coverage = ResumeService.analyzeKeywordCoverage(req.jobDescription || '', aiResume);
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
        resume: aiResume,
        keywordCoverage: coverage,
        provider: config.model,
        aiGenerated: true,
        tokens: totalTokens,
        costUsd,
        latencyMs,
        documentType: docType,
        outputLanguage: outputLang,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown external AI error';
      recordCircuitFailure(errorMsg);
      console.warn(
        `[AIResumeClient] External AI provider failed (${errorMsg}). Switching smoothly to built-in ATS fallback.`
      );

      // 4. Fallback safely without crashing and log fallback in AiUsage
      const fallbackResume = ResumeService.generateResume(req);
      const coverage = ResumeService.analyzeKeywordCoverage(req.jobDescription || '', fallbackResume);
      const approxCompletionTokens = estimateTokensFromText(JSON.stringify(fallbackResume));
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
        resume: fallbackResume,
        keywordCoverage: coverage,
        provider: 'built-in-ats-fallback',
        aiGenerated: false,
        fallbackReason: errorMsg,
        tokens: totalTokens,
        costUsd: 0,
        latencyMs,
        documentType: docType,
        outputLanguage: outputLang,
      };
    }
  }

  /**
   * Execute API call to OpenAI-compatible Chat Completion endpoint with bounded retry (1 retry) and timeout
   */
  private static async callAIWithRetry(
    req: GenerateResumeRequest,
    config: AIResumeClientConfig,
    systemPrompt: string,
    userPrompt: string,
    approxPromptTokens: number
  ): Promise<{ resume: ResumeData; promptTokens: number; completionTokens: number }> {
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
            temperature: 0.65,
            max_tokens: config.maxTokens,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutHandle);

        if (!response.ok) {
          const status = response.status;
          const errorBody = await response.text().catch(() => '');

          if (status === 401 || status === 403 || status === 400) {
            throw new Error(`AI Provider rejected request with HTTP ${status}: ${errorBody.slice(0, 100)}`);
          }

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
          throw new Error('AI Provider returned empty completion payload');
        }

        const resume = this.parseAndValidateAIResponse(rawContent, req);
        const promptTokens =
          typeof data?.usage?.prompt_tokens === 'number' && data.usage.prompt_tokens > 0
            ? data.usage.prompt_tokens
            : approxPromptTokens;
        const completionTokens =
          typeof data?.usage?.completion_tokens === 'number' && data.usage.completion_tokens > 0
            ? data.usage.completion_tokens
            : estimateTokensFromText(rawContent);

        return { resume, promptTokens, completionTokens };
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
   * Parse LLM JSON output and ensure compliance with ResumeData interface
   */
  private static parseAndValidateAIResponse(
    rawContent: string,
    req: GenerateResumeRequest
  ): ResumeData {
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
      throw new Error('Failed to parse AI JSON response');
    }

    const baseline = ResumeService.generateResume(req);

    // Merge safely with baseline to guarantee no missing fields
    return {
      personalInfo: {
        fullName: parsed.personalInfo?.fullName || baseline.personalInfo.fullName,
        jobTitle: parsed.personalInfo?.jobTitle || req.targetJobTitle,
        email: parsed.personalInfo?.email || baseline.personalInfo.email,
        phone: parsed.personalInfo?.phone || baseline.personalInfo.phone,
        location: parsed.personalInfo?.location || baseline.personalInfo.location,
        website: parsed.personalInfo?.website || baseline.personalInfo.website,
        linkedin: parsed.personalInfo?.linkedin || baseline.personalInfo.linkedin,
        github: parsed.personalInfo?.github || baseline.personalInfo.github,
        summary: parsed.personalInfo?.summary || baseline.personalInfo.summary,
        photoUrl: '',
        showPhoto: false,
      },
      experience: Array.isArray(parsed.experience) && parsed.experience.length > 0
        ? parsed.experience.map((e: any, idx: number) => ({
            id: String(e.id || idx + 1),
            company: e.company || (req.outputLanguage === 'ar' ? '[اسم الشركة]' : '[Company Name]'),
            position: e.position || req.targetJobTitle,
            location: e.location || (req.outputLanguage === 'ar' ? '[المدينة، الدولة]' : '[City, Country]'),
            startDate: e.startDate || '2021-01',
            endDate: e.endDate || 'Present',
            current: Boolean(e.current ?? (e.endDate === 'Present' || e.endDate === 'حتى الآن')),
            description: Array.isArray(e.description) && e.description.length > 0
              ? e.description.filter(Boolean)
              : [String(e.description || '')],
          }))
        : baseline.experience,
      education: Array.isArray(parsed.education) && parsed.education.length > 0
        ? parsed.education.map((ed: any, idx: number) => ({
            id: String(ed.id || idx + 1),
            institution: ed.institution || baseline.education[0]?.institution,
            degree: ed.degree || baseline.education[0]?.degree,
            fieldOfStudy: ed.fieldOfStudy || baseline.education[0]?.fieldOfStudy,
            startDate: ed.startDate || '2018',
            endDate: ed.endDate || '2022',
            gpa: ed.gpa || '',
          }))
        : baseline.education,
      projects: Array.isArray(parsed.projects) && parsed.projects.length > 0
        ? parsed.projects.map((p: any, idx: number) => ({
            id: String(p.id || idx + 1),
            title: p.title || `Project ${idx + 1}`,
            techStack: p.techStack || '',
            link: p.link || '',
            description: Array.isArray(p.description) ? p.description : [String(p.description || '')],
          }))
        : baseline.projects,
      skills: Array.isArray(parsed.skills) && parsed.skills.length > 0
        ? parsed.skills.filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        : baseline.skills,
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : baseline.certifications,
      languages: Array.isArray(parsed.languages) && parsed.languages.length > 0
        ? parsed.languages.map((l: any, i: number) => ({
            id: String(l.id || `lang-${i + 1}`),
            name: l.name || '',
            proficiency: l.proficiency || 'Fluent',
          }))
        : baseline.languages,
    };
  }

  /**
   * Construct strict prompts enforcing:
   * - Native writing in target language
   * - Preservation of names, companies, tech terms
   * - Strict prohibition against hallucinating employers, degrees, dates, metrics
   * - Clear placeholders if data is missing
   * - Concise 1-page for Resume vs comprehensive multi-page for CV
   */
  private static buildPrompts(req: GenerateResumeRequest): { systemPrompt: string; userPrompt: string } {
    const lang = req.outputLanguage || 'en';
    const isCv = req.documentType === 'cv';

    const langNames: Record<string, string> = {
      en: 'English',
      ar: 'Modern Standard Arabic (العربية الفصحى)',
      fr: 'French (Français)',
      de: 'German (Deutsch)',
      es: 'Spanish (Español)',
      tr: 'Turkish (Türkçe)',
    };

    const targetLangName = langNames[lang] || 'English';

    const systemPrompt = `You are an elite, certified ATS Resume & CV Strategist and Executive Recruiter.
Your objective is to generate an authentic, high-impact, ATS-optimized JSON resume document written natively in ${targetLangName}.

CRITICAL MANDATES & CONSTRAINTS:
1. WRITE NATIVELY in ${targetLangName}. Do NOT use awkward word-for-word machine translation. Use the industry terminology expected by senior recruiters in this language.
2. PRESERVE ENTITY & TECHNICAL NAMES:
   - Keep software names, frameworks, platforms, and programming languages UNTRANSLATED in Latin script (e.g. React, Next.js, TypeScript, Python, AWS, Docker, Kubernetes, SQL, Node.js, Git, CI/CD, Figma).
   - Keep real company names and university names as provided by the candidate.
3. ANTI-HALLUCINATION & FACTUAL INTEGRITY (ABSOLUTE RULE):
   - NEVER fabricate or invent employers, university degrees, academic honors, or exact employment dates not provided in the user input.
   - If the user did not provide specific metrics or companies, use clear neutral placeholders enclosed in square brackets for them to fill in:
     e.g., "[Company Name]", "[Degree Name]", "[University Name]", "[Location]".
   - Do NOT invent false percentages or fictitious dollar amounts. If suggesting an achievement template where metrics belong, frame it naturally (e.g., "streamlined deployment cycles, reducing release turnaround times").
4. DOCUMENT FORMAT:
   ${isCv 
     ? '- CV (Detailed, Multi-Page): Produce an extensive, comprehensive curriculum vitae with detailed professional experience, technical competencies, certifications, and project descriptions.'
     : '- RESUME (1 Page, Concise): Produce a tight, high-density single-page resume with 3-4 impactful bullet points per role starting with strong action verbs (e.g., Spearheaded, Architected, Automated, Accelerated, Streamlined).'}
5. ATS OPTIMIZATION & KEYWORDS:
   - When a job description is provided, weave its key requirements and technical keywords naturally into the professional summary, skills taxonomy, and experience bullets without spamming or keyword stuffing.
6. RETURN ONLY VALID JSON matching the required schema. Do not wrap in markdown or include conversational text.`;

    const userPrompt = `Generate a structured ${isCv ? 'Curriculum Vitae (CV)' : 'ATS Resume'} JSON matching this schema:
{
  "personalInfo": {
    "fullName": "Candidate Name",
    "jobTitle": "${req.targetJobTitle}",
    "email": "user@example.com",
    "phone": "+1 555-0100",
    "location": "City, Country",
    "website": "",
    "linkedin": "",
    "github": "",
    "summary": "Compelling 3-4 sentence professional summary aligned with target title"
  },
  "experience": [
    {
      "id": "1",
      "company": "Company Name",
      "position": "${req.targetJobTitle}",
      "location": "City, Country",
      "startDate": "YYYY-MM",
      "endDate": "Present",
      "current": true,
      "description": [
        "Action verb + task + measurable impact or outcome",
        "Action verb + technical accomplishment + business value"
      ]
    }
  ],
  "education": [
    {
      "id": "1",
      "institution": "University / College",
      "degree": "Degree",
      "fieldOfStudy": "Field of Study",
      "startDate": "YYYY",
      "endDate": "YYYY"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "certifications": ["Certification 1"],
  "projects": [
    {
      "id": "1",
      "title": "Project Name",
      "techStack": "Tech 1, Tech 2",
      "link": "",
      "description": ["Project achievement and architecture"]
    }
  ],
  "languages": [
    { "id": "1", "name": "Language", "proficiency": "Native/Fluent" }
  ]
}

CANDIDATE INPUT DETAILS:
- Target Job Title: ${req.targetJobTitle}
- Target Document Type: ${isCv ? 'CV (Detailed, Multi-Page)' : 'Resume (1 Page, Concise)'}
- Output Language: ${targetLangName} (${lang})
- Tone: ${req.tone || 'professional'}
- Years of Experience: ${req.yearsOfExperience || 'Not specified'}
- Key Skills: ${typeof req.keySkills === 'string' ? req.keySkills : Array.isArray(req.keySkills) ? req.keySkills.join(', ') : 'Extract relevant skills'}
- Work History Data:
${typeof req.workHistory === 'string' && req.workHistory.trim().length > 0 ? req.workHistory : 'No raw work history provided. Provide structured baseline positions with placeholders.'}
- Education Data:
${typeof req.education === 'string' && req.education.trim().length > 0 ? req.education : 'No raw education provided. Use placeholder.'}
- Candidate Name: ${req.senderName || '[Full Name]'}
- Candidate Email: ${req.senderEmail || '[Email Address]'}
- Target Job Description:
${req.jobDescription && req.jobDescription.trim().length > 20 ? req.jobDescription.trim() : 'No job description provided; optimize for industry standard keywords.'}
`;

    return { systemPrompt, userPrompt };
  }
}
