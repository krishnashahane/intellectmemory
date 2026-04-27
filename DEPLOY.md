# Intellect Memory - Production Deployment Guide

## Prerequisites

- Node.js 18+
- pnpm 8+
- Cloudflare account (Workers, D1, R2, Vectorize)
- Stripe account
- Vercel account
- OpenAI API key

---

## 1. Cloudflare Setup

### Create Resources

```bash
cd apps/api

# Create D1 Database
wrangler d1 create intellect-memory-db
# Copy the database_id to wrangler.toml

# Create R2 Bucket
wrangler r2 bucket create intellect-memory-documents

# Create Vectorize Index
wrangler vectorize create intellect-memory-embeddings --dimensions=1536 --metric=cosine

# Create KV Namespace
wrangler kv:namespace create intellect-memory-kv
# Copy the id to wrangler.toml
```

### Update wrangler.toml

Replace all placeholder IDs (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) with your actual resource IDs.

### Set Secrets

```bash
# Required secrets
wrangler secret put JWT_SECRET
# Enter a random 32+ character string

wrangler secret put API_KEY_PEPPER
# Enter another random 32+ character string

wrangler secret put OPENAI_API_KEY
# Enter your OpenAI API key

wrangler secret put STRIPE_SECRET_KEY
# Enter your Stripe secret key (sk_live_...)

wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter your Stripe webhook signing secret (whsec_...)
```

### Run Migrations

```bash
# Local
wrangler d1 migrations apply intellect-memory-db --local

# Production
wrangler d1 migrations apply intellect-memory-db --remote
```

### Deploy API

```bash
# Deploy to production
wrangler deploy --env production

# Deploy to staging (optional)
wrangler deploy --env staging
```

---

## 2. Stripe Setup

### Create Products and Prices

1. Go to Stripe Dashboard > Products
2. Create products:
   - **Plus Plan**: $17/month
   - **Pro Plan**: $299/month
3. Note the `price_id` for each (e.g., `price_xxx`)
4. Update `STRIPE_PRICES` in `apps/api/src/routes/billing.ts` with your actual price IDs

### Configure Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://api.yourdomain.com/v1/billing/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the signing secret (`whsec_...`) and set it as `STRIPE_WEBHOOK_SECRET`

### Local Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:8787/v1/billing/webhook

# Note the webhook signing secret and use it locally
```

---

## 3. Vercel Setup (Frontend)

### Environment Variables

In Vercel Dashboard > Project Settings > Environment Variables, add:

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

For local development, create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### Build Settings

- Framework Preset: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`
- Install Command: `pnpm install`
- Root Directory: `apps/web`

### Deploy

```bash
# From project root
cd apps/web
vercel --prod
```

Or connect your GitHub repo for automatic deployments.

---

## 4. DNS Configuration

### Cloudflare (API)

Add a custom domain in Cloudflare Workers:

1. Workers & Pages > your-worker > Settings > Triggers
2. Add custom domain: `api.yourdomain.com`

### Vercel (Frontend)

1. Project Settings > Domains
2. Add: `app.yourdomain.com` (or your preferred domain)

---

## 5. Security Checklist

- [ ] All secrets set via `wrangler secret put` (not in wrangler.toml)
- [ ] JWT_SECRET is 32+ characters
- [ ] API_KEY_PEPPER is unique and secure
- [ ] CORS configured for production domain in `apps/api/src/index.ts`
- [ ] Stripe webhook signature verification enabled
- [ ] Rate limiting enabled via Durable Objects
- [ ] HTTPS enforced on all endpoints
- [ ] No secrets logged (check error handlers)
- [ ] Database has proper indexes

---

## 6. Smoke Tests

After deployment, verify everything works:

### Health Check

```bash
curl https://api.yourdomain.com/health
# Expected: {"status":"healthy","version":"1.0.0",...}
```

### Signup

```bash
curl -X POST https://api.yourdomain.com/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Expected: {"success":true,"data":{"user":{...},"token":"eyJ..."}}
```

### Login

```bash
curl -X POST https://api.yourdomain.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Expected: {"success":true,"data":{"user":{...},"token":"eyJ..."}}
```

### Create Project

```bash
TOKEN="your-jwt-token"

curl -X POST https://api.yourdomain.com/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"My Project"}'

# Expected: {"success":true,"data":{"project":{...}}}
```

### Create API Key

```bash
PROJECT_ID="your-project-id"

curl -X POST "https://api.yourdomain.com/v1/projects/$PROJECT_ID/keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Key","scopes":["memories:read","memories:write","search:read"]}'

# Expected: {"success":true,"data":{"key":{"secret":"im_live_..."}}}
```

### Add Memory

```bash
API_KEY="im_live_your-key"

curl -X POST https://api.yourdomain.com/v1/memory/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"content":"The quick brown fox jumps over the lazy dog","tags":["test"]}'

# Expected: {"success":true,"data":{"memory_item_id":"...","chunk_count":1}}
```

### Search Memory

```bash
curl -X POST https://api.yourdomain.com/v1/memory/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"query":"quick fox","top_k":5}'

# Expected: {"success":true,"data":{"results":[...]}}
```

### Ask (RAG)

```bash
curl -X POST https://api.yourdomain.com/v1/memory/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"question":"What animal is quick?","top_k":3}'

# Expected: {"success":true,"data":{"answer":"...","citations":[...]}}
```

### Solve

```bash
curl -X POST https://api.yourdomain.com/v1/solve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"problem":"My React component re-renders infinitely"}'

# Expected: {"success":true,"data":{"diagnosis":{...},"fix_plan":[...]}}
```

### Secure Review

```bash
curl -X POST https://api.yourdomain.com/v1/secure-review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "target":"code",
    "artifacts":[{"name":"auth.ts","content":"const password = \"hardcoded\""}]
  }'

# Expected: {"success":true,"data":{"risk_level":"high","findings":[...]}}
```

---

## 7. Monitoring

### Cloudflare Analytics

- Workers & Pages > Analytics
- Monitor request volume, errors, latency

### Stripe Dashboard

- Monitor subscription metrics
- Check for failed payments

### Recommended: Add Logging

Consider adding a logging service:

- Logtail
- Papertrail
- Datadog

---

## 8. Troubleshooting

### "Database not found"

Ensure you've run migrations:

```bash
wrangler d1 migrations apply intellect-memory-db --remote
```

### "Invalid API key"

1. Check API_KEY_PEPPER is set correctly
2. Verify key is not revoked/expired
3. Check key has required scopes

### "Vectorize index not found"

Create the index:

```bash
wrangler vectorize create intellect-memory-embeddings --dimensions=1536 --metric=cosine
```

### "OpenAI API error"

1. Verify OPENAI_API_KEY is set
2. Check OpenAI account has credits
3. Verify model access (GPT-4o requires appropriate tier)

### Stripe webhook fails

1. Verify STRIPE_WEBHOOK_SECRET is correct
2. Check webhook endpoint is publicly accessible
3. Review Stripe webhook logs for errors

---

## Local Development

### Start All Services

```bash
# From project root
pnpm install
pnpm dev
```

This starts:
- API on http://localhost:8787
- Web on http://localhost:3000

### Database

```bash
# Apply migrations locally
cd apps/api
pnpm db:migrate

# Seed with test data (optional)
pnpm db:seed
```

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Vercel        │     │  Cloudflare     │
│   (Next.js)     │────>│  Workers (API)  │
│   app.domain    │     │  api.domain     │
└─────────────────┘     └────────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        v                        v                        v
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   D1 (SQLite) │    │   R2 (S3)     │    │  Vectorize    │
│   Users, Keys │    │   Chunks      │    │  Embeddings   │
└───────────────┘    └───────────────┘    └───────────────┘
        │
        v
┌───────────────┐
│ Durable Objects│
│  (Metering)   │
└───────────────┘
```

---

## Support

- Documentation: https://docs.intellectmemory.com
- Status: https://status.intellectmemory.com
- Email: support@intellectmemory.com
