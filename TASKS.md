# Intellect Memory - Implementation Tasks

Implementation-ordered checklist. Complete in sequence; some tasks can parallelize within phases.

---

## Phase 0: Project Setup

### 0.1 Repository Structure
- [ ] Initialize pnpm monorepo with `pnpm-workspace.yaml`
- [ ] Create directory structure: `apps/web`, `apps/api`, `packages/sdk`, `packages/shared`
- [ ] Configure base `tsconfig.json` with path aliases
- [ ] Add `turbo.json` for task orchestration
- [ ] Configure ESLint + Prettier with shared config
- [ ] Add `.gitignore`, `.nvmrc` (Node 20), `.npmrc`
- [ ] Create root `package.json` with workspace scripts

### 0.2 Shared Package
- [ ] Define Zod schemas for all API request/response types
- [ ] Define TypeScript types (User, Memory, ApiKey, etc.)
- [ ] Define constants: plan limits, scopes, error codes
- [ ] Implement utility functions: ID generation, hashing, validation
- [ ] Export everything from `packages/shared/src/index.ts`

### 0.3 Development Environment
- [ ] Create `.env.example` for all packages
- [ ] Add `pnpm dev` script that runs API + Web concurrently
- [ ] Add `pnpm lint` and `pnpm typecheck` scripts
- [ ] Document local setup in README

---

## Phase 1: API Foundation

### 1.1 Cloudflare Worker Setup
- [ ] Initialize `apps/api` with `wrangler init`
- [ ] Configure `wrangler.toml` with all bindings (D1, R2, Vectorize, DO)
- [ ] Set up Hono with TypeScript
- [ ] Add environment type definitions
- [ ] Configure dev/staging/production environments

### 1.2 Database Schema
- [ ] Create `migrations/0001_initial.sql` with all tables
- [ ] Implement migration runner (apply/rollback)
- [ ] Create `migrations/seed.sql` for test data
- [ ] Document D1 CLI commands for migrations
- [ ] Verify tables created correctly

### 1.3 Core Middleware
- [ ] Implement request ID generation middleware
- [ ] Implement CORS middleware (configurable origins)
- [ ] Implement security headers middleware
- [ ] Implement request logging middleware
- [ ] Implement error handling middleware (global catch)

### 1.4 Response Utilities
- [ ] Define standard response format (success/error)
- [ ] Implement `success()` helper
- [ ] Implement `error()` helper with error codes
- [ ] Implement pagination helpers (cursor encode/decode)

---

## Phase 2: Authentication

### 2.1 User Management
- [ ] Implement `POST /v1/auth/register` (email/password)
- [ ] Implement password hashing (argon2 or bcrypt via WASM)
- [ ] Implement `POST /v1/auth/login`
- [ ] Implement session creation (random token, hash stored)
- [ ] Implement `POST /v1/auth/logout`
- [ ] Implement `GET /v1/auth/me`

### 2.2 Session Management
- [ ] Create sessions table migration
- [ ] Implement session validation middleware
- [ ] Implement session refresh (sliding expiry)
- [ ] Implement session revocation
- [ ] Add session cleanup (expired sessions)

### 2.3 API Key Management
- [ ] Implement `POST /v1/api-keys` (generate, return once)
- [ ] Implement API key hashing (SHA-256)
- [ ] Implement `GET /v1/api-keys` (list, no secrets)
- [ ] Implement `DELETE /v1/api-keys/:id` (revoke)
- [ ] Implement `POST /v1/api-keys/:id/rotate`
- [ ] Implement API key validation middleware

### 2.4 Authorization
- [ ] Define scope constants
- [ ] Implement scope checking middleware
- [ ] Add `api_key_scopes` table
- [ ] Enforce scopes on all protected endpoints

---

## Phase 3: Rate Limiting & Metering

### 3.1 Durable Object Setup
- [ ] Create `MeterDO` Durable Object class
- [ ] Implement state storage (in-memory + periodic D1 sync)
- [ ] Configure DO binding in `wrangler.toml`
- [ ] Implement DO stub routing (by user ID)

### 3.2 Rate Limiting
- [ ] Implement sliding window algorithm in DO
- [ ] Add rate limit middleware
- [ ] Return rate limit headers on all responses
- [ ] Return `429` with `Retry-After` on exceed
- [ ] Configure limits per plan

### 3.3 Usage Metering
- [ ] Implement token counting (tiktoken approximation)
- [ ] Increment token usage in DO
- [ ] Increment search query count in DO
- [ ] Periodic flush to `usage_daily` table
- [ ] Implement `GET /v1/usage` endpoint

### 3.4 Quota Enforcement
- [ ] Pre-flight quota check before expensive ops
- [ ] Return `402` with upgrade URL on exceed
- [ ] Implement quota check for memories count
- [ ] Implement quota check for documents size
- [ ] Implement quota check for API keys count

---

## Phase 4: Memory API

### 4.1 Embedding Service
- [ ] Implement OpenAI client (embeddings endpoint)
- [ ] Implement content hashing (SHA-256)
- [ ] Implement cache lookup (check D1 first)
- [ ] Implement cache write (store embedding blob)
- [ ] Add retry logic for OpenAI failures
- [ ] Track token usage

### 4.2 Vectorize Integration
- [ ] Configure Vectorize index (1536 dims, cosine)
- [ ] Implement vector upsert (with metadata)
- [ ] Implement vector query (with user filter)
- [ ] Implement vector delete
- [ ] Handle Vectorize errors gracefully

### 4.3 Memory CRUD
- [ ] Implement `POST /v1/memories`
  - [ ] Validate input (Zod)
  - [ ] Hash content
  - [ ] Check cache, embed if miss
  - [ ] Store in D1
  - [ ] Upsert in Vectorize
  - [ ] Return memory object
- [ ] Implement `GET /v1/memories` (list with pagination)
- [ ] Implement `GET /v1/memories/:id`
- [ ] Implement `PUT /v1/memories/:id` (re-embed if content changed)
- [ ] Implement `DELETE /v1/memories/:id` (D1 + Vectorize)

### 4.4 Semantic Search
- [ ] Implement `POST /v1/search`
  - [ ] Validate input
  - [ ] Embed query (use cache)
  - [ ] Query Vectorize with filters
  - [ ] Fetch memory details from D1
  - [ ] Return ranked results

---

## Phase 5: Documents

### 5.1 R2 Integration
- [ ] Configure R2 bucket
- [ ] Implement multipart upload handler
- [ ] Implement file validation (type, size)
- [ ] Implement signed URL generation (downloads)
- [ ] Implement file deletion

### 5.2 Document Processing
- [ ] Implement `POST /v1/documents` (upload)
- [ ] Store metadata in D1
- [ ] Trigger background processing
- [ ] Implement text extraction (plain text, markdown)
- [ ] Chunk text into memory items
- [ ] Create embeddings for chunks
- [ ] Update document status

### 5.3 Document Endpoints
- [ ] Implement `GET /v1/documents` (list)
- [ ] Implement `GET /v1/documents/:id` (metadata)
- [ ] Implement `GET /v1/documents/:id/download`
- [ ] Implement `DELETE /v1/documents/:id`

---

## Phase 6: Billing

### 6.1 Stripe Setup
- [ ] Create Stripe products and prices
- [ ] Configure webhook endpoint
- [ ] Implement webhook signature verification
- [ ] Store Stripe customer ID on user

### 6.2 Checkout
- [ ] Implement `POST /v1/billing/checkout`
- [ ] Redirect to Stripe checkout
- [ ] Handle `checkout.session.completed` webhook
- [ ] Create/update subscription in D1

### 6.3 Subscription Management
- [ ] Implement `POST /v1/billing/portal`
- [ ] Handle `customer.subscription.updated`
- [ ] Handle `customer.subscription.deleted`
- [ ] Handle `invoice.payment_failed`
- [ ] Implement plan change logic (upgrade/downgrade)

### 6.4 Billing Status
- [ ] Implement `GET /v1/billing/status`
- [ ] Return current plan, usage, limits
- [ ] Return subscription state

---

## Phase 7: Web Dashboard

### 7.1 Next.js Setup
- [ ] Initialize `apps/web` with Next.js App Router
- [ ] Configure Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Create glassmorphism theme (globals.css)
- [ ] Set up layout with sidebar navigation

### 7.2 Authentication Pages
- [ ] Create `/login` page
- [ ] Create `/register` page
- [ ] Implement auth API client
- [ ] Implement auth context/provider
- [ ] Add protected route middleware

### 7.3 Dashboard
- [ ] Create `/dashboard` with usage overview
- [ ] Show usage meters (tokens, searches)
- [ ] Show quick actions
- [ ] Show recent activity

### 7.4 Memories
- [ ] Create `/memories` list page
- [ ] Create `/memories/new` form
- [ ] Create `/memories/search` page
- [ ] Implement memory card component
- [ ] Implement search results component

### 7.5 API Keys
- [ ] Create `/api-keys` page
- [ ] Implement key creation modal
- [ ] Implement key reveal (one-time)
- [ ] Implement revoke/rotate actions

### 7.6 Billing
- [ ] Create `/billing` page
- [ ] Show current plan
- [ ] Show usage vs limits
- [ ] Implement upgrade flow
- [ ] Link to Stripe portal

---

## Phase 8: SDK

### 8.1 SDK Structure
- [ ] Initialize `packages/sdk` with TypeScript
- [ ] Configure for Node + browser (ESM + CJS)
- [ ] Add fetch polyfill for Node

### 8.2 API Client
- [ ] Implement base client with auth
- [ ] Implement `memories.create()`
- [ ] Implement `memories.list()`
- [ ] Implement `memories.get()`
- [ ] Implement `memories.update()`
- [ ] Implement `memories.delete()`
- [ ] Implement `search()`

### 8.3 Error Handling
- [ ] Define SDK error classes
- [ ] Parse API error responses
- [ ] Add retry logic with backoff
- [ ] Handle rate limiting (respect Retry-After)

### 8.4 Documentation
- [ ] Add JSDoc to all public methods
- [ ] Create README with examples
- [ ] Add TypeScript types to exports

---

## Phase 9: Testing

### 9.1 Unit Tests
- [ ] Test shared utilities (hashing, ID gen)
- [ ] Test Zod schemas (valid/invalid inputs)
- [ ] Test quota calculation logic
- [ ] Test rate limit algorithm

### 9.2 Integration Tests
- [ ] Test auth flows (register, login, logout)
- [ ] Test memory CRUD
- [ ] Test search
- [ ] Test API key lifecycle
- [ ] Test rate limiting
- [ ] Test quota enforcement

### 9.3 E2E Tests
- [ ] Test web dashboard login
- [ ] Test memory creation via UI
- [ ] Test search via UI
- [ ] Test billing upgrade flow

---

## Phase 10: Production Readiness

### 10.1 Security
- [ ] Security review of auth flow
- [ ] Audit all D1 queries (parameterized)
- [ ] Review rate limit effectiveness
- [ ] Add CSP headers
- [ ] Enable Cloudflare WAF rules

### 10.2 Observability
- [ ] Configure Cloudflare Logpush
- [ ] Add structured logging
- [ ] Set up error alerting (Sentry or similar)
- [ ] Create uptime monitors
- [ ] Create dashboard for key metrics

### 10.3 Documentation
- [ ] Finalize API documentation
- [ ] Write getting started guide
- [ ] Write SDK quickstart
- [ ] Document deployment process
- [ ] Create troubleshooting guide

### 10.4 Deployment
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Configure staging environment
- [ ] Configure production environment
- [ ] Set all Wrangler secrets
- [ ] Run D1 migrations in production
- [ ] Verify all endpoints

---

## Phase 11: Launch

### 11.1 Pre-launch
- [ ] Load test API (100 concurrent users)
- [ ] Verify Stripe webhooks in production
- [ ] Test upgrade/downgrade flows
- [ ] Verify email notifications
- [ ] Create marketing site content

### 11.2 Launch
- [ ] Deploy production
- [ ] Monitor for errors
- [ ] Announce on ProductHunt
- [ ] Announce on Twitter/X
- [ ] Monitor user signups

### 11.3 Post-launch
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Plan v1.1 features
