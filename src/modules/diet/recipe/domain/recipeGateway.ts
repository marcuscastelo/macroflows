import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { type User } from '~/modules/user/domain/user'

export type RecipeGateway = {
  fetchUserRecipes: (userId: User['id']) => Promise<readonly Recipe[]>
  fetchRecipeById: (id: Recipe['id']) => Promise<Recipe | null>
  fetchUserRecipeByName: (
    userId: User['id'],
    name: Recipe['name'],
  ) => Promise<readonly Recipe[]>
  insertRecipe: (newRecipe: NewRecipe) => Promise<Recipe | null>
  updateRecipe: (
    recipeId: Recipe['id'],
    newRecipe: Recipe,
  ) => Promise<Recipe | null>
  deleteRecipe: (id: Recipe['id']) => Promise<void>
}
