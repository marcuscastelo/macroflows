import {
  createDefaultMacroProfile,
  getLatestMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { macroProfileCacheStore } from '~/modules/diet/macro-profile/infrastructure/signals/macroProfileCacheStore'
import { initializeMacroProfileEffects } from '~/modules/diet/macro-profile/infrastructure/signals/macroProfileEffects'
import { macroProfileStateStore } from '~/modules/diet/macro-profile/infrastructure/signals/macroProfileStateStore'
import { initializeMacroProfileRealtime } from '~/modules/diet/macro-profile/infrastructure/supabase/realtime'
import { currentUserId } from '~/modules/user/application/user'
import { logging } from '~/shared/utils/logging'

export const selectedUserId = macroProfileStateStore.selectedUserId
export const setSelectedUserId = macroProfileStateStore.setSelectedUserId

export const userMacroProfiles = () => {
  const userId = currentUserId()
  if (userId === undefined) {
    logging.error('User ID is undefined')
    return []
  }
  return macroProfileCacheStore.getProfilesByUserId(userId)
}

export const latestMacroProfile = () => {
  const profiles = userMacroProfiles()
  const latest = getLatestMacroProfile(profiles)
  if (latest === null) {
    const userId = currentUserId()
    if (userId === undefined) {
      logging.error('User ID is undefined')
      return null
    }
    return createDefaultMacroProfile(userId)
  }
  return latest
}

export const previousMacroProfile = () => {
  const profiles = userMacroProfiles()
  return getLatestMacroProfile(profiles, 1)
}

initializeMacroProfileEffects()
initializeMacroProfileRealtime()
