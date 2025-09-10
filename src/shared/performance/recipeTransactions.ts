import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import {
  performanceManager,
  withTransaction,
} from '~/shared/config/performance'

/**
 * Recipe Management Transaction Wrappers
 *
 * These functions wrap major recipe-related user flows with performance tracking
 */

/**
 * Track recipe creation operations
 */
export async function trackRecipeCreation<T>(
  newRecipe: NewRecipe,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'recipe.create',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_recipe_data',
          'validation',
          {
            recipeName: newRecipe.name,
            ingredientCount: newRecipe.items.length,
            hasInstructions: false, // Instructions not in schema
          },
        )

        performanceManager.addSpan(
          transactionId,
          'calculate_recipe_nutrition',
          'calculation',
          {
            ingredientCount: newRecipe.items.length,
          },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'save_recipe_to_db',
          'db.query',
          { userId, recipeName: newRecipe.name },
        )

        performanceManager.addSpan(
          transactionId,
          'update_recipe_cache',
          'cache.write',
          { userId, recipeName: newRecipe.name },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'recipe',
      itemCount: newRecipe.items.length,
    },
  )
}

/**
 * Track recipe editing operations
 */
export async function trackRecipeEdit<T>(
  recipeId: string,
  changes: Partial<Recipe>,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'recipe.edit',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_recipe_changes',
          'validation',
          {
            recipeId,
            changedFields: Object.keys(changes).join(','),
            hasNutritionChanges: Boolean(changes.items),
          },
        )

        if (changes.items) {
          performanceManager.addSpan(
            transactionId,
            'recalculate_recipe_nutrition',
            'calculation',
            {
              recipeId,
              newIngredientCount: changes.items.length,
            },
          )
        }
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'update_recipe_in_db',
          'db.query',
          { userId, recipeId },
        )

        performanceManager.addSpan(
          transactionId,
          'invalidate_recipe_cache',
          'cache.write',
          { userId, recipeId },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'recipe',
      entityId: recipeId,
    },
  )
}

/**
 * Track recipe deletion operations
 */
export async function trackRecipeDeletion<T>(
  recipeId: string,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'recipe.delete',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_recipe_deletion',
          'validation',
          { recipeId, userId },
        )

        performanceManager.addSpan(
          transactionId,
          'check_recipe_usage',
          'db.query',
          { recipeId },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'delete_recipe_from_db',
          'db.query',
          { userId, recipeId },
        )

        performanceManager.addSpan(
          transactionId,
          'remove_recipe_from_cache',
          'cache.write',
          { userId, recipeId },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'recipe',
      entityId: recipeId,
    },
  )
}

/**
 * Track recipe duplication operations
 */
export async function trackRecipeDuplication<T>(
  sourceRecipeId: string,
  newRecipeName: string,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'recipe.duplicate',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'fetch_source_recipe',
          'db.query',
          { sourceRecipeId, userId },
        )

        performanceManager.addSpan(
          transactionId,
          'validate_new_recipe_name',
          'validation',
          { newRecipeName, userId },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'create_duplicate_recipe',
          'db.query',
          { sourceRecipeId, newRecipeName, userId },
        )

        performanceManager.addSpan(
          transactionId,
          'update_recipe_cache',
          'cache.write',
          { userId, newRecipeName },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'recipe_duplicate',
      entityId: `${sourceRecipeId}_to_${newRecipeName}`,
    },
  )
}

/**
 * Track recipe addition to meal operations
 */
export async function trackRecipeAddToMeal<T>(
  recipeId: string,
  mealId: string,
  servings: number,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'recipe.add_to_meal',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'fetch_recipe_data',
          'cache.read',
          { recipeId, userId },
        )

        performanceManager.addSpan(
          transactionId,
          'calculate_scaled_nutrition',
          'calculation',
          {
            recipeId,
            servings,
            scalingFactor: servings,
          },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'add_recipe_to_meal',
          'db.query',
          { recipeId, mealId, servings },
        )

        performanceManager.addSpan(
          transactionId,
          'update_meal_cache',
          'cache.write',
          { mealId, userId },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'recipe_meal_addition',
      entityId: recipeId,
      itemCount: servings,
    },
  )
}

/**
 * Track recipe search operations
 */
export async function trackRecipeSearch<T>(
  searchQuery: string,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'search.food_by_name', // Reuse search transaction type
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'search_user_recipes',
          'db.query',
          {
            searchQuery,
            userId,
            queryLength: searchQuery.length,
          },
        )

        performanceManager.addSpan(
          transactionId,
          'filter_recipe_results',
          'calculation',
          { searchQuery, userId },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'cache_recipe_search',
          'cache.write',
          { searchQuery, userId },
        )
      }

      return result
    },
    {
      userId,
      searchQuery,
      entityType: 'recipe_search',
    },
  )
}

/**
 * Utility to track recipe calculation operations
 */
export function trackRecipeCalculation(
  transactionId: string | null,
  operation: string,
  recipeId: string,
  metadata?: Record<string, unknown>,
): void {
  if (transactionId === null) return

  performanceManager.addSpan(transactionId, operation, 'calculation', {
    recipeId,
    ...metadata,
  })
}

/**
 * Utility to track recipe database operations
 */
export function trackRecipeDbOperation(
  transactionId: string | null,
  operation: string,
  recipeId: string,
  metadata?: Record<string, unknown>,
): void {
  if (transactionId === null) return

  performanceManager.addSpan(transactionId, operation, 'db.query', {
    recipeId,
    ...metadata,
  })
}
