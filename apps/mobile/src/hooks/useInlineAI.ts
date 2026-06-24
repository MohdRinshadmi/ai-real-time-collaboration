import {useCallback, useRef, useState} from 'react';

import {streamSSE, type SSEController} from '@/api';
import {env} from '@/config';
import {getCachedAccessToken} from '@/services/tokenStore';

// Streaming inline AI for editor selections. Hits the gateway's /inline/stream
// (see apps/ai-gateway/src/routes/inline.ts) and accumulates tokens. The result
// is meant to replace or annotate the highlighted span in the document.

export type InlineAction = 'improve' | 'explain' | 'shorten' | 'summarize';

type InlineFrame =
  | {type: 'token'; value: string}
  | {type: 'done'; usage: {promptTokens: number; completionTokens: number}}
  | {type: 'error'; message: string};

export function useInlineAI(workspaceId: string) {
  const [action, setAction] = useState<InlineAction | null>(null);
  const [result, setResult] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<SSEController | null>(null);

  const run = useCallback(
    (next: InlineAction, selection: string) => {
      const text = selection.trim();
      if (!text) return;

      controllerRef.current?.abort();
      setAction(next);
      setResult('');
      setError(null);
      setIsStreaming(true);

      const token = getCachedAccessToken();
      controllerRef.current = streamSSE(
        `${env.AI_URL}/inline/stream`,
        {workspaceId, action: next, selection: text},
        token ? {authorization: `Bearer ${token}`} : {},
        {
          onFrame: data => {
            let frame: InlineFrame;
            try {
              frame = JSON.parse(data) as InlineFrame;
            } catch {
              return;
            }
            if (frame.type === 'token') {
              setResult(r => r + frame.value);
            } else if (frame.type === 'error') {
              setError(frame.message);
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

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setAction(null);
    setResult('');
    setError(null);
    setIsStreaming(false);
  }, []);

  return {action, result, isStreaming, error, run, reset};
}
