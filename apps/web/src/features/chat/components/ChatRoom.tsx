'use client';

import { Button, Input } from '@collab/ui';
import { useState } from 'react';


import { useChannelMessages } from '../hooks/useChannelMessages';

export function ChatRoom({ channelId }: { channelId: string }) {
  const { messages, sendMessage } = useChannelMessages(channelId);
  const [draft, setDraft] = useState('');

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-6 py-3">
        <h2 className="text-sm font-medium text-muted-foreground">#{channelId}</h2>
      </header>
      <div className="flex-1 overflow-auto px-6 py-4">
        {messages.map((m) => (
          <div key={m.id} className="mb-3 text-sm">
            <span className="font-medium">{m.authorName}</span>{' '}
            <span className="text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString()}</span>
            <div className="mt-1">{m.text}</div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          sendMessage(draft);
          setDraft('');
        }}
        className="flex gap-2 border-t p-4"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message #${channelId}`}
        />
        <Button type="submit" disabled={!draft.trim()}>Send</Button>
      </form>
    </div>
  );
}
