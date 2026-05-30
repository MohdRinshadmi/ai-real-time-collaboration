import { Worker, type Job } from 'bullmq';

import { createPrismaClient } from '@collab/db';

import { connection } from './connection';

// Triggered when a document is saved. We chunk + embed + upsert by
// (sourceType, sourceId, chunkIndex) which means re-running is safe.
//
// Rate-limited concurrency (10) so we don't blow the OpenAI quota.

export type EmbeddingsJob = {
  workspaceId: string;
  sourceType: 'document' | 'message';
  sourceId: string;
  text: string;
};

const prisma = createPrismaClient();

export function registerEmbeddingsWorker() {
  return new Worker<EmbeddingsJob>(
    'embeddings',
    async (job: Job<EmbeddingsJob>) => {
      const { workspaceId, sourceType, sourceId, text } = job.data;
      // Call ai-gateway /embeddings — keeps provider config in one place.
      const res = await fetch(`${process.env.AI_GATEWAY_URL}/embeddings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ texts: chunk(text), model: 'text-embedding-3-small' }),
      });
      if (!res.ok) throw new Error(`embeddings api failed: ${res.status}`);
      const { vectors } = (await res.json()) as { vectors: number[][] };

      for (let i = 0; i < vectors.length; i++) {
        const literal = `[${vectors[i]!.join(',')}]`;
        await prisma.$executeRawUnsafe(
          `
          INSERT INTO embeddings ("id", "workspaceId", "sourceType", "sourceId", "chunkIndex", "content", "embedding", "createdAt")
          VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6::vector, NOW())
          ON CONFLICT ("sourceType", "sourceId", "chunkIndex")
          DO UPDATE SET embedding = EXCLUDED.embedding, content = EXCLUDED.content
        `,
          workspaceId,
          sourceType,
          sourceId,
          i,
          chunk(text)[i] ?? '',
          literal,
        );
      }
    },
    {
      connection,
      concurrency: 10,
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 1000 },
    },
  );
}

function chunk(text: string): string[] {
  const size = 2048;
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}
