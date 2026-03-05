import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { apiBaseUrlInterceptor } from '../../core/interceptors/api-base-url.interceptor';
import { mockApiInterceptor } from '../../core/interceptors/mock-api.interceptor';
import { BasketStore } from '../basket/data/basket.store';
import { CheckoutPageComponent } from './checkout-page.component';

class BasketStoreStub {
  readonly totalQuantity = signal(2);
  readonly subtotal = signal(120);
}

describe('CheckoutPageComponent', () => {
  let fixture: ComponentFixture<CheckoutPageComponent>;
  let component: CheckoutPageComponent;
  let router: Router;

  const getForm = (): FormGroup<{
    email: FormControl<string>;
    promoCode: FormControl<string>;
    attendeeNames: FormArray<FormControl<string>>;
  }> =>
    (
      component as unknown as {
        checkoutForm: FormGroup<{
          email: FormControl<string>;
          promoCode: FormControl<string>;
          attendeeNames: FormArray<FormControl<string>>;
        }>;
      }
    ).checkoutForm;

  const getAttendees = (): FormArray<FormControl<string>> => getForm().controls.attendeeNames;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiBaseUrlInterceptor, mockApiInterceptor])),
        {
          provide: APP_CONFIG,
          useValue: {
            apiBaseUrl: '/api',
            environmentName: 'test',
            currency: 'GBP',
            mockApi: {
              enabled: true,
              minLatencyMs: 0,
              maxLatencyMs: 0,
              transientFailureRate: 0,
            },
          },
        },
        { provide: BasketStore, useClass: BasketStoreStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('creates one attendee control per basket ticket at startup', () => {
    expect(getAttendees().length).toBe(2);
  });

  it('applies cross-field promo and disposable email validation', () => {
    const form = getForm();
    form.controls.email.setValue('person@mailinator.com');
    form.controls.promoCode.setValue('SAVE10');
    form.updateValueAndValidity();

    expect(form.hasError('promoRequiresNonDisposableEmail')).toBe(true);
  });

  it('keeps submit disabled while form is invalid', () => {
    const submitButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;

    expect(submitButton).not.toBeNull();
    expect(submitButton?.disabled).toBe(true);
  });

  it('shows a user-friendly message when payment is declined', async () => {
    setValidCheckoutDetails(getForm(), {
      cardNumber: '4000000000000002',
    });
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    submitButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.textContent as string;
    expect(errorMessage).toContain('Your card was declined. Please use a different card.');
  });

  it('navigates to booking confirmation after successful payment', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    setValidCheckoutDetails(getForm(), {
      cardNumber: '4242424242424242',
    });
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    submitButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    const firstCall = navigateSpy.mock.calls[0]?.[0] as readonly string[] | undefined;
    expect(firstCall?.[0]).toBe('/account/bookings');
    expect(firstCall?.[2]).toBe('confirmation');
  });
});

function setValidCheckoutDetails(
  form: FormGroup<{
    email: FormControl<string>;
    promoCode: FormControl<string>;
    attendeeNames: FormArray<FormControl<string>>;
  }>,
  options: { cardNumber: string },
): void {
  const checkoutForm = form as unknown as FormGroup<{
    customerName: FormControl<string>;
    email: FormControl<string>;
    phone: FormControl<string>;
    cardholderName: FormControl<string>;
    cardNumber: FormControl<string>;
    expiryMonth: FormControl<string>;
    expiryYear: FormControl<string>;
    cvc: FormControl<string>;
    acceptTerms: FormControl<boolean>;
    promoCode: FormControl<string>;
    attendeeNames: FormArray<FormControl<string>>;
    billingAddress: FormGroup<{
      line1: FormControl<string>;
      line2: FormControl<string>;
      city: FormControl<string>;
      postalCode: FormControl<string>;
    }>;
  }>;

  checkoutForm.controls.customerName.setValue('Casey Smith');
  checkoutForm.controls.email.setValue('casey@example.com');
  checkoutForm.controls.phone.setValue('07123456789');
  checkoutForm.controls.cardholderName.setValue('Casey Smith');
  checkoutForm.controls.cardNumber.setValue(options.cardNumber);
  checkoutForm.controls.expiryMonth.setValue('10');
  checkoutForm.controls.expiryYear.setValue('29');
  checkoutForm.controls.cvc.setValue('123');
  checkoutForm.controls.acceptTerms.setValue(true);
  checkoutForm.controls.promoCode.setValue('');
  checkoutForm.controls.billingAddress.controls.line1.setValue('10 Main Street');
  checkoutForm.controls.billingAddress.controls.line2.setValue('');
  checkoutForm.controls.billingAddress.controls.city.setValue('London');
  checkoutForm.controls.billingAddress.controls.postalCode.setValue('SW1A 1AA');
  checkoutForm.controls.attendeeNames.controls.forEach((control, index) =>
    control.setValue(`Attendee ${index + 1}`),
  );
}
