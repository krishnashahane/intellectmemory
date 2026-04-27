/**
 * Plan definitions and limits
 */

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    stripePriceId: null,
    limits: {
      tokensProcessed: 1_000_000,
      searchQueries: 10_000,
      memoriesStored: 1_000,
      documentsStoredBytes: 100 * 1024 * 1024, // 100 MB
      apiKeys: 2,
      projects: 1,
      rateLimit: 60, // req/min
    },
    features: ['Community support', 'Basic analytics', '30-day data retention'],
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: 17,
    stripePriceId: 'price_plus_monthly',
    limits: {
      tokensProcessed: 3_000_000,
      searchQueries: 100_000,
      memoriesStored: 10_000,
      documentsStoredBytes: 1024 * 1024 * 1024, // 1 GB
      apiKeys: 10,
      projects: 5,
      rateLimit: 300,
    },
    features: [
      'Email support (48h)',
      'Advanced analytics',
      'Webhooks',
      '1-year data retention',
      '99.5% SLA',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 299,
    stripePriceId: 'price_pro_monthly',
    limits: {
      tokensProcessed: 75_000_000,
      searchQueries: 15_000_000,
      memoriesStored: 500_000,
      documentsStoredBytes: 50 * 1024 * 1024 * 1024, // 50 GB
      apiKeys: 100,
      projects: -1, // unlimited
      rateLimit: 1000,
    },
    features: [
      'Dedicated support + Slack',
      'Custom analytics',
      'Webhooks',
      'Unlimited data retention',
      '99.9% SLA',
      'Custom integrations',
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanId];

/**
 * API Key Scopes
 */
export const SCOPES = {
  'memories:read': 'Read memories',
  'memories:write': 'Create and update memories',
  'memories:delete': 'Delete memories',
  'search:read': 'Perform semantic search',
  'documents:read': 'Read and download documents',
  'documents:write': 'Upload documents',
  'documents:delete': 'Delete documents',
  'usage:read': 'View usage statistics',
  'keys:read': 'List API keys',
  'keys:write': 'Create API keys',
  'keys:delete': 'Revoke API keys',
} as const;

export type Scope = keyof typeof SCOPES;
export const ALL_SCOPES = Object.keys(SCOPES) as Scope[];

/**
 * Error codes
 */
export const ERROR_CODES = {
  // Auth
  INVALID_API_KEY: 'INVALID_API_KEY',
  API_KEY_REVOKED: 'API_KEY_REVOKED',
  API_KEY_EXPIRED: 'API_KEY_EXPIRED',
  INSUFFICIENT_SCOPE: 'INSUFFICIENT_SCOPE',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',

  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',

  // Limits
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  CONTENT_TOO_LARGE: 'CONTENT_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',

  // External
  EMBEDDING_FAILED: 'EMBEDDING_FAILED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * Other constants
 */
export const API_VERSION = 'v1';
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;
export const MAX_CONTENT_LENGTH = 100_000; // 100KB
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB
export const SESSION_TTL_DAYS = 7;
export const IDEMPOTENCY_KEY_TTL_HOURS = 24;
export const CURSOR_TTL_HOURS = 24;
