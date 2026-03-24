import { describe, expect, it } from 'vitest'

import { createNewCachedSearch } from '~/modules/search/domain/cachedSearch'
import { createSupabaseCachedSearchMapper } from '~/modules/search/infrastructure/supabase/supabaseCachedSearchMapper'
import { type Database } from '~/shared/supabase/database.types'

describe('createSupabaseCachedSearchMapper', () => {
  it('creates a mapper that converts cached searches to and from Supabase DTOs', () => {
    const mapper = createSupabaseCachedSearchMapper()
    const search = ' arroz integral '

    const dto: Database['public']['Tables']['cached_searches']['Row'] = {
      created_at: '2026-01-01T00:00:00.000Z',
      search,
    }

    expect(mapper.toDomain(dto).search).toBe(search)
    expect(
      mapper.toInsertDTO(
        createNewCachedSearch({
          search,
        }),
      ),
    ).toEqual({
      search,
    })
  })
})
