'use client';

import { useEffect, useMemo, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { env } from '@/lib/env';

// Hook that owns a Yjs document for a given documentId.
//
// The provider does the heavy lifting:
//   - syncs initial state from the server's last snapshot
//   - applies incoming updates (idempotent by op id)
//   - debounces outgoing updates
//   - persists awareness (cursor / selection / user color)
//
// On unmount: destroy the provider AND doc to avoid leaks.

export type YDocStatus = 'connecting' | 'connected' | 'disconnected';

export function useYDoc(documentId: string, user: { id: string; name: string; color: string }) {
  const doc = useMemo(() => new Y.Doc(), []);
  const [status, setStatus] = useState<YDocStatus>('connecting');

  const provider = useMemo(
    () =>
      new WebsocketProvider(env.NEXT_PUBLIC_WS_URL, `doc:${documentId}`, doc, {
        connect: true,
        // params include the access token so the realtime service can authorize
        params: { token: typeof window !== 'undefined' ? localStorage.getItem('at') ?? '' : '' },
      }),
    [doc, documentId],
  );

  useEffect(() => {
    provider.awareness.setLocalStateField('user', user);
    const onStatus = (e: { status: YDocStatus }) => setStatus(e.status);
    provider.on('status', onStatus);
    return () => {
      provider.off('status', onStatus);
      provider.destroy();
      doc.destroy();
    };
  }, [provider, doc, user]);

  return { doc, provider, status };
}
