import { dayCacheStore } from '~/modules/diet/day-diet/infrastructure/signals/dayCacheStore'
import { setupDayDietRealtimeSubscription } from '~/modules/diet/day-diet/infrastructure/supabase/realtime'

/**
 * When realtime day diets change, apply granular cache updates
 */
setupDayDietRealtimeSubscription((event) => {
  console.log(`[dayDiet] Real-time ${event.eventType}:`, event)

  switch (event.eventType) {
    case 'INSERT': {
      if (event.new) {
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
