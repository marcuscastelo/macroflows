import {
  type BodyMeasure,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { type BodyMeasureGateway } from '~/modules/measure/domain/measureGateway'
import { SUPABASE_TABLE_BODY_MEASURES } from '~/modules/measure/infrastructure/supabase/constants'
import { supabaseBodyMeasureMapper } from '~/modules/measure/infrastructure/supabase/supabaseMeasureMapper'
import { type User } from '~/modules/user/domain/user'
import { supabase } from '~/shared/supabase/supabase'
import { wrapErrorWithStack } from '~/shared/utils/errorUtils'
import { logging } from '~/shared/utils/logging'

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
  const createDAO = supabaseBodyMeasureMapper.toInsertDTO(newBodyMeasure)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_BODY_MEASURES)
    .insert(createDAO)
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
  const updateDAO = supabaseBodyMeasureMapper.toInsertDTO(newBodyMeasure)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_BODY_MEASURES)
    .update(updateDAO)
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
