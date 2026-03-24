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

export function createMacroProfileRepository(deps?: {
  isGuestMode?: () => boolean
  guestMacroProfileGateway?: MacroProfileGateway
  supabaseMacroProfileGateway?: MacroProfileGateway
}): MacroProfileRepository {
  const isGuestMode = deps?.isGuestMode ?? (() => false)
  const localGuestGateway = deps?.guestMacroProfileGateway ?? guestGateway
  const localSupabaseGateway =
    deps?.supabaseMacroProfileGateway ?? supabaseGateway

  function getGateway(): MacroProfileGateway {
    return isGuestMode() ? localGuestGateway : localSupabaseGateway
  }

  return {
    fetchUserMacroProfiles: async (userId: User['uuid']) =>
      await getGateway().fetchUserMacroProfiles(userId),
    insertMacroProfile: async (newMacroProfile: NewMacroProfile) =>
      await getGateway().insertMacroProfile(newMacroProfile),
    updateMacroProfile: async (
      macroProfileId: MacroProfile['id'],
      newMacroProfile: NewMacroProfile,
    ) => await getGateway().updateMacroProfile(macroProfileId, newMacroProfile),
    deleteMacroProfile: async (id: MacroProfile['id']) => {
      await getGateway().deleteMacroProfile(id)
    },
  }
}
