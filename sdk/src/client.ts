import {
  AuthenticationError,
  AuthorizationError,
  IntellectMemoryError,
  NotFoundError,
  QuotaExceededError,
  RateLimitError,
  ServerError,
  ValidationError,
} from './errors.js';
import type {
  ApiErrorResponse,
  ApiResponse,
  CreateMemoryRequest,
  CreateMemoryResponse,
  IntellectMemoryConfig,
  Memory,
  SearchRequest,
  SearchResponse,
  UsageStats,
  DailyUsage,
  AskRequest,
  AskResponse,
  SolveRequest,
  SolveResponse,
  SecureReviewRequest,
  SecureReviewResponse,
} from './types.js';

const DEFAULT_BASE_URL = 'https://api.intellectmemory.com';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_RETRIES = 3;

/**
 * Intellect Memory API Client
 */
export class IntellectMemoryClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: IntellectMemoryConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.fetchFn = config.fetch || globalThis.fetch;
  }

  /**
   * Make an authenticated request to the API
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    retryCount = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchFn(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting with retry
      if (response.status === 429 && retryCount < this.maxRetries) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
        await this.sleep(retryAfter * 1000);
        return this.request<T>(method, path, body, retryCount + 1);
      }

      const json = (await response.json()) as ApiResponse<T> | ApiErrorResponse;

      if (!json.success) {
        throw this.handleError(response.status, json as ApiErrorResponse);
      }

      return (json as ApiResponse<T>).data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof IntellectMemoryError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new IntellectMemoryError('Request timeout', 'TIMEOUT', 408);
      }

      // Retry on network errors
      if (retryCount < this.maxRetries) {
        await this.sleep(Math.pow(2, retryCount) * 1000);
        return this.request<T>(method, path, body, retryCount + 1);
      }

      throw new IntellectMemoryError(
        error instanceof Error ? error.message : 'Network error',
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Convert API error to SDK error
   */
  private handleError(status: number, response: ApiErrorResponse): IntellectMemoryError {
    const { message, details } = response.error;

    switch (status) {
      case 401:
        return new AuthenticationError(message);
      case 403:
        return new AuthorizationError(message, details?.required_scope as string);
      case 404:
        return new NotFoundError(details?.resource as string, details?.id as string);
      case 402:
        return new QuotaExceededError(
          details?.quota as string,
          details?.limit as number,
          details?.used as number,
          details?.upgrade_url as string
        );
      case 429:
        return new RateLimitError(
          (details?.retry_after as number) || 1,
          (details?.limit as number) || 0,
          (details?.remaining as number) || 0
        );
      case 400:
        return new ValidationError(
          message,
          (details?.errors as Array<{ field: string; message: string }>) || []
        );
      case 500:
      default:
        return new ServerError(message);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================
  // Memory API
  // ============================================

  /**
   * Add a new memory
   */
  async addMemory(data: CreateMemoryRequest): Promise<CreateMemoryResponse> {
    return this.request<CreateMemoryResponse>('POST', '/v1/memory/add', data);
  }

  /**
   * Get a memory by ID
   */
  async getMemory(id: string): Promise<{ memory: Memory }> {
    return this.request<{ memory: Memory }>('GET', `/v1/memory/${id}`);
  }

  /**
   * Delete a memory
   */
  async deleteMemory(id: string): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>('DELETE', `/v1/memory/${id}`);
  }

  // ============================================
  // Search API
  // ============================================

  /**
   * Search memories semantically
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>('POST', '/v1/memory/search', request);
  }

  // ============================================
  // Usage API
  // ============================================

  /**
   * Get usage statistics for the current billing period
   */
  async getUsage(): Promise<UsageStats> {
    return this.request<UsageStats>('GET', '/v1/usage');
  }

  /**
   * Get daily usage breakdown
   */
  async getDailyUsage(days: number = 30): Promise<{ daily: DailyUsage[] }> {
    return this.request<{ daily: DailyUsage[] }>('GET', `/v1/usage/daily?days=${days}`);
  }

  // ============================================
  // Ask API (RAG)
  // ============================================

  /**
   * Ask a question using RAG over memories
   */
  async ask(request: AskRequest): Promise<AskResponse> {
    return this.request<AskResponse>('POST', '/v1/memory/ask', request);
  }

  // ============================================
  // Solve API
  // ============================================

  /**
   * Get AI-powered diagnosis and fix recommendations for a problem
   */
  async solve(request: SolveRequest): Promise<SolveResponse> {
    return this.request<SolveResponse>('POST', '/v1/solve', request);
  }

  // ============================================
  // Secure Review API
  // ============================================

  /**
   * Perform defensive security review of code or config
   */
  async secureReview(request: SecureReviewRequest): Promise<SecureReviewResponse> {
    return this.request<SecureReviewResponse>('POST', '/v1/secure-review', request);
  }
}

// Also export as default for convenience
export default IntellectMemoryClient;
