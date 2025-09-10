import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { createRecipeRepository } from '~/modules/diet/recipe/infrastructure/recipeRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'
import {
  trackRecipeCreation,
  trackRecipeDeletion,
  trackRecipeEdit,
  trackRecipeSearch,
} from '~/shared/performance'

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
  return await trackRecipeSearch(name, String(userId), async () => {
    return await recipeRepository.fetchUserRecipeByName(userId, name)
  })
}

export async function fetchRecipeById(
  recipeId: Recipe['id'],
): Promise<Recipe | null> {
  return await recipeRepository.fetchRecipeById(recipeId)
}

export async function insertRecipe(newRecipe: NewRecipe): Promise<void> {
  await trackRecipeCreation(newRecipe, String(newRecipe.owner), async () => {
    await showPromise(
      recipeRepository.insertRecipe(newRecipe),
      {
        loading: 'Criando nova receita...',
        success: (recipe) => `Receita '${recipe?.name}' criada com sucesso`,
        error: 'Falha ao criar receita',
      },
      { context: 'user-action' },
    )
  })
}

export async function saveRecipe(newRecipe: NewRecipe): Promise<Recipe | null> {
  return await trackRecipeCreation(
    newRecipe,
    String(newRecipe.owner),
    async () => {
      return await showPromise(
        recipeRepository.insertRecipe(newRecipe),
        {
          loading: 'Salvando receita...',
          success: 'Receita salva com sucesso',
          error: 'Falha ao salvar receita',
        },
        { context: 'background' },
      )
    },
  )
}

export async function updateRecipe(
  recipeId: Recipe['id'],
  newRecipe: Recipe,
): Promise<Recipe | null> {
  return await trackRecipeEdit(
    String(recipeId),
    newRecipe,
    String(newRecipe.owner),
    async () => {
      return await showPromise(
        recipeRepository.updateRecipe(recipeId, newRecipe),
        {
          loading: 'Atualizando receita...',
          success: 'Receita atualizada com sucesso',
          error: 'Falha ao atualizar receita',
        },
        { context: 'user-action' },
      )
    },
  )
}

export async function deleteRecipe(recipeId: Recipe['id']): Promise<boolean> {
  // Note: We need userId but it's not available in this context
  // This is a limitation of the current API design
  const userId = 'unknown'

  return await trackRecipeDeletion(String(recipeId), userId, async () => {
    try {
      await showPromise(
        recipeRepository.deleteRecipe(recipeId),
        {
          loading: 'Deletando receita...',
          success: 'Receita deletada com sucesso',
          error: 'Falha ao deletar receita',
        },
        { context: 'user-action' },
      )
      return true
    } catch {
      return false
    }
  })
}
