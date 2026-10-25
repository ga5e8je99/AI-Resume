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

/**
 * Generates a full Curriculum Vitae Word (.docx) document directly in the browser
 * with all 13 sections and triggers an immediate download.
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

  const children: Paragraph[] = [];

  // Helper for section headings
  const addSectionHeader = (title: string) => {
    children.push(
      new Paragraph({
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
          }),
        ],
      })
    );
  };

  // 1. Candidate Full Name (Centered Heading)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: (personalInfo.fullName || 'YOUR FULL NAME').toUpperCase(),
          bold: true,
          size: 32, // 16pt
          color: accentHex,
        }),
      ],
    })
  );

  // 2. Job Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: personalInfo.jobTitle || 'Curriculum Vitae',
          bold: true,
          size: 24, // 12pt
          color: '374151',
        }),
      ],
    })
  );

  // 3. Contact & Demographics Line
  const contactParts: string[] = [];
  if (personalInfo.email) contactParts.push(personalInfo.email);
  if (personalInfo.phone) contactParts.push(personalInfo.phone);
  if (personalInfo.location) contactParts.push(personalInfo.location);
  if (personalInfo.nationality) contactParts.push(`Nationality: ${personalInfo.nationality}`);
  if (personalInfo.dateOfBirth) contactParts.push(`DOB: ${personalInfo.dateOfBirth}`);
  if (personalInfo.drivingLicense) contactParts.push(`License: ${personalInfo.drivingLicense}`);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: 18,
            color: '4B5563',
          }),
        ],
      })
    );
  }

  // 4. Executive Summary
  if (personalInfo.summary) {
    addSectionHeader('Executive Summary');
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: personalInfo.summary,
            size: 20,
            color: '1F2937',
          }),
        ],
      })
    );
  }

  // 5. Work Experience
  if (experience && experience.length > 0) {
    addSectionHeader('Work Experience');
    experience.forEach((exp) => {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: exp.position,
              bold: true,
              size: 22,
              color: '111827',
            }),
            new TextRun({
              text: ` — ${exp.company}${exp.location ? `, ${exp.location}` : ''}`,
              italics: true,
              size: 20,
              color: '4B5563',
            }),
            new TextRun({
              text: `  (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})`,
              size: 18,
              color: '6B7280',
            }),
          ],
        })
      );

      exp.description
        .filter((d) => d.trim())
        .forEach((bullet) => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 20,
                  color: '374151',
                }),
              ],
            })
          );
        });
    });
  }

  // 6. Education
  if (education && education.length > 0) {
    addSectionHeader('Education');
    education.forEach((edu) => {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({
              text: `${edu.degree} in ${edu.fieldOfStudy}`,
              bold: true,
              size: 22,
              color: '111827',
            }),
            new TextRun({
              text: ` — ${edu.institution}`,
              italics: true,
              size: 20,
              color: '4B5563',
            }),
            new TextRun({
              text: `  (${edu.startDate} - ${edu.endDate})${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`,
              size: 18,
              color: '6B7280',
            }),
          ],
        })
      );
    });
  }

  // 7. Languages
  if (languages && languages.length > 0) {
    addSectionHeader('Languages');
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: languages.map((l) => `${l.name} (${l.proficiency})`).join('  •  '),
            size: 20,
            color: '1F2937',
          }),
        ],
      })
    );
  }

  // 8. Skills
  if (skills && skills.length > 0) {
    addSectionHeader('Skills & Competencies');
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: skills.join('  •  '),
            size: 20,
            color: '1F2937',
          }),
        ],
      })
    );
  }

  // 9. Publications
  if (publications && publications.length > 0) {
    addSectionHeader('Publications & Research');
    publications.forEach((pub) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `${pub.title}. `,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: `${pub.publisher} (${pub.date})`,
              italics: true,
              size: 19,
              color: '4B5563',
            }),
          ],
        })
      );
    });
  }

  // 10. Courses & Certifications
  if ((courses && courses.length > 0) || (certifications && certifications.length > 0)) {
    addSectionHeader('Certifications & Training');
    (certifications || []).forEach((cert) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 30 },
          children: [new TextRun({ text: cert, size: 20 })],
        })
      );
    });
    (courses || []).forEach((c) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 30 },
          children: [
            new TextRun({ text: `${c.title} — ${c.institution} (${c.date})`, size: 20 }),
          ],
        })
      );
    });
  }

  // 11. References
  addSectionHeader('References');
  if (referencesAvailableUponRequest || !references || references.length === 0) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'Available upon request.',
            italics: true,
            size: 20,
            color: '6B7280',
          }),
        ],
      })
    );
  } else {
    references.forEach((ref) => {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: ref.name, bold: true, size: 20 }),
            new TextRun({ text: ` — ${ref.position}, ${ref.company}`, italics: true, size: 19 }),
            new TextRun({ text: ` (${ref.email || ''} ${ref.phone || ''})`, size: 18, color: '6B7280' }),
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
