import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { apiBaseUrlInterceptor } from '../../core/interceptors/api-base-url.interceptor';
import { mockApiInterceptor } from '../../core/interceptors/mock-api.interceptor';
import { BasketStore } from '../basket/data/basket.store';
import { CheckoutPageComponent } from './checkout-page.component';

class BasketStoreStub {
  readonly totalQuantity = signal(2);
}

describe('CheckoutPageComponent', () => {
  let fixture: ComponentFixture<CheckoutPageComponent>;
  let component: CheckoutPageComponent;

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
});
