import { exportResumeToPdf } from '../../builder/utils/exportPdf';

/**
 * Downloads the complete CV directly as a high-resolution ISO A4 vector PDF file
 * into the user's Downloads folder without opening any print window.
 */
export async function exportCvToPdf(
  elementId: string = 'cv-preview',
  fileName: string = 'Curriculum_Vitae.pdf'
): Promise<void> {
  return exportResumeToPdf(elementId, fileName);
}
