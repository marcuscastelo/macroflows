import { cachedSearchCacheStore } from '~/modules/search/infrastructure/signals/cachedSearchCacheStore'
import { setupCachedSearchRealtimeSubscription } from '~/modules/search/infrastructure/supabase/realtime'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

let initialized = false
export function initializeCachedSearchRealtime() {
  if (initialized) {
    return
  }
  debug(`Realtime initialized!`)
  initialized = true

  setupCachedSearchRealtimeSubscription((event) => {
    debug(`Realtime event ${event.eventType}:`, event)

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
  })
}
