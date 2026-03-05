import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { BasketStore } from './data/basket.store';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { PriceComponent } from '../../shared/ui/price/price.component';
import { QuantityStepperComponent } from '../../shared/ui/quantity-stepper/quantity-stepper.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-basket-page',
  standalone: true,
  imports: [PageTitleComponent, PriceComponent, QuantityStepperComponent],
  templateUrl: './basket-page.component.html',
  styleUrl: './basket-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasketPageComponent {
  private readonly basketStore = inject(BasketStore);
  private readonly toastService = inject(ToastService);
  private readonly appConfig = inject(APP_CONFIG);

  protected readonly currency = this.appConfig.currency;
  protected readonly items = this.basketStore.items;
  protected readonly totals = this.basketStore.totals;

  protected updateQuantity(workshopId: string, quantity: number): void {
    this.basketStore.updateQuantity(workshopId, quantity);
    this.toastService.info('Basket quantity updated.');
  }

  protected removeItem(workshopId: string): void {
    this.basketStore.removeWorkshop(workshopId);
    this.toastService.info('Workshop removed from basket.');
  }
}
