// Deterministic per-user colour for the document editor's presence indicators.
// Hashing the id keeps a given collaborator's colour stable across sessions and
// identical on every peer's screen.
const PRESENCE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 2147483647;
  }
  return PRESENCE_COLORS[hash % PRESENCE_COLORS.length];
}
