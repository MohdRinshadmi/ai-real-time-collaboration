import passport from 'passport';

import { unauthorized } from '../utils/app-error';

// JWT auth guard. On success attaches `req.user = { id, email, workspaces }`.
// Stateless — no session is created.
export function authenticate(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return next(unauthorized('authentication required'));
    req.user = user;
    return next();
  })(req, res, next);
}
