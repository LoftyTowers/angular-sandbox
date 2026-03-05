import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';

@Component({
  selector: 'app-quantity-stepper',
  standalone: true,
  templateUrl: './quantity-stepper.component.html',
  styleUrl: './quantity-stepper.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuantityStepperComponent {
  readonly value = input.required<number>();
  readonly min = input(1);
  readonly max = input<number | null>(null);
  readonly step = input(1);
  readonly label = input('Quantity');
  @Output() readonly valueChange = new EventEmitter<number>();

  protected decrease(): void {
    this.emit(this.value() - this.step());
  }

  protected increase(): void {
    this.emit(this.value() + this.step());
  }

  protected onInputChange(nextValue: number): void {
    this.emit(nextValue);
  }

  protected canDecrease(): boolean {
    return this.value() <= this.min();
  }

  protected canIncrease(): boolean {
    return this.max() !== null && this.value() >= this.max()!;
  }

  private emit(nextValue: number): void {
    if (!Number.isFinite(nextValue)) {
      return;
    }

    const bounded = clamp(nextValue, this.min(), this.max());
    if (bounded !== this.value()) {
      this.valueChange.emit(bounded);
    }
  }
}

function clamp(value: number, min: number, max: number | null): number {
  const lowerBounded = Math.max(min, Math.round(value));
  if (max === null) {
    return lowerBounded;
  }

  return Math.min(max, lowerBounded);
}
