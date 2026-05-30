import { Queue } from 'bullmq';

import { connection } from '../queues/connection';

// Repeatable jobs (cron). BullMQ handles dedup so even if the worker fleet
// restarts, the schedule isn't duplicated.
export function startSchedules() {
  // Yjs snapshot compaction — re-encode docs to drop tombstones.
  new Queue('yjs-compaction', { connection }).add(
    'compact-stale',
    {},
    {
      repeat: { pattern: '0 3 * * *' }, // 3am daily
      removeOnComplete: { count: 30 },
    },
  );

  // Billing usage aggregation
  new Queue('billing-aggregate', { connection }).add(
    'roll-up',
    {},
    {
      repeat: { pattern: '*/15 * * * *' },
      removeOnComplete: { count: 100 },
    },
  );

  // Search reindex (OpenSearch mirror)
  new Queue('search-reindex', { connection }).add(
    'incremental',
    {},
    {
      repeat: { pattern: '*/5 * * * *' },
      removeOnComplete: { count: 100 },
    },
  );
}
