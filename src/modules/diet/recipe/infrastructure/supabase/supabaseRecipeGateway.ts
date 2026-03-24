import {
  isFoodItem,
  type Item,
  itemSchema,
} from '~/modules/diet/item/schema/itemSchema'
import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import {
  type NewRecipe,
  type Recipe,
  recipeSchema,
} from '~/modules/diet/recipe/domain/recipe'
import { type RecipeGateway } from '~/modules/diet/recipe/domain/recipeGateway'
import { type User } from '~/modules/user/domain/user'
import { type Database, type Json } from '~/shared/supabase/database.types'
import { supabase } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'
import { removeDiacritics } from '~/shared/utils/removeDiacritics'

const SUPABASE_TABLE_RECIPES = 'recipes'

function macrosToDomain(macrosDTO: Json) {
  if (
    macrosDTO === null ||
    !(typeof macrosDTO === 'object') ||
    !('carbs' in macrosDTO) ||
    !('protein' in macrosDTO) ||
    !('fat' in macrosDTO) ||
    typeof macrosDTO.carbs !== 'number' ||
    typeof macrosDTO.protein !== 'number' ||
    typeof macrosDTO.fat !== 'number'
  ) {
    throw new Error(
      'macrosDTO is missing macros field: ' + JSON.stringify(macrosDTO),
    )
  }

  return createMacroNutrients({
    carbsInMg: macrosDTO.carbs * 1000,
    proteinInMg: macrosDTO.protein * 1000,
    fatInMg: macrosDTO.fat * 1000,
  })
}

function macrosToDTO(macroNutrients: MacroNutrients): Json {
  return {
    carbs: macroNutrients.carbsInMg / 1000,
    protein: macroNutrients.proteinInMg / 1000,
    fat: macroNutrients.fatInMg / 1000,
  }
}

function itemToDomain(itemDTO: Json): Item {
  if (
    itemDTO === null ||
    !(typeof itemDTO === 'object') ||
    !('id' in itemDTO) ||
    !('name' in itemDTO) ||
    !('quantity' in itemDTO) ||
    !('reference' in itemDTO) ||
    typeof itemDTO.id !== 'number' ||
    typeof itemDTO.name !== 'string' ||
    typeof itemDTO.quantity !== 'number' ||
    typeof itemDTO.reference !== 'object' ||
    itemDTO.reference === null ||
    Array.isArray(itemDTO.reference) ||
    !('type' in itemDTO.reference)
  ) {
    throw new Error(
      'Item DTO is missing required fields: ' + JSON.stringify(itemDTO),
    )
  }

  const referenceType = itemDTO.reference.type
  if (
    referenceType === 'food' &&
    (!('id' in itemDTO.reference) ||
      typeof itemDTO.reference.id !== 'number' ||
      !('macros' in itemDTO.reference) ||
      typeof itemDTO.reference.macros !== 'object' ||
      itemDTO.reference.macros === null)
  ) {
    throw new Error(
      'Food Item DTO reference is missing required fields: ' +
        JSON.stringify(itemDTO.reference),
    )
  } else if (
    referenceType === 'recipe' &&
    (!('id' in itemDTO.reference) ||
      typeof itemDTO.reference.id !== 'number' ||
      !('children' in itemDTO.reference) ||
      !Array.isArray(itemDTO.reference.children))
  ) {
    throw new Error(
      'Recipe Item DTO reference is missing required fields: ' +
        JSON.stringify(itemDTO.reference),
    )
  } else if (
    referenceType === 'group' &&
    (!('children' in itemDTO.reference) ||
      !Array.isArray(itemDTO.reference.children))
  ) {
    throw new Error(
      'Group Item DTO reference is missing required fields: ' +
        JSON.stringify(itemDTO.reference),
    )
  }

  if (
    referenceType !== 'food' &&
    referenceType !== 'recipe' &&
    referenceType !== 'group'
  ) {
    throw new Error(
      'Item DTO reference has invalid type: ' +
        JSON.stringify(itemDTO.reference),
    )
  }

  if (referenceType === 'food') {
    if (
      itemDTO.reference.macros === null ||
      typeof itemDTO.reference.macros !== 'object'
    ) {
      throw new Error(
        'Food Item DTO reference macros is invalid: ' +
          JSON.stringify(itemDTO.reference.macros),
      )
    }

    return parseWithStack(itemSchema, {
      id: itemDTO.id,
      name: itemDTO.name,
      quantity: itemDTO.quantity,
      reference: {
        type: 'food',
        id: itemDTO.reference.id,
        macros: macrosToDomain(itemDTO.reference.macros),
      },
      __type: 'UnifiedItem',
    })
  }

  if (
    itemDTO.reference.children === null ||
    !Array.isArray(itemDTO.reference.children)
  ) {
    throw new Error(
      'Item DTO reference children is invalid: ' +
        JSON.stringify(itemDTO.reference.children),
    )
  }

  const children: Item[] = itemDTO.reference.children.map((childDTO: Json) =>
    itemToDomain(childDTO),
  )

  if (referenceType === 'recipe') {
    return parseWithStack(itemSchema, {
      id: itemDTO.id,
      name: itemDTO.name,
      quantity: itemDTO.quantity,
      reference: {
        type: 'recipe',
        id: itemDTO.reference.id,
        children,
      },
      __type: 'UnifiedItem' as const,
    })
  }

  return parseWithStack(itemSchema, {
    id: itemDTO.id,
    name: itemDTO.name,
    quantity: itemDTO.quantity,
    reference: {
      type: 'group',
      children,
    },
    __type: 'UnifiedItem' as const,
  })
}

function itemToDTO(item: Item): Json {
  if (isFoodItem(item)) {
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      reference: {
        type: 'food',
        id: item.reference.id,
        macros: macrosToDTO(item.reference.macros),
      },
    }
  }

  if (item.reference.type === 'recipe') {
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      reference: {
        type: 'recipe',
        id: item.reference.id,
        children: item.reference.children.map((child) => itemToDTO(child)),
      },
    }
  }

  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    reference: {
      type: 'group',
      children: item.reference.children.map((child) => itemToDTO(child)),
    },
  }
}

function recipeToInsertDTO(recipe: NewRecipe) {
  return {
    name: recipe.name,
    user_id: recipe.user_id,
    items: recipe.items.map((item) => itemToDTO(item)),
    prepared_multiplier: recipe.prepared_multiplier,
  }
}

function recipeToUpdateDTO(recipe: Recipe) {
  return {
    name: recipe.name,
    user_id: recipe.user_id,
    items: recipe.items.map((item) => itemToDTO(item)),
    prepared_multiplier: recipe.prepared_multiplier,
  }
}

type RecipeRow = Database['public']['Tables']['recipes']['Row']

function recipeToDomain(dto: RecipeRow): Recipe {
  if (!Array.isArray(dto.items)) {
    throw new Error('Recipe DTO items field is not an array')
  }

  if (dto.user_id === null) {
    throw new Error('Recipe DTO user_id cannot be null')
  }

  return parseWithStack(recipeSchema, {
    ...dto,
    items: dto.items.map((itemDTO) => itemToDomain(itemDTO)),
  })
}

export function createSupabaseRecipeGateway(): RecipeGateway {
  return {
    fetchUserRecipes,
    fetchRecipeById,
    fetchUserRecipeByName,
    insertRecipe,
    updateRecipe,
    deleteRecipe,
  }
}

const fetchUserRecipes = async (
  userId: User['uuid'],
): Promise<readonly Recipe[]> => {
  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_RECIPES)
      .select()
      .eq('user_id', userId)

    if (error !== null) {
      logging.error('Recipe fetch error:', error)
      return []
    }

    return data.map(recipeToDomain)
  } catch (err) {
    logging.error('Recipe fetch error:', err)
    return []
  }
}

const fetchRecipeById = async (id: Recipe['id']): Promise<Recipe | null> => {
  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_RECIPES)
      .select()
      .eq('id', id)
      .single()

    if (error !== null) {
      logging.error('Recipe fetch error:', error)
      return null
    }

    return recipeToDomain(data)
  } catch (err) {
    logging.error('Recipe fetch error:', err)
    return null
  }
}

const fetchUserRecipeByName = async (
  userId: User['uuid'],
  name: Recipe['name'],
): Promise<readonly Recipe[]> => {
  try {
    const normalizedName = removeDiacritics(name)
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_RECIPES)
      .select()
      .eq('user_id', userId)
      .ilike('name', `%${normalizedName}%`)

    if (error !== null) {
      logging.error('Recipe fetch error:', error)
      return []
    }

    return data.map(recipeToDomain)
  } catch (err) {
    logging.error('Recipe fetch error:', err)
    return []
  }
}

const insertRecipe = async (newRecipe: NewRecipe): Promise<Recipe | null> => {
  try {
    const createDTO = recipeToInsertDTO(newRecipe)
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_RECIPES)
      .insert(createDTO)
      .select()
      .single()

    if (error !== null) {
      logging.error('Recipe fetch error:', error)
      return null
    }

    return recipeToDomain(data)
  } catch (err) {
    logging.error('Recipe fetch error:', err)
    return null
  }
}

const updateRecipe = async (
  recipeId: Recipe['id'],
  newRecipe: Recipe,
): Promise<Recipe | null> => {
  try {
    const updateDTO = recipeToUpdateDTO(newRecipe)

    const { data, error } = await supabase
      .from(SUPABASE_TABLE_RECIPES)
      .update(updateDTO)
      .eq('id', recipeId)
      .select()
      .single()

    if (error !== null) {
      logging.error('Recipe fetch error:', error)
      return null
    }

    return recipeToDomain(data)
  } catch (err) {
    logging.error('Recipe fetch error:', err)
    return null
  }
}

const deleteRecipe = async (id: Recipe['id']): Promise<void> => {
  try {
    const { error } = await supabase
      .from(SUPABASE_TABLE_RECIPES)
      .delete()
      .eq('id', id)

    if (error !== null) {
      logging.error('Recipe fetch error:', error)
    }
  } catch (err) {
    logging.error('Recipe fetch error:', err)
  }
}
