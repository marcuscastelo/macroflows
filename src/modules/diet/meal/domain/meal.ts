import { type z } from 'zod/v4'

import { itemSchema } from '~/modules/diet/item/schema/itemSchema'
import { createZodEntity } from '~/shared/domain/validation'

const ze = createZodEntity('Meal')

export const {
  schema: mealSchema,
  newSchema: newMealSchema,
  createNew: createNewMeal,
  promote: promoteMeal,
} = ze.create({
  name: ze.string(),
  items: ze.array(itemSchema),
})

export type Meal = Readonly<z.infer<typeof mealSchema>>
