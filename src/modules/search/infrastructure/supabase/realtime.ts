import { cachedSearchCacheStore } from '~/modules/search/application/store/cachedSearchCacheStore'
import {
  type CachedSearch,
  cachedSearchSchema,
} from '~/modules/search/domain/cachedSearch'
import { SUPABASE_TABLE_CACHED_SEARCHES } from '~/modules/search/infrastructure/supabase/constants'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

let initialized = false

export type CachedSearchRealtimeEvent = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: CachedSearch
  old?: CachedSearch
}

export function setupCachedSearchRealtimeSubscription(
  onEvent: (event: CachedSearchRealtimeEvent) => void,
): void {
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_CACHED_SEARCHES,
    cachedSearchSchema,
    onEvent,
  )
}

export function initializeCachedSearchRealtime(): void {
  if (initialized) {
    return
  }
  logging.debug(`Cached search realtime initialized!`)
  initialized = true
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_CACHED_SEARCHES,
    cachedSearchSchema,
    (event) => {
      logging.debug(`Event:`, event)

      switch (event.eventType) {
        case 'INSERT': {
          if (event.new !== undefined) {
            cachedSearchCacheStore.upsertToCache(event.new)
          }
          break
        }

        case 'UPDATE': {
          if (event.new) {
            cachedSearchCacheStore.upsertToCache(event.new)
          }
          break
        }

        case 'DELETE': {
          if (event.old) {
            cachedSearchCacheStore.removeFromCache({
              by: 'search',
              value: event.old.search,
            })
          }
          break
        }
      }
    },
  )
}
