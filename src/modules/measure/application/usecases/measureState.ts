import { createResource, createRoot } from 'solid-js'

import { createMeasureCrud } from '~/modules/measure/application/usecases/measureCrud'
import { initializeMeasureRealtime } from '~/modules/measure/infrastructure/supabase/realtime'

export function createMeasureState(deps: {
  getCurrentUserIdOrGuestId: () => string
  fetchUserBodyMeasures?: ReturnType<
    typeof createMeasureCrud
  >['fetchUserBodyMeasures']
  initializeMeasureRealtime?: (deps: {
    refetchBodyMeasures: () => void
  }) => void
}) {
  const localFetch =
    deps.fetchUserBodyMeasures ?? createMeasureCrud().fetchUserBodyMeasures
  const localInitializeRealtime =
    deps.initializeMeasureRealtime ?? initializeMeasureRealtime

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
