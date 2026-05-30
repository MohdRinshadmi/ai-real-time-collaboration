'use client';

import { useCallback, useRef, useState } from 'react';

import { env } from '@/lib/env';

// SSE-based streaming chat hook.
//
// We deliberately avoid the Fetch API's built-in EventSource because it
// can't carry an Authorization header. Instead we read the body as a stream
// and parse SSE frames manually.

export type StreamChunk =
  | { type: 'token'; value: string }
  | { type: 'citation'; documentId: string; chunkIndex: number; excerpt: string }
  | { type: 'done'; usage: { promptTokens: number; completionTokens: number } }
  | { type: 'error'; message: string };

export function useStreamChat(workspaceId: string) {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (message: string, conversationId?: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setText('');
      setIsStreaming(true);

      try {
        const res = await fetch(`${env.NEXT_PUBLIC_AI_URL}/chat/stream`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ workspaceId, message, conversationId }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`Stream failed: ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const frames = buf.split('\n\n');
          buf = frames.pop() ?? '';
          for (const frame of frames) {
            if (!frame.startsWith('data:')) continue;
            const chunk = JSON.parse(frame.slice(5).trim()) as StreamChunk;
            if (chunk.type === 'token') setText((t) => t + chunk.value);
            else if (chunk.type === 'error') throw new Error(chunk.message);
          }
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [workspaceId],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { text, isStreaming, send, stop };
}
