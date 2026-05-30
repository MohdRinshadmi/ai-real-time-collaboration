import { randomBytes } from 'node:crypto';

import config from '../config';
import { prisma } from '../models';
import { unauthorized } from '../utils/app-error';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken } from '../utils/token';

// Converts a JWT-style TTL ('15m', '30d', '900s', or bare seconds) to seconds.
function ttlToSeconds(ttl) {
  const match = /^(\d+)\s*([smhd])?$/.exec(String(ttl).trim());
  if (!match) return 0;
  const unit = match[2] ?? 's';
  return Number(match[1]) * { s: 1, m: 60, h: 3600, d: 86400 }[unit];
}

// Shapes a user row into the public `user` field of a SessionResponse
// (see packages/api-contracts sessionResponseSchema).
function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
  };
}

// Issues an access token (JWT) plus an opaque, hashed-at-rest refresh token,
// and persists a session row. Shared by register / login / refresh.
// Returns the full SessionResponse — the access/refresh tokens are also set as
// httpOnly cookies for the web app, while native clients read them from the body.
async function issueTokens(user, ctx = {}) {
  const workspaces = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    select: { workspaceId: true },
  });

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    workspaces: workspaces.map((w) => w.workspaceId),
  });

  const refreshToken = randomBytes(32).toString('hex');
  const refreshTokenHash = await hashPassword(refreshToken);

  const ttlDays = Number(config.JWT_REFRESH_TTL.replace('d', '')) || 30;
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: ttlToSeconds(config.JWT_ACCESS_TTL),
    user: publicUser(user),
  };
}

export async function register(input) {
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, name: input.name, passwordHash },
  });
  return issueTokens(user);
}

export async function login(email, password, ctx) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) throw unauthorized('invalid credentials');
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) throw unauthorized('invalid credentials');
  return issueTokens(user, ctx);
}

export async function refresh(refreshToken) {
  // Refresh tokens are opaque and hashed at rest. We look up by hash.
  // NOTE: argon2 hashes are salted (non-deterministic) — in production this
  // lookup should use an HMAC of the token. Preserved from the original.
  const hash = await hashPassword(refreshToken);
  const session = await prisma.session.findFirst({
    where: { refreshTokenHash: hash, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  if (!session) throw unauthorized('invalid refresh token');

  // Token rotation: revoke the old, issue a new pair.
  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });
  return issueTokens(session.user);
}

// Returns the public profile for the authenticated user. Backs GET /auth/me,
// which native clients call on cold start to restore a session.
export async function getProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized('user not found');
  return publicUser(user);
}

export async function logout(refreshToken) {
  const hash = await hashPassword(refreshToken);
  await prisma.session.updateMany({
    where: { refreshTokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
