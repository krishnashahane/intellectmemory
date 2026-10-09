# Intellect Memory API Contract

This document describes the HTTP contract expected by the TypeScript SDK. The repository contains the SDK and shared validation contracts; the API service itself is not included in this repository.

## Base URL

The SDK defaults to:

```text
https://api.intellectmemory.com
```

A different `baseUrl` can be supplied to the SDK.

## Authentication

Send the API key as:

```http
Authorization: Bearer <api-key>
```

## Response envelope

Successful responses:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-01-01T00:00:00.000Z"
  }
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  },
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-01-01T00:00:00.000Z"
  }
}
```

## Memory endpoints

| Method | Endpoint | SDK method |
|---|---|---|
| POST | `/v1/memories` | `addMemory` |
| GET | `/v1/memories/:id` | `getMemory` |
| GET | `/v1/memories` | `listMemories` |
| PUT | `/v1/memories/:id` | `updateMemory` |
| DELETE | `/v1/memories/:id` | `deleteMemory` |
| POST | `/v1/search` | `search` |
| GET | `/v1/usage` | `getUsage` |
| GET | `/v1/usage/daily?days=N` | `getDailyUsage` |
| POST | `/v1/memory/ask` | `ask` |
| POST | `/v1/solve` | `solve` |
| POST | `/v1/secure-review` | `secureReview` |

### Create memory

```json
{
  "content": "The user prefers compact interfaces",
  "metadata": {
    "category": "preferences"
  },
  "project_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

`metadata` is optional in the SDK and may be omitted.

### Search

```json
{
  "query": "What interface preferences are stored?",
  "limit": 10,
  "threshold": 0.7,
  "project_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "filters": {
    "metadata": {
      "category": "preferences"
    }
  }
}
```

## Retries

The SDK retries:

- transient network failures
- HTTP 408, 425, 429, and 5xx responses

Safe HTTP methods may be retried automatically. POST/PUT/PATCH operations are only retried when the caller supplies an idempotency key.

Retry delays are capped to prevent an unbounded wait from a malicious or malformed `Retry-After` header.

## Validation

The shared package provides Zod schemas for request and response validation, including:

- pagination
- authentication
- API keys and scopes
- memories
- semantic search
- documents
- usage
- billing
- API response envelopes

## Error types

The SDK exposes specialized errors for authentication, authorization, validation, rate limiting, quota exhaustion, missing resources, server failures, and invalid API responses.
