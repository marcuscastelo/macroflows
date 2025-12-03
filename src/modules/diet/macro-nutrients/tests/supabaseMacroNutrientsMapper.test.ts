import { describe, expect, it } from 'vitest'

import { supabaseMacroNutrientsMapper } from '~/modules/diet/macro-nutrients/infrastructure/supabase/supabaseMacroNutrientsMapper'
import { type Json } from '~/shared/supabase/database.types'

describe('supabaseMacroNutrientsMapper', () => {
  it('converts valid JSON to MacroNutrients and back', () => {
    const carbs = 10.5
    const protein = 5
    const fat = 2.25

    const dto: Json = { carbs, protein, fat }

    const domain = supabaseMacroNutrientsMapper.toDomain(dto)

    // Domain values are in milligrams
    expect(domain.carbsInMg).toBe(carbs * 1000)
    expect(domain.proteinInMg).toBe(protein * 1000)
    expect(domain.fatInMg).toBe(fat * 1000)

    const supabaseDto = supabaseMacroNutrientsMapper.toInsertDTO(domain)
    expect(supabaseDto).toEqual({ carbs, protein, fat })
  })

  it('throws for invalid JSON shapes', () => {
    const invalid1: Json = null
    const invalid2: Json = {}
    const invalid3: Json = { carbs: 'x' }

    expect(() => supabaseMacroNutrientsMapper.toDomain(invalid1)).toThrow()
    expect(() => supabaseMacroNutrientsMapper.toDomain(invalid2)).toThrow()
    expect(() => supabaseMacroNutrientsMapper.toDomain(invalid3)).toThrow()
  })
})
