import { createResource, createRoot } from 'solid-js'

import { useCases } from '~/di/useCases'
import { fetchUserBodyMeasures } from '~/modules/measure/application/usecases/measureCrud'
import { initializeMeasureRealtime } from '~/modules/measure/infrastructure/supabase/realtime'

/**
 * Factory that creates reactive measure state (Solid signals/resources).
 *
 * Allows injecting dependencies for DI and testing:
 * - `useCases`: DI container accessor (used to obtain current user id)
 * - `fetchUserBodyMeasures`: function that loads measures for a given user id
 * - `initializeMeasureRealtime`: function that starts realtime subscriptions
 *
 * The factory returns:
 * - `bodyMeasures`: a Solid resource signal containing the user's body measures
 * - `refetchBodyMeasures`: a function to refetch the resource on demand
 */
export function createMeasureState(deps?: {
  useCases?: typeof useCases
  fetchUserBodyMeasures?: typeof fetchUserBodyMeasures
  initializeMeasureRealtime?: typeof initializeMeasureRealtime
}) {
  const localUseCases = deps?.useCases ?? useCases
  const localFetch = deps?.fetchUserBodyMeasures ?? fetchUserBodyMeasures
  const localInitializeRealtime =
    deps?.initializeMeasureRealtime ?? initializeMeasureRealtime

  return createRoot(() => {
    // Resource keyed by current user id (auth or guest)
    const [bodyMeasures, { refetch: refetchBodyMeasures }] = createResource(
      () => localUseCases.authUseCases().currentUserIdOrGuestId(),
      localFetch,
      { initialValue: [], ssrLoadFrom: 'initial' },
    )

    // Initialize realtime subscriptions inside the reactive root so side-effects
    // stay scoped and do not leak across test runs or multiple roots.
    void localInitializeRealtime()

    return {
      bodyMeasures,
      refetchBodyMeasures,
    }
  })
}

/**
 * Backward-compatible shim: preserve the previous top-level exports while
 * allowing DI consumers to call `createMeasureState` directly to inject deps.
 *
 * Consumers that import:
 *   import { bodyMeasures, refetchBodyMeasures } from '~/modules/measure/application/usecases/measureState'
 * will continue to work.
 */
const _defaultMeasureState = createMeasureState()

export const bodyMeasures = _defaultMeasureState.bodyMeasures
export const refetchBodyMeasures = _defaultMeasureState.refetchBodyMeasures

export type MeasureState = ReturnType<typeof createMeasureState>
