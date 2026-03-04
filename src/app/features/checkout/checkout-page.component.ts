import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { inject } from '@angular/core';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageTitleComponent],
  templateUrl: './checkout-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPageComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly checkoutForm = this.formBuilder.group({
    attendeeName: ['', [Validators.required]],
  });

  hasPendingChanges(): boolean {
    return this.checkoutForm.dirty;
  }
}
