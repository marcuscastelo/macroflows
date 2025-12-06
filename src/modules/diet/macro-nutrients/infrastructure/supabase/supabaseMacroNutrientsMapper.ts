import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { type Json } from '~/shared/supabase/database.types'

function toDomain(macrosDTO: Json): MacroNutrients {
  if (
    macrosDTO === null ||
    !(typeof macrosDTO === 'object') ||
    !('carbs' in macrosDTO) ||
    !('protein' in macrosDTO) ||
    !('fat' in macrosDTO) ||
    typeof macrosDTO.carbs !== 'number' ||
    typeof macrosDTO.protein !== 'number' ||
    typeof macrosDTO.fat !== 'number'
  ) {
    throw new Error(
      'macrosDTO is missing macros field: ' + JSON.stringify(macrosDTO),
    )
  }

  return createMacroNutrients({
    carbsInMg: macrosDTO.carbs * 1000,
    proteinInMg: macrosDTO.protein * 1000,
    fatInMg: macrosDTO.fat * 1000,
  })
}

function toSupabaseDTO(macroNutrients: MacroNutrients): Json {
  return {
    carbs: macroNutrients.carbsInMg / 1000,
    protein: macroNutrients.proteinInMg / 1000,
    fat: macroNutrients.fatInMg / 1000,
  }
}

export const supabaseMacroNutrientsMapper = {
  toDomain: (macrosDTO: Json): MacroNutrients => toDomain(macrosDTO),
  toInsertDTO: (macroNutrients: MacroNutrients): Json =>
    toSupabaseDTO(macroNutrients),
  toUpdateDTO: (macroNutrients: MacroNutrients): Json =>
    toSupabaseDTO(macroNutrients),
}
