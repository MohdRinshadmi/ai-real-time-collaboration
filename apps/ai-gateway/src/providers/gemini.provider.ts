import {
  GoogleGenerativeAI,
  type Content,
  type FunctionDeclaration,
  type Part,
} from '@google/generative-ai';

import type { CompletionInput, CompletionStreamChunk, LLMProvider } from './types';

// Google Gemini provider. One of two interchangeable chat backends (the other is
// Groq); the provider chosen at runtime is decided by provider.factory. Gemini
// is also the sole embeddings backend, since Groq has no embeddings endpoint.
//
// Mapping notes:
//   - Gemini has no `system` role on turns; it takes a `systemInstruction`.
//   - Gemini's assistant role is named `model`; tool results use role `function`.
//   - A model tool request arrives as a part with `functionCall`; we surface it
//     as a `tool_call` chunk so the pipeline's tool loop is provider-agnostic.
//   - Usage comes back on the final aggregated response as `usageMetadata`.
export class GeminiProvider implements LLMProvider {
  private readonly client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

  async *streamCompletion(input: CompletionInput): AsyncGenerator<CompletionStreamChunk> {
    const systemInstruction =
      input.messages
        .filter((m) => m.role === 'system')
        .map((m) => m.content)
        .join('\n\n') || undefined;

    const contents: Content[] = input.messages
      .filter((m) => m.role !== 'system')
      .map((m) => {
        if (m.role === 'tool') {
          // Tool result fed back to the model.
          return {
            role: 'function',
            parts: [
              {
                functionResponse: {
                  name: m.name ?? 'tool',
                  response: safeParse(m.content),
                },
              } as Part,
            ],
          };
        }
        if (m.role === 'assistant' && m.toolCalls?.length) {
          // Assistant turn that invoked tools — replay it as functionCall parts.
          return {
            role: 'model',
            parts: m.toolCalls.map(
              (c) =>
                ({
                  functionCall: { name: c.name, args: safeParse(c.arguments) },
                }) as Part,
            ),
          };
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        };
      });

    const tools = input.tools?.length
      ? [
          {
            functionDeclarations: input.tools.map(
              (t): FunctionDeclaration => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters as unknown as FunctionDeclaration['parameters'],
              }),
            ),
          },
        ]
      : undefined;

    const model = this.client.getGenerativeModel({
      model: input.model,
      systemInstruction,
      tools,
    });

    const result = await model.generateContentStream({
      contents,
      generationConfig: {
        temperature: input.temperature ?? 0.7,
        maxOutputTokens: input.maxTokens,
      },
    });

    let sawToolCall = false;
    for await (const chunk of result.stream) {
      for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
        if (part.text) yield { type: 'token', value: part.text };
        if (part.functionCall) {
          sawToolCall = true;
          yield {
            type: 'tool_call',
            call: {
              id: `call_${part.functionCall.name}`,
              name: part.functionCall.name,
              arguments: JSON.stringify(part.functionCall.args ?? {}),
            },
          };
        }
      }
    }

    const response = await result.response;
    yield {
      type: 'done',
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      },
      finishReason: sawToolCall ? 'tool_calls' : 'stop',
    };
  }

  async embed(texts: string[], model: string): Promise<number[][]> {
    const embedder = this.client.getGenerativeModel({ model });
    const res = await embedder.batchEmbedContents({
      requests: texts.map((text) => ({
        content: { role: 'user', parts: [{ text }] },
      })),
    });
    return res.embeddings.map((e) => e.values);
  }
}

// Tool args/results cross the wire as JSON strings; tolerate plain text too.
function safeParse(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : { value: parsed };
  } catch {
    return { value: raw };
  }
}
