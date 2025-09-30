import { z } from 'zod/v4'

import { unifiedItemSchema } from '~/modules/diet/unified-item/schema/unifiedItemSchema'

// TODO: Remove all DAOs, renaming remaining to DTO
// Issue URL: https://github.com/marcuscastelo/macroflows/issues/1064
// DAO schema for database record (current unified format)
export const mealDAOSchema = z.object({
  id: z.number(),
  name: z.string(),
  items: z.array(unifiedItemSchema),
})
