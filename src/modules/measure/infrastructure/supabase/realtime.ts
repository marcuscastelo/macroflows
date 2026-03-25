import {
  type BodyMeasure,
  bodyMeasureSchema,
} from '~/modules/measure/domain/measure'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

const SUPABASE_TABLE_BODY_MEASURES = 'body_measures'

export function createMeasureRealtimeService() {
  let initialized = false

  /**
   * Sets up granular realtime subscription for body measure changes
   * @param onBodyMeasureChange - Callback for granular updates with event details
   */
  function setupBodyMeasureRealtimeSubscription(
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

  /**
   * Initializes the body measure realtime subscription once per session.
   *
   * @param deps - Dependencies used to react to realtime body measure changes.
   * @returns Nothing.
   */
  function initializeMeasureRealtime(deps: {
    refetchBodyMeasures: () => void
  }): void {
    if (initialized) {
      return
    }
    logging.debug(`Measure realtime initialized!`)
    initialized = true
    setupBodyMeasureRealtimeSubscription((event) => {
      logging.debug(`Event:`, event)

      switch (event.eventType) {
        case 'INSERT':
        case 'UPDATE':
        case 'DELETE': {
          // For measures, we simply refetch since we don't have complex caching
          deps.refetchBodyMeasures()
          break
        }
      }
    })
  }

  return {
    initializeMeasureRealtime,
  }
}
