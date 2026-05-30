import {useCallback, useRef, useState} from 'react';

import {streamSSE, type SSEController} from '@/api';
import {env} from '@/config';
import {getCachedAccessToken} from '@/services/tokenStore';

// Port of apps/web/src/features/ai-assistant/hooks/useStreamChat.ts.
// Same SSE frame shapes; transport swapped for RN's XHR-based streamSSE.

export type StreamChunk =
  | {type: 'token'; value: string}
  | {type: 'citation'; documentId: string; chunkIndex: number; excerpt: string}
  | {type: 'done'; usage: {promptTokens: number; completionTokens: number}}
  | {type: 'error'; message: string};

export type Citation = {documentId: string; chunkIndex: number; excerpt: string};

export function useStreamChat(workspaceId: string) {
  const [text, setText] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<SSEController | null>(null);

  const send = useCallback(
    (message: string, conversationId?: string) => {
      controllerRef.current?.abort();
      setText('');
      setCitations([]);
      setError(null);
      setIsStreaming(true);

      const token = getCachedAccessToken();
      controllerRef.current = streamSSE(
        `${env.AI_URL}/chat/stream`,
        {workspaceId, message, conversationId},
        token ? {authorization: `Bearer ${token}`} : {},
        {
          onFrame: data => {
            let chunk: StreamChunk;
            try {
              chunk = JSON.parse(data) as StreamChunk;
            } catch {
              return;
            }
            if (chunk.type === 'token') {
              setText(t => t + chunk.value);
            } else if (chunk.type === 'citation') {
              setCitations(c => [
                ...c,
                {
                  documentId: chunk.documentId,
                  chunkIndex: chunk.chunkIndex,
                  excerpt: chunk.excerpt,
                },
              ]);
            } else if (chunk.type === 'error') {
              setError(chunk.message);
            }
          },
          onError: err => {
            setError(err.message);
            setIsStreaming(false);
          },
          onDone: () => setIsStreaming(false),
        },
      );
    },
    [workspaceId],
  );

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {text, citations, isStreaming, error, send, stop};
}
