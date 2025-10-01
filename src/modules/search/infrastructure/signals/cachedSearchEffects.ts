import { onCleanup } from 'solid-js'

import { initializeCachedSearchRealtime } from '~/modules/search/infrastructure/supabase/realtime'
import { logging } from '~/shared/utils/logging'

let effectsInitialized = false

export function initializeCachedSearchEffects() {
  if (effectsInitialized) {
    logging.debug('Cached search effects already initialized')
    return
  }

  logging.debug('Initializing cached search effects')
  effectsInitialized = true

  // Initialize realtime subscription
  initializeCachedSearchRealtime()

  onCleanup(() => {
    logging.debug('Cleaning up cached search effects')
    effectsInitialized = false
  })
}
