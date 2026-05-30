import { createLogger } from '@collab/logger';

import { registerEmailWorker } from './queues/email.queue';
import { registerEmbeddingsWorker } from './queues/embeddings.queue';
import { registerFileProcessingWorker } from './queues/file-processing.queue';
import { registerAuditLogWorker } from './queues/audit-log.queue';
import { startSchedules } from './schedules';

const logger = createLogger({ service: 'worker', pretty: process.env.NODE_ENV !== 'production' });

async function bootstrap() {
  const workers = [
    registerEmailWorker(),
    registerEmbeddingsWorker(),
    registerFileProcessingWorker(),
    registerAuditLogWorker(),
  ];
  startSchedules();
  logger.info({ count: workers.length }, 'Workers started');

  const shutdown = async () => {
    logger.info('Shutdown requested — draining workers');
    await Promise.allSettled(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Worker bootstrap failed');
  process.exit(1);
});
