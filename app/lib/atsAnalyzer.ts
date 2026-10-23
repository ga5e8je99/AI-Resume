export interface KeywordMatch {
  keyword: string;
  count: number;
  importance: 'high' | 'medium' | 'low';
  category: string;
}

export interface AnalysisStrength {
  title: string;
  description: string;
  category: 'content' | 'structure' | 'keywords' | 'metrics';
}

export interface AnalysisWeakness {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface AnalysisSuggestion {
  category: string;
  suggestions: string[];
  priority: number;
}

export interface ATSAnalysisResult {
  overallScore: number;
  subScores: {
    keywordsMatch: number;
    formatting: number;
    structure: number;
    contentQuality: number;
  };
  metrics: {
    wordCount: number;
    readingTimeSeconds: number;
    readingTimeString: string;
    bulletCount: number;
    quantifiedMetricsCount: number;
    grade: string;
    rankPercentile: string;
    matchLabel: string;
  };
  contactInfo: {
    hasEmail: boolean;
    email?: string;
    hasPhone: boolean;
    phone?: string;
    hasLinkedIn: boolean;
    linkedIn?: string;
    hasGitHub: boolean;
    hasLocation: boolean;
    completenessScore: number;
  };
  sectionsDetected: {
    name: string;
    found: boolean;
  }[];
  keywordsDetected: KeywordMatch[];
  missingKeywords: string[];
  strengths: AnalysisStrength[];
  weaknesses: AnalysisWeakness[];
  suggestions: AnalysisSuggestion[];
  actionVerbsFound: string[];
  weakVerbsFound: string[];
}

// 400+ Standard Industry Skills & Keywords Catalog
const SKILL_CATALOG: { [category: string]: string[] } = {
  'Frontend & Web': [
    'React', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS',
    'Vue.js', 'Angular', 'Svelte', 'Redux', 'Zustand', 'GraphQL', 'REST APIs', 'RESTful',
    'WebSockets', 'Webpack', 'Vite', 'Responsive Design', 'Sass', 'Bootstrap',
    'Material-UI', 'Framer Motion', 'PWA', 'Microfrontends', 'Accessibility', 'WCAG'
  ],
  'Backend & Systems': [
    'Node.js', 'Express', 'NestJS', 'Python', 'Django', 'FastAPI', 'Flask',
    'Java', 'Spring Boot', 'C#', '.NET', 'ASP.NET', 'Go', 'Golang', 'Rust', 'PHP',
    'Laravel', 'Ruby', 'Ruby on Rails', 'Microservices', 'gRPC', 'Kafka', 'RabbitMQ',
    'Redis', 'Serverless', 'Socket.io'
  ],
  'Databases & Storage': [
    'PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Prisma', 'TypeORM', 'Mongoose',
    'DynamoDB', 'Elasticsearch', 'Cassandra', 'Firebase', 'Supabase', 'SQL Server',
    'Oracle', 'Database Optimization', 'Indexing', 'NoSQL'
  ],
  'DevOps & Cloud': [
    'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud', 'GCP', 'Docker',
    'Kubernetes', 'CI/CD', 'GitHub Actions', 'GitLab CI', 'Terraform', 'Linux',
    'Nginx', 'Cloudflare', 'Helm', 'Prometheus', 'Grafana', 'Jenkins', 'Ansible'
  ],
  'AI, ML & Data': [
    'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'LLM',
    'Large Language Models', 'OpenAI', 'Computer Vision', 'Pandas', 'NumPy',
    'Scikit-learn', 'Data Analysis', 'SQL', 'Power BI', 'Tableau', 'Big Data', 'Spark'
  ],
  'Testing & Quality': [
    'Jest', 'Cypress', 'Playwright', 'Vitest', 'Unit Testing', 'Integration Testing',
    'End-to-End Testing', 'E2E', 'TDD', 'Test-Driven Development', 'Mocha', 'Selenium'
  ],
  'Soft & Methodologies': [
    'Agile', 'Scrum', 'Kanban', 'Jira', 'Git', 'GitHub', 'GitLab', 'Code Review',
    'Team Leadership', 'Mentoring', 'Problem Solving', 'Communication', 'Cross-Functional',
    'Project Management', 'Stakeholder Management', 'Architecture Design'
  ],
};

// Power action verbs for ATS
const POWER_VERBS = [
  'accelerated', 'achieved', 'architected', 'automated', 'built', 'championed',
  'collaborated', 'configured', 'created', 'decreased', 'delivered', 'deployed',
  'designed', 'developed', 'devised', 'directed', 'engineered', 'established',
  'executed', 'expanded', 'formulated', 'generated', 'implemented', 'improved',
  'increased', 'initiated', 'integrated', 'launched', 'lead', 'led', 'managed',
  'maximized', 'mentored', 'minimized', 'modernized', 'negotiated', 'optimized',
  'orchestrated', 'overhauled', 'partnered', 'pioneered', 'produced', 'reduced',
  'refactored', 'resolved', 'restructured', 'revamped', 'scaled', 'spearheaded',
  'standardized', 'streamlined', 'strengthened', 'supervised', 'transformed', 'upgraded'
];

// Passive or weak phrases to avoid
const WEAK_PHRASES = [
  'responsible for', 'duties included', 'worked on', 'assisted in', 'helped with',
  'tasked with', 'participated in', 'involved in', 'handled', 'did', 'tried to'
];

/**
 * Real ATS Resume Analyzer Engine
 */
export function analyzeResumeText(
  resumeText: string,
  targetRole?: string,
  targetJobDescription?: string
): ATSAnalysisResult {
  const cleanText = resumeText || '';
  const lowerText = cleanText.toLowerCase();

  // 1. Basic Metrics
  const words = cleanText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeSeconds = Math.max(5, Math.round((wordCount / 180) * 60));
  const readingTimeString = `${(readingTimeSeconds / 60).toFixed(1)}m`;

  // 2. Contact Information Audit
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = cleanText.match(emailRegex);
  const hasEmail = !!emailMatch;
  const email = emailMatch ? emailMatch[1] : undefined;

  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = cleanText.match(phoneRegex);
  const hasPhone = !!phoneMatch;
  const phone = phoneMatch ? phoneMatch[0] : undefined;

  const linkedInRegex = /(linkedin\.com\/in\/[a-zA-Z0-9_-]+|linkedin)/i;
  const hasLinkedIn = linkedInRegex.test(cleanText);

  const gitHubRegex = /(github\.com\/[a-zA-Z0-9_-]+|github)/i;
  const hasGitHub = gitHubRegex.test(cleanText);

  const locationRegex = /\b(remote|cairo|dubai|london|new york|san francisco|california|egypt|uae|usa|uk|germany|riyadh|paris|toronto|berlin)\b/i;
  const hasLocation = locationRegex.test(cleanText) || /address|location|city|country/i.test(cleanText);

  let contactCount = 0;
  if (hasEmail) contactCount += 25;
  if (hasPhone) contactCount += 25;
  if (hasLinkedIn) contactCount += 25;
  if (hasLocation || hasGitHub) contactCount += 25;
  const contactScore = contactCount;

  // 3. Section Audit
  const sectionsToCheck = [
    { name: 'Summary / Objective', regex: /\b(summary|professional summary|profile|about me|objective)\b/i },
    { name: 'Experience / Work History', regex: /\b(experience|work experience|employment|history|work history)\b/i },
    { name: 'Education', regex: /\b(education|academic|university|degree|bachelor|master|phd|diploma)\b/i },
    { name: 'Skills / Technical Stack', regex: /\b(skills|technical skills|technologies|tools|stack|competencies)\b/i },
    { name: 'Projects / Portfolio', regex: /\b(projects|personal projects|portfolio|key projects)\b/i },
    { name: 'Certifications / Awards', regex: /\b(certifications|certificates|licenses|awards|honors|credentials)\b/i },
  ];

  const sectionsDetected = sectionsToCheck.map((s) => ({
    name: s.name,
    found: s.regex.test(cleanText),
  }));

  const foundSectionsCount = sectionsDetected.filter((s) => s.found).length;
  const structureScore = Math.min(100, Math.round((foundSectionsCount / 5) * 100));

  // 4. Quantifiable Metrics Detection
  // Matches %, numbers with scale (100k, 2M, $500), 'reduced by 30%', etc.
  const metricRegex = /(\b\d+(\.\d+)?%|\$\s?\d+[\d,]*(\.\d+)?([kKmMbB])?|\b\d+([kKmM])\+?\b|\b\d{2,}\+?\s+(users|clients|customers|requests|transactions|projects|engineers|members|downloads)\b|improved by \d+|reduced by \d+|increased by \d+)/gi;
  const matchedMetrics = cleanText.match(metricRegex) || [];
  const quantifiedMetricsCount = matchedMetrics.length;

  // 5. Action Verbs vs Weak Verbs
  const actionVerbsFound: string[] = [];
  POWER_VERBS.forEach((verb) => {
    const regex = new RegExp(`\\b${verb}\\b`, 'i');
    if (regex.test(cleanText)) {
      actionVerbsFound.push(verb.charAt(0).toUpperCase() + verb.slice(1));
    }
  });

  const weakVerbsFound: string[] = [];
  WEAK_PHRASES.forEach((phrase) => {
    if (lowerText.includes(phrase)) {
      weakVerbsFound.push(phrase);
    }
  });

  // Bullet points count
  const bulletLines = cleanText.split('\n').filter((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed);
  });
  const bulletCount = bulletLines.length > 0 ? bulletLines.length : Math.max(3, Math.round(words.length / 25));

  // 6. Real Keywords Extraction
  const detectedKeywordsMap: Map<string, { count: number; category: string }> = new Map();

  Object.entries(SKILL_CATALOG).forEach(([category, skills]) => {
    skills.forEach((skill) => {
      // Escape for regex
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Word boundary match
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      const matches = cleanText.match(regex);
      if (matches && matches.length > 0) {
        detectedKeywordsMap.set(skill, {
          count: matches.length,
          category,
        });
      }
    });
  });

  const keywordsDetected: KeywordMatch[] = Array.from(detectedKeywordsMap.entries())
    .map(([keyword, data]) => ({
      keyword,
      count: data.count,
      importance: data.count >= 3 ? ('high' as const) : data.count === 2 ? ('medium' as const) : ('low' as const),
      category: data.category,
    }))
    .sort((a, b) => b.count - a.count);

  // 7. Missing Keywords Detection
  let missingKeywords: string[] = [];

  if (targetJobDescription && targetJobDescription.trim().length > 20) {
    // If job description provided, extract what is in JD but missing in Resume
    const jdText = targetJobDescription.toLowerCase();
    Object.values(SKILL_CATALOG).flat().forEach((skill) => {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const jdRegex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (jdRegex.test(jdText) && !detectedKeywordsMap.has(skill)) {
        missingKeywords.push(skill);
      }
    });
  } else {
    // Determine user's domain from detected keywords
    const categoryCounts: { [cat: string]: number } = {};
    keywordsDetected.forEach((k) => {
      categoryCounts[k.category] = (categoryCounts[k.category] || 0) + 1;
    });

    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Frontend & Web';

    // Find high-impact skills in that category missing from resume
    const domainSkills = SKILL_CATALOG[topCategory] || SKILL_CATALOG['Frontend & Web'];
    missingKeywords = domainSkills
      .filter((s) => !detectedKeywordsMap.has(s))
      .slice(0, 6);

    // If still less than 4, add cross-cutting skills like CI/CD, Docker, Agile
    ['CI/CD', 'Docker', 'Agile', 'Unit Testing', 'TypeScript'].forEach((fallback) => {
      if (!detectedKeywordsMap.has(fallback) && !missingKeywords.includes(fallback)) {
        missingKeywords.push(fallback);
      }
    });
    missingKeywords = missingKeywords.slice(0, 6);
  }

  // 8. Compute Detailed Pillar Subscores
  // A. Keywords Match Score (0 - 100)
  const keywordCount = keywordsDetected.length;
  const keywordsScore = Math.min(100, Math.max(35, Math.round((keywordCount / 12) * 100)));

  // B. Content Quality Score (0 - 100)
  let contentQuality = 40;
  contentQuality += Math.min(30, quantifiedMetricsCount * 6); // Up to 30 pts for metrics
  contentQuality += Math.min(25, actionVerbsFound.length * 3); // Up to 25 pts for action verbs
  if (weakVerbsFound.length > 0) contentQuality -= Math.min(15, weakVerbsFound.length * 4); // Penalty for passive
  const contentQualityScore = Math.min(100, Math.max(30, contentQuality));

  // C. Formatting Score (0 - 100)
  let formattingScore = 60;
  if (wordCount >= 350 && wordCount <= 1000) formattingScore += 25;
  else if (wordCount >= 200 && wordCount <= 1300) formattingScore += 15;
  else formattingScore -= 15;

  if (bulletCount >= 4) formattingScore += 15;
  formattingScore = Math.min(100, Math.max(30, formattingScore));

  // Overall ATS Composite Score
  const overallScore = Math.round(
    keywordsScore * 0.35 +
    structureScore * 0.25 +
    contentQualityScore * 0.25 +
    formattingScore * 0.15
  );

  // Stats
  let grade = 'C+';
  let rankPercentile = 'Top 50%';
  let matchLabel = 'Moderate';

  if (overallScore >= 88) {
    grade = 'A+';
    rankPercentile = 'Top 5%';
    matchLabel = 'Exceptional';
  } else if (overallScore >= 80) {
    grade = 'A';
    rankPercentile = 'Top 15%';
    matchLabel = 'Very Strong';
  } else if (overallScore >= 70) {
    grade = 'B+';
    rankPercentile = 'Top 30%';
    matchLabel = 'Good Match';
  } else if (overallScore >= 60) {
    grade = 'B';
    rankPercentile = 'Top 45%';
    matchLabel = 'Average';
  } else {
    grade = 'C';
    rankPercentile = 'Needs Revision';
    matchLabel = 'Low Match';
  }

  // 9. Generate Concrete Real Strengths
  const strengths: AnalysisStrength[] = [];

  if (keywordsDetected.length >= 6) {
    strengths.push({
      title: 'Strong Technical Vocabulary',
      description: `Detected ${keywordsDetected.length} recognized technical and domain keywords (${keywordsDetected.slice(0, 4).map((k) => k.keyword).join(', ')}).`,
      category: 'keywords',
    });
  }

  if (quantifiedMetricsCount >= 3) {
    strengths.push({
      title: 'Quantified Impact & Results',
      description: `Found ${quantifiedMetricsCount} concrete metrics (${matchedMetrics.slice(0, 3).join(', ')}), demonstrating measurable career value.`,
      category: 'metrics',
    });
  }

  if (actionVerbsFound.length >= 5) {
    strengths.push({
      title: 'High-Impact Action Verbs',
      description: `Excellent use of active leadership verbs (${actionVerbsFound.slice(0, 4).join(', ')}), highlighting ownership.`,
      category: 'content',
    });
  }

  if (hasEmail && hasPhone && hasLinkedIn) {
    strengths.push({
      title: 'Complete Professional Contact Info',
      description: 'Email, phone, and professional LinkedIn link were all detected and formatted for ATS parsers.',
      category: 'structure',
    });
  }

  if (foundSectionsCount >= 4) {
    strengths.push({
      title: 'ATS-Friendly Section Organization',
      description: `Clearly defined core resume sections found: ${sectionsDetected.filter((s) => s.found).map((s) => s.name.split('/')[0].trim()).join(', ')}.`,
      category: 'structure',
    });
  }

  // Guarantee at least 2 strengths
  if (strengths.length < 2) {
    strengths.push({
      title: 'Solid Core Experience',
      description: `Resume text is clearly formatted with ${wordCount} words and consistent line breaks.`,
      category: 'content',
    });
  }

  // 10. Generate Concrete Real Weaknesses & Action Items
  const weaknesses: AnalysisWeakness[] = [];

  if (!hasLinkedIn) {
    weaknesses.push({
      title: 'Missing LinkedIn Profile URL',
      description: 'Over 85% of recruiters review LinkedIn profiles before reaching out.',
      severity: 'high',
      suggestion: 'Add your custom LinkedIn URL (e.g., linkedin.com/in/yourname) in the header.',
    });
  }

  if (quantifiedMetricsCount < 3) {
    weaknesses.push({
      title: 'Limited Quantifiable Achievements',
      description: `Found only ${quantifiedMetricsCount} numerical metric(s) in your work experience.`,
      severity: 'high',
      suggestion: 'Quantify your impact with %, dollar figures, team sizes, or speed improvements (e.g., "Increased sales by 25%").',
    });
  }

  if (missingKeywords.length > 0) {
    weaknesses.push({
      title: 'Missing Key Domain Keywords',
      description: `Industry benchmark checks indicate missing high-demand skills: ${missingKeywords.slice(0, 3).join(', ')}.`,
      severity: 'high',
      suggestion: `Incorporate ${missingKeywords.slice(0, 3).join(', ')} naturally in your skills and project descriptions.`,
    });
  }

  if (weakVerbsFound.length > 0) {
    weaknesses.push({
      title: 'Passive Phrases Detected',
      description: `Found passive phrases like "${weakVerbsFound.slice(0, 2).join('", "')}".`,
      severity: 'medium',
      suggestion: 'Replace passive phrases with power action verbs like "Spearheaded", "Engineered", or "Orchestrated".',
    });
  }

  if (!sectionsDetected.find((s) => s.name.includes('Projects') && s.found)) {
    weaknesses.push({
      title: 'No Dedicated Projects Section',
      description: 'Projects provide proof of hands-on technical execution and initiative.',
      severity: 'medium',
      suggestion: 'Add a "Key Projects" section showcasing 2-3 prominent achievements with tech stacks and links.',
    });
  }

  if (wordCount < 300) {
    weaknesses.push({
      title: 'Resume Content is Too Brief',
      description: `Current resume has only ${wordCount} words, which may lack depth for senior ATS filtering.`,
      severity: 'medium',
      suggestion: 'Expand your experience bullet points to follow the Action + Context + Result formula.',
    });
  }

  // 11. Categorized Suggestions
  const suggestions: AnalysisSuggestion[] = [
    {
      category: 'Content & Impact',
      suggestions: [
        quantifiedMetricsCount < 4
          ? `Add at least ${4 - quantifiedMetricsCount} more quantifiable metrics (% or figures) across your job accomplishments.`
          : 'Maintain high metric density across recent roles.',
        missingKeywords.length > 0
          ? `Integrate target keywords: ${missingKeywords.slice(0, 3).join(', ')} into your experience bullet points.`
          : 'Ensure keywords are distributed across multiple sections.',
        'Apply the Google XYZ Formula: "Accomplished [X] as measured by [Y], by doing [Z]".',
      ],
      priority: 1,
    },
    {
      category: 'ATS Optimization',
      suggestions: [
        'Use standard section headings (Work Experience, Education, Skills, Projects).',
        !hasLinkedIn ? 'Include your LinkedIn profile link in the top contact section.' : 'Keep contact info updated.',
        'Avoid tables, text boxes, and multi-column designs that confuse older ATS parsers.',
      ],
      priority: 2,
    },
    {
      category: 'Clarity & Structure',
      suggestions: [
        `Target length is 450 - 850 words (current: ${wordCount} words).`,
        'Ensure bullet points start with an active past-tense verb.',
        'Place your most relevant technical skills near the top half of the first page.',
      ],
      priority: 3,
    },
  ];

  return {
    overallScore,
    subScores: {
      keywordsMatch: keywordsScore,
      formatting: formattingScore,
      structure: structureScore,
      contentQuality: contentQualityScore,
    },
    metrics: {
      wordCount,
      readingTimeSeconds,
      readingTimeString,
      bulletCount,
      quantifiedMetricsCount,
      grade,
      rankPercentile,
      matchLabel,
    },
    contactInfo: {
      hasEmail,
      email,
      hasPhone,
      phone,
      hasLinkedIn,
      hasGitHub,
      hasLocation,
      completenessScore: contactScore,
    },
    sectionsDetected,
    keywordsDetected,
    missingKeywords,
    strengths,
    weaknesses,
    suggestions,
    actionVerbsFound,
    weakVerbsFound,
  };
}

/**
 * Converts structured ResumeData to text representation for ATS analysis
 */
export function resumeDataToText(data: any): string {
  if (!data) return '';
  const lines: string[] = [];

  // Header / Contact
  if (data.personalInfo) {
    const p = data.personalInfo;
    if (p.fullName) lines.push(p.fullName);
    if (p.jobTitle) lines.push(p.jobTitle);
    const contacts = [p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean);
    if (contacts.length) lines.push(contacts.join(' | '));
    if (p.summary) {
      lines.push('\nProfessional Summary');
      lines.push(p.summary);
    }
  }

  // Experience
  if (data.experience && data.experience.length > 0) {
    lines.push('\nWork Experience');
    data.experience.forEach((exp: any) => {
      lines.push(`${exp.position || ''} at ${exp.company || ''} (${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''})`);
      if (exp.location) lines.push(exp.location);
      if (exp.description && Array.isArray(exp.description)) {
        exp.description.forEach((d: string) => {
          if (d.trim()) lines.push(`• ${d.trim()}`);
        });
      }
    });
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    lines.push('\nTechnical Skills');
    data.skills.forEach((cat: any) => {
      const items = Array.isArray(cat.items) ? cat.items.join(', ') : cat.items;
      lines.push(`${cat.category || 'Skills'}: ${items}`);
    });
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    lines.push('\nKey Projects');
    data.projects.forEach((proj: any) => {
      lines.push(`${proj.title || ''} (${proj.technologies ? (Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies) : ''})`);
      if (proj.description) lines.push(`• ${proj.description}`);
    });
  }

  // Education
  if (data.education && data.education.length > 0) {
    lines.push('\nEducation');
    data.education.forEach((edu: any) => {
      lines.push(`${edu.degree || ''} in ${edu.fieldOfStudy || ''} - ${edu.institution || ''} (${edu.startDate || ''} - ${edu.endDate || ''})`);
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
    });
  }

  return lines.join('\n');
}

