import { describe, expect, it } from 'vitest'

import { createNewMeal, promoteMeal } from '~/modules/diet/meal/domain/meal'
import {
  createNewRecipe,
  promoteRecipe,
} from '~/modules/diet/recipe/domain/recipe'
import {
  createMealExport,
  createRecipeExport,
} from '~/modules/import-export/application/exportUtils'
import {
  generateUniqueId,
  regenerateMealIds,
  regenerateRecipeIds,
} from '~/modules/import-export/application/idRegeneration'
import {
  generateImportPreview,
  validateImportPayload,
} from '~/modules/import-export/application/importValidation'
import { EXPORT_SCHEMA_VERSION } from '~/modules/import-export/domain/exportPayload'

describe('Import/Export Module', () => {
  describe('ID Regeneration', () => {
    it('should generate unique IDs', () => {
      const generatedIds = Array.from({ length: 100_000 }, () =>
        generateUniqueId(),
      )

      expect(new Set(generatedIds).size).toBe(generatedIds.length)
      expect(generatedIds.every((id) => Number.isSafeInteger(id))).toBe(true)
    })

    it('should regenerate meal IDs', () => {
      const meal = promoteMeal(
        createNewMeal({
          name: 'Test Meal',
          items: [],
        }),
        { id: 1 },
      )

      const regenerated = regenerateMealIds(meal)
      expect(regenerated.id).not.toBe(meal.id)
      expect(regenerated.name).toBe(meal.name)
    })

    it('should regenerate recipe IDs', () => {
      const recipe = promoteRecipe(
        createNewRecipe({
          name: 'Test Recipe',
          items: [],
          user_id: 'test-user',
          prepared_multiplier: 1,
        }),
        { id: 1 },
      )

      const regenerated = regenerateRecipeIds(recipe)
      expect(regenerated.id).not.toBe(recipe.id)
      expect(regenerated.name).toBe(recipe.name)
    })
  })

  describe('Export Utilities', () => {
    it('should create meal export with correct metadata', () => {
      const meal = promoteMeal(
        createNewMeal({
          name: 'Test Meal',
          items: [],
        }),
        { id: 1 },
      )

      const payload = createMealExport(meal)
      expect(payload.metadata.scope).toBe('meal')
      expect(payload.metadata.schemaVersion).toBe(EXPORT_SCHEMA_VERSION)
      expect(payload.data.name).toBe('Test Meal')
    })

    it('should create recipe export with correct metadata', () => {
      const recipe = promoteRecipe(
        createNewRecipe({
          name: 'Test Recipe',
          items: [],
          user_id: 'test-user',
          prepared_multiplier: 2,
        }),
        { id: 1 },
      )

      const payload = createRecipeExport(recipe)
      expect(payload.metadata.scope).toBe('recipe')
      expect(payload.metadata.schemaVersion).toBe(EXPORT_SCHEMA_VERSION)
      expect(payload.data.name).toBe('Test Recipe')
      expect(payload.data.prepared_multiplier).toBe(2)
    })
  })

  describe('Import Validation', () => {
    it('should fail on empty input', () => {
      const result = validateImportPayload('')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })

    it('should fail on invalid JSON', () => {
      const result = validateImportPayload('not valid json')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0)
        const errorCode = result.errors[0]?.code
        expect(errorCode).toBe('invalid_json')
      }
    })

    it('should fail on missing metadata', () => {
      const result = validateImportPayload('{"data": {}}')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0)
        const errorCode = result.errors[0]?.code
        expect(errorCode).toBe('missing_metadata')
      }
    })

    it('should validate correct meal export payload', () => {
      const meal = promoteMeal(
        createNewMeal({
          name: 'Test Meal',
          items: [],
        }),
        { id: 1 },
      )
      const payload = createMealExport(meal)
      const jsonString = JSON.stringify(payload)

      const result = validateImportPayload(jsonString)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata.scope).toBe('meal')
      }
    })

    it('should validate correct recipe export payload', () => {
      const recipe = promoteRecipe(
        createNewRecipe({
          name: 'Test Recipe',
          items: [],
          user_id: 'test-user',
          prepared_multiplier: 1,
        }),
        { id: 1 },
      )
      const payload = createRecipeExport(recipe)
      const jsonString = JSON.stringify(payload)

      const result = validateImportPayload(jsonString)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata.scope).toBe('recipe')
      }
    })
  })

  describe('Import Preview', () => {
    it('should generate preview for meal payload', () => {
      const meal = promoteMeal(
        createNewMeal({
          name: 'Test Meal',
          items: [],
        }),
        { id: 1 },
      )
      const payload = createMealExport(meal)

      const preview = generateImportPreview(payload)
      expect(preview.scope).toBe('meal')
      expect(preview.scopeLabel).toBe('Refeição')
      expect(preview.summary).toContain('Test Meal')
      expect(preview.itemCount).toBe(0)
    })

    it('should generate preview for recipe payload', () => {
      const recipe = promoteRecipe(
        createNewRecipe({
          name: 'Test Recipe',
          items: [],
          user_id: 'test-user',
          prepared_multiplier: 2,
        }),
        { id: 1 },
      )
      const payload = createRecipeExport(recipe)

      const preview = generateImportPreview(payload)
      expect(preview.scope).toBe('recipe')
      expect(preview.scopeLabel).toBe('Receita')
      expect(preview.summary).toContain('Test Recipe')
      expect(preview.details).toContainEqual(expect.stringContaining('2x'))
    })
  })
})
