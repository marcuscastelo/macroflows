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

export const supabaseBodyMeasureMapper = {
  toDomain,
  toInsertDTO,
}
