import {
  type BodyMeasure,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { type BodyMeasureRepository } from '~/modules/measure/domain/measureRepository'
import { createSupabaseBodyMeasureGateway } from '~/modules/measure/infrastructure/supabase/supabaseBodyMeasureGateway'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

const supabaseGateway = createSupabaseBodyMeasureGateway()

/**
 * Creates the measure repository backed by the Supabase gateway.
 *
 * @returns Repository implementation for measure CRUD operations.
 */
export function createMeasureRepository(): BodyMeasureRepository {
  return {
    fetchUserBodyMeasures,
    insertBodyMeasure,
    updateBodyMeasure,
    deleteBodyMeasure,
  }
}

async function fetchUserBodyMeasures(
  userId: User['uuid'],
): Promise<readonly BodyMeasure[]> {
  try {
    return await supabaseGateway.fetchUserBodyMeasures(userId)
  } catch (error) {
    logging.error('Measure operation error:', error)
    return []
  }
}

async function insertBodyMeasure(
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  try {
    return await supabaseGateway.insertBodyMeasure(newBodyMeasure)
  } catch (error) {
    logging.error('Measure operation error:', error)
    return null
  }
}

async function updateBodyMeasure(
  bodyMeasureId: BodyMeasure['id'],
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  try {
    return await supabaseGateway.updateBodyMeasure(
      bodyMeasureId,
      newBodyMeasure,
    )
  } catch (error) {
    logging.error('Measure operation error:', error)
    return null
  }
}

async function deleteBodyMeasure(
  bodyMeasureId: BodyMeasure['id'],
): Promise<void> {
  try {
    await supabaseGateway.deleteBodyMeasure(bodyMeasureId)
  } catch (error) {
    logging.error('Measure operation error:', error)
  }
}
