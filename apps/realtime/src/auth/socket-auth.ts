import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';

import { createTokenSigner, type AccessTokenClaims } from '@collab/auth-core';

const signer = createTokenSigner({
  secret: process.env.JWT_ACCESS_SECRET!,
  issuer: 'collab.api',
  audience: 'collab.web',
  ttlSeconds: 15 * 60,
});

declare module 'socket.io' {
  interface Socket {
    data: { user?: AccessTokenClaims };
  }
}

export async function authenticateSocket(
  socket: Socket,
  next: (err?: ExtendedError) => void,
): Promise<void> {
  const token =
    (socket.handshake.auth?.token as string | undefined) ??
    (socket.handshake.query?.token as string | undefined);
  if (!token) return next(new Error('unauthorized'));
  try {
    socket.data.user = await signer.verify(token);
    next();
  } catch {
    next(new Error('invalid token'));
  }
}
