import { createSignal } from 'solid-js'

import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { type RecipeRepository } from '~/modules/diet/recipe/domain/recipeRepository'
import { createSupabaseRecipeGateway } from '~/modules/diet/recipe/infrastructure/supabase/supabaseRecipeGateway'
import { type User } from '~/modules/user/domain/user'
import { logging } from '~/shared/utils/logging'

const supabaseGateway = createSupabaseRecipeGateway()
const [recipes, setRecipes] = createSignal<readonly Recipe[]>([])

function upsertToCache(recipe: Recipe) {
  setRecipes((current) => {
    const existingIndex = current.findIndex((currentRecipe) => {
      return currentRecipe.id === recipe.id
    })

    if (existingIndex >= 0) {
      const updated = [...current]
      updated[existingIndex] = recipe
      return updated
    }

    return [...current, recipe]
  })
}

function removeFromCache(criteria: { by: 'id'; value: Recipe['id'] }) {
  setRecipes((current) =>
    current.filter((recipe) => recipe.id !== criteria.value),
  )
}

function findInCache(criteria: { by: 'id'; value: Recipe['id'] }) {
  const current = recipes()
  return current.find((recipe) => recipe.id === criteria.value) ?? null
}

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
      upsertToCache(recipe)
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
    const cached = findInCache({ by: 'id', value: recipeId })
    if (cached !== null) {
      return cached
    }

    const recipe = await supabaseGateway.fetchRecipeById(recipeId)
    if (recipe === null) {
      removeFromCache({ by: 'id', value: recipeId })
      return null
    }
    upsertToCache(recipe)
    return recipe
  } catch (error) {
    logging.error('Recipe error:', error)
    removeFromCache({ by: 'id', value: recipeId })
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
      upsertToCache(recipe)
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
      upsertToCache(insertedRecipe)
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
      upsertToCache(updatedRecipe)
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
    removeFromCache({ by: 'id', value: recipeId })
  } catch (error) {
    logging.error('Recipe error:', error)
  }
}
