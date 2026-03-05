import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '../config/app-config.token';
import { PaymentDeclinedError, ServiceUnavailableError } from '../error-handling/domain-errors';
import { LoggerService } from '../services/logger.service';
import { apiErrorInterceptor } from './api-error.interceptor';
import { apiBaseUrlInterceptor } from './api-base-url.interceptor';
import { mockApiInterceptor } from './mock-api.interceptor';

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let logger: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([apiErrorInterceptor, apiBaseUrlInterceptor, mockApiInterceptor]),
        ),
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
    logger = TestBed.inject(LoggerService);
  });

  it('maps payment declined API errors to PaymentDeclinedError', async () => {
    const intent = await firstValueFrom(
      http.post<{ paymentIntentId: string; clientSecret: string }>('/payments/intent', {
        amount: 120,
        currency: 'GBP',
        customerName: 'Casey Smith',
        customerEmail: 'casey@example.com',
      }),
    );

    await expect(
      firstValueFrom(
        http.post('/payments/confirm', {
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
    ).rejects.toBeInstanceOf(PaymentDeclinedError);
  });

  it('retries transient GET failures with bounded retries', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([apiErrorInterceptor, apiBaseUrlInterceptor, mockApiInterceptor]),
        ),
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
              transientFailureRate: 1,
            },
          },
        },
      ],
    });

    const transientHttp = TestBed.inject(HttpClient);
    const warnSpy = vi.spyOn(TestBed.inject(LoggerService), 'warn');

    await expect(firstValueFrom(transientHttp.get('/workshops'))).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('does not retry transient POST failures', async () => {
    const warnSpy = vi.spyOn(logger, 'warn');
    const intent = await firstValueFrom(
      http.post<{ paymentIntentId: string; clientSecret: string }>('/payments/intent', {
        amount: 120,
        currency: 'GBP',
        customerName: 'Casey Smith',
        customerEmail: 'casey@example.com',
      }),
    );

    await expect(
      firstValueFrom(
        http.post('/payments/confirm', {
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
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
