// Domain layer for recent food - pure business logic without external dependencies

import { z } from 'zod/v4'

import { createZodEntity } from '~/shared/domain/validation'

const ze = createZodEntity('RecentFood')

export const {
  schema: recentFoodSchema,
  createNew: createNewRecentFood,
  demote: demoteRecentFood,
  promote: promoteRecentFood,
  newSchema: newRecentFoodSchema,
} = ze.create({
  user_id: ze.string(),
  type: z.union([z.literal('food'), z.literal('recipe')]),
  reference_id: ze.number(),
  last_used: z.date(),
  times_used: ze.number(),
})

export type RecentFood = Readonly<z.infer<typeof recentFoodSchema>>
export type NewRecentFood = Readonly<z.infer<typeof newRecentFoodSchema>>
