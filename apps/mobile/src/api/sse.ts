// Server-Sent-Events client for React Native.
//
// Why this exists: the web app reads `res.body.getReader()` to stream SSE
// frames (see apps/web/.../useStreamChat.ts), but RN's fetch does not expose a
// readable stream body. XMLHttpRequest, however, fires `onreadystatechange`
// with the partial `responseText` as bytes arrive — so we parse SSE frames out
// of the growing buffer. This also lets us send an Authorization header, which
// the browser EventSource cannot.

export type SSEHandlers = {
  onFrame: (data: string) => void;
  onError?: (err: Error) => void;
  onDone?: () => void;
};

export type SSEController = {abort: () => void};

export function streamSSE(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  handlers: SSEHandlers,
): SSEController {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('content-type', 'application/json');
  xhr.setRequestHeader('accept', 'text/event-stream');
  for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);

  let offset = 0; // how much of responseText we've already parsed
  let buf = '';

  const flush = (final: boolean) => {
    const fresh = xhr.responseText.slice(offset);
    offset = xhr.responseText.length;
    buf += fresh;

    const frames = buf.split('\n\n');
    // Keep the last (possibly partial) frame unless this is the final flush.
    buf = final ? '' : (frames.pop() ?? '');
    for (const frame of final ? frames.concat(buf ? [buf] : []) : frames) {
      for (const line of frame.split('\n')) {
        if (line.startsWith('data:')) handlers.onFrame(line.slice(5).trim());
      }
    }
  };

  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.LOADING) flush(false);
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status >= 200 && xhr.status < 300) {
        flush(true);
        handlers.onDone?.();
      } else if (xhr.status !== 0) {
        handlers.onError?.(new Error(`Stream failed: ${xhr.status}`));
      }
    }
  };
  xhr.onerror = () => handlers.onError?.(new Error('Network error'));

  xhr.send(JSON.stringify(body));

  return {abort: () => xhr.abort()};
}
