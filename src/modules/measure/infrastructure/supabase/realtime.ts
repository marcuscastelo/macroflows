import { refetchBodyMeasures } from '~/modules/measure/application/usecases/measureCrud'
import {
  type BodyMeasure,
  bodyMeasureSchema,
} from '~/modules/measure/domain/measure'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()
const SUPABASE_TABLE_BODY_MEASURES = 'body_measures'

let initialized = false

/**
 * Sets up granular realtime subscription for body measure changes
 * @param onBodyMeasureChange - Callback for granular updates with event details
 */
export function setupBodyMeasureRealtimeSubscription(
  onBodyMeasureChange: (event: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    old?: BodyMeasure
    new?: BodyMeasure
  }) => void,
): void {
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_BODY_MEASURES,
    bodyMeasureSchema,
    onBodyMeasureChange,
  )
}

export function initializeMeasureRealtime(): void {
  if (initialized) {
    return
  }
  debug(`Measure realtime initialized!`)
  initialized = true
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_BODY_MEASURES,
    bodyMeasureSchema,
    (event) => {
      debug(`Event:`, event)

      switch (event.eventType) {
        case 'INSERT':
        case 'UPDATE':
        case 'DELETE': {
          // For measures, we simply refetch since we don't have complex caching
          void refetchBodyMeasures()
          break
        }
      }
    },
  )
}
