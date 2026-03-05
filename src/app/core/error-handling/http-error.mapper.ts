import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import {
  ApiRequestError,
  AuthenticationError,
  AuthorizationError,
  DomainError,
  PaymentDeclinedError,
  ResourceNotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from './domain-errors';

interface ApiErrorBody {
  message?: unknown;
  code?: unknown;
}

const TRANSIENT_HTTP_STATUSES = new Set([0, 408, 429, 500, 502, 503, 504]);

export function isTransientHttpError(error: HttpErrorResponse): boolean {
  return TRANSIENT_HTTP_STATUSES.has(error.status);
}

export function mapHttpErrorToDomainError(
  error: HttpErrorResponse,
  request: HttpRequest<unknown>,
): DomainError {
  const body = toApiErrorBody(error.error);
  const message = readMessage(body) ?? error.message ?? 'API request failed.';
  const code = readCode(body);

  if (code === 'PAYMENT_DECLINED' || error.status === 402) {
    return new PaymentDeclinedError(message, createErrorOptions(error, code));
  }

  if (error.status === 400) {
    return new ValidationError(message, createErrorOptions(error, code));
  }

  if (error.status === 401) {
    return new AuthenticationError(message, createErrorOptions(error, code));
  }

  if (error.status === 403) {
    return new AuthorizationError(message, createErrorOptions(error, code));
  }

  if (error.status === 404) {
    return new ResourceNotFoundError(message, createErrorOptions(error, code));
  }

  if (isTransientHttpError(error)) {
    return new ServiceUnavailableError(message, createErrorOptions(error, code));
  }

  return new ApiRequestError(
    message,
    withUserMessage(createErrorOptions(error, code), buildFallbackUserMessage(request.method)),
  );
}

function buildFallbackUserMessage(method: string): string {
  if (method === 'GET') {
    return 'Unable to load data right now. Please refresh and try again.';
  }

  return 'Request could not be completed right now. Please try again.';
}

function toApiErrorBody(value: unknown): ApiErrorBody | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as ApiErrorBody;
}

function readCode(body: ApiErrorBody | null): string | undefined {
  return typeof body?.code === 'string' ? body.code : undefined;
}

function readMessage(body: ApiErrorBody | null): string | undefined {
  return typeof body?.message === 'string' ? body.message : undefined;
}

function createErrorOptions(
  error: HttpErrorResponse,
  code?: string,
): {
  cause: HttpErrorResponse;
  status?: number;
  code?: string;
} {
  const options: {
    cause: HttpErrorResponse;
    status?: number;
    code?: string;
  } = { cause: error };

  if (error.status > 0) {
    options.status = error.status;
  }

  if (code) {
    options.code = code;
  }

  return options;
}

function withUserMessage<T extends { cause: HttpErrorResponse }>(
  options: T,
  userMessage: string,
): T & { userMessage: string } {
  return {
    ...options,
    userMessage,
  };
}
