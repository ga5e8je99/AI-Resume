'use client';

/**
 * Robust, multi-stage text extraction from PDF files using pdfjs-dist
 * with CMaps, standard fonts, and canvas OCR fallback.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Dynamic import to avoid SSR issues
    const pdfjs = await import('pdfjs-dist');

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
        'This PDF appears to be a scanned image or photo without a digital text layer. Please copy & paste your CV text directly, or upload a text-based PDF.'
      );
    }

    return trimmed;
  } catch (error: any) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(
      error?.message ||
        'Failed to read PDF contents. Please ensure the file is not password-protected.'
    );
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
 * Extracts text from plain text or basic document files
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return extractTextFromPdf(file);
  }

  // Fallback for .txt or other text-based files
  try {
    return await file.text();
  } catch (err) {
    throw new Error('Unsupported file format. Please upload a PDF or TXT file.');
  }
}
