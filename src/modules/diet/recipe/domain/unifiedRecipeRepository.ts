import {
  type NewRecipe,
  type Recipe,
} from '~/modules/diet/recipe/domain/recipe'
import { type User } from '~/modules/user/domain/user'

export type RecipeRepository = {
  fetchUserRecipes: (userId: User['uuid']) => Promise<readonly Recipe[]>
  fetchRecipeById: (id: Recipe['id']) => Promise<Recipe>
  fetchUserRecipeByName: (
    userId: User['uuid'],
    name: Recipe['name'],
  ) => Promise<readonly Recipe[]>
  insertRecipe: (newRecipe: NewRecipe) => Promise<Recipe>
  updateRecipe: (recipeId: Recipe['id'], newRecipe: Recipe) => Promise<Recipe>
  deleteRecipe: (id: Recipe['id']) => Promise<void>
}
