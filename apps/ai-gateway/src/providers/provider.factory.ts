import { AnthropicProvider } from './anthropic.provider';
import { OpenAIProvider } from './openai.provider';
import type { CompletionInput, CompletionStreamChunk, LLMProvider } from './types';

// Provider factory with failover. If the primary provider returns a 5xx or
// rate-limit, we fall through to the next in line. Models are routed per
// pipeline (see pipelines/*.pipeline.ts) — cheap pipelines use Haiku/Mini.

const providers: Record<string, LLMProvider> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
};

const FAILOVER_ORDER = ['openai', 'anthropic'] as const;

export async function* streamCompletion(
  input: CompletionInput,
): AsyncGenerator<CompletionStreamChunk> {
  let lastErr: unknown;
  for (const name of FAILOVER_ORDER) {
    const provider = providers[name];
    if (!provider) continue;
    try {
      yield* provider.streamCompletion(input);
      return;
    } catch (err) {
      lastErr = err;
      // retry next provider only on transient failures
      if (!isTransient(err)) throw err;
    }
  }
  throw lastErr ?? new Error('all providers failed');
}

function isTransient(err: unknown): boolean {
  const status = (err as { status?: number; statusCode?: number }).status
    ?? (err as { statusCode?: number }).statusCode;
  return status === 429 || (status !== undefined && status >= 500);
}

export type { LLMProvider } from './types';
