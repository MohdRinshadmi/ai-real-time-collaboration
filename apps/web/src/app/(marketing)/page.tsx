import Link from 'next/link';

import { Button } from '@collab/ui';

// ISR — revalidate hourly. Marketing copy changes infrequently and benefits
// from cached HTML at the edge.
export const revalidate = 3600;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
        Think together.<br />Ship faster.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        A real-time collaboration platform with AI built in. Docs, chat, and an assistant
        that actually knows your workspace.
      </p>
      <div className="mt-10 flex gap-4">
        <Button asChild size="lg"><Link href="/register">Get started</Link></Button>
        <Button asChild variant="outline" size="lg"><Link href="/pricing">Pricing</Link></Button>
      </div>
    </main>
  );
}
