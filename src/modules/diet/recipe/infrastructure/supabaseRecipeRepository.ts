import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { type RecipeRepository } from '~/modules/diet/recipe/domain/recipeRepository'
import { supabaseRecipeMapper } from '~/modules/diet/recipe/infrastructure/supabaseRecipeMapper'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { supabase } from '~/shared/supabase/supabase'
import { removeDiacritics } from '~/shared/utils/removeDiacritics'

const TABLE = 'recipes'

const errorHandler = createErrorHandler('infrastructure', 'Recipe')

export function createSupabaseRecipeRepository(): RecipeRepository {
  return {
    fetchUserRecipes,
    fetchRecipeById,
    fetchUserRecipeByName,
    insertRecipe,
    updateRecipe,
    deleteRecipe,
  }
}

/**
 * Fetches all recipes for a user.
 * Throws on error.
 * @param userId - The user ID
 * @returns Array of recipes
 * @throws Error on API/validation error
 */
const fetchUserRecipes = async (userId: User['id']): Promise<Recipe[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select()
      .eq('owner', userId)
    if (error !== null) {
      errorHandler.error(error)
      throw error
    }
    return data.map(supabaseRecipeMapper.toDomain)
  } catch (err) {
    errorHandler.error(err)
    throw err
  }
}

/**
 * Fetches a recipe by its ID.
 * Throws on error or if not found.
 * @param id - The recipe ID
 * @returns The recipe
 * @throws Error if not found or on API/validation error
 */
const fetchRecipeById = async (id: Recipe['id']): Promise<Recipe> => {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select()
      .eq('id', id)
      .single()

    if (error !== null) {
      errorHandler.error(error)
      throw error
    }

    return supabaseRecipeMapper.toDomain(data)
  } catch (err) {
    errorHandler.error(err)
    throw err
  }
}

/**
 * Fetches a user's recipe by name (partial, case-insensitive, diacritic-insensitive).
 * Throws on error.
 * @param userId - The user ID
 * @param name - The recipe name (partial or full)
 * @returns Array of recipes
 * @throws Error on API/validation error
 */
const fetchUserRecipeByName = async (
  userId: User['id'],
  name: Recipe['name'],
): Promise<Recipe[]> => {
  try {
    // Normalize diacritics for search
    const normalizedName = removeDiacritics(name)
    const { data, error } = await supabase
      .from(TABLE)
      .select()
      .eq('owner', userId)
      .ilike('name', `%${normalizedName}%`)
    if (error !== null) {
      errorHandler.error(error)
      throw error
    }

    return data.map(supabaseRecipeMapper.toDomain)
  } catch (err) {
    errorHandler.error(err)
    throw err
  }
}

/**
 * Inserts a new recipe.
 * Throws on error or if not created.
 * @param newRecipe - The new recipe
 * @returns The created recipe
 * @throws Error if not created or on API/validation error
 */
const insertRecipe = async (newRecipe: NewRecipe): Promise<Recipe> => {
  try {
    const createDAO = supabaseRecipeMapper.toInsertDTO(newRecipe)
    const { data, error } = await supabase
      .from(TABLE)
      .insert(createDAO)
      .select()
      .single()

    if (error !== null) {
      errorHandler.error(error)
      throw error
    }

    return supabaseRecipeMapper.toDomain(data)
  } catch (err) {
    errorHandler.error(err)
    throw err
  }
}

/**
 * Updates a recipe.
 * Throws on error or if not found after update.
 * @param recipeId - The recipe ID
 * @param newRecipe - The new recipe data
 * @returns The updated recipe
 * @throws Error if not found or on API/validation error
 */
const updateRecipe = async (
  recipeId: Recipe['id'],
  newRecipe: Recipe,
): Promise<Recipe> => {
  try {
    const updateDAO = supabaseRecipeMapper.toUpdateDTO(newRecipe)

    const { data, error } = await supabase
      .from(TABLE)
      .update(updateDAO)
      .eq('id', recipeId)
      .select()
      .single()
    if (error !== null) {
      errorHandler.error(error)
      throw error
    }

    return supabaseRecipeMapper.toDomain(data)
  } catch (err) {
    errorHandler.error(err)
    throw err
  }
}

/**
 * Deletes a recipe by ID.
 * Throws on error.
 * @param id - The recipe ID
 * @throws Error on API error
 */
const deleteRecipe = async (id: Recipe['id']): Promise<void> => {
  try {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error !== null) {
      errorHandler.error(error)
      throw error
    }
  } catch (err) {
    errorHandler.error(err)
    throw err
  }
}
