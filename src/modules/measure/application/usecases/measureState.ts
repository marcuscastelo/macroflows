import { createResource } from 'solid-js'

import { useCases } from '~/di/useCases'
import { fetchUserBodyMeasures } from '~/modules/measure/application/usecases/measureCrud'
import { initializeMeasureRealtime } from '~/modules/measure/infrastructure/supabase/realtime'

export const [bodyMeasures, { refetch: refetchBodyMeasures }] = createResource(
  () => useCases.authUseCases().currentUserIdOrGuestId(),
  fetchUserBodyMeasures,
  { initialValue: [], ssrLoadFrom: 'initial' },
)

// Initialize realtime subscription
initializeMeasureRealtime()
