import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { BasketStore } from '../basket/data/basket.store';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import {
  forbiddenWordsValidator,
  promoCodeAsyncValidator,
  promoDisposableEmailDomainValidator,
} from './validators/checkout-form.validators';
import { PromoCodeService } from './data/promo-code.service';
import { PaymentCheckoutService } from './data/payment-checkout.service';
import { AutofocusInvalidDirective } from '../../shared/directives/autofocus-invalid.directive';
import { ToastService } from '../../core/services/toast.service';
import {
  DomainError,
  PaymentDeclinedError,
  ServiceUnavailableError,
  ValidationError,
} from '../../core/error-handling/domain-errors';

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
  cardholderName: FormControl<string>;
  cardNumber: FormControl<string>;
  expiryMonth: FormControl<string>;
  expiryYear: FormControl<string>;
  cvc: FormControl<string>;
  acceptTerms: FormControl<boolean>;
  promoCode: FormControl<string>;
  attendeeNames: FormArray<FormControl<string>>;
}

const FORBIDDEN_WORDS = ['test', 'dummy', 'fake'];

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageTitleComponent, AutofocusInvalidDirective],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPageComponent {
  @ViewChild(AutofocusInvalidDirective)
  private readonly autofocusInvalidDirective?: AutofocusInvalidDirective;

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly basketStore = inject(BasketStore);
  private readonly promoCodeService = inject(PromoCodeService);
  private readonly paymentCheckoutService = inject(PaymentCheckoutService);
  private readonly toastService = inject(ToastService);

  protected readonly expectedAttendeeCount = this.basketStore.totalQuantity;
  protected readonly submitAttempted = signal(false);
  protected readonly focusInvalidTrigger = signal(0);
  protected readonly isSubmitting = signal(false);
  protected readonly paymentErrorMessage = signal<string | null>(null);
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
      cardholderName: this.formBuilder.control('', [
        Validators.required,
        Validators.maxLength(100),
        forbiddenWordsValidator(FORBIDDEN_WORDS),
      ]),
      cardNumber: this.formBuilder.control('', [
        Validators.required,
        Validators.pattern(/^[0-9 ]{13,23}$/),
      ]),
      expiryMonth: this.formBuilder.control('', [
        Validators.required,
        Validators.pattern(/^(0[1-9]|1[0-2])$/),
      ]),
      expiryYear: this.formBuilder.control('', [
        Validators.required,
        Validators.pattern(/^\d{2}$/),
      ]),
      cvc: this.formBuilder.control('', [Validators.required, Validators.pattern(/^\d{3,4}$/)]),
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
    void this.submit();
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

    if (this.showErrors(this.checkoutForm.controls.cardholderName)) {
      errors.push('Cardholder name needs attention.');
    }

    if (this.showErrors(this.checkoutForm.controls.cardNumber)) {
      errors.push('Card number needs attention.');
    }

    if (this.showErrors(this.checkoutForm.controls.expiryMonth)) {
      errors.push('Card expiry month needs attention.');
    }

    if (this.showErrors(this.checkoutForm.controls.expiryYear)) {
      errors.push('Card expiry year needs attention.');
    }

    if (this.showErrors(this.checkoutForm.controls.cvc)) {
      errors.push('Card security code needs attention.');
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

  private async submit(): Promise<void> {
    this.submitAttempted.set(true);
    this.paymentErrorMessage.set(null);
    this.submitMessage.set(null);

    if (this.checkoutForm.invalid || this.checkoutForm.pending) {
      this.checkoutForm.markAllAsTouched();
      this.focusInvalidTrigger.update((value) => value + 1);
      this.autofocusInvalidDirective?.focusFirstInvalidControl();
      this.toastService.error('Please fix form errors before checkout.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const normalizedPayload = normalizeCheckoutPayload(this.checkoutForm.getRawValue());
      const intent = await firstValueFrom(
        this.paymentCheckoutService.createPaymentIntent({
          amount: this.basketStore.subtotal(),
          currency: 'GBP',
          customerName: normalizedPayload.customerName,
          customerEmail: normalizedPayload.email,
        }),
      );

      const confirmation = await firstValueFrom(
        this.paymentCheckoutService.confirmPayment({
          paymentIntentId: intent.paymentIntentId,
          clientSecret: intent.clientSecret,
          paymentMethod: normalizedPayload.paymentMethod,
        }),
      );

      if (confirmation.status === 'declined') {
        this.paymentErrorMessage.set('Your card was declined. Please use a different card.');
        return;
      }

      const webhookResult = await firstValueFrom(
        this.paymentCheckoutService.deliverWebhook({
          eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          eventType: 'payment_intent.succeeded',
          paymentIntentId: confirmation.paymentIntentId,
        }),
      );

      if (!webhookResult.bookingId) {
        this.paymentErrorMessage.set(
          'Payment completed, but booking confirmation could not be created.',
        );
        return;
      }

      this.submitMessage.set('Payment completed. Redirecting to your booking confirmation...');
      this.toastService.success('Payment completed successfully.');
      this.checkoutForm.markAsPristine();
      await this.router.navigate(['/account/bookings', webhookResult.bookingId, 'confirmation']);
    } catch (error: unknown) {
      this.paymentErrorMessage.set(mapSubmitErrorToMessage(error));
      this.toastService.error('Payment could not be completed.');
    } finally {
      this.isSubmitting.set(false);
    }
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

function normalizeCheckoutPayload(rawValue: CheckoutFormValue): {
  customerName: string;
  email: string;
  paymentMethod: {
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvc: string;
  };
} {
  return {
    customerName: sanitizeText(rawValue.customerName),
    email: sanitizeEmail(rawValue.email),
    paymentMethod: {
      cardNumber: sanitizeCardNumber(rawValue.cardNumber),
      cardholderName: sanitizeText(rawValue.cardholderName),
      expiryMonth: sanitizeDigits(rawValue.expiryMonth, 2),
      expiryYear: sanitizeDigits(rawValue.expiryYear, 2),
      cvc: sanitizeDigits(rawValue.cvc, 4),
    },
  };
}

function sanitizeText(value: string): string {
  const withoutControlChars = Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint !== undefined && codePoint >= 32 && codePoint !== 127;
    })
    .join('');

  return withoutControlChars.replace(/\s+/g, ' ').trim();
}

function sanitizeEmail(value: string): string {
  return sanitizeText(value).toLowerCase();
}

function sanitizeCardNumber(value: string): string {
  return value.replace(/\D/g, '');
}

function sanitizeDigits(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function mapSubmitErrorToMessage(error: unknown): string {
  if (error instanceof PaymentDeclinedError) {
    return error.userMessage;
  }

  if (error instanceof ValidationError) {
    return 'Payment details were invalid. Please review and try again.';
  }

  if (error instanceof ServiceUnavailableError) {
    return 'Payment service is temporarily unavailable. Please retry in a moment.';
  }

  if (error instanceof DomainError) {
    return error.userMessage;
  }

  return 'Payment could not be completed right now. Please try again.';
}

interface CheckoutFormValue {
  customerName: string;
  email: string;
  phone: string;
  billingAddress: {
    line1: string;
    line2: string;
    city: string;
    postalCode: string;
  };
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  acceptTerms: boolean;
  promoCode: string;
  attendeeNames: string[];
}
