import { Router } from 'express';
import passport from 'passport';

import * as auth from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { authLimiter } from '../middleware/rate-limit';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), auth.register);
router.post('/login', authLimiter, validate(loginSchema), auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/me', authenticate, auth.me);

// --- OAuth (only functional when the provider credentials are configured) ---
router.get('/google', passport.authenticate('google', { session: false }));
router.get(
  '/callback/google',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  auth.oauthCallback,
);
router.get('/github', passport.authenticate('github', { session: false }));
router.get(
  '/callback/github',
  passport.authenticate('github', { session: false, failureRedirect: '/' }),
  auth.oauthCallback,
);

export default router;
