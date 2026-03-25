import {
  type BodyMeasure,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { type BodyMeasureRepository } from '~/modules/measure/domain/measureRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

/**
 * Factory that creates measure CRUD use-cases.
 *
 * Allows injecting a repository and `showPromise` helper for DI and testing.
 */
export function createMeasureCrud(deps: {
  measureRepository: BodyMeasureRepository
  showPromise?: typeof showPromise
}) {
  const measureRepository = deps.measureRepository
  const _showPromise = deps.showPromise ?? showPromise

  /**
   * Fetches all body measures for a user.
   * @param userId - The user ID.
   * @returns Array of body measures or empty array on error.
   */
  async function fetchUserBodyMeasures(
    userId: User['uuid'],
  ): Promise<readonly BodyMeasure[]> {
    try {
      return await measureRepository.fetchUserBodyMeasures(userId)
    } catch (error) {
      logging.error('Measure application error:', error)
      return []
    }
  }

  /**
   * Inserts a new body measure.
   * @param newBodyMeasure - The new body measure data.
   * @returns The inserted body measure or null on error.
   */
  async function insertBodyMeasure(
    newBodyMeasure: NewBodyMeasure,
  ): Promise<BodyMeasure | null> {
    try {
      const result = await _showPromise<BodyMeasure | null>(
        measureRepository.insertBodyMeasure(newBodyMeasure),
        {
          loading: 'Inserindo medidas...',
          success: 'Medidas inseridas com sucesso',
          error: 'Falha ao inserir medidas',
        },
        { context: 'user-action' },
      )

      return result
    } catch (error) {
      logging.error('Measure application error:', error)
      return null
    }
  }

  /**
   * Updates a body measure by ID.
   * @param bodyMeasureId - The body measure ID.
   * @param newBodyMeasure - The new body measure data.
   * @returns The updated body measure or null on error.
   */
  async function updateBodyMeasure(
    bodyMeasureId: BodyMeasure['id'],
    newBodyMeasure: NewBodyMeasure,
  ): Promise<BodyMeasure | null> {
    try {
      const result = await _showPromise<BodyMeasure | null>(
        measureRepository.updateBodyMeasure(bodyMeasureId, newBodyMeasure),
        {
          loading: 'Atualizando medidas...',
          success: 'Medidas atualizadas com sucesso',
          error: 'Falha ao atualizar medidas',
        },
        { context: 'user-action' },
      )

      return result
    } catch (error) {
      logging.error('Measure application error:', error)
      return null
    }
  }

  /**
   * Deletes a body measure by ID.
   * @param bodyMeasureId - The body measure ID.
   * @returns True if deleted, false otherwise.
   */
  async function deleteBodyMeasure(
    bodyMeasureId: BodyMeasure['id'],
  ): Promise<boolean> {
    try {
      await _showPromise<void>(
        measureRepository.deleteBodyMeasure(bodyMeasureId),
        {
          loading: 'Deletando medidas...',
          success: 'Medidas deletadas com sucesso',
          error: 'Falha ao deletar medidas',
        },
        { context: 'user-action' },
      )

      return true
    } catch (error) {
      logging.error('Measure application error:', error)
      return false
    }
  }

  return {
    fetchUserBodyMeasures,
    insertBodyMeasure,
    updateBodyMeasure,
    deleteBodyMeasure,
  }
}
export type MeasureCrud = ReturnType<typeof createMeasureCrud>
