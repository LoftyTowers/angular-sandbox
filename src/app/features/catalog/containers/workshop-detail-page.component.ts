import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BasketStore } from '../../basket/data/basket.store';
import { Workshop } from '../../../models/workshop.model';
import { PageTitleComponent } from '../../../shared/ui/page-title/page-title.component';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { QuantityStepperComponent } from '../../../shared/ui/quantity-stepper/quantity-stepper.component';
import { ToastService } from '../../../core/services/toast.service';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-workshop-detail-page',
  standalone: true,
  imports: [RouterLink, PageTitleComponent, PriceComponent, QuantityStepperComponent],
  templateUrl: './workshop-detail-page.component.html',
  styleUrl: './workshop-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkshopDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly basketStore = inject(BasketStore);
  private readonly toastService = inject(ToastService);
  private readonly seoService = inject(SeoService);

  protected readonly workshop = this.route.snapshot.data['workshop'] as Workshop;
  protected ticketQuantity = 1;

  constructor() {
    this.seoService.setTitle(`${this.workshop.title} | Workshop Booking`);
    this.seoService.setDescription(this.workshop.description);
    this.seoService.setOpenGraph({
      title: this.workshop.title,
      description: this.workshop.description,
      url: `/catalog/${this.workshop.id}`,
      type: 'product',
    });
  }

  protected addToBasket(): void {
    this.basketStore.addWorkshop(this.workshop, this.ticketQuantity);
    this.toastService.success('Workshop added to basket.');
  }

  protected updateQuantity(quantity: number): void {
    this.ticketQuantity = quantity;
  }
}
