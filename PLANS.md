# Intellect Memory - Plans & Pricing

## Plan Tiers

| Feature | Free | Plus | Pro |
|---------|------|------|-----|
| **Price** | $0/mo | $17/mo | $299/mo |
| **Tokens Processed** | 1M | 3M | 75M |
| **Search Queries** | 10K | 100K | 15M |
| **Memories Stored** | 1,000 | 10,000 | 500,000 |
| **Documents Stored** | 100 MB | 1 GB | 50 GB |
| **API Keys** | 2 | 10 | 100 |
| **Projects** | 1 | 5 | Unlimited |
| **Rate Limit (req/min)** | 60 | 300 | 1,000 |
| **Support** | Community | Email (48h) | Dedicated + Slack |
| **Analytics** | Basic | Advanced | Custom |
| **Webhooks** | No | Yes | Yes |
| **Data Retention** | 30 days | 1 year | Unlimited |
| **SLA** | None | 99.5% | 99.9% |

---

## Quota Definitions

### Tokens Processed

**Definition:** Total input tokens sent to OpenAI for embedding generation.

**Counting:**
- Measured using OpenAI tokenizer (tiktoken cl100k_base)
- Counted once per unique content (cached embeddings = 0 tokens)
- Includes: memory content, document text, search queries

**Example:**
- Create memory with 500 tokens = 500 tokens counted
- Create same memory again = 0 tokens (cache hit)
- Search with 50-token query = 50 tokens counted

### Search Queries

**Definition:** Number of semantic search API calls.

**Counting:**
- One query = one API call to `POST /v1/search`
- Regardless of result count
- Failed queries don't count

### Memories Stored

**Definition:** Total number of active memory records.

**Counting:**
- Cumulative, not per-period
- Deleted memories free up quota immediately
- Chunked memories count as one (source memory)

### Documents Stored

**Definition:** Total storage size of uploaded documents in R2.

**Counting:**
- Cumulative, not per-period
- Original file size (not processed text)
- Deleted documents free up quota immediately

### API Keys

**Definition:** Total number of non-revoked API keys.

**Counting:**
- Revoked keys don't count
- Expired keys don't count
- Per user, across all projects

---

## Quota Enforcement

### Soft vs Hard Limits

| Quota | Type | On Exceed |
|-------|------|-----------|
| Tokens | Hard | 402 Payment Required |
| Search Queries | Hard | 402 Payment Required |
| Memories | Hard | 402 Payment Required |
| Documents | Hard | 402 Payment Required |
| API Keys | Hard | 400 Bad Request |
| Rate Limit | Hard | 429 Too Many Requests |

### Enforcement Flow

```
Request → Auth → Rate Limit → Quota Check → Handler → Usage Record
                     ↓              ↓
                   429?           402?
```

### Pre-flight Checks

Before expensive operations, check if quota allows:

```javascript
// Pseudocode
async function checkQuota(userId, operation) {
  const usage = await getUsage(userId);
  const limits = await getPlanLimits(userId);

  switch (operation) {
    case 'create_memory':
      if (usage.memories >= limits.memories) {
        throw new QuotaExceededError('memories');
      }
      break;
    case 'embed':
      const estimatedTokens = estimateTokens(content);
      if (usage.tokens + estimatedTokens > limits.tokens) {
        throw new QuotaExceededError('tokens');
      }
      break;
  }
}
```

### Quota Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Token quota exceeded for your plan",
    "details": {
      "quota": "tokens_processed",
      "limit": 1000000,
      "used": 1000000,
      "plan": "free",
      "upgrade_url": "https://app.intellectmemory.com/billing"
    }
  }
}
```

---

## Billing Periods

### Period Definition

- **Start:** First day user created account (or subscription start)
- **Length:** 30 days (calendar month for annual)
- **Reset:** All per-period quotas reset to 0

### Period Calculation

```javascript
function getBillingPeriod(user) {
  const anchor = user.billing_anchor || user.created_at;
  const now = new Date();

  // Find current period start
  let periodStart = new Date(anchor);
  while (periodStart <= now) {
    periodStart.setMonth(periodStart.getMonth() + 1);
  }
  periodStart.setMonth(periodStart.getMonth() - 1);

  // Period end
  let periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return { start: periodStart, end: periodEnd };
}
```

---

## Upgrade Behavior

### Immediate Upgrade

When user upgrades (Free → Plus, Plus → Pro):

1. **Billing:**
   - Prorated charge for remaining days
   - New period starts immediately (or at next renewal)

2. **Quotas:**
   - New limits apply immediately
   - Current usage preserved (not reset)
   - Remaining quota = new_limit - current_usage

3. **Features:**
   - New features available immediately
   - Webhooks enabled (if upgrading to Plus+)
   - Rate limits increased

### Example: Free → Plus Mid-Period

```
Day 15 of 30-day period
Usage: 800K tokens / 1M limit

After upgrade:
- Limit: 3M tokens
- Usage: 800K tokens (preserved)
- Remaining: 2.2M tokens
- Rate limit: 300 req/min (immediate)
```

---

## Downgrade Behavior

### Downgrade at Period End

When user downgrades (Pro → Plus, Plus → Free):

1. **Timing:**
   - Current plan active until period end
   - New plan starts at next period

2. **Quotas:**
   - Old limits apply until period end
   - New (lower) limits apply at reset

3. **Overage Handling:**
   - If current usage > new limit: read-only mode
   - User must delete data to get under limit
   - No automatic deletion

### Example: Plus → Free at Period End

```
Current (Plus): 8,000 memories stored
New (Free): 1,000 memory limit

At period end:
- Read-only mode for memories
- User sees warning: "Delete 7,000 memories to restore write access"
- Search still works (read)
- Cannot create new memories (write blocked)
```

### Overage Resolution

```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Memory limit exceeded. Delete memories to restore access.",
    "details": {
      "quota": "memories_stored",
      "limit": 1000,
      "used": 8000,
      "action_required": "delete",
      "delete_count": 7000
    }
  }
}
```

---

## Cancellation Behavior

### Cancellation Flow

1. User initiates cancel in billing portal
2. Subscription marked `cancel_at_period_end = true`
3. Full access until period end
4. At period end: Downgrade to Free

### Post-Cancellation

- Data retained for 30 days (Free tier limits)
- After 30 days: Data scheduled for deletion
- User can resubscribe to restore access

---

## Enterprise / Custom Plans

### Pro+ Features (Contact Sales)

- Custom token limits (75M+)
- Custom rate limits
- Dedicated support channel
- SSO/SAML integration
- Custom embedding models
- On-premise data residency
- Custom SLA (99.99%)
- Audit log export
- Volume discounts

### Pricing Model

- Base: $299/mo (Pro equivalent)
- Additional tokens: $0.10 per 1M
- Additional storage: $0.02 per GB
- Dedicated support: $500/mo add-on
- SSO: $200/mo add-on

---

## Stripe Integration

### Products & Prices

```javascript
// Stripe Product IDs
const PRODUCTS = {
  free: null, // No Stripe product
  plus: 'prod_PlusMonthly',
  pro: 'prod_ProMonthly'
};

// Stripe Price IDs
const PRICES = {
  plus_monthly: 'price_PlusMonthly_17',
  plus_annual: 'price_PlusAnnual_170',
  pro_monthly: 'price_ProMonthly_299',
  pro_annual: 'price_ProAnnual_2990'
};
```

### Subscription States

| Stripe Status | Our State | Access |
|---------------|-----------|--------|
| active | active | Full |
| trialing | active | Full |
| past_due | grace | Full (7 days) |
| canceled | canceled | Free tier |
| unpaid | suspended | Read-only |

### Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription, upgrade plan |
| `customer.subscription.updated` | Update plan, handle upgrade/downgrade |
| `customer.subscription.deleted` | Downgrade to Free |
| `invoice.payment_failed` | Send warning, start grace period |
| `invoice.payment_succeeded` | Clear grace period, log payment |

---

## Usage Tracking Implementation

### Real-time (Durable Object)

```typescript
// Hot path - in memory, synced to D1 every 60s
interface MeterState {
  tokens: number;
  searches: number;
  lastSync: number;
}
```

### Persistent (D1)

```sql
-- Daily aggregates
CREATE TABLE usage_daily (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,  -- YYYY-MM-DD
  tokens_processed INTEGER DEFAULT 0,
  search_queries INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- Query current period usage
SELECT SUM(tokens_processed), SUM(search_queries)
FROM usage_daily
WHERE user_id = ?
  AND date >= ?  -- period_start
  AND date < ?;  -- period_end
```

### Cumulative Counts (D1)

```sql
-- Stored memories count
SELECT COUNT(*) FROM memory_items WHERE user_id = ? AND deleted_at IS NULL;

-- Stored documents size
SELECT SUM(size_bytes) FROM documents WHERE user_id = ? AND deleted_at IS NULL;
```

---

## Grace Periods

### Payment Failure Grace

- Duration: 7 days
- Access: Full (unchanged)
- Notifications: Email on day 1, 3, 5, 7
- After grace: Downgrade to Free

### Quota Soft Warning

- Trigger: 80% of any quota
- Action: Email notification, dashboard warning
- No access restriction
