import { createResource } from 'solid-js'

import { fetchUserBodyMeasures } from '~/modules/measure/application/usecases/measureCrud'
import { initializeMeasureRealtime } from '~/modules/measure/infrastructure/supabase/realtime'
import { userUseCases } from '~/modules/user/application/usecases/userUseCases'

export const [bodyMeasures, { refetch: refetchBodyMeasures }] = createResource(
  () => userUseCases.currentUserId_unsafe(),
  fetchUserBodyMeasures,
  { initialValue: [], ssrLoadFrom: 'initial' },
)

// Initialize realtime subscription
initializeMeasureRealtime()
