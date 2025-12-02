import { createRoot } from 'solid-js'

import { createCachedSearchCacheStore } from '~/modules/search/application/store/cachedSearchCacheStore'
import { createCachedSearchCrudUseCases } from '~/modules/search/application/usecases/cachedSearchCrud'
import { cachedSearchSchema } from '~/modules/search/domain/cachedSearch'
import { createCachedSearchRepository } from '~/modules/search/infrastructure/cachedSearchRepository'
import { initializeCachedSearchRealtime } from '~/modules/search/infrastructure/supabase/realtime'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const { cachedSearchCacheStore, cachedSearchCrudUseCases } = createRoot(() => {
  const cachedSearchCacheStore = createCachedSearchCacheStore()
  const cachedSearchRepository = createCachedSearchRepository()
  const cachedSearchCrudUseCases = createCachedSearchCrudUseCases(
    cachedSearchRepository,
  )

  initializeCachedSearchRealtime({
    onInsert: (newRecord) => {
      cachedSearchCacheStore.upsertToCache(newRecord)
    },
    onUpdate: (newRecord) => {
      cachedSearchCacheStore.upsertToCache(newRecord)
    },
    onDelete: (oldRecord) => {
      cachedSearchCacheStore.removeFromCache({
        by: 'search',
        value: oldRecord.search,
      })
    },
  })

  return { cachedSearchCacheStore, cachedSearchCrudUseCases }
})

export const searchUseCases = {
  isSearchCached: async (query: string): Promise<boolean> => {
    const result = await cachedSearchCrudUseCases.isSearchCached(query)
    if (result) {
      cachedSearchCacheStore.upsertToCache(
        parseWithStack(cachedSearchSchema, { search: query }),
      )
    } else {
      cachedSearchCacheStore.removeFromCache({
        by: 'search',
        value: query,
      })
    }
    return result
  },
  markSearchAsCached: async (query: string): Promise<void> => {
    await cachedSearchCrudUseCases.markSearchAsCached(query)
    cachedSearchCacheStore.upsertToCache(
      parseWithStack(cachedSearchSchema, {
        search: query,
      }),
    )
  },
  unmarkSearchAsCached: async (query: string): Promise<void> => {
    await cachedSearchCrudUseCases.unmarkSearchAsCached(query)
    cachedSearchCacheStore.removeFromCache({
      by: 'search',
      value: query,
    })
  },
}
