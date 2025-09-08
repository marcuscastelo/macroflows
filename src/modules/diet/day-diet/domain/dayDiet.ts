import { type z } from 'zod/v4'

import { mealSchema } from '~/modules/diet/meal/domain/meal'
import { createZodEntity } from '~/shared/domain/validation'

const ze = createZodEntity('DayDiet')

export const {
  schema: dayDietSchema,
  newSchema: newDayDietSchema,
  createNew: createNewDayDiet,
  promote: promoteDayDiet,
  demote: demoteNewDayDiet,
} = ze.create({
  target_day: ze.string(), // TODO: Change target_day to supabase date type
  owner: ze.number(),
  meals: ze.array(mealSchema),
})

export type DayDiet = Readonly<z.infer<typeof dayDietSchema>>
export type NewDayDiet = Readonly<z.infer<typeof newDayDietSchema>>
