import { z } from 'zod';

export const workspaceSlugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers, and hyphens only');

export const createWorkspaceInputSchema = z.object({
  slug: workspaceSlugSchema,
  name: z.string().min(1).max(80),
});

export const inviteMemberInputSchema = z.object({
  workspaceId: z.string(),
  email: z.string().email().toLowerCase(),
  role: z.enum(['ADMIN', 'MEMBER', 'GUEST']).default('MEMBER'),
});

export const updateMemberRoleSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'GUEST']),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberInputSchema>;
