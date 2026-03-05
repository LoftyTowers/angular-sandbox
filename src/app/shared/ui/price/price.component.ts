import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MoneyPipe } from '../../pipes/money.pipe';

@Component({
  selector: 'app-price',
  standalone: true,
  imports: [MoneyPipe],
  templateUrl: './price.component.html',
  styleUrl: './price.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceComponent {
  readonly amount = input.required<number>();
  readonly currency = input('GBP');
  readonly label = input<string | null>(null);
}
