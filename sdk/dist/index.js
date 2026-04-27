// src/errors.ts
var IntellectMemoryError = class extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.name = "IntellectMemoryError";
  }
};
var AuthenticationError = class extends IntellectMemoryError {
  constructor(message = "Invalid or missing API key") {
    super(message, "AUTHENTICATION_FAILED", 401);
    this.name = "AuthenticationError";
  }
};
var AuthorizationError = class extends IntellectMemoryError {
  constructor(message = "Insufficient permissions", scope) {
    super(message, "INSUFFICIENT_SCOPE", 403, scope ? { required_scope: scope } : void 0);
    this.name = "AuthorizationError";
  }
};
var NotFoundError = class extends IntellectMemoryError {
  constructor(resource, id) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, "NOT_FOUND", 404, { resource, id });
    this.name = "NotFoundError";
  }
};
var RateLimitError = class extends IntellectMemoryError {
  constructor(retryAfter, limit, remaining) {
    super(`Rate limit exceeded. Retry after ${retryAfter} seconds.`, "RATE_LIMITED", 429, {
      retry_after: retryAfter,
      limit,
      remaining
    });
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
    this.name = "RateLimitError";
  }
};
var QuotaExceededError = class extends IntellectMemoryError {
  constructor(quota, limit, used, upgradeUrl) {
    super(`Quota exceeded for ${quota}. Used ${used}/${limit}.`, "QUOTA_EXCEEDED", 402, {
      quota,
      limit,
      used,
      upgrade_url: upgradeUrl
    });
    this.name = "QuotaExceededError";
  }
};
var ValidationError = class extends IntellectMemoryError {
  constructor(message, errors) {
    super(message, "VALIDATION_ERROR", 400, { errors });
    this.errors = errors;
    this.name = "ValidationError";
  }
};
var ServerError = class extends IntellectMemoryError {
  constructor(message = "Internal server error") {
    super(message, "INTERNAL_ERROR", 500);
    this.name = "ServerError";
  }
};

// src/client.ts
var DEFAULT_BASE_URL = "https://api.intellectmemory.com";
var DEFAULT_TIMEOUT = 3e4;
var DEFAULT_MAX_RETRIES = 3;
var IntellectMemoryClient = class {
  apiKey;
  baseUrl;
  timeout;
  maxRetries;
  fetchFn;
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("API key is required");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.fetchFn = config.fetch || globalThis.fetch;
  }
  /**
   * Make an authenticated request to the API
   */
  async request(method, path, body, retryCount = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await this.fetchFn(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: body ? JSON.stringify(body) : void 0,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.status === 429 && retryCount < this.maxRetries) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
        await this.sleep(retryAfter * 1e3);
        return this.request(method, path, body, retryCount + 1);
      }
      const json = await response.json();
      if (!json.success) {
        throw this.handleError(response.status, json);
      }
      return json.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof IntellectMemoryError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new IntellectMemoryError("Request timeout", "TIMEOUT", 408);
      }
      if (retryCount < this.maxRetries) {
        await this.sleep(Math.pow(2, retryCount) * 1e3);
        return this.request(method, path, body, retryCount + 1);
      }
      throw new IntellectMemoryError(
        error instanceof Error ? error.message : "Network error",
        "NETWORK_ERROR"
      );
    }
  }
  /**
   * Convert API error to SDK error
   */
  handleError(status, response) {
    const { message, details } = response.error;
    switch (status) {
      case 401:
        return new AuthenticationError(message);
      case 403:
        return new AuthorizationError(message, details?.required_scope);
      case 404:
        return new NotFoundError(details?.resource, details?.id);
      case 402:
        return new QuotaExceededError(
          details?.quota,
          details?.limit,
          details?.used,
          details?.upgrade_url
        );
      case 429:
        return new RateLimitError(
          details?.retry_after || 1,
          details?.limit || 0,
          details?.remaining || 0
        );
      case 400:
        return new ValidationError(
          message,
          details?.errors || []
        );
      case 500:
      default:
        return new ServerError(message);
    }
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // ============================================
  // Memory API
  // ============================================
  /**
   * Add a new memory
   */
  async addMemory(data) {
    return this.request("POST", "/v1/memory/add", data);
  }
  /**
   * Get a memory by ID
   */
  async getMemory(id) {
    return this.request("GET", `/v1/memory/${id}`);
  }
  /**
   * Delete a memory
   */
  async deleteMemory(id) {
    return this.request("DELETE", `/v1/memory/${id}`);
  }
  // ============================================
  // Search API
  // ============================================
  /**
   * Search memories semantically
   */
  async search(request) {
    return this.request("POST", "/v1/memory/search", request);
  }
  // ============================================
  // Usage API
  // ============================================
  /**
   * Get usage statistics for the current billing period
   */
  async getUsage() {
    return this.request("GET", "/v1/usage");
  }
  /**
   * Get daily usage breakdown
   */
  async getDailyUsage(days = 30) {
    return this.request("GET", `/v1/usage/daily?days=${days}`);
  }
  // ============================================
  // Ask API (RAG)
  // ============================================
  /**
   * Ask a question using RAG over memories
   */
  async ask(request) {
    return this.request("POST", "/v1/memory/ask", request);
  }
  // ============================================
  // Solve API
  // ============================================
  /**
   * Get AI-powered diagnosis and fix recommendations for a problem
   */
  async solve(request) {
    return this.request("POST", "/v1/solve", request);
  }
  // ============================================
  // Secure Review API
  // ============================================
  /**
   * Perform defensive security review of code or config
   */
  async secureReview(request) {
    return this.request("POST", "/v1/secure-review", request);
  }
};
var client_default = IntellectMemoryClient;
export {
  AuthenticationError,
  AuthorizationError,
  IntellectMemoryClient as IntellectMemory,
  IntellectMemoryClient,
  IntellectMemoryError,
  NotFoundError,
  QuotaExceededError,
  RateLimitError,
  ServerError,
  ValidationError,
  client_default as default
};
//# sourceMappingURL=index.js.map