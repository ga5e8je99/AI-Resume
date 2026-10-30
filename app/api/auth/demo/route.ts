import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { hashPassword, signToken } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit } from '@/app/lib/rateLimit';

export const dynamic = 'force-dynamic';

const DEMO_EMAIL = 'demo@jobmatch.ai';
const DEMO_NAME = 'Alex Rivera (Demo)';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: 20 demo logins per minute per client IP
    const rateLimit = applyRateLimit(
      req,
      { limit: 20, windowMs: 60 * 1000, keyPrefix: 'demo_auth' }
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    // 2. Find or create demo user
    const existingUser = await DataStore.findUserByEmail(DEMO_EMAIL);

    let userId: string;
    let userName: string = DEMO_NAME;
    let userRole: 'user' | 'admin' = 'user';

    if (!existingUser) {
      const unusablePassword = await hashPassword(crypto.randomUUID() + '_unusable_demo_pass_hash');
      const newUser = await DataStore.createUserAccount({
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        password: unusablePassword,
        role: 'user',
        isDemo: true,
      });
      userId = newUser.id;
      userName = newUser.name;
      userRole = newUser.role || 'user';
    } else {
      userId = existingUser.id;
      userName = existingUser.name;
      userRole = existingUser.role || 'user';
    }

    // 3. Re-seed demo data idempotently: clean up any existing documents for demo user first
    await DataStore.resetDemoUserData(userId);

    // a) Seed 1 complete, realistic Resume (Junior Full-Stack Developer)
    const demoResumePayload = {
      title: 'Alex Rivera - Junior Full-Stack Developer CV',
      templateId: 'modern',
      theme: {
        accentColor: '#0ea5e9',
        fontFamily: 'var(--font-sans), sans-serif',
        fontSize: 'base',
      },
      data: {
        personalInfo: {
          fullName: 'Alex Rivera',
          jobTitle: 'Junior Full-Stack Developer',
          email: 'alex.rivera.dev@gmail.com',
          phone: '+1 (555) 349-8201',
          location: 'Austin, TX',
          linkedin: 'linkedin.com/in/alexrivera-dev',
          website: 'https://alexrivera.dev',
        },
        summary:
          'Enthusiastic and detail-oriented Full-Stack Developer with 2+ years of hands-on experience building performant web applications using React, Next.js, Node.js, and TypeScript. Passionate about clean code, intuitive UI/UX, and scalable RESTful APIs.',
        experience: [
          {
            id: 'exp_demo_01',
            title: 'Junior Software Engineer',
            company: 'NexTech Solutions',
            location: 'Austin, TX',
            startDate: '2023-03',
            endDate: 'Present',
            current: true,
            bullets: [
              'Developed and maintained interactive client-facing dashboards using Next.js 14, React, and Tailwind CSS, improving page load speeds by 28%.',
              'Designed and optimized REST APIs using Node.js, Express, and MongoDB, handling 50k+ daily telemetry requests with 99.9% uptime.',
              'Collaborated in an Agile Scrum squad with 6 engineers, participating in bi-weekly sprints, code reviews, and automated CI/CD workflows.',
            ],
          },
          {
            id: 'exp_demo_02',
            title: 'Frontend Developer Intern',
            company: 'PixelCraft Media',
            location: 'Remote',
            startDate: '2022-06',
            endDate: '2022-12',
            current: false,
            bullets: [
              'Converted Figma wireframes into responsive, accessible HTML/CSS/JavaScript components tested across mobile and desktop devices.',
              'Integrated third-party analytics and form validation pipelines, reducing form drop-off rates by 15%.',
            ],
          },
        ],
        education: [
          {
            id: 'edu_demo_01',
            degree: 'Bachelor of Science in Computer Science',
            school: 'University of Texas at Austin',
            location: 'Austin, TX',
            graduationDate: '2023',
            gpa: '3.8 / 4.0',
          },
        ],
        skills: [
          'JavaScript',
          'TypeScript',
          'React',
          'Next.js',
          'Node.js',
          'Express',
          'Tailwind CSS',
          'MongoDB',
          'PostgreSQL',
          'Git',
          'Docker',
          'REST APIs',
          'Jest',
        ],
        projects: [
          {
            id: 'proj_demo_01',
            name: 'TaskPulse - Agile Collaboration App',
            description:
              'Real-time team project board built with Next.js App Router, WebSockets, and MongoDB.',
            technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'MongoDB'],
            link: 'https://github.com/alexrivera/taskpulse',
          },
          {
            id: 'proj_demo_02',
            name: 'DevMetrics - API Latency Monitor',
            description:
              'Lightweight dashboard visualizing HTTP endpoints response times and server health.',
            technologies: ['React', 'Node.js', 'Chart.js', 'Express'],
            link: 'https://github.com/alexrivera/devmetrics',
          },
        ],
      },
    };

    const savedResume = await DataStore.createUserResume(userId, demoResumePayload);

    // b) Seed 1 realistic ATS Scan Report
    const demoAnalysisPayload = {
      resumeFileName: 'Alex_Rivera_FullStack_CV.pdf',
      targetRole: 'Full-Stack Software Engineer',
      targetJobDescription:
        'We are seeking a Junior Full-Stack Developer proficient in React, TypeScript, Node.js, REST APIs, Git, and MongoDB to join our innovative engineering team.',
      overallScore: 88,
      grade: 'A-',
      rankPercentile: 'Top 15%',
      matchLabel: 'Strong Match',
      subScores: {
        keywordsMatch: 90,
        formatting: 95,
        structure: 85,
        contentQuality: 82,
      },
      result: {
        score: 88,
        grade: 'A-',
        rankPercentile: 'Top 15%',
        matchLabel: 'Strong Match',
        matchedKeywords: [
          'React',
          'TypeScript',
          'Node.js',
          'Next.js',
          'MongoDB',
          'REST APIs',
          'Tailwind CSS',
          'Git',
          'Docker',
        ],
        missingKeywords: ['Kubernetes', 'GraphQL', 'AWS Lambda'],
        recommendations: [
          'Quantify accomplishments with additional metrics and percentages where possible.',
          'Add a short bullet about cloud deployment or serverless functions to boost cloud ATS scores.',
          'Strong action verbs and formatting are already well optimized for ATS parsers.',
        ],
        subScores: {
          keywordsMatch: 90,
          formatting: 95,
          structure: 85,
          contentQuality: 82,
        },
      },
    };

    await DataStore.createUserAnalysis(userId, demoAnalysisPayload);

    // c) Seed 1 ready-to-use Cover Letter Draft
    const demoCoverLetterPayload = {
      title: 'Cover Letter - Acme Cloud Technologies',
      companyName: 'Acme Cloud Technologies',
      jobTitle: 'Junior Full-Stack Developer',
      jobDescription:
        'Acme Cloud Technologies is hiring a Junior Full-Stack Developer to work on next-generation web dashboards and robust backend services.',
      extractedKeywords: ['React', 'TypeScript', 'Node.js', 'Next.js', 'REST APIs', 'MongoDB'],
      tone: 'technical' as const,
      language: 'en' as const,
      status: 'saved' as const,
      templateId: 'modern',
      linkedResumeId: savedResume.id,
      sender: {
        fullName: 'Alex Rivera',
        email: 'alex.rivera.dev@gmail.com',
        phone: '+1 (555) 349-8201',
        location: 'Austin, TX',
        linkedin: 'linkedin.com/in/alexrivera-dev',
        portfolio: 'https://alexrivera.dev',
      },
      recipient: {
        companyName: 'Acme Cloud Technologies',
        hiringManager: 'Engineering Hiring Team',
        jobTitle: 'Junior Full-Stack Developer',
        department: 'Cloud Platform Engineering',
        location: 'Austin, TX',
      },
      content: {
        subject: 'Application for Junior Full-Stack Developer - Alex Rivera',
        salutation: 'Dear Engineering Hiring Team,',
        introduction:
          'I am writing to express my enthusiastic interest in the Junior Full-Stack Developer position at Acme Cloud Technologies. With proven experience building scalable web applications in React, TypeScript, and Node.js, I am excited about the opportunity to contribute to your engineering team.',
        bodyParagraphs: [
          'During my recent experience at NexTech Solutions, I contributed to key client-facing dashboards utilizing Next.js and Tailwind CSS, resulting in a 28% reduction in page latency. Additionally, I architected RESTful microservices with Node.js and MongoDB that successfully handle over 50,000 daily telemetry events with exceptional reliability.',
          'Your focus on developer velocity and resilient cloud architecture aligns closely with my dedication to writing clean, tested, and maintainable code. I thrive in collaborative Agile teams and take pride in delivering intuitive user interfaces backed by scalable server logic.',
        ],
        conclusion:
          'Thank you for your time and consideration. I welcome the opportunity to discuss how my technical skill set and drive for engineering excellence can benefit Acme Cloud Technologies.',
        signOff: 'Sincerely,',
        fullText:
          'Dear Engineering Hiring Team,\n\nI am writing to express my enthusiastic interest in the Junior Full-Stack Developer position at Acme Cloud Technologies. With proven experience building scalable web applications in React, TypeScript, and Node.js, I am excited about the opportunity to contribute to your engineering team.\n\nDuring my recent experience at NexTech Solutions, I contributed to key client-facing dashboards utilizing Next.js and Tailwind CSS, resulting in a 28% reduction in page latency. Additionally, I architected RESTful microservices with Node.js and MongoDB that successfully handle over 50,000 daily telemetry events with exceptional reliability.\n\nYour focus on developer velocity and resilient cloud architecture aligns closely with my dedication to writing clean, tested, and maintainable code. I thrive in collaborative Agile teams and take pride in delivering intuitive user interfaces backed by scalable server logic.\n\nThank you for your time and consideration. I welcome the opportunity to discuss how my technical skill set and drive for engineering excellence can benefit Acme Cloud Technologies.\n\nSincerely,\nAlex Rivera\nalex.rivera.dev@gmail.com | +1 (555) 349-8201',
      },
    };

    await DataStore.createUserCoverLetter(userId, demoCoverLetterPayload);

    // 4. Create Session JWT exactly the same as normal login
    const token = signToken({
      userId,
      email: DEMO_EMAIL,
      name: userName,
      role: userRole,
      isDemo: true,
    });

    const response = NextResponse.json({
      success: true,
      token,
      message: 'Demo access granted',
      user: {
        id: userId,
        name: userName,
        email: DEMO_EMAIL,
        role: userRole,
        isDemo: true,
      },
    });

    // 5. Set HttpOnly Cookie (7 days)
    response.cookies.set('jobmatch_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Demo auth error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initialize demo session' },
      { status: 500 }
    );
  }
}
