import { refetchBodyMeasures } from '~/modules/measure/application/usecases/measureCrud'
import { setupBodyMeasureRealtimeSubscription } from '~/modules/measure/infrastructure/supabase/realtime'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

let initialized = false
export function initializeMeasureRealtime() {
  if (initialized) {
    return
  }
  debug(`Measure Realtime initialized!`)
  initialized = true

  setupBodyMeasureRealtimeSubscription((event) => {
    debug(`Measure Realtime event ${event.eventType}:`, event)

    switch (event.eventType) {
      case 'INSERT':
      case 'UPDATE':
      case 'DELETE': {
        // For measures, we simply refetch since we don't have complex caching
        void refetchBodyMeasures()
        break
      }
    }
  })
}
