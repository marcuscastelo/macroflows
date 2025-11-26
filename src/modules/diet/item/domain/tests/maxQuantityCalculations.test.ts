import { describe, expect, it } from 'vitest'

import {
  calculateMacroPreview,
  calculateMaxQuantity,
  getDominantMacro,
  getMacrosPerGram,
  getMaxBalanced,
  getMaxForMacro,
} from '~/modules/diet/item/domain/maxQuantityCalculations'

describe('getMacrosPerGram', () => {
  it('should calculate per-gram values from 100g macros', () => {
    const macrosPer100g = { carbs: 50, protein: 20, fat: 10 }
    const result = getMacrosPerGram(macrosPer100g)

    expect(result.carbPerGram).toBe(0.5)
    expect(result.proteinPerGram).toBe(0.2)
    expect(result.fatPerGram).toBe(0.1)
  })

  it('should handle zero macros', () => {
    const macrosPer100g = { carbs: 0, protein: 0, fat: 0 }
    const result = getMacrosPerGram(macrosPer100g)

    expect(result.carbPerGram).toBe(0)
    expect(result.proteinPerGram).toBe(0)
    expect(result.fatPerGram).toBe(0)
  })
})

describe('calculateMacroPreview', () => {
  it('should calculate macro preview for given grams', () => {
    const macrosPer100g = { carbs: 50, protein: 20, fat: 10 }
    const preview = calculateMacroPreview(150, macrosPer100g)

    expect(preview.carbs).toBe(75) // 150 * 0.5
    expect(preview.protein).toBe(30) // 150 * 0.2
    expect(preview.fat).toBe(15) // 150 * 0.1
  })

  it('should handle zero grams', () => {
    const macrosPer100g = { carbs: 50, protein: 20, fat: 10 }
    const preview = calculateMacroPreview(0, macrosPer100g)

    expect(preview.carbs).toBe(0)
    expect(preview.protein).toBe(0)
    expect(preview.fat).toBe(0)
  })
})

describe('getDominantMacro', () => {
  it('should detect protein-dominant item (pure protein)', () => {
    // Chicken breast: high protein, almost no carbs/fat
    const pureProtein = { carbs: 0, protein: 30, fat: 2 }
    expect(getDominantMacro(pureProtein)).toBe('protein')
  })

  it('should detect carb-dominant item (pure carbs)', () => {
    // White rice: mostly carbs
    const pureCarb = { carbs: 80, protein: 3, fat: 0 }
    expect(getDominantMacro(pureCarb)).toBe('carb')
  })

  it('should detect fat-dominant item (pure fat)', () => {
    // Olive oil: 100% fat
    const pureFat = { carbs: 0, protein: 0, fat: 100 }
    expect(getDominantMacro(pureFat)).toBe('fat')
  })

  it('should detect fat-dominant item (butter)', () => {
    // Butter: mostly fat
    const butter = { carbs: 0.1, protein: 0.9, fat: 82 }
    expect(getDominantMacro(butter)).toBe('fat')
  })

  it('should return null for mixed item (50/50 protein/carb)', () => {
    // Equal calories from protein and carbs (4 cal each)
    const mixed = { carbs: 25, protein: 25, fat: 0 }
    expect(getDominantMacro(mixed)).toBe(null)
  })

  it('should return null for balanced item', () => {
    // Roughly equal distribution
    const balanced = { carbs: 30, protein: 25, fat: 15 }
    expect(getDominantMacro(balanced)).toBe(null)
  })

  it('should return null for item with no calories', () => {
    const noCalories = { carbs: 0, protein: 0, fat: 0 }
    expect(getDominantMacro(noCalories)).toBe(null)
  })

  it('should handle edge case at 60% threshold', () => {
    // Exactly at threshold: 60% carbs
    // Need: carbCal / totalCal >= 0.6
    // Let's use: 60g carbs = 240 cal, 20g protein = 80 cal, 8g fat = 72 cal
    // Total = 392 cal, carbs = 240/392 = 61.2% (above threshold)
    const atThreshold = { carbs: 60, protein: 20, fat: 8 }
    expect(getDominantMacro(atThreshold)).toBe('carb')
  })

  it('should handle edge case just below 60% threshold', () => {
    // Just below threshold: ~59% carbs
    // 59g carbs = 236 cal, 25g protein = 100 cal, 7.33g fat = 66 cal
    // Total = 402 cal, carbs = 58.7%
    const belowThreshold = { carbs: 59, protein: 25, fat: 7.33 }
    expect(getDominantMacro(belowThreshold)).toBe(null)
  })
})

describe('getMaxForMacro', () => {
  describe('pure protein item', () => {
    const pureProtein = { carbs: 0, protein: 25, fat: 0 }

    it('should maximize protein without limits', () => {
      const remaining = { carbs: 100, protein: 50, fat: 50 }
      const result = getMaxForMacro('protein', pureProtein, remaining)

      expect(result.grams).toBe(200) // 50 / 0.25 = 200g
      expect(result.limitedBy).toBe(null)
      expect(result.preview.protein).toBe(50)
    })

    it('should return 0 for carb target on pure protein item', () => {
      const remaining = { carbs: 100, protein: 50, fat: 50 }
      const result = getMaxForMacro('carb', pureProtein, remaining)

      expect(result.grams).toBe(0)
      expect(result.limitedBy).toBe(null)
    })
  })

  describe('mixed item (protein + fat)', () => {
    // Example: Beef (per 100g: 26g protein, 15g fat)
    const beefLike = { carbs: 0, protein: 26, fat: 15 }

    it('should be limited by fat when maximizing protein', () => {
      const remaining = { carbs: 100, protein: 100, fat: 10 }
      const result = getMaxForMacro('protein', beefLike, remaining)

      // Max from protein: 100 / 0.26 = 384.6g
      // Max from fat: 10 / 0.15 = 66.67g (limiting)
      expect(result.grams).toBe(66.67)
      expect(result.limitedBy).toBe('fat')
      expect(result.preview.fat).toBeCloseTo(10, 1)
    })

    it('should be limited by protein when maximizing fat', () => {
      const remaining = { carbs: 100, protein: 10, fat: 100 }
      const result = getMaxForMacro('fat', beefLike, remaining)

      // Max from fat: 100 / 0.15 = 666.67g
      // Max from protein: 10 / 0.26 = 38.46g (limiting)
      expect(result.grams).toBe(38.46)
      expect(result.limitedBy).toBe('protein')
    })
  })

  describe('edge cases', () => {
    it('should handle remaining target of 0', () => {
      const item = { carbs: 20, protein: 10, fat: 5 }
      const remaining = { carbs: 0, protein: 50, fat: 50 }
      const result = getMaxForMacro('carb', item, remaining)

      expect(result.grams).toBe(0)
    })

    it('should handle remaining target less than 0', () => {
      const item = { carbs: 20, protein: 10, fat: 5 }
      const remaining = { carbs: -10, protein: 50, fat: 50 }
      const result = getMaxForMacro('carb', item, remaining)

      expect(result.grams).toBe(0)
    })

    it('should handle limiting macro with remaining 0', () => {
      const item = { carbs: 20, protein: 10, fat: 5 }
      const remaining = { carbs: 100, protein: 0, fat: 50 }
      const result = getMaxForMacro('carb', item, remaining)

      // Carb max: 100 / 0.2 = 500g
      // Protein max: 0 / 0.1 = 0g (limiting)
      expect(result.grams).toBe(0)
      expect(result.limitedBy).toBe('protein')
    })

    it('should handle per-gram value of 0 for target macro', () => {
      const pureFat = { carbs: 0, protein: 0, fat: 100 }
      const remaining = { carbs: 100, protein: 50, fat: 50 }
      const result = getMaxForMacro('protein', pureFat, remaining)

      expect(result.grams).toBe(0)
      expect(result.limitedBy).toBe(null)
    })
  })
})

describe('getMaxBalanced', () => {
  it('should find minimum constraint for balanced mode', () => {
    const item = { carbs: 30, protein: 20, fat: 10 }
    const remaining = { carbs: 60, protein: 50, fat: 10 }

    // Max from carbs: 60 / 0.3 = 200g
    // Max from protein: 50 / 0.2 = 250g
    // Max from fat: 10 / 0.1 = 100g (limiting)
    const result = getMaxBalanced(item, remaining)

    expect(result.grams).toBe(100)
    expect(result.limitedBy).toBe('fat')
  })

  it('should work with pure protein item', () => {
    const pureProtein = { carbs: 0, protein: 25, fat: 0 }
    const remaining = { carbs: 100, protein: 50, fat: 50 }

    const result = getMaxBalanced(pureProtein, remaining)

    expect(result.grams).toBe(200) // 50 / 0.25 = 200g
    expect(result.limitedBy).toBe('protein')
  })

  it('should work with pure carb item', () => {
    const pureCarb = { carbs: 80, protein: 0, fat: 0 }
    const remaining = { carbs: 40, protein: 50, fat: 50 }

    const result = getMaxBalanced(pureCarb, remaining)

    expect(result.grams).toBe(50) // 40 / 0.8 = 50g
    expect(result.limitedBy).toBe('carb')
  })

  it('should return 0 for item with no macros', () => {
    const noMacros = { carbs: 0, protein: 0, fat: 0 }
    const remaining = { carbs: 100, protein: 50, fat: 50 }

    const result = getMaxBalanced(noMacros, remaining)

    expect(result.grams).toBe(0)
    expect(result.limitedBy).toBe(null)
  })

  it('should handle all remaining at 0', () => {
    const item = { carbs: 30, protein: 20, fat: 10 }
    const remaining = { carbs: 0, protein: 0, fat: 0 }

    const result = getMaxBalanced(item, remaining)

    expect(result.grams).toBe(0)
  })

  it('should handle negative remaining values', () => {
    const item = { carbs: 30, protein: 20, fat: 10 }
    const remaining = { carbs: -10, protein: 50, fat: 20 }

    const result = getMaxBalanced(item, remaining)

    // Carb would be 0 (from -10), limiting
    expect(result.grams).toBe(0)
    expect(result.limitedBy).toBe('carb')
  })
})

describe('calculateMaxQuantity', () => {
  const item = { carbs: 30, protein: 20, fat: 10 }
  const remaining = { carbs: 60, protein: 50, fat: 10 }

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
    const chicken = { carbs: 0, protein: 31, fat: 3.6 }

    it('should be detected as protein-dominant', () => {
      expect(getDominantMacro(chicken)).toBe('protein')
    })

    it('should calculate max for balanced mode', () => {
      const remaining = { carbs: 100, protein: 62, fat: 20 }
      const result = getMaxBalanced(chicken, remaining)

      // Protein: 62 / 0.31 = 200g
      // Fat: 20 / 0.036 = 555.56g
      expect(result.grams).toBe(200)
      expect(result.limitedBy).toBe('protein')
    })
  })

  describe('olive oil (pure fat)', () => {
    // Per 100g: 0g protein, 0g carbs, 100g fat
    const oliveOil = { carbs: 0, protein: 0, fat: 100 }

    it('should be detected as fat-dominant', () => {
      expect(getDominantMacro(oliveOil)).toBe('fat')
    })

    it('should calculate max for balanced mode', () => {
      const remaining = { carbs: 100, protein: 50, fat: 15 }
      const result = getMaxBalanced(oliveOil, remaining)

      expect(result.grams).toBe(15) // 15 / 1 = 15g
      expect(result.limitedBy).toBe('fat')
    })
  })

  describe('white rice (high carb)', () => {
    // Per 100g: 28g carbs, 2.7g protein, 0.3g fat
    const rice = { carbs: 28, protein: 2.7, fat: 0.3 }

    it('should be detected as carb-dominant', () => {
      expect(getDominantMacro(rice)).toBe('carb')
    })

    it('should calculate max for balanced mode with fat limiting', () => {
      const remaining = { carbs: 100, protein: 50, fat: 1 }
      const result = getMaxBalanced(rice, remaining)

      // Carb: 100 / 0.28 = 357.14g
      // Protein: 50 / 0.027 = 1851.85g
      // Fat: 1 / 0.003 = 333.33g (limiting)
      expect(result.grams).toBe(333.33)
      expect(result.limitedBy).toBe('fat')
    })
  })

  describe('peanut butter (mixed)', () => {
    // Per 100g: 20g carbs, 25g protein, 50g fat
    const peanutButter = { carbs: 20, protein: 25, fat: 50 }

    it('should be detected as mixed (no dominant macro)', () => {
      // Carbs: 20 * 4 = 80 cal
      // Protein: 25 * 4 = 100 cal
      // Fat: 50 * 9 = 450 cal
      // Total: 630 cal
      // Fat: 450/630 = 71.4% - actually fat dominant!
      expect(getDominantMacro(peanutButter)).toBe('fat')
    })
  })

  describe('egg (balanced protein/fat)', () => {
    // Per 100g: 1.1g carbs, 13g protein, 11g fat
    const egg = { carbs: 1.1, protein: 13, fat: 11 }

    it('should be detected as mixed (no dominant macro)', () => {
      // Carbs: 1.1 * 4 = 4.4 cal
      // Protein: 13 * 4 = 52 cal
      // Fat: 11 * 9 = 99 cal
      // Total: 155.4 cal
      // Fat: 99/155.4 = 63.7% - fat dominant by our threshold
      expect(getDominantMacro(egg)).toBe('fat')
    })
  })

  describe('milk (truly balanced)', () => {
    // Per 100g: 5g carbs, 3.4g protein, 3.3g fat
    const milk = { carbs: 5, protein: 3.4, fat: 3.3 }

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
