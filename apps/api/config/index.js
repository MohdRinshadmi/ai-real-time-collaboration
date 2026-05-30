import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env into process.env before anything reads it. (NestJS's ConfigModule
// did this implicitly; in plain Express we do it explicitly at the top of the
// first module that touches config.)
dotenv.config();

// Boot-time env validation. Any missing/invalid var crashes the process loudly
// — far better than a runtime `undefined` buried in a request handler.
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),

  DATABASE_URL: z.string().url(),
  DATABASE_URL_REPLICA: z.string().url().optional(),

  REDIS_URL: z.string().url(),
  REDIS_PUBSUB_URL: z.string().url().optional(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  COOKIE_DOMAIN: z.string().default('localhost'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string(),

  KAFKA_BROKERS: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

const parsed = configSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const config = parsed.data;

export default config;
