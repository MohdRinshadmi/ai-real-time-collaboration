import { FileText, Hash, Sparkles, Settings, Plus, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';

const NAV = [
  { href: '', label: 'Overview', icon: Hash },
  { href: '/ai', label: 'AI Assistant', icon: Sparkles, accent: 'var(--presence-amber)' },
];

const DOCS = [{ slug: 'welcome', label: 'Welcome' }];
const CHANNELS = [{ slug: 'general', label: 'general' }];

export function WorkspaceSidebar({ slug }: { slug: string }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card/40">
      {/* Workspace switcher */}
      <button className="m-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted">
        <span className="flex size-8 items-center justify-center rounded-md bg-iris-amber font-display text-sm font-bold text-white">
          {slug.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{slug}</span>
          <span className="block text-xs text-muted-foreground">Free plan</span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </button>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2 text-sm">
        {NAV.map(({ href, label, icon: Icon, accent }) => (
          <Link
            key={label}
            href={`/${slug}${href}`}
            className="group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon className="size-4" style={accent ? { color: `hsl(${accent})` } : undefined} />
            {label}
          </Link>
        ))}

        <SectionLabel>Documents</SectionLabel>
        {DOCS.map((d) => (
          <Link
            key={d.slug}
            href={`/${slug}/docs/${d.slug}`}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <FileText className="size-4" /> {d.label}
          </Link>
        ))}

        <SectionLabel>Channels</SectionLabel>
        {CHANNELS.map((c) => (
          <Link
            key={c.slug}
            href={`/${slug}/channels/${c.slug}`}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Hash className="size-4" /> {c.label}
          </Link>
        ))}
      </nav>

      <Link
        href={`/${slug}/settings`}
        className="flex items-center gap-2.5 border-t border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Settings className="size-4" /> Settings
      </Link>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2.5 pb-1 pt-4">
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
        {children}
      </span>
      <Plus className="size-3.5 text-muted-foreground/60 transition-colors hover:text-foreground" />
    </div>
  );
}
