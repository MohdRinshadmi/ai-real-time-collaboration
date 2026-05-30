# AI-Powered Real-Time Collaboration Platform

A production-grade SaaS platform for real-time collaborative document editing, team chat, and AI-assisted workflows — architected to FAANG-level engineering standards.

## What's inside

```
apps/
  web/          Next.js 15 App Router — user-facing app
  mobile/       React Native 0.84 — iOS + Android client
  api/          NestJS BFF — REST + tRPC aggregator
  realtime/     Socket.IO + Yjs CRDT sync service
  ai-gateway/   LLM orchestration (OpenAI / Anthropic), RAG, streaming
  worker/       BullMQ background workers (email, embeddings, files)
  admin/        Internal admin dashboard

packages/
  ui/             Design system (shadcn/ui + Tailwind preset)
  config/         Shared eslint, tsconfig, prettier
  types/          Cross-package TS types
  api-contracts/  zod schemas + tRPC routers
  db/             Prisma schema + migrations + seed
  auth-core/      JWT + RBAC primitives
  events/         Domain event definitions (Kafka)
  logger/         pino + OpenTelemetry correlation

infrastructure/
  terraform/    AWS infra (EKS, RDS, ElastiCache, S3, CloudFront)
  k8s/          Kustomize base + per-env overlays
  docker/       Local dev compose + production Dockerfiles
```

## Tech stack

**Frontend:** React 18 · Next.js 15 · TypeScript · Tailwind · TanStack Query · Zustand · Socket.IO · TipTap + Yjs · Framer Motion

**Backend:** Node.js · NestJS · PostgreSQL (Prisma) · Redis · Socket.IO · BullMQ · Kafka

**AI:** OpenAI · Anthropic · pgvector · Cohere rerank · server-sent events streaming

**Infra:** AWS (EKS, RDS, ElastiCache, S3, CloudFront, SES) · Terraform · Kustomize · Argo CD · GitHub Actions · OpenTelemetry · Prometheus · Grafana

## Architecture

See [docs/architecture/](docs/architecture/) for ADRs covering the major decisions:

- [0001 — CRDT (Yjs) over Operational Transform](docs/architecture/0001-crdt-over-ot.md)
- [0002 — Shared-schema multi-tenancy with Row-Level Security](docs/architecture/0002-multi-tenant-strategy.md)
- [0003 — Outbox pattern for cross-service events](docs/architecture/0003-outbox-pattern.md)
- [0004 — AI Gateway as a dedicated service](docs/architecture/0004-ai-gateway.md)

## Local development

```bash
pnpm install
cp .env.example .env
pnpm docker:up           # Postgres + Redis + pgvector
pnpm db:migrate          # apply schema
pnpm dev                 # turbo runs all apps in parallel
```

Apps come up on:

- web → http://localhost:3000
- api → http://localhost:4000
- realtime → ws://localhost:4001
- ai-gateway → http://localhost:4002
- admin → http://localhost:3001

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run all apps in watch mode |
| `pnpm build` | Build all apps |
| `pnpm test` | Unit + integration tests |
| `pnpm test:e2e` | Playwright E2E |
| `pnpm lint` | ESLint across the monorepo |
| `pnpm typecheck` | TypeScript strict typecheck |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio |

## Deployment

GitOps via Argo CD. CI builds + pushes images; Argo Rollouts performs canary deploys (5% → 25% → 50% → 100%) with automated rollback on SLO breach.

See [infrastructure/k8s/](infrastructure/k8s/) for Kubernetes manifests and [infrastructure/terraform/](infrastructure/terraform/) for AWS resources.

## Engineering practices

- **Trunk-based development** with short-lived branches
- **Conventional Commits** + semantic release
- **Testing pyramid:** Vitest (unit) → Testcontainers (integration) → Playwright (E2E) → k6 (load)
- **Protected `main`** with CODEOWNERS-driven reviews
- **ADRs** in `docs/architecture/` for every significant decision
