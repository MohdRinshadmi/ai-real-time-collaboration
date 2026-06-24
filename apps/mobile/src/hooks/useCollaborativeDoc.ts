import {useCallback, useEffect, useMemo, useState} from 'react';
import type * as Y from 'yjs';

import {getSocketClient} from '@/api';
import {YjsProvider, type ConnectionStatus, type PeerState, type YjsUser} from '@/collab';

// Binds a Yjs document to React state for a plain TextInput. The web app uses
// TipTap (ProseMirror ↔ Yjs); on mobile we collaborate over a single Y.Text and
// reconcile the TextInput's value with a minimal prefix/suffix diff so concurrent
// edits from other clients still merge cleanly via the CRDT.

export type CollaborativeDoc = {
  text: string;
  setText: (next: string) => void;
  status: ConnectionStatus;
  peers: PeerState[];
  setTyping: (typing: boolean) => void;
};

export function useCollaborativeDoc(documentId: string, user: YjsUser): CollaborativeDoc {
  const socket = useMemo(getSocketClient, []);
  const provider = useMemo(
    () => new YjsProvider(documentId, user, socket),
    // Re-create only when the document or identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documentId, user.id],
  );
  const ytext = useMemo(() => provider.text(), [provider]);

  const [text, setLocalText] = useState(() => ytext.toString());
  const [status, setStatus] = useState<ConnectionStatus>(() => provider.getStatus());
  const [peers, setPeers] = useState<PeerState[]>([]);

  useEffect(() => {
    socket.connect();

    const onText = () => setLocalText(ytext.toString());
    ytext.observe(onText);
    onText();

    const offStatus = provider.onStatus(setStatus);
    const offAwareness = provider.onAwareness(map =>
      setPeers([...map.values()]),
    );

    return () => {
      ytext.unobserve(onText);
      offStatus();
      offAwareness();
      provider.destroy();
    };
  }, [provider, ytext, socket]);

  const setText = useCallback(
    (next: string) => {
      applyTextDiff(ytext, ytext.toString(), next);
    },
    [ytext],
  );

  const setTyping = useCallback(
    (typing: boolean) => provider.setAwareness({typing}),
    [provider],
  );

  return {text, setText, status, peers, setTyping};
}

// Translate a full-string replace into the smallest Y.Text delete+insert by
// trimming the common prefix and suffix. Keeps the CRDT op granular so two
// people editing different parts of the doc don't clobber each other.
function applyTextDiff(ytext: Y.Text, oldStr: string, newStr: string): void {
  if (oldStr === newStr) return;

  let start = 0;
  const minLen = Math.min(oldStr.length, newStr.length);
  while (start < minLen && oldStr[start] === newStr[start]) start++;

  let endOld = oldStr.length;
  let endNew = newStr.length;
  while (endOld > start && endNew > start && oldStr[endOld - 1] === newStr[endNew - 1]) {
    endOld--;
    endNew--;
  }

  ytext.doc?.transact(() => {
    if (endOld > start) ytext.delete(start, endOld - start);
    if (endNew > start) ytext.insert(start, newStr.slice(start, endNew));
  });
}
