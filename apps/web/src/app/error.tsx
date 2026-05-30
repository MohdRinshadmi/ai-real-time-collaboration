'use client';

import { useEffect } from 'react';

import { Button } from '@collab/ui';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: forward to Sentry. The digest tags it server-side.
    console.error('Unhandled error', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.digest ?? 'Unexpected error'}</p>
      <Button onClick={reset} className="mt-6">Try again</Button>
    </main>
  );
}
