import { z } from 'zod';

import { ALL_SCOPES } from './constants';

/**
 * Common schemas
 */
export const IdSchema = z.string().uuid();
export const EmailSchema = z.string().email().max(254);
export const TimestampSchema = z.string().datetime();
export const CursorSchema = z.string().min(1).max(500);

/**
 * Pagination
 */
export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: CursorSchema.optional(),
});

export const PaginationResponseSchema = z.object({
  next_cursor: z.string().nullable(),
  has_more: z.boolean(),
});

/**
 * Auth schemas
 */
export const RegisterRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
});

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(128),
});

export const UserSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  name: z.string().nullable(),
  plan_id: z.enum(['free', 'plus', 'pro']),
  created_at: TimestampSchema,
});

/**
 * API Key schemas
 */
export const ScopeSchema = z.enum(ALL_SCOPES as [string, ...string[]]);

export const CreateApiKeyRequestSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(ScopeSchema).min(1),
  expires_at: TimestampSchema.optional(),
  project_id: IdSchema.optional(),
});

export const ApiKeySchema = z.object({
  id: IdSchema,
  name: z.string(),
  prefix: z.string(),
  scopes: z.array(ScopeSchema),
  last_used_at: TimestampSchema.nullable(),
  expires_at: TimestampSchema.nullable(),
  created_at: TimestampSchema,
});

export const ApiKeyWithSecretSchema = ApiKeySchema.extend({
  secret: z.string(),
});

/**
 * Memory schemas
 */
export const MetadataSchema = z.record(z.string(), z.unknown()).default({});

export const CreateMemoryRequestSchema = z.object({
  content: z.string().min(1).max(100_000),
  metadata: MetadataSchema,
  project_id: IdSchema.optional(),
});

export const UpdateMemoryRequestSchema = z.object({
  content: z.string().min(1).max(100_000).optional(),
  metadata: MetadataSchema.optional(),
});

export const MemorySchema = z.object({
  id: IdSchema,
  content: z.string(),
  content_hash: z.string(),
  metadata: MetadataSchema,
  token_count: z.number().int(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

/**
 * Search schemas
 */
export const SearchRequestSchema = z.object({
  query: z.string().min(1).max(10_000),
  limit: z.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  project_id: IdSchema.optional(),
  filters: z
    .object({
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export const SearchResultSchema = z.object({
  memory: MemorySchema,
  score: z.number(),
  chunk_index: z.number().int(),
});

export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  query_embedding_cached: z.boolean(),
  search_time_ms: z.number(),
});

/**
 * Document schemas
 */
export const DocumentStatusSchema = z.enum(['pending', 'processing', 'processed', 'failed']);

export const DocumentSchema = z.object({
  id: IdSchema,
  name: z.string(),
  mime_type: z.string(),
  size_bytes: z.number().int(),
  status: DocumentStatusSchema,
  created_at: TimestampSchema,
  processed_at: TimestampSchema.nullable(),
});

/**
 * Usage schemas
 */
export const UsageSchema = z.object({
  tokens_processed: z.number().int(),
  search_queries: z.number().int(),
  memories_stored: z.number().int(),
  documents_stored_bytes: z.number().int(),
});

export const UsageResponseSchema = z.object({
  period: z.object({
    start: TimestampSchema,
    end: TimestampSchema,
  }),
  usage: UsageSchema,
  limits: UsageSchema,
  percentage: z.record(z.string(), z.number()),
});

/**
 * Billing schemas
 */
export const CheckoutRequestSchema = z.object({
  plan_id: z.enum(['plus', 'pro']),
  success_url: z.string().url(),
  cancel_url: z.string().url(),
});

export const SubscriptionSchema = z.object({
  plan_id: z.enum(['free', 'plus', 'pro']),
  status: z.enum(['active', 'canceled', 'past_due', 'trialing']),
  current_period_end: TimestampSchema,
  cancel_at_period_end: z.boolean(),
});

/**
 * API Response wrapper
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.object({
      request_id: z.string(),
      timestamp: TimestampSchema,
    }),
  });

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  meta: z.object({
    request_id: z.string(),
    timestamp: TimestampSchema,
  }),
});

/**
 * Type exports
 */
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type User = z.infer<typeof UserSchema>;
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type ApiKeyWithSecret = z.infer<typeof ApiKeyWithSecretSchema>;
export type CreateMemoryRequest = z.infer<typeof CreateMemoryRequestSchema>;
export type UpdateMemoryRequest = z.infer<typeof UpdateMemoryRequestSchema>;
export type Memory = z.infer<typeof MemorySchema>;
export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type Usage = z.infer<typeof UsageSchema>;
export type UsageResponse = z.infer<typeof UsageResponseSchema>;
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
