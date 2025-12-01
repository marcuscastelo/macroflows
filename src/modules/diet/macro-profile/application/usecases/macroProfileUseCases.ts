import { macroProfileCrudService } from '~/modules/diet/macro-profile/application/service/macroProfileCrudService'
import { cache } from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import {
  type MacroProfile,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

export const macroProfileUseCases = {
  async fetchUserMacroProfiles(
    userId: User['uuid'],
  ): Promise<readonly MacroProfile[]> {
    try {
      const profiles =
        await macroProfileCrudService.fetchUserMacroProfiles(userId)
      cache.upsertManyToCache(profiles)
      return profiles
    } catch (error) {
      logging.error('MacroProfile fetch error:', error)
      cache.removeFromCache({ by: 'user_id', value: userId })
      return []
    }
  },

  async insertMacroProfile(
    newMacroProfile: NewMacroProfile,
  ): Promise<MacroProfile | null> {
    try {
      const profile =
        await macroProfileCrudService.insertMacroProfile(newMacroProfile)
      if (profile !== null) {
        cache.upsertToCache(profile)
      }
      return profile
    } catch (error) {
      logging.error('MacroProfile insert error:', error)
      return null
    }
  },

  async updateMacroProfile(
    macroProfileId: MacroProfile['id'],
    newMacroProfile: NewMacroProfile,
  ): Promise<MacroProfile | null> {
    try {
      const profile = await macroProfileCrudService.updateMacroProfile(
        macroProfileId,
        newMacroProfile,
      )
      if (profile !== null) {
        cache.upsertToCache(profile)
      }
      return profile
    } catch (error) {
      logging.error('MacroProfile update error:', error)
      return null
    }
  },

  async deleteMacroProfile(macroProfileId: MacroProfile['id']): Promise<void> {
    try {
      await macroProfileCrudService.deleteMacroProfile(macroProfileId)
      cache.removeFromCache({ by: 'id', value: macroProfileId })
    } catch (error) {
      logging.error('MacroProfile delete error:', error)
    }
  },
}
