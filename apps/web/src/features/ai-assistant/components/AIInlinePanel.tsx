'use client';

import { Sparkles } from 'lucide-react';

import { Button } from '@collab/ui';

// Right rail next to the document — quick AI actions scoped to the open doc.
export function AIInlinePanel({ documentId }: { documentId: string }) {
  return (
    <aside className="flex flex-col gap-2 border-l p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4" /> AI actions
      </div>
      <Button variant="ghost" size="sm" className="justify-start">Summarize</Button>
      <Button variant="ghost" size="sm" className="justify-start">Extract tasks</Button>
      <Button variant="ghost" size="sm" className="justify-start">Find related docs</Button>
      <p className="mt-4 text-xs text-muted-foreground">Doc: {documentId.slice(0, 8)}…</p>
    </aside>
  );
}
