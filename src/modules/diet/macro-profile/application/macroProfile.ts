import { createResource } from 'solid-js'

import {
  type MacroProfile,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import {
  createSupabaseMacroProfileRepository,
  setupMacroProfileRealtimeSubscription,
} from '~/modules/diet/macro-profile/infrastructure/supabaseMacroProfileRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { getLatestMacroProfile } from '~/shared/utils/macroProfileUtils'

const macroProfileRepository = createSupabaseMacroProfileRepository()

export const [userMacroProfiles, { refetch: refetchUserMacroProfiles }] =
  createResource(currentUserId, fetchUserMacroProfiles, {
    initialValue: [],
    ssrLoadFrom: 'initial',
  })

export const latestMacroProfile = () =>
  getLatestMacroProfile(userMacroProfiles.latest)

export const previousMacroProfile = () =>
  getLatestMacroProfile(userMacroProfiles.latest, 1)

setupMacroProfileRealtimeSubscription(() => {
  void refetchUserMacroProfiles()
})

/**
 * Fetches all macro profiles for a user.
 * @param userId - The user ID.
 * @returns Array of macro profiles or empty array on error.
 */
async function fetchUserMacroProfiles(
  userId: number,
): Promise<readonly MacroProfile[]> {
  try {
    return await showPromise(
      macroProfileRepository.fetchUserMacroProfiles(userId),
      {
        loading: 'Carregando perfis de macro...',
        success: 'Perfis de macro carregados com sucesso',
        error: 'Falha ao carregar perfis de macro',
      },
      {
        context: 'background',
      },
    )
  } catch (error) {
    errorHandler.error(error)
    return []
  }
}

/**
 * Inserts a new macro profile.
 * @param newMacroProfile - The new macro profile data.
 * @returns The inserted macro profile or null on error.
 */
const errorHandler = createErrorHandler('application', 'MacroProfile')

export async function insertMacroProfile(
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  try {
    const macroProfile = await showPromise(
      macroProfileRepository.insertMacroProfile(newMacroProfile),
      {
        loading: 'Criando perfil de macro...',
        success: 'Perfil de macro criado com sucesso',
        error: 'Falha ao criar perfil de macro',
      },
      { context: 'user-action' },
    )
    const userProfiles = userMacroProfiles()
    const hasResult = macroProfile !== null
    const hasNoProfiles = userProfiles.length === 0
    const firstProfile = userProfiles[0]
    const isSameOwner =
      !hasNoProfiles &&
      macroProfile !== null &&
      firstProfile !== undefined &&
      macroProfile.owner === firstProfile.owner
    if (hasResult && (hasNoProfiles || isSameOwner)) {
      await fetchUserMacroProfiles(macroProfile.owner)
    }
    return macroProfile
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

/**
 * Updates a macro profile by ID.
 * @param macroProfileId - The macro profile ID.
 * @param newMacroProfile - The new macro profile data.
 * @returns The updated macro profile or null on error.
 */
export async function updateMacroProfile(
  macroProfileId: MacroProfile['id'],
  newMacroProfile: NewMacroProfile,
): Promise<MacroProfile | null> {
  try {
    const macroProfile = await showPromise(
      macroProfileRepository.updateMacroProfile(
        macroProfileId,
        newMacroProfile,
      ),
      {
        loading: 'Atualizando perfil de macro...',
        success: 'Perfil de macro atualizado com sucesso',
        error: 'Falha ao atualizar perfil de macro',
      },
      { context: 'user-action' },
    )
    const firstUserMacroProfile = userMacroProfiles()[0]
    const hasResult = macroProfile !== null
    const hasFirstProfile = firstUserMacroProfile !== undefined
    const isSameOwner =
      hasResult &&
      hasFirstProfile &&
      macroProfile.owner === firstUserMacroProfile.owner
    if (isSameOwner) {
      await fetchUserMacroProfiles(macroProfile.owner)
    }
    return macroProfile
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

/**
 * Deletes a macro profile by ID.
 * @param macroProfileId - The macro profile ID.
 * @returns True if deleted, false otherwise.
 */
export async function deleteMacroProfile(
  macroProfileId: number,
): Promise<boolean> {
  try {
    await showPromise(
      macroProfileRepository.deleteMacroProfile(macroProfileId),
      {
        loading: 'Deletando perfil de macro...',
        success: 'Perfil de macro deletado com sucesso',
        error: 'Falha ao deletar perfil de macro',
      },
      { context: 'user-action' },
    )
    const [first] = userMacroProfiles()
    if (first) {
      await fetchUserMacroProfiles(first.owner)
    }
    return true
  } catch (error) {
    errorHandler.error(error)
    return false
  }
}
