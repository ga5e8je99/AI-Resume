import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { CvData, CvThemeConfig } from '../types';
import {
  getDocumentHeadings,
  formatDocumentDate,
  formatDocumentDateRange,
} from '@/app/lib/documentI18n';

/**
 * Generates a full Curriculum Vitae Word (.docx) document directly in the browser
 * with all sections localized and triggers an immediate download.
 */
export async function exportCvToDocx(
  data: CvData,
  theme?: CvThemeConfig
): Promise<void> {
  const {
    personalInfo,
    experience,
    education,
    projects,
    skills,
    softSkills,
    tools,
    certifications,
    languages,
    courses,
    publications,
    awards,
    volunteering,
    references,
    referencesAvailableUponRequest,
  } = data;

  const accentHex = theme?.accentColor?.replace('#', '') || '059669';
  const docLang = theme?.documentLanguage || 'en';
  const h = getDocumentHeadings(docLang);
  const isRtl = h.isRtl;
  const fontName = isRtl ? 'IBM Plex Sans Arabic' : 'Calibri';
  const defaultAlign = isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT;

  const children: Paragraph[] = [];

  // Helper for section headings
  const addSectionHeader = (title: string) => {
    children.push(
      new Paragraph({
        bidirectional: isRtl,
        alignment: defaultAlign,
        spacing: { before: 240, after: 100 },
        border: {
          bottom: {
            color: accentHex,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 24, // 12pt
            color: accentHex,
            font: fontName,
          }),
        ],
      })
    );
  };

  // 1. Candidate Full Name (Centered Heading)
  children.push(
    new Paragraph({
      bidirectional: isRtl,
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: (personalInfo.fullName || 'YOUR FULL NAME').toUpperCase(),
          bold: true,
          size: 32, // 16pt
          color: accentHex,
          font: fontName,
        }),
      ],
    })
  );

  // 2. Job Title
  children.push(
    new Paragraph({
      bidirectional: isRtl,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: personalInfo.jobTitle || 'Curriculum Vitae',
          bold: true,
          size: 24, // 12pt
          color: '374151',
          font: fontName,
        }),
      ],
    })
  );

  // 3. Contact & Demographics Line
  const contactParts: string[] = [];
  if (personalInfo.email) contactParts.push(personalInfo.email);
  if (personalInfo.phone) contactParts.push(personalInfo.phone);
  if (personalInfo.location) contactParts.push(personalInfo.location);
  if (personalInfo.nationality) contactParts.push(`${h.nationality}: ${personalInfo.nationality}`);
  if (personalInfo.dateOfBirth) contactParts.push(`${h.dateOfBirth}: ${personalInfo.dateOfBirth}`);
  if (personalInfo.drivingLicense) contactParts.push(`${h.drivingLicense}: ${personalInfo.drivingLicense}`);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        bidirectional: isRtl,
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: 18,
            color: '4B5563',
            font: fontName,
          }),
        ],
      })
    );
  }

  // 4. Executive Summary
  if (personalInfo.summary) {
    addSectionHeader(h.summary);
    children.push(
      new Paragraph({
        bidirectional: isRtl,
        alignment: defaultAlign,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: personalInfo.summary,
            size: 20,
            color: '1F2937',
            font: fontName,
          }),
        ],
      })
    );
  }

  // 5. Work Experience
  if (experience && experience.length > 0) {
    addSectionHeader(h.experience);
    experience.forEach((exp) => {
      children.push(
        new Paragraph({
          bidirectional: isRtl,
          alignment: defaultAlign,
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: exp.position,
              bold: true,
              size: 22,
              color: '111827',
              font: fontName,
            }),
            new TextRun({
              text: ` — ${exp.company}${exp.location ? `, ${exp.location}` : ''}`,
              italics: true,
              size: 20,
              color: '4B5563',
              font: fontName,
            }),
            new TextRun({
              text: `  (${formatDocumentDateRange(exp.startDate, exp.endDate, exp.current, docLang)})`,
              size: 18,
              color: '6B7280',
              font: fontName,
            }),
          ],
        })
      );

      exp.description
        .filter((d) => d.trim())
        .forEach((bullet) => {
          children.push(
            new Paragraph({
              bidirectional: isRtl,
              alignment: defaultAlign,
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 20,
                  color: '374151',
                  font: fontName,
                }),
              ],
            })
          );
        });
    });
  }

  // 6. Education
  if (education && education.length > 0) {
    addSectionHeader(h.education);
    education.forEach((edu) => {
      children.push(
        new Paragraph({
          bidirectional: isRtl,
          alignment: defaultAlign,
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({
              text: `${edu.degree} in ${edu.fieldOfStudy}`,
              bold: true,
              size: 22,
              color: '111827',
              font: fontName,
            }),
            new TextRun({
              text: ` — ${edu.institution}`,
              italics: true,
              size: 20,
              color: '4B5563',
              font: fontName,
            }),
            new TextRun({
              text: `  (${formatDocumentDateRange(edu.startDate, edu.endDate, false, docLang)})${edu.gpa ? ` | ${h.gpa}: ${edu.gpa}` : ''}`,
              size: 18,
              color: '6B7280',
              font: fontName,
            }),
          ],
        })
      );
    });
  }

  // 7. Languages
  if (languages && languages.length > 0) {
    addSectionHeader(h.languages);
    children.push(
      new Paragraph({
        bidirectional: isRtl,
        alignment: defaultAlign,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: languages.map((l) => `${l.name} (${l.proficiency})`).join('  •  '),
            size: 20,
            color: '1F2937',
            font: fontName,
          }),
        ],
      })
    );
  }

  // 8. Skills
  if (skills && skills.length > 0) {
    addSectionHeader(h.skills);
    children.push(
      new Paragraph({
        bidirectional: isRtl,
        alignment: defaultAlign,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: skills.join('  •  '),
            size: 20,
            color: '1F2937',
            font: fontName,
          }),
        ],
      })
    );
  }

  // 9. Publications
  if (publications && publications.length > 0) {
    addSectionHeader(h.publications);
    publications.forEach((pub) => {
      children.push(
        new Paragraph({
          bidirectional: isRtl,
          alignment: defaultAlign,
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `${pub.title}. `,
              bold: true,
              size: 20,
              font: fontName,
            }),
            new TextRun({
              text: `${pub.publisher} (${formatDocumentDate(pub.date, docLang)})`,
              italics: true,
              size: 19,
              color: '4B5563',
              font: fontName,
            }),
          ],
        })
      );
    });
  }

  // 10. Courses & Certifications
  if ((courses && courses.length > 0) || (certifications && certifications.length > 0)) {
    addSectionHeader(h.certifications);
    (certifications || []).forEach((cert) => {
      children.push(
        new Paragraph({
          bidirectional: isRtl,
          alignment: defaultAlign,
          bullet: { level: 0 },
          spacing: { after: 30 },
          children: [new TextRun({ text: cert, size: 20, font: fontName })],
        })
      );
    });
    (courses || []).forEach((c) => {
      children.push(
        new Paragraph({
          bidirectional: isRtl,
          alignment: defaultAlign,
          bullet: { level: 0 },
          spacing: { after: 30 },
          children: [
            new TextRun({
              text: `${c.title} — ${c.institution} (${formatDocumentDate(c.date, docLang)})`,
              size: 20,
              font: fontName,
            }),
          ],
        })
      );
    });
  }

  // 11. Honors & Awards
  if (awards && awards.length > 0) {
    addSectionHeader(h.awards);
    awards.forEach((award) => {
      children.push(
        new Paragraph({
          bidirectional: isRtl,
          alignment: defaultAlign,
          bullet: { level: 0 },
          spacing: { after: 30 },
          children: [
            new TextRun({
              text: `${award.title} — ${award.issuer} (${formatDocumentDate(award.date, docLang)})`,
              size: 20,
              font: fontName,
            }),
          ],
        })
      );
    });
  }

  // 12. Volunteering
  if (volunteering && volunteering.length > 0) {
    addSectionHeader(h.volunteering);
    volunteering.forEach((vol) => {
      children.push(
        new Paragraph({
          bidirectional: isRtl,
          alignment: defaultAlign,
          spacing: { before: 60, after: 20 },
          children: [
            new TextRun({
              text: `${vol.role} — ${vol.organization}`,
              bold: true,
              size: 20,
              font: fontName,
            }),
            new TextRun({
              text: ` (${formatDocumentDateRange(vol.startDate, vol.endDate, vol.current, docLang)})`,
              size: 18,
              color: '6B7280',
              font: fontName,
            }),
          ],
        })
      );
    });
  }

  // 13. References
  addSectionHeader(h.references);
  if (referencesAvailableUponRequest || !references || references.length === 0) {
    children.push(
      new Paragraph({
        bidirectional: isRtl,
        alignment: defaultAlign,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: h.referencesAvailable,
            italics: true,
            size: 20,
            color: '6B7280',
            font: fontName,
          }),
        ],
      })
    );
  } else {
    references.forEach((ref) => {
      children.push(
        new Paragraph({
          bidirectional: isRtl,
          alignment: defaultAlign,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: ref.name, bold: true, size: 20, font: fontName }),
            new TextRun({ text: ` — ${ref.position}, ${ref.company}`, italics: true, size: 19, font: fontName }),
            new TextRun({ text: ` (${ref.email || ''} ${ref.phone || ''})`, size: 18, color: '6B7280', font: fontName }),
          ],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = personalInfo.fullName
    ? `${personalInfo.fullName.replace(/\s+/g, '_')}_CV.docx`
    : 'Curriculum_Vitae.docx';
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
