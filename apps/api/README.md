# @collab/api

REST API for the Collab platform — an **Express.js (MVC)** backend transpiled with
Babel. It exposes auth, workspaces, documents, channels, messages, files, AI, and
notifications, backed by Postgres (Prisma) and Redis.

## Folder structure

```
bin/          Server bootstrap (HTTP listener, tracing, graceful shutdown)
config/       Env validation (zod) + passport strategy wiring
controllers/  Thin HTTP handlers — parse req, call a service, send res
docker/       Dockerfile + container assets
helper/       Small reusable helpers (cookies, pagination)
keys/         JWT / OAuth key material (git-ignored)
logs/         Runtime log output (git-ignored)
middleware/   auth, workspace guard, validation, rate-limit, errors
models/        Prisma data-access layer (client + tenant helpers)
routes/        Express routers, one per resource + aggregator
services/      Business logic — the heart of each feature
uploads/      Temp upload scratch space (git-ignored)
utils/        logger, tracing, error classes, async wrapper
validators/   Zod request schemas
views/        EJS templates for the public landing/error pages
app.js        Express app assembly (middleware + routes)
```

A request flows: `routes → middleware → controller → service → models`.

## Scripts

```bash
pnpm dev          # nodemon + babel-node, watch mode
pnpm build        # transpile to dist/ via Babel
pnpm start        # run via @babel/register
pnpm start:prod   # launch under PM2 (pm2_config.json)
pnpm lint         # eslint
pnpm test         # vitest
```

## Configuration

Copy `.env.example` to `.env` and fill in the values. Every variable is validated
at boot by [`config/index.js`](config/index.js); a missing or malformed value
crashes the process immediately rather than failing deep in a request handler.

The data layer uses Prisma, whose schema lives in `packages/db`. Generate the
client once (and after any schema change) before running:

```bash
pnpm --filter @collab/db prisma:generate
```

## Health probes

- `GET /healthz` — liveness (always 200 while the process responds)
- `GET /readyz` — readiness (checks Postgres + Redis)
