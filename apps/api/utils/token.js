import jwt from 'jsonwebtoken';

import config from '../config';

// Signs the short-lived access token. HS256 by default, which passport-jwt
// (also built on jsonwebtoken) verifies with the same secret.
export function signAccessToken({ userId, email, workspaces }) {
  return jwt.sign({ email, workspaces }, config.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: config.JWT_ACCESS_TTL,
  });
}
