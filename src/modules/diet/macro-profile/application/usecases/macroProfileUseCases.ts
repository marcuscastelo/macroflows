import {
  createMacroProfileCrudService,
  type MacroProfileCrudService,
} from '~/modules/diet/macro-profile/application/service/macroProfileCrudService'
import { cache } from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import {
  type MacroProfile,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

/**
 * Factory that returns macro-profile use-cases with injected dependencies.
 * @param deps.crudService - provider for the macro profile CRUD service
 * @param deps.cache - cache object used to keep local profiles in sync
 */
export function createMacroProfileUseCases(deps?: {
  crudService?: () => MacroProfileCrudService
  cache?: typeof cache
}) {
  const svc = deps?.crudService?.() ?? createMacroProfileCrudService()
  const localCache = () => deps?.cache ?? cache

  return {
    async fetchUserMacroProfiles(
      userId: User['uuid'],
    ): Promise<readonly MacroProfile[]> {
      try {
        const profiles = await svc.fetchUserMacroProfiles(userId)
        localCache().upsertManyToCache(profiles)
        return profiles
      } catch (error) {
        logging.error('MacroProfile fetch error:', error)
        localCache().removeFromCache({ by: 'user_id', value: userId })
        return []
      }
    },

    async insertMacroProfile(
      newMacroProfile: NewMacroProfile,
    ): Promise<MacroProfile | null> {
      try {
        const profile = await svc.insertMacroProfile(newMacroProfile)
        if (profile !== null) {
          localCache().upsertToCache(profile)
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
        const profile = await svc.updateMacroProfile(
          macroProfileId,
          newMacroProfile,
        )
        if (profile !== null) {
          localCache().upsertToCache(profile)
        }
        return profile
      } catch (error) {
        logging.error('MacroProfile update error:', error)
        return null
      }
    },

    async deleteMacroProfile(
      macroProfileId: MacroProfile['id'],
    ): Promise<void> {
      try {
        await svc.deleteMacroProfile(macroProfileId)
        localCache().removeFromCache({ by: 'id', value: macroProfileId })
      } catch (error) {
        logging.error('MacroProfile delete error:', error)
      }
    },
  }
}

/**
 * Backward-compatible default instance (shim) used by legacy consumers.
 * Keeps existing imports working while migrating to the container.
 * TODO: Remove DI shims and use proper container/use-case injection.
 */
export const macroProfileUseCases = createMacroProfileUseCases()

export type MacroProfileUseCases = ReturnType<typeof createMacroProfileUseCases>
