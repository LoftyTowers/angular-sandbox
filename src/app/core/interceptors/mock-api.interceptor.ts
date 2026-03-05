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

export const mockApiInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(APP_CONFIG).mockApi;
  if (!config.enabled || request.method !== 'GET') {
    return next(request);
  }

  const pathname = getPathName(request.url);
  if (!pathname.startsWith(API_BASE_PATH)) {
    return next(request);
  }

  return withMockLatency(request, () => handleMockGetRequest(pathname, request), config);
};

function withMockLatency(
  request: HttpRequest<unknown>,
  resolver: () => Observable<HttpEvent<unknown>>,
  config: {
    minLatencyMs: number;
    maxLatencyMs: number;
    transientFailureRate: number;
  },
): Observable<HttpEvent<unknown>> {
  const minimum = Math.max(0, Math.min(config.minLatencyMs, config.maxLatencyMs));
  const maximum = Math.max(config.minLatencyMs, config.maxLatencyMs);
  const latency = minimum + Math.floor(Math.random() * (maximum - minimum + 1));

  return timer(latency).pipe(
    switchMap(() => {
      if (Math.random() < config.transientFailureRate) {
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

function handleMockGetRequest(
  pathname: string,
  request: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> {
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

function getPathName(url: string): string {
  return new URL(url, 'http://localhost').pathname;
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
