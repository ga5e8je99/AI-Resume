/**
 * Sample resume profiles across technical and non-technical disciplines.
 * Used for instant template inspection, score demonstration, and diagnostic testing.
 */

export interface SampleResumeProfile {
  id: string;
  name: string;
  role: string;
  fileName: string;
  templateId: string;
  summary: string;
  text: string;
}

export const sampleProfiles: Record<string, SampleResumeProfile> = {
  compact: {
    id: 'compact',
    name: 'Alex Morgan',
    role: 'Full-Stack Developer',
    fileName: 'Alex_Morgan_Compact_ATS.pdf',
    templateId: 'compact',
    summary: 'Results-driven Full-Stack Engineer with 5+ years of experience designing scalable web applications and distributed architectures.',
    text: `Alex Morgan
Full-Stack Developer | San Francisco, CA | alex.morgan@email.com | +1 (555) 349-2041 | linkedin.com/in/alexmorgan | github.com/alexmorgan

PROFESSIONAL SUMMARY
Results-driven Full-Stack Engineer with 5+ years of experience designing scalable web applications and distributed architectures. Proven expertise in Next.js, React, Node.js, and cloud deployments with a focus on performance optimization and ATS-friendly digital products.

WORK EXPERIENCE
TechNova Solutions — Senior Full-Stack Developer
San Francisco, CA | 2023-01 to Present
- Architected and deployed high-performance SaaS platforms serving 120,000+ active users using Next.js 15, TypeScript, and AWS.
- Engineered real-time data pipelines and WebSockets, decreasing latency by 42% and enhancing core metrics.
- Mentored a cross-functional team of 6 engineers and streamlined CI/CD pipelines, accelerating sprint velocity by 28%.

Apex Digital Labs — Software Engineer
San Jose, CA | 2021-03 to 2022-12
- Built responsive client portals with React, Tailwind CSS, and Node.js RESTful APIs with 99.9% uptime.
- Refactored legacy databases into optimized MongoDB schemas, cutting query response times by 35%.
- Integrated secure Stripe and PayPal payment gateways handling $2M+ in monthly transactions.

EDUCATION
University of California, Berkeley — Bachelor of Science in Computer Science
2017 to 2021 | GPA: 3.85 / 4.0

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, SQL, HTML5, CSS3
Frameworks: React, Next.js, Node.js, Express, Tailwind CSS
Cloud & DevOps: AWS, Docker, Kubernetes, Git, CI/CD, Jest`,
  },

  'two-column': {
    id: 'two-column',
    name: 'Sarah Jenkins',
    role: 'Cloud & DevOps Architect',
    fileName: 'Sarah_Jenkins_DevOps_TwoColumn.pdf',
    templateId: 'two-column',
    summary: 'Senior Infrastructure and Cloud Architect specializing in AWS/Azure migration, Kubernetes orchestration, and automated GitOps.',
    text: `Sarah Jenkins
Cloud & DevOps Architect | Seattle, WA | s.jenkins@cloudops.net | +1 (206) 555-8921 | linkedin.com/in/sarahjenkins-cloud

PROFESSIONAL SUMMARY
Cloud & DevOps Architect with 8+ years architecting enterprise Kubernetes clusters, multi-region AWS footprints, and Terraform infrastructure-as-code for Fortune 500 financial clients.

WORK EXPERIENCE
Apex Cloud Infrastructure — Principal Cloud Architect
Seattle, WA | 2022-04 to Present
- Spearheaded the cloud migration of 85 microservices to Amazon EKS, cutting yearly infrastructure expenditures by $480,000.
- Implemented ArgoCD GitOps pipelines with zero-downtime blue/green deployments across 14 global Kubernetes clusters.
- Enforced strict SOC2 compliance and zero-trust IAM governance across all containerized workloads.

Nordic Data Systems — Senior DevOps Engineer
Bellevue, WA | 2019-02 to 2022-03
- Automated multi-cloud environment provisioning using Terraform modules and GitHub Actions.
- Enhanced telemetry observability with Prometheus, Grafana, and Datadog, reducing MTTR from 45 minutes to 7 minutes.

EDUCATION
University of Washington — Bachelor of Science in Computer Engineering
2015 to 2019

TECHNICAL SKILLS
Cloud Platforms: AWS, Microsoft Azure, Google Cloud
Containers & Orchestration: Kubernetes, Docker, Helm, Nomad
IaC & Automation: Terraform, Ansible, GitHub Actions, GitLab CI
Observability & Security: Prometheus, Grafana, Datadog, Vault`,
  },

  'executive-blue': {
    id: 'executive-blue',
    name: 'Marcus Vance',
    role: 'Engineering Manager / Lead',
    fileName: 'Marcus_Vance_Executive_Blue.pdf',
    templateId: 'executive-blue',
    summary: 'Engineering Executive with 12+ years building high-performing engineering organizations, scaling platform throughput, and aligning product strategy.',
    text: `Marcus Vance
Engineering Manager / Lead | New York, NY | marcus.vance@executive.io | +1 (212) 555-0194 | linkedin.com/in/marcusvance

EXECUTIVE SUMMARY
Strategic Engineering Director with 12+ years scaling globally distributed software teams from 10 to 80+ engineers. Proven track record growing enterprise ARR from $8M to $42M while maintaining 99.99% system SLA and under 4% annual team attrition.

LEADERSHIP & WORK EXPERIENCE
Horizon FinTech Global — Director of Engineering
New York, NY | 2021-08 to Present
- Lead a high-velocity department of 45 software engineers, engineering managers, and QA leads across payments and settlement rails.
- Spearheaded high-throughput core banking redesign handling $14B annual transaction volume with sub-80ms p99 latency.
- Instituted agile engineering career frameworks and KPI-driven performance reviews, elevating employee retention to 96%.

Beacon Media Technologies — Senior Engineering Manager
New York, NY | 2017-05 to 2021-07
- Directed 3 cross-functional product squads developing AI-driven media recommendation services with 18M MAU.
- Championed automated test-driven development (TDD), reducing post-release defect density by 62%.

EDUCATION
Columbia University — Master of Science in Technology Management (2015 - 2017)
Cornell University — Bachelor of Science in Electrical & Computer Engineering (2010 - 2014)

CORE COMPETENCIES
Organizational Leadership, Budget Planning ($12M P&L), Talent Recruitment, System Architecture, Agile & OKR Frameworks`,
  },

  accountant: {
    id: 'accountant',
    name: 'Emily Chen',
    role: 'Financial Accountant / Audit Associate',
    fileName: 'Emily_Chen_Senior_Accountant.pdf',
    templateId: 'modern',
    summary: 'CPA-licensed Senior Corporate Accountant with 6+ years managing general ledger, financial audits, and multi-currency reconciliations.',
    text: `Emily Chen, CPA
Senior Corporate Accountant | Chicago, IL | emily.chen.cpa@outlook.com | +1 (312) 555-4309 | linkedin.com/in/emilychen-cpa

PROFESSIONAL SUMMARY
Detail-oriented Certified Public Accountant (CPA) with 6+ years of rigorous corporate accounting, GAAP and IFRS compliance, multi-entity consolidation, and statutory audit experience. Expert in NetSuite ERP, QuickBooks Enterprise, and automated financial modeling.

WORK EXPERIENCE
Sterling Commercial Capital — Senior Corporate Accountant
Chicago, IL | 2022-03 to Present
- Manage month-end and year-end closing cycles for 4 operating subsidiaries, completing general ledger reconciliations in under 4 business days.
- Designed automated journal entry reconciliation workflows, eliminating 18 hours of manual audit preparation per fiscal quarter.
- Coordinated external Big 4 audits with zero material weaknesses identified across 3 consecutive fiscal years.
- Directed cash flow forecasting models managing $35M in revolving operating capital and vendor disbursements.

Crestview Advisory Services — Staff Auditor & Tax Associate
Chicago, IL | 2019-06 to 2022-02
- Performed detailed balance sheet, accounts payable, and accounts receivable substantive testing for mid-market clients.
- Analyzed state and federal corporate tax filings ensuring full compliance with IRC statutes and local tax credits.

EDUCATION & CREDENTIALS
Certified Public Accountant (CPA) — Illinois Board of Examiners
University of Illinois Urbana-Champaign — Bachelor of Science in Accountancy | GPA: 3.91 / 4.0

CORE SKILLS & SYSTEMS
GAAP / IFRS Compliance, Multi-Entity Consolidation, NetSuite ERP, SAP S/4HANA, QuickBooks Enterprise, Financial Modeling, Excel (VBA / Power Query)`,
  },

  support: {
    id: 'support',
    name: 'Jordan Taylor',
    role: 'Customer Support & Client Success Specialist',
    fileName: 'Jordan_Taylor_Customer_Success.pdf',
    templateId: 'oslo',
    summary: 'Senior Customer Success & Support Specialist with 5+ years driving high CSAT, client retention, and technical escalation resolution.',
    text: `Jordan Taylor
Customer Support & Client Success Specialist | Austin, TX | jordan.taylor.cs@gmail.com | +1 (512) 555-7281 | linkedin.com/in/jordantaylor-cx

PROFESSIONAL SUMMARY
Customer-obsessed Support & Client Success Specialist with 5+ years optimizing omnichannel B2B customer journeys, achieving 98.4% average CSAT, and resolving complex technical escalations across SaaS platforms.

WORK EXPERIENCE
CloudScale Software — Senior Customer Support Specialist
Austin, TX | 2022-02 to Present
- Resolve 65+ complex technical tickets weekly via Zendesk and Intercom, maintaining a 98.6% CSAT rating.
- Partnered with product engineering to identify and document recurring bugs, slashing Tier-1 escalation volume by 31%.
- Authored 45+ comprehensive internal and customer-facing knowledge base articles, boosting self-service resolution rate by 24%.
- Conducted tailored onboarding walkthroughs for 40+ strategic enterprise client accounts.

NexGen Digital Solutions — Client Success Associate
Austin, TX | 2020-01 to 2022-01
- Managed ongoing relationships for a portfolio of 75 mid-market accounts representing $3.2M in annual recurring revenue.
- Achieved a 112% net revenue retention (NRR) rate by proactively monitoring account health indicators.

EDUCATION
University of Texas at Austin — Bachelor of Arts in Communications
2016 to 2020

KEY SKILLS & TOOLS
Zendesk Support & Guide, Salesforce CRM, Intercom, Jira Service Desk, ChurnZero, CSAT / NPS Optimization, Technical Troubleshooting, SLA Management`,
  },

  analyst: {
    id: 'analyst',
    name: 'David Kim',
    role: 'Data Analyst / Business Intelligence',
    fileName: 'David_Kim_BI_Data_Analyst.pdf',
    templateId: 'classic',
    summary: 'Commercial Data Analyst with 4+ years leveraging SQL, Python, Tableau, and dbt to optimize customer acquisition funnels and executive forecasting.',
    text: `David Kim
Data Analyst / Business Intelligence | Boston, MA | david.kim.analytics@proton.me | +1 (617) 555-9014 | linkedin.com/in/davidkim-analytics

PROFESSIONAL SUMMARY
Insight-driven Data Analyst with 4+ years engineering scalable data marts, self-service Tableau dashboards, and predictive churn models. Expert in advanced SQL querying, Python analytics (Pandas/NumPy), and stakeholder storytelling.

WORK EXPERIENCE
Catalyst Retail Dynamics — Senior Business Intelligence Analyst
Boston, MA | 2022-06 to Present
- Built and maintained automated Tableau dashboards monitoring $180M in annual omnichannel revenue across 14 product categories.
- Engineered dbt transformation pipelines in Snowflake, replacing manual spreadsheet reporting and saving 12 analyst hours weekly.
- Formulated cohort lifetime value (LTV) models that unlocked an 18% improvement in marketing ad spend efficiency.
- Led A/B test analysis for checkout redesign, validating a 4.2% lift in conversion with 99% statistical confidence.

Apex Health Analytics — Junior Data Analyst
Boston, MA | 2020-08 to 2022-05
- Wrote complex SQL queries across PostgreSQL and BigQuery databases to reconcile patient engagement logs.
- Automated weekly KPI executive reports via Python scripts and Slack webhook notifications.

EDUCATION
Northeastern University — Bachelor of Science in Data Science & Economics
2016 to 2020 | Magna Cum Laude

TECHNICAL SKILLS & TOOLS
Data Querying & Modeling: SQL (PostgreSQL, Snowflake, BigQuery), dbt, Data Warehousing
Programming: Python (Pandas, NumPy, Scikit-Learn), R
Visualization & BI: Tableau, Power BI, Looker Studio, Metabase
Statistics: A/B Testing, Regression Analysis, Cohort Segmentation`,
  },
};

/**
 * Returns a sample resume profile by template ID, role, or alias.
 */
export function getSampleProfile(sampleKey?: string | null): SampleResumeProfile {
  if (!sampleKey) return sampleProfiles.compact;
  const key = sampleKey.toLowerCase().trim();

  if (sampleProfiles[key]) return sampleProfiles[key];
  if (key === 'ats-friendly') return sampleProfiles['executive-blue'];
  if (key.includes('account') || key.includes('finance')) return sampleProfiles.accountant;
  if (key.includes('support') || key.includes('customer') || key.includes('oslo')) return sampleProfiles.support;
  if (key.includes('analyst') || key.includes('data') || key.includes('classic')) return sampleProfiles.analyst;
  if (key.includes('two') || key.includes('devops')) return sampleProfiles['two-column'];
  if (key.includes('blue') || key.includes('exec') || key.includes('manage')) return sampleProfiles['executive-blue'];
  if (key.includes('modern')) return sampleProfiles.accountant;

  return sampleProfiles.compact;
}
