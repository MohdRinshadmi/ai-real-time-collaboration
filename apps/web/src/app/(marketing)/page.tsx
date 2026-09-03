import { Button } from '@collab/ui';
import { FileText, MessagesSquare, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { LiveCanvasHero } from '@/features/marketing/components/LiveCanvasHero';

// ISR — revalidate hourly. Marketing copy changes infrequently and benefits
// from cached HTML at the edge.
export const revalidate = 3600;

const FEATURES = [
  {
    icon: FileText,
    color: 'var(--presence-iris)',
    title: 'Docs that write back',
    body: 'Draft together in the same document, cursors and all. The assistant fills gaps, tightens prose, and cites what it changed.',
  },
  {
    icon: MessagesSquare,
    color: 'var(--presence-teal)',
    title: 'Chat with context',
    body: 'Threads that stay next to the work. Decisions get captured, not buried — and anyone can catch up in a glance.',
  },
  {
    icon: Sparkles,
    color: 'var(--presence-amber)',
    title: 'An assistant that knows the room',
    body: 'It reads your docs, channels, and history, so answers are grounded in your workspace — not the open internet.',
  },
] as const;

const TEAM = [
  { name: 'You', color: 'var(--presence-iris)' },
  { name: 'Maya Chen', color: 'var(--presence-amber)' },
  { name: 'Devon Park', color: 'var(--presence-teal)' },
  { name: 'Priya Rao', color: 'var(--presence-rose)' },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient backdrop: a faint editing canvas the whole page sits on. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-canvas-grid bg-[length:52px_52px] [mask-image:radial-gradient(120%_80%_at_20%_0%,black,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-40 h-[36rem] w-[36rem] rounded-full bg-primary/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-24 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-[120px]"
      />

      <SiteNav />

      <main className="relative mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="grid grid-cols-1 gap-16 pb-24 pt-16 md:pt-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur">
              <LiveDot /> Real-time · AI-native workspace
            </span>

            <div className="mt-7">
              <LiveCanvasHero />
            </div>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A workspace where docs, chat, and an assistant share the same live canvas. Everyone
              sees the same cursor, the same edit, the same instant.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button asChild variant="brand" size="lg">
                <Link href="/register">
                  Start for free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">See a live demo</Link>
              </Button>
            </div>

            <PresenceStrip />
          </div>

          {/* Companion panel: a quiet, framed "live document" so the hero reads as a product. */}
          <LivePanel />
        </section>

        {/* Features — color-coded by presence hue, which is true to the product. */}
        <section id="features" className="scroll-mt-20 border-t border-border py-20">
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Three surfaces, one moving canvas.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="group relative rounded-lg border border-border bg-card p-6 shadow-elevate transition-shadow hover:shadow-float"
              >
                <span
                  className="inline-flex size-11 items-center justify-center rounded-md"
                  style={{ background: `hsl(${f.color} / 0.12)`, color: `hsl(${f.color})` }}
                >
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-card-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                <span
                  aria-hidden
                  className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ background: `hsl(${f.color})` }}
                />
              </article>
            ))}
          </div>
        </section>

        {/* Closing CTA band */}
        <section className="relative mb-24 overflow-hidden rounded-2xl border border-border bg-card px-8 py-14 text-center shadow-float sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-40 w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]"
          />
          <h2 className="relative font-display text-3xl font-semibold tracking-tight text-card-foreground sm:text-4xl">
            Bring your team onto the canvas.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-muted-foreground">
            Free for your first workspace. No card, no setup call — you'll be editing together in
            under a minute.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Button asChild variant="brand" size="lg">
              <Link href="/register">
                Create your workspace <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link href="/#features" className="transition-colors hover:text-foreground">
            Product
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link href="/docs" className="transition-colors hover:text-foreground">
            Docs
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="primary" size="sm">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <span className="relative flex size-6 items-center justify-center rounded-md bg-iris-amber">
        <span className="size-2 rounded-[3px] bg-white" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-foreground">Collab</span>
    </span>
  );
}

function LiveDot() {
  return (
    <span className="relative flex size-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-presence-teal opacity-60" />
      <span className="relative inline-flex size-2 rounded-full bg-presence-teal" />
    </span>
  );
}

function PresenceStrip() {
  return (
    <div className="mt-12 flex items-center gap-4">
      <div className="flex -space-x-2">
        {TEAM.map((m) => (
          <span
            key={m.name}
            title={m.name}
            className="inline-flex size-9 items-center justify-center rounded-full border-2 border-background font-mono text-xs font-medium text-white"
            style={{ background: `hsl(${m.color})` }}
          >
            {m.name
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')}
          </span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">4 people</span> editing now
      </p>
    </div>
  );
}

// A restrained "live document" companion — reinforces the product without stealing
// the headline's thunder. All the boldness stays in the co-authored hero.
function LivePanel() {
  return (
    <div className="relative animate-slide-up">
      <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-float backdrop-blur">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">launch-plan.doc</span>
          </div>
          <div className="flex -space-x-1.5">
            {TEAM.slice(0, 3).map((m) => (
              <span
                key={m.name}
                className="size-5 rounded-full border-2 border-card"
                style={{ background: `hsl(${m.color})` }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-3 py-4">
          <div className="h-2.5 w-4/5 rounded-full bg-muted" />
          <div className="relative h-2.5 w-full rounded-full bg-muted">
            <span
              className="absolute inset-y-0 left-0 w-1/2 rounded-full"
              style={{ background: 'hsl(var(--presence-iris) / 0.35)' }}
            />
          </div>
          <div className="h-2.5 w-11/12 rounded-full bg-muted" />
          <div className="relative h-2.5 w-2/3 rounded-full bg-muted">
            <span
              className="absolute -top-4 right-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] text-white"
              style={{ background: 'hsl(var(--presence-amber))' }}
            >
              Maya
            </span>
          </div>
          <div className="h-2.5 w-3/4 rounded-full bg-muted" />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-xs text-muted-foreground">Ask the assistant to summarize…</span>
        </div>
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
        <Wordmark />
        <p>Think together. Ship faster.</p>
        <p className="font-mono text-xs">© 2026 Collab</p>
      </div>
    </footer>
  );
}
