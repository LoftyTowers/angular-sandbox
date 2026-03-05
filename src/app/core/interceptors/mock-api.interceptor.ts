import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MOCK_TAGS, MOCK_WORKSHOPS } from '../data/mock-workshops.data';
import { APP_CONFIG } from '../config/app-config.token';
import { Workshop } from '../../models/workshop.model';

const API_BASE_PATH = '/api';
const TRANSIENT_FAILURE_CARD_NUMBER = '4000000000009995';
const DECLINED_CARD_NUMBER = '4000000000000002';

type PaymentIntentStatus = 'requires_confirmation' | 'succeeded' | 'declined';
type PaymentConfirmationStatus = 'succeeded' | 'declined';

interface MockPaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  status: PaymentIntentStatus;
  confirmAttempts: number;
}

interface MockBookingRecord {
  id: string;
  paymentIntentId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  createdAt: string;
}

type UserRole = 'user' | 'admin';

interface MockUserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

interface MockLoginRequestBody {
  email: string;
  password: string;
}

interface MockLoginResponseBody {
  token: string;
  profile: MockUserProfile;
}

interface MockTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
}

interface PaymentIntentRequestBody {
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
}

interface PaymentConfirmRequestBody {
  paymentIntentId: string;
  clientSecret: string;
  paymentMethod: {
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvc: string;
  };
}

interface PaymentWebhookRequestBody {
  eventId: string;
  eventType: 'payment_intent.succeeded';
  paymentIntentId: string;
}

interface PaymentIntentResponseBody {
  paymentIntentId: string;
  clientSecret: string;
}

interface PaymentConfirmResponseBody {
  status: PaymentConfirmationStatus;
  paymentIntentId: string;
  message: string;
}

interface PaymentWebhookResponseBody {
  bookingId: string;
  duplicateEvent: boolean;
  duplicateDeliverySimulated: boolean;
}

const paymentIntents = new Map<string, MockPaymentIntent>();
const processedWebhookEvents = new Set<string>();
const bookingIdByIntentId = new Map<string, string>();
const bookingsById = new Map<string, MockBookingRecord>();
const knownUsers = new Map<string, MockUserProfile>([
  [
    'demo@workshops.test',
    {
      id: 'usr_demo',
      email: 'demo@workshops.test',
      displayName: 'Demo User',
      role: 'user',
    },
  ],
  [
    'admin@workshops.test',
    {
      id: 'usr_admin',
      email: 'admin@workshops.test',
      displayName: 'Admin User',
      role: 'admin',
    },
  ],
]);
let paymentIntentCounter = 0;
let bookingCounter = 0;

export const mockApiInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(APP_CONFIG).mockApi;
  if (!config.enabled) {
    return next(request);
  }

  const pathname = getPathName(request.url);
  if (!pathname.startsWith(API_BASE_PATH)) {
    return next(request);
  }

  return withMockLatency(
    request,
    () => handleMockRequest(pathname, request, request.method),
    config,
    {
      allowRandomTransientFailure: request.method === 'GET',
    },
  );
};

function withMockLatency(
  request: HttpRequest<unknown>,
  resolver: () => Observable<HttpEvent<unknown>>,
  config: {
    minLatencyMs: number;
    maxLatencyMs: number;
    transientFailureRate: number;
  },
  options: {
    allowRandomTransientFailure: boolean;
  },
): Observable<HttpEvent<unknown>> {
  const minimum = Math.max(0, Math.min(config.minLatencyMs, config.maxLatencyMs));
  const maximum = Math.max(config.minLatencyMs, config.maxLatencyMs);
  const latency = minimum + Math.floor(Math.random() * (maximum - minimum + 1));

  return timer(latency).pipe(
    switchMap(() => {
      if (options.allowRandomTransientFailure && Math.random() < config.transientFailureRate) {
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 503,
              statusText: 'Service Unavailable',
              url: request.url,
              error: { message: 'Transient mock API failure. Retry the request.' },
            }),
        );
      }

      return resolver();
    }),
  );
}

function handleMockRequest(
  pathname: string,
  request: HttpRequest<unknown>,
  method: string,
): Observable<HttpEvent<unknown>> {
  if (method === 'GET') {
    return handleMockGetRequest(pathname, request);
  }

  if (method === 'POST') {
    return handleMockPostRequest(pathname, request);
  }

  return throwError(
    () =>
      new HttpErrorResponse({
        status: 405,
        statusText: 'Method Not Allowed',
        url: request.url,
        error: { message: 'Mock API method not supported.' },
      }),
  );
}

function handleMockGetRequest(
  pathname: string,
  request: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> {
  if (pathname === '/api/account/bookings') {
    let tokenPayload: MockTokenPayload;
    try {
      tokenPayload = getAuthorizedTokenPayload(request);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        return throwError(() => error);
      }

      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            url: request.url,
            error: { message: 'Invalid auth state.' },
          }),
      );
    }

    const bookings =
      tokenPayload.role === 'admin'
        ? Array.from(bookingsById.values())
        : Array.from(bookingsById.values()).filter(
            (booking) => booking.customerEmail.toLowerCase() === tokenPayload.email.toLowerCase(),
          );

    return of(
      new HttpResponse<readonly MockBookingRecord[]>({
        status: 200,
        body: bookings,
        url: request.url,
      }),
    );
  }

  if (pathname === '/api/bookings') {
    return of(
      new HttpResponse<readonly MockBookingRecord[]>({
        status: 200,
        body: Array.from(bookingsById.values()),
        url: request.url,
      }),
    );
  }

  const bookingId = extractBookingId(pathname);
  if (bookingId) {
    const booking = bookingsById.get(bookingId);
    if (!booking) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            statusText: 'Not Found',
            url: request.url,
            error: { message: 'Booking not found.' },
          }),
      );
    }

    return of(
      new HttpResponse<MockBookingRecord>({
        status: 200,
        body: booking,
        url: request.url,
      }),
    );
  }

  if (pathname === '/api/workshops') {
    return of(
      new HttpResponse<readonly Workshop[]>({
        status: 200,
        body: MOCK_WORKSHOPS,
        url: request.url,
      }),
    );
  }

  if (pathname === '/api/tags') {
    return of(
      new HttpResponse<readonly string[]>({
        status: 200,
        body: MOCK_TAGS,
        url: request.url,
      }),
    );
  }

  const promoCode = extractPromoCode(pathname);
  if (promoCode) {
    const validPromoCodes = new Set(['save10', 'earlybird', 'vip20']);
    return of(
      new HttpResponse<{ valid: boolean }>({
        status: 200,
        body: { valid: validPromoCodes.has(promoCode.toLowerCase()) },
        url: request.url,
      }),
    );
  }

  const workshopId = extractWorkshopId(pathname);
  if (workshopId) {
    const workshop = MOCK_WORKSHOPS.find((candidate) => candidate.id === workshopId);
    if (!workshop) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            statusText: 'Not Found',
            url: request.url,
            error: { message: 'Workshop not found.' },
          }),
      );
    }

    return of(
      new HttpResponse<Workshop>({
        status: 200,
        body: workshop,
        url: request.url,
      }),
    );
  }

  return throwError(
    () =>
      new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        url: request.url,
        error: { message: 'Mock API endpoint not found.' },
      }),
  );
}

function handleMockPostRequest(
  pathname: string,
  request: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> {
  if (pathname === '/api/auth/login') {
    return handleLogin(request);
  }

  if (pathname === '/api/auth/logout') {
    return of(
      new HttpResponse<null>({
        status: 204,
        body: null,
        url: request.url,
      }),
    );
  }

  if (pathname === '/api/payments/intent') {
    return createPaymentIntent(request);
  }

  if (pathname === '/api/payments/confirm') {
    return confirmPaymentIntent(request);
  }

  if (pathname === '/api/payments/webhook') {
    return processPaymentWebhook(request);
  }

  return throwError(
    () =>
      new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        url: request.url,
        error: { message: 'Mock API endpoint not found.' },
      }),
  );
}

function handleLogin(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
  const body = request.body as Partial<MockLoginRequestBody> | null;
  if (!body || !isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          url: request.url,
          error: { message: 'Email and password are required.' },
        }),
    );
  }

  if (body.password.length < 8) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: request.url,
          error: { message: 'Invalid credentials.' },
        }),
    );
  }

  const user = knownUsers.get(body.email.trim().toLowerCase());
  if (!user) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: request.url,
          error: { message: 'Invalid credentials.' },
        }),
    );
  }

  const expiresAtSeconds = Math.floor(Date.now() / 1000) + 60 * 60;
  const token = buildMockJwt({
    sub: user.id,
    email: user.email,
    name: user.displayName,
    role: user.role,
    exp: expiresAtSeconds,
  });

  return of(
    new HttpResponse<MockLoginResponseBody>({
      status: 200,
      body: {
        token,
        profile: user,
      },
      url: request.url,
    }),
  );
}

function createPaymentIntent(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
  const body = request.body as Partial<PaymentIntentRequestBody> | null;
  if (
    !body ||
    !isFiniteAmount(body.amount) ||
    !isNonEmptyString(body.currency) ||
    !isNonEmptyString(body.customerName) ||
    !isNonEmptyString(body.customerEmail)
  ) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          url: request.url,
          error: { message: 'Invalid payment intent payload.' },
        }),
    );
  }

  const paymentIntentId = `pi_${Date.now()}_${++paymentIntentCounter}`;
  const clientSecret = `pi_secret_${Math.random().toString(36).slice(2)}_${paymentIntentCounter}`;
  paymentIntents.set(paymentIntentId, {
    id: paymentIntentId,
    clientSecret,
    amount: body.amount,
    currency: body.currency.toUpperCase(),
    customerName: body.customerName,
    customerEmail: body.customerEmail,
    status: 'requires_confirmation',
    confirmAttempts: 0,
  });

  return of(
    new HttpResponse<PaymentIntentResponseBody>({
      status: 201,
      body: {
        paymentIntentId,
        clientSecret,
      },
      url: request.url,
    }),
  );
}

function confirmPaymentIntent(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
  const body = request.body as Partial<PaymentConfirmRequestBody> | null;
  if (
    !body ||
    !isNonEmptyString(body.paymentIntentId) ||
    !isNonEmptyString(body.clientSecret) ||
    !body.paymentMethod ||
    !isNonEmptyString(body.paymentMethod.cardNumber) ||
    !isNonEmptyString(body.paymentMethod.cardholderName) ||
    !isNonEmptyString(body.paymentMethod.expiryMonth) ||
    !isNonEmptyString(body.paymentMethod.expiryYear) ||
    !isNonEmptyString(body.paymentMethod.cvc)
  ) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          url: request.url,
          error: { message: 'Invalid payment confirmation payload.' },
        }),
    );
  }

  const paymentIntent = paymentIntents.get(body.paymentIntentId);
  if (!paymentIntent || paymentIntent.clientSecret !== body.clientSecret) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 404,
          statusText: 'Not Found',
          url: request.url,
          error: { message: 'Payment intent not found.' },
        }),
    );
  }

  paymentIntent.confirmAttempts += 1;
  const normalizedCardNumber = body.paymentMethod.cardNumber.replace(/\s+/g, '');
  if (
    normalizedCardNumber === TRANSIENT_FAILURE_CARD_NUMBER &&
    paymentIntent.confirmAttempts === 1
  ) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 503,
          statusText: 'Service Unavailable',
          url: request.url,
          error: { message: 'Transient payment network error. Retry confirmation.' },
        }),
    );
  }

  if (normalizedCardNumber === DECLINED_CARD_NUMBER) {
    paymentIntent.status = 'declined';
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 402,
          statusText: 'Payment Required',
          url: request.url,
          error: {
            code: 'PAYMENT_DECLINED',
            message: 'The payment method was declined by the issuer.',
          },
        }),
    );
  }

  paymentIntent.status = 'succeeded';
  return of(
    new HttpResponse<PaymentConfirmResponseBody>({
      status: 200,
      body: {
        status: 'succeeded',
        paymentIntentId: paymentIntent.id,
        message: 'Payment confirmed.',
      },
      url: request.url,
    }),
  );
}

function processPaymentWebhook(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
  const body = request.body as Partial<PaymentWebhookRequestBody> | null;
  if (
    !body ||
    !isNonEmptyString(body.eventId) ||
    body.eventType !== 'payment_intent.succeeded' ||
    !isNonEmptyString(body.paymentIntentId)
  ) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          url: request.url,
          error: { message: 'Invalid webhook payload.' },
        }),
    );
  }

  let firstResult: { bookingId: string; duplicateEvent: boolean };
  try {
    firstResult = processWebhookEvent(body.eventId, body.paymentIntentId);
    processWebhookEvent(body.eventId, body.paymentIntentId);
  } catch (error) {
    return throwError(() =>
      error instanceof HttpErrorResponse
        ? error
        : new HttpErrorResponse({
            status: 500,
            statusText: 'Internal Server Error',
            url: request.url,
            error: { message: 'Unexpected webhook processing error.' },
          }),
    );
  }

  return of(
    new HttpResponse<PaymentWebhookResponseBody>({
      status: 200,
      body: {
        bookingId: firstResult.bookingId,
        duplicateEvent: firstResult.duplicateEvent,
        duplicateDeliverySimulated: true,
      },
      url: request.url,
    }),
  );
}

function processWebhookEvent(
  eventId: string,
  paymentIntentId: string,
): { bookingId: string; duplicateEvent: boolean } {
  const existingBookingId = bookingIdByIntentId.get(paymentIntentId);
  if (processedWebhookEvents.has(eventId)) {
    return { bookingId: existingBookingId ?? '', duplicateEvent: true };
  }

  processedWebhookEvents.add(eventId);
  if (existingBookingId) {
    return { bookingId: existingBookingId, duplicateEvent: false };
  }

  const paymentIntent = paymentIntents.get(paymentIntentId);
  if (!paymentIntent || paymentIntent.status !== 'succeeded') {
    throw new HttpErrorResponse({
      status: 409,
      statusText: 'Conflict',
      error: { message: 'Cannot create booking for unpaid intent.' },
    });
  }

  const bookingId = `bk_${Date.now()}_${++bookingCounter}`;
  bookingsById.set(bookingId, {
    id: bookingId,
    paymentIntentId: paymentIntent.id,
    customerName: paymentIntent.customerName,
    customerEmail: paymentIntent.customerEmail,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    createdAt: new Date().toISOString(),
  });
  bookingIdByIntentId.set(paymentIntent.id, bookingId);

  return { bookingId, duplicateEvent: false };
}

function getPathName(url: string): string {
  return new URL(url, 'http://localhost').pathname;
}

function getAuthorizedTokenPayload(request: HttpRequest<unknown>): MockTokenPayload {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: request.url ?? undefined,
      error: { message: 'Missing Authorization header.' },
    });
  }

  const token = authorization.slice('Bearer '.length).trim();
  const payload = decodeMockJwtPayload(token);
  if (!payload || payload.exp * 1000 <= Date.now()) {
    throw new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: request.url ?? undefined,
      error: { message: 'Token is invalid or expired.' },
    });
  }

  return payload;
}

function extractWorkshopId(pathname: string): string | null {
  const match = /^\/api\/workshops\/([^/]+)$/.exec(pathname);
  const workshopId = match?.[1];
  return workshopId ? decodeURIComponent(workshopId) : null;
}

function extractPromoCode(pathname: string): string | null {
  const match = /^\/api\/promo\/([^/]+)$/.exec(pathname);
  const promoCode = match?.[1];
  return promoCode ? decodeURIComponent(promoCode) : null;
}

function extractBookingId(pathname: string): string | null {
  const match = /^\/api\/bookings\/([^/]+)$/.exec(pathname);
  const bookingId = match?.[1];
  return bookingId ? decodeURIComponent(bookingId) : null;
}

function isFiniteAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function buildMockJwt(payload: MockTokenPayload): string {
  const header = encodeBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(payload));
  return `${header}.${body}.mock`;
}

function decodeMockJwtPayload(token: string): MockTokenPayload | null {
  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  try {
    const json = decodeBase64Url(segments[1] ?? '');
    const parsed = JSON.parse(json) as Partial<MockTokenPayload>;
    if (
      typeof parsed.sub !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.name !== 'string' ||
      (parsed.role !== 'user' && parsed.role !== 'admin') ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }

    return parsed as MockTokenPayload;
  } catch {
    return null;
  }
}

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}
