import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { type RecipeRepository } from '~/modules/diet/recipe/domain/recipeRepository'
import { createRecipeRepository } from '~/modules/diet/recipe/infrastructure/recipeRepository'
import { showPromise } from '~/modules/toast/application/toastManager'
import { type User } from '~/modules/user/domain/user'

/**
 * Factory that returns recipe-related use-cases with injected dependencies.
 * @param deps.repository - provider for the RecipeRepository implementation
 */
export function createRecipeCrud(deps: { repository: () => RecipeRepository }) {
  const recipeRepository = deps.repository()

  return {
    async fetchUserRecipes(userId: User['uuid']): Promise<readonly Recipe[]> {
      return await recipeRepository.fetchUserRecipes(userId)
    },

    async fetchUserRecipeByName(
      userId: User['uuid'],
      name: string,
    ): Promise<readonly Recipe[]> {
      return await recipeRepository.fetchUserRecipeByName(userId, name)
    },

    async fetchRecipeById(recipeId: Recipe['id']): Promise<Recipe | null> {
      return await recipeRepository.fetchRecipeById(recipeId)
    },

    async insertRecipe(newRecipe: NewRecipe): Promise<void> {
      await showPromise(
        recipeRepository.insertRecipe(newRecipe),
        {
          loading: 'Criando nova receita...',
          success: (recipe) => `Receita '${recipe?.name}' criada com sucesso`,
          error: 'Falha ao criar receita',
        },
        { context: 'user-action' },
      )
    },

    async saveRecipe(newRecipe: NewRecipe): Promise<Recipe | null> {
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

    async updateRecipe(
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
        { context: 'user-action' },
      )
    },

    async deleteRecipe(recipeId: Recipe['id']): Promise<boolean> {
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
    },
  }
}

/**
 * Convenience type for the concrete use-cases returned by the factory.
 */
export type RecipeCrud = ReturnType<typeof createRecipeCrud>

/**
 * Backward-compatible default instance (shim) used by legacy consumers.
 * Keeps existing imports working while migrating to the container.
 * TODO: Remove DI shims and use proper container/use-case injection.
 */
const defaultRepository = createRecipeRepository()
export const recipeCrud = createRecipeCrud({
  repository: () => defaultRepository,
})

/**
 * Backward-compatible named exports (function shims) so existing imports keep working.
 * These delegate to the default `recipeCrud` instance.
 * TODO: Remove DI shims and use proper container/use-case injection.
 */
export const fetchUserRecipes = async (
  userId: User['uuid'],
): Promise<readonly Recipe[]> => {
  return await recipeCrud.fetchUserRecipes(userId)
}

export const fetchUserRecipeByName = async (
  userId: User['uuid'],
  name: string,
): Promise<readonly Recipe[]> => {
  return await recipeCrud.fetchUserRecipeByName(userId, name)
}

export const fetchRecipeById = async (
  recipeId: Recipe['id'],
): Promise<Recipe | null> => {
  return await recipeCrud.fetchRecipeById(recipeId)
}

export const insertRecipe = async (newRecipe: NewRecipe): Promise<void> => {
  return await recipeCrud.insertRecipe(newRecipe)
}

export const saveRecipe = async (
  newRecipe: NewRecipe,
): Promise<Recipe | null> => {
  return await recipeCrud.saveRecipe(newRecipe)
}

export const updateRecipe = async (
  recipeId: Recipe['id'],
  newRecipe: Recipe,
): Promise<Recipe | null> => {
  return await recipeCrud.updateRecipe(recipeId, newRecipe)
}

export const deleteRecipe = async (
  recipeId: Recipe['id'],
): Promise<boolean> => {
  return await recipeCrud.deleteRecipe(recipeId)
}
