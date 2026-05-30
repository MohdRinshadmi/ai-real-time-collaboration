import config from '../config';

export const ACCESS_COOKIE = 'collab.session';
export const REFRESH_COOKIE = 'collab.refresh';

const ACCESS_MAX_AGE = 15 * 60_000; // 15 minutes
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60_000; // 30 days

// Sets the access + refresh cookies after a successful auth. The refresh cookie
// is scoped to /auth so it's only sent to the refresh/logout endpoints.
export function setAuthCookies(res, tokens) {
  const common = {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: config.COOKIE_DOMAIN,
  };
  res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...common, maxAge: ACCESS_MAX_AGE });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...common,
    maxAge: REFRESH_MAX_AGE,
    path: '/auth',
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE);
  res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
}
