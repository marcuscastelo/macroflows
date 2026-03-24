import {
  type RecentFood,
  recentFoodSchema,
} from '~/modules/diet/recent-food/domain/recentFood'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

const SUPABASE_TABLE_RECENT_FOODS = 'recent_foods'

export function createRecentFoodRealtimeService() {
  let initialized = false

  function initializeRecentFoodRealtime(callbacks: {
    onInsert: (data: RecentFood) => void
    onUpdate: (data: RecentFood) => void
    onDelete: (data: RecentFood) => void
  }) {
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
              callbacks.onInsert(event.new)
            }
            break
          }

          case 'UPDATE': {
            if (event.new) {
              callbacks.onUpdate(event.new)
            }
            break
          }

          case 'DELETE': {
            if (event.old) {
              callbacks.onDelete(event.old)
            }
            break
          }
        }
      },
    )
  }

  return {
    initializeRecentFoodRealtime,
  }
}
