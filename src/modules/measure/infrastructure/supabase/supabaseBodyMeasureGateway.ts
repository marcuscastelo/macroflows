import {
  type BodyMeasure,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { type BodyMeasureGateway } from '~/modules/measure/domain/measureGateway'
import { supabaseBodyMeasureMapper } from '~/modules/measure/infrastructure/supabase/supabaseMeasureMapper'
import { type User } from '~/modules/user/domain/user'
import {
  createErrorHandler,
  wrapErrorWithStack,
} from '~/shared/error/errorHandler'
import { supabase } from '~/shared/supabase/supabase'

const TABLE = 'body_measures'

const errorHandler = createErrorHandler('infrastructure', 'Measure')

export function createSupabaseBodyMeasureGateway(): BodyMeasureGateway {
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

  return data.map(supabaseBodyMeasureMapper.toDomain)
}

async function insertBodyMeasure(
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  const createDAO = supabaseBodyMeasureMapper.toInsertDTO(newBodyMeasure)
  const { data, error } = await supabase
    .from(TABLE)
    .insert(createDAO)
    .select()
    .single()

  if (error !== null) {
    errorHandler.error(error)
    throw wrapErrorWithStack(error)
  }

  return supabaseBodyMeasureMapper.toDomain(data)
}

async function updateBodyMeasure(
  bodyMeasureId: BodyMeasure['id'],
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  const updateDAO = supabaseBodyMeasureMapper.toInsertDTO(newBodyMeasure)
  const { data, error } = await supabase
    .from(TABLE)
    .update(updateDAO)
    .eq('id', bodyMeasureId)
    .select()
    .single()

  if (error !== null) {
    errorHandler.error(error)
    throw wrapErrorWithStack(error)
  }

  return supabaseBodyMeasureMapper.toDomain(data)
}

async function deleteBodyMeasure(id: BodyMeasure['id']) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)

  if (error !== null) {
    errorHandler.error(error)
    throw wrapErrorWithStack(error)
  }
}
