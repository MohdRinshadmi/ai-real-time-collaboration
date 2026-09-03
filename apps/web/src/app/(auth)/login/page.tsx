import Link from 'next/link';

import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-canvas-grid bg-[length:52px_52px] [mask-image:radial-gradient(90%_60%_at_50%_0%,black,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
      />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-iris-amber">
            <span className="size-2.5 rounded-[3px] bg-white" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Collab
          </span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-float">
          <h1 className="font-display text-2xl font-bold tracking-tight text-card-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to step back onto the canvas.
          </p>
          <div className="mt-7">
            <LoginForm />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
