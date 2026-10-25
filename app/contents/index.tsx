export interface ResumeFeedbackCategory {
  score: number;
  tips: string[];
}

export interface ResumeFeedback {
  overallScore: number;
  ATS: ResumeFeedbackCategory;
  toneAndStyle: ResumeFeedbackCategory;
  content: ResumeFeedbackCategory;
  structure: ResumeFeedbackCategory;
  skills: ResumeFeedbackCategory;
}

export interface Resume {
  id: string;
  templateId: 'compact' | 'two-column' | 'ats-friendly' | 'modern' | 'oslo';
  companyName: string;
  jobTitle: string;
  imagePath: string;
  badge: string;
  summary: string;
  feedback: ResumeFeedback;
}

export const resumes: Resume[] = [
  {
    id: "1",
    templateId: "compact",
    companyName: "Compact ATS Model",
    jobTitle: "Frontend / Full-Stack Engineer",
    imagePath: "/images/resume_01.png",
    badge: "100% Single-Column ATS",
    summary: "Optimized for Taleo, Workday, and Greenhouse with strict single-column flow and inline contact metadata.",
    feedback: {
      overallScore: 88,
      ATS: { score: 92, tips: ["Standard section headings", "Inline contact metadata"] },
      toneAndStyle: { score: 86, tips: ["Clear action verbs"] },
      content: { score: 88, tips: ["Quantifiable metric points"] },
      structure: { score: 90, tips: ["Reverse chronological flow"] },
      skills: { score: 85, tips: ["Technical skill categorization"] },
    },
  },
  {
    id: "2",
    templateId: "two-column",
    companyName: "Structured Two-Column Model",
    jobTitle: "Cloud & DevOps Architect",
    imagePath: "/images/resume_02.png",
    badge: "Side-by-Side ATS Friendly",
    summary: "Balanced layout with dedicated sidebar for core skills, certifications, and language proficiencies.",
    feedback: {
      overallScore: 82,
      ATS: { score: 84, tips: ["Clear divider flow", "Parseable contact block"] },
      toneAndStyle: { score: 85, tips: ["Executive technical tone"] },
      content: { score: 80, tips: ["Key infrastructure achievements"] },
      structure: { score: 85, tips: ["Distinct sidebar separation"] },
      skills: { score: 88, tips: ["Prominent tool badges"] },
    },
  },
  {
    id: "3",
    templateId: "ats-friendly",
    companyName: "Executive Blue Accent Model",
    jobTitle: "Engineering Manager / Lead",
    imagePath: "/images/resume_03.png",
    badge: "High Density Layout",
    summary: "Subtle corporate blue styling with generous whitespace for senior candidates and multi-year experience.",
    feedback: {
      overallScore: 91,
      ATS: { score: 94, tips: ["Universal standard fonts", "Clean bullet hierarchy"] },
      toneAndStyle: { score: 90, tips: ["Leadership verbs and strategic scope"] },
      content: { score: 92, tips: ["Business impact metrics ($ and %)"] },
      structure: { score: 92, tips: ["Strict ATS compliance"] },
      skills: { score: 89, tips: ["Strategic & technical balance"] },
    },
  },
];