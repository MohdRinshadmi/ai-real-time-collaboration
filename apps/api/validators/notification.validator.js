import { z } from 'zod';

export const markReadSchema = z.object({
  ids: z.array(z.string()).min(1),
});
