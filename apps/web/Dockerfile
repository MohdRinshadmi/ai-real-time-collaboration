# syntax=docker/dockerfile:1.7
# Multi-stage build → distroless final image, ~150MB

FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

# ─── Dependencies ────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/api-contracts/package.json packages/api-contracts/
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ─── Build ───────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @collab/web build

# ─── Runtime ─────────────────────────────────────────────────
FROM gcr.io/distroless/nodejs20-debian12 AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public
USER nonroot
EXPOSE 3000
CMD ["apps/web/server.js"]
