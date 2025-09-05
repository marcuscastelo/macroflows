import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { createSupabaseRecipeRepository } from '~/modules/diet/recipe/infrastructure/supabaseRecipeRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'

const recipeRepository = createSupabaseRecipeRepository()

const errorHandler = createErrorHandler('application', 'Recipe')

export async function fetchUserRecipes(userId: User['id']) {
  try {
    return await showPromise(
      recipeRepository.fetchUserRecipes(userId),
      {
        loading: 'Carregando receitas...',
        success: 'Receitas carregadas com sucesso',
        error: 'Falha ao carregar receitas',
      },
      { context: 'background' },
    )
  } catch (error) {
    errorHandler.error(error, {
      userId,
      businessContext: { userId },
    })
    return []
  }
}

export async function fetchUserRecipeByName(userId: User['id'], name: string) {
  try {
    return await showPromise(
      recipeRepository.fetchUserRecipeByName(userId, name),
      {
        loading: 'Carregando receitas...',
        success: 'Receitas carregadas com sucesso',
        error: 'Falha ao carregar receitas',
      },
      { context: 'background' },
    )
  } catch (error) {
    errorHandler.error(error, {
      userId,
      businessContext: { userId, recipeName: name },
    })
    return []
  }
}

export async function fetchRecipeById(recipeId: Recipe['id']) {
  try {
    return await showPromise(
      recipeRepository.fetchRecipeById(recipeId),
      {
        loading: 'Carregando receita...',
        success: 'Receita carregada com sucesso',
        error: 'Falha ao carregar receita',
      },
      { context: 'background' },
    )
  } catch (error) {
    errorHandler.error(error, {
      entityId: recipeId,
      businessContext: { recipeId },
    })
    return null
  }
}

export async function insertRecipe(newRecipe: NewRecipe) {
  try {
    return await showPromise(
      recipeRepository.insertRecipe(newRecipe),
      {
        loading: 'Criando nova receita...',
        success: (recipe) => `Receita '${recipe.name}' criada com sucesso`,
        error: 'Falha ao criar receita',
      },
      { context: 'background' },
    )
  } catch (error) {
    errorHandler.error(error, {
      businessContext: {
        recipeName: newRecipe.name,
        itemsCount: newRecipe.items.length,
      },
    })
    return null
  }
}

export async function updateRecipe(recipeId: Recipe['id'], newRecipe: Recipe) {
  try {
    return await showPromise(
      recipeRepository.updateRecipe(recipeId, newRecipe),
      {
        loading: 'Atualizando receita...',
        success: 'Receita atualizada com sucesso',
        error: 'Falha ao atualizar receita',
      },
      { context: 'background' },
    )
  } catch (error) {
    errorHandler.error(error, {
      entityId: recipeId,
      businessContext: {
        recipeId,
        recipeName: newRecipe.name,
        itemsCount: newRecipe.items.length,
      },
    })
    return null
  }
}

export async function deleteRecipe(recipeId: Recipe['id']) {
  try {
    return await showPromise(
      recipeRepository.deleteRecipe(recipeId),
      {
        loading: 'Deletando receita...',
        success: 'Receita deletada com sucesso',
        error: 'Falha ao deletar receita',
      },
      { context: 'background' },
    )
  } catch (error) {
    errorHandler.error(error, {
      entityId: recipeId,
      businessContext: { recipeId },
    })
    return null
  }
}
