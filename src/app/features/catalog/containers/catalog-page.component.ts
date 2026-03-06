import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { SeoService } from '../../../core/services/seo.service';
import { BasketStore } from '../../basket/data/basket.store';
import { Workshop } from '../../../models/workshop.model';
import { PageTitleComponent } from '../../../shared/ui/page-title/page-title.component';
import { WorkshopCardComponent } from '../components/workshop-card.component';
import { CatalogStore } from '../data/catalog.store';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageTitleComponent,
    WorkshopCardComponent,
    ScrollingModule,
  ],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CatalogStore],
})
export class CatalogPageComponent {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly catalogStore = inject(CatalogStore);
  private readonly basketStore = inject(BasketStore);
  private readonly seoService = inject(SeoService);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly selectedTag = signal<string | null>(null);
  protected readonly searchTerm = toSignal(
    this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(250),
      map((value) => value.trim().toLowerCase()),
    ),
    { initialValue: '' },
  );
  protected readonly workshops = this.catalogStore.workshops;
  protected readonly tags = this.catalogStore.tags;
  protected readonly loading = this.catalogStore.loading;
  protected readonly error = this.catalogStore.error;
  protected readonly filteredWorkshops = computed<readonly Workshop[]>(() => {
    const searchTerm = this.searchTerm();
    const selectedTag = this.selectedTag();

    return this.workshops().filter((workshop) => {
      const matchesTag = selectedTag ? workshop.tags.includes(selectedTag) : true;
      const matchesSearch = searchTerm
        ? workshop.title.toLowerCase().includes(searchTerm) ||
          workshop.description.toLowerCase().includes(searchTerm)
        : true;

      return matchesTag && matchesSearch;
    });
  });
  protected readonly selectedCount = this.basketStore.totalQuantity;
  protected readonly currency = computed(() => this.appConfig.currency);
  protected readonly useVirtualScroll = computed(() => this.filteredWorkshops().length >= 1000);

  constructor() {
    this.seoService.setTitle('Workshop Catalog | Workshop Booking');
    this.seoService.setDescription(
      'Browse the workshop catalog, compare sessions, and add tickets to your basket.',
    );
    this.seoService.setOpenGraph({
      title: 'Workshop Catalog',
      description: 'Browse available workshops and reserve your place.',
      url: '/catalog',
      type: 'website',
    });
    this.seoService.setJsonLd('site-home', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Workshop Booking & Payments',
      url: '/',
      potentialAction: {
        '@type': 'SearchAction',
        target: '/catalog',
        'query-input': 'required name=workshop',
      },
    });
    this.catalogStore.load();
  }

  protected onWorkshopAdded(workshop: Workshop): void {
    this.basketStore.addWorkshop(workshop);
  }

  protected selectTag(tag: string | null): void {
    this.selectedTag.set(tag);
  }

  protected trackWorkshopId(_: number, workshop: Workshop): string {
    return workshop.id;
  }
}
