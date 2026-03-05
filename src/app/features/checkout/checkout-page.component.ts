import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BasketStore } from '../basket/data/basket.store';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import {
  forbiddenWordsValidator,
  promoCodeAsyncValidator,
  promoDisposableEmailDomainValidator,
} from './validators/checkout-form.validators';
import { PromoCodeService } from './data/promo-code.service';

interface BillingAddressFormControls {
  line1: FormControl<string>;
  line2: FormControl<string>;
  city: FormControl<string>;
  postalCode: FormControl<string>;
}

interface CheckoutFormControls {
  customerName: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  billingAddress: FormGroup<BillingAddressFormControls>;
  acceptTerms: FormControl<boolean>;
  promoCode: FormControl<string>;
  attendeeNames: FormArray<FormControl<string>>;
}

const FORBIDDEN_WORDS = ['test', 'dummy', 'fake'];

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageTitleComponent],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly basketStore = inject(BasketStore);
  private readonly promoCodeService = inject(PromoCodeService);

  protected readonly expectedAttendeeCount = this.basketStore.totalQuantity;
  protected readonly submitAttempted = signal(false);
  protected readonly submitMessage = signal<string | null>(null);
  protected readonly checkoutForm = this.formBuilder.group<CheckoutFormControls>(
    {
      customerName: this.formBuilder.control('', [
        Validators.required,
        Validators.maxLength(100),
        forbiddenWordsValidator(FORBIDDEN_WORDS),
      ]),
      email: this.formBuilder.control('', [
        Validators.required,
        Validators.email,
        Validators.maxLength(254),
      ]),
      phone: this.formBuilder.control('', [Validators.maxLength(20)]),
      billingAddress: this.formBuilder.group<BillingAddressFormControls>({
        line1: this.formBuilder.control('', [
          Validators.required,
          Validators.maxLength(120),
          forbiddenWordsValidator(FORBIDDEN_WORDS),
        ]),
        line2: this.formBuilder.control('', [Validators.maxLength(120)]),
        city: this.formBuilder.control('', [Validators.required, Validators.maxLength(80)]),
        postalCode: this.formBuilder.control('', [Validators.required, Validators.maxLength(16)]),
      }),
      acceptTerms: this.formBuilder.control(false, [Validators.requiredTrue]),
      promoCode: this.formBuilder.control('', {
        validators: [Validators.maxLength(32), forbiddenWordsValidator(FORBIDDEN_WORDS)],
        asyncValidators: [promoCodeAsyncValidator(this.promoCodeService)],
        updateOn: 'blur',
      }),
      attendeeNames: this.formBuilder.array(
        createAttendeeControls(this.formBuilder, this.expectedAttendeeCount()),
      ),
    },
    { validators: [promoDisposableEmailDomainValidator()] },
  );
  protected readonly attendeeNames = this.checkoutForm.controls.attendeeNames;
  protected readonly hasSummary = computed(() => this.formSummaryErrors().length > 0);

  hasPendingChanges(): boolean {
    return this.checkoutForm.dirty;
  }

  protected addAttendee(): void {
    this.attendeeNames.push(createAttendeeControl(this.formBuilder));
  }

  protected removeAttendee(index: number): void {
    if (index < 0 || index >= this.attendeeNames.length) {
      return;
    }

    this.attendeeNames.removeAt(index);
  }

  protected onSubmit(): void {
    this.submitAttempted.set(true);
    this.submitMessage.set(null);

    if (this.checkoutForm.invalid || this.checkoutForm.pending) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.submitMessage.set('Checkout details are valid. Payment integration is in the next task.');
    this.checkoutForm.markAsPristine();
  }

  protected showErrors(control: AbstractControl | null): boolean {
    if (!control) {
      return false;
    }

    return control.invalid && (control.touched || control.dirty);
  }

  protected formSummaryErrors(): readonly string[] {
    const errors: string[] = [];

    if (!this.submitAttempted()) {
      return errors;
    }

    if (this.checkoutForm.hasError('promoRequiresNonDisposableEmail')) {
      errors.push('Promo codes cannot be used with disposable email domains.');
    }

    if (this.showErrors(this.checkoutForm.controls.customerName)) {
      errors.push('Customer name needs attention.');
    }

    if (this.showErrors(this.checkoutForm.controls.email)) {
      errors.push('Email address needs attention.');
    }

    if (this.showErrors(this.checkoutForm.controls.acceptTerms)) {
      errors.push('You must accept the terms to continue.');
    }

    if (this.showErrors(this.checkoutForm.controls.promoCode)) {
      errors.push('Promo code needs attention.');
    }

    this.attendeeNames.controls.forEach((control, index) => {
      if (this.showErrors(control)) {
        errors.push(`Attendee #${index + 1} needs a valid name.`);
      }
    });

    return errors;
  }
}

function createAttendeeControls(
  formBuilder: NonNullableFormBuilder,
  count: number,
): FormControl<string>[] {
  return Array.from({ length: Math.max(0, count) }, () => createAttendeeControl(formBuilder));
}

function createAttendeeControl(formBuilder: NonNullableFormBuilder): FormControl<string> {
  return formBuilder.control('', [
    Validators.required,
    Validators.maxLength(100),
    forbiddenWordsValidator(FORBIDDEN_WORDS),
  ]);
}
