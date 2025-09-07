import {
  type BodyMeasure,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import {
  createMeasureRepository,
  deleteBodyMeasure as deleteBodyMeasureRepo,
  insertBodyMeasure as insertBodyMeasureRepo,
  updateBodyMeasure as updateBodyMeasureRepo,
} from '~/modules/measure/infrastructure/measureRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'

const measureRepository = createMeasureRepository()
const errorHandler = createErrorHandler('application', 'Measure')

/**
 * Fetches all body measures for a user.
 * @param userId - The user ID.
 * @returns Array of body measures or empty array on error.
 */
export async function fetchUserBodyMeasures(
  userId: User['id'],
): Promise<readonly BodyMeasure[]> {
  try {
    return await measureRepository.fetchUserBodyMeasures(userId)
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
    const result = await showPromise(
      insertBodyMeasureRepo(newBodyMeasure),
      {
        loading: 'Inserindo medidas...',
        success: 'Medidas inseridas com sucesso',
        error: 'Falha ao inserir medidas',
      },
      { context: 'user-action' },
    )

    return result
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
    const result = await showPromise(
      updateBodyMeasureRepo(bodyMeasureId, newBodyMeasure),
      {
        loading: 'Atualizando medidas...',
        success: 'Medidas atualizadas com sucesso',
        error: 'Falha ao atualizar medidas',
      },
      { context: 'user-action' },
    )

    return result
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
      deleteBodyMeasureRepo(bodyMeasureId),
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
