import { type z } from 'zod/v4'

import { unifiedItemSchema } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { createZodEntity } from '~/shared/domain/validation'

const ze = createZodEntity('Recipe')

export const {
  schema: recipeSchema,
  newSchema: newRecipeSchema,
  createNew: createNewRecipe,
  promote: promoteRecipe,
} = ze.create({
  name: ze.string(),
  user_id: ze.string(),
  items: ze.array(unifiedItemSchema).readonly(),
  prepared_multiplier: ze.number().default(1),
})

// Types using UnifiedItem
export type NewRecipe = Readonly<z.infer<typeof newRecipeSchema>>
export type Recipe = Readonly<z.infer<typeof recipeSchema>>
