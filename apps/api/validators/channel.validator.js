import { z } from 'zod';

export const createChannelSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(80),
  type: z.enum(['PUBLIC', 'PRIVATE']).optional(),
});
