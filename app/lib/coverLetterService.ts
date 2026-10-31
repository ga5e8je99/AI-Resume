import {
  CoverLetterData,
  CoverLetterTone,
  CoverLetterLanguage,
  GenerateCoverLetterRequest,
} from '../cover-letter/types';

// Broad taxonomy of technical, managerial, data, design, and soft skills in EN and AR
const COMMON_SKILLS_KEYWORDS = [
  // Engineering & Web Tech
  'React', 'Next.js', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'Node.js',
  'Express', 'NestJS', 'Python', 'Django', 'FastAPI', 'Java', 'Spring Boot',
  'C#', '.NET', 'PHP', 'Laravel', 'Go', 'Golang', 'Rust', 'Ruby on Rails',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Azure', 'Google Cloud', 'GCP', 'CI/CD', 'Git', 'GitHub', 'REST API',
  'GraphQL', 'Tailwind CSS', 'Microservices', 'Unit Testing', 'Jest', 'Agile', 'Scrum',
  // AI & Data
  'Machine Learning', 'Artificial Intelligence', 'Deep Learning', 'Data Analysis',
  'Data Science', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision', 'Pandas',
  'NumPy', 'Tableau', 'Power BI', 'ETL', 'Big Data', 'LLM',
  // Management, Operations & Business
  'Project Management', 'Product Management', 'Team Leadership', 'Strategic Planning',
  'Business Development', 'Budgeting', 'Risk Management', 'Stakeholder Management',
  'Scrum Master', 'Operations Management', 'Sales', 'Digital Marketing', 'SEO',
  'Customer Success', 'Communication Skills', 'Problem Solving', 'Quality Assurance',
  // Arabic Keywords & Specialized terms
  'إدارة المشاريع', 'التطوير البرمجي', 'تحليل البيانات', 'إدارة فرق العمل',
  'حل المشكلات', 'التفكير الاستراتيجي', 'التواصل الفعال', 'خدمة العملاء',
  'المبيعات والتسويق', 'التخطيط المالي', 'ضمان الجودة', 'الذكاء الاصطناعي',
  'هندسة البرمجيات', 'أمن المعلومات', 'الحوسبة السحابية', 'إدارة المنتجات',
  'تطوير الواجهات', 'تطوير النظم الخلفية', 'إدارة المخاطر', 'حوكمة البيانات',
];

// Common stop words to exclude from generic keyword fallbacks
const STOP_WORDS_EN = new Set([
  'about', 'above', 'after', 'again', 'against', 'all', 'and', 'any', 'are', 'because',
  'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could', 'did',
  'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'has', 'have', 'having', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his',
  'how', 'into', 'its', 'itself', 'just', 'more', 'most', 'myself', 'nor', 'not',
  'now', 'off', 'once', 'only', 'other', 'ought', 'our', 'ours', 'ourselves', 'out',
  'over', 'own', 'same', 'should', 'so', 'some', 'such', 'than', 'that', 'the',
  'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'too', 'under', 'until', 'very', 'was', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'will', 'must', 'shall', 'able', 'looking',
  'role', 'job', 'position', 'experience', 'company', 'work', 'years', 'candidate',
]);

const STOP_WORDS_AR = new Set([
  'هذا', 'هذه', 'هؤلاء', 'ذلك', 'تلك', 'التي', 'الذي', 'الذين', 'اللواتي', 'على',
  'إلى', 'عن', 'في', 'من', 'مع', 'حتى', 'إذا', 'أن', 'إن', 'كان', 'كانت', 'يكون',
  'سوف', 'قد', 'بين', 'حول', 'تحت', 'فوق', 'بعد', 'قبل', 'عند', 'كل', 'بعض',
  'غير', 'نحو', 'خلال', 'ضمن', 'مثل', 'أيضا', 'كذلك', 'حيث', 'لماذا', 'كيف',
  'ماذا', 'متى', 'أين', 'هو', 'هي', 'هما', 'هم', 'هن', 'أنا', 'نحن', 'أنت',
  'أنتم', 'وظيفة', 'عمل', 'سنة', 'سنوات', 'مطلوب', 'شركة', 'فريق', 'خبرة',
]);

export class CoverLetterService {
  /**
   * Normalize Arabic text by removing tashkeel and harmonizing letter shapes
   */
  static normalizeArabic(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\u064B-\u065F\u0670]/g, '') // Tashkeel / diacritics
      .replace(/[إأآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه');
  }

  /**
   * Sanitize text against XSS and script injection by stripping executable tags,
   * javascript protocols, inline event handlers, and escaping remaining HTML symbols.
   */
  static sanitizeText(input: unknown): string {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/on\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, '')
      .replace(/javascript:[^\s"'>]*/gi, '')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();
  }

  /**
   * Extract key industry and skill keywords from job description with frequency ranking and deduplication
   */
  static extractKeywords(jobDescription: string, limit = 10): string[] {
    if (!jobDescription || typeof jobDescription !== 'string') return [];

    const rawText = jobDescription;
    const lowerText = rawText.toLowerCase();
    const normalizedArText = this.normalizeArabic(rawText).toLowerCase();

    // Map to track frequency of matches for ranking
    const matchesMap = new Map<string, number>();

    for (const kw of COMMON_SKILLS_KEYWORDS) {
      const lowerKw = kw.toLowerCase();
      const isArabic = /[\u0600-\u06FF]/.test(kw);

      if (isArabic) {
        const normKw = this.normalizeArabic(lowerKw);
        const occurrences = (normalizedArText.match(new RegExp(normKw, 'g')) || []).length;
        if (occurrences > 0) {
          matchesMap.set(kw, occurrences);
        }
      } else {
        // Use word boundary check for English keywords to avoid false positives (e.g. 'Go' in 'Algorithm')
        const escaped = lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        const occurrences = (lowerText.match(regex) || []).length;
        if (occurrences > 0) {
          matchesMap.set(kw, occurrences);
        }
      }
    }

    // Sort by frequency (highest occurrences first)
    const sortedKeywords = Array.from(matchesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([kw]) => kw);

    // If matches are sparse (< 4), extract significant non-stop capitalized/long words
    if (sortedKeywords.length < 5) {
      const tokens = jobDescription
        .split(/[\s,.;:!?()\[\]{}"'\\\/]+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 4);

      for (const token of tokens) {
        const lowerToken = token.toLowerCase();
        const isAr = /[\u0600-\u06FF]/.test(token);

        if (isAr) {
          if (!STOP_WORDS_AR.has(token) && !sortedKeywords.includes(token)) {
            sortedKeywords.push(token);
          }
        } else {
          if (!STOP_WORDS_EN.has(lowerToken) && !sortedKeywords.some((k) => k.toLowerCase() === lowerToken)) {
            // Capitalized word or tech token
            if (/^[A-Z][a-zA-Z0-9+#.-]*$/.test(token) || token.length >= 6) {
              sortedKeywords.push(token);
            }
          }
        }

        if (sortedKeywords.length >= limit) break;
      }
    }

    return sortedKeywords.slice(0, limit);
  }

  /**
   * Helper to detect if a host is local/private to prevent SSRF vulnerabilities
   */
  static isPrivateOrBlockedHost(hostname: string): boolean {
    const host = hostname.toLowerCase().trim();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host.endsWith('.lan') ||
      host === '169.254.169.254' ||
      host === 'metadata.google.internal'
    ) {
      return true;
    }

    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = host.match(ipv4Regex);
    if (match) {
      const octet1 = parseInt(match[1], 10);
      const octet2 = parseInt(match[2], 10);
      if (octet1 === 10) return true;
      if (octet1 === 127) return true;
      if (octet1 === 192 && octet2 === 168) return true;
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
      if (octet1 === 169 && octet2 === 254) return true;
    }
    return false;
  }

  /**
   * Fetch and extract clean plain text from a public job posting URL
   */
  static async fetchJobDescriptionFromUrl(urlStr: string): Promise<string> {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlStr);
    } catch {
      throw new Error('رابط الوظيفة غير صالح. يرجى التأكد من كتابة الرابط بشكل صحيح (URL is invalid).');
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('البروتوكول غير مدعوم. يجب أن يبدأ الرابط بـ http أو https.');
    }

    const lowerHost = parsedUrl.hostname.toLowerCase();
    if (
      lowerHost.includes('linkedin.com') ||
      lowerHost.includes('indeed.com') ||
      lowerHost.includes('glassdoor.com')
    ) {
      throw new Error(
        'This job board (e.g. LinkedIn/Indeed) restricts automated scraping or requires authentication. Please copy the job description and paste it directly into the form.'
      );
    }

    if (this.isPrivateOrBlockedHost(parsedUrl.hostname)) {
      throw new Error('The provided URL is not allowed for security reasons.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JobMatchBot/1.0',
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 429 || response.status === 999) {
          throw new Error(
            'This website restricts automated fetching or requires a user login. Please copy and paste the job description text directly into the form.'
          );
        }
        throw new Error(`Failed to fetch job description (HTTP ${response.status}). Please paste the job description text directly.`);
      }

      // Enforce 2MB size limit to prevent resource exhaustion
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > 2 * 1024 * 1024) {
        throw new Error('The target web page exceeds the 2MB limit. Please copy and paste the job description text directly.');
      }

      const html = await response.text();
      const text = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
        .replace(/<(?:br|\/p|\/div|\/li|\/h1|\/h2|\/h3|\/h4)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();

      if (!text || text.length < 50) {
        throw new Error('لم يتم العثور على محتوى نصي كافٍ في الصفحة. يرجى نسخ ولصق الوصف الوظيفي مباشرة.');
      }

      return text.slice(0, 15000);
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') {
        throw new Error('انتهت مهلة جلب الرابط (Timeout). يرجى لصق الوصف الوظيفي يدوياً.');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Detect language (Arabic vs English) from text
   */
  static detectLanguage(text: string): CoverLetterLanguage {
    if (!text) return 'ar';
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
    return arabicChars > latinChars ? 'ar' : 'en';
  }

  /**
   * Clean and normalize text for pristine display, inline editing, and PDF printing.
   * Strips invisible unicode control chars, collapses excessive empty lines,
   * normalizes spaces, and unescapes HTML entities for crisp rendering.
   */
  static cleanDisplayText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Strip zero-width / invisible control characters
      .replace(/[\u200B-\u200D\uFEFF\u2060\u00A0]/g, ' ')
      // Unescape HTML entities for raw rendering in editor and prints
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // Normalize multiple horizontal spaces to single space
      .replace(/[ \t]{2,}/g, ' ')
      // Collapse 3 or more consecutive newlines to maximum 2
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Check if text contains binary or garbled bytes (e.g. unparsed docx zip bytes or corrupt file)
   */
  static isGarbledOrBinaryText(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    // Check for null bytes or zip signature PK\x03\x04
    if (text.includes('\0') || text.startsWith('PK\x03\x04')) return true;
    // Check ratio of control chars (excluding newline, cr, tab)
    const controlChars = (text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
    return (controlChars / Math.max(text.length, 1)) > 0.05;
  }

  /**
   * Validate generate request payload contract with strict logical boundaries
   */
  static validateRequest(body: any): { valid: boolean; error?: string } {
    if (!body || typeof body !== 'object') {
      return { valid: false, error: 'Request body is required' };
    }

    const hasDescription = typeof body.jobDescription === 'string' && body.jobDescription.trim().length > 0;
    const hasUrl = typeof body.jobUrl === 'string' && body.jobUrl.trim().length > 0;

    if (!hasDescription && !hasUrl) {
      return {
        valid: false,
        error: 'الوصف الوظيفي أو رابط الوظيفة مطلوب (Job description text or job URL is required)',
      };
    }

    if (hasDescription) {
      const descTrimmed = body.jobDescription.trim();
      if (descTrimmed.length < 25) {
        return { valid: false, error: 'الوصف الوظيفي قصير جداً (25 حرف على الأقل مطلوب)' };
      }
      if (body.jobDescription.length > 35000) {
        return { valid: false, error: 'الوصف الوظيفي يتجاوز الحد الأقصى المسموح (35,000 حرف)' };
      }
    }

    if (hasUrl) {
      try {
        const u = new URL(body.jobUrl.trim());
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          return { valid: false, error: 'يجب أن يبدأ رابط الوظيفة بـ http:// أو https://' };
        }
      } catch {
        return { valid: false, error: 'صيغة رابط الوظيفة غير صحيحة' };
      }
    }

    if (body.companyName && typeof body.companyName === 'string') {
      const trimmed = body.companyName.trim();
      if (trimmed.length > 120) {
        return { valid: false, error: 'اسم الشركة لا يمكن أن يتجاوز 120 حرفاً' };
      }
    }

    if (body.jobTitle && typeof body.jobTitle === 'string') {
      const trimmed = body.jobTitle.trim();
      if (trimmed.length > 120) {
        return { valid: false, error: 'المسمى الوظيفي لا يمكن أن يتجاوز 120 حرفاً' };
      }
    }

    if (body.hiringManager && typeof body.hiringManager === 'string') {
      const trimmed = body.hiringManager.trim();
      if (trimmed.length > 120) {
        return { valid: false, error: 'اسم مسؤول التوظيف لا يمكن أن يتجاوز 120 حرفاً' };
      }
    }

    if (body.customNotes && typeof body.customNotes === 'string') {
      if (body.customNotes.trim().length > 500) {
        return { valid: false, error: 'الملاحظات الإضافية لا يمكن أن تتجاوز 500 حرف' };
      }
    }

    const validTones: CoverLetterTone[] = ['formal', 'technical', 'leadership', 'enthusiastic'];
    if (body.tone && !validTones.includes(body.tone)) {
      return { valid: false, error: 'نبرة الخطاب المحددة غير صالحة (Invalid tone specified)' };
    }

    const validLangs: CoverLetterLanguage[] = ['ar', 'en', 'fr', 'de', 'es', 'tr'];
    if (body.language && !validLangs.includes(body.language)) {
      return { valid: false, error: 'اللغة المحددة غير صالحة (Invalid language specified)' };
    }

    const validTemplates = ['compact', 'modern', 'classic', 'ats-friendly'];
    if (body.templateId && !validTemplates.includes(body.templateId)) {
      return { valid: false, error: 'معرّف القالب المحدد غير صالح' };
    }

    if (body.sender?.fullName && typeof body.sender.fullName === 'string') {
      if (body.sender.fullName.trim().length > 100) {
        return { valid: false, error: 'اسم مقدم الطلب لا يمكن أن يتجاوز 100 حرف' };
      }
    }

    if (body.sender?.email && typeof body.sender.email === 'string' && body.sender.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.sender.email.trim())) {
        return { valid: false, error: 'صيغة البريد الإلكتروني لمقدم الطلب غير صحيحة' };
      }
    }

    if (body.sender?.phone && typeof body.sender.phone === 'string' && body.sender.phone.trim()) {
      const phoneClean = body.sender.phone.trim();
      if (phoneClean.length > 40 || !/^[0-9+()\-.\s]{5,40}$/.test(phoneClean)) {
        return { valid: false, error: 'صيغة رقم الهاتف غير صالحة (يجب أن يحتوي على أرقام ورموز اتصال صحيحة)' };
      }
    }

    return { valid: true };
  }

  /**
   * Validate cover letter save/create payload with strict logical boundary checks
   */
  static validateSavePayload(body: any): { valid: boolean; error?: string } {
    if (!body || typeof body !== 'object') {
      return { valid: false, error: 'بيانات الخطاب مطلوبة (Payload is required)' };
    }

    if (!body.content || typeof body.content !== 'object') {
      return { valid: false, error: 'محتوى الخطاب مطلوب (Cover letter content object is required)' };
    }

    const hasFullText = typeof body.content.fullText === 'string' && body.content.fullText.trim().length > 0;
    const hasParagraphs = Array.isArray(body.content.bodyParagraphs) && body.content.bodyParagraphs.length > 0;

    if (!hasFullText && !hasParagraphs) {
      return { valid: false, error: 'نص الخطاب أو فقراته مطلوبة (Cover letter text is required)' };
    }

    if (body.title && typeof body.title === 'string' && body.title.length > 150) {
      return { valid: false, error: 'عنوان الخطاب لا يمكن أن يتجاوز 150 حرفاً' };
    }

    const company = body.companyName || body.recipient?.companyName;
    if (company && typeof company === 'string' && company.length > 120) {
      return { valid: false, error: 'اسم الشركة لا يمكن أن يتجاوز 120 حرفاً' };
    }

    const job = body.jobTitle || body.recipient?.jobTitle;
    if (job && typeof job === 'string' && job.length > 120) {
      return { valid: false, error: 'المسمى الوظيفي لا يمكن أن يتجاوز 120 حرفاً' };
    }

    const hiringMgr = body.hiringManager || body.recipient?.hiringManager;
    if (hiringMgr && typeof hiringMgr === 'string' && hiringMgr.length > 120) {
      return { valid: false, error: 'اسم مسؤول التوظيف لا يمكن أن يتجاوز 120 حرفاً' };
    }

    if (body.status && !['draft', 'saved', 'archived'].includes(body.status)) {
      return { valid: false, error: 'حالة الخطاب غير صالحة (status must be draft, saved, or archived)' };
    }

    const validTones: CoverLetterTone[] = ['formal', 'technical', 'leadership', 'enthusiastic'];
    if (body.tone && !validTones.includes(body.tone)) {
      return { valid: false, error: 'نبرة الخطاب المحددة غير صالحة' };
    }

    const validLangs: CoverLetterLanguage[] = ['ar', 'en'];
    if (body.language && !validLangs.includes(body.language)) {
      return { valid: false, error: 'اللغة المحددة غير صالحة' };
    }

    const validTemplates = ['compact', 'modern', 'classic', 'ats-friendly'];
    if (body.templateId && !validTemplates.includes(body.templateId)) {
      return { valid: false, error: 'معرّف القالب المحدد غير صالح' };
    }

    if (body.sender?.fullName && typeof body.sender.fullName === 'string' && body.sender.fullName.trim().length > 100) {
      return { valid: false, error: 'اسم مقدم الطلب لا يمكن أن يتجاوز 100 حرف' };
    }

    if (body.sender?.email && typeof body.sender.email === 'string' && body.sender.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.sender.email.trim())) {
        return { valid: false, error: 'صيغة البريد الإلكتروني لمقدم الطلب غير صحيحة' };
      }
    }

    if (body.sender?.phone && typeof body.sender.phone === 'string' && body.sender.phone.trim()) {
      const phoneClean = body.sender.phone.trim();
      if (phoneClean.length > 40 || !/^[0-9+()\-.\s]{5,40}$/.test(phoneClean)) {
        return { valid: false, error: 'صيغة رقم الهاتف غير صالحة' };
      }
    }

    return { valid: true };
  }

  /**
   * Core generator synthesizing the tailored cover letter based on tone, language,
   * candidate's resume match, extracted keywords, and company requirements.
   */
  static generateCoverLetter(
    req: GenerateCoverLetterRequest,
    resumeData?: any
  ): CoverLetterData {
    const lang = (req.language || 'en') as CoverLetterLanguage;
    const isAr = lang === 'ar';
    const isFr = lang === 'fr';
    const isDe = lang === 'de';
    const isEs = lang === 'es';
    const isTr = lang === 'tr';
    const tone = req.tone || 'formal';

    // 1. Recipient Details with graceful fallbacks
    const companyName = req.companyName?.trim() || (isAr ? 'الشركة الموقرة' : 'Your Company');
    const jobTitle = req.jobTitle?.trim() || (isAr ? 'الوظيفة المطروحة' : 'the Position');
    const hiringManager = req.hiringManager?.trim() || (isAr ? 'فريق الموارد البشرية المحترم' : 'Hiring Manager');

    // 2. Extract job keywords
    const keywords = this.extractKeywords(req.jobDescription || '', 8);
    const keywordsListString = keywords.slice(0, 4).join(isAr ? '، و' : ', ');

    // 3. Extract candidate details from request or resumeData
    const candidateName =
      req.sender?.fullName?.trim() ||
      resumeData?.data?.personalInfo?.fullName ||
      (isAr ? 'المتقدم للوظيفة' : 'Applicant');

    const candidateEmail =
      req.sender?.email?.trim() ||
      resumeData?.data?.personalInfo?.email ||
      '';

    const candidatePhone =
      req.sender?.phone?.trim() ||
      resumeData?.data?.personalInfo?.phone ||
      '';

    const candidateRole =
      resumeData?.data?.personalInfo?.jobTitle ||
      (isAr ? 'محترف متخصص' : 'Professional');

    // 4. Cross-match candidate's resume skills with job keywords
    const candidateRawSkills: string[] = [];
    if (Array.isArray(resumeData?.data?.skills)) {
      for (const s of resumeData.data.skills) {
        if (typeof s === 'string') candidateRawSkills.push(s);
        else if (s && typeof s === 'object' && s.name) candidateRawSkills.push(s.name);
      }
    }

    // Find intersection: skills that the candidate has which are also in the job requirements
    const matchedSkills = candidateRawSkills.filter((s) =>
      keywords.some((k) => k.toLowerCase() === s.toLowerCase() || s.toLowerCase().includes(k.toLowerCase()))
    );
    const matchedSkillsString = matchedSkills.slice(0, 3).join(isAr ? '، و' : ', ');

    // 5. Tailor past experience from resume if available
    let pastCompanyHighlight = '';
    if (Array.isArray(resumeData?.data?.experience) && resumeData.data.experience.length > 0) {
      const topExp = resumeData.data.experience[0];
      const role = topExp.position || topExp.title || '';
      const comp = topExp.company || '';

      if (role && comp) {
        if (isAr) {
          pastCompanyHighlight = `من خلال خبرتي كـ (${role}) لدى (${comp})، `;
        } else {
          pastCompanyHighlight = `In my role as ${role} at ${comp}, `;
        }
      } else if (role) {
        if (isAr) {
          pastCompanyHighlight = `انطلاقاً من خبرتي العملية كـ (${role})، `;
        } else {
          pastCompanyHighlight = `Drawing from my hands-on background as ${role}, `;
        }
      }
    }

    // 6. Handle custom notes if provided by user
    let customNoteSentence = '';
    if (req.customNotes && req.customNotes.trim()) {
      const cleanNote = req.customNotes.trim();
      if (isAr) {
        customNoteSentence = ` كما أود الإشارة بشكل خاص إلى: ${cleanNote}.`;
      } else {
        customNoteSentence = ` I would also particularly like to highlight: ${cleanNote}.`;
      }
    }

    // 7. Salutation & Subject
    let salutation = `Dear ${hiringManager},`;
    let subject = `Application for ${jobTitle} Role - ${candidateName}`;
    let signOffPhrase = 'Sincerely,';

    if (isAr) {
      salutation = `عناية ${hiringManager}،`;
      subject = `طلب التقديم لشغل وظيفة: ${jobTitle} - ${candidateName}`;
      signOffPhrase = 'وتفضلوا بقبول فائق الاحترام والتقدير،';
    } else if (isFr) {
      salutation = req.hiringManager?.trim() ? `À l'attention de ${hiringManager},` : 'Madame, Monsieur,';
      subject = `Candidature au poste de : ${jobTitle} - ${candidateName}`;
      signOffPhrase = "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées,";
    } else if (isDe) {
      salutation = req.hiringManager?.trim() ? `Sehr geehrte(r) ${hiringManager},` : 'Sehr geehrte Damen und Herren,';
      subject = `Bewerbung als ${jobTitle} - ${candidateName}`;
      signOffPhrase = 'Mit freundlichen Grüßen,';
    } else if (isEs) {
      salutation = req.hiringManager?.trim() ? `Estimado/a ${hiringManager}:` : 'Estimado/a responsable de selección:';
      subject = `Candidatura para el puesto de: ${jobTitle} - ${candidateName}`;
      signOffPhrase = 'Atentamente,';
    } else if (isTr) {
      salutation = req.hiringManager?.trim() ? `Sayın ${hiringManager},` : 'Sayın Yetkili,';
      subject = `${jobTitle} Pozisyonu Başvurusu - ${candidateName}`;
      signOffPhrase = 'Saygılarımla,';
    }

    // 8. Intro & Body composition according to Tone
    let intro = '';
    let body1 = '';
    let body2 = '';
    let conclusion = '';

    const skillHighlight = matchedSkillsString
      ? (isAr ? ` وخاصة في مجالات (${matchedSkillsString})` : `, notably in ${matchedSkillsString}`)
      : (keywordsListString ? (isAr ? ` مع التركيز على (${keywordsListString})` : `, specifically within ${keywordsListString}`) : '');

    if (isAr) {
      // ARABIC GENERATION PER TONE
      switch (tone) {
        case 'technical':
          intro = `يسعدني التقدم بطلبي لشغل وظيفة "${jobTitle}" لدى مؤسستكم الرائدة "${companyName}". انطلاقاً من شغفي بالحلول الهندسية المتطورة والأنظمة القابلة للتوسع، فإنني على ثقة بأن خلفيتي التقنية وخبراتي ستسهم مباشرة في دفع مشاريعكم للأمام.`;
          body1 = `${pastCompanyHighlight}ركزت بشكل مكثف على توظيف أفضل المعايير التقنية وممارسات هندسة البرمجيات الحديثة${skillHighlight}. وقد نجحت في تحسين الأداء العام وحل التحديات المعمارية المعقدة ورفع موثوقية الأنظمة بنسب قابلة للقياس.${customNoteSentence}`;
          body2 = `ما يميز اهتمامي بالانضمام إلى فريق عملكم هو التزام "${companyName}" المستمر بالابتكار والتميز الهندسي. أتطلع لتطبيق خبراتي في معالجة متطلباتكم الحالية وبناء أدوات متينة تحقق أهداف المؤسسة بكفاءة وموثوقية عالية.`;
          break;
        case 'leadership':
          intro = `أكتب إليكم للتعبير عن اهتمامي البالغ بشغل منصب "${jobTitle}" في "${companyName}". أمتلك سجلاً حافلاً بالنجاحات في قيادة المبادرات الاستراتيجية، وبناء وتوجيه فرق العمل متعددة التخصصات لتحقيق أعلى العوائد التشغيلية.`;
          body1 = `${pastCompanyHighlight}توليت مسؤولية توجيه المشروعات من مرحلة التخطيط الاستراتيجي وحتى التسليم النهائي، محققاً نمواً ملموساً في كفاءة الإنجاز وجودة المخرجات${skillHighlight}. أؤمن بأن القيادة المؤثرة ترتكز على تمكين الأفراد ومواءمة جهود الفريق مع الرؤية العامة للشركة.${customNoteSentence}`;
          body2 = `إن السمعة المرموقة التي تحظى بها "${companyName}" والنمو المستمر الذي تقودونه يمثلان البيئة المثالية التي أطمح لتوظيف مهاراتي القيادية فيها لتحقيق مستهدفات المرحلة القادمة وتجاوز مؤشرات الأداء المتوقعة.`;
          break;
        case 'enthusiastic':
          intro = `يسرني بكل حماس وشغف أن أقدم أوراق اعتمادي لوظيفة "${jobTitle}" لدى "${companyName}". أتابع باهتمام بالغ مسار تطوركم وابتكاراتكم المتميزة في السوق، وأشعر بحافز استثنائي لفرصة المساهمة في هذه الرحلة الملهمة.`;
          body1 = `${pastCompanyHighlight}اكتسبت طاقة دافعة للتعلم السريع والابتكار والتكيف الاستباقي مع متطلبات السوق المتسارعة${skillHighlight}. لطالما كان هدفي تقديم قيمة مضافة تتجاوز التوقعات وإشعال روح الإيجابية والتعاون المثمر في بيئة العمل.${customNoteSentence}`;
          body2 = `أرى في "${companyName}" المكان المثالي الذي يلتقي فيه شغفي وطموحي مع رؤيتكم المتطلعة للمستقبل. إنني على أتم استعداد لبذل أقصى جهد لنكون شركاء في تحقيق المزيد من النجاحات الباهرة معاً.`;
          break;
        case 'formal':
        default:
          intro = `يشرفني ويسرني أن أتقدم بطلبي لشغل وظيفة "${jobTitle}" لدى مؤسستكم الموقرة "${companyName}". بعد الاطلاع الدقيق على متطلبات الوظيفة واشتراطاتها المعلنة، أجد في خلفيتي المهنية وتطلعاتي توافقاً وثيقاً مع ما تبحثون عنه.`;
          body1 = `${pastCompanyHighlight}قمت بإنجاز مهام ومسؤوليات رئيسية أسهمت في تعزيز الكفاءة التشغيلية والارتقاء بجودة النتائج${skillHighlight}. وأحرص دائماً على الالتزام بأرفع معايير الاحترافية والمسؤولية والانضباط في بيئة العمل.${customNoteSentence}`;
          body2 = `إن العمل تحت مظلة "${companyName}" يمثل فرصة استثنائية أعتز بها، وأتطلع لأن أكون إضافة حقيقية لفريق عملكم تسهم في ترجمة تطلعات المؤسسة إلى إنجازات واقعية ومستدامة.`;
          break;
      }
      conclusion = `أرحب بفرصة التحدث معكم في مقابلة شخصية لمناقشة مؤهلاتي بتفصيل أوفى، وكيف يمكن لخبراتي أن تسهم في خدمة أهدافكم. أشكركم جزيل الشكر على كريم وقتكم واهتمامكم بمراجعة طلبي.`;
    } else if (isFr) {
      // FRENCH GENERATION
      intro = `Je vous adresse par la présente ma candidature pour le poste de ${jobTitle} au sein de ${companyName}. Vivement intéressé(e) par vos réalisations et votre positionnement sur le marché, je suis convaincu(e) que mes compétences et mon parcours correspondent aux exigences de cette fonction.`;
      body1 = `Fort(e) de mes expériences professionnelles antérieures${skillHighlight}, j'ai développé une solide maîtrise opérationnelle et une rigueur constante dans la conduite de projets d'envergure. J'ai mené à bien des initiatives structurantes alliant efficacité et recherche d'excellence.${customNoteSentence}`;
      body2 = `Rejoindre ${companyName} représente pour moi l'opportunité de mobiliser mon savoir-faire au service de vos ambitions et de contribuer activement à vos futurs succès d'équipe.`;
      conclusion = `Je me tiens à votre entière disposition pour un entretien afin de vous exposer de vive voix mes motivations et les atouts de ma candidature. En vous remerciant de l'attention que vous porterez à mon dossier.`;
    } else if (isDe) {
      // GERMAN GENERATION
      intro = `mit großem Interesse bewerbe ich mich um die von Ihnen ausgeschriebene Position als ${jobTitle} bei ${companyName}. Ihr renommiertes Unternehmen und Ihre innovativen Projekte entsprechen vollumfänglich meinen beruflichen Zielen und Qualifikationen.`;
      body1 = `Aufgrund meiner bisherigen beruflichen Erfahrungen${skillHighlight} verfüge ich über fundierte Fachkenntnisse und eine strukturierte, lösungsorientierte Arbeitsweise. Ich habe komplexe Aufgabenbereiche erfolgreich geleitet und messbare Resultate erzielt.${customNoteSentence}`;
      body2 = `Die Unternehmenskultur und die strategische Ausrichtung von ${companyName} bieten ein erstklassiges Umfeld, in das ich meine Leistungsbereitschaft und Fachkompetenz gewinnbringend einbringen möchte.`;
      conclusion = `Über eine Einladung zu einem persönlichen Gespräch freue ich mich sehr. Für Ihre Zeit und die wohlwollende Prüfung meiner Unterlagen danke ich Ihnen herzlich.`;
    } else if (isEs) {
      // SPANISH GENERATION
      intro = `Por medio de la presente, tengo el agrado de presentar mi postulación para el puesto de ${jobTitle} en ${companyName}. Tras analizar con atención los requerimientos de la posición, considero que mi trayectoria y competencias se alinean estrechamente con sus objetivos.`;
      body1 = `A lo largo de mi carrera profesional${skillHighlight}, he consolidado una amplia experiencia en la entrega de proyectos clave y la optimización de procesos operativos. Me caracterizo por un enfoque analítico, proactivo y orientado al logro de resultados medibles.${customNoteSentence}`;
      body2 = `Formar parte de ${companyName} representa una valiosa oportunidad profesional donde deseo volcar mi dedicación y conocimientos para seguir impulsando el crecimiento y la excelencia de su equipo.`;
      conclusion = `Agradezco de antemano el tiempo dedicado a revisar mi solicitud y quedo a su total disposición para concertar una entrevista personal en la que profundizar en mi experiencia.`;
    } else if (isTr) {
      // TURKISH GENERATION
      intro = `${companyName} bünyesinde açık bulunan ${jobTitle} pozisyonu için başvurumu sunmaktan büyük memnuniyet duyuyorum. Şirketinizin sektördeki yenilikçi vizyonu ve başarıları, yetkinliklerim ve kariyer hedeflerim ile birebir örtüşmektedir.`;
      body1 = `Mesleki deneyimlerim doğrultusunda${skillHighlight}, sistemli çalışma prensibi ve analitik düşünme yapısıyla kritik projeleri başarıyla tamamladım. Operasyonel verimliliği artırma ve kalite standartlarını yükseltme konularında somut katkılar sağladım.${customNoteSentence}`;
      body2 = `${companyName} ekibine katılmak, teknik ve profesyonel birikimimi kurumsal hedefleriniz doğrultusunda değerlendirmek ve birlikte yeni başarılara imza atmak için mükemmel bir fırsattır.`;
      conclusion = `Niteliklerimi ve şirketinize sağlayabileceğim katma değeri detaylı olarak aktarabilmem için uygun göreceğiniz bir tarihte görüşmeyi arzu ederim. Başvuruma ayırdığınız değerli zaman için teşekkür ederim.`;
    } else {
      // ENGLISH GENERATION PER TONE
      switch (tone) {
        case 'technical':
          intro = `I am writing to submit my application for the ${jobTitle} role at ${companyName}. With a strong background in scalable engineering, robust architectural design, and modern best practices, I am eager to contribute directly to your team's technical roadmap.`;
          body1 = `${pastCompanyHighlight}I have focused on delivering clean, maintainable systems and implementing modern engineering standards${skillHighlight}. My experience encompasses optimizing performance bottlenecks, streamlining workflows, and architecting resilient solutions that scale efficiently.${customNoteSentence}`;
          body2 = `I have great admiration for the technical rigor and forward-thinking engineering culture cultivated at ${companyName}. I look forward to bringing my problem-solving mindset to your core technical challenges and driving measurable business value.`;
          break;
        case 'leadership':
          intro = `I am pleased to present my application for the ${jobTitle} position at ${companyName}. I bring a track record of orchestrating cross-functional initiatives, cultivating high-performing teams, and aligning operational velocity with strategic objectives.`;
          body1 = `${pastCompanyHighlight}I have steered mission-critical projects from early scoping through seamless execution${skillHighlight}. My leadership philosophy focuses on empowering individual contributors, fostering transparent communication, and driving accountability to consistently surpass KPI targets.${customNoteSentence}`;
          body2 = `${companyName}'s strategic market presence and vision resonate deeply with my professional values. I welcome the opportunity to partner with your leadership to scale operations and accelerate your organizational goals.`;
          break;
        case 'enthusiastic':
          intro = `I am thrilled to apply for the ${jobTitle} role at ${companyName}! Having followed your impressive innovations and dynamic impact, I would love nothing more than to bring my passion, energy, and commitment to your talented team.`;
          body1 = `${pastCompanyHighlight}I have embraced challenges with rapid adaptability, a relentless curiosity for learning, and a proactive problem-solving mindset${skillHighlight}. I thrive in collaborative environments where exceeding expectations and delivering impactful user experiences are the standard.${customNoteSentence}`;
          body2 = `Joining ${companyName} represents an inspiring opportunity to contribute to a mission I genuinely believe in. I am excited to bring my dedication to your team and make an immediate, positive impact from day one.`;
          break;
        case 'formal':
        default:
          intro = `I am writing to formally submit my candidacy for the ${jobTitle} position currently open at ${companyName}. Given my professional background, dedicated work ethic, and relevant competencies, I am confident in my ability to add significant value to your organization.`;
          body1 = `${pastCompanyHighlight}I have consistently delivered high-quality outcomes across diverse responsibilities${skillHighlight}. Throughout my career, I have prioritized rigorous professional standards, meticulous attention to detail, and constructive collaboration.${customNoteSentence}`;
          body2 = `The esteemed reputation and dedication to excellence upheld by ${companyName} make this opportunity particularly compelling. I look forward to the possibility of contributing my background toward supporting your overarching mission.`;
          break;
      }
      conclusion = `I would welcome the opportunity to discuss my qualifications with you during an interview. Thank you very much for your time, consideration, and review of my application.`;
    }

    // 9. Clean Sign Off Block
    const contactParts = [candidateEmail, candidatePhone].filter(Boolean);
    const contactLine = contactParts.length > 0 ? contactParts.join(' | ') : '';
    const signOff = `${signOffPhrase}\n\n${candidateName}${candidateRole ? '\n' + candidateRole : ''}${contactLine ? '\n' + contactLine : ''}`.trim();

    // 10. Combine full text cleanly
    const fullText = `${salutation}\n\n${intro}\n\n${body1}\n\n${body2}\n\n${conclusion}\n\n${signOff}`;

    // 11. Inherit or set matching resume template
    const templateId = req.templateId || resumeData?.templateId || 'compact';

    return {
      title: isAr ? `خطاب تقديم - ${companyName}` : `Cover Letter - ${companyName}`,
      sender: {
        fullName: candidateName,
        email: candidateEmail,
        phone: candidatePhone,
      },
      recipient: {
        companyName,
        jobTitle,
        hiringManager,
      },
      jobDescription: req.jobDescription || '',
      extractedKeywords: keywords,
      tone,
      language: req.language,
      templateId,
      linkedResumeId: req.resumeId,
      content: {
        subject,
        salutation,
        introduction: intro,
        bodyParagraphs: [body1, body2],
        conclusion,
        signOff,
        fullText,
      },
    };
  }
}
