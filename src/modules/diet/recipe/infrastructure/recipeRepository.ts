import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { type RecipeRepository } from '~/modules/diet/recipe/domain/recipeRepository'
import { recipeCacheStore } from '~/modules/diet/recipe/infrastructure/signals/recipeCacheStore'
import { createSupabaseRecipeGateway } from '~/modules/diet/recipe/infrastructure/supabase/supabaseRecipeGateway'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

const supabaseGateway = createSupabaseRecipeGateway()

export function createRecipeRepository(): RecipeRepository {
  return {
    fetchUserRecipes,
    fetchRecipeById,
    fetchUserRecipeByName,
    insertRecipe,
    updateRecipe,
    deleteRecipe,
  }
}

async function fetchUserRecipes(
  userId: User['uuid'],
): Promise<readonly Recipe[]> {
  try {
    const recipes = await supabaseGateway.fetchUserRecipes(userId)
    for (const recipe of recipes) {
      recipeCacheStore.upsertToCache(recipe)
    }
    return recipes
  } catch (error) {
    logging.error('Recipe error:', error)
    return []
  }
}

async function fetchRecipeById(recipeId: Recipe['id']): Promise<Recipe | null> {
  try {
    // Check cache first
    const cached = recipeCacheStore.findInCache({ by: 'id', value: recipeId })
    if (cached !== null) {
      return cached
    }

    const recipe = await supabaseGateway.fetchRecipeById(recipeId)
    if (recipe === null) {
      recipeCacheStore.removeFromCache({ by: 'id', value: recipeId })
      return null
    }
    recipeCacheStore.upsertToCache(recipe)
    return recipe
  } catch (error) {
    logging.error('Recipe error:', error)
    recipeCacheStore.removeFromCache({ by: 'id', value: recipeId })
    return null
  }
}

async function fetchUserRecipeByName(
  userId: User['uuid'],
  name: Recipe['name'],
): Promise<readonly Recipe[]> {
  try {
    const recipes = await supabaseGateway.fetchUserRecipeByName(userId, name)
    for (const recipe of recipes) {
      recipeCacheStore.upsertToCache(recipe)
    }
    return recipes
  } catch (error) {
    logging.error('Recipe error:', error)
    return []
  }
}

async function insertRecipe(newRecipe: NewRecipe): Promise<Recipe | null> {
  try {
    const insertedRecipe = await supabaseGateway.insertRecipe(newRecipe)
    if (insertedRecipe !== null) {
      recipeCacheStore.upsertToCache(insertedRecipe)
    }
    return insertedRecipe
  } catch (error) {
    logging.error('Recipe error:', error)
    return null
  }
}

async function updateRecipe(
  recipeId: Recipe['id'],
  newRecipe: Recipe,
): Promise<Recipe | null> {
  try {
    const updatedRecipe = await supabaseGateway.updateRecipe(
      recipeId,
      newRecipe,
    )
    if (updatedRecipe !== null) {
      recipeCacheStore.upsertToCache(updatedRecipe)
    }
    return updatedRecipe
  } catch (error) {
    logging.error('Recipe error:', error)
    return null
  }
}

async function deleteRecipe(recipeId: Recipe['id']): Promise<void> {
  try {
    await supabaseGateway.deleteRecipe(recipeId)
    recipeCacheStore.removeFromCache({ by: 'id', value: recipeId })
  } catch (error) {
    logging.error('Recipe error:', error)
  }
}
