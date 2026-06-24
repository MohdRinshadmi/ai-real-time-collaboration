# ADR 0004 — AI Gateway as a dedicated service

**Status:** Accepted
**Date:** 2025-02-10

## Context

Multiple services (api, worker, realtime) need to call LLMs (OpenAI, Anthropic). The naive approach — each service calls the providers directly — leads to:

- Duplicated rate-limit and retry logic
- No central place to enforce cost guardrails
- Provider swap touches N services
- No prompt versioning, no A/B testing infrastructure

## Decision

A dedicated **AI Gateway** service owns all LLM traffic.

```
service → ai-gateway → [routing, budget, RAG, guardrails, streaming] → provider
```

## Responsibilities

- **Provider routing + failover** (Groq and Gemini today, selected via `AI_PROVIDER` behind a single `LLMProvider` contract; pluggable for failover / self-hosted). Embeddings always use Gemini — Groq has no embeddings endpoint.
- **Tool calling** (function calling normalized across providers; a tool loop in the chat pipeline executes workspace-scoped tools — e.g. `search_workspace` — and feeds results back to the model)
- **Prompt registry** (versioned templates, schemas, A/B traffic split)
- **RAG** (chunking, embedding, pgvector retrieval, optional rerank)
- **Guardrails** (PII redaction, moderation, output schema validation, retry-with-repair)
- **Budget enforcement** (per-workspace daily token cap)
- **Streaming** (SSE to clients, batched usage emission)
- **Audit** (every prompt + response logged with PII scrubbed)

## Consequences

### Wins

- Single chokepoint to enforce policy.
- Provider swap = config change, not code change.
- Prompt experiments don't ship via redeploys.
- Cost is observable per workspace, not buried in 5 services.

### Costs

- One more service to operate, scale, and deploy.
- Synchronous hop adds ~5–10ms per call (negligible vs LLM latency).

### What we traded away

- The simplicity of "just call OpenAI from this controller". Pays off the first time we need to add Claude as a failover provider.

## Implementation notes

- `apps/ai-gateway/` houses the service.
- Pipelines are Async Iterators of typed chunks — clean composition for streaming.

## Revisit when

- A single service generates >70% of AI traffic and the indirection cost outweighs the centralization benefit. (Unlikely; most services need similar features.)
