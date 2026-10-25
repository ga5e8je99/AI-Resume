/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CoverLetterData,
  CoverLetterContent,
  GenerateCoverLetterRequest,
  CoverLetterTone,
} from '../cover-letter/types';
import { CoverLetterService } from './coverLetterService';

export interface AIClientConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  enabled: boolean;
}

export interface AICoverLetterResult {
  coverLetter: CoverLetterData;
  provider: string;
  aiGenerated: boolean;
  fallbackReason?: string;
  latencyMs: number;
}

export class AICoverLetterClient {
  /**
   * Resolve environment settings safely at runtime
   */
  static getConfig(): AIClientConfig {
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    const model = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
    const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const timeoutMs = parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '15000', 10);
    const maxRetries = parseInt(process.env.AI_MAX_RETRIES || '2', 10);
    const enabled = process.env.AI_PROVIDER_ENABLED !== 'false' && apiKey.length > 0;

    return {
      apiKey,
      model,
      baseUrl,
      timeoutMs: isNaN(timeoutMs) || timeoutMs < 1000 ? 15000 : timeoutMs,
      maxRetries: isNaN(maxRetries) || maxRetries < 0 ? 2 : Math.min(maxRetries, 5),
      enabled,
    };
  }

  /**
   * Check if an external AI provider is configured and available
   */
  static isConfigured(): boolean {
    return this.getConfig().enabled;
  }

  /**
   * Main entry point: Generates a tailored cover letter using external AI (LLM) if available,
   * with automatic, graceful fallback to the robust algorithmic ATS generator on any error or timeout.
   */
  static async generateCoverLetter(
    req: GenerateCoverLetterRequest,
    resumeData?: any
  ): Promise<AICoverLetterResult> {
    const startTime = Date.now();
    const config = this.getConfig();

    // 1. If AI is not configured or disabled, smoothly use domain-driven fallback
    if (!config.enabled) {
      const fallbackLetter = CoverLetterService.generateCoverLetter(req, resumeData);
      return {
        coverLetter: {
          ...fallbackLetter,
          provider: 'built-in-ats-engine',
          aiGenerated: false,
        },
        provider: 'built-in-ats-engine',
        aiGenerated: false,
        latencyMs: Date.now() - startTime,
      };
    }

    // 2. Attempt generation via external AI Provider with retries and timeout
    try {
      const aiResult = await this.callAIWithRetry(req, resumeData, config);
      return {
        coverLetter: {
          ...aiResult,
          provider: config.model,
          aiGenerated: true,
        },
        provider: config.model,
        aiGenerated: true,
        latencyMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown external AI error';
      console.warn(
        `[AICoverLetterClient] External AI provider failed (${errorMsg}). Switching smoothly to built-in ATS fallback.`
      );

      // 3. Fallback safely without crashing or leaking server details
      const fallbackLetter = CoverLetterService.generateCoverLetter(req, resumeData);
      return {
        coverLetter: {
          ...fallbackLetter,
          provider: 'built-in-ats-fallback',
          aiGenerated: false,
        },
        provider: 'built-in-ats-fallback',
        aiGenerated: false,
        fallbackReason: errorMsg,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute API call to OpenAI-compatible Chat Completion endpoint with bounded retries and timeout
   */
  private static async callAIWithRetry(
    req: GenerateCoverLetterRequest,
    resumeData: any,
    config: AIClientConfig
  ): Promise<CoverLetterData> {
    const { systemPrompt, userPrompt } = this.buildPrompts(req, resumeData);
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
            max_tokens: 1500,
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
            const delay = attempt * 800 + Math.floor(Math.random() * 200);
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

        return this.parseAndValidateAIResponse(rawContent, req);
      } catch (err: unknown) {
        clearTimeout(timeoutHandle);
        lastError = err instanceof Error ? err : new Error(String(err));

        const errObj = err as { name?: string; code?: string };
        const isAbort = errObj?.name === 'AbortError';
        const isNetworkErr = errObj?.code === 'ECONNRESET' || errObj?.code === 'ETIMEDOUT' || isAbort;

        if (isNetworkErr && attempt <= config.maxRetries) {
          const delay = attempt * 1000;
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

    const salutation = typeof parsed.salutation === 'string' && parsed.salutation.trim()
      ? parsed.salutation.trim()
      : req.language === 'ar'
      ? `عناية ${req.hiringManager || 'فريق التوظيف المحترم'}،`
      : `Dear ${req.hiringManager || 'Hiring Team'},`;

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
      : req.language === 'ar'
      ? 'مع خالص التحية والتقدير،'
      : 'Sincerely,';

    if (!introduction || bodyParagraphs.length === 0 || !conclusion) {
      throw new Error('AI response is missing core cover letter paragraphs');
    }

    const fullText = typeof parsed.fullText === 'string' && parsed.fullText.trim().length > 100
      ? parsed.fullText.trim()
      : [
          parsed.subject ? `الموضوع: ${parsed.subject}\n` : '',
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

    const isAr = req.language === 'ar';
    const company = req.companyName || (isAr ? 'الشركة الموقرة' : 'the Company');
    const jobTitle = req.jobTitle || (isAr ? 'الوظيفة المطروحة' : 'the Role');

    const content: CoverLetterContent = {
      subject: parsed.subject || (isAr ? `طلب التقديم لشغل وظيفة: ${jobTitle}` : `Application for ${jobTitle} Role`),
      salutation,
      introduction,
      bodyParagraphs,
      conclusion,
      signOff,
      fullText,
    };

    return {
      title: `${isAr ? 'خطاب تقديم' : 'Cover Letter'} - ${company}`,
      sender: {
        fullName: req.sender?.fullName || (isAr ? 'مقدم الطلب' : 'Applicant'),
        email: req.sender?.email || '',
        phone: req.sender?.phone || '',
      },
      recipient: {
        companyName: company,
        jobTitle,
        hiringManager: req.hiringManager || (isAr ? 'فريق الموارد البشرية' : 'Hiring Team'),
      },
      jobDescription: req.jobDescription || '',
      extractedKeywords: keywords,
      tone: req.tone || 'formal',
      language: req.language || 'ar',
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
    const isAr = req.language === 'ar';
    const tone = req.tone || 'formal';

    const toneDescriptions: Record<CoverLetterTone, string> = {
      formal: isAr
        ? 'نبرة رسمية ومهنية راقية، تعكس الاحترام والموثوقية والالتزام بمعايير العمل المؤسسي.'
        : 'Formal, polite, highly professional and respectful executive corporate tone.',
      technical: isAr
        ? 'نبرة تقنية دقيقة، تركز على المهارات العملية، الأدوات الهندسية، المعمارية البرمجية، والأثر بالأرقام.'
        : 'Technical, analytical, highlighting practical tools, architecture, engineering methodologies, and quantifiable metrics.',
      leadership: isAr
        ? 'نبرة قيادية استراتيجية، تركز على قيادة الفرق، التخطيط بعيد المدى، اتخاذ القرارات، وتحقيق الأهداف المؤسسية.'
        : 'Leadership and strategic tone, emphasizing vision, team empowerment, stakeholder management, and business outcomes.',
      enthusiastic: isAr
        ? 'نبرة حماسية ملهمة، تنبض بالشغف بثقافة الشركة والابتكار والرغبة الصادقة في صناعة فارق حقيقي.'
        : 'Enthusiastic and energized tone, highlighting passion for company culture, drive for innovation, and high motivation.',
    };

    const systemPrompt = isAr
      ? `أنت خبير محترف في الموارد البشرية (HR Expert) وصياغة خطابات التقديم المخصصة (Cover Letters) المتوافقة مع أنظمة التوظيف الحديثة (ATS).
مهمتك: صياغة خطاب تقديم مخصص، احترافي، مقنع وجذاب بنسبة 100%، مستنداً إلى السيرة الذاتية للمتقدم ومتطلبات الوظيفة.
القواعد الإلزامية:
1. النبرة المطلوبة: ${toneDescriptions[tone]}
2. اللغة: اللغة العربية السليمة دون ركاكة أو أخطاء إملائية.
3. التوافق مع أنظمة ATS: تضمين المهارات والكلمات المفتاحية الأساسية للوظيفة بذكاء وسلاسة داخل سياق الفقرات.
4. يجب أن تُرجع النتيجة بصيغة JSON فقط وحصراً وفق الهيكل التالي:
{
  "subject": "الموضوع",
  "salutation": "التحية الافتتاحية",
  "introduction": "فقرة المقدمة وجذب الانتباه",
  "bodyParagraphs": ["فقرة الخبرات والمطابقة الأولى", "فقرة الإنجازات والقيمة المضافة الثانية"],
  "conclusion": "فقرة الختام والدعوة للمقابلة",
  "signOff": "عبارة الوداع الرسمية",
  "fullText": "النص الكامل المتصل للخطاب مرتباً ومنسقاً بعناية",
  "extractedKeywords": ["كلمة1", "كلمة2", "كلمة3"]
}`
      : `You are an expert HR Specialist and professional Cover Letter writer specialized in ATS-optimized, high-impact job applications.
Your mission: Craft a 100% tailored, compelling, and professional cover letter directly grounded in the candidate's resume and target job requirements.
Mandatory Rules:
1. Target Tone: ${toneDescriptions[tone]}
2. Language: English (clean, modern, grammatically flawless).
3. ATS Optimization: Naturally weave relevant job keywords and candidate skills into the narrative.
4. Output must be strictly valid JSON matching this exact schema:
{
  "subject": "Application Subject Line",
  "salutation": "Salutation line",
  "introduction": "Engaging introduction paragraph",
  "bodyParagraphs": ["Paragraph 1 on relevant skills and experience", "Paragraph 2 on quantifiable impact and culture fit"],
  "conclusion": "Strong closing paragraph with call to action",
  "signOff": "Sign-off phrase",
  "fullText": "Full formatted cover letter text",
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
