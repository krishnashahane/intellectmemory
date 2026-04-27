/**
 * SDK Configuration options
 */
interface IntellectMemoryConfig {
    /** API key for authentication */
    apiKey: string;
    /** Base URL for the API (default: https://api.intellectmemory.com) */
    baseUrl?: string;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Number of retries for failed requests (default: 3) */
    maxRetries?: number;
    /** Custom fetch implementation */
    fetch?: typeof fetch;
}
/**
 * Memory object
 */
interface Memory {
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    token_count: number;
    created_at: string;
    updated_at: string;
}
/**
 * Create memory request
 */
interface CreateMemoryRequest {
    content: string;
    metadata?: Record<string, unknown>;
}
/**
 * Update memory request
 */
interface UpdateMemoryRequest {
    content?: string;
    metadata?: Record<string, unknown>;
}
/**
 * List memories options
 */
interface ListMemoriesOptions {
    limit?: number;
    cursor?: string;
}
/**
 * Search request
 */
interface SearchRequest {
    query: string;
    limit?: number;
    threshold?: number;
    metadata_filter?: Record<string, unknown>;
}
/**
 * Search result
 */
interface SearchResult {
    memory: Memory;
    score: number;
}
/**
 * Paginated response
 */
interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        has_more: boolean;
        next_cursor?: string;
        total?: number;
    };
}
/**
 * API success response
 */
interface ApiResponse<T> {
    success: true;
    data: T;
    meta?: {
        request_id: string;
        tokens_used?: number;
    };
}
/**
 * API error response
 */
interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}
/**
 * Usage statistics
 */
interface UsageStats {
    period: {
        start: string;
        end: string;
    };
    usage: {
        tokens_processed: number;
        search_queries: number;
        memories_stored: number;
        documents_stored_bytes: number;
        api_keys_count: number;
    };
    limits: {
        tokens_processed: number;
        search_queries: number;
        memories_stored: number;
        documents_stored_bytes: number;
        api_keys_count: number;
    };
    plan: string;
}

/**
 * Intellect Memory API Client
 */
declare class IntellectMemoryClient {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly timeout;
    private readonly maxRetries;
    private readonly fetchFn;
    constructor(config: IntellectMemoryConfig);
    /**
     * Make an authenticated request to the API
     */
    private request;
    /**
     * Convert API error to SDK error
     */
    private handleError;
    private sleep;
    /**
     * Create a new memory
     */
    createMemory(data: CreateMemoryRequest): Promise<Memory>;
    /**
     * Get a memory by ID
     */
    getMemory(id: string): Promise<Memory>;
    /**
     * List memories with pagination
     */
    listMemories(options?: ListMemoriesOptions): Promise<PaginatedResponse<Memory>>;
    /**
     * Update a memory
     */
    updateMemory(id: string, data: UpdateMemoryRequest): Promise<Memory>;
    /**
     * Delete a memory
     */
    deleteMemory(id: string): Promise<void>;
    /**
     * Search memories semantically
     */
    search(request: SearchRequest): Promise<SearchResult[]>;
    /**
     * Get usage statistics for the current billing period
     */
    getUsage(): Promise<UsageStats>;
}

/**
 * Base error class for SDK errors
 */
declare class IntellectMemoryError extends Error {
    readonly code: string;
    readonly status?: number | undefined;
    readonly details?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, status?: number | undefined, details?: Record<string, unknown> | undefined);
}
/**
 * Authentication error (401)
 */
declare class AuthenticationError extends IntellectMemoryError {
    constructor(message?: string);
}
/**
 * Authorization error (403)
 */
declare class AuthorizationError extends IntellectMemoryError {
    constructor(message?: string, scope?: string);
}
/**
 * Resource not found error (404)
 */
declare class NotFoundError extends IntellectMemoryError {
    constructor(resource: string, id?: string);
}
/**
 * Rate limit exceeded error (429)
 */
declare class RateLimitError extends IntellectMemoryError {
    readonly retryAfter: number;
    readonly limit: number;
    readonly remaining: number;
    constructor(retryAfter: number, limit: number, remaining: number);
}
/**
 * Quota exceeded error (402)
 */
declare class QuotaExceededError extends IntellectMemoryError {
    constructor(quota: string, limit: number, used: number, upgradeUrl?: string);
}
/**
 * Validation error (400)
 */
declare class ValidationError extends IntellectMemoryError {
    readonly errors: Array<{
        field: string;
        message: string;
    }>;
    constructor(message: string, errors: Array<{
        field: string;
        message: string;
    }>);
}
/**
 * Server error (500)
 */
declare class ServerError extends IntellectMemoryError {
    constructor(message?: string);
}

export { type ApiErrorResponse, type ApiResponse, AuthenticationError, AuthorizationError, type CreateMemoryRequest, IntellectMemoryClient, type IntellectMemoryConfig, IntellectMemoryError, type ListMemoriesOptions, type Memory, NotFoundError, type PaginatedResponse, QuotaExceededError, RateLimitError, type SearchRequest, type SearchResult, ServerError, type UpdateMemoryRequest, type UsageStats, ValidationError };
