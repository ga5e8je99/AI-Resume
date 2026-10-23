import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { ResumeData, ThemeConfig } from '../types';

/**
 * Generates an ATS-compliant Word (.docx) document directly in the browser
 * and triggers an immediate download for Microsoft Word, Google Docs, and ATS parsers.
 */
export async function exportResumeToDocx(
  data: ResumeData,
  theme?: ThemeConfig
): Promise<void> {
  const { personalInfo, experience, education, projects, skills, certifications } = data;
  const accentHex = theme?.accentColor?.replace('#', '') || '1E3A8A';

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch (720 twips/dxa)
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          // 1. Candidate Full Name (Centered Heading)
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: (personalInfo.fullName || 'YOUR FULL NAME').toUpperCase(),
                bold: true,
                size: 32, // 16pt
                color: accentHex,
              }),
            ],
          }),

          // 2. Job Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: personalInfo.jobTitle || 'Professional Title',
                bold: true,
                size: 24, // 12pt
                color: '374151',
              }),
            ],
          }),

          // 3. Contact Line (Zero icons, pure ATS text with dot separators)
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: [
                  personalInfo.email,
                  personalInfo.phone,
                  personalInfo.location,
                  personalInfo.website?.replace(/^https?:\/\//, ''),
                  personalInfo.linkedin?.replace(/^https?:\/\//, ''),
                  personalInfo.github?.replace(/^https?:\/\//, ''),
                ]
                  .filter(Boolean)
                  .join('   •   '),
                size: 19, // 9.5pt
                color: '4B5563',
              }),
            ],
          }),

          // 4. Professional Summary
          ...(personalInfo.summary
            ? [
                createSectionHeading('PROFESSIONAL SUMMARY', accentHex),
                new Paragraph({
                  spacing: { after: 180 },
                  children: [
                    new TextRun({
                      text: personalInfo.summary,
                      size: 21, // 10.5pt
                    }),
                  ],
                }),
              ]
            : []),

          // 5. Work Experience
          ...(experience.length > 0
            ? [
                createSectionHeading('WORK EXPERIENCE', accentHex),
                ...experience.flatMap((exp) => [
                  new Paragraph({
                    spacing: { before: 100, after: 30 },
                    children: [
                      new TextRun({
                        text: exp.position,
                        bold: true,
                        size: 22, // 11pt
                      }),
                      new TextRun({
                        text: `  |  ${exp.company}`,
                        bold: false,
                        size: 22,
                        color: '1F2937',
                      }),
                      new TextRun({
                        text: `   (${exp.startDate} – ${exp.current ? 'Present' : exp.endDate})`,
                        bold: true,
                        size: 20,
                        color: '6B7280',
                      }),
                    ],
                  }),
                  ...(exp.location
                    ? [
                        new Paragraph({
                          spacing: { after: 40 },
                          children: [
                            new TextRun({
                              text: exp.location,
                              italics: true,
                              size: 19,
                              color: '6B7280',
                            }),
                          ],
                        }),
                      ]
                    : []),
                  ...exp.description
                    .filter((d) => d.trim().length > 0)
                    .map(
                      (bullet) =>
                        new Paragraph({
                          bullet: { level: 0 },
                          spacing: { after: 35 },
                          children: [
                            new TextRun({
                              text: bullet,
                              size: 21,
                            }),
                          ],
                        })
                    ),
                ]),
              ]
            : []),

          // 6. Core Skills
          ...(skills.length > 0
            ? [
                createSectionHeading('SKILLS & CORE COMPETENCIES', accentHex),
                new Paragraph({
                  spacing: { after: 180 },
                  children: [
                    new TextRun({
                      text: skills.join('   •   '),
                      size: 21,
                      color: '1F2937',
                    }),
                  ],
                }),
              ]
            : []),

          // 7. Education
          ...(education.length > 0
            ? [
                createSectionHeading('EDUCATION', accentHex),
                ...education.flatMap((edu) => [
                  new Paragraph({
                    spacing: { before: 90, after: 30 },
                    children: [
                      new TextRun({
                        text: `${edu.degree} in ${edu.fieldOfStudy}`,
                        bold: true,
                        size: 22,
                      }),
                      new TextRun({
                        text: `   (${edu.startDate} – ${edu.endDate})`,
                        bold: true,
                        size: 20,
                        color: '6B7280',
                      }),
                    ],
                  }),
                  new Paragraph({
                    spacing: { after: 80 },
                    children: [
                      new TextRun({
                        text: edu.institution + (edu.gpa ? `   •   GPA: ${edu.gpa}` : ''),
                        italics: true,
                        size: 20,
                        color: '4B5563',
                      }),
                    ],
                  }),
                ]),
              ]
            : []),

          // 8. Key Projects
          ...(projects.length > 0
            ? [
                createSectionHeading('KEY PROJECTS', accentHex),
                ...projects.flatMap((proj) => [
                  new Paragraph({
                    spacing: { before: 90, after: 30 },
                    children: [
                      new TextRun({
                        text: proj.title,
                        bold: true,
                        size: 22,
                      }),
                      ...(proj.techStack
                        ? [
                            new TextRun({
                              text: `  [Stack: ${proj.techStack}]`,
                              italics: true,
                              size: 19,
                              color: '6B7280',
                            }),
                          ]
                        : []),
                      ...(proj.link
                        ? [
                            new TextRun({
                              text: `  - ${proj.link.replace(/^https?:\/\//, '')}`,
                              size: 19,
                              color: '2563EB',
                            }),
                          ]
                        : []),
                    ],
                  }),
                  ...proj.description
                    .filter((d) => d.trim().length > 0)
                    .map(
                      (b) =>
                        new Paragraph({
                          bullet: { level: 0 },
                          spacing: { after: 35 },
                          children: [
                            new TextRun({
                              text: b,
                              size: 21,
                            }),
                          ],
                        })
                    ),
                ]),
              ]
            : []),

          // 9. Certifications
          ...(certifications.length > 0
            ? [
                createSectionHeading('CERTIFICATIONS & HONORS', accentHex),
                ...certifications.map(
                  (cert) =>
                    new Paragraph({
                      bullet: { level: 0 },
                      spacing: { after: 35 },
                      children: [
                        new TextRun({
                          text: cert,
                          size: 21,
                        }),
                      ],
                    })
                ),
              ]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${
    personalInfo.fullName ? personalInfo.fullName.replace(/\s+/g, '_') : 'Resume'
  }_ATS.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createSectionHeading(title: string, colorHex: string): Paragraph {
  return new Paragraph({
    spacing: { before: 180, after: 80 },
    border: {
      bottom: {
        color: colorHex,
        space: 2,
        style: BorderStyle.SINGLE,
        size: 10,
      },
    },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 22, // 11pt
        color: colorHex,
      }),
    ],
  });
}
