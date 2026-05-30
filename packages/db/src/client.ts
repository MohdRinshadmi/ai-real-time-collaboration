import { PrismaClient } from '@prisma/client';

type PrismaOptions = {
  url?: string;
  logQueries?: boolean;
};

let singleton: PrismaClient | undefined;

export function createPrismaClient(options: PrismaOptions = {}): PrismaClient {
  if (singleton) return singleton;

  const client = new PrismaClient({
    datasources: options.url ? { db: { url: options.url } } : undefined,
    log: options.logQueries
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }],
  });

  // Multi-tenant: every transaction must call setWorkspace() before reading
  // tenant-owned tables. RLS policies depend on the `app.current_workspace` GUC.
  // Callers wrap their work in `withWorkspace(prisma, workspaceId, fn)`.
  singleton = client;
  return client;
}

export async function withWorkspace<T>(
  prisma: PrismaClient,
  workspaceId: string,
  fn: (tx: PrismaClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_workspace = '${workspaceId}'`);
    return fn(tx as PrismaClient);
  });
}
