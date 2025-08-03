import { z } from 'zod/v4'

/**
 * Domain schema for cached search entries
 */
export const cachedSearchSchema = z.object({
  search: z.string().min(1),
})

/**
 * Domain type for cached search entries
 */
export type CachedSearch = z.infer<typeof cachedSearchSchema>

/**
 * Value object for search query normalization
 */
export const createNormalizedSearch = (search: string): string => {
  return search.toLowerCase().trim()
}
