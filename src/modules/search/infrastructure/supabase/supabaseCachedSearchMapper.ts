import {
  type CachedSearch,
  cachedSearchSchema,
  type NewCachedSearch,
} from '~/modules/search/domain/cachedSearch'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

type CachedSearchDTO = Database['public']['Tables']['cached_searches']['Row']
type InsertCachedSearchDTO =
  Database['public']['Tables']['cached_searches']['Insert']

function toDomain(supabaseData: CachedSearchDTO): CachedSearch {
  return parseWithStack(cachedSearchSchema, {
    search: supabaseData.search,
  })
}

function toInsertDTO(domainData: NewCachedSearch): InsertCachedSearchDTO {
  return {
    search: domainData.search,
  }
}

/**
 * Factory for the Supabase cached-search mapper.
 *
 * @returns Cached-search mapping helpers for Supabase DTOs.
 */
export function createSupabaseCachedSearchMapper() {
  return {
    toDomain,
    toInsertDTO,
  }
}
