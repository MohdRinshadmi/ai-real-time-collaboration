# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/worker/package.json apps/worker/
COPY packages/*/package.json packages/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
RUN pnpm --filter @collab/db prisma generate
RUN pnpm --filter @collab/worker build

FROM gcr.io/distroless/nodejs20-debian12 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/worker/dist ./dist
COPY --from=builder /repo/apps/worker/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
USER nonroot
CMD ["dist/main.js"]
