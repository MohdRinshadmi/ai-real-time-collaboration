import { z } from 'zod';

export const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, 'invalid cuid');

export const paginationInputSchema = z.object({
  cursor: z.string().nullish(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  });

export type PaginationInput = z.infer<typeof paginationInputSchema>;
