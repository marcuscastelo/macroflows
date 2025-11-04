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
export type InsertRecipeDTO = Database['public']['Tables']['recipes']['Insert']
export type UpdateRecipeDTO = Database['public']['Tables']['recipes']['Update']

function toInsertDTO(recipe: NewRecipe): InsertRecipeDTO {
  return {
    name: recipe.name,
    user_id: recipe.user_id,
    items: [...recipe.items],
    prepared_multiplier: recipe.prepared_multiplier,
  }
}

function toUpdateDTO(recipe: Recipe): UpdateRecipeDTO {
  return {
    name: recipe.name,
    user_id: recipe.user_id,
    items: [...recipe.items],
    prepared_multiplier: recipe.prepared_multiplier,
  }
}

function toDomain(dto: RecipeDTO): Recipe {
  return parseWithStack(recipeSchema, {
    ...dto,
    items: [...parseWithStack(unifiedItemSchema.array(), dto.items)],
  })
}

export const supabaseRecipeMapper = {
  toDomain,
  toInsertDTO,
  toUpdateDTO,
}
