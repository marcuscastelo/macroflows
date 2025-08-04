import {
  type CachedSearch,
  cachedSearchSchema,
} from '~/modules/search/domain/cachedSearch'
import { cachedSearchCacheStore } from '~/modules/search/infrastructure/signals/cachedSearchCacheStore'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()
const SUPABASE_TABLE_CACHED_SEARCHES = 'cached_searches'

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
  debug(`Cached search realtime initialized!`)
  initialized = true
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_CACHED_SEARCHES,
    cachedSearchSchema,
    (event) => {
      debug(`Event:`, event)

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
