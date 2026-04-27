# Intellect Memory - API Reference

## Base URL

```
Production: https://api.intellectmemory.com
Local:      http://localhost:8787
```

## Authentication

### API Key Authentication

All API requests require an API key in the `Authorization` header:

```
Authorization: Bearer im_xxxxxxxxxxxxxxxxxxxx
```

API keys are scoped. Requests require the appropriate scope for the endpoint.

### Session Authentication (Dashboard)

Web dashboard uses HTTP-only cookies with session tokens:

```
Cookie: session=sess_xxxxxxxxxxxxxxxxxxxx
```

---

## Request Format

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer {api_key}` or session cookie |
| Content-Type | Yes (POST/PUT) | `application/json` |
| X-Request-Id | No | Client-generated UUID for tracing |
| X-Idempotency-Key | No | For POST requests (see Idempotency) |

### Body

JSON only. UTF-8 encoded. Max 10MB.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_xxxx",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Content is required",
    "details": {
      "field": "content",
      "constraint": "required"
    }
  },
  "meta": {
    "request_id": "req_xxxx",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/PUT/DELETE |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE (no body) |
| 400 | Bad Request | Invalid request body/params |
| 401 | Unauthorized | Missing/invalid API key |
| 403 | Forbidden | Valid key, insufficient scope |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable | Valid JSON, semantic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 402 | Payment Required | Quota exceeded |
| 500 | Internal Error | Server error |
| 503 | Service Unavailable | Maintenance/overload |

### Application Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_API_KEY` | 401 | API key malformed or not found |
| `API_KEY_REVOKED` | 401 | API key has been revoked |
| `API_KEY_EXPIRED` | 401 | API key has expired |
| `INSUFFICIENT_SCOPE` | 403 | API key lacks required scope |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `DUPLICATE_RESOURCE` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `QUOTA_EXCEEDED` | 402 | Plan quota exceeded |
| `CONTENT_TOO_LARGE` | 400 | Content exceeds max size |
| `UNSUPPORTED_FILE_TYPE` | 400 | File type not supported |
| `EMBEDDING_FAILED` | 500 | OpenAI embedding call failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Endpoints

### Health

#### GET /health

Check API health status.

**Scope:** None (public)

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Memories

#### POST /v1/memories

Create a new memory.

**Scope:** `memories:write`

**Request:**
```json
{
  "content": "The user prefers dark mode and compact view",
  "metadata": {
    "category": "preferences",
    "source": "settings_page"
  },
  "project_id": "prj_xxxx"  // optional, uses default
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "memory": {
      "id": "mem_xxxxxxxxxxxx",
      "content": "The user prefers dark mode and compact view",
      "content_hash": "sha256:xxxx",
      "metadata": { "category": "preferences" },
      "token_count": 12,
      "created_at": "2024-01-15T10:30:00Z"
    },
    "embedding_cached": false
  }
}
```

#### GET /v1/memories

List memories with pagination.

**Scope:** `memories:read`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | int | 20 | Max 100 |
| cursor | string | - | Pagination cursor |
| project_id | string | - | Filter by project |
| created_after | string | - | ISO8601 timestamp |
| created_before | string | - | ISO8601 timestamp |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "memories": [...],
    "pagination": {
      "next_cursor": "cur_xxxx",
      "has_more": true
    }
  }
}
```

#### GET /v1/memories/:id

Get a specific memory.

**Scope:** `memories:read`

#### PUT /v1/memories/:id

Update a memory. Re-embeds if content changes.

**Scope:** `memories:write`

#### DELETE /v1/memories/:id

Delete a memory and its embeddings.

**Scope:** `memories:delete`

---

### Search

#### POST /v1/search

Semantic search across memories.

**Scope:** `search:read`

**Request:**
```json
{
  "query": "What are the user's display preferences?",
  "limit": 10,
  "threshold": 0.7,
  "project_id": "prj_xxxx",
  "filters": {
    "metadata.category": "preferences"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "memory": { "id": "mem_xxxx", "content": "...", ... },
        "score": 0.92,
        "chunk_index": 0
      }
    ],
    "query_embedding_cached": true,
    "search_time_ms": 45
  }
}
```

---

### API Keys

#### POST /v1/api-keys

Create a new API key. **Key is returned only once.**

**Scope:** Session auth required (web dashboard)

**Request:**
```json
{
  "name": "Production API",
  "scopes": ["memories:read", "memories:write", "search:read"],
  "expires_at": "2025-01-15T00:00:00Z",
  "project_id": "prj_xxxx"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "api_key": {
      "id": "key_xxxx",
      "name": "Production API",
      "prefix": "im_a1b2c3d4",
      "scopes": ["memories:read", "memories:write", "search:read"],
      "created_at": "2024-01-15T10:30:00Z"
    },
    "secret": "im_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "warning": "Store this key securely. It will not be shown again."
  }
}
```

#### GET /v1/api-keys

List API keys (secrets never returned).

#### DELETE /v1/api-keys/:id

Revoke an API key.

#### POST /v1/api-keys/:id/rotate

Revoke old key and create new one atomically.

---

### Documents

#### POST /v1/documents

Upload a document for processing.

**Scope:** `documents:write`

**Request:** `multipart/form-data`
- `file`: File (max 50MB)
- `project_id`: string (optional)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc_xxxx",
      "name": "report.pdf",
      "size_bytes": 102400,
      "status": "processing"
    }
  }
}
```

#### GET /v1/documents/:id

Get document metadata and processing status.

#### GET /v1/documents/:id/download

Download original file.

#### DELETE /v1/documents/:id

Delete document and extracted memories.

---

### Usage & Billing

#### GET /v1/usage

Get current usage statistics.

**Scope:** Session auth or `usage:read`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-02-01T00:00:00Z"
    },
    "usage": {
      "tokens_processed": 450000,
      "search_queries": 3200,
      "memories_stored": 156,
      "documents_stored": 12
    },
    "limits": {
      "tokens_processed": 1000000,
      "search_queries": 10000,
      "memories_stored": 1000,
      "documents_stored": 100
    },
    "percentage": {
      "tokens_processed": 45,
      "search_queries": 32
    }
  }
}
```

#### POST /v1/billing/checkout

Create Stripe checkout session.

#### POST /v1/billing/portal

Create Stripe billing portal session.

---

## Pagination

### Cursor-Based Pagination

All list endpoints use cursor-based pagination for consistency and performance.

**Request:**
```
GET /v1/memories?limit=20&cursor=cur_eyJpZCI6Im1lbV94eHh4In0
```

**Response:**
```json
{
  "data": {
    "items": [...],
    "pagination": {
      "next_cursor": "cur_eyJpZCI6Im1lbV95eXl5In0",
      "has_more": true
    }
  }
}
```

**Rules:**
- `cursor` is opaque; don't parse or construct
- Cursors expire after 24 hours
- Use `has_more` to determine if more pages exist
- Omit `cursor` for first page

---

## Idempotency

### Idempotency Keys

For `POST` requests, include `X-Idempotency-Key` header:

```
X-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

**Behavior:**
- First request: Processed normally, response cached
- Repeat request (same key): Return cached response
- Key expiration: 24 hours
- Scope: Per API key

**Recommended for:**
- `POST /v1/memories`
- `POST /v1/documents`
- `POST /v1/api-keys/:id/rotate`
- `POST /v1/billing/checkout`

---

## Webhooks

### Webhook Configuration

Configure webhooks in the dashboard. Each webhook has:
- URL (HTTPS required)
- Events to subscribe
- Secret for signature verification

### Webhook Events

| Event | Description |
|-------|-------------|
| `memory.created` | New memory created |
| `memory.updated` | Memory content updated |
| `memory.deleted` | Memory deleted |
| `document.processed` | Document processing complete |
| `document.failed` | Document processing failed |
| `usage.threshold` | Usage hit 80% or 100% |
| `subscription.updated` | Plan changed |

### Webhook Payload

```json
{
  "id": "evt_xxxx",
  "type": "memory.created",
  "created_at": "2024-01-15T10:30:00Z",
  "data": {
    "memory": { ... }
  }
}
```

### Webhook Signature

Verify webhooks using `X-Signature` header:

```
X-Signature: sha256=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Verification:**
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex');
const expected = `sha256=${signature}`;
// Compare with X-Signature header (constant-time)
```

### Webhook Delivery

- Timeout: 30 seconds
- Retries: 3 attempts (1min, 10min, 1hr delays)
- Success: 2xx response
- Failure: Logged, visible in dashboard

---

## Rate Limits

### Default Limits by Plan

| Plan | Requests/min | Burst |
|------|--------------|-------|
| Free | 60 | 10 |
| Plus | 300 | 50 |
| Pro | 1000 | 150 |

### Rate Limit Headers

Every response includes:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699900000
```

On 429 response:

```
Retry-After: 15
```

---

## SDK Examples

### Node.js

```javascript
import { IntellectMemory } from '@intellect-memory/sdk';

const client = new IntellectMemory({ apiKey: 'im_xxxx' });

// Create memory
const memory = await client.memories.create({
  content: 'User prefers dark mode',
  metadata: { category: 'preferences' }
});

// Search
const results = await client.search({
  query: 'display preferences',
  limit: 5
});
```

### cURL

```bash
# Create memory
curl -X POST https://api.intellectmemory.com/v1/memories \
  -H "Authorization: Bearer im_xxxx" \
  -H "Content-Type: application/json" \
  -d '{"content": "User prefers dark mode"}'

# Search
curl -X POST https://api.intellectmemory.com/v1/search \
  -H "Authorization: Bearer im_xxxx" \
  -H "Content-Type: application/json" \
  -d '{"query": "display preferences", "limit": 5}'
```

---

## Versioning

API version is in the URL path: `/v1/`

**Deprecation Policy:**
- New versions announced 6 months before old version sunset
- Deprecation warnings in response headers
- Old versions supported for 12 months after deprecation
