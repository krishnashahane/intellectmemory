# Intellect Memory

Intellect Memory is the shared contract library and TypeScript SDK for an AI memory API.

This repository currently ships two packages:

- `@intellect-memory/sdk` — typed HTTP client
- `@intellect-memory/shared` — Zod schemas, constants, types, and browser/edge-compatible utilities

The API service, web dashboard, Cloudflare infrastructure, and billing implementation are not part of this repository.

## Requirements

- Node.js 20+
- pnpm 10.22+

The project is a pnpm workspace.

## Install

```bash
git clone https://github.com/krishnashahane/intellectmemory.git
cd intellectmemory
pnpm install
```

The repository intentionally does not include the old generated lockfiles because they referenced application directories that are not present in the source tree. Running `pnpm install` creates a lockfile for the actual two-package workspace.

## Build

Build every package:

```bash
pnpm build
```

Typecheck every package:

```bash
pnpm typecheck
```

Check Markdown/JSON/YAML/TypeScript formatting:

```bash
pnpm format:check
```

## SDK usage

Install the SDK package into an application after publishing or from a local workspace.

```ts
import { IntellectMemory } from '@intellect-memory/sdk';

const client = new IntellectMemory({
  apiKey: process.env.INTELLECT_MEMORY_API_KEY!,
});

const created = await client.addMemory({
  content: 'The user prefers compact interfaces.',
  metadata: {
    category: 'preferences',
  },
});

const results = await client.search({
  query: 'What interface preferences are stored?',
  limit: 5,
});

console.log(created.memory_item_id);
console.log(results.results);
```

### Custom API endpoint

```ts
const client = new IntellectMemory({
  apiKey: process.env.INTELLECT_MEMORY_API_KEY!,
  baseUrl: 'https://example.com',
  timeout: 15_000,
  maxRetries: 2,
});
```

The client rejects non-HTTP(S) base URLs and URLs containing embedded credentials.

## SDK capabilities

The current SDK exposes:

- create, read, list, update, and delete memory operations
- semantic search
- usage and daily-usage queries
- RAG-style `ask`
- `solve`
- defensive `secureReview`

The SDK also exposes specialized error classes so callers can handle authentication, authorization, validation, rate-limit, quota, not-found, server, and protocol failures separately.

## Retry behavior

Transient failures are retried with bounded backoff.

Automatic retries are allowed for idempotent methods and for write operations only when the caller supplies an idempotency key:

```ts
await client.addMemory(
  {
    content: 'Idempotent write',
    metadata: {},
  },
  '550e8400-e29b-41d4-a716-446655440000',
);
```

The SDK also handles numeric and HTTP-date `Retry-After` values with a maximum delay.

## Shared package

`@intellect-memory/shared` contains:

- plan definitions and limits
- API scopes and error codes
- Zod request/response schemas
- cryptographic helpers
- cursor encoding/decoding
- password hashing/verification helpers
- text chunking and normalization utilities

The shared utilities use Web Crypto-compatible APIs so they can be used in browser and edge runtimes.

## Security improvements

The current codebase includes several defensive changes:

- secure random API keys generated from 32 random bytes
- constant-time string comparison for sensitive comparisons
- validated password salts
- bounded request retry counts and retry delays
- no automatic retries for non-idempotent writes without an idempotency key
- strict base-URL validation
- URL-safe cursor encoding
- bounded integer/size utility inputs
- explicit protocol errors when the API returns malformed JSON or an unexpected response envelope

API keys and other secrets should still be supplied through environment variables or a secret manager, not committed to source control.

## Repository layout

```text
intellectmemory/
├── sdk/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── shared/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── API.md
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## API contract

See [API.md](API.md) for the HTTP endpoints and response contract expected by the SDK.

## Important scope note

This repository is not a complete hosted SaaS implementation. There is no committed `apps/api`, `apps/web`, database migration set, Cloudflare Worker, Stripe integration, or deployment configuration in the current source tree. Documentation should be read as SDK/shared-package documentation, not as a claim that those backend services ship here.

## License

MIT. See [LICENSE](LICENSE).
