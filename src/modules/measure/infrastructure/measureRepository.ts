import {
  type BodyMeasure,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { type BodyMeasureRepository } from '~/modules/measure/domain/measureRepository'
import { createSupabaseBodyMeasureGateway } from '~/modules/measure/infrastructure/supabase/supabaseBodyMeasureGateway'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'

const supabaseGateway = createSupabaseBodyMeasureGateway()
const errorHandler = createErrorHandler('application', 'Measure')

export function createMeasureRepository(): BodyMeasureRepository {
  return {
    fetchUserBodyMeasures,
    insertBodyMeasure,
    updateBodyMeasure,
    deleteBodyMeasure,
  }
}

export async function fetchUserBodyMeasures(
  userId: User['id'],
): Promise<readonly BodyMeasure[]> {
  try {
    return await supabaseGateway.fetchUserBodyMeasures(userId)
  } catch (error) {
    errorHandler.error(error)
    return []
  }
}

export async function insertBodyMeasure(
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  try {
    return await supabaseGateway.insertBodyMeasure(newBodyMeasure)
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

export async function updateBodyMeasure(
  bodyMeasureId: BodyMeasure['id'],
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  try {
    return await supabaseGateway.updateBodyMeasure(
      bodyMeasureId,
      newBodyMeasure,
    )
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

export async function deleteBodyMeasure(
  bodyMeasureId: BodyMeasure['id'],
): Promise<void> {
  try {
    await supabaseGateway.deleteBodyMeasure(bodyMeasureId)
  } catch (error) {
    errorHandler.error(error)
  }
}
