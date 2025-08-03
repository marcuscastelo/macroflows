import { createEffect, createRoot, untrack } from 'solid-js'

import { fetchUserMacroProfiles } from '~/modules/diet/macro-profile/application/usecases/macroProfileCrud'
import { macroProfileCacheStore } from '~/modules/diet/macro-profile/infrastructure/signals/macroProfileCacheStore'
import { macroProfileStateStore } from '~/modules/diet/macro-profile/infrastructure/signals/macroProfileStateStore'
import { currentUserId } from '~/modules/user/application/user'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

let initialized = false

export function initializeMacroProfileEffects() {
  if (initialized) {
    return
  }
  initialized = true

  return createRoot(() => {
    // When user changes, update selected user and clear cache if needed
    createEffect(() => {
      const userId = currentUserId()
      debug(`User changed to ${userId}`)

      const previousUserId = untrack(macroProfileStateStore.selectedUserId)

      if (previousUserId !== null && previousUserId !== userId) {
        debug(`Different user detected, clearing cache`)
        macroProfileCacheStore.clearCache()
      }

      macroProfileStateStore.setSelectedUserId(userId)
    })

    // When selected user changes, fetch their macro profiles
    createEffect(() => {
      const userId = macroProfileStateStore.selectedUserId()
      if (userId !== null) {
        debug(`Fetching macro profiles for user ${userId}`)
        void fetchUserMacroProfiles(userId)
      }
    })
  })
}
