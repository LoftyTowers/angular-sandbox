import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Workshop } from '../../../models/workshop.model';

@Component({
  selector: 'app-workshop-card',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './workshop-card.component.html',
  styleUrl: './workshop-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkshopCardComponent {
  readonly workshop = input.required<Workshop>();
  readonly currency = input.required<string>();
  readonly add = output<Workshop>();

  addToBasket(): void {
    this.add.emit(this.workshop());
  }
}
