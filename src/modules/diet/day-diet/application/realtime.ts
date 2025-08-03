import { dayCacheStore } from '~/modules/diet/day-diet/infrastructure/signals/dayCacheStore'
import { setupDayDietRealtimeSubscription } from '~/modules/diet/day-diet/infrastructure/supabase/realtime'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

let initialized = false
export function initializeDayDietRealtime() {
  if (initialized) {
    return
  }
  debug(`Realtime initialized!`)
  initialized = true

  setupDayDietRealtimeSubscription((event) => {
    debug(`Realtime event ${event.eventType}:`, event)

    switch (event.eventType) {
      case 'INSERT': {
        if (event.new !== undefined) {
          dayCacheStore.upsertToCache(event.new)
        }
        break
      }

      case 'UPDATE': {
        if (event.new) {
          dayCacheStore.upsertToCache(event.new)
        }
        break
      }

      case 'DELETE': {
        if (event.old) {
          dayCacheStore.removeFromCache({ by: 'id', value: event.old.id })
        }
        break
      }
    }
  })
}
