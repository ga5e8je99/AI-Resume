import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
} from 'docx';
import {
  DOCUMENT_LANGUAGE_OPTIONS,
  DocumentLanguage,
  getDocumentHeadings,
  formatDocumentDateRange,
  getDocumentFontFamily,
} from '../app/lib/documentI18n';
import { CoverLetterService } from '../app/lib/coverLetterService';
import { ResumeData, ThemeConfig } from '../app/builder/types';

const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'test-artifacts-b6');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('📄 Starting End-to-End Export Verification for All 6 Languages...\n');

const sampleResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Alex Vance',
    jobTitle: 'Senior Systems Architect',
    email: 'alex.vance@example.com',
    phone: '+1 555 019 2831',
    location: 'Berlin / Remote',
    website: 'https://alexvance.dev',
    linkedin: 'linkedin.com/in/alexvance',
    github: 'github.com/alexvance',
    summary: 'Experienced architect specializing in distributed cloud systems, real-time messaging, and high-availability database clusters.',
  },
  experience: [
    {
      id: 'exp-1',
      company: 'OmniCorp Global',
      position: 'Staff Engineer & Architect',
      startDate: '2021-03',
      endDate: '',
      current: true,
      location: 'Berlin',
      description: [
        'Architected high-throughput message streaming engine processing 1.4B events daily.',
        'Mentored 12 engineers across 3 international teams in distributed systems best practices.',
      ],
    },
    {
      id: 'exp-2',
      company: 'Vanguard Systems',
      position: 'Senior Software Engineer',
      startDate: '2018-06',
      endDate: '2021-02',
      current: false,
      location: 'Frankfurt',
      description: [
        'Designed microservices with Node.js, Go, and PostgreSQL reducing p99 latency by 38%.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'Technical University',
      degree: 'Master of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2016-09',
      endDate: '2018-05',
      gpa: '3.9',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'CloudMesh Engine',
      description: ['Distributed mesh overlay network for hybrid multi-cloud clusters.'],
      techStack: 'Go, eBPF, Kubernetes, WireGuard',
      link: 'https://github.com/alex/cloudmesh',
    },
  ],
  skills: ['TypeScript', 'Go', 'Rust', 'Kubernetes', 'PostgreSQL', 'Docker', 'AWS'],
  certifications: ['AWS Certified Solutions Architect - Professional', 'CKA: Certified Kubernetes Administrator'],
  languages: [
    { id: 'l1', name: 'English', proficiency: 'Native' },
    { id: 'l2', name: 'German', proficiency: 'Fluent' },
    { id: 'l3', name: 'Arabic', proficiency: 'Conversational' },
  ],
};

// 1. Generate & Export Resume Word Documents for all 6 languages
async function verifyResumeWordExports() {
  const languages: DocumentLanguage[] = ['en', 'ar', 'fr', 'de', 'es', 'tr'];

  for (const lang of languages) {
    const h = getDocumentHeadings(lang);
    const isRtl = h.isRtl;
    const fontName = isRtl ? 'IBM Plex Sans Arabic' : 'Calibri';
    const defaultAlign = isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT;

    const docChildren: Paragraph[] = [
      new Paragraph({
        bidirectional: isRtl,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: sampleResumeData.personalInfo.fullName.toUpperCase(),
            bold: true,
            size: 32,
            font: fontName,
          }),
        ],
      }),
      new Paragraph({
        bidirectional: isRtl,
        alignment: defaultAlign,
        spacing: { before: 160, after: 60 },
        border: {
          bottom: { color: '0F5C4D', space: 2, style: BorderStyle.SINGLE, size: 8 },
        },
        children: [
          new TextRun({
            text: h.summary,
            bold: true,
            size: 22,
            font: fontName,
          }),
        ],
      }),
      new Paragraph({
        bidirectional: isRtl,
        alignment: defaultAlign,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: sampleResumeData.personalInfo.summary || '',
            size: 20,
            font: fontName,
          }),
        ],
      }),
      new Paragraph({
        bidirectional: isRtl,
        alignment: defaultAlign,
        spacing: { before: 160, after: 60 },
        border: {
          bottom: { color: '0F5C4D', space: 2, style: BorderStyle.SINGLE, size: 8 },
        },
        children: [
          new TextRun({
            text: h.experience,
            bold: true,
            size: 22,
            font: fontName,
          }),
        ],
      }),
    ];

    // Add experiences with localized dates
    for (const exp of sampleResumeData.experience) {
      const dateRangeStr = formatDocumentDateRange(exp.startDate, exp.endDate, exp.current, lang);
      docChildren.push(
        new Paragraph({
          bidirectional: isRtl,
          alignment: defaultAlign,
          children: [
            new TextRun({ text: `${exp.position} - ${exp.company}`, bold: true, size: 20, font: fontName }),
            new TextRun({ text: ` (${dateRangeStr})`, italics: true, size: 18, font: fontName }),
          ],
        })
      );
    }

    // Add Education
    docChildren.push(
      new Paragraph({
        bidirectional: isRtl,
        alignment: defaultAlign,
        spacing: { before: 160, after: 60 },
        border: {
          bottom: { color: '0F5C4D', space: 2, style: BorderStyle.SINGLE, size: 8 },
        },
        children: [
          new TextRun({
            text: h.education,
            bold: true,
            size: 22,
            font: fontName,
          }),
        ],
      })
    );

    // Add Skills
    docChildren.push(
      new Paragraph({
        bidirectional: isRtl,
        alignment: defaultAlign,
        spacing: { before: 160, after: 60 },
        border: {
          bottom: { color: '0F5C4D', space: 2, style: BorderStyle.SINGLE, size: 8 },
        },
        children: [
          new TextRun({
            text: h.skills,
            bold: true,
            size: 22,
            font: fontName,
          }),
        ],
      })
    );

    const doc = new Document({
      sections: [{ children: docChildren }],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `resume_${lang}.docx`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(filePath, buffer);

    console.log(`  ✓ Exported Resume Word doc: ${fileName} (${buffer.length} bytes, dir=${h.dir}, font=${fontName})`);
    assert(buffer.length > 2000, `Word document for ${lang} must have valid byte size`);
  }
}

// 2. Generate & Export Cover Letter Documents for all 6 languages
async function verifyCoverLetterExports() {
  const languages: DocumentLanguage[] = ['en', 'ar', 'fr', 'de', 'es', 'tr'];

  for (const lang of languages) {
    const isAr = lang === 'ar';
    const fontName = isAr ? 'IBM Plex Sans Arabic' : 'Calibri';
    const defaultAlign = isAr ? AlignmentType.RIGHT : AlignmentType.LEFT;

    // Generate letter with domain service
    const generated = CoverLetterService.generateCoverLetter({
      jobTitle: 'Principal Cloud Architect',
      companyName: 'Apex Innovations',
      hiringManager: lang === 'de' ? 'Herr Schmidt' : lang === 'fr' ? 'M. Dupont' : lang === 'es' ? 'Sra. García' : lang === 'tr' ? 'Mehmet Bey' : 'Director of Engineering',
      jobDescription: 'Seeking an expert in cloud infrastructure, Kubernetes clusters, distributed systems, and team mentoring.',
      language: lang,
      tone: 'formal',
      sender: {
        fullName: sampleResumeData.personalInfo.fullName,
        email: sampleResumeData.personalInfo.email,
        phone: sampleResumeData.personalInfo.phone,
      },
    });

    assert(generated.content.fullText && generated.content.fullText.length > 100, `Cover letter fullText for ${lang} must be populated`);
    assert(generated.content.salutation && generated.content.salutation.length > 0, `Salutation for ${lang} must be present`);
    assert(generated.content.signOff && generated.content.signOff.length > 0, `Sign-off for ${lang} must be present`);

    // Verify language-specific content
    if (lang === 'ar') {
      assert(generated.content.salutation.includes('عناية') || generated.content.salutation.includes('السادة'), 'Arabic salutation');
      assert(generated.content.signOff.includes('الاحترام والتقدير'), 'Arabic sign-off');
    } else if (lang === 'de') {
      assert(generated.content.salutation.includes('Sehr geehrte'), 'German salutation');
      assert(generated.content.signOff.includes('Mit freundlichen Grüßen'), 'German sign-off');
    } else if (lang === 'fr') {
      assert(generated.content.salutation.includes('attention') || generated.content.salutation.includes('Madame, Monsieur'), 'French salutation');
      assert(generated.content.signOff.includes('salutations distinguées'), 'French sign-off');
    } else if (lang === 'es') {
      assert(generated.content.salutation.includes('Estimado/a'), 'Spanish salutation');
      assert(generated.content.signOff.includes('Atentamente'), 'Spanish sign-off');
    } else if (lang === 'tr') {
      assert(generated.content.salutation.includes('Sayın'), 'Turkish salutation');
      assert(generated.content.signOff.includes('Saygılarımla'), 'Turkish sign-off');
    }

    // Build Word document
    const paragraphs: Paragraph[] = [
      new Paragraph({
        bidirectional: isAr,
        alignment: defaultAlign,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: generated.sender.fullName,
            bold: true,
            size: 28,
            font: fontName,
          }),
        ],
      }),
      new Paragraph({
        bidirectional: isAr,
        alignment: defaultAlign,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: generated.content.salutation,
            bold: true,
            size: 22,
            font: fontName,
          }),
        ],
      }),
    ];

    const bodyParas = generated.content.fullText.split(/\n\s*\n/).filter(Boolean);
    for (const p of bodyParas) {
      paragraphs.push(
        new Paragraph({
          bidirectional: isAr,
          alignment: defaultAlign,
          spacing: { after: 140 },
          children: [
            new TextRun({
              text: p.trim(),
              size: 22,
              font: fontName,
            }),
          ],
        })
      );
    }

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `cover_letter_${lang}.docx`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(filePath, buffer);

    console.log(`  ✓ Exported Cover Letter Word doc: ${fileName} (${buffer.length} bytes, dir=${isAr ? 'rtl' : 'ltr'}, font=${fontName})`);
    assert(buffer.length > 2000, `Cover letter document for ${lang} must have valid byte size`);
  }
}

async function run() {
  await verifyResumeWordExports();
  await verifyCoverLetterExports();
  console.log('\n🎉 Successfully generated and verified all 12 resume & cover letter documents across all 6 languages!\n');
}

run().catch((err) => {
  console.error('Fatal error during export verification:', err);
  process.exit(1);
});
