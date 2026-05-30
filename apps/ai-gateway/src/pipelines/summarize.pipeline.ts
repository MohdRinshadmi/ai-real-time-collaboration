import { streamCompletion } from '../providers/provider.factory';

const PROMPTS = {
  short: 'Summarize the document in 2-3 sentences.',
  medium: 'Summarize the document in 1-2 paragraphs with key points as bullets.',
  long: 'Provide a detailed summary with sections: Overview, Key Points, Action Items.',
} as const;

export async function* runSummarizePipeline(input: {
  documentText: string;
  length: keyof typeof PROMPTS;
}) {
  yield* streamCompletion({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: PROMPTS[input.length] },
      { role: 'user', content: input.documentText.slice(0, 64_000) },
    ],
    temperature: 0.2,
  });
}
