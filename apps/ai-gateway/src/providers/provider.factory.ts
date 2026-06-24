import { GeminiProvider } from './gemini.provider';
import { GroqProvider } from './groq.provider';
import type { CompletionInput, CompletionStreamChunk, LLMProvider } from './types';

// Provider factory. The chat backend is selected at boot via AI_PROVIDER
// (`groq` | `gemini`); pipelines depend only on this stable streamCompletion()
// contract, never on a concrete SDK. Embeddings are not routed here — they
// always use Gemini (Groq has no embeddings endpoint), so rag/retriever and the
// /embeddings route instantiate GeminiProvider directly.

export type ProviderName = 'groq' | 'gemini';

function resolveProvider(): { name: ProviderName; provider: LLMProvider } {
  const name = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase() as ProviderName;
  if (name === 'groq') return { name, provider: new GroqProvider() };
  return { name: 'gemini', provider: new GeminiProvider() };
}

const { name: providerName, provider } = resolveProvider();

// Sensible default chat model per provider, overridable via AI_DEFAULT_MODEL so
// switching providers also switches the model without touching pipeline code.
const DEFAULT_MODELS: Record<ProviderName, string> = {
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-2.0-flash',
};

export function defaultChatModel(): string {
  return process.env.AI_DEFAULT_MODEL || DEFAULT_MODELS[providerName];
}

export function activeProvider(): ProviderName {
  return providerName;
}

// Tool/function calling is verified end-to-end on Groq (OpenAI-compatible).
// On Gemini the tool-loop's function-response turn shape is unverified against
// a live key, so it's gated OFF by default to avoid a runtime failure mid-chat.
// Flip `gemini` to true once confirmed, or force either way with AI_TOOLS_ENABLED.
const TOOL_CALLING_SUPPORT: Record<ProviderName, boolean> = {
  groq: true,
  gemini: false,
};

export function toolCallingEnabled(): boolean {
  const override = process.env.AI_TOOLS_ENABLED;
  if (override === 'true') return true;
  if (override === 'false') return false;
  return TOOL_CALLING_SUPPORT[providerName];
}

export async function* streamCompletion(
  input: CompletionInput,
): AsyncGenerator<CompletionStreamChunk> {
  yield* provider.streamCompletion(input);
}

export type { LLMProvider } from './types';
