import Anthropic from '@anthropic-ai/sdk';

import type { CompletionInput, CompletionStreamChunk, LLMProvider } from './types';

export class AnthropicProvider implements LLMProvider {
  private readonly client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async *streamCompletion(input: CompletionInput): AsyncGenerator<CompletionStreamChunk> {
    const systemMessages = input.messages.filter((m) => m.role === 'system');
    const turns = input.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const stream = this.client.messages.stream({
      model: input.model,
      system: systemMessages.map((m) => m.content).join('\n\n') || undefined,
      messages: turns,
      max_tokens: input.maxTokens ?? 4096,
      temperature: input.temperature ?? 0.7,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'token', value: event.delta.text };
      }
    }
    const final = await stream.finalMessage();
    yield {
      type: 'done',
      usage: {
        promptTokens: final.usage.input_tokens,
        completionTokens: final.usage.output_tokens,
      },
    };
  }

  async embed(): Promise<number[][]> {
    throw new Error('Anthropic does not provide embeddings — use OpenAI provider');
  }
}
