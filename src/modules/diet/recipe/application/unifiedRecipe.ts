import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { createSupabaseRecipeRepository } from '~/modules/diet/recipe/infrastructure/supabaseRecipeRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'

const unifiedRecipeRepository = createSupabaseRecipeRepository()

const errorHandler = createErrorHandler('application', 'Recipe')

export async function fetchUserRecipes(userId: User['id']) {
  try {
    return await showPromise(
      unifiedRecipeRepository.fetchUserRecipes(userId),
      {
        loading: 'Carregando receitas...',
        success: 'Receitas carregadas com sucesso',
        error: 'Falha ao carregar receitas',
      },
      { context: 'background' },
    )
  } catch (error) {
    errorHandler.error(error)
    return []
  }
}

export async function fetchUserRecipeByName(userId: User['id'], name: string) {
  try {
    return await showPromise(
      unifiedRecipeRepository.fetchUserRecipeByName(userId, name),
      {
        loading: 'Carregando receitas...',
        success: 'Receitas carregadas com sucesso',
        error: 'Falha ao carregar receitas',
      },
      { context: 'background' },
    )
  } catch (error) {
    errorHandler.error(error)
    return []
  }
}

export async function fetchRecipeById(recipeId: Recipe['id']) {
  try {
    return await showPromise(
      unifiedRecipeRepository.fetchRecipeById(recipeId),
      {
        loading: 'Carregando receita...',
        success: 'Receita carregada com sucesso',
        error: 'Falha ao carregar receita',
      },
      { context: 'background' },
    )
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

export async function saveRecipe(newRecipe: NewRecipe): Promise<Recipe | null> {
  try {
    return await showPromise(
      unifiedRecipeRepository.insertRecipe(newRecipe),
      {
        loading: 'Salvando receita...',
        success: 'Receita salva com sucesso',
        error: 'Falha ao salvar receita',
      },
      { context: 'background' },
    )
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

export async function updateRecipe(
  recipeId: Recipe['id'],
  recipe: Recipe,
): Promise<Recipe | null> {
  try {
    return await showPromise(
      unifiedRecipeRepository.updateRecipe(recipeId, recipe),
      {
        loading: 'Atualizando receita...',
        success: 'Receita atualizada com sucesso',
        error: 'Falha ao atualizar receita',
      },
      { context: 'background' },
    )
  } catch (error) {
    errorHandler.error(error)
    return null
  }
}

export async function deleteRecipe(recipeId: Recipe['id']) {
  try {
    await showPromise(
      unifiedRecipeRepository.deleteRecipe(recipeId),
      {
        loading: 'Excluindo receita...',
        success: 'Receita excluída com sucesso',
        error: 'Falha ao excluir receita',
      },
      { context: 'background' },
    )
    return true
  } catch (error) {
    errorHandler.error(error)
    return false
  }
}
