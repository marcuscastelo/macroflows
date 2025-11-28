import { macroProfileCrudService } from '~/modules/diet/macro-profile/application/service/macroProfileCrudService'
import {
  type MacroProfile,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type User } from '~/modules/user/domain/user'

export const macroProfileUseCases = {
  async fetchUserMacroProfiles(
    userId: User['uuid'],
  ): Promise<readonly MacroProfile[]> {
    return await macroProfileCrudService.fetchUserMacroProfiles(userId)
  },

  async insertMacroProfile(
    newMacroProfile: NewMacroProfile,
  ): Promise<MacroProfile | null> {
    return await macroProfileCrudService.insertMacroProfile(newMacroProfile)
  },

  async updateMacroProfile(
    macroProfileId: MacroProfile['id'],
    newMacroProfile: NewMacroProfile,
  ): Promise<MacroProfile | null> {
    return await macroProfileCrudService.updateMacroProfile(
      macroProfileId,
      newMacroProfile,
    )
  },

  async deleteMacroProfile(macroProfileId: MacroProfile['id']): Promise<void> {
    await macroProfileCrudService.deleteMacroProfile(macroProfileId)
  },
}
