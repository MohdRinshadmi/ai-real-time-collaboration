import { activeProvider, type ProviderName } from '../providers/provider.factory';

// Per-request cost estimation, keyed by the active provider. Used to debit the
// per-workspace daily budget (see budget.ts). Rates are USD per 1M tokens and
// are illustrative — wire to a real price list / billing API in production.

type Rate = { input: number; output: number };

const RATES: Record<ProviderName, Rate> = {
  gemini: { input: 0.1, output: 0.4 }, // gemini-2.0-flash
  groq: { input: 0.59, output: 0.79 }, // llama-3.3-70b-versatile
};

export function estimateCost(usage: {
  promptTokens: number;
  completionTokens: number;
}): number {
  const rate = RATES[activeProvider()];
  return (usage.promptTokens / 1_000_000) * rate.input + (usage.completionTokens / 1_000_000) * rate.output;
}
