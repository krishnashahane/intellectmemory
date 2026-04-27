# Intellect Memory - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Web Dashboard          SDK/HTTP Clients           Webhooks (outbound)      │
│  (Next.js/Vercel)       (any language)             (user endpoints)         │
└──────────┬─────────────────────┬─────────────────────────┬──────────────────┘
           │                     │                         │
           ▼                     ▼                         │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE EDGE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Cloudflare Worker (Hono)                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │    │
│  │  │   Auth   │  │  Routes  │  │  Rate    │  │  Quota   │             │    │
│  │  │Middleware│─▶│ Handler  │─▶│ Limiter  │─▶│ Checker  │             │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│           │              │              │              │                     │
│           ▼              ▼              ▼              ▼                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │     D1     │  │     R2     │  │ Vectorize  │  │  Durable   │            │
│  │  Database  │  │   Bucket   │  │   Index    │  │  Objects   │            │
│  │            │  │            │  │            │  │  (METER)   │            │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐                                             │
│  │   OpenAI   │  │   Stripe   │                                             │
│  │ Embeddings │  │  Billing   │                                             │
│  └────────────┘  └────────────┘                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Cloudflare Worker (API)

**Runtime:** Cloudflare Workers (V8 isolates)
**Framework:** Hono (lightweight, fast)
**Location:** Edge (200+ PoPs globally)

**Responsibilities:**
- Request routing and validation
- Authentication (API key verification)
- Rate limiting coordination
- Business logic execution
- Response formatting

**Request Flow:**
1. Request hits nearest Cloudflare PoP
2. Worker validates API key (hash lookup in D1)
3. Rate limiter Durable Object checks/increments counters
4. Quota checker verifies plan limits
5. Handler executes business logic
6. Response returned with appropriate headers

### 2. D1 Database (SQLite)

**Type:** Cloudflare D1 (distributed SQLite)
**Replication:** Automatic, read replicas at edge
**Consistency:** Strong consistency for writes, eventual for reads

**Tables:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| users | User accounts | id, email, stripe_customer_id |
| sessions | Auth sessions | id, user_id, token_hash, expires_at |
| projects | Logical grouping | id, user_id, name |
| api_keys | API credentials | id, project_id, key_hash, key_prefix |
| api_key_scopes | Key permissions | api_key_id, scope |
| memory_items | Memory records | id, project_id, content, metadata |
| memory_chunks | Chunked content | id, memory_item_id, chunk_index |
| chunk_cache | Embedding cache | content_hash, embedding_blob |
| usage_daily | Usage aggregates | user_id, date, tokens, searches |
| subscriptions | Plan state | user_id, plan_id, status |
| stripe_events | Webhook log | id, event_type, processed_at |

### 3. R2 Bucket (Object Storage)

**Type:** Cloudflare R2 (S3-compatible)
**Use Cases:**
- Document uploads (PDF, text, markdown)
- Large memory content (>64KB)
- Export archives

**Key Structure:**
```
/{user_id}/documents/{document_id}/{filename}
/{user_id}/exports/{export_id}.json
```

### 4. Vectorize Index

**Type:** Cloudflare Vectorize
**Dimensions:** 1536 (OpenAI text-embedding-3-small)
**Metric:** Cosine similarity

**Vector Metadata:**
```json
{
  "user_id": "uuid",
  "project_id": "uuid",
  "memory_id": "uuid",
  "chunk_index": 0,
  "created_at": "iso8601"
}
```

**Query Pattern:**
1. Embed query text via OpenAI (or cache hit)
2. Query Vectorize with user_id filter
3. Return top-K results with scores
4. Fetch full memory content from D1

### 5. Durable Objects (METER)

**Type:** Cloudflare Durable Objects
**Purpose:** Distributed rate limiting and metering

**Design:**
- One DO instance per user (named by user_id)
- Maintains in-memory counters with periodic D1 sync
- Handles burst allowance and sliding windows

**State Structure:**
```typescript
interface MeterState {
  requests: { count: number; windowStart: number };
  tokens: { used: number; periodStart: number };
  searches: { used: number; periodStart: number };
}
```

---

## Data Flow

### Memory Creation Flow

```
Client                    Worker                   OpenAI              D1/Vectorize
  │                         │                        │                      │
  │──POST /memories────────▶│                        │                      │
  │                         │                        │                      │
  │                         │──hash(content)────────▶│                      │
  │                         │                        │                      │
  │                         │──check cache──────────────────────────────────▶│
  │                         │◀─────────────────────────────────(miss)───────│
  │                         │                        │                      │
  │                         │──embed(content)───────▶│                      │
  │                         │◀──[1536 floats]────────│                      │
  │                         │                        │                      │
  │                         │──store cache─────────────────────────────────▶│
  │                         │──insert memory───────────────────────────────▶│
  │                         │──upsert vector───────────────────────────────▶│
  │                         │                        │                      │
  │◀─────201 Created────────│                        │                      │
```

### Semantic Search Flow

```
Client                    Worker                   OpenAI              Vectorize/D1
  │                         │                        │                      │
  │──POST /search──────────▶│                        │                      │
  │                         │                        │                      │
  │                         │──embed(query)─────────▶│                      │
  │                         │◀──[1536 floats]────────│                      │
  │                         │                        │                      │
  │                         │──query(vector, user_id filter)───────────────▶│
  │                         │◀──[{id, score}...]────────────────────────────│
  │                         │                        │                      │
  │                         │──fetch memories by ids────────────────────────▶│
  │                         │◀──[memory objects]────────────────────────────│
  │                         │                        │                      │
  │◀─────200 OK + results───│                        │                      │
```

---

## Threat Model

### Assets

| Asset | Sensitivity | Protection |
|-------|-------------|------------|
| User email/password | High | Hashed (argon2), encrypted at rest |
| API keys | Critical | SHA-256 hash only, never stored raw |
| Memory content | High | Tenant isolation, encrypted at rest |
| Embeddings | Medium | No PII, but reveals content semantics |
| Usage data | Low | Aggregated, no content |

### Threats and Mitigations

| ID | Threat | Category | Severity | Mitigation |
|----|--------|----------|----------|------------|
| T1 | API key theft | Auth | Critical | Hash-only storage, key rotation, prefix for identification |
| T2 | Cross-tenant data access | AuthZ | Critical | user_id filter on ALL queries, middleware enforcement |
| T3 | SQL injection | Injection | High | Parameterized queries via D1 bindings (never string concat) |
| T4 | Prompt injection via memory | Injection | Medium | Content is stored, not executed; sanitize on retrieval |
| T5 | Rate limit bypass | DoS | Medium | Durable Objects provide distributed consistency |
| T6 | Webhook SSRF | SSRF | Medium | Validate webhook URLs, block internal IPs |
| T7 | Replay attacks | Auth | Low | Short-lived sessions, nonce in requests |
| T8 | Billing fraud | Fraud | Medium | Stripe webhook verification, idempotency keys |

### Security Controls

| Control | Implementation |
|---------|----------------|
| Authentication | API key hash comparison (constant-time) |
| Authorization | Scope-based (per API key), resource ownership |
| Input validation | Zod schemas, max lengths, type coercion |
| Output encoding | JSON only, no HTML rendering |
| Rate limiting | Sliding window via Durable Objects |
| Audit logging | All mutations logged with actor, timestamp, IP |
| Secrets management | Wrangler secrets, never in code |
| TLS | Enforced by Cloudflare (HTTPS only) |

---

## Rate Limiting Model

### Algorithm: Sliding Window with Burst

```
Window: 60 seconds
Limit: Based on plan (e.g., 60 req/min for Free)
Burst: 10% of limit can be consumed in first 10 seconds
```

### Implementation (Durable Object)

```typescript
// Pseudocode
class RateLimiter {
  async checkLimit(userId: string, planLimit: number): Promise<{allowed: boolean, remaining: number}> {
    const window = 60_000; // 1 minute
    const now = Date.now();

    // Get or create state for user
    const state = await this.storage.get(userId) ?? { requests: [], windowStart: now };

    // Remove requests outside window
    state.requests = state.requests.filter(t => t > now - window);

    // Check limit
    if (state.requests.length >= planLimit) {
      return { allowed: false, remaining: 0 };
    }

    // Add request
    state.requests.push(now);
    await this.storage.put(userId, state);

    return { allowed: true, remaining: planLimit - state.requests.length };
  }
}
```

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699900000
Retry-After: 15  (only on 429)
```

---

## Metering Model

### Tracked Metrics

| Metric | Granularity | Storage | Enforcement |
|--------|-------------|---------|-------------|
| Tokens processed | Per request | Durable Object (hot), D1 (cold) | Hard limit per billing period |
| Search queries | Per request | Durable Object (hot), D1 (cold) | Hard limit per billing period |
| Memories stored | Cumulative | D1 | Hard limit (total count) |
| Documents stored | Cumulative | D1 | Hard limit (total size) |
| API keys | Cumulative | D1 | Hard limit (count) |

### Metering Flow

1. Request arrives, auth passes
2. Durable Object fetches current period usage
3. If under limit: increment counter, allow request
4. If at/over limit: reject with 402 Payment Required
5. Async: Flush counters to D1 every 60 seconds

### Period Reset

- Billing period: Monthly, aligned to subscription start
- Reset: Counters reset to 0 at period start
- Grace: 1 hour grace period for webhook processing

---

## Storage Layout

### D1 Schema (Key Tables)

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan_id TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- API Keys (hash only)
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,  -- 'im_' + first 8 chars
  key_hash TEXT NOT NULL,    -- SHA-256 of full key
  last_used_at TEXT,
  expires_at TEXT,
  revoked_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Embedding Cache
CREATE TABLE chunk_cache (
  content_hash TEXT PRIMARY KEY,  -- SHA-256 of content
  embedding BLOB NOT NULL,        -- Float32Array as bytes
  model TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### R2 Key Structure

```
/users/{user_id}/
  /documents/{doc_id}/{original_filename}
  /exports/{export_id}.json.gz
  /avatars/{hash}.webp
```

### Vectorize Metadata

```json
{
  "id": "vec_xxxx",
  "values": [0.1, 0.2, ...],  // 1536 dimensions
  "metadata": {
    "user_id": "usr_xxxx",
    "project_id": "prj_xxxx",
    "memory_id": "mem_xxxx",
    "chunk_index": 0
  }
}
```

---

## Deployment Architecture

### Environments

| Environment | API | Web | Database | Purpose |
|-------------|-----|-----|----------|---------|
| Local | Wrangler dev (8787) | Next.js dev (3000) | D1 local | Development |
| Preview | Workers preview | Vercel preview | D1 preview | PR testing |
| Production | workers.dev / custom | Vercel prod | D1 prod | Live traffic |

### CI/CD Pipeline

```
Push to main
    │
    ├─▶ Lint + Typecheck
    │
    ├─▶ Unit Tests
    │
    ├─▶ Build API (wrangler build)
    │
    ├─▶ Build Web (next build)
    │
    ├─▶ Deploy API (wrangler deploy)
    │
    ├─▶ Deploy Web (vercel deploy)
    │
    └─▶ Smoke Tests (prod endpoints)
```

### Observability

| Signal | Tool | Retention |
|--------|------|-----------|
| Logs | Cloudflare Logs + Logpush | 7 days |
| Metrics | Cloudflare Analytics | 30 days |
| Traces | (future) Baselime/Axiom | 14 days |
| Errors | Sentry | 30 days |
| Uptime | Cloudflare Health Checks | N/A |
