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
    content_hash: string;
    metadata: Record<string, unknown>;
    token_count: number;
    chunk_count: number;
    created_at: string;
    updated_at: string;
}
/**
 * Create memory request
 */
interface CreateMemoryRequest {
    content: string;
    source?: string;
    tags?: string[];
    external_id?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Create memory response
 */
interface CreateMemoryResponse {
    memory_item_id: string;
    chunk_count: number;
    tokens_used?: number;
    cached?: boolean;
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
    top_k?: number;
    threshold?: number;
    filters?: {
        tags?: string[];
        source?: string;
    };
}
/**
 * Search result
 */
interface SearchResult {
    memory: {
        id: string;
        content: string;
        metadata: Record<string, unknown>;
        created_at: string;
    };
    score: number;
    chunk_index: number;
    chunk_text: string;
}
/**
 * Search response
 */
interface SearchResponse {
    results: SearchResult[];
    query_embedding_cached: boolean;
    search_time_ms: number;
    tokens_used: number;
}
/**
 * Project
 */
interface Project {
    id: string;
    name: string;
    description: string | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}
/**
 * Create project request
 */
interface CreateProjectRequest {
    name: string;
    description?: string;
}
/**
 * API Key
 */
interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
}
/**
 * API Key with secret (only returned on creation)
 */
interface ApiKeyWithSecret extends ApiKey {
    secret: string;
}
/**
 * Create API key request
 */
interface CreateApiKeyRequest {
    name: string;
    scopes: string[];
    expires_at?: string;
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
        timestamp: string;
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
    meta?: {
        request_id: string;
        timestamp: string;
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
    plan: {
        id: string;
        name: string;
    };
    usage: {
        tokens_processed: number;
        search_queries: number;
        api_requests: number;
        memories_stored: number;
        api_keys: number;
        projects: number;
        documents_stored_bytes: number;
    };
    limits: {
        tokens_processed: number;
        search_queries: number;
        memories_stored: number;
        api_keys: number;
        projects: number;
        documents_stored_bytes: number;
        rate_limit: number;
    };
    percentage: {
        tokens_processed: number;
        search_queries: number;
        memories_stored: number;
        api_keys: number;
        projects: number;
        documents_stored_bytes: number;
    };
}
/**
 * Daily usage
 */
interface DailyUsage {
    date: string;
    tokens_processed: number;
    search_queries: number;
    api_requests: number;
}
/**
 * User
 */
interface User {
    id: string;
    email: string;
    name: string | null;
    plan_id: string;
    created_at: string;
}
/**
 * Auth response
 */
interface AuthResponse {
    user: User;
    token: string;
}
/**
 * Ask request (RAG-powered Q&A)
 */
interface AskRequest {
    question: string;
    top_k?: number;
    threshold?: number;
    max_context_length?: number;
    max_output_tokens?: number;
    allow_general_answer?: boolean;
    filters?: {
        tags?: string[];
        source?: string;
    };
}
/**
 * Ask response
 */
interface AskResponse {
    answer: string;
    citations: Array<{
        id: string;
        snippet: string;
    }>;
    context_chunks_used: number;
    search_time_ms: number;
    tokens_used: {
        embedding: number;
        completion: number;
        total: number;
    };
    embedding_cached: boolean;
}
/**
 * File for solve context
 */
interface SolveFile {
    path: string;
    content: string;
}
/**
 * Solve request
 */
interface SolveRequest {
    problem: string;
    repo_context?: {
        files: SolveFile[];
    };
    constraints?: string[];
    include_patches?: boolean;
}
/**
 * Solve diagnosis
 */
interface SolveDiagnosis {
    summary: string;
    likely_causes: string[];
    confidence: 'high' | 'medium' | 'low';
}
/**
 * Solve fix step
 */
interface SolveFixStep {
    step: number;
    action: string;
    rationale: string;
    file?: string;
}
/**
 * Solve patch
 */
interface SolvePatch {
    file: string;
    diff: string;
    description: string;
}
/**
 * Solve response
 */
interface SolveResponse {
    diagnosis: SolveDiagnosis;
    fix_plan: SolveFixStep[];
    patches?: SolvePatch[];
    warnings?: string[];
    recommendations?: string[];
    tokens_used: {
        prompt: number;
        completion: number;
        total: number;
    };
}
/**
 * Artifact for security review
 */
interface SecureReviewArtifact {
    name: string;
    content: string;
}
/**
 * Threat model for security review
 */
interface ThreatModel {
    app_type?: 'web' | 'api' | 'mobile' | 'desktop' | 'embedded' | 'cli';
    auth?: 'none' | 'session' | 'jwt' | 'oauth' | 'api_key' | 'mtls';
    data?: 'public' | 'pii' | 'financial' | 'health' | 'classified';
    infra?: 'cloud' | 'on_prem' | 'hybrid' | 'serverless' | 'edge';
}
/**
 * Secure review request
 */
interface SecureReviewRequest {
    target: 'code' | 'config';
    artifacts: SecureReviewArtifact[];
    threat_model?: ThreatModel;
    focus_areas?: string[];
}
/**
 * Security finding
 */
interface SecurityFinding {
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    title: string;
    description: string;
    location: string;
    evidence: string;
    fix: string;
    cwe_id?: string;
}
/**
 * Secure defaults checklist item
 */
interface SecureDefaultsItem {
    item: string;
    status: 'pass' | 'fail' | 'warning' | 'not_applicable';
    note?: string;
}
/**
 * Secure review response
 */
interface SecureReviewResponse {
    summary: string;
    risk_level: 'critical' | 'high' | 'medium' | 'low' | 'secure';
    findings: SecurityFinding[];
    findings_count: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
    secure_defaults_checklist: SecureDefaultsItem[];
    recommendations: string[];
    tokens_used: {
        prompt: number;
        completion: number;
        total: number;
    };
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
     * Add a new memory
     */
    addMemory(data: CreateMemoryRequest): Promise<CreateMemoryResponse>;
    /**
     * Get a memory by ID
     */
    getMemory(id: string): Promise<{
        memory: Memory;
    }>;
    /**
     * Delete a memory
     */
    deleteMemory(id: string): Promise<{
        deleted: boolean;
    }>;
    /**
     * Search memories semantically
     */
    search(request: SearchRequest): Promise<SearchResponse>;
    /**
     * Get usage statistics for the current billing period
     */
    getUsage(): Promise<UsageStats>;
    /**
     * Get daily usage breakdown
     */
    getDailyUsage(days?: number): Promise<{
        daily: DailyUsage[];
    }>;
    /**
     * Ask a question using RAG over memories
     */
    ask(request: AskRequest): Promise<AskResponse>;
    /**
     * Get AI-powered diagnosis and fix recommendations for a problem
     */
    solve(request: SolveRequest): Promise<SolveResponse>;
    /**
     * Perform defensive security review of code or config
     */
    secureReview(request: SecureReviewRequest): Promise<SecureReviewResponse>;
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

export { type ApiErrorResponse, type ApiKey, type ApiKeyWithSecret, type ApiResponse, type AskRequest, type AskResponse, type AuthResponse, AuthenticationError, AuthorizationError, type CreateApiKeyRequest, type CreateMemoryRequest, type CreateMemoryResponse, type CreateProjectRequest, type DailyUsage, IntellectMemoryClient as IntellectMemory, IntellectMemoryClient, type IntellectMemoryConfig, IntellectMemoryError, type ListMemoriesOptions, type Memory, NotFoundError, type PaginatedResponse, type Project, QuotaExceededError, RateLimitError, type SearchRequest, type SearchResponse, type SearchResult, type SecureDefaultsItem, type SecureReviewArtifact, type SecureReviewRequest, type SecureReviewResponse, type SecurityFinding, ServerError, type SolveDiagnosis, type SolveFile, type SolveFixStep, type SolvePatch, type SolveRequest, type SolveResponse, type ThreatModel, type UpdateMemoryRequest, type UsageStats, type User, ValidationError, IntellectMemoryClient as default };
