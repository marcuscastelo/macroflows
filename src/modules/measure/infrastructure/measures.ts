import {
  type BodyMeasure,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { type BodyMeasureRepository } from '~/modules/measure/domain/measureRepository'
import {
  bodyMeasureDAOSchema,
  createBodyMeasureFromDAO,
  createInsertBodyMeasureDAOFromNewBodyMeasure,
  createUpdateBodyMeasureDAOFromNewBodyMeasure,
} from '~/modules/measure/infrastructure/measureDAO'
import { type User } from '~/modules/user/domain/user'
import {
  createErrorHandler,
  wrapErrorWithStack,
} from '~/shared/error/errorHandler'
import { parseWithStack } from '~/shared/utils/parseWithStack'
import { supabase } from '~/shared/utils/supabase'

const TABLE = 'body_measures'

const errorHandler = createErrorHandler('infrastructure', 'Measure')

export function createSupabaseBodyMeasureRepository(): BodyMeasureRepository {
  return {
    fetchUserBodyMeasures,
    insertBodyMeasure,
    updateBodyMeasure,
    deleteBodyMeasure,
  }
}

async function fetchUserBodyMeasures(userId: User['id']) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('owner', userId)
    .order('target_timestamp', { ascending: true })

  if (error !== null) {
    errorHandler.error(error)
    throw wrapErrorWithStack(error)
  }

  const bodyMeasureDAOs = parseWithStack(bodyMeasureDAOSchema.array(), data)
  return bodyMeasureDAOs.map(createBodyMeasureFromDAO)
}

async function insertBodyMeasure(
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  const createDAO = createInsertBodyMeasureDAOFromNewBodyMeasure(newBodyMeasure)
  const { data, error } = await supabase.from(TABLE).insert(createDAO).select()

  if (error !== null) {
    errorHandler.error(error)
    throw wrapErrorWithStack(error)
  }

  const bodyMeasureDAOs = parseWithStack(bodyMeasureDAOSchema.array(), data)
  const bodyMeasures = bodyMeasureDAOs.map(createBodyMeasureFromDAO)

  return bodyMeasures[0] ?? null
}

async function updateBodyMeasure(
  bodyMeasureId: BodyMeasure['id'],
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  const updateDAO = createUpdateBodyMeasureDAOFromNewBodyMeasure(newBodyMeasure)
  const { data, error } = await supabase
    .from(TABLE)
    .update(updateDAO)
    .eq('id', bodyMeasureId)
    .select()

  if (error !== null) {
    errorHandler.error(error)
    throw wrapErrorWithStack(error)
  }

  const bodyMeasureDAOs = parseWithStack(bodyMeasureDAOSchema.array(), data)
  const bodyMeasures = bodyMeasureDAOs.map(createBodyMeasureFromDAO)

  return bodyMeasures[0] ?? null
}

async function deleteBodyMeasure(id: BodyMeasure['id']) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)

  if (error !== null) {
    errorHandler.error(error)
    throw wrapErrorWithStack(error)
  }
}
