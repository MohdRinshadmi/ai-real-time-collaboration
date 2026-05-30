'use client';

import { useState } from 'react';

import { Button, Input, Spinner } from '@collab/ui';

import { useStreamChat } from '../hooks/useStreamChat';

export function AIChatPanel({ workspaceSlug }: { workspaceSlug: string }) {
  const [draft, setDraft] = useState('');
  const { text, isStreaming, send, stop } = useStreamChat(workspaceSlug);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">AI Assistant</h1>
      </header>
      <div className="flex-1 overflow-auto px-6 py-4">
        {text && (
          <div className="whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm">
            {text}
            {isStreaming && <Spinner className="ml-2 inline-block" />}
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim() || isStreaming) return;
          send(draft);
          setDraft('');
        }}
        className="flex gap-2 border-t p-4"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask anything about this workspace…"
          disabled={isStreaming}
        />
        {isStreaming ? (
          <Button type="button" variant="destructive" onClick={stop}>Stop</Button>
        ) : (
          <Button type="submit" disabled={!draft.trim()}>Send</Button>
        )}
      </form>
    </div>
  );
}
