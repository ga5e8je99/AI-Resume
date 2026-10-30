import { ResumeData, ThemeConfig } from '../types';
import {
  getDocumentHeadings,
  formatDocumentDate,
  formatDocumentDateRange,
} from '@/app/lib/documentI18n';

/**
 * Generates an ATS-compliant Word (.docx) document directly in the browser
 * and triggers an immediate download for Microsoft Word, Google Docs, and ATS parsers.
 */
export async function exportResumeToDocx(
  data: ResumeData,
  theme?: ThemeConfig
): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
  } = await import('docx');

  const { personalInfo, experience, education, projects, skills, certifications, languages } = data;
  const accentHex = theme?.accentColor?.replace('#', '') || '1E3A8A';
  const docLang = theme?.documentLanguage || 'en';
  const h = getDocumentHeadings(docLang);
  const isRtl = h.isRtl;
  const fontName = isRtl ? 'IBM Plex Sans Arabic' : 'Calibri';
  const defaultAlign = isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT;

  function createSectionHeading(title: string, colorHex: string): any {
    return new Paragraph({
      bidirectional: isRtl,
      alignment: defaultAlign,
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
          font: fontName,
        }),
      ],
    });
  }

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
            bidirectional: isRtl,
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: (personalInfo.fullName || 'YOUR FULL NAME').toUpperCase(),
                bold: true,
                size: 32, // 16pt
                color: accentHex,
                font: fontName,
              }),
            ],
          }),

          // 2. Job Title
          new Paragraph({
            bidirectional: isRtl,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: personalInfo.jobTitle || 'Professional Title',
                bold: true,
                size: 24, // 12pt
                color: '374151',
                font: fontName,
              }),
            ],
          }),

          // 3. Contact Line (Zero icons, pure ATS text with dot separators)
          new Paragraph({
            bidirectional: isRtl,
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
                font: fontName,
              }),
            ],
          }),

          // 4. Professional Summary
          ...(personalInfo.summary
            ? [
                createSectionHeading(h.summary.toUpperCase(), accentHex),
                new Paragraph({
                  bidirectional: isRtl,
                  alignment: defaultAlign,
                  spacing: { after: 180 },
                  children: [
                    new TextRun({
                      text: personalInfo.summary,
                      size: 21, // 10.5pt
                      font: fontName,
                    }),
                  ],
                }),
              ]
            : []),

          // 5. Work Experience
          ...(experience.length > 0
            ? [
                createSectionHeading(h.experience.toUpperCase(), accentHex),
                ...experience.flatMap((exp) => [
                  new Paragraph({
                    bidirectional: isRtl,
                    alignment: defaultAlign,
                    spacing: { before: 100, after: 30 },
                    children: [
                      new TextRun({
                        text: exp.position,
                        bold: true,
                        size: 22, // 11pt
                        font: fontName,
                      }),
                      new TextRun({
                        text: `  |  ${exp.company}`,
                        bold: false,
                        size: 22,
                        color: '1F2937',
                        font: fontName,
                      }),
                      new TextRun({
                        text: `   (${formatDocumentDateRange(exp.startDate, exp.endDate, exp.current, docLang)})`,
                        bold: true,
                        size: 20,
                        color: '6B7280',
                        font: fontName,
                      }),
                    ],
                  }),
                  ...(exp.location
                    ? [
                        new Paragraph({
                          bidirectional: isRtl,
                          alignment: defaultAlign,
                          spacing: { after: 40 },
                          children: [
                            new TextRun({
                              text: exp.location,
                              italics: true,
                              size: 19,
                              color: '6B7280',
                              font: fontName,
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
                          bidirectional: isRtl,
                          alignment: defaultAlign,
                          bullet: { level: 0 },
                          spacing: { after: 35 },
                          children: [
                            new TextRun({
                              text: bullet,
                              size: 21,
                              font: fontName,
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
                createSectionHeading(h.skills.toUpperCase(), accentHex),
                new Paragraph({
                  bidirectional: isRtl,
                  alignment: defaultAlign,
                  spacing: { after: 180 },
                  children: [
                    new TextRun({
                      text: skills.join('   •   '),
                      size: 21,
                      color: '1F2937',
                      font: fontName,
                    }),
                  ],
                }),
              ]
            : []),

          // 7. Education
          ...(education.length > 0
            ? [
                createSectionHeading(h.education.toUpperCase(), accentHex),
                ...education.flatMap((edu) => [
                  new Paragraph({
                    bidirectional: isRtl,
                    alignment: defaultAlign,
                    spacing: { before: 90, after: 30 },
                    children: [
                      new TextRun({
                        text: `${edu.degree} in ${edu.fieldOfStudy}`,
                        bold: true,
                        size: 22,
                        font: fontName,
                      }),
                      new TextRun({
                        text: `   (${formatDocumentDateRange(edu.startDate, edu.endDate, false, docLang)})`,
                        bold: true,
                        size: 20,
                        color: '6B7280',
                        font: fontName,
                      }),
                    ],
                  }),
                  new Paragraph({
                    bidirectional: isRtl,
                    alignment: defaultAlign,
                    spacing: { after: 80 },
                    children: [
                      new TextRun({
                        text: edu.institution + (edu.gpa ? `   •   ${h.gpa}: ${edu.gpa}` : ''),
                        italics: true,
                        size: 20,
                        color: '4B5563',
                        font: fontName,
                      }),
                    ],
                  }),
                ]),
              ]
            : []),

          // 8. Key Projects
          ...(projects.length > 0
            ? [
                createSectionHeading(h.projects.toUpperCase(), accentHex),
                ...projects.flatMap((proj) => [
                  new Paragraph({
                    bidirectional: isRtl,
                    alignment: defaultAlign,
                    spacing: { before: 90, after: 30 },
                    children: [
                      new TextRun({
                        text: proj.title,
                        bold: true,
                        size: 22,
                        font: fontName,
                      }),
                      ...(proj.techStack
                        ? [
                            new TextRun({
                              text: `  [Stack: ${proj.techStack}]`,
                              italics: true,
                              size: 19,
                              color: '6B7280',
                              font: fontName,
                            }),
                          ]
                        : []),
                      ...(proj.link
                        ? [
                            new TextRun({
                              text: `  - ${proj.link.replace(/^https?:\/\//, '')}`,
                              size: 19,
                              color: '2563EB',
                              font: fontName,
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
                          bidirectional: isRtl,
                          alignment: defaultAlign,
                          bullet: { level: 0 },
                          spacing: { after: 35 },
                          children: [
                            new TextRun({
                              text: b,
                              size: 21,
                              font: fontName,
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
                createSectionHeading(h.certifications.toUpperCase(), accentHex),
                ...certifications.map(
                  (cert) =>
                    new Paragraph({
                      bidirectional: isRtl,
                      alignment: defaultAlign,
                      bullet: { level: 0 },
                      spacing: { after: 35 },
                      children: [
                        new TextRun({
                          text: cert,
                          size: 21,
                          font: fontName,
                        }),
                      ],
                    })
                ),
              ]
            : []),

          // 10. Languages
          ...(languages && languages.length > 0
            ? [
                createSectionHeading(h.languages.toUpperCase(), accentHex),
                new Paragraph({
                  bidirectional: isRtl,
                  alignment: defaultAlign,
                  spacing: { after: 120 },
                  children: [
                    new TextRun({
                      text: languages.map((l) => `${l.name} (${l.proficiency})`).join('   •   '),
                      size: 21,
                      font: fontName,
                    }),
                  ],
                }),
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
