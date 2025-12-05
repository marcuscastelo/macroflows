import { useCases } from '~/di/useCases'
import {
  type MacroProfile,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type MacroProfileGateway } from '~/modules/diet/macro-profile/domain/macroProfileGateway'
import { type MacroProfileRepository } from '~/modules/diet/macro-profile/domain/macroProfileRepository'
import { createGuestMacroProfileGateway } from '~/modules/diet/macro-profile/infrastructure/guest/guestMacroProfileGateway'
import { createSupabaseMacroProfileGateway } from '~/modules/diet/macro-profile/infrastructure/supabase/supabaseMacroProfileGateway'
import { type User } from '~/modules/user/domain/user'

const supabaseGateway = createSupabaseMacroProfileGateway()
const guestGateway = createGuestMacroProfileGateway()

function getGateway(): MacroProfileGateway {
  const guestUseCases = useCases.guestUseCases()
  return guestUseCases.isGuestMode() ? guestGateway : supabaseGateway
}

export function createMacroProfileRepository(): MacroProfileRepository {
  return {
    fetchUserMacroProfiles,
    insertMacroProfile,
    updateMacroProfile,
    deleteMacroProfile,
  }
}

async function fetchUserMacroProfiles(
  userId: User['uuid'],
): Promise<readonly MacroProfile[]> {
  return await getGateway().fetchUserMacroProfiles(userId)
}

async function insertMacroProfile(
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  return await getGateway().insertMacroProfile(newMacroProfile)
}

async function updateMacroProfile(
  macroProfileId: MacroProfile['id'],
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  return await getGateway().updateMacroProfile(macroProfileId, newMacroProfile)
}

async function deleteMacroProfile(id: MacroProfile['id']): Promise<void> {
  await getGateway().deleteMacroProfile(id)
}
