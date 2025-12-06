import { supabaseItemMapper } from '~/modules/diet/item/infrastructure/supabase/supabaseItemMapper'
import {
  type NewRecipe,
  type Recipe,
  recipeSchema,
} from '~/modules/diet/recipe/domain/recipe'
import { type Database } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

// Types
type RecipeDTO = Database['public']['Tables']['recipes']['Row']
type InsertRecipeDTO = Database['public']['Tables']['recipes']['Insert']
type UpdateRecipeDTO = Database['public']['Tables']['recipes']['Update']

function toInsertDTO(recipe: NewRecipe): InsertRecipeDTO {
  return {
    name: recipe.name,
    user_id: recipe.user_id,
    items: recipe.items.map((item) => supabaseItemMapper.toInsertDTO(item)),
    prepared_multiplier: recipe.prepared_multiplier,
  }
}

function toUpdateDTO(recipe: Recipe): UpdateRecipeDTO {
  return {
    name: recipe.name,
    user_id: recipe.user_id,
    items: recipe.items.map((item) => supabaseItemMapper.toUpdateDTO(item)),
    prepared_multiplier: recipe.prepared_multiplier,
  }
}

function toDomain(dto: RecipeDTO): Recipe {
  if (!Array.isArray(dto.items)) {
    throw new Error('Recipe DTO items field is not an array')
  }
  return parseWithStack(recipeSchema, {
    ...dto,
    items: dto.items.map((itemDTO) => supabaseItemMapper.toDomain(itemDTO)),
  })
}

export const supabaseRecipeMapper = {
  toDomain,
  toInsertDTO,
  toUpdateDTO,
}
