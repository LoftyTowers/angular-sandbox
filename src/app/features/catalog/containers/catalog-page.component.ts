import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { BasketStore } from '../../basket/data/basket.store';
import { Workshop } from '../../../models/workshop.model';
import { PageTitleComponent } from '../../../shared/ui/page-title/page-title.component';
import { WorkshopCardComponent } from '../components/workshop-card.component';
import { CatalogStore } from '../data/catalog.store';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageTitleComponent, WorkshopCardComponent],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CatalogStore],
})
export class CatalogPageComponent {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly catalogStore = inject(CatalogStore);
  private readonly basketStore = inject(BasketStore);

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

  constructor() {
    this.catalogStore.load();
  }

  protected onWorkshopAdded(workshop: Workshop): void {
    this.basketStore.addWorkshop(workshop);
  }

  protected selectTag(tag: string | null): void {
    this.selectedTag.set(tag);
  }
}
