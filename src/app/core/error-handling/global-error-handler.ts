import { ErrorHandler, Injectable, inject } from '@angular/core';
import { DomainError } from './domain-errors';
import { LoggerService } from '../services/logger.service';
import { ToastService } from '../services/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  handleError(error: unknown): void {
    const normalizedError = normalizeError(error);
    this.logger.captureError(normalizedError, { source: 'GlobalErrorHandler' });

    if (!(normalizedError instanceof DomainError)) {
      this.toastService.error('Something went wrong. Please refresh and try again.');
    }
  }
}

function normalizeError(error: unknown): unknown {
  if (isObjectWithKey(error, 'rejection')) {
    return error.rejection;
  }

  if (isObjectWithKey(error, 'originalError')) {
    return error.originalError;
  }

  return error;
}

function isObjectWithKey<TKey extends string>(
  value: unknown,
  key: TKey,
): value is Record<TKey, unknown> {
  return typeof value === 'object' && value !== null && key in value;
}
