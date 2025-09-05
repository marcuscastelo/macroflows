import { createResource } from 'solid-js'

import {
  type BodyMeasure,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { createSupabaseBodyMeasureRepository } from '~/modules/measure/infrastructure/measures'
import { showPromise } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'

const bodyMeasureRepository = createSupabaseBodyMeasureRepository()

export const [bodyMeasures, { refetch: refetchBodyMeasures }] = createResource(
  currentUserId,
  fetchUserBodyMeasures,
  { initialValue: [], ssrLoadFrom: 'initial' },
)

/**
 * Fetches all body measures for a user.
 * @param userId - The user ID.
 * @returns Array of body measures or empty array on error.
 */
const errorHandler = createErrorHandler('application', 'Measure')

export async function fetchUserBodyMeasures(
  userId: User['id'],
): Promise<readonly BodyMeasure[]> {
  try {
    return await bodyMeasureRepository.fetchUserBodyMeasures(userId)
  } catch (error) {
    errorHandler.error(error)
    return []
  }
}

/**
 * Inserts a new body measure.
 * @param newBodyMeasure - The new body measure data.
 * @returns The inserted body measure or null on error.
 */
export async function insertBodyMeasure(
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  try {
    return await showPromise(
      bodyMeasureRepository.insertBodyMeasure(newBodyMeasure),
      {
        loading: 'Inserindo medidas...',
        success: 'Medidas inseridas com sucesso',
        error: 'Falha ao inserir medidas',
      },
      { context: 'user-action' },
    )
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

/**
 * Updates a body measure by ID.
 * @param bodyMeasureId - The body measure ID.
 * @param newBodyMeasure - The new body measure data.
 * @returns The updated body measure or null on error.
 */
export async function updateBodyMeasure(
  bodyMeasureId: BodyMeasure['id'],
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  try {
    return await showPromise(
      bodyMeasureRepository.updateBodyMeasure(bodyMeasureId, newBodyMeasure),
      {
        loading: 'Atualizando medidas...',
        success: 'Medidas atualizadas com sucesso',
        error: 'Falha ao atualizar medidas',
      },
      { context: 'user-action' },
    )
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

/**
 * Deletes a body measure by ID.
 * @param bodyMeasureId - The body measure ID.
 * @returns True if deleted, false otherwise.
 */
export async function deleteBodyMeasure(
  bodyMeasureId: BodyMeasure['id'],
): Promise<boolean> {
  try {
    await showPromise(
      bodyMeasureRepository.deleteBodyMeasure(bodyMeasureId),
      {
        loading: 'Deletando medidas...',
        success: 'Medidas deletadas com sucesso',
        error: 'Falha ao deletar medidas',
      },
      { context: 'user-action' },
    )
    return true
  } catch (error) {
    errorHandler.error(error)
    return false
  }
}
