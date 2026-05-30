import * as authService from '../services/auth.service';
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from '../helper/cookies';
import { refreshTokenSchema } from '../validators/auth.validator';
import { asyncHandler } from '../utils/async-handler';

// Auth responses both set httpOnly cookies (for the web app) and return the
// full SessionResponse JSON (for native clients that hold tokens themselves).

export const register = asyncHandler(async (req, res) => {
  const session = await authService.register(req.body);
  setAuthCookies(res, session);
  res.status(201).json(session);
});

export const login = asyncHandler(async (req, res) => {
  const session = await authService.login(req.body.email, req.body.password, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  setAuthCookies(res, session);
  res.status(200).json(session);
});

export const refresh = asyncHandler(async (req, res) => {
  // Web sends the refresh token via the httpOnly cookie; native clients POST it
  // in the body. Accept either.
  const { refreshToken } = refreshTokenSchema.parse({
    refreshToken: req.body?.refreshToken ?? req.cookies[REFRESH_COOKIE],
  });
  const session = await authService.refresh(refreshToken);
  setAuthCookies(res, session);
  res.status(200).json(session);
});

export const me = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.id);
  res.status(200).json(profile);
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE];
  if (refreshToken) await authService.logout(refreshToken);
  clearAuthCookies(res);
  res.status(204).end();
});

// OAuth callbacks — passport attaches the resolved profile to req.user. The
// social-account → user reconciliation is delegated to the auth service in a
// full implementation; here we simply echo the linked identity.
export const oauthCallback = asyncHandler(async (req, res) => {
  res.status(200).json({ ok: true, profile: req.user });
});
