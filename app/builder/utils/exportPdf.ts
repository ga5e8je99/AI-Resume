export type PaperSize = 'a4' | 'letter';

/**
 * Returns the default paper size based on user locale.
 * US and Canada use US Letter; the rest of the world uses ISO A4.
 */
export function getDefaultPaperSize(locale?: string): PaperSize {
  if (typeof navigator !== 'undefined') {
    const loc = (locale || navigator.language || '').toLowerCase();
    if (loc === 'en-us' || loc === 'en-ca' || loc === 'es-mx') {
      return 'letter';
    }
  }
  return 'a4';
}

/**
 * Downloads the resume directly as a real .pdf file into the user's Downloads folder
 * WITHOUT opening any printer dialog or browser print window.
 *
 * Supports both ISO A4 (210x297mm) and US Letter (8.5x11in) formats.
 */
export async function exportResumeToPdf(
  elementId: string = 'resume-preview',
  fileName: string = 'Resume.pdf',
  paperSize: PaperSize = 'a4'
): Promise<void> {
  const previewEl = document.getElementById(elementId);
  if (!previewEl) {
    throw new Error('Resume preview element not found. Please ensure the preview is active.');
  }

  const isLetter = paperSize === 'letter';
  // Pixel dimensions at 96 DPI:
  // A4: 794 x 1123 px
  // Letter: 816 x 1056 px
  const baseWidthPx = isLetter ? 816 : 794;
  const baseHeightPx = isLetter ? 1056 : 1123;
  const pageRatio = isLetter ? 792 / 612 : 1.4142;

  // PDF dimensions in points (72 pt per inch):
  // A4: 595.28 x 841.89 pt
  // Letter: 612 x 792 pt
  const pdfWidth = isLetter ? 612 : 595.28;
  const pdfHeight = isLetter ? 792 : 841.89;

  // 1. Create an offscreen wrapper to isolate from CSS zoom scales or mobile hidden tabs
  const offscreen = document.createElement('div');
  offscreen.style.position = 'fixed';
  offscreen.style.left = '-10000px';
  offscreen.style.top = '0';
  offscreen.style.width = `${baseWidthPx}px`;
  offscreen.style.zIndex = '-99999';
  offscreen.style.backgroundColor = '#ffffff';
  offscreen.style.overflow = 'visible';

  const previewDir = previewEl.getAttribute('dir') || 'ltr';
  offscreen.setAttribute('dir', previewDir);
  offscreen.dir = previewDir;

  // 2. Clone preview element with full contents and styles
  const clone = previewEl.cloneNode(true) as HTMLElement;
  clone.id = 'resume-preview-export-clone';
  clone.style.display = 'block';
  clone.style.transform = 'none';
  clone.style.width = `${baseWidthPx}px`;
  clone.style.minHeight = `${baseHeightPx}px`;
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.setAttribute('dir', previewDir);
  clone.dir = previewDir;

  if (previewDir === 'rtl') {
    clone.classList.add('font-arabic');
  }

  offscreen.appendChild(clone);
  document.body.appendChild(offscreen);

  try {
    // 3. Small pause to ensure layout and any images/fonts are settled in DOM
    await new Promise((resolve) => setTimeout(resolve, 80));

    const totalHeight = Math.max(baseHeightPx, clone.scrollHeight);

    // 4. Dynamically import html-to-image and render to canvas at 2x resolution (~300 DPI print quality)
    const htmlToImage = await import('html-to-image');
    const fullCanvas = await htmlToImage.toCanvas(clone, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      width: baseWidthPx,
      height: totalHeight,
      cacheBust: true,
    });

    // 5. Partition canvas into pages according to paper aspect ratio
    const pageHeightPx = Math.round(fullCanvas.width * pageRatio);
    const numPages =
      fullCanvas.height <= pageHeightPx * 1.05
        ? 1
        : Math.ceil(fullCanvas.height / pageHeightPx);

    const pagesData: { jpegBytes: Uint8Array; width: number; height: number }[] = [];

    for (let p = 0; p < numPages; p++) {
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = fullCanvas.width;
      pageCanvas.height = pageHeightPx;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        const sourceY = p * pageHeightPx;
        const sourceH = Math.min(pageHeightPx, fullCanvas.height - sourceY);
        ctx.drawImage(
          fullCanvas,
          0,
          sourceY,
          fullCanvas.width,
          sourceH,
          0,
          0,
          fullCanvas.width,
          sourceH
        );
      }

      const jpegDataUrl = pageCanvas.toDataURL('image/jpeg', 0.95);
      const base64Data = jpegDataUrl.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      pagesData.push({
        jpegBytes: bytes,
        width: pageCanvas.width,
        height: pageCanvas.height,
      });
    }

    // 6. Build genuine, standard-compliant PDF document
    const pdfBytes = buildPdf(pagesData, pdfWidth, pdfHeight);

    // 7. Direct file download into user's Downloads folder
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    const safeName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    downloadAnchor.href = downloadUrl;
    downloadAnchor.download = safeName;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();

    setTimeout(() => {
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(downloadUrl);
    }, 1000);
  } finally {
    // 8. Clean up offscreen DOM elements
    if (offscreen.parentNode) {
      offscreen.parentNode.removeChild(offscreen);
    }
  }
}

/**
 * Builds a standard ISO PDF 1.4 binary document from page JPEGs with customizable width & height.
 */
function buildPdf(
  pages: { jpegBytes: Uint8Array; width: number; height: number }[],
  pdfWidth: number,
  pdfHeight: number
): Uint8Array {
  const numPages = pages.length;

  const encoder = new TextEncoder();
  const headerStr = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const headerBytes = encoder.encode(headerStr);

  const objects: { id: number; bytes: Uint8Array }[] = [];

  // Object 1: Catalog
  const obj1Str = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  objects.push({ id: 1, bytes: encoder.encode(obj1Str) });

  // Object 2: Pages root
  const kidRefs: string[] = [];
  for (let i = 0; i < numPages; i++) {
    kidRefs.push(`${3 + i * 3} 0 R`);
  }
  const obj2Str = `2 0 obj\n<< /Type /Pages /Kids [${kidRefs.join(' ')}] /Count ${numPages} >>\nendobj\n`;
  objects.push({ id: 2, bytes: encoder.encode(obj2Str) });

  // Per-page objects
  for (let i = 0; i < numPages; i++) {
    const pageObjId = 3 + i * 3;
    const imgObjId = 4 + i * 3;
    const contentObjId = 5 + i * 3;
    const page = pages[i];

    // Page object
    const pageStr = `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Resources << /XObject << /Im${i + 1} ${imgObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`;
    objects.push({ id: pageObjId, bytes: encoder.encode(pageStr) });

    // Image XObject
    const imgHeadStr = `${imgObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpegBytes.length} >>\nstream\n`;
    const imgTailStr = '\nendstream\nendobj\n';
    const headBytes = encoder.encode(imgHeadStr);
    const tailBytes = encoder.encode(imgTailStr);

    const fullImgBytes = new Uint8Array(headBytes.length + page.jpegBytes.length + tailBytes.length);
    fullImgBytes.set(headBytes, 0);
    fullImgBytes.set(page.jpegBytes, headBytes.length);
    fullImgBytes.set(tailBytes, headBytes.length + page.jpegBytes.length);
    objects.push({ id: imgObjId, bytes: fullImgBytes });

    // Content Stream
    const contentStream = `q\n${pdfWidth} 0 0 ${pdfHeight} 0 0 cm\n/Im${i + 1} Do\nQ\n`;
    const contentStreamBytes = encoder.encode(contentStream);
    const contentStr = `${contentObjId} 0 obj\n<< /Length ${contentStreamBytes.length} >>\nstream\n${contentStream}endstream\nendobj\n`;
    objects.push({ id: contentObjId, bytes: encoder.encode(contentStr) });
  }

  // Calculate byte offsets for cross-reference table (xref)
  let currentOffset = headerBytes.length;
  const offsets: { id: number; offset: number }[] = [];

  for (const obj of objects) {
    offsets.push({ id: obj.id, offset: currentOffset });
    currentOffset += obj.bytes.length;
  }

  const totalObjs = objects.length + 1; // including 0
  const pad = (n: number) => String(n).padStart(10, '0');
  let xrefStr = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xrefStr += `${pad(off.offset)} 00000 n \n`;
  }

  const xrefOffset = currentOffset;
  const trailerStr = `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const xrefBytes = encoder.encode(xrefStr);
  const trailerBytes = encoder.encode(trailerStr);

  // Compute total output size
  let totalSize = headerBytes.length + xrefBytes.length + trailerBytes.length;
  for (const obj of objects) {
    totalSize += obj.bytes.length;
  }

  const result = new Uint8Array(totalSize);
  let pos = 0;

  result.set(headerBytes, pos);
  pos += headerBytes.length;

  for (const obj of objects) {
    result.set(obj.bytes, pos);
    pos += obj.bytes.length;
  }

  result.set(xrefBytes, pos);
  pos += xrefBytes.length;

  result.set(trailerBytes, pos);

  return result;
}
