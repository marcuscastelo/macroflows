import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { createRecipeRepository } from '~/modules/diet/recipe/infrastructure/recipeRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'

const recipeRepository = createRecipeRepository()

export async function fetchUserRecipes(
  userId: User['id'],
): Promise<readonly Recipe[]> {
  return await recipeRepository.fetchUserRecipes(userId)
}

export async function fetchUserRecipeByName(
  userId: User['id'],
  name: string,
): Promise<readonly Recipe[]> {
  return await recipeRepository.fetchUserRecipeByName(userId, name)
}

export async function fetchRecipeById(
  recipeId: Recipe['id'],
): Promise<Recipe | null> {
  return await recipeRepository.fetchRecipeById(recipeId)
}

export async function insertRecipe(newRecipe: NewRecipe): Promise<void> {
  await showPromise(
    recipeRepository.insertRecipe(newRecipe),
    {
      loading: 'Criando nova receita...',
      success: (recipe) => `Receita '${recipe?.name}' criada com sucesso`,
      error: 'Falha ao criar receita',
    },
    { context: 'user-action', audience: 'user' },
  )
}

export async function saveRecipe(newRecipe: NewRecipe): Promise<Recipe | null> {
  return await showPromise(
    recipeRepository.insertRecipe(newRecipe),
    {
      loading: 'Salvando receita...',
      success: 'Receita salva com sucesso',
      error: 'Falha ao salvar receita',
    },
    { context: 'background', audience: 'user' },
  )
}

export async function updateRecipe(
  recipeId: Recipe['id'],
  newRecipe: Recipe,
): Promise<Recipe | null> {
  return await showPromise(
    recipeRepository.updateRecipe(recipeId, newRecipe),
    {
      loading: 'Atualizando receita...',
      success: 'Receita atualizada com sucesso',
      error: 'Falha ao atualizar receita',
    },
    { context: 'user-action', audience: 'user' },
  )
}

export async function deleteRecipe(recipeId: Recipe['id']): Promise<boolean> {
  try {
    await showPromise(
      recipeRepository.deleteRecipe(recipeId),
      {
        loading: 'Deletando receita...',
        success: 'Receita deletada com sucesso',
        error: 'Falha ao deletar receita',
      },
      { context: 'user-action', audience: 'user' },
    )
    return true
  } catch {
    return false
  }
}
