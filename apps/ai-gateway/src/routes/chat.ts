import type { FastifyInstance } from 'fastify';

import { aiChatInputSchema } from '@collab/api-contracts';

import { checkBudget, recordSpend, BudgetExceededError } from '../guardrails/budget';
import { runChatPipeline } from '../pipelines/chat.pipeline';

// SSE-based streaming chat. We write `data: {...}\n\n` frames; the client
// parses and dispatches each frame. Far simpler than WebSocket for one-way
// streaming, and survives most corporate proxies.

export async function registerChatRoutes(app: FastifyInstance) {
  app.post('/chat/stream', async (req, reply) => {
    const body = aiChatInputSchema.parse(req.body);

    try {
      await checkBudget(body.workspaceId, 'PRO'); // plan lookup elided
    } catch (err) {
      if (err instanceof BudgetExceededError) {
        return reply.code(402).send({ error: 'budget_exceeded' });
      }
      throw err;
    }

    reply.raw.setHeader('content-type', 'text/event-stream');
    reply.raw.setHeader('cache-control', 'no-cache, no-transform');
    reply.raw.setHeader('connection', 'keep-alive');
    reply.raw.flushHeaders();

    const write = (chunk: unknown) => reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);

    try {
      for await (const chunk of runChatPipeline({
        workspaceId: body.workspaceId,
        message: body.message,
        history: [],
        ragEnabled: body.ragEnabled,
      })) {
        write(chunk);
        if (chunk.type === 'done') {
          await recordSpend(body.workspaceId, estimateCost(chunk.usage));
        }
      }
    } catch (err) {
      write({ type: 'error', message: (err as Error).message });
    } finally {
      reply.raw.end();
    }
  });
}

function estimateCost(usage: { promptTokens: number; completionTokens: number }): number {
  // gpt-4o-mini pricing per 1M tokens: $0.15 input / $0.60 output (illustrative)
  return (usage.promptTokens / 1_000_000) * 0.15 + (usage.completionTokens / 1_000_000) * 0.6;
}
