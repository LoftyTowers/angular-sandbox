import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, throwError, timer } from 'rxjs';
import { DomainError } from '../error-handling/domain-errors';
import { ENABLE_GET_RETRY, INLINE_ERROR_HANDLING } from '../error-handling/http-error-context';
import {
  isTransientHttpError,
  mapHttpErrorToDomainError,
} from '../error-handling/http-error.mapper';
import { LoggerService } from '../services/logger.service';
import { ToastService } from '../services/toast.service';

const MAX_GET_RETRIES = 2;
const BASE_BACKOFF_MS = 200;
const MAX_BACKOFF_MS = 1200;

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const logger = inject(LoggerService);
  const toastService = inject(ToastService);
  const retriesEnabled = request.method === 'GET' && request.context.get(ENABLE_GET_RETRY);

  return next(request).pipe(
    retry({
      count: retriesEnabled ? MAX_GET_RETRIES : 0,
      delay: (error, retryAttempt) => {
        if (!(error instanceof HttpErrorResponse) || !isTransientHttpError(error)) {
          return throwError(() => error);
        }

        const backoff = Math.min(BASE_BACKOFF_MS * 2 ** (retryAttempt - 1), MAX_BACKOFF_MS);
        logger.warn('Retrying transient GET request.', {
          url: request.url,
          method: request.method,
          retryAttempt,
          backoffMs: backoff,
          status: error.status,
        });
        return timer(backoff);
      },
    }),
    catchError((error: unknown) => {
      const mappedError = toDomainError(error, request);
      logger.error(
        'HTTP request failed.',
        {
          url: request.url,
          method: request.method,
          status: mappedError.status,
          code: mappedError.code,
        },
        mappedError,
      );

      if (!request.context.get(INLINE_ERROR_HANDLING)) {
        toastService.error(mappedError.userMessage);
      }

      return throwError(() => mappedError);
    }),
  );
};

function toDomainError(error: unknown, request: Parameters<HttpInterceptorFn>[0]): DomainError {
  if (error instanceof DomainError) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    return mapHttpErrorToDomainError(error, request);
  }

  return new DomainError('Unexpected request error.', {
    cause: error,
    userMessage: 'Something went wrong. Please try again.',
    code: 'UNEXPECTED_REQUEST_ERROR',
  });
}
