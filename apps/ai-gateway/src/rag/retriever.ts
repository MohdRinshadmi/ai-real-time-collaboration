import { createPrismaClient } from '@collab/db';

import { OpenAIProvider } from '../providers/openai.provider';

const prisma = createPrismaClient();
const embedder = new OpenAIProvider();

export type RetrievedChunk = {
  documentId: string;
  chunkIndex: number;
  content: string;
  score: number;
};

// pgvector kNN with workspace-scoped filter. We pull top-K, then in real
// production we'd send through a reranker (Cohere/voyage). Stubbed here.
export async function retrieve(
  workspaceId: string,
  query: string,
  k = 8,
): Promise<RetrievedChunk[]> {
  const [embedding] = await embedder.embed([query], 'text-embedding-3-small');
  if (!embedding) return [];
  const literal = `[${embedding.join(',')}]`;

  // Raw SQL — Prisma doesn't yet typed-support pgvector operators.
  const rows = await prisma.$queryRawUnsafe<RetrievedChunk[]>(
    `
    SELECT "sourceId" as "documentId",
           "chunkIndex",
           "content",
           1 - (embedding <=> $1::vector) AS score
    FROM embeddings
    WHERE "workspaceId" = $2 AND "sourceType" = 'document'
    ORDER BY embedding <=> $1::vector
    LIMIT $3
    `,
    literal,
    workspaceId,
    k,
  );
  return rows;
}
