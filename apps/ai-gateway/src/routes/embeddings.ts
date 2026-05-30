import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { OpenAIProvider } from '../providers/openai.provider';

const provider = new OpenAIProvider();

const inputSchema = z.object({
  texts: z.array(z.string().min(1)).min(1).max(128),
  model: z.string().default('text-embedding-3-small'),
});

export async function registerEmbeddingsRoutes(app: FastifyInstance) {
  app.post('/embeddings', async (req) => {
    const body = inputSchema.parse(req.body);
    const vectors = await provider.embed(body.texts, body.model);
    return { vectors };
  });
}
