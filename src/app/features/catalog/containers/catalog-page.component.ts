import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import { WorkshopCatalogService } from '../../../core/services/workshop-catalog.service';
import { Workshop } from '../../../models/workshop.model';
import { PageTitleComponent } from '../../../shared/ui/page-title/page-title.component';
import { WorkshopCardComponent } from '../components/workshop-card.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [RouterLink, PageTitleComponent, WorkshopCardComponent],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPageComponent {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(WorkshopCatalogService);

  protected readonly selectedTag = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('tag'))),
    { initialValue: null },
  );
  protected readonly workshops = computed<Workshop[]>(() =>
    this.catalog.getWorkshops(this.selectedTag()),
  );

  protected readonly selectedCount = signal(0);
  protected readonly currency = computed(() => this.appConfig.currency);

  protected onWorkshopAdded(): void {
    this.selectedCount.update((count) => count + 1);
  }
}
