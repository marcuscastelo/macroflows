import { recentFoodSchema } from '~/modules/recent-food/domain/recentFood'
import { recentFoodCacheStore } from '~/modules/recent-food/infrastructure/signals/recentFoodCacheStore'
import { SUPABASE_TABLE_RECENT_FOODS } from '~/modules/recent-food/infrastructure/supabase/constants'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

let initialized = false
export function initializeRecentFoodRealtime() {
  if (initialized) {
    return
  }
  logging.debug(`Recent food realtime initialized!`)
  initialized = true

  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_RECENT_FOODS,
    recentFoodSchema,
    (event) => {
      logging.debug(`Recent food realtime event ${event.eventType}:`, event)

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
    },
  )
}
