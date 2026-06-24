import type { FastifyRequest } from 'fastify';

import { createTokenSigner, type AccessTokenClaims } from '@collab/auth-core';

// Request authentication + workspace authorization for the gateway.
//
// The gateway is reachable directly by clients (mobile hits AI_URL, web hits
// NEXT_PUBLIC_AI_URL), so it MUST NOT trust the workspaceId in the request body.
// We verify the same access token the rest of the platform issues and confirm
// the caller actually belongs to the workspace they're asking about — otherwise
// a guessed workspaceId would leak another tenant's documents through RAG /
// the search_workspace tool.
//
// Mirrors apps/realtime/src/auth/socket-auth.ts so tokens are interchangeable.

const signer = createTokenSigner({
  secret: process.env.JWT_ACCESS_SECRET!,
  issuer: 'collab.api',
  audience: 'collab.web',
  ttlSeconds: 15 * 60,
});

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

/**
 * Verify the bearer token and assert membership of `workspaceId`.
 * Throws AuthError (401/403) on failure; returns the claims on success.
 */
export async function authorizeWorkspace(
  req: FastifyRequest,
  workspaceId: string,
): Promise<AccessTokenClaims> {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new AuthError(401, 'unauthenticated');

  let claims: AccessTokenClaims;
  try {
    claims = await signer.verify(token);
  } catch {
    throw new AuthError(401, 'invalid_token');
  }

  if (!Array.isArray(claims.workspaces) || !claims.workspaces.includes(workspaceId)) {
    throw new AuthError(403, 'forbidden_workspace');
  }
  return claims;
}
