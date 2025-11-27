import {
  type MacroProfile,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type MacroProfileGateway } from '~/modules/diet/macro-profile/domain/macroProfileGateway'
import { type MacroProfileRepository } from '~/modules/diet/macro-profile/domain/macroProfileRepository'
import { createGuestMacroProfileGateway } from '~/modules/diet/macro-profile/infrastructure/guest/guestMacroProfileGateway'
import { macroProfileCacheStore } from '~/modules/diet/macro-profile/infrastructure/signals/macroProfileCacheStore'
import { createSupabaseMacroProfileGateway } from '~/modules/diet/macro-profile/infrastructure/supabase/supabaseMacroProfileGateway'
import { type User } from '~/modules/user/domain/user'
import { isInGuestMode } from '~/shared/guest/guestState'
import { logging } from '~/shared/utils/logging'

const supabaseGateway = createSupabaseMacroProfileGateway()
const guestGateway = createGuestMacroProfileGateway()

/**
 * Returns the appropriate gateway based on guest mode state
 */
function getGateway(): MacroProfileGateway {
  return isInGuestMode() ? guestGateway : supabaseGateway
}

export function createMacroProfileRepository(): MacroProfileRepository {
  return {
    fetchUserMacroProfiles,
    insertMacroProfile,
    updateMacroProfile,
    deleteMacroProfile,
  }
}

export async function fetchUserMacroProfiles(
  userId: User['uuid'],
): Promise<readonly MacroProfile[]> {
  try {
    const profiles = await getGateway().fetchUserMacroProfiles(userId)
    macroProfileCacheStore.upsertManyToCache(profiles)
    return profiles
  } catch (error) {
    logging.error('MacroProfile fetch error:', error)
    macroProfileCacheStore.removeFromCache({ by: 'user_id', value: userId })
    return []
  }
}

export async function insertMacroProfile(
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  try {
    const profile = await getGateway().insertMacroProfile(newMacroProfile)
    if (profile !== null) {
      macroProfileCacheStore.upsertToCache(profile)
    }
    return profile
  } catch (error) {
    logging.error('MacroProfile fetch error:', error)
    return null
  }
}

export async function updateMacroProfile(
  macroProfileId: MacroProfile['id'],
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  try {
    const profile = await getGateway().updateMacroProfile(
      macroProfileId,
      newMacroProfile,
    )
    if (profile !== null) {
      macroProfileCacheStore.upsertToCache(profile)
    }
    return profile
  } catch (error) {
    logging.error('MacroProfile fetch error:', error)
    return null
  }
}

export async function deleteMacroProfile(
  id: MacroProfile['id'],
): Promise<void> {
  try {
    await getGateway().deleteMacroProfile(id)
    macroProfileCacheStore.removeFromCache({ by: 'id', value: id })
  } catch (error) {
    logging.error('MacroProfile fetch error:', error)
  }
}
