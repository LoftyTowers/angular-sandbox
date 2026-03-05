import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  downloadTextFile(filename: string, content: string, mimeType = 'application/json'): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const view = this.document.defaultView;
    const urlApi = view?.URL;
    if (!urlApi) {
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const objectUrl = urlApi.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    this.document.body?.appendChild(anchor);
    anchor.click();
    anchor.remove();
    urlApi.revokeObjectURL(objectUrl);
  }
}
