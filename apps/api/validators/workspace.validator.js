import { z } from 'zod';

export const workspaceSlugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers, and hyphens only');

export const createWorkspaceSchema = z.object({
  slug: workspaceSlugSchema,
  name: z.string().min(1).max(80),
});
