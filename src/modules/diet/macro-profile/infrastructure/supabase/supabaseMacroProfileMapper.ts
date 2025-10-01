import {
  type MacroProfile,
  macroProfileSchema,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export type InsertMacroProfileDTO =
  Database['public']['Tables']['macro_profiles']['Insert']
export type MacroProfileDTO =
  Database['public']['Tables']['macro_profiles']['Row']

// Conversion functions
function toInsertDTO(newMacroProfile: NewMacroProfile): InsertMacroProfileDTO {
  return {
    user_id: newMacroProfile.user_id,
    target_day: newMacroProfile.target_day.toISOString(),
    gramsPerKgCarbs: newMacroProfile.gramsPerKgCarbs,
    gramsPerKgProtein: newMacroProfile.gramsPerKgProtein,
    gramsPerKgFat: newMacroProfile.gramsPerKgFat,
  }
}

function toDomain(dto: MacroProfileDTO): MacroProfile {
  return parseWithStack(macroProfileSchema, {
    id: dto.id,
    user_id: dto.user_id,
    target_day: new Date(dto.target_day ?? ''),
    gramsPerKgCarbs: dto.gramsPerKgCarbs,
    gramsPerKgProtein: dto.gramsPerKgProtein,
    gramsPerKgFat: dto.gramsPerKgFat,
  })
}

export const supabaseMacroProfileMapper = {
  toInsertDTO,
  toDomain,
}
