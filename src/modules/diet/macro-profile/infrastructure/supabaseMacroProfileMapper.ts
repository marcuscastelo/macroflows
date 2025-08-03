import { z } from 'zod/v4'

import {
  type MacroProfile,
  macroProfileSchema,
  type NewMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

// DAO schemas for database operations
export const createMacroProfileDAOSchema = z.object({
  owner: z.number(),
  target_day: z.date().or(z.string()),
  gramsPerKgCarbs: z.number(),
  gramsPerKgProtein: z.number(),
  gramsPerKgFat: z.number(),
})

export const macroProfileDAOSchema = createMacroProfileDAOSchema.extend({
  id: z.number(),
})

export type InsertMacroProfileDTO =
  Database['public']['Tables']['macro_profiles']['Insert']
export type MacroProfileDAO = z.infer<typeof macroProfileDAOSchema>

// Conversion functions
function toInsertDTO(newMacroProfile: NewMacroProfile): InsertMacroProfileDTO {
  return {
    owner: newMacroProfile.owner,
    target_day: newMacroProfile.target_day.toISOString(),
    gramsPerKgCarbs: newMacroProfile.gramsPerKgCarbs,
    gramsPerKgProtein: newMacroProfile.gramsPerKgProtein,
    gramsPerKgFat: newMacroProfile.gramsPerKgFat,
  }
}

function toDomain(dao: MacroProfileDAO): MacroProfile {
  return parseWithStack(macroProfileSchema, {
    id: dao.id,
    owner: dao.owner,
    target_day: new Date(dao.target_day),
    gramsPerKgCarbs: dao.gramsPerKgCarbs,
    gramsPerKgProtein: dao.gramsPerKgProtein,
    gramsPerKgFat: dao.gramsPerKgFat,
  })
}

export const supabaseMacroProfileMapper = {
  toInsertDTO,
  toDomain,
}
