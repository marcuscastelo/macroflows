import { createResource } from 'solid-js'

import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { fetchUserBodyMeasures } from '~/modules/measure/application/usecases/measureCrud'
import { initializeMeasureRealtime } from '~/modules/measure/infrastructure/supabase/realtime'

export const [bodyMeasures, { refetch: refetchBodyMeasures }] = createResource(
  () => authUseCases.currentUserIdOrGuestId(),
  fetchUserBodyMeasures,
  { initialValue: [], ssrLoadFrom: 'initial' },
)

// Initialize realtime subscription
initializeMeasureRealtime()
