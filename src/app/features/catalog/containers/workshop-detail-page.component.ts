import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Workshop } from '../../../models/workshop.model';
import { PageTitleComponent } from '../../../shared/ui/page-title/page-title.component';

@Component({
  selector: 'app-workshop-detail-page',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, PageTitleComponent],
  templateUrl: './workshop-detail-page.component.html',
  styleUrl: './workshop-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkshopDetailPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly workshop = this.route.snapshot.data['workshop'] as Workshop;
}
