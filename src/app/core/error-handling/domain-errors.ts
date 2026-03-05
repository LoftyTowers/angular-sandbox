export interface DomainErrorOptions {
  cause?: unknown;
  code?: string;
  status?: number;
  userMessage?: string;
  retryable?: boolean;
}

export class DomainError extends Error {
  readonly code: string | null;
  readonly status: number | null;
  readonly userMessage: string;
  readonly retryable: boolean;

  constructor(message: string, options?: DomainErrorOptions) {
    super(message, { cause: options?.cause });
    this.name = new.target.name;
    this.code = options?.code ?? null;
    this.status = options?.status ?? null;
    this.userMessage = options?.userMessage ?? 'Something went wrong. Please try again.';
    this.retryable = options?.retryable ?? false;
  }
}

export class PaymentDeclinedError extends DomainError {
  constructor(message = 'Payment was declined by the issuer.', options?: DomainErrorOptions) {
    super(message, {
      ...options,
      userMessage: 'Your card was declined. Please use a different card.',
      code: options?.code ?? 'PAYMENT_DECLINED',
      status: options?.status ?? 402,
      retryable: false,
    });
  }
}

export class AuthenticationError extends DomainError {
  constructor(message = 'Authentication is required.', options?: DomainErrorOptions) {
    super(message, {
      ...options,
      userMessage: 'Please sign in and try again.',
      code: options?.code ?? 'AUTH_REQUIRED',
      status: options?.status ?? 401,
      retryable: false,
    });
  }
}

export class AuthorizationError extends DomainError {
  constructor(
    message = 'You are not allowed to perform this action.',
    options?: DomainErrorOptions,
  ) {
    super(message, {
      ...options,
      userMessage: 'You do not have permission to perform this action.',
      code: options?.code ?? 'FORBIDDEN',
      status: options?.status ?? 403,
      retryable: false,
    });
  }
}

export class ValidationError extends DomainError {
  constructor(message = 'Request validation failed.', options?: DomainErrorOptions) {
    super(message, {
      ...options,
      userMessage: 'Some details are invalid. Please review and try again.',
      code: options?.code ?? 'VALIDATION_ERROR',
      status: options?.status ?? 400,
      retryable: false,
    });
  }
}

export class ResourceNotFoundError extends DomainError {
  constructor(message = 'Requested resource was not found.', options?: DomainErrorOptions) {
    super(message, {
      ...options,
      userMessage: 'The requested information could not be found.',
      code: options?.code ?? 'NOT_FOUND',
      status: options?.status ?? 404,
      retryable: false,
    });
  }
}

export class ServiceUnavailableError extends DomainError {
  constructor(message = 'Service is temporarily unavailable.', options?: DomainErrorOptions) {
    super(message, {
      ...options,
      userMessage: 'Service is temporarily unavailable. Please try again shortly.',
      code: options?.code ?? 'SERVICE_UNAVAILABLE',
      status: options?.status ?? 503,
      retryable: true,
    });
  }
}

export class ApiRequestError extends DomainError {
  constructor(message = 'API request failed.', options?: DomainErrorOptions) {
    super(message, {
      ...options,
      userMessage: options?.userMessage ?? 'Request failed. Please try again.',
      code: options?.code ?? 'API_REQUEST_FAILED',
    });
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
