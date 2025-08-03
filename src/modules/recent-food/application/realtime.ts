import { recentFoodCacheStore } from '~/modules/recent-food/infrastructure/signals/recentFoodCacheStore'
import { setupRecentFoodRealtimeSubscription } from '~/modules/recent-food/infrastructure/supabase/realtime'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

let initialized = false
export function initializeRecentFoodRealtime() {
  if (initialized) {
    return
  }
  debug(`Recent food realtime initialized!`)
  initialized = true

  setupRecentFoodRealtimeSubscription((event) => {
    debug(`Recent food realtime event ${event.eventType}:`, event)

    switch (event.eventType) {
      case 'INSERT': {
        if (event.new !== undefined) {
          recentFoodCacheStore.upsertToCache(event.new)
        }
        break
      }

      case 'UPDATE': {
        if (event.new) {
          recentFoodCacheStore.upsertToCache(event.new)
        }
        break
      }

      case 'DELETE': {
        if (event.old) {
          recentFoodCacheStore.removeFromCache({
            by: 'id',
            value: event.old.id,
          })
        }
        break
      }
    }
  })
}
