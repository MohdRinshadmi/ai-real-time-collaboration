import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {loginInputSchema} from '@collab/api-contracts';

import {authApi, getSocketClient, onUnauthorized} from '@/api';
import {clearTokens, loadTokens, saveTokens} from '@/services/tokenStore';
import type {AuthUser} from '@/global/types';

type AuthState = {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  // Restore a session from the keychain on cold start.
  useEffect(() => {
    let active = true;
    (async () => {
      const tokens = await loadTokens();
      if (!tokens) {
        if (active) setStatus('unauthenticated');
        return;
      }
      try {
        const me = await authApi.fetchMe();
        if (!active) return;
        setUser(me);
        setStatus('authenticated');
        getSocketClient().connect(tokens.accessToken);
      } catch {
        await clearTokens();
        if (active) setStatus('unauthenticated');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // The http client tells us when a refresh failed for good.
  useEffect(
    () =>
      onUnauthorized(() => {
        setUser(null);
        setStatus('unauthenticated');
        getSocketClient().disconnect();
      }),
    [],
  );

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      async login(email, password) {
        const creds = loginInputSchema.parse({email, password});
        const session = await authApi.login(creds);
        await saveTokens({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        });
        setUser(session.user);
        setStatus('authenticated');
        getSocketClient().connect(session.accessToken);
      },
      async logout() {
        try {
          await authApi.logout();
        } catch {
          // Best-effort; we clear local state regardless.
        }
        await clearTokens();
        getSocketClient().disconnect();
        setUser(null);
        setStatus('unauthenticated');
      },
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
