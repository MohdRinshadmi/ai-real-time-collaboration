# Getting Started — How to Run & How the Code Is Organized

A practical, hands-on guide to running this project locally and understanding
what every folder does. For the high-level product/architecture pitch, see the
[README](README.md); for design rationale see [docs/architecture/](docs/architecture/).

> This guide describes the code **as it actually is today**. A couple of things
> differ from the top-level README:
> - `apps/api` is an **Express.js (MVC, Babel-transpiled)** service — *not* NestJS.
> - The AI gateway ships a single **Google Gemini** provider (OpenAI and Anthropic were removed).

---

## 1. What this project is

A monorepo for an AI-powered, real-time collaboration platform. It's managed
with **pnpm workspaces** + **Turborepo**, and split into three top-level areas:

| Folder | What lives here |
| --- | --- |
| [apps/](apps/) | Deployable applications (web, mobile, api, realtime, ai-gateway, worker, admin) |
| [packages/](packages/) | Shared libraries consumed by the apps (`@collab/*`) |
| [infrastructure/](infrastructure/) | Docker Compose, Kubernetes, Terraform |

Everything in `packages/*` is published internally under the `@collab/*` name and
linked via `workspace:*`, so an edit to a package is picked up by the apps with no
re-publish step.

---

## 2. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| **Node.js** | `20.11.0` | Pinned in [.nvmrc](.nvmrc) — run `nvm use` |
| **pnpm** | `>= 9` | `corepack enable` then `corepack prepare pnpm@9 --activate` |
| **Docker** + Compose | recent | Runs Postgres, Redis, MinIO, Jaeger locally |
| **Xcode / Android Studio** | — | Only if you run the mobile app |

The backing services (Postgres with the `pgvector` extension, Redis, MinIO as an
S3 stand-in, and an OTel collector + Jaeger) all run in Docker. The apps run on
the **host** via `pnpm dev` so you get hot reload and a native debugger.

---

## 3. Quick start (web + backend)

```bash
# 0. Use the right Node version
nvm use                       # reads .nvmrc (20.11.0)

# 1. Install all workspace dependencies
pnpm install

# 2. Create env files
cp .env.example .env          # shared/root config (db package + TS services)
cp apps/api/.env.example apps/api/.env   # the Express API loads its OWN .env

# 3. Start backing services (Postgres + Redis + MinIO + Jaeger)
pnpm docker:up

# 4. Generate the Prisma client, then apply migrations
pnpm db:generate
pnpm db:migrate

# 5. (optional) Seed demo data
pnpm --filter @collab/db run seed

# 6. Run everything in watch mode
pnpm dev
```

Once `pnpm dev` is up, the services listen on:

| App | URL | Port |
| --- | --- | --- |
| web (Next.js) | http://localhost:3000 | 3000 |
| admin (Next.js) | http://localhost:3001 | 3001 |
| api (Express) | http://localhost:4000 | 4000 |
| realtime (Socket.IO) | ws://localhost:4001 | 4001 |
| ai-gateway (Fastify) | http://localhost:4002 | 4002 |
| worker (BullMQ) | — (no HTTP port) | — |

Docker-provided infra:

| Service | URL / Port |
| --- | --- |
| Postgres (pgvector) | `localhost:5432` (user/pass/db = `collab`) |
| Redis | `localhost:6379` |
| MinIO (S3) | API `:9000`, console `:9001` (user `collab` / `collab123`) |
| Jaeger (traces UI) | http://localhost:16686 |
| OTel collector | OTLP http `:4318`, grpc `:4317` |

> **Note:** `pnpm dev` runs `turbo run dev --parallel`, which starts every app
> that has a `dev` script — i.e. all of the above **except mobile** (mobile uses
> `start`/`ios`/`android`, see [§6](#6-running-the-mobile-app)).

---

## 4. Environment variables

There are **two** env files in play:

1. **Root [.env](.env.example)** — shared config. Used by:
   - the `@collab/db` package (Prisma reads it via `dotenv -e ../../.env`),
   - Turborepo (`globalDependencies`),
   - the TS services (`realtime`, `ai-gateway`, `worker`) which read
     `process.env` directly, so the vars must be present in your shell/process.
2. **[apps/api/.env](apps/api/.env.example)** — the Express API calls
   `dotenv.config()` at boot and validates every variable with zod in
   [config/index.js](apps/api/config/index.js). A missing/invalid value **crashes
   the process on startup** (by design).

Key variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection (matches the Docker creds out of the box) |
| `REDIS_URL` / `REDIS_PUBSUB_URL` | Redis for cache + Socket.IO fan-out |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Must be **≥ 32 chars** or the API won't boot |
| `GEMINI_API_KEY` | AI gateway key (Google Gemini — chat + embeddings) |
| `STUN_URLS` / `TURN_*` | WebRTC voice (ICE) config for the realtime service |
| `S3_*` | File storage (point at MinIO locally) |

The DB defaults in `.env.example` already line up with the Docker Compose
credentials, so local Postgres/Redis work with zero changes.

---

## 5. The apps — folder by folder

### [apps/web](apps/web) — Next.js 15 user app · :3000
The main user-facing product. Next.js App Router + TipTap/Yjs collaborative
editor, TanStack Query, Zustand, Socket.IO client, tRPC client.

```
src/
  app/          App Router routes, grouped: (auth) (marketing) (workspace)/[workspaceSlug]
  features/     Feature modules — each with its own components/ + hooks/
                editor · chat · ai-assistant · presence · auth · workspace
  lib/          Cross-cutting clients — api/ (tRPC) and socket/
  providers/    React context providers (query client, theme, etc.)
  styles/       Global CSS / Tailwind entry
```
Run alone: `pnpm --filter @collab/web dev`

### [apps/admin](apps/admin) — Next.js internal dashboard · :3001
Slim internal admin panel. Talks to the DB package and shares the `@collab/ui`
design system. Run alone: `pnpm --filter @collab/admin dev`

### [apps/api](apps/api) — Express MVC REST API · :4000
The primary REST backend, written in **Express + Babel** (ESM `import` syntax
transpiled via `@babel/register`). Request flow is
`routes → middleware → controller → service → models`.

```
bin/www        Server bootstrap: tracing, HTTP listener, graceful shutdown
config/        zod env validation + passport (Google/GitHub/JWT) wiring
routes/        One Express router per resource + an aggregator (index.js)
middleware/    authenticate, workspace guard, validate, rate-limit, request-id, error-handler
controllers/   Thin HTTP handlers — parse request, call a service, send response
services/      Business logic (auth, workspace, document, channel, message, file, ai, notification)
models/        Prisma data-access (client + Redis helpers)
validators/    Zod request schemas
helper/        Small reusables (cookies, pagination)
utils/         logger, tracing, AppError, async-handler, password, token
views/         EJS templates (landing + error pages)
docker/        Dockerfile for the service
```
Run alone: `pnpm --filter @collab/api dev` (uses `nodemon`). Health probes:
`GET /healthz` (liveness), `GET /readyz` (Postgres + Redis readiness).

### [apps/realtime](apps/realtime) — Socket.IO + Yjs sync · :4001
Fastify HTTP server hosting Socket.IO. Handles CRDT document sync, presence, and
WebRTC voice signaling. Uses the Redis adapter to fan out across pods.

```
src/
  main.ts                Bootstrap: Fastify + Socket.IO + Redis adapter
  auth/socket-auth.ts    JWT auth on the connection handshake
  gateways/              Socket event handlers:
    document.gateway.ts    Yjs document sync
    presence.gateway.ts    Who's-online / cursors
    webrtc.gateway.ts      Voice-room signaling (offer/answer/ICE relay)
  webrtc/ice.ts          Builds STUN/TURN ICE server config (served at GET /ice-servers)
  yjs/persistence.ts     Persists Yjs document state
```
Run alone: `pnpm --filter @collab/realtime dev`

### [apps/ai-gateway](apps/ai-gateway) — Fastify AI orchestration · :4002
LLM orchestration: chat, summarization, embeddings, and RAG retrieval, with
streaming (SSE) and a per-request token budget guardrail.

```
src/
  main.ts             Bootstrap + route registration
  routes/             HTTP routes: chat · summarize · embeddings
  pipelines/          Orchestration: chat.pipeline · summarize.pipeline
  providers/          LLM backend:
    gemini.provider.ts     Google Gemini (chat + embeddings)
    provider.factory.ts    Stable streamCompletion() contract over the provider
    types.ts               Shared provider interface
  rag/                chunker.ts (split docs) + retriever.ts (pgvector search)
  guardrails/budget.ts  Per-request token/cost ceiling
```
Run alone: `pnpm --filter @collab/ai-gateway dev`

### [apps/worker](apps/worker) — BullMQ background jobs · no HTTP port
Consumes Redis-backed BullMQ queues. No HTTP server — it just registers workers
and schedules.

```
src/
  main.ts                  Registers all workers + starts schedules
  queues/
    email.queue.ts           Transactional email (via SES)
    embeddings.queue.ts      Generate + store vector embeddings
    file-processing.queue.ts File uploads / processing
    audit-log.queue.ts       Async audit-log writes
    connection.ts            Shared Redis/BullMQ connection
  schedules/index.ts       Recurring/cron-style jobs
```
Run alone: `pnpm --filter @collab/worker dev`

### [apps/mobile](apps/mobile) — React Native 0.84 client
iOS + Android app. Offline-first Yjs CRDT (MMKV-persisted), WebRTC voice, and
SSE streaming for AI. See [§6](#6-running-the-mobile-app) for run steps.

```
src/
  api/        HTTP/socket/SSE clients (http, socket, sse, auth, channels, documents)
  collab/     Yjs provider, persistence, WebRTC for mobile
  hooks/      useCollaborativeDoc · useChannelMessages · useStreamChat · usePresence · useVoiceRoom
  screens/    Login, WorkspaceHome, ChannelList, ChatRoom, DocumentList, Document, AIAssistant
  routes/     React Navigation stacks/tabs
  store/      Context providers (Auth, Socket, Workspace, AppProviders)
  components/ Shared UI (Avatar, Button, Input, PresenceBar)
  services/   queryClient, tokenStore
  config/ global/ layout/ utils/   App config, theme/types, layout, helpers
```

---

## 6. Running the mobile app

Mobile is **not** part of `pnpm dev`. Run it on its own:

```bash
# Start the Metro bundler
pnpm --filter @collab/mobile start

# iOS (first time / after native dep changes, install pods)
pnpm --filter @collab/mobile pods
pnpm --filter @collab/mobile ios

# Android (emulator or device must be available)
pnpm --filter @collab/mobile android
```

Point the app at your machine's LAN IP (not `localhost`) for the api/realtime/
ai-gateway URLs — see [apps/mobile/src/config/env.ts](apps/mobile/src/config/env.ts).

---

## 7. The shared packages

All consumed via `workspace:*` and namespaced `@collab/*`.

| Package | What it provides |
| --- | --- |
| [packages/db](packages/db) | **Prisma** schema, migrations, seed, and the typed client. Source of all DB scripts. |
| [packages/api-contracts](packages/api-contracts) | Zod schemas + tRPC routers shared between web and api |
| [packages/auth-core](packages/auth-core) | JWT signing/verification, password hashing (argon2), RBAC primitives |
| [packages/types](packages/types) | Cross-package TypeScript types |
| [packages/events](packages/events) | Domain event definitions (for the outbox/Kafka pattern) |
| [packages/logger](packages/logger) | `pino` logger with OpenTelemetry correlation |
| [packages/ui](packages/ui) | Design system — Tailwind preset + shared components (web/admin) |
| [packages/config](packages/config) | Shared ESLint / TSConfig / Prettier presets |

### The database (packages/db)
Prisma schema lives at
[packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma), with
migrations under `prisma/migrations/` (init + a row-level-security migration).
Driven from the repo root via:

| Command | Action |
| --- | --- |
| `pnpm db:generate` | Generate the Prisma client (run after any schema change) |
| `pnpm db:migrate` | Create + apply a dev migration |
| `pnpm db:deploy` | Apply migrations without prompting (CI/prod) |
| `pnpm db:studio` | Open Prisma Studio (DB GUI) |
| `pnpm --filter @collab/db run seed` | Seed demo data |

---

## 8. Infrastructure

| Folder | Contents |
| --- | --- |
| [infrastructure/docker](infrastructure/docker) | `docker-compose.yml` (local stack), `nginx/`, `otel-collector.yaml` |
| [infrastructure/k8s](infrastructure/k8s) | Kustomize `base/` + per-env `overlays/` |
| [infrastructure/terraform](infrastructure/terraform) | AWS modules + per-env stacks (`modules/`, `envs/`) |

CI/CD lives in [.github/workflows/](.github/workflows): `ci.yml`, `e2e.yml`,
`security-scan.yml`, `deploy-prod.yml`, `infra.yml`.

---

## 9. Common commands (run from the repo root)

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run all apps in watch mode (Turborepo, parallel) |
| `pnpm build` | Build every app + package |
| `pnpm lint` | ESLint across the monorepo |
| `pnpm typecheck` | Strict TypeScript check |
| `pnpm test` | Unit/integration tests (Vitest) |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm format` | Prettier write |
| `pnpm docker:up` / `pnpm docker:down` | Start / stop the local Docker stack |
| `pnpm db:*` | Database tasks (see [§7](#the-database-packagesdb)) |

Target a single workspace with `--filter`, e.g.
`pnpm --filter @collab/web build` or `pnpm --filter @collab/api dev`.

---

## 10. Troubleshooting

- **API crashes on boot with an env error** — `apps/api/.env` is missing a
  required var. JWT secrets must be **≥ 32 characters**. The exact failing field
  is printed by the zod validator in [config/index.js](apps/api/config/index.js).
- **Prisma "client not generated" / type errors** — run `pnpm db:generate`
  (and again after editing the schema).
- **`db:migrate` can't connect** — make sure `pnpm docker:up` finished and
  Postgres is healthy (`docker ps`); the DB takes a few seconds to accept
  connections on first boot.
- **Realtime/AI service can't find Redis or DB** — those TS services read
  `process.env` directly. Make sure the root `.env` values are exported into the
  shell you launch `pnpm dev` from (or your runner loads them).
- **Mobile can't reach the backend** — use your machine's LAN IP, not
  `localhost`, in the mobile config.
- **AI calls fail** — set `GEMINI_API_KEY` in the root `.env`.
