import { z } from 'zod/v4'

import { createZodEntity } from '~/shared/domain/validation'

const ze = createZodEntity('Measure')

// TODO: Create discriminate union type for Male and Female body measures
export const {
  schema: bodyMeasureSchema,
  newSchema: newBodyMeasureSchema,
  createNew: createNewBodyMeasure,
  promote: promoteToBodyMeasure,
  demote: demoteToNewBodyMeasure,
} = ze.create({
  height: ze.number(),
  waist: ze.number(),
  hip: ze
    .number()
    .nullish()
    .transform((v) => (v === null ? undefined : v)),
  neck: ze.number(),
  owner: ze.number(),
  target_timestamp: z
    .date()
    .or(z.string())
    .transform((v) => new Date(v)),
})

export type BodyMeasure = Readonly<z.infer<typeof bodyMeasureSchema>>
export type NewBodyMeasure = Readonly<z.infer<typeof newBodyMeasureSchema>>
