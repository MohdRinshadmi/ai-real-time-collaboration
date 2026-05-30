'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useMemo } from 'react';

import { useYDoc } from '../hooks/useYDoc';

import { PresenceAvatars } from './PresenceAvatars';

// Random per-tab user color. In production this is server-assigned based on
// the user's stored preference to stay consistent across devices.
function randomColor() {
  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  return palette[Math.floor(Math.random() * palette.length)] ?? '#3b82f6';
}

type Props = { documentId: string };

export function DocumentCanvas({ documentId }: Props) {
  const user = useMemo(
    () => ({ id: crypto.randomUUID(), name: 'You', color: randomColor() }),
    [],
  );
  const { doc, provider, status } = useYDoc(documentId, user);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: false }), // history is owned by Yjs
        Collaboration.configure({ document: doc }),
        CollaborationCursor.configure({ provider, user }),
      ],
      editorProps: {
        attributes: {
          class:
            'prose prose-neutral dark:prose-invert max-w-none min-h-[60vh] focus:outline-none px-8 py-6',
        },
      },
    },
    [doc, provider],
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="text-sm text-muted-foreground">
          {status === 'connected' ? 'Synced' : status === 'connecting' ? 'Connecting…' : 'Offline'}
        </div>
        <PresenceAvatars provider={provider} />
      </header>
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
