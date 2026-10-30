'use client';

/**
 * Robust, multi-stage text extraction from PDF, DOCX, and TXT files.
 * Supports client-side DOCX parsing via Mammoth, CMaps, standard fonts,
 * Arabic RTL normalization, and clear error reporting for scanned or corrupted documents.
 */

export interface ExtractedDocument {
  text: string;
  charCount: number;
  wordCount: number;
  format: 'pdf' | 'docx' | 'txt';
  isArabic: boolean;
}

/**
 * Normalizes Arabic text extracted from PDFs.
 * Fixes Arabic presentation forms (NFKC) and corrects reversed glyph/visual-order text.
 */
export function normalizeArabicPdfText(text: string): string {
  if (!text) return '';

  // 1. Unicode NFKC normalization converts isolated/initial/medial/final presentation forms
  // (\uFB50-\uFDFF, \uFE70-\uFEFC) into standard Arabic letters (\u0621-\u064A)
  let normalized = text.normalize('NFKC');

  // Quick check if text contains Arabic characters
  if (!/[\u0600-\u06FF]/.test(normalized)) {
    return normalized;
  }

  // 2. Check for visual-order character reversal:
  // In correct Arabic, the prefix "ال" (\u0627\u0644) appears frequently at the start of words: (?:^|\s)ال
  // In reversed Arabic, it appears as "لا" or at the end of words: [\u0600-\u06FF]ال(?:\s|$)
  const correctPrefixCount = (normalized.match(/(?:^|\s)\u0627\u0644[\u0600-\u06FF]/g) || []).length;
  const reversedPrefixCount = (normalized.match(/[\u0600-\u06FF]\u0644\u0627(?:\s|$|[.,!])/g) || []).length;

  if (reversedPrefixCount > correctPrefixCount && reversedPrefixCount >= 2) {
    // Characters within Arabic words are reversed
    normalized = normalized
      .split('\n')
      .map((line) => {
        // Reverse characters inside Arabic-containing tokens
        return line
          .split(' ')
          .map((token) => {
            if (/[\u0600-\u06FF]/.test(token)) {
              // Preserve non-alphanumeric punctuation position if possible
              return token.split('').reverse().join('');
            }
            return token;
          })
          .join(' ');
      })
      .join('\n');
  }

  // Remove zero-width non-joiners/joiners if redundant
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');

  return normalized;
}

/**
 * Extracts text from PDF files using pdfjs-dist with CMaps and standard fonts.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  if (file.size === 0) {
    throw new Error('The uploaded PDF file is empty (0 bytes).');
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    throw new Error('Could not read the PDF file. The file may be locked or inaccessible.');
  }

  try {
    // Load pdf.min.mjs natively as an ES module in the browser to bypass Webpack eval-source-map Object.defineProperty bug
    const pdfjsUrl = '/pdf.min.mjs';
    const pdfjs: any =
      typeof window !== 'undefined'
        ? (window as any).pdfjsLib || (await import(/* webpackIgnore: true */ pdfjsUrl))
        : await import(/* webpackIgnore: true */ 'pdfjs-dist');

    // Set worker source with exact matching version query
    if (typeof window !== 'undefined') {
      const v = pdfjs.version || '5.4.449';
      pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs?v=${v}`;
    }

    // Configure PDF loading with CMaps & Standard fonts for full Unicode/Font support
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent({
        includeMarkedContent: false,
      });

      let pageText = '';
      if (textContent && textContent.items && textContent.items.length > 0) {
        pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .filter((str: string) => str && str.trim().length > 0)
          .join(' ');
      }

      // If page text is still empty, attempt to OCR the page if it's a scanned image
      if (!pageText.trim()) {
        const ocrText = await attemptCanvasOcr(page);
        if (ocrText) {
          pageText = ocrText;
        }
      }

      fullText += pageText + '\n\n';
    }

    let trimmed = fullText.trim();

    // Fallback: If still empty, attempt raw text stream extraction from binary
    if (!trimmed) {
      trimmed = extractRawStreamText(arrayBuffer);
    }

    // If still completely empty, provide an informative message
    if (!trimmed) {
      throw new Error(
        'This PDF appears to be a scanned image or photo without a digital text layer. Please upload a digital PDF, a DOCX file, or use our ATS Resume Builder to create your resume directly.'
      );
    }

    // Apply Arabic RTL and Unicode normalization
    trimmed = normalizeArabicPdfText(trimmed);

    return trimmed;
  } catch (error: any) {
    if (error?.message && error.message.includes('scanned image')) {
      throw error;
    }
    if (error?.name === 'PasswordException' || error?.message?.includes('password')) {
      throw new Error('This PDF is password-protected. Please remove the password and try again.');
    }
    if (error?.name === 'InvalidPDFException' || error?.message?.includes('Invalid PDF')) {
      throw new Error('The PDF file is corrupted or not a valid PDF document.');
    }
    console.error('Error extracting text from PDF:', error);
    throw new Error(
      error?.message ||
        'Failed to read PDF contents. Please ensure the file is not corrupted or password-protected.'
    );
  }
}

/**
 * Extracts text from DOCX files using Mammoth.
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  if (file.size === 0) {
    throw new Error('The uploaded DOCX file is empty (0 bytes).');
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    throw new Error('Could not read the DOCX file. The file may be locked or inaccessible.');
  }

  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = result.value || '';
    const trimmed = rawText.trim();

    if (!trimmed) {
      throw new Error(
        'The DOCX file contains no readable text. It may contain only embedded images or tables.'
      );
    }

    return normalizeArabicPdfText(trimmed);
  } catch (err: any) {
    if (err?.message?.includes('no readable text') || err?.message?.includes('empty')) {
      throw err;
    }
    console.error('Error extracting text from DOCX:', err);
    throw new Error('Failed to read DOCX document. Please ensure the file is a valid Microsoft Word .docx file.');
  }
}

/**
 * Attempts to render the PDF page to a canvas and run Puter.js OCR if available
 */
async function attemptCanvasOcr(page: any): Promise<string> {
  if (typeof window === 'undefined') return '';
  const puter = (window as any).puter;
  if (!puter?.ai?.img2txt) return '';

  try {
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!blob) return '';

    const text = await puter.ai.img2txt(blob);
    return text || '';
  } catch (err) {
    console.warn('Canvas OCR fallback failed or not available:', err);
    return '';
  }
}

/**
 * Fallback: scans the raw binary buffer for uncompressed strings in PDF streams
 */
function extractRawStreamText(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(bytes);

    // Look for text operators like (Some text) Tj or [(Some) -10 (text)] TJ
    const textPieces: string[] = [];
    const tjRegex = /\(([^()]{2,})\)\s*(?:Tj|'|")/g;
    let match;

    while ((match = tjRegex.exec(raw)) !== null) {
      const clean = match[1].replace(/\\[nrtbf\\]/g, ' ').trim();
      if (clean.length > 2 && /[a-zA-Z0-9\u0600-\u06FF]/.test(clean)) {
        textPieces.push(clean);
      }
    }

    if (textPieces.length > 10) {
      return textPieces.join(' ');
    }
  } catch (err) {
    console.warn('Raw stream extraction failed:', err);
  }
  return '';
}

/**
 * Main dispatcher: extracts text from PDF, DOCX, or TXT file with full validation.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  // 1. File size check (5MB limit)
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 5MB limit. Please upload a smaller document.`
    );
  }

  // 2. Empty file check
  if (file.size === 0) {
    throw new Error('The uploaded file is empty (0 bytes). Please upload a valid document.');
  }

  // 3. Supported extension check
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !['pdf', 'docx', 'txt'].includes(ext)) {
    throw new Error(
      `Unsupported file extension ".${ext || 'unknown'}". Please upload a .pdf, .docx, or .txt file.`
    );
  }

  // 4. Extraction per format
  if (ext === 'pdf') {
    return extractTextFromPdf(file);
  }

  if (ext === 'docx') {
    return extractTextFromDocx(file);
  }

  // TXT format
  try {
    const raw = await file.text();
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new Error('The uploaded text file is empty. Please upload a document with resume content.');
    }
    return normalizeArabicPdfText(trimmed);
  } catch (err: any) {
    if (err?.message?.includes('empty')) throw err;
    throw new Error('Could not read the text file. Please ensure it is encoded in UTF-8.');
  }
}
