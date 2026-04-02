import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SalaryRevisionLetterPdfService {
  async getAssetAsDataUrl(assetPath: string): Promise<string> {
    const response = await fetch(assetPath);

    if (!response.ok) {
      throw new Error(`Unable to load asset: ${assetPath}`);
    }

    const blob = await response.blob();
    return this.blobToDataUrl(blob);
  }

  async downloadPagesAsPdf(container: HTMLElement, fileName: string): Promise<void> {
    const [{ jsPDF }, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const html2canvas = html2canvasModule.default;
    const pageNodes = Array.from(container.querySelectorAll('.salary-revision-letter__page')) as HTMLElement[];
    const pages = pageNodes.length ? pageNodes : [container];
    const pdf = new jsPDF({
      format: 'a4',
      orientation: 'portrait',
      unit: 'mm',
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const canvas = await html2canvas(page, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        windowWidth: page.scrollWidth,
        windowHeight: page.scrollHeight,
      });
      const imageData = canvas.toDataURL('image/png');

      if (index > 0) {
        pdf.addPage();
      }

      pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    }

    pdf.save(fileName);
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(`${reader.result || ''}`);
      reader.onerror = () => reject(reader.error || new Error('Failed to convert blob to data URL.'));
      reader.readAsDataURL(blob);
    });
  }
}
