import {
  type MacroProfile,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { createMacroProfileRepository } from '~/modules/diet/macro-profile/infrastructure/macroProfileRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'

const macroProfileRepository = createMacroProfileRepository()

export const macroProfileCrudService = {
  async fetchUserMacroProfiles(
    userId: User['uuid'],
  ): Promise<readonly MacroProfile[]> {
    return await macroProfileRepository.fetchUserMacroProfiles(userId)
  },

  async insertMacroProfile(
    newMacroProfile: NewMacroProfile,
  ): Promise<MacroProfile | null> {
    return await showPromise(
      macroProfileRepository.insertMacroProfile(newMacroProfile),
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
      macroProfileRepository.updateMacroProfile(
        macroProfileId,
        newMacroProfile,
      ),
      {
        loading: 'Atualizando perfil de macro...',
        success: 'Perfil de macro atualizado com sucesso',
        error: 'Erro ao atualizar perfil de macro',
      },
      { context: 'user-action' },
    )
  },

  async deleteMacroProfile(macroProfileId: MacroProfile['id']): Promise<void> {
    await showPromise(
      macroProfileRepository.deleteMacroProfile(macroProfileId),
      {
        loading: 'Deletando perfil de macro...',
        success: 'Perfil de macro deletado com sucesso',
        error: 'Erro ao deletar perfil de macro',
      },
      { context: 'user-action' },
    )
  },
}
