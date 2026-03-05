import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '../config/app-config.token';
import { apiBaseUrlInterceptor } from './api-base-url.interceptor';
import { mockApiInterceptor } from './mock-api.interceptor';
import {
  BookingRecord,
  ConfirmPaymentResponse,
  CreatePaymentIntentResponse,
  PaymentWebhookResponse,
} from '../../features/checkout/data/payment-checkout.service';

function createIntent(http: HttpClient): Promise<CreatePaymentIntentResponse> {
  return firstValueFrom(
    http.post<CreatePaymentIntentResponse>('/payments/intent', {
      amount: 120,
      currency: 'GBP',
      customerName: 'Casey Smith',
      customerEmail: 'casey@example.com',
    }),
  );
}

describe('mockApiInterceptor payment flow', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
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
      ],
    });

    http = TestBed.inject(HttpClient);
  });

  it('returns payment-required error for declined card number', async () => {
    const intent = await createIntent(http);

    await expect(
      firstValueFrom(
        http.post<ConfirmPaymentResponse>('/payments/confirm', {
          paymentIntentId: intent.paymentIntentId,
          clientSecret: intent.clientSecret,
          paymentMethod: {
            cardNumber: '4000000000000002',
            cardholderName: 'Casey Smith',
            expiryMonth: '10',
            expiryYear: '29',
            cvc: '123',
          },
        }),
      ),
    ).rejects.toMatchObject({ status: 402 });
  });

  it('simulates transient failure on first confirm attempt and then succeeds', async () => {
    const intent = await createIntent(http);

    await expect(
      firstValueFrom(
        http.post<ConfirmPaymentResponse>('/payments/confirm', {
          paymentIntentId: intent.paymentIntentId,
          clientSecret: intent.clientSecret,
          paymentMethod: {
            cardNumber: '4000000000009995',
            cardholderName: 'Casey Smith',
            expiryMonth: '10',
            expiryYear: '29',
            cvc: '123',
          },
        }),
      ),
    ).rejects.toMatchObject({ status: 503 });

    const retryResponse = await firstValueFrom(
      http.post<ConfirmPaymentResponse>('/payments/confirm', {
        paymentIntentId: intent.paymentIntentId,
        clientSecret: intent.clientSecret,
        paymentMethod: {
          cardNumber: '4000000000009995',
          cardholderName: 'Casey Smith',
          expiryMonth: '10',
          expiryYear: '29',
          cvc: '123',
        },
      }),
    );

    expect(retryResponse.status).toBe('succeeded');
  });

  it('processes duplicate webhook events idempotently and creates one booking', async () => {
    const bookingsBefore = await firstValueFrom(http.get<readonly BookingRecord[]>('/bookings'));
    const intent = await createIntent(http);

    const confirmation = await firstValueFrom(
      http.post<ConfirmPaymentResponse>('/payments/confirm', {
        paymentIntentId: intent.paymentIntentId,
        clientSecret: intent.clientSecret,
        paymentMethod: {
          cardNumber: '4242424242424242',
          cardholderName: 'Casey Smith',
          expiryMonth: '10',
          expiryYear: '29',
          cvc: '123',
        },
      }),
    );

    expect(confirmation.status).toBe('succeeded');

    const eventId = `evt_duplicate_test_${Date.now()}`;

    const firstDelivery = await firstValueFrom(
      http.post<PaymentWebhookResponse>('/payments/webhook', {
        eventId,
        eventType: 'payment_intent.succeeded',
        paymentIntentId: intent.paymentIntentId,
      }),
    );

    const secondDelivery = await firstValueFrom(
      http.post<PaymentWebhookResponse>('/payments/webhook', {
        eventId,
        eventType: 'payment_intent.succeeded',
        paymentIntentId: intent.paymentIntentId,
      }),
    );

    const bookingsAfter = await firstValueFrom(http.get<readonly BookingRecord[]>('/bookings'));
    const intentBookings = bookingsAfter.filter(
      (booking) => booking.paymentIntentId === intent.paymentIntentId,
    );

    expect(firstDelivery.bookingId).toBeTruthy();
    expect(secondDelivery.bookingId).toBe(firstDelivery.bookingId);
    expect(intentBookings.length).toBe(1);
    expect(bookingsAfter.length).toBe(bookingsBefore.length + 1);
  });
});
