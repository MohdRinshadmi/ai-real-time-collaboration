import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';

import config from './index';
import { ACCESS_COOKIE } from '../helper/cookies';

// Wires up Passport strategies. Called once from app.js. We keep auth stateless
// (no sessions) — every request re-validates the JWT.
export function configurePassport(passport) {
  // --- Access token (cookie first, then Authorization: Bearer) ---
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          (req) => req.cookies?.[ACCESS_COOKIE] ?? null,
          ExtractJwt.fromAuthHeaderAsBearerToken(),
        ]),
        ignoreExpiration: false,
        secretOrKey: config.JWT_ACCESS_SECRET,
      },
      (payload, done) => {
        // payload.sub is the user id; mirror the shape downstream code expects.
        done(null, { id: payload.sub, email: payload.email, workspaces: payload.workspaces });
      },
    ),
  );

  // --- Google OAuth (optional — only active when credentials are present) ---
  if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.GOOGLE_CLIENT_ID,
          clientSecret: config.GOOGLE_CLIENT_SECRET,
          callbackURL: '/auth/callback/google',
          scope: ['email', 'profile'],
        },
        (_accessToken, _refreshToken, profile, done) => {
          done(null, {
            provider: 'google',
            providerId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
          });
        },
      ),
    );
  }

  // --- GitHub OAuth (optional) ---
  if (config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: config.GITHUB_CLIENT_ID,
          clientSecret: config.GITHUB_CLIENT_SECRET,
          callbackURL: '/auth/callback/github',
          scope: ['user:email'],
        },
        (_accessToken, _refreshToken, profile, done) => {
          done(null, {
            provider: 'github',
            providerId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName ?? profile.username,
            avatarUrl: profile.photos?.[0]?.value,
          });
        },
      ),
    );
  }
}
