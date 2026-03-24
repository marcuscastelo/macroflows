import { createEffect, createRoot, createSignal, untrack } from 'solid-js'

import { createMacroProfileCacheStore } from '~/modules/diet/macro-profile/application/store/macroProfileCacheStore'
import { type MacroProfile } from '~/modules/diet/macro-profile/domain/macroProfile'
import {
  createDefaultMacroProfile,
  getLatestMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { createMacroProfileRealtimeService } from '~/modules/diet/macro-profile/infrastructure/supabase/realtime'
import { type User } from '~/modules/user/domain/user'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import { logging } from '~/shared/utils/logging'

export type MacroProfileCache = ReturnType<typeof createMacroProfileCacheStore>

export function createMacroProfileState(deps: {
  getCurrentUserIdOrGuestId: () => User['uuid']
  fetchUserMacroProfiles: (
    userId: User['uuid'],
  ) => Promise<readonly MacroProfile[]>
  cache?: MacroProfileCache
  createMacroProfileRealtimeService?: typeof createMacroProfileRealtimeService
}) {
  const localCache = deps.cache ?? createMacroProfileCacheStore()
  const localCreateMacroProfileRealtimeService =
    deps.createMacroProfileRealtimeService ?? createMacroProfileRealtimeService

  return createRoot(() => {
    const realtimeService = localCreateMacroProfileRealtimeService()
    const [selectedUserId, setSelectedUserId] = createSignal<
      User['uuid'] | null
    >(null)

    realtimeService.initializeMacroProfileRealtime({
      onInsert: (profile: MacroProfile) => {
        localCache.upsertToCache(profile)
      },
      onUpdate: (profile: MacroProfile) => {
        localCache.upsertToCache(profile)
      },
      onDelete: (profile: MacroProfile) => {
        localCache.removeFromCache({ by: 'id', value: profile.id })
      },
    })

    createEffect(() => {
      const userId = deps.getCurrentUserIdOrGuestId()
      logging.debug(`User changed to ${userId}`)

      const previousUserId = untrack(selectedUserId)
      if (previousUserId !== null && previousUserId !== userId) {
        logging.debug('Different user detected, clearing cache')
        localCache.clearCache()
      }

      setSelectedUserId(userId)
    })

    createEffect(() => {
      const userId = selectedUserId()
      if (userId === null) {
        return
      }

      logging.debug(`Fetching macro profiles for user ${userId}`)
      void deps
        .fetchUserMacroProfiles(userId)
        .then((profiles) => {
          localCache.upsertManyToCache(profiles)
        })
        .catch((error) => {
          logging.error('MacroProfile state fetch error:', error)
          localCache.removeFromCache({ by: 'user_id', value: userId })
        })
    })

    const userMacroProfiles = () => {
      const userId = selectedUserId() ?? GUEST_USER_ID
      return localCache.getProfilesByUserId(userId)
    }

    const latestMacroProfile = () => {
      const profiles = userMacroProfiles()
      const latest = getLatestMacroProfile(profiles)
      const userId = selectedUserId() ?? GUEST_USER_ID
      if (latest === null) {
        return createDefaultMacroProfile(userId)
      }
      return latest
    }

    const previousMacroProfile = () => {
      const profiles = userMacroProfiles()
      return getLatestMacroProfile(profiles, 1)
    }

    return {
      selectedUserId,
      setSelectedUserId,
      cache: localCache,
      userMacroProfiles,
      latestMacroProfile,
      previousMacroProfile,
    }
  })
}

export type MacroProfileState = ReturnType<typeof createMacroProfileState>
