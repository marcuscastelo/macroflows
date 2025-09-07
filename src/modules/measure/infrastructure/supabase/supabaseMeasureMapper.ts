import {
  type BodyMeasure,
  bodyMeasureSchema,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type InsertBodyMeasureDTO =
  Database['public']['Tables']['body_measures']['Insert']
export type BodyMeasureDTO =
  Database['public']['Tables']['body_measures']['Row']

// Conversion functions
function toInsertDTO(newBodyMeasure: NewBodyMeasure): InsertBodyMeasureDTO {
  return {
    height: newBodyMeasure.height,
    waist: newBodyMeasure.waist,
    hip: newBodyMeasure.hip,
    neck: newBodyMeasure.neck,
    owner: newBodyMeasure.owner,
    target_timestamp: newBodyMeasure.target_timestamp.toISOString(),
  }
}

function toDomain(dao: BodyMeasureDTO): BodyMeasure {
  return parseWithStack(bodyMeasureSchema, {
    id: dao.id,
    height: dao.height,
    waist: dao.waist,
    hip: dao.hip === null ? undefined : dao.hip,
    neck: dao.neck,
    owner: dao.owner,
    target_timestamp: new Date(dao.target_timestamp),
  })
}

export const supabaseBodyMeasureMapper = {
  toDomain,
  toInsertDTO,
}
