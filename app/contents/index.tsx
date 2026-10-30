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
  templateId: 'compact' | 'two-column' | 'ats-friendly' | 'executive-blue' | 'modern' | 'oslo' | 'classic';
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
    badge: "Single-Column ATS",
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
    templateId: "executive-blue",
    companyName: "Executive Blue Accent Model",
    jobTitle: "Engineering Manager / Lead",
    imagePath: "/images/resume_03.png",
    badge: "Spacious Executive Layout",
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
  {
    id: "4",
    templateId: "modern",
    companyName: "Corporate Financial Model",
    jobTitle: "Financial Accountant / Audit Associate",
    imagePath: "/images/resume_01.png",
    badge: "Financial & Compliance Format",
    summary: "Standard single-column structure highlighting GAAP/IFRS standards, reconciliations, and fiscal reporting metrics.",
    feedback: {
      overallScore: 89,
      ATS: { score: 93, tips: ["Explicit financial compliance terminology", "Clear fiscal milestones"] },
      toneAndStyle: { score: 88, tips: ["Formal institutional tone"] },
      content: { score: 90, tips: ["Auditing and ledger figures"] },
      structure: { score: 91, tips: ["Chronological accounting history"] },
      skills: { score: 86, tips: ["ERP and accounting software tools"] },
    },
  },
  {
    id: "5",
    templateId: "oslo",
    companyName: "Client Services Model",
    jobTitle: "Customer Support & Client Success Specialist",
    imagePath: "/images/resume_02.png",
    badge: "Operations & CSAT Focus",
    summary: "Clean hierarchy focused on customer satisfaction (CSAT/NPS), resolution times, CRM tooling, and ticket volumes.",
    feedback: {
      overallScore: 87,
      ATS: { score: 90, tips: ["Universal ATS font hierarchy", "Zendesk/Salesforce categorization"] },
      toneAndStyle: { score: 87, tips: ["Customer-first empathy and communication metrics"] },
      content: { score: 85, tips: ["Quantifiable retention and resolution percentages"] },
      structure: { score: 89, tips: ["Clean bullet spacing"] },
      skills: { score: 86, tips: ["Omnichannel support systems"] },
    },
  },
  {
    id: "6",
    templateId: "classic",
    companyName: "Quantitative Analyst Model",
    jobTitle: "Data Analyst / Business Intelligence",
    imagePath: "/images/resume_03.png",
    badge: "Analytics & KPI Driven",
    summary: "Engineered for analysts highlighting SQL, data modeling, BI dashboards, and commercial revenue impact.",
    feedback: {
      overallScore: 90,
      ATS: { score: 92, tips: ["Standard data skill tags", "Statistical modeling bullets"] },
      toneAndStyle: { score: 89, tips: ["Data-driven analytical voice"] },
      content: { score: 91, tips: ["Business KPI improvement percentages"] },
      structure: { score: 91, tips: ["Explicit tools and database sections"] },
      skills: { score: 90, tips: ["Python, SQL, Tableau, Power BI balance"] },
    },
  },
  {
    id: "7",
    templateId: "compact",
    companyName: "Growth Marketing Model",
    jobTitle: "Digital Marketing & Growth Specialist",
    imagePath: "/images/resume_01.png",
    badge: "Campaign & ROI Focus",
    summary: "Structured around customer acquisition cost (CAC), return on ad spend (ROAS), and conversion rate optimizations.",
    feedback: {
      overallScore: 88,
      ATS: { score: 90, tips: ["Clean SEO/SEM keyword hierarchy", "Cross-channel campaign metrics"] },
      toneAndStyle: { score: 87, tips: ["Commercial growth and leadership verbs"] },
      content: { score: 89, tips: ["Revenue and conversion metrics ($ and %)"] },
      structure: { score: 89, tips: ["Standard single-column flow"] },
      skills: { score: 87, tips: ["Ad platform and analytics tooling"] },
    },
  },
];