import { trace } from '@opentelemetry/api';
import pino from 'pino';

import config from '../config';

// Structured JSON logger with OpenTelemetry trace correlation. Pretty-prints in
// dev; emits JSON to stdout in production (a log shipper forwards it).
// Sensitive fields are redacted so tokens/passwords never hit the logs.
export const logger = pino({
  level: config.LOG_LEVEL,
  base: { service: 'api', env: config.NODE_ENV },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.refreshToken',
      '*.accessToken',
      '*.apiKey',
    ],
    censor: '[REDACTED]',
  },
  mixin() {
    const span = trace.getActiveSpan();
    if (!span) return {};
    const ctx = span.spanContext();
    return { traceId: ctx.traceId, spanId: ctx.spanId };
  },
  transport:
    config.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
});
