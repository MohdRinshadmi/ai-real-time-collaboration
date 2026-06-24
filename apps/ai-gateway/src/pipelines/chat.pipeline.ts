import { retrieve } from '../rag/retriever';
import {
  defaultChatModel,
  streamCompletion,
  toolCallingEnabled,
} from '../providers/provider.factory';
import type { ChatMessage, ToolCall } from '../providers/types';
import { executeTool, toolDefs } from '../tools';

// Chat pipeline:
//   1. Retrieve top-K chunks from the workspace via pgvector (RAG)
//   2. Build a system prompt that pins citations to chunk IDs
//   3. Stream from the active LLM (Groq or Gemini) with tool calling enabled
//   4. Run a tool-call loop: when the model asks for a tool, execute it,
//      feed the result back, and continue until it produces a final answer
//   5. Emit citation / tool_call / tool_result / token / done events
//
// Output is a stream of typed chunks; the SSE controller serializes them.

export type ChatStreamChunk =
  | { type: 'token'; value: string }
  | { type: 'citation'; documentId: string; chunkIndex: number; excerpt: string }
  | { type: 'tool_call'; name: string; arguments: string }
  | { type: 'tool_result'; name: string; result: unknown }
  | { type: 'done'; usage: { promptTokens: number; completionTokens: number } };

const MAX_TOOL_ROUNDS = 4;

export async function* runChatPipeline(input: {
  workspaceId: string;
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  ragEnabled: boolean;
}): AsyncGenerator<ChatStreamChunk> {
  const context = input.ragEnabled ? await retrieve(input.workspaceId, input.message, 8) : [];

  for (const c of context) {
    yield {
      type: 'citation',
      documentId: c.documentId,
      chunkIndex: c.chunkIndex,
      excerpt: c.content.slice(0, 200),
    };
  }

  // Only advertise tools (and instruct the model to use them) when the active
  // provider supports tool calling — otherwise the prompt would invite a tool
  // call the loop can't service.
  const toolsAvailable = toolCallingEnabled();

  const system = [
    'You are Collab, an AI assistant embedded in a team workspace.',
    toolsAvailable
      ? 'Use the provided context to answer. If the answer is not in the context, call the search_workspace tool to find more before saying you don’t know.'
      : 'Use the provided context to answer. If the answer is not in the context, say so.',
    'Always cite sources by referencing [doc:<id>#<chunkIndex>].',
    '',
    'CONTEXT:',
    ...context.map((c) => `[doc:${c.documentId}#${c.chunkIndex}] ${c.content}`),
  ].join('\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    ...input.history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: input.message },
  ];

  const model = defaultChatModel();
  let promptTokens = 0;
  let completionTokens = 0;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    // The model can use tools while it still has rounds left; on the final round
    // we drop tools to force a textual answer (avoids an infinite tool loop).
    // Disabled entirely on providers without verified tool support.
    const tools = toolsAvailable && round < MAX_TOOL_ROUNDS ? toolDefs : undefined;
    const pendingCalls: ToolCall[] = [];
    let finishReason: 'stop' | 'tool_calls' = 'stop';

    for await (const chunk of streamCompletion({
      model,
      messages,
      temperature: 0.3,
      tools,
    })) {
      if (chunk.type === 'token') {
        yield { type: 'token', value: chunk.value };
      } else if (chunk.type === 'tool_call') {
        pendingCalls.push(chunk.call);
        yield { type: 'tool_call', name: chunk.call.name, arguments: chunk.call.arguments };
      } else if (chunk.type === 'done') {
        promptTokens += chunk.usage.promptTokens;
        completionTokens += chunk.usage.completionTokens;
        finishReason = chunk.finishReason ?? 'stop';
      }
    }

    if (finishReason !== 'tool_calls' || pendingCalls.length === 0) break;

    // Record the assistant's tool request, then execute each tool and feed the
    // results back as `tool` turns for the next round.
    messages.push({ role: 'assistant', content: '', toolCalls: pendingCalls });
    for (const call of pendingCalls) {
      const args = parseArgs(call.arguments);
      const result = await executeTool(call.name, args, { workspaceId: input.workspaceId });
      yield { type: 'tool_result', name: call.name, result };
      messages.push({
        role: 'tool',
        name: call.name,
        toolCallId: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  yield { type: 'done', usage: { promptTokens, completionTokens } };
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
