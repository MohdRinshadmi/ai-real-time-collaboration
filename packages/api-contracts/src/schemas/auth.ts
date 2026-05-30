import { z } from 'zod';

export const registerInputSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(12).max(128),
  name: z.string().min(1).max(80),
});

export const loginInputSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const refreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1),
});

export const oauthCallbackSchema = z.object({
  provider: z.enum(['google', 'github']),
  code: z.string().min(1),
  state: z.string().min(1),
});

export const sessionResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    avatarUrl: z.string().url().nullable(),
  }),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
