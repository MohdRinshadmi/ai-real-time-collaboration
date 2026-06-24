import type {
  ChatMessage,
  CompletionInput,
  CompletionStreamChunk,
  LLMProvider,
  ToolCall,
} from './types';

// Groq provider. Groq exposes an OpenAI-compatible Chat Completions API at very
// low latency, which is why it backs the "streaming completions" path. We talk
// to it over plain fetch (Node 20+ global) rather than pulling in an SDK, so the
// streaming + tool-call wire format lives in one readable place.
//
// Groq does not offer an embeddings endpoint — embeddings always run through the
// Gemini provider (see provider.factory + rag/retriever), so embed() throws.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// OpenAI-shape message as it goes on the wire.
type WireMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
  name?: string;
};

function toWire(m: ChatMessage): WireMessage {
  const wire: WireMessage = { role: m.role, content: m.content };
  if (m.toolCalls?.length) {
    wire.tool_calls = m.toolCalls.map((c) => ({
      id: c.id,
      type: 'function',
      function: { name: c.name, arguments: c.arguments },
    }));
  }
  if (m.toolCallId) wire.tool_call_id = m.toolCallId;
  if (m.name) wire.name = m.name;
  return wire;
}

export class GroqProvider implements LLMProvider {
  private readonly apiKey = process.env.GROQ_API_KEY ?? '';

  async *streamCompletion(input: CompletionInput): AsyncGenerator<CompletionStreamChunk> {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages.map(toWire),
        temperature: input.temperature ?? 0.7,
        max_tokens: input.maxTokens,
        stream: true,
        stream_options: { include_usage: true },
        ...(input.tools?.length
          ? {
              tool_choice: 'auto',
              tools: input.tools.map((t) => ({
                type: 'function',
                function: {
                  name: t.name,
                  description: t.description,
                  parameters: t.parameters,
                },
              })),
            }
          : {}),
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Groq request failed: ${res.status} ${detail}`);
    }

    // Tool-call fragments arrive split across deltas, keyed by their array index.
    const toolAcc = new Map<number, { id: string; name: string; arguments: string }>();
    let usage = { promptTokens: 0, completionTokens: 0 };
    let finishReason: 'stop' | 'tool_calls' = 'stop';

    for await (const data of readSSE(res.body)) {
      if (data === '[DONE]') break;
      let frame: GroqStreamFrame;
      try {
        frame = JSON.parse(data) as GroqStreamFrame;
      } catch {
        continue;
      }

      if (frame.usage) {
        usage = {
          promptTokens: frame.usage.prompt_tokens ?? 0,
          completionTokens: frame.usage.completion_tokens ?? 0,
        };
      }

      const choice = frame.choices?.[0];
      if (!choice) continue;

      const token = choice.delta?.content;
      if (token) yield { type: 'token', value: token };

      for (const tc of choice.delta?.tool_calls ?? []) {
        const slot = toolAcc.get(tc.index) ?? { id: '', name: '', arguments: '' };
        if (tc.id) slot.id = tc.id;
        if (tc.function?.name) slot.name = tc.function.name;
        if (tc.function?.arguments) slot.arguments += tc.function.arguments;
        toolAcc.set(tc.index, slot);
      }

      if (choice.finish_reason === 'tool_calls') finishReason = 'tool_calls';
    }

    // Emit fully-assembled tool calls before the terminal `done`.
    for (const slot of toolAcc.values()) {
      if (!slot.name) continue;
      const call: ToolCall = {
        id: slot.id || `call_${slot.name}`,
        name: slot.name,
        arguments: slot.arguments || '{}',
      };
      yield { type: 'tool_call', call };
    }

    yield { type: 'done', usage, finishReason };
  }

  async embed(): Promise<number[][]> {
    throw new Error('Groq has no embeddings API — embeddings use the Gemini provider.');
  }
}

type GroqStreamFrame = {
  choices?: {
    delta?: {
      content?: string;
      tool_calls?: {
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }[];
    };
    finish_reason?: string | null;
  }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

// Parse an SSE byte stream into a sequence of `data:` payloads.
async function* readSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const frames = buf.split('\n\n');
      buf = frames.pop() ?? '';
      for (const frame of frames) {
        for (const line of frame.split('\n')) {
          if (line.startsWith('data:')) yield line.slice(5).trim();
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
