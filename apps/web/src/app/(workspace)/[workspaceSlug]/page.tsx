import { FileText, Hash, Sparkles, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const CARDS = [
  {
    href: 'docs/welcome',
    icon: FileText,
    color: 'var(--presence-iris)',
    title: 'Open a document',
    body: 'Pick up the launch plan where your team left it.',
  },
  {
    href: 'channels/general',
    icon: Hash,
    color: 'var(--presence-teal)',
    title: 'Jump into #general',
    body: 'Catch up on the conversation and decisions.',
  },
  {
    href: 'ai',
    icon: Sparkles,
    color: 'var(--presence-amber)',
    title: 'Ask the assistant',
    body: 'It already knows what your workspace is working on.',
  },
];

export default function WorkspaceHomePage({ params }: { params: { workspaceSlug: string } }) {
  return (
    <div className="mx-auto max-w-4xl px-8 py-14">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Workspace</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground">
        {params.workspaceSlug}
      </h1>
      <p className="mt-2 text-muted-foreground">Everything your team is thinking about, in one place.</p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.title}
            href={`/${params.workspaceSlug}/${c.href}`}
            className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-border/0 hover:bg-muted"
          >
            <div className="flex items-center justify-between">
              <span
                className="inline-flex size-10 items-center justify-center rounded-md"
                style={{ background: `hsl(${c.color} / 0.14)`, color: `hsl(${c.color})` }}
              >
                <c.icon className="size-5" />
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <h2 className="mt-4 font-display text-base font-semibold text-card-foreground">
              {c.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
