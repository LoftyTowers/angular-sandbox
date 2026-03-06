import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  setTitle(value: string): void {
    this.title.setTitle(value);
  }

  setDescription(value: string): void {
    this.meta.updateTag({ name: 'description', content: value });
  }

  setOpenGraph(metadata: { title: string; description: string; url: string; type?: string }): void {
    this.meta.updateTag({ property: 'og:title', content: metadata.title });
    this.meta.updateTag({ property: 'og:description', content: metadata.description });
    this.meta.updateTag({ property: 'og:url', content: metadata.url });
    this.meta.updateTag({ property: 'og:type', content: metadata.type ?? 'website' });
  }

  setJsonLd(id: string, payload: object): void {
    const selector = `script[type="application/ld+json"][data-seo-id="${id}"]`;
    const existing = this.document.head.querySelector(selector);
    const scriptElement = existing ?? this.document.createElement('script');
    scriptElement.setAttribute('type', 'application/ld+json');
    scriptElement.setAttribute('data-seo-id', id);
    scriptElement.textContent = JSON.stringify(payload);

    if (!existing) {
      this.document.head.appendChild(scriptElement);
    }
  }
}
