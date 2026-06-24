import { defaultChatModel, streamCompletion } from '../providers/provider.factory';
import type { CompletionStreamChunk } from '../providers/types';

// Inline AI: quick, selection-scoped actions invoked from the editor when the
// user highlights text (see mobile DocumentScreen + InlineAIToolbar). Unlike the
// chat pipeline there's no RAG or tool calling — it's a single low-latency pass
// over the selected span, which is what makes it feel instant inline.

export type InlineAction = 'improve' | 'explain' | 'shorten' | 'summarize';

const INSTRUCTIONS: Record<InlineAction, string> = {
  improve:
    'Rewrite the user’s text to be clearer and more polished. Preserve meaning ' +
    'and tone. Return only the rewritten text, no preamble or quotes.',
  explain:
    'Explain what the user’s text means in plain language, briefly. Return only ' +
    'the explanation.',
  shorten:
    'Rewrite the user’s text to be significantly shorter while keeping the key ' +
    'point. Return only the shortened text.',
  summarize:
    'Summarize the user’s text in 1-2 sentences. Return only the summary.',
};

export async function* runInlinePipeline(input: {
  action: InlineAction;
  selection: string;
}): AsyncGenerator<CompletionStreamChunk> {
  yield* streamCompletion({
    model: defaultChatModel(),
    messages: [
      { role: 'system', content: INSTRUCTIONS[input.action] },
      { role: 'user', content: input.selection.slice(0, 8_000) },
    ],
    temperature: input.action === 'explain' ? 0.4 : 0.3,
  });
}
