import { describe, expect, it } from 'vitest'

import {
  createNewFood,
  demoteFoodToNewFood,
  type Food,
  foodSchema,
  type NewFood,
  promoteNewFoodToFood,
} from '~/modules/diet/food/domain/food'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

describe('Food Domain', () => {
  describe('foodSchema', () => {
    it('should transform null source to undefined', () => {
      const foodWithNullSource = {
        id: 1,
        name: 'Orange',
        ean: null,
        source: null,
        macros: createMacroNutrients({
          proteinInGrams: 1.1,
          carbsInGrams: 22.8,
          fatInGrams: 0.3,
        }),
        __type: 'Food',
      }

      const result = foodSchema.safeParse(foodWithNullSource)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.source).toBeUndefined()
      }
    })
  })

  describe('createNewFood', () => {
    it('should create a valid NewFood with all fields', () => {
      const foodProps = {
        name: 'Banana',
        ean: '1234567890123',
        source: {
          type: 'api' as const,
          id: 'api-123',
        },
        macros: createMacroNutrients({
          proteinInMg: 1100,
          carbsInMg: 22800,
          fatInMg: 300,
        }),
      } satisfies Omit<NewFood, '__type'>

      const newFood = createNewFood(foodProps)
      const macrosExt = MacroNutrientsExt.of(newFood.macros)

      expect(newFood.name).toBe('Banana')
      expect(newFood.ean).toBe('1234567890123')
      expect(newFood.source).toEqual({
        type: 'api',
        id: 'api-123',
      })
      expect(macrosExt.proteinInGrams()).toBe(1.1)
      expect(macrosExt.carbsInGrams()).toBe(22.8)
      expect(macrosExt.fatInGrams()).toBe(0.3)
      expect(newFood.__type).toBe('NewFood')
    })

    it('should create a valid NewFood with minimal fields', () => {
      const foodProps = {
        name: 'Apple',
        ean: null,
        macros: createMacroNutrients({
          proteinInGrams: 1.1,
          carbsInGrams: 22.8,
          fatInGrams: 0.3,
        }),
      }

      const newFood = createNewFood(foodProps)
      const macrosExt = MacroNutrientsExt.of(newFood.macros)

      expect(newFood.name).toBe('Apple')
      expect(newFood.ean).toBeNull()
      expect(newFood.source).toBeUndefined()
      expect(macrosExt.fatInGrams()).toBe(0.3)
      expect(newFood.__type).toBe('NewFood')
    })
  })

  describe('promoteNewFoodToFood', () => {
    it('should promote NewFood to Food', () => {
      const newFood: NewFood = {
        name: 'Banana',
        ean: '1234567890123',
        source: {
          type: 'api',
          id: 'api-123',
        },
        macros: createMacroNutrients({
          proteinInMg: 1100,
          carbsInMg: 22800,
          fatInMg: 300,
        }),
        __type: 'NewFood',
      }

      const food = promoteNewFoodToFood(newFood, { id: 123 })
      const macrosExt = MacroNutrientsExt.of(food.macros)

      expect(food.id).toBe(123)
      expect(food.name).toBe('Banana')
      expect(food.ean).toBe('1234567890123')
      expect(food.source).toEqual({
        type: 'api',
        id: 'api-123',
      })
      expect(macrosExt.proteinInGrams()).toBe(1.1)
      expect(macrosExt.carbsInGrams()).toBe(22.8)
      expect(macrosExt.fatInGrams()).toBe(0.3)
      expect(food.__type).toBe('Food')
    })

    it('should handle different ID values', () => {
      const newFood: NewFood = {
        name: 'Apple',
        ean: null,
        macros: createMacroNutrients({
          proteinInMg: 1100,
          carbsInMg: 22800,
          fatInMg: 300,
        }),
        __type: 'NewFood',
      }

      const testIds = [1, 42, 999, 123456, 2147483647]

      testIds.forEach((id) => {
        const food = promoteNewFoodToFood(newFood, { id })
        expect(food.id).toBe(id)
        expect(food.__type).toBe('Food')
        expect(food.name).toBe('Apple')
      })
    })

    it('should preserve all original properties', () => {
      const newFood: NewFood = {
        name: 'Complex Food Item',
        ean: '9876543210987',
        source: {
          type: 'api',
          id: 'complex-api-id-123',
        },
        macros: createMacroNutrients({
          proteinInMg: 1100,
          carbsInMg: 22800,
          fatInMg: 300,
        }),
        __type: 'NewFood',
      }
      const macrosExtNewFood = MacroNutrientsExt.of(newFood.macros)

      const food = promoteNewFoodToFood(newFood, { id: 999 })
      const macrosExt = MacroNutrientsExt.of(food.macros)

      expect(food.id).toBe(999)
      expect(food.name).toBe(newFood.name)
      expect(food.ean).toBe(newFood.ean)
      expect(food.source).toEqual(newFood.source)
      expect(macrosExt.proteinInGrams()).toBe(macrosExtNewFood.proteinInGrams())
      expect(macrosExt.carbsInGrams()).toBe(macrosExtNewFood.carbsInGrams())
      expect(macrosExt.fatInGrams()).toBe(macrosExtNewFood.fatInGrams())
      expect(food.__type).toBe('Food')
    })
  })

  describe('demoteFoodToNewFood', () => {
    it('should demote Food to NewFood', () => {
      const food: Food = {
        id: 123,
        name: 'Banana',
        ean: '1234567890123',
        source: {
          type: 'api',
          id: 'api-123',
        },
        macros: createMacroNutrients({
          proteinInMg: 1100,
          carbsInMg: 22800,
          fatInMg: 300,
        }),
        __type: 'Food',
      }

      const newFood = demoteFoodToNewFood(food)
      const macrosExt = MacroNutrientsExt.of(newFood.macros)

      expect(newFood.name).toBe('Banana')
      expect(newFood.ean).toBe('1234567890123')
      expect(newFood.source).toEqual({
        type: 'api',
        id: 'api-123',
      })
      expect(macrosExt.proteinInGrams()).toBe(1.1)
      expect(macrosExt.carbsInGrams()).toBe(22.8)
      expect(macrosExt.fatInGrams()).toBe(0.3)
      expect(newFood.__type).toBe('NewFood')
      expect('id' in newFood).toBe(false)
    })

    it('should handle food with minimal fields', () => {
      const food: Food = {
        id: 456,
        name: 'Apple',
        ean: null,
        macros: createMacroNutrients({
          proteinInMg: 1100,
          carbsInMg: 22800,
          fatInMg: 300,
        }),
        __type: 'Food',
      }

      const newFood = demoteFoodToNewFood(food)
      const macrosExt = MacroNutrientsExt.of(newFood.macros)

      expect(newFood.name).toBe('Apple')
      expect(newFood.ean).toBeNull()
      expect(newFood.source).toBeUndefined()
      expect(macrosExt.fatInGrams()).toBe(0.3)
      expect(newFood.__type).toBe('NewFood')
      expect('id' in newFood).toBe(false)
    })

    it('should preserve all original properties except id', () => {
      const food: Food = {
        id: 789,
        name: 'Complex Food Item',
        ean: '9876543210987',
        source: {
          type: 'api',
          id: 'complex-api-id-123',
        },
        macros: createMacroNutrients({
          proteinInMg: 1100,
          carbsInMg: 22800,
          fatInMg: 300,
        }),
        __type: 'Food',
      }
      const macrosExtFood = MacroNutrientsExt.of(food.macros)

      const newFood = demoteFoodToNewFood(food)
      const macrosExt = MacroNutrientsExt.of(newFood.macros)

      expect(newFood.name).toBe(food.name)
      expect(newFood.ean).toBe(food.ean)
      expect(newFood.source).toEqual(food.source)
      expect(macrosExt.proteinInGrams()).toBe(macrosExtFood.proteinInGrams())
      expect(macrosExt.carbsInGrams()).toBe(macrosExtFood.carbsInGrams())
      expect(macrosExt.fatInGrams()).toBe(macrosExtFood.fatInGrams())
      expect(newFood.__type).toBe('NewFood')
      expect('id' in newFood).toBe(false)
    })
  })
})

describe('Schema compatibility', () => {
  it('should be compatible with objects parsed from JSON', () => {
    const jsonData = {
      id: 1,
      name: 'JSON Test Food',
      ean: '1234567890123',
      source: {
        type: 'api',
        id: 'json-api-123',
      },
      macros: createMacroNutrients({
        proteinInGrams: 1.1,
        carbsInGrams: 22.8,
        fatInGrams: 0.3,
      }),
    }

    const result = foodSchema.safeParse(jsonData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('JSON Test Food')
      expect(result.data.source?.type).toBe('api')
    }
  })

  it('should be compatible with database row objects', () => {
    const dbRow = {
      id: 1,
      name: 'Database Test Food',
      ean: '1234567890123',
      source: {
        type: 'api',
        id: 'db-api-123',
      },
      macros: createMacroNutrients({
        proteinInGrams: 1.1,
        carbsInGrams: 22.8,
        fatInGrams: 0.3,
      }),
      created_at: new Date(), // Extra field that should be stripped
      updated_at: new Date(), // Extra field that should be stripped
    }

    const result = foodSchema.safeParse(dbRow)
    expect(result.success).toBe(true)
    if (result.success) {
      expect('created_at' in result.data).toBe(false)
      expect('updated_at' in result.data).toBe(false)
    }
  })

  it('should handle different source API formats', () => {
    const sourceFormats = [
      { type: 'api', id: 'simple-id' },
      { type: 'api', id: 'complex-id-with-dashes-123' },
      { type: 'api', id: 'nutritionix_food_item_456' },
      { type: 'api', id: 'usda-sr-legacy-789' },
    ]

    sourceFormats.forEach((source, index) => {
      const food = {
        id: index + 1,
        name: `API Test ${index + 1}`,
        ean: null,
        source,
        macros: createMacroNutrients({
          proteinInGrams: 1.1,
          carbsInGrams: 22.8,
          fatInGrams: 0.3,
        }),
      }

      const result = foodSchema.safeParse(food)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.source).toEqual(source)
      }
    })
  })
})
