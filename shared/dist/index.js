// src/constants.ts
var PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    stripePriceId: null,
    limits: {
      tokensProcessed: 1e6,
      searchQueries: 1e4,
      memoriesStored: 1e3,
      documentsStoredBytes: 100 * 1024 * 1024,
      // 100 MB
      apiKeys: 2,
      projects: 1,
      rateLimit: 60
      // req/min
    },
    features: ["Community support", "Basic analytics", "30-day data retention"]
  },
  plus: {
    id: "plus",
    name: "Plus",
    price: 17,
    stripePriceId: "price_plus_monthly",
    limits: {
      tokensProcessed: 3e6,
      searchQueries: 1e5,
      memoriesStored: 1e4,
      documentsStoredBytes: 1024 * 1024 * 1024,
      // 1 GB
      apiKeys: 10,
      projects: 5,
      rateLimit: 300
    },
    features: [
      "Email support (48h)",
      "Advanced analytics",
      "Webhooks",
      "1-year data retention",
      "99.5% SLA"
    ]
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 299,
    stripePriceId: "price_pro_monthly",
    limits: {
      tokensProcessed: 75e6,
      searchQueries: 15e6,
      memoriesStored: 5e5,
      documentsStoredBytes: 50 * 1024 * 1024 * 1024,
      // 50 GB
      apiKeys: 100,
      projects: -1,
      // unlimited
      rateLimit: 1e3
    },
    features: [
      "Dedicated support + Slack",
      "Custom analytics",
      "Webhooks",
      "Unlimited data retention",
      "99.9% SLA",
      "Custom integrations"
    ]
  }
};
var SCOPES = {
  "memories:read": "Read memories",
  "memories:write": "Create and update memories",
  "memories:delete": "Delete memories",
  "search:read": "Perform semantic search",
  "documents:read": "Read and download documents",
  "documents:write": "Upload documents",
  "documents:delete": "Delete documents",
  "usage:read": "View usage statistics",
  "keys:read": "List API keys",
  "keys:write": "Create API keys",
  "keys:delete": "Revoke API keys"
};
var ALL_SCOPES = Object.keys(SCOPES);
var ERROR_CODES = {
  // Auth
  INVALID_API_KEY: "INVALID_API_KEY",
  API_KEY_REVOKED: "API_KEY_REVOKED",
  API_KEY_EXPIRED: "API_KEY_EXPIRED",
  INSUFFICIENT_SCOPE: "INSUFFICIENT_SCOPE",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_JSON: "INVALID_JSON",
  // Resources
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  // Limits
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  CONTENT_TOO_LARGE: "CONTENT_TOO_LARGE",
  UNSUPPORTED_FILE_TYPE: "UNSUPPORTED_FILE_TYPE",
  // External
  EMBEDDING_FAILED: "EMBEDDING_FAILED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  // Server
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE"
};
var API_VERSION = "v1";
var EMBEDDING_MODEL = "text-embedding-3-small";
var EMBEDDING_DIMENSIONS = 1536;
var MAX_CONTENT_LENGTH = 1e5;
var MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;
var SESSION_TTL_DAYS = 7;
var IDEMPOTENCY_KEY_TTL_HOURS = 24;
var CURSOR_TTL_HOURS = 24;

// src/schemas.ts
import { z } from "zod";
var IdSchema = z.string().uuid();
var EmailSchema = z.string().email().max(254);
var TimestampSchema = z.string().datetime();
var CursorSchema = z.string().min(1).max(500);
var PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: CursorSchema.optional()
});
var PaginationResponseSchema = z.object({
  next_cursor: z.string().nullable(),
  has_more: z.boolean()
});
var RegisterRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional()
});
var LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(128)
});
var UserSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  name: z.string().nullable(),
  plan_id: z.enum(["free", "plus", "pro"]),
  created_at: TimestampSchema
});
var ScopeSchema = z.enum(ALL_SCOPES);
var CreateApiKeyRequestSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(ScopeSchema).min(1),
  expires_at: TimestampSchema.optional(),
  project_id: IdSchema.optional()
});
var ApiKeySchema = z.object({
  id: IdSchema,
  name: z.string(),
  prefix: z.string(),
  scopes: z.array(ScopeSchema),
  last_used_at: TimestampSchema.nullable(),
  expires_at: TimestampSchema.nullable(),
  created_at: TimestampSchema
});
var ApiKeyWithSecretSchema = ApiKeySchema.extend({
  secret: z.string()
});
var MetadataSchema = z.record(z.string(), z.unknown()).default({});
var CreateMemoryRequestSchema = z.object({
  content: z.string().min(1).max(1e5),
  metadata: MetadataSchema,
  project_id: IdSchema.optional()
});
var UpdateMemoryRequestSchema = z.object({
  content: z.string().min(1).max(1e5).optional(),
  metadata: MetadataSchema.optional()
});
var MemorySchema = z.object({
  id: IdSchema,
  content: z.string(),
  content_hash: z.string(),
  metadata: MetadataSchema,
  token_count: z.number().int(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema
});
var SearchRequestSchema = z.object({
  query: z.string().min(1).max(1e4),
  limit: z.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  project_id: IdSchema.optional(),
  filters: z.object({
    metadata: z.record(z.string(), z.unknown()).optional()
  }).optional()
});
var SearchResultSchema = z.object({
  memory: MemorySchema,
  score: z.number(),
  chunk_index: z.number().int()
});
var SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  query_embedding_cached: z.boolean(),
  search_time_ms: z.number()
});
var DocumentStatusSchema = z.enum(["pending", "processing", "processed", "failed"]);
var DocumentSchema = z.object({
  id: IdSchema,
  name: z.string(),
  mime_type: z.string(),
  size_bytes: z.number().int(),
  status: DocumentStatusSchema,
  created_at: TimestampSchema,
  processed_at: TimestampSchema.nullable()
});
var UsageSchema = z.object({
  tokens_processed: z.number().int(),
  search_queries: z.number().int(),
  memories_stored: z.number().int(),
  documents_stored_bytes: z.number().int()
});
var UsageResponseSchema = z.object({
  period: z.object({
    start: TimestampSchema,
    end: TimestampSchema
  }),
  usage: UsageSchema,
  limits: UsageSchema,
  percentage: z.record(z.string(), z.number())
});
var CheckoutRequestSchema = z.object({
  plan_id: z.enum(["plus", "pro"]),
  success_url: z.string().url(),
  cancel_url: z.string().url()
});
var SubscriptionSchema = z.object({
  plan_id: z.enum(["free", "plus", "pro"]),
  status: z.enum(["active", "canceled", "past_due", "trialing"]),
  current_period_end: TimestampSchema,
  cancel_at_period_end: z.boolean()
});
var ApiResponseSchema = (dataSchema) => z.object({
  success: z.literal(true),
  data: dataSchema,
  meta: z.object({
    request_id: z.string(),
    timestamp: TimestampSchema
  })
});
var ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional()
  }),
  meta: z.object({
    request_id: z.string(),
    timestamp: TimestampSchema
  })
});

// src/utils.ts
function generateId(prefix = "") {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}
function generateApiKey(isTest = false) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const prefix = isTest ? "im_test_" : "im_live_";
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars[bytes[i] % chars.length];
  }
  return key;
}
function getApiKeyPrefix(apiKey) {
  return apiKey.slice(0, 16);
}
async function sha256(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hmacSha256(key, message) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const saltBytes = salt ? hexToBytes(salt) : crypto.getRandomValues(new Uint8Array(16));
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 1e5,
      hash: "SHA-256"
    },
    passwordKey,
    256
  );
  const hashHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const saltHex = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { hash: hashHex, salt: saltHex };
}
async function verifyPassword(password, hash, salt) {
  const result = await hashPassword(password, salt);
  return timingSafeEqual(result.hash, hash);
}
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    let result2 = 0;
    const longer = a.length > b.length ? a : b;
    for (let i = 0; i < longer.length; i++) {
      result2 |= longer.charCodeAt(i) ^ (longer.charCodeAt(i) || 0);
    }
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
function encodeCursor(data) {
  const json = JSON.stringify(data);
  return btoa(json);
}
function decodeCursor(cursor) {
  try {
    const json = atob(cursor);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
function truncate(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + "...";
}
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}
function formatNumber(num) {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(1)}B`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`;
  }
  return num.toString();
}
function now() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function getBillingPeriod(anchorDate) {
  const nowDate = /* @__PURE__ */ new Date();
  const anchor = new Date(anchorDate);
  const periodStart = new Date(anchor);
  while (periodStart <= nowDate) {
    periodStart.setMonth(periodStart.getMonth() + 1);
  }
  periodStart.setMonth(periodStart.getMonth() - 1);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  return { start: periodStart, end: periodEnd };
}
function chunkText(text, maxChars = 2e3, overlap = 200) {
  if (text.length <= maxChars) {
    return [text];
  }
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + maxChars / 2) {
        end = paragraphBreak + 2;
      } else {
        const sentenceBreak = text.lastIndexOf(". ", end);
        if (sentenceBreak > start + maxChars / 2) {
          end = sentenceBreak + 2;
        } else {
          const wordBreak = text.lastIndexOf(" ", end);
          if (wordBreak > start + maxChars / 2) {
            end = wordBreak + 1;
          }
        }
      }
    }
    chunks.push(text.slice(start, end).trim());
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}
async function generateChunkId(memoryId, chunkIndex, content) {
  const hash = await sha256(`${memoryId}:${chunkIndex}:${content.slice(0, 100)}`);
  return `chunk_${hash.slice(0, 16)}`;
}
function normalizeForEmbedding(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}
export {
  ALL_SCOPES,
  API_VERSION,
  ApiErrorSchema,
  ApiKeySchema,
  ApiKeyWithSecretSchema,
  ApiResponseSchema,
  CURSOR_TTL_HOURS,
  CheckoutRequestSchema,
  CreateApiKeyRequestSchema,
  CreateMemoryRequestSchema,
  CursorSchema,
  DocumentSchema,
  DocumentStatusSchema,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  ERROR_CODES,
  EmailSchema,
  IDEMPOTENCY_KEY_TTL_HOURS,
  IdSchema,
  LoginRequestSchema,
  MAX_CONTENT_LENGTH,
  MAX_DOCUMENT_SIZE,
  MemorySchema,
  MetadataSchema,
  PLANS,
  PaginationQuerySchema,
  PaginationResponseSchema,
  RegisterRequestSchema,
  SCOPES,
  SESSION_TTL_DAYS,
  ScopeSchema,
  SearchRequestSchema,
  SearchResponseSchema,
  SearchResultSchema,
  SubscriptionSchema,
  TimestampSchema,
  UpdateMemoryRequestSchema,
  UsageResponseSchema,
  UsageSchema,
  UserSchema,
  chunkText,
  decodeCursor,
  encodeCursor,
  estimateTokens,
  formatBytes,
  formatNumber,
  generateApiKey,
  generateChunkId,
  generateId,
  getApiKeyPrefix,
  getBillingPeriod,
  hashPassword,
  hmacSha256,
  normalizeForEmbedding,
  now,
  sha256,
  timingSafeEqual,
  truncate,
  verifyPassword
};
