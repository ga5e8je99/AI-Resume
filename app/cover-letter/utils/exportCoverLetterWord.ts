import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from 'docx';
import { CoverLetterData } from '../types';
import { DocumentLanguage } from '@/app/lib/documentI18n';

const LOCALE_MAP: Record<DocumentLanguage, string> = {
  en: 'en-US',
  ar: 'ar-EG',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  tr: 'tr-TR',
};

/**
 * Generates an ATS-compliant Word (.docx) document directly in the browser
 * and triggers download for Microsoft Word, Google Docs, and ATS systems.
 */
export async function exportCoverLetterToDocx(
  letter: CoverLetterData
): Promise<void> {
  const lang = (letter.language || 'en') as DocumentLanguage;
  const isAr = lang === 'ar';
  const fontName = isAr ? 'IBM Plex Sans Arabic' : 'Calibri';
  const defaultAlign = isAr ? AlignmentType.RIGHT : AlignmentType.LEFT;

  const senderName = letter.sender?.fullName || (isAr ? 'مقدم الطلب' : 'Applicant');
  const company = letter.recipient?.companyName || (isAr ? 'الشركة' : 'Company');
  const role = letter.recipient?.jobTitle || (isAr ? 'الوظيفة' : 'Position');

  // Contact items
  const contactParts = [
    letter.sender?.email,
    letter.sender?.phone,
    letter.sender?.location,
  ].filter(Boolean);

  // Date formatting per selected language
  const dateLocale = LOCALE_MAP[lang] || 'en-US';
  const todayFormatted = new Date().toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Paragraphs to include
  const children: Paragraph[] = [];

  // 1. Sender Header (Name + Title)
  children.push(
    new Paragraph({
      bidirectional: isAr,
      alignment: defaultAlign,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: senderName,
          bold: true,
          size: 28, // 14pt
          color: '0F172A',
          font: fontName,
        }),
      ],
    })
  );

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        bidirectional: isAr,
        alignment: defaultAlign,
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: 18, // 9pt
            color: '64748B',
            font: fontName,
          }),
        ],
      })
    );
  }

  // 2. Date
  children.push(
    new Paragraph({
      bidirectional: isAr,
      alignment: defaultAlign,
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: todayFormatted,
          size: 20, // 10pt
          color: '334155',
          font: fontName,
        }),
      ],
    })
  );

  // 3. Recipient Information
  if (letter.recipient) {
    if (letter.recipient.hiringManager) {
      children.push(
        new Paragraph({
          bidirectional: isAr,
          alignment: defaultAlign,
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: letter.recipient.hiringManager,
              bold: true,
              size: 20,
              color: '1E293B',
              font: fontName,
            }),
          ],
        })
      );
    }

    if (company || role) {
      children.push(
        new Paragraph({
          bidirectional: isAr,
          alignment: defaultAlign,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: [role, company].filter(Boolean).join(' - '),
              size: 20,
              color: '475569',
              font: fontName,
            }),
          ],
        })
      );
    }
  }

  // 4. Body Content
  const textContent = letter.content?.fullText?.trim() || '';
  if (textContent) {
    const rawParagraphs = textContent.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    for (const para of rawParagraphs) {
      children.push(
        new Paragraph({
          bidirectional: isAr,
          alignment: defaultAlign,
          spacing: { after: 160, line: 276 }, // 1.15 line spacing
          children: [
            new TextRun({
              text: para.trim(),
              size: 22, // 11pt
              color: '1E293B',
              font: fontName,
            }),
          ],
        })
      );
    }
  } else {
    // Fallback to structured parts if fullText is empty
    if (letter.content?.salutation) {
      children.push(
        new Paragraph({
          bidirectional: isAr,
          alignment: defaultAlign,
          spacing: { after: 120 },
          children: [new TextRun({ text: letter.content.salutation, size: 22, bold: true, font: fontName })],
        })
      );
    }
    if (letter.content?.introduction) {
      children.push(
        new Paragraph({
          bidirectional: isAr,
          alignment: defaultAlign,
          spacing: { after: 140 },
          children: [new TextRun({ text: letter.content.introduction, size: 22, font: fontName })],
        })
      );
    }
    if (Array.isArray(letter.content?.bodyParagraphs)) {
      for (const p of letter.content.bodyParagraphs) {
        children.push(
          new Paragraph({
            bidirectional: isAr,
            alignment: defaultAlign,
            spacing: { after: 140 },
            children: [new TextRun({ text: p, size: 22, font: fontName })],
          })
        );
      }
    }
    if (letter.content?.conclusion) {
      children.push(
        new Paragraph({
          bidirectional: isAr,
          alignment: defaultAlign,
          spacing: { after: 140 },
          children: [new TextRun({ text: letter.content.conclusion, size: 22, font: fontName })],
        })
      );
    }
    if (letter.content?.signOff) {
      children.push(
        new Paragraph({
          bidirectional: isAr,
          alignment: defaultAlign,
          spacing: { after: 60 },
          children: [new TextRun({ text: letter.content.signOff, size: 22, font: fontName })],
        })
      );
    }
    children.push(
      new Paragraph({
        bidirectional: isAr,
        alignment: defaultAlign,
        children: [new TextRun({ text: senderName, size: 22, bold: true, font: fontName })],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanSender = senderName.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
  const cleanCompany = company.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
  const fileName = `${cleanSender}_CoverLetter_${cleanCompany}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
