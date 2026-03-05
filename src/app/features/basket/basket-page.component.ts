import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { BasketStore } from './data/basket.store';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';

@Component({
  selector: 'app-basket-page',
  standalone: true,
  imports: [CurrencyPipe, PageTitleComponent],
  templateUrl: './basket-page.component.html',
  styleUrl: './basket-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasketPageComponent {
  private readonly basketStore = inject(BasketStore);
  private readonly appConfig = inject(APP_CONFIG);

  protected readonly currency = this.appConfig.currency;
  protected readonly items = this.basketStore.items;
  protected readonly totals = this.basketStore.totals;

  protected updateQuantity(workshopId: string, quantity: number): void {
    this.basketStore.updateQuantity(workshopId, quantity);
  }

  protected removeItem(workshopId: string): void {
    this.basketStore.removeWorkshop(workshopId);
  }
}
