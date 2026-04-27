import { z } from 'zod';

/**
 * Plan definitions and limits
 */
declare const PLANS: {
    readonly free: {
        readonly id: "free";
        readonly name: "Free";
        readonly price: 0;
        readonly stripePriceId: null;
        readonly limits: {
            readonly tokensProcessed: 1000000;
            readonly searchQueries: 10000;
            readonly memoriesStored: 1000;
            readonly documentsStoredBytes: number;
            readonly apiKeys: 2;
            readonly projects: 1;
            readonly rateLimit: 60;
        };
        readonly features: readonly ["Community support", "Basic analytics", "30-day data retention"];
    };
    readonly plus: {
        readonly id: "plus";
        readonly name: "Plus";
        readonly price: 17;
        readonly stripePriceId: "price_plus_monthly";
        readonly limits: {
            readonly tokensProcessed: 3000000;
            readonly searchQueries: 100000;
            readonly memoriesStored: 10000;
            readonly documentsStoredBytes: number;
            readonly apiKeys: 10;
            readonly projects: 5;
            readonly rateLimit: 300;
        };
        readonly features: readonly ["Email support (48h)", "Advanced analytics", "Webhooks", "1-year data retention", "99.5% SLA"];
    };
    readonly pro: {
        readonly id: "pro";
        readonly name: "Pro";
        readonly price: 299;
        readonly stripePriceId: "price_pro_monthly";
        readonly limits: {
            readonly tokensProcessed: 75000000;
            readonly searchQueries: 15000000;
            readonly memoriesStored: 500000;
            readonly documentsStoredBytes: number;
            readonly apiKeys: 100;
            readonly projects: -1;
            readonly rateLimit: 1000;
        };
        readonly features: readonly ["Dedicated support + Slack", "Custom analytics", "Webhooks", "Unlimited data retention", "99.9% SLA", "Custom integrations"];
    };
};
type PlanId = keyof typeof PLANS;
type Plan = (typeof PLANS)[PlanId];
/**
 * API Key Scopes
 */
declare const SCOPES: {
    readonly 'memories:read': "Read memories";
    readonly 'memories:write': "Create and update memories";
    readonly 'memories:delete': "Delete memories";
    readonly 'search:read': "Perform semantic search";
    readonly 'documents:read': "Read and download documents";
    readonly 'documents:write': "Upload documents";
    readonly 'documents:delete': "Delete documents";
    readonly 'usage:read': "View usage statistics";
    readonly 'keys:read': "List API keys";
    readonly 'keys:write': "Create API keys";
    readonly 'keys:delete': "Revoke API keys";
};
type Scope = keyof typeof SCOPES;
declare const ALL_SCOPES: Scope[];
/**
 * Error codes
 */
declare const ERROR_CODES: {
    readonly INVALID_API_KEY: "INVALID_API_KEY";
    readonly API_KEY_REVOKED: "API_KEY_REVOKED";
    readonly API_KEY_EXPIRED: "API_KEY_EXPIRED";
    readonly INSUFFICIENT_SCOPE: "INSUFFICIENT_SCOPE";
    readonly SESSION_EXPIRED: "SESSION_EXPIRED";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_JSON: "INVALID_JSON";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly QUOTA_EXCEEDED: "QUOTA_EXCEEDED";
    readonly CONTENT_TOO_LARGE: "CONTENT_TOO_LARGE";
    readonly UNSUPPORTED_FILE_TYPE: "UNSUPPORTED_FILE_TYPE";
    readonly EMBEDDING_FAILED: "EMBEDDING_FAILED";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
};
type ErrorCode = keyof typeof ERROR_CODES;
/**
 * Other constants
 */
declare const API_VERSION = "v1";
declare const EMBEDDING_MODEL = "text-embedding-3-small";
declare const EMBEDDING_DIMENSIONS = 1536;
declare const MAX_CONTENT_LENGTH = 100000;
declare const MAX_DOCUMENT_SIZE: number;
declare const SESSION_TTL_DAYS = 7;
declare const IDEMPOTENCY_KEY_TTL_HOURS = 24;
declare const CURSOR_TTL_HOURS = 24;

/**
 * Common schemas
 */
declare const IdSchema: z.ZodString;
declare const EmailSchema: z.ZodString;
declare const TimestampSchema: z.ZodString;
declare const CursorSchema: z.ZodString;
/**
 * Pagination
 */
declare const PaginationQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    cursor?: string | undefined;
}, {
    limit?: number | undefined;
    cursor?: string | undefined;
}>;
declare const PaginationResponseSchema: z.ZodObject<{
    next_cursor: z.ZodNullable<z.ZodString>;
    has_more: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    next_cursor: string | null;
    has_more: boolean;
}, {
    next_cursor: string | null;
    has_more: boolean;
}>;
/**
 * Auth schemas
 */
declare const RegisterRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name?: string | undefined;
}, {
    email: string;
    password: string;
    name?: string | undefined;
}>;
declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    plan_id: z.ZodEnum<["free", "plus", "pro"]>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string | null;
    id: string;
    plan_id: "free" | "plus" | "pro";
    created_at: string;
}, {
    email: string;
    name: string | null;
    id: string;
    plan_id: "free" | "plus" | "pro";
    created_at: string;
}>;
/**
 * API Key schemas
 */
declare const ScopeSchema: z.ZodEnum<[string, ...string[]]>;
declare const CreateApiKeyRequestSchema: z.ZodObject<{
    name: z.ZodString;
    scopes: z.ZodArray<z.ZodEnum<[string, ...string[]]>, "many">;
    expires_at: z.ZodOptional<z.ZodString>;
    project_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    scopes: string[];
    expires_at?: string | undefined;
    project_id?: string | undefined;
}, {
    name: string;
    scopes: string[];
    expires_at?: string | undefined;
    project_id?: string | undefined;
}>;
declare const ApiKeySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    prefix: z.ZodString;
    scopes: z.ZodArray<z.ZodEnum<[string, ...string[]]>, "many">;
    last_used_at: z.ZodNullable<z.ZodString>;
    expires_at: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    created_at: string;
    scopes: string[];
    expires_at: string | null;
    prefix: string;
    last_used_at: string | null;
}, {
    name: string;
    id: string;
    created_at: string;
    scopes: string[];
    expires_at: string | null;
    prefix: string;
    last_used_at: string | null;
}>;
declare const ApiKeyWithSecretSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    prefix: z.ZodString;
    scopes: z.ZodArray<z.ZodEnum<[string, ...string[]]>, "many">;
    last_used_at: z.ZodNullable<z.ZodString>;
    expires_at: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
} & {
    secret: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    created_at: string;
    scopes: string[];
    expires_at: string | null;
    prefix: string;
    last_used_at: string | null;
    secret: string;
}, {
    name: string;
    id: string;
    created_at: string;
    scopes: string[];
    expires_at: string | null;
    prefix: string;
    last_used_at: string | null;
    secret: string;
}>;
/**
 * Memory schemas
 */
declare const MetadataSchema: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
declare const CreateMemoryRequestSchema: z.ZodObject<{
    content: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    project_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    metadata: Record<string, unknown>;
    project_id?: string | undefined;
}, {
    content: string;
    project_id?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
declare const UpdateMemoryRequestSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    content?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    content?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
declare const MemorySchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
    content_hash: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    token_count: z.ZodNumber;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    content: string;
    metadata: Record<string, unknown>;
    content_hash: string;
    token_count: number;
    updated_at: string;
}, {
    id: string;
    created_at: string;
    content: string;
    content_hash: string;
    token_count: number;
    updated_at: string;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Search schemas
 */
declare const SearchRequestSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    threshold: z.ZodDefault<z.ZodNumber>;
    project_id: z.ZodOptional<z.ZodString>;
    filters: z.ZodOptional<z.ZodObject<{
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        metadata?: Record<string, unknown> | undefined;
    }, {
        metadata?: Record<string, unknown> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    query: string;
    threshold: number;
    project_id?: string | undefined;
    filters?: {
        metadata?: Record<string, unknown> | undefined;
    } | undefined;
}, {
    query: string;
    limit?: number | undefined;
    project_id?: string | undefined;
    threshold?: number | undefined;
    filters?: {
        metadata?: Record<string, unknown> | undefined;
    } | undefined;
}>;
declare const SearchResultSchema: z.ZodObject<{
    memory: z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        content_hash: z.ZodString;
        metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        token_count: z.ZodNumber;
        created_at: z.ZodString;
        updated_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        created_at: string;
        content: string;
        metadata: Record<string, unknown>;
        content_hash: string;
        token_count: number;
        updated_at: string;
    }, {
        id: string;
        created_at: string;
        content: string;
        content_hash: string;
        token_count: number;
        updated_at: string;
        metadata?: Record<string, unknown> | undefined;
    }>;
    score: z.ZodNumber;
    chunk_index: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    memory: {
        id: string;
        created_at: string;
        content: string;
        metadata: Record<string, unknown>;
        content_hash: string;
        token_count: number;
        updated_at: string;
    };
    score: number;
    chunk_index: number;
}, {
    memory: {
        id: string;
        created_at: string;
        content: string;
        content_hash: string;
        token_count: number;
        updated_at: string;
        metadata?: Record<string, unknown> | undefined;
    };
    score: number;
    chunk_index: number;
}>;
declare const SearchResponseSchema: z.ZodObject<{
    results: z.ZodArray<z.ZodObject<{
        memory: z.ZodObject<{
            id: z.ZodString;
            content: z.ZodString;
            content_hash: z.ZodString;
            metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            token_count: z.ZodNumber;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            created_at: string;
            content: string;
            metadata: Record<string, unknown>;
            content_hash: string;
            token_count: number;
            updated_at: string;
        }, {
            id: string;
            created_at: string;
            content: string;
            content_hash: string;
            token_count: number;
            updated_at: string;
            metadata?: Record<string, unknown> | undefined;
        }>;
        score: z.ZodNumber;
        chunk_index: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        memory: {
            id: string;
            created_at: string;
            content: string;
            metadata: Record<string, unknown>;
            content_hash: string;
            token_count: number;
            updated_at: string;
        };
        score: number;
        chunk_index: number;
    }, {
        memory: {
            id: string;
            created_at: string;
            content: string;
            content_hash: string;
            token_count: number;
            updated_at: string;
            metadata?: Record<string, unknown> | undefined;
        };
        score: number;
        chunk_index: number;
    }>, "many">;
    query_embedding_cached: z.ZodBoolean;
    search_time_ms: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    results: {
        memory: {
            id: string;
            created_at: string;
            content: string;
            metadata: Record<string, unknown>;
            content_hash: string;
            token_count: number;
            updated_at: string;
        };
        score: number;
        chunk_index: number;
    }[];
    query_embedding_cached: boolean;
    search_time_ms: number;
}, {
    results: {
        memory: {
            id: string;
            created_at: string;
            content: string;
            content_hash: string;
            token_count: number;
            updated_at: string;
            metadata?: Record<string, unknown> | undefined;
        };
        score: number;
        chunk_index: number;
    }[];
    query_embedding_cached: boolean;
    search_time_ms: number;
}>;
/**
 * Document schemas
 */
declare const DocumentStatusSchema: z.ZodEnum<["pending", "processing", "processed", "failed"]>;
declare const DocumentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    mime_type: z.ZodString;
    size_bytes: z.ZodNumber;
    status: z.ZodEnum<["pending", "processing", "processed", "failed"]>;
    created_at: z.ZodString;
    processed_at: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "processing" | "processed" | "failed";
    name: string;
    id: string;
    created_at: string;
    mime_type: string;
    size_bytes: number;
    processed_at: string | null;
}, {
    status: "pending" | "processing" | "processed" | "failed";
    name: string;
    id: string;
    created_at: string;
    mime_type: string;
    size_bytes: number;
    processed_at: string | null;
}>;
/**
 * Usage schemas
 */
declare const UsageSchema: z.ZodObject<{
    tokens_processed: z.ZodNumber;
    search_queries: z.ZodNumber;
    memories_stored: z.ZodNumber;
    documents_stored_bytes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    tokens_processed: number;
    search_queries: number;
    memories_stored: number;
    documents_stored_bytes: number;
}, {
    tokens_processed: number;
    search_queries: number;
    memories_stored: number;
    documents_stored_bytes: number;
}>;
declare const UsageResponseSchema: z.ZodObject<{
    period: z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        start: string;
        end: string;
    }, {
        start: string;
        end: string;
    }>;
    usage: z.ZodObject<{
        tokens_processed: z.ZodNumber;
        search_queries: z.ZodNumber;
        memories_stored: z.ZodNumber;
        documents_stored_bytes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        tokens_processed: number;
        search_queries: number;
        memories_stored: number;
        documents_stored_bytes: number;
    }, {
        tokens_processed: number;
        search_queries: number;
        memories_stored: number;
        documents_stored_bytes: number;
    }>;
    limits: z.ZodObject<{
        tokens_processed: z.ZodNumber;
        search_queries: z.ZodNumber;
        memories_stored: z.ZodNumber;
        documents_stored_bytes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        tokens_processed: number;
        search_queries: number;
        memories_stored: number;
        documents_stored_bytes: number;
    }, {
        tokens_processed: number;
        search_queries: number;
        memories_stored: number;
        documents_stored_bytes: number;
    }>;
    percentage: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    period: {
        start: string;
        end: string;
    };
    usage: {
        tokens_processed: number;
        search_queries: number;
        memories_stored: number;
        documents_stored_bytes: number;
    };
    limits: {
        tokens_processed: number;
        search_queries: number;
        memories_stored: number;
        documents_stored_bytes: number;
    };
    percentage: Record<string, number>;
}, {
    period: {
        start: string;
        end: string;
    };
    usage: {
        tokens_processed: number;
        search_queries: number;
        memories_stored: number;
        documents_stored_bytes: number;
    };
    limits: {
        tokens_processed: number;
        search_queries: number;
        memories_stored: number;
        documents_stored_bytes: number;
    };
    percentage: Record<string, number>;
}>;
/**
 * Billing schemas
 */
declare const CheckoutRequestSchema: z.ZodObject<{
    plan_id: z.ZodEnum<["plus", "pro"]>;
    success_url: z.ZodString;
    cancel_url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    plan_id: "plus" | "pro";
    success_url: string;
    cancel_url: string;
}, {
    plan_id: "plus" | "pro";
    success_url: string;
    cancel_url: string;
}>;
declare const SubscriptionSchema: z.ZodObject<{
    plan_id: z.ZodEnum<["free", "plus", "pro"]>;
    status: z.ZodEnum<["active", "canceled", "past_due", "trialing"]>;
    current_period_end: z.ZodString;
    cancel_at_period_end: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    status: "active" | "canceled" | "past_due" | "trialing";
    plan_id: "free" | "plus" | "pro";
    current_period_end: string;
    cancel_at_period_end: boolean;
}, {
    status: "active" | "canceled" | "past_due" | "trialing";
    plan_id: "free" | "plus" | "pro";
    current_period_end: string;
    cancel_at_period_end: boolean;
}>;
/**
 * API Response wrapper
 */
declare const ApiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: T;
    meta: z.ZodObject<{
        request_id: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        request_id: string;
        timestamp: string;
    }, {
        request_id: string;
        timestamp: string;
    }>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodLiteral<true>;
    data: T;
    meta: z.ZodObject<{
        request_id: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        request_id: string;
        timestamp: string;
    }, {
        request_id: string;
        timestamp: string;
    }>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodLiteral<true>;
    data: T;
    meta: z.ZodObject<{
        request_id: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        request_id: string;
        timestamp: string;
    }, {
        request_id: string;
        timestamp: string;
    }>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
declare const ApiErrorSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    }, {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    }>;
    meta: z.ZodObject<{
        request_id: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        request_id: string;
        timestamp: string;
    }, {
        request_id: string;
        timestamp: string;
    }>;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    };
    meta: {
        request_id: string;
        timestamp: string;
    };
}, {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    };
    meta: {
        request_id: string;
        timestamp: string;
    };
}>;
/**
 * Type exports
 */
type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
type LoginRequest = z.infer<typeof LoginRequestSchema>;
type User = z.infer<typeof UserSchema>;
type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;
type ApiKey = z.infer<typeof ApiKeySchema>;
type ApiKeyWithSecret = z.infer<typeof ApiKeyWithSecretSchema>;
type CreateMemoryRequest = z.infer<typeof CreateMemoryRequestSchema>;
type UpdateMemoryRequest = z.infer<typeof UpdateMemoryRequestSchema>;
type Memory = z.infer<typeof MemorySchema>;
type SearchRequest = z.infer<typeof SearchRequestSchema>;
type SearchResult = z.infer<typeof SearchResultSchema>;
type SearchResponse = z.infer<typeof SearchResponseSchema>;
type Document = z.infer<typeof DocumentSchema>;
type Usage = z.infer<typeof UsageSchema>;
type UsageResponse = z.infer<typeof UsageResponseSchema>;
type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
type Subscription = z.infer<typeof SubscriptionSchema>;

/**
 * Generate a prefixed ID
 */
declare function generateId(prefix?: string): string;
/**
 * Generate a secure random API key
 * Format: im_live_{32 random alphanumeric characters} or im_test_{32 chars}
 */
declare function generateApiKey(isTest?: boolean): string;
/**
 * Extract the prefix from an API key (for identification)
 */
declare function getApiKeyPrefix(apiKey: string): string;
/**
 * Hash a string using SHA-256
 */
declare function sha256(input: string): Promise<string>;
/**
 * Compute HMAC-SHA256
 */
declare function hmacSha256(key: string, message: string): Promise<string>;
/**
 * PBKDF2 password hashing with WebCrypto
 */
declare function hashPassword(password: string, salt?: string): Promise<{
    hash: string;
    salt: string;
}>;
/**
 * Verify a password against a hash
 */
declare function verifyPassword(password: string, hash: string, salt: string): Promise<boolean>;
/**
 * Constant-time string comparison (for security-sensitive comparisons)
 */
declare function timingSafeEqual(a: string, b: string): boolean;
/**
 * Encode a cursor for pagination
 */
declare function encodeCursor(data: Record<string, unknown>): string;
/**
 * Decode a cursor for pagination
 */
declare function decodeCursor<T = Record<string, unknown>>(cursor: string): T | null;
/**
 * Estimate token count (rough approximation for English text)
 * ~4 characters per token on average
 */
declare function estimateTokens(text: string): number;
/**
 * Truncate text to a maximum length with ellipsis
 */
declare function truncate(text: string, maxLength: number): string;
/**
 * Format bytes to human-readable string
 */
declare function formatBytes(bytes: number): string;
/**
 * Format number with K/M/B suffix
 */
declare function formatNumber(num: number): string;
/**
 * Get ISO timestamp for current time
 */
declare function now(): string;
/**
 * Get billing period dates for a user
 */
declare function getBillingPeriod(anchorDate: Date): {
    start: Date;
    end: Date;
};
/**
 * Chunk text into semantic-ish chunks
 */
declare function chunkText(text: string, maxChars?: number, overlap?: number): string[];
/**
 * Generate stable chunk ID based on content
 */
declare function generateChunkId(memoryId: string, chunkIndex: number, content: string): Promise<string>;
/**
 * Normalize text for embedding (lowercase, trim whitespace)
 */
declare function normalizeForEmbedding(text: string): string;

export { ALL_SCOPES, API_VERSION, ApiErrorSchema, type ApiKey, ApiKeySchema, type ApiKeyWithSecret, ApiKeyWithSecretSchema, ApiResponseSchema, CURSOR_TTL_HOURS, type CheckoutRequest, CheckoutRequestSchema, type CreateApiKeyRequest, CreateApiKeyRequestSchema, type CreateMemoryRequest, CreateMemoryRequestSchema, CursorSchema, type Document, DocumentSchema, DocumentStatusSchema, EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, ERROR_CODES, EmailSchema, type ErrorCode, IDEMPOTENCY_KEY_TTL_HOURS, IdSchema, type LoginRequest, LoginRequestSchema, MAX_CONTENT_LENGTH, MAX_DOCUMENT_SIZE, type Memory, MemorySchema, MetadataSchema, PLANS, PaginationQuerySchema, PaginationResponseSchema, type Plan, type PlanId, type RegisterRequest, RegisterRequestSchema, SCOPES, SESSION_TTL_DAYS, type Scope, ScopeSchema, type SearchRequest, SearchRequestSchema, type SearchResponse, SearchResponseSchema, type SearchResult, SearchResultSchema, type Subscription, SubscriptionSchema, TimestampSchema, type UpdateMemoryRequest, UpdateMemoryRequestSchema, type Usage, type UsageResponse, UsageResponseSchema, UsageSchema, type User, UserSchema, chunkText, decodeCursor, encodeCursor, estimateTokens, formatBytes, formatNumber, generateApiKey, generateChunkId, generateId, getApiKeyPrefix, getBillingPeriod, hashPassword, hmacSha256, normalizeForEmbedding, now, sha256, timingSafeEqual, truncate, verifyPassword };
