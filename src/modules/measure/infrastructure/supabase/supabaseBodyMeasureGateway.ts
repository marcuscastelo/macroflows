import {
  type BodyMeasure,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { type BodyMeasureGateway } from '~/modules/measure/domain/measureGateway'
import { createSupabaseBodyMeasureMapper } from '~/modules/measure/infrastructure/supabase/supabaseMeasureMapper'
import { type User } from '~/modules/user/domain/user'
import { supabase } from '~/shared/supabase/supabase'
import { wrapErrorWithStack } from '~/shared/utils/errorUtils'
import { logging } from '~/shared/utils/logging'

const SUPABASE_TABLE_BODY_MEASURES = 'body_measures'
const supabaseBodyMeasureMapper = createSupabaseBodyMeasureMapper()

/**
 * Creates the Supabase gateway used to persist body measures.
 *
 * @returns Gateway implementation for body measure persistence operations.
 */
export function createSupabaseBodyMeasureGateway(): BodyMeasureGateway {
  return {
    fetchUserBodyMeasures,
    insertBodyMeasure,
    updateBodyMeasure,
    deleteBodyMeasure,
  }
}

async function fetchUserBodyMeasures(userId: User['uuid']) {
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_BODY_MEASURES)
    .select('*')
    .eq('user_id', userId)
    .order('target_timestamp', { ascending: true })

  if (error !== null) {
    logging.error('Measure operation error:', error)
    throw wrapErrorWithStack(error)
  }

  return data.map(supabaseBodyMeasureMapper.toDomain)
}

async function insertBodyMeasure(
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  const createDTO = supabaseBodyMeasureMapper.toInsertDTO(newBodyMeasure)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_BODY_MEASURES)
    .insert(createDTO)
    .select()
    .single()

  if (error !== null) {
    logging.error('Measure operation error:', error)
    throw wrapErrorWithStack(error)
  }

  return supabaseBodyMeasureMapper.toDomain(data)
}

async function updateBodyMeasure(
  bodyMeasureId: BodyMeasure['id'],
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  const updateDTO = supabaseBodyMeasureMapper.toInsertDTO(newBodyMeasure)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_BODY_MEASURES)
    .update(updateDTO)
    .eq('id', bodyMeasureId)
    .select()
    .single()

  if (error !== null) {
    logging.error('Measure operation error:', error)
    throw wrapErrorWithStack(error)
  }

  return supabaseBodyMeasureMapper.toDomain(data)
}

async function deleteBodyMeasure(id: BodyMeasure['id']) {
  const { error } = await supabase
    .from(SUPABASE_TABLE_BODY_MEASURES)
    .delete()
    .eq('id', id)

  if (error !== null) {
    logging.error('Measure operation error:', error)
    throw wrapErrorWithStack(error)
  }
}
