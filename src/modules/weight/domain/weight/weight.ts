import { z } from 'zod/v4'

import { createZodEntity } from '~/shared/domain/validation'

const ze = createZodEntity('Weight')

export const {
  schema: weightSchema,
  newSchema: newWeightSchema,
  createNew: createNewWeight,
  promote: promoteToWeight,
  demote: demoteToNewWeight,
} = ze.create({
  user_id: ze.string(),
  weight: ze.number(),
  target_timestamp: z
    .date()
    .or(z.string())
    .transform((v) => new Date(v)),
})

export type NewWeight = Readonly<z.infer<typeof newWeightSchema>>
export type Weight = Readonly<z.infer<typeof weightSchema>>
