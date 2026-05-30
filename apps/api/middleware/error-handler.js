import { ZodError } from 'zod';

import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

// 404 for any unmatched route — forwarded into the error handler below.
export function notFoundHandler(req, _res, next) {
  next(new AppError(404, `route not found: ${req.method} ${req.path}`));
}

// Single catch-all so every error response is shape-consistent and every
// unexpected error is logged with the request id. Replaces the NestJS
// GlobalExceptionFilter. Must be registered last (4-arg signature).
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const requestId = req.requestId ?? 'unknown';

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'validation_error',
      details: err.flatten().fieldErrors,
      requestId,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
      requestId,
    });
  }

  // Prisma unique-constraint violation that wasn't caught in a service.
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: 'conflict', requestId });
  }

  logger.error({ err, requestId, path: req.originalUrl }, 'Unhandled exception');
  return res.status(500).json({ error: 'internal_error', requestId });
}
