import {
  AuthenticationError,
  AuthorizationError,
  IntellectMemoryError,
  NotFoundError,
  ProtocolError,
  QuotaExceededError,
  RateLimitError,
  ServerError,
  ValidationError,
} from './errors.js';
import type {
  ApiErrorResponse,
  ApiResponse,
  AskRequest,
  AskResponse,
  CreateMemoryRequest,
  CreateMemoryResponse,
  DailyUsage,
  IntellectMemoryConfig,
  ListMemoriesOptions,
  Memory,
  SearchRequest,
  SearchResponse,
  SecureReviewRequest,
  SecureReviewResponse,
  SolveRequest,
  SolveResponse,
  UpdateMemoryRequest,
  UsageStats,
} from './types.js';

const DEFAULT_BASE_URL = 'https://api.intellectmemory.com';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const MAX_RETRIES = 10;
const MAX_RETRY_DELAY_MS = 60_000;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('baseUrl must use http:// or https://');
  }
  if (url.username || url.password) {
    throw new Error('baseUrl must not contain embedded credentials');
  }
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

function boundedInteger(value: number, name: string, min: number, max: number): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function retryDelayMs(response: Response): number {
  const raw = response.headers.get('Retry-After');
  if (!raw) return 1_000;

  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(MAX_RETRY_DELAY_MS, seconds * 1_000);
  }

  const date = Date.parse(raw);
  if (!Number.isNaN(date)) {
    return Math.min(MAX_RETRY_DELAY_MS, Math.max(0, date - Date.now()));
  }

  return 1_000;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function canRetry(method: HttpMethod, hasIdempotencyKey: boolean): boolean {
  return ['GET', 'HEAD', 'OPTIONS', 'DELETE'].includes(method) || hasIdempotencyKey;
}

/**
 * TypeScript client for the Intellect Memory API.
 */
export class IntellectMemoryClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: IntellectMemoryConfig) {
    if (!config.apiKey || !config.apiKey.trim()) {
      throw new Error('API key is required');
    }

    const timeout = config.timeout ?? DEFAULT_TIMEOUT;
    if (!Number.isFinite(timeout) || timeout <= 0 || timeout > 300_000) {
      throw new Error('timeout must be between 1 and 300000 milliseconds');
    }

    const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    if (!Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > MAX_RETRIES) {
      throw new Error(`maxRetries must be an integer between 0 and ${MAX_RETRIES}`);
    }

    const fetchFn = config.fetch ?? globalThis.fetch;
    if (!fetchFn) {
      throw new Error('Fetch API is not available. Provide config.fetch.');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = normalizeBaseUrl(config.baseUrl ?? DEFAULT_BASE_URL);
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.fetchFn = fetchFn;
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    idempotencyKey?: string,
    retryCount = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      };

      if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
      }
      if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey;
      }

      const response = await this.fetchFn(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (
        isRetryableStatus(response.status) &&
        retryCount < this.maxRetries &&
        canRetry(method, Boolean(idempotencyKey))
      ) {
        await this.sleep(retryDelayMs(response));
        return this.request<T>(method, path, body, idempotencyKey, retryCount + 1);
      }

      const raw = await response.text();
      let json: ApiResponse<T> | ApiErrorResponse | undefined;

      if (raw.trim()) {
        try {
          json = JSON.parse(raw) as ApiResponse<T> | ApiErrorResponse;
        } catch {
          throw new ProtocolError(
            `API returned invalid JSON (HTTP ${response.status})`,
            response.status
          );
        }
      }

      if (!response.ok) {
        if (json && json.success === false) {
          throw this.handleError(response.status, json);
        }
        throw new ServerError(
          `Request failed with HTTP ${response.status}`,
          response.status
        );
      }

      if (!json || json.success !== true) {
        throw new ProtocolError(
          `API returned an unexpected response (HTTP ${response.status})`,
          response.status
        );
      }

      return json.data;
    } catch (error) {
      if (error instanceof IntellectMemoryError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new IntellectMemoryError('Request timeout', 'TIMEOUT', 408);
      }

      if (retryCount < this.maxRetries && canRetry(method, Boolean(idempotencyKey))) {
        await this.sleep(Math.min(2 ** retryCount * 1_000, MAX_RETRY_DELAY_MS));
        return this.request<T>(method, path, body, idempotencyKey, retryCount + 1);
      }

      throw new IntellectMemoryError(
        error instanceof Error ? error.message : 'Network error',
        'NETWORK_ERROR'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private handleError(status: number, response: ApiErrorResponse): IntellectMemoryError {
    const { message, details } = response.error;

    switch (status) {
      case 401:
        return new AuthenticationError(message);
      case 403:
        return new AuthorizationError(message, typeof details?.required_scope === 'string' ? details.required_scope : undefined);
      case 404:
        return new NotFoundError(
          typeof details?.resource === 'string' ? details.resource : 'Resource',
          typeof details?.id === 'string' ? details.id : undefined
        );
      case 402:
        return new QuotaExceededError(
          typeof details?.quota === 'string' ? details.quota : 'quota',
          typeof details?.limit === 'number' ? details.limit : 0,
          typeof details?.used === 'number' ? details.used : 0,
          typeof details?.upgrade_url === 'string' ? details.upgrade_url : undefined
        );
      case 429:
        return new RateLimitError(
          typeof details?.retry_after === 'number' ? details.retry_after : 1,
          typeof details?.limit === 'number' ? details.limit : 0,
          typeof details?.remaining === 'number' ? details.remaining : 0
        );
      case 400:
      case 422:
        return new ValidationError(
          message,
          Array.isArray(details?.errors) ? details.errors as Array<{ field: string; message: string }> : []
        );
      default:
        return new ServerError(message, status);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
  }

  async addMemory(data: CreateMemoryRequest, idempotencyKey?: string): Promise<CreateMemoryResponse> {
    return this.request<CreateMemoryResponse>('POST', '/v1/memories', data, idempotencyKey);
  }

  async getMemory(id: string): Promise<{ memory: Memory }> {
    return this.request<{ memory: Memory }>('GET', `/v1/memories/${encodeURIComponent(id)}`);
  }

  async listMemories(options: ListMemoriesOptions = {}): Promise<{
    memories: Memory[];
    pagination: { next_cursor: string | null; has_more: boolean };
  }> {
    const params = new URLSearchParams();
    if (options.limit !== undefined) params.set('limit', String(boundedInteger(options.limit, 'limit', 1, 100)));
    if (options.cursor) params.set('cursor', options.cursor);
    if (options.project_id) params.set('project_id', options.project_id);
    const query = params.toString();
    return this.request('GET', `/v1/memories${query ? `?${query}` : ''}`);
  }

  async updateMemory(id: string, data: UpdateMemoryRequest): Promise<{ memory: Memory }> {
    return this.request<{ memory: Memory }>('PUT', `/v1/memories/${encodeURIComponent(id)}`, data);
  }

  async deleteMemory(id: string): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>('DELETE', `/v1/memories/${encodeURIComponent(id)}`);
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>('POST', '/v1/search', request);
  }

  async getUsage(): Promise<UsageStats> {
    return this.request<UsageStats>('GET', '/v1/usage');
  }

  async getDailyUsage(days = 30): Promise<{ daily: DailyUsage[] }> {
    const safeDays = Math.max(1, Math.min(3650, Math.trunc(days)));
    return this.request<{ daily: DailyUsage[] }>('GET', `/v1/usage/daily?days=${safeDays}`);
  }

  async ask(request: AskRequest, idempotencyKey?: string): Promise<AskResponse> {
    return this.request<AskResponse>('POST', '/v1/memory/ask', request, idempotencyKey);
  }

  async solve(request: SolveRequest, idempotencyKey?: string): Promise<SolveResponse> {
    return this.request<SolveResponse>('POST', '/v1/solve', request, idempotencyKey);
  }

  async secureReview(request: SecureReviewRequest, idempotencyKey?: string): Promise<SecureReviewResponse> {
    return this.request<SecureReviewResponse>('POST', '/v1/secure-review', request, idempotencyKey);
  }
}

export default IntellectMemoryClient;
