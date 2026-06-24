# Architecture Design — AI-Powered Real-Time Collaboration Platform

> A multi-tenant SaaS for real-time document collaboration, team chat, voice huddles, and
> AI assistance (chat, inline editing, summarization, RAG). This document explains **how the
> system is shaped, which technologies it uses, and why each was chosen** over the alternatives.

**Status:** Living document · **Audience:** Engineers, reviewers, new joiners · **Last reviewed:** 2026-06-24

---

## 1. Goals & Constraints

The architecture is driven by a small set of hard requirements. Every technology choice below
traces back to one of these.

| # | Requirement | Architectural implication |
|---|-------------|---------------------------|
| G1 | **Real-time, multi-user editing** with no lost writes, even on flaky networks | CRDTs (Yjs), WebSocket transport, server-side merge + persistence |
| G2 | **Offline-first** on mobile — edit without a connection, converge on reconnect | CRDT state vectors, local encrypted store (MMKV) |
| G3 | **Low-latency AI** that is provider-agnostic and cost-controlled | Dedicated AI gateway, streaming (SSE), per-tenant budgets |
| G4 | **Strict multi-tenant isolation** — no cross-workspace data leaks | `workspaceId` on every row + Postgres Row-Level Security |
| G5 | **Type safety end-to-end** to keep a large surface area maintainable | TypeScript everywhere + shared Zod contracts |
| G6 | **Horizontal scalability** for stateful realtime workloads | Stateless pods + Redis fan-out + sticky LB |
| G7 | **Operational safety** — safe deploys, observability, auditability | Canary rollouts, OpenTelemetry, transactional outbox |

**Non-goals:** This is not a peer-to-peer-only product (we keep an authoritative server), and it
is not a single-tenant on-prem deployment (shared-schema multi-tenancy is assumed).

---

## 2. System at a Glance

```
                                  ┌──────────────────────────────────────────┐
   ┌─────────────┐                │                 Clients                   │
   │   Web App   │  Next.js 15    │  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
   │  (browser)  │◄──────────────►│  │  Web SPA │  │  Mobile  │  │  Admin  │  │
   └─────────────┘                │  └──────────┘  └──────────┘  └─────────┘  │
                                  └───────┬───────────┬──────────────┬────────┘
              HTTPS / WSS / SSE           │           │              │
        ┌───────────────────────┬─────────┴───────────┴──────┬───────┴───────┐
        ▼                       ▼                            ▼                ▼
 ┌────────────┐         ┌───────────────┐            ┌───────────────┐  ┌──────────┐
 │    API     │         │   Realtime    │            │  AI Gateway   │  │  Admin   │
 │  (Express) │         │ (Fastify+IO)  │            │  (Fastify)    │  │  (Next)  │
 │  REST/BFF  │         │ Yjs + WebRTC  │            │ LLM orchestr. │  └──────────┘
 └─────┬──────┘         └───────┬───────┘            └──────┬────────┘
       │                        │                           │
       │     ┌──────────────────┼───────────────────────────┤
       ▼     ▼                  ▼                            ▼
   ┌──────────────┐      ┌────────────┐              ┌────────────────┐
   │  PostgreSQL  │      │   Redis    │              │  LLM Providers │
   │ 16 + pgvector│      │ pub/sub +  │              │ Groq / Gemini  │
   │  (multi-     │      │ cache +    │              │ (pluggable)    │
   │   tenant)    │      │ queues     │              └────────────────┘
   └──────┬───────┘      └─────┬──────┘
          │                    │
   ┌──────▼──────┐      ┌───────▼───────┐      ┌──────────────┐
   │  Debezium   │      │    Worker     │      │  S3 / MinIO  │
   │ (WAL→Kafka) │─────►│  (BullMQ)     │      │  file store  │
   └─────────────┘      │ email/embeds  │      └──────────────┘
                        └───────────────┘
```

**The shape in one sentence:** stateless service tier (API / Realtime / AI Gateway) over a shared
state tier (Postgres + Redis + S3), connected to clients by REST for commands, WebSocket for
collaboration, and SSE for AI streaming — with an event backbone (outbox → Debezium → worker) for
everything asynchronous.

---

## 3. Why a Monorepo of Services (not a monolith, not micro-everything)

We use a **pnpm + Turbo monorepo** containing a handful of independently deployable services and
shared packages.

- **Why a monorepo:** one source of truth for the **shared Zod contracts** (`packages/api-contracts`)
  and types means a backend change that breaks a client is caught at compile time, in the same PR.
  Atomic cross-cutting changes (e.g. add a field to a document) touch server + web + mobile together.
- **Why service-oriented (not a monolith):** the three runtime profiles are genuinely different —
  REST request/response, long-lived stateful WebSocket connections, and bursty streaming LLM calls.
  Bundling them would force the whole thing to scale on the noisiest dimension and share a failure
  domain. Splitting lets realtime scale on connection count while the AI gateway scales on token
  throughput.
- **Why not micro-everything:** we deliberately stop at ~4 services. Each owns a clear capability and
  a clear scaling axis. We did not shard further (e.g. a separate "auth service") because the
  coordination cost would exceed the benefit at this size.

**Tooling rationale**

| Choice | Why | Alternative rejected |
|--------|-----|----------------------|
| **pnpm** | Content-addressed store, strict by default (no phantom deps), fast | npm/yarn — slower, looser hoisting |
| **Turbo** | Caches build/test by input hash; only rebuilds what changed | Nx — heavier; we don't need its plugin graph |
| **TypeScript** | One language across web, mobile, and all servers; shared types | Polyglot — duplicate models, no shared contracts |

---

## 4. The Service Tier

### 4.1 API (`apps/api`) — Express BFF

The transactional backbone: auth, workspaces, documents metadata, channels, messages, files.

- **Express 4 + Prisma 5** in a classic routes → middleware → controller → service → model layering.
- **Auth:** Passport with JWT, Google OAuth, and GitHub OAuth strategies; **argon2id** password
  hashing; short-lived access tokens + rotating refresh tokens.
- **Why Express here (and Fastify elsewhere):** the API is I/O-bound CRUD where the mature Passport
  ecosystem and middleware library matter more than raw throughput. The realtime/AI services, which
  are latency-sensitive, use Fastify. Choosing per-workload beats a one-framework mandate.

### 4.2 Realtime (`apps/realtime`) — Fastify + Socket.IO

Stateful collaboration: document sync, presence, and WebRTC signaling.

- **Document gateway (`document.gateway.ts`):** Yjs CRDT sync over Socket.IO. Client sends its
  **state vector** on join; server replies with only the missing updates; subsequent edits flow as
  binary Yjs updates, applied to an in-memory `Y.Doc`, broadcast to the room, and persisted.
- **WebRTC gateway (`webrtc.gateway.ts`):** **signaling only** — relays SDP offers/answers and ICE
  candidates so peers establish a mesh. Media never touches the server (peer-to-peer, or via TURN),
  which keeps the service cheap and stateless w.r.t. audio. Good to ~6 peers; beyond that we'd add an SFU.
- **Scaling:** each pod holds docs in memory; the **Redis adapter** pub/subs updates across pods so a
  user on pod A sees edits from a user on pod B. A **sticky load balancer** keeps a connection pinned
  to its pod.

### 4.3 AI Gateway (`apps/ai-gateway`) — the LLM chokepoint

A dedicated Fastify service that is the **only** path to an LLM. See [ADR-0004](architecture/0004-ai-gateway.md).

- **Provider factory** routes to **Groq** (`llama-3.3-70b-versatile`) or **Gemini**
  (`gemini-2.0-flash`) by env var — swapping providers is config, not code.
- **Pipelines** are async generators: `chat` (multi-turn + tool loop + optional RAG), `inline`
  (selection rewrites/summaries), `summarize`.
- **RAG:** `retriever.ts` does pgvector kNN over a workspace-scoped `embeddings` table (query →
  Gemini embedding → cosine distance → top-K chunks).
- **Tools (function calling):** `search_workspace`, `get_current_datetime` — all workspace-scoped to
  prevent cross-tenant access.
- **Guardrails:** per-workspace **daily token budget** in Redis (FREE → ENTERPRISE tiers); soft limit
  returns a warning header, hard limit returns `402 Payment Required`. `pricing.ts` estimates cost
  per model.
- **Why a separate service:** it centralizes cost control, provider failover, RAG, and guardrails in
  one auditable place. Every client and service gets the same protections for free, and a provider
  outage is contained behind one interface.

> **Why Groq + Gemini specifically:** Groq's inference is extremely low-latency (good for interactive
> chat/inline editing), while Gemini provides cheap, high-quality **embeddings** (used for RAG) and a
> capable flash model as a fallback. The pluggable factory means neither is load-bearing — we can add
> or fail over to others without touching callers. Default to the latest, most capable models as they ship.

### 4.4 Web & Admin (`apps/web`, `apps/admin`) — Next.js 15

- **Next.js 15 App Router + React 18**, **TanStack Query** (server state) + **zustand** (UI state).
- **TipTap (ProseMirror) + Yjs** for the collaborative editor; **Socket.IO client** for transport.
- **Tailwind + shadcn/ui + Radix** for an accessible design system (`packages/ui`).

### 4.5 Worker (`apps/worker`) — BullMQ

Background jobs (email via AWS SES, embedding generation, file processing) consumed from a
Redis-backed **BullMQ** queue, fed by the outbox (§6).

---

## 5. The State Tier

### 5.1 PostgreSQL 16 + pgvector — one database, many capabilities

- **Why Postgres:** a single engine covers relational data, **vector search** (pgvector), full-text
  (`pg_trgm`), and JSON. Fewer moving parts than bolting on a dedicated vector DB (Pinecone/Weaviate)
  and a search cluster. We add those only if scale demands it.
- **Multi-tenancy (G4):** shared schema with `workspaceId` on every tenant-owned row, **plus Postgres
  Row-Level Security** as a defense-in-depth backstop — even a buggy query can't leak across tenants.
  See [ADR-0002](architecture/0002-multi-tenant-strategy.md).
- **Document storage:** snapshot of the Yjs doc (`yDoc`) + an append-only `DocumentVersion` log for
  audit and point-in-time recovery.

### 5.2 Redis 7 — the coordination layer

One Redis cluster, several jobs: Socket.IO pub/sub fan-out across realtime pods, session/rate-limit
state, **AI budget counters**, and the BullMQ job queue. It is the glue that lets the stateless tier
scale horizontally.

### 5.3 S3 / MinIO — blob storage

User files and assets. MinIO locally mirrors the S3 API so dev == prod.

---

## 6. Eventing — Transactional Outbox → Debezium → Worker

Asynchronous work (sending email, generating embeddings) must not be lost if a request fails after
committing. So we use the **transactional outbox** pattern ([ADR-0003](architecture/0003-outbox-pattern.md)):

1. A business write and an `outbox` row commit in the **same Postgres transaction** (atomic).
2. **Debezium** tails the write-ahead log and publishes outbox rows to **Kafka**.
3. The **worker** consumes, **dedupes by event ID in Redis** (effectively-once), and acts.

This buys reliability (no lost events) and decoupling (producers don't know consumers) at the cost of
~100ms latency and a requirement that consumers be **idempotent**.

---

## 7. Key Data Flows

**Collaborative edit (G1, G2):**
`open doc → Socket.IO connect (JWT auth) → doc:join {stateVector} → server replies doc:sync {missing
ops} → user types → batched Yjs update → doc:update → server applies to in-memory Y.Doc, broadcasts to
room, persists update + schedules snapshot → Redis fans out to other pods.`
Offline clients buffer updates in MMKV and converge on reconnect via a fresh state-vector exchange.

**AI chat with RAG (G3):**
`client → AI Gateway POST /chat/stream → authorize workspace (JWT) → check budget (Redis) → open SSE →
[if RAG] retrieve workspace chunks via pgvector → provider stream + tool loop → emit tokens as SSE
frames → on finish record spend in Redis.`

**Async side effect (G7):**
`API writes business row + outbox row in one tx → Debezium → Kafka → worker dedupes → AWS SES / Gemini
embeddings.`

---

## 8. Cross-Cutting Concerns

| Concern | Approach |
|---------|----------|
| **Type-safe boundaries (G5)** | `packages/api-contracts` Zod schemas shared by clients and servers; validated at every edge |
| **AuthN/Z** | JWT (access + refresh), argon2id, OAuth; RBAC roles (OWNER/ADMIN/MEMBER/GUEST); `withWorkspace()` scoping wrapper |
| **Observability** | OpenTelemetry traces (Jaeger locally, Prometheus/Grafana in prod), Pino structured logs with correlation IDs |
| **Secrets** | AWS Secrets Manager; CI authenticates via OIDC — no static credentials |
| **Cost control** | Per-tenant AI budgets enforced in the gateway before any provider call |

---

## 9. Deployment & Operations

- **Local:** `docker-compose` brings up Postgres (pgvector), Redis, MinIO, and an OTel collector →
  Jaeger; apps run on the host with hot reload.
- **Cloud:** **Kubernetes** (EKS) with Kustomize overlays per environment; **HPA** autoscaling and
  **PodDisruptionBudgets** per service. Realtime requires a **sticky LB**.
- **Provisioning:** **Terraform** modules for VPC, EKS, RDS, ElastiCache, S3, CloudFront; state in
  S3 + DynamoDB lock.
- **CI/CD:** GitHub Actions — lint, typecheck, sharded unit tests, Testcontainers integration tests,
  Docker build to GHCR; **canary deploys via Argo Rollouts** (5% → 25% → 50% → 100%) with smoke
  tests and automatic rollback on SLO breach.

---

## 10. Technology Choices Summary

| Layer | Technology | Why preferred |
|-------|-----------|---------------|
| Monorepo | pnpm + Turbo | Strict deps, cached incremental builds, shared contracts |
| Language | TypeScript 5 | One language end-to-end; compile-time safety across clients & servers |
| Web | Next.js 15 + React 18 | App Router, SSR/streaming, mature ecosystem |
| Mobile | React Native 0.84 (Hermes, New Arch) | Native iOS/Android from one TS codebase; WebRTC + MMKV support |
| API | Express + Prisma + Passport | Mature auth ecosystem for I/O-bound CRUD |
| Realtime | Fastify + Socket.IO + Yjs | Low-overhead server + reconnection/rooms + CRDT correctness |
| AI Gateway | Fastify + Groq/Gemini + pgvector | Pluggable providers, low-latency streaming, centralized guardrails |
| Collaboration | **Yjs (CRDT)** | Offline-first, conflict-free merge, P2P-capable — vs OT's central-server fragility ([ADR-0001](architecture/0001-crdt-over-ot.md)) |
| Database | PostgreSQL 16 + pgvector | Relational + vector + FTS in one engine; RLS for tenant isolation |
| Cache/Bus | Redis 7 | Pub/sub fan-out, budgets, sessions, BullMQ queue |
| Eventing | Outbox + Debezium + Kafka | Reliable, decoupled, effectively-once async processing |
| Storage | S3 / MinIO | Durable blobs; identical API in dev and prod |
| Infra | Docker · Kubernetes · Terraform · Argo Rollouts | Reproducible, autoscaled, safe canary deploys |
| Observability | OpenTelemetry · Jaeger · Prometheus · Pino | Distributed tracing + structured logs with correlation IDs |

---

## 11. Key Trade-offs & Their Mitigations

| Decision | Cost we accepted | Mitigation |
|----------|------------------|-----------|
| CRDT (Yjs) over OT | Higher memory per open doc | Periodic snapshots + GC; offload idle docs |
| Shared-schema multi-tenancy | App must always scope by workspace | `withWorkspace()` wrapper **and** Postgres RLS backstop |
| Stateful realtime pods | Requires sticky LB; harder rebalancing | Redis fan-out so any pod can serve; graceful drain on deploy |
| Dedicated AI gateway | One more service to run | Stateless + trivial to scale; ~5–10ms overhead is negligible vs LLM latency |
| Transactional outbox | ~100ms added latency; idempotency required | Async by nature (email/embeddings); dedupe by event ID |
| Provider-agnostic AI | Lowest-common-denominator feature set | Capabilities gated per provider (e.g. tools on Groq, embeddings on Gemini) |

---

## 12. Related Documents

- [ADR-0001 — CRDT (Yjs) over Operational Transform](architecture/0001-crdt-over-ot.md)
- [ADR-0002 — Shared-schema multi-tenancy + RLS](architecture/0002-multitenancy.md)
- [ADR-0003 — Transactional outbox eventing](architecture/0003-outbox-pattern.md)
- [ADR-0004 — AI gateway as a dedicated service](architecture/0004-ai-gateway.md)
- [GETTING-STARTED.md](../GETTING-STARTED.md) — local setup
- [README.md](../README.md) — project overview
