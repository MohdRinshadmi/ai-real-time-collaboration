export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type CompletionInput = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type CompletionStreamChunk =
  | { type: 'token'; value: string }
  | { type: 'done'; usage: { promptTokens: number; completionTokens: number } };

export interface LLMProvider {
  streamCompletion(input: CompletionInput): AsyncGenerator<CompletionStreamChunk>;
  embed(texts: string[], model: string): Promise<number[][]>;
}
