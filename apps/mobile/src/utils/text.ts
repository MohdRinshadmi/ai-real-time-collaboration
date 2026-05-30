// Pure text helpers shared across screens and components.

// Two-letter initials for avatar fallbacks.
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');
}

// Flattens ProseMirror-ish JSON into readable plain text for a mobile preview.
// The full collaborative CRDT editor (TipTap + Yjs) is web-only.
export function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as {text?: string; content?: unknown[]; type?: string};
  if (typeof n.text === 'string') return n.text;
  const inner = Array.isArray(n.content)
    ? n.content.map(extractText).join('')
    : '';
  // Paragraph/heading blocks get a trailing blank line.
  return n.type === 'paragraph' || n.type === 'heading' ? inner + '\n\n' : inner;
}
