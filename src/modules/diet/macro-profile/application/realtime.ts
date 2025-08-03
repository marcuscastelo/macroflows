import { macroProfileCacheStore } from '~/modules/diet/macro-profile/infrastructure/signals/macroProfileCacheStore'
import { setupMacroProfileRealtimeSubscription } from '~/modules/diet/macro-profile/infrastructure/supabase/realtime'

let initialized = false

export function initializeMacroProfileRealtime() {
  if (initialized) {
    return
  }
  initialized = true

  setupMacroProfileRealtimeSubscription((event) => {
    console.log(`[macroProfile] Real-time ${event.eventType}:`, event)

    switch (event.eventType) {
      case 'INSERT': {
        if (event.new) {
          macroProfileCacheStore.upsertToCache(event.new)
        }
        break
      }

      case 'UPDATE': {
        if (event.new) {
          macroProfileCacheStore.upsertToCache(event.new)
        }
        break
      }

      case 'DELETE': {
        if (event.old) {
          macroProfileCacheStore.removeFromCache({
            by: 'id',
            value: event.old.id,
          })
        }
        break
      }
    }
  })
}
