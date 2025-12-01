import { createEffect, createRoot, untrack } from 'solid-js'

import { createMacroProfileCacheStore } from '~/modules/diet/macro-profile/application/store/macroProfileCacheStore'
import { macroProfileStateStore } from '~/modules/diet/macro-profile/application/store/macroProfileStateStore'
import { macroProfileUseCases } from '~/modules/diet/macro-profile/application/usecases/macroProfileUseCases'
import {
  createDefaultMacroProfile,
  getLatestMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { initializeMacroProfileRealtime } from '~/modules/diet/macro-profile/infrastructure/supabase/realtime'
import { currentUserId } from '~/modules/user/application/user'
import { logging } from '~/shared/utils/logging'

export const selectedUserId = macroProfileStateStore.selectedUserId
export const setSelectedUserId = macroProfileStateStore.setSelectedUserId

export const cache = createRoot(() => {
  const cache = createMacroProfileCacheStore()
  initializeMacroProfileRealtime({
    onInsert: (profile) => {
      cache.upsertToCache(profile)
    },
    onUpdate: (profile) => {
      cache.upsertToCache(profile)
    },
    onDelete: (profile) => {
      cache.removeFromCache({ by: 'id', value: profile.id })
    },
  })

  // When user changes, update selected user and clear cache if needed
  createEffect(() => {
    const userId = currentUserId()
    logging.debug(`User changed to ${userId}`)

    const previousUserId = untrack(macroProfileStateStore.selectedUserId)

    if (previousUserId !== null && previousUserId !== userId) {
      logging.debug(`Different user detected, clearing cache`)
      cache.clearCache()
    }

    macroProfileStateStore.setSelectedUserId(userId)
  })

  // When selected user changes, fetch their macro profiles
  createEffect(() => {
    const userId = macroProfileStateStore.selectedUserId()
    if (userId !== null) {
      logging.debug(`Fetching macro profiles for user ${userId}`)
      void macroProfileUseCases.fetchUserMacroProfiles(userId)
    }
  })
  return cache
})

export const userMacroProfiles = () => {
  const userId = currentUserId()
  return cache.getProfilesByUserId(userId)
}

export const latestMacroProfile = () => {
  const profiles = userMacroProfiles()
  const latest = getLatestMacroProfile(profiles)
  console.debug('Latest macro profile:', { latest })
  console.debug('All profiles:', { profiles })
  if (latest === null) {
    const userId = currentUserId()
    return createDefaultMacroProfile(userId)
  }
  return latest
}

export const previousMacroProfile = () => {
  const profiles = userMacroProfiles()
  return getLatestMacroProfile(profiles, 1)
}
