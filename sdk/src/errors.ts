export class IntellectMemoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly details?: Record<string, unknown>,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'IntellectMemoryError';
  }
}

export class AuthenticationError extends IntellectMemoryError {
  constructor(message = 'Invalid or missing API key') {
    super(message, 'AUTHENTICATION_FAILED', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends IntellectMemoryError {
  constructor(message = 'Insufficient permissions', scope?: string) {
    super(message, 'INSUFFICIENT_SCOPE', 403, scope ? { required_scope: scope } : undefined);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends IntellectMemoryError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, { resource, id });
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends IntellectMemoryError {
  constructor(
    public readonly retryAfter: number,
    public readonly limit: number,
    public readonly remaining: number
  ) {
    super(`Rate limit exceeded. Retry after ${retryAfter} seconds.`, 'RATE_LIMITED', 429, {
      retry_after: retryAfter,
      limit,
      remaining,
    });
    this.name = 'RateLimitError';
  }
}

export class QuotaExceededError extends IntellectMemoryError {
  constructor(
    quota: string,
    limit: number,
    used: number,
    upgradeUrl?: string
  ) {
    super(`Quota exceeded for ${quota}. Used ${used}/${limit}.`, 'QUOTA_EXCEEDED', 402, {
      quota,
      limit,
      used,
      upgrade_url: upgradeUrl,
    });
    this.name = 'QuotaExceededError';
  }
}

export class ValidationError extends IntellectMemoryError {
  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>
  ) {
    super(message, 'VALIDATION_ERROR', 400, { errors });
    this.name = 'ValidationError';
  }
}

export class ProtocolError extends IntellectMemoryError {
  constructor(message: string, status?: number) {
    super(message, 'INVALID_RESPONSE', status);
    this.name = 'ProtocolError';
  }
}

export class ServerError extends IntellectMemoryError {
  constructor(message = 'Internal server error', status = 500) {
    super(message, 'INTERNAL_ERROR', status);
    this.name = 'ServerError';
  }
}
