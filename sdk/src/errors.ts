/**
 * Base error class for SDK errors
 */
export class IntellectMemoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'IntellectMemoryError';
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends IntellectMemoryError {
  constructor(message = 'Invalid or missing API key') {
    super(message, 'AUTHENTICATION_FAILED', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends IntellectMemoryError {
  constructor(message = 'Insufficient permissions', scope?: string) {
    super(message, 'INSUFFICIENT_SCOPE', 403, scope ? { required_scope: scope } : undefined);
    this.name = 'AuthorizationError';
  }
}

/**
 * Resource not found error (404)
 */
export class NotFoundError extends IntellectMemoryError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, { resource, id });
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limit exceeded error (429)
 */
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

/**
 * Quota exceeded error (402)
 */
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

/**
 * Validation error (400)
 */
export class ValidationError extends IntellectMemoryError {
  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>
  ) {
    super(message, 'VALIDATION_ERROR', 400, { errors });
    this.name = 'ValidationError';
  }
}

/**
 * Server error (500)
 */
export class ServerError extends IntellectMemoryError {
  constructor(message = 'Internal server error') {
    super(message, 'INTERNAL_ERROR', 500);
    this.name = 'ServerError';
  }
}
