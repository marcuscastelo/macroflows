import {
  type MacroProfile,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type MacroProfileRepository } from '~/modules/diet/macro-profile/domain/macroProfileRepository'
import { macroProfileCacheStore } from '~/modules/diet/macro-profile/infrastructure/signals/macroProfileCacheStore'
import { createSupabaseMacroProfileGateway } from '~/modules/diet/macro-profile/infrastructure/supabase/supabaseMacroProfileGateway'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'

const supabaseGateway = createSupabaseMacroProfileGateway()
const errorHandler = createErrorHandler('application', 'MacroProfile')

export function createMacroProfileRepository(): MacroProfileRepository {
  return {
    fetchUserMacroProfiles,
    insertMacroProfile,
    updateMacroProfile,
    deleteMacroProfile,
  }
}

export async function fetchUserMacroProfiles(
  userId: User['id'],
): Promise<readonly MacroProfile[]> {
  try {
    const profiles = await supabaseGateway.fetchUserMacroProfiles(userId)
    macroProfileCacheStore.upsertManyToCache(profiles)
    return profiles
  } catch (error) {
    errorHandler.error(error)
    macroProfileCacheStore.removeFromCache({ by: 'user_id', value: userId })
    return []
  }
}

export async function insertMacroProfile(
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  try {
    const profile = await supabaseGateway.insertMacroProfile(newMacroProfile)
    if (profile !== null) {
      macroProfileCacheStore.upsertToCache(profile)
    }
    return profile
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

export async function updateMacroProfile(
  macroProfileId: MacroProfile['id'],
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  try {
    const profile = await supabaseGateway.updateMacroProfile(
      macroProfileId,
      newMacroProfile,
    )
    if (profile !== null) {
      macroProfileCacheStore.upsertToCache(profile)
    }
    return profile
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

export async function deleteMacroProfile(
  id: MacroProfile['id'],
): Promise<void> {
  try {
    await supabaseGateway.deleteMacroProfile(id)
    macroProfileCacheStore.removeFromCache({ by: 'id', value: id })
  } catch (error) {
    errorHandler.error(error)
  }
}
