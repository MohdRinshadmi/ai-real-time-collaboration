import { retrieve } from '../rag/retriever';
import { streamCompletion } from '../providers/provider.factory';
import type { CompletionStreamChunk } from '../providers/types';

// Chat pipeline:
//   1. Retrieve top-K chunks from the workspace via pgvector
//   2. Build a system prompt that pins citations to chunk IDs
//   3. Stream from the LLM
//   4. Emit citation events alongside tokens
//
// Output is a stream of typed chunks; the SSE controller serializes them.

export type ChatStreamChunk =
  | CompletionStreamChunk
  | {
      type: 'citation';
      documentId: string;
      chunkIndex: number;
      excerpt: string;
    };

export async function* runChatPipeline(input: {
  workspaceId: string;
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  ragEnabled: boolean;
}): AsyncGenerator<ChatStreamChunk> {
  const context = input.ragEnabled ? await retrieve(input.workspaceId, input.message, 8) : [];

  for (const c of context) {
    yield {
      type: 'citation',
      documentId: c.documentId,
      chunkIndex: c.chunkIndex,
      excerpt: c.content.slice(0, 200),
    };
  }

  const system = [
    'You are Collab, an AI assistant embedded in a team workspace.',
    'Use the provided context to answer. If the answer is not in the context, say so.',
    'Always cite sources by referencing [doc:<id>#<chunkIndex>].',
    '',
    'CONTEXT:',
    ...context.map((c) => `[doc:${c.documentId}#${c.chunkIndex}] ${c.content}`),
  ].join('\n');

  yield* streamCompletion({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      ...input.history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: input.message },
    ],
    temperature: 0.3,
  });
}
