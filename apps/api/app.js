import path from 'node:path';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';

import config from './config';
import { configurePassport } from './config/passport';
import { notFoundHandler, errorHandler } from './middleware/error-handler';
import { requestId } from './middleware/request-id';
import routes from './routes';
import { logger } from './utils/logger';

// Builds and configures the Express application. The HTTP server itself is
// started in bin/www — keeping app.js transport-agnostic makes it trivial to
// import for tests (supertest) without binding a port.
const app = express();

// View engine — used only for the public landing/error pages; the API is JSON.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Behind a load balancer / nginx — trust the first proxy so req.ip and
// secure-cookie detection work correctly.
app.set('trust proxy', 1);

// --- Security & parsing middleware ---------------------------------------
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: config.CORS_ORIGINS.split(','),
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestId);
app.use(
  morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (line) => logger.info(line.trim()) },
  }),
);

// --- Auth -----------------------------------------------------------------
configurePassport(passport);
app.use(passport.initialize());

// --- Routes ---------------------------------------------------------------
app.get('/', (_req, res) => res.render('index', { name: 'Collab API' }));
app.use('/', routes);

// --- Error handling (must be last) ----------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
