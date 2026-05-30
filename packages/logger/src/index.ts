import { trace } from '@opentelemetry/api';
import pino, { type Logger } from 'pino';

// Structured JSON logger with OpenTelemetry trace correlation.
// In dev: pretty-prints. In prod: emits JSON to stdout (Fluent Bit ships it).

export type LoggerOptions = {
  service: string;
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  pretty?: boolean;
};

export function createLogger(opts: LoggerOptions): Logger {
  const base = {
    service: opts.service,
    env: process.env.NODE_ENV ?? 'development',
  };

  return pino({
    level: opts.level ?? process.env.LOG_LEVEL ?? 'info',
    base,
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
    transport: opts.pretty
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
  });
}

export type { Logger } from 'pino';
