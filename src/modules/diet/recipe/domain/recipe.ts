import { type z } from 'zod/v4'

import { itemSchema } from '~/modules/diet/item/schema/itemSchema'
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
  items: ze.array(itemSchema),
  prepared_multiplier: ze.number().default(1),
})

export type NewRecipe = Readonly<z.infer<typeof newRecipeSchema>>
export type Recipe = Readonly<z.infer<typeof recipeSchema>>
