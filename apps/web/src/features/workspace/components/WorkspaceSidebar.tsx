import Link from 'next/link';
import { FileText, Hash, Sparkles, Settings } from 'lucide-react';

export function WorkspaceSidebar({ slug }: { slug: string }) {
  return (
    <aside className="flex w-64 flex-col border-r bg-muted/30">
      <div className="border-b px-4 py-3 font-semibold">{slug}</div>
      <nav className="flex-1 space-y-1 p-2 text-sm">
        <Link href={`/${slug}`} className="flex items-center gap-2 rounded px-3 py-1.5 hover:bg-accent">
          <Hash className="h-4 w-4" /> Overview
        </Link>
        <Link href={`/${slug}/ai`} className="flex items-center gap-2 rounded px-3 py-1.5 hover:bg-accent">
          <Sparkles className="h-4 w-4" /> AI Assistant
        </Link>
        <div className="px-3 pb-1 pt-3 text-xs font-medium text-muted-foreground">Documents</div>
        <Link href={`/${slug}/docs/welcome`} className="flex items-center gap-2 rounded px-3 py-1.5 hover:bg-accent">
          <FileText className="h-4 w-4" /> Welcome
        </Link>
        <div className="px-3 pb-1 pt-3 text-xs font-medium text-muted-foreground">Channels</div>
        <Link href={`/${slug}/channels/general`} className="flex items-center gap-2 rounded px-3 py-1.5 hover:bg-accent">
          <Hash className="h-4 w-4" /> general
        </Link>
      </nav>
      <Link href={`/${slug}/settings`} className="flex items-center gap-2 border-t px-4 py-3 text-sm hover:bg-accent">
        <Settings className="h-4 w-4" /> Settings
      </Link>
    </aside>
  );
}
