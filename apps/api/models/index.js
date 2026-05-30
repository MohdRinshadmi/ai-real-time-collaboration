import { PrismaClient } from '@prisma/client';

import { logger } from '../utils/logger';

// Single shared Prisma client for the whole process. In NestJS this lived in a
// PrismaService; here it's a module-level singleton — the idiomatic Express way.
export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('warn', (e) => logger.warn({ prisma: e }, 'prisma warning'));
prisma.$on('error', (e) => logger.error({ prisma: e }, 'prisma error'));

// Multi-tenant: wraps a callback in a transaction with the `app.current_workspace`
// GUC set. Row-level-security policies then scope every read to that workspace.
export function withWorkspace(workspaceId, fn) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_workspace = '${workspaceId}'`);
    return fn(tx);
  });
}

export async function disconnect() {
  await prisma.$disconnect();
}
