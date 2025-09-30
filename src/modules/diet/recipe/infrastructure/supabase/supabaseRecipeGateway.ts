import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { type RecipeGateway } from '~/modules/diet/recipe/domain/recipeGateway'
import { SUPABASE_TABLE_RECIPES } from '~/modules/diet/recipe/infrastructure/supabase/constants'
import { supabaseRecipeMapper } from '~/modules/diet/recipe/infrastructure/supabase/supabaseRecipeMapper'
import { type User } from '~/modules/user/domain/user'
import { supabase } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'
import { removeDiacritics } from '~/shared/utils/removeDiacritics'
import { traceDbOperation } from '~/shared/utils/tracing'

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
  userId: User['uuid'],
): Promise<readonly Recipe[]> => {
  return await traceDbOperation(
    'SELECT',
    SUPABASE_TABLE_RECIPES,
    async (span) => {
      span.setAttribute('user.id', userId)
      span.setAttribute('query.filter', 'user_id')

      try {
        const { data, error } = await supabase
          .from(SUPABASE_TABLE_RECIPES)
          .select()
          .eq('user_id', userId)
        if (error !== null) {
          logging.error('Recipe fetch error:', error)
          span.setAttribute('error', true)
          return []
        }
        const result = data.map(supabaseRecipeMapper.toDomain)
        span.setAttribute('result.count', result.length)
        return result
      } catch (err) {
        logging.error('Recipe fetch error:', err)
        span.setAttribute('error', true)
        return []
      }
    },
  )
}

/**
 * Fetches a recipe by its ID.
 * @param id - The recipe ID
 * @returns The recipe or null if not found/error
 */
const fetchRecipeById = async (id: Recipe['id']): Promise<Recipe | null> => {
  return await traceDbOperation(
    'SELECT',
    SUPABASE_TABLE_RECIPES,
    async (span) => {
      span.setAttribute('recipe.id', id)
      span.setAttribute('query.filter', 'id')

      try {
        const { data, error } = await supabase
          .from(SUPABASE_TABLE_RECIPES)
          .select()
          .eq('id', id)
          .single()

        if (error !== null) {
          logging.error('Recipe fetch error:', error)
          span.setAttribute('error', true)
          return null
        }

        span.setAttribute('recipe.found', true)
        return supabaseRecipeMapper.toDomain(data)
      } catch (err) {
        logging.error('Recipe fetch error:', err)
        span.setAttribute('error', true)
        return null
      }
    },
  )
}

/**
 * Fetches a user's recipe by name (partial, case-insensitive, diacritic-insensitive).
 * @param userId - The user ID
 * @param name - The recipe name (partial or full)
 * @returns Array of recipes or empty array on error
 */
const fetchUserRecipeByName = async (
  userId: User['uuid'],
  name: Recipe['name'],
): Promise<readonly Recipe[]> => {
  return await traceDbOperation(
    'SELECT',
    SUPABASE_TABLE_RECIPES,
    async (span) => {
      span.setAttribute('user.id', userId)
      span.setAttribute('recipe.search.query', name)
      span.setAttribute('query.filter', 'user_id,name')

      try {
        // Normalize diacritics for search
        const normalizedName = removeDiacritics(name)
        const { data, error } = await supabase
          .from(SUPABASE_TABLE_RECIPES)
          .select()
          .eq('user_id', userId)
          .ilike('name', `%${normalizedName}%`)
        if (error !== null) {
          logging.error('Recipe fetch error:', error)
          span.setAttribute('error', true)
          return []
        }

        const result = data.map(supabaseRecipeMapper.toDomain)
        span.setAttribute('result.count', result.length)
        return result
      } catch (err) {
        logging.error('Recipe fetch error:', err)
        span.setAttribute('error', true)
        return []
      }
    },
  )
}

/**
 * Inserts a new recipe.
 * @param newRecipe - The new recipe
 * @returns The created recipe or null on error
 */
const insertRecipe = async (newRecipe: NewRecipe): Promise<Recipe | null> => {
  return await traceDbOperation(
    'INSERT',
    SUPABASE_TABLE_RECIPES,
    async (span) => {
      span.setAttribute('recipe.name', newRecipe.name)
      span.setAttribute('user.id', newRecipe.userId)

      try {
        const createDAO = supabaseRecipeMapper.toInsertDTO(newRecipe)
        const { data, error } = await supabase
          .from(SUPABASE_TABLE_RECIPES)
          .insert(createDAO)
          .select()
          .single()

        if (error !== null) {
          logging.error('Recipe fetch error:', error)
          span.setAttribute('error', true)
          return null
        }

        const result = supabaseRecipeMapper.toDomain(data)
        span.setAttribute('recipe.id', result.id)
        return result
      } catch (err) {
        logging.error('Recipe fetch error:', err)
        span.setAttribute('error', true)
        return null
      }
    },
  )
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
  return await traceDbOperation(
    'UPDATE',
    SUPABASE_TABLE_RECIPES,
    async (span) => {
      span.setAttribute('recipe.id', recipeId)
      span.setAttribute('recipe.name', newRecipe.name)

      try {
        const updateDAO = supabaseRecipeMapper.toUpdateDTO(newRecipe)

        const { data, error } = await supabase
          .from(SUPABASE_TABLE_RECIPES)
          .update(updateDAO)
          .eq('id', recipeId)
          .select()
          .single()
        if (error !== null) {
          logging.error('Recipe fetch error:', error)
          span.setAttribute('error', true)
          return null
        }

        span.setAttribute('recipe.updated', true)
        return supabaseRecipeMapper.toDomain(data)
      } catch (err) {
        logging.error('Recipe fetch error:', err)
        span.setAttribute('error', true)
        return null
      }
    },
  )
}

/**
 * Deletes a recipe by ID.
 * @param id - The recipe ID
 */
const deleteRecipe = async (id: Recipe['id']): Promise<void> => {
  await traceDbOperation('DELETE', SUPABASE_TABLE_RECIPES, async (span) => {
    span.setAttribute('recipe.id', id)

    try {
      const { error } = await supabase
        .from(SUPABASE_TABLE_RECIPES)
        .delete()
        .eq('id', id)
      if (error !== null) {
        logging.error('Recipe fetch error:', error)
        span.setAttribute('error', true)
      } else {
        span.setAttribute('recipe.deleted', true)
      }
    } catch (err) {
      logging.error('Recipe fetch error:', err)
      span.setAttribute('error', true)
    }
  })
}

