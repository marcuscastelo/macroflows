import { describe, expect, it } from 'vitest'

import type { MacroValues } from '~/sections/common/components/MaxQuantityButton'

/**
 * Extracted logic from MaxQuantityButton for testing
 * Tests the calculation logic without rendering the component
 */
function calculateMaxQuantity(
  macroTargets: MacroValues,
  itemMacros: MacroValues,
): number {
  let max = Infinity

  const macroKeys: (keyof MacroValues)[] = ['carbs', 'protein', 'fat']
  for (const macro of macroKeys) {
    const per100g = itemMacros[macro]
    const availableMacro = macroTargets[macro]

    if (typeof availableMacro !== 'number' || availableMacro <= 0) {
      continue
    }

    if (
      typeof per100g === 'number' &&
      per100g > 0 &&
      typeof availableMacro === 'number'
    ) {
      // Calculate maximum quantity in grams (100g portions)
      const allowed = Math.floor(availableMacro / per100g) * 100

      if (allowed < max) {
        max = allowed
      }
    }
  }

  const result = max === Infinity ? 0 : max * 0.96
  return result
}

describe('MaxQuantityButton logic', () => {
  describe('calculateMaxQuantity', () => {
    it('calculates max quantity based on available macros', () => {
      const result = calculateMaxQuantity(
        { carbs: 100, protein: 50, fat: 30 },
        { carbs: 20, protein: 10, fat: 5 },
      )

      // Expected calculation:
      // carbs: floor(100 / 20) * 100 = 500g
      // protein: floor(50 / 10) * 100 = 500g
      // fat: floor(30 / 5) * 100 = 600g
      // min(500, 500, 600) * 0.96 = 480g
      expect(result).toBe(480)
    })

    it('returns 0 when all macro targets are 0', () => {
      const result = calculateMaxQuantity(
        { carbs: 0, protein: 0, fat: 0 },
        { carbs: 20, protein: 10, fat: 5 },
      )

      expect(result).toBe(0)
    })

    it('handles zero item macros correctly', () => {
      const result = calculateMaxQuantity(
        { carbs: 100, protein: 50, fat: 30 },
        { carbs: 0, protein: 0, fat: 0 },
      )

      // When all item macros are 0, no constraint, returns 0
      expect(result).toBe(0)
    })

    it('finds the limiting macro nutrient', () => {
      const result = calculateMaxQuantity(
        { carbs: 100, protein: 30, fat: 50 },
        { carbs: 10, protein: 15, fat: 5 },
      )

      // Expected calculation:
      // carbs: floor(100 / 10) * 100 = 1000g
      // protein: floor(30 / 15) * 100 = 200g (limiting factor)
      // fat: floor(50 / 5) * 100 = 1000g
      // min(1000, 200, 1000) * 0.96 = 192g
      expect(result).toBe(192)
    })

    it('applies 0.96 safety factor', () => {
      const result = calculateMaxQuantity(
        { carbs: 100, protein: 100, fat: 100 },
        { carbs: 10, protein: 10, fat: 10 },
      )

      // All macros allow 1000g, with 0.96 factor = 960g
      expect(result).toBe(960)
    })

    it('handles fractional macro values correctly', () => {
      const result = calculateMaxQuantity(
        { carbs: 50.5, protein: 25.3, fat: 15.7 },
        { carbs: 5.5, protein: 3.2, fat: 2.1 },
      )

      // Expected calculation:
      // carbs: floor(50.5 / 5.5) * 100 = 900g
      // protein: floor(25.3 / 3.2) * 100 = 700g (limiting factor)
      // fat: floor(15.7 / 2.1) * 100 = 700g
      // min(900, 700, 700) * 0.96 = 672g
      expect(result).toBe(672)
    })

    it('handles negative macro values by skipping them', () => {
      const result = calculateMaxQuantity(
        { carbs: 100, protein: -50, fat: 30 },
        { carbs: 10, protein: 10, fat: 5 },
      )

      // Protein is negative so it's skipped
      // carbs: floor(100 / 10) * 100 = 1000g
      // fat: floor(30 / 5) * 100 = 600g (limiting factor)
      // min(1000, 600) * 0.96 = 576g
      expect(result).toBe(576)
    })
  })
})
