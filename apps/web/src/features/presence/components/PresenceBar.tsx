import { Button } from '@collab/ui';
import { Users } from 'lucide-react';

// Placeholder presence until the socket feed is wired in — colored by the same
// presence palette used across the product.
const ONLINE = [
  { name: 'You', color: 'var(--presence-iris)' },
  { name: 'Maya', color: 'var(--presence-amber)' },
  { name: 'Devon', color: 'var(--presence-teal)' },
];

export function PresenceBar({ slug }: { slug: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{slug}</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-medium text-foreground">Overview</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5" aria-label="Online members">
            {ONLINE.map((m) => (
              <span
                key={m.name}
                title={m.name}
                className="inline-flex size-7 items-center justify-center rounded-full border-2 border-background font-mono text-[10px] font-medium text-white"
                style={{ background: `hsl(${m.color})` }}
              >
                {m.name.charAt(0)}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Users className="size-3.5" /> {ONLINE.length}
          </span>
        </div>
        <Button size="sm" variant="primary">
          Share
        </Button>
      </div>
    </header>
  );
}
