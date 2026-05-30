import { env } from '@/lib/env';

// Thin fetch wrapper with refresh-on-401 and request-id propagation.
// Most data fetching goes through TanStack Query hooks built on top of this.

type ApiOptions = RequestInit & { skipAuth?: boolean };

let refreshing: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  refreshing ??= (async () => {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('refresh failed');
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  headers.set('content-type', 'application/json');
  headers.set('x-request-id', crypto.randomUUID());

  const doFetch = () =>
    fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      ...opts,
      headers,
      credentials: 'include',
    });

  let res = await doFetch();
  if (res.status === 401 && !opts.skipAuth) {
    await refreshAccessToken();
    res = await doFetch();
  }
  if (!res.ok) throw res;
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
