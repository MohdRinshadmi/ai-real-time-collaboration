# syntax=docker/dockerfile:1.7
# Build context is the monorepo root: `docker build -f apps/api/docker/Dockerfile .`
FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/*/package.json packages/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
RUN pnpm --filter @collab/db prisma generate
# Build the workspace TS packages the API consumes (db, auth-core, logger).
RUN pnpm --filter @collab/db --filter @collab/auth-core --filter @collab/logger build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=4000
# The Express app is ESM transpiled on the fly by @babel/register at boot, so we
# ship the source tree (incl. the extensionless bin/www) rather than a built
# dist/. node_modules and the workspace packages are copied as the original
# image did, preserving pnpm's symlinked layout.
COPY --from=builder /repo/apps/api/bin ./bin
COPY --from=builder /repo/apps/api/config ./config
COPY --from=builder /repo/apps/api/controllers ./controllers
COPY --from=builder /repo/apps/api/helper ./helper
COPY --from=builder /repo/apps/api/middleware ./middleware
COPY --from=builder /repo/apps/api/models ./models
COPY --from=builder /repo/apps/api/routes ./routes
COPY --from=builder /repo/apps/api/services ./services
COPY --from=builder /repo/apps/api/utils ./utils
COPY --from=builder /repo/apps/api/validators ./validators
COPY --from=builder /repo/apps/api/views ./views
COPY --from=builder /repo/apps/api/app.js /repo/apps/api/.babelrc /repo/apps/api/package.json ./
COPY --from=builder /repo/apps/api/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
EXPOSE 4000
CMD ["node", "-r", "@babel/register", "bin/www"]
