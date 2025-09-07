import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { type RecipeGateway } from '~/modules/diet/recipe/domain/recipeGateway'
import { SUPABASE_TABLE_RECIPES } from '~/modules/diet/recipe/infrastructure/supabase/constants'
import { supabaseRecipeMapper } from '~/modules/diet/recipe/infrastructure/supabase/supabaseRecipeMapper'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { supabase } from '~/shared/supabase/supabase'
import { removeDiacritics } from '~/shared/utils/removeDiacritics'

const errorHandler = createErrorHandler('infrastructure', 'Recipe')

export function createSupabaseRecipeGateway(): RecipeGateway {
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
 * @param userId - The user ID
 * @returns Array of recipes or empty array on error
 */
const fetchUserRecipes = async (
  userId: User['id'],
): Promise<readonly Recipe[]> => {
  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_RECIPES)
      .select()
      .eq('owner', userId)
    if (error !== null) {
      errorHandler.error(error)
      return []
    }
    return data.map(supabaseRecipeMapper.toDomain)
  } catch (err) {
    errorHandler.error(err)
    return []
  }
}

/**
 * Fetches a recipe by its ID.
 * @param id - The recipe ID
 * @returns The recipe or null if not found/error
 */
const fetchRecipeById = async (id: Recipe['id']): Promise<Recipe | null> => {
  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_RECIPES)
      .select()
      .eq('id', id)
      .single()

    if (error !== null) {
      errorHandler.error(error)
      return null
    }

    return supabaseRecipeMapper.toDomain(data)
  } catch (err) {
    errorHandler.error(err)
    return null
  }
}

/**
 * Fetches a user's recipe by name (partial, case-insensitive, diacritic-insensitive).
 * @param userId - The user ID
 * @param name - The recipe name (partial or full)
 * @returns Array of recipes or empty array on error
 */
const fetchUserRecipeByName = async (
  userId: User['id'],
  name: Recipe['name'],
): Promise<readonly Recipe[]> => {
  try {
    // Normalize diacritics for search
    const normalizedName = removeDiacritics(name)
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_RECIPES)
      .select()
      .eq('owner', userId)
      .ilike('name', `%${normalizedName}%`)
    if (error !== null) {
      errorHandler.error(error)
      return []
    }

    return data.map(supabaseRecipeMapper.toDomain)
  } catch (err) {
    errorHandler.error(err)
    return []
  }
}

/**
 * Inserts a new recipe.
 * @param newRecipe - The new recipe
 * @returns The created recipe or null on error
 */
const insertRecipe = async (newRecipe: NewRecipe): Promise<Recipe | null> => {
  try {
    const createDAO = supabaseRecipeMapper.toInsertDTO(newRecipe)
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_RECIPES)
      .insert(createDAO)
      .select()
      .single()

    if (error !== null) {
      errorHandler.error(error)
      return null
    }

    return supabaseRecipeMapper.toDomain(data)
  } catch (err) {
    errorHandler.error(err)
    return null
  }
}

/**
 * Updates a recipe.
 * @param recipeId - The recipe ID
 * @param newRecipe - The new recipe data
 * @returns The updated recipe or null on error
 */
const updateRecipe = async (
  recipeId: Recipe['id'],
  newRecipe: Recipe,
): Promise<Recipe | null> => {
  try {
    const updateDAO = supabaseRecipeMapper.toUpdateDTO(newRecipe)

    const { data, error } = await supabase
      .from(SUPABASE_TABLE_RECIPES)
      .update(updateDAO)
      .eq('id', recipeId)
      .select()
      .single()
    if (error !== null) {
      errorHandler.error(error)
      return null
    }

    return supabaseRecipeMapper.toDomain(data)
  } catch (err) {
    errorHandler.error(err)
    return null
  }
}

/**
 * Deletes a recipe by ID.
 * @param id - The recipe ID
 */
const deleteRecipe = async (id: Recipe['id']): Promise<void> => {
  try {
    const { error } = await supabase
      .from(SUPABASE_TABLE_RECIPES)
      .delete()
      .eq('id', id)
    if (error !== null) {
      errorHandler.error(error)
    }
  } catch (err) {
    errorHandler.error(err)
  }
}
