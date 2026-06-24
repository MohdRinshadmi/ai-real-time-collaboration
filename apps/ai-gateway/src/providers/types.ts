export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  // Present on assistant turns that decided to invoke tools.
  toolCalls?: ToolCall[];
  // Present on `tool` turns carrying a tool's result back to the model.
  toolCallId?: string;
  name?: string;
};

// A tool/function the model may call. `parameters` is a JSON Schema object.
export type ToolDef = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

// A model's request to invoke a tool. `arguments` is a JSON string (provider
// contract — we parse it at the call site).
export type ToolCall = {
  id: string;
  name: string;
  arguments: string;
};

export type CompletionInput = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDef[];
};

export type CompletionStreamChunk =
  | { type: 'token'; value: string }
  | { type: 'tool_call'; call: ToolCall }
  | {
      type: 'done';
      usage: { promptTokens: number; completionTokens: number };
      // 'tool_calls' means the model paused to call tools and expects to be
      // resumed with their results; 'stop' means the turn is complete.
      finishReason?: 'stop' | 'tool_calls';
    };

export interface LLMProvider {
  streamCompletion(input: CompletionInput): AsyncGenerator<CompletionStreamChunk>;
  embed(texts: string[], model: string): Promise<number[][]>;
}
