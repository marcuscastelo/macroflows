import { describe, expect, it } from 'vitest'

import {
  calculateMacroPreview,
  calculateMaxQuantity,
  getDominantMacro,
  getMacrosPerGram,
  getMaxBalanced,
  getMaxForMacro,
} from '~/modules/diet/item/domain/maxQuantityCalculations'
import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'

describe('getMacrosPerGram', () => {
  it('should calculate per-gram values from 100g macros', () => {
    const macrosPer100g: MacroNutrients = createMacroNutrients({
      carbsInGrams: 50,
      proteinInGrams: 20,
      fatInGrams: 10,
    })
    const result = getMacrosPerGram(macrosPer100g)

    expect(result.carbPerGram).toBe(0.5)
    expect(result.proteinPerGram).toBe(0.2)
    expect(result.fatPerGram).toBe(0.1)
  })

  it('should handle zero macros', () => {
    const macrosPer100g: MacroNutrients = createMacroNutrients({
      carbsInGrams: 0,
      proteinInGrams: 0,
      fatInGrams: 0,
    })
    const result = getMacrosPerGram(macrosPer100g)

    expect(result.carbPerGram).toBe(0)
    expect(result.proteinPerGram).toBe(0)
    expect(result.fatPerGram).toBe(0)
  })
})

describe('calculateMacroPreview', () => {
  it('should calculate macro preview for given grams', () => {
    const macrosPer100g: MacroNutrients = createMacroNutrients({
      carbsInGrams: 50,
      proteinInGrams: 20,
      fatInGrams: 10,
    })
    const preview = calculateMacroPreview(150, macrosPer100g)

    expect(preview.carbsInGrams).toBe(75) // 150 * 0.5
    expect(preview.proteinInGrams).toBe(30) // 150 * 0.2
    expect(preview.fatInGrams).toBe(15) // 150 * 0.1
  })

  it('should handle zero grams', () => {
    const macrosPer100g: MacroNutrients = createMacroNutrients({
      carbsInGrams: 50,
      proteinInGrams: 20,
      fatInGrams: 10,
    })
    const preview = calculateMacroPreview(0, macrosPer100g)

    expect(preview.carbsInGrams).toBe(0)
    expect(preview.proteinInGrams).toBe(0)
    expect(preview.fatInGrams).toBe(0)
  })
})

describe('getDominantMacro', () => {
  it('should detect protein-dominant item (pure protein)', () => {
    // Chicken breast: high protein, almost no carbs/fat
    const pureProtein = createMacroNutrients({
      carbsInGrams: 0,
      proteinInGrams: 30,
      fatInGrams: 2,
    })
    expect(getDominantMacro(pureProtein)).toBe('protein')
  })

  it('should detect carb-dominant item (pure carbs)', () => {
    // White rice: mostly carbs
    const pureCarb = createMacroNutrients({
      carbsInGrams: 80,
      proteinInGrams: 3,
      fatInGrams: 0,
    })
    expect(getDominantMacro(pureCarb)).toBe('carb')
  })

  it('should detect fat-dominant item (pure fat)', () => {
    // Olive oil: 100% fat
    const pureFat = createMacroNutrients({
      carbsInGrams: 0,
      proteinInGrams: 0,
      fatInGrams: 100,
    })
    expect(getDominantMacro(pureFat)).toBe('fat')
  })

  it('should detect fat-dominant item (butter)', () => {
    // Butter: mostly fat
    const butter = createMacroNutrients({
      carbsInGrams: 0.1,
      proteinInGrams: 0.9,
      fatInGrams: 82,
    })
    expect(getDominantMacro(butter)).toBe('fat')
  })

  it('should return null for mixed item (50/50 protein/carb)', () => {
    // Equal calories from protein and carbs (4 cal each)
    const mixed = createMacroNutrients({
      carbsInGrams: 25,
      proteinInGrams: 25,
      fatInGrams: 0,
    })
    expect(getDominantMacro(mixed)).toBe(null)
  })

  it('should return null for balanced item', () => {
    // Roughly equal distribution
    const balanced = createMacroNutrients({
      carbsInGrams: 30,
      proteinInGrams: 25,
      fatInGrams: 15,
    })
    expect(getDominantMacro(balanced)).toBe(null)
  })

  it('should return null for item with no calories', () => {
    const noCalories = createMacroNutrients({
      carbsInGrams: 0,
      proteinInGrams: 0,
      fatInGrams: 0,
    })
    expect(getDominantMacro(noCalories)).toBe(null)
  })

  it('should handle edge case just below 60% threshold', () => {
    // Just below threshold: ~59% carbs
    // 59g carbs = 236 cal, 25g protein = 100 cal, 7.33g fat = 66 cal
    // Total = 402 cal, carbs = 58.7%
    const belowThreshold = createMacroNutrients({
      carbsInGrams: 59,
      proteinInGrams: 25,
      fatInGrams: 7.33,
    })
    expect(getDominantMacro(belowThreshold)).toBe(null)
  })
})

describe('getMaxForMacro', () => {
  describe('pure protein item', () => {
    const pureProtein = createMacroNutrients({
      carbsInGrams: 0,
      proteinInGrams: 25,
      fatInGrams: 0,
    })

    it('should maximize protein without limits', () => {
      const remaining = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 50,
        fatInGrams: 50,
      })
      const result = getMaxForMacro('protein', pureProtein, remaining)

      expect(result.grams).toBe(200) // 50 / 0.25 = 200g
      expect(result.limitedBy).toBe(null)
      expect(result.preview.proteinInGrams).toBe(50)
    })

    it('should return 0 for carb target on pure protein item', () => {
      const remaining = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 50,
        fatInGrams: 50,
      })
      const result = getMaxForMacro('carb', pureProtein, remaining)

      expect(result.grams).toBe(0)
      expect(result.limitedBy).toBe(null)
    })
  })

  describe('mixed item (protein + fat)', () => {
    // Example: Beef (per 100g: 26g protein, 15g fat)
    const beefLike = createMacroNutrients({
      carbsInGrams: 0,
      proteinInGrams: 26,
      fatInGrams: 15,
    })

    it('should be limited by fat when maximizing protein', () => {
      const remaining = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 100,
        fatInGrams: 10,
      })
      const result = getMaxForMacro('protein', beefLike, remaining)

      // Max from protein: 100 / 0.26 = 384.6g
      // Max from fat: 10 / 0.15 = 66.67g (limiting)
      expect(result.grams).toBe(66.67)
      expect(result.limitedBy).toBe('fat')
      expect(result.preview.fatInGrams).toBeCloseTo(10, 1)
    })

    it('should be limited by protein when maximizing fat', () => {
      const remaining = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 10,
        fatInGrams: 100,
      })
      const result = getMaxForMacro('fat', beefLike, remaining)

      // Max from fat: 100 / 0.15 = 666.67g
      // Max from protein: 10 / 0.26 = 38.46g (limiting)
      expect(result.grams).toBe(38.46)
      expect(result.limitedBy).toBe('protein')
    })
  })

  describe('edge cases', () => {
    it('should handle remaining target of 0', () => {
      const item = createMacroNutrients({
        carbsInGrams: 20,
        proteinInGrams: 10,
        fatInGrams: 5,
      })
      const remaining = createMacroNutrients({
        carbsInGrams: 0,
        proteinInGrams: 50,
        fatInGrams: 50,
      })
      const result = getMaxForMacro('carb', item, remaining)

      expect(result.grams).toBe(0)
    })

    it('should handle remaining target less than 0', () => {
      const item = createMacroNutrients({
        carbsInGrams: 20,
        proteinInGrams: 10,
        fatInGrams: 5,
      })
      const remaining = createMacroNutrients({
        carbsInGrams: -10,
        proteinInGrams: 50,
        fatInGrams: 50,
      })
      const result = getMaxForMacro('carb', item, remaining)

      expect(result.grams).toBe(0)
    })

    it('should handle limiting macro with remaining 0', () => {
      const item = createMacroNutrients({
        carbsInGrams: 20,
        proteinInGrams: 10,
        fatInGrams: 5,
      })
      const remaining = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 0,
        fatInGrams: 50,
      })
      const result = getMaxForMacro('carb', item, remaining)

      // Carb max: 100 / 0.2 = 500g
      // Protein max: 0 / 0.1 = 0g (limiting)
      expect(result.grams).toBe(0)
      expect(result.limitedBy).toBe('protein')
    })

    it('should handle per-gram value of 0 for target macro', () => {
      const pureFat = createMacroNutrients({
        carbsInGrams: 0,
        proteinInGrams: 0,
        fatInGrams: 100,
      })
      const remaining = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 50,
        fatInGrams: 50,
      })
      const result = getMaxForMacro('protein', pureFat, remaining)

      expect(result.grams).toBe(0)
      expect(result.limitedBy).toBe(null)
    })
  })
})

describe('getMaxBalanced', () => {
  it('should find minimum constraint for balanced mode', () => {
    const item = createMacroNutrients({
      carbsInGrams: 30,
      proteinInGrams: 20,
      fatInGrams: 10,
    })
    const remaining = createMacroNutrients({
      carbsInGrams: 60,
      proteinInGrams: 50,
      fatInGrams: 10,
    })

    // Max from carbs: 60 / 0.3 = 200g
    // Max from protein: 50 / 0.2 = 250g
    // Max from fat: 10 / 0.1 = 100g (limiting)
    const result = getMaxBalanced(item, remaining)

    expect(result.grams).toBe(100)
    expect(result.limitedBy).toBe('fat')
  })

  it('should work with pure protein item', () => {
    const pureProtein = createMacroNutrients({
      carbsInGrams: 0,
      proteinInGrams: 25,
      fatInGrams: 0,
    })
    const remaining = createMacroNutrients({
      carbsInGrams: 100,
      proteinInGrams: 50,
      fatInGrams: 50,
    })

    const result = getMaxBalanced(pureProtein, remaining)

    expect(result.grams).toBe(200) // 50 / 0.25 = 200g
    expect(result.limitedBy).toBe('protein')
  })

  it('should work with pure carb item', () => {
    const pureCarb = createMacroNutrients({
      carbsInGrams: 80,
      proteinInGrams: 0,
      fatInGrams: 0,
    })
    const remaining = createMacroNutrients({
      carbsInGrams: 40,
      proteinInGrams: 50,
      fatInGrams: 50,
    })

    const result = getMaxBalanced(pureCarb, remaining)

    expect(result.grams).toBe(50) // 40 / 0.8 = 50g
    expect(result.limitedBy).toBe('carb')
  })

  it('should return 0 for item with no macros', () => {
    const noMacros = createMacroNutrients({
      carbsInGrams: 0,
      proteinInGrams: 0,
      fatInGrams: 0,
    })
    const remaining = createMacroNutrients({
      carbsInGrams: 100,
      proteinInGrams: 50,
      fatInGrams: 50,
    })

    const result = getMaxBalanced(noMacros, remaining)

    expect(result.grams).toBe(0)
    expect(result.limitedBy).toBe(null)
  })

  it('should handle all remaining at 0', () => {
    const item = createMacroNutrients({
      carbsInGrams: 30,
      proteinInGrams: 20,
      fatInGrams: 10,
    })
    const remaining = createMacroNutrients({
      carbsInGrams: 0,
      proteinInGrams: 0,
      fatInGrams: 0,
    })

    const result = getMaxBalanced(item, remaining)

    expect(result.grams).toBe(0)
  })

  it('should handle negative remaining values', () => {
    const item = createMacroNutrients({
      carbsInGrams: 30,
      proteinInGrams: 20,
      fatInGrams: 10,
    })
    const remaining = createMacroNutrients({
      carbsInGrams: -10,
      proteinInGrams: 50,
      fatInGrams: 20,
    })

    const result = getMaxBalanced(item, remaining)

    // Carb would be 0 (from -10), limiting
    expect(result.grams).toBe(0)
    expect(result.limitedBy).toBe('carb')
  })
})

describe('calculateMaxQuantity', () => {
  const item = createMacroNutrients({
    carbsInGrams: 30,
    proteinInGrams: 20,
    fatInGrams: 10,
  })
  const remaining = createMacroNutrients({
    carbsInGrams: 60,
    proteinInGrams: 50,
    fatInGrams: 10,
  })

  it('should delegate to getMaxBalanced for balanced mode', () => {
    const result = calculateMaxQuantity('balanced', item, remaining)
    const expected = getMaxBalanced(item, remaining)

    expect(result.grams).toBe(expected.grams)
    expect(result.limitedBy).toBe(expected.limitedBy)
  })

  it('should delegate to getMaxForMacro for protein mode', () => {
    const result = calculateMaxQuantity('protein', item, remaining)
    const expected = getMaxForMacro('protein', item, remaining)

    expect(result.grams).toBe(expected.grams)
    expect(result.limitedBy).toBe(expected.limitedBy)
  })

  it('should delegate to getMaxForMacro for carb mode', () => {
    const result = calculateMaxQuantity('carb', item, remaining)
    const expected = getMaxForMacro('carb', item, remaining)

    expect(result.grams).toBe(expected.grams)
    expect(result.limitedBy).toBe(expected.limitedBy)
  })

  it('should delegate to getMaxForMacro for fat mode', () => {
    const result = calculateMaxQuantity('fat', item, remaining)
    const expected = getMaxForMacro('fat', item, remaining)

    expect(result.grams).toBe(expected.grams)
    expect(result.limitedBy).toBe(expected.limitedBy)
  })
})

describe('real-world scenarios', () => {
  describe('chicken breast (high protein)', () => {
    // Per 100g: 31g protein, 0g carbs, 3.6g fat
    const chicken = createMacroNutrients({
      carbsInGrams: 0,
      proteinInGrams: 31,
      fatInGrams: 3.6,
    })

    it('should be detected as protein-dominant', () => {
      expect(getDominantMacro(chicken)).toBe('protein')
    })

    it('should calculate max for balanced mode', () => {
      const remaining = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 62,
        fatInGrams: 20,
      })
      const result = getMaxBalanced(chicken, remaining)

      // Protein: 62 / 0.31 = 200g
      // Fat: 20 / 0.036 = 555.56g
      expect(result.grams).toBe(200)
      expect(result.limitedBy).toBe('protein')
    })
  })

  describe('olive oil (pure fat)', () => {
    // Per 100g: 0g protein, 0g carbs, 100g fat
    const oliveOil = createMacroNutrients({
      carbsInGrams: 0,
      proteinInGrams: 0,
      fatInGrams: 100,
    })

    it('should be detected as fat-dominant', () => {
      expect(getDominantMacro(oliveOil)).toBe('fat')
    })

    it('should calculate max for balanced mode', () => {
      const remaining = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 50,
        fatInGrams: 15,
      })
      const result = getMaxBalanced(oliveOil, remaining)

      expect(result.grams).toBe(15) // 15 / 1 = 15g
      expect(result.limitedBy).toBe('fat')
    })
  })

  describe('white rice (high carb)', () => {
    // Per 100g: 28g carbs, 2.7g protein, 0.3g fat
    const rice = createMacroNutrients({
      carbsInGrams: 28,
      proteinInGrams: 2.7,
      fatInGrams: 0.3,
    })

    it('should be detected as carb-dominant', () => {
      expect(getDominantMacro(rice)).toBe('carb')
    })

    it('should calculate max for balanced mode with fat limiting', () => {
      const remaining = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 50,
        fatInGrams: 1,
      })
      const result = getMaxBalanced(rice, remaining)

      // Carb: 100 / 0.28 = 357.14g
      // Protein: 50 / 0.027 = 1851.85g
      // Fat: 1 / 0.003 = 333.33g (limiting)
      expect(result.grams).toBe(333.33)
      expect(result.limitedBy).toBe('fat')
    })
  })

  describe('milk (truly balanced)', () => {
    // Per 100g: 5g carbs, 3.4g protein, 3.3g fat
    const milk = createMacroNutrients({
      carbsInGrams: 5,
      proteinInGrams: 3.4,
      fatInGrams: 3.3,
    })

    it('should be detected as mixed (no dominant macro)', () => {
      // Carbs: 5 * 4 = 20 cal
      // Protein: 3.4 * 4 = 13.6 cal
      // Fat: 3.3 * 9 = 29.7 cal
      // Total: 63.3 cal
      // No macro exceeds 60%
      expect(getDominantMacro(milk)).toBe(null)
    })
  })
})

describe('ignoreOtherMacros option', () => {
  describe('getMaxForMacro with ignoreOtherMacros: true', () => {
    // Example: Beef (per 100g: 26g protein, 15g fat)
    const beefLike = createMacroNutrients({
      carbsInGrams: 0,
      proteinInGrams: 26,
      fatInGrams: 15,
    })

    it('should ignore fat constraint when maximizing protein', () => {
      const remaining = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 100,
        fatInGrams: 10,
      })

      // Without ignoreOtherMacros: limited to 66.67g by fat
      const constrained = getMaxForMacro('protein', beefLike, remaining)
      expect(constrained.grams).toBe(66.67)
      expect(constrained.limitedBy).toBe('fat')
      expect(constrained.ignoredOtherMacros).toBe(false)

      // With ignoreOtherMacros: uses full protein target
      const unconstrained = getMaxForMacro('protein', beefLike, remaining, {
        ignoreOtherMacros: true,
      })
      // Max from protein only: 100 / 0.26 = 384.62g
      expect(unconstrained.grams).toBe(384.62)
      expect(unconstrained.limitedBy).toBe(null)
      expect(unconstrained.ignoredOtherMacros).toBe(true)
    })

    it('should ignore protein constraint when maximizing fat', () => {
      const remaining = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 10,
        fatInGrams: 100,
      })

      // Without ignoreOtherMacros: limited to 38.46g by protein
      const constrained = getMaxForMacro('fat', beefLike, remaining)
      expect(constrained.grams).toBe(38.46)
      expect(constrained.limitedBy).toBe('protein')
      expect(constrained.ignoredOtherMacros).toBe(false)

      // With ignoreOtherMacros: uses full fat target
      const unconstrained = getMaxForMacro('fat', beefLike, remaining, {
        ignoreOtherMacros: true,
      })
      // Max from fat only: 100 / 0.15 = 666.67g
      expect(unconstrained.grams).toBe(666.67)
      expect(unconstrained.limitedBy).toBe(null)
      expect(unconstrained.ignoredOtherMacros).toBe(true)
    })

    it('should still respect target macro remaining even when ignoring others', () => {
      const item = createMacroNutrients({
        carbsInGrams: 20,
        proteinInGrams: 10,
        fatInGrams: 5,
      })
      // Only 30g of carbs remaining
      const remaining = createMacroNutrients({
        carbsInGrams: 30,
        proteinInGrams: 100,
        fatInGrams: 100,
      })

      const result = getMaxForMacro('carb', item, remaining, {
        ignoreOtherMacros: true,
      })
      // Max from carbs: 30 / 0.2 = 150g (limited by carbs remaining)
      expect(result.grams).toBe(150)
      expect(result.limitedBy).toBe(null) // null because we ignored others
      expect(result.ignoredOtherMacros).toBe(true)
    })

    it('should return 0 when target macro has 0 per gram', () => {
      const pureFat = createMacroNutrients({
        carbsInGrams: 0,
        proteinInGrams: 0,
        fatInGrams: 100,
      })
      const remaining = createMacroNutrients({
        carbsInGrams: 100,
        proteinInGrams: 50,
        fatInGrams: 50,
      })
      const result = getMaxForMacro('protein', pureFat, remaining, {
        ignoreOtherMacros: true,
      })
      expect(result.grams).toBe(0)
      expect(result.limitedBy).toBe(null)
      expect(result.ignoredOtherMacros).toBe(true)
    })
  })

  describe('calculateMaxQuantity with ignoreOtherMacros option', () => {
    const item = createMacroNutrients({
      carbsInGrams: 30,
      proteinInGrams: 20,
      fatInGrams: 10,
    })
    const remaining = createMacroNutrients({
      carbsInGrams: 60,
      proteinInGrams: 50,
      fatInGrams: 10,
    })

    it('should pass ignoreOtherMacros to getMaxForMacro for protein mode', () => {
      // Without option: limited by fat (10 / 0.1 = 100g)
      const constrained = calculateMaxQuantity('protein', item, remaining)
      expect(constrained.grams).toBe(100)
      expect(constrained.limitedBy).toBe('fat')
      expect(constrained.ignoredOtherMacros).toBe(false)

      // With option: protein only (50 / 0.2 = 250g)
      const unconstrained = calculateMaxQuantity('protein', item, remaining, {
        ignoreOtherMacros: true,
      })
      expect(unconstrained.grams).toBe(250)
      expect(unconstrained.limitedBy).toBe(null)
      expect(unconstrained.ignoredOtherMacros).toBe(true)
    })

    it('should not affect balanced mode (always respects all constraints)', () => {
      const balancedResult = calculateMaxQuantity('balanced', item, remaining, {
        ignoreOtherMacros: true,
      })
      // Balanced mode ignores the option; still limited by fat
      expect(balancedResult.grams).toBe(100)
      expect(balancedResult.limitedBy).toBe('fat')
      expect(balancedResult.ignoredOtherMacros).toBe(false)
    })
  })

  describe('ignoredOtherMacros flag in result', () => {
    it('should be false for balanced mode', () => {
      const item = createMacroNutrients({
        carbsInGrams: 30,
        proteinInGrams: 20,
        fatInGrams: 10,
      })
      const remaining = createMacroNutrients({
        carbsInGrams: 60,
        proteinInGrams: 50,
        fatInGrams: 10,
      })
      const result = getMaxBalanced(item, remaining)
      expect(result.ignoredOtherMacros).toBe(false)
    })

    it('should be false for getMaxForMacro without option', () => {
      const item = createMacroNutrients({
        carbsInGrams: 30,
        proteinInGrams: 20,
        fatInGrams: 10,
      })
      const remaining = createMacroNutrients({
        carbsInGrams: 60,
        proteinInGrams: 50,
        fatInGrams: 10,
      })
      const result = getMaxForMacro('protein', item, remaining)
      expect(result.ignoredOtherMacros).toBe(false)
    })

    it('should be true for getMaxForMacro with ignoreOtherMacros: true', () => {
      const item = createMacroNutrients({
        carbsInGrams: 30,
        proteinInGrams: 20,
        fatInGrams: 10,
      })
      const remaining = createMacroNutrients({
        carbsInGrams: 60,
        proteinInGrams: 50,
        fatInGrams: 10,
      })
      const result = getMaxForMacro('protein', item, remaining, {
        ignoreOtherMacros: true,
      })
      expect(result.ignoredOtherMacros).toBe(true)
    })
  })
})
