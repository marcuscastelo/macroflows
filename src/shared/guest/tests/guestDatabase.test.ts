import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import {
  clearGuestDatabase,
  getGuestDatabase,
  loadGuestDatabase,
  resetGuestDatabase,
  updateGuestDatabase,
} from '~/shared/guest/guestDatabase'

describe('GuestDatabase', () => {
  beforeEach(() => {
    clearGuestDatabase()
  })

  afterEach(() => {
    clearGuestDatabase()
  })

  describe('loadGuestDatabase', () => {
    it('should create a seeded database on first load', () => {
      const db = loadGuestDatabase()

      expect(db).toBeDefined()
      expect(db.user).toBeDefined()
      expect(db.user.uuid).toBe(GUEST_USER_ID)
      expect(db.user.name).toBe('Usuário Demo')
      expect(db.foods).toBeDefined()
      expect(db.foods.length).toBeGreaterThan(0)
      expect(db.dayDiets).toBeDefined()
      expect(db.dayDiets.length).toBeGreaterThan(0)
      expect(db.weights).toBeDefined()
      expect(db.weights.length).toBeGreaterThan(0)
      expect(db.macroProfiles).toBeDefined()
      expect(db.macroProfiles.length).toBeGreaterThan(0)
    })

    it('should return the same database on subsequent calls', () => {
      const db1 = loadGuestDatabase()
      const db2 = loadGuestDatabase()

      expect(db1).toBe(db2)
    })
  })

  describe('getGuestDatabase', () => {
    it('should return the current database', () => {
      loadGuestDatabase() // Initialize
      const db = getGuestDatabase()

      expect(db).toBeDefined()
      expect(db.user).toBeDefined()
    })

    it('should load database if not initialized', () => {
      const db = getGuestDatabase()

      expect(db).toBeDefined()
      expect(db.user.uuid).toBe(GUEST_USER_ID)
    })
  })

  describe('updateGuestDatabase', () => {
    it('should update the database', () => {
      loadGuestDatabase()

      updateGuestDatabase((db) => ({
        ...db,
        user: { ...db.user, name: 'Updated Name' },
      }))

      const db = getGuestDatabase()
      expect(db.user.name).toBe('Updated Name')
    })

    it('should add new day diet', () => {
      const db = loadGuestDatabase()
      const initialDayCount = db.dayDiets.length

      updateGuestDatabase((db) => ({
        ...db,
        dayDiets: [...db.dayDiets, db.dayDiets[0]!],
      }))

      expect(getGuestDatabase().dayDiets.length).toBe(initialDayCount + 1)
    })
  })

  describe('resetGuestDatabase', () => {
    it('should reset database to initial seeded state', () => {
      loadGuestDatabase()

      // Modify the database
      updateGuestDatabase((db) => ({
        ...db,
        user: { ...db.user, name: 'Modified Name' },
        dayDiets: [],
      }))

      // Verify modification
      expect(getGuestDatabase().user.name).toBe('Modified Name')
      expect(getGuestDatabase().dayDiets.length).toBe(0)

      // Reset
      resetGuestDatabase()

      // Verify reset
      const db = getGuestDatabase()
      expect(db.user.name).toBe('Usuário Demo')
      expect(db.dayDiets.length).toBeGreaterThan(0)
    })
  })

  describe('demo data content', () => {
    it('should have demo foods with valid macros', () => {
      const db = loadGuestDatabase()

      for (const food of db.foods) {
        const macrosExt = MacroNutrientsExt.of(food.macros)
        expect(food.name).toBeDefined()
        expect(food.macros).toBeDefined()
        expect(typeof macrosExt.carbsInGrams()).toBe('number')
        expect(typeof macrosExt.proteinInGrams()).toBe('number')
        expect(typeof macrosExt.fatInGrams()).toBe('number')
      }
    })

    it('should have at least 10 demo foods', () => {
      const db = loadGuestDatabase()
      expect(db.foods.length).toBeGreaterThanOrEqual(10)
    })

    it('should have demo day with meals and items', () => {
      const db = loadGuestDatabase()

      expect(db.dayDiets.length).toBeGreaterThan(0)
      const day = db.dayDiets[0]!

      expect(day.user_id).toBe(GUEST_USER_ID)
      expect(day.target_day).toBeDefined()
      expect(day.meals.length).toBeGreaterThan(0)

      for (const meal of day.meals) {
        expect(meal.name).toBeDefined()
        expect(meal.items).toBeDefined()
      }
    })

    it('should have demo meals with Brazilian names', () => {
      const db = loadGuestDatabase()
      const day = db.dayDiets[0]!

      const mealNames = day.meals.map((m) => m.name)
      expect(mealNames).toContain('Café da manhã')
      expect(mealNames).toContain('Almoço')
    })

    it('should have demo weights for the past week', () => {
      const db = loadGuestDatabase()

      expect(db.weights.length).toBe(7)

      for (const weight of db.weights) {
        expect(weight.user_id).toBe(GUEST_USER_ID)
        expect(weight.weight).toBeGreaterThan(0)
        expect(weight.target_timestamp).toBeDefined()
      }
    })

    it('should have a demo macro profile', () => {
      const db = loadGuestDatabase()

      expect(db.macroProfiles.length).toBeGreaterThan(0)
      const profile = db.macroProfiles[0]!

      expect(profile.user_id).toBe(GUEST_USER_ID)
      expect(profile.gramsPerKgCarbs).toBeGreaterThan(0)
      expect(profile.gramsPerKgProtein).toBeGreaterThan(0)
      expect(profile.gramsPerKgFat).toBeGreaterThan(0)
    })
  })
})
