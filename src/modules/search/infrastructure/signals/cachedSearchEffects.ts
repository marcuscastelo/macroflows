import { onCleanup } from 'solid-js'

import { initializeCachedSearchRealtime } from '~/modules/search/application/realtime'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

let effectsInitialized = false

export function initializeCachedSearchEffects() {
  if (effectsInitialized) {
    debug('Cached search effects already initialized')
    return
  }

  debug('Initializing cached search effects')
  effectsInitialized = true

  // Initialize realtime subscription
  initializeCachedSearchRealtime()

  onCleanup(() => {
    debug('Cleaning up cached search effects')
    effectsInitialized = false
  })
}
