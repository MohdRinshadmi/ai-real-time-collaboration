import { Worker, type Job } from 'bullmq';

import { createPrismaClient } from '@collab/db';

import { connection } from './connection';

// Critical-durability queue. Linear retry, max 10. If we lose audit events
// we lose compliance signal. The DLQ alerts to PagerDuty.

export type AuditJob = {
  workspaceId?: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
  requestId?: string;
};

const prisma = createPrismaClient();

export function registerAuditLogWorker() {
  return new Worker<AuditJob>(
    'audit-log',
    async (job: Job<AuditJob>) => {
      await prisma.auditLog.create({ data: { ...job.data, before: job.data.before as never, after: job.data.after as never } });
    },
    {
      connection,
      concurrency: 30,
      removeOnComplete: { count: 100 },
      // failing jobs stick around for forensics
      removeOnFail: false,
    },
  );
}
