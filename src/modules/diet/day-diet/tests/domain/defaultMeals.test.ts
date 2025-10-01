import { describe, expect, it } from 'vitest'

import {
  createDefaultMeals,
  getDefaultMealNames,
} from '~/modules/diet/day-diet/domain/defaultMeals'

describe('Default Meals', () => {
  describe('getDefaultMealNames', () => {
    it('should return expected meal names for Brazilian users', () => {
      const mealNames = getDefaultMealNames()

      expect(mealNames).toEqual([
        'Café da manhã',
        'Almoço',
        'Lanche',
        'Janta',
        'Pós janta',
      ])
    })

    it('should return readonly array', () => {
      const mealNames = getDefaultMealNames()

      // TypeScript compile-time check - should be readonly
      expect(Array.isArray(mealNames)).toBe(true)
      expect(mealNames.length).toBe(5)
    })

    it('should return consistent results on multiple calls', () => {
      const firstCall = getDefaultMealNames()
      const secondCall = getDefaultMealNames()

      expect(firstCall).toEqual(secondCall)
    })
  })

  describe('createDefaultMeals', () => {
    it('should create meals with correct names and structure', () => {
      const meals = createDefaultMeals()

      expect(meals).toHaveLength(5)
      expect(meals[0]?.name).toBe('Café da manhã')
      expect(meals[1]?.name).toBe('Almoço')
      expect(meals[2]?.name).toBe('Lanche')
      expect(meals[3]?.name).toBe('Janta')
      expect(meals[4]?.name).toBe('Pós janta')
    })

    it('should create meals with empty items arrays', () => {
      const meals = createDefaultMeals()

      meals.forEach((meal) => {
        expect(meal.items).toEqual([])
        expect(Array.isArray(meal.items)).toBe(true)
      })
    })

    it('should create promoted meals with IDs', () => {
      const meals = createDefaultMeals()

      meals.forEach((meal) => {
        expect(meal.id).toBeDefined()
        expect(typeof meal.id).toBe('number')
        expect(meal.__type).toBe('Meal')
      })
    })

    it('should generate unique IDs for each meal', () => {
      const meals = createDefaultMeals()
      const ids = meals.map((meal) => meal.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(meals.length)
    })

    it('should create fresh meals on each call', () => {
      const firstBatch = createDefaultMeals()
      const secondBatch = createDefaultMeals()

      // IDs should be different (since generateId creates unique IDs)
      const firstIds = firstBatch.map((meal) => meal.id)
      const secondIds = secondBatch.map((meal) => meal.id)

      expect(firstIds).not.toEqual(secondIds)

      // But names should be the same
      const firstNames = firstBatch.map((meal) => meal.name)
      const secondNames = secondBatch.map((meal) => meal.name)
      expect(firstNames).toEqual(secondNames)
    })

    it('should create meals with correct meal schema structure', () => {
      const meals = createDefaultMeals()

      meals.forEach((meal) => {
        expect(meal).toHaveProperty('id')
        expect(meal).toHaveProperty('name')
        expect(meal).toHaveProperty('items')
        expect(meal).toHaveProperty('__type', 'Meal')

        expect(typeof meal.id).toBe('number')
        expect(typeof meal.name).toBe('string')
        expect(Array.isArray(meal.items)).toBe(true)
      })
    })
  })

  describe('Integration', () => {
    it('should create meals using the same names returned by getDefaultMealNames', () => {
      const mealNames = getDefaultMealNames()
      const meals = createDefaultMeals()

      const createdNames = meals.map((meal) => meal.name)
      expect(createdNames).toEqual([...mealNames])
    })
  })
})
