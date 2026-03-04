import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { Workshop } from '../../../models/workshop.model';
import { PageTitleComponent } from '../../../shared/ui/page-title/page-title.component';
import { WorkshopCardComponent } from '../components/workshop-card.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [PageTitleComponent, WorkshopCardComponent],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPageComponent {
  private readonly appConfig = inject(APP_CONFIG);

  protected readonly workshops = signal<Workshop[]>([
    {
      id: 'ws-angular-fundamentals',
      title: 'Angular Fundamentals',
      level: 'Beginner',
      durationHours: 3,
      price: 99,
    },
    {
      id: 'ws-rxjs-practice',
      title: 'RxJS in Practice',
      level: 'Intermediate',
      durationHours: 4,
      price: 149,
    },
    {
      id: 'ws-performance-toolkit',
      title: 'Performance Toolkit',
      level: 'Advanced',
      durationHours: 5,
      price: 199,
    },
  ]);

  protected readonly selectedCount = signal(0);
  protected readonly currency = computed(() => this.appConfig.currency);

  protected onWorkshopAdded(): void {
    this.selectedCount.update((count) => count + 1);
  }
}
