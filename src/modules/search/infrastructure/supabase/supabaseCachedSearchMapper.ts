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

export const supabaseCachedSearchMapper = {
  toDomain: (supabaseData: CachedSearchDTO): CachedSearch => {
    return parseWithStack(cachedSearchSchema, {
      search: supabaseData.search,
    })
  },

  toInsertDTO: (domainData: NewCachedSearch): InsertCachedSearchDTO => {
    return {
      search: domainData.search,
    }
  },
}
