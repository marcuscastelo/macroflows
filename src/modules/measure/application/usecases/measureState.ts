import { createResource, createRoot } from 'solid-js'

import { type BodyMeasure } from '~/modules/measure/domain/measure'
import { createMeasureRealtimeService } from '~/modules/measure/infrastructure/supabase/realtime'

const measureRealtimeService = createMeasureRealtimeService()

export function createMeasureState(deps: {
  getCurrentUserIdOrGuestId: () => string
  fetchUserBodyMeasures: (userId: string) => Promise<readonly BodyMeasure[]>
  initializeMeasureRealtime?: typeof measureRealtimeService.initializeMeasureRealtime
}) {
  const localFetch = deps.fetchUserBodyMeasures
  const localInitializeRealtime =
    deps.initializeMeasureRealtime ??
    measureRealtimeService.initializeMeasureRealtime

  return createRoot(() => {
    const [bodyMeasures, { refetch: refetchBodyMeasures }] = createResource(
      () => deps.getCurrentUserIdOrGuestId(),
      localFetch,
      { initialValue: [], ssrLoadFrom: 'initial' },
    )

    void localInitializeRealtime({
      refetchBodyMeasures: () => void refetchBodyMeasures(),
    })

    return {
      bodyMeasures,
      refetchBodyMeasures,
    }
  })
}

export type MeasureState = ReturnType<typeof createMeasureState>
