import { createResource } from 'solid-js'

import { fetchUserBodyMeasures } from '~/modules/measure/application/usecases/measureCrud'
import { initializeMeasureRealtime } from '~/modules/measure/infrastructure/supabase/realtime'
import { currentUserId } from '~/modules/user/application/user'

export const [bodyMeasures, { refetch: refetchBodyMeasures }] = createResource(
  currentUserId,
  fetchUserBodyMeasures,
  { initialValue: [], ssrLoadFrom: 'initial' },
)

// Initialize realtime subscription
initializeMeasureRealtime()
