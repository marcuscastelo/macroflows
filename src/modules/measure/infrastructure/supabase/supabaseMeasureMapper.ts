import {
  type BodyMeasure,
  bodyMeasureSchema,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

type InsertBodyMeasureDTO =
  Database['public']['Tables']['body_measures']['Insert']
type BodyMeasureDTO = Database['public']['Tables']['body_measures']['Row']

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

/**
 * Creates the mapper responsible for converting body measure data
 * between Supabase DTOs and domain entities.
 *
 * @returns Mapper functions for reading and writing body measure records.
 */
export function createSupabaseBodyMeasureMapper() {
  return {
    toDomain,
    toInsertDTO,
  }
}
