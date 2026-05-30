import {env} from '@/config';
import {
  clearTokens,
  loadTokens,
  saveTokens,
  type Tokens,
} from '@/services/tokenStore';
import {requestId} from '@/utils/id';

// Mobile transport layer (web counterpart: apps/web/src/lib/api/client.ts).
//
// Differences from web:
// - No cookies. We send `Authorization: Bearer <accessToken>` and refresh
//   against /auth/refresh using the stored refreshToken.
// - On a failed refresh we clear tokens and emit an "unauthorized" event so the
//   AuthProvider can bounce the user back to the login screen.
//
// Domain request functions (auth, channels, documents…) build on top of `http`.

type HttpOptions = RequestInit & {skipAuth?: boolean; timeoutMs?: number};

// Default network timeout. Without this, a stalled request (unreachable host,
// dropped packets) leaves callers — e.g. the login button's spinner — hanging
// indefinitely. RN's fetch has no built-in timeout.
const DEFAULT_TIMEOUT_MS = 15000;

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

export function onUnauthorized(fn: Listener): () => void {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

function emitUnauthorized() {
  for (const fn of unauthorizedListeners) fn();
}

let refreshing: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  refreshing ??= (async () => {
    const tokens = await loadTokens();
    if (!tokens?.refreshToken) throw new Error('no refresh token');

    const res = await fetch(`${env.API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({refreshToken: tokens.refreshToken}),
    });
    if (!res.ok) throw new Error('refresh failed');

    const next = (await res.json()) as Tokens;
    await saveTokens(next);
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function http<T = unknown>(
  path: string,
  opts: HttpOptions = {},
): Promise<T> {
  const buildHeaders = async () => {
    const headers = new Headers(opts.headers);
    headers.set('content-type', 'application/json');
    headers.set('x-request-id', requestId());
    if (!opts.skipAuth) {
      const tokens = await loadTokens();
      if (tokens?.accessToken) {
        headers.set('authorization', `Bearer ${tokens.accessToken}`);
      }
    }
    return headers;
  };

  const doFetch = async () => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    try {
      return await fetch(`${env.API_URL}${path}`, {
        ...opts,
        headers: await buildHeaders(),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  let res = await doFetch();

  if (res.status === 401 && !opts.skipAuth) {
    try {
      await refreshAccessToken();
      res = await doFetch();
    } catch {
      await clearTokens();
      emitUnauthorized();
      throw res;
    }
  }

  if (!res.ok) throw res;
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
