import type {LoginInput, SessionResponse} from '@collab/api-contracts';

import type {AuthUser} from '@/global/types';

import {http} from './http';

// Auth endpoints. Token persistence is handled by the AuthProvider/tokenStore;
// these functions only speak HTTP.

export function login(input: LoginInput): Promise<SessionResponse> {
  return http<SessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
    skipAuth: true,
  });
}

export function fetchMe(): Promise<AuthUser> {
  return http<AuthUser>('/auth/me');
}

export function logout(): Promise<void> {
  return http<void>('/auth/logout', {method: 'POST'});
}
