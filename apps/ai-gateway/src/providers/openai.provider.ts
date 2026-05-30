import OpenAI from 'openai';

import type { CompletionInput, CompletionStreamChunk, LLMProvider } from './types';

export class OpenAIProvider implements LLMProvider {
  private readonly client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async *streamCompletion(input: CompletionInput): AsyncGenerator<CompletionStreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: input.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    });

    let promptTokens = 0;
    let completionTokens = 0;
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield { type: 'token', value: delta };
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens;
        completionTokens = chunk.usage.completion_tokens;
      }
    }
    yield { type: 'done', usage: { promptTokens, completionTokens } };
  }

  async embed(texts: string[], model: string): Promise<number[][]> {
    const res = await this.client.embeddings.create({ model, input: texts });
    return res.data.map((d) => d.embedding);
  }
}
