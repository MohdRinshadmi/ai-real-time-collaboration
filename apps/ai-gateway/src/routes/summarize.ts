import type { FastifyInstance } from 'fastify';

import { aiSummarizeInputSchema } from '@collab/api-contracts';

import { runSummarizePipeline } from '../pipelines/summarize.pipeline';

export async function registerSummarizeRoutes(app: FastifyInstance) {
  app.post('/summarize', async (req, reply) => {
    const body = aiSummarizeInputSchema.parse(req.body);

    // In a real impl: pull the document body (rendered from Yjs) from the DB.
    const documentText = '<<document body fetched by id>>';

    reply.raw.setHeader('content-type', 'text/event-stream');
    reply.raw.flushHeaders();
    const write = (chunk: unknown) => reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);

    for await (const chunk of runSummarizePipeline({ documentText, length: body.length })) {
      write(chunk);
    }
    reply.raw.end();
    return reply;
  });
}
