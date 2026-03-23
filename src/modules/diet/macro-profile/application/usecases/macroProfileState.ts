import { createEffect, createRoot, untrack } from 'solid-js'

import { createMacroProfileCacheStore } from '~/modules/diet/macro-profile/application/store/macroProfileCacheStore'
import { macroProfileStateStore } from '~/modules/diet/macro-profile/application/store/macroProfileStateStore'
import { macroProfileUseCases } from '~/modules/diet/macro-profile/application/usecases/macroProfileUseCases'
import {
  createDefaultMacroProfile,
  getLatestMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { initializeMacroProfileRealtime } from '~/modules/diet/macro-profile/infrastructure/supabase/realtime'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import { logging } from '~/shared/utils/logging'

export const selectedUserId = macroProfileStateStore.selectedUserId
export const setSelectedUserId = macroProfileStateStore.setSelectedUserId

//* TODO: Remove DI shims and use proper container/use-case injection.
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

  // Effects that depend on DI and use-cases are intentionally not started
  // at module evaluation time to avoid circular import / TDZ issues.
  // Callers (for example the DI container) should call `initializeMacroProfileState`
  // after providing the necessary runtime use-cases.
  return cache
})

/**
 * Initialize reactive effects that require access to runtime use-cases.
 *
 * Call this once at app startup (for example from the DI container) after
 * `useCases`/auth use-cases are available.
 *
 * @param deps.getAuthUseCases - provider that returns auth use-cases with a
 *   `currentUserIdOrGuestId()` function.
 * @param deps.macroProfileUseCases - optional provider for macro-profile use-cases;
 *   defaults to the legacy shim `macroProfileUseCases`.
 */
export function initializeMacroProfileState(deps: {
  getAuthUseCases?: () => { currentUserIdOrGuestId: () => string }
  macroProfileUseCases?: typeof macroProfileUseCases
}) {
  // If auth provider is present, create an effect that reacts to auth changes.
  if (deps.getAuthUseCases) {
    const authProvider = deps.getAuthUseCases
    createEffect(() => {
      const userId = authProvider().currentUserIdOrGuestId()
      logging.debug(`User changed to ${userId}`)

      const previousUserId = untrack(macroProfileStateStore.selectedUserId)

      if (previousUserId !== null && previousUserId !== userId) {
        logging.debug(`Different user detected, clearing cache`)
        cache.clearCache()
      }

      macroProfileStateStore.setSelectedUserId(userId)
    })
  }

  // Effect to fetch macro profiles when the selected user changes. Uses either
  // the provided macroProfileUseCases or falls back to the legacy shim.
  createEffect(() => {
    const userId = macroProfileStateStore.selectedUserId()
    if (userId !== null) {
      logging.debug(`Fetching macro profiles for user ${userId}`)
      const usecases = deps.macroProfileUseCases ?? macroProfileUseCases
      void usecases.fetchUserMacroProfiles(userId)
    }
  })
}

export const userMacroProfiles = () => {
  // Read the selected user id from the local state store so this function
  // remains synchronous and does not depend on DI module initialization.
  // Use GUEST_USER_ID as a safe fallback for functions that expect a string id.
  const userId = macroProfileStateStore.selectedUserId() ?? GUEST_USER_ID
  return cache.getProfilesByUserId(userId)
}

export const latestMacroProfile = () => {
  const profiles = userMacroProfiles()
  const latest = getLatestMacroProfile(profiles)
  const userId = macroProfileStateStore.selectedUserId() ?? GUEST_USER_ID
  console.debug('Latest macro profile:', { latest })
  console.debug('All profiles:', { profiles })
  if (latest === null) {
    return createDefaultMacroProfile(userId)
  }
  return latest
}

export const previousMacroProfile = () => {
  const profiles = userMacroProfiles()
  return getLatestMacroProfile(profiles, 1)
}
