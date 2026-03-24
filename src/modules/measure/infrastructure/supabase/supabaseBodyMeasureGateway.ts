import {
  type BodyMeasure,
  bodyMeasureSchema,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { type BodyMeasureGateway } from '~/modules/measure/domain/measureGateway'
import { type User } from '~/modules/user/domain/user'
import { type Database } from '~/shared/supabase/database.types'
import { supabase } from '~/shared/supabase/supabase'
import { wrapErrorWithStack } from '~/shared/utils/errorUtils'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const SUPABASE_TABLE_BODY_MEASURES = 'body_measures'

type InsertBodyMeasureDTO =
  Database['public']['Tables']['body_measures']['Insert']
type BodyMeasureDTO = Database['public']['Tables']['body_measures']['Row']

function toInsertDTO(newBodyMeasure: NewBodyMeasure): InsertBodyMeasureDTO {
  return {
    height: newBodyMeasure.height,
    waist: newBodyMeasure.waist,
    hip: newBodyMeasure.hip,
    neck: newBodyMeasure.neck,
    user_id: newBodyMeasure.user_id,
    target_timestamp: newBodyMeasure.target_timestamp.toISOString(),
  }
}

function toDomain(dto: BodyMeasureDTO): BodyMeasure {
  return parseWithStack(bodyMeasureSchema, {
    id: dto.id,
    height: dto.height,
    waist: dto.waist,
    hip: dto.hip === null ? undefined : dto.hip,
    neck: dto.neck,
    user_id: dto.user_id,
    target_timestamp: new Date(dto.target_timestamp),
  })
}

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

  return data.map(toDomain)
}

async function insertBodyMeasure(
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  const createDTO = toInsertDTO(newBodyMeasure)
  const { data, error } = await supabase
    .from(SUPABASE_TABLE_BODY_MEASURES)
    .insert(createDTO)
    .select()
    .single()

  if (error !== null) {
    logging.error('Measure operation error:', error)
    throw wrapErrorWithStack(error)
  }

  return toDomain(data)
}

async function updateBodyMeasure(
  bodyMeasureId: BodyMeasure['id'],
  newBodyMeasure: NewBodyMeasure,
): Promise<BodyMeasure | null> {
  const updateDTO = toInsertDTO(newBodyMeasure)
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

  return toDomain(data)
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
