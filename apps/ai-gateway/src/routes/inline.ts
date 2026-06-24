import type { FastifyInstance } from 'fastify';

import { aiInlineInputSchema } from '@collab/api-contracts';

import { authorizeWorkspace, AuthError } from '../auth/verify';
import { checkBudget, recordSpend, BudgetExceededError } from '../guardrails/budget';
import { estimateCost } from '../guardrails/pricing';
import { runInlinePipeline } from '../pipelines/inline.pipeline';

// SSE-based inline AI for editor selections. Same frame format as /chat/stream
// (`data: {...}\n\n`) so the mobile useInlineAI hook reuses the SSE parser.

export async function registerInlineRoutes(app: FastifyInstance) {
  app.post('/inline/stream', async (req, reply) => {
    const body = aiInlineInputSchema.parse(req.body);

    try {
      await authorizeWorkspace(req, body.workspaceId);
      await checkBudget(body.workspaceId, 'PRO'); // plan lookup elided
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.code(err.status).send({ error: err.code });
      }
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
      for await (const chunk of runInlinePipeline({
        action: body.action,
        selection: body.selection,
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
