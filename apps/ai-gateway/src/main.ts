import Fastify from 'fastify';

import { createLogger } from '@collab/logger';

import { registerChatRoutes } from './routes/chat';
import { registerInlineRoutes } from './routes/inline';
import { registerSummarizeRoutes } from './routes/summarize';
import { registerEmbeddingsRoutes } from './routes/embeddings';
import {
  activeProvider,
  defaultChatModel,
  toolCallingEnabled,
} from './providers/provider.factory';

const logger = createLogger({
  service: 'ai-gateway',
  pretty: process.env.NODE_ENV !== 'production',
});

async function bootstrap() {
  const app = Fastify({ logger: false, trustProxy: true, bodyLimit: 1024 * 1024 });

  app.get('/healthz', () => ({ status: 'ok' }));

  await registerChatRoutes(app);
  await registerInlineRoutes(app);
  await registerSummarizeRoutes(app);
  await registerEmbeddingsRoutes(app);

  const port = Number(process.env.PORT ?? 4002);
  await app.listen({ port, host: '0.0.0.0' });
  logger.info(
    {
      port,
      provider: activeProvider(),
      model: defaultChatModel(),
      toolCalling: toolCallingEnabled(),
    },
    'AI Gateway listening',
  );
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Bootstrap failed');
  process.exit(1);
});
