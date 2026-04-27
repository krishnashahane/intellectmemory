# Intellect Memory

Production-grade SaaS for AI-powered memory and knowledge management with semantic search.

## Stack

- **API**: Cloudflare Workers + Hono + Durable Objects + D1 + R2 + Vectorize
- **Web**: Next.js 14 (App Router) + Tailwind + shadcn/ui + Glassmorphism UI
- **Payments**: Stripe (subscriptions)
- **AI**: OpenAI (embeddings with caching)

## Features

- **Semantic Search**: Find memories by meaning, not just keywords
- **Document Upload**: Store and process documents (R2)
- **API Keys**: Secure, scoped, rotatable keys (only hash stored)
- **Rate Limiting**: Distributed rate limiting via Durable Objects
- **Usage Quotas**: Plan-based limits with real-time tracking
- **Security**: Audit logging, threat modeling, input validation

## Plans

| Feature | Free | Plus ($17/mo) | Pro ($299/mo) |
|---------|------|---------------|---------------|
| Tokens Processed | 1M | 3M | 75M |
| Search Queries | 10K | 100K | 15M |
| Documents | 100 | 1,000 | 100,000 |
| API Keys | 2 | 10 | 100 |
| Support | Email | Priority | Dedicated + Slack |

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Cloudflare account (for deployment)
- Stripe account (for payments)
- OpenAI API key

### Local Development

```bash
# Clone and install
git clone https://github.com/your-org/intellect-memory.git
cd intellect-memory
npm install

# Start development servers (API + Web)
./scripts/dev.sh
```

This will start:
- API: http://localhost:8787
- Web: http://localhost:3000

### Environment Variables

Create `packages/api/.dev.vars`:
```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
OPENAI_API_KEY=sk-xxx
JWT_SECRET=your_32_char_secret_here
ENCRYPTION_KEY=your_32_char_key_here
```

Create `packages/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

## Deployment

### Deploy API to Cloudflare

1. **Create Cloudflare resources**:
```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create intellect-memory-db

# Create R2 bucket
npx wrangler r2 bucket create intellect-memory-documents

# Create KV namespace
npx wrangler kv:namespace create KV_CACHE

# Create Vectorize index
npx wrangler vectorize create intellect-memory-embeddings --dimensions=1536 --metric=cosine
```

2. **Update `packages/api/wrangler.toml`** with your resource IDs from the commands above.

3. **Set secrets**:
```bash
cd packages/api
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put JWT_SECRET
npx wrangler secret put ENCRYPTION_KEY
```

4. **Run migrations**:
```bash
npx wrangler d1 migrations apply intellect-memory-db --remote
```

5. **Deploy**:
```bash
npm run deploy:api
```

### Deploy Web to Vercel

1. **Push to GitHub**

2. **Connect to Vercel**:
   - Import repository at [vercel.com/new](https://vercel.com/new)
   - Set root directory to `packages/web`
   - Add environment variable:
     - `NEXT_PUBLIC_API_URL`: Your Cloudflare Workers URL

3. **Deploy**:
```bash
npm run deploy:web
```

### Stripe Setup

1. Create products and prices in Stripe Dashboard
2. Update `packages/shared/src/types.ts` with your price IDs:
   - `price_plus_monthly` for Plus plan
   - `price_pro_monthly` for Pro plan
3. Set up webhook endpoint: `https://your-api.workers.dev/v1/billing/webhook`
4. Configure webhook events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## API Reference

### Authentication

```bash
# Register
curl -X POST https://api.intellectmemory.com/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123"}'

# Login
curl -X POST https://api.intellectmemory.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123"}'
```

### Memories

```bash
# Create memory
curl -X POST https://api.intellectmemory.com/v1/memories \
  -H "Authorization: ApiKey im_xxx" \
  -H "Content-Type: application/json" \
  -d '{"content": "The user prefers dark mode", "metadata": {"category": "preferences"}}'

# Search memories
curl -X POST https://api.intellectmemory.com/v1/memories/search \
  -H "Authorization: ApiKey im_xxx" \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the user settings?", "limit": 10}'

# List memories
curl https://api.intellectmemory.com/v1/memories \
  -H "Authorization: ApiKey im_xxx"
```

### API Keys

```bash
# Create API key (key returned ONLY ONCE)
curl -X POST https://api.intellectmemory.com/v1/api-keys \
  -H "Authorization: Bearer session_token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production API", "scopes": ["memories:read", "memories:write", "search:read"]}'

# List API keys (only prefixes shown)
curl https://api.intellectmemory.com/v1/api-keys \
  -H "Authorization: Bearer session_token"

# Rotate API key
curl -X POST https://api.intellectmemory.com/v1/api-keys/{id}/rotate \
  -H "Authorization: Bearer session_token"
```

## Security

### API Key Security
- Keys are generated with 256 bits of entropy
- Only SHA-256 hash is stored in database
- Prefix stored for identification (`im_xxxxxxxx`)
- Scoped permissions per key
- Rotatable without downtime

### Defensive Security Features
- SQL injection prevention (parameterized queries)
- XSS protection (CSP headers)
- Rate limiting (per-user, plan-based)
- Audit logging (all mutations)
- Input validation and sanitization
- Threat model documented in database

## Architecture

```
packages/
├── api/                 # Cloudflare Workers API
│   ├── src/
│   │   ├── durable-objects/  # Rate limiter, session manager
│   │   ├── middleware/       # Auth, rate limit, security
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # OpenAI, Stripe, Vectorize
│   │   └── utils/            # Crypto, validation, response
│   └── migrations/           # D1 SQL migrations
├── web/                 # Next.js dashboard
│   └── src/
│       ├── app/              # App Router pages
│       ├── components/       # UI components
│       └── lib/              # API client, utilities
└── shared/              # Shared types and constants
```

## Assumptions Made

1. **Authentication**: Simple password hashing for demo; production should use bcrypt/argon2
2. **Email verification**: Not implemented; add for production
3. **Password reset**: Not implemented; add for production
4. **OAuth**: Not implemented; add Google/GitHub login for production
5. **Embedding model**: Using `text-embedding-3-small` (1536 dimensions)
6. **Stripe prices**: Placeholder IDs; update with real Stripe price IDs

## License

MIT
