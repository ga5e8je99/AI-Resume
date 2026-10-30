import { ResumeData } from './types';

export const initialSampleData: ResumeData = {
  personalInfo: {
    fullName: "Alex Morgan",
    jobTitle: "Senior Full-Stack Engineer",
    email: "alex.morgan@email.com",
    phone: "+1 (555) 349-2041",
    location: "San Francisco, CA",
    website: "https://alexmorgan.dev",
    linkedin: "linkedin.com/in/alexmorgan",
    github: "github.com/alexmorgan",
    summary: "Results-driven Full-Stack Engineer with 5+ years of experience designing scalable web applications and distributed architectures. Proven expertise in Next.js, React, Node.js, and cloud deployments with a focus on performance optimization and ATS-friendly digital products.",
    photoUrl: "",
    showPhoto: false
  },
  experience: [
    {
      id: "exp-1",
      company: "TechNova Solutions",
      position: "Senior Full-Stack Developer",
      location: "San Francisco, CA",
      startDate: "2023-01",
      endDate: "Present",
      current: true,
      description: [
        "Architected and deployed high-performance SaaS platforms serving 120,000+ active users using Next.js 15, TypeScript, and AWS.",
        "Engineered real-time data pipelines and WebSockets, decreasing latency by 42% and enhancing core metrics.",
        "Mentored a cross-functional team of 6 engineers and streamlined CI/CD pipelines, accelerating sprint velocity by 28%."
      ]
    },
    {
      id: "exp-2",
      company: "Apex Digital Labs",
      position: "Software Engineer",
      location: "San Jose, CA",
      startDate: "2021-03",
      endDate: "2022-12",
      current: false,
      description: [
        "Built responsive client portals with React, Tailwind CSS, and Node.js RESTful APIs with 99.9% uptime.",
        "Refactored legacy databases into optimized MongoDB schemas, cutting query response times by 35%.",
        "Integrated secure Stripe and PayPal payment gateways handling $2M+ in monthly transactions."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      startDate: "2017",
      endDate: "2021",
      gpa: "3.85 / 4.0"
    }
  ],
  projects: [
    {
      id: "proj-1",
      title: "ATS Resume & Career Intelligence Platform",
      techStack: "Next.js, TypeScript, Tailwind CSS, Zustand, PDF.js",
      link: "https://github.com/alexmorgan/ats-resume",
      description: [
        "Developed an AI-assisted resume analyzer with automated ATS keyword matching and PDF generation.",
        "Built interactive live preview system with 4 customizable ATS-compliant templates."
      ]
    },
    {
      id: "proj-2",
      title: "Cloud Event Management & Ticketing Ecosystem",
      techStack: "React, Node.js, Express, MongoDB, Leaflet Maps, JWT",
      link: "https://github.com/alexmorgan/eventy",
      description: [
        "Constructed an end-to-end event discovery and seat reservation platform with geolocation search.",
        "Implemented secure JWT authentication and role-based administrative dashboards."
      ]
    }
  ],
  skills: [
    "JavaScript (ES6+)",
    "TypeScript",
    "React.js",
    "Next.js",
    "Node.js",
    "Express.js",
    "Tailwind CSS",
    "MongoDB",
    "PostgreSQL",
    "RESTful APIs",
    "GraphQL",
    "Docker",
    "Git & GitHub",
    "AWS (S3, Lambda)"
  ],
  certifications: [
    "AWS Certified Solutions Architect – Associate",
    "Meta Certified Front-End Developer Specialization"
  ],
  languages: [
    { id: "lang-1", name: "English", proficiency: "Native" },
    { id: "lang-2", name: "Arabic", proficiency: "Fluent" }
  ]
};
