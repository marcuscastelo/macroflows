import {
  type MacroProfile,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type MacroProfileRepository } from '~/modules/diet/macro-profile/domain/macroProfileRepository'
import { createMacroProfileRepository } from '~/modules/diet/macro-profile/infrastructure/macroProfileRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'

/**
 * Factory that returns macro profile CRUD service with injected dependencies.
 * Allows swapping repository implementations for tests or alternate runtimes.
 */
export function createMacroProfileCrudService(
  deps: {
    repository?: () => MacroProfileRepository
  } = {},
) {
  const repository = deps.repository?.() ?? createMacroProfileRepository()

  return {
    async fetchUserMacroProfiles(
      userId: User['uuid'],
    ): Promise<readonly MacroProfile[]> {
      return await repository.fetchUserMacroProfiles(userId)
    },

    async insertMacroProfile(
      newMacroProfile: NewMacroProfile,
    ): Promise<MacroProfile | null> {
      return await showPromise(
        repository.insertMacroProfile(newMacroProfile),
        {
          loading: 'Criando perfil de macro...',
          success: 'Perfil de macro criado com sucesso',
          error: 'Erro ao criar perfil de macro',
        },
        { context: 'user-action' },
      )
    },

    async updateMacroProfile(
      macroProfileId: MacroProfile['id'],
      newMacroProfile: NewMacroProfile,
    ): Promise<MacroProfile | null> {
      return await showPromise(
        repository.updateMacroProfile(macroProfileId, newMacroProfile),
        {
          loading: 'Atualizando perfil de macro...',
          success: 'Perfil de macro atualizado com sucesso',
          error: 'Erro ao atualizar perfil de macro',
        },
        { context: 'user-action' },
      )
    },

    async deleteMacroProfile(
      macroProfileId: MacroProfile['id'],
    ): Promise<void> {
      await showPromise(
        repository.deleteMacroProfile(macroProfileId),
        {
          loading: 'Deletando perfil de macro...',
          success: 'Perfil de macro deletado com sucesso',
          error: 'Erro ao deletar perfil de macro',
        },
        { context: 'user-action' },
      )
    },
  }
}

/**
 * Public type and backward-compatible default instance.
 * Keep `macroProfileCrudService` as an object for legacy consumers while
 * migrating callers to use explicit factories and the container.
 */
export type MacroProfileCrudService = ReturnType<
  typeof createMacroProfileCrudService
>

export const macroProfileCrudService = createMacroProfileCrudService()
