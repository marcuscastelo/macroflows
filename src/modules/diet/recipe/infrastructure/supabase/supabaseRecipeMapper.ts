import {
  type NewRecipe,
  type Recipe,
  recipeSchema,
} from '~/modules/diet/recipe/domain/recipe'
import { unifiedItemSchema } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

// Types
export type RecipeDTO = Database['public']['Tables']['recipes']['Row']
export type InsertRecipeDAO = Database['public']['Tables']['recipes']['Insert']
export type UpdateRecipeDAO = Database['public']['Tables']['recipes']['Update']

function toInsertDTO(recipe: NewRecipe): InsertRecipeDAO {
  return {
    name: recipe.name,
    owner: recipe.owner,
    items: [...recipe.items],
    prepared_multiplier: recipe.prepared_multiplier,
  }
}

function toUpdateDTO(recipe: Recipe): UpdateRecipeDAO {
  return {
    name: recipe.name,
    owner: recipe.owner,
    items: [...recipe.items],
    prepared_multiplier: recipe.prepared_multiplier,
  }
}

function toDomain(dao: RecipeDTO): Recipe {
  return parseWithStack(recipeSchema, {
    ...dao,
    items: [...parseWithStack(unifiedItemSchema.array(), dao.items)],
  })
}

export const supabaseRecipeMapper = {
  toDomain,
  toInsertDTO,
  toUpdateDTO,
}
