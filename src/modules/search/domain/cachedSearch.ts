import { type z } from 'zod/v4'

import { createZodEntity } from '~/shared/domain/validation'

const ze = createZodEntity('CachedSearch')

export const {
  schema: cachedSearchSchema,
  newSchema: newCachedSearchSchema,
  createNew: createNewCachedSearch,
  promote: promoteCachedSearch,
  demote: demoteNewCachedSearch,
} = ze.create({
  search: ze.string().min(1),
})

export type CachedSearch = Readonly<z.infer<typeof newCachedSearchSchema>>
export type NewCachedSearch = Readonly<z.infer<typeof newCachedSearchSchema>>

/**
 * Value object for search query normalization
 */
export const createNormalizedSearch = (search: string): string => {
  return search.toLowerCase().trim()
}
