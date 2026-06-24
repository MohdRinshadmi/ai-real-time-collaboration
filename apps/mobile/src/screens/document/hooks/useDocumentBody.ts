import {useEffect, useRef} from 'react';
import {useQuery} from '@tanstack/react-query';

import {documentsApi, type DocDetail} from '@/api';
import type {YjsUser} from '@/collab';
import {useCollaborativeDoc, type CollaborativeDoc} from '@/hooks';
import {extractText} from '@/utils';

// The collaborative document body, backed by a Yjs CRDT and seeded once from the
// server's stored body when the local CRDT is still empty (e.g. the first time
// the doc is opened on mobile). Existing CRDT content always wins, so the seed
// never clobbers in-flight edits. Encapsulates the seeding concern so the screen
// only sees a ready-to-edit document.
export type DocumentBody = CollaborativeDoc & {isLoading: boolean};

export function useDocumentBody(docId: string, user: YjsUser): DocumentBody {
  const doc = useCollaborativeDoc(docId, user);
  const {text, setText} = doc;
  const seededRef = useRef(false);

  const {data, isLoading} = useQuery<DocDetail>({
    queryKey: ['document', docId],
    queryFn: () => documentsApi.getDocument(docId),
  });

  useEffect(() => {
    if (seededRef.current || !data) return;
    if (text.length > 0) {
      seededRef.current = true;
      return;
    }
    const body =
      data.plainText ?? (data.content ? extractText(data.content).trim() : '');
    if (body) {
      setText(body);
      seededRef.current = true;
    }
  }, [data, text, setText]);

  return {...doc, isLoading};
}
