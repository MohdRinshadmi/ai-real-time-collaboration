import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(12).max(128),
  name: z.string().min(1).max(80),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
