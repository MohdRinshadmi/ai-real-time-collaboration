import { z } from 'zod';

// zod-validated env. Throws at boot if anything required is missing — far better
// than a runtime undefined deep in a request handler.
const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_WS_URL: z.string().url(),
  NEXT_PUBLIC_AI_URL: z.string().url(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_AI_URL: process.env.NEXT_PUBLIC_AI_URL,
});

if (!parsed.success) {
  console.error('Invalid env:', parsed.error.flatten().fieldErrors);
  throw new Error('Missing or invalid environment variables');
}

export const env = parsed.data;
