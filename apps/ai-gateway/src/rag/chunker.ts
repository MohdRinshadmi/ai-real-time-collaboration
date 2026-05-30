// Semantic chunker. Splits at paragraph/heading boundaries when possible,
// falls back to fixed-size with overlap.
//
// 512 tokens × 50-token overlap is the sweet spot for retrieval recall
// in our domain (medium-length docs).

const APPROX_CHARS_PER_TOKEN = 4;
const TARGET = 512 * APPROX_CHARS_PER_TOKEN;
const OVERLAP = 50 * APPROX_CHARS_PER_TOKEN;

export function chunkText(text: string): string[] {
  if (text.length <= TARGET) return [text];

  const paras = text.split(/\n\n+/);
  const chunks: string[] = [];
  let buf = '';
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > TARGET && buf.length > 0) {
      chunks.push(buf);
      buf = buf.slice(-OVERLAP) + '\n\n' + p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf) chunks.push(buf);

  // safety: split any over-large chunk by hard window
  return chunks.flatMap((c) => (c.length <= TARGET ? [c] : hardSplit(c)));
}

function hardSplit(text: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += TARGET - OVERLAP) {
    out.push(text.slice(i, i + TARGET));
  }
  return out;
}
