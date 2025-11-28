import { macroProfileCacheStore } from '~/modules/diet/macro-profile/application/store/macroProfileCacheStore'
import { macroProfileStateStore } from '~/modules/diet/macro-profile/application/store/macroProfileStateStore'
import { initializeMacroProfileEffects } from '~/modules/diet/macro-profile/application/usecases/macroProfileEffects'
import {
  createDefaultMacroProfile,
  getLatestMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { initializeMacroProfileRealtime } from '~/modules/diet/macro-profile/infrastructure/supabase/realtime'
import { currentUserId } from '~/modules/user/application/user'

export const selectedUserId = macroProfileStateStore.selectedUserId
export const setSelectedUserId = macroProfileStateStore.setSelectedUserId

export const userMacroProfiles = () => {
  const userId = currentUserId()
  return macroProfileCacheStore.getProfilesByUserId(userId)
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

initializeMacroProfileEffects()
initializeMacroProfileRealtime()
